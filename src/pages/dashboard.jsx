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

      // Fetch any existing applications for these jobs by this user
      const jobIds = data.map((m) => m.job_id).filter(Boolean);
      let apps = [];
      if (jobIds.length > 0) {
        const { data: appsData, error: appsError } = await supabase
          .from("applications")
          .select("*")
          .in("job_id", jobIds)
          .eq("user_id", user.id);

        if (appsError) {
          console.error("Application fetch error:", appsError);
        } else if (appsData) {
          apps = appsData;
        }
      }

      const appMap = apps.reduce((acc, a) => {
        acc[a.job_id] = a;
        return acc;
      }, {});

      const transformedJobs = data.map((match) => {
        const jobRow = match.jobs || {};
        const application = appMap[match.job_id];

        // derive status from applications table when present
        let status = match.status || "suggested";
        let appliedDate = undefined;
        if (application) {
          if (application.status === "success") status = "applied";
          else if (application.status === "failed") status = "failed";
          else if (application.status === "pending") status = "pending";

          appliedDate = application.applied_at
            ? application.applied_at.split("T")[0]
            : undefined;
        }

        return {
          id: match.job_id,
          title: jobRow.title || "Unknown Title",
          company: jobRow.company || "Unknown Company",
          location: jobRow.location || "Location not specified",
          salary: jobRow.salary || "Salary not specified",
          type: jobRow.type || "Full-time",
          postedDate:
            jobRow.created_at?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          description: jobRow.description || "",
          requirements: jobRow.requirements
            ? Array.isArray(jobRow.requirements)
              ? jobRow.requirements
              : jobRow.requirements.split("\n")
            : [],
          status,
          appliedDate,
          matchScore: match.match_score,
          reason: match.reason,
          source: jobRow.source || "Job Board",
          apply_email: jobRow.apply_email,
          website: jobRow.website,
        };
      });

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

  // ---------------- STATUS HELPERS ----------------
  const getStatusIcon = (status) => {
    switch (status) {
      case "applied":
        return <CheckCircle2 size={16} />;
      case "pending":
        return <Clock size={16} />;
      case "failed":
        return <AlertCircle size={16} />;
      default:
        return <Settings size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "applied":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<BarChart3 />} label="Total" value={stats.total} />
          <StatCard icon={<CheckCircle2 />} label="Applied" value={stats.applied} />
          <StatCard icon={<Clock />} label="Pending" value={stats.pending} />
          <StatCard icon={<AlertCircle />} label="Failed" value={stats.failed} />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 flex gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border text-gray-800 rounded px-3 py-2"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 border text-gray-800 py-2"
          >
            <option value="all">All</option>
            
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
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
            />
          ))
        )}
      </div>

      {selectedJob && (
        <JobModal
          job={selectedJob}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
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
