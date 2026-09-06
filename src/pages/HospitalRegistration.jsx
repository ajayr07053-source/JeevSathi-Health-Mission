import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function HospitalRegistration() {
  const navigate = useNavigate();
  const [districtsList, setDistrictsList] = useState([]);
  const [blocksList, setBlocksList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    doctor_name: "",
    contact_number: "",
    email: "",
    district: "",
    block: "",
    address: "",
    ayushman: "No",
    discount: "15% OPD & 10% IPD",
    treatments: "General Medicine, OPD, Emergency"
  });

  const LAKHIMPUR_BLOCKS = [
    "बिजुआ", "पलिया", "गोला", "निघासन", "धौरहरा", "नकहा", 
    "फूलबेहड़", "बांकेगंज", "बेहजम", "मितौली", "मोहम्मदी", 
    "पसगवां", "रमियाबेहड़", "ईसानगर", "लखीमपुर"
  ].map((name, idx) => ({ id: `lkh-${idx + 1}`, name }));

  useEffect(() => {
    loadDistricts();
  }, []);

  const loadDistricts = async () => {
    try {
      const { data } = await supabase.from("districts").select("*").order("name");
      if (data && data.length > 0) setDistrictsList(data);
      else setDistrictsList([{ id: 1, name: "लखीमपुर" }]);
    } catch {
      setDistrictsList([{ id: 1, name: "लखीमपुर" }]);
    }
  };

  const handleDistrictChange = async (distName) => {
    setFormData(prev => ({ ...prev, district: distName, block: "" }));
    if (!distName) {
      setBlocksList([]);
      return;
    }
    const cleanDist = String(distName).trim().toLowerCase();
    try {
      const foundDist = districtsList.find(d => String(d.name).trim().toLowerCase() === cleanDist);
      let query = supabase.from("blocks").select("*");
      if (foundDist?.id) {
        query = query.or(`district_id.eq.${foundDist.id},district_name.ilike.%${distName}%,district_name.ilike.%Lakhimpur%`);
      } else {
        query = query.or(`district_name.ilike.%${distName}%,district_name.ilike.%Lakhimpur%`);
      }
      const { data } = await query.order("name");
      if (data && data.length > 0) setBlocksList(data);
      else setBlocksList(cleanDist.includes("लखीमपुर") ? LAKHIMPUR_BLOCKS : []);
    } catch {
      setBlocksList(cleanDist.includes("लखीमपुर") ? LAKHIMPUR_BLOCKS : []);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name.trim(),
      doctor_name: formData.doctor_name.trim(),
      contact_number: formData.contact_number.trim(),
      email: formData.email.trim() || null,
      district: formData.district,
      block: formData.block,
      address: formData.address.trim(),
      ayushman: formData.ayushman,
      discount: formData.discount.trim(),
      treatments: formData.treatments.trim()
    };

    const { error } = await supabase.from("hospitals").insert([payload]);
    setLoading(false);

    if (error) {
      alert("❌ पंजीकरण में त्रुटि: " + error.message);
    } else {
      alert("🎉 अस्पताल सफलतापूर्वक JeevSathi हेल्थ नेटवर्क में पंजीकृत हो गया!");
      navigate("/partner-hospitals");
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h2 style={{ margin: 0, fontSize: "18px" }}>🏥 Partner Hospital Onboarding</h2>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#d1fae5" }}>
          JeevSathi Health Mission • Sinux India Foundation
        </p>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={styles.iconCircle}>🏥</div>
            <h2 style={{ margin: "8px 0 4px", fontSize: "20px", color: "#0f172a" }}>
              अस्पताल पंजीकरण (Hospital Registration)
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
              JeevSathi हेल्थ नेटवर्क से जुड़कर मरीज़ों को रियायती स्वास्थ्य सेवाएँ प्रदान करें
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Hospital / Clinic Name (अस्पताल का नाम) *</label>
              <input
                type="text"
                required
                placeholder="उदा. जीवन रक्षक मेमोरियल हॉस्पिटल"
                style={styles.input}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div style={styles.grid2}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Director / Chief Doctor Name</label>
                <input
                  type="text"
                  placeholder="उदा. डॉ. आर. के. वर्मा"
                  style={styles.input}
                  value={formData.doctor_name}
                  onChange={e => setFormData({ ...formData, doctor_name: e.target.value })}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Contact Number (हेल्पलाइन/मोबाइल) *</label>
                <input
                  type="tel"
                  required
                  placeholder="उदा. 9876543210"
                  style={styles.input}
                  value={formData.contact_number}
                  onChange={e => setFormData({ ...formData, contact_number: e.target.value })}
                />
              </div>
            </div>

            <div style={styles.grid2}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>District (ज़िला) *</label>
                <select
                  required
                  style={styles.input}
                  value={formData.district}
                  onChange={e => handleDistrictChange(e.target.value)}
                >
                  <option value="">-- ज़िला चुनें --</option>
                  {districtsList.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Block (ब्लॉक) *</label>
                <select
                  required
                  style={styles.input}
                  value={formData.block}
                  onChange={e => setFormData({ ...formData, block: e.target.value })}
                >
                  <option value="">-- ब्लॉक चुनें --</option>
                  {blocksList.map(b => <option key={b.id || b.name} value={b.name}>{b.name}</option>)}
                </select>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Address (पूरा पता / लैंडमार्क) *</label>
              <input
                type="text"
                required
                placeholder="उदा. मेन चौराहा, निकट बस स्टेशन, बिजुआ"
                style={styles.input}
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            {/* आयुष्मान पैनल स्थिति */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>क्या अस्पताल में आयुष्मान भारत योजना (Ayushman) उपलब्ध है?</label>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ayushman: "Yes" })}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px",
                    border: formData.ayushman === "Yes" ? "2px solid #16a34a" : "1px solid #cbd5e1",
                    background: formData.ayushman === "Yes" ? "#dcfce7" : "white",
                    color: formData.ayushman === "Yes" ? "#15803d" : "#475569"
                  }}
                >
                  ✅ हाँ, आयुष्मान पैनल है
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ayushman: "No" })}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px",
                    border: formData.ayushman === "No" ? "2px solid #ea580c" : "1px solid #cbd5e1",
                    background: formData.ayushman === "No" ? "#ffedd5" : "white",
                    color: formData.ayushman === "No" ? "#c2410c" : "#475569"
                  }}
                >
                  ⚪ नहीं, केवल प्राइवेट
                </button>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>JeevSathi कार्डधारकों को मिलने वाली छूट (Discount) *</label>
              <input
                type="text"
                required
                placeholder="उदा. 20% OPD छूट, 10% टेस्ट छूट"
                style={styles.input}
                value={formData.discount}
                onChange={e => setFormData({ ...formData, discount: e.target.value })}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>उपलब्ध उपचार / विभाग (Specialities / Treatments)</label>
              <textarea
                rows="2"
                placeholder="उदा. स्त्री रोग, बाल रोग, हड्डी रोग, सामान्य सर्जरी, अल्ट्रासाउंड"
                style={{ ...styles.input, resize: "vertical" }}
                value={formData.treatments}
                onChange={e => setFormData({ ...formData, treatments: e.target.value })}
              />
            </div>

            <button type="submit" disabled={loading} style={styles.btnSubmit}>
              {loading ? "पंजीकरण जारी है..." : "🏥 रजिस्टर करें (Add to Network) →"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/partner-hospitals")}
              style={styles.btnBack}
            >
              ← पार्टनर अस्पतालों की सूची देखें
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f1f5f9", fontFamily: "'Inter', sans-serif" },
  header: { background: "#064e3b", color: "white", padding: "14px 5%", textAlign: "center" },
  main: { maxWidth: "600px", margin: "30px auto", padding: "0 15px" },
  card: { background: "white", padding: "30px 25px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" },
  iconCircle: { width: "50px", height: "50px", background: "#e0f2fe", color: "#0284c7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", margin: "0 auto" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "5px", marginBottom: "14px" },
  label: { fontSize: "12px", fontWeight: "bold", color: "#334155" },
  input: { padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" },
  btnSubmit: { width: "100%", background: "#065f46", color: "white", border: "none", padding: "13px", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer", marginTop: "10px" },
  btnBack: { width: "100%", background: "none", border: "none", color: "#64748b", padding: "10px", fontSize: "13px", cursor: "pointer", marginTop: "8px", fontWeight: "600" }
};

export default HospitalRegistration;