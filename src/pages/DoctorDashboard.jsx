import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function DoctorDashboard() {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState("");
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // फॉर्म के लिए स्टेट (बीमारी और दवाइयाँ)
  const [prescription, setPrescription] = useState({
    symptoms: "",
    diagnosis: "",
    medicines: "",
    notes: ""
  });

  // 1. मरीज़ को खोजने का फ़ंक्शन
  const searchPatient = async (e) => {
    e.preventDefault();
    if (!patientId) return;
    setLoading(true);
    setMessage("");
    setPatient(null);

    const { data, error } = await supabase
      .from("camp_patients")
      .select("*")
      .eq("id", patientId)
      .single();

    if (error || !data) {
      setMessage("❌ मरीज़ का रिकॉर्ड नहीं मिला! कृपया सही ID डालें।");
    } else if (String(data.admin_status).toUpperCase() !== "APPROVED") {
      setMessage("⚠️ यह कार्ड अभी Admin द्वारा अप्रूव नहीं हुआ है!");
    } else {
      setPatient(data);
    }
    setLoading(false);
  };

  // 2. पर्चा (Prescription) सेव करने का फ़ंक्शन
  const savePrescription = async (e) => {
    e.preventDefault();
    // यहाँ भविष्य में हम 'opd_records' नाम की टेबल में डेटा सेव कर सकते हैं
    // अभी के लिए हम एक अलर्ट दिखा रहे हैं
    alert(`✅ ${patient.patient_name} का पर्चा सफलतापूर्वक सेव हो गया!\n\nदवाइयाँ: ${prescription.medicines}`);
    
    // फॉर्म रिसेट करें
    setPatient(null);
    setPatientId("");
    setPrescription({ symptoms: "", diagnosis: "", medicines: "", notes: "" });
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <h2 style={{margin: 0, fontSize: "18px"}}>👨‍⚕️ Doctor OPD Dashboard</h2>
        <button style={styles.logoutBtn} onClick={() => navigate("/")}>🏠 Home</button>
      </header>

      <main style={styles.main}>
        {/* === SEARCH SECTION === */}
        <div style={styles.card}>
          <h3 style={{margin: "0 0 15px", color: "#173b2a"}}>🔍 Find Patient (मरीज़ खोजें)</h3>
          <form onSubmit={searchPatient} style={{display: "flex", gap: "10px"}}>
            <input 
              type="number" 
              placeholder="Enter Patient ID (e.g. 15)" 
              style={styles.input}
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
            />
            <button type="submit" style={styles.searchBtn} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
          {message && <p style={{color: message.includes("❌") ? "red" : "orange", fontSize: "14px", marginTop: "10px"}}>{message}</p>}
        </div>

        {/* === PATIENT DETAILS & PRESCRIPTION FORM === */}
        {patient && (
          <div style={styles.prescriptionGrid}>
            
            {/* मरीज़ की जानकारी */}
            <div style={styles.card}>
              <h3 style={{margin: "0 0 15px", color: "#173b2a", borderBottom: "2px solid #16804d", paddingBottom: "5px"}}>👤 Patient Info</h3>
              <p><strong>Name:</strong> {patient.patient_name}</p>
              <p><strong>Age/Gender:</strong> {patient.age} Yrs / {patient.gender}</p>
              <p><strong>Mobile:</strong> {patient.mobile}</p>
              <p><strong>Blood Group:</strong> {patient.blood_group || "N/A"}</p>
              <p><strong>Address:</strong> {patient.village}</p>
            </div>

            {/* डॉक्टर का पर्चा फॉर्म */}
            <div style={styles.card}>
              <h3 style={{margin: "0 0 15px", color: "#173b2a", borderBottom: "2px solid #16804d", paddingBottom: "5px"}}>✍️ Digital Prescription</h3>
              
              <form onSubmit={savePrescription} style={{display: "flex", flexDirection: "column", gap: "15px"}}>
                <div>
                  <label style={styles.label}>Symptoms (लक्षण):</label>
                  <textarea 
                    style={styles.textarea} 
                    placeholder="मरीज़ को क्या परेशानी है?"
                    value={prescription.symptoms}
                    onChange={(e) => setPrescription({...prescription, symptoms: e.target.value})}
                    required
                  ></textarea>
                </div>
                
                <div>
                  <label style={styles.label}>Diagnosis (बीमारी):</label>
                  <input 
                    type="text" 
                    style={styles.inputFull} 
                    placeholder="e.g. Viral Fever, Hypertension"
                    value={prescription.diagnosis}
                    onChange={(e) => setPrescription({...prescription, diagnosis: e.target.value})}
                  />
                </div>

                <div>
                  <label style={styles.label}>Medicines (दवाइयाँ):</label>
                  <textarea 
                    style={styles.textarea} 
                    placeholder="1. Paracetamol 500mg (1-0-1)&#10;2. Vitamin C"
                    value={prescription.medicines}
                    onChange={(e) => setPrescription({...prescription, medicines: e.target.value})}
                    required
                  ></textarea>
                </div>

                <div>
                  <label style={styles.label}>Doctor Notes / Advice:</label>
                  <input 
                    type="text" 
                    style={styles.inputFull} 
                    placeholder="आराम करें, गर्म पानी पिएं..."
                    value={prescription.notes}
                    onChange={(e) => setPrescription({...prescription, notes: e.target.value})}
                  />
                </div>

                <button type="submit" style={styles.saveBtn}>💾 Save Prescription</button>
              </form>
            </div>

          </div>
        )}
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
  backBtn: { background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "8px 15px", borderRadius: "6px", cursor: "pointer" },
  logoutBtn: { background: "#16804d", border: "none", color: "white", padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  
  main: { padding: "30px 5%", maxWidth: "1000px", margin: "0 auto" },
  card: { background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", marginBottom: "20px" },
  prescriptionGrid: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" },
  
  input: { flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "16px" },
  inputFull: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", minHeight: "80px", boxSizing: "border-box", resize: "vertical" },
  searchBtn: { background: "#16a34a", color: "white", border: "none", padding: "10px 25px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" },
  saveBtn: { background: "#f97316", color: "white", border: "none", padding: "12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "16px", marginTop: "10px" },
  label: { display: "block", marginBottom: "5px", fontWeight: "bold", color: "#374151", fontSize: "14px" }
};

export default DoctorDashboard;