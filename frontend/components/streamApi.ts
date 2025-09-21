import { Message } from "../app/(tabs)/home"; 
const API_URL = "https://juno-4m9x.onrender.com/interface_stream/";

export const streamResponse = async (
    messages: Message[],
    conversationName: string,
    onDelta: (chunk: string) => void,
    onToolCall: (name: string, args: any) => void,
    onComplete: () => void,
    onError: (error: string) => void
) => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: messages.map(msg => ({
                    role: msg.type === "user" ? "user" : "assistant",
                    content: msg.content,
                })),
                conversation_name: conversationName,
            }),
        });

        if (!response.body) {
            throw new Error("Response body is null");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; 

            for (const line of lines) {
                if (line.startsWith("data:")) {
                    const jsonStr = line.substring(5).trim();
                    if (jsonStr) {
                        const data = JSON.parse(jsonStr);

                        if (data.type === 'delta' && data.text) {
                            onDelta(data.text);
                        } else if (data.type === 'tool_call') {
                            onToolCall(data.name, data.args);
                        } else if (data.type === 'error') {
                            onError(data.message);
                        } else if (data.type === 'done') {
                            onComplete();
                            return;
                        }
                    }
                }
            }
        }
        onComplete();

    } catch (err) {
        onError(err instanceof Error ? err.message : "An unknown error occurred during streaming.");
    }
};