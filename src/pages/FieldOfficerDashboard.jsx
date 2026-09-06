import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function FieldOfficerDashboard() {
  const navigate = useNavigate();
  const [officer, setOfficer] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL"); // 'ALL', 'CASH', 'ONLINE'

  useEffect(() => {
    const savedUser = localStorage.getItem("jeevsathi_logged_user");
    if (!savedUser) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(savedUser);
    setOfficer(user);
    loadFOCards(user);
  }, [navigate]);

  const loadFOCards = async (fo) => {
    setLoading(true);
    try {
      // 🚀 FO द्वारा बनाए गए सभी कार्ड (ID या Name से फ़िल्टर)
      const { data, error } = await supabase
        .from("camp_patients")
        .select("*")
        .or(`fo_id.eq.${fo.id},fo_name.eq.${fo.name}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (err) {
      console.error("Error loading FO patients:", err);
    } finally {
      setLoading(false);
    }
  };

  // नकद फीस प्राप्त होने पर वेरीफाई करना
  const handleVerifyCash = async (patientId) => {
    if (!window.confirm("क्या आपने मरीज़ से ₹150 नकद प्राप्त कर लिए हैं?")) return;

    const { error } = await supabase
      .from("camp_patients")
      .update({
        payment_status: "PAID",
        admin_status: "APPROVED",
        supervisor_status: "VERIFIED"
      })
      .eq("id", patientId);

    if (error) {
      alert("त्रुटि: " + error.message);
    } else {
      alert("✅ कार्ड सत्यापित हो गया!");
      loadFOCards(officer);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jeevsathi_logged_user");
    navigate("/login");
  };

  // काउंट्स
  const totalCards = patients.length;
  const onlineCards = patients.filter(p => p.payment_mode === "ONLINE_PAID" || p.payment_status === "PAID" && p.payment_mode !== "PAY_TO_FO").length;
  const cashCards = patients.filter(p => p.payment_mode === "PAY_TO_FO").length;
  const approvedCards = patients.filter(p => String(p.admin_status).toUpperCase() === "APPROVED").length;

  const filteredPatients = patients.filter(p => {
    if (activeFilter === "CASH") return p.payment_mode === "PAY_TO_FO";
    if (activeFilter === "ONLINE") return p.payment_mode === "ONLINE_PAID";
    return true;
  });

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px" }}>👮 Field Officer Dashboard</h2>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#d1fae5" }}>
            अधिकारी: {officer?.name} | ब्लॉक: {officer?.block} ({officer?.district})
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => navigate("/camp-patient-registration")} style={styles.btnAction}>
            🏕️ Free OPD Entry
          </button>
          <button onClick={() => navigate("/patient-registration")} style={{ ...styles.btnAction, background: "#ea580c" }}>
            ➕ नया कार्ड बनाएं (₹150)
          </button>
          <button onClick={handleLogout} style={styles.btnLogout}>लॉगआउट</button>
        </div>
      </header>

      <main style={styles.main}>
        {/* स्टेट्स बॉक्स */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard} onClick={() => setActiveFilter("ALL")}>
            <span style={styles.statVal}>{totalCards}</span>
            <span style={styles.statLabel}>कुल बनाए गए कार्ड</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: "4px solid #16a34a" }} onClick={() => setActiveFilter("ONLINE")}>
            <span style={{ ...styles.statVal, color: "#16a34a" }}>{onlineCards}</span>
            <span style={styles.statLabel}>ऑनलाइन पेमेंट कार्ड</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: "4px solid #ea580c" }} onClick={() => setActiveFilter("CASH")}>
            <span style={{ ...styles.statVal, color: "#ea580c" }}>{cashCards}</span>
            <span style={styles.statLabel}>नकद (FO Cash) कार्ड</span>
          </div>
          <div style={{ ...styles.statCard, borderLeft: "4px solid #2563eb" }}>
            <span style={{ ...styles.statVal, color: "#2563eb" }}>{approvedCards}</span>
            <span style={styles.statLabel}>एक्टिव / मान्य कार्ड</span>
          </div>
        </div>

        {/* फ़िल्टर टैब */}
        <div style={styles.tabContainer}>
          <button 
            style={activeFilter === "ALL" ? styles.tabActive : styles.tab} 
            onClick={() => setActiveFilter("ALL")}
          >
            सभी कार्ड्स ({totalCards})
          </button>
          <button 
            style={activeFilter === "ONLINE" ? styles.tabActive : styles.tab} 
            onClick={() => setActiveFilter("ONLINE")}
          >
            💳 ऑनलाइन भुगतान वाले ({onlineCards})
          </button>
          <button 
            style={activeFilter === "CASH" ? styles.tabActive : styles.tab} 
            onClick={() => setActiveFilter("CASH")}
          >
            💵 नकद FO वाले ({cashCards})
          </button>
        </div>

        {/* कार्ड लिस्टिंग टेबल */}
        <div style={styles.tableCard}>
          <h3 style={{ margin: "0 0 15px", fontSize: "16px", color: "#0f172a" }}>
            📋 आपके द्वारा बनाए गए मरीज़ कार्ड्स
          </h3>

          {loading ? (
            <p style={{ textAlign: "center", color: "#64748b" }}>डेटा लोड हो रहा है...</p>
          ) : filteredPatients.length === 0 ? (
            <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>इस श्रेणी में कोई कार्ड नहीं है।</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>मरीज़ का नाम</th>
                    <th style={styles.th}>मोबाइल नंबर</th>
                    <th style={styles.th}>गाँव / ब्लॉक</th>
                    <th style={styles.th}>भुगतान मोड</th>
                    <th style={styles.th}>कार्ड स्थिति</th>
                    <th style={styles.th}>कार्यवाही</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(p => {
                    const isApproved = String(p.admin_status).toUpperCase() === "APPROVED";
                    const isOnline = p.payment_mode === "ONLINE_PAID";
                    return (
                      <tr key={p.id} style={styles.tr}>
                        <td style={styles.td}>#{p.id}</td>
                        <td style={{ ...styles.td, fontWeight: "bold" }}>{p.patient_name}</td>
                        <td style={styles.td}>{p.mobile}</td>
                        <td style={styles.td}>{p.village}, {p.block}</td>
                        <td style={styles.td}>
                          <span style={isOnline ? styles.badgeOnline : styles.badgeCash}>
                            {isOnline ? "💳 ऑनलाइन पेड" : "💵 नकद (FO)"}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={isApproved ? styles.badgeGreen : styles.badgeOrange}>
                            {isApproved ? "✅ APPROVED" : "⏳ PENDING"}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {!isApproved && p.payment_mode === "PAY_TO_FO" ? (
                            <button onClick={() => handleVerifyCash(p.id)} style={styles.btnVerifyCash}>
                              ✓ ₹150 प्राप्त (Verify)
                            </button>
                          ) : (
                            <button onClick={() => navigate(`/health-card/${p.id}`)} style={styles.btnView}>
                              कार्ड देखें
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  header: { background: "#065f46", color: "white", padding: "15px 5%", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" },
  btnAction: { background: "#059669", color: "white", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" },
  btnLogout: { background: "#dc2626", color: "white", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" },
  main: { maxWidth: "1100px", margin: "25px auto", padding: "0 15px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "20px" },
  statCard: { background: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", cursor: "pointer", display: "flex", flexDirection: "column" },
  statVal: { fontSize: "28px", fontWeight: "900", color: "#0f172a" },
  statLabel: { fontSize: "12px", color: "#64748b", fontWeight: "bold", marginTop: "4px" },
  tabContainer: { display: "flex", gap: "10px", marginBottom: "15px" },
  tab: { background: "#e2e8f0", border: "none", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px", color: "#475569" },
  tabActive: { background: "#065f46", border: "none", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px", color: "white" },
  tableCard: { background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" },
  thRow: { background: "#f1f5f9" },
  th: { padding: "10px", color: "#334155", fontWeight: "bold", borderBottom: "1px solid #cbd5e1" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px 10px" },
  badgeOnline: { background: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" },
  badgeCash: { background: "#ffedd5", color: "#c2410c", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" },
  badgeGreen: { background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" },
  badgeOrange: { background: "#fff7ed", color: "#c2410c", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" },
  btnVerifyCash: { background: "#16a34a", color: "white", border: "none", padding: "6px 10px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" },
  btnView: { background: "#e2e8f0", color: "#1e293b", border: "none", padding: "6px 10px", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "11px" }
};

export default FieldOfficerDashboard;