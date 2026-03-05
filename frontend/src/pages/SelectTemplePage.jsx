import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTemples, getCurrentAccount, setViewTemple, getViewTempleId } from '../services/api';

export default function SelectTemplePage() {
    const navigate = useNavigate();
    const [temples, setTemples] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTemples()
            .then((data) => setTemples(data || []))
            .catch(() => setTemples([]))
            .finally(() => setLoading(false));
    }, []);

    const account = getCurrentAccount();
    const isSuper = account?.role === 'SuperAdmin' || account?.Role === 'SuperAdmin';
    if (!isSuper) {
        navigate('/', { replace: true });
        return null;
    }

    function handleSelect(temple) {
        if (temple) {
            setViewTemple(temple.id, temple.name);
        } else {
            setViewTemple(null, null);
        }
        navigate('/', { replace: true });
    }

    const currentId = getViewTempleId();

    if (loading) {
        return (
            <div className="max-w-lg mx-auto py-12 px-4 text-center">
                <p className="text-amber-700">Đang tải danh sách chùa...</p>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto py-8 px-4">
            <h1 className="text-xl sm:text-2xl font-bold text-amber-900 mb-2">Chọn chùa để xem dữ liệu</h1>
            <p className="text-sm text-gray-600 mb-6">Super Admin có thể xem dữ liệu theo từng chùa hoặc xem tất cả. Chọn một chùa bên dưới để lọc dữ liệu.</p>

            <div className="space-y-2">
                <button
                    type="button"
                    onClick={() => handleSelect(null)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${!currentId
                        ? 'border-amber-500 bg-amber-50 text-amber-900 font-medium'
                        : 'border-amber-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50/50'
                        }`}
                >
                    <span className="block font-medium">Xem tất cả chùa</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Không lọc theo chùa</span>
                </button>

                {temples.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelect(t)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${String(currentId || '') === String(t.id || '')
                            ? 'border-amber-500 bg-amber-50 text-amber-900 font-medium'
                            : 'border-amber-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50/50'
                            }`}
                    >
                        <span className="block font-medium">{t.name}</span>
                        {t.address && <span className="block text-xs text-gray-500 mt-0.5 truncate">{t.address}</span>}
                    </button>
                ))}
            </div>

            {temples.length === 0 && (
                <p className="text-center text-gray-500 text-sm mt-6">Chưa có chùa nào. Vào mục Chùa để thêm.</p>
            )}
        </div>
    );
}
