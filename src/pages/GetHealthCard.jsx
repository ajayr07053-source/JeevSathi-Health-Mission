import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

function GetHealthCard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [patientId, setPatientId] = useState("");
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);

  // आपकी Razorpay Key
  const RAZORPAY_KEY_ID = "rzp_live_TYDkcyqOaSzOq5";

  useEffect(() => {
    const paramId = searchParams.get("patient_id");
    if (paramId) {
      setPatientId(paramId);
      loadPatient(paramId);
    }
  }, [searchParams]);

  const loadPatient = async (id) => {
    const { data } = await supabase.from("camp_patients").select("*").eq("id", id).maybeSingle();
    if (data) setPatientData(data);
  };

  // 🚀 ऑनलाइन पेमेंट सक्सेस: एडमिन अप्रूवल की ज़रूरत नहीं, कार्ड अपने-आप APPROVED हो जाएगा
  const handlePaymentSuccess = async (pid, paymentResponse) => {
    setLoading(true);

    const { error } = await supabase.from("camp_patients").update({
      admin_status: "APPROVED",          // 👈 बिना एडमिन के अपने-आप अप्रूव
      supervisor_status: "VERIFIED",      // 👈 स्वतः सत्यापित
      payment_status: "PAID",            // 👈 पेड
      payment_mode: "ONLINE_PAID"        // 👈 ऑनलाइन मोड
    }).eq("id", pid);

    setLoading(false);

    if (error) {
      alert("⚠️ पेमेंट प्राप्त हुआ परंतु कार्ड स्टेटस अपडेट में त्रुटि: " + error.message);
    } else {
      alert("🎉 ₹150 ऑनलाइन भुगतान सफल रहा! आपका JeevSathi हेल्थ कार्ड तुरंत सक्रिय हो गया है।");
      // सीधे बना हुआ डिजिटल कार्ड दिखाएं
      navigate(`/health-card/${pid}`);
    }
  };

  const handlePay = () => {
    if (!patientId.trim()) {
      alert("कृपया मान्य Patient ID दर्ज करें!");
      return;
    }

    if (!window.Razorpay) {
      // यदि Razorpay स्क्रिप्ट लोड न हो तो बैकअप कन्फर्मेशन
      if (window.confirm("🧪 टेस्ट मोड: क्या आप ₹150 ऑनलाइन पेमेंट मानकर कार्ड तुरंत एक्टिवेट करना चाहते हैं?")) {
        handlePaymentSuccess(patientId, { razorpay_payment_id: "TEST_PAY_ONLINE" });
      }
      return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: 150 * 100, // ₹150 (paise में)
      currency: "INR",
      name: "Sinux India Foundation",
      description: "JeevSathi Annual Health Card Instant Activation",
      image: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
      handler: function (response) {
        handlePaymentSuccess(patientId, response);
      },
      prefill: {
        name: patientData?.patient_name || "",
        contact: patientData?.mobile || ""
      },
      notes: {
        patient_id: patientId,
        purpose: "Instant Card Activation (No Admin Needed)"
      },
      theme: {
        color: "#065f46"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (response) {
      alert("❌ भुगतान विफल रहा: " + response.error.description);
    });
    rzp.open();
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h2 style={{ margin: 0, fontSize: "18px" }}>🪪 Instant Health Card Activation</h2>
      </header>

      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconCircle}>💳</div>
          <h3 style={{ margin: "10px 0 2px", color: "#1e3a8a" }}>JeevSathi Smart Health Card</h3>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>1 कार्ड • कई पार्टनर अस्पतालों में छूट</p>

          <div style={styles.benefitBox}>
            <p style={styles.benefitItem}>⚡ <strong>ऑनलाइन पेमेंट करते ही कार्ड तुरंत तैयार</strong></p>
            <p style={styles.benefitItem}>🏥 <strong>Partner Hospitals</strong> में ओपीडी पर छूट</p>
            <p style={styles.benefitItem}>💊 <strong>Medical Stores</strong> पर 10%-15% डिस्काउंट</p>
            <p style={styles.benefitItem}>🔬 <strong>Diagnostics / Labs</strong> में 20% तक बचत</p>
          </div>

          <h2 style={{ color: "#16a34a", margin: "15px 0" }}>
            ₹150 <span style={{ fontSize: "13px", color: "#64748b" }}>/year</span>
          </h2>

          <div style={{ textAlign: "left", width: "100%", marginBottom: "15px" }}>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "#475569" }}>Patient ID (पंजीकरण नंबर)</label>
            <input
              type="text"
              style={styles.input}
              placeholder="e.g. 12"
              value={patientId}
              onChange={e => {
                setPatientId(e.target.value);
                loadPatient(e.target.value);
              }}
            />
            {patientData && (
              <p style={{ fontSize: "12px", color: "#065f46", margin: "4px 0 0", fontWeight: "bold" }}>
                मरीज़: {patientData.patient_name} ({patientData.mobile})
              </p>
            )}
          </div>

          <button onClick={handlePay} disabled={loading} style={styles.btnPay}>
            {loading ? "⏳ कार्ड बन रहा है..." : "💳 Pay ₹150 & Generate Card Instantly"}
          </button>

          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "12px" }}>
            🔒 सुरक्षित ऑनलाइन भुगतान • एडमिन अप्रूवल की आवश्यकता नहीं
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f0fdf4", fontFamily: "'Inter', sans-serif" },
  header: { background: "#064e3b", color: "white", padding: "12px", textAlign: "center" },
  container: { display: "flex", justifyContent: "center", padding: "30px 15px" },
  card: { maxWidth: "380px", width: "100%", background: "white", borderRadius: "16px", padding: "25px", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" },
  iconCircle: { width: "50px", height: "50px", background: "#fef3c7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: "24px" },
  benefitBox: { background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px dashed #cbd5e1", marginTop: "15px", textAlign: "left" },
  benefitItem: { margin: "6px 0", fontSize: "12px", color: "#334155" },
  input: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", marginTop: "4px", boxSizing: "border-box" },
  btnPay: { width: "100%", background: "#2563eb", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", cursor: "pointer" }
};

export default GetHealthCard;