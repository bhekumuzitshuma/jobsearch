import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Save, Mail, Bell, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabaseClient";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const supabase = getSupabase();
  const [activeTab, setActiveTab] = useState("email");
  const [settings, setSettings] = useState({
    email: {
      applicationEmail: "",
      notificationEmail: "",
      emailSignature: "",
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
      locations: [],
      jobTypes: [],
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [error, setError] = useState(null);
  const [settingsExist, setSettingsExist] = useState(true);

  const tabs = [
    { id: "email", name: "Email Settings", icon: Mail },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "preferences", name: "Preferences", icon: Shield },
  ];

  // Fetch user settings on component mount
  useEffect(() => {
    if (user) {
      fetchUserSettings();
    }
  }, [user]);

  const fetchUserSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found
          setSettingsExist(false);
          // Initialize with empty/default settings
          setSettings({
            email: {
              applicationEmail: user.email || "",
              notificationEmail: user.email || "",
              emailSignature: "",
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
              locations: [],
              jobTypes: [],
            },
          });
        } else {
          throw error;
        }
      } else if (data) {
        setSettingsExist(true);
        // Map database fields to our settings structure
        setSettings({
          email: {
            applicationEmail: data.application_email || "",
            notificationEmail: data.notification_email || "",
            emailSignature: data.email_signature || "",
            autoSend: data.auto_send ?? true,
          },
          notifications: {
            jobMatches: data.notify_job_matches ?? true,
            applicationStatus: data.notify_application_status ?? true,
            systemUpdates: data.notify_system_updates ?? false,
            weeklyReports: data.notify_weekly_reports ?? true,
          },
          preferences: {
            maxApplications: data.max_applications ?? 10,
            minMatchScore: data.min_match_score ?? 70,
            locations: data.preferred_locations || [],
            jobTypes: data.job_types || [],
          },
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setSaveStatus("saving");
      setError(null);

      // Prepare data for database
      const settingsData = {
        user_id: user.id,
        application_email: settings.email.applicationEmail,
        notification_email: settings.email.notificationEmail,
        email_signature: settings.email.emailSignature,
        auto_send: settings.email.autoSend,
        notify_job_matches: settings.notifications.jobMatches,
        notify_application_status: settings.notifications.applicationStatus,
        notify_system_updates: settings.notifications.systemUpdates,
        notify_weekly_reports: settings.notifications.weeklyReports,
        max_applications: settings.preferences.maxApplications,
        min_match_score: settings.preferences.minMatchScore,
        preferred_locations: settings.preferences.locations,
        job_types: settings.preferences.jobTypes,
        updated_at: new Date().toISOString(),
      };

      let error;

      if (settingsExist) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('user_settings')
          .update(settingsData)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert([{ ...settingsData, created_at: new Date().toISOString() }]);
        error = insertError;
      }

      if (error) throw error;

      setSettingsExist(true);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 3000);
    } finally {
      setIsSaving(false);
    }
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
            placeholder="Best regards,&#10;Your Name"
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

      {settings.email.applicationEmail && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Email Verification
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  {settings.email.applicationEmail}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">Verified</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-blue-700">
              This email is configured and ready to send applications.
            </p>
          </div>
        </div>
      )}
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
                parseInt(e.target.value) || 1
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
                parseInt(e.target.value) || 0
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
              key={`${location}-${index}`}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {location}
              <button
                type="button"
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
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const input = document.getElementById("newLocation");
                const value = input.value.trim();
                if (value && !settings.preferences.locations.includes(value)) {
                  handleInputChange("preferences", "locations", [
                    ...settings.preferences.locations,
                    value,
                  ]);
                  input.value = "";
                }
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
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

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading settings...</span>
        </div>
      </Layout>
    );
  }

  // No settings alert
  if (!settingsExist) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your application preferences and email settings</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="text-lg font-medium text-yellow-800">No Settings Found</h3>
                <p className="text-yellow-700 mt-1">
                  You haven't configured your settings yet. Please set up your preferences to get started.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              {renderEmailSettings()}
            </div>
            <div className="flex justify-end items-center space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Create Settings
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error && !settingsExist) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Settings</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchUserSettings}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

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
            {saveStatus === "error" && (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">Error saving settings</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
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