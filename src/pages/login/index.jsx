import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { AlertCircle } from "lucide-react";
import { getSupabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (loading) return;

  console.log("==== LOGIN START ====");
  console.log("Email:", email);

  setError(null);
  setLoading(true);

  try {
    const supabase = getSupabase();
    console.log("Supabase instance:", supabase);

    console.log("Calling signInWithPassword...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    console.log("signInWithPassword response:", { data, error });

    if (error) {
      console.log("Login error from Supabase:", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    console.log("Session after login:", data?.session);

    const { data: sessionCheck } = await supabase.auth.getSession();
    console.log("Session from getSession():", sessionCheck);

    console.log("Redirecting to dashboard...");
    router.replace("/dashboard");

  } catch (err) {
    console.error("Caught error:", err);
    setError(err?.message || "Login failed");
  } finally {
    console.log("==== LOGIN END ====");
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Head>
        <title>Login — JobSearch Engine</title>
      </Head>

      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 opacity-10"
          width="800"
          height="600"
          viewBox="0 0 800 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#C7B8F5" />
            </linearGradient>
          </defs>
          <circle cx="400" cy="200" r="220" fill="url(#g1)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-md border border-gray-100 dark:border-gray-800 rounded-2xl shadow-lg p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              JobSearch Engine
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Sign in to manage your jobs and applications
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-black/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="you@example.com"
                disabled={loading}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-black/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
                required
              />
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}