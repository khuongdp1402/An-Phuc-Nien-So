import { useState } from 'react';
import { login } from '../services/api';
import logo from '../assets/logo-giao-hoi-phat-giao.webp';
import bg from '../assets/login-bg.png';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            window.location.href = '/';
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center font-sans overflow-hidden">
            {/* Background Image with Blur/Zoom Animation */}
            <div className="absolute inset-0 z-0">
                <img
                    src={bg}
                    alt="Background"
                    className="w-full h-full object-cover scale-110 animate-pulse-slow"
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md px-6 animate-in fade-in zoom-in duration-500">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                    {/* Decorative Gradient Glow */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-400/30 transition-all duration-700"></div>
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl group-hover:bg-orange-400/30 transition-all duration-700"></div>

                    {/* Logo Section */}
                    <div className="flex flex-col items-center mb-8 relative z-10">
                        <div className="p-1 bg-white/20 rounded-full backdrop-blur-md mb-4 shadow-xl border border-white/30 transform hover:scale-105 transition-transform">
                            <img
                                src={logo}
                                alt="Giáo hội Phật giáo Việt Nam"
                                className="h-24 w-24 rounded-full object-contain"
                            />
                        </div>
                        <h1 className="text-3xl font-black text-white text-center tracking-tight drop-shadow-md">
                            An Phúc Niên Sổ
                        </h1>
                        <div className="h-1 w-12 bg-amber-400 rounded-full mt-2 shadow-lg shadow-amber-500/50"></div>
                        <p className="text-amber-100/80 text-sm mt-3 font-medium uppercase tracking-[0.2em]">
                            Hệ thống quản lý sớ lễ
                        </p>
                    </div>

                    <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 text-red-100 text-xs px-4 py-3 rounded-2xl animate-bounce">
                                <span className="font-bold flex items-center gap-2">
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                    </svg>
                                    Lỗi: {error}
                                </span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <label className="text-[10px] font-bold text-amber-200/60 uppercase ml-4 mb-1 block">Tên đăng nhập</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white/10 transition-all duration-300"
                                    placeholder="le-duy-khuong"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            <div className="relative group">
                                <label className="text-[10px] font-bold text-amber-200/60 uppercase ml-4 mb-1 block">Mật khẩu</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-12 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white/10 transition-all duration-300"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative group/btn overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 group-hover/btn:from-amber-500 group-hover/btn:to-orange-500 transition-all duration-500 rounded-2xl"></div>
                                <div className="relative py-4 px-6 flex items-center justify-center text-white font-bold tracking-wide uppercase text-sm">
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Đang xác thực...</span>
                                        </div>
                                    ) : (
                                        "Tiến vào hệ thống"
                                    )}
                                </div>
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center relative z-10 space-y-3">
                        <p className="text-white/40 text-[10px] uppercase tracking-widest font-medium">
                            Chương trình quản lý © 2026
                        </p>
                        <p className="text-white/50 text-[10px] leading-relaxed max-w-xs mx-auto">
                            Bản quyền thuộc về <strong className="text-amber-200/90">Kai</strong>. SĐT: 0372.803.085. Bản quyền sử dụng liên hệ hoặc email: <a href="mailto:khuongdp1402@gmail.com" className="text-amber-200/90 hover:text-amber-100 underline">khuongdp1402@gmail.com</a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Floating particles effect (optional) */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-amber-400 rounded-full blur-[1px] animate-[pulse_3s_infinite]"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 4 + 2}px`,
                            height: `${Math.random() * 4 + 2}px`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${Math.random() * 10 + 5}s`
                        }}
                    ></div>
                ))}
            </div>
        </div>
    );
}
