import { useState, useRef } from 'react';
import { FiUploadCloud, FiX, FiCamera } from 'react-icons/fi';
import api from '../services/api';

export default function UploadBox({ onAnalysisComplete }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const startCamera = async () => {
        setIsCameraOpen(true);
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError("Không thể truy cập Camera. Vui lòng cấp quyền!");
            setIsCameraOpen(false);
        }
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
                const capturedFile = new File([blob], "camera_photo.jpg", { type: "image/jpeg" });
                setFile(capturedFile);
                setPreview(URL.createObjectURL(blob));
                stopCamera();
            }, 'image/jpeg');
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject;
        const tracks = stream?.getTracks();
        tracks?.forEach(track => track.stop());
        setIsCameraOpen(false);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/meals/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onAnalysisComplete(res.data.data);
            setFile(null);
            setPreview(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi phân tích ảnh');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-8 rounded-3xl w-full max-w-2xl mx-auto transition-all">
            <h2 className="text-2xl font-bold dark:text-white mb-6 text-center">Scan Your Meal with AI</h2>
            
            {!preview && !isCameraOpen && (
                <div className="flex flex-col gap-4">
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all" onClick={() => document.getElementById('fileUpload').click()}>
                        <input type="file" id="fileUpload" className="hidden" accept="image/*" onChange={handleFileChange} />
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-4xl mb-4">
                            <FiUploadCloud />
                        </div>
                        <h3 className="font-bold text-lg dark:text-white mb-2">Kéo thả hoặc chọn ảnh</h3>
                        <p className="text-slate-500 text-sm">Hỗ trợ JPG, PNG, WEBP</p>
                    </div>
                    <button 
                        onClick={startCamera}
                        className="flex items-center justify-center gap-2 py-4 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-xl font-bold hover:bg-emerald-500 hover:text-white transition-all shadow-md"
                    >
                        <FiCamera /> Mở Camera chụp trực tiếp
                    </button>
                </div>
            )}

            {isCameraOpen && (
                <div className="flex flex-col items-center animate-fade-in">
                    <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-black mb-6 border-4 border-emerald-500">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
                        <button onClick={stopCamera} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg"><FiX /></button>
                    </div>
                    <button 
                        onClick={capturePhoto}
                        className="w-20 h-20 bg-white border-8 border-emerald-500 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
                    />
                    <p className="mt-4 text-slate-500 font-medium">Bấm nút để chụp ảnh</p>
                </div>
            )}

            {preview && (
                <div className="flex flex-col items-center animate-fade-in">
                    <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-lg mb-6 border-4 border-emerald-500">
                        <img src={preview} alt="Preview" className="w-full h-auto object-cover" />
                        <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-all"><FiX /></button>
                    </div>
                    {error && <p className="text-red-500 mb-4 font-medium">{error}</p>}
                    <button onClick={handleUpload} disabled={loading} className="w-full max-w-sm bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/30 flex justify-center items-center gap-2">
                        {loading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : 'Analyze with AI'}
                    </button>
                </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}