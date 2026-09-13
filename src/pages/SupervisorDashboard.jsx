import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function SupervisorDashboard() {
  const navigate = useNavigate();

  // === SUPERVISOR SESSION (Block & District Isolation) ===
  const currentSupervisor = JSON.parse(
    localStorage.getItem("jeevsathi_staff_user") || 
    localStorage.getItem("jeevsathi_logged_user") || 
    "{}"
  );
  const supervisorDistrict = currentSupervisor.district || "";
  const supervisorBlock = currentSupervisor.block || "";

  // === TABS STATE ===
  const [activeTab, setActiveTab] = useState("verifications");

  // === DATA STATES ===
  const [pendingCards, setPendingCards] = useState([]);
  const [availableFOs, setAvailableFOs] = useState([]);
  const [foPerformance, setFoPerformance] = useState([]);
  const [campsList, setCampsList] = useState([]);
  const [hospitalsList, setHospitalsList] = useState([]);
  const [medicalStoresList, setMedicalStoresList] = useState([]);
  const [schoolsList, setSchoolsList] = useState([]);
  const [diagnosticsList, setDiagnosticsList] = useState([]);

  const [districtsList, setDistrictsList] = useState([]);
  const [formBlocks, setFormBlocks] = useState({});
  const [loading, setLoading] = useState(false);

  // === EDITING STATES ===
  const [isEditingCamp, setIsEditingCamp] = useState(false);
  const [isEditingHospital, setIsEditingHospital] = useState(false);
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [isEditingSchool, setIsEditingSchool] = useState(false);
  const [isEditingDiagnostic, setIsEditingDiagnostic] = useState(false);

  const categoryOptions = [
    "General OPD (सामान्य जाँच)", "Eye Camp (नेत्र शिविर)", "Awareness (जागरूकता)",
    "Dental (दांत)", "Women Health (महिला स्वास्थ्य)", "Child Care (शिशु रोग)",
    "Blood Donation (रक्तदान)", "Other (अन्य)"
  ];

  // Forms
  const [campForm, setCampForm] = useState({
    id: null, name: "", date: "", district: supervisorDistrict, block: supervisorBlock, address: "",
    doctors_count: "", category: [], assigned_fos: [], assigned_hospitals: []
  });

  const [hospitalForm, setHospitalForm] = useState({
    id: null, name: "", contact_number: "", address: "", district: supervisorDistrict, block: supervisorBlock,
    doctors_count: "", treatments: "", facilities: "", ayushman: "No", discount: "", camp_support: ""
  });

  const [storeForm, setStoreForm] = useState({
    id: null, store_name: "", owner_name: "", phone: "", address: "",
    district: supervisorDistrict, block: supervisorBlock, medicine_discount_percent: 10, status: "ACTIVE"
  });

  const [schoolForm, setSchoolForm] = useState({
    id: null, school_name: "", address: "", district: supervisorDistrict, block: supervisorBlock,
    classes_offered: "", jeevsathi_discount_percent: 15, status: "ACTIVE"
  });

  const [diagnosticForm, setDiagnosticForm] = useState({
    id: null, lab_name: "", owner_name: "", phone: "", address: "",
    district: supervisorDistrict, block: supervisorBlock, tests_offered: "Blood, Urine, X-Ray, ECG",
    test_discount_percent: 20, status: "ACTIVE"
  });

  useEffect(() => {
    fetchDistricts();
    fetchScopedData();
  }, []);

  const fetchDistricts = async () => {
    const { data } = await supabase.from("districts").select("*").order("name");
    if (data) {
      setDistrictsList(data);
      if (supervisorDistrict) {
        const found = data.find(d => String(d.name).trim().toLowerCase() === String(supervisorDistrict).trim().toLowerCase());
        if (found) loadBlocksForSection("default", found.id);
      }
    }
  };

  const loadBlocksForSection = async (sectionKey, districtId) => {
    if (!districtId) {
      setFormBlocks(prev => ({ ...prev, [sectionKey]: [] }));
      return;
    }
    const { data } = await supabase.from("blocks").select("*").eq("district_id", districtId).order("name");
    setFormBlocks(prev => ({ ...prev, [sectionKey]: data || [] }));
  };

  const handleDistrictSelect = (sectionKey, distName, setFormState) => {
    setFormState(prev => ({ ...prev, district: distName, block: "" }));
    const found = districtsList.find(d => String(d.name).trim().toLowerCase() === String(distName).trim().toLowerCase());
    if (found) {
      loadBlocksForSection(sectionKey, found.id);
    } else {
      loadBlocksForSection(sectionKey, null);
    }
  };

  // 🔒 सुपरवाइज़र के क्षेत्र का डेटा फेच करना (सभी अस्पताल दिखाने की सुविधा के साथ)
  const fetchScopedData = async () => {
    setLoading(true);

    try {
      // 1. Pending Cards
      let pQuery = supabase.from("camp_patients").select("*")
        .neq("supervisor_status", "VERIFIED")
        .neq("payment_status", "FREE_OPD");
      if (supervisorBlock) pQuery = pQuery.ilike("block", `%${supervisorBlock.trim()}%`);
      else if (supervisorDistrict) pQuery = pQuery.ilike("district", `%${supervisorDistrict.trim()}%`);
      const { data: pData } = await pQuery.order("created_at", { ascending: false });
      setPendingCards(pData || []);

      // 2. Field Officers
      let uQuery = supabase.from("app_users").select("*");
      if (supervisorBlock) uQuery = uQuery.ilike("block", `%${supervisorBlock.trim()}%`);
      else if (supervisorDistrict) uQuery = uQuery.ilike("district", `%${supervisorDistrict.trim()}%`);
      const { data: usersData } = await uQuery;

      if (usersData) {
        const fos = usersData.filter(u => String(u.role).toUpperCase().includes("FIELD"));
        setAvailableFOs(fos);

        let patQuery = supabase.from("camp_patients").select("id, fo_name, payment_status, created_at");
        if (supervisorBlock) patQuery = patQuery.ilike("block", `%${supervisorBlock.trim()}%`);
        const { data: blockPatients } = await patQuery;

        if (blockPatients && blockPatients.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const currentMonth = new Date().getMonth();

          const stats = fos.map(fo => {
            const foCards = blockPatients.filter(p => p.fo_name === fo.name);
            const dailyCards = foCards.filter(p => p.created_at && p.created_at.startsWith(today)).length;
            const monthlyCards = foCards.filter(p => p.created_at && new Date(p.created_at).getMonth() === currentMonth).length;
            const paidCards = foCards.filter(p => p.payment_status === "RECEIVED").length;
            const pendingCount = foCards.filter(p => p.payment_status !== "RECEIVED").length;
            return {
              ...fo, dailyCards, monthlyCards,
              totalPaid: paidCards * 50, // 🚀 FO Payout ₹50 per card
              totalPendingPayment: pendingCount * 50
            };
          });
          setFoPerformance(stats);
        } else {
          setFoPerformance(fos.map(fo => ({ ...fo, dailyCards: 0, monthlyCards: 0, totalPaid: 0, totalPendingPayment: 0 })));
        }
      }

      // 3. Camps, Hospitals, Stores, Schools, Diagnostics
      let cQ = supabase.from("camps").select("*").order("id", { ascending: false });
      let hQ = supabase.from("hospitals").select("*").order("id", { ascending: false });
      let sQ = supabase.from("medical_stores").select("*").order("id", { ascending: false });
      let schQ = supabase.from("schools").select("*").order("id", { ascending: false });
      let dQ = supabase.from("diagnostic_centers").select("*").order("id", { ascending: false });

      if (supervisorDistrict) {
        hQ = hQ.ilike("district", `%${supervisorDistrict.trim()}%`);
        sQ = sQ.ilike("district", `%${supervisorDistrict.trim()}%`);
        schQ = schQ.ilike("district", `%${supervisorDistrict.trim()}%`);
        dQ = dQ.ilike("district", `%${supervisorDistrict.trim()}%`);
        cQ = cQ.ilike("district", `%${supervisorDistrict.trim()}%`);
      }

      const [cRes, hRes, sRes, schRes, dRes] = await Promise.all([
        cQ, hQ, sQ, schQ, dQ
      ]);

      if (cRes.data) setCampsList(cRes.data);
      
      // 🚀 सभी अस्पताल दिखाना (District level fallback ताकि कोई अस्पताल न छुटे)
      if (hRes.data) setHospitalsList(hRes.data);
      if (sRes.data) setMedicalStoresList(sRes.data);
      if (schRes.data) setSchoolsList(schRes.data);
      if (dRes.data) setDiagnosticsList(dRes.data);

    } catch (err) {
      console.error("Scoped fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCard = async (id) => {
    if (window.confirm("क्या आप सुनिश्चित हैं कि ₹150 फीस प्राप्त हो गई है?")) {
      const { error } = await supabase.from("camp_patients").update({ 
        supervisor_status: "VERIFIED", 
        admin_status: "VERIFIED", 
        payment_status: "RECEIVED" 
      }).eq("id", id);

      if (!error) {
        alert(`✅ कार्ड #${id} वेरीफाई कर दिया गया!`);
        fetchScopedData();
      }
    }
  };

  // Hospital CRUD
  const handleRegisterHospital = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: hospitalForm.name,
      contact_number: hospitalForm.contact_number,
      address: hospitalForm.address,
      district: hospitalForm.district,
      block: hospitalForm.block,
      doctors_count: hospitalForm.doctors_count,
      treatments: hospitalForm.treatments,
      facilities: hospitalForm.facilities,
      ayushman: hospitalForm.ayushman,
      discount: hospitalForm.discount,
      camp_support: hospitalForm.camp_support
    };

    let error = null;
    if (isEditingHospital) {
      const res = await supabase.from("hospitals").update(payload).eq("id", hospitalForm.id);
      error = res.error;
    } else {
      const res = await supabase.from("hospitals").insert([payload]);
      error = res.error;
    }

    setLoading(false);
    if (error) {
      alert("❌ त्रुटि: " + error.message);
    } else {
      alert(`🏥 अस्पताल "${hospitalForm.name}" सफलतापूर्वक सेव हुआ!`);
      setHospitalForm({
        id: null, name: "", contact_number: "", address: "", district: supervisorDistrict, block: supervisorBlock,
        doctors_count: "", treatments: "", facilities: "", ayushman: "No", discount: "", camp_support: ""
      });
      setIsEditingHospital(false);
      fetchScopedData();
    }
  };

  const handleEditHospital = (h) => {
    setIsEditingHospital(true);
    setHospitalForm({
      id: h.id,
      name: h.name || "",
      contact_number: h.contact_number || "",
      address: h.address || "",
      district: h.district || supervisorDistrict,
      block: h.block || supervisorBlock,
      doctors_count: h.doctors_count || "",
      treatments: h.treatments || "",
      facilities: h.facilities || "",
      ayushman: h.ayushman || "No",
      discount: h.discount || "",
      camp_support: h.camp_support || ""
    });
    const found = districtsList.find(d => d.name === h.district);
    if (found) loadBlocksForSection("hosp", found.id);
    window.scrollTo(0, 0);
  };

  const handleDeleteHospital = async (id) => {
    if (window.confirm("⚠️ क्या आप सच में इस अस्पताल को डिलीट करना चाहते हैं?")) {
      await supabase.from("hospitals").delete().eq("id", id);
      fetchScopedData();
    }
  };

  // Diagnostic CRUD
  const handleSaveDiagnostic = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      lab_name: diagnosticForm.lab_name,
      owner_name: diagnosticForm.owner_name,
      phone: diagnosticForm.phone,
      address: diagnosticForm.address,
      district: diagnosticForm.district,
      block: diagnosticForm.block,
      tests_offered: diagnosticForm.tests_offered,
      test_discount_percent: Number(diagnosticForm.test_discount_percent) || 0,
      status: diagnosticForm.status
    };

    let error = null;
    if (isEditingDiagnostic) {
      const res = await supabase.from("diagnostic_centers").update(payload).eq("id", diagnosticForm.id);
      error = res.error;
    } else {
      const res = await supabase.from("diagnostic_centers").insert([payload]);
      error = res.error;
    }

    setLoading(false);
    if (error) {
      alert("❌ त्रुटि: " + error.message);
    } else {
      alert(`🔬 डायग्नोस्टिक लैब "${diagnosticForm.lab_name}" सफलतापूर्वक सेव हुई!`);
      setDiagnosticForm({ id: null, lab_name: "", owner_name: "", phone: "", address: "", district: supervisorDistrict, block: supervisorBlock, tests_offered: "Blood, Urine, X-Ray, ECG", test_discount_percent: 20, status: "ACTIVE" });
      setIsEditingDiagnostic(false);
      fetchScopedData();
    }
  };

  const handleEditDiagnostic = (lab) => {
    setIsEditingDiagnostic(true);
    setDiagnosticForm({
      id: lab.id,
      lab_name: lab.lab_name || "",
      owner_name: lab.owner_name || "",
      phone: lab.phone || "",
      address: lab.address || "",
      district: lab.district || supervisorDistrict,
      block: lab.block || supervisorBlock,
      tests_offered: lab.tests_offered || "",
      test_discount_percent: lab.test_discount_percent || 20,
      status: lab.status || "ACTIVE"
    });
    const found = districtsList.find(d => d.name === lab.district);
    if (found) loadBlocksForSection("diag", found.id);
    window.scrollTo(0, 0);
  };

  const handleDeleteDiagnostic = async (id) => {
    if (window.confirm("⚠️ क्या आप इस डायग्नोस्टिक लैब को हटाना चाहते हैं?")) {
      await supabase.from("diagnostic_centers").delete().eq("id", id);
      fetchScopedData();
    }
  };

  // Medical Store CRUD
  const handleSaveStore = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      store_name: storeForm.store_name,
      owner_name: storeForm.owner_name,
      phone: storeForm.phone,
      address: storeForm.address,
      district: storeForm.district,
      block: storeForm.block,
      medicine_discount_percent: Number(storeForm.medicine_discount_percent) || 0,
      status: storeForm.status
    };

    let error = null;
    if (isEditingStore) {
      const res = await supabase.from("medical_stores").update(payload).eq("id", storeForm.id);
      error = res.error;
    } else {
      const res = await supabase.from("medical_stores").insert([payload]);
      error = res.error;
    }

    setLoading(false);
    if (error) {
      alert("❌ त्रुटि: " + error.message);
    } else {
      alert(`💊 मेडिकल स्टोर "${storeForm.store_name}" सेव हुआ!`);
      setStoreForm({ id: null, store_name: "", owner_name: "", phone: "", address: "", district: supervisorDistrict, block: supervisorBlock, medicine_discount_percent: 10, status: "ACTIVE" });
      setIsEditingStore(false);
      fetchScopedData();
    }
  };

  const handleEditStore = (store) => {
    setIsEditingStore(true);
    setStoreForm({
      id: store.id,
      store_name: store.store_name || "",
      owner_name: store.owner_name || "",
      phone: store.phone || "",
      address: store.address || "",
      district: store.district || supervisorDistrict,
      block: store.block || supervisorBlock,
      medicine_discount_percent: store.medicine_discount_percent || 10,
      status: store.status || "ACTIVE"
    });
    const found = districtsList.find(d => d.name === store.district);
    if (found) loadBlocksForSection("store", found.id);
    window.scrollTo(0, 0);
  };

  const handleDeleteStore = async (id) => {
    if (window.confirm("⚠️ क्या आप इस मेडिकल स्टोर को हटाना चाहते हैं?")) {
      await supabase.from("medical_stores").delete().eq("id", id);
      fetchScopedData();
    }
  };

  // Education CRUD
  const handleSaveSchool = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      school_name: schoolForm.school_name,
      address: schoolForm.address,
      district: schoolForm.district,
      block: schoolForm.block,
      classes_offered: schoolForm.classes_offered,
      jeevsathi_discount_percent: Number(schoolForm.jeevsathi_discount_percent) || 0,
      status: schoolForm.status
    };

    let error = null;
    if (isEditingSchool) {
      const res = await supabase.from("schools").update(payload).eq("id", schoolForm.id);
      error = res.error;
    } else {
      const res = await supabase.from("schools").insert([payload]);
      error = res.error;
    }

    setLoading(false);
    if (error) {
      alert("❌ त्रुटि: " + error.message);
    } else {
      alert(`🎓 संस्थान "${schoolForm.school_name}" सेव हुआ!`);
      setSchoolForm({ id: null, school_name: "", address: "", district: supervisorDistrict, block: supervisorBlock, classes_offered: "", jeevsathi_discount_percent: 15, status: "ACTIVE" });
      setIsEditingSchool(false);
      fetchScopedData();
    }
  };

  const handleEditSchool = (sch) => {
    setIsEditingSchool(true);
    setSchoolForm({
      id: sch.id,
      school_name: sch.school_name || "",
      address: sch.address || "",
      district: sch.district || supervisorDistrict,
      block: sch.block || supervisorBlock,
      classes_offered: sch.classes_offered || "",
      jeevsathi_discount_percent: sch.jeevsathi_discount_percent || 15,
      status: sch.status || "ACTIVE"
    });
    const found = districtsList.find(d => d.name === sch.district);
    if (found) loadBlocksForSection("school", found.id);
    window.scrollTo(0, 0);
  };

  const handleDeleteSchool = async (id) => {
    if (window.confirm("⚠️ क्या आप इस संस्थान को हटाना चाहते हैं?")) {
      await supabase.from("schools").delete().eq("id", id);
      fetchScopedData();
    }
  };

  // Camp CRUD
  const handleCreateCamp = async (e) => {
    e.preventDefault();
    if (campForm.assigned_fos.length === 0) return alert("⚠️ कृपया कैम्प के लिए कम से कम 1 FO चुनें!");
    if (campForm.assigned_hospitals.length === 0) return alert("⚠️ कृपया कम से कम 1 अस्पताल चुनें!");
    if (campForm.category.length === 0) return alert("⚠️ कृपया कम से कम 1 कैम्प कैटेगरी चुनें!");

    setLoading(true);
    const payload = {
      name: campForm.name,
      camp_name: campForm.name,
      date: campForm.date,
      district: campForm.district,
      block: campForm.block,
      address: campForm.address,
      hospital_1: "",
      hospital_2: "",
      doctors_count: String(campForm.doctors_count || "0"),
      category: campForm.category.join(", "),
      assigned_fos: JSON.stringify(campForm.assigned_fos),
      assigned_hospitals: JSON.stringify(campForm.assigned_hospitals)
    };

    let error = null;
    if (isEditingCamp) {
      const res = await supabase.from("camps").update(payload).eq("id", campForm.id);
      error = res.error;
    } else {
      const res = await supabase.from("camps").insert([payload]);
      error = res.error;
    }

    setLoading(false);
    if (error) {
      alert("❌ त्रुटि: " + error.message);
    } else {
      alert(`✅ कैम्प "${campForm.name}" सफलतापूर्वक दर्ज हुआ!`);
      setCampForm({ id: null, name: "", date: "", district: supervisorDistrict, block: supervisorBlock, address: "", doctors_count: "", category: [], assigned_fos: [], assigned_hospitals: [] });
      setIsEditingCamp(false);
      fetchScopedData();
    }
  };

  const handleEditCamp = (camp) => {
    setIsEditingCamp(true);
    setCampForm({
      id: camp.id,
      name: camp.camp_name || camp.name || "",
      date: camp.date || "",
      district: camp.district || supervisorDistrict,
      block: camp.block || supervisorBlock,
      address: camp.address || "",
      doctors_count: camp.doctors_count || "",
      category: camp.category ? camp.category.split(", ") : [],
      assigned_fos: camp.assigned_fos ? (typeof camp.assigned_fos === 'string' ? JSON.parse(camp.assigned_fos) : camp.assigned_fos) : [],
      assigned_hospitals: camp.assigned_hospitals ? (typeof camp.assigned_hospitals === 'string' ? JSON.parse(camp.assigned_hospitals) : camp.assigned_hospitals) : []
    });
    const found = districtsList.find(d => d.name === camp.district);
    if (found) loadBlocksForSection("camp", found.id);
    window.scrollTo(0, 0);
  };

  const handleDeleteCamp = async (id) => {
    if (window.confirm("⚠️ क्या आप सच में इस कैम्प को डिलीट करना चाहते हैं?")) {
      await supabase.from("camps").delete().eq("id", id);
      fetchScopedData();
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px" }}>👨‍💼 Supervisor Workspace</h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#bfdbfe" }}>
            अधिकार क्षेत्र: <strong>{supervisorDistrict || "All Districts"}</strong> — <strong>{supervisorBlock || "All Blocks"}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchScopedData} style={styles.btnRefresh}>🔄 रिफ्रेश डेटा</button>
          <button onClick={() => { localStorage.clear(); navigate("/login"); }} style={styles.btnDanger}>🚪 Logout</button>
        </div>
      </header>

      <div style={styles.navBar}>
        <button style={activeTab === "verifications" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("verifications")}>⏳ Verifications ({pendingCards.length})</button>
        <button style={activeTab === "hospital" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("hospital")}>🏥 Hospitals ({hospitalsList.length})</button>
        <button style={activeTab === "camp" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("camp")}>🏕️ Health Camps ({campsList.length})</button>
        <button style={activeTab === "diagnostics" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("diagnostics")}>🔬 Diagnostic Labs ({diagnosticsList.length})</button>
        <button style={activeTab === "medical" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("medical")}>💊 Medical Stores ({medicalStoresList.length})</button>
        <button style={activeTab === "education" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("education")}>🎓 Education ({schoolsList.length})</button>
        <button style={activeTab === "fo_manage" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("fo_manage")}>👨‍💼 Block FOs</button>
      </div>

      <main style={styles.main}>
        {/* 1. Verifications */}
        {activeTab === "verifications" && (
          <div style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>⏳ ब्लॉक कार्ड वेरिफिकेशन ({supervisorBlock || "All"})</h3>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}><th>Patient ID & Name</th><th>Field Officer</th><th>Mobile & Address</th><th>Fee Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {pendingCards.map(c => (
                  <tr key={c.id} style={styles.trBody}>
                    <td style={styles.td}><strong>{c.patient_name}</strong><br /><span style={styles.smText}>ID: #{c.id}</span></td>
                    <td style={styles.td}>{c.fo_name}</td>
                    <td style={styles.td}>📱 {c.mobile}<br /><span style={styles.smText}>{c.village}, {c.block}</span></td>
                    <td style={styles.td}><span style={styles.badgeWarning}>₹150 PENDING</span></td>
                    <td style={styles.td}>
                      <button onClick={() => handleVerifyCard(c.id)} style={styles.btnVerify}>✅ Verify ₹150 Received</button>
                    </td>
                  </tr>
                ))}
                {pendingCards.length === 0 && <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>आपके ब्लॉक में कोई कार्ड पेंडिंग नहीं है।</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Hospitals */}
        {activeTab === "hospital" && (
          <div style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>🏥 {isEditingHospital ? "अस्पताल अपडेट करें" : "Hospital Registration & Directory"}</h3>
            <form onSubmit={handleRegisterHospital} style={styles.card}>
              <div style={styles.grid2}>
                <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}><label style={styles.label}>Hospital Name</label><input type="text" style={styles.input} value={hospitalForm.name} onChange={e => setHospitalForm({ ...hospitalForm, name: e.target.value })} required /></div>
                <div style={styles.inputGroup}><label style={styles.label}>Contact Number</label><input type="text" style={styles.input} value={hospitalForm.contact_number} onChange={e => setHospitalForm({ ...hospitalForm, contact_number: e.target.value })} required /></div>
                <div style={styles.inputGroup}><label style={styles.label}>Total Doctors</label><input type="number" style={styles.input} value={hospitalForm.doctors_count} onChange={e => setHospitalForm({ ...hospitalForm, doctors_count: e.target.value })} required /></div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>District</label>
                  <select style={styles.input} value={hospitalForm.district} onChange={e => handleDistrictSelect("hosp", e.target.value, setHospitalForm)} required>
                    <option value="">-- Select District --</option>
                    {districtsList.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Block</label>
                  <select style={styles.input} value={hospitalForm.block} onChange={e => setHospitalForm({ ...hospitalForm, block: e.target.value })} required>
                    <option value="">-- Select Block --</option>
                    {(formBlocks["hosp"] || formBlocks["default"] || []).map(b => <option key={b.id || b.name} value={b.name}>{b.name}</option>)}
                  </select>
                </div>

                <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}><label style={styles.label}>Full Address</label><input type="text" style={styles.input} value={hospitalForm.address} onChange={e => setHospitalForm({ ...hospitalForm, address: e.target.value })} required /></div>
                <div style={styles.inputGroup}><label style={styles.label}>Ayushman Bharat?</label><select style={styles.input} value={hospitalForm.ayushman} onChange={e => setHospitalForm({ ...hospitalForm, ayushman: e.target.value })}><option value="Yes">हाँ (Yes)</option><option value="No">नहीं (No)</option></select></div>
                <div style={styles.inputGroup}><label style={styles.label}>Discount Offered on Card</label><input type="text" style={styles.input} value={hospitalForm.discount} onChange={e => setHospitalForm({ ...hospitalForm, discount: e.target.value })} required /></div>
                <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}><label style={styles.label}>Treatments Available</label><input type="text" style={styles.input} value={hospitalForm.treatments} onChange={e => setHospitalForm({ ...hospitalForm, treatments: e.target.value })} required /></div>
                <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}><label style={styles.label}>Facilities / Camp Support</label><input type="text" style={styles.input} value={hospitalForm.facilities} onChange={e => setHospitalForm({ ...hospitalForm, facilities: e.target.value })} required /></div>
              </div>
              <button type="submit" disabled={loading} style={styles.btnPrimaryFull}>{isEditingHospital ? "💾 Update Hospital" : "🏥 Register Hospital"}</button>
            </form>

            <div style={{ marginTop: "20px" }}>
              <h4>सूचीबद्ध अस्पताल ({hospitalsList.length})</h4>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHead}><th>Hospital</th><th>Location</th><th>Benefits</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {hospitalsList.map(h => (
                    <tr key={h.id} style={styles.trBody}>
                      <td style={styles.td}><strong>{h.name}</strong><br /><span style={styles.smText}>📞 {h.contact_number}</span></td>
                      <td style={styles.td}>{h.block}, {h.district}</td>
                      <td style={styles.td}><span style={styles.badgeSuccess}>{h.discount || "20% OPD"}</span></td>
                      <td style={styles.td}>
                        <button onClick={() => handleEditHospital(h)} style={styles.btnEditSm}>✏️</button>
                        <button onClick={() => handleDeleteHospital(h.id)} style={styles.btnDeleteSm}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {hospitalsList.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                        कोई अस्पताल रिकॉर्ड नहीं मिला। होम पेज से नया अस्पताल रजिस्टर करें।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Camps */}
        {activeTab === "camp" && (
          <div style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>🏕️ {isEditingCamp ? "कैम्प की जानकारी बदलें" : "नया कैम्प जोड़ें"}</h3>
            <form onSubmit={handleCreateCamp} style={styles.card}>
              <div style={styles.grid2}>
                <div style={styles.inputGroup}><label style={styles.label}>Camp Name</label><input type="text" style={styles.input} value={campForm.name} onChange={e => setCampForm({ ...campForm, name: e.target.value })} required /></div>
                <div style={styles.inputGroup}><label style={styles.label}>Date</label><input type="date" style={styles.input} value={campForm.date} onChange={e => setCampForm({ ...campForm, date: e.target.value })} required /></div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>District</label>
                  <select style={styles.input} value={campForm.district} onChange={e => handleDistrictSelect("camp", e.target.value, setCampForm)} required>
                    <option value="">-- Select District --</option>
                    {districtsList.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Block</label>
                  <select style={styles.input} value={campForm.block} onChange={e => setCampForm({ ...campForm, block: e.target.value })} required>
                    <option value="">-- Select Block --</option>
                    {(formBlocks["camp"] || formBlocks["default"] || []).map(b => <option key={b.id || b.name} value={b.name}>{b.name}</option>)}
                  </select>
                </div>

                <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}><label style={styles.label}>Address / Location</label><input type="text" style={styles.input} value={campForm.address} onChange={e => setCampForm({ ...campForm, address: e.target.value })} required /></div>

                <div style={{ ...styles.inputGroup, gridColumn: "1 / -1", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <label style={{ ...styles.label, color: "#1d4ed8" }}>Camp Categories</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                    {categoryOptions.map(cat => (
                      <label key={cat} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                        <input type="checkbox" checked={campForm.category.includes(cat)} onChange={() => {
                          const exist = campForm.category.includes(cat);
                          setCampForm({ ...campForm, category: exist ? campForm.category.filter(c => c !== cat) : [...campForm.category, cat] });
                        }} />{cat}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}><label style={{ ...styles.label, color: "#ea580c" }}>Assign FOs (केवल आपके ब्लॉक के)</label>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "5px" }}>
                    {availableFOs.map(fo => (
                      <label key={fo.id} style={{ display: "flex", alignItems: "center", gap: "6px", background: campForm.assigned_fos.includes(fo.name) ? "#ffedd5" : "#fff", padding: "6px 12px", border: "1px solid #fed7aa", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
                        <input type="checkbox" checked={campForm.assigned_fos.includes(fo.name)} onChange={() => {
                          const exist = campForm.assigned_fos.includes(fo.name);
                          setCampForm({ ...campForm, assigned_fos: exist ? campForm.assigned_fos.filter(n => n !== fo.name) : [...campForm.assigned_fos, fo.name] });
                        }} />{fo.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ ...styles.inputGroup, gridColumn: "1 / -1" }}><label style={{ ...styles.label, color: "#16a34a" }}>Assign Partner Hospitals</label>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "5px" }}>
                    {hospitalsList.map(h => (
                      <label key={h.id} style={{ display: "flex", alignItems: "center", gap: "6px", background: campForm.assigned_hospitals.includes(h.name) ? "#dcfce7" : "#fff", padding: "6px 12px", border: "1px solid #bbf7d0", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
                        <input type="checkbox" checked={campForm.assigned_hospitals.includes(h.name)} onChange={() => {
                          const exist = campForm.assigned_hospitals.includes(h.name);
                          setCampForm({ ...campForm, assigned_hospitals: exist ? campForm.assigned_hospitals.filter(n => n !== h.name) : [...campForm.assigned_hospitals, h.name] });
                        }} />{h.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading} style={styles.btnPrimaryFull}>{isEditingCamp ? "💾 Update Camp" : "🚀 Create Camp"}</button>
            </form>

            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}><th>Camp</th><th>Location</th><th>Action</th></tr>
              </thead>
              <tbody>
                {campsList.map(c => (
                  <tr key={c.id} style={styles.trBody}>
                    <td style={styles.td}><strong>{c.camp_name || c.name}</strong><br /><span style={styles.smText}>📅 {c.date}</span></td>
                    <td style={styles.td}>📍 {c.address}, {c.block}</td>
                    <td style={styles.td}>
                      <button onClick={() => handleEditCamp(c)} style={styles.btnEditSm}>✏️</button>
                      <button onClick={() => handleDeleteCamp(c.id)} style={styles.btnDeleteSm}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Diagnostics / Labs */}
        {activeTab === "diagnostics" && (
          <div style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>🔬 {isEditingDiagnostic ? "डायग्नोस्टिक लैब अपडेट करें" : "Diagnostic / Pathology Labs"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px" }}>
              <form onSubmit={handleSaveDiagnostic} style={styles.card}>
                <h4 style={{ margin: 0 }}>➕ Add Diagnostic Lab</h4>
                <input type="text" placeholder="Lab Name" style={styles.input} value={diagnosticForm.lab_name} onChange={e => setDiagnosticForm({ ...diagnosticForm, lab_name: e.target.value })} required />
                <input type="text" placeholder="Owner / Doctor Name" style={styles.input} value={diagnosticForm.owner_name} onChange={e => setDiagnosticForm({ ...diagnosticForm, owner_name: e.target.value })} required />
                <input type="tel" placeholder="Contact Phone" style={styles.input} value={diagnosticForm.phone} onChange={e => setDiagnosticForm({ ...diagnosticForm, phone: e.target.value })} required />
                
                <div style={styles.grid2}>
                  <div>
                    <label style={styles.label}>District</label>
                    <select style={styles.input} value={diagnosticForm.district} onChange={e => handleDistrictSelect("diag", e.target.value, setDiagnosticForm)} required>
                      <option value="">-- Select District --</option>
                      {districtsList.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Block</label>
                    <select style={styles.input} value={diagnosticForm.block} onChange={e => setDiagnosticForm({ ...diagnosticForm, block: e.target.value })} required>
                      <option value="">-- Select Block --</option>
                      {(formBlocks["diag"] || formBlocks["default"] || []).map(b => <option key={b.id || b.name} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <input type="text" placeholder="Tests (e.g. Blood, Urine, X-Ray)" style={styles.input} value={diagnosticForm.tests_offered} onChange={e => setDiagnosticForm({ ...diagnosticForm, tests_offered: e.target.value })} required />
                <input type="text" placeholder="Full Address" style={styles.input} value={diagnosticForm.address} onChange={e => setDiagnosticForm({ ...diagnosticForm, address: e.target.value })} required />
                <input type="number" placeholder="Discount % on Tests" style={styles.input} value={diagnosticForm.test_discount_percent} onChange={e => setDiagnosticForm({ ...diagnosticForm, test_discount_percent: e.target.value })} required />
                <button type="submit" disabled={loading} style={styles.btnPrimaryFull}>{isEditingDiagnostic ? "💾 Update Lab" : "🚀 Register Lab"}</button>
              </form>

              <div style={styles.card}>
                <h4 style={{ margin: 0 }}>Registered Labs ({diagnosticsList.length})</h4>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.trHead}><th>Lab Name</th><th>Location</th><th>Discount</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {diagnosticsList.map(l => (
                      <tr key={l.id} style={styles.trBody}>
                        <td style={styles.td}><strong>{l.lab_name}</strong><br /><span style={styles.smText}>👤 {l.owner_name}</span></td>
                        <td style={styles.td}>{l.block}, {l.district}</td>
                        <td style={styles.td}><span style={styles.badgeSuccess}>{l.test_discount_percent}% OFF</span></td>
                        <td style={styles.td}>
                          <button onClick={() => handleEditDiagnostic(l)} style={styles.btnEditSm}>✏️</button>
                          <button onClick={() => handleDeleteDiagnostic(l.id)} style={styles.btnDeleteSm}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {diagnosticsList.length === 0 && <tr><td colSpan="4" style={{ textAlign: "center", padding: "15px" }}>कोई लैब नहीं मिली।</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. Medical Stores */}
        {activeTab === "medical" && (
          <div style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>💊 {isEditingStore ? "मेडिकल स्टोर अपडेट करें" : "Medical Stores Management"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px" }}>
              <form onSubmit={handleSaveStore} style={styles.card}>
                <h4 style={{ margin: 0 }}>➕ Add Medical Store</h4>
                <input type="text" placeholder="Store Name" style={styles.input} value={storeForm.store_name} onChange={e => setStoreForm({ ...storeForm, store_name: e.target.value })} required />
                <input type="text" placeholder="Owner Name" style={styles.input} value={storeForm.owner_name} onChange={e => setStoreForm({ ...storeForm, owner_name: e.target.value })} required />
                <input type="tel" placeholder="Phone Number" style={styles.input} value={storeForm.phone} onChange={e => setStoreForm({ ...storeForm, phone: e.target.value })} required />

                <div style={styles.grid2}>
                  <div>
                    <label style={styles.label}>District</label>
                    <select style={styles.input} value={storeForm.district} onChange={e => handleDistrictSelect("store", e.target.value, setStoreForm)} required>
                      <option value="">-- Select District --</option>
                      {districtsList.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Block</label>
                    <select style={styles.input} value={storeForm.block} onChange={e => setStoreForm({ ...storeForm, block: e.target.value })} required>
                      <option value="">-- Select Block --</option>
                      {(formBlocks["store"] || formBlocks["default"] || []).map(b => <option key={b.id || b.name} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <input type="text" placeholder="Full Address" style={styles.input} value={storeForm.address} onChange={e => setStoreForm({ ...storeForm, address: e.target.value })} required />
                <input type="number" placeholder="Discount % on Medicine" style={styles.input} value={storeForm.medicine_discount_percent} onChange={e => setStoreForm({ ...storeForm, medicine_discount_percent: e.target.value })} required />
                <button type="submit" disabled={loading} style={styles.btnPrimaryFull}>{isEditingStore ? "💾 Update Store" : "🚀 Save Store"}</button>
              </form>

              <div style={styles.card}>
                <h4 style={{ margin: 0 }}>Registered Medical Stores ({medicalStoresList.length})</h4>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.trHead}><th>Store</th><th>Location</th><th>Discount</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {medicalStoresList.map(s => (
                      <tr key={s.id} style={styles.trBody}>
                        <td style={styles.td}><strong>{s.store_name}</strong><br /><span style={styles.smText}>👤 {s.owner_name}</span></td>
                        <td style={styles.td}>{s.block}, {s.district}</td>
                        <td style={styles.td}><span style={styles.badgeSuccess}>{s.medicine_discount_percent}% OFF</span></td>
                        <td style={styles.td}>
                          <button onClick={() => handleEditStore(s)} style={styles.btnEditSm}>✏️</button>
                          <button onClick={() => handleDeleteStore(s.id)} style={styles.btnDeleteSm}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {medicalStoresList.length === 0 && <tr><td colSpan="4" style={{ textAlign: "center", padding: "15px" }}>कोई स्टोर नहीं मिला।</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. Education */}
        {activeTab === "education" && (
          <div style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>🎓 {isEditingSchool ? "संस्थान अपडेट करें" : "Education & Institutes"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px" }}>
              <form onSubmit={handleSaveSchool} style={styles.card}>
                <h4 style={{ margin: 0 }}>➕ Add Institute Partner</h4>
                <input type="text" placeholder="School or Institute Name" style={styles.input} value={schoolForm.school_name} onChange={e => setSchoolForm({ ...schoolForm, school_name: e.target.value })} required />
                
                <div style={styles.grid2}>
                  <div>
                    <label style={styles.label}>District</label>
                    <select style={styles.input} value={schoolForm.district} onChange={e => handleDistrictSelect("school", e.target.value, setSchoolForm)} required>
                      <option value="">-- Select District --</option>
                      {districtsList.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Block</label>
                    <select style={styles.input} value={schoolForm.block} onChange={e => setSchoolForm({ ...schoolForm, block: e.target.value })} required>
                      <option value="">-- Select Block --</option>
                      {(formBlocks["school"] || formBlocks["default"] || []).map(b => <option key={b.id || b.name} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <input type="text" placeholder="Courses (e.g. CCC, Tally, DCA)" style={styles.input} value={schoolForm.classes_offered} onChange={e => setSchoolForm({ ...schoolForm, classes_offered: e.target.value })} required />
                <input type="text" placeholder="Full Address" style={styles.input} value={schoolForm.address} onChange={e => setSchoolForm({ ...schoolForm, address: e.target.value })} required />
                <input type="number" placeholder="Fee Concession %" style={styles.input} value={schoolForm.jeevsathi_discount_percent} onChange={e => setSchoolForm({ ...schoolForm, jeevsathi_discount_percent: e.target.value })} required />
                <button type="submit" disabled={loading} style={styles.btnPrimaryFull}>{isEditingSchool ? "💾 Update Institute" : "🚀 Save Institute"}</button>
              </form>

              <div style={styles.card}>
                <h4 style={{ margin: 0 }}>Partner Institutes ({schoolsList.length})</h4>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.trHead}><th>Institute</th><th>Location</th><th>Discount</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {schoolsList.map(sch => (
                      <tr key={sch.id} style={styles.trBody}>
                        <td style={styles.td}><strong>{sch.school_name}</strong><br /><span style={styles.smText}>{sch.classes_offered}</span></td>
                        <td style={styles.td}>{sch.block}, {sch.district}</td>
                        <td style={styles.td}><span style={styles.badgeWarning}>{sch.jeevsathi_discount_percent}% OFF</span></td>
                        <td style={styles.td}>
                          <button onClick={() => handleEditSchool(sch)} style={styles.btnEditSm}>✏️</button>
                          <button onClick={() => handleDeleteSchool(sch.id)} style={styles.btnDeleteSm}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {schoolsList.length === 0 && <tr><td colSpan="4" style={{ textAlign: "center", padding: "15px" }}>कोई संस्थान नहीं मिला।</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 7. Field Officers */}
        {activeTab === "fo_manage" && (
          <div style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>👨‍💼 ब्लॉक फील्ड ऑफिसर्स ({supervisorBlock})</h3>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}><th>FO Name</th><th>Daily Cards</th><th>Monthly Cards</th><th>Payout Total (₹50/Card)</th></tr>
              </thead>
              <tbody>
                {foPerformance.map(fo => (
                  <tr key={fo.id} style={styles.trBody}>
                    <td style={styles.td}><strong>{fo.name}</strong><br /><span style={styles.smText}>{fo.email || fo.mobile}</span></td>
                    <td style={styles.td}><span style={styles.badgeWarning}>{fo.dailyCards} Cards</span></td>
                    <td style={styles.td}>{fo.monthlyCards} Cards</td>
                    <td style={styles.td}><strong style={{ color: "#16a34a" }}>₹{fo.totalPaid} Paid</strong></td>
                  </tr>
                ))}
                {foPerformance.length === 0 && <tr><td colSpan="4" style={{ textAlign: "center", padding: "15px" }}>आपके ब्लॉक में कोई FO नियुक्त नहीं है।</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f1f5f9", fontFamily: "'Inter', sans-serif" },
  header: { background: "#1e3a8a", padding: "15px 5%", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" },
  navBar: { background: "white", padding: "0 5%", display: "flex", gap: "10px", borderBottom: "1px solid #cbd5e1", overflowX: "auto" },
  navBtn: { padding: "15px 20px", background: "transparent", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#64748b", borderBottom: "3px solid transparent", whiteSpace: "nowrap" },
  navBtnActive: { padding: "15px 20px", background: "transparent", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "bold", color: "#1e3a8a", borderBottom: "3px solid #1e3a8a", whiteSpace: "nowrap" },
  main: { padding: "30px 5%", maxWidth: "1200px", margin: "0 auto" },
  tabContent: { animation: "fadeIn 0.3s ease-in-out" },
  sectionTitle: { color: "#0f172a", fontSize: "20px", margin: "0 0 15px 0" },
  card: { background: "white", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: "bold", color: "#475569" },
  input: { padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "#f8fafc", outline: "none", width: "100%", boxSizing: "border-box" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px", background: "white", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0", marginTop: "15px" },
  trHead: { background: "#f8fafc", color: "#475569" },
  th: { padding: "14px", borderBottom: "1px solid #e2e8f0", textAlign: "left" },
  trBody: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "14px", verticalAlign: "middle" },
  smText: { fontSize: "12px", color: "#64748b" },
  btnVerify: { background: "#16a34a", color: "white", border: "none", padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
  btnPrimaryFull: { width: "100%", background: "#2563eb", color: "white", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" },
  btnDanger: { background: "#ef4444", border: "none", color: "white", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" },
  btnRefresh: { background: "#059669", border: "none", color: "white", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" },
  btnEditSm: { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", marginRight: "5px" },
  btnDeleteSm: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" },
  badgeSuccess: { background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", display: "inline-block" },
  badgeWarning: { background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", display: "inline-block" }
};

export default SupervisorDashboard;