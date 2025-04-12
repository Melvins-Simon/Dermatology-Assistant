import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Loader, Bot, User, Sparkles, ImageIcon, Send } from "lucide-react";
import { Globalstate } from "../context/Globalcontext";

const Chatbot = ({ sessionId, diagnosis }) => {
  const {
    setImage,
    screenSize: { WIDTH },
    viewRef,
  } = useContext(Globalstate);

  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your dermatology assistant. How can I help you today?",
      timestamp: new Date(),
      isBot: true,
      type: "text",
      suggestedActions: [],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);

  // Typing effect simulation
  const simulateTyping = (
    text,
    suggestedActions = [],
    type = "text",
    meta = {}
  ) => {
    setIsTyping(true);
    let displayedText = "";
    let i = 0;

    // temporary typing indicator message
    const tempId = Date.now() + 0.5;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: "thinking...",
        timestamp: new Date(),
        isBot: true,
        isTyping: true,
        type: "typing-indicator",
        ...meta,
      },
    ]);

    const typingInterval = setInterval(() => {
      if (i < text.length) {
        displayedText += text.charAt(i);
        setMessages((prev) => {
          const updated = [...prev];
          const typingMessage = updated.find((msg) => msg.id === tempId);
          if (typingMessage) {
            typingMessage.text = displayedText;
            typingMessage.type = type;
          }
          return updated;
        });
        i++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        //typing indicator with final message
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== tempId);
          return [
            ...filtered,
            {
              id: Date.now(),
              text,
              timestamp: new Date(),
              isBot: true,
              type,
              suggestedActions,
              ...meta,
            },
          ];
        });
      }
    }, 20); // typing speed
  };

  // Adding diagnosis to chat
  useEffect(() => {
    if (diagnosis) {
      const confidence =
        typeof diagnosis.confidence_score === "number"
          ? Math.round(diagnosis.confidence_score)
          : 0;

      const diagnosisMeta = {
        confidence: confidence,
        condition: diagnosis.predicted_disease || "Unknown condition",
      };

      simulateTyping(
        diagnosis.chatbot_response || "Here's your diagnosis analysis",
        diagnosis.suggested_actions || [],
        "diagnosis",
        diagnosisMeta
      );
    }
  }, [diagnosis]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputValue.trim() === "" || isLoading || isTyping) return;

    // Add user message
    const newUserMessage = {
      id: Date.now(),
      text: inputValue,
      timestamp: new Date(),
      isBot: false,
      type: "text",
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");

    try {
      setIsLoading(true);
      const thinkingMessageId = Date.now() + 0.3;
      setMessages((prev) => [
        ...prev,
        {
          id: thinkingMessageId,
          text: "thinking...",
          timestamp: new Date(),
          isBot: true,
          isTyping: true,
          type: "typing-indicator",
        },
      ]);
      // Call API
      const isDevelopment = import.meta.env.MODE === "development";
      const baseUrl = isDevelopment
        ? "http://localhost:8081/api/medical-assistant/"
        : "https://aid-dermatilogy-cbfbbad0cdhscbf9.spaincentral-01.azurewebsites.net/api/medical-assistant/";

      const response = await axios.post(
        `${baseUrl}`,
        {
          message: inputValue,
          session_id: sessionId,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      // Removing the thinking message before adding real response
      setMessages((prev) => prev.filter((msg) => msg.id !== thinkingMessageId));
      // Process API response with typing effect
      const { chat_response, suggested_actions } = response.data;
      simulateTyping(
        chat_response.chatbot_response,
        suggested_actions || [],
        "text"
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => {
        // Removing any typing indicators
        const filtered = prev.filter((msg) => msg.type !== "typing-indicator");
        return [
          ...filtered,
          {
            id: Date.now(),
            text: "Sorry, I encountered an error. Please try again.",
            timestamp: new Date(),
            isBot: true,
            type: "error",
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    let message = "";
    switch (action) {
      case "alternative_treatments":
        message = "What are some alternative treatments for my condition?";
        break;
      case "learn_more":
        message = "Can you tell me more about this condition?";
        break;
      case "ask_specialist":
        message = "When should I consult a specialist about this?";
        break;
      default:
        message = action;
    }
    setInputValue(message);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Format timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  const uploadRef = useRef(null);
  const HandleUpload = (e) => {
    uploadRef.current.click();
  };

  return (
    <div
      ref={viewRef}
      className={`flex flex-col  ${
        WIDTH <= 1164 ? "h-[49.5rem]" : "h-[87%]"
      } mt-4 w-full mx-auto rounded-xl shadow-[0_0_10px_1px_grey] overflow-hidden `}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
          <Bot size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Dermatology Assistant</h2>
          <p className="text-xs opacity-80">
            {isTyping ? "Typing..." : "Online"}
          </p>
        </div>
      </div>

      {/* Chat messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto bg-gray-50"
      >
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isBot ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`flex max-w-[85%] ${
                  !message.isBot ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                    message.isBot
                      ? "bg-blue-100 text-blue-600 mr-2"
                      : "bg-purple-100 text-purple-600 ml-2"
                  }`}
                >
                  {message.isBot ? <Bot size={16} /> : <User size={16} />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3 rounded-2xl ${
                    message.isBot
                      ? "bg-white text-gray-800 border border-gray-200"
                      : "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  } ${
                    message.type === "diagnosis"
                      ? "border-l-4 border-blue-500"
                      : ""
                  }`}
                >
                  {/* Diagnosis Header (only shows for diagnosis messages) */}
                  {message.type === "diagnosis" && (
                    <div className="flex items-center mb-2">
                      <Sparkles size={16} className="text-yellow-500 mr-1" />
                      <span className="text-xs font-semibold text-blue-600">
                        DIAGNOSIS: {message.condition} (
                        {Math.round(message.confidence)}% confidence)
                      </span>
                    </div>
                  )}
                  {/* Message Text */}
                  <p
                    className={`whitespace-pre-wrap ${
                      message.isTyping ? "blink-cursor" : ""
                    }`}
                  >
                    {message.text}
                    {message.isTyping && (
                      <span className="inline-block w-2 h-4 bg-gray-400 ml-1 blink"></span>
                    )}
                  </p>
                  {/* Timestamp */}
                  <p
                    className={`text-xs mt-1 ${
                      message.isBot ? "text-gray-500" : "text-white/70"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                  {/* Suggested Actions (shows for diagnosis or other bot messages) */}
                  {message.suggestedActions?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">
                        Quick actions:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {message.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickAction(action)}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                          >
                            {typeof action === "string"
                              ? action.replace(/_/g, " ")
                              : action}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Input area */}

      <form
        onSubmit={handleSubmit}
        className="p-2  border-t border-gray-200 w-full "
      >
        <div className="grid grid-cols-[.7fr_8fr_1fr] h-full gap-2">
          <div className="flex justify-center items-center">
            {" "}
            <button
              type="button"
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 "
              title="Upload image"
            >
              <ImageIcon
                className="cursor-pointer"
                onClick={HandleUpload}
                size={18}
              />
              <input
                ref={uploadRef}
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
                className="hidden"
                accept="image/*"
                capture="environment"
              />
            </button>
          </div>
          <div className="flex justify-center items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full w-full outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your question..."
              disabled={isLoading || isTyping}
            />
          </div>
          <div className="flex justify-center items-center">
            {" "}
            <button
              type="submit"
              disabled={isLoading || isTyping || inputValue.trim() === ""}
              className={`p-2 rounded-full ${
                isLoading || isTyping || inputValue.trim() === ""
                  ? "text-gray-400"
                  : "text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              }`}
            >
              {isLoading ? (
                <Loader className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Styles */}
      <style jsx>{`
        .blink {
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
        .blink-cursor {
          border-right: 2px solid transparent;
          animation: blink-cursor 0.7s infinite;
        }
        @keyframes blink-cursor {
          0%,
          100% {
            border-right-color: transparent;
          }
          50% {
            border-right-color: currentColor;
          }
        }
      `}</style>
    </div>
  );
};

export default Chatbot;
