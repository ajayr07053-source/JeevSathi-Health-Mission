import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function NotificationCenter() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // सभी अप्रूव्ड मरीज़ों का डेटा लाएँ
  useEffect(() => {
    const fetchPatients = async () => {
      const { data, error } = await supabase
        .from("camp_patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPatients(data);
      }
      setLoading(false);
    };
    fetchPatients();
  }, []);

  // 💬 WhatsApp पर मैसेज भेजने का मैजिक फ़ंक्शन
  const sendWhatsApp = (patient) => {
    // मरीज़ के लिए एक सुंदर सा मैसेज बनाएँ
    const message = `नमस्कार *${patient.patient_name}* जी, 🙏\n\n*JeevSathi Health Mission* (Sinux India Foundation) में आपका स्वागत है।\n\n✅ आपका हेल्थ कार्ड अप्रूव हो गया है!\n🪪 *Card No:* ${patient.health_card_number || `JHM-000${patient.id}`}\n\nआप अपना कार्ड नीचे दिए गए लिंक से देख और डाउनलोड कर सकते हैं:\n🔗 ${window.location.origin}/verify/${patient.id}\n\nस्वस्थ रहें, सुरक्षित रहें! 🌿`;
    
    // WhatsApp का डायरेक्ट लिंक बनाएँ और नए टैब में खोलें
    const whatsappUrl = `https://wa.me/91${patient.mobile}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // 📱 SMS भेजने का डमी फ़ंक्शन (भविष्य के लिए)
  const sendSMS = (patient) => {
    alert(`SMS API Integration Required!\n\nभविष्य में यहाँ से ${patient.mobile} पर डायरेक्ट Text Message जाएगा। अभी के लिए कृपया WhatsApp वाले बटन का उपयोग करें।`);
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <h2 style={{margin: 0, fontSize: "18px"}}>📢 Notification Center</h2>
        <button style={styles.logoutBtn} onClick={() => navigate("/")}>🏠 Home</button>
      </header>

      <main style={styles.main}>
        <div style={styles.infoBox}>
          <p style={{margin: 0, color: "#166534"}}>
            <strong>💡 टिप:</strong> WhatsApp बटन पर क्लिक करते ही आपके मोबाइल/लैपटॉप का WhatsApp खुल जाएगा और मरीज़ का कार्ड लिंक ऑटोमैटिक टाइप हो जाएगा!
          </p>
        </div>

        <div style={styles.card}>
          <h3 style={{margin: "0 0 15px", color: "#173b2a"}}>✉️ Send Notifications</h3>
          
          {loading ? (
            <p>⏳ मरीज़ों की लिस्ट लोड हो रही है...</p>
          ) : (
            <div style={{overflowX: "auto"}}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHead}>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Patient Name</th>
                    <th style={styles.th}>Mobile No.</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions (Send Via)</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id} style={styles.trBody}>
                      <td style={styles.td}>{p.id}</td>
                      <td style={styles.td}><strong>{p.patient_name}</strong></td>
                      <td style={styles.td}>+91 {p.mobile}</td>
                      <td style={styles.td}>
                        <span style={{
                          background: String(p.admin_status).toUpperCase() === "APPROVED" ? "#dcfce7" : "#fef2f2",
                          color: String(p.admin_status).toUpperCase() === "APPROVED" ? "#166534" : "#991b1b",
                          padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold"
                        }}>
                          {p.admin_status || "PENDING"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{display: "flex", gap: "10px"}}>
                          <button style={styles.waBtn} onClick={() => sendWhatsApp(p)}>
                            🟢 WhatsApp
                          </button>
                          <button style={styles.smsBtn} onClick={() => sendSMS(p)}>
                            📱 SMS
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ==========================================
// 🎨 STYLES
// ==========================================
const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f3f8f5", fontFamily: "Arial, sans-serif" },
  header: { background: "#173b2a", padding: "15px 5%", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" },
  backBtn: { background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  logoutBtn: { background: "#16804d", border: "none", color: "white", padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  
  main: { padding: "30px 5%", maxWidth: "1000px", margin: "0 auto" },
  infoBox: { background: "#dcfce7", border: "1px solid #bbf7d0", padding: "15px", borderRadius: "8px", marginBottom: "20px" },
  card: { background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" },
  
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" },
  trHead: { background: "#e5e7eb", color: "#374151" },
  th: { padding: "12px", borderBottom: "2px solid #d1d5db" },
  trBody: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "12px" },
  
  waBtn: { background: "#25D366", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" },
  smsBtn: { background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }
};

export default NotificationCenter;