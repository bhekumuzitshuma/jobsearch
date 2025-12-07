import { X, Send, Clock, MapPin, DollarSign, Calendar } from "lucide-react";

export default function JobModal({
  job,
  isOpen,
  onClose,
  onApply,
  getStatusIcon,
  getStatusColor,
}) {
  if (!isOpen) return null;

  const getStatusText = (status) => {
    switch (status) {
      case "applied":
        return "Successfully Applied";
      case "pending":
        return "Application in Progress";
      case "failed":
        return "Application Failed";
      default:
        return "Ready to Apply";
    }
  };

  const canApply = job.status === "discovered";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="relative inline-block w-full max-w-4xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                <span className="font-medium">{job.company}</span>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {job.location}
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {job.salary}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Posted {job.postedDate}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Status Bar */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    getStatusColor(job.status)
                      .replace("text-", "bg-")
                      .replace("bg-", "bg-")
                      .split(" ")[0]
                  }`}
                >
                  {getStatusIcon(job.status)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {getStatusText(job.status)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {job.status === "discovered"
                      ? "This job matches your profile perfectly!"
                      : job.status === "applied"
                      ? `Application sent on ${job.appliedDate}`
                      : job.status === "pending"
                      ? "Your application is being processed"
                      : "There was an issue with your application"}
                  </p>
                </div>
              </div>
              {job.matchScore && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600">
                    Match Score
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {job.matchScore}%
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Job Details */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Job Description
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {job.description}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Requirements
                </h3>
                <ul className="space-y-2">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 mt-0.5 mr-3 text-green-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Application Details
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Send className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900">
                      Automated Application
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {canApply
                      ? "We'll automatically tailor your CV and send your application through our system."
                      : "Your application has been processed through our automated system."}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Sidebar */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Quick Actions
                </h4>

                {canApply ? (
                  <button
                    onClick={() => onApply(job.id)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-3"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Apply Now
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full flex items-center justify-center px-4 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed mb-3"
                  >
                    {getStatusIcon(job.status)}
                    <span className="ml-2">{getStatusText(job.status)}</span>
                  </button>
                )}

                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 mb-2">
                  Save for Later
                </button>

                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  View Original Posting
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">
                  Why This is a Good Match
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Skills match: 95% alignment</li>
                  <li>• Experience level: Perfect fit</li>
                  <li>• Location: Preferred area</li>
                  <li>• Salary: Within your range</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">
                  Application Timeline
                </h4>
                <div className="text-sm text-yellow-700 space-y-2">
                  <div className="flex justify-between">
                    <span>Discovered:</span>
                    <span>{job.postedDate}</span>
                  </div>
                  {job.appliedDate && (
                    <div className="flex justify-between">
                      <span>Applied:</span>
                      <span>{job.appliedDate}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Status Check:</span>
                    <span>Automatic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
