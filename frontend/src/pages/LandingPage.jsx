import { Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../utils/supabase'

const words = ["Breaking News", "Feature Stories", "Press Releases", "Opinion Pieces", "Investigative Reports"]

const features = [
  { icon: "📝", title: "Draft from Facts", desc: "Bullet points to full article in seconds" },
  { icon: "⚖️", title: "Bias Detector", desc: "Left-right political bias scoring" },
  { icon: "🔍", title: "Fact Checker", desc: "Wikipedia, NewsAPI & Google verified" },
  { icon: "🎨", title: "Tone Refiner", desc: "7 tone styles on demand" },
  { icon: "🖼️", title: "Image Injection", desc: "Unsplash & Pexels auto-suggest" },
  { icon: "📱", title: "Social Pack", desc: "Twitter, Instagram, LinkedIn, WhatsApp" },
  { icon: "🚀", title: "Engagement Score", desc: "Predict virality before publishing" },
  { icon: "🌡️", title: "Tone Analyser", desc: "Paragraph-level emotion mapping" },
  { icon: "🔎", title: "SEO Optimizer", desc: "Auto meta, slug & keywords" },
  { icon: "📋", title: "Plagiarism Check", desc: "Originality & copyright scan" },
  { icon: "📡", title: "Trend Radar", desc: "Live trending topic dashboard" },
  { icon: "📥", title: "PDF & HTML Export", desc: "Download with images included" },
]

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80",
  "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80",
  "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&q=80",
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80",
  "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?w=800&q=80",
]

export default function LandingPage() {
  const [currentWord, setCurrentWord] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [typing, setTyping] = useState(true)
  const [scrollY, setScrollY] = useState(0)
  const [visibleSections, setVisibleSections] = useState({})
  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)
  const sectionRefs = useRef({})

  // Check user session
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setUserLoading(false)
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      setUserLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Typewriter effect
  useEffect(() => {
    let timeout
    const word = words[currentWord]
    if (typing) {
      if (displayed.length < word.length) {
        timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80)
      } else {
        timeout = setTimeout(() => setTyping(false), 2200)
      }
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35)
      } else {
        setCurrentWord(prev => (prev + 1) % words.length)
        setTyping(true)
      }
    }
    return () => clearTimeout(timeout)
  }, [displayed, typing, currentWord])

  // Parallax scroll
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => ({ ...prev, [entry.target.id]: true }))
          }
        })
      },
      { threshold: 0.1 }
    )
    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observer.observe(ref)
    })
    return () => observer.disconnect()
  }, [])

  const setRef = (id) => (el) => {
    sectionRefs.current[id] = el
  }

  return (
    <div className="min-h-screen text-white overflow-x-hidden"
      style={{ background: '#040810', fontFamily: "'Georgia', serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');

        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-body { font-family: 'DM Sans', system-ui, sans-serif; }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(1deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-1deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(201,168,76,0.3); }
          50% { box-shadow: 0 0 60px rgba(201,168,76,0.6), 0 0 100px rgba(201,168,76,0.2); }
        }
        @keyframes pulseRed {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(60px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float2 { animation: float2 8s ease-in-out infinite; }
        .animate-shimmer {
          background: linear-gradient(90deg, #c9a84c, #f5d78e, #c9a84c, #f5d78e);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        .cursor-blink { animation: cursorBlink 1s step-end infinite; }

        .hero-animate {
          animation: slideUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }

        .reveal {
          opacity: 0;
          transform: translateY(50px);
          transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .card-hover {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .card-hover:hover {
          transform: translateY(-8px);
          border-color: rgba(201,168,76,0.3);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(201,168,76,0.1);
        }

        .btn-gold {
          background: linear-gradient(135deg, #b8860b, #f5d78e, #c9a84c, #f5d78e, #b8860b);
          background-size: 300% 300%;
          animation: shimmer 3s linear infinite;
          color: #040810;
          font-weight: 800;
          transition: all 0.3s;
        }
        .btn-gold:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 0 50px rgba(201,168,76,0.5);
        }

        .image-card {
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          filter: brightness(0.65) saturate(0.7);
        }
        .image-card:hover {
          filter: brightness(0.9) saturate(1.1);
        }

        .noise-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 200;
          opacity: 0.02;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="noise-overlay"></div>
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 50%, #060d1f 0%, #040810 70%)' }}>
        </div>

        {/* Orbs */}
        <div className="absolute top-32 left-32 w-80 h-80 rounded-full animate-float"
          style={{ background: 'radial-gradient(circle, rgba(30,58,138,0.25), transparent)', filter: 'blur(40px)' }}>
        </div>
        <div className="absolute bottom-32 right-32 w-96 h-96 rounded-full animate-float2"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.12), transparent)', filter: 'blur(50px)' }}>
        </div>

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)',
            backgroundSize: '80px 80px'
          }}>
        </div>

        {/* Accent lines */}
        <div className="absolute top-0 right-24 w-px h-full opacity-10"
          style={{ background: 'linear-gradient(to bottom, transparent, #c9a84c, transparent)' }}>
        </div>
        <div className="absolute top-0 left-24 w-px h-full opacity-10"
          style={{ background: 'linear-gradient(to bottom, transparent, #3b82f6, transparent)' }}>
        </div>

        {/* Floating images LEFT */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-48 animate-float hidden xl:block"
          style={{ animationDelay: '0s', zIndex: 2, opacity: 0.5 }}>
          <img src={UNSPLASH_IMAGES[0]} alt="news"
            className="rounded-2xl w-full object-cover image-card"
            style={{ height: '180px', boxShadow: '0 25px 80px rgba(0,0,0,0.9)' }} />
          <div className="mt-2 px-3 py-1.5 rounded-xl text-center"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
            <p className="font-body text-xs" style={{ color: '#c9a84c' }}>Breaking News</p>
          </div>
        </div>
        <div className="absolute left-10 top-24 w-36 animate-float2 hidden xl:block"
          style={{ animationDelay: '1.5s', zIndex: 2, opacity: 0.35 }}>
          <img src={UNSPLASH_IMAGES[1]} alt="news"
            className="rounded-xl w-full object-cover image-card"
            style={{ height: '130px', boxShadow: '0 20px 60px rgba(0,0,0,0.9)' }} />
        </div>

        {/* Floating images RIGHT */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-48 animate-float2 hidden xl:block"
          style={{ animationDelay: '0.5s', zIndex: 2, opacity: 0.5 }}>
          <img src={UNSPLASH_IMAGES[2]} alt="news"
            className="rounded-2xl w-full object-cover image-card"
            style={{ height: '180px', boxShadow: '0 25px 80px rgba(0,0,0,0.9)' }} />
          <div className="mt-2 px-3 py-1.5 rounded-xl text-center"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <p className="font-body text-xs text-blue-400">Feature Story</p>
          </div>
        </div>
        <div className="absolute right-10 top-24 w-36 animate-float hidden xl:block"
          style={{ animationDelay: '2s', zIndex: 2, opacity: 0.35 }}>
          <img src={UNSPLASH_IMAGES[3]} alt="news"
            className="rounded-xl w-full object-cover image-card"
            style={{ height: '130px', boxShadow: '0 20px 60px rgba(0,0,0,0.9)' }} />
        </div>

        {/* HERO CONTENT */}
        <div className="hero-animate relative max-w-4xl mx-auto px-6 text-center" style={{ zIndex: 10 }}>

          {/* Live badge */}
          <div className="inline-flex items-center gap-3 mb-10">
            <div className="flex items-center gap-2 px-5 py-2 rounded-full"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div className="w-2 h-2 bg-red-500 rounded-full"
                style={{ animation: 'pulseRed 1.5s ease-in-out infinite' }}></div>
              <span className="font-body text-red-400 text-xs font-semibold tracking-[0.2em] uppercase">
                Live · AI Newsroom · GPT-4o
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="font-display leading-none mb-6">
            <span className="block text-white font-black mb-2"
              style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', textShadow: '0 0 120px rgba(59,130,246,0.2)' }}>
              The Future of
            </span>
            <span className="block font-black animate-shimmer"
              style={{ fontSize: 'clamp(3.5rem, 10vw, 8rem)' }}>
              Journalism
            </span>
            <span className="block text-white font-light mt-3"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', fontStyle: 'italic', opacity: 0.5 }}>
              is Automated
            </span>
          </h1>

          {/* Typewriter */}
          <div className="font-body flex items-center justify-center gap-3 my-8">
            <span className="text-slate-500 text-xl">Generate</span>
            <span className="text-xl md:text-2xl font-medium text-blue-300"
              style={{ minWidth: '260px', textAlign: 'left', display: 'inline-block' }}>
              {displayed}
              <span className="cursor-blink inline-block w-0.5 h-6 bg-blue-400 ml-1 align-middle"></span>
            </span>
          </div>

          <p className="font-body text-slate-400 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            From raw facts to publish-ready articles in under 10 seconds.
            16 professional journalism features. Zero compromise.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap mb-12">
            {userLoading ? (
              <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Link to={user ? "/editor" : "/signup"}
                  className="btn-gold inline-flex items-center gap-3 px-10 py-4 rounded-xl text-lg font-display animate-glow">
                  {user ? "Go to Editor →" : "Start Writing Free →"}
                </Link>
                {!user && (
                  <Link to="/login"
                    className="font-body inline-flex items-center px-8 py-4 rounded-xl text-lg text-slate-400 hover:text-white transition-all duration-300"
                    style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                    Login
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Stats */}
          <div className="inline-flex items-center gap-8 flex-wrap justify-center px-10 py-5 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)'
            }}>
            {[
              { value: '16', label: 'AI Features' },
              { value: '< 10s', label: 'Draft Speed' },
              { value: '3', label: 'Fact APIs' },
              { value: 'GPT-4o', label: 'Engine' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-2xl font-black" style={{ color: '#c9a84c' }}>{stat.value}</div>
                <div className="font-body text-slate-600 text-xs uppercase tracking-widest mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #040810)', zIndex: 5 }}>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="overflow-hidden py-4"
        style={{
          borderTop: '1px solid rgba(201,168,76,0.08)',
          borderBottom: '1px solid rgba(201,168,76,0.08)',
          background: 'rgba(201,168,76,0.015)'
        }}>
        <div className="flex gap-10 whitespace-nowrap font-body"
          style={{ animation: 'marquee 25s linear infinite' }}>
          {[...Array(2)].map((_, rep) => (
            ['📝 Draft from Facts', '⚖️ Bias Detector', '🔍 Real Fact Checking', '🎨 7 Tone Styles',
              '📱 Social Media Pack', '🖼️ Image Injection', '🚀 Engagement Prediction',
              '🌡️ Tone Analyser', '📋 Plagiarism Check', '🔎 SEO Optimizer',
              '📡 Trend Radar', '📥 PDF Export'].map((item, i) => (
              <span key={`${rep}-${i}`} className="text-sm font-medium"
                style={{ color: 'rgba(201,168,76,0.4)' }}>
                {item}
                <span className="mx-6 opacity-20">◆</span>
              </span>
            ))
          ))}
        </div>
      </div>

      {/* ── IMAGE GALLERY ── */}
      <section
        id="gallery"
        ref={setRef('gallery')}
        className={`py-28 px-6 reveal ${visibleSections.gallery ? 'visible' : ''}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-body text-xs font-bold uppercase tracking-[0.3em] mb-3"
              style={{ color: '#c9a84c' }}>
              Newsroom Intelligence
            </p>
            <h2 className="font-display text-5xl md:text-6xl font-black text-white mb-4">
              Every Story. Every Format.
            </h2>
            <p className="font-body text-slate-500 text-lg max-w-xl mx-auto">
              From breaking news to in-depth features — your AI newsroom handles it all.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="col-span-2 relative overflow-hidden rounded-2xl group" style={{ height: '340px' }}>
              <img src={UNSPLASH_IMAGES[0]} alt="newsroom"
                className="w-full h-full object-cover image-card group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 rounded-2xl"
                style={{ background: 'linear-gradient(to top, rgba(4,8,16,0.9), rgba(4,8,16,0.2) 60%, transparent)' }}>
              </div>
              <div className="absolute bottom-6 left-6">
                <span className="font-body text-xs px-3 py-1.5 rounded-full text-red-400 font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  ● Breaking News
                </span>
                <p className="font-display text-white text-2xl font-bold mt-2">AI-Generated in 8 seconds</p>
                <p className="font-body text-slate-400 text-sm mt-1">From 5 bullet points to a full article</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="relative overflow-hidden rounded-2xl flex-1 group">
                <img src={UNSPLASH_IMAGES[1]} alt="news"
                  className="w-full h-full object-cover image-card group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 rounded-2xl"
                  style={{ background: 'linear-gradient(to top, rgba(4,8,16,0.85), transparent 60%)' }}>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="font-body text-xs px-2.5 py-1 rounded-full text-blue-400 font-bold"
                    style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                    Feature Story
                  </span>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl flex-1 group">
                <img src={UNSPLASH_IMAGES[2]} alt="news"
                  className="w-full h-full object-cover image-card group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 rounded-2xl"
                  style={{ background: 'linear-gradient(to top, rgba(4,8,16,0.85), transparent 60%)' }}>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="font-body text-xs px-2.5 py-1 rounded-full font-bold"
                    style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c' }}>
                    Opinion Piece
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { url: UNSPLASH_IMAGES[3], label: 'Press Release' },
              { url: UNSPLASH_IMAGES[4], label: 'Investigative' },
              { url: UNSPLASH_IMAGES[5], label: 'Interview' },
            ].map((item, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl group" style={{ height: '200px' }}>
                <img src={item.url} alt="news"
                  className="w-full h-full object-cover image-card group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 rounded-2xl"
                  style={{ background: 'linear-gradient(to top, rgba(4,8,16,0.75), transparent 60%)' }}>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="font-body text-xs px-2.5 py-1 rounded-full font-medium text-slate-300"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how"
        ref={setRef('how')}
        className={`py-28 px-6 reveal ${visibleSections.how ? 'visible' : ''}`}
        style={{ background: 'radial-gradient(ellipse at center, #060f20 0%, #040810 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="font-body text-xs font-bold uppercase tracking-[0.3em] mb-4"
              style={{ color: '#c9a84c' }}>
              The Process
            </p>
            <h2 className="font-display text-5xl md:text-6xl font-black text-white mb-4">
              Four Steps. Ten Seconds.
            </h2>
            <p className="font-body text-slate-500 text-lg">
              Simple enough for any journalist. Powerful enough for any newsroom.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-14 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.2), rgba(59,130,246,0.2), transparent)' }}>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: '01', title: 'Enter Facts', desc: 'Paste bullet points or raw facts about your story', icon: '📋', color: '#c9a84c' },
                { step: '02', title: 'Choose Style', desc: 'Select tone, article style and size', icon: '🎨', color: '#3b82f6' },
                { step: '03', title: 'AI Writes', desc: 'GPT-4o drafts a complete article in seconds', icon: '⚡', color: '#c9a84c' },
                { step: '04', title: 'Analyse', desc: '16 features run automatically on your draft', icon: '🚀', color: '#3b82f6' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6 mx-auto"
                    style={{
                      background: `linear-gradient(135deg, ${s.color}10, ${s.color}20)`,
                      border: `1px solid ${s.color}25`,
                      boxShadow: `0 0 40px ${s.color}15`
                    }}>
                    <span className="text-3xl">{s.icon}</span>
                    <span className="absolute -top-3 -right-3 font-display font-black text-xs w-7 h-7 flex items-center justify-center rounded-full"
                      style={{ background: s.color, color: '#040810' }}>
                      {s.step}
                    </span>
                  </div>
                  <h3 className="font-display text-white font-bold text-xl mb-3">{s.title}</h3>
                  <p className="font-body text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        id="features"
        ref={setRef('features')}
        className={`py-28 px-6 reveal ${visibleSections.features ? 'visible' : ''}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-body text-xs font-bold uppercase tracking-[0.3em] mb-4"
              style={{ color: '#c9a84c' }}>
              Features
            </p>
            <h2 className="font-display text-5xl md:text-6xl font-black text-white mb-4">
              Everything You Need.
              <br />
              <span className="animate-shimmer">Nothing You Don't.</span>
            </h2>
            <p className="font-body text-slate-500 text-lg">16 AI-powered features in one seamless newsroom.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={i} className="card-hover rounded-2xl p-6 cursor-default"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-display text-white font-bold text-sm mb-2">{f.title}</h3>
                <p className="font-body text-slate-600 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section
        id="tech"
        ref={setRef('tech')}
        className={`py-16 px-6 reveal ${visibleSections.tech ? 'visible' : ''}`}
        style={{
          borderTop: '1px solid rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.03)',
          background: 'rgba(255,255,255,0.01)'
        }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-body text-slate-700 text-xs uppercase font-bold tracking-[0.3em] mb-8">
            Built with industry-grade technology
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { name: 'GPT-4o', c: '#22c55e' },
              { name: 'FastAPI', c: '#3b82f6' },
              { name: 'React + Vite', c: '#06b6d4' },
              { name: 'LiteLLM', c: '#a855f7' },
              { name: 'Supabase', c: '#22c55e' },
              { name: 'Unsplash API', c: '#c9a84c' },
              { name: 'NewsAPI', c: '#f97316' },
              { name: 'Wikipedia API', c: '#94a3b8' },
              { name: 'Google Fact Check', c: '#facc15' },
              { name: 'Tailwind CSS', c: '#06b6d4' },
            ].map((tech, i) => (
              <span key={i}
                className="font-body text-sm px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 cursor-default"
                style={{
                  color: tech.c,
                  background: `${tech.c}0d`,
                  border: `1px solid ${tech.c}20`
                }}>
                {tech.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        id="cta"
        ref={setRef('cta')}
        className={`py-40 px-6 relative overflow-hidden reveal ${visibleSections.cta ? 'visible' : ''}`}>

        <div className="absolute inset-0">
          <img src={UNSPLASH_IMAGES[4]} alt="bg"
            className="w-full h-full object-cover opacity-5"
            style={{ filter: 'blur(4px)', transform: `translateY(${scrollY * 0.08}px)` }} />
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center, #071428 0%, #040810 70%)' }}>
          </div>
        </div>

        {/* Pulse rings */}
        <div className="absolute rounded-full pointer-events-none"
          style={{
            top: '50%', left: '50%',
            width: '500px', height: '500px',
            marginTop: '-250px', marginLeft: '-250px',
            border: '1px solid rgba(201,168,76,0.08)',
            animation: 'pulseRing 4s ease-out infinite',
            zIndex: 1
          }}>
        </div>
        <div className="absolute rounded-full pointer-events-none"
          style={{
            top: '50%', left: '50%',
            width: '340px', height: '340px',
            marginTop: '-170px', marginLeft: '-170px',
            border: '1px solid rgba(201,168,76,0.12)',
            animation: 'pulseRing 4s ease-out infinite',
            animationDelay: '1.3s',
            zIndex: 1
          }}>
        </div>
        <div className="absolute rounded-full pointer-events-none"
          style={{
            top: '50%', left: '50%',
            width: '180px', height: '180px',
            marginTop: '-90px', marginLeft: '-90px',
            border: '1px solid rgba(201,168,76,0.18)',
            animation: 'pulseRing 4s ease-out infinite',
            animationDelay: '2.6s',
            zIndex: 1
          }}>
        </div>

        <div className="max-w-4xl mx-auto text-center relative" style={{ zIndex: 10 }}>
          <p className="font-body text-xs font-bold uppercase tracking-[0.3em] mb-6"
            style={{ color: '#c9a84c' }}>
            Start Today
          </p>
          <h2 className="font-display font-black mb-6 leading-tight">
            <span className="block text-white"
              style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}>
              Write Faster.
            </span>
            <span className="block animate-shimmer"
              style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}>
              Publish Smarter.
            </span>
          </h2>
          <p className="font-body text-slate-500 text-xl mb-12 max-w-xl mx-auto leading-relaxed">
            Join journalists who use AI to 10x their drafting speed.
            Free forever. No credit card required.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap mb-8">
            {!userLoading && (
              <>
                <Link to={user ? "/editor" : "/signup"}
                  className="btn-gold inline-flex items-center gap-3 px-14 py-5 rounded-xl text-xl font-display animate-glow">
                  {user ? "Go to Editor →" : "Get Started Free →"}
                </Link>
                {!user && (
                  <Link to="/login"
                    className="font-body px-10 py-5 rounded-xl text-lg text-slate-400 hover:text-white transition-all duration-300 inline-flex items-center"
                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                    Login
                  </Link>
                )}
              </>
            )}
          </div>

          <p className="font-body text-slate-700 text-sm">
            {user ? "Welcome back — ready to write?" : "Sign up in 30 seconds · Free forever · No credit card"}
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #b8860b, #f5d78e)' }}>
              <span className="font-display font-black" style={{ color: '#040810' }}>N</span>
            </div>
            <div>
              <p className="font-display text-white font-bold">NewsDraft AI</p>
              <p className="font-body text-slate-700 text-xs">Journalist Automated News Draft Generator</p>
            </div>
          </div>
          <p className="font-body text-slate-700 text-sm">© 2026 NewsDraft AI. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/login" className="font-body text-slate-600 hover:text-slate-300 text-sm transition-colors">Login</Link>
            <Link to="/signup" className="font-body text-slate-600 hover:text-slate-300 text-sm transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}