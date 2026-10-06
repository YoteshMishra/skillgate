import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import JobListings from "./pages/JobListings";
import Dashboard from "./pages/Dashboard";
import PostJob from "./pages/PostJob";
import ProtectedRoute from "./components/ProtectedRoute";
import MyJobs from "./pages/MyJobs";
import Profile from "./pages/Profile";
import Candidates from "./pages/Candidates";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import InterviewPractice from "./pages/InterviewPractice";
import LearningPlan from "./pages/LearningPlan";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Landing from "./pages/Landing";

function App() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<Landing />} />
      <Route path="/landing" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes */}
      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <JobListings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="JOB_SEEKER">
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/post-job"
        element={
          <ProtectedRoute requiredRole="RECRUITER">
            <PostJob />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-jobs"
        element={
          <ProtectedRoute requiredRole="RECRUITER">
            <MyJobs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute requiredRole="JOB_SEEKER">
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidates"
        element={
          <ProtectedRoute requiredRole="RECRUITER">
            <Candidates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-analyzer"
        element={
          <ProtectedRoute requiredRole="JOB_SEEKER">
            <ResumeAnalyzer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview"
        element={
          <ProtectedRoute requiredRole="JOB_SEEKER">
            <InterviewPractice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learning"
        element={
          <ProtectedRoute requiredRole="JOB_SEEKER">
            <LearningPlan />
          </ProtectedRoute>
        }
      />

      {/* Anything unknown goes to the landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;