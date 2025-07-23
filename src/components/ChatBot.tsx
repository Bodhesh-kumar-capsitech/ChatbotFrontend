import { useEffect, useRef, useState } from 'preact/hooks';
import type { ChatMessage, Option } from '../logic/type';



export default function ChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const [optionMap, setOptionMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const initChat = async () => {
      const existingSession = localStorage.getItem('chatbot_session');

      if (existingSession) {
        setSessionId(existingSession);
       // await loadHistory(existingSession);
      } else {
        // Create a new session
        try {
          const res = await fetch('http://localhost:5096/api/chat/session', {
            method: 'POST',
          });
          const data = await res.json();
          const sid = data.sessionId;

          setSessionId(sid);
          //localStorage.setItem('chatbot_session', sid);

          // Send initial query
          await sendMessage('How do I apply?', true);
        } catch (err) {
          console.error('Session creation failed:', err);
        }
      }
    };

    initChat();
  }, []);





  // const loadHistory = async (session: string) => {
  //   try {
  //     const res = await fetch('http://localhost:5096/api/chat/history', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ sessionId: session }),
  //     });

  //     const data = await res.json();

  //     if (data.status && data.result.conversation) {
  //       const loaded: ChatMessage[] = data.result.conversation.map((item: any) => ({
  //         sender: item.sender.toLowerCase(),
  //         text: item.text,
  //       }));

  //       setMessages(loaded);

  //       // Restore options
  //       const map = new Map();
  //       if (data.result.options) {
  //         data.result.options.forEach((opt: Option) => {
  //           map.set(opt.label, opt.query.query);
  //         });
  //       }
  //       setOptionMap(map);

  //       // Auto scroll
  //       setTimeout(() => {
  //         chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  //       }, 100);
  //     }
  //   } catch (err) {
  //     console.error('Failed to load history:', err);
  //   }
  // };




  const sendMessage = async (query: string, isInitial = false) => {
    if (!query.trim()) return;

    const newSession = sessionId || '';
    if (!isInitial) {
      setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    }

    try {
      const res = await fetch(`http://localhost:5096/api/chat/reply?query=${encodeURIComponent(query)}&sessionId=${newSession}`);
      const data = await res.json();

      if (data.status) {
        const sid = data.result.sessionId;
        if (!sessionId) {
          setSessionId(sid);
          //localStorage.setItem('chatbot_session', sid);
        }

        const botMsg: ChatMessage = {
          sender: 'bot',
          text: data.result.reply,
        };

        setMessages((prev) => [...prev, botMsg]);

        const options = data.result.options as Option[];
        if (options?.length) {
          const map = new Map(optionMap); // clone previous map
          options.forEach((opt) => {
            map.set(opt.label, opt.query.query);
            setMessages((prev) => [
              ...prev,
              {
                sender: 'bot',
                text: opt.label,
              },
            ]);
          });
          setOptionMap(map);
        }
      } else {
        setMessages((prev) => [...prev, { sender: 'bot', text: data.result?.reply || 'Unknown error' }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Network error.' }]);
    } finally {
      if (!isInitial) setInput('');
      setTimeout(() => chatRef.current?.scrollTo(0, chatRef.current.scrollHeight), 100);
    }
  };

//fetching
  const handleOptionClick = (label: string) => {
    const actualQuery = optionMap.get(label);
    if (actualQuery) {
      sendMessage(actualQuery); // ✅ Use the real query
    } else {
      sendMessage(label); // fallback
    }
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
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[75%] px-4 py-2 rounded-xl text-sm break-words cursor-pointer transition-all duration-150
        ${msg.sender === 'user'
                ? 'bg-blue-100 text-blue-900 self-end ml-auto'
                : 'bg-gray-200 text-gray-800 self-start mr-auto'
              }`}
            onClick={() => {
              if (optionMap.has(msg.text)) {
                handleOptionClick(msg.text);
              }
            }}
          >
            {msg.text}
          </div>
        ))}
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
