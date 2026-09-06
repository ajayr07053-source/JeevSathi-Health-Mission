import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function HealthCardManagement() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("camp_patients").select("*").order("id", { ascending: false });
    if (!error) setPatients(data || []);
    setLoading(false);
  };

  // FO सिर्फ Payment Receive कर सकता है
  const markPaymentReceived = async (id) => {
    if(!window.confirm("क्या आपने मरीज़ से ₹150 प्राप्त कर लिए हैं?")) return;
    
    await supabase.from("camp_patients").update({ 
      payment_status: "RECEIVED", 
      card_fee: 150 
    }).eq("id", id);
    
    alert("✅ Payment Received! अब यह Supervisor के पास Verification के लिए चला गया है।");
    fetchPatients();
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <h2 style={{margin: 0, fontSize: "18px"}}>💳 Health Card Management</h2>
      </header>

      <main style={styles.main}>
        <div style={styles.workflowBanner}>
          👤 Reg → 💰 ₹150 Received → 👨‍💼 Sup Verify → 🏛️ Admin Approve → 🪪 Final Card
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>👤 Patient</th>
                <th style={styles.th}>💰 Payment (FO)</th>
                <th style={styles.th}>👨‍💼 Supervisor</th>
                <th style={styles.th}>🏛️ Admin</th>
                <th style={styles.th}>💳 Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>{p.patient_name}</strong><br/>
                    <small>ID: {p.id} | {p.mobile}</small>
                  </td>
                  
                  <td style={styles.td}>
                    {String(p.payment_status).toUpperCase() === "RECEIVED" 
                      ? <span style={styles.badgeGreen}>✅ RECEIVED</span>
                      : <button style={styles.payBtn} onClick={() => markPaymentReceived(p.id)}>💰 Receive ₹150</button>
                    }
                  </td>
                  
                  <td style={styles.td}>
                    {String(p.supervisor_status).toUpperCase() === "VERIFIED" ? <span style={styles.badgeBlue}>✅ VERIFIED</span> : <span style={styles.badgeOrange}>⏳ PENDING</span>}
                  </td>
                  
                  <td style={styles.td}>
                    {String(p.admin_status).toUpperCase() === "APPROVED" ? <span style={styles.badgeGreen}>✅ APPROVED</span> : <span style={styles.badgeOrange}>⏳ PENDING</span>}
                  </td>
                  
                  <td style={styles.td}>
                    {String(p.admin_status).toUpperCase() === "APPROVED" ? (
                      <button style={styles.cardBtn} onClick={() => navigate(`/health-card/${p.id}`)}>🪪 Open Card</button>
                    ) : (
                      <span style={{fontSize: "12px", color: "#991b1b"}}>🔒 Locked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f3f8f5", fontFamily: "Arial, sans-serif" },
  header: { background: "#173b2a", padding: "15px 5%", color: "white", display: "flex", gap: "15px", alignItems: "center" },
  backBtn: { background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" },
  main: { padding: "20px 5%", maxWidth: "1200px", margin: "0 auto" },
  workflowBanner: { background: "#e8f5ec", color: "#16804d", padding: "10px", borderRadius: "8px", textAlign: "center", fontWeight: "bold", fontSize: "13px", marginBottom: "20px" },
  tableWrapper: { overflowX: "auto", background: "white", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "700px" },
  th: { background: "#f9fafb", padding: "12px", textAlign: "left", fontSize: "12px", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "12px", fontSize: "13px" },
  badgeGreen: { background: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold" },
  badgeOrange: { background: "#fef3c7", color: "#92400e", padding: "4px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold" },
  badgeBlue: { background: "#dbeafe", color: "#1e40af", padding: "4px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold" },
  payBtn: { background: "#f97316", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" },
  cardBtn: { background: "#16a34a", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" },
};
export default HealthCardManagement;