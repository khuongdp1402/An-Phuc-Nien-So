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

    if (loading) return <div>Đang tải...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-amber-900">Quản lý người dùng</h1>
                <Link
                    to="/accounts/new"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Thêm người dùng mới
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden border border-amber-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên đăng nhập</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chùa quản lý</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {accounts.map((a) => (
                            <tr key={a.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{a.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.fullName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${a.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {a.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.templeName || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                    <Link to={`/accounts/${a.id}/edit`} className="text-indigo-600 hover:text-indigo-900">Sửa</Link>
                                    <button
                                        onClick={() => handleDelete(a.id, a.username)}
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
