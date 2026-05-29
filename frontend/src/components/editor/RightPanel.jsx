import MeterCard from './MeterCard'
import Bubble from './Bubble'
import { useState } from 'react'

export default function RightPanel({ results, runningAll, handleSuggestImages }) {
  const [bubble, setBubble] = useState(null)

  return (
    <div className="w-72 bg-slate-800 border-l border-slate-700 overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-white font-bold text-sm">Analysis</h2>
        <p className="text-slate-400 text-xs mt-1">Click any card for full details</p>
      </div>

      <div className="p-4 space-y-3">

        {/* BIAS */}
        <MeterCard title="Bias Detector"
          loading={!results.bias && runningAll}
          onClick={() => setBubble(bubble === 'bias' ? null : 'bias')}
          active={bubble === 'bias'}>
          {results.bias && (
            <>
              <div className="relative h-4 rounded-full overflow-hidden mb-1"
                style={{ background: 'linear-gradient(to right,#3b82f6,#94a3b8,#ef4444)' }}>
                <div className="absolute top-0 w-3 h-4 bg-white rounded-full shadow transform -translate-x-1/2"
                  style={{ left: ((results.bias.bias_score + 100) / 200 * 100) + '%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Left</span><span>Center</span><span>Right</span>
              </div>
              <p className="text-white text-sm font-semibold text-center">{results.bias.bias_direction}</p>
            </>
          )}
        </MeterCard>

        {bubble === 'bias' && results.bias && (
          <Bubble title="Bias Details" onClose={() => setBubble(null)}>
            <p className="text-slate-300 text-sm mb-3">{results.bias.overall_assessment}</p>
            {results.bias.emotional_words?.length > 0 && (
              <div className="mb-3">
                <p className="text-slate-500 text-xs uppercase mb-1">Emotional Words</p>
                <div className="flex flex-wrap gap-1">
                  {results.bias.emotional_words.map((w, i) => (
                    <span key={i} className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs">{w}</span>
                  ))}
                </div>
              </div>
            )}
            {results.bias.biased_sentences?.map((s, i) => (
              <div key={i} className="border-l-4 border-yellow-500 pl-3 mb-3 bg-yellow-500/5 rounded-r p-2">
                <p className="text-slate-300 text-xs italic">"{s.sentence}"</p>
                <p className="text-yellow-400 text-xs mt-1">{s.reason}</p>
                <p className="text-green-400 text-xs mt-1">{s.suggestion}</p>
              </div>
            ))}
          </Bubble>
        )}

        {/* PLAGIARISM */}
        <MeterCard title="Plagiarism Check"
          loading={!results.plagiarism && runningAll}
          onClick={() => setBubble(bubble === 'plagiarism' ? null : 'plagiarism')}
          active={bubble === 'plagiarism'}>
          {results.plagiarism && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-slate-600 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full"
                    style={{ width: results.plagiarism.originality_score + '%' }}></div>
                </div>
                <span className="text-green-400 font-bold text-sm">{results.plagiarism.originality_score}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Originality</span>
                <span className={results.plagiarism.risk_level === 'Low'
                  ? 'text-xs px-2 py-0.5 rounded-full font-semibold bg-green-500/20 text-green-400'
                  : results.plagiarism.risk_level === 'Medium'
                  ? 'text-xs px-2 py-0.5 rounded-full font-semibold bg-yellow-500/20 text-yellow-400'
                  : 'text-xs px-2 py-0.5 rounded-full font-semibold bg-red-500/20 text-red-400'}>
                  {results.plagiarism.risk_level} Risk
                </span>
              </div>
            </>
          )}
        </MeterCard>

        {bubble === 'plagiarism' && results.plagiarism && (
          <Bubble title="Plagiarism Details" onClose={() => setBubble(null)}>
            <p className="text-slate-300 text-sm mb-3">{results.plagiarism.assessment}</p>
            {results.plagiarism.recommendations?.map((r, i) => (
              <p key={i} className="text-slate-400 text-xs mb-1">- {r}</p>
            ))}
            {results.plagiarism.flagged_phrases?.map((f, i) => (
              <div key={i} className="bg-slate-700 rounded-lg p-2 mb-2">
                <p className="text-red-400 text-xs">"{f.phrase}"</p>
                <p className="text-slate-500 text-xs mt-1">{f.reason}</p>
              </div>
            ))}
          </Bubble>
        )}

        {/* ENGAGEMENT */}
        <MeterCard title="Engagement Score"
          loading={!results.engagement && runningAll}
          onClick={() => setBubble(bubble === 'engagement' ? null : 'engagement')}
          active={bubble === 'engagement'}>
          {results.engagement && (
            <>
              <div className="flex items-center justify-center mb-2">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#334155" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#a855f7" strokeWidth="3"
                      strokeDasharray={results.engagement.overall_score + ' 100'} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{results.engagement.overall_score}</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-400 text-xs text-center">{results.engagement.reading_level}</p>
              <p className="text-slate-500 text-xs text-center">{results.engagement.estimated_read_time}</p>
            </>
          )}
        </MeterCard>

        {bubble === 'engagement' && results.engagement && (
          <Bubble title="Engagement Details" onClose={() => setBubble(null)}>
            {[
              ['Headline Strength', results.engagement.headline_strength, '#a855f7'],
              ['Readability', results.engagement.readability_score, '#3b82f6'],
              ['SEO Score', results.engagement.seo_score, '#22c55e'],
              ['Shareability', results.engagement.shareability_score, '#f59e0b'],
            ].map(([label, val, color]) => (
              <div key={label} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-white font-semibold">{val}/100</span>
                </div>
                <div className="bg-slate-700 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: val + '%', background: color }}></div>
                </div>
              </div>
            ))}
            {results.engagement.improvements?.map((imp, i) => (
              <p key={i} className="text-slate-400 text-xs mb-1">- {imp}</p>
            ))}
          </Bubble>
        )}

        {/* SEO */}
        <MeterCard title="SEO Optimizer"
          loading={!results.seo && runningAll}
          onClick={() => setBubble(bubble === 'seo' ? null : 'seo')}
          active={bubble === 'seo'}>
          {results.seo && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-slate-600 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full"
                    style={{ width: results.seo.seo_score + '%' }}></div>
                </div>
                <span className="text-green-400 font-bold text-sm">{results.seo.seo_score}/100</span>
              </div>
              <p className="text-slate-300 text-xs font-medium truncate">{results.seo.primary_keyword}</p>
              <p className="text-slate-500 text-xs truncate font-mono">{results.seo.slug}</p>
            </>
          )}
        </MeterCard>

        {bubble === 'seo' && results.seo && (
          <Bubble title="SEO Details" onClose={() => setBubble(null)}>
            <div className="space-y-3">
              <div>
                <p className="text-slate-500 text-xs uppercase mb-1">SEO Title</p>
                <p className="text-white text-sm font-medium">{results.seo.seo_title}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase mb-1">Meta Description</p>
                <p className="text-slate-300 text-xs leading-relaxed">{results.seo.meta_description}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase mb-1">URL Slug</p>
                <p className="text-blue-400 text-xs font-mono">{results.seo.slug}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase mb-2">Keywords</p>
                <div className="flex flex-wrap gap-1">
                  <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {results.seo.primary_keyword}
                  </span>
                  {results.seo.secondary_keywords?.map((kw, i) => (
                    <span key={i} className="bg-slate-600 text-slate-300 px-2 py-0.5 rounded-full text-xs">{kw}</span>
                  ))}
                </div>
              </div>
              {results.seo.improvements?.map((imp, i) => (
                <p key={i} className="text-slate-400 text-xs">- {imp}</p>
              ))}
            </div>
          </Bubble>
        )}

        {/* TONE ANALYSER */}
        <MeterCard title="Tone Analyser"
          loading={!results.heatmap && runningAll}
          onClick={() => setBubble(bubble === 'heatmap' ? null : 'heatmap')}
          active={bubble === 'heatmap'}>
          {results.heatmap && (
            <>
              <div className="flex gap-1 mb-2 rounded-full overflow-hidden h-3">
                {Object.entries(results.heatmap.tone_distribution || {}).map(([t, pct]) => {
                  const colors = { alarming: '#ef4444', neutral: '#94a3b8', positive: '#22c55e', informative: '#3b82f6' }
                  return (
                    <div key={t} className="h-3" title={t + ': ' + pct + '%'}
                      style={{ width: pct + '%', background: colors[t] || '#94a3b8' }}></div>
                  )
                })}
              </div>
              <p className="text-white text-xs font-semibold capitalize text-center mb-1">
                {results.heatmap.overall_tone}
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {Object.entries(results.heatmap.tone_distribution || {}).map(([t, pct]) => {
                  const colors = { alarming: 'text-red-400', neutral: 'text-slate-400', positive: 'text-green-400', informative: 'text-blue-400' }
                  return <span key={t} className={'text-xs ' + (colors[t] || 'text-slate-400')}>{t} {pct}%</span>
                })}
              </div>
            </>
          )}
        </MeterCard>

        {bubble === 'heatmap' && results.heatmap && (
          <Bubble title="Tone Analyser Details" onClose={() => setBubble(null)}>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {results.heatmap.paragraphs?.map((p, i) => (
                <div key={i} className="rounded-lg p-3 border"
                  style={{ borderColor: p.color + '44', background: p.color + '11' }}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold capitalize" style={{ color: p.color }}>
                      {p.tone} - {p.dominant_emotion}
                    </span>
                    <span className="text-slate-500 text-xs">{p.intensity}%</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{p.text}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {Object.entries(results.heatmap.tone_distribution || {}).map(([t, pct]) => (
                <div key={t} className="bg-slate-700 rounded-lg p-2 text-center">
                  <div className="text-white font-bold text-sm">{pct}%</div>
                  <div className="text-slate-400 text-xs capitalize">{t}</div>
                </div>
              ))}
            </div>
          </Bubble>
        )}

        {/* FACT CHECK */}
        <MeterCard title="Fact Checker"
          loading={!results.factcheck && runningAll}
          onClick={() => setBubble(bubble === 'factcheck' ? null : 'factcheck')}
          active={bubble === 'factcheck'}>
          {results.factcheck && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-slate-600 rounded-full h-3">
                  <div className="bg-cyan-500 h-3 rounded-full"
                    style={{ width: results.factcheck.overall_confidence + '%' }}></div>
                </div>
                <span className="text-cyan-400 font-bold text-sm">{results.factcheck.overall_confidence}%</span>
              </div>
              <p className="text-slate-400 text-xs text-center">Confidence Score</p>
            </>
          )}
        </MeterCard>

        {bubble === 'factcheck' && results.factcheck && (
          <Bubble title="Fact Check Details" onClose={() => setBubble(null)}>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-slate-700 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full"
                  style={{ width: results.factcheck.overall_confidence + '%' }}></div>
              </div>
              <span className="text-cyan-400 font-bold text-sm">{results.factcheck.overall_confidence}%</span>
            </div>
            {results.factcheck.red_flags?.map((flag, i) => (
              <p key={i} className="text-red-400 text-xs mb-2">Flag: {flag}</p>
            ))}
            {results.factcheck.verified_claims?.length > 0 && (
              <div className="mb-3">
                <p className="text-slate-500 text-xs uppercase font-semibold mb-2">Claims</p>
                {results.factcheck.verified_claims.map((c, i) => (
                  <div key={i} className="bg-slate-700 rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={c.status === 'Verified' ? 'text-xs font-semibold text-green-400'
                        : c.status === 'Likely True' ? 'text-xs font-semibold text-yellow-400'
                        : c.status === 'Potentially False' ? 'text-xs font-semibold text-red-400'
                        : 'text-xs font-semibold text-orange-400'}>
                        {c.status}
                      </span>
                      <span className="text-slate-500 text-xs ml-auto">{c.confidence}%</span>
                    </div>
                    <p className="text-slate-300 text-xs mb-1">{c.claim}</p>
                    {c.explanation && <p className="text-slate-500 text-xs italic mb-1">{c.explanation}</p>}
                    {c.supported_by && <p className="text-blue-400 text-xs">Source: {c.supported_by}</p>}
                  </div>
                ))}
              </div>
            )}
            {results.factcheck.sources?.length > 0 && (
              <div className="mt-3">
                <p className="text-slate-500 text-xs uppercase font-semibold mb-2">
                  References ({results.factcheck.total_sources_checked} checked)
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {results.factcheck.sources.map((src, i) => (
                    <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-2 bg-slate-700 hover:bg-slate-600 rounded-lg p-2 transition-colors group block">
                      <span className={src.type === 'Wikipedia'
                        ? 'text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0 bg-gray-500/30 text-gray-300'
                        : src.type === 'Fact Check'
                        ? 'text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0 bg-green-500/20 text-green-400'
                        : 'text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0 bg-blue-500/20 text-blue-400'}>
                        {src.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-xs group-hover:text-white transition-colors truncate">{src.title}</p>
                        {src.source && <p className="text-slate-500 text-xs">{src.source}</p>}
                      </div>
                      <span className="text-slate-500 group-hover:text-blue-400 text-xs flex-shrink-0">link</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {results.factcheck.recommendations?.map((r, i) => (
              <p key={i} className="text-slate-400 text-xs mb-1 mt-3">- {r}</p>
            ))}
          </Bubble>
        )}

        {/* IMAGES */}
        <div className="border border-slate-600 rounded-xl p-4">
          <h3 className="text-white text-xs font-semibold mb-2">Image Injection</h3>
          {results.chosenImages?.length > 0 && (
            <div className="mb-3">
              <p className="text-green-400 text-xs mb-2">{results.chosenImages.length} image(s) in article</p>
              <div className="grid grid-cols-3 gap-1">
                {results.chosenImages.map((img, i) => (
                  <img key={i} src={img.thumb || img.url} alt={img.description}
                    className="w-full h-12 object-cover rounded-lg" />
                ))}
              </div>
            </div>
          )}
          <button onClick={handleSuggestImages}
            className="w-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-semibold py-2 rounded-lg transition-colors">
            Suggest Images
          </button>
        </div>

      </div>
    </div>
  )
}