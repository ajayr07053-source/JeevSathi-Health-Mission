import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Login() {
  const navigate = useNavigate();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // रोल के अनुसार सही डैशबोर्ड
  const routeUserByRole = (user) => {
    const role = String(user.role || "").toUpperCase().trim();
    
    if (role.includes("ADMIN")) {
      navigate("/admin-dashboard");
    } else if (role.includes("SUPERVISOR")) {
      navigate("/supervisor-dashboard");
    } else if (role.includes("FIELD") || role === "FO") {
      navigate("/field-officer-dashboard");
    } else if (role.includes("DOCTOR")) {
      navigate("/doctor-dashboard");
    } else if (role.includes("HOSPITAL")) {
      navigate("/hospital-dashboard");
    } else {
      navigate("/admin-dashboard");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const term = identifier.trim();
    const rawPass = password.trim();

    try {
      // 1. Supabase के app_users टेबल में Email या Mobile और Password से सीधा मैच
      const { data: users, error: dbError } = await supabase
        .from("app_users")
        .select("*")
        .or(`email.eq.${term},mobile.eq.${term}`)
        .eq("password", rawPass);

      setLoading(false);

      if (dbError) {
        setError("❌ डेटाबेस एरर: " + dbError.message);
        return;
      }

      if (!users || users.length === 0) {
        setError("❌ गलत Email/Mobile या Password! कृपया सही विवरण दर्ज करें।");
        return;
      }

      const matchedUser = users[0];

      // 2. सेशन स्टोर करें
      const userSession = {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        mobile: matchedUser.mobile,
        role: matchedUser.role,
        district: matchedUser.district,
        block: matchedUser.block
      };

      localStorage.setItem("jeevsathi_logged_user", JSON.stringify(userSession));
      localStorage.setItem("jeevsathi_staff_user", JSON.stringify(userSession));

      // 3. रीडायरेक्ट करें
      routeUserByRole(matchedUser);

    } catch (err) {
      setLoading(false);
      setError("❌ सर्वर से जुड़ने में समस्या आई: " + err.message);
    }
  };

  return (
    <div style={styles.page}>
      
      <div style={styles.topBar}>
        <div style={styles.brandTitle}>
          🏥 JeevSathi Health Mission
        </div>
        <div style={styles.brandSub}>
          Sinux India Foundation Portal
        </div>
      </div>

      <div style={styles.loginContainer}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={styles.iconCircle}>🔒</div>
          <h2 style={styles.loginTitle}>Team & Staff Login</h2>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
            Admin, Supervisor, Field Officer & Doctor
          </p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email ID या Mobile No.</label>
            <input
              type="text"
              required
              style={styles.input}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ईमेल या मोबाइल नंबर दर्ज करें"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="पासवर्ड दर्ज करें"
            />
          </div>

          <button type="submit" disabled={loading} style={styles.loginBtn}>
            {loading ? "लॉगिन हो रहा है..." : "🔓 Login →"}
          </button>

        </form>

        <button 
          type="button"
          onClick={() => navigate("/")} 
          style={styles.btnBack}
        >
          ← Back to Home
        </button>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f4f7f6",
    fontFamily: "'Inter', Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  topBar: {
    width: "100%",
    backgroundColor: "#16804d",
    padding: "16px 0",
    textAlign: "center",
    color: "white",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  brandTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    margin: "0 0 4px",
  },
  brandSub: {
    fontSize: "12px",
    color: "#d1ebd8",
  },
  loginContainer: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "white",
    marginTop: "50px",
    marginBottom: "40px",
    borderRadius: "14px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    padding: "32px 28px",
    border: "1px solid #e2e8f0",
    boxSizing: "border-box"
  },
  iconCircle: {
    width: "50px",
    height: "50px",
    backgroundColor: "#ffedd5",
    color: "#ea580c",
    fontSize: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 10px"
  },
  loginTitle: {
    textAlign: "center",
    color: "#0f172a",
    margin: "0 0 4px",
    fontSize: "20px",
    fontWeight: "bold"
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: "10px",
    textAlign: "center",
    borderRadius: "6px",
    fontSize: "13px",
    marginBottom: "16px",
    border: "1px solid #fca5a5",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    color: "#334155",
    fontWeight: "bold",
  },
  input: {
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    fontSize: "14px",
    backgroundColor: "#ffffff",
    outline: "none",
  },
  loginBtn: {
    backgroundColor: "#ea580c",
    color: "white",
    border: "none",
    padding: "13px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "6px",
    boxShadow: "0 2px 4px rgba(234, 88, 12, 0.2)"
  },
  btnBack: {
    background: "none",
    border: "none",
    color: "#16804d",
    cursor: "pointer",
    width: "100%",
    marginTop: "16px",
    fontWeight: "bold",
    fontSize: "13px",
    textAlign: "center"
  }
};

export default Login;