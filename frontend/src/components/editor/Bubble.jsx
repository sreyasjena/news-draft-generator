export default function Bubble({ title, onClose, children }) {
  return (
    <div className="border border-blue-500/40 bg-slate-900 rounded-xl p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-semibold text-sm">{title}</h4>
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="text-slate-500 hover:text-white text-xl leading-none px-1">
          x
        </button>
      </div>
      {children}
    </div>
  )
}