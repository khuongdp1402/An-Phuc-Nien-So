import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTemple, createTemple, updateTemple } from '../services/api';

export default function TempleFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState({
        name: '',
        address: '',
        phoneNumber: '',
    });
    const [loading, setLoading] = useState(isEdit);

    useEffect(() => {
        if (isEdit) {
            loadTemple();
        }
    }, [id]);

    async function loadTemple() {
        try {
            const data = await getTemple(id);
            setForm({
                name: data.name || '',
                address: data.address || '',
                phoneNumber: data.phoneNumber || '',
            });
        } catch (err) {
            alert('Lỗi tải dữ liệu: ' + err.message);
            navigate('/temples');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            if (isEdit) {
                await updateTemple(id, { ...form, id });
            } else {
                await createTemple(form);
            }
            navigate('/temples');
        } catch (err) {
            alert('Lỗi lưu dữ liệu: ' + err.message);
        }
    }

    if (loading) return <div className="py-8 text-center text-amber-700">Đang tải...</div>;

    return (
        <div className="max-w-xl mx-auto py-4 sm:py-8 px-3 sm:px-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-amber-900">
                    {isEdit ? 'Sửa thông tin chùa' : 'Thêm chùa mới'}
                </h1>
                <button
                    onClick={() => navigate('/temples')}
                    className="text-amber-600 hover:text-amber-800 text-sm font-medium shrink-0"
                >
                    &larr; Quay lại
                </button>
            </div>

            <div className="bg-white shadow rounded-2xl p-4 sm:p-6 border border-amber-100">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên chùa</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2.5 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2.5 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2.5 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            value={form.phoneNumber}
                            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 border-t border-amber-100">
                        <button
                            type="submit"
                            className="w-full sm:w-auto bg-amber-600 text-white px-6 py-2.5 rounded-xl hover:bg-amber-700 transition-colors font-medium"
                        >
                            {isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
