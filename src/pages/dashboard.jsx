import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/Layout";
import JobCard from "@/components/JobCard";
import JobModal from "@/components/JobModal";
import {
  Search,
  Download,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Settings,
  X,
} from "lucide-react";
import { getSupabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const router = useRouter();
  const { user, profile, authLoading, isAuthenticated } = useAuth();
  const supabase = getSupabase();

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dataLoading, setDataLoading] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    pending: 0,
    failed: 0,
    discovered: 0,
  });

  console.log("Dashboard render:", { user, authLoading });

  // ---------------- AUTH GUARD ----------------
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log("Not authenticated → redirecting");
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated]);

  // ---------------- ONBOARDING CHECK ----------------
  useEffect(() => {
    if (router.query.onboarding === "complete") {
      setShowWelcomeModal(true);
      router.replace("/dashboard", undefined, { shallow: true });
    }
  }, [router.query]);

  // ---------------- FETCH MATCHES ----------------
  useEffect(() => {
    if (!user) return;
    fetchMatches();
  }, [user]);

  const fetchMatches = async () => {
    if (!user) return;

    console.log("Fetching matches for:", user.id);
    setDataLoading(true);

    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`*, jobs (*)`)
        .eq("user_id", user.id)
        .order("match_score", { ascending: false });

      console.log("Matches response:", { data, error });

      if (error) {
        console.error("Match fetch error:", error);
        setDataLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        loadMockData();
        return;
      }

      const transformedJobs = data.map((match) => ({
        id: match.job_id,
        title: match.jobs?.title || "Unknown Title",
        company: match.jobs?.company || "Unknown Company",
        location: match.jobs?.location || "Location not specified",
        salary: match.jobs?.salary || "Salary not specified",
        type: match.jobs?.type || "Full-time",
        postedDate:
          match.jobs?.created_at?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        description: match.jobs?.description || "",
        requirements: match.jobs?.requirements
          ? Array.isArray(match.jobs.requirements)
            ? match.jobs.requirements
            : match.jobs.requirements.split("\n")
          : [],
        status: match.status || "discovered",
        appliedDate: match.applied_at?.split("T")[0],
        matchScore: match.match_score,
        reason: match.reason,
        source: match.jobs?.source || "Job Board",
        apply_email: match.jobs?.apply_email,
        website: match.jobs?.website,
      }));

      setJobs(transformedJobs);
      setFilteredJobs(transformedJobs);
      calculateStats(transformedJobs);
    } catch (err) {
      console.error("Unexpected match error:", err);
    } finally {
      setDataLoading(false);
    }
  };

  // ---------------- REALTIME ----------------
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("matches_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          console.log("Realtime update received");
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ---------------- MOCK DATA ----------------
  const loadMockData = () => {
    console.log("Loading mock data");
    const mockJobs = [];
    setJobs(mockJobs);
    setFilteredJobs(mockJobs);
    calculateStats(mockJobs);
    setDataLoading(false);
  };

  const calculateStats = (jobsData) => {
    const newStats = {
      total: jobsData.length,
      applied: jobsData.filter((j) => j.status === "applied").length,
      pending: jobsData.filter((j) => j.status === "pending").length,
      failed: jobsData.filter((j) => j.status === "failed").length,
      discovered: jobsData.filter((j) => j.status === "discovered").length,
    };
    setStats(newStats);
  };

  // ---------------- FILTER ----------------
  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    setFilteredJobs(filtered);
  }, [searchTerm, statusFilter, jobs]);

  // ---------------- LOADING STATE ----------------
  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  // ---------------- UI ----------------
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Job Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {profile?.full_name || user.email}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={<BarChart3 />} label="Total" value={stats.total} />
          <StatCard icon={<CheckCircle2 />} label="Applied" value={stats.applied} />
          <StatCard icon={<Clock />} label="Pending" value={stats.pending} />
          <StatCard icon={<AlertCircle />} label="Failed" value={stats.failed} />
          <StatCard icon={<Settings />} label="Ready" value={stats.discovered} />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 flex gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="all">All</option>
            <option value="discovered">Ready</option>
            <option value="pending">Pending</option>
            <option value="applied">Applied</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Jobs */}
        {dataLoading ? (
          <div className="text-center py-10">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No jobs found.
          </div>
        ) : (
          filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onClick={() => {
                setSelectedJob(job);
                setIsModalOpen(true);
              }}
            />
          ))
        )}
      </div>

      {selectedJob && (
        <JobModal
          job={selectedJob}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </Layout>
  );
}

// Small reusable stat card
function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
      <div className="text-blue-600">{icon}</div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
