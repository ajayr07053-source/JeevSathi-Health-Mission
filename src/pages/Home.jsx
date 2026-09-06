import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/jeevsathi/logo.png"; 
import { supabase } from "../supabaseClient";

function Home() {
  const navigate = useNavigate();

  // 📸 गैलरी स्टेट्स
  const [galleryImages, setGalleryImages] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFileBase64, setUploadFileBase64] = useState("");
  const [uploading, setUploading] = useState(false);

  // 🔍 फुल-स्क्रीन फ़ोटो प्रिव्यू
  const [selectedImage, setSelectedImage] = useState(null);

  // 🔑 एडमिन/स्टाफ स्टेटस
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // 🤝 ऑनबोर्डिंग मोडल
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerType, setPartnerType] = useState("hospital");
  const [partnerLoading, setPartnerLoading] = useState(false);

  // ❤️ डोनेशन मोडल स्टेट्स
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donateTab, setDonateTab] = useState("online"); // online, bank
  const [donateAmount, setDonateAmount] = useState(250);
  const [donorName, setDonorName] = useState("");
  const [donorMobile, setDonorMobile] = useState("");
  const [donorPan, setDonorPan] = useState("");
  const [donateLoading, setDonateLoading] = useState(false);

  // लोकेशन स्टेट्स
  const [districtsList, setDistrictsList] = useState([]);
  const [blocksList, setBlocksList] = useState([]);

  // फॉर्म डेटा
  const [partnerForm, setPartnerForm] = useState({
    name: "",
    contact_person: "",
    contact_number: "",
    email: "",
    district: "",
    block: "",
    address: "",
    ayushman: "No",
    discount_text: "20% OPD & 10% IPD",
    discount_num: 15,
    extra_details: ""
  });

  const LAKHIMPUR_BLOCKS = [
    "बिजुआ", "पलिया", "गोला", "निघासन", "धौरहरा", "नकहा", 
    "फूलबेहड़", "बांकेगंज", "बेहजम", "मितौली", "मोहम्मदी", 
    "पसगवां", "रमियाबेहड़", "ईसानगर", "लखीमपुर"
  ].map((name, idx) => ({ id: `lkh-${idx + 1}`, name }));

  const defaultImages = [
    { 
      id: "d1", 
      title: "General OPD Checkup", 
      description: "ग्रामीण स्वास्थ्य शिविर में 250+ लोगों की निशुल्क बीपी, शुगर व सामान्य स्वास्थ्य जांच की गई।",
      image_url: "https://images.unsplash.com/photo-1576091160550-2173ff9e5e3c?w=1000&q=80" 
    },
    { 
      id: "d2", 
      title: "Rural Health Camp", 
      description: "गाँव स्तर पर विशेषज्ञ डॉक्टरों द्वारा परामर्श एवं दवा वितरण किया गया।",
      image_url: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=1000&q=80" 
    },
    { 
      id: "d3", 
      title: "Our Medical Team", 
      description: "JeevSathi हेल्थ मिशन की समर्पित डॉक्टरों व नर्सिंग स्टाफ की टीम।",
      image_url: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=1000&q=80" 
    },
    { 
      id: "d4", 
      title: "Free Medicine Distribution", 
      description: "शिविर में चिन्हित जरूरतमंद मरीजों को आवश्यक दवाइयां निशुल्क उपलब्ध कराई गईं।",
      image_url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1000&q=80" 
    }
  ];

  useEffect(() => {
    fetchGallery();
    loadDistricts();

    const adminSession = localStorage.getItem("jeevsathi_staff_user") || localStorage.getItem("jeevsathi_admin_user");
    if (adminSession) {
      setIsAdminLoggedIn(true);
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
        setShowUploadModal(false);
        setShowPartnerModal(false);
        setShowDonateModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchGallery = async () => {
    try {
      const { data, error } = await supabase
        .from("camp_gallery")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) setGalleryImages(data);
      else setGalleryImages(defaultImages);
    } catch {
      setGalleryImages(defaultImages);
    }
  };

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
    setPartnerForm(prev => ({ ...prev, district: distName, block: "" }));
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

  // 🚀 पार्टनर ऑनबोर्डिंग सबमिट
  const handlePartnerSubmit = async (e) => {
    e.preventDefault();
    setPartnerLoading(true);

    try {
      let error = null;

      if (partnerType === "hospital") {
        const payload = {
          name: partnerForm.name.trim(),
          doctor_name: partnerForm.contact_person.trim(),
          contact_number: partnerForm.contact_number.trim(),
          email: partnerForm.email.trim() || null,
          district: partnerForm.district,
          block: partnerForm.block,
          address: partnerForm.address.trim(),
          ayushman: partnerForm.ayushman,
          discount: partnerForm.discount_text.trim(),
          treatments: partnerForm.extra_details.trim()
        };
        const res = await supabase.from("hospitals").insert([payload]);
        error = res.error;
      } else if (partnerType === "lab") {
        const payload = {
          lab_name: partnerForm.name.trim(),
          contact_number: partnerForm.contact_number.trim(),
          district: partnerForm.district,
          block: partnerForm.block,
          address: partnerForm.address.trim(),
          test_discount_percent: Number(partnerForm.discount_num) || 20,
          tests_offered: partnerForm.extra_details.trim() || "सभी ब्लड एवं यूरिन टेस्ट उपलब्ध"
        };
        const res = await supabase.from("diagnostic_centers").insert([payload]);
        error = res.error;
      } else if (partnerType === "medical") {
        const payload = {
          store_name: partnerForm.name.trim(),
          owner_name: partnerForm.contact_person.trim(),
          contact_number: partnerForm.contact_number.trim(),
          district: partnerForm.district,
          block: partnerForm.block,
          address: partnerForm.address.trim(),
          medicine_discount_percent: Number(partnerForm.discount_num) || 10
        };
        const res = await supabase.from("medical_stores").insert([payload]);
        error = res.error;
      } else if (partnerType === "school") {
        const payload = {
          school_name: partnerForm.name.trim(),
          contact_number: partnerForm.contact_number.trim(),
          district: partnerForm.district,
          block: partnerForm.block,
          address: partnerForm.address.trim(),
          jeevsathi_discount_percent: Number(partnerForm.discount_num) || 15
        };
        const res = await supabase.from("schools").insert([payload]);
        error = res.error;
      }

      setPartnerLoading(false);

      if (error) {
        alert("❌ पंजीकरण में त्रुटि: " + error.message);
      } else {
        alert(`🎉 बधाई! ${partnerType.toUpperCase()} सफलतापूर्वक JeevSathi नेटवर्क में पंजीकृत हो गया है।`);
        setShowPartnerModal(false);
        setPartnerForm({
          name: "",
          contact_person: "",
          contact_number: "",
          email: "",
          district: "",
          block: "",
          address: "",
          ayushman: "No",
          discount_text: "20% OPD & 10% IPD",
          discount_num: 15,
          extra_details: ""
        });
      }
    } catch (err) {
      setPartnerLoading(false);
      alert("❌ त्रुटि: " + err.message);
    }
  };

  // ❤️ डोनेशन सबमिशन (Razorpay / Test Gateway)
  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    if (!donateAmount || Number(donateAmount) < 10) {
      alert("कृपया न्यूनतम ₹10 की राशि दर्ज करें!");
      return;
    }
    if (!donorMobile || donorMobile.length !== 10) {
      alert("कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें!");
      return;
    }

    setDonateLoading(true);

    const processDonationRecord = async (paymentId) => {
      try {
        await supabase.from("donations").insert([{
          donor_name: donorName || "Well Wisher",
          donor_mobile: donorMobile,
          donor_pan: donorPan || null,
          amount: Number(donateAmount),
          payment_mode: "ONLINE_RAZORPAY",
          payment_id: paymentId,
          status: "SUCCESS"
        }]);
      } catch (err) {
        console.error("Donation record error:", err);
      }
      setDonateLoading(false);
      alert(`🙏 धन्यवाद ${donorName || "दानदाता"} जी!\n\nJeevSathi Health Mission (Sinux India Foundation) को ₹${donateAmount} का सहयोग देने के लिए आपका हृदय से आभार।`);
      setShowDonateModal(false);
      setDonorName("");
      setDonorMobile("");
      setDonorPan("");
    };

    if (window.Razorpay) {
      const options = {
        key: "rzp_live_TYDkcyqOaSzOq5",
        amount: Number(donateAmount) * 100,
        currency: "INR",
        name: "Sinux India Foundation",
        description: "Donation for Free Health Camps & Medicine",
        image: logo,
        handler: function (response) {
          processDonationRecord(response.razorpay_payment_id || "PAY_ONLINE");
        },
        prefill: {
          name: donorName,
          contact: donorMobile
        },
        theme: {
          color: "#065f46"
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        alert("भुगतान विफल रहा: " + response.error.description);
        setDonateLoading(false);
      });
      rzp.open();
    } else {
      if (window.confirm(`🧪 टेस्ट मोड: क्या आप ₹${donateAmount} का दान कन्फर्म करना चाहते हैं?`)) {
        processDonationRecord("TEST_DONATION_" + Date.now());
      } else {
        setDonateLoading(false);
      }
    }
  };

  // 📸 गैलरी अपलोड
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("⚠️ कृपया 3MB से कम साइज की फ़ोटो चुनें!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setUploadFileBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFileBase64) {
      alert("कृपया एक फ़ोटो चुनें!");
      return;
    }
    setUploading(true);
    try {
      const payload = {
        title: uploadTitle.trim() || "Health Camp Checkup",
        description: uploadDescription.trim() || "JeevSathi Health Mission Camp",
        image_url: uploadFileBase64
      };
      const { error } = await supabase.from("camp_gallery").insert([payload]);
      if (error) alert("अपलोड में त्रुटि: " + error.message);
      else {
        alert("🎉 फ़ोटो और विवरण सफलतापूर्वक गैलरी में सेव हो गए!");
        setUploadTitle("");
        setUploadDescription("");
        setUploadFileBase64("");
        setShowUploadModal(false);
        fetchGallery();
      }
    } catch (err) {
      alert("त्रुटि: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const openPartnerModalWithType = (type) => {
    setPartnerType(type);
    setShowPartnerModal(true);
  };

  return (
    <div style={styles.page}>
      
      {/* 🔴 TOP HELPLINE BAR */}
      <div style={styles.topBar}>
        <div style={styles.topBarContent}>
          <span>📞 Medical Helpline: +91 7518338831 (24x7)</span>
          <span>✉️ support@jeevsathi.org</span>
        </div>
      </div>

      {/* 🟢 NAVBAR (WITH DONATE BUTTON) */}
      <nav style={styles.navbar}>
        <div style={styles.navBrand}>
          <div style={styles.logoBox}>
            <img 
              src={logo} 
              alt="JeevSathi Logo" 
              style={styles.logo} 
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            />
            <span style={{ display: 'none', fontSize: '24px' }}>🌿</span>
          </div>
          <div>
            <h1 style={styles.brandTitle}>JeevSathi Health Mission</h1>
            <p style={styles.brandSub}>By Sinux India Foundation</p>
          </div>
        </div>

        <div style={styles.navLinks}>
          <Link to="/" style={styles.activeLink}>Home</Link>
          <a href="#services" style={styles.link}>Services</a>
          <a href="#donation" style={styles.link}>Donate</a>
          <a href="#gallery" style={styles.link}>Camp Gallery</a>

          <button onClick={() => navigate("/my-health")} style={styles.patientNavBtn}>
            👤 Patient Login
          </button>
          
          <button onClick={() => navigate("/partner-hospitals")} style={styles.hospitalNavBtn}>
            🏥 Partner Hospitals
          </button>

          <button onClick={() => { setPartnerType("hospital"); setShowPartnerModal(true); }} style={styles.addHospitalNavBtn}>
            🤝 Onboarding
          </button>

          {/* ❤️ NAV DONATE BUTTON */}
          <button onClick={() => setShowDonateModal(true)} style={styles.donateNavBtn}>
            ❤️ सहयोग / Donate
          </button>

          <button onClick={() => navigate("/emergency")} style={styles.emergencyNavBtn}>
            🚑 Emergency SOS
          </button>

          <button onClick={() => navigate("/login")} style={styles.loginBtn}>
            🔒 Team Login
          </button>
        </div>
      </nav>

      {/* 📰 NEWS TICKER */}
      <div style={styles.newsTicker}>
        <div style={styles.newsLabel}>LATEST UPDATES</div>
        <div style={styles.marqueeContainer}>
          <marquee scrollamount="5" style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a8a", padding: "5px 0" }}>
            🚀 आगामी महा स्वास्थ्य शिविर में बीपी, शुगर व सामान्य जांच बिल्कुल मुफ्त। • 🏥 50+ नए अस्पतालों व पैथोलॉजी केंद्रों में JeevSathi कार्डधारकों को विशेष छूट। • 🪪 अपना JeevSathi Health Card मात्र ₹150 में बनवाएं। • ❤️ ग्रामीण क्षेत्रों में निशुल्क दवा और शिविरों के लिए सहयोग (Donate) करें।
          </marquee>
        </div>
      </div>

      {/* 🏆 HERO SECTION */}
      <header style={styles.hero}>
        <div style={styles.heroOverlay}>
          <div style={styles.heroContent}>
            <span style={styles.heroTag}>स्वास्थ्य ही असली धन है</span>
            <h2 style={styles.heroTitle}>
              सबके लिए सुलभ और <br />
              <span style={{ color: "#fbd38d" }}>सुरक्षित स्वास्थ्य</span> सेवाएँ
            </h2>
            <p style={styles.heroText}>
              JeevSathi Health Mission का उद्देश्य ग्रामीण और शहरी क्षेत्रों में मुफ्त स्वास्थ्य शिविर लगाना और 
              मात्र ₹150 में JeevSathi Health Card के माध्यम से अस्पतालों, दवा दुकानों और जांच केंद्रों में भारी छूट प्रदान करना है।
            </p>

            <div style={styles.heroButtons}>
              <button style={styles.primaryBtn} onClick={() => navigate("/patient-registration")}>
                💳 Health Card बनवाएं (मात्र ₹150)
              </button>
              <button style={styles.secondaryBtn} onClick={() => navigate("/my-health")}>
                👤 अपना कार्ड व स्टेटस देखें →
              </button>
              <button style={styles.donateHeroBtn} onClick={() => setShowDonateModal(true)}>
                ❤️ मिशन में सहयोग करें (Donate)
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 📊 STATS SECTION */}
      <section style={styles.statsSection}>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>100+</h3>
          <p style={styles.statText}>Health Camps</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>10,000+</h3>
          <p style={styles.statText}>Health Cards Issued</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>50+</h3>
          <p style={styles.statText}>Partner Hospitals</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>24/7</h3>
          <p style={styles.statText}>Health Guidance</p>
        </div>
      </section>

      {/* =========================================================================
          ❤️ SPECIAL DONATION / SEVA SECTION (सहयोग एवं दान अनुभाग)
      ========================================================================= */}
      <section id="donation" style={styles.donationSection}>
        <div style={styles.donationContainer}>
          <div style={styles.donationTextWrap}>
            <span style={styles.donationTag}>मानव सेवा ही ईश्वर सेवा है</span>
            <h2 style={styles.donationHeading}>स्वास्थ्य सेवा में आपका एक छोटा सहयोग, किसी का जीवन बदल सकता है</h2>
            <p style={styles.donationDesc}>
              Sinux India Foundation द्वारा संचालित <strong>JeevSathi Health Mission</strong> के अंतर्गत 
              दूरदराज के ग्रामीण इलाकों में निशुल्क चिकित्सा शिविर, दवा वितरण और गरीब परिवारों को इलाज में 
              मदद पहुंचाई जाती है। आपका सहयोग सीधे जरूरतमंदों के स्वास्थ्य लाभ में उपयोग होता है।
            </p>
            <div style={styles.donationHighlights}>
              <span>✓ 100% पारदर्शी और प्रमाणित कार्य</span>
              <span>✓ निशुल्क दवा एवं जांच शिविर</span>
              <span>✓ 80G आयकर छूट रसीद उपलब्ध</span>
            </div>
          </div>

          <div style={styles.donationActionBox}>
            <h3 style={{ margin: "0 0 10px 0", color: "#0f172a", fontSize: "18px" }}>सहयोग राशि चुनें (Select Amount)</h3>
            <p style={{ margin: "0 0 15px 0", fontSize: "12px", color: "#64748b" }}>किसी भी राशि से स्वास्थ्य मिशन का हिस्सा बनें</p>

            <div style={styles.amountSelectorGrid}>
              {[100, 250, 500, 1100, 2100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => { setDonateAmount(amt); setShowDonateModal(true); }}
                  style={donateAmount === amt ? styles.amountBtnActive : styles.amountBtn}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowDonateModal(true)} 
              style={styles.btnPrimaryDonate}
            >
              ❤️ अभी दान करें (Donate Now) →
            </button>
            <span style={{ display: "block", textAlign: "center", fontSize: "11px", color: "#64748b", marginTop: "10px" }}>
              🔒 UPI, Debit/Credit Card, Net Banking द्वारा 100% सुरक्षित
            </span>
          </div>
        </div>
      </section>

      {/* 🌟 4 ONBOARDING DIRECT ACTION CARDS */}
      <section id="partners" style={styles.partnerSection}>
        <div style={styles.sectionHeader}>
          <span style={{ ...styles.sectionTag, color: "#16a34a" }}>JOIN JEEVSATHI NETWORK</span>
          <h2 style={styles.sectionTitle}>पार्टनर नेटवर्क रजिस्ट्रेशन (Direct Onboarding)</h2>
          <div style={styles.titleUnderline}></div>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "10px" }}>
            अस्पताल, लैब, मेडिकल स्टोर और स्कूल/संस्थान सीधे हमारे मिशन से जुड़कर जनकल्याण में सहयोग करें
          </p>
        </div>

        <div style={styles.partnerGrid}>
          <div style={styles.partnerActionCard}>
            <div style={{ ...styles.partnerIcon, background: "#ecfdf5", color: "#059669" }}>🏥</div>
            <h3 style={styles.partnerCardTitle}>अस्पताल पंजीकरण</h3>
            <p style={styles.partnerCardDesc}>अस्पताल, नर्सिंग होम एवं क्लीनिक को JeevSathi हेल्थ नेटवर्क से जोड़ें।</p>
            <ul style={styles.partnerCardList}>
              <li>✓ ओपीडी व आईपीडी में छूट</li>
              <li>✓ आयुष्मान पैनल स्थिति दर्ज करें</li>
              <li>✓ पोर्टल पर प्राथमिकता सूची</li>
            </ul>
            <button onClick={() => openPartnerModalWithType("hospital")} style={styles.btnPartnerAction}>
              ➕ रजिस्टर हॉस्पिटल (Add Hospital) →
            </button>
          </div>

          <div style={styles.partnerActionCard}>
            <div style={{ ...styles.partnerIcon, background: "#eff6ff", color: "#2563eb" }}>🔬</div>
            <h3 style={styles.partnerCardTitle}>डायग्नोस्टिक / लैब</h3>
            <p style={styles.partnerCardDesc}>पैथोलॉजी लैब, एक्स-रे, अल्ट्रासाउंड एवं जांच केंद्र पंजीकृत करें।</p>
            <ul style={styles.partnerCardList}>
              <li>✓ टेस्ट्स पर 20% तक छूट</li>
              <li>✓ ब्लड, यूरिन व इमेजिंग जांचें</li>
              <li>✓ सीधे मरीज़ रेफरल सेवा</li>
            </ul>
            <button onClick={() => openPartnerModalWithType("lab")} style={{ ...styles.btnPartnerAction, background: "#2563eb" }}>
              ➕ रजिस्टर लैब (Add Diagnostic) →
            </button>
          </div>

          <div style={styles.partnerActionCard}>
            <div style={{ ...styles.partnerIcon, background: "#fff7ed", color: "#ea580c" }}>💊</div>
            <h3 style={styles.partnerCardTitle}>मेडिकल स्टोर</h3>
            <p style={styles.partnerCardDesc}>दवा विक्रेता व फार्मेसी केंद्र को डिस्काउंट नेटवर्क में शामिल करें।</p>
            <ul style={styles.partnerCardList}>
              <li>✓ दवाओं पर 10%-15% डिस्काउंट</li>
              <li>✓ क्षेत्र के मरीज़ों का भरोसा</li>
              <li>✓ अधिक ग्राहक एवं बिक्री</li>
            </ul>
            <button onClick={() => openPartnerModalWithType("medical")} style={{ ...styles.btnPartnerAction, background: "#ea580c" }}>
              ➕ रजिस्टर मेडिकल स्टोर (Add Store) →
            </button>
          </div>

          <div style={styles.partnerActionCard}>
            <div style={{ ...styles.partnerIcon, background: "#fdf4ff", color: "#a855f7" }}>🎓</div>
            <h3 style={styles.partnerCardTitle}>स्कूल / शिक्षण संस्थान</h3>
            <p style={styles.partnerCardDesc}>स्कूल, कॉलेज, कोचिंग व शैक्षणिक संस्थान ऑनबोर्ड करें।</p>
            <ul style={styles.partnerCardList}>
              <li>✓ फीस में 10%-15% रियायत</li>
              <li>✓ छात्रों हेतु निशुल्क स्वास्थ्य जांच</li>
              <li>✓ सामाजिक कल्याण सम्मान</li>
            </ul>
            <button onClick={() => openPartnerModalWithType("school")} style={{ ...styles.btnPartnerAction, background: "#9333ea" }}>
              ➕ रजिस्टर संस्थान (Add Institute) →
            </button>
          </div>
        </div>
      </section>

      {/* 🎁 SERVICES & VALUE PROPOSITION */}
      <section id="services" style={styles.servicesSection}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTag}>EXCLUSIVE BENEFITS</span>
          <h2 style={styles.sectionTitle}>JeevSathi परिवार से जुड़ने के फायदे</h2>
          <div style={styles.titleUnderline}></div>
        </div>

        <div style={styles.servicesGrid}>
          <div style={styles.serviceCard}>
            <div style={styles.badgeCamp}>📍 आगामी शिविर • निशुल्क सेवा</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "15px" }}>
                <div style={{ ...styles.serviceIcon, background: "#ecfdf5", color: "#059669" }}>🏕️</div>
                <div>
                  <h3 style={{ ...styles.serviceTitle, margin: 0, color: "#065f46" }}>Free Health Camps</h3>
                  <span style={{ fontSize: "12px", color: "#059669", fontWeight: "bold" }}>गाँव व शहर स्तर पर शिविर</span>
                </div>
              </div>
              <ul style={styles.serviceBulletList}>
                <li>🩺 <strong>फ्री हेल्थ चेकअप:</strong> बीपी, शुगर, वजन और सामान्य जांच</li>
                <li>👁️ <strong>नेत्र एवं दंत परीक्षण:</strong> विशेषज्ञ डॉक्टरों द्वारा परामर्श</li>
                <li>💊 <strong>दवा वितरण:</strong> आवश्यकतानुसार बेसिक दवाएं निशुल्क</li>
                <li>📑 <strong>ऑन-द-स्पॉट कार्ड:</strong> शिविर में तत्काल पंजीकरण सुविधा</li>
              </ul>
            </div>
            <button style={styles.btnCampAction} onClick={() => navigate("/patient-registration")}>
              📅 शिविर हेतु पंजीकरण करें →
            </button>
          </div>

          <div style={styles.featuredCard}>
            <div style={styles.popularBadge}>🔥 MOST POPULAR • मात्र ₹150</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "15px" }}>
                <div style={{ ...styles.serviceIcon, background: "#ffedd5" }}>💳</div>
                <div>
                  <h3 style={{ ...styles.serviceTitle, margin: 0, color: "#9a3412" }}>JeevSathi Smart Card</h3>
                  <span style={{ fontSize: "12px", color: "#ea580c", fontWeight: "bold" }}>1 Card • अनगिनत फायदे</span>
                </div>
              </div>
              <ul style={styles.benefitList}>
                <li>🏥 <strong>50+ पार्टनर अस्पतालों</strong> में ओपीडी व इलाज पर छूट</li>
                <li>💊 <strong>मेडिकल स्टोर्स</strong> पर दवाओं पर 10% से 20% बचत</li>
                <li>🔬 <strong>पैथोलॉजी व डायग्नोस्टिक्स</strong> पर विशेष रियायती दरें</li>
                <li>📱 <strong>स्मार्ट QR कोड:</strong> डिजिटल वेरिफिकेशन</li>
              </ul>
            </div>
            <div>
              <button style={styles.cardActionBtn} onClick={() => navigate("/patient-registration")}>
                ⚡ तुरंत अपना कार्ड बनाएं (मात्र ₹150) →
              </button>
              <p style={{ fontSize: "11px", color: "#78716c", textAlign: "center", margin: "8px 0 0" }}>
                🔒 2 मिनट में एक्टिवेट • सुरक्षित डिजिटल कार्ड
              </p>
            </div>
          </div>

          <div style={styles.serviceCard}>
            <div style={styles.badgeGuidance}>📞 24x7 हेल्पलाइन सपोर्ट</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "15px" }}>
                <div style={{ ...styles.serviceIcon, background: "#eff6ff", color: "#2563eb" }}>👨‍⚕️</div>
                <div>
                  <h3 style={{ ...styles.serviceTitle, margin: 0, color: "#1e40af" }}>Medical Guidance</h3>
                  <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: "bold" }}>विशेषज्ञ परामर्श व सहायता</span>
                </div>
              </div>
              <ul style={styles.serviceBulletList}>
                <li>🏥 <strong>सही अस्पताल का चयन:</strong> बीमारी के अनुरूप श्रेष्ठ सुविधा</li>
                <li>📋 <strong>योजना सहायता:</strong> सरकारी योजनाओं का मार्गदर्शन</li>
                <li>👨‍⚕️ <strong>डॉक्टर रेफरल:</strong> सही सर्जन व विशेषज्ञ</li>
                <li>🚨 <strong>इमरजेंसी कोऑर्डिनेशन:</strong> आपात स्थिति में त्वरित मदद</li>
              </ul>
            </div>
            <a href="tel:+917518338831" style={styles.btnCallAction}>
              📞 डॉक्टर गाइडेंस हेतु कॉल करें
            </a>
          </div>
        </div>
      </section>

      {/* 📸 CAMP PHOTO GALLERY */}
      <section id="gallery" style={styles.gallerySection}>
        <div style={styles.sectionHeader}>
          <span style={{ ...styles.sectionTag, color: "#059669" }}>MOMENTS OF SERVICE</span>
          <h2 style={styles.sectionTitle}>स्वास्थ्य शिविर (Camp Gallery)</h2>
          <div style={styles.titleUnderline}></div>
          <p style={{ textAlign: "center", color: "#64748b", marginTop: "10px", fontSize: "14px" }}>
            JeevSathi Mission द्वारा आयोजित हाल ही के कैम्प्स की झलकियाँ। (विस्तृत जानकारी के लिए किसी भी फ़ोटो पर क्लिक करें)
          </p>

          {isAdminLoggedIn && (
            <div style={{ marginTop: "15px" }}>
              <button onClick={() => setShowUploadModal(true)} style={styles.btnUploadPhoto}>
                📸 + कैम्प फ़ोटो और विवरण अपलोड करें (Staff Only)
              </button>
            </div>
          )}
        </div>

        <div style={styles.galleryGrid}>
          {galleryImages.map((img) => (
            <div 
              key={img.id} 
              style={styles.galleryCard}
              onClick={() => setSelectedImage(img)}
            >
              <div style={styles.imgWrap}>
                <img src={img.image_url} alt={img.title} style={styles.galleryImg} />
                <span style={styles.zoomHint}>🔍 बड़ा देखें</span>
              </div>

              <div style={styles.cardInfo}>
                <h4 style={styles.imgTitle}>{img.title}</h4>
                <p style={styles.imgDesc}>
                  {img.description || "शिविर के दौरान स्वास्थ्य जांच एवं चिकित्सकीय परामर्श की झलक।"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🔍 LIGHTBOX PHOTO VIEWER */}
      {selectedImage && (
        <div style={styles.lightboxOverlay} onClick={() => setSelectedImage(null)}>
          <div style={styles.lightboxBox} onClick={(e) => e.stopPropagation()}>
            <button 
              style={styles.lightboxCloseBtn} 
              onClick={() => setSelectedImage(null)}
              title="बंद करें (Esc)"
            >
              ✕
            </button>
            
            <div style={styles.lightboxImgContainer}>
              <img src={selectedImage.image_url} alt={selectedImage.title} style={styles.lightboxImg} />
            </div>

            <div style={styles.lightboxDetails}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <h3 style={{ margin: 0, color: "#065f46", fontSize: "20px" }}>
                  🏕️ {selectedImage.title}
                </h3>
                <button onClick={() => setSelectedImage(null)} style={styles.btnDone}>
                  ✕ बंद करें
                </button>
              </div>

              <p style={{ margin: "14px 0 0", color: "#334155", fontSize: "14px", lineHeight: "1.7" }}>
                {selectedImage.description || "इस स्वास्थ्य शिविर में मरीजों का निशुल्क परीक्षण, ब्लड प्रेशर, शुगर जांच एवं आवश्यक परामर्श प्रदान किया गया।"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ❤️ MODAL: DONATE NOW */}
      {showDonateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowDonateModal(false)}>
          <div style={{ ...styles.modalCard, maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <div>
                <h3 style={{ margin: 0, color: "#991b1b", fontSize: "19px" }}>❤️ सहयोग एवं दान (Donation)</h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>Sinux India Foundation • JeevSathi Health Mission</p>
              </div>
              <button onClick={() => setShowDonateModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.modalTabContainer}>
              <button 
                type="button" 
                onClick={() => setDonateTab("online")} 
                style={donateTab === "online" ? styles.modalTabActiveRed : styles.modalTab}
              >
                💳 ऑनलाइन दान (UPI / Card)
              </button>
              <button 
                type="button" 
                onClick={() => setDonateTab("bank")} 
                style={donateTab === "bank" ? styles.modalTabActiveRed : styles.modalTab}
              >
                🏦 सीधे बैंक खाता / QR
              </button>
            </div>

            {donateTab === "online" ? (
              <form onSubmit={handleDonateSubmit}>
                <div style={{ marginBottom: "12px", textAlign: "left" }}>
                  <label style={styles.formLabel}>सहयोग राशि (Amount in ₹) *</label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                    {[100, 250, 500, 1100, 2100].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDonateAmount(amt)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: donateAmount === amt ? "2px solid #dc2626" : "1px solid #cbd5e1",
                          background: donateAmount === amt ? "#fee2e2" : "#f8fafc",
                          color: donateAmount === amt ? "#991b1b" : "#334155",
                          fontWeight: "bold",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    required
                    min="10"
                    placeholder="अन्य राशि दर्ज करें"
                    style={styles.modalInput}
                    value={donateAmount}
                    onChange={e => setDonateAmount(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: "12px", textAlign: "left" }}>
                  <label style={styles.formLabel}>आपका शुभ नाम (Full Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. राहुल वर्मा"
                    style={styles.modalInput}
                    value={donorName}
                    onChange={e => setDonorName(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px", textAlign: "left" }}>
                  <div>
                    <label style={styles.formLabel}>मोबाइल नंबर *</label>
                    <input
                      type="tel"
                      required
                      maxLength="10"
                      placeholder="10 अंक"
                      style={styles.modalInput}
                      value={donorMobile}
                      onChange={e => setDonorMobile(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>पैन नंबर (वैकल्पिक)</label>
                    <input
                      type="text"
                      placeholder="80G रसीद हेतु"
                      style={styles.modalInput}
                      value={donorPan}
                      onChange={e => setDonorPan(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" disabled={donateLoading} style={styles.btnModalDonateSubmit}>
                    {donateLoading ? "प्रक्रियाधीन..." : `❤️ ₹${donateAmount} का सहयोग करें →`}
                  </button>
                  <button type="button" onClick={() => setShowDonateModal(false)} style={styles.btnModalCancel}>
                    रद्द करें
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: "left", padding: "10px 0" }}>
                <div style={{ background: "#fef2f2", border: "1px dashed #fca5a5", padding: "14px", borderRadius: "8px", marginBottom: "15px" }}>
                  <h4 style={{ margin: "0 0 6px 0", color: "#991b1b" }}>🏛️ Sinux India Foundation बैंक विवरण:</h4>
                  <p style={{ margin: "4px 0", fontSize: "13px", color: "#334155" }}><strong>Account Name:</strong> Sinux India Foundation</p>
                  <p style={{ margin: "4px 0", fontSize: "13px", color: "#334155" }}><strong>Bank Name:</strong> State Bank of India (SBI)</p>
                  <p style={{ margin: "4px 0", fontSize: "13px", color: "#334155" }}><strong>Account No:</strong> Contact Office / Scan UPI</p>
                  <p style={{ margin: "4px 0", fontSize: "13px", color: "#334155" }}><strong>UPI ID:</strong> 7518338831@sbi</p>
                </div>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                  *सीधे ट्रांसफर करने के बाद स्क्रीनशॉट हेल्पलाइन नंबर <strong>+91 7518338831</strong> पर भेजें ताकि आपकी रसीद जारी की जा सके।
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📸 MODAL: UPLOAD PHOTO (ADMIN ONLY) */}
      {showUploadModal && isAdminLoggedIn && (
        <div style={styles.modalOverlay} onClick={() => setShowUploadModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: "18px" }}>📸 नई कैम्प फ़ोटो व विवरण अपलोड करें</h3>
              <button onClick={() => setShowUploadModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div style={{ marginBottom: "12px", textAlign: "left" }}>
                <label style={styles.formLabel}>फ़ोटो शीर्षक / कैम्प का नाम *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. बिजुआ महा स्वास्थ्य शिविर"
                  style={styles.modalInput}
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "12px", textAlign: "left" }}>
                <label style={styles.formLabel}>कैम्प का पूरा विवरण (Description) *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="उदा. इस कैम्प में 250+ लोगों का निशुल्क चेकअप हुआ..."
                  style={{ ...styles.modalInput, resize: "vertical" }}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "15px", textAlign: "left" }}>
                <label style={styles.formLabel}>फ़ोटो चुनें (Max 3MB) *</label>
                <input type="file" required accept="image/*" onChange={handleFileChange} style={styles.modalInput} />
              </div>

              {uploadFileBase64 && (
                <div style={{ textAlign: "center", marginBottom: "15px" }}>
                  <img src={uploadFileBase64} alt="Preview" style={{ maxHeight: "140px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" disabled={uploading} style={styles.btnModalSubmit}>
                  {uploading ? "⏳ अपलोड हो रहा है..." : "📤 फ़ोटो व विवरण सेव करें"}
                </button>
                <button type="button" onClick={() => setShowUploadModal(false)} style={styles.btnModalCancel}>
                  रद्द करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🤝 ONBOARDING MODAL */}
      {showPartnerModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPartnerModal(false)}>
          <div style={{ ...styles.modalCard, maxWidth: "580px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: "18px" }}>🤝 पार्टनर ऑनबोर्डिंग</h3>
              <button onClick={() => setShowPartnerModal(false)} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.modalTabContainer}>
              <button type="button" onClick={() => setPartnerType("hospital")} style={partnerType === "hospital" ? styles.modalTabActive : styles.modalTab}>🏥 अस्पताल</button>
              <button type="button" onClick={() => setPartnerType("lab")} style={partnerType === "lab" ? styles.modalTabActive : styles.modalTab}>🔬 लैब</button>
              <button type="button" onClick={() => setPartnerType("medical")} style={partnerType === "medical" ? styles.modalTabActive : styles.modalTab}>💊 मेडिकल</button>
              <button type="button" onClick={() => setPartnerType("school")} style={partnerType === "school" ? styles.modalTabActive : styles.modalTab}>🎓 स्कूल</button>
            </div>

            <form onSubmit={handlePartnerSubmit}>
              <div style={{ marginBottom: "12px", textAlign: "left" }}>
                <label style={styles.formLabel}>संस्थान का नाम *</label>
                <input type="text" required placeholder="संस्थान का नाम" style={styles.modalInput} value={partnerForm.name} onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px", textAlign: "left" }}>
                <div>
                  <label style={styles.formLabel}>संपर्क व्यक्ति</label>
                  <input type="text" placeholder="नाम" style={styles.modalInput} value={partnerForm.contact_person} onChange={e => setPartnerForm({ ...partnerForm, contact_person: e.target.value })} />
                </div>
                <div>
                  <label style={styles.formLabel}>मोबाइल नंबर *</label>
                  <input type="tel" required maxLength="10" placeholder="10 अंक" style={styles.modalInput} value={partnerForm.contact_number} onChange={e => setPartnerForm({ ...partnerForm, contact_number: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px", textAlign: "left" }}>
                <div>
                  <label style={styles.formLabel}>ज़िला *</label>
                  <select required style={styles.modalInput} value={partnerForm.district} onChange={e => handleDistrictChange(e.target.value)}>
                    <option value="">-- ज़िला चुनें --</option>
                    {districtsList.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.formLabel}>ब्लॉक *</label>
                  <select required style={styles.modalInput} value={partnerForm.block} onChange={e => setPartnerForm({ ...partnerForm, block: e.target.value })}>
                    <option value="">-- ब्लॉक चुनें --</option>
                    {blocksList.map(b => <option key={b.id || b.name} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "12px", textAlign: "left" }}>
                <label style={styles.formLabel}>पूरा पता *</label>
                <input type="text" required placeholder="गाँव/शहर, लैंडमार्क" style={styles.modalInput} value={partnerForm.address} onChange={e => setPartnerForm({ ...partnerForm, address: e.target.value })} />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" disabled={partnerLoading} style={styles.btnModalSubmit}>
                  {partnerLoading ? "⏳ पंजीकरण हो रहा है..." : "🤝 पार्टनर नेटवर्क में जोड़ें"}
                </button>
                <button type="button" onClick={() => setShowPartnerModal(false)} style={styles.btnModalCancel}>
                  रद्द करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerBrand}>
            <h3>JeevSathi Health Mission</h3>
            <p>A project by Sinux India Foundation.</p>
          </div>
          <div style={styles.footerLinks}>
            <h4>Quick Links</h4>
            <Link to="/my-health" style={styles.footerLink}>Patient Portal</Link>
            <Link to="/partner-hospitals" style={styles.footerLink}>Partner Directory</Link>
            <span onClick={() => setShowDonateModal(true)} style={{ ...styles.footerLink, color: "#fca5a5", cursor: "pointer", fontWeight: "bold" }}>
              ❤️ Donate / सहयोग करें
            </span>
            <Link to="/login" style={styles.footerLink}>Team Login</Link>
            <Link to="/emergency" style={{ ...styles.footerLink, color: "#fca5a5", fontWeight: "bold" }}>🚑 Emergency SOS</Link>
          </div>
          <div style={styles.footerContact}>
            <h4>Contact Us</h4>
            <p>📍 Lucknow, Uttar Pradesh, India</p>
            <p>📧 support@jeevsathi.org</p>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p>© {new Date().getFullYear()} JeevSathi Health Mission. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// 🎨 COMPLETE STYLES
const styles = {
  page: { fontFamily: "'Inter', Arial, sans-serif", color: "#333", backgroundColor: "#fafcfb", minHeight: "100vh", display: "flex", flexDirection: "column" },

  topBar: { background: "#0f172a", color: "#cbd5e1", fontSize: "12px", padding: "8px 0" },
  topBarContent: { maxWidth: "1200px", margin: "0 auto", padding: "0 5%", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" },

  navbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 5%", backgroundColor: "#ffffff", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 1000, flexWrap: "wrap", gap: "10px" },
  navBrand: { display: "flex", alignItems: "center", gap: "12px" },
  logoBox: { width: "45px", height: "45px", backgroundColor: "#e8f5ec", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logo: { width: "100%", height: "100%", objectFit: "contain" },
  brandTitle: { margin: 0, fontSize: "20px", color: "#16804d", fontWeight: "bold" },
  brandSub: { margin: 0, fontSize: "11px", color: "#6b7280" },
  navLinks: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  link: { textDecoration: "none", color: "#4b5563", fontSize: "13px", fontWeight: "600" },
  activeLink: { textDecoration: "none", color: "#16804d", fontSize: "13px", fontWeight: "700" },
  
  patientNavBtn: { backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", padding: "8px 12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" },
  hospitalNavBtn: { backgroundColor: "#f1f5f9", color: "#0f172a", border: "1px solid #cbd5e1", padding: "8px 12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" },
  addHospitalNavBtn: { backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", padding: "8px 12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" },
  donateNavBtn: { backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "8px 12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" },
  emergencyNavBtn: { backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "8px 12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" },
  loginBtn: { backgroundColor: "#f97316", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" },

  newsTicker: { display: "flex", background: "#e0f2fe", borderBottom: "1px solid #bae6fd" },
  newsLabel: { background: "#0284c7", color: "white", padding: "5px 15px", fontSize: "11px", fontWeight: "bold", whiteSpace: "nowrap", display: "flex", alignItems: "center" },
  marqueeContainer: { flex: 1, display: "flex", alignItems: "center", padding: "0 10px" },

  hero: { background: "url('https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=2000&auto=format&fit=crop') center/cover no-repeat", height: "500px", position: "relative" },
  heroOverlay: { background: "linear-gradient(90deg, rgba(22,128,77,0.95) 0%, rgba(22,128,77,0.7) 100%)", height: "100%", width: "100%", display: "flex", alignItems: "center", padding: "0 5%" },
  heroContent: { maxWidth: "750px", color: "white" },
  heroTag: { backgroundColor: "rgba(255,255,255,0.2)", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  heroTitle: { fontSize: "42px", lineHeight: "1.2", margin: "20px 0", fontWeight: "900" },
  heroText: { fontSize: "16px", lineHeight: "1.6", color: "#d1ebd8", marginBottom: "30px" },
  heroButtons: { display: "flex", gap: "12px", flexWrap: "wrap" },
  primaryBtn: { backgroundColor: "#f97316", color: "#fff", border: "none", padding: "13px 20px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", cursor: "pointer" },
  secondaryBtn: { backgroundColor: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.5)", padding: "13px 20px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", cursor: "pointer" },
  donateHeroBtn: { backgroundColor: "#dc2626", color: "#fff", border: "none", padding: "13px 20px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 10px rgba(220, 38, 38, 0.35)" },

  statsSection: { display: "flex", justifyContent: "center", gap: "20px", padding: "30px 5%", backgroundColor: "#ffffff", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", borderRadius: "15px", width: "85%", margin: "-40px auto 40px", position: "relative", zIndex: 10, flexWrap: "wrap", boxSizing: "border-box" },
  statCard: { textAlign: "center", padding: "10px", flex: "1 1 150px" },
  statNumber: { margin: 0, fontSize: "32px", color: "#16804d", fontWeight: "900" },
  statText: { margin: "5px 0 0", fontSize: "13px", color: "#6b7280", fontWeight: "600" },

  sectionHeader: { textAlign: "center", marginBottom: "30px" },
  sectionTag: { color: "#f97316", fontSize: "12px", fontWeight: "bold", letterSpacing: "1px" },
  sectionTitle: { margin: "10px 0 10px", fontSize: "28px", color: "#173b2a", fontWeight: "bold" },
  titleUnderline: { width: "60px", height: "4px", background: "#ea580c", margin: "0 auto", borderRadius: "2px" },

  // ❤️ Donation Section Styles
  donationSection: { padding: "60px 5%", background: "linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)", borderTop: "1px solid #fecaca", borderBottom: "1px solid #fecaca" },
  donationContainer: { maxWidth: "1150px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", alignItems: "center" },
  donationTextWrap: { textAlign: "left" },
  donationTag: { background: "#fee2e2", color: "#991b1b", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", display: "inline-block", marginBottom: "10px" },
  donationHeading: { fontSize: "28px", color: "#881337", margin: "0 0 14px 0", lineHeight: "1.3" },
  donationDesc: { fontSize: "14px", color: "#475569", lineHeight: "1.7", margin: "0 0 20px 0" },
  donationHighlights: { display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", fontWeight: "600", color: "#166534" },
  donationActionBox: { background: "white", padding: "30px 25px", borderRadius: "16px", border: "1px solid #fecaca", boxShadow: "0 10px 25px rgba(225, 29, 72, 0.08)", textAlign: "left" },
  amountSelectorGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(65px, 1fr))", gap: "8px", marginBottom: "20px" },
  amountBtn: { padding: "10px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#334155", fontWeight: "bold", fontSize: "14px", cursor: "pointer" },
  amountBtnActive: { padding: "10px 8px", borderRadius: "8px", border: "2px solid #dc2626", background: "#fee2e2", color: "#991b1b", fontWeight: "bold", fontSize: "14px", cursor: "pointer" },
  btnPrimaryDonate: { width: "100%", background: "linear-gradient(90deg, #dc2626, #b91c1c)", color: "white", border: "none", padding: "14px", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)" },

  partnerSection: { padding: "60px 5%", backgroundColor: "#f0fdf4", borderTop: "1px solid #bbf7d0", borderBottom: "1px solid #bbf7d0" },
  partnerGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", maxWidth: "1200px", margin: "0 auto" },
  partnerActionCard: { background: "white", padding: "25px 20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  partnerIcon: { width: "50px", height: "50px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "15px" },
  partnerCardTitle: { margin: "0 0 8px 0", fontSize: "18px", color: "#0f172a", fontWeight: "bold" },
  partnerCardDesc: { fontSize: "13px", color: "#64748b", lineHeight: "1.5", margin: "0 0 15px 0" },
  partnerCardList: { listStyle: "none", padding: 0, margin: "0 0 20px 0", fontSize: "12px", color: "#334155", lineHeight: "1.8" },
  btnPartnerAction: { background: "#059669", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", width: "100%", textAlign: "center" },

  servicesSection: { padding: "60px 5%", backgroundColor: "#fafcfb", textAlign: "center", maxWidth: "1200px", margin: "0 auto" },
  servicesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "25px", alignItems: "stretch" },
  serviceCard: { backgroundColor: "#ffffff", padding: "35px 25px 25px", borderRadius: "16px", border: "1px solid #edf2ef", textAlign: "left", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" },
  serviceIcon: { width: "50px", height: "50px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" },
  serviceTitle: { margin: "0 0 5px", fontSize: "18px", fontWeight: "bold" },
  serviceBulletList: { listStyle: "none", padding: 0, margin: "0 0 20px 0", fontSize: "13px", lineHeight: "1.9", color: "#334155" },
  badgeCamp: { position: "absolute", top: "-12px", left: "20px", background: "#059669", color: "white", fontSize: "11px", fontWeight: "bold", padding: "3px 12px", borderRadius: "20px" },
  badgeGuidance: { position: "absolute", top: "-12px", left: "20px", background: "#2563eb", color: "white", fontSize: "11px", fontWeight: "bold", padding: "3px 12px", borderRadius: "20px" },
  btnCampAction: { background: "#059669", color: "white", border: "none", padding: "12px 18px", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", width: "100%", textAlign: "center" },
  btnCallAction: { background: "#2563eb", color: "white", textDecoration: "none", padding: "12px 18px", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", display: "block", width: "100%", boxSizing: "border-box", textAlign: "center" },

  featuredCard: { backgroundColor: "#fffaf5", padding: "35px 25px 25px", borderRadius: "16px", border: "2px solid #ea580c", boxShadow: "0 12px 30px rgba(234, 88, 12, 0.15)", textAlign: "left", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  popularBadge: { position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg, #ea580c, #c2410c)", color: "white", fontSize: "11px", fontWeight: "bold", padding: "4px 14px", borderRadius: "20px", whiteSpace: "nowrap" },
  benefitList: { listStyle: "none", padding: 0, margin: "0 0 20px 0", fontSize: "13px", lineHeight: "1.9", color: "#44403c" },
  cardActionBtn: { background: "#ea580c", color: "white", border: "none", padding: "14px 18px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", cursor: "pointer", width: "100%" },

  gallerySection: { padding: "60px 5%", backgroundColor: "#ffffff" },
  btnUploadPhoto: { background: "#059669", color: "white", border: "none", padding: "11px 22px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", cursor: "pointer", boxShadow: "0 2px 8px rgba(5,150,105,0.25)" },
  galleryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "22px", maxWidth: "1200px", margin: "30px auto 0" },
  galleryCard: { background: "white", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", cursor: "pointer", transition: "transform 0.2s ease" },
  imgWrap: { position: "relative", width: "100%", height: "220px", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" },
  galleryImg: { width: "100%", height: "100%", objectFit: "contain", display: "block" },
  zoomHint: { position: "absolute", bottom: "8px", right: "8px", background: "rgba(15,23,42,0.85)", color: "white", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" },
  cardInfo: { padding: "14px 16px", textAlign: "left" },
  imgTitle: { margin: "0 0 6px 0", fontSize: "16px", color: "#0f172a", fontWeight: "bold" },
  imgDesc: { margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },

  lightboxOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.88)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 3000, padding: "15px" },
  lightboxBox: { background: "white", borderRadius: "14px", maxWidth: "850px", width: "100%", maxHeight: "92vh", overflowY: "auto", position: "relative", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)" },
  lightboxCloseBtn: { position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.7)", color: "white", border: "none", width: "34px", height: "34px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", fontWeight: "bold", zIndex: 10 },
  lightboxImgContainer: { width: "100%", background: "#000", textAlign: "center", maxHeight: "550px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  lightboxImg: { maxWidth: "100%", maxHeight: "550px", objectFit: "contain", display: "block" },
  lightboxDetails: { padding: "20px 24px", textAlign: "left" },
  btnDone: { background: "#059669", color: "white", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" },

  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "15px" },
  modalCard: { background: "white", maxWidth: "460px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "25px", borderRadius: "14px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b", fontWeight: "bold" },
  formLabel: { display: "block", fontSize: "12px", fontWeight: "bold", color: "#334155", marginBottom: "5px" },
  modalInput: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box", outline: "none", backgroundColor: "#fff" },
  btnModalSubmit: { flex: 1, background: "#059669", color: "white", border: "none", padding: "12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" },
  btnModalDonateSubmit: { flex: 1, background: "linear-gradient(90deg, #dc2626, #b91c1c)", color: "white", border: "none", padding: "12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" },
  btnModalCancel: { flex: 1, background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" },
  modalTabContainer: { display: "flex", gap: "6px", marginBottom: "15px", overflowX: "auto", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" },
  modalTab: { padding: "6px 10px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", color: "#475569", whiteSpace: "nowrap" },
  modalTabActive: { padding: "6px 10px", background: "#065f46", border: "1px solid #065f46", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", color: "white", whiteSpace: "nowrap" },
  modalTabActiveRed: { padding: "6px 10px", background: "#dc2626", border: "1px solid #dc2626", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", color: "white", whiteSpace: "nowrap" },

  footer: { backgroundColor: "#173b2a", color: "#d1ebd8", padding: "50px 5% 20px", marginTop: "auto" },
  footerContent: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "40px", maxWidth: "1200px", margin: "0 auto 30px" },
  footerBrand: { maxWidth: "300px" },
  footerLinks: { display: "flex", flexDirection: "column", gap: "10px" },
  footerLink: { color: "#a7d1b8", textDecoration: "none", fontSize: "14px" },
  footerContact: { fontSize: "14px", lineHeight: "1.6" },
  footerBottom: { textAlign: "center", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "12px" }
};

export default Home;