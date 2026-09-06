import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function PartnerHospitals() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("hospitals"); // hospitals, labs, medical, schools
  const [hospitals, setHospitals] = useState([]);
  const [labs, setLabs] = useState([]);
  const [stores, setStores] = useState([]);
  const [schools, setSchools] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [blocksList, setBlocksList] = useState([]);

  const [filterDistrict, setFilterDistrict] = useState("All");
  const [filterBlock, setFilterBlock] = useState("All");
  const [loading, setLoading] = useState(true);

  const LAKHIMPUR_BLOCKS = [
    "बिजुआ", "पलिया", "गोला", "निघासन", "धौरहरा", "नकहा", 
    "फूलबेहड़", "बांकेगंज", "बेहजम", "मितौली", "मोहम्मदी", 
    "पसगवां", "रमियाबेहड़", "ईसानगर", "लखीमपुर"
  ].map((name, idx) => ({ id: `lkh-${idx + 1}`, name }));

  useEffect(() => {
    fetchAllPublicData();
  }, []);

  const fetchAllPublicData = async () => {
    setLoading(true);
    try {
      const [hRes, lRes, mRes, sRes, dRes] = await Promise.all([
        supabase.from("hospitals").select("*").order("name"),
        supabase.from("diagnostic_centers").select("*").order("lab_name"),
        supabase.from("medical_stores").select("*").order("store_name"),
        supabase.from("schools").select("*").order("school_name"),
        supabase.from("districts").select("*").order("name")
      ]);

      if (hRes.data) setHospitals(hRes.data);
      if (lRes.data) setLabs(lRes.data);
      if (mRes.data) setStores(mRes.data);
      if (sRes.data) setSchools(sRes.data);
      if (dRes.data) setDistrictsList(dRes.data);
    } catch (err) {
      console.error("Public load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictChange = async (distName) => {
    setFilterDistrict(distName);
    setFilterBlock("All");
    if (!distName || distName === "All") {
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

  const smartMatch = (itemVal, filterVal) => {
    if (filterVal === "All" || !filterVal) return true;
    if (!itemVal) return false;
    const s1 = String(itemVal).trim().toLowerCase();
    const s2 = String(filterVal).trim().toLowerCase();
    return s1 === s2 || s1.includes(s2) || s2.includes(s1);
  };

  const filterList = (list) => {
    return list.filter(item => {
      const distMatch = smartMatch(item.district, filterDistrict);
      const blockMatch = smartMatch(item.block, filterBlock);
      return distMatch && blockMatch;
    });
  };

  const displayHospitals = filterList(hospitals);
  const displayLabs = filterList(labs);
  const displayStores = filterList(stores);
  const displaySchools = filterList(schools);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerWrap}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px" }}>🏥 JeevSathi Public Partner Directory</h2>
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#d1fae5" }}>
              Sinux India Foundation • सत्यापित स्वास्थ्य एवं सेवा नेटवर्क
            </p>
          </div>
          <button onClick={() => navigate("/")} style={styles.btnHome}>
            ← Back to Home
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {/* फ़िल्टर बार */}
        <div style={styles.filterCard}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={styles.label}>ज़िला (District)</label>
            <select
              style={styles.select}
              value={filterDistrict}
              onChange={e => handleDistrictChange(e.target.value)}
            >
              <option value="All">सभी ज़िले (All Districts)</option>
              {districtsList.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={styles.label}>ब्लॉक (Block)</label>
            <select
              style={styles.select}
              value={filterBlock}
              onChange={e => setFilterBlock(e.target.value)}
            >
              <option value="All">सभी ब्लॉक (All Blocks)</option>
              {blocksList.map(b => <option key={b.id || b.name} value={b.name}>{b.name}</option>)}
            </select>
          </div>
        </div>

        {/* टैब्स बार */}
        <div style={styles.tabsBar}>
          <button
            onClick={() => setActiveTab("hospitals")}
            style={activeTab === "hospitals" ? styles.tabActive : styles.tab}
          >
            🏥 अस्पताल ({displayHospitals.length})
          </button>
          <button
            onClick={() => setActiveTab("labs")}
            style={activeTab === "labs" ? styles.tabActive : styles.tab}
          >
            🔬 डायग्नोस्टिक लैब ({displayLabs.length})
          </button>
          <button
            onClick={() => setActiveTab("medical")}
            style={activeTab === "medical" ? styles.tabActive : styles.tab}
          >
            💊 मेडिकल स्टोर्स ({displayStores.length})
          </button>
          <button
            onClick={() => setActiveTab("schools")}
            style={activeTab === "schools" ? styles.tabActive : styles.tab}
          >
            🎓 स्कूल व संस्थान ({displaySchools.length})
          </button>
        </div>

        {/* लिस्टिंग ग्रिड (पब्लिक के लिए केवल व्यू और कॉल, कोई एडिट नहीं) */}
        {loading ? (
          <p style={{ textAlign: "center", color: "#64748b", margin: "40px 0" }}>⏳ नेटवर्क डेटा लोड हो रहा है...</p>
        ) : (
          <div style={styles.grid}>
            {/* 1. HOSPITALS */}
            {activeTab === "hospitals" && displayHospitals.map(h => (
              <div key={h.id} style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3 style={styles.cardTitle}>🏥 {h.name}</h3>
                  <span style={h.ayushman === "Yes" ? styles.badgeGreen : styles.badgeGray}>
                    {h.ayushman === "Yes" ? "✅ आयुष्मान" : "⚪ प्राइवेट"}
                  </span>
                </div>
                <p style={styles.cardSub}>👤 {h.doctor_name || "प्रभारी डॉक्टर"} • 📍 {h.block}, {h.district}</p>
                <p style={styles.cardAddr}>{h.address}</p>
                <div style={{ margin: "8px 0" }}>
                  <span style={styles.badgeOrange}>💳 छूट: {h.discount || "20% OPD"}</span>
                </div>
                {h.treatments && (
                  <p style={{ fontSize: "12px", color: "#475569", margin: "4px 0" }}>
                    <strong>सुविधाएँ:</strong> {h.treatments}
                  </p>
                )}
                {h.contact_number && (
                  <a href={`tel:${h.contact_number}`} style={styles.btnCall}>
                    📞 कॉल करें ({h.contact_number})
                  </a>
                )}
              </div>
            ))}

            {/* 2. LABS */}
            {activeTab === "labs" && displayLabs.map(l => (
              <div key={l.id} style={styles.card}>
                <h3 style={styles.cardTitle}>🔬 {l.lab_name}</h3>
                <p style={styles.cardSub}>📍 {l.block}, {l.district}</p>
                <p style={styles.cardAddr}>{l.address}</p>
                <div style={{ margin: "8px 0" }}>
                  <span style={styles.badgeGreen}>🔬 जांच पर {l.test_discount_percent || 20}% की छूट</span>
                </div>
                {l.tests_offered && (
                  <p style={{ fontSize: "12px", color: "#475569", margin: "4px 0" }}>
                    <strong>जांचें:</strong> {l.tests_offered}
                  </p>
                )}
                {l.contact_number && (
                  <a href={`tel:${l.contact_number}`} style={styles.btnCall}>
                    📞 संपर्क करें ({l.contact_number})
                  </a>
                )}
              </div>
            ))}

            {/* 3. MEDICAL STORES */}
            {activeTab === "medical" && displayStores.map(m => (
              <div key={m.id} style={styles.card}>
                <h3 style={styles.cardTitle}>💊 {m.store_name}</h3>
                <p style={styles.cardSub}>👤 संचालक: {m.owner_name || "N/A"} • 📍 {m.block}, {m.district}</p>
                <p style={styles.cardAddr}>{m.address}</p>
                <div style={{ margin: "8px 0" }}>
                  <span style={styles.badgeOrange}>💊 दवाओं पर {m.medicine_discount_percent || 10}% छूट</span>
                </div>
                {m.contact_number && (
                  <a href={`tel:${m.contact_number}`} style={styles.btnCall}>
                    📞 संपर्क करें ({m.contact_number})
                  </a>
                )}
              </div>
            ))}

            {/* 4. SCHOOLS */}
            {activeTab === "schools" && displaySchools.map(s => (
              <div key={s.id} style={styles.card}>
                <h3 style={styles.cardTitle}>🎓 {s.school_name}</h3>
                <p style={styles.cardSub}>📍 {s.block}, {s.district}</p>
                <p style={styles.cardAddr}>{s.address}</p>
                <div style={{ margin: "8px 0" }}>
                  <span style={styles.badgeBlue}>🎓 फीस में {s.jeevsathi_discount_percent || 15}% रियायत</span>
                </div>
                {s.contact_number && (
                  <a href={`tel:${s.contact_number}`} style={styles.btnCall}>
                    📞 संपर्क करें ({s.contact_number})
                  </a>
                )}
              </div>
            ))}

            {/* Empty State */}
            {((activeTab === "hospitals" && displayHospitals.length === 0) ||
              (activeTab === "labs" && displayLabs.length === 0) ||
              (activeTab === "medical" && displayStores.length === 0) ||
              (activeTab === "schools" && displaySchools.length === 0)) && (
              <div style={styles.noData}>
                <p style={{ margin: 0, fontWeight: "bold" }}>इस ब्लॉक या ज़िले में कोई रिकॉर्ड नहीं मिला।</p>
                <span style={{ fontSize: "12px", color: "#64748b" }}>कृपया फ़िल्टर में "सभी ब्लॉक" चुनें।</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  header: { background: "#065f46", color: "white", padding: "14px 5%" },
  headerWrap: { maxWidth: "1150px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" },
  btnHome: { background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" },
  main: { maxWidth: "1150px", margin: "25px auto", padding: "0 15px" },
  filterCard: { background: "white", padding: "15px 20px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "20px" },
  label: { fontSize: "11px", fontWeight: "bold", color: "#475569", display: "block", marginBottom: "4px", textTransform: "uppercase" },
  select: { width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", backgroundColor: "#f8fafc" },
  tabsBar: { display: "flex", gap: "8px", overflowX: "auto", borderBottom: "1px solid #cbd5e1", paddingBottom: "10px", marginBottom: "20px" },
  tab: { background: "white", border: "1px solid #cbd5e1", padding: "9px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer", color: "#475569", whiteSpace: "nowrap" },
  tabActive: { background: "#065f46", border: "1px solid #065f46", padding: "9px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "bold", cursor: "pointer", color: "white", whiteSpace: "nowrap" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "15px" },
  card: { background: "white", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" },
  cardTitle: { margin: "0 0 4px", fontSize: "16px", color: "#0f172a" },
  cardSub: { margin: "0 0 4px", fontSize: "12px", color: "#64748b" },
  cardAddr: { margin: "0 0 8px", fontSize: "11px", color: "#94a3b8" },
  badgeGreen: { background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" },
  badgeOrange: { background: "#ffedd5", color: "#9a3412", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" },
  badgeBlue: { background: "#e0f2fe", color: "#0369a1", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" },
  badgeGray: { background: "#f1f5f9", color: "#64748b", padding: "3px 8px", borderRadius: "12px", fontSize: "11px" },
  btnCall: { display: "inline-block", background: "#0284c7", color: "white", textDecoration: "none", padding: "7px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", marginTop: "10px" },
  noData: { textAlign: "center", padding: "40px", color: "#64748b", gridColumn: "1 / -1", background: "white", borderRadius: "10px", border: "1px dashed #cbd5e1" }
};

export default PartnerHospitals;