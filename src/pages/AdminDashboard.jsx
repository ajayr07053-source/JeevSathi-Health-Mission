import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function AdminDashboard() {
  const navigate = useNavigate();
  
  // === STATES ===
  const [activeTab, setActiveTab] = useState("analytics"); // analytics, direct_cards, online_paid, approvals, team, gallery, gov_vault, payments, master
  const [patients, setPatients] = useState([]);
  
  const [usersList, setUsersList] = useState([]);
  const [campsList, setCampsList] = useState([]);
  const [hospitalsList, setHospitalsList] = useState([]);
  
  const [districtsList, setDistrictsList] = useState([]);
  const [blocksList, setBlocksList] = useState([]);
  const [filterBlocksList, setFilterBlocksList] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(""); 
  
  const [newMember, setNewMember] = useState({ id: null, name: "", email: "", password: "", role: "Field Officer", district: "", block: "", supervisor: "", photo_url: "", advance_payment: "" });
  const [isEditing, setIsEditing] = useState(false);

  const [showIdModal, setShowIdModal] = useState(false);
  const [selectedUserForId, setSelectedUserForId] = useState(null);

  // === FILTER STATES ===
  const [filterType, setFilterType] = useState("online_paid");
  const [filterDistrict, setFilterDistrict] = useState("All");
  const [filterBlock, setFilterBlock] = useState("All");
  const [filterMember, setFilterMember] = useState("All");

  // === 📸 GALLERY STATES ===
  const [galleryList, setGalleryList] = useState([]);
  const [galleryForm, setGalleryForm] = useState({ id: null, title: "", description: "", image_url: "" });
  const [isEditingGallery, setIsEditingGallery] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setDbError("");

    try {
      const { data: uData, error: uError } = await supabase.from("app_users").select("*");
      if (uError) throw new Error("Users Table Error: " + uError.message);
      if (uData) setUsersList(uData);

      const { data: pData, error: pError } = await supabase.from("camp_patients").select("*").order("created_at", { ascending: false });
      if (pError) throw new Error("Patients Table Error: " + pError.message);
      if (pData) setPatients(pData || []);

      const { data: cData, error: cError } = await supabase.from("camps").select("*").order("date", { ascending: false });
      if (cError) throw new Error("Camps Table Error: " + cError.message);
      if (cData) setCampsList(cData || []);

      const { data: hData, error: hError } = await supabase.from("hospitals").select("*");
      if (hError) throw new Error("Hospitals Table Error: " + hError.message);
      if (hData) setHospitalsList(hData || []);

      const { data: gData } = await supabase.from("camp_gallery").select("*").order("id", { ascending: false });
      if (gData) setGalleryList(gData);

    } catch (err) {
      console.error(err);
      setDbError(err.message);
    }

    setLoading(false);
  };

  const loadDistricts = async () => {
    const { data } = await supabase.from("districts").select("*").order("name");
    if(data) setDistrictsList(data);
  };

  useEffect(() => {
    fetchData();
    loadDistricts();
  }, []);

  useEffect(() => {
    if (newMember.district && districtsList.length > 0) {
      const selectedDist = districtsList.find(d => d.name === newMember.district);
      if (selectedDist && selectedDist.id) {
        supabase.from("blocks").select("*").eq("district_id", selectedDist.id).order("name")
        .then(({data}) => setBlocksList(data || []));
      }
    } else {
      setBlocksList([]);
    }
  }, [newMember.district, districtsList]);

  useEffect(() => {
    if (filterDistrict && filterDistrict !== "All" && districtsList.length > 0) {
      const selectedDist = districtsList.find(d => d.name === filterDistrict);
      if (selectedDist && selectedDist.id) {
        supabase.from("blocks").select("*").eq("district_id", selectedDist.id).order("name")
        .then(({data}) => setFilterBlocksList(data || []));
      }
    } else {
      setFilterBlocksList([]);
    }
  }, [filterDistrict, districtsList]);

  // === HELPER FUNCTIONS ===
  const isOnlinePaid = (p) => {
    return p.payment_mode === "ONLINE_PAID" || p.payment_mode === "ONLINE_PAY" || (p.payment_status === "PAID" && p.payment_mode !== "PAY_TO_FO");
  };

  const isDirectPatient = (p) => {
    return !p.fo_id || !p.fo_name || p.fo_name === "Unassigned" || p.fo_name === "DIRECT" || String(p.fo_name).trim() === "";
  };

  // 👴 सीनियर सिटीजन (60+ आयु) की पहचान
  const isSeniorCitizen = (p) => {
    if (p.is_senior_citizen === true) return true;
    if (p.age && Number(p.age) >= 60) return true;
    if (p.dob) {
      const birthYear = new Date(p.dob).getFullYear();
      const currentYear = new Date().getFullYear();
      if (currentYear - birthYear >= 60) return true;
    }
    return false;
  };

  // 📥 केवल 60+ बुजुर्गों की CSV रिपोर्ट डाउनलोड
  const exportSeniorCitizenReport = () => {
    const seniorList = patients.filter(isSeniorCitizen);
    if (seniorList.length === 0) {
      alert("⚠️ कोई 60+ सीनियर सिटीजन रिकॉर्ड नहीं मिला!");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Beneficiary ID,Senior Citizen Name,Father or Husband Name,Age,Gender,Mobile,Village,Block,District,Payment Status,Registration Date,Photo URL\n";

    seniorList.forEach(p => {
      csvContent += `"${p.id}","${p.patient_name || ''}","${p.father_husband_name || ''}","${p.age || '60+'}","${p.gender || ''}","${p.mobile || ''}","${p.village || ''}","${p.block || ''}","${p.district || ''}","${p.payment_status || ''}","${p.created_at ? p.created_at.split('T')[0] : ''}","${p.photo_url || 'No Photo'}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sinux_Senior_Citizens_60Plus_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 🏆 समग्र आधिकारिक CSR & सरकारी ग्रांट ऑडिट रिपोर्ट (फोटो, 60+ अलग, कैम्प गैलरी सहित)
  const generateOfficialImpactReport = () => {
    const seniorList = patients.filter(isSeniorCitizen);
    const generalList = patients.filter(p => !isSeniorCitizen(p));
    const currentDate = new Date().toLocaleDateString("hi-IN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      alert("⚠️ कृपया ब्राउज़र में पॉपअप अनुमति दें ताकि रिपोर्ट खुल सके।");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="hi">
      <head>
        <meta charset="UTF-8" />
        <title>Project Impact & CSR Audit Dossier - Sinux India Foundation</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 25px; color: #1e293b; background: #fff; line-height: 1.5; }
          .header-box { border-bottom: 3px solid #064e3b; padding-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
          .org-title { font-size: 24px; font-weight: 800; color: #064e3b; margin: 0; }
          .mission-title { font-size: 15px; font-weight: 700; color: #ea580c; margin: 3px 0; }
          .org-meta { font-size: 11px; color: #475569; margin: 0; }
          
          .report-banner { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .banner-title { margin: 0 0 5px 0; font-size: 17px; color: #166534; font-weight: 800; }
          
          .kpi-row { display: flex; gap: 15px; margin-bottom: 25px; }
          .kpi-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; text-align: center; background: #f8fafc; }
          .kpi-num { font-size: 24px; font-weight: 800; color: #0f172a; margin: 4px 0; }
          .kpi-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }

          .section-heading { font-size: 15px; font-weight: 800; padding: 8px 12px; border-radius: 6px; margin: 30px 0 12px 0; }
          .senior-heading { background: #f5f3ff; color: #5b21b6; border-left: 5px solid #7c3aed; }
          .general-heading { background: #f0f9ff; color: #0369a1; border-left: 5px solid #0284c7; }
          .photo-heading { background: #fefce8; color: #854d0e; border-left: 5px solid #ca8a04; }

          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
          th { background: #f1f5f9; color: #334155; font-weight: 700; padding: 8px 6px; border: 1px solid #cbd5e1; text-align: left; }
          td { padding: 8px 6px; border: 1px solid #e2e8f0; vertical-align: middle; }
          
          .patient-photo { width: 42px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1; display: block; background: #f1f5f9; }
          
          .gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; page-break-inside: avoid; }
          .gallery-card { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff; }
          .gallery-img { width: 100%; height: 160px; object-fit: cover; display: block; }
          .gallery-info { padding: 8px 10px; }
          .gallery-title { font-size: 12px; font-weight: 700; margin: 0; color: #0f172a; }
          .gallery-desc { font-size: 10px; color: #64748b; margin: 3px 0 0 0; }

          .footer-sign { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .sign-box { width: 220px; text-align: center; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 11px; font-weight: 600; color: #334155; }

          .no-print-bar { position: sticky; top: 0; background: #0f172a; color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 6px; margin-bottom: 20px; }
          .btn-print { background: #16a34a; color: white; border: none; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 13px; }

          @media print {
            .no-print-bar { display: none; }
            body { padding: 0; }
            .section-heading { margin-top: 20px; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>

        <div class="no-print-bar">
          <span>📄 <strong>Sinux India Foundation</strong> • आधिकारिक प्रोजेक्ट ऑडिट रिपोर्ट</span>
          <button class="btn-print" onclick="window.print()">🖨️ PDF सेव करें / प्रिंट निकालें</button>
        </div>

        <div class="header-box">
          <div>
            <h1 class="org-title">SINUX INDIA FOUNDATION</h1>
            <div class="mission-title">JeevSathi Health Mission • Community Outreach & Senior Care</div>
            <p class="org-meta">
              Reg. Office: Lucknow, Uttar Pradesh, India • Email: support@jeevsathi.org<br/>
              Valid for: Corporate CSR Funding, Government Grants (e-Anudaan / AVYAY / IPSrC)
            </p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #475569;">
            <strong>रिपोर्ट आईडी:</strong> SIF-CSR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}<br/>
            <strong>दिनांक:</strong> ${currentDate}<br/>
            <strong>डॉक्युमेंट स्थिति:</strong> Verified & Audited
          </div>
        </div>

        <div class="report-banner">
          <div class="banner-title">COMPREHENSIVE PROJECT PERFORMANCE & IMPACT AUDIT REPORT</div>
          <p style="margin: 0; font-size: 12px; color: #334155;">
            यह दस्तावेज प्रमाणित करता है कि संस्था द्वारा ग्रामीण एवं कस्बाई क्षेत्रों में स्वास्थ्य शिविर, निशुल्क दवा वितरण, प्राथमिक स्वास्थ्य परामर्श और 60+ आयु वर्ग के वरिष्ठ नागरिकों की व्यापक देखभाल का कार्य धरातल पर संचालित किया गया है।
          </p>
        </div>

        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-label">कुल आयोजित कैम्प्स</div>
            <div class="kpi-num" style="color:#059669;">${campsList.length}</div>
            <div class="org-meta">Health Camps</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">कुल पंजीकृत लाभार्थी</div>
            <div class="kpi-num" style="color:#0284c7;">${patients.length}</div>
            <div class="org-meta">Direct Beneficiaries</div>
          </div>
          <div class="kpi-card" style="background:#f5f3ff; border-color:#ddd6fe;">
            <div class="kpi-label" style="color:#6d28d9;">वरिष्ठ नागरिक (60+ आयु)</div>
            <div class="kpi-num" style="color:#7c3aed;">${seniorList.length}</div>
            <div class="org-meta">Senior Citizens Supported</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">संबद्ध पार्टनर अस्पताल</div>
            <div class="kpi-num" style="color:#ea580c;">${hospitalsList.length}</div>
            <div class="org-meta">Network Centers</div>
          </div>
        </div>

        <!-- 1. वरिष्ठ नागरिक अनुभाग -->
        <div class="section-heading senior-heading">
          1. विशेष वरिष्ठ नागरिक स्वास्थ्य एवं देखभाल रजिस्टर (Senior Citizens 60+ Beneficiaries) — [कुल: ${seniorList.length}]
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:45px;">फोटो</th>
              <th>आईडी</th>
              <th>वरिष्ठ नागरिक का नाम</th>
              <th>पिता / पति का नाम</th>
              <th>उम्र</th>
              <th>लिंग</th>
              <th>मोबाइल</th>
              <th>गाँव / मोहल्ला</th>
              <th>ब्लॉक व ज़िला</th>
              <th>पंजीकरण तिथि</th>
            </tr>
          </thead>
          <tbody>
            ${seniorList.map(p => `
              <tr>
                <td>
                  ${p.photo_url ? `<img src="${p.photo_url}" class="patient-photo" alt="Photo" />` : `<div class="patient-photo" style="display:flex;align-items:center;justify-content:center;font-size:16px;">👤</div>`}
                </td>
                <td><strong>#${p.id}</strong></td>
                <td><strong>${p.patient_name || 'N/A'}</strong></td>
                <td>${p.father_husband_name || '-'}</td>
                <td><strong style="color:#7c3aed;">${p.age || '60+'} वर्ष</strong></td>
                <td>${p.gender || '-'}</td>
                <td>${p.mobile || '-'}</td>
                <td>${p.village || '-'}</td>
                <td>${p.block || ''}, ${p.district || ''}</td>
                <td>${p.created_at ? p.created_at.split('T')[0] : '-'}</td>
              </tr>
            `).join('')}
            ${seniorList.length === 0 ? `<tr><td colspan="10" style="text-align:center;padding:15px;">डेटाबेस में कोई 60+ बुजुर्ग रिकॉर्ड उपलब्ध नहीं है।</td></tr>` : ''}
          </tbody>
        </table>

        <!-- 2. सामान्य लाभार्थी अनुभाग -->
        <div class="section-heading general-heading">
          2. सामान्य स्वास्थ्य परीक्षण एवं कार्डधारक लाभार्थी (General Camp Beneficiaries) — [कुल: ${generalList.length}]
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:45px;">फोटो</th>
              <th>आईडी</th>
              <th>लाभार्थी का नाम</th>
              <th>अभिभावक</th>
              <th>उम्र</th>
              <th>लिंग</th>
              <th>मोबाइल</th>
              <th>स्थान (गाँव, ब्लॉक, ज़िला)</th>
              <th>सत्यापन स्थिति</th>
            </tr>
          </thead>
          <tbody>
            ${generalList.slice(0, 50).map(p => `
              <tr>
                <td>
                  ${p.photo_url ? `<img src="${p.photo_url}" class="patient-photo" alt="Photo" />` : `<div class="patient-photo" style="display:flex;align-items:center;justify-content:center;font-size:16px;">👤</div>`}
                </td>
                <td>#${p.id}</td>
                <td><strong>${p.patient_name || 'N/A'}</strong></td>
                <td>${p.father_husband_name || '-'}</td>
                <td>${p.age || '-'} वर्ष</td>
                <td>${p.gender || '-'}</td>
                <td>${p.mobile || '-'}</td>
                <td>${p.village || ''}, ${p.block || ''}</td>
                <td><span style="color:#16a34a; font-weight:700;">${p.admin_status || 'VERIFIED'}</span></td>
              </tr>
            `).join('')}
            ${generalList.length > 50 ? `<tr><td colspan="9" style="text-align:center;color:#64748b;font-weight:bold;">...तथा ${generalList.length - 50} अन्य लाभार्थी डिजिटल डेटाबेस में सुरक्षित हैं।</td></tr>` : ''}
          </tbody>
        </table>

        <!-- 3. फील्ड फोटो साक्ष्य अनुभाग -->
        <div class="section-heading photo-heading">
          3. स्वास्थ्य शिविर एवं फील्ड गतिविधियों के प्रामाणिक छायाचित्र (Ground Reality Evidence)
        </div>
        <div class="gallery-grid">
          ${galleryList.slice(0, 9).map(img => `
            <div class="gallery-card">
              <img src="${img.image_url}" class="gallery-img" alt="${img.title}" />
              <div class="gallery-info">
                <div class="gallery-title">🏕️ ${img.title}</div>
                <div class="gallery-desc">${img.description || 'स्वास्थ्य जांच, परामर्श एवं दवा वितरण का दृश्य।'}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="footer-sign">
          <div class="sign-box">
            प्रोजेक्ट कोऑर्डिनेटर<br/>
            JeevSathi Health Mission
          </div>
          <div class="sign-box">
            अधिकृत हस्ताक्षरकर्ता / ट्रस्टी<br/>
            Sinux India Foundation
          </div>
        </div>

      </body>
      </html>
    `;

    reportWindow.document.open();
    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
  };

  // === PATIENT ACTIONS ===
  const handleApprove = async (id) => {
    if(window.confirm("क्या आप इस कार्ड को Approve करना चाहते हैं?")) {
      await supabase.from("camp_patients").update({ admin_status: "APPROVED", payment_status: "PAID" }).eq("id", id);
      fetchData();
    }
  };
  const handleReject = async (id) => {
    if(window.confirm("क्या आप इस कार्ड को Reject करना चाहते हैं?")) {
      await supabase.from("camp_patients").update({ admin_status: "REJECTED" }).eq("id", id);
      fetchData();
    }
  };
  const handleDelete = async (id) => {
    if(window.confirm("⚠️ चेतावनी: क्या आप सच में इस रिकॉर्ड को हमेशा के लिए डिलीट करना चाहते हैं?")) {
      await supabase.from("camp_patients").delete().eq("id", id);
      fetchData();
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewMember({ ...newMember, photo_url: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dbRole = newMember.role === "Field Officer" ? "FIELD_OFFICER" : "SUPERVISOR";
    const payload = {
      name: newMember.name,
      email: newMember.email,
      mobile: newMember.email, 
      password: newMember.password,
      role: dbRole,
      district: newMember.district,
      block: newMember.block,
      supervisor_name: newMember.supervisor,
      photo_url: newMember.photo_url,
      advance_payment: newMember.advance_payment ? Number(newMember.advance_payment) : 0
    };

    let error = null;

    if (isEditing) {
      const res = await supabase.from("app_users").update(payload).eq("id", newMember.id);
      error = res.error;
    } else {
      const res = await supabase.from("app_users").insert([payload]);
      error = res.error;
    }

    setLoading(false);

    if (error) {
      alert("❌ Error: " + error.message);
    } else {
      alert(`✅ अकाउंट सफलतापूर्वक ${isEditing ? "अपडेट" : "बन"} गया!`);
      setNewMember({ id: null, name: "", email: "", password: "", role: "Field Officer", district: "", block: "", supervisor: "", photo_url: "", advance_payment: "" });
      setIsEditing(false);
      fetchData(); 
    }
  };

  const handleEditUser = (user) => {
    setIsEditing(true);
    setNewMember({
      id: user.id,
      name: user.name,
      email: user.email || user.mobile,
      password: user.password || "",
      role: String(user.role).toUpperCase().includes("SUPER") ? "Supervisor" : "Field Officer",
      district: user.district || "",
      block: user.block || "",
      supervisor: user.supervisor_name || "",
      photo_url: user.photo_url || "",
      advance_payment: user.advance_payment || "" 
    });
    setActiveTab("team"); 
    window.scrollTo(0, 0);
  };

  const handleDeleteUser = async (id) => {
    if(window.confirm("⚠️ चेतावनी: क्या आप इस मेंबर को हमेशा के लिए डिलीट करना चाहते हैं?")) {
      await supabase.from("app_users").delete().eq("id", id);
      fetchData();
    }
  };

  const openIdCard = (user) => {
    setSelectedUserForId(user);
    setShowIdModal(true);
  };

  // === 📸 GALLERY CRUD FUNCTIONS ===
  const handleGalleryPhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("⚠️ कृपया 3MB से कम साइज की फ़ोटो चुनें!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setGalleryForm(prev => ({ ...prev, image_url: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSaveGallery = async (e) => {
    e.preventDefault();
    if (!galleryForm.image_url) {
      alert("कृपया एक फ़ोटो चुनें!");
      return;
    }

    setGalleryLoading(true);
    const payload = {
      title: galleryForm.title.trim() || "Health Camp",
      description: galleryForm.description.trim() || "",
      image_url: galleryForm.image_url
    };

    let error = null;
    if (isEditingGallery) {
      const res = await supabase.from("camp_gallery").update(payload).eq("id", galleryForm.id);
      error = res.error;
    } else {
      const res = await supabase.from("camp_gallery").insert([payload]);
      error = res.error;
    }

    setGalleryLoading(false);
    if (error) {
      alert("❌ गैलरी सेव त्रुटि: " + error.message);
    } else {
      alert(`🎉 फ़ोटो सफलतापूर्वक ${isEditingGallery ? "अपडेट" : "अपलोड"} हो गई!`);
      setGalleryForm({ id: null, title: "", description: "", image_url: "" });
      setIsEditingGallery(false);
      fetchData();
    }
  };

  const handleEditGallery = (img) => {
    setIsEditingGallery(true);
    setGalleryForm({
      id: img.id,
      title: img.title || "",
      description: img.description || "",
      image_url: img.image_url || ""
    });
    window.scrollTo(0, 0);
  };

  const handleDeleteGallery = async (id) => {
    if (window.confirm("⚠️ क्या आप सच में इस फ़ोटो को हमेशा के लिए हटाना चाहते हैं?")) {
      await supabase.from("camp_gallery").delete().eq("id", id);
      fetchData();
    }
  };

  // === DERIVED COUNTS ===
  const totalCards = patients.length;
  const approvedCards = patients.filter(p => String(p.admin_status).toUpperCase() === "APPROVED").length;
  const allOnlinePaidPatients = patients.filter(isOnlinePaid);
  const totalSeniorCitizens = patients.filter(isSeniorCitizen).length;

  const pendingApprovals = patients.filter(p => 
    String(p.admin_status).toUpperCase() !== "APPROVED" && 
    String(p.admin_status).toUpperCase() !== "REJECTED" &&
    p.payment_mode === "PAY_TO_FO"
  );

  const directOnlinePatients = patients.filter(isDirectPatient);
  const foCreatedPatients = patients.filter(p => !isDirectPatient(p));

  const directPaidCount = directOnlinePatients.filter(isOnlinePaid).length;
  const foPaidCount = foCreatedPatients.filter(p => p.payment_status === "PAID").length;

  const activeSupervisors = usersList.filter(u => String(u.role).toUpperCase().includes("SUPER")).length;
  const activeFOs = usersList.filter(u => String(u.role).toUpperCase().includes("FIELD")).length;

  // 1️⃣ ANALYTICS TAB
  const renderAnalytics = () => {
    const filteredByLocation = patients.filter(p => {
      if (filterDistrict !== "All" && p.district !== filterDistrict) return false;
      if (filterBlock !== "All" && p.block !== filterBlock) return false;
      return true;
    });

    const onlineInFilter = filteredByLocation.filter(isOnlinePaid);

    return (
      <div style={styles.tabContent}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px", flexWrap:"wrap", gap:"10px"}}>
          <h3 style={{...styles.sectionTitle, margin: 0}}>📊 Smart Data Analytics & KPI Overview</h3>
          <button 
            onClick={generateOfficialImpactReport} 
            style={{
              background: "linear-gradient(90deg, #059669, #047857)", 
              color: "white", 
              border: "none", 
              padding: "10px 18px", 
              borderRadius: "8px", 
              fontWeight: "bold", 
              cursor: "pointer", 
              boxShadow: "0 4px 10px rgba(5, 150, 105, 0.25)"
            }}
          >
            🏆 Generate Official CSR & Grant Dossier (With Photos) →
          </button>
        </div>
        
        {dbError && (
          <div style={{background: "#fee2e2", color: "#991b1b", padding: "15px", borderRadius: "8px", border: "1px solid #fca5a5", marginBottom: "20px", fontWeight: "bold"}}>
            ⚠️ डेटाबेस एरर: {dbError}
          </div>
        )}

        <div style={{...styles.statsGrid, marginBottom: "25px"}}>
          <div style={{...styles.statCard, borderLeft: "5px solid #2563eb", background: "#f0f9ff"}} onClick={() => setActiveTab("online_paid")}>
            <span style={{fontSize: "12px", fontWeight: "bold", color: "#0284c7"}}>💳 ऑनलाइन पेमेंट वाले कुल कार्ड</span>
            <h2 style={{color: "#1d4ed8", margin: "6px 0"}}>{allOnlinePaidPatients.length} Cards</h2>
            <p style={styles.smText}>स्वतः एक्टिवेटेड • <strong>₹{allOnlinePaidPatients.length * 150}</strong> ऑनलाइन रेवेन्यू</p>
          </div>

          <div style={{...styles.statCard, borderLeft: "5px solid #16a34a", background: "#f0fdf4"}} onClick={() => setActiveTab("master")}>
            <span style={{fontSize: "12px", fontWeight: "bold", color: "#16a34a"}}>👮 फील्ड टीम द्वारा बने कार्ड (FO)</span>
            <h2 style={{color: "#15803d", margin: "6px 0"}}>{foCreatedPatients.length} Cards</h2>
            <p style={styles.smText}>फील्ड ऑफिसर्स द्वारा पंजीकृत • <strong>₹{foPaidCount * 150}</strong> कलेक्टेड</p>
          </div>

          <div style={{...styles.statCard, borderLeft: "5px solid #ea580c", background: "#fff7ed"}} onClick={() => setActiveTab("approvals")}>
            <span style={{fontSize: "12px", fontWeight: "bold", color: "#c2410c"}}>⏳ FO नकद सत्यापन पेंडिंग</span>
            <h2 style={{color: "#ea580c", margin: "6px 0"}}>{pendingApprovals.length} Cards</h2>
            <p style={styles.smText}>एडमिन अप्रूवल की प्रतीक्षा में</p>
          </div>

          <div style={{...styles.statCard, borderLeft: "5px solid #7c3aed", background: "#f5f3ff"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <span style={{fontSize: "12px", fontWeight: "bold", color: "#6d28d9"}}>👴 Senior Citizens (60+)</span>
              <button onClick={exportSeniorCitizenReport} style={{background:"#7c3aed", color:"white", border:"none", padding:"4px 8px", borderRadius:"4px", fontSize:"10px", cursor:"pointer", fontWeight:"bold"}}>
                📥 CSV
              </button>
            </div>
            <h2 style={{color: "#5b21b6", margin: "6px 0"}}>{totalSeniorCitizens} लाभार्थी</h2>
            <p style={styles.smText}>AVYAY / IPSrC सरकारी ग्रांट हेतु सत्यापित डेटा</p>
          </div>
        </div>

        <div style={styles.filterBox}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>🔍 फ़िल्टर का प्रकार (Data Type):</label>
            <select style={styles.select} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="online_paid">💳 Online Paid Cards (ऑनलाइन पेमेंट से कितने बने)</option>
              <option value="health_card">🪪 Total Health Cards (सभी कार्ड्स विवरण)</option>
              <option value="team">👥 Team Stats & Performance</option>
              <option value="camp_patient">🏕️ Camp Patients (OPD)</option>
              <option value="hospital">🏥 Hospital Referrals</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>District (ज़िला):</label>
            <select style={styles.select} value={filterDistrict} onChange={(e) => { setFilterDistrict(e.target.value); setFilterBlock("All"); }}>
              <option value="All">All Districts</option>
              {districtsList.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Block (ब्लॉक):</label>
            <select style={styles.select} value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)}>
              <option value="All">All Blocks</option>
              {filterBlocksList.map(b => <option key={b.id || b.name} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.label}>Supervisor / FO:</label>
            <select style={styles.select} value={filterMember} onChange={(e) => setFilterMember(e.target.value)}>
              <option value="All">All Members</option>
              {usersList.map(u => (
                <option key={u.id} value={u.name}>
                  {u.name} ({String(u.role).toUpperCase().includes("SUPER") ? "Supervisor" : "FO"})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{marginTop: "20px"}}>
          {filterType === "online_paid" && (
            <div>
              <div style={styles.statsGrid}>
                <div style={{...styles.statCard, borderTop: "4px solid #2563eb"}}>
                  <h3>💳 Online Paid Cards</h3>
                  <h2 style={{color: "#2563eb"}}>{onlineInFilter.length}</h2>
                  <p style={styles.smText}>इस फ़िल्टर ({filterDistrict} - {filterBlock}) में</p>
                </div>
                <div style={{...styles.statCard, borderTop: "4px solid #16a34a"}}>
                  <h3>💰 Online Revenue (₹)</h3>
                  <h2 style={{color: "#16a34a"}}>₹{onlineInFilter.length * 150}</h2>
                  <p style={styles.smText}>सीधे ऑनलाइन खाते में (100% Paid)</p>
                </div>
                <div style={{...styles.statCard, borderTop: "4px solid #0f172a"}}>
                  <h3>⚡ Instant Activation</h3>
                  <h2 style={{color: "#0f172a"}}>{onlineInFilter.length} / {onlineInFilter.length}</h2>
                  <p style={styles.smText}>बिना एडमिन अप्रूवल स्वतः सक्रिय</p>
                </div>
              </div>

              <div style={{...styles.card, marginTop: "20px"}}>
                <h4 style={{margin: "0 0 12px 0", color: "#1e3a8a", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                  <span>📋 ऑनलाइन पेमेंट से बने कार्ड्स की सूची ({onlineInFilter.length})</span>
                  <span style={styles.badgeSuccess}>₹{onlineInFilter.length * 150} Collected</span>
                </h4>
                <div style={{overflowX: "auto"}}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.trHead}>
                        <th>ID</th><th>मरीज़ का नाम व मोबाइल</th><th>ज़िला / ब्लॉक</th><th>भुगतान मोड</th><th>कार्ड स्थिति</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {onlineInFilter.map(p => (
                        <tr key={p.id} style={styles.trBody}>
                          <td style={styles.td}>#{p.id}</td>
                          <td style={styles.td}>
                            <strong>{p.patient_name}</strong><br/>
                            <span style={styles.smText}>📱 +91 {p.mobile}</span>
                          </td>
                          <td style={styles.td}>{p.village}, {p.block}, {p.district}</td>
                          <td style={styles.td}>
                            <span style={{background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold"}}>
                              💳 ONLINE PAID (₹150)
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.badgeSuccess}>✅ {p.admin_status || "APPROVED"}</span>
                          </td>
                          <td style={styles.td}>
                            <button onClick={() => window.open(`/health-card/${p.id}`, "_blank")} style={styles.btnView}>🪪 Card</button>
                          </td>
                        </tr>
                      ))}
                      {onlineInFilter.length === 0 && (
                        <tr><td colSpan="6" style={{textAlign: "center", padding: "20px", color: "#64748b"}}>इस फ़िल्टर में कोई ऑनलाइन पेमेंट कार्ड नहीं मिला।</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {filterType === "team" && (
            <div style={styles.statsGrid}>
              {filterMember === "All" ? (
                <>
                  <div style={styles.statCard}><h3>👨‍💼 Supervisors</h3><h2>{activeSupervisors} Active</h2><p style={styles.smText}>System Wide</p></div>
                  <div style={styles.statCard}><h3>🪪 Field Officers</h3><h2>{activeFOs} Active</h2><p style={styles.smText}>System Wide</p></div>
                  <div style={styles.fullCard}>
                    <h4>Active Team List ({filterDistrict})</h4>
                    <ul style={{lineHeight: "1.8", maxHeight: "150px", overflowY: "auto"}}>
                      {usersList.map(u => (
                        <li key={u.id}>🟢 <strong>{u.name} ({String(u.role).replace("_"," ")})</strong> - {u.district}, {u.block} <span style={{color:"#ea580c", fontSize:"12px"}}>(Adv: ₹{u.advance_payment || 0})</span></li>
                      ))}
                      {usersList.length === 0 && <li>कोई टीम मेंबर नहीं मिला।</li>}
                    </ul>
                  </div>
                </>
              ) : (
                (() => {
                  const memberCards = patients.filter(p => String(p.fo_name).trim().toLowerCase() === String(filterMember).trim().toLowerCase());
                  const apprvd = memberCards.filter(p => String(p.admin_status).toUpperCase() === "APPROVED").length;
                  return (
                    <>
                      <div style={styles.statCard}>
                        <h3>👤 Staff Name</h3>
                        <h2 style={{color: "#2563eb"}}>{filterMember}</h2>
                        <p style={styles.smText}>Selected Member</p>
                      </div>
                      <div style={styles.statCard}>
                        <h3>💳 Total Cards Created</h3>
                        <h2>{memberCards.length} Cards</h2>
                        <p style={styles.smText}>Total Entries by this user</p>
                      </div>
                      <div style={styles.statCard}>
                        <h3>✅ Approved Cards</h3>
                        <h2 style={{color:"#16a34a"}}>{apprvd} Cards</h2>
                        <p style={styles.smText}>Verified by Admin</p>
                      </div>
                    </>
                  );
                })()
              )}
            </div>
          )}

          {filterType === "health_card" && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}><h3>💳 Total Cards</h3><h2>{totalCards}</h2><p style={styles.smText}>Total applied</p></div>
              <div style={styles.statCard}><h3>💳 Online Paid</h3><h2 style={{color:"#2563eb"}}>{allOnlinePaidPatients.length}</h2><p style={styles.smText}>Auto Approved</p></div>
              <div style={styles.statCard}><h3>💰 Total Received</h3><h2 style={{color:"#16a34a"}}>₹{approvedCards * 150}</h2><p style={styles.smText}>{approvedCards} Cards Approved</p></div>
              <div style={styles.statCard}><h3>⏳ FO Pending</h3><h2 style={{color:"#ea580c"}}>₹{(totalCards - approvedCards) * 150}</h2><p style={styles.smText}>{(totalCards - approvedCards)} Cards Pending</p></div>
            </div>
          )}

          {filterType === "camp_patient" && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}><h3>🏕️ Total Patients</h3><h2>{totalCards}</h2><p style={styles.smText}>Registered in System</p></div>
              <div style={styles.statCard}><h3>✅ Total Camps</h3><h2 style={{color:"#16a34a"}}>{campsList.length}</h2><p style={styles.smText}>Successfully organized</p></div>
              <div style={styles.statCard}><h3>🚑 Referred</h3><h2 style={{color:"#dc2626"}}>{patients.filter(p=>p.is_referred==="Yes").length}</h2><p style={styles.smText}>Need higher center</p></div>
            </div>
          )}

          {filterType === "hospital" && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}><h3>🏥 Registered Hospitals</h3><h2>{hospitalsList.length}</h2><p style={styles.smText}>Partner Hospitals</p></div>
              <div style={styles.statCard}><h3>💸 Referred Patients</h3><h2 style={{color:"#16a34a"}}>{patients.filter(p=>p.is_referred==="Yes").length}</h2><p style={styles.smText}>Sent to hospitals</p></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 2️⃣ DEDICATED ONLINE PAID CARDS TAB
  const renderOnlinePaidCards = () => (
    <div style={styles.tabContent}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px"}}>
        <div>
          <h3 style={{...styles.sectionTitle, margin: 0}}>💳 ऑनलाइन भुगतान से बने कार्ड्स ({allOnlinePaidPatients.length})</h3>
          <p style={{margin: "4px 0 0", fontSize: "13px", color: "#64748b"}}>
            यह वे कार्ड्स हैं जिनका ₹150 पेमेंट ऑनलाइन सफल रहा है और ये <strong>स्वतः सक्रिय (Instant Active)</strong> हो चुके हैं।
          </p>
        </div>
        <span style={{background: "#16a34a", color: "white", padding: "8px 14px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px"}}>
          ₹{allOnlinePaidPatients.length * 150} Total Online Revenue
        </span>
      </div>

      <table style={styles.table}>
        <thead>
          <tr style={styles.trHead}>
            <th>ID</th><th>मरीज़ का नाम</th><th>मोबाइल नंबर</th><th>स्थान (Address)</th><th>पेमेंट स्टेटस</th><th>स्थिति</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {allOnlinePaidPatients.map(p => (
            <tr key={p.id} style={styles.trBody}>
              <td style={styles.td}>#{p.id}</td>
              <td style={styles.td}><strong>{p.patient_name}</strong></td>
              <td style={styles.td}>+91 {p.mobile}</td>
              <td style={styles.td}>{p.village}, {p.block}, {p.district}</td>
              <td style={styles.td}>
                <span style={{background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold"}}>
                  ₹150 PAID (Online)
                </span>
              </td>
              <td style={styles.td}>
                <span style={styles.badgeSuccess}>✅ {p.admin_status || "APPROVED"}</span>
              </td>
              <td style={styles.td}>
                <button onClick={() => window.open(`/health-card/${p.id}`, "_blank")} style={styles.btnView}>🪪 View Card</button>
              </td>
            </tr>
          ))}
          {allOnlinePaidPatients.length === 0 && (
            <tr><td colSpan="7" style={{textAlign: "center", padding: "25px", color: "#64748b"}}>अभी कोई ऑनलाइन पेमेंट कार्ड दर्ज नहीं हुआ है।</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // 3️⃣ DIRECT CARDS TAB
  const renderDirectCards = () => (
    <div style={styles.tabContent}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px"}}>
        <div>
          <h3 style={{...styles.sectionTitle, margin: 0}}>🌐 Direct Public Cards ({directOnlinePatients.length})</h3>
          <p style={{margin: "4px 0 0", fontSize: "13px", color: "#64748b"}}>
            यह वे कार्ड हैं जो बिना किसी फील्ड ऑफिसर के सीधे वेबसाइट से अप्लाई किए गए हैं।
          </p>
        </div>
        <span style={{background: "#2563eb", color: "white", padding: "6px 12px", borderRadius: "8px", fontWeight: "bold", fontSize: "13px"}}>
          ₹{directPaidCount * 150} Direct Revenue
        </span>
      </div>

      <table style={styles.table}>
        <thead>
          <tr style={styles.trHead}>
            <th>ID</th>
            <th>मरीज़ का नाम व मोबाइल</th>
            <th>स्थान (Address)</th>
            <th>भुगतान (Payment)</th>
            <th>कार्ड स्थिति</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {directOnlinePatients.map(p => (
            <tr key={p.id} style={styles.trBody}>
              <td style={styles.td}>#{p.id}</td>
              <td style={styles.td}>
                <strong>{p.patient_name}</strong><br/>
                <span style={styles.smText}>📱 +91 {p.mobile}</span>
              </td>
              <td style={styles.td}>
                {p.village}, {p.block}, {p.district}
              </td>
              <td style={styles.td}>
                <span style={p.payment_status === "PAID" ? styles.badgeSuccess : styles.badgeWarning}>
                  {p.payment_status === "PAID" ? "✅ ₹150 PAID" : "⏳ PENDING"}
                </span>
                <div style={{fontSize: "11px", color: "#64748b", marginTop: "2px"}}>{p.payment_mode || "ONLINE"}</div>
              </td>
              <td style={styles.td}>
                <span style={String(p.admin_status).toUpperCase() === "APPROVED" ? styles.badgeSuccess : styles.badgeWarning}>
                  {p.admin_status || "PENDING"}
                </span>
              </td>
              <td style={styles.td}>
                <button onClick={() => window.open(`/health-card/${p.id}`, "_blank")} style={styles.btnView}>🪪 View Card</button>
                {String(p.admin_status).toUpperCase() !== "APPROVED" && (
                  <button onClick={() => handleApprove(p.id)} style={{...styles.btnApprove, padding: "6px 10px", fontSize: "11px"}}>Approve</button>
                )}
                <button onClick={() => handleDelete(p.id)} style={styles.btnDeleteSm}>🗑️</button>
              </td>
            </tr>
          ))}
          {directOnlinePatients.length === 0 && (
            <tr><td colSpan="6" style={{textAlign: "center", padding: "25px", color: "#64748b"}}>अभी वेबसाइट से कोई डायरेक्ट कार्ड नहीं बना है।</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // 4️⃣ APPROVALS TAB
  const renderApprovals = () => (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>🟠 FO नकद सत्यापन एवं फाइनल अप्रूवल ({pendingApprovals.length} Pending)</h3>
      <p style={{fontSize: "13px", color: "#64748b", margin: "-10px 0 15px 0"}}>
        *ऑनलाइन भुगतान वाले कार्ड स्वतः अप्रूव हो जाते हैं। यहाँ केवल FO नकद वाले कार्ड्स सत्यापन हेतु प्रदर्शित हैं।
      </p>

      <table style={styles.table}>
        <thead>
          <tr style={styles.trHead}><th>Patient Details</th><th>Field Officer (FO)</th><th>Payment Mode</th><th>Action</th></tr>
        </thead>
        <tbody>
          {pendingApprovals.map(p => (
            <tr key={p.id} style={styles.trBody}>
              <td style={styles.td}>
                <strong>{p.patient_name}</strong><br/>
                <span style={styles.smText}>📱 {p.mobile} | ID: #{p.id}</span><br/>
                <span style={styles.smText}>📍 {p.village}, {p.block}</span>
              </td>
              <td style={styles.td}>
                <span style={{background: "#f0fdf4", color: "#166534", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold"}}>
                  👮 FO: {p.fo_name || "Unassigned"}
                </span>
              </td>
              <td style={styles.td}>
                <span style={styles.badgeWarning}>💵 Cash to FO (₹150)</span>
              </td>
              <td style={styles.td}>
                <button onClick={() => handleApprove(p.id)} style={styles.btnApprove}>Approve & Activate</button>
                <button onClick={() => handleReject(p.id)} style={styles.btnRejectIcon}>❌</button>
              </td>
            </tr>
          ))}
          {pendingApprovals.length === 0 && <tr><td colSpan="4" style={{textAlign:"center", padding:"25px", color: "#16a34a", fontWeight: "bold"}}>✅ सभी FO कार्ड्स सत्यापित हो चुके हैं! कोई पेंडिंग अप्रूवल नहीं है।</td></tr>}
        </tbody>
      </table>
    </div>
  );

  // 5️⃣ TEAM MANAGEMENT TAB
  const renderTeam = () => (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>➕ Team Management</h3>
      <div style={{display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px"}}>
        
        <form onSubmit={handleAddMember} style={styles.card}>
          <h4 style={{marginTop: 0, color: "#0f172a", display: "flex", justifyContent: "space-between"}}>
            {isEditing ? "✏️ Edit Member" : "Add New Member"}
            {isEditing && <button type="button" onClick={() => {setIsEditing(false); setNewMember({ id: null, name: "", email: "", password: "", role: "Field Officer", district: "", block: "", supervisor: "", photo_url: "", advance_payment: "" });}} style={{fontSize:"11px", background:"#fee2e2", color:"#991b1b", border:"none", padding:"4px 8px", borderRadius:"4px", cursor:"pointer"}}>Cancel Edit</button>}
          </h4>
          
          <div style={{display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px"}}>
            <div style={{width: "50px", height: "50px", borderRadius: "50%", background: "#f1f5f9", overflow: "hidden", border: "1px solid #cbd5e1"}}>
              <img src={newMember.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="Preview" style={{width: "100%", height: "100%", objectFit: "cover"}} />
            </div>
            <div>
              <label style={{fontSize: "11px", color: "#64748b", fontWeight: "bold"}}>Upload Photo</label>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{fontSize: "12px", width: "100%"}} />
            </div>
          </div>

          <input type="text" placeholder="Full Name" style={styles.input} value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} required />
          <input type="email" placeholder="Email ID / Username" style={styles.input} value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} required />
          <input type="text" placeholder="Password" style={styles.input} value={newMember.password} onChange={e => setNewMember({...newMember, password: e.target.value})} required />
          
          <label style={{fontSize: "12px", color: "#64748b", fontWeight: "bold", marginTop: "5px"}}>Role (पद):</label>
          <select style={styles.input} value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})}>
            <option value="Field Officer">Field Officer (FO)</option>
            <option value="Supervisor">Supervisor</option>
          </select>

          {newMember.role === "Field Officer" && (
            <>
              <label style={{fontSize: "12px", color: "#64748b", fontWeight: "bold", marginTop: "5px"}}>Assign Supervisor:</label>
              <select style={styles.input} value={newMember.supervisor} onChange={e => setNewMember({...newMember, supervisor: e.target.value})} required>
                <option value="">-- Select Supervisor --</option>
                {usersList.filter(u => String(u.role).toUpperCase().includes("SUPER")).map(sup => (
                   <option key={sup.id} value={sup.name}>{sup.name} ({sup.district})</option>
                ))}
              </select>
            </>
          )}

          <label style={{fontSize: "12px", color: "#64748b", fontWeight: "bold", marginTop: "5px"}}>District (ज़िला):</label>
          <select style={styles.input} value={newMember.district} onChange={e => setNewMember({...newMember, district: e.target.value, block: ""})} required>
            <option value="">-- Select District --</option>
            {districtsList.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
          </select>

          <label style={{fontSize: "12px", color: "#64748b", fontWeight: "bold", marginTop: "5px"}}>Block (ब्लॉक):</label>
          <select style={styles.input} value={newMember.block} onChange={e => setNewMember({...newMember, block: e.target.value})} required>
            <option value="">-- Select Block --</option>
            {blocksList.map(b => <option key={b.id || b.name} value={b.name}>{b.name}</option>)}
          </select>

          <label style={{fontSize: "12px", color: "#ea580c", fontWeight: "bold", marginTop: "5px"}}>Advance Payment (₹):</label>
          <input type="number" placeholder="Enter Advance Amount (Optional)" style={{...styles.input, borderColor: "#fed7aa", background: "#fff7ed"}} value={newMember.advance_payment} onChange={e => setNewMember({...newMember, advance_payment: e.target.value})} />

          <button type="submit" disabled={loading} style={{...styles.btnPrimaryFull, marginTop: "15px", background: isEditing ? "#10b981" : "#2563eb"}}>
             {loading ? "Saving..." : (isEditing ? "💾 Update Account" : "🚀 Create Account")}
          </button>
        </form>

        <div style={styles.card}>
          <h4 style={{marginTop: 0, color: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            👥 Current Team Members
            <span style={styles.badgeSuccess}>{usersList.length} Active</span>
          </h4>
          <div style={{overflowX: "auto"}}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Profile</th>
                  <th style={styles.th}>Role, Loc. & Advance</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id} style={styles.trBody}>
                    <td style={styles.td}>
                      <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                        <img src={u.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="DP" style={{width:"35px", height:"35px", borderRadius:"50%", objectFit:"cover", border:"1px solid #cbd5e1"}}/>
                        <div>
                          <strong>{u.name}</strong><br/><span style={styles.smText}>{u.email || u.mobile}</span>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={String(u.role).toUpperCase().includes("SUPER") ? styles.badgeWarning : {...styles.badgeSuccess, background: "#e0f2fe", color: "#0369a1"}}>
                        {String(u.role).replace("_", " ")}
                      </span>
                      <br/><span style={styles.smText}>{u.district}</span>
                      <div style={{marginTop: "5px", fontSize: "11px", color: "#ea580c", fontWeight: "bold"}}>
                        Advance: ₹{u.advance_payment || 0}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{display: "flex", gap: "5px"}}>
                        <button onClick={() => openIdCard(u)} style={styles.btnIdCard} title="View ID Card">🪪</button>
                        <button onClick={() => handleEditUser(u)} style={styles.btnEditSm} title="Edit User">✏️</button>
                        <button onClick={() => handleDeleteUser(u.id)} style={styles.btnDeleteSm} title="Delete User">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {usersList.length === 0 && <tr><td colSpan="3" style={{textAlign:"center", padding:"20px"}}>No team members found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );

  // 6️⃣ PAYMENTS TAB
  const renderPayments = () => (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>💰 Revenue & Payment Management</h3>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3>💳 Total Approved Revenue</h3>
          <h2 style={{color: "#0f172a"}}>₹{approvedCards * 150}</h2>
          <p style={styles.smText}>कुल {approvedCards} एक्टिव कार्ड्स से</p>
        </div>
        <div style={{...styles.statCard, borderLeft: "4px solid #2563eb"}}>
          <h3 style={{color: "#1d4ed8"}}>🌐 Direct Online Revenue</h3>
          <h2 style={{color: "#2563eb"}}>₹{allOnlinePaidPatients.length * 150}</h2>
          <p style={styles.smText}>सीधे खाते में (Razorpay)</p>
        </div>
        <div style={{...styles.statCard, borderLeft: "4px solid #16a34a"}}>
          <h3 style={{color: "#15803d"}}>💵 FO Cash Collection</h3>
          <h2 style={{color: "#16a34a"}}>₹{(approvedCards - allOnlinePaidPatients.length) * 150}</h2>
          <p style={styles.smText}>फील्ड ऑफिसर्स द्वारा प्राप्त</p>
        </div>
      </div>
    </div>
  );

  // 7️⃣ MASTER DB TAB
  const renderMaster = () => (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>🗂️ Master Database (All Patient Cards)</h3>
      <table style={styles.table}>
        <thead>
          <tr style={styles.trHead}>
            <th>ID</th>
            <th>Name & Mobile</th>
            <th>Location</th>
            <th>Source / Payment</th>
            <th>Payment & Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(p => {
            const isOnline = isOnlinePaid(p);
            return (
              <tr key={p.id} style={styles.trBody}>
                <td style={styles.td}>#{p.id}</td>
                <td style={styles.td}>
                  <strong>{p.patient_name}</strong><br/>
                  <span style={styles.smText}>📱 +91 {p.mobile}</span>
                </td>
                <td style={styles.td}>{p.village}, {p.block}, {p.district}</td>
                <td style={styles.td}>
                  <span style={{background: isOnline ? "#dcfce7" : "#fff7ed", color: isOnline ? "#166534" : "#c2410c", padding: "3px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold"}}>
                    {isOnline ? "💳 Online Paid" : "💵 FO Cash"}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={{
                    background: String(p.admin_status).toUpperCase() === "APPROVED" ? "#dcfce7" : String(p.admin_status).toUpperCase() === "REJECTED" ? "#fee2e2" : "#fef3c7",
                    color: String(p.admin_status).toUpperCase() === "APPROVED" ? "#166534" : String(p.admin_status).toUpperCase() === "REJECTED" ? "#991b1b" : "#92400e",
                    padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold"
                  }}>
                    {p.admin_status || "PENDING"}
                  </span>
                </td>
                <td style={styles.td}>
                  <button onClick={() => window.open(`/health-card/${p.id}`,"_blank")} style={styles.btnView}>👁️ View</button>
                  <button onClick={() => handleDelete(p.id)} style={styles.btnDeleteSm}>🗑️</button>
                </td>
              </tr>
            );
          })}
          {patients.length === 0 && <tr><td colSpan="6" style={{textAlign:"center", padding:"20px"}}>कोई रिकॉर्ड उपलब्ध नहीं है।</td></tr>}
        </tbody>
      </table>
    </div>
  );

  // 8️⃣ 📸 CAMP GALLERY TAB
  const renderGallery = () => (
    <div style={styles.tabContent}>
      <h3 style={styles.sectionTitle}>📸 स्वास्थ्य शिविर गैलरी (Camp Gallery Management)</h3>
      <p style={{fontSize: "13px", color: "#64748b", margin: "-10px 0 15px 0"}}>
        यहाँ से आप नई कैम्प फ़ोटो विवरण सहित अपलोड कर सकते हैं, सुधार (Edit) कर सकते हैं अथवा डिलीट कर सकते हैं।
      </p>

      <div style={{display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "20px"}}>
        <form onSubmit={handleSaveGallery} style={styles.card}>
          <h4 style={{marginTop: 0, color: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            {isEditingGallery ? "✏️ फ़ोटो व विवरण एडिट करें" : "➕ नई कैम्प फ़ोटो जोड़ें"}
            {isEditingGallery && (
              <button 
                type="button" 
                onClick={() => {
                  setIsEditingGallery(false);
                  setGalleryForm({ id: null, title: "", description: "", image_url: "" });
                }} 
                style={{fontSize:"11px", background:"#fee2e2", color:"#991b1b", border:"none", padding:"4px 8px", borderRadius:"4px", cursor:"pointer"}}
              >
                Cancel Edit
              </button>
            )}
          </h4>

          <div style={{display: "flex", flexDirection: "column", gap: "6px"}}>
            <label style={styles.label}>फ़ोटो शीर्षक / कैम्प का नाम *</label>
            <input 
              type="text" 
              placeholder="उदा. लखीमपुर महा स्वास्थ्य शिविर" 
              style={styles.input} 
              value={galleryForm.title} 
              onChange={e => setGalleryForm({...galleryForm, title: e.target.value})} 
              required 
            />
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: "6px"}}>
            <label style={styles.label}>कैम्प का पूरा विवरण (Description) *</label>
            <textarea 
              rows="3" 
              placeholder="उदा. इस कैम्प में 250+ लोगों का निशुल्क चेकअप हुआ, दवा वितरण किया गया..." 
              style={{...styles.input, resize: "vertical"}} 
              value={galleryForm.description} 
              onChange={e => setGalleryForm({...galleryForm, description: e.target.value})} 
              required 
            />
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: "6px"}}>
            <label style={styles.label}>फ़ोटो फ़ाइल चुनें (Max 3MB) *</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleGalleryPhotoSelect} 
              style={{fontSize: "12px", width: "100%"}} 
            />
          </div>

          {galleryForm.image_url && (
            <div style={{textAlign: "center", margin: "10px 0", background: "#0f172a", padding: "10px", borderRadius: "8px"}}>
              <img src={galleryForm.image_url} alt="Preview" style={{maxHeight: "140px", maxWidth: "100%", objectFit: "contain"}} />
            </div>
          )}

          <button 
            type="submit" 
            disabled={galleryLoading} 
            style={{...styles.btnPrimaryFull, marginTop: "10px", background: isEditingGallery ? "#10b981" : "#059669"}}
          >
            {galleryLoading ? "⏳ प्रक्रियाधीन..." : (isEditingGallery ? "💾 विवरण अपडेट करें" : "🚀 फ़ोटो व विवरण अपलोड करें")}
          </button>
        </form>

        <div style={styles.card}>
          <h4 style={{marginTop: 0, color: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            गैलरी में मौजूद फ़ोटोज़ ({galleryList.length})
            <span style={styles.badgeSuccess}>{galleryList.length} Live</span>
          </h4>

          <div style={{overflowX: "auto"}}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Photo</th>
                  <th style={styles.th}>Title & Description</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {galleryList.map(img => (
                  <tr key={img.id} style={styles.trBody}>
                    <td style={styles.td}>
                      <div style={{width: "70px", height: "50px", background: "#0f172a", borderRadius: "6px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center"}}>
                        <img src={img.image_url} alt="Camp" style={{maxWidth: "100%", maxHeight: "100%", objectFit: "contain"}} />
                      </div>
                    </td>
                    <td style={styles.td}>
                      <strong>{img.title}</strong>
                      <p style={{margin: "3px 0 0 0", fontSize: "11px", color: "#64748b", lineHeight: "1.4", maxWidth: "260px"}}>
                        {img.description || "विवरण उपलब्ध नहीं है।"}
                      </p>
                    </td>
                    <td style={styles.td}>
                      <div style={{display: "flex", gap: "5px"}}>
                        <button onClick={() => handleEditGallery(img)} style={styles.btnEditSm} title="Edit Photo & Details">✏️</button>
                        <button onClick={() => handleDeleteGallery(img.id)} style={styles.btnDeleteSm} title="Delete Photo">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {galleryList.length === 0 && (
                  <tr><td colSpan="3" style={{textAlign: "center", padding: "25px", color: "#64748b"}}>अभी कोई फ़ोटो अपलोड नहीं हुई है।</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // 9️⃣ 📁 GOV COMPLIANCE & 8-FOLDERS VAULT
  const renderGovVault = () => {
    const seniorList = patients.filter(isSeniorCitizen);

    const vaultFolders = [
      { id: "01", name: "01 — Registration Documents", desc: "Section 8 License, PAN, 12A/80G, CSR-1, NGO Darpan Unique ID" },
      { id: "02", name: "02 — Senior Citizen Activities", desc: `60+ बुजुर्ग कल्याण कार्यक्रम • वर्तमान सत्यापित लाभार्थी: ${seniorList.length}` },
      { id: "03", name: "03 — Health Camps Summary", desc: `आयोजित कैम्प्स की सूची व फाइल्स • कुल कैम्प: ${campsList.length}` },
      { id: "04", name: "04 — Beneficiary Register", desc: `मरीज़ पंजीकरण डेटाबेस • कुल पंजीकृत: ${patients.length}` },
      { id: "05", name: "05 — Doctors & Staff Roster", desc: `संबद्ध डॉक्टर्स, नर्सिंग स्टाफ व फील्ड ऑफिसर्स उपस्थिति` },
      { id: "06", name: "06 — Medicines & Bills", desc: "दवा खरीद वाउचर, स्टॉक रजिस्टर व वितरण प्रमाण" },
      { id: "07", name: "07 — Photos & Media Evidence", desc: `जियो-टैग्ड कैम्प तस्वीरें (${galleryList.length}) व समाचार कतरन` },
      { id: "08", name: "08 — Annual Reports", desc: "वार्षिक गतिविधि एवं अंकेक्षण (Audit) रिपोर्ट" }
    ];

    return (
      <div style={styles.tabContent}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px", flexWrap:"wrap", gap:"10px"}}>
          <div>
            <h3 style={{...styles.sectionTitle, margin: 0}}>📁 Government Grant & Compliance Vault</h3>
            <p style={{margin: "4px 0 0", fontSize: "13px", color: "#64748b"}}>
              e-Anudaan, AVYAY एवं IPSrC सरकारी योजनाओं हेतु 8-फ़ोल्डर मास्टर डॉक्युमेंटेशन सिस्टम
            </p>
          </div>
          <div style={{display:"flex", gap:"10px"}}>
            <button onClick={exportSeniorCitizenReport} style={{...styles.btnPrimaryFull, width:"auto", background:"#7c3aed"}}>
              📥 Export 60+ CSV
            </button>
            <button onClick={generateOfficialImpactReport} style={{...styles.btnPrimaryFull, width:"auto", background:"#059669"}}>
              🏆 Official Audit Dossier
            </button>
          </div>
        </div>

        <div style={styles.statsGrid}>
          {vaultFolders.map(f => (
            <div key={f.id} style={{...styles.card, borderLeft:"4px solid #7c3aed"}}>
              <h4 style={{margin: "0 0 6px 0", color:"#5b21b6", fontSize:"15px"}}>📂 {f.name}</h4>
              <p style={{margin:0, fontSize:"12px", color:"#64748b", lineHeight:"1.5"}}>{f.desc}</p>
              <div style={{marginTop:"12px", display:"flex", gap:"8px"}}>
                <span style={{background:"#f5f3ff", color:"#6d28d9", padding:"3px 8px", borderRadius:"4px", fontSize:"11px", fontWeight:"bold"}}>
                  Ready for Audit
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h2 style={{margin: 0, fontSize: "22px"}}>🌿 JeevSathi Mission Control</h2>
          <p style={{margin: "4px 0 0 0", fontSize: "13px", color: "#d1fae5"}}>Super Admin Workspace • Sinux India Foundation</p>
        </div>
        <div>
          <button onClick={fetchData} style={styles.btnOutline}>🔄 Refresh</button>
          <button onClick={() => { localStorage.clear(); navigate("/"); }} style={{...styles.btnDanger, marginLeft:"10px"}}>🚪 Logout</button>
        </div>
      </header>

      <div style={styles.navBar}>
        <button style={activeTab === "analytics" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("analytics")}>📊 Analytics</button>
        <button style={activeTab === "online_paid" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("online_paid")}>
          💳 Online Paid Cards ({allOnlinePaidPatients.length})
        </button>
        <button style={activeTab === "direct_cards" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("direct_cards")}>
          🌐 Direct Public Cards ({directOnlinePatients.length})
        </button>
        <button style={activeTab === "approvals" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("approvals")}>
          ✅ FO Approvals {pendingApprovals.length > 0 && <span style={styles.badgeCounter}>{pendingApprovals.length}</span>}
        </button>
        <button style={activeTab === "team" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("team")}>➕ Team Mgmt</button>
        <button style={activeTab === "gallery" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("gallery")}>
          📸 Camp Gallery ({galleryList.length})
        </button>
        <button style={activeTab === "gov_vault" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("gov_vault")}>
          📁 Gov Vault (8-Folders)
        </button>
        <button style={activeTab === "payments" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("payments")}>💰 Payments</button>
        <button style={activeTab === "master" ? styles.navBtnActive : styles.navBtn} onClick={() => setActiveTab("master")}>🗂️ Master DB</button>
      </div>

      <main style={styles.main}>
        {loading ? <p style={{textAlign:"center", marginTop:"50px"}}>⏳ Loading System Data...</p> : (
          <>
            {activeTab === "analytics" && renderAnalytics()}
            {activeTab === "online_paid" && renderOnlinePaidCards()}
            {activeTab === "direct_cards" && renderDirectCards()}
            {activeTab === "approvals" && renderApprovals()}
            {activeTab === "team" && renderTeam()}
            {activeTab === "gallery" && renderGallery()}
            {activeTab === "gov_vault" && renderGovVault()}
            {activeTab === "payments" && renderPayments()}
            {activeTab === "master" && renderMaster()}
          </>
        )}
      </main>

      {/* ID CARD MODAL */}
      {showIdModal && selectedUserForId && (
        <div style={styles.modalOverlay}>
          <div style={styles.idModalContent}>
            <div id="id-card-print-area" style={styles.idCardDesign}>
              <div style={styles.idCardHeader}>
                <h3 style={{margin:0, fontSize: "16px"}}>Sinux India Foundation</h3>
                <p style={{margin:0, fontSize: "10px", color:"#bfdbfe"}}>JeevSathi Health Mission</p>
              </div>
              <div style={{padding: "20px", textAlign: "center"}}>
                <div style={{width:"90px", height:"90px", margin:"0 auto 12px", borderRadius:"50%", border:"3px solid #1e3a8a", overflow:"hidden"}}>
                  <img src={selectedUserForId.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="User" style={{width:"100%", height:"100%", objectFit:"cover"}} />
                </div>
                <h3 style={{margin: "0 0 4px 0", color:"#0f172a"}}>{selectedUserForId.name}</h3>
                <span style={{background: "#e0f2fe", color: "#0369a1", padding: "3px 10px", borderRadius: "15px", fontSize: "11px", fontWeight: "bold"}}>
                  {String(selectedUserForId.role).replace("_", " ")}
                </span>
                <p style={{fontSize: "12px", color: "#475569", marginTop: "8px"}}>
                  📍 {selectedUserForId.district} - {selectedUserForId.block}
                </p>
              </div>
            </div>
            <div style={{display: "flex", gap: "10px", marginTop: "15px"}}>
              <button onClick={() => window.print()} style={{...styles.btnPrimaryFull, flex: 1}}>🖨️ Print</button>
              <button onClick={() => setShowIdModal(false)} style={{...styles.btnRejectIcon, flex: 1}}>❌ Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// 🎨 STYLES
const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f1f5f9", fontFamily: "'Inter', sans-serif" },
  header: { background: "#064e3b", padding: "15px 5%", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" },
  navBar: { background: "white", padding: "0 5%", display: "flex", gap: "5px", borderBottom: "1px solid #cbd5e1", overflowX: "auto" },
  navBtn: { padding: "15px 18px", background: "transparent", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#64748b", borderBottom: "3px solid transparent", whiteSpace: "nowrap" },
  navBtnActive: { padding: "15px 18px", background: "transparent", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "bold", color: "#064e3b", borderBottom: "3px solid #064e3b", whiteSpace: "nowrap" },
  badgeCounter: { background: "#ef4444", color: "white", borderRadius: "10px", padding: "2px 6px", fontSize: "10px", marginLeft: "5px" },

  main: { padding: "20px 5%", maxWidth: "1200px", margin: "0 auto" },
  tabContent: { animation: "fadeIn 0.3s ease-in-out" },
  sectionTitle: { color: "#0f172a", fontSize: "18px", margin: "0 0 16px 0" },
  
  filterBox: { background: "white", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" },
  filterGroup: { display: "flex", flexDirection: "column", gap: "5px", flex: "1 1 200px" },
  label: { fontSize: "11px", fontWeight: "bold", color: "#475569", textTransform: "uppercase" },
  select: { padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", backgroundColor: "#f8fafc" },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "15px" },
  statCard: { background: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer" },
  fullCard: { background: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0", gridColumn: "1 / -1" },
  smText: { fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" },

  card: { background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px", background: "white", borderRadius: "10px", overflow: "hidden", border: "1px solid #e2e8f0" },
  trHead: { background: "#f8fafc", color: "#475569" },
  th: { padding: "12px", borderBottom: "1px solid #e2e8f0", textAlign: "left" },
  trBody: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px", verticalAlign: "middle" },
  
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" },
  btnPrimaryFull: { background: "#2563eb", color: "white", border: "none", padding: "10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  btnApprove: { background: "#10b981", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginRight: "5px", fontSize: "12px" },
  btnRejectIcon: { background: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" },
  btnView: { background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", padding: "5px 10px", borderRadius: "6px", cursor: "pointer", marginRight: "5px", fontSize: "12px" },
  btnDeleteSm: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "5px 8px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  btnEditSm: { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "5px 8px", borderRadius: "6px", cursor: "pointer", marginRight: "5px", fontSize: "12px" },
  btnIdCard: { background: "#e0e7ff", color: "#3730a3", border: "1px solid #c7d2fe", padding: "5px 8px", borderRadius: "6px", cursor: "pointer", marginRight: "5px", fontSize: "12px" },
  btnOutline: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "12px" },
  btnDanger: { background: "#ef4444", border: "none", color: "white", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "12px" },
  
  badgeSuccess: { background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" },
  badgeWarning: { background: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" },

  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  idModalContent: { background: "white", padding: "20px", borderRadius: "12px", width: "280px" },
  idCardDesign: { background: "white", borderRadius: "10px", overflow: "hidden", border: "1px solid #cbd5e1" },
  idCardHeader: { background: "#1e3a8a", padding: "12px", color: "white", textAlign: "center" }
};

export default AdminDashboard;