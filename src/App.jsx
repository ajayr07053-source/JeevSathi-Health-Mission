import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// === 1. Public & Patient Pages ===
import Home from "./pages/Home";
import PatientRegistration from "./pages/PatientRegistration"; 
import PatientPortal from "./pages/PatientPortal"; // 👈 लॉगिन + साइनअप + हेल्थ प्रोफाइल + डायरेक्टरी
import FindHospital from "./pages/FindHospital";
import Login from "./pages/Login";
import Emergency from "./pages/Emergency";
import PartnerHospitals from "./pages/PartnerHospitals";
import HospitalRegistration from "./pages/HospitalRegistration";

// === 2. Dashboards ===
import AdminDashboard from "./pages/AdminDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import FieldOfficerDashboard from "./pages/FieldOfficerDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import PartnerHospitalDashboard from "./pages/PartnerHospitalDashboard";

// === 3. Features & Utilities ===
import CampPatientRegistration from "./pages/CampPatientRegistration";
import HealthCardManagement from "./pages/HealthCardManagement"; 
import HealthCard from "./pages/HealthCard"; 
import GetHealthCard from "./pages/GetHealthCard";
import VerifyCard from "./pages/VerifyCard";
import Reports from "./pages/Reports";
import QRScanner from "./pages/QRScanner";
import NotificationCenter from "./pages/NotificationCenter";

function App() {
  return (
    <Router>
      <Routes>
        {/* 🏠 Home & Auth */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        {/* 🏥 Patient Routes (PatientPortal को my-health पर सेट किया गया) */}
        <Route path="/my-health" element={<PatientPortal />} /> 
        <Route path="/patient-portal" element={<PatientPortal />} />
        <Route path="/patient-login" element={<PatientPortal />} />
        <Route path="/patient-registration" element={<PatientRegistration />} />
        <Route path="/register" element={<PatientRegistration />} />
        <Route path="/find-hospital" element={<FindHospital />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/partner-hospitals" element={<PartnerHospitals />} />
        <Route path="/hospital-registration" element={<HospitalRegistration />} />

        {/* 👨‍💻 Dashboards */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/supervisor-dashboard" element={<SupervisorDashboard />} />
        <Route path="/field-officer-dashboard" element={<FieldOfficerDashboard />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/hospital-dashboard" element={<PartnerHospitalDashboard />} />
        
        {/* 📋 Camp & Card Management */}
        <Route path="/camp-patient-registration" element={<CampPatientRegistration />} />
        <Route path="/health-card-management" element={<HealthCardManagement />} />
        
        {/* 💳 Payment & Health Card */}
        <Route path="/get-card" element={<GetHealthCard />} />
        <Route path="/health-card" element={<HealthCard />} />
        <Route path="/health-card/:id" element={<HealthCard />} />
        
        {/* 🔍 Verifications & Reports */}
        <Route path="/reports" element={<Reports />} />
        <Route path="/verify" element={<VerifyCard />} />
        <Route path="/verify/:id" element={<VerifyCard />} />
        <Route path="/scanner" element={<QRScanner />} />
        <Route path="/notifications" element={<NotificationCenter />} />
        
        {/* ❌ Error 404 Page */}
        <Route path="*" element={
          <div style={{padding: '50px', textAlign: 'center', fontFamily: 'sans-serif'}}>
            <h1 style={{color: '#ef4444', fontSize: '40px', marginBottom: '10px'}}>❌ ERROR 404</h1>
            <p style={{color: '#64748b', fontSize: '18px'}}>यह पेज नहीं मिला! अपनी URL चेक करें।</p>
            <button 
              onClick={() => window.location.href='/'} 
              style={{marginTop: '20px', padding: '12px 25px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px'}}>
              🏠 Go to Home
            </button>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;