import { useState } from 'react'
import { refineTone } from '../../api/client'
import { downloadAsPDF } from '../../utils/download'

const REFINE_TONES = ['formal', 'engaging', 'neutral', 'urgent', 'analytical', 'conversational', 'dramatic']

export default function ToneRefiner({ article, chosenImages }) {
  const [refiningTone, setRefiningTone] = useState(false)
  const [refinedArticleText, setRefinedArticleText] = useState(null)
  const [activeTone, setActiveTone] = useState(null)

  const handleRefineTone = async (targetTone) => {
    if (!article) return
    setRefiningTone(true)
    setActiveTone(targetTone)
    setRefinedArticleText(null)
    try {
      const fullText = [
        article.headline,
        article.lede,
        ...(article.body || []),
        article.background || ''
      ].join('\n\n')
      const res = await refineTone(fullText, targetTone)
      setRefinedArticleText(res.data.refined_article)
    } catch (e) {
      alert('Error refining tone: ' + e.message)
    } finally {
      setRefiningTone(false)
    }
  }

  return (
    <div className="border border-slate-700 rounded-2xl p-5 mb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-white font-bold text-sm">Refine Tone</h3>
          <p className="text-slate-400 text-xs mt-1">
            Rewrite the article in a different tone — all facts stay the same
          </p>
        </div>
        {refiningTone && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-400 text-xs">Rewriting...</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {REFINE_TONES.map(t => (
          <button key={t} onClick={() => handleRefineTone(t)}
            disabled={refiningTone}
            className={activeTone === t && refinedArticleText
              ? 'px-3 py-1.5 rounded-lg text-xs capitalize font-medium transition-colors bg-blue-500 text-white border border-blue-400'
              : 'px-3 py-1.5 rounded-lg text-xs capitalize font-medium transition-colors disabled:opacity-40 bg-slate-700 hover:bg-blue-500/20 hover:text-blue-300 text-slate-400 border border-transparent hover:border-blue-500/40'}>
            {t}
          </button>
        ))}
      </div>

      {refinedArticleText && (
        <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <p className="text-green-400 text-xs font-semibold capitalize">
                {activeTone} version ready
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(refinedArticleText)}
                className="text-xs bg-slate-600 hover:bg-slate-500 text-slate-300 px-3 py-1 rounded-lg transition-colors">
                Copy
              </button>
              <button
                onClick={() => downloadAsPDF({ ...article, body: [refinedArticleText] }, chosenImages || [])}
                className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded-lg transition-colors">
                PDF
              </button>
              <button
                onClick={() => { setRefinedArticleText(null); setActiveTone(null) }}
                className="text-xs bg-slate-600 hover:bg-slate-500 text-slate-400 px-3 py-1 rounded-lg transition-colors">
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{refinedArticleText}</p>
          </div>
        </div>
      )}
    </div>
  )
}