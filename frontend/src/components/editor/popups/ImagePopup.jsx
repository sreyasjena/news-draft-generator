export default function ImagePopup({
  onClose,
  imagesLoading,
  selectedImages,
  imageFilter,
  setImageFilter,
  toggleImageSelect,
  isImageSelected,
  chosenImages,
  clearImages
}) {
  const filteredImages = selectedImages.filter(img =>
    imageFilter === 'All' || img.source === imageFilter
  )

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
      <div className="bg-slate-800 rounded-2xl border border-slate-600 w-full max-w-4xl max-h-[85vh] flex flex-col">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Select Images</h3>
            <p className="text-slate-400 text-xs mt-1">Click images to select them and inject into your article</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl px-2 leading-none">x</button>
        </div>

        <div className="overflow-y-auto p-5 flex-1">
          {imagesLoading ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-slate-400 text-sm">Fetching from Unsplash and Pexels...</p>
              <p className="text-slate-500 text-xs mt-1">Loading up to 20 images</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-sm">
                  {filteredImages.length} images {imageFilter !== 'All' ? 'from ' + imageFilter : 'found'} — scroll to see all
                </p>
                <p className="text-teal-400 text-sm font-semibold">
                  {(chosenImages || []).length} selected
                </p>
              </div>

              <div className="flex gap-2 mb-4">
                {['All', 'Unsplash', 'Pexels'].map(source => (
                  <button key={source} onClick={() => setImageFilter(source)}
                    className={imageFilter === source
                      ? 'px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-teal-500/30 text-teal-300 border border-teal-500/50'
                      : 'px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-slate-700 text-slate-400 hover:text-white border border-transparent'}>
                    {source}
                    {source !== 'All' && (
                      <span className="ml-1 text-slate-500">
                        ({selectedImages.filter(i => i.source === source).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {filteredImages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">No images found. Try generating again.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredImages.map((img, i) => (
                    <div key={i} onClick={() => toggleImageSelect(img)}
                      className={isImageSelected(img)
                        ? 'cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-105 border-teal-400 ring-2 ring-teal-400/30'
                        : 'cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-105 border-transparent hover:border-slate-500'}>
                      <div className="relative">
                        <img src={img.url} alt={img.description} className="w-full h-32 object-cover" />
                        {isImageSelected(img) && (
                          <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center">
                            <span className="bg-teal-500 text-white text-lg rounded-full w-8 h-8 flex items-center justify-center font-bold">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-slate-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className={img.source === 'Unsplash'
                            ? 'text-xs px-1.5 py-0.5 rounded font-semibold bg-slate-600 text-slate-300'
                            : 'text-xs px-1.5 py-0.5 rounded font-semibold bg-green-500/20 text-green-400'}>
                            {img.source}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs truncate">{img.description}</p>
                        <p className="text-slate-500 text-xs">Photo by {img.photographer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-sm">{(chosenImages || []).length} image(s) selected</p>
            {chosenImages?.length > 0 && (
              <button onClick={clearImages}
                className="text-red-400 hover:text-red-300 text-xs underline mt-1">
                Clear all
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={onClose}
              className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6 py-2 rounded-xl transition-colors text-sm">
              Done — Add to Article
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}