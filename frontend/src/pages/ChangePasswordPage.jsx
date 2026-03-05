import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../services/api';

export default function ChangePasswordPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (form.newPassword !== form.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (form.newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);
        try {
            await changePassword(form.oldPassword, form.newPassword);
            setSuccess(true);
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto py-12 px-4">
            <div className="bg-white shadow-xl rounded-[2rem] overflow-hidden border border-amber-100">
                <div className="bg-amber-600 px-8 py-6 text-white text-center">
                    <h2 className="text-2xl font-bold">Đổi mật khẩu</h2>
                    <p className="text-amber-100 text-sm mt-1">Cập nhật bảo mật tài khoản</p>
                </div>

                <div className="p-8">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Thành công!</h3>
                            <p className="text-gray-600 mt-2">Mật khẩu đã được thay đổi. Đang quay lại trang chủ...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-amber-900 uppercase ml-2 mb-1.5">Mật khẩu cũ</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        required
                                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                                        value={form.oldPassword}
                                        onChange={e => setForm({ ...form, oldPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(v => !v)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                        title={showPasswords ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    >
                                        {showPasswords ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-amber-900 uppercase ml-2 mb-1.5">Mật khẩu mới</label>
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                                    value={form.newPassword}
                                    onChange={e => setForm({ ...form, newPassword: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-amber-900 uppercase ml-2 mb-1.5">Xác nhận mật khẩu mới</label>
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                                    value={form.confirmPassword}
                                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center py-3"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        "Cập nhật"
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
