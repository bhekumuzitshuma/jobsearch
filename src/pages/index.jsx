import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Upload,
  User,
  FileText,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

// ─── Diagnostic logger ────────────────────────────────────────────────────────
// Prints a clearly-labelled block to the browser console so you can
// immediately spot which step failed and what Supabase actually returned.
function diagLog(step, label, payload) {
  const style = "background:#1e293b;color:#38bdf8;font-weight:bold;padding:2px 6px;border-radius:3px;";
  console.group(`%c[DIAG] Step ${step} — ${label}`, style);
  console.log(payload);
  console.groupEnd();
}

function diagError(step, label, err) {
  const style = "background:#7f1d1d;color:#fca5a5;font-weight:bold;padding:2px 6px;border-radius:3px;";
  console.group(`%c[ERROR] Step ${step} — ${label}`, style);
  console.error("message :", err?.message);
  console.error("status  :", err?.status);
  console.error("code    :", err?.code);
  console.error("details :", err?.details);
  console.error("hint    :", err?.hint);
  console.error("full obj:", JSON.stringify(err, null, 2));
  console.groupEnd();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function humaniseError(err) {
  const msg = err?.message || "";
  const code = err?.code || "";

  if (msg.includes("Database error saving new user"))
    return "Supabase failed to create the auth user — most likely a broken database trigger on auth.users. Open your browser console for the full diagnostic, then check: Supabase → Database → Functions for any handle_new_user trigger that references your profiles table.";
  if (msg.includes("rate limit") || msg.includes("429"))
    return "Too many signup attempts. Wait a few minutes and try again.";
  if (msg.toLowerCase().includes("already registered"))
    return "This email is already registered. If you started onboarding before, enter the same password you chose then.";
  if (msg.includes("row-level security") || code === "42501")
    return "RLS policy blocked the operation. Check that your 'cvs' storage bucket exists and that authenticated users have INSERT permission.";
  if (msg.includes("JWT") || msg.includes("token"))
    return "Session expired. Refresh the page and try again.";
  if (msg.includes("violates") && msg.includes("constraint"))
    return `Database constraint violation: ${msg}. A column value is missing or conflicts with an existing row.`;
  if (msg.includes("relation") && msg.includes("does not exist"))
    return `Missing table: ${msg}. Make sure the required tables exist in your Supabase project.`;
  if (msg.includes("verify your email") || msg.includes("Email not confirmed"))
    return "Email confirmation is enabled in your Supabase project. Check your inbox to confirm your address, then return here to finish setup.";

  return msg || "An unexpected error occurred — check the browser console for details.";
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Onboarding() {
  const router = useRouter();
  const supabase = createClient();

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
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [diagMessages, setDiagMessages] = useState([]); // visible on-screen diagnostics
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ cv: 0 });

  const steps = [
    { id: 1, name: "Personal Info", icon: User },
    { id: 2, name: "Professional Details", icon: FileText },
    { id: 3, name: "Documents Upload", icon: Upload },
    { id: 4, name: "Review & Complete", icon: CheckCircle2 },
  ];

  // Push a visible status line to the diagnostic panel on step 4
  const pushDiag = (type, text) => {
    setDiagMessages((prev) => [...prev, { type, text, ts: new Date().toISOString() }]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (fileType, file) => {
    if (file) {
      setUploadProgress((prev) => ({ ...prev, [fileType]: 100 }));
      setFormData((prev) => ({ ...prev, [`${fileType}File`]: file }));
    }
  };

  // ── Step: Upload file to Supabase Storage ──────────────────────────────────
  const uploadFileToStorage = async (file, userId, bucket) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    pushDiag("info", `Uploading "${file.name}" → bucket: ${bucket} / path: ${fileName}`);
    diagLog(2, "uploadFileToStorage — params", { bucket, fileName, fileSize: file.size });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) {
      diagError(2, "uploadFileToStorage — storage error", error);
      pushDiag("error", `Storage upload failed: ${error.message} (status ${error.status ?? "–"})`);
      throw error;
    }

    diagLog(2, "uploadFileToStorage — success", data);
    pushDiag("ok", `File uploaded successfully. Path: ${data.path}`);
    return data.path;
  };

  // ── Step: Insert CV record ─────────────────────────────────────────────────
  const createCVRecord = async (userId, filePath) => {
    pushDiag("info", "Inserting row into cvs table…");
    diagLog(3, "createCVRecord — params", { userId, filePath });

    const { data, error } = await supabase
      .from("cvs")
      .insert({ user_id: userId, file_path: filePath, extracted_text: "" })
      .select()
      .single();

    if (error) {
      diagError(3, "createCVRecord — DB error", error);
      pushDiag("error", `cvs insert failed: ${error.message} [code: ${error.code}]`);
      throw error;
    }

    diagLog(3, "createCVRecord — success", data);
    pushDiag("ok", `CV record created. cv_id: ${data.id}`);
    return data;
  };

  // ── Step: Insert or skip profile ──────────────────────────────────────────
  const createProfile = async (userId, cvId) => {
    pushDiag("info", "Checking for existing profile…");
    diagLog(4, "createProfile — check existing", { userId });

    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = "no rows returned" — that's expected when profile doesn't exist yet
      diagError(4, "createProfile — existence check error", checkError);
      pushDiag("error", `Profile check failed: ${checkError.message} [code: ${checkError.code}]`);
      throw checkError;
    }

    if (existingProfile) {
      pushDiag("info", "Profile already exists — skipping insert.");
      diagLog(4, "createProfile — skipped (already exists)", existingProfile);
      return;
    }

    const skills = formData.skills
      ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const profilePayload = {
      user_id: userId,
      full_name: formData.fullName,
      phone: formData.phone,
      primary_role: formData.currentRole,
      experience_level: formData.experience,
      skills,
      summary: `Professional with ${formData.experience || "some"} years of experience in ${formData.currentRole || "various roles"}`,
      qualifications: [],
      cv_id: cvId,
    };

    diagLog(4, "createProfile — inserting payload", profilePayload);
    pushDiag("info", "Inserting profile…");

    const { error } = await supabase.from("profiles").insert(profilePayload);

    if (error) {
      diagError(4, "createProfile — insert error", error);
      pushDiag(
        "error",
        `profiles insert failed: ${error.message} [code: ${error.code}] hint: ${error.hint ?? "–"}`
      );
      throw error;
    }

    pushDiag("ok", "Profile created successfully.");
    diagLog(4, "createProfile — success", profilePayload);
  };

  // ── Step: Queue CV parse task ──────────────────────────────────────────────
  const createParseCVTask = async (cvId, userId) => {
    pushDiag("info", "Queuing parse_cv task…");
    diagLog(5, "createParseCVTask — params", { cvId, userId });

    const { error } = await supabase.from("tasks").insert({
      type: "parse_cv",
      payload: { cv_id: cvId, user_id: userId },
      status: "pending",
    });

    if (error) {
      diagError(5, "createParseCVTask — error", error);
      pushDiag("error", `tasks insert failed: ${error.message} [code: ${error.code}]`);
      throw error;
    }

    pushDiag("ok", "parse_cv task queued.");
    diagLog(5, "createParseCVTask — success", { cvId, userId });
  };

  // ── Master submit handler ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Final step client-side validation
    if (!formData.email) return setFormError("Please provide an email address.");
    if (!password) return setFormError("Please choose a password for your account.");
    if (password.length < 6) return setFormError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setFormError("Passwords do not match.");
    if (!formData.cvFile) return setFormError("Please upload your CV before completing setup.");

    setIsLoading(true);
    setDiagMessages([]);
    pushDiag("info", "Starting onboarding submission…");

    try {
      // ── STEP 1: Sign up ──────────────────────────────────────────────────
      pushDiag("info", `Attempting supabase.auth.signUp for ${formData.email}…`);
      diagLog(1, "signUp — params", { email: formData.email });

      // ONLY sending email and password for auth now
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password,
      });

      let activeUser = null;

      if (authError) {
        diagError(1, "signUp — authError", authError);
        pushDiag("error", `signUp failed: ${authError.message} (status ${authError.status ?? "–"})`);

        if (authError.message.toLowerCase().includes("already registered")) {
          pushDiag("info", "Email already registered — attempting sign-in to resume…");
          diagLog(1, "signUp — attempting signIn for existing user", { email: formData.email });

          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password,
          });

          if (signInError) {
            diagError(1, "signIn — signInError", signInError);
            pushDiag("error", `signIn also failed: ${signInError.message}`);
            throw new Error(
              "This email is already registered but the password is incorrect. Please sign in from the main page."
            );
          }

          diagLog(1, "signIn — success", signInData.user);
          pushDiag("ok", `Signed in as existing user: ${signInData.user.id}`);
          activeUser = signInData.user;
        } else {
          throw authError;
        }
      } else {
        diagLog(1, "signUp — success", authData.user);
        pushDiag("ok", `Auth user created: ${authData.user?.id ?? "(no id — check email confirmation)"}`);
        activeUser = authData.user;
      }

      if (!activeUser) {
        pushDiag("error", "activeUser is null after auth step — cannot continue.");
        throw new Error("Authentication succeeded but no user object was returned.");
      }

      // ── STEP 1b: Confirm session exists ───────────────────────────────────
      diagLog(1, "getSession — checking session", {});
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        diagError(1, "getSession — error", sessionError);
        pushDiag("error", `getSession error: ${sessionError.message}`);
        throw sessionError;
      }

      diagLog(1, "getSession — result", sessionData);

      if (!sessionData.session) {
        pushDiag(
          "error",
          "No active session after signup. Email confirmation is likely enabled. Check your inbox."
        );
        throw new Error(
          "Please verify your email address before completing setup. Check your inbox for a confirmation link."
        );
      }

      pushDiag("ok", `Session confirmed. User ID: ${sessionData.session.user.id}`);

      // ── STEP 2: Upload CV ──────────────────────────────────────────────────
      const cvPath = await uploadFileToStorage(formData.cvFile, activeUser.id, "cvs");

      // ── STEP 3: Create CV DB record ────────────────────────────────────────
      const cvRecord = await createCVRecord(activeUser.id, cvPath);

      // ── STEP 4: Create profile ─────────────────────────────────────────────
      await createProfile(activeUser.id, cvRecord.id);

      // ── STEP 5: Queue parse task ───────────────────────────────────────────
      await createParseCVTask(cvRecord.id, activeUser.id);

      pushDiag("ok", "🎉 All steps completed successfully — redirecting to dashboard…");
      diagLog("✓", "Onboarding complete", { userId: activeUser.id, cvId: cvRecord.id });

      router.push("/dashboard?onboarding=complete");
    } catch (error) {
      console.error("[ONBOARDING] Fatal error:", error);
      setFormError(humaniseError(error));
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step renderers ─────────────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Field label="Full Name" id="fullName" required>
              <input
                type="text"
                id="fullName"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="input"
              />
            </Field>
            <Field label="Email Address" id="email" required>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="input"
              />
            </Field>
            <Field label="Phone Number" id="phone">
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input"
              />
            </Field>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Field label="Current / Most Recent Role" id="currentRole">
              <input
                type="text"
                id="currentRole"
                name="currentRole"
                value={formData.currentRole}
                onChange={handleInputChange}
                className="input"
              />
            </Field>
            <Field label="Years of Experience" id="experience">
              <select
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="input"
              >
                <option value="">Select experience</option>
                <option value="0-1">0-1 years</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5-10">5-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </Field>
            <Field label="Key Skills (comma-separated)" id="skills">
              <textarea
                id="skills"
                name="skills"
                rows={3}
                value={formData.skills}
                onChange={handleInputChange}
                placeholder="e.g. JavaScript, Python, Project Management"
                className="input"
              />
            </Field>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <FileUploadSection
              title="Upload CV / Resume *"
              description="PDF or Word format. We'll use this as the base for all automated applications."
              accept=".pdf,.doc,.docx"
              onFileUpload={(file) => handleFileUpload("cv", file)}
              progress={uploadProgress.cv}
              isRequired
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-medium text-green-800">Almost there!</h3>
              </div>
              <p className="mt-2 text-green-700 text-sm">
                Review your details, set a password, then click <strong>Complete Setup</strong>.
              </p>
            </div>

            {/* Profile summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Profile Summary</h4>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ["Full Name", formData.fullName],
                  ["Email", formData.email],
                  ["Current Role", formData.currentRole || "Not specified"],
                  ["Experience", formData.experience || "Not specified"],
                ].map(([dt, dd]) => (
                  <div key={dt}>
                    <dt className="text-sm font-medium text-gray-500">{dt}</dt>
                    <dd className="text-sm text-gray-900">{dd}</dd>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Skills</dt>
                  <dd className="text-sm text-gray-900">{formData.skills || "Not specified"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">CV</dt>
                  <dd className="text-sm text-gray-900">
                    {formData.cvFile?.name || (
                      <span className="text-red-500">⚠ No file selected — go back to Step 3</span>
                    )}
                  </dd>
                </div>
              </dl>

              {/* Password fields */}
              <div className="mt-6 border-t pt-6 space-y-4">
                <h5 className="text-sm font-medium text-gray-700">Create account password</h5>
                <Field label="Password" id="password">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="input"
                  />
                </Field>
                <Field label="Confirm Password" id="confirmPassword">
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="input"
                  />
                </Field>
              </div>
            </div>

            {/* ── Diagnostic panel ── */}
            {diagMessages.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs overflow-auto max-h-64 border border-gray-700">
                <p className="text-gray-400 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Diagnostic log (also in browser console)
                </p>
                {diagMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 mb-1 ${
                      m.type === "error"
                        ? "text-red-400"
                        : m.type === "ok"
                        ? "text-green-400"
                        : "text-blue-300"
                    }`}
                  >
                    <span className="text-gray-600 shrink-0">{m.ts.slice(11, 19)}</span>
                    <span>{m.type === "error" ? "✗" : m.type === "ok" ? "✓" : "›"}</span>
                    <span>{m.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Error banner */}
            {formError && (
              <div className="bg-red-50 border border-red-300 rounded-md p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Submission failed</p>
                  <p className="text-sm text-red-700 mt-1">{formError}</p>
                  <p className="text-xs text-red-500 mt-2">
                    Open <strong>DevTools → Console</strong> for the full diagnostic output.
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Inline styles for shared input class */}
      <style>{`
        .input {
          margin-top: 4px;
          display: block;
          width: 100%;
          color: #1e293b;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          box-shadow: 0 1px 2px rgb(0 0 0/5%);
        }
        .input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgb(59 130 246 / 20%);
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Briefcase className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Powered Job Search Engine</h1>
          <p className="text-lg text-gray-600">
            Let's set up your profile to start automating your job applications
          </p>
        </div>

        {/* Progress steps */}
        <div className="mb-12">
          <nav aria-label="Progress">
            <ol role="list" className="flex items-center justify-between">
              {steps.map((step, index) => (
                <li key={step.id} className="flex-1 flex items-center">
                  {index > 0 && <div className="flex-1 h-0.5 bg-gray-200 mx-4" />}
                  <div className={`flex items-center ${index > 0 ? "flex-1" : ""}`}>
                    <div
                      className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${
                        currentStep >= step.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <step.icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`ml-3 text-sm font-medium ${
                        currentStep >= step.id ? "text-blue-600" : "text-gray-500"
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

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            <div className="mt-8 flex justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={isLoading}
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing…
                  </>
                ) : (
                  <>
                    {currentStep === steps.length ? "Complete Setup" : "Continue"}
                    {currentStep < steps.length && <ArrowRight className="ml-2 w-4 h-4" />}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared subcomponents ────────────────────────────────────────────────────
function Field({ label, id, required, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function FileUploadSection({ title, description, accept, onFileUpload, progress, isRequired }) {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      onFileUpload(selected);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <div className="mt-4">
        <label htmlFor="file-upload" className="cursor-pointer">
          <span className="font-medium text-blue-600 hover:text-blue-500">Click to select file</span>
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
          <p className="text-sm text-gray-700 font-medium bg-blue-50 py-2 px-3 rounded">
            Selected: {file.name}
          </p>
          {progress === 100 && (
            <div className="mt-2 flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              <span className="text-sm">File staged for upload</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}