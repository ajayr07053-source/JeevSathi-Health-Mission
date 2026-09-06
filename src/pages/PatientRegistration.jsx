import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function PatientRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [districtsList, setDistrictsList] = useState([]);
  const [blocksList, setBlocksList] = useState([]);
  const [availableFOs, setAvailableFOs] = useState([]);

  // फ़ोटो स्टेट
  const [patientPhoto, setPatientPhoto] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    guardian_name: "",
    gender: "",
    dob: "",
    mobile: "",
    district: "",
    block: "",
    village: "",
    ayushman_status: "DONT_KNOW",
    payment_mode: "PAY_TO_FO", // PAY_TO_FO या ONLINE_PAY
    assigned_fo: ""
  });

  useEffect(() => {
    const loadDistricts = async () => {
      const { data } = await supabase.from("districts").select("*").order("name");
      if (data) setDistrictsList(data);
    };
    loadDistricts();
  }, []);

  useEffect(() => {
    if (formData.district && districtsList.length > 0) {
      const selectedDist = districtsList.find(d => d.name === formData.district);
      if (selectedDist && selectedDist.id) {
        supabase.from("blocks").select("*").eq("district_id", selectedDist.id).order("name")
          .then(({ data }) => setBlocksList(data || []));
      }

      supabase.from("app_users").select("id, name, block, mobile, role")
        .eq("district", formData.district)
        .then(({ data }) => {
          if (data) {
            setAvailableFOs(data.filter(u => String(u.role).toUpperCase().includes("FIELD")));
          }
        });
    } else {
      setBlocksList([]);
      setAvailableFOs([]);
    }
  }, [formData.district, districtsList]);

  // ब्लॉक के हिसाब से ऑटो FO असाइन
  useEffect(() => {
    if (formData.block && availableFOs.length > 0) {
      const matchingFO = availableFOs.find(f => f.block === formData.block);
      if (matchingFO) {
        setFormData(prev => ({ ...prev, assigned_fo: matchingFO.name }));
      } else {
        setFormData(prev => ({ ...prev, assigned_fo: "" }));
      }
    } else {
      setFormData(prev => ({ ...prev, assigned_fo: "" }));
    }
  }, [formData.block, availableFOs]);

  // 📸 फ़ोटो चुनने और कन्वर्ट करने का फंक्शन
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("⚠️ कृपया 2MB से कम साइज़ की फ़ोटो चुनें!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPatientPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isOnline = formData.payment_mode === "ONLINE_PAY";

    const payload = {
      patient_name: formData.full_name,
      father_husband_name: formData.guardian_name,
      gender: formData.gender,
      dob: formData.dob || null,
      age: formData.dob ? Math.floor((new Date() - new Date(formData.dob)) / 31557600000) : null,
      mobile: formData.mobile,
      district: formData.district,
      block: formData.block,
      village: formData.village,
      ayushman_status: formData.ayushman_status,
      photo_url: patientPhoto || "", // 👈 फ़ोटो डेटाबेस में सेव
      payment_status: isOnline ? "INITIATED_ONLINE" : "PENDING_FO_VERIFICATION",
      payment_mode: formData.payment_mode,
      fo_name: formData.assigned_fo || "Unassigned",
      supervisor_status: "PENDING",
      admin_status: "PENDING"
    };

    const { data, error } = await supabase.from("camp_patients").insert([payload]).select();
    setLoading(false);

    if (error) {
      alert("❌ रजिस्ट्रेशन में समस्या: " + error.message);
      return;
    }

    const newPatient = data && data[0] ? data[0] : null;

    if (isOnline && newPatient) {
      navigate(`/get-card?patient_id=${newPatient.id}`);
    } else {
      alert(
        `✅ पंजीकरण सफल!\n\n` +
        `रजिस्ट्रेशन आईडी: #${newPatient?.id}\n` +
        `निर्धारित अधिकारी (FO): ${formData.assigned_fo || "क्षेत्रीय प्रतिनिधि"}\n\n` +
        `कृपया अपने फील्ड ऑफिसर को ₹150 देकर कार्ड सत्यापन करवाएं।`
      );
      navigate("/my-health");
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h2 style={{ margin: 0, fontSize: "20px" }}>🏥 JeevSathi Patient Registration</h2>
        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#d1fae5" }}>Sinux India Foundation</p>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>📝 नया मरीज़ पंजीकरण</h3>

          <form onSubmit={handleSubmit}>
            
            {/* 📸 फ़ोटो अपलोड सेक्शन */}
            <div style={{ ...styles.formSection, background: "#f0fdf4", border: "1px dashed #86efac" }}>
              <h4 style={{ ...styles.subHeading, color: "#166534" }}>📷 मरीज़ की फ़ोटो (Passport Photo)</h4>
              <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                <div style={styles.photoPreviewBox}>
                  {patientPhoto ? (
                    <img src={patientPhoto} alt="Patient Preview" style={styles.previewImg} />
                  ) : (
                    <span style={{ fontSize: "32px", color: "#94a3b8" }}>👤</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label style={styles.label}>पासपोर्ट साइज़ फ़ोटो चुनें (Max 2MB)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ ...styles.input, padding: "7px", marginTop: "5px" }}
                  />
                  <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                    *यह फ़ोटो आपके डिजिटल PVC हेल्थ कार्ड पर प्रिंट होगी।
                  </span>
                </div>
              </div>
            </div>

            {/* 1. व्यक्तिगत जानकारी */}
            <div style={styles.formSection}>
              <h4 style={styles.subHeading}>1. व्यक्तिगत जानकारी</h4>
              <div style={styles.grid2}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Full Name (मरीज़ का पूरा नाम) *</label>
                  <input
                    type="text"
                    style={styles.input}
                    required
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="मरीज़ का नाम लिखें"
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Father / Husband Name *</label>
                  <input
                    type="text"
                    style={styles.input}
                    required
                    value={formData.guardian_name}
                    onChange={e => setFormData({ ...formData, guardian_name: e.target.value })}
                    placeholder="पिता / पति का नाम"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Gender (लिंग) *</label>
                  <select
                    style={styles.input}
                    required
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">-- चुनें --</option>
                    <option value="Male">पुरुष (Male)</option>
                    <option value="Female">महिला (Female)</option>
                    <option value="Other">अन्य (Other)</option>
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Date of Birth (जन्म तिथि)</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={formData.dob}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                  />
                </div>
                <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                  <label style={styles.label}>Mobile Number (मोबाइल नंबर) *</label>
                  <input
                    type="tel"
                    style={styles.input}
                    required
                    maxLength="10"
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="10 अंकों का मोबाइल नंबर"
                  />
                </div>
              </div>
            </div>

            {/* 2. पता */}
            <div style={styles.formSection}>
              <h4 style={styles.subHeading}>2. निवास स्थान (पता)</h4>
              <div style={styles.grid2}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>District (ज़िला) *</label>
                  <select
                    style={styles.input}
                    required
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value, block: "", assigned_fo: "" })}
                  >
                    <option value="">-- ज़िला चुनें --</option>
                    {districtsList.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Block (ब्लॉक) *</label>
                  <select
                    style={styles.input}
                    required
                    value={formData.block}
                    onChange={e => setFormData({ ...formData, block: e.target.value })}
                  >
                    <option value="">-- ब्लॉक चुनें --</option>
                    {blocksList.map(b => <option key={b.id || b.name} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}>
                  <label style={styles.label}>Village / Mohalla (गाँव / मोहल्ला) *</label>
                  <input
                    type="text"
                    style={styles.input}
                    required
                    value={formData.village}
                    onChange={e => setFormData({ ...formData, village: e.target.value })}
                    placeholder="गाँव या स्थानीय पता"
                  />
                </div>
              </div>
            </div>

            {/* 3. आयुष्मान कार्ड स्थिति */}
            <div style={{ ...styles.formSection, background: "#f8fafc", border: "1px solid #cbd5e1" }}>
              <h4 style={{ ...styles.subHeading, color: "#1e3a8a" }}>3. Ayushman Card Status</h4>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <label style={{
                  ...styles.radioLabel,
                  border: formData.ayushman_status === "YES" ? "2px solid #16a34a" : "1px solid #cbd5e1",
                  background: formData.ayushman_status === "YES" ? "#dcfce7" : "white"
                }}>
                  <input
                    type="radio"
                    name="ayushman"
                    value="YES"
                    checked={formData.ayushman_status === "YES"}
                    onChange={e => setFormData({ ...formData, ayushman_status: e.target.value })}
                    style={{ display: "none" }}
                  />
                  ✅ हाँ, कार्ड बना है
                </label>

                <label style={{
                  ...styles.radioLabel,
                  border: formData.ayushman_status === "NO" ? "2px solid #ef4444" : "1px solid #cbd5e1",
                  background: formData.ayushman_status === "NO" ? "#fee2e2" : "white"
                }}>
                  <input
                    type="radio"
                    name="ayushman"
                    value="NO"
                    checked={formData.ayushman_status === "NO"}
                    onChange={e => setFormData({ ...formData, ayushman_status: e.target.value })}
                    style={{ display: "none" }}
                  />
                  ❌ नहीं, नहीं बना है
                </label>

                <label style={{
                  ...styles.radioLabel,
                  border: formData.ayushman_status === "DONT_KNOW" ? "2px solid #f59e0b" : "1px solid #cbd5e1",
                  background: formData.ayushman_status === "DONT_KNOW" ? "#fef3c7" : "white"
                }}>
                  <input
                    type="radio"
                    name="ayushman"
                    value="DONT_KNOW"
                    checked={formData.ayushman_status === "DONT_KNOW"}
                    onChange={e => setFormData({ ...formData, ayushman_status: e.target.value })}
                    style={{ display: "none" }}
                  />
                  🤷‍♂️ जानकारी नहीं है
                </label>
              </div>
            </div>

            {/* 4. भुगतान माध्यम */}
            <div style={{ ...styles.formSection, background: "#fff7ed", border: "1px solid #fed7aa" }}>
              <h4 style={{ ...styles.subHeading, color: "#c2410c" }}>4. कार्ड शुल्क (₹150) एवं भुगतान माध्यम</h4>
              
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "15px" }}>
                <label style={{
                  ...styles.radioLabel,
                  border: formData.payment_mode === "PAY_TO_FO" ? "2px solid #ea580c" : "1px solid #fed7aa",
                  background: formData.payment_mode === "PAY_TO_FO" ? "#ffedd5" : "white"
                }}>
                  <input
                    type="radio"
                    name="payment_mode"
                    value="PAY_TO_FO"
                    checked={formData.payment_mode === "PAY_TO_FO"}
                    onChange={e => setFormData({ ...formData, payment_mode: e.target.value })}
                    style={{ display: "none" }}
                  />
                  💵 FO को नकद देंगे (Pay Cash)
                </label>

                <label style={{
                  ...styles.radioLabel,
                  border: formData.payment_mode === "ONLINE_PAY" ? "2px solid #16a34a" : "1px solid #fed7aa",
                  background: formData.payment_mode === "ONLINE_PAY" ? "#dcfce7" : "white"
                }}>
                  <input
                    type="radio"
                    name="payment_mode"
                    value="ONLINE_PAY"
                    checked={formData.payment_mode === "ONLINE_PAY"}
                    onChange={e => setFormData({ ...formData, payment_mode: e.target.value })}
                    style={{ display: "none" }}
                  />
                  💳 ऑनलाइन भुगतान करें (Online Pay)
                </label>
              </div>

              {formData.payment_mode === "PAY_TO_FO" ? (
                <div style={{ padding: "12px", background: "white", borderRadius: "8px", border: "1px solid #fed7aa" }}>
                  <label style={{ ...styles.label, color: "#ea580c" }}>सत्यापन अधिकारी (Assigned Field Officer)</label>
                  <div style={{ marginTop: "5px", fontSize: "14px", fontWeight: "bold", color: formData.assigned_fo ? "#16a34a" : "#dc2626" }}>
                    {formData.assigned_fo 
                      ? `✅ ${formData.assigned_fo} (${formData.block} ब्लॉक)` 
                      : formData.block 
                        ? "⚠️ इस ब्लॉक में FO नियुक्त नहीं है (Admin द्वारा वेरीफाई होगा)" 
                        : "ℹ️ ब्लॉक चुनने पर अधिकारी स्वतः नियुक्त हो जाएगा"}
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block", marginTop: "4px" }}>
                    *फॉर्म सबमिट करने के बाद यह विवरण आपके ब्लॉक के FO के पास सत्यापन हेतु जाएगा।
                  </span>
                </div>
              ) : (
                <div style={{ padding: "12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                  <strong style={{ color: "#166534", fontSize: "13px" }}>⚡ तत्काल एक्टिवेशन (Instant Card):</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#14532d" }}>
                    सबमिट करते ही आप पेमेंट पेज पर जाएंगे। पेमेंट पूरा होते ही डिजिटल PVC कार्ड स्वतः बन जाएगा।
                  </p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} style={styles.btnPrimary}>
              {loading ? "⏳ प्रक्रियाधीन है..." : formData.payment_mode === "ONLINE_PAY" ? "💳 सबमिट करें और ₹150 Pay करें →" : "🚀 सबमिट करें (Send to FO) →"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f1f5f9", fontFamily: "'Inter', sans-serif" },
  header: { background: "#064e3b", padding: "15px 5%", color: "white", textAlign: "center" },
  main: { padding: "20px 5%", maxWidth: "800px", margin: "0 auto" },
  card: { background: "white", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0" },
  sectionTitle: { color: "#ea580c", fontSize: "20px", margin: "0 0 20px 0", borderBottom: "2px solid #fed7aa", paddingBottom: "10px" },
  formSection: { marginBottom: "20px", padding: "15px", borderRadius: "8px", background: "#f8fafc" },
  subHeading: { margin: "0 0 12px 0", color: "#334155", fontSize: "15px" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { fontSize: "12px", fontWeight: "bold", color: "#475569" },
  input: { padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", backgroundColor: "white" },
  radioLabel: { flex: 1, minWidth: "150px", padding: "10px", borderRadius: "8px", textAlign: "center", cursor: "pointer", fontWeight: "bold", fontSize: "13px", color: "#334155" },
  btnPrimary: { width: "100%", background: "#2563eb", color: "white", border: "none", padding: "14px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "15px", marginTop: "10px" },
  photoPreviewBox: { width: "90px", height: "105px", borderRadius: "8px", border: "2px solid #cbd5e1", background: "white", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  previewImg: { width: "100%", height: "100%", objectFit: "cover" }
};

export default PatientRegistration;