import { useState } from "react";
import { useRouter } from "next/router";
import {
  Upload,
  User,
  FileText,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Briefcase,
} from "lucide-react";

export default function Onboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    currentRole: "",
    experience: "",
    education: "",
    skills: "",
    cvFile: null,
    transcriptFile: null,
    qualificationsFile: null,
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [uploadProgress, setUploadProgress] = useState({
    cv: 0,
    transcript: 0,
    qualifications: 0,
  });

  const steps = [
    { id: 1, name: "Personal Info", icon: User },
    { id: 2, name: "Professional Details", icon: FileText },
    { id: 3, name: "Documents Upload", icon: Upload },
    { id: 4, name: "Review & Complete", icon: CheckCircle2 },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (fileType, file) => {
    if (file) {
      // Simulate file upload progress
      setUploadProgress((prev) => ({ ...prev, [fileType]: 0 }));
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev[fileType] + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            setFormData((prev) => ({ ...prev, [`${fileType}File`]: file }));
            return { ...prev, [fileType]: 100 };
          }
          return { ...prev, [fileType]: newProgress };
        });
      }, 100);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // clear previous errors
    setFormError("");

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Final step: validate email and passwords before completing setup
    if (!formData.email) {
      setFormError("Please provide an email address.");
      return;
    }

    if (!password) {
      setFormError("Please choose a password for your account.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password should be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    // Simulate API call to create account and redirect to dashboard
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="currentRole"
                className="block text-sm font-medium text-gray-700"
              >
                Current/Most Recent Role
              </label>
              <input
                type="text"
                id="currentRole"
                name="currentRole"
                value={formData.currentRole}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="experience"
                className="block text-sm font-medium text-gray-700"
              >
                Years of Experience
              </label>
              <select
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select experience</option>
                <option value="0-1">0-1 years</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5-10">5-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="skills"
                className="block text-sm font-medium text-gray-700"
              >
                Key Skills (comma separated)
              </label>
              <textarea
                id="skills"
                name="skills"
                rows={3}
                value={formData.skills}
                onChange={handleInputChange}
                placeholder="e.g., JavaScript, Python, Project Management, Data Analysis"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <FileUploadSection
              title="Upload CV/Resume *"
              description="Upload your CV in PDF or Word format. We'll use this as the base for all automated applications."
              accept=".pdf,.doc,.docx"
              onFileUpload={(file) => handleFileUpload("cv", file)}
              progress={uploadProgress.cv}
              isRequired
            />

            <FileUploadSection
              title="Academic Transcript (Optional)"
              description="Upload your academic transcript to help us better match you with relevant opportunities."
              accept=".pdf,.doc,.docx,.jpg,.png"
              onFileUpload={(file) => handleFileUpload("transcript", file)}
              progress={uploadProgress.transcript}
            />

            <FileUploadSection
              title="Academic Qualifications (Optional)"
              description="Upload any certificates, diplomas, or degrees you'd like to include."
              accept=".pdf,.doc,.docx,.jpg,.png"
              onFileUpload={(file) => handleFileUpload("qualifications", file)}
              progress={uploadProgress.qualifications}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-medium text-green-800">
                  Ready to Start!
                </h3>
              </div>
              <p className="mt-2 text-green-700">
                Your profile has been set up successfully. We'll now start
                scanning for relevant job opportunities and automatically apply
                on your behalf.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Profile Summary</h4>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="text-sm text-gray-900">{formData.fullName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current Role</dt>
                  <dd className="text-sm text-gray-900">{formData.currentRole || "Not specified"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Experience</dt>
                  <dd className="text-sm text-gray-900">{formData.experience || "Not specified"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Skills</dt>
                  <dd className="text-sm text-gray-900">{formData.skills || "Not specified"}</dd>
                </div>
              </dl>

              <div className="mt-6 border-t pt-6">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Create account</h5>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Choose a password"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {formError && <p className="text-sm text-red-600">{formError}</p>}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <Briefcase className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Powered Job Search Engine
          </h1>
          <p className="text-lg text-gray-600">
            Let's set up your profile to start automating your job applications
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <nav aria-label="Progress">
            <ol role="list" className="flex items-center justify-between">
              {steps.map((step, index) => (
                <li key={step.id} className="flex-1 flex items-center">
                  {index > 0 && (
                    <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
                  )}
                  <div
                    className={`flex items-center ${index > 0 ? "flex-1" : ""}`}
                  >
                    <div
                      className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${
                        currentStep >= step.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <step.icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`ml-3 text-sm font-medium ${
                        currentStep >= step.id
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            <div className="mt-8 flex justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Back
                </button>
              ) : (
                <div></div>
              )}

              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
              >
                {currentStep === steps.length ? "Complete Setup" : "Continue"}
                {currentStep < steps.length && (
                  <ArrowRight className="ml-2 w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function FileUploadSection({
  title,
  description,
  accept,
  onFileUpload,
  progress,
  isRequired = false,
}) {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      onFileUpload(selectedFile);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <div className="mt-4">
        <label htmlFor="file-upload" className="cursor-pointer">
          <span className="font-medium text-blue-600 hover:text-blue-500">
            Click to upload
          </span>
          <span className="text-gray-600"> or drag and drop</span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          {accept} {isRequired && "(Required)"}
        </p>
        <p className="text-sm text-gray-600 mt-2">{description}</p>
      </div>
      <input
        id="file-upload"
        name="file-upload"
        type="file"
        className="sr-only"
        accept={accept}
        onChange={handleFileChange}
      />

      {file && (
        <div className="mt-4">
          <p className="text-sm text-gray-700">Selected: {file.name}</p>
          {progress > 0 && progress < 100 && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
          {progress === 100 && (
            <div className="mt-2 flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              <span className="text-sm">Upload complete</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
