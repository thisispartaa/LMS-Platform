import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChatMessage, ChatResponse } from "@/types";
import { useAuth } from "@/hooks/useAuth";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  // Clear chat history when user changes or logs out
  useEffect(() => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
    }
  }, [user?.id]);

  // Clear chat history from database on page refresh
  useEffect(() => {
    const clearChatOnRefresh = async () => {
      if (user) {
        try {
          await apiRequest("DELETE", "/api/chat/history");
        } catch (error) {
          console.error("Failed to clear chat history:", error);
        }
      }
    };

    clearChatOnRefresh();
  }, [user]);

  const { data: chatHistory, refetch } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/history"],
    enabled: isOpen,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await apiRequest("POST", "/api/chat", { message: messageText });
      return response.json() as Promise<ChatResponse>;
    },
    onSuccess: () => {
      setMessage("");
      refetch();
      // Auto-scroll to bottom after new message
      setTimeout(() => {
        const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollArea) {
          scrollArea.scrollTop = scrollArea.scrollHeight;
        }
      }, 200);
    },
  });

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
      
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-96 h-[500px] shadow-2xl border border-gray-200 flex flex-col">
          <CardHeader className="p-4 bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">AmazeBot</CardTitle>
                <p className="text-xs opacity-90">Training Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex flex-col min-h-0">
            <ScrollArea className="flex-1 h-full">
              <div className="p-4 space-y-4">
                {/* Welcome message */}
                {(!chatHistory || chatHistory.length === 0) && (
                  <div className="flex items-start space-x-2">
                    <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg px-3 py-2">
                        <p className="text-sm text-neutral-dark">
                          Hi! I'm AmazeBot, your training assistant. I can help you with questions about your training materials, explain quiz concepts, and guide your learning progress. What would you like to know?
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat history */}
                {chatHistory?.map((chat) => (
                  <div key={chat.id} className="space-y-3">
                    {/* User message */}
                    <div className="flex items-start space-x-2 justify-end">
                      <div className="flex-1 text-right max-w-[80%]">
                        <div className="bg-primary text-white rounded-lg px-3 py-2 inline-block text-left break-words">
                          <p className="text-sm whitespace-pre-wrap">{chat.message}</p>
                        </div>
                        <p className="text-xs text-neutral-medium mt-1">
                          {new Date(chat.createdAt!).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="w-7 h-7 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-success" />
                      </div>
                    </div>

                    {/* Bot response */}
                    {chat.response && (
                      <div className="flex items-start space-x-2">
                        <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 max-w-[80%]">
                          <div className="bg-gray-100 rounded-lg px-3 py-2">
                            <p className="text-sm text-neutral-dark whitespace-pre-wrap break-words">{chat.response}</p>
                          </div>
                          <p className="text-xs text-neutral-medium mt-1">
                            {new Date(chat.createdAt!).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading indicator */}
                {sendMessageMutation.isPending && (
                  <div className="flex items-start space-x-2">
                    <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 max-w-[80%]">
                      <div className="bg-gray-100 rounded-lg px-3 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-end space-x-2">
                <Input
                  type="text"
                  placeholder="Ask AmazeBot a question..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1 text-sm"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  size="sm"
                  className="bg-primary hover:bg-primary-dark flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}