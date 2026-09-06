import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    // 1. Supabase का एक्टिव सेशन चेक करें
    const { data: { session } } = await supabase.auth.getSession();

    // 2. लोकल बैकअप टोकन (स्टाफ लॉगिन हेतु)
    const localUser = JSON.parse(localStorage.getItem("jeevsathi_staff_user") || "null");

    if (session || localUser) {
      setIsAuthenticated(true);
      setUserRole(localUser?.role || session?.user?.user_metadata?.role || "STAFF");
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "sans-serif" }}>
        <h3>🔒 सुरक्षा सत्यापन (Verifying Session)...</h3>
      </div>
    );
  }

  // अगर लॉगिन नहीं है, तो तुरंत लॉगिन पेज पर भेजें
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // अगर रोल मैच नहीं करता तो अनऑथराइज्ड रोकें
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2 style={{ color: "#dc2626" }}>🚫 अनधिकृत पहुँच (Access Denied)</h2>
        <p>आपके पास इस डैशबोर्ड को देखने की अनुमति नहीं है।</p>
        <button 
          onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
          style={{ padding: "10px 20px", background: "#16804d", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          लॉगिन पेज पर जाएं
        </button>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;