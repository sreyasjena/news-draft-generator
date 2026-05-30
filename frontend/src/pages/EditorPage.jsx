import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { generateDraft, getSEO, injectImages, checkPlagiarism,
  getToneHeatmap, detectBias, getSocialPack,
  getEngagementScore, factCheck, pingBackend } from '../api/client'
import { supabase } from '../utils/supabase'
import LeftPanel from '../components/editor/LeftPanel'
import CenterPanel from '../components/editor/CenterPanel'
import RightPanel from '../components/editor/RightPanel'
import ImagePopup from '../components/editor/popups/ImagePopup'
import SocialPopup from '../components/editor/popups/SocialPopup'

export default function EditorPage() {
  const [facts, setFacts] = useState(() => {
    const saved = localStorage.getItem('editor_facts')
    return saved ? JSON.parse(saved) : ['', '', '']
  })
  const [tone, setTone] = useState(() => localStorage.getItem('editor_tone') || 'neutral')
  const [style, setStyle] = useState(() => localStorage.getItem('editor_style') || 'news article')
  const [articleSize, setArticleSize] = useState(() => localStorage.getItem('editor_size') || 'medium')
  const [article, setArticle] = useState(() => {
    const saved = localStorage.getItem('editor_article')
    return saved ? JSON.parse(saved) : null
  })
  const [results, setResults] = useState(() => {
    const saved = localStorage.getItem('editor_results')
    return saved ? JSON.parse(saved) : {}
  })
  const [selectedSocial, setSelectedSocial] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [runningAll, setRunningAll] = useState(false)
  const [showImagePopup, setShowImagePopup] = useState(false)
  const [showSocialPopup, setShowSocialPopup] = useState(false)
  const [selectedImages, setSelectedImages] = useState([])
  const [imagesLoading, setImagesLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)
  const [imageFilter, setImageFilter] = useState('All')
  const [serverReady, setServerReady] = useState(false)

  // Wake up backend on page load
  useEffect(() => {
    const wakeServer = async () => {
      try {
        await pingBackend()
        setServerReady(true)
      } catch (e) {
        setServerReady(false)
      }
    }
    wakeServer()
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('editor_facts', JSON.stringify(facts))
  }, [facts])

  useEffect(() => {
    localStorage.setItem('editor_tone', tone)
  }, [tone])

  useEffect(() => {
    localStorage.setItem('editor_style', style)
  }, [style])

  useEffect(() => {
    localStorage.setItem('editor_size', articleSize)
  }, [articleSize])

  useEffect(() => {
    if (article) {
      localStorage.setItem('editor_article', JSON.stringify(article))
    }
  }, [article])

  useEffect(() => {
    if (Object.keys(results).length > 0) {
      localStorage.setItem('editor_results', JSON.stringify(results))
    }
  }, [results])

  const addFact = () => setFacts([...facts, ''])
  const removeFact = (i) => setFacts(facts.filter((_, idx) => idx !== i))
  const updateFact = (i, val) => { const u = [...facts]; u[i] = val; setFacts(u) }

  const getSizeWords = (key) => {
    if (key === 'short') return 'short (150-200 words)'
    if (key === 'long') return 'long (800-1000 words)'
    return 'medium (400-500 words)'
  }

  const handleClear = () => {
    setFacts(['', '', ''])
    setArticle(null)
    setResults({})
    setSelectedImages([])
    setSelectedSocial(null)
    setTone('neutral')
    setStyle('news article')
    setArticleSize('medium')
    localStorage.removeItem('editor_facts')
    localStorage.removeItem('editor_article')
    localStorage.removeItem('editor_results')
    localStorage.removeItem('editor_tone')
    localStorage.removeItem('editor_style')
    localStorage.removeItem('editor_size')
  }

  const saveArticle = async (art, collectedResults) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('articles').insert({
        user_id: user.id,
        headline: art.headline,
        lede: art.lede,
        body: art.body,
        background: art.background,
        quotes: art.quotes,
        tags: art.tags,
        word_count: art.word_count,
        tone: tone,
        style: style,
        size: articleSize,
        facts: facts.filter(f => f.trim()),
        seo_score: collectedResults?.seo?.seo_score || null,
        engagement_score: collectedResults?.engagement?.overall_score || null,
        bias_direction: collectedResults?.bias?.bias_direction || null,
        bias_score: collectedResults?.bias?.bias_score || null,
        originality_score: collectedResults?.plagiarism?.originality_score || null,
      })

      if (error) console.error('Save error:', error)
      else console.log('Article saved to Supabase')
    } catch (e) {
      console.error('Save error:', e)
    }
  }

  const handleGenerate = async () => {
    const validFacts = facts.filter(f => f.trim())
    if (validFacts.length < 2) return alert('Please enter at least 2 facts')
    setGenerating(true)
    setArticle(null)
    setResults({})
    setSelectedImages([])
    try {
      const sizeWords = getSizeWords(articleSize)
      const res = await generateDraft(validFacts, tone, style, sizeWords)
      const art = res.data.draft
      setArticle(art)
      runAllFeatures(art)
    } catch (e) {
      if (
        e.code === 'ECONNABORTED' ||
        e.message.includes('timeout') ||
        e.message.includes('Network Error')
      ) {
        alert('The server is waking up from sleep. Please wait 30 seconds and try again. This only happens on the first request.')
      } else {
        alert('Error: ' + e.message)
      }
    } finally {
      setGenerating(false)
    }
  }

  const runAllFeatures = async (art) => {
    setRunningAll(true)
    const bodyText = [art.lede, ...(art.body || [])].join(' ')
    const tasks = [
      { key: 'seo', fn: () => getSEO(art), extract: r => r.data.seo },
      { key: 'bias', fn: () => detectBias(bodyText), extract: r => r.data.bias },
      { key: 'heatmap', fn: () => getToneHeatmap(art), extract: r => r.data.heatmap },
      { key: 'engagement', fn: () => getEngagementScore(art), extract: r => r.data.score },
      { key: 'plagiarism', fn: () => checkPlagiarism(bodyText), extract: r => r.data.result },
      { key: 'factcheck', fn: () => factCheck(art), extract: r => r.data.fact_check },
    ]

    const collectedResults = {}

    for (const task of tasks) {
      try {
        const res = await task.fn()
        const extracted = task.extract(res)
        collectedResults[task.key] = extracted
        setResults(prev => ({ ...prev, [task.key]: extracted }))
      } catch (e) {
        setResults(prev => ({ ...prev, [task.key]: null }))
      }
    }

    setRunningAll(false)
    await saveArticle(art, collectedResults)
  }

  const handleGenerateSocial = async () => {
    if (!selectedSocial || !article) return
    setSocialLoading(true)
    try {
      const res = await getSocialPack(article, selectedSocial)
      setResults(prev => ({ ...prev, social: res.data.social_pack }))
      setShowSocialPopup(true)
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setSocialLoading(false)
    }
  }

  const handleSuggestImages = async () => {
    setImagesLoading(true)
    setShowImagePopup(true)
    setImageFilter('All')
    try {
      const res = await injectImages(article)
      setSelectedImages(res.data.article.all_images || [])
    } catch (e) {
      alert('Error fetching images: ' + e.message)
    } finally {
      setImagesLoading(false)
    }
  }

  const toggleImageSelect = (img) => {
    setResults(prev => {
      const current = prev.chosenImages || []
      const exists = current.find(i => i.url === img.url)
      return {
        ...prev,
        chosenImages: exists
          ? current.filter(i => i.url !== img.url)
          : [...current, img]
      }
    })
  }

  const isImageSelected = (img) =>
    (results.chosenImages || []).find(i => i.url === img.url)

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <Navbar />

      {/* Server waking up banner */}
      {!serverReady && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-2 text-center">
          <p className="text-yellow-400 text-xs font-medium">
            ⚡ Server is waking up — this takes about 30 seconds on first use. Please wait before generating.
          </p>
        </div>
      )}

      <div className="flex flex-1 pt-16" style={{ height: 'calc(100vh - 64px)' }}>

        <LeftPanel
          facts={facts}
          tone={tone}
          style={style}
          articleSize={articleSize}
          selectedSocial={selectedSocial}
          generating={generating}
          runningAll={runningAll}
          article={article}
          socialLoading={socialLoading}
          setTone={setTone}
          setStyle={setStyle}
          setArticleSize={setArticleSize}
          setSelectedSocial={setSelectedSocial}
          updateFact={updateFact}
          addFact={addFact}
          removeFact={removeFact}
          handleGenerate={handleGenerate}
          handleGenerateSocial={handleGenerateSocial}
          handleClear={handleClear}
        />

        <CenterPanel
          article={article}
          generating={generating}
          results={results}
        />

        {article && (
          <RightPanel
            results={results}
            runningAll={runningAll}
            handleSuggestImages={handleSuggestImages}
          />
        )}
      </div>

      {showSocialPopup && results.social && (
        <SocialPopup
          social={results.social}
          onClose={() => setShowSocialPopup(false)}
        />
      )}

      {showImagePopup && (
        <ImagePopup
          onClose={() => setShowImagePopup(false)}
          imagesLoading={imagesLoading}
          selectedImages={selectedImages}
          imageFilter={imageFilter}
          setImageFilter={setImageFilter}
          toggleImageSelect={toggleImageSelect}
          isImageSelected={isImageSelected}
          chosenImages={results.chosenImages || []}
          clearImages={() => setResults(prev => ({ ...prev, chosenImages: [] }))}
        />
      )}
    </div>
  )
}