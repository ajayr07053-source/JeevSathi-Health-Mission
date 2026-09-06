import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function VerifyCard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(id || "");
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState("IDLE"); // 'IDLE', 'VALID', 'PENDING', 'INVALID'

  useEffect(() => {
    if (id) {
      verifyCardById(id);
    }
  }, [id]);

  const extractNumericId = (inputVal) => {
    if (!inputVal) return "";
    const cleanStr = String(inputVal).trim();
    // अगर JHM-00012 जैसा है, तो केवल अंक (12) निकालें
    const digitsOnly = cleanStr.replace(/[^0-9]/g, "");
    return digitsOnly ? parseInt(digitsOnly, 10) : cleanStr;
  };

  const verifyCardById = async (inputVal) => {
    if (!inputVal || !String(inputVal).trim()) return;

    setLoading(true);
    setVerifyStatus("IDLE");
    setCardData(null);

    const targetId = extractNumericId(inputVal);

    try {
      // 1. आईडी या मोबाइल नंबर दोनों से चेक करें
      let query = supabase.from("camp_patients").select("*");

      if (!isNaN(targetId) && Number(targetId) > 0) {
        query = query.or(`id.eq.${targetId},mobile.eq.${String(inputVal).trim()}`);
      } else {
        query = query.eq("mobile", String(inputVal).trim());
      }

      const { data, error } = await query.maybeSingle();

      setLoading(false);

      if (error || !data) {
        setVerifyStatus("INVALID");
      } else {
        setCardData(data);
        const status = String(data.admin_status || "").toUpperCase();
        if (status === "APPROVED") {
          setVerifyStatus("VALID");
        } else {
          setVerifyStatus("PENDING");
        }
      }
    } catch (err) {
      console.error("Verification error:", err);
      setLoading(false);
      setVerifyStatus("INVALID");
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      verifyCardById(searchId.trim());
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h2 style={{ margin: 0, fontSize: "18px" }}>🌿 JeevSathi Health Mission</h2>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#d1fae5" }}>
          Official Card Verification Portal • Sinux India Foundation
        </p>
      </header>

      <main style={styles.main}>
        {/* सर्च बॉक्स */}
        <div style={styles.searchCard}>
          <h3 style={{ margin: "0 0 10px", fontSize: "16px", color: "#0f172a" }}>
            🔍 कार्ड सत्यापन (Verify Health Card)
          </h3>
          <p style={{ margin: "0 0 15px", fontSize: "12px", color: "#64748b" }}>
            कार्ड पर दर्ज कार्ड नंबर (उदा. JHM-000012) या पंजीकृत मोबाइल नंबर दर्ज करें:
          </p>

          <form onSubmit={handleManualSearch} style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="Card ID या Mobile Number"
              style={styles.input}
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              required
            />
            <button type="submit" disabled={loading} style={styles.btnSearch}>
              {loading ? "जाँच जारी..." : "सत्यापित करें"}
            </button>
          </form>
        </div>

        {/* नतीजा 1: VALID CARD */}
        {verifyStatus === "VALID" && cardData && (
          <div style={styles.validCard}>
            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <span style={{ fontSize: "40px" }}>✅</span>
              <h3 style={{ color: "#166534", margin: "5px 0" }}>VERIFIED / मान्य कार्ड</h3>
              <p style={{ fontSize: "12px", color: "#15803d", margin: 0 }}>
                यह कार्ड Sinux India Foundation के अंतर्गत सक्रिय एवं पंजीकृत है।
              </p>
            </div>

            <div style={styles.detailsTable}>
              <div style={styles.detailRow}>
                <span style={styles.detailKey}>कार्ड नंबर:</span>
                <span style={styles.detailVal}>
                  JHM-{String(cardData.id).padStart(6, "0")}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailKey}>मरीज़ का नाम:</span>
                <span style={styles.detailVal}>
                  {cardData.patient_name || cardData.full_name}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailKey}>पिता/पति का नाम:</span>
                <span style={styles.detailVal}>
                  {cardData.father_husband_name || cardData.guardian_name || "N/A"}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailKey}>मोबाइल नंबर:</span>
                <span style={styles.detailVal}>
                  +91 {cardData.mobile ? String(cardData.mobile).replace(/(\d{5})(\d{5})/, "$1-$2") : "N/A"}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailKey}>क्षेत्र (Location):</span>
                <span style={styles.detailVal}>
                  {cardData.village}, {cardData.block}, {cardData.district}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailKey}>आयुष्मान सुरक्षा:</span>
                <span style={styles.detailVal}>
                  {cardData.ayushman_status === "YES" ? "🟢 उपलब्ध (100% फ्री सुविधा)" : "⚪ सामान्य कार्ड छूट"}
                </span>
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => navigate(`/health-card/${cardData.id}`)}
                style={styles.btnViewPVC}
              >
                🪪 डिजिटल PVC कार्ड देखें →
              </button>
              <button onClick={() => navigate("/")} style={styles.btnHome}>
                🏠 Home
              </button>
            </div>
          </div>
        )}

        {/* नतीजा 2: PENDING VERIFICATION */}
        {verifyStatus === "PENDING" && cardData && (
          <div style={styles.pendingCard}>
            <span style={{ fontSize: "40px" }}>⏳</span>
            <h3 style={{ color: "#9a3412", margin: "5px 0" }}>सत्यापन पेंडिंग (Under Verification)</h3>
            <p style={{ fontSize: "13px", color: "#78716c", margin: "0 0 15px" }}>
              इस कार्ड का रिकॉर्ड सिस्टम में है, परंतु शुल्क सत्यापन या सुपरवाइजर अप्रूवल पेंडिंग है।
            </p>
            <div style={{ fontSize: "13px", color: "#44403c", marginBottom: "15px", textAlign: "left" }}>
              <p style={{ margin: "4px 0" }}><strong>नाम:</strong> {cardData.patient_name}</p>
              <p style={{ margin: "4px 0" }}><strong>ब्लॉक:</strong> {cardData.block} ({cardData.district})</p>
              <p style={{ margin: "4px 0" }}><strong>अधिकारी (FO):</strong> {cardData.fo_name || "Unassigned"}</p>
            </div>
            <button
              onClick={() => navigate(`/get-card?patient_id=${cardData.id}`)}
              style={styles.btnActivate}
            >
              ⚡ ₹150 ऑनलाइन भुगतान करके तुरंत सक्रिय करें →
            </button>
          </div>
        )}

        {/* नतीजा 3: INVALID / FAKE */}
        {verifyStatus === "INVALID" && (
          <div style={styles.invalidCard}>
            <span style={{ fontSize: "45px" }}>❌</span>
            <h3 style={{ color: "#991b1b", margin: "8px 0 4px" }}>INVALID / FAKE CARD</h3>
            <p style={{ color: "#b91c1c", fontSize: "14px", fontWeight: "bold", margin: "0 0 10px" }}>
              सिस्टम में इस कार्ड का कोई रिकॉर्ड नहीं मिला!
            </p>
            <p style={{ fontSize: "12px", color: "#7f1d1d", margin: "0 0 20px" }}>
              कृपया कार्ड नंबर पुनः जाँचें अथवा अधिकृत JeevSathi हेल्थ कार्ड बनवाने के लिए नया रजिस्ट्रेशन करें।
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button onClick={() => navigate("/patient-registration")} style={styles.btnRegister}>
                📝 नया कार्ड बनवाएं (₹150)
              </button>
              <button onClick={() => navigate("/")} style={styles.btnHome}>
                🏠 Go to Home
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  header: { background: "#065f46", color: "white", padding: "12px 5%", textAlign: "center" },
  main: { maxWidth: "550px", margin: "30px auto", padding: "0 15px" },

  searchCard: { background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", marginBottom: "20px" },
  input: { flex: 1, padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" },
  btnSearch: { background: "#065f46", color: "white", border: "none", padding: "10px 18px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" },

  validCard: { background: "#f0fdf4", border: "2px solid #86efac", padding: "25px", borderRadius: "14px", textAlign: "center" },
  detailsTable: { background: "white", borderRadius: "8px", border: "1px solid #bbf7d0", padding: "12px", textAlign: "left", marginTop: "15px" },
  detailRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed #e2e8f0", fontSize: "13px" },
  detailKey: { color: "#64748b", fontWeight: "600" },
  detailVal: { color: "#0f172a", fontWeight: "bold" },
  btnViewPVC: { flex: 1, background: "#ea580c", color: "white", border: "none", padding: "10px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" },

  pendingCard: { background: "#fff7ed", border: "2px solid #fdba74", padding: "25px", borderRadius: "14px", textAlign: "center" },
  btnActivate: { background: "#ea580c", color: "white", border: "none", padding: "10px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "13px", width: "100%" },

  invalidCard: { background: "#fef2f2", border: "2px solid #fca5a5", padding: "30px 20px", borderRadius: "14px", textAlign: "center" },
  btnRegister: { background: "#065f46", color: "white", border: "none", padding: "10px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" },
  btnHome: { background: "#e2e8f0", color: "#334155", border: "none", padding: "10px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }
};

export default VerifyCard;