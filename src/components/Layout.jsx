import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Briefcase, Settings, User, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // 🔥 AUTH CONTEXT
  const { user, profile, signOut, authLoading } = useAuth();

  // ⛔ Prevent dashboard render while checking session
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 text-lg">Loading session...</p>
      </div>
    );
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Briefcase },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Avatar initial
  const userInitial = (
    profile?.full_name ||
    user?.email ||
    "U"
  )[0].toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <h1 className="ml-2 text-xl font-bold text-gray-900">
              JobSearch Engine
            </h1>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = router.pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`${
                            isActive
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                          } group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold`}
                        >
                          <item.icon className="h-6 w-6 shrink-0" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50 bg-gray-900/80" />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <h1 className="ml-2 text-xl font-bold text-gray-900">
                  JobSearch Engine
                </h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => {
                      const isActive = router.pathname === item.href;
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`${
                              isActive
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                            } group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold`}
                          >
                            <item.icon className="h-6 w-6 shrink-0" />
                            {item.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Sticky header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  {userInitial}
                </div>

                {/* Name */}
                <span className="hidden lg:flex lg:items-center">
                  <span className="ml-2 text-sm font-semibold leading-6 text-gray-900">
                    {profile?.full_name || user?.email}
                  </span>
                </span>

                {/* Logout */}
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 ml-4"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
