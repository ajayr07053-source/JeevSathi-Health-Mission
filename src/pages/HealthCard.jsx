import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react";

import logo from "../assets/jeevsathi/logo.png"; 
import signature from "../assets/jeevsathi/signature.png"; 
import stamp from "../assets/jeevsathi/stamp.png"; 

// 🪪 अलग से रीयूजेबल सिंगल कार्ड कंपोनेंट (प्रिंट शीट के लिए)
const SingleCardRender = ({ p }) => {
  const qrUrl = `${window.location.origin}/verify/${p.id}`;
  return (
    <div style={styles.cardContainer}>
      {/* FRONT SIDE */}
      <div style={styles.cardFront}>
        <div style={styles.watermark}>
          <img src={logo} alt="watermark" style={styles.watermarkImg} onError={(e) => e.target.style.display = 'none'} />
        </div>
        <div style={styles.cardHeader}>
          <div style={styles.headerLogo}>
            <img src={logo} alt="Logo" style={styles.logoImg} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
            <span style={{ display: 'none', fontSize: '14px' }}>🌿</span>
          </div>
          <div>
            <h2 style={{margin: 0, fontSize: "16px", color: "white", letterSpacing: "0.5px"}}>JEEVSATHI HEALTH MISSION</h2>
            <p style={{margin: 0, fontSize: "8px", color: "#a5d1b9", textTransform: "uppercase"}}>Initiative by Sinux India Foundation</p>
          </div>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.photoColumn}>
            <div style={styles.photoBox}>
              {p.photo_url ? (
                <img src={p.photo_url} alt="Patient" style={styles.patientPhoto} />
              ) : (
                <span style={{fontSize: "35px", opacity: 0.5}}>👤</span>
              )}
            </div>
            <div style={styles.idBadge}>
              {p.health_card_number || `JHM-000${p.id}`}
            </div>
          </div>
          <div style={styles.detailsColumn}>
            <h3 style={styles.patientName}>{p.patient_name}</h3>
            <table style={styles.infoTable}>
              <tbody>
                <tr><td style={styles.label}>S/D/W of:</td><td style={styles.value}>{p.father_husband_name || "-"}</td></tr>
                <tr><td style={styles.label}>DOB/Age:</td><td style={styles.value}>{p.age} Yrs</td></tr>
                <tr><td style={styles.label}>Gender:</td><td style={styles.value}>{p.gender}</td></tr>
                <tr><td style={styles.label}>Mobile:</td><td style={styles.value}>+91 {p.mobile}</td></tr>
                <tr><td style={styles.label}>Address:</td><td style={styles.value}>{p.village}, {p.district}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div style={styles.cardFooterFront}>HEALTH CARD • NON-TRANSFERABLE</div>
      </div>

      {/* BACK SIDE */}
      <div style={styles.cardBack}>
        <div style={styles.backTopRow}>
          <div style={styles.benefitsBox}>
            <p style={styles.benefitsTitle}>🎁 लाभ (Benefits)</p>
            <ul style={styles.benefitsList}>
              <li>🏥 Health Camp में Registration</li>
              <li>👨‍⚕️ Health Guidance & Counselling</li>
              <li>💊 उपलब्धता अनुसार Basic Medicine/Support</li>
              <li>🔳 QR Code से Card Verification</li>
              <li>🤝 Hospital/Health Services की जानकारी</li>
            </ul>
          </div>
          <div style={styles.qrSection}>
            <div style={styles.qrCodeBox}>
              <QRCodeCanvas value={qrUrl} size={55} level={"M"} includeMargin={false} />
            </div>
            <p style={{fontSize: "7px", margin: "2px 0 0", color: "#173b2a", fontWeight: "bold"}}>SCAN TO VERIFY</p>
          </div>
        </div>
        <div style={styles.disclaimerBox}>
          <p style={styles.disclaimerTitle}>⚠️ Disclaimer</p>
          <p style={styles.disclaimerText}>
            ₹150 केवल Health Card Fee है, Treatment/Medicine/Test की फीस नहीं। Health Camp की सेवाएँ उपलब्धता के अनुसार होंगी। यह Card किसी इलाज या Emergency Treatment की गारंटी नहीं देता। Emergency में तुरंत उचित Hospital से संपर्क करें।
          </p>
        </div>
        <div style={styles.contactFooter}>
          <div style={styles.footerText}>
            <strong style={{color: "#b91c1c", fontSize: "9px"}}>Medical Helpline: +91 6390764638</strong><br/>
            <strong>Emergency:</strong> 108 | <strong>Email:</strong> support@jeevsathi.org <br/>
            <strong>HQ:</strong> Lucknow, Uttar Pradesh, India
          </div>
        </div>
        <div style={styles.authBox}>
          <img src={stamp} alt="Stamp" style={styles.stampImg} onError={(e) => e.target.style.display='none'} />
          <img src={signature} alt="Signature" style={styles.signImg} onError={(e) => e.target.style.display='none'} />
          <p style={styles.authText}>Authorised Signatory</p> 
        </div>
      </div>
    </div>
  );
};

function HealthCard() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // 🖨️ 4-Cards Sheet Print State
  const [showMultiModal, setShowMultiModal] = useState(false);
  const [allPatientsList, setAllPatientsList] = useState([]);
  const [selectedForPrint, setSelectedForPrint] = useState([]);
  const [isMultiPrinting, setIsMultiPrinting] = useState(false);

  const finalId = id || searchParams.get("patientId");

  useEffect(() => {
    const fetchPatient = async () => {
      if (!finalId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("camp_patients")
        .select("*")
        .eq("id", finalId)
        .single();
        
      if (!error) {
        setPatient(data);
        setSelectedForPrint([data.id]);
      }
      setLoading(false);
    };
    fetchPatient();
  }, [finalId]);

  const openMultiCardModal = async () => {
    setShowMultiModal(true);
    try {
      const { data } = await supabase
        .from("camp_patients")
        .select("*")
        .neq("payment_status", "FREE_OPD")
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) setAllPatientsList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelectPatient = (pid) => {
    if (selectedForPrint.includes(pid)) {
      setSelectedForPrint(selectedForPrint.filter(x => x !== pid));
    } else {
      if (selectedForPrint.length >= 4) {
        alert("⚠️ आप एक बार में केवल अधिकतम 4 कार्ड्स ही सेलेक्ट कर सकते हैं!");
        return;
      }
      setSelectedForPrint([...selectedForPrint, pid]);
    }
  };

  const handlePrintMultiCards = () => {
    if (selectedForPrint.length === 0) {
      alert("कृपया कम से कम 1 और अधिकतम 4 कार्ड्स सेलेक्ट करें!");
      return;
    }
    setIsMultiPrinting(true);
    setShowMultiModal(false);
    setTimeout(() => {
      window.print();
      setIsMultiPrinting(false);
    }, 500);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    
    try {
      const canvas = await html2canvas(cardRef.current, { 
        scale: 3, 
        useCORS: true,
        backgroundColor: null 
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `JeevSathi_Card_${patient.patient_name || finalId}.png`;
      link.click();
    } catch (error) {
      console.error("Download Error:", error);
      alert("कार्ड डाउनलोड करने में समस्या आई।");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div style={{textAlign: "center", padding: "50px"}}>⏳ Loading Premium Card...</div>;
  if (!patient) return <div style={{textAlign: "center", padding: "50px", color: "red"}}>❌ Card Not Found!</div>;

  const qrVerificationUrl = `${window.location.origin}/verify/${patient.id}`;

  const multiPrintData = allPatientsList.filter(p => selectedForPrint.includes(p.id));
  if (patient && !multiPrintData.find(p => p.id === patient.id) && selectedForPrint.includes(patient.id)) {
    multiPrintData.push(patient);
  }

  return (
    <div style={styles.page}>
      
      {/* 🔘 ACTION BUTTONS */}
      <div className="no-print" style={styles.actionHeader}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <div style={{display: "flex", gap: "10px", flexWrap: "wrap"}}>
          <button style={styles.multiBtn} onClick={openMultiCardModal}>
            📑 4 Cards A4 Print ({selectedForPrint.length}/4)
          </button>
          <button style={styles.downloadBtn} onClick={handleDownload} disabled={downloading}>
            {downloading ? "⏳ Downloading..." : "⬇️ Download Image"}
          </button>
          <button style={styles.printBtn} onClick={() => window.print()}>🖨️ Print PVC Card</button>
        </div>
      </div>

      {/* 1️⃣ SINGLE CARD VIEW */}
      {!isMultiPrinting && (
        <div style={styles.cardContainer} ref={cardRef}>
          {/* FRONT SIDE */}
          <div style={styles.cardFront}>
            <div style={styles.watermark}>
              <img src={logo} alt="watermark" style={styles.watermarkImg} onError={(e) => e.target.style.display = 'none'} />
            </div>
            
            <div style={styles.cardHeader}>
              <div style={styles.headerLogo}>
                <img src={logo} alt="Logo" style={styles.logoImg} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                <span style={{ display: 'none', fontSize: '14px' }}>🌿</span>
              </div>
              <div>
                <h2 style={{margin: 0, fontSize: "16px", color: "white", letterSpacing: "0.5px"}}>JEEVSATHI HEALTH MISSION</h2>
                <p style={{margin: 0, fontSize: "8px", color: "#a5d1b9", textTransform: "uppercase"}}>Initiative by Sinux India Foundation</p>
              </div>
            </div>
            
            <div style={styles.cardBody}>
              <div style={styles.photoColumn}>
                <div style={styles.photoBox}>
                  {patient.photo_url ? (
                    <img src={patient.photo_url} alt="Patient" style={styles.patientPhoto} />
                  ) : (
                    <span style={{fontSize: "35px", opacity: 0.5}}>👤</span>
                  )}
                </div>
                <div style={styles.idBadge}>
                  {patient.health_card_number || `JHM-000${patient.id}`}
                </div>
              </div>
              
              <div style={styles.detailsColumn}>
                <h3 style={styles.patientName}>{patient.patient_name}</h3>
                <table style={styles.infoTable}>
                  <tbody>
                    <tr><td style={styles.label}>S/D/W of:</td><td style={styles.value}>{patient.father_husband_name || "-"}</td></tr>
                    <tr><td style={styles.label}>DOB/Age:</td><td style={styles.value}>{patient.age} Yrs</td></tr>
                    <tr><td style={styles.label}>Gender:</td><td style={styles.value}>{patient.gender}</td></tr>
                    <tr><td style={styles.label}>Mobile:</td><td style={styles.value}>+91 {patient.mobile}</td></tr>
                    <tr><td style={styles.label}>Address:</td><td style={styles.value}>{patient.village}, {patient.district}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div style={styles.cardFooterFront}>
              HEALTH CARD • NON-TRANSFERABLE
            </div>
          </div>

          {/* BACK SIDE */}
          <div style={styles.cardBack}>
            <div style={styles.backTopRow}>
              <div style={styles.benefitsBox}>
                <p style={styles.benefitsTitle}>🎁 लाभ (Benefits)</p>
                <ul style={styles.benefitsList}>
                  <li>🏥 Health Camp में Registration</li>
                  <li>👨‍⚕️ Health Guidance & Counselling</li>
                  <li>💊 उपलब्धता अनुसार Basic Medicine/Support</li>
                  <li>🔳 QR Code से Card Verification</li>
                  <li>🤝 Hospital/Health Services की जानकारी</li>
                </ul>
              </div>

              <div style={styles.qrSection}>
                <div style={styles.qrCodeBox}>
                  <QRCodeCanvas 
                    value={qrVerificationUrl} 
                    size={55} 
                    level={"M"} 
                    includeMargin={false} 
                  />
                </div>
                <p style={{fontSize: "7px", margin: "2px 0 0", color: "#173b2a", fontWeight: "bold"}}>SCAN TO VERIFY</p>
              </div>
            </div>

            <div style={styles.disclaimerBox}>
              <p style={styles.disclaimerTitle}>⚠️ Disclaimer</p>
              <p style={styles.disclaimerText}>
                ₹150 केवल Health Card Fee है, Treatment/Medicine/Test की फीस नहीं। Health Camp की सेवाएँ उपलब्धता के अनुसार होंगी। यह Card किसी इलाज या Emergency Treatment की गारंटी नहीं देता। Emergency में तुरंत उचित Hospital से संपर्क करें।
              </p>
            </div>

            <div style={styles.contactFooter}>
              <div style={styles.footerText}>
                <strong style={{color: "#b91c1c", fontSize: "9px"}}>Medical Helpline: +91 6390764638</strong><br/>
                <strong>Emergency:</strong> 108 | <strong>Email:</strong> support@jeevsathi.org <br/>
                <strong>HQ:</strong> Lucknow, Uttar Pradesh, India
              </div>
            </div>
            
            <div style={styles.authBox}>
              <img src={stamp} alt="Stamp" style={styles.stampImg} onError={(e) => e.target.style.display='none'} />
              <img src={signature} alt="Signature" style={styles.signImg} onError={(e) => e.target.style.display='none'} />
              <p style={styles.authText}>Authorised Signatory</p> 
            </div>
          </div>
        </div>
      )}

      {/* 2️⃣ MULTI-CARD (4 CARDS) PRINT VIEW */}
      {isMultiPrinting && (
        <div style={styles.multiCardGrid}>
          {multiPrintData.slice(0, 4).map((p) => (
            <SingleCardRender key={p.id} p={p} />
          ))}
        </div>
      )}

      {/* 🗂️ MODAL: SELECT UP TO 4 CARDS FOR A4 PRINT */}
      {showMultiModal && (
        <div style={styles.modalOverlay} onClick={() => setShowMultiModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px"}}>
              <h3 style={{margin:0, color:"#16804d", fontSize:"18px"}}>📑 प्रिंट हेतु 4 कार्ड्स चुनें (Select 4 Cards)</h3>
              <button onClick={() => setShowMultiModal(false)} style={{border:"none", background:"none", fontSize:"18px", cursor:"pointer"}}>✕</button>
            </div>

            <p style={{fontSize:"12px", color:"#475569", margin:"0 0 15px"}}>
              एक A4 शीट पर 4 कार्ड्स (Front & Back) एक साथ प्रिंट करने के लिए नीचे दी गई सूची से 4 मरीज सेलेक्ट करें:
            </p>

            <div style={{maxHeight:"350px", overflowY:"auto", border:"1px solid #e2e8f0", borderRadius:"8px", marginBottom:"15px"}}>
              <table style={{width:"100%", borderCollapse:"collapse", fontSize:"12px"}}>
                <thead>
                  <tr style={{background:"#f8fafc", textAlign:"left"}}>
                    <th style={{padding:"8px"}}>Select</th>
                    <th style={{padding:"8px"}}>Card No / ID</th>
                    <th style={{padding:"8px"}}>मरीज का नाम</th>
                    <th style={{padding:"8px"}}>मोबाइल व पता</th>
                  </tr>
                </thead>
                <tbody>
                  {allPatientsList.map(p => {
                    const isChecked = selectedForPrint.includes(p.id);
                    return (
                      <tr key={p.id} style={{borderBottom:"1px solid #f1f5f9", background: isChecked ? "#ecfdf5" : "white"}}>
                        <td style={{padding:"8px", textAlign:"center"}}>
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => toggleSelectPatient(p.id)}
                            style={{cursor:"pointer", width:"16px", height:"16px"}}
                          />
                        </td>
                        <td style={{padding:"8px", fontWeight:"bold"}}>#{p.id}</td>
                        <td style={{padding:"8px", fontWeight:"bold", color:"#0f172a"}}>{p.patient_name}</td>
                        <td style={{padding:"8px", color:"#64748b"}}>+91 {p.mobile} ({p.village || p.block})</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <span style={{fontSize:"13px", fontWeight:"bold", color: selectedForPrint.length === 4 ? "#16a34a" : "#ea580c"}}>
                चयनित: {selectedForPrint.length} / 4 कार्ड्स
              </span>
              <div style={{display:"flex", gap:"10px"}}>
                <button 
                  onClick={() => setShowMultiModal(false)}
                  style={{padding:"8px 14px", border:"1px solid #cbd5e1", borderRadius:"6px", background:"white", cursor:"pointer"}}
                >
                  रद्द करें
                </button>
                <button 
                  onClick={handlePrintMultiCards}
                  style={{padding:"8px 16px", background:"#16804d", color:"white", border:"none", borderRadius:"6px", fontWeight:"bold", cursor:"pointer"}}
                >
                  🖨️ A4 शीट पर 4 कार्ड प्रिंट करें →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { 
            background: white !important; 
            display: flex; 
            justify-content: center; 
            padding-top: 10px;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>
    </div>
  );
}

// ==========================================
// 🎨 PREMIUM CARD STYLES
// ==========================================
const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f3f8f5", padding: "20px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", display: "flex", flexDirection: "column", alignItems: "center" },
  
  actionHeader: { width: "100%", maxWidth: "750px", display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" },
  backBtn: { background: "white", border: "1px solid #ccc", padding: "10px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  printBtn: { background: "#16804d", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  multiBtn: { background: "#0284c7", color: "white", border: "none", padding: "10px 18px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  downloadBtn: { background: "#f97316", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  
  cardContainer: { display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center", padding: "10px" },
  
  multiCardGrid: { display: "flex", flexDirection: "column", gap: "15px", alignItems: "center", width: "100%" },

  cardFront: { position: "relative", width: "350px", height: "220px", background: "linear-gradient(135deg, #ffffff 0%, #e8f5ec 100%)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", border: "1px solid #cce4d6", display: "flex", flexDirection: "column", boxSizing: "border-box", pageBreakInside: "avoid" },
  watermark: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 0, pointerEvents: "none", opacity: 0.05, width: "150px", height: "150px" },
  watermarkImg: { width: "100%", height: "100%", objectFit: "contain" },
  
  cardHeader: { background: "linear-gradient(90deg, #0f2c1f 0%, #173b2a 100%)", padding: "12px 15px", display: "flex", alignItems: "center", gap: "10px", zIndex: 1 },
  headerLogo: { width: "25px", height: "25px", background: "white", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  logoImg: { width: "80%", height: "80%", objectFit: "contain" },
  
  cardBody: { display: "flex", padding: "15px", gap: "15px", flex: 1, zIndex: 1 },
  photoColumn: { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  photoBox: { width: "65px", height: "80px", background: "white", border: "2px solid #16804d", borderRadius: "6px", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", overflow: "hidden" },
  patientPhoto: { width: "100%", height: "100%", objectFit: "cover" }, 
  idBadge: { background: "#f97316", color: "white", fontSize: "9px", fontWeight: "bold", padding: "3px 6px", borderRadius: "4px", width: "100%", textAlign: "center", boxSizing: "border-box" },
  
  detailsColumn: { flex: 1 },
  patientName: { margin: "0 0 8px", color: "#173b2a", fontSize: "16px", textTransform: "uppercase", borderBottom: "2px solid #16804d", paddingBottom: "3px", display: "inline-block" },
  infoTable: { width: "100%", borderCollapse: "collapse", fontSize: "9.5px", color: "#374151" },
  label: { fontWeight: "bold", width: "55px", paddingBottom: "4px", color: "#16804d" },
  value: { paddingBottom: "4px", fontWeight: "600" },
  
  cardFooterFront: { background: "#16804d", color: "white", textAlign: "center", padding: "5px", fontSize: "8px", fontWeight: "bold", letterSpacing: "1px", zIndex: 1 },

  cardBack: { position: "relative", width: "350px", height: "220px", background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", border: "1px solid #cce4d6", display: "flex", flexDirection: "column", padding: "10px", boxSizing: "border-box", pageBreakInside: "avoid" },
  
  backTopRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" },
  
  benefitsBox: { flex: 1 },
  benefitsTitle: { margin: "0 0 3px", fontSize: "10px", fontWeight: "bold", color: "#16804d" },
  benefitsList: { margin: 0, paddingLeft: "0", listStyle: "none", fontSize: "8.5px", color: "#374151", lineHeight: "1.4" },
  
  qrSection: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "5px" },
  qrCodeBox: { width: "55px", height: "55px", background: "white", border: "1px solid #ccc", borderRadius: "4px", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  
  disclaimerBox: { background: "#fef2f2", border: "1px solid #fecaca", padding: "5px 6px", borderRadius: "6px", marginTop: "8px" },
  disclaimerTitle: { margin: "0 0 2px", fontSize: "9px", fontWeight: "bold", color: "#b91c1c" },
  disclaimerText: { margin: 0, fontSize: "8px", color: "#991b1b", lineHeight: "1.3", textAlign: "justify" },
  
  contactFooter: { borderTop: "1px solid #e5e7eb", paddingTop: "5px", marginTop: "8px", width: "65%" },
  footerText: { fontSize: "8px", color: "#6b7280", lineHeight: "1.4" },
  
  authBox: { position: "absolute", bottom: "8px", right: "12px", display: "flex", flexDirection: "column", alignItems: "center", width: "105px", zIndex: 10 },
  // 🚀 मोहर (Stamp) का साइज़ 80px से बढ़ाकर 105px कर दिया गया है
  stampImg: { position: "absolute", width: "105px", height: "105px", opacity: 0.32, bottom: "-2px", right: "0px", zIndex: 0, objectFit: "contain" }, 
  signImg: { position: "relative", width: "95px", height: "35px", objectFit: "contain", zIndex: 1, marginBottom: "2px" }, 
  authText: { position: "relative", margin: 0, fontSize: "7px", fontWeight: "bold", color: "#173b2a", borderTop: "1px solid #173b2a", width: "100%", textAlign: "center", paddingTop: "2px", zIndex: 1 },

  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "15px" },
  modalContent: { background: "white", borderRadius: "12px", width: "100%", maxWidth: "600px", padding: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }
};

export default HealthCard;