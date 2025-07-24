import { useEffect, useRef, useState } from 'preact/hooks';
import type { ChatMessage, Option } from '../logic/type';

export default function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const [optionMap, setOptionMap] = useState<Map<string, string>>(new Map());
  const [historyStack, setHistoryStack] = useState<
    { messages: ChatMessage[]; optionMap: Map<string, string> }[]
  >([]);
  const [clickedOptions, setClickedOptions] = useState<Set<string>>(new Set());



  useEffect(() => {
    const startChat = async () => {
      try {
        const res = await fetch("http://localhost:5096/api/chat/start");
        const data = await res.json();

        if (data.status) {
          setMessages([{
            text: data.result.reply,
            sender: "bot",
            isInitial: String
          }]);

          const defaultUserMessages = data.result.defaultQueries.map((query: string) => ({
            text: query,
            sender: "user",
          }));
          setMessages(prev => [...prev, ...defaultUserMessages]);
        }
      } catch (err) {
        console.error('Failed to start chat:', err);
      }
    };

    startChat();
  }, []);

  const sendMessage = async (query: string, isInitial = false) => {
    if (!isInitial) {
      setHistoryStack(prev => [
        ...prev,
        { messages: [...messages], optionMap: new Map(optionMap) }
      ]);
    }

    if (!query.trim()) return;

    const newSession = sessionId || '';
    try {
      const res = await fetch(
        `http://localhost:5096/api/chat/reply?query=${encodeURIComponent(query)}&sessionId=${newSession}`
      );
      const data = await res.json();

      if (data.status) {
        const sid = data.result.sessionId;
        if (!sessionId) {
          setSessionId(sid);
          localStorage.setItem('chatbot_session', sid);
        }

        const botMsg: ChatMessage = {
          sender: 'bot',
          text: data.result.reply,
          isInitial: undefined
        };

        setMessages((prev) => [...prev, botMsg]);

        const options = data.result.options as Option[];
        if (options?.length) {
          const map = new Map(optionMap);
          const optionMessages: ChatMessage[] = [];

          options.forEach((opt) => {
            map.set(opt.label, opt.query.query);
            optionMessages.push({
              sender: 'user',      
              text: opt.label,
              isInitial: true      
            });
          });

          setOptionMap(map);
          setMessages((prev) => [...prev, ...optionMessages]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: data.result?.reply || 'Unknown error', isInitial: false },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Network error.', isInitial: false }]);
    } finally {
      if (!isInitial) setInput('');
      scrollToBottom();
    }

  };


  const scrollToBottom = () => {
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleOptionClick = (label: string) => {

    const actualQuery = optionMap.get(label);


    if (actualQuery) {
      setHistoryStack((prev) => [
        ...prev,
        { messages: [...messages], optionMap: new Map(optionMap) },
      ]);

      const botQueryMsg: ChatMessage = {
        sender: 'bot',      
        text: actualQuery, 
        isInitial: undefined
      };

      setMessages((prev) => [...prev, botQueryMsg]);

      sendMessage(actualQuery);
    } else {
      sendMessage(label);
    }
  };

  const handleBack = () => {
    if (historyStack.length === 0) return;

    const last = historyStack[historyStack.length - 1];
    setMessages(last.messages);
    setOptionMap(last.optionMap);
    setHistoryStack(prev => prev.slice(0, -1));
    scrollToBottom();
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-24 right-5 w-80 h-6/12 bg-white shadow-2xl rounded-xl flex flex-col overflow-hidden border border-gray-200 z-50">
      {/* Header */}
      <div className="bg-blue-600 text-white text-lg font-semibold px-4 py-2">
        🤖 ChatBot
      </div>

      {/* Chat Window */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50 scroll-smooth"
        ref={chatRef}
      >
        {messages.map((msg, idx) => {
          const isOption = msg.sender === 'bot' && optionMap.has(msg.text);

          return (
            <div
              key={idx}
              className={`max-w-[75%] px-4 py-2 rounded-xl text-sm break-words transition-all duration-150
        ${msg.sender === 'user'
                  ? 'bg-blue-100 text-blue-900 self-end ml-auto hover:bg-gray-300 cursor-pointer'
                  : `bg-gray-200 text-gray-800 self-start mr-auto}`
                }`}
              onClick={() => {
                if (isOption && !clickedOptions.has(msg.text)) {
                  setClickedOptions(prev => new Set(prev).add(msg.text));

                  const actualQuery = optionMap.get(msg.text);
                  if (actualQuery) {
                    sendMessage(actualQuery);
                  }
                } else if (
                  msg.sender === 'user' &&
                  msg.isInitial &&
                  !clickedOptions.has(msg.text)
                ) {
                  setClickedOptions(prev => new Set(prev).add(msg.text));
                  handleOptionClick(msg.text);
                }
              }}

            >
              {msg.text}
            </div>
          );
        })}



        {historyStack.length > 0 && (
          <button
            onClick={handleBack}
            className="mt-2 text-sm text-blue-600 hover:underline self-start"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Input Form */}
      <form
        className="flex items-center border-t border-gray-200 bg-white px-2 py-2 gap-2"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-700 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
