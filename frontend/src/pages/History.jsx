import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import UploadBox from '../components/UploadBox';
import ResultCard from '../components/ResultCard';
import api from '../services/api';

// Parse notes "P:12g C:36g F:10g" → { protein, carbs, fat }
const parseNotes = (notes) => {
    if (!notes) return { protein: '—', carbs: '—', fat: '—' };
    const p = notes.match(/P:([\d.]+)g/)?.[1] ?? '—';
    const c = notes.match(/C:([\d.]+)g/)?.[1] ?? '—';
    const f = notes.match(/F:([\d.]+)g/)?.[1] ?? '—';
    return { protein: p, carbs: c, fat: f };
};

const MEAL_EMOJI = { breakfast: '🥞', lunch: '🍱', dinner: '🥩', snack: '🍎' };

export default function History() {
    const [aiResult, setAiResult]       = useState(null);
    const [history, setHistory]         = useState([]);
    const [loading, setLoading]         = useState(true);
    const [selectedMeal, setSelectedMeal] = useState(null); // Chi tiết bữa ăn đang xem

    const fetchHistory = async () => {
        try {
            const res = await api.get('/meals/history');
            setHistory(res.data.history || []);
        } catch (error) {
            console.error('Error fetching history', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, []);

    const handleSaveComplete = () => {
        setAiResult(null);
        fetchHistory();
    };

    return (
        <Layout>
            {/* ─── Header ─────────────────────────────── */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Meal History & Scanner</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Log meals using AI or view past records.</p>
            </div>

            {/* ─── Upload / Result ─────────────────────── */}
            <div className="mb-12">
                {!aiResult ? (
                    <UploadBox onAnalysisComplete={(data) => setAiResult(data)} />
                ) : (
                    <div>
                        <button
                            onClick={() => setAiResult(null)}
                            className="mb-4 text-emerald-500 font-bold hover:underline"
                        >
                            ← Scan another image
                        </button>
                        <ResultCard data={aiResult} onSaveComplete={handleSaveComplete} />
                    </div>
                )}
            </div>

            {/* ─── History List ────────────────────────── */}
            <div className="glass-panel p-8 rounded-3xl">
                <h2 className="text-xl font-bold dark:text-white mb-6">Past Meals</h2>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                    </div>
                ) : history.length === 0 ? (
                    <p className="text-center text-slate-500 py-10">No meals found. Start scanning!</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {history.map((meal, idx) => {
                            const { protein, carbs, fat } = parseNotes(meal.notes);
                            const isSelected = selectedMeal?.meal_id === meal.meal_id;

                            return (
                                <div key={idx}>
                                    {/* ── Row ── */}
                                    <button
                                        onClick={() => setSelectedMeal(isSelected ? null : meal)}
                                        className={`w-full text-left flex flex-col md:flex-row items-center justify-between p-4 rounded-2xl border transition-all
                                            ${isSelected
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-lg shadow-emerald-500/10'
                                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-emerald-400'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4 w-full md:w-auto mb-2 md:mb-0">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center text-2xl flex-shrink-0">
                                                {MEAL_EMOJI[meal.meal_type] ?? '🍽️'}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-base dark:text-white capitalize truncate">
                                                    {meal.meal_type}
                                                    {meal.food_name && <span className="ml-2 text-emerald-500">— {meal.food_name}</span>}
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {new Date(meal.meal_date).toLocaleDateString('vi-VN')}
                                                    {meal.confidence && <span className="ml-2 text-emerald-500">AI {meal.confidence}%</span>}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-xs text-slate-400 font-bold uppercase">Calories</p>
                                                <p className="text-xl font-bold text-emerald-500">{meal.total_calories}</p>
                                            </div>
                                            <div className={`text-slate-400 transition-transform ${isSelected ? 'rotate-180' : ''}`}>▼</div>
                                        </div>
                                    </button>

                                    {/* ── Detail Panel ── */}
                                    {isSelected && (
                                        <div className="mt-1 mb-2 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-200 dark:border-emerald-800 animate-fade-in-up shadow-lg">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold dark:text-white">
                                                    🔍 Chi tiết: <span className="text-emerald-500">{meal.food_name || meal.meal_type}</span>
                                                </h3>
                                                {meal.confidence && (
                                                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-sm font-bold px-3 py-1 rounded-full">
                                                        AI Match: {meal.confidence}%
                                                    </span>
                                                )}
                                            </div>

                                            {/* Nutrition Grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl text-center">
                                                    <p className="text-xs font-bold uppercase text-emerald-500 mb-1">Calories</p>
                                                    <p className="text-xl font-bold dark:text-white">{meal.total_calories}<span className="text-sm font-normal text-slate-400 ml-1">kcal</span></p>
                                                </div>
                                                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl text-center">
                                                    <p className="text-xs font-bold uppercase text-blue-500 mb-1">Protein</p>
                                                    <p className="text-xl font-bold dark:text-white">{protein}<span className="text-sm font-normal text-slate-400 ml-1">g</span></p>
                                                </div>
                                                <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl text-center">
                                                    <p className="text-xs font-bold uppercase text-orange-500 mb-1">Carbs</p>
                                                    <p className="text-xl font-bold dark:text-white">{carbs}<span className="text-sm font-normal text-slate-400 ml-1">g</span></p>
                                                </div>
                                                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl text-center">
                                                    <p className="text-xs font-bold uppercase text-red-500 mb-1">Fat</p>
                                                    <p className="text-xl font-bold dark:text-white">{fat}<span className="text-sm font-normal text-slate-400 ml-1">g</span></p>
                                                </div>
                                            </div>

                                            {/* Meta info */}
                                            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                                                <span>📅 {new Date(meal.meal_date).toLocaleDateString('vi-VN')}</span>
                                                <span>🕒 {new Date(meal.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                {meal.model_version && <span>🤖 {meal.model_version}</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
}