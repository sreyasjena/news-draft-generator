const TONES = ['neutral', 'formal', 'engaging', 'urgent', 'analytical']
const STYLES = ['news article', 'breaking news', 'feature story', 'opinion piece', 'press release']
const SIZES = [
  { key: 'short', label: 'Short', desc: '150-200 words' },
  { key: 'medium', label: 'Medium', desc: '400-500 words' },
  { key: 'long', label: 'Long', desc: '800-1000 words' },
]
const SOCIAL_FORMATS = [
  { key: 'twitter', label: 'Twitter/X', desc: 'Under 240 chars', icon: '🐦' },
  { key: 'instagram', label: 'Instagram', desc: '80-120 words', icon: '📸' },
  { key: 'facebook', label: 'Facebook', desc: '100-150 words', icon: '👥' },
  { key: 'linkedin', label: 'LinkedIn', desc: '150-250 words', icon: '💼' },
  { key: 'whatsapp', label: 'WhatsApp', desc: 'Bulletin format', icon: '💬' },
]

export default function LeftPanel({
  facts, tone, style, articleSize, selectedSocial, generating, runningAll, article, socialLoading,
  setTone, setStyle, setArticleSize, setSelectedSocial,
  updateFact, addFact, removeFact,
  handleGenerate, handleGenerateSocial
}) {
  return (
    <div className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-white font-bold">Input Facts</h2>
        <p className="text-slate-400 text-xs mt-1">All features run automatically after generation</p>
      </div>

      <div className="p-4 flex flex-col gap-5">

        {/* Facts */}
        <div>
          <label className="text-slate-300 text-xs font-semibold uppercase mb-2 block">Facts</label>
          {facts.map((fact, i) => (
            <div key={i} className="flex gap-1 mb-2">
              <input
                value={fact}
                onChange={e => updateFact(i, e.target.value)}
                placeholder={'Fact ' + (i + 1) + '...'}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {facts.length > 1 && (
                <button
                  onClick={() => removeFact(i)}
                  className="text-slate-500 hover:text-red-400 text-lg px-1">
                  x
                </button>
              )}
            </div>
          ))}
          <button onClick={addFact} className="text-blue-400 hover:text-blue-300 text-xs mt-1">
            + Add fact
          </button>
        </div>

        {/* Tone */}
        <div>
          <label className="text-slate-300 text-xs font-semibold uppercase mb-2 block">Tone</label>
          <div className="flex flex-wrap gap-1">
            {TONES.map(t => (
              <button key={t} onClick={() => setTone(t)}
                className={tone === t
                  ? 'px-2 py-1 rounded-lg text-xs capitalize bg-blue-500 text-white'
                  : 'px-2 py-1 rounded-lg text-xs capitalize bg-slate-700 text-slate-400 hover:text-white'}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="text-slate-300 text-xs font-semibold uppercase mb-2 block">Article Style</label>
          <select
            value={style}
            onChange={e => setStyle(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500">
            {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Article Size */}
        <div>
          <label className="text-slate-300 text-xs font-semibold uppercase mb-2 block">Article Size</label>
          <div className="flex gap-1">
            {SIZES.map(s => (
              <button key={s.key} onClick={() => setArticleSize(s.key)}
                className={articleSize === s.key
                  ? 'flex-1 flex flex-col items-center py-2 px-1 rounded-lg border bg-blue-500/20 border-blue-500/50 text-blue-300'
                  : 'flex-1 flex flex-col items-center py-2 px-1 rounded-lg border bg-slate-700 border-transparent text-slate-400 hover:text-white'}>
                <span className="text-xs font-semibold">{s.label}</span>
                <span className="text-slate-500 text-xs">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Social Media */}
        <div>
          <label className="text-slate-300 text-xs font-semibold uppercase mb-2 block">Social Media Output</label>
          <p className="text-slate-500 text-xs mb-2">Select one platform</p>
          {SOCIAL_FORMATS.map(f => (
            <button key={f.key}
              onClick={() => setSelectedSocial(selectedSocial === f.key ? null : f.key)}
              className={selectedSocial === f.key
                ? 'w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-left text-xs border bg-blue-500/20 border-blue-500/50 text-blue-300'
                : 'w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-left text-xs border bg-slate-700 border-transparent text-slate-400 hover:text-white'}>
              <span className="text-base">{f.icon}</span>
              <span className="flex-1 font-medium">{f.label}</span>
              <span className="text-slate-500 text-xs">{f.desc}</span>
            </button>
          ))}
          {selectedSocial && article && (
            <button
              onClick={handleGenerateSocial}
              disabled={socialLoading}
              className="w-full mt-2 bg-blue-500/80 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-colors">
              {socialLoading
                ? 'Generating...'
                : 'Generate ' + (SOCIAL_FORMATS.find(f => f.key === selectedSocial)?.icon || '') + ' ' + (SOCIAL_FORMATS.find(f => f.key === selectedSocial)?.label || '') + ' Post'}
            </button>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm">
          {generating ? 'Generating...' : 'Generate Draft'}
        </button>

        {runningAll && (
          <div className="bg-slate-700 rounded-xl p-3 text-center">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
            <p className="text-slate-400 text-xs">Running all features...</p>
          </div>
        )}

      </div>
    </div>
  )
}