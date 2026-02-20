import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { getSupabase } from "@/lib/supabaseClient";

export default function AuthPage() {
	const router = useRouter();
	const supabase = getSupabase();
	
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [mode, setMode] = useState("login"); // "login" or "register"

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		
		if (!email || !password) {
			setError("Please enter both email and password.");
			return;
		}

		if (password.length < 6 && mode === "register") {
			setError("Password must be at least 6 characters long.");
			return;
		}

		setLoading(true);

		try {
			let result;
			
			if (mode === "login") {
				// Sign in existing user
				result = await supabase.auth.signInWithPassword({
					email,
					password,
				});
			} else {
				// Sign up new user
				result = await supabase.auth.signUp({
					email,
					password,
					options: {
						emailRedirectTo: `${window.location.origin}/dashboard`,
					},
				});
			}

			const { data, error } = result;

			if (error) {
				// Handle specific error cases
				if (error.message.includes("Invalid login credentials")) {
					throw new Error("Invalid email or password.");
				} else if (error.message.includes("Email rate limit")) {
					throw new Error("Too many attempts. Please try again later.");
				} else if (error.message.includes("User already registered")) {
					throw new Error("This email is already registered. Please sign in instead.");
				} else {
					throw error;
				}
			}

			if (mode === "register") {
				// Check if user needs email confirmation
				if (data?.user?.identities?.length === 0) {
					setError("This email is already registered. Please sign in instead.");
				} else {
					// Show success message for registration
					setError("Registration successful! You can now sign in.");
					setMode("login");
					setPassword("");
				}
			} else {
				// Login successful - redirect to dashboard
				router.push("/dashboard");
			}
			
		} catch (error) {
			console.error("Auth error:", error);
			setError(error.message || "An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const toggleMode = () => {
		setMode(mode === "login" ? "register" : "login");
		setError("");
		setPassword("");
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
			<Head>
				<title>{mode === "login" ? "Login" : "Register"} — JobSearch Engine</title>
			</Head>

			<div className="absolute inset-0 overflow-hidden">
				<svg className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 opacity-10" width="800" height="600" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
					<defs>
						<linearGradient id="g1" x1="0" x2="1">
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
						<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">JobSearch Engine</h1>
						<p className="text-sm text-gray-600 dark:text-gray-300">
							{mode === "login" ? "Sign in to manage your jobs and applications" : "Create an account to get started"}
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-black/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
								placeholder="you@example.com"
								disabled={loading}
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-black/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
								placeholder={mode === "login" ? "••••••••" : "Minimum 6 characters"}
								disabled={loading}
							/>
							{mode === "register" && (
								<p className="mt-1 text-xs text-gray-500">
									Password must be at least 6 characters
								</p>
							)}
						</div>

						{error && (
							<div className={`p-3 rounded-lg text-sm ${
								error.includes("successful") 
									? "bg-green-50 text-green-700 border border-green-200" 
									: "bg-red-50 text-red-600 border border-red-200"
							}`}>
								{error}
							</div>
						)}

						<div className="flex items-center justify-between">
							<button
								type="button"
								onClick={toggleMode}
								className="text-sm text-blue-600 hover:underline focus:outline-none"
								disabled={loading}
							>
								{mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
							</button>
							<button
								type="submit"
								className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={loading}
							>
								{loading ? (
									<>
										<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Processing...
									</>
								) : (
									mode === "login" ? "Sign in" : "Create Account"
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}