import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Text,
  ScrollView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import SSE from 'react-native-sse';
import { ChatMessage, MessageContentPart } from "./historyApi";

interface PrompterProps {
  onNewMessage: (message: ChatMessage) => void;
  conversationName: string;
  messages: ChatMessage[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setToolStatus: (status: string | null) => void;
}

export default function Prompter({
  onNewMessage,
  conversationName,
  messages,
  isLoading,
  setIsLoading,
  setToolStatus,
}: PrompterProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      multiple: true,
    });

    if (result.canceled || !result.assets) return;
    setAttachments((prev) => [...prev, ...result.assets]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const userMessageContent: MessageContentPart[] = [];
    if (input.trim()) {
      userMessageContent.push({ type: "text", text: input.trim() });
    }

    const attachmentPartsForUi = attachments
      .map((file) => {
        if (file.mimeType?.startsWith("image/")) {
          return { type: "image_url", image_url: { url: file.uri } };
        }
        return null;
      })
      .filter(Boolean) as MessageContentPart[];

    const fullUserContent = [...userMessageContent, ...attachmentPartsForUi];

    const userMessage: ChatMessage = {
      id: uuidv4(),
      type: "user",
      content: fullUserContent,
      attachments: attachments,
      date_time: new Date().toISOString(),
      conversation_name: conversationName || "new",
    };

    onNewMessage(userMessage);
    setInput("");
    setAttachments([]);
    setIsLoading(true);
    setToolStatus(null);

    const aiResponse: ChatMessage = {
      id: uuidv4(),
      type: "ai",
      content: [{ type: 'text', text: '' }],
      date_time: new Date().toISOString(),
      conversation_name: conversationName || "new",
    };
    onNewMessage(aiResponse);

    try {
      const attachmentPromises = attachments.map(async (file) => {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(blob);
        });
        if (file.mimeType?.startsWith("image/")) {
          return { type: "image_url", image_url: { url: dataUrl } };
        } else {
          return { type: "file_url", file_url: { url: dataUrl, name: file.name } };
        }
      });

      const resolvedAttachments = await Promise.all(attachmentPromises);
      const userMessageContentForApi = [...userMessageContent, ...resolvedAttachments];

      const historyForAPI = messages.map((msg) => ({
        role: msg.type === "ai" ? "assistant" : "user",
        content: msg.content,
      }));

      const payload = {
        messages: [
          ...historyForAPI,
          { role: "user", content: userMessageContentForApi },
        ],
        conversation_name: conversationName,
      };

      let fullResponseText = "";

      const sse = new SSE("http://192.168.0.114:8000/interface_stream/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      sse.addEventListener('message', (event) => {
        if (event.data) {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'tool_call') {
              setIsLoading(false);
              setToolStatus(`🔎 Searching for: ${data.args.query}...`);
            }
            else if (data.type === 'delta' && data.text) {
              setIsLoading(false);
              setToolStatus(null);
              fullResponseText += data.text;
              onNewMessage({
                ...aiResponse,
                content: [{ type: 'text', text: fullResponseText }]
              });
            }
            else if (data.type === 'error') {
              throw new Error(data.message);
            }
            else if (data.type === 'done') {
              sse.close();
              setIsLoading(false);
              setToolStatus(null);
            }
          } catch (e) {
            setIsLoading(false);
            setToolStatus(null);
          }
        }
      });

      sse.addEventListener('error', (event: any) => {
        const errorMessage = event.message || "An unexpected error occurred with the stream.";
        onNewMessage({
          ...aiResponse,
          content: [{ type: 'text', text: `Sorry, an error occurred: ${errorMessage}` }]
        });
        setIsLoading(false);
        setToolStatus(null);
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      onNewMessage({
        ...aiResponse,
        content: [{ type: 'text', text: `Sorry, an error occurred: ${message}` }]
      });
      setIsLoading(false);
      setToolStatus(null);
    }
  };

  const renderAttachmentPreview = (attachment: DocumentPicker.DocumentPickerAsset, index: number) => {
    // ... (rest of the function is unchanged)
    const isImage = attachment.mimeType?.startsWith("image/");
    return (
      <View key={index} style={styles.attachmentPreview}>
        <TouchableOpacity style={styles.removeButton} onPress={() => removeAttachment(index)}>
          <Ionicons name="close" size={16} color="white" />
        </TouchableOpacity>
        {isImage ? (
          <Image source={{ uri: attachment.uri }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <View style={styles.filePreview}>
            <Ionicons name="document" size={20} color="white" />
            <Text style={styles.fileName} numberOfLines={1}>{attachment.name}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TouchableOpacity onPress={pickFile} style={styles.iconButton}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
        {attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.attachmentsScroll}
              contentContainerStyle={styles.attachmentsScrollContent}
            >
              {attachments.map((attachment, index) =>
                renderAttachmentPreview(attachment, index)
              )}
            </ScrollView>
          </View>
        )}
        <TextInput
          style={styles.input}
          placeholder="Ask your query"
          placeholderTextColor="#d1d1d1"
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={[styles.iconButton, isLoading && { backgroundColor: "gray" }]}
          disabled={isLoading || (!input.trim() && attachments.length === 0)}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons name="arrow-forward" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- STYLES (NO CHANGES) ---
const styles = StyleSheet.create({
  container: { width: '85%' },
  attachmentsContainer: { justifyContent: 'center' },
  attachmentsScroll: { maxHeight: 40 },
  attachmentsScrollContent: { paddingHorizontal: 8 },
  attachmentPreview: { position: 'relative', marginRight: 8, borderRadius: 8 },
  previewImage: { width: 40, height: 40, borderRadius: 8 },
  filePreview: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', padding: 8 },
  fileName: { color: 'white', fontSize: 10, textAlign: 'center', marginTop: 4 },
  removeButton: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 60, paddingVertical: 8, borderRadius: 30, borderWidth: 2, backgroundColor: '#2c2c2c7c', borderColor: 'rgba(0, 0, 0, 0.5)', paddingHorizontal: 8 },
  input: { flex: 1, color: 'white', fontSize: 16, paddingHorizontal: 10, maxHeight: 120 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(128, 128, 128, 0.5)', justifyContent: 'center', alignItems: 'center' },
});