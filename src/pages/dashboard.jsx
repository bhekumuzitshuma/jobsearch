import { useState, useEffect } from "react";
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
} from "lucide-react";

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    pending: 0,
    failed: 0,
  });

  // Mock data - simulate backend data
  useEffect(() => {
    const mockJobs = [
      {
        id: 1,
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
        id: 2,
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
        id: 3,
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
        id: 4,
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
        id: 5,
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

    // Calculate stats
    const stats = {
      total: mockJobs.length,
      applied: mockJobs.filter((job) => job.status === "applied").length,
      pending: mockJobs.filter((job) => job.status === "pending").length,
      failed: mockJobs.filter((job) => job.status === "failed").length,
      discovered: mockJobs.filter((job) => job.status === "discovered").length,
    };
    setStats(stats);
  }, []);

  // Filter jobs based on search and status
  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.location.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleApply = (jobId) => {
    // Simulate applying to job
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: "pending",
              appliedDate: new Date().toISOString().split("T")[0],
            }
          : job
      )
    );

    // Update stats
    setStats((prev) => ({
      ...prev,
      pending: prev.pending + 1,
      discovered: prev.discovered - 1,
    }));

    setIsModalOpen(false);
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Dashboard</h1>
            <p className="text-gray-600">
              Monitor your automated job applications
            </p>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
