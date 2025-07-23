import { useState } from 'preact/hooks';
import ChatBot from './ChatBot'; // your existing chatbot component

export default function App() {
  const [open, setOpen] = useState(false);

  return (
  <>
    {/* Chat Icon Floating Button */}
    <div
      className="fixed bottom-5 right-5 bg-blue-600 text-white text-2xl w-14 h-14 flex items-center justify-center rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition"
      onClick={() => setOpen(!open)}
    >
      💬
    </div>

    {/* Conditionally show ChatBot */}
    {open && <ChatBot />}
  </>
);

}
