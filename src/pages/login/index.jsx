import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function AuthPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		if (!email || !password) {
			setError("Please enter both email and password.");
			return;
		}

		setLoading(true);
		// Mock login: replace with real auth call
		setTimeout(() => {
			setLoading(false);
			router.push("/dashboard");
		}, 800);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
			<Head>
				<title>Login — JobSearch Engine</title>
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
						<p className="text-sm text-gray-600 dark:text-gray-300">Sign in to manage your jobs and applications</p>
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
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-black/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
								placeholder="••••••••"
							/>
						</div>

						{error && <p className="text-sm text-red-600">{error}</p>}

						<div className="flex items-center justify-between">
							<div className="text-sm">
								<Link href="/" className="text-blue-600 hover:underline">
									Register
								</Link>
							</div>
							<button
								type="submit"
								className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
								disabled={loading}
							>
								{loading ? "Signing in..." : "Sign in"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
