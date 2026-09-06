import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function PatientPortal() {
  const navigate = useNavigate();

  const [mobileInput, setMobileInput] = useState("");
  const [patient, setPatient] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [hospitals, setHospitals] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);
  const [medicalStores, setMedicalStores] = useState([]);
  const [schools, setSchools] = useState([]);
  const [camps, setCamps] = useState([]);

  const [districtsList, setDistrictsList] = useState([]);
  const [filterBlocks, setFilterBlocks] = useState([]);
  
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedBlock, setSelectedBlock] = useState("All");
  const [activeTab, setActiveTab] = useState("hospitals");

  const LAKHIMPUR_BLOCKS = [
    "बिजुआ", "पलिया", "गोला", "निघासन", "धौरहरा", "नकहा", 
    "फूलबेहड़", "बांकेगंज", "बेहजम", "मितौली", "मोहम्मदी", 
    "पसगवां", "रमियाबेहड़", "ईसानगर", "लखीमपुर"
  ].map((name, idx) => ({ id: `lkh-${idx + 1}`, name }));

  useEffect(() => {
    initPortal();
  }, []);

  const initPortal = async () => {
    await loadDistricts();
    await loadDirectoryData();

    const saved = localStorage.getItem("jeevsathi_patient_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMobileInput(parsed.mobile);
        fetchPatientByMobile(parsed.mobile);
      } catch (err) {
        console.error("Local storage error:", err);
      }
    }
  };

  const loadDistricts = async () => {
    try {
      const { data } = await supabase.from("districts").select("*").order("name");
      if (data && data.length > 0) {
        setDistrictsList(data);
      } else {
        setDistrictsList([{ id: 1, name: "लखीमपुर" }]);
      }
    } catch (e) {
      setDistrictsList([{ id: 1, name: "लखीमपुर" }]);
    }
  };

  const fetchBlocksForDistrict = async (distName) => {
    if (!distName || distName === "All") {
      setFilterBlocks([]);
      return;
    }

    const cleanDist = String(distName).trim().toLowerCase();

    try {
      const foundDist = districtsList.find(
        d => String(d.name).trim().toLowerCase() === cleanDist
      );

      let query = supabase.from("blocks").select("*");
      if (foundDist && foundDist.id) {
        query = query.or(`district_id.eq.${foundDist.id},district_name.ilike.%${distName}%,district_name.ilike.%Lakhimpur%`);
      } else {
        query = query.or(`district_name.ilike.%${distName}%,district_name.ilike.%Lakhimpur%`);
      }

      const { data, error } = await query.order("name");
      if (!error && data && data.length > 0) {
        setFilterBlocks(data);
      } else {
        setFilterBlocks(cleanDist.includes("लखीमपुर") || cleanDist.includes("lakhimpur") ? LAKHIMPUR_BLOCKS : []);
      }
    } catch (err) {
      setFilterBlocks(cleanDist.includes("लखीमपुर") || cleanDist.includes("lakhimpur") ? LAKHIMPUR_BLOCKS : []);
    }
  };

  const handleFilterDistrictChange = async (distName) => {
    setSelectedDistrict(distName);
    setSelectedBlock("All");
    await fetchBlocksForDistrict(distName);
  };

  const loadDirectoryData = async () => {
    try {
      const [hRes, dRes, mRes, sRes, cRes] = await Promise.all([
        supabase.from("hospitals").select("*"),
        supabase.from("diagnostic_centers").select("*"),
        supabase.from("medical_stores").select("*"),
        supabase.from("schools").select("*"),
        supabase.from("camps").select("*").order("date", { ascending: false })
      ]);

      if (hRes.data) setHospitals(hRes.data);
      if (dRes.data) setDiagnostics(dRes.data);
      if (mRes.data) setMedicalStores(mRes.data);
      if (sRes.data) setSchools(sRes.data);
      if (cRes.data) setCamps(cRes.data);
    } catch (err) {
      console.error("Directory fetch error:", err);
    }
  };

  const fetchPatientByMobile = async (cleanNum) => {
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase
      .from("camp_patients")
      .select("*")
      .eq("mobile", cleanNum)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setLoading(false);
    setIsLoggedIn(true);

    if (error || !data) {
      setPatient(null);
    } else {
      setPatient(data);
      if (data.district) {
        setSelectedDistrict(data.district);
        fetchBlocksForDistrict(data.district);
      }
      if (data.block) setSelectedBlock(data.block);
    }

    localStorage.setItem("jeevsathi_patient_session", JSON.stringify({ mobile: cleanNum }));
  };

  const handleMobileSubmit = (e) => {
    e.preventDefault();
    const cleanNum = mobileInput.trim().replace(/[^0-9]/g, "");
    if (cleanNum.length !== 10) {
      setErrorMsg("कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।");
      return;
    }
    fetchPatientByMobile(cleanNum);
  };

  const handleLogout = () => {
    localStorage.removeItem("jeevsathi_patient_session");
    setPatient(null);
    setIsLoggedIn(false);
    setMobileInput("");
  };

  const smartLocMatch = (val1, val2) => {
    if (!val1 || !val2) return false;
    if (val2 === "All" || val1 === "All") return true;

    const s1 = String(val1).trim().toLowerCase();
    const s2 = String(val2).trim().toLowerCase();

    if (s1 === s2 || s1.includes(s2) || s2.includes(s1)) return true;

    const isLkh1 = s1.includes("लखीमपुर") || s1.includes("lakhimpur") || s1.includes("kheri");
    const isLkh2 = s2.includes("लखीमपुर") || s2.includes("lakhimpur") || s2.includes("kheri");
    if (isLkh1 && isLkh2) return true;

    const blockPairs = [
      ["बिजुआ", "bijua"], ["पलिया", "palia"], ["गोला", "gola"], ["निघासन", "nighasan"],
      ["धौरहरा", "dhaurahra"], ["नकहा", "nakaha"], ["फूलबेहड़", "phoolbehar"],
      ["बांकेगंज", "bankeyganj"], ["बेहजम", "behjam"], ["मितौली", "mitauli"],
      ["मोहम्मदी", "mohammadi"], ["पसगवां", "pasgawan"], ["रमियाबेहड़", "ramiyabehar"],
      ["ईसानगर", "isanagar"]
    ];

    for (const [hi, en] of blockPairs) {
      if ((s1.includes(hi) || s1.includes(en)) && (s2.includes(hi) || s2.includes(en))) {
        return true;
      }
    }
    return false;
  };

  const filterByLoc = (item) => {
    if (selectedDistrict !== "All") {
      const itemDist = item.district || item.district_name || "";
      if (!smartLocMatch(itemDist, selectedDistrict)) return false;
    }
    if (selectedBlock !== "All") {
      const itemBlock = item.block || item.block_name || "";
      if (!smartLocMatch(itemBlock, selectedBlock)) return false;
    }
    return true;
  };

  const calculateDistance = (item) => {
    if (!patient) return "📍 उपलब्ध सेवा";
    const pBlock = String(patient.block || "").trim().toLowerCase();
    const iBlock = String(item.block || "").trim().toLowerCase();
    const pVillage = String(patient.village || "").trim().toLowerCase();
    const iAddress = String(item.address || "").trim().toLowerCase();

    if (pVillage && iAddress.includes(pVillage)) return "📍 आपके क्षेत्र में (< 2 किमी)";
    if (pBlock && iBlock && pBlock === iBlock) return "📍 आपके ब्लॉक में (~3 से 6 किमी)";
    if (smartLocMatch(item.district, patient.district)) return "📍 नज़दीकी (~12 से 18 किमी)";
    return "📍 अन्य क्षेत्र";
  };

  const isApproved = patient && (String(patient.admin_status).toUpperCase() === "APPROVED" || String(patient.payment_status).toUpperCase() === "PAID");
  const isGivenToFO = patient && !isApproved && (patient.payment_mode === "PAY_TO_FO" || patient.payment_status === "PENDING_FO_VERIFICATION");
  const isPaymentPending = patient && !isApproved && !isGivenToFO;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px" }}>🏥 JeevSathi Patient Portal</h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#d1fae5" }}>
              Sinux India Foundation • आपका संपूर्ण स्वास्थ्य साथी
            </p>
          </div>
          {isLoggedIn && (
            <button onClick={handleLogout} style={styles.btnLogout}>
              🚪 लॉगआउट ({mobileInput})
            </button>
          )}
        </div>
      </header>

      <main style={styles.main}>
        {!isLoggedIn ? (
          <div style={styles.authCard}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={styles.iconCircle}>📱</div>
              <h2 style={{ margin: "8px 0 4px", fontSize: "20px", color: "#0f172a" }}>मरीज़ पोर्टल लॉगिन</h2>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>अपना 10 अंकों का मोबाइल नंबर दर्ज करें</p>
            </div>

            {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

            <form onSubmit={handleMobileSubmit}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>मोबाइल नंबर (Mobile Number)</label>
                <input
                  type="tel"
                  required
                  maxLength="10"
                  placeholder="उदा. 9876543210"
                  style={styles.input}
                  value={mobileInput}
                  onChange={e => setMobileInput(e.target.value)}
                />
              </div>
              <button type="submit" disabled={loading} style={styles.btnSubmit}>
                {loading ? "जाँच हो रही है..." : "कार्ड स्टेटस देखें →"}
              </button>
            </form>

            <div style={{ marginTop: "20px", textAlign: "center", borderTop: "1px solid #e2e8f0", paddingTop: "15px" }}>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px" }}>क्या आप पहली बार आए हैं?</p>
              <button onClick={() => navigate("/patient-registration")} style={styles.btnRegisterOutline}>
                📝 नया हेल्थ कार्ड पंजीकरण करें (₹150) →
              </button>
            </div>
          </div>
        ) : (
          <div>
            {!patient && (
              <div style={styles.noCardBanner}>
                <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
                  <div style={{ fontSize: "45px", marginBottom: "10px" }}>🪪❌</div>
                  <span style={styles.badgeGray}>No Card Found</span>
                  <h2 style={{ margin: "12px 0 6px", color: "#991b1b", fontSize: "22px" }}>
                    इस मोबाइल नंबर (+91 {mobileInput}) पर कोई कार्ड नहीं मिला!
                  </h2>
                  <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>
                    आपने अभी तक JeevSathi हेल्थ मिशन में कोई फॉर्म नहीं भरा है, न ही किसी फील्ड ऑफिसर को डिटेल दी है और न ही कैम्प में पंजीकरण हुआ है। 
                    अस्पतालों और दवाइयों में 20% तक की छूट पाने के लिए कृपया अभी अपना कार्ड बनाएं।
                  </p>

                  <div style={{ background: "white", padding: "18px", borderRadius: "10px", border: "1px dashed #fca5a5", marginBottom: "20px", textAlign: "left" }}>
                    <strong style={{ color: "#065f46", display: "block", marginBottom: "6px" }}>🎁 कार्ड बनवाने पर मिलने वाले लाभ:</strong>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
                      <li>50+ पार्टनर अस्पतालों में ओपीडी व कंसल्टेशन में भारी छूट</li>
                      <li>पैथोलॉजी व ब्लड टेस्ट्स पर 20% तक सीधी बचत</li>
                      <li>मेडिकल स्टोर से दवाइयों पर 10% - 15% की छूट</li>
                      <li>आगामी निशुल्क स्वास्थ्य शिविरों में वीआईपी प्राथमिकता</li>
                    </ul>
                  </div>

                  <button onClick={() => navigate(`/patient-registration?mobile=${mobileInput}`)} style={styles.btnCreateNewCard}>
                    ⚡ नया JeevSathi हेल्थ कार्ड बनाएं (मात्र ₹150) →
                  </button>
                </div>
              </div>
            )}

            {patient && (
              <div style={styles.bannerCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <span style={styles.welcomeTag}>👤 मरीज़ प्रोफ़ाइल</span>
                    <h2 style={{ margin: "4px 0", color: "#0f172a" }}>{patient.patient_name}</h2>
                    <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>
                      📱 +91 {patient.mobile} • 📍 {patient.village}, {patient.block}, {patient.district}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={isApproved ? styles.badgeGreen : styles.badgeOrange}>
                      {isApproved ? "✅ JeevSathi कार्ड सक्रिय (Active)" : "⏳ कार्ड पेंडिंग (Under Verification)"}
                    </span>
                    <div style={{ marginTop: "6px" }}>
                      <span style={patient.ayushman_status === "YES" ? styles.tagAyushmanYes : styles.tagAyushmanNo}>
                        {patient.ayushman_status === "YES" ? "🟢 आयुष्मान कार्ड: उपलब्ध" : "⚪ आयुष्मान: उपलब्ध नहीं"}
                      </span>
                    </div>
                  </div>
                </div>

                {isApproved && (
                  <div style={{ marginTop: "16px", padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <strong style={{ color: "#166534", fontSize: "15px" }}>🎉 बधाई! आपका कार्ड पूर्ण रूप से सक्रिय है।</strong>
                        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#15803d" }}>
                          आपका ऑनलाइन भुगतान सफल हो चुका है। आप सभी पार्टनर केंद्रों पर छूट प्राप्त करने के पात्र हैं।
                        </p>
                      </div>
                      <button onClick={() => navigate(`/health-card/${patient.id}`)} style={styles.btnViewCard}>
                        🪪 डिजिटल PVC कार्ड देखें व डाउनलोड करें →
                      </button>
                    </div>
                  </div>
                )}

                {isGivenToFO && (
                  <div style={styles.boxFOVerification}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "32px" }}>⏳</span>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: "0 0 4px", color: "#1e3a8a", fontSize: "16px" }}>
                          FO सत्यापन प्रगति पर: 24 घंटे और Admin अप्रूवल के बाद कार्ड एक्टिव होगा
                        </h4>
                        <p style={{ margin: 0, fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
                          आपने कार्ड शुल्क <strong>फील्ड ऑफिसर को नकद देने (Pay Cash)</strong> का विकल्प चुना है। 
                          आपके ब्लॉक अधिकारी <strong>{patient.fo_name || "नियुक्त फील्ड ऑफिसर"}</strong> द्वारा फीस सत्यापन और 
                          एडमिन अप्रूवल होने के बाद आपका कार्ड <strong>24 घंटे के अंदर एक्टिव</strong> हो जाएगा।
                        </p>
                        <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <span style={styles.tagBlue}>अधिकारी: {patient.fo_name || "ब्लॉक फील्ड ऑफिसर"}</span>
                          <span style={styles.tagOrange}>स्थिति: PENDING_FO_VERIFICATION</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isPaymentPending && (
                  <div style={styles.activationHeroBox}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
                      <div style={{ flex: "1 1 320px" }}>
                        <div style={{ display: "inline-block", background: "#ea580c", color: "white", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", marginBottom: "6px" }}>
                          ⚠️ कार्ड पेंडिंग: ₹150 कार्ड शुल्क भुगतान बाकी है!
                        </div>
                        <h3 style={{ margin: "4px 0", color: "#7c2d12", fontSize: "16px" }}>
                          तत्काल कार्ड एक्टिवेट करें और ओपीडी में छूट पाएं
                        </h3>
                        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9a3412", lineHeight: "1.5" }}>
                          आपकी डिटेल पंजीकृत है। ऑनलाइन ₹150 का भुगतान करते ही आपका डिजिटल PVC कार्ड तत्काल सक्रिय हो जाएगा।
                        </p>
                      </div>

                      <div style={{ textAlign: "center" }}>
                        <button onClick={() => navigate(`/get-card?patient_id=${patient.id}`)} style={styles.btnActivateHero}>
                          💳 ऑनलाइन ₹150 Pay करें (तुरंत एक्टिवेट) →
                        </button>
                        <span style={{ display: "block", fontSize: "11px", color: "#b45309", marginTop: "5px", fontWeight: "600" }}>
                          Razorpay द्वारा 100% सुरक्षित भुगतान
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            <div style={styles.compareCard}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#0f172a" }}>
                💡 JeevSathi कार्ड के फ़ायदे (एक नज़र में समझें)
              </h4>
              <div style={styles.compareGrid}>
                <div style={styles.compareColBad}>
                  <strong style={{ color: "#991b1b" }}>❌ बिना कार्ड के सामान्य स्थिति:</strong>
                  <ul style={styles.compareList}>
                    <li>डॉक्टर ओपीडी पर्चे पर ₹300 - ₹500 का पूरा खर्च</li>
                    <li>जांच और टेस्ट्स पर 0% छूट</li>
                    <li>दवाइयों पर पूरी एमआरपी चुकानी पड़ती है</li>
                  </ul>
                </div>
                <div style={styles.compareColGood}>
                  <strong style={{ color: "#166534" }}>✅ JeevSathi कार्ड होने पर (मात्र ₹150/वर्ष):</strong>
                  <ul style={styles.compareList}>
                    <li>पार्टनर अस्पतालों में ओपीडी कंसल्टेशन में भारी छूट</li>
                    <li>पैथोलॉजी व लैब टेस्ट्स पर 20% तक सीधी बचत</li>
                    <li>मेडिकल स्टोर से दवाइयों पर 10% - 15% छूट</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={styles.networkCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "15px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>
                    📍 नज़दीकी स्वास्थ्य नेटवर्क (डिस्काउंट व कैम्प्स)
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    अपने ज़िले और ब्लॉक के अस्पताल, लैब और शिविर खोजें
                  </p>
                </div>
                
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <select
                    style={styles.selectSm}
                    value={selectedDistrict}
                    onChange={e => handleFilterDistrictChange(e.target.value)}
                  >
                    <option value="All">सभी ज़िले</option>
                    {districtsList.map(d => (
                      <option key={d.id || d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>

                  <select
                    style={styles.selectSm}
                    value={selectedBlock}
                    onChange={e => setSelectedBlock(e.target.value)}
                  >
                    <option value="All">
                      {selectedDistrict === "All" ? "सभी ब्लॉक" : `-- ${selectedDistrict} के सभी ब्लॉक --`}
                    </option>
                    {filterBlocks.map(b => (
                      <option key={b.id || b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.tabsBar}>
                <button style={activeTab === "hospitals" ? styles.tabBtnActive : styles.tabBtn} onClick={() => setActiveTab("hospitals")}>
                  🏥 अस्पताल ({hospitals.filter(filterByLoc).length})
                </button>
                <button style={activeTab === "diagnostics" ? styles.tabBtnActive : styles.tabBtn} onClick={() => setActiveTab("diagnostics")}>
                  🔬 लैब / टेस्ट ({diagnostics.filter(filterByLoc).length})
                </button>
                <button style={activeTab === "medical" ? styles.tabBtnActive : styles.tabBtn} onClick={() => setActiveTab("medical")}>
                  💊 दवाइयाँ ({medicalStores.filter(filterByLoc).length})
                </button>
                <button style={activeTab === "schools" ? styles.tabBtnActive : styles.tabBtn} onClick={() => setActiveTab("schools")}>
                  🎓 शिक्षण संस्थान ({schools.filter(filterByLoc).length})
                </button>
                <button style={activeTab === "camps" ? styles.tabBtnActiveGreen : styles.tabBtnGreen} onClick={() => setActiveTab("camps")}>
                  🏕️ आगामी फ्री कैम्प्स ({camps.filter(filterByLoc).length})
                </button>
              </div>

              <div style={styles.gridCards}>
                {activeTab === "hospitals" && hospitals.filter(filterByLoc).map(h => (
                  <div key={h.id} style={styles.itemBox}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h5 style={{ margin: "0 0 4px", fontSize: "14px", color: "#0f172a" }}>{h.name}</h5>
                      <span style={styles.distTag}>{calculateDistance(h)}</span>
                    </div>
                    <p style={styles.itemLoc}>{h.address} • {h.block}, {h.district}</p>
                    
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "8px 0" }}>
                      <span style={h.ayushman === "Yes" ? styles.tagGreen : styles.tagGray}>
                        {h.ayushman === "Yes" ? "✅ आयुष्मान: 100% फ्री" : "⚪ आयुष्मान: नहीं"}
                      </span>
                      <span style={styles.tagOrange}>💳 कार्ड छूट: {h.discount || "10% से 20%"}</span>
                    </div>

                    {h.treatments && (
                      <p style={{ margin: "4px 0", fontSize: "12px", color: "#475569" }}>
                        <strong>इलाज:</strong> {h.treatments}
                      </p>
                    )}

                    {h.contact_number && (
                      <a href={`tel:${h.contact_number}`} style={styles.btnCall}>
                        📞 कॉल करें ({h.contact_number})
                      </a>
                    )}
                  </div>
                ))}

                {activeTab === "diagnostics" && diagnostics.filter(filterByLoc).map(d => (
                  <div key={d.id} style={styles.itemBox}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h5 style={{ margin: "0 0 4px", fontSize: "14px", color: "#0f172a" }}>{d.lab_name}</h5>
                      <span style={styles.distTag}>{calculateDistance(d)}</span>
                    </div>
                    <p style={styles.itemLoc}>{d.address} • {d.block}, {d.district}</p>
                    <div style={{ margin: "6px 0" }}>
                      <span style={styles.tagGreen}>🔬 टेस्ट पर {d.test_discount_percent || 20}% सीधी छूट</span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#475569" }}>
                      <strong>उपलब्ध जांचें:</strong> {d.tests_offered || "सभी रक्त व पेशाब जांच"}
                    </p>
                  </div>
                ))}

                {activeTab === "medical" && medicalStores.filter(filterByLoc).map(m => (
                  <div key={m.id} style={styles.itemBox}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h5 style={{ margin: "0 0 4px", fontSize: "14px", color: "#0f172a" }}>{m.store_name}</h5>
                      <span style={styles.distTag}>{calculateDistance(m)}</span>
                    </div>
                    <p style={styles.itemLoc}>{m.address} • 👤 {m.owner_name}</p>
                    <div style={{ marginTop: "6px" }}>
                      <span style={styles.tagOrange}>💊 दवाओं पर {m.medicine_discount_percent || 10}% छूट</span>
                    </div>
                  </div>
                ))}

                {activeTab === "schools" && schools.filter(filterByLoc).map(s => (
                  <div key={s.id} style={styles.itemBox}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h5 style={{ margin: "0 0 4px", fontSize: "14px", color: "#0f172a" }}>{s.school_name}</h5>
                      <span style={styles.distTag}>{calculateDistance(s)}</span>
                    </div>
                    <p style={styles.itemLoc}>{s.address} • {s.district}</p>
                    <div style={{ margin: "6px 0" }}>
                      <span style={styles.tagBlue}>🎓 फीस में {s.jeevsathi_discount_percent || 15}% रियायत</span>
                    </div>
                  </div>
                ))}

                {activeTab === "camps" && camps.filter(filterByLoc).map(c => (
                  <div key={c.id} style={{ ...styles.itemBox, borderLeft: "4px solid #16a34a" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h5 style={{ margin: "0 0 4px", fontSize: "14px", color: "#166534" }}>🏕️ {c.camp_name || c.name}</h5>
                      <span style={styles.distTag}>{calculateDistance(c)}</span>
                    </div>
                    <p style={{ margin: "4px 0", fontSize: "12px", fontWeight: "bold", color: "#0f172a" }}>
                      📅 शिविर तारीख: {c.date} • 📍 {c.address}, {c.block}
                    </p>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
                      <span style={styles.tagGreen}>100% निशुल्क जाँच व दवा</span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>श्रेणी: {c.category || "General OPD"}</span>
                    </div>
                  </div>
                ))}

                {((activeTab === "hospitals" && hospitals.filter(filterByLoc).length === 0) ||
                  (activeTab === "diagnostics" && diagnostics.filter(filterByLoc).length === 0) ||
                  (activeTab === "medical" && medicalStores.filter(filterByLoc).length === 0) ||
                  (activeTab === "schools" && schools.filter(filterByLoc).length === 0) ||
                  (activeTab === "camps" && camps.filter(filterByLoc).length === 0)) && (
                  <div style={styles.noData}>
                    <p style={{ margin: 0, fontWeight: "bold" }}>इस क्षेत्र में अभी कोई सेवा सूचीबद्ध नहीं है।</p>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      कृपया फ़िल्टर में "सभी ब्लॉक" चुनकर अपने ज़िले की सेवाएँ देखें।
                    </span>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  header: { background: "#065f46", color: "white", padding: "12px 5%" },
  headerContent: { maxWidth: "950px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" },
  btnLogout: { background: "#dc2626", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" },
  main: { maxWidth: "920px", margin: "20px auto", padding: "0 15px" },

  authCard: { maxWidth: "400px", margin: "40px auto", background: "white", padding: "30px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" },
  iconCircle: { width: "50px", height: "50px", background: "#ecfdf5", color: "#065f46", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", margin: "0 auto" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "5px", marginBottom: "14px" },
  label: { fontSize: "12px", fontWeight: "bold", color: "#334155" },
  input: { padding: "11px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" },
  btnSubmit: { width: "100%", background: "#065f46", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", cursor: "pointer" },
  btnRegisterOutline: { background: "none", border: "1px solid #ea580c", color: "#ea580c", padding: "8px 14px", borderRadius: "6px", fontWeight: "bold", fontSize: "12px", cursor: "pointer", width: "100%" },
  errorBox: { background: "#fef2f2", color: "#dc2626", padding: "8px", borderRadius: "6px", fontSize: "12px", marginBottom: "14px", border: "1px solid #fecaca", textAlign: "center" },

  noCardBanner: { background: "#fff", border: "2px dashed #fca5a5", padding: "35px 25px", borderRadius: "16px", marginBottom: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" },
  badgeGray: { background: "#fee2e2", color: "#991b1b", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  btnCreateNewCard: { background: "linear-gradient(90deg, #ea580c, #c2410c)", color: "white", border: "none", padding: "14px 28px", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)" },

  bannerCard: { background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "15px" },
  welcomeTag: { fontSize: "11px", fontWeight: "bold", color: "#059669", textTransform: "uppercase", letterSpacing: "0.5px" },
  badgeGreen: { background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "15px", fontSize: "11px", fontWeight: "bold" },
  badgeOrange: { background: "#fff7ed", color: "#c2410c", padding: "4px 10px", borderRadius: "15px", fontSize: "11px", fontWeight: "bold" },
  tagAyushmanYes: { background: "#e0f2fe", color: "#0369a1", padding: "3px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold" },
  tagAyushmanNo: { background: "#f1f5f9", color: "#64748b", padding: "3px 8px", borderRadius: "12px", fontSize: "10px" },
  btnViewCard: { background: "#16a34a", color: "white", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },

  boxFOVerification: { marginTop: "15px", padding: "16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px" },
  tagBlue: { background: "#dbeafe", color: "#1e40af", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" },
  tagOrange: { background: "#ffedd5", color: "#9a3412", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" },

  activationHeroBox: { marginTop: "15px", padding: "18px", background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", border: "2px solid #ea580c", borderRadius: "10px" },
  btnActivateHero: { background: "linear-gradient(90deg, #ea580c, #c2410c)", color: "white", border: "none", padding: "12px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "900", fontSize: "13px", boxShadow: "0 4px 10px rgba(234, 88, 12, 0.35)", whiteSpace: "nowrap" },

  compareCard: { background: "white", padding: "15px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "15px" },
  compareGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" },
  compareColBad: { background: "#fef2f2", padding: "12px", borderRadius: "8px", border: "1px solid #fee2e2" },
  compareColGood: { background: "#f0fdf4", padding: "12px", borderRadius: "8px", border: "1px solid #dcfce7" },
  compareList: { margin: "6px 0 0", paddingLeft: "18px", fontSize: "12px", lineHeight: "1.6", color: "#334155" },

  networkCard: { background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" },
  selectSm: { padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#f8fafc", fontWeight: "600", outline: "none" },
  tabsBar: { display: "flex", gap: "6px", overflowX: "auto", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "15px" },
  tabBtn: { background: "none", border: "none", padding: "6px 10px", fontSize: "12px", fontWeight: "600", color: "#64748b", cursor: "pointer", whiteSpace: "nowrap" },
  tabBtnActive: { background: "#065f46", color: "white", border: "none", padding: "6px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" },
  tabBtnGreen: { background: "none", border: "none", padding: "6px 10px", fontSize: "12px", fontWeight: "600", color: "#16a34a", cursor: "pointer", whiteSpace: "nowrap" },
  tabBtnActiveGreen: { background: "#16a34a", color: "white", border: "none", padding: "6px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" },

  gridCards: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "12px" },
  itemBox: { background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" },
  distTag: { background: "#e2e8f0", color: "#1e293b", fontSize: "10px", fontWeight: "bold", padding: "3px 7px", borderRadius: "10px" },
  itemLoc: { margin: "2px 0 6px", fontSize: "11px", color: "#64748b" },
  tagGreen: { background: "#dcfce7", color: "#166534", fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "4px" },
  tagGray: { background: "#f1f5f9", color: "#64748b", fontSize: "10px", padding: "2px 6px", borderRadius: "4px" },
  tagBlue: { background: "#e0f2fe", color: "#0369a1", fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "4px" },
  tagOrange: { background: "#ffedd5", color: "#9a3412", fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "4px" },
  btnCall: { display: "inline-block", background: "#0284c7", color: "white", textDecoration: "none", padding: "6px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", marginTop: "8px" },
  noData: { textAlign: "center", padding: "30px", color: "#64748b", gridColumn: "1 / -1", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }
};

export default PatientPortal;