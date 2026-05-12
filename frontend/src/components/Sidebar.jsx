import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiPieChart, FiList, FiUser, FiLogOut, FiMoon, FiSun } from 'react-icons/fi';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export default function Sidebar({ user, onLogout }) {
    const location = useLocation();
    const { isDark, toggleTheme } = useContext(ThemeContext);

    const menuItems = [
        { path: '/', name: 'Dashboard', icon: <FiHome /> },
        { path: '/analytics', name: 'Analytics', icon: <FiPieChart /> },
        { path: '/history', name: 'Meal History', icon: <FiList /> },
        { path: '/profile', name: 'Profile', icon: <FiUser /> },
    ];

    return (
        <aside className="w-20 lg:w-64 h-screen fixed left-0 top-0 glass-panel flex flex-col justify-between py-6 z-50 transition-all duration-300">
            <div>
                <div className="flex items-center justify-center lg:justify-start lg:px-8 mb-10 text-emerald-500 font-bold text-2xl">
                    <span className="hidden lg:block">Food<span className="text-slate-800 dark:text-white">AI</span></span>
                    <span className="block lg:hidden">F</span>
                </div>

                <nav className="flex flex-col gap-2 px-4">
                    {menuItems.map((item) => (
                        <Link 
                            key={item.path} 
                            to={item.path}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                                location.pathname === item.path 
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                            }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium hidden lg:block">{item.name}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="px-4 flex flex-col gap-4">
                <button 
                    onClick={toggleTheme}
                    className="flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
                >
                    <span className="text-xl">{isDark ? <FiSun /> : <FiMoon />}</span>
                    <span className="font-medium hidden lg:block">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <div className="hidden lg:flex flex-col bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl mb-4 items-center text-center">
                    <img src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} alt="Avatar" className="w-12 h-12 rounded-full mb-2 border-2 border-emerald-500 object-cover"/>
                    <p className="font-bold text-sm truncate w-full">{user?.full_name || 'User'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate w-full">{user?.email}</p>
                </div>

                <button 
                    onClick={onLogout}
                    className="flex items-center justify-center lg:justify-start gap-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold"
                >
                    <span className="text-xl"><FiLogOut /></span>
                    <span className="hidden lg:block">Logout</span>
                </button>
            </div>
        </aside>
    );
}