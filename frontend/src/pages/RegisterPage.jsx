import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import logo from '../assets/logo-giao-hoi-phat-giao.webp';
import bgImage from '../assets/login-bg.png';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        templeName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);
        try {
            await register(formData.username, formData.password, formData.fullName, formData.templeName);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden font-sans">
            {/* Background Image with Ken Burns Effect */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center animate-pulse-slow"
                style={{ backgroundImage: `url(${bgImage})` }}
            />
            <div className="absolute inset-0 z-10 bg-gradient-to-br from-amber-900/40 via-black/50 to-amber-900/40 backdrop-blur-[2px]" />

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/10 blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/10 blur-[100px] animate-pulse" />
            </div>

            {/* Login Card */}
            <div className="relative z-30 w-full max-w-md animate-fade-in">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl p-8 sm:p-10 overflow-hidden relative group">
                    {/* Subtle light sweep effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    <div className="flex flex-col items-center mb-8 relative">
                        <div className="w-20 h-20 bg-amber-500/20 backdrop-blur-md p-4 rounded-full border border-amber-400/30 mb-4 shadow-inner animate-zoom-in">
                            <img src={logo} alt="Logo" className="w-full h-full object-contain filter drop-shadow-md" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent tracking-tight">
                            Tham gia Hệ thống
                        </h1>
                        <p className="text-amber-200/60 text-sm mt-1 font-medium">Khởi tạo quản lý cho tự viện của bạn</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5 group">
                                <label className="text-[11px] font-bold text-amber-200/80 uppercase tracking-widest pl-1">
                                    Tên đăng nhập
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                                    placeholder="admin_tu_vien"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-[11px] font-bold text-amber-200/80 uppercase tracking-widest pl-1">
                                    Họ tên người quản lý
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                                    placeholder="Thích Thông Lạc"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-[11px] font-bold text-amber-200/80 uppercase tracking-widest pl-1">
                                    Tên Tự Viện / Chùa
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                                    placeholder="Chùa Tây Trúc"
                                    value={formData.templeName}
                                    onChange={(e) => setFormData({ ...formData, templeName: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-[11px] font-bold text-amber-200/80 uppercase tracking-widest pl-1">
                                    Mật khẩu
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-[11px] font-bold text-amber-200/80 uppercase tracking-widest pl-1">
                                    Xác nhận mật khẩu
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-center gap-3 animate-shake">
                                <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs text-red-200 font-medium">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative overflow-hidden bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-900/40 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 group"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        Đăng ký ngay
                                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="mt-8 text-center space-y-2">
                        <p className="text-amber-100/40 text-xs font-medium uppercase tracking-widest">Đã có tài khoản?</p>
                        <Link
                            to="/login"
                            className="inline-block text-amber-200 hover:text-white font-bold text-sm transition-colors relative after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[2px] after:bg-amber-400 after:transition-all hover:after:w-full"
                        >
                            Quay lại Đăng nhập
                        </Link>
                    </div>
                </div>

                {/* Footer info */}
                <div className="mt-8 flex justify-center gap-6 text-amber-200/30 text-[10px] uppercase font-bold tracking-[0.2em]">
                    <span className="hover:text-amber-200/60 cursor-help transition-colors">Điều khoản</span>
                    <span className="w-1 h-1 rounded-full bg-amber-500/20 self-center" />
                    <span className="hover:text-amber-200/60 cursor-help transition-colors">Bảo mật</span>
                    <span className="w-1 h-1 rounded-full bg-amber-500/20 self-center" />
                    <span className="hover:text-amber-200/60 cursor-help transition-colors">Hỗ trợ</span>
                </div>
            </div>
        </div>
    );
}
