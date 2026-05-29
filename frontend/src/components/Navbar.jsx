import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-white font-bold text-xl">
            NewsDraft <span className="text-blue-400">AI</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6">
          <Link to="/"
            className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
            Home
          </Link>

          {user && (
  <>
    <Link to="/editor"
      className={`text-sm font-medium transition-colors ${location.pathname === '/editor' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
      Editor
    </Link>
    <Link to="/history"
      className={`text-sm font-medium transition-colors ${location.pathname === '/history' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
      History
    </Link>
  </>
)}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-xs truncate max-w-32">{user.email}</span>
              <button onClick={handleLogout}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login"
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                Login
              </Link>
              <Link to="/signup"
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                Sign Up Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}