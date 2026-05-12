import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { FiActivity, FiTarget, FiZap, FiCamera, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Parse notes "P:12g C:36g F:10g" → { protein, carbs, fat }
const parseNotes = (notes) => {
    if (!notes) return { protein: '—', carbs: '—', fat: '—' };
    return {
        protein: notes.match(/P:([\d.]+)g/)?.[1] ?? '—',
        carbs:   notes.match(/C:([\d.]+)g/)?.[1] ?? '—',
        fat:     notes.match(/F:([\d.]+)g/)?.[1] ?? '—',
    };
};

const MEAL_EMOJI = { breakfast: '🥞', lunch: '🍱', dinner: '🥩', snack: '🍎' };

export default function Dashboard() {
    const [stats, setStats]           = useState({ calories: 0, target: 2000, burned: 0 });
    const [recentMeals, setRecentMeals] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [selectedMeal, setSelectedMeal] = useState(null); // Bữa ăn đang xem chi tiết

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const mealRes = await api.get('/meals/history');
                const meals = mealRes.data.history || [];
                setRecentMeals(meals.slice(0, 5));

                const today = new Date().toISOString().split('T')[0];
                const todayMeals = meals.filter(m => m.meal_date?.split('T')[0] === today);
                const totalCals = todayMeals.reduce((acc, m) => acc + Number(m.total_calories), 0);

                const goalRes = await api.get('/goals');
                const target = goalRes.data.goal ? Number(goalRes.data.goal.target_calories) : 2000;

                const exRes = await api.get('/exercise');
                const todayEx = (exRes.data.exercises || []).filter(e => e.exercise_date?.split('T')[0] === today);
                const totalBurned = todayEx.reduce((acc, ex) => acc + Number(ex.calories_burned), 0);

                setStats({ calories: totalCals, target, burned: totalBurned });
            } catch (error) {
                console.error('Error fetching dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return (
        <Layout>
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500" />
            </div>
        </Layout>
    );

    const percentage = Math.min(Math.round((stats.calories / stats.target) * 100), 100);

    return (
        <Layout>
            {/* ─── Header ─────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Welcome back! Here's your daily summary.</p>
                </div>
                <Link to="/history" className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition-all font-bold shadow-lg shadow-emerald-500/30">
                    <FiCamera className="text-xl" />
                    <span>Scan Food</span>
                </Link>
            </div>

            {/* ─── Stats Grid ─────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Consumed */}
                <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 dark:bg-slate-700">
                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="flex items-center gap-6 mt-2">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            <FiZap />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase">Consumed</p>
                            <h2 className="text-3xl font-bold dark:text-white">{stats.calories} <span className="text-base font-normal text-slate-400">/ {stats.target} kcal</span></h2>
                        </div>
                    </div>
                </div>

                {/* Target */}
                <div className="glass-panel rounded-3xl p-6 flex items-center gap-6 group">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        <FiTarget />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase">Target Goal</p>
                        <h2 className="text-3xl font-bold dark:text-white">{stats.target} <span className="text-base font-normal text-slate-400">kcal</span></h2>
                    </div>
                </div>

                {/* Burned */}
                <div className="glass-panel rounded-3xl p-6 flex items-center gap-6 group">
                    <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        <FiActivity />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase">Burned Today</p>
                        <h2 className="text-3xl font-bold dark:text-white">{stats.burned} <span className="text-base font-normal text-slate-400">kcal</span></h2>
                    </div>
                </div>
            </div>

            {/* ─── Recent Meals ────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold dark:text-white">Recent Meals</h2>
                    <Link to="/history" className="text-emerald-500 font-semibold hover:underline">View All</Link>
                </div>

                <div className="glass-panel rounded-3xl p-6">
                    {recentMeals.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="text-5xl mb-4">🍽️</div>
                            <h3 className="text-lg font-bold dark:text-white">No meals yet!</h3>
                            <p className="text-slate-500 dark:text-slate-400">Click "Scan Food" to log your first meal with AI.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {recentMeals.map((meal, idx) => {
                                const isSelected = selectedMeal?.meal_id === meal.meal_id;
                                const { protein, carbs, fat } = parseNotes(meal.notes);

                                return (
                                    <div key={idx}>
                                        {/* ── Row ── */}
                                        <button
                                            onClick={() => setSelectedMeal(isSelected ? null : meal)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left
                                                ${isSelected
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400'
                                                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center text-xl flex-shrink-0">
                                                    {MEAL_EMOJI[meal.meal_type] ?? '🍽️'}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold dark:text-white capitalize">{meal.meal_type}</h4>
                                                    <p className="text-sm text-slate-500 truncate">
                                                        {meal.food_name || 'Custom Meal'}
                                                        {meal.confidence && <span className="ml-2 text-emerald-500 text-xs">AI {meal.confidence}%</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <div className="text-right">
                                                    <h4 className="font-bold text-emerald-500">+{meal.total_calories} kcal</h4>
                                                    <p className="text-sm text-slate-500">{new Date(meal.meal_date).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                                <span className={`text-slate-400 text-xs transition-transform ${isSelected ? 'rotate-180' : ''}`}>▼</span>
                                            </div>
                                        </button>

                                        {/* ── Detail Panel ── */}
                                        {isSelected && (
                                            <div className="mx-2 mb-3 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-lg">
                                                {/* Header */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h3 className="font-bold text-base dark:text-white">
                                                            🔍 {meal.food_name || meal.meal_type}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            {new Date(meal.meal_date).toLocaleDateString('vi-VN')}
                                                            {meal.created_at && ` · ${new Date(meal.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                                                            {meal.model_version && ` · 🤖 ${meal.model_version}`}
                                                        </p>
                                                    </div>
                                                    {meal.confidence && (
                                                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full">
                                                            {meal.confidence}% match
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Nutrition Grid */}
                                                <div className="grid grid-cols-4 gap-2">
                                                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl text-center">
                                                        <p className="text-xs font-bold text-emerald-500 uppercase mb-0.5">Cal</p>
                                                        <p className="text-lg font-bold dark:text-white">{meal.total_calories}</p>
                                                        <p className="text-xs text-slate-400">kcal</p>
                                                    </div>
                                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl text-center">
                                                        <p className="text-xs font-bold text-blue-500 uppercase mb-0.5">Pro</p>
                                                        <p className="text-lg font-bold dark:text-white">{protein}</p>
                                                        <p className="text-xs text-slate-400">g</p>
                                                    </div>
                                                    <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-xl text-center">
                                                        <p className="text-xs font-bold text-orange-500 uppercase mb-0.5">Carb</p>
                                                        <p className="text-lg font-bold dark:text-white">{carbs}</p>
                                                        <p className="text-xs text-slate-400">g</p>
                                                    </div>
                                                    <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl text-center">
                                                        <p className="text-xs font-bold text-red-500 uppercase mb-0.5">Fat</p>
                                                        <p className="text-lg font-bold dark:text-white">{fat}</p>
                                                        <p className="text-xs text-slate-400">g</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}