import { useState } from 'react'
import Navbar from '../components/Navbar'
import LeftPanel from '../components/editor/LeftPanel'
import CenterPanel from '../components/editor/CenterPanel'
import RightPanel from '../components/editor/RightPanel'
import ImagePopup from '../components/editor/popups/ImagePopup'
import SocialPopup from '../components/editor/popups/SocialPopup'
import { generateDraft, getSEO, injectImages, checkPlagiarism,
  getToneHeatmap, detectBias, getSocialPack,
  getEngagementScore, factCheck } from '../api/client'

const SIZES = [
  { key: 'short', words: 'short (150-200 words)' },
  { key: 'medium', words: 'medium (400-500 words)' },
  { key: 'long', words: 'long (800-1000 words)' },
]

export default function EditorPage() {
  const [facts, setFacts] = useState(['', '', ''])
  const [tone, setTone] = useState('neutral')
  const [style, setStyle] = useState('news article')
  const [articleSize, setArticleSize] = useState('medium')
  const [selectedSocial, setSelectedSocial] = useState(null)
  const [article, setArticle] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState({})
  const [runningAll, setRunningAll] = useState(false)
  const [showImagePopup, setShowImagePopup] = useState(false)
  const [showSocialPopup, setShowSocialPopup] = useState(false)
  const [selectedImages, setSelectedImages] = useState([])
  const [imagesLoading, setImagesLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)
  const [imageFilter, setImageFilter] = useState('All')

  const addFact = () => setFacts([...facts, ''])
  const removeFact = (i) => setFacts(facts.filter((_, idx) => idx !== i))
  const updateFact = (i, val) => { const u = [...facts]; u[i] = val; setFacts(u) }

  const handleGenerate = async () => {
    const validFacts = facts.filter(f => f.trim())
    if (validFacts.length < 2) return alert('Please enter at least 2 facts')
    setGenerating(true)
    setArticle(null)
    setResults({})
    setSelectedImages([])
    try {
      const selectedSize = SIZES.find(s => s.key === articleSize)?.words || 'medium (400-500 words)'
      const res = await generateDraft(validFacts, tone, style, selectedSize)
      const art = res.data.draft
      setArticle(art)
      runAllFeatures(art)
    } catch (e) {
      alert('Error: ' + e.message)
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
    for (const task of tasks) {
      try {
        const res = await task.fn()
        setResults(prev => ({ ...prev, [task.key]: task.extract(res) }))
      } catch (e) {
        setResults(prev => ({ ...prev, [task.key]: null }))
      }
    }
    setRunningAll(false)
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
      <div className="flex flex-1 pt-16" style={{ height: 'calc(100vh - 64px)' }}>

        <LeftPanel
          facts={facts} tone={tone} style={style}
          articleSize={articleSize} selectedSocial={selectedSocial}
          generating={generating} runningAll={runningAll}
          article={article} socialLoading={socialLoading}
          setTone={setTone} setStyle={setStyle}
          setArticleSize={setArticleSize} setSelectedSocial={setSelectedSocial}
          updateFact={updateFact} addFact={addFact} removeFact={removeFact}
          handleGenerate={handleGenerate} handleGenerateSocial={handleGenerateSocial}
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