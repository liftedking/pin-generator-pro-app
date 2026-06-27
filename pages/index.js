import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { error } = router.query;

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading]);

  const errorMessages = {
    pinterest_denied: "Pinterest login was cancelled. Please try again.",
    auth_failed: "Authentication failed. Please try again.",
  };

  return (
    <>
      <Head>
        <title>Pin Generator Pro</title>
        <meta name="description" content="Automate your Pinterest publishing" />
      </Head>

      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Pin Generator <span className="text-brand-400">Pro</span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Automate your Pinterest publishing
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 w-full max-w-lg">
          {[
            { icon: "⚡", label: "Auto-generate pins" },
            { icon: "🗓️", label: "Schedule publishing" },
            { icon: "🤖", label: "AI descriptions" },
          ].map((f) => (
            <div key={f.label} className="card text-center py-3">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-sm text-gray-300">{f.label}</div>
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && errorMessages[error] && (
          <div className="mb-4 w-full max-w-sm bg-red-900/40 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">
            {errorMessages[error]}
          </div>
        )}

        {/* Login button */}
        <a
          href="/api/auth/pinterest/login"
          className="flex items-center gap-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-150 text-lg"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
          </svg>
          Continue with Pinterest
        </a>

        <p className="text-gray-600 text-xs mt-6 text-center max-w-xs">
          This app is for personal use. Your Pinterest account is used to publish pins on your behalf.
        </p>
      </div>
    </>
  );
}
