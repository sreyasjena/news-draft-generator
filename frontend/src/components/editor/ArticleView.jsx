import { downloadAsHTML, downloadAsPDF } from '../../utils/download'

export default function ArticleView({ article, chosenImages }) {
  return (
    <div className="max-w-2xl mx-auto">

      {/* Download Buttons */}
      <div className="flex gap-3 mb-6 justify-end flex-wrap">
        <button onClick={() => downloadAsHTML(article, chosenImages || [])}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
          Download HTML
        </button>
        <button onClick={() => downloadAsPDF(article, chosenImages || [])}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
          Download PDF
        </button>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {article.tags?.map((tag, i) => (
          <span key={i} className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full">{tag}</span>
        ))}
      </div>

      {/* Headline + Lede */}
      <h1 className="text-3xl font-bold text-white mb-3 leading-tight">{article.headline}</h1>
      <p className="text-lg text-slate-300 leading-relaxed border-l-4 border-blue-500 pl-4 mb-6">{article.lede}</p>

      {/* Body with injected images */}
      {article.body?.map((para, i) => (
        <div key={i}>
          <p className="text-slate-300 leading-relaxed mb-4">{para}</p>
          {chosenImages?.[Math.floor(i / 2)] && i % 2 === 1 && (
            <div className="mb-6 rounded-xl overflow-hidden border border-slate-700">
              <img
                src={chosenImages[Math.floor(i / 2)].url}
                alt={chosenImages[Math.floor(i / 2)].description}
                className="w-full h-56 object-cover"
              />
              <p className="text-slate-500 text-xs p-2 text-center">
                Photo by {chosenImages[Math.floor(i / 2)].photographer} on {chosenImages[Math.floor(i / 2)].source}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Background */}
      {article.background && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-5">
          <p className="text-slate-500 text-xs uppercase font-semibold mb-2">Background and Context</p>
          <p className="text-slate-300 text-sm leading-relaxed">{article.background}</p>
        </div>
      )}

      {/* Quotes */}
      {article.quotes?.length > 0 && (
        <div className="space-y-3 mb-5">
          <p className="text-slate-500 text-xs uppercase font-semibold">Quotes</p>
          {article.quotes.map((q, i) => (
            <blockquote key={i} className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-500/5 rounded-r-xl">
              <p className="text-slate-300 italic text-sm">"{q}"</p>
              <span className="text-yellow-500 text-xs mt-1 block">AI-generated quote, verify before publishing</span>
            </blockquote>
          ))}
        </div>
      )}

      <p className="text-slate-500 text-xs mb-8">Word count: {article.word_count}</p>

    </div>
  )
}