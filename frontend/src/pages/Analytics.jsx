import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function Analytics() {
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Fetch Meals
                const mealRes = await api.get('/meals/history');
                const meals = mealRes.data.history || [];
                
                // Fetch Exercises
                const exRes = await api.get('/exercise');
                const exercises = exRes.data.exercises || [];

                // Group by date for the last 7 days
                const last7Days = Array.from({length: 7}, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                }).reverse();

                const chartData = last7Days.map(date => {
                    const dayMeals = meals.filter(m => m.meal_date.split('T')[0] === date);
                    const dayEx = exercises.filter(e => e.exercise_date.split('T')[0] === date);
                    
                    const caloriesIn = dayMeals.reduce((acc, m) => acc + Number(m.total_calories), 0);
                    const caloriesOut = dayEx.reduce((acc, e) => acc + Number(e.calories_burned), 0);
                    
                    return {
                        name: date.slice(5), // MM-DD
                        CaloriesIn: caloriesIn,
                        CaloriesOut: caloriesOut,
                        NetCalories: caloriesIn - caloriesOut
                    };
                });

                setHistoryData(chartData);
            } catch (error) {
                console.error("Error fetching analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <Layout><div className="flex h-[80vh] items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500"></div></div></Layout>;

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Analytics Overview</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Track your calorie intake vs output over the last 7 days.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                <div className="glass-panel p-6 rounded-3xl h-96">
                    <h2 className="text-xl font-bold dark:text-white mb-6">Net Calories Trend</h2>
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={historyData}>
                            <defs>
                                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="NetCalories" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-panel p-6 rounded-3xl h-96">
                    <h2 className="text-xl font-bold dark:text-white mb-6">Intake vs Burned</h2>
                    <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            <Legend />
                            <Bar dataKey="CaloriesIn" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="CaloriesOut" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Layout>
    );
}