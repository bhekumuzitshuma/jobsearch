import { useState } from "react";
import Layout from "../components/Layout";
import { Save, Mail, Bell, Shield, CheckCircle2 } from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("email");
  const [settings, setSettings] = useState({
    email: {
      applicationEmail: "applications@jobautoapply.com",
      notificationEmail: "user@example.com",
      emailSignature: "Best regards,\nJohn Doe",
      autoSend: true,
    },
    notifications: {
      jobMatches: true,
      applicationStatus: true,
      systemUpdates: false,
      weeklyReports: true,
    },
    preferences: {
      maxApplications: 10,
      minMatchScore: 70,
      locations: ["Harare", "Remote"],
      jobTypes: ["Full-time", "Contract"],
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const tabs = [
    { id: "email", name: "Email Settings", icon: Mail },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "preferences", name: "Preferences", icon: Shield },
  ];

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus("saving");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(false);
    setSaveStatus("saved");

    setTimeout(() => setSaveStatus(""), 3000);
  };

  const handleInputChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Application Email Settings
        </h3>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Sending Email
            </label>
            <input
              type="email"
              value={settings.email.applicationEmail}
              onChange={(e) =>
                handleInputChange("email", "applicationEmail", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              This email will be used to send applications on your behalf
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Email
            </label>
            <input
              type="email"
              value={settings.email.notificationEmail}
              onChange={(e) =>
                handleInputChange("email", "notificationEmail", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Where to send notifications and updates
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Signature
          </label>
          <textarea
            rows={4}
            value={settings.email.emailSignature}
            onChange={(e) =>
              handleInputChange("email", "emailSignature", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.email.autoSend}
              onChange={(e) =>
                handleInputChange("email", "autoSend", e.target.checked)
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Automatically send applications for high-match jobs
            </span>
          </label>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Email Verification
        </h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                applications@jobautoapply.com
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">Verified</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-blue-700">
            This email is configured and ready to send applications. We handle
            all email delivery and tracking.
          </p>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Notification Preferences
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">New Job Matches</p>
            <p className="text-sm text-gray-500">
              Get notified when we find new jobs matching your profile
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifications.jobMatches}
              onChange={(e) =>
                handleInputChange(
                  "notifications",
                  "jobMatches",
                  e.target.checked
                )
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">
              Application Status Updates
            </p>
            <p className="text-sm text-gray-500">
              Receive updates when applications are sent or fail
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifications.applicationStatus}
              onChange={(e) =>
                handleInputChange(
                  "notifications",
                  "applicationStatus",
                  e.target.checked
                )
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">System Updates</p>
            <p className="text-sm text-gray-500">
              Important updates about the JobAutoApply system
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifications.systemUpdates}
              onChange={(e) =>
                handleInputChange(
                  "notifications",
                  "systemUpdates",
                  e.target.checked
                )
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Weekly Reports</p>
            <p className="text-sm text-gray-500">
              Weekly summary of applications and job matches
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifications.weeklyReports}
              onChange={(e) =>
                handleInputChange(
                  "notifications",
                  "weeklyReports",
                  e.target.checked
                )
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderPreferenceSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Application Preferences
      </h3>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Daily Applications
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={settings.preferences.maxApplications}
            onChange={(e) =>
              handleInputChange(
                "preferences",
                "maxApplications",
                parseInt(e.target.value)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Limit automatic applications per day
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Match Score
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={settings.preferences.minMatchScore}
            onChange={(e) =>
              handleInputChange(
                "preferences",
                "minMatchScore",
                parseInt(e.target.value)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Only apply to jobs with match score above this
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Locations
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {settings.preferences.locations.map((location, index) => (
            <span
              key={location}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {location}
              <button
                onClick={() => {
                  const newLocations = settings.preferences.locations.filter(
                    (_, i) => i !== index
                  );
                  handleInputChange("preferences", "locations", newLocations);
                }}
                className="ml-1 hover:text-blue-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add location..."
            id="newLocation"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={() => {
              const input = document.getElementById("newLocation");
              const value = input.value.trim();
              if (value && !settings.preferences.locations.includes(value)) {
                handleInputChange("preferences", "locations", [
                  ...settings.preferences.locations,
                  value,
                ]);
                input.value = "";
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Job Types
        </label>
        <div className="space-y-2">
          {["Full-time", "Part-time", "Contract", "Remote", "Internship"].map(
            (type) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.preferences.jobTypes.includes(type)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...settings.preferences.jobTypes, type]
                      : settings.preferences.jobTypes.filter((t) => t !== type);
                    handleInputChange("preferences", "jobTypes", newTypes);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{type}</span>
              </label>
            )
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">
            Manage your application preferences and email settings
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "email" && renderEmailSettings()}
            {activeTab === "notifications" && renderNotificationSettings()}
            {activeTab === "preferences" && renderPreferenceSettings()}
          </div>

          {/* Save Button */}
          <div className="flex justify-end items-center space-x-4 p-6 border-t border-gray-200">
            {saveStatus === "saving" && (
              <div className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm">Saving...</span>
              </div>
            )}
            {saveStatus === "saved" && (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                <span className="text-sm">Settings saved successfully!</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
