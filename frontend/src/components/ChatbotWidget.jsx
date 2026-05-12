import { useState, useEffect, useRef } from 'react';
import { FiMessageCircle, FiSend, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            fetchHistory();
        }
    }, [isOpen]);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/chat/history');
            setMessages(res.data.history || []);
        } catch (error) {
            console.error("Failed to fetch chat history", error);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { sender: 'user', message: userMsg }]);
        setLoading(true);

        try {
            const res = await api.post('/chat/ask', { message: userMsg });
            setMessages(prev => [...prev, { sender: 'ai', message: res.data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'ai', message: "Xin lỗi, mình đang gặp chút trục trặc. Bạn thử lại sau nhé!" }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl text-3xl"
            >
                {isOpen ? <FiX /> : <FiMessageCircle />}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-20 right-0 w-[350px] md:w-[400px] h-[500px] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700"
                    >
                        <div className="bg-emerald-500 p-6 text-white">
                            <h3 className="text-xl font-bold">FoodAI Assistant</h3>
                            <p className="text-xs text-emerald-100 mt-1">Tư vấn dinh dưỡng 24/7</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                            {messages.length === 0 && (
                                <div className="text-center text-slate-400 mt-10">
                                    <p>Xin chào! Mình có thể giúp gì cho bạn hôm nay?</p>
                                </div>
                            )}
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                                        msg.sender === 'user' 
                                        ? 'bg-emerald-500 text-white rounded-tr-none' 
                                        : 'bg-slate-100 dark:bg-slate-700 dark:text-white rounded-tl-none'
                                    }`}>
                                        {msg.message}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl rounded-tl-none animate-pulse text-slate-400">
                                        Đang suy nghĩ...
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Nhập câu hỏi của bạn..."
                                className="flex-1 bg-slate-50 dark:bg-slate-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button type="submit" className="bg-emerald-500 text-white p-3 rounded-xl hover:bg-emerald-600 transition-all">
                                <FiSend />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
