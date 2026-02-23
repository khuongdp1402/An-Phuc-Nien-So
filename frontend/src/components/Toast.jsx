export default function Toast({ toast }) {
  if (!toast) return null;

  const bg =
    toast.type === 'error'
      ? 'bg-red-600'
      : toast.type === 'success'
        ? 'bg-emerald-600'
        : 'bg-amber-600';

  return (
    <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${bg}`}>
      {toast.msg}
    </div>
  );
}
