export default function MeterCard({ title, loading, onClick, active, children }) {
  return (
    <div
      onClick={onClick}
      className={active
        ? 'border rounded-xl p-4 cursor-pointer transition-all select-none border-blue-500/60 bg-blue-500/5'
        : 'border rounded-xl p-4 cursor-pointer transition-all select-none border-slate-600 hover:border-slate-500 bg-slate-700/50'}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-xs font-semibold">{title}</h3>
        <span className="text-slate-500 text-xs">{active ? 'hide' : 'details'}</span>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 py-1">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-xs">Analyzing...</span>
        </div>
      ) : children}
    </div>
  )
}