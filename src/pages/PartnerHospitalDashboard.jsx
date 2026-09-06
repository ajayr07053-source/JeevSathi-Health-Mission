import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function PartnerHospitalDashboard() {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState("");
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // फॉर्म के लिए स्टेट (इलाज और बिल की जानकारी)
  const [treatment, setTreatment] = useState({
    hospitalName: "",
    treatmentDetails: "",
    totalBill: "",
    discountGiven: ""
  });

  // 1. मरीज़ का कार्ड वेरीफाई करने का फ़ंक्शन
  const verifyPatient = async (e) => {
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
      setMessage("❌ अमान्य कार्ड! सिस्टम में यह रिकॉर्ड नहीं मिला।");
    } else if (String(data.admin_status).toUpperCase() !== "APPROVED") {
      setMessage("⚠️ यह कार्ड अभी संस्था द्वारा अप्रूव नहीं किया गया है!");
    } else {
      setPatient(data);
      setMessage("✅ कार्ड सफलतापूर्वक वेरीफाई हो गया!");
    }
    setLoading(false);
  };

  // 2. बिल और डिस्काउंट सेव करने का फ़ंक्शन
  const submitRecord = async (e) => {
    e.preventDefault();
    // भविष्य में हम इसे Supabase की 'hospital_records' टेबल में सेव करेंगे
    alert(`✅ रिकॉर्ड सफलतापूर्वक सेव हो गया!\n\nमरीज़: ${patient.patient_name}\nअस्पताल: ${treatment.hospitalName}\nछूट (Discount): ₹${treatment.discountGiven}`);
    
    // फॉर्म रिसेट करें
    setPatient(null);
    setPatientId("");
    setMessage("");
    setTreatment({ hospitalName: "", treatmentDetails: "", totalBill: "", discountGiven: "" });
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <h2 style={{margin: 0, fontSize: "18px"}}>🏥 Partner Hospital Portal</h2>
        <button style={styles.logoutBtn} onClick={() => navigate("/")}>🏠 Home</button>
      </header>

      <main style={styles.main}>
        {/* === STEP 1: VERIFY CARD === */}
        <div style={styles.card}>
          <h3 style={{margin: "0 0 15px", color: "#1e3a8a"}}>🔍 Verify Patient Card</h3>
          <form onSubmit={verifyPatient} style={{display: "flex", gap: "10px"}}>
            <input 
              type="number" 
              placeholder="Enter Patient ID (e.g. 15)" 
              style={styles.input}
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
            />
            <button type="submit" style={styles.searchBtn} disabled={loading}>
              {loading ? "Verifying..." : "Verify Card"}
            </button>
          </form>
          {message && (
            <p style={{
              color: message.includes("✅") ? "green" : message.includes("⚠️") ? "orange" : "red", 
              fontWeight: "bold", 
              marginTop: "10px"
            }}>
              {message}
            </p>
          )}
        </div>

        {/* === STEP 2: PATIENT DETAILS & BILLING FORM === */}
        {patient && (
          <div style={styles.grid}>
            
            {/* मरीज़ की जानकारी */}
            <div style={styles.card}>
              <h3 style={{margin: "0 0 15px", color: "#1e3a8a", borderBottom: "2px solid #3b82f6", paddingBottom: "5px"}}>👤 Cardholder Details</h3>
              <div style={styles.detailsBox}>
                <p style={styles.p}><strong>Name:</strong> {patient.patient_name}</p>
                <p style={styles.p}><strong>Card No:</strong> {patient.health_card_number || `JHM-000${patient.id}`}</p>
                <p style={styles.p}><strong>Age/Gender:</strong> {patient.age} Yrs / {patient.gender}</p>
                <p style={styles.p}><strong>Mobile:</strong> {patient.mobile}</p>
                <p style={styles.p}><strong>Address:</strong> {patient.village}, {patient.district}</p>
                <div style={styles.validBadge}>ACTIVE & VALID</div>
              </div>
            </div>

            {/* अस्पताल का फॉर्म (Discount Entry) */}
            <div style={styles.card}>
              <h3 style={{margin: "0 0 15px", color: "#1e3a8a", borderBottom: "2px solid #3b82f6", paddingBottom: "5px"}}>📝 Treatment & Discount Entry</h3>
              
              <form onSubmit={submitRecord} style={{display: "flex", flexDirection: "column", gap: "12px"}}>
                <div>
                  <label style={styles.label}>Hospital / Clinic Name:</label>
                  <input 
                    type="text" 
                    style={styles.inputFull} 
                    placeholder="e.g. City Care Hospital"
                    value={treatment.hospitalName}
                    onChange={(e) => setTreatment({...treatment, hospitalName: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label style={styles.label}>Treatment / Service Provided:</label>
                  <input 
                    type="text" 
                    style={styles.inputFull} 
                    placeholder="e.g. Blood Test, X-Ray, General OPD"
                    value={treatment.treatmentDetails}
                    onChange={(e) => setTreatment({...treatment, treatmentDetails: e.target.value})}
                    required
                  />
                </div>

                <div style={{display: "flex", gap: "10px"}}>
                  <div style={{flex: 1}}>
                    <label style={styles.label}>Total Bill Amount (₹):</label>
                    <input 
                      type="number" 
                      style={styles.inputFull} 
                      placeholder="e.g. 2000"
                      value={treatment.totalBill}
                      onChange={(e) => setTreatment({...treatment, totalBill: e.target.value})}
                      required
                    />
                  </div>
                  <div style={{flex: 1}}>
                    <label style={styles.label}>Discount Given (₹):</label>
                    <input 
                      type="number" 
                      style={styles.inputFull} 
                      placeholder="e.g. 500"
                      value={treatment.discountGiven}
                      onChange={(e) => setTreatment({...treatment, discountGiven: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <button type="submit" style={styles.saveBtn}>💾 Submit Record</button>
              </form>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

// ==========================================
// 🎨 STYLES (Hospital Theme: Blue/Gray)
// ==========================================
const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f0f4f8", fontFamily: "Arial, sans-serif" },
  header: { background: "#1e3a8a", padding: "15px 5%", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" },
  backBtn: { background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "8px 15px", borderRadius: "6px", cursor: "pointer" },
  logoutBtn: { background: "#3b82f6", border: "none", color: "white", padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  
  main: { padding: "30px 5%", maxWidth: "1000px", margin: "0 auto" },
  card: { background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", marginBottom: "20px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px" },
  
  input: { flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "16px" },
  inputFull: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" },
  searchBtn: { background: "#2563eb", color: "white", border: "none", padding: "10px 25px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" },
  saveBtn: { background: "#059669", color: "white", border: "none", padding: "12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "16px", marginTop: "10px" },
  
  label: { display: "block", marginBottom: "5px", fontWeight: "bold", color: "#475569", fontSize: "13px" },
  detailsBox: { background: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0" },
  p: { margin: "0 0 8px", fontSize: "14px", color: "#334155" },
  validBadge: { display: "inline-block", background: "#dcfce7", color: "#166534", padding: "5px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", marginTop: "10px", border: "1px solid #16a34a" }
};

export default PartnerHospitalDashboard;