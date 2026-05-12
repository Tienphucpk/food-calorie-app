import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

export default function Profile() {
    const [profile, setProfile] = useState({ full_name: '', email: '', avatar_url: '' });
    const [goal, setGoal] = useState({ target_calories: 2000, target_weight: 70, current_weight: 75, goal_type: 'maintain' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [profRes, goalRes] = await Promise.all([
                    api.get('/auth/profile'),
                    api.get('/goals')
                ]);
                if (profRes.data.user) setProfile(profRes.data.user);
                if (goalRes.data.goal) setGoal(goalRes.data.goal);
            } catch(e) {
                console.error("Failed to load profile data", e);
            }
        };
        fetchAll();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put('/user/profile', { full_name: profile.full_name, avatar_url: profile.avatar_url });
            await api.post('/goals', goal);
            
            // update local user
            const localUser = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({ ...localUser, full_name: profile.full_name, avatar_url: profile.avatar_url }));
            
            alert('Saved successfully!');
        } catch (error) {
            alert('Error saving profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">User Profile & Goals</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Card */}
                <div className="glass-panel p-8 rounded-3xl">
                    <h2 className="text-xl font-bold dark:text-white mb-6">Personal Info</h2>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-sm font-bold text-slate-500 mb-2 block">Full Name</label>
                            <input type="text" value={profile.full_name || ''} onChange={(e) => setProfile({...profile, full_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-500 mb-2 block">Email</label>
                            <input type="email" value={profile.email || ''} disabled className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-500 mb-2 block">Avatar URL</label>
                            <input type="text" value={profile.avatar_url || ''} onChange={(e) => setProfile({...profile, avatar_url: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* Goals Card */}
                <div className="glass-panel p-8 rounded-3xl">
                    <h2 className="text-xl font-bold dark:text-white mb-6">Health Goals</h2>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-sm font-bold text-slate-500 mb-2 block">Daily Calorie Target (kcal)</label>
                            <input type="number" value={goal.target_calories || ''} onChange={(e) => setGoal({...goal, target_calories: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-bold text-slate-500 mb-2 block">Current Weight (kg)</label>
                                <input type="number" value={goal.current_weight || ''} onChange={(e) => setGoal({...goal, current_weight: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-bold text-slate-500 mb-2 block">Target Weight (kg)</label>
                                <input type="number" value={goal.target_weight || ''} onChange={(e) => setGoal({...goal, target_weight: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-500 mb-2 block">Goal Type</label>
                            <select value={goal.goal_type || 'maintain'} onChange={(e) => setGoal({...goal, goal_type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <option value="lose_weight">Lose Weight</option>
                                <option value="maintain">Maintain</option>
                                <option value="gain_muscle">Gain Muscle</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/30"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </Layout>
    );
}