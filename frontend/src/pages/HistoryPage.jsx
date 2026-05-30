import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../utils/supabase'

export default function HistoryPage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setArticles(data || [])
    } catch (e) {
      console.error('Fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  const deleteArticle = async (id) => {
    setDeleting(id)
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id)

      if (error) throw error
      setArticles(prev => prev.filter(a => a.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch (e) {
      alert('Error deleting article: ' + e.message)
    } finally {
      setDeleting(null)
    }
  }

  const loadInEditor = (art) => {
    localStorage.setItem('editor_article', JSON.stringify({
      headline: art.headline,
      lede: art.lede,
      body: art.body,
      background: art.background,
      quotes: art.quotes,
      tags: art.tags,
      word_count: art.word_count
    }))
    localStorage.setItem('editor_tone', art.tone || 'neutral')
    localStorage.setItem('editor_style', art.style || 'news article')
    localStorage.setItem('editor_size', art.size || 'medium')
    localStorage.setItem('editor_results', JSON.stringify({
      seo: art.seo_score ? { seo_score: art.seo_score } : null,
      engagement: art.engagement_score ? { overall_score: art.engagement_score } : null,
      bias: art.bias_direction ? {
        bias_direction: art.bias_direction,
        bias_score: art.bias_score || 0,
        overall_assessment: '',
        biased_sentences: [],
        emotional_words: []
      } : null,
      plagiarism: art.originality_score ? {
        originality_score: art.originality_score,
        risk_level: art.originality_score > 80 ? 'Low' : art.originality_score > 50 ? 'Medium' : 'High',
        assessment: '',
        recommendations: [],
        flagged_phrases: []
      } : null
    }))
    navigate('/editor')
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getBiasColor = (direction) => {
    if (!direction) return 'text-slate-400'
    if (direction.includes('Left')) return 'text-blue-400'
    if (direction.includes('Right')) return 'text-red-400'
    return 'text-green-400'
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      <div className="pt-20 px-6 pb-10 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Article History</h1>
            <p className="text-slate-400 mt-1">
              {articles.length} article{articles.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <Link to="/editor"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
            + New Article
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400">Loading your articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-white text-xl font-bold mb-2">No articles yet</h3>
            <p className="text-slate-400 mb-6">Generate your first article to see it here</p>
            <Link to="/editor"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Go to Editor
            </Link>
          </div>
        ) : (
          <div className="flex gap-6">

            {/* Article List */}
            <div className="w-96 flex-shrink-0 space-y-3 overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 180px)' }}>
              {articles.map(art => (
                <div key={art.id}
                  onClick={() => setSelected(art)}
                  className={`cursor-pointer rounded-xl p-4 border transition-all ${selected?.id === art.id
                    ? 'border-blue-500/60 bg-blue-500/5'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(art.tags || []).slice(0, 2).map((tag, i) => (
                      <span key={i} className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Headline */}
                  <h3 className="text-white font-semibold text-sm leading-snug mb-2 line-clamp-2">
                    {art.headline}
                  </h3>

                  {/* Lede preview */}
                  <p className="text-slate-500 text-xs leading-relaxed mb-3 line-clamp-2">
                    {art.lede}
                  </p>

                  {/* Metrics row */}
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    {art.engagement_score && (
                      <span className="text-xs text-purple-400">
                        Score {art.engagement_score}
                      </span>
                    )}
                    {art.seo_score && (
                      <span className="text-xs text-green-400">
                        SEO {art.seo_score}
                      </span>
                    )}
                    {art.originality_score && (
                      <span className="text-xs text-teal-400">
                        Original {art.originality_score}%
                      </span>
                    )}
                    {art.bias_direction && (
                      <span className={`text-xs ${getBiasColor(art.bias_direction)}`}>
                        {art.bias_direction}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 text-xs">{art.word_count} words</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-slate-600 text-xs capitalize">{art.tone}</span>
                    </div>
                    <span className="text-slate-600 text-xs">{formatDate(art.created_at)}</span>
                  </div>

                  {/* Quick edit button on card */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      loadInEditor(art)
                    }}
                    className="mt-3 w-full text-xs text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 py-1.5 rounded-lg transition-colors">
                    ✏️ Edit in Editor
                  </button>
                </div>
              ))}
            </div>

            {/* Article Detail */}
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
              {!selected ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="text-5xl mb-4">👈</div>
                  <p className="text-slate-400">Select an article from the left to read it</p>
                </div>
              ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">

                  {/* Action buttons */}
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-slate-500 text-sm">{formatDate(selected.created_at)}</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-slate-500 text-sm capitalize">{selected.tone} tone</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-slate-500 text-sm capitalize">{selected.style}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadInEditor(selected)}
                        className="text-blue-400 hover:text-blue-300 text-sm border border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/10 px-4 py-2 rounded-lg transition-colors">
                        ✏️ Edit in Editor
                      </button>
                      <button
                        onClick={() => deleteArticle(selected.id)}
                        disabled={deleting === selected.id}
                        className="text-red-400 hover:text-red-300 text-sm border border-red-500/20 hover:border-red-500/40 px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                        {deleting === selected.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(selected.tags || []).map((tag, i) => (
                      <span key={i} className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Headline */}
                  <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
                    {selected.headline}
                  </h1>

                  {/* Lede */}
                  <p className="text-lg text-slate-300 leading-relaxed border-l-4 border-blue-500 pl-4 mb-6">
                    {selected.lede}
                  </p>

                  {/* Metrics cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: 'Engagement', value: selected.engagement_score ? selected.engagement_score + '/100' : 'N/A', color: '#a855f7' },
                      { label: 'SEO Score', value: selected.seo_score ? selected.seo_score + '/100' : 'N/A', color: '#22c55e' },
                      { label: 'Originality', value: selected.originality_score ? selected.originality_score + '%' : 'N/A', color: '#06b6d4' },
                      { label: 'Bias', value: selected.bias_direction || 'N/A', color: selected.bias_score > 0 ? '#ef4444' : selected.bias_score < 0 ? '#3b82f6' : '#22c55e' },
                    ].map((metric, i) => (
                      <div key={i} className="bg-slate-700/50 rounded-xl p-3 text-center border border-slate-600">
                        <div className="font-bold text-lg" style={{ color: metric.color }}>{metric.value}</div>
                        <div className="text-slate-500 text-xs mt-1">{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Body */}
                  <div className="space-y-4 mb-6">
                    {(selected.body || []).map((para, i) => (
                      <p key={i} className="text-slate-300 leading-relaxed">{para}</p>
                    ))}
                  </div>

                  {/* Background */}
                  {selected.background && (
                    <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 mb-5">
                      <p className="text-slate-500 text-xs uppercase font-semibold mb-2">Background and Context</p>
                      <p className="text-slate-300 text-sm leading-relaxed">{selected.background}</p>
                    </div>
                  )}

                  {/* Quotes */}
                  {(selected.quotes || []).length > 0 && (
                    <div className="space-y-3 mb-5">
                      <p className="text-slate-500 text-xs uppercase font-semibold">Quotes</p>
                      {selected.quotes.map((q, i) => (
                        <blockquote key={i} className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-500/5 rounded-r-xl">
                          <p className="text-slate-300 italic text-sm">"{q}"</p>
                          <span className="text-yellow-500 text-xs mt-1 block">
                            AI-generated quote, verify before publishing
                          </span>
                        </blockquote>
                      ))}
                    </div>
                  )}

                  <p className="text-slate-600 text-xs">Word count: {selected.word_count}</p>

                  {/* Load in Editor CTA at bottom */}
                  <div className="mt-8 pt-6 border-t border-slate-700">
                    <button
                      onClick={() => loadInEditor(selected)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                      ✏️ Open in Editor to Edit
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}