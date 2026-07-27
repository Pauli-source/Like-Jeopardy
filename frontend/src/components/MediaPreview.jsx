export default function MediaPreview({ url, label }) {
  if (!url) return null;

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.includes('youtu.be/')
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : url.split('v=')[1]?.split('&')[0];

    return (
      <div className="mt-2 bg-slate-100 rounded-xl p-2 border border-slate-200">
        {label && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{label} Vorschau:</span>}
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    );
  }

  if (url.includes('spotify.com')) {
    const embedUrl = url.replace('/track/', '/embed/track/').replace('/playlist/', '/embed/playlist/');
    return (
      <div className="mt-2 bg-slate-100 rounded-xl p-2 border border-slate-200">
        {label && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{label} Vorschau:</span>}
        <div className="w-full flex justify-center overflow-hidden rounded-lg">
          <iframe
            src={embedUrl}
            width="100%"
            height="80"
            frameBorder="0"
            allowtransparency="true"
            allow="encrypted-media"
          ></iframe>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 bg-slate-100 rounded-xl p-2 border border-slate-200">
      {label && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{label} Vorschau:</span>}
      <div className="w-full flex justify-center overflow-hidden rounded-lg">
        <img src={url} alt={label || 'Medien Vorschau'} className="object-contain max-h-[220px] mx-auto" />
      </div>
    </div>
  );
}
