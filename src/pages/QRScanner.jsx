import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";

function QRScanner() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    // 📸 Advanced HD Camera Settings
    const scannerConfig = {
      fps: 15,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      videoConstraints: {
        facingMode: "environment", // हमेशा बैक कैमरा खुलेगा
        width: { ideal: 1280, min: 640 }, // HD Quality
        height: { ideal: 720, min: 480 },
        advanced: [{ focusMode: "continuous" }] // Autofocus ऑन
      }
    };

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      scannerConfig,
      false
    );

    const onScanSuccess = (decodedText) => {
      setScanResult(decodedText);
      scanner.clear(); // स्कैन होते ही कैमरा बंद कर दें
      
      let patientId = decodedText;
      if (decodedText.includes('/')) {
        const parts = decodedText.split('/');
        patientId = parts[parts.length - 1];
      }
      
      navigate(`/verify/${patientId}`);
    };

    scanner.render(onScanSuccess, (err) => {
      // स्कैनिंग के दौरान एरर इग्नोर करें
    });

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, [navigate]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <h2 style={{margin: 0, fontSize: "18px"}}>📷 Scan Health Card</h2>
        <div style={{width: "60px"}}></div>
      </header>

      <main style={styles.main}>
        <h3 style={{textAlign: "center", color: "#173b2a"}}>मरीज़ का QR Code स्कैन करें</h3>
        <p style={{textAlign: "center", color: "#666", fontSize: "14px", marginBottom: "20px"}}>
          कैमरे के सामने हेल्थ कार्ड लाएँ। यह अपने आप स्कैन हो जाएगा।
        </p>

        <div style={styles.scannerContainer}>
          {!scanResult ? (
            <div id="qr-reader" style={styles.qrReaderBox}></div>
          ) : (
            <div style={styles.successBox}>
              <span style={{fontSize: "40px"}}>✅</span>
              <h3>Scanned Successfully!</h3>
              <p>Redirecting to patient profile...</p>
            </div>
          )}
        </div>

        {/* 🚀 यह कोड वीडियो को स्ट्रेच (Blur) होने से रोकेगा */}
        <style>{`
          #qr-reader video {
            object-fit: cover !important;
            width: 100% !important;
            border-radius: 8px !important;
          }
          #qr-reader img {
            display: none !important;
          }
        `}</style>
      </main>
    </div>
  );
}

// ==========================================
// 🎨 STYLES
// ==========================================
const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f3f8f5", fontFamily: "Arial, sans-serif" },
  header: { background: "#173b2a", padding: "15px 5%", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" },
  backBtn: { background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  
  main: { padding: "30px 5%", maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" },
  scannerContainer: { width: "100%", background: "white", padding: "15px", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" },
  
  qrReaderBox: { width: "100%", maxWidth: "400px", margin: "0 auto", overflow: "hidden", borderRadius: "8px", border: "2px solid #16804d", display: "flex", justifyContent: "center" },
  
  successBox: { textAlign: "center", color: "#166534", padding: "40px 20px" }
};

export default QRScanner;