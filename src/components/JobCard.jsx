export default function JobCard({
  job,
  onClick,
  getStatusIcon,
  getStatusColor,
}) {
  const getStatusText = (status) => {
    switch (status) {
      case "applied":
        return "Applied";
      case "pending":
        return "Application Pending";
      case "failed":
        return "Application Failed";
      default:
        return "Discovered";
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
            <div className="flex items-center space-x-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  job.status
                )}`}
              >
                {getStatusIcon(job.status)}
                <span className="ml-1">{getStatusText(job.status)}</span>
              </span>
              {job.matchScore && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {job.matchScore}% Match
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-600 mb-2">
            <span className="font-medium">{job.company}</span>
            <span className="mx-2">•</span>
            <span>{job.location}</span>
            <span className="mx-2">•</span>
            <span>{job.type}</span>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {job.description}
          </p>

          <div className="flex flex-wrap gap-1 mb-3">
            {job.requirements.slice(0, 3).map((req, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
              >
                {req}
              </span>
            ))}
            {job.requirements.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                +{job.requirements.length - 3} more
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Posted: {job.postedDate}</span>
              {job.appliedDate && (
                <>
                  <span>•</span>
                  <span>Applied: {job.appliedDate}</span>
                </>
              )}
            </div>
            <span className="text-gray-400">{job.source}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
