
export type MessageContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "inline_data"; mimeType: string; data: string };

export type ChatMessage = {
  id: string | number;
  type: "user" | "ai";
  content: string | MessageContentPart[];
  date_time: string;
  conversation_name: string;
  attachments?: any[];
};

export type Conversation = {
  id: string;
  messages: ChatMessage[];
  last_message_time: string;
};

const backendUrl = `https://juno-4m9x.onrender.com/history/`;

export const fetchConversationsByPage = async (page = 1) => {
  try {
    const response = await fetch(`${backendUrl}?page=${page}&limit=20`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const fetchedRawChats = data.results as any[];
    const grouped: Record<string, ChatMessage[]> = {};

    fetchedRawChats.forEach((chat) => {
      const conversationName = chat.conversation_name;
      if (!grouped[conversationName]) grouped[conversationName] = [];

      grouped[conversationName].push({
        id: `user-${chat.id}`,
        type: "user",
        content: [{ type: "text", text: chat.prompt }],
        date_time: chat.date_time,
        conversation_name: conversationName,
      });
      if (chat.result) {
        grouped[conversationName].push({
          id: `ai-${chat.id}`,
          type: "ai",
          content: [{ type: "text", text: chat.result }],
          date_time: chat.date_time,
          conversation_name: conversationName,
        });
      }
    });

    const formattedConversations: Conversation[] = Object.keys(grouped).map(
      (convName) => {
        const sortedMessages = grouped[convName].sort(
          (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
        );
        return {
          id: convName,
          messages: sortedMessages,
          last_message_time: sortedMessages[sortedMessages.length - 1].date_time,
        };
      }
    );

    return {
      conversations: formattedConversations,
      totalPages: data.total_pages,
      currentPage: data.current_page,
    };

  } catch (error) {
    return { conversations: [], totalPages: 0, currentPage: 1 };
  }
};
export const fetchConversationById = async (
  conversation_name: string
): Promise<Conversation | null> => {
  try {
    const response = await fetch(`https://juno-4m9x.onrender.com/conversation/${encodeURIComponent(conversation_name)}/`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as Conversation;

  } catch (error) {
    return null;
  }
};