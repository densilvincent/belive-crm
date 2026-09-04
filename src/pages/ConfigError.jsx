import logo from '../assets/belive-logo.png'

export default function ConfigError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bggray-light px-4">
      <div className="w-full max-w-sm text-center">
        <img src={logo} alt="Belive Holidays" className="h-16 w-16 rounded-full object-cover shadow-sm mb-4 mx-auto" />
        <h1 className="font-display font-bold text-lg text-gray-800 mb-2">Setup needed</h1>
        <p className="text-sm text-gray-500 mb-4">
          This deployment is missing its Supabase connection details. Add these two environment
          variables in your hosting provider's project settings, then redeploy:
        </p>
        <div className="card text-left text-xs font-mono text-gray-600 space-y-1 break-all">
          <p>VITE_SUPABASE_URL</p>
          <p>VITE_SUPABASE_ANON_KEY</p>
        </div>
        <p className="text-xs text-gray-400 mt-4">See .env.example in the repo for where to find these values.</p>
      </div>
    </div>
  )
}
