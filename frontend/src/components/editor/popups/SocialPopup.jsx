export default function SocialPopup({ social, onClose }) {
  if (!social) return null

  const platformLabel = {
    twitter: 'Twitter/X Post',
    instagram: 'Instagram Post',
    facebook: 'Facebook Post',
    linkedin: 'LinkedIn Post',
    whatsapp: 'WhatsApp Bulletin'
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
      <div className="bg-slate-800 rounded-2xl border border-slate-600 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">{platformLabel[social.platform] || 'Social Post'}</h3>
            <p className="text-slate-400 text-xs mt-1">Click Copy to copy any post or hashtag</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl px-2 leading-none">x</button>
        </div>

        <div className="overflow-y-auto p-5 flex-1">
          <div className="space-y-3 mb-5">
            {social.posts?.map((post, i) => (
              <div key={i} className="bg-slate-700 rounded-xl p-4 relative">
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap pr-14">{post}</p>
                {social.platform === 'twitter' && (
                  <p className={post.length > 240
                    ? 'text-xs mt-2 font-mono text-red-400'
                    : 'text-xs mt-2 font-mono text-green-400'}>
                    {post.length}/280 chars
                  </p>
                )}
                <button
                  onClick={() => navigator.clipboard.writeText(post)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-white text-xs bg-slate-600 hover:bg-slate-500 px-3 py-1.5 rounded-lg transition-colors font-medium">
                  Copy
                </button>
              </div>
            ))}
          </div>

          {social.hashtags?.length > 0 && (
            <div>
              <p className="text-slate-500 text-xs uppercase font-semibold mb-3">Trending Hashtags</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {social.hashtags.map((tag, i) => (
                  <button key={i}
                    onClick={() => navigator.clipboard.writeText(tag)}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded-full text-xs transition-colors">
                    {tag}
                  </button>
                ))}
              </div>
              <p className="text-slate-600 text-xs">Click any hashtag to copy</p>
              <button
                onClick={() => navigator.clipboard.writeText(social.hashtags.join(' '))}
                className="mt-3 text-xs text-slate-400 hover:text-white underline transition-colors">
                Copy all hashtags at once
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-end">
          <button onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-xl transition-colors text-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}