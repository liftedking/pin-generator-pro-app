import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/logs", label: "Activity Log" },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                </svg>
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                Pin Generator <span className="text-brand-400">Pro</span>
              </span>
            </Link>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    router.pathname.startsWith(link.href)
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* User menu */}
            {user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {user.profileImage && (
                    <img
                      src={user.profileImage}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full border border-gray-700"
                    />
                  )}
                  <span className="text-sm text-gray-300 hidden sm:block">
                    {user.displayName || user.username}
                  </span>
                </div>
                <button onClick={logout} className="btn-ghost text-sm">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {title && (
          <div className="mb-6">
            <h1 className="page-title">{title}</h1>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
