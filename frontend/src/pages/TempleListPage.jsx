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

    if (loading) return <div className="py-8 text-center text-amber-700">Đang tải...</div>;

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <h1 className="text-xl sm:text-2xl font-bold text-amber-900">Danh sách chùa</h1>
                <Link
                    to="/temples/new"
                    className="inline-flex justify-center bg-amber-600 text-white px-4 py-2.5 rounded-xl hover:bg-amber-700 transition-colors font-medium text-sm sm:text-base shrink-0"
                >
                    Thêm chùa mới
                </Link>
            </div>

            <div className="bg-white shadow rounded-2xl overflow-hidden border border-amber-100">
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-amber-100">
                        <thead className="bg-amber-50">
                            <tr>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase tracking-wider">Tên chùa</th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase tracking-wider">Địa chỉ</th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase tracking-wider">Số điện thoại</th>
                                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-amber-700 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-amber-50">
                            {temples.map((t) => (
                                <tr key={t.id} className="hover:bg-amber-50/50 transition-colors">
                                    <td className="px-4 lg:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">{t.name}</td>
                                    <td className="px-4 lg:px-6 py-3 sm:py-4 text-sm text-gray-600">{t.address}</td>
                                    <td className="px-4 lg:px-6 py-3 sm:py-4 text-sm text-gray-600 whitespace-nowrap">{t.phoneNumber}</td>
                                    <td className="px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link to={`/temples/${t.id}/edit`} className="text-amber-600 hover:text-amber-800 mr-3">Sửa</Link>
                                        <button
                                            onClick={() => handleDelete(t.id, t.name)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-amber-100">
                    {temples.length === 0 ? (
                        <p className="px-4 py-8 text-center text-gray-500 text-sm">Chưa có chùa nào.</p>
                    ) : (
                        temples.map((t) => (
                            <div key={t.id} className="p-4 hover:bg-amber-50/50 transition-colors">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                                        {t.address && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.address}</p>}
                                        {t.phoneNumber && <p className="text-xs text-amber-600 mt-1">{t.phoneNumber}</p>}
                                    </div>
                                    <div className="flex shrink-0 gap-2">
                                        <Link
                                            to={`/temples/${t.id}/edit`}
                                            className="px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-100 rounded-lg hover:bg-amber-200"
                                        >
                                            Sửa
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(t.id, t.name)}
                                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
