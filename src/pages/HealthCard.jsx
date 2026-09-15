import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react"; // 👈 QR Code बनाने वाली लाइब्रेरी

import logo from "../assets/jeevsathi/logo.png"; 
import signature from "../assets/jeevsathi/signature.png"; 
import stamp from "../assets/jeevsathi/stamp.png"; 

function HealthCard() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

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
        
      if (!error) setPatient(data);
      setLoading(false);
    };
    fetchPatient();
  }, [finalId]);

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

  // 🔗 असली QR Code का लिंक
  const qrVerificationUrl = `${window.location.origin}/verify/${patient.id}`;

  return (
    <div style={styles.page}>
      
      {/* 🔘 ACTION BUTTONS */}
      <div className="no-print" style={styles.actionHeader}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <div style={{display: "flex", gap: "10px"}}>
          <button style={styles.downloadBtn} onClick={handleDownload} disabled={downloading}>
            {downloading ? "⏳ Downloading..." : "⬇️ Download Image"}
          </button>
          <button style={styles.printBtn} onClick={() => window.print()}>🖨️ Print PVC Card</button>
        </div>
      </div>

      {/* THE ID CARD CONTAINER */}
      <div style={styles.cardContainer} ref={cardRef}>
        
        {/* ==================================
            FRONT SIDE
        ================================== */}
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
                  <span style={{fontSize: "33px", opacity: 0.5}}>👤</span>
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

        {/* ==================================
            BACK SIDE
        ================================== */}
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
              {/* 🚀 यहाँ QR Code का साइज़ बड़ा (55) और लेवल M कर दिया गया है */}
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

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { 
            background: white !important; 
            display: flex; 
            justify-content: center; 
            padding-top: 20px;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
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
  
  actionHeader: { width: "100%", maxWidth: "750px", display: "flex", justifyContent: "space-between", marginBottom: "20px" },
  backBtn: { background: "white", border: "1px solid #ccc", padding: "10px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  printBtn: { background: "#16804d", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  downloadBtn: { background: "#f97316", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  
  cardContainer: { display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center", padding: "10px" },
  
  cardFront: { position: "relative", width: "350px", height: "220px", background: "linear-gradient(135deg, #ffffff 0%, #e8f5ec 100%)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", border: "1px solid #cce4d6", display: "flex", flexDirection: "column", boxSizing: "border-box" },
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

  cardBack: { position: "relative", width: "350px", height: "220px", background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", border: "1px solid #cce4d6", display: "flex", flexDirection: "column", padding: "10px", boxSizing: "border-box" },
  
  backTopRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" },
  
  benefitsBox: { flex: 1 },
  benefitsTitle: { margin: "0 0 3px", fontSize: "10px", fontWeight: "bold", color: "#16804d" },
  benefitsList: { margin: 0, paddingLeft: "0", listStyle: "none", fontSize: "8.5px", color: "#374151", lineHeight: "1.4" },
  
  qrSection: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "5px" },
  
  // 🚀 यहाँ साइज़ 55px कर दिया गया है
  qrCodeBox: { width: "55px", height: "55px", background: "white", border: "1px solid #ccc", borderRadius: "4px", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  
  disclaimerBox: { background: "#fef2f2", border: "1px solid #fecaca", padding: "5px 6px", borderRadius: "6px", marginTop: "8px" },
  disclaimerTitle: { margin: "0 0 2px", fontSize: "9px", fontWeight: "bold", color: "#b91c1c" },
  disclaimerText: { margin: 0, fontSize: "8px", color: "#991b1b", lineHeight: "1.3", textAlign: "justify" },
  
  contactFooter: { borderTop: "1px solid #e5e7eb", paddingTop: "5px", marginTop: "8px", width: "65%" },
  footerText: { fontSize: "8px", color: "#6b7280", lineHeight: "1.4" },
  
  authBox: { position: "absolute", bottom: "8px", right: "12px", display: "flex", flexDirection: "column", alignItems: "center", width: "90px", zIndex: 10 },
  stampImg: { position: "absolute", width: "80px", height: "80px", opacity: 0.25, bottom: "5px", right: "5px", zIndex: 0, objectFit: "contain" }, 
  signImg: { position: "relative", width: "95px", height: "35px", objectFit: "contain", zIndex: 1, marginBottom: "2px" }, 
  authText: { position: "relative", margin: 0, fontSize: "7px", fontWeight: "bold", color: "#173b2a", borderTop: "1px solid #173b2a", width: "100%", textAlign: "center", paddingTop: "2px", zIndex: 1 }
};

export default HealthCard;