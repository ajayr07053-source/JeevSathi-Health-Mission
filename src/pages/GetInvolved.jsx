import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function GetInvolved() {
  const navigate = useNavigate();
  
  // Volunteer Form State
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    district: "",
    interest: "Camp Setup",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Donation State
  const [donationAmount, setDonationAmount] = useState(500);
  const [payMethod, setPayMethod] = useState("online"); // 'online' या 'qr'

  // =====================================================
  // VOLUNTEER SUBMIT
  // =====================================================
  const handleVolunteerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("volunteers")
        .insert([{ 
          name: formData.name, 
          mobile: formData.mobile, 
          district: formData.district, 
          interest: formData.interest,
          status: "Pending" 
        }]);

      if (error) console.log("Supabase error:", error);

      setMessage("✅ धन्यवाद! आपका फॉर्म जमा हो गया है। हमारी टीम जल्द ही आपसे संपर्क करेगी।");
      setFormData({ name: "", mobile: "", district: "", interest: "Camp Setup" });
    } catch (err) {
      setMessage("❌ कुछ समस्या आई, कृपया बाद में प्रयास करें।");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RAZORPAY DONATION INTEGRATION
  // =====================================================
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleDonation = async () => {
    if (!donationAmount || donationAmount < 10) {
      alert("कृपया सही डोनेशन राशि दर्ज करें (कम से कम ₹10)");
      return;
    }

    const res = await loadRazorpayScript();

    if (!res) {
      alert("Razorpay लोड होने में विफल रहा। क्या आप ऑनलाइन हैं?");
      return;
    }

    const options = {
      key: "rzp_test_TYsPcrKvwPpwXQ", 
      amount: donationAmount * 100, 
      currency: "INR",
      name: "Sinux India Foundation",
      description: "Donation for JeevSathi Health Mission",
      image: "https://your-ngo-logo-url.png", 
      handler: async function (response) {
        alert(`✅ डोनेशन सफल रहा! धन्यवाद। Payment ID: ${response.razorpay_payment_id}`);
      },
      prefill: {
        name: formData.name || "",
        contact: formData.mobile || "",
      },
      theme: {
        color: "#16804d", 
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={{ fontSize: "24px" }}>🤝</span>
          <h1 style={styles.title}>Get Involved - JeevSathi</h1>
        </div>
        <button style={styles.backBtn} onClick={() => navigate("/")}>
          ← Back to Home
        </button>
      </header>

      <div style={styles.container}>
        {/* HERO SECTION */}
        <div style={styles.hero}>
          <h2 style={styles.heroTitle}>हमारे स्वास्थ्य मिशन का हिस्सा बनें</h2>
          <p style={styles.heroText}>
            Sinux India Foundation के JeevSathi Mission का उद्देश्य हर ज़रूरतमंद तक स्वास्थ्य सुविधाएँ पहुँचाना है। 
            आप अपना समय देकर (Volunteer) या आर्थिक मदद (Donate) करके इस नेक काम में हमारा साथ दे सकते हैं।
          </p>
        </div>

        <div style={styles.grid}>
          
          {/* VOLUNTEER FORM */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={{ fontSize: "30px" }}>🙋‍♂️</span>
              <h3 style={styles.cardTitle}>Become a Volunteer</h3>
              <p style={styles.cardSubtitle}>कैम्प्स और अभियानों में हमारी मदद करें</p>
            </div>
            
            <form onSubmit={handleVolunteerSubmit} style={styles.form}>
              {message && (
                <div style={message.includes("✅") ? styles.successBox : styles.errorBox}>
                  {message}
                </div>
              )}
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>पूरा नाम (Full Name)</label>
                <input 
                  type="text" 
                  required 
                  style={styles.input} 
                  placeholder="e.g. Rahul Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>मोबाइल नंबर (Mobile)</label>
                <input 
                  type="tel" 
                  required 
                  style={styles.input} 
                  placeholder="10 digit number"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>ज़िला (District)</label>
                <input 
                  type="text" 
                  required 
                  style={styles.input} 
                  placeholder="e.g. Lucknow"
                  value={formData.district}
                  onChange={(e) => setFormData({...formData, district: e.target.value})}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>आप कैसे मदद कर सकते हैं?</label>
                <select 
                  style={styles.input}
                  value={formData.interest}
                  onChange={(e) => setFormData({...formData, interest: e.target.value})}
                >
                  <option value="Camp Setup">Health Camp Setup</option>
                  <option value="Patient Registration">Patient Registration / Data Entry</option>
                  <option value="Medical Staff">Medical Staff / Nursing</option>
                  <option value="Crowd Management">Crowd Management</option>
                </select>
              </div>

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? "Sending..." : "Submit Registration"}
              </button>
            </form>
          </div>

          {/* DONATION SECTION */}
          <div style={styles.card}>
            <div style={styles.cardHeaderOrange}>
              <span style={{ fontSize: "30px" }}>💖</span>
              <h3 style={styles.cardTitle}>Make a Donation</h3>
              <p style={styles.cardSubtitle}>आपके सहयोग से किसी की जान बच सकती है</p>
            </div>
            
            <div style={styles.donationBody}>
              
              {/* Payment Method Toggle */}
              <div style={styles.toggleContainer}>
                <button 
                  style={payMethod === "online" ? styles.tabActive : styles.tabInactive}
                  onClick={() => setPayMethod("online")}
                >
                  💳 ऑनलाइन पेमेंट
                </button>
                <button 
                  style={payMethod === "qr" ? styles.tabActive : styles.tabInactive}
                  onClick={() => setPayMethod("qr")}
                >
                  📱 QR / UPI Link
                </button>
              </div>

              {/* 1. ONLINE PAYMENT (RAZORPAY) */}
              {payMethod === "online" && (
                <div style={{ animation: "fadeIn 0.3s" }}>
                  <p style={{ color: "#4b5563", fontSize: "14px", lineHeight: "1.6", textAlign: "center", marginBottom: "20px" }}>
                    आपके द्वारा दी गई राशि का उपयोग सीधे Health Camps लगाने और मुफ़्त दवाइयाँ बाँटने में किया जाता है।
                  </p>

                  <div style={styles.amountSelector}>
                    <button style={donationAmount === 500 ? styles.amtBtnActive : styles.amtBtn} onClick={() => setDonationAmount(500)}>₹500</button>
                    <button style={donationAmount === 1000 ? styles.amtBtnActive : styles.amtBtn} onClick={() => setDonationAmount(1000)}>₹1000</button>
                    <button style={donationAmount === 5000 ? styles.amtBtnActive : styles.amtBtn} onClick={() => setDonationAmount(5000)}>₹5000</button>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Custom Amount (₹)</label>
                    <input 
                      type="number" 
                      style={styles.input} 
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(Number(e.target.value))}
                    />
                  </div>

                  <button onClick={handleDonation} style={styles.donateBtn}>
                    Donate ₹{donationAmount} Securely
                  </button>
                </div>
              )}

              {/* 2. DIRECT QR & UPI */}
              {payMethod === "qr" && (
                <div style={styles.qrSection}>
                  <p style={{ fontSize: "14px", color: "#4b5563", marginBottom: "15px" }}>किसी भी UPI ऐप (PhonePe, Google Pay, Paytm) से स्कैन करें:</p>
                  
                  {/* 🚀 अपना असली QR कोड इमेज यहाँ लगाएँ */}
                  <div style={styles.qrFrame}>
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" 
                      alt="Scan to Donate" 
                      style={styles.qrImage}
                    />
                  </div>

                  {/* 🚀 अपनी असली UPI ID यहाँ लगाएँ */}
                  <div style={styles.upiContainer}>
                    <span style={styles.upiLabel}>UPI ID:</span>
                    <strong style={styles.upiId}>sinuxindia@upi</strong>
                  </div>

                  <div style={styles.divider}>
                    <span style={styles.dividerText}>या (OR)</span>
                  </div>

                  {/* 🚀 अपना असली Payment Link यहाँ लगाएँ */}
                  <a 
                    href="https://rzp.io/l/your_payment_link" 
                    target="_blank" 
                    rel="noreferrer" 
                    style={styles.paymentLinkBtn}
                  >
                    🔗 Click Here to Pay via Link
                  </a>
                </div>
              )}

              <div style={styles.taxNote}>
                <small>🔒 100% Secure. All donations to Sinux India Foundation are tax-exempted under section 80G.</small>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ==============================================
// 🎨 STYLES
// ==============================================
const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f3f8f5", fontFamily: "Arial, sans-serif" },
  header: { background: "#173b2a", padding: "15px 5%", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" },
  brand: { display: "flex", alignItems: "center", gap: "10px" },
  title: { margin: 0, fontSize: "20px" },
  backBtn: { background: "transparent", border: "1px solid #a5d1b9", color: "white", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  
  container: { maxWidth: "1100px", margin: "0 auto", padding: "40px 20px" },
  
  hero: { textAlign: "center", marginBottom: "40px" },
  heroTitle: { color: "#16804d", fontSize: "32px", marginBottom: "10px", fontWeight: "bold" },
  heroText: { color: "#4b5563", fontSize: "16px", maxWidth: "700px", margin: "0 auto", lineHeight: "1.6" },
  
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px" },
  
  card: { background: "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", border: "1px solid #e1e9e4", display: "flex", flexDirection: "column" },
  cardHeader: { background: "#e8f5ec", padding: "25px", textAlign: "center", borderBottom: "1px solid #cce4d6" },
  cardHeaderOrange: { background: "#fff7ed", padding: "25px", textAlign: "center", borderBottom: "1px solid #ffedd5" },
  cardTitle: { margin: "10px 0 5px", color: "#173b2a", fontSize: "22px", fontWeight: "bold" },
  cardSubtitle: { margin: 0, color: "#6b7280", fontSize: "13px" },
  
  form: { padding: "25px", flex: 1 },
  inputGroup: { marginBottom: "15px" },
  label: { display: "block", marginBottom: "5px", color: "#374151", fontSize: "13px", fontWeight: "bold" },
  input: { width: "100%", padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", outline: "none", fontSize: "14px", boxSizing: "border-box" },
  submitBtn: { width: "100%", background: "#16804d", color: "white", border: "none", padding: "14px", borderRadius: "8px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
  
  donationBody: { padding: "25px", flex: 1, display: "flex", flexDirection: "column" },
  
  // Toggles
  toggleContainer: { display: "flex", background: "#f3f4f6", borderRadius: "8px", padding: "5px", marginBottom: "25px" },
  tabActive: { flex: 1, padding: "10px", border: "none", background: "white", borderRadius: "6px", fontWeight: "bold", color: "#16804d", cursor: "pointer", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
  tabInactive: { flex: 1, padding: "10px", border: "none", background: "transparent", color: "#6b7280", fontWeight: "bold", cursor: "pointer" },

  amountSelector: { display: "flex", gap: "10px", marginBottom: "20px" },
  amtBtn: { flex: 1, padding: "10px", background: "white", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", color: "#374151" },
  amtBtnActive: { flex: 1, padding: "10px", background: "#fff7ed", border: "2px solid #f97316", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", color: "#f97316" },
  
  donateBtn: { width: "100%", background: "linear-gradient(135deg, #f97316, #ea580c)", color: "white", border: "none", padding: "15px", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginTop: "10px", boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)" },
  
  // QR & UPI Styles
  qrSection: { textAlign: "center", animation: "fadeIn 0.3s", display: "flex", flexDirection: "column", alignItems: "center" },
  qrFrame: { padding: "10px", border: "2px dashed #cbd5e1", borderRadius: "12px", background: "white", display: "inline-block", marginBottom: "15px" },
  qrImage: { width: "180px", height: "180px", objectFit: "contain" },
  upiContainer: { background: "#f8fafc", padding: "10px 20px", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px", width: "100%", boxSizing: "border-box", justifyContent: "center" },
  upiLabel: { color: "#64748b", fontSize: "14px" },
  upiId: { color: "#0f172a", fontSize: "16px", letterSpacing: "0.5px" },
  divider: { margin: "20px 0", position: "relative", width: "100%", textAlign: "center" },
  dividerText: { background: "white", padding: "0 15px", color: "#94a3b8", fontSize: "12px", fontWeight: "bold", position: "relative", zIndex: 1 },
  paymentLinkBtn: { display: "block", width: "100%", background: "#2563eb", color: "white", textDecoration: "none", padding: "14px", borderRadius: "8px", fontWeight: "bold", fontSize: "15px" },
  
  taxNote: { marginTop: "auto", paddingTop: "20px", paddingBottom: "10px", color: "#166534", fontSize: "11px", textAlign: "center" },
  
  successBox: { padding: "10px", background: "#dcfce7", color: "#166534", borderRadius: "8px", marginBottom: "15px", fontSize: "13px" },
  errorBox: { padding: "10px", background: "#fee2e2", color: "#991b1b", borderRadius: "8px", marginBottom: "15px", fontSize: "13px" },
};

export default GetInvolved;