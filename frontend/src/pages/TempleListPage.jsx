import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTemples, deleteTemple } from '../services/api';

export default function TempleListPage() {
    const [temples, setTemples] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTemples();
    }, []);

    async function loadTemples() {
        try {
            const data = await getTemples();
            setTemples(data);
        } catch (err) {
            alert('Lỗi tải danh sách chùa: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id, name) {
        if (!confirm(`Bạn có chắc muốn xóa chùa "${name}"? Thao tác này có thể thất bại nếu có dữ liệu liên quan.`)) return;
        try {
            await deleteTemple(id);
            loadTemples();
        } catch (err) {
            alert('Không thể xóa: ' + err.message);
        }
    }

    if (loading) return <div>Đang tải...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-amber-900">Danh sách chùa</h1>
                <Link
                    to="/temples/new"
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                    Thêm chùa mới
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden border border-amber-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên chùa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {temples.map((t) => (
                            <tr key={t.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{t.address}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.phoneNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                    <Link to={`/temples/${t.id}/edit`} className="text-indigo-600 hover:text-indigo-900">Sửa</Link>
                                    <button
                                        onClick={() => handleDelete(t.id, t.name)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
