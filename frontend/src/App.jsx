import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Predictor from "./Predictor";
import PredictionHistory from "./components/PredictionHistory";
import AdminPanel from "./components/AdminPanel";
import DevChecklist from "./components/DevChecklist";
import ProtectedRoute from "./routes/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CollegeFinder from "./pages/CollegeFinder";
import NeetPrepStrategy from "./pages/NeetPrepStrategy";
import DeemedExplorer from "./pages/DeemedExplorer";
import KeralaPrivateExplorer from "./pages/KeralaPrivateExplorer";
import BiharPrivateExplorer from "./pages/BiharPrivateExplorer";
import KarnatakaExplorer from "./pages/KarnatakaExplorer";
import UPPrivateExplorer from "./pages/UPPrivateExplorer";
import HaryanaPrivateExplorer from "./pages/HaryanaPrivateExplorer";
import WestBengalPrivateExplorer from "./pages/WestBengalPrivateExplorer";
import AndhraPradeshExplorer from "./pages/AndhraPradeshExplorer";
import TamilNaduExplorer from "./pages/TamilNaduExplorer";
import CounsellingGuidance from "./pages/CounsellingGuidance";
import Profile from "./pages/Profile";
import Mentorship from "./pages/Mentorship";
import PrivateDeemedFinder from "./pages/PrivateDeemedFinder";
import Roadmap from "./pages/Roadmap";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import Disclaimer from "./pages/Disclaimer";

import RankAnalysis from "./pages/RankAnalysis";

import ChemistryPyq from "./pages/ChemistryPyq";
import ChemistryPyqPdf from "./pages/ChemistryPyqPdf";
import PdfTestInterface from "./pages/PdfTestInterface";
import TestDashboard from "./pages/TestSeries/TestDashboard";
import TestSeriesDetails from "./pages/TestSeries/TestSeriesDetails";
import ExamEngine from "./pages/TestSeries/ExamEngine";
import TestAnalysis from "./pages/TestSeries/TestAnalysis";
import PhysicsPyq from "./pages/PhysicsPyq";
import McqTest from "./pages/McqTest";
import AiTestGen from "./pages/AiTestGen";

import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateTestWizard from "./pages/admin/CreateTestWizard";
import TestManager from "./pages/admin/TestManager";
import QuestionBank from "./pages/admin/QuestionBank";
import AdminQueryManager from "./components/AdminQueryManager";
import QuizManager from "./components/admin/QuizManager";
import AdminDataManager from "./components/AdminDataManager";
import StudentManager from "./pages/admin/StudentManager";

import StudentProfile from "./pages/admin/StudentProfile";
import TestResults from "./pages/admin/TestResults";
import TutorialGenerator from "./pages/admin/TutorialGenerator";

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Predictor Section */}
        <Route path="/neet-rank-predictor" element={<Predictor />} />
        <Route path="/neet-college-predictor" element={<Predictor />} />
        <Route path="/neet-cutoff-predictor" element={<Predictor />} />
        {/* Legacy redirects or aliases if needed, for now just replacing/keeping old ones if linked elsewhere, but replacing is cleaner for "Final Structure" */}
        <Route path="/predict" element={<Predictor />} />

        <Route path="/rank-analysis" element={<RankAnalysis />} />
        <Route path="/history" element={<PredictionHistory />} />
        <Route path="/checklist" element={<DevChecklist />} />

        {/* College Finder Section */}
        <Route path="/state-quota-college-finder" element={<CollegeFinder />} />
        <Route path="/college-finder" element={<CollegeFinder />} /> {/* Keep for backward compat if needed temporarily */}

        <Route path="/private-deemed-college-finder" element={<PrivateDeemedFinder />} />
        <Route path="/private-finder" element={<PrivateDeemedFinder />} />

        {/* State Explorers - SEO Optimized */}
        <Route path="/deemed-medical-colleges" element={<DeemedExplorer />} />
        <Route path="/deemed-explorer" element={<DeemedExplorer />} />

        <Route path="/kerala-private-medical-colleges" element={<KeralaPrivateExplorer />} />
        <Route path="/kerala-private" element={<KeralaPrivateExplorer />} />

        <Route path="/bihar-private-medical-colleges" element={<BiharPrivateExplorer />} />
        <Route path="/bihar-private" element={<BiharPrivateExplorer />} />

        <Route path="/karnataka-private-medical-colleges" element={<KarnatakaExplorer />} />
        <Route path="/karnataka-private" element={<KarnatakaExplorer />} />

        <Route path="/up-private-medical-colleges" element={<UPPrivateExplorer />} />
        <Route path="/up-private" element={<UPPrivateExplorer />} />

        <Route path="/haryana-private-medical-colleges" element={<HaryanaPrivateExplorer />} />
        <Route path="/haryana-private" element={<HaryanaPrivateExplorer />} />

        <Route path="/west-bengal-private-medical-colleges" element={<WestBengalPrivateExplorer />} />
        <Route path="/west-bengal-private" element={<WestBengalPrivateExplorer />} />

        <Route path="/andhra-pradesh-private-medical-colleges" element={<AndhraPradeshExplorer />} />
        <Route path="/andhra-pradesh" element={<AndhraPradeshExplorer />} />

        <Route path="/tamil-nadu-private-medical-colleges" element={<TamilNaduExplorer />} />
        <Route path="/tamil-nadu-private" element={<TamilNaduExplorer />} />

        {/* Guidance Section */}
        <Route path="/neet-prep-strategy" element={<NeetPrepStrategy />} />
        <Route path="/strategy" element={<NeetPrepStrategy />} />

        <Route path="/neet-counselling-tips" element={<CounsellingGuidance />} />
        <Route path="/counselling-guidance" element={<CounsellingGuidance />} />

        <Route path="/neet-counselling-roadmap" element={<Roadmap />} />
        <Route path="/roadmap" element={<Roadmap />} />

        <Route path="/mbbs-fees-budget-guide" element={<Mentorship />} /> {/* Using Mentorship as placeholder/closest match for now */}
        <Route path="/mentorship" element={<Mentorship />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Test Series Section */}
        <Route path="/neet-test-series" element={<TestDashboard />} />
        <Route path="/test-series" element={<TestDashboard />} />
        <Route path="/test-series/:id" element={<TestSeriesDetails />} />
        <Route path="/exam-engine/:id" element={<ExamEngine />} />
        <Route path="/test-solution/:resultId" element={<ExamEngine mode="review" />} />
        <Route path="/test-analysis/:id" element={<TestAnalysis />} />

        <Route path="/chemistry-pyq" element={<ChemistryPyq />} />
        <Route path="/chemistry-pyq-pdf" element={<ChemistryPyqPdf />} />
        <Route path="/chemistry-pyq-pdf/test/:filename" element={<PdfTestInterface />} />
        <Route path="/chemistry-pyq/test/:filename" element={<McqTest subject="chemistry" />} />
        <Route path="/physics-pyq" element={<PhysicsPyq />} />
        <Route path="/physics-pyq/test/:filename" element={<McqTest subject="physics" />} />







        {/* Static Legal & Info Pages */}
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/disclaimer" element={<Disclaimer />} />

        {/* Admin Routes */}
        <Route
          path="/admin/tutorials"
          element={
            <ProtectedRoute requireAdmin={true}>
              <TutorialGenerator />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="tests" element={<TestManager />} />
          <Route path="tests/new" element={<CreateTestWizard />} />
          <Route path="tests/edit/:testId" element={<CreateTestWizard />} />
          <Route path="tests/:testId/results" element={<TestResults />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="queries" element={<AdminQueryManager />} />
          <Route path="students" element={<StudentManager />} />
          <Route path="students/:uid" element={<StudentProfile />} />
          <Route path="quizzes" element={<QuizManager />} />
          <Route path="data" element={<AdminDataManager />} />
          <Route path="ai-generator" element={<AiTestGen />} />




        </Route>
      </Routes>
      {!isAdminRoute && <Footer />
      }
    </>
  );
}
