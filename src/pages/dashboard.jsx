import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../components/Layout";
import JobCard from "../components/JobCard";
import JobModal from "../components/JobModal";
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
import { getSupabase } from "../lib/supabaseClient";

export default function Dashboard() {
  const router = useRouter();
  const supabase = getSupabase();

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    pending: 0,
    failed: 0,
    discovered: 0,
  });

  // Check if user just completed onboarding
  useEffect(() => {
    if (router.query.onboarding === "complete") {
      setShowWelcomeModal(true);
      // Remove the query parameter without refreshing
      router.replace("/dashboard", undefined, { shallow: true });
    }
  }, [router.query]);

  // Check authentication and load data
  useEffect(() => {
    checkUser();

    // Subscribe to realtime updates for matches
    const matchesSubscription = supabase
      .channel("matches_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          fetchMatches();
        },
      )
      .subscribe();

    return () => {
      matchesSubscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to onboarding if not logged in
        router.push("/onboarding");
        return;
      }

      setUser(user);
      await fetchProfile(user.id);
      await fetchMatches();
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/onboarding");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data);
  };

  const fetchMatches = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("matches")
      .select(
        `
        *,
        jobs (*)
      `,
      )
      .eq("user_id", user.id)
      .order("match_score", { ascending: false });

    if (data && data.length > 0) {
      // Transform matches to match your job card format
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
        description: match.jobs?.description || "No description available",
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
    } else {
      // If no matches yet, use mock data for demo
      loadMockData();
    }
  };

  const loadMockData = () => {
    const mockJobs = [
      {
        id: "1",
        title: "Senior Software Engineer",
        company: "TechCorp Zimbabwe",
        location: "Harare, Zimbabwe",
        salary: "$3,000 - $5,000",
        type: "Full-time",
        postedDate: "2024-01-15",
        description:
          "We are looking for an experienced software engineer to join our team. The ideal candidate will have strong backend development skills and experience with cloud technologies.",
        requirements: [
          "5+ years experience",
          "JavaScript",
          "React",
          "Node.js",
          "AWS",
        ],
        status: "applied",
        appliedDate: "2024-01-16",
        matchScore: 95,
        source: "LinkedIn",
      },
      {
        id: "2",
        title: "Frontend Developer",
        company: "Digital Solutions Ltd",
        location: "Remote",
        salary: "$2,500 - $4,000",
        type: "Full-time",
        postedDate: "2024-01-14",
        description:
          "Join our frontend team to build amazing user experiences using modern technologies like React and TypeScript.",
        requirements: [
          "3+ years experience",
          "TypeScript",
          "React",
          "CSS",
          "Responsive Design",
        ],
        status: "discovered",
        matchScore: 88,
        source: "Company Website",
      },
      {
        id: "3",
        title: "Full Stack Developer",
        company: "Innovate Africa",
        location: "Bulawayo, Zimbabwe",
        salary: "$2,800 - $4,500",
        type: "Contract",
        postedDate: "2024-01-13",
        description:
          "We need a full stack developer for our growing startup. You will work on both frontend and backend systems.",
        requirements: [
          "4+ years experience",
          "Python",
          "Django",
          "React",
          "PostgreSQL",
        ],
        status: "pending",
        appliedDate: "2024-01-14",
        matchScore: 76,
        source: "Indeed",
      },
      {
        id: "4",
        title: "DevOps Engineer",
        company: "Cloud Systems ZW",
        location: "Harare, Zimbabwe",
        salary: "$3,500 - $5,500",
        type: "Full-time",
        postedDate: "2024-01-12",
        description:
          "Looking for DevOps engineer to manage our cloud infrastructure and implement CI/CD pipelines.",
        requirements: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform"],
        status: "failed",
        appliedDate: "2024-01-13",
        matchScore: 65,
        source: "Company Website",
      },
      {
        id: "5",
        title: "Mobile App Developer",
        company: "AppWorks Studio",
        location: "Remote",
        salary: "$2,000 - $3,500",
        type: "Part-time",
        postedDate: "2024-01-11",
        description:
          "Develop cross-platform mobile applications using React Native for various client projects.",
        requirements: [
          "React Native",
          "JavaScript",
          "iOS/Android",
          "REST APIs",
        ],
        status: "discovered",
        matchScore: 92,
        source: "LinkedIn",
      },
    ];

    setJobs(mockJobs);
    setFilteredJobs(mockJobs);
    calculateStats(mockJobs);
  };

  const calculateStats = (jobsData) => {
    const stats = {
      total: jobsData.length,
      applied: jobsData.filter((job) => job.status === "applied").length,
      pending: jobsData.filter((job) => job.status === "pending").length,
      failed: jobsData.filter((job) => job.status === "failed").length,
      discovered: jobsData.filter((job) => job.status === "discovered").length,
    };
    setStats(stats);
  };

  // Filter jobs based on search and status
  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.location?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    setFilteredJobs(filtered);
  }, [searchTerm, statusFilter, jobs]);

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleApply = async (jobId) => {
    // Update local state immediately for UI feedback
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: "pending",
              appliedDate: new Date().toISOString().split("T")[0],
            }
          : job,
      ),
    );

    // Update stats
    setStats((prev) => ({
      ...prev,
      pending: prev.pending + 1,
      discovered: prev.discovered - 1,
    }));

    // If user is logged in, create application record and task
    if (user) {
      try {
        // First, get the CV
        const { data: cvs } = await supabase
          .from("cvs")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (cvs && cvs.length > 0) {
          // Create application record
          await supabase.from("applications").insert({
            user_id: user.id,
            cv_id: cvs[0].id,
            job_id: jobId,
            status: "pending",
          });

          // Create task for generating application
          await supabase.from("tasks").insert({
            type: "generate_application",
            payload: {
              job_id: jobId,
              user_id: user.id,
              cv_id: cvs[0].id,
            },
            status: "pending",
          });
        }
      } catch (error) {
        console.error("Error creating application:", error);
      }
    }

    setIsModalOpen(false);
  };

  const handleExportReport = () => {
    // Create CSV content
    const headers = [
      "Title",
      "Company",
      "Location",
      "Status",
      "Match Score",
      "Applied Date",
      "Source",
    ];
    const csvContent = [
      headers.join(","),
      ...jobs.map((job) =>
        [
          `"${job.title}"`,
          `"${job.company}"`,
          `"${job.location}"`,
          job.status,
          job.matchScore,
          job.appliedDate || "",
          `"${job.source}"`,
        ].join(","),
      ),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-applications-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "applied":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-2 h-2 bg-blue-600 rounded-full"></div>;
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Modal for First-Time Users */}
        {showWelcomeModal && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-fade-in">
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome to AI Job Agent!
                </h2>
                <p className="text-gray-600">
                  Your account has been successfully created.
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Complete Your Setup
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Configure your job preferences, desired roles, and
                      application settings to get the best matches.
                    </p>
                    <Link
                      href="/settings"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Go to Settings
                      <Settings className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Dashboard</h1>
            <p className="text-gray-600">
              {user
                ? `Welcome back, ${profile?.full_name || user.email}`
                : "Monitor your automated job applications"}
            </p>
          </div>
          <button
            onClick={handleExportReport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Discovered
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Applied</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.applied}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.failed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <div className="w-6 h-6 bg-purple-600 rounded-full"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Ready to Apply
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.discovered}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="discovered">Ready to Apply</option>
              <option value="pending">Pending</option>
              <option value="applied">Applied</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Job List */}
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onClick={() => handleJobClick(job)}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500 text-lg">
              No jobs found matching your criteria
            </p>
            <p className="text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onApply={handleApply}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
        />
      )}
    </Layout>
  );
}
