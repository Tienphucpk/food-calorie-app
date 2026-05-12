import { FiCheck, FiInfo } from 'react-icons/fi';
import api from '../services/api';
import { useState } from 'react';

export default function ResultCard({ data, onSaveComplete }) {
    const [saving, setSaving] = useState(false);
    const [mealType, setMealType] = useState('breakfast');

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/meals/save', {
                meal_type:        mealType,
                meal_date:        new Date().toISOString().split('T')[0],
                food_name:        data.food_name,
                calories:         data.calories,
                protein:          data.protein,
                carbs:            data.carbs,
                fat:              data.fat,
                ai_prediction_id: data.prediction_id || null,
            });
            onSaveComplete();
        } catch (error) {
            console.error(error);
            alert('Failed to save meal. Please try again.');
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="glass-panel rounded-3xl p-8 max-w-2xl mx-auto mt-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                <h3 className="text-2xl font-bold dark:text-white">Analysis Result</h3>
                <div className="bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
                    <FiCheck /> {data.confidence}% Match
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="flex-1">
                    <h4 className="text-slate-500 text-sm uppercase font-bold tracking-wider mb-2">Detected Food</h4>
                    <p className="text-3xl font-bold text-emerald-500 capitalize">{data.food_name}</p>
                    <p className="text-sm text-slate-400 mt-2 flex items-center gap-1"><FiInfo /> Model: {data.model_version}</p>
                </div>
                
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-center">
                        <p className="text-slate-500 text-sm font-semibold">Calories</p>
                        <p className="text-2xl font-bold dark:text-white">{data.calories} <span className="text-sm font-normal text-slate-400">kcal</span></p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-center">
                        <p className="text-slate-500 text-sm font-semibold">Protein</p>
                        <p className="text-xl font-bold dark:text-white">{data.protein}g</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-center">
                        <p className="text-slate-500 text-sm font-semibold">Carbs</p>
                        <p className="text-xl font-bold dark:text-white">{data.carbs}g</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-center">
                        <p className="text-slate-500 text-sm font-semibold">Fat</p>
                        <p className="text-xl font-bold dark:text-white">{data.fat}g</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <select 
                    value={mealType} 
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full md:w-1/3 px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                </select>

                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full md:w-2/3 bg-emerald-500 text-white py-4 rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Add to My Diary'}
                </button>
            </div>
        </div>
    );
}