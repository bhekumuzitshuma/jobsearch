import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getSupabase } from "../lib/supabaseClient";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const supabase = getSupabase();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // IMPORTANT:
  // authLoading = checking session
  // profileLoading = loading user data
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  console.log("AuthProvider render:", { user, authLoading, profileLoading });

  // ---------- INITIAL SESSION ----------
  useEffect(() => {
    console.log("AuthProvider mounted");

    const init = async () => {
      try {
        console.log("Getting initial session...");

        const { data, error } = await supabase.auth.getSession();

        console.log("getSession result:", { data, error });

        const session = data?.session;

        if (session?.user) {
          console.log("Initial user found:", session.user.id);
          setUser(session.user);

          // DO NOT AWAIT PROFILE
          fetchProfile(session.user.id);
        } else {
          console.log("No existing session");
        }
      } catch (err) {
        console.error("Initial session error:", err);
      } finally {
        console.log("Auth check finished");
        setAuthLoading(false);
      }
    };

    init();

    // ---------- AUTH STATE LISTENER ----------
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change:", event, session);

        if (session?.user) {
          console.log("User logged in:", session.user.id);

          setUser(session.user);
          fetchProfile(session.user.id);
        } else {
          console.log("User logged out");

          setUser(null);
          setProfile(null);
        }

        setAuthLoading(false);
      }
    );

    return () => {
      console.log("Unsubscribing auth listener");
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // ---------- PROFILE FETCH ----------
  const fetchProfile = async (userId) => {
    if (!userId) return;

    console.log("Fetching profile for:", userId);
    setProfileLoading(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(); // IMPORTANT: not .single()

      console.log("Profile query response:", { data, error });

      if (error) {
        console.error("Profile fetch error (likely RLS):", error);
        setProfile(null);
        return;
      }

      if (!data) {
        console.log("No profile row yet (this is OK)");
        setProfile(null);
        return;
      }

      setProfile(data);
    } catch (err) {
      console.error("Unexpected profile error:", err);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // ---------- SIGN OUT ----------
  const signOut = async () => {
    console.log("Signing out...");

    try {
      await supabase.auth.signOut();

      setUser(null);
      setProfile(null);

      router.replace("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // ---------- REFRESH PROFILE ----------
  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user.id);
  };

  const value = {
    user,
    profile,

    // IMPORTANT: dashboard should only care about authLoading
    authLoading,
    profileLoading,

    isAuthenticated: !!user,

    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
