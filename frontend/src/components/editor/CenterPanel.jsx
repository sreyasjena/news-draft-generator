import ArticleView from './ArticleView'

export default function CenterPanel({ article, generating, results }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      {!article && !generating && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="text-7xl mb-4">📰</div>
          <h3 className="text-white text-2xl font-bold mb-2">Your article will appear here</h3>
          <p className="text-slate-400">Enter facts on the left and click Generate</p>
          <p className="text-slate-500 text-sm mt-2">All features run automatically after generation</p>
        </div>
      )}

      {generating && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-xl font-semibold">Generating with GPT-4o...</p>
          <p className="text-slate-400 mt-2">All features will run automatically</p>
        </div>
      )}

      {article && !generating && (
        <ArticleView
          article={article}
          chosenImages={results.chosenImages || []}
        />
      )}
    </div>
  )
}