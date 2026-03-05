import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAccounts, deleteAccount } from '../services/api';

export default function AccountListPage() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAccounts();
    }, []);

    async function loadAccounts() {
        try {
            const data = await getAccounts();
            setAccounts(data);
        } catch (err) {
            alert('Lỗi tải danh sách người dùng: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id, username) {
        if (!confirm(`Bạn có chắc muốn xóa tài khoản "${username}"?`)) return;
        try {
            await deleteAccount(id);
            loadAccounts();
        } catch (err) {
            alert('Không thể xóa: ' + err.message);
        }
    }

    if (loading) return <div className="py-8 text-center text-amber-700">Đang tải...</div>;

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <h1 className="text-xl sm:text-2xl font-bold text-amber-900">Quản lý người dùng</h1>
                <Link
                    to="/accounts/new"
                    className="inline-flex justify-center bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm sm:text-base shrink-0"
                >
                    Thêm người dùng mới
                </Link>
            </div>

            <div className="bg-white shadow rounded-2xl overflow-hidden border border-amber-100">
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-amber-100">
                        <thead className="bg-amber-50">
                            <tr>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase tracking-wider">Tên đăng nhập</th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase tracking-wider">Họ tên</th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase tracking-wider">Vai trò</th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase tracking-wider">Chùa quản lý</th>
                                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-amber-700 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-amber-50">
                            {accounts.map((a) => (
                                <tr key={a.id} className="hover:bg-amber-50/50 transition-colors">
                                    <td className="px-4 lg:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">{a.username}</td>
                                    <td className="px-4 lg:px-6 py-3 sm:py-4 text-sm text-gray-600">{a.fullName}</td>
                                    <td className="px-4 lg:px-6 py-3 sm:py-4">
                                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${a.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                            {a.role}
                                        </span>
                                    </td>
                                    <td className="px-4 lg:px-6 py-3 sm:py-4 text-sm text-gray-600 max-w-[140px] truncate" title={a.templeName || ''}>{a.templeName || '—'}</td>
                                    <td className="px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link to={`/accounts/${a.id}/edit`} className="text-indigo-600 hover:text-indigo-800 mr-3">Sửa</Link>
                                        <button
                                            onClick={() => handleDelete(a.id, a.username)}
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
                    {accounts.length === 0 ? (
                        <p className="px-4 py-8 text-center text-gray-500 text-sm">Chưa có người dùng nào.</p>
                    ) : (
                        accounts.map((a) => (
                            <div key={a.id} className="p-4 hover:bg-amber-50/50 transition-colors">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-gray-900">{a.username}</p>
                                        <p className="text-sm text-gray-600 mt-0.5">{a.fullName}</p>
                                        <span className={`inline-flex mt-2 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${a.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                            {a.role}
                                        </span>
                                        {a.templeName && <p className="text-xs text-amber-600 mt-1 truncate">{a.templeName}</p>}
                                    </div>
                                    <div className="flex shrink-0 gap-2">
                                        <Link
                                            to={`/accounts/${a.id}/edit`}
                                            className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                                        >
                                            Sửa
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(a.id, a.username)}
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
