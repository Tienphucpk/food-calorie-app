import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import ChatbotWidget from './ChatbotWidget';

export default function Layout({ children }) {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || null;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <Sidebar user={user} onLogout={handleLogout} />
            <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 overflow-y-auto w-full transition-all duration-300">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
            <ChatbotWidget />
        </div>
    );
}