import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAccount, createAccount, updateAccount, getTemples } from '../services/api';

export default function AccountFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState({
        username: '',
        password: '',
        fullName: '',
        role: 'Admin',
        templeId: '',
    });
    const [temples, setTemples] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        try {
            const templesData = await getTemples();
            setTemples(templesData);

            if (isEdit) {
                const data = await getAccount(id);
                setForm({
                    username: data.username || '',
                    password: '', // Hidden in edit
                    fullName: data.fullName || '',
                    role: data.role || 'Admin',
                    templeId: data.templeId || '',
                });
            }
        } catch (err) {
            alert('Lỗi tải dữ liệu: ' + err.message);
            navigate('/accounts');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const payload = { ...form };
            if (isEdit && !payload.password) {
                delete payload.password; // Don't send empty password to backend during update
            }
            if (payload.templeId === '') payload.templeId = null;

            if (isEdit) {
                await updateAccount(id, payload);
            } else {
                await createAccount(payload);
            }
            navigate('/accounts');
        } catch (err) {
            alert('Lỗi lưu tài khoản: ' + err.message);
        }
    }

    if (loading) return <div>Đang tải...</div>;

    return (
        <div className="max-w-xl mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-amber-900">
                    {isEdit ? 'Sửa thông tin tài khoản' : 'Thêm người dùng mới'}
                </h1>
                <button
                    onClick={() => navigate('/accounts')}
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                    &larr; Quay lại
                </button>
            </div>

            <div className="bg-white shadow rounded-lg p-6 border border-amber-100">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                        <input
                            type="text"
                            required
                            disabled={isEdit}
                            className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {isEdit ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}
                        </label>
                        <input
                            type="password"
                            required={!isEdit}
                            className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={form.fullName}
                            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                            <select
                                className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                            >
                                <option value="Admin">Admin</option>
                                <option value="SuperAdmin">Super Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh (Chùa)</label>
                            <select
                                className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                value={form.templeId}
                                onChange={(e) => setForm({ ...form, templeId: e.target.value })}
                            >
                                <option value="">Chọn chùa...</option>
                                {temples.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex gap-3">
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium ml-auto"
                        >
                            {isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
