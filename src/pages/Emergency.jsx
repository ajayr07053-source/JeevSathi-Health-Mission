import React from "react";
import { useNavigate } from "react-router-dom";

function Emergency() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
          <h1 style={styles.title}>🚑 Emergency Support</h1>
        </div>
      </header>

      <main style={styles.main}>
        
        {/* SOS BANNER */}
        <div style={styles.sosBanner}>
          <h2 style={{margin: "0 0 10px", fontSize: "22px"}}>आपातकालीन स्थिति (SOS)?</h2>
          <p style={{margin: "0 0 15px", fontSize: "14px", opacity: 0.9}}>
            मेडिकल इमरजेंसी होने पर तुरंत नीचे दिए गए टोल-फ्री नंबरों पर कॉल करें।
          </p>
          <a href="tel:108" style={styles.sosButton}>📞 108 - Ambulance (एम्बुलेंस)</a>
        </div>

        {/* HELPLINE NUMBERS */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>☎️ National Health Helplines</h3>
          <div style={styles.grid}>
            <HelplineCard icon="🚑" name="Ambulance" number="108" color="#dc2626" />
            <HelplineCard icon="👮" name="Police" number="112" color="#2563eb" />
            <HelplineCard icon="👩" name="Women Helpline" number="1090" color="#db2777" />
            <HelplineCard icon="🔥" name="Fire Brigade" number="101" color="#ea580c" />
            <HelplineCard icon="👶" name="Child Helpline" number="1098" color="#8b5cf6" />
            <HelplineCard icon="🏥" name="Health Helpline" number="104" color="#16a34a" />
          </div>
        </section>

        {/* GUIDANCE SECTION */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>🏥 Hospital Guidance (JeevSathi)</h3>
          <p style={{fontSize: "13px", color: "#666", lineHeight: "1.6", marginBottom: "15px"}}>
            Sinux India Foundation (JeevSathi Health Mission) डायरेक्ट इमरजेंसी मेडिकल सुविधा नहीं देता है, लेकिन हम सही अस्पताल तक पहुँचने और Health Card के माध्यम से इलाज में मदद करते हैं।
          </p>
          <div style={styles.guidanceBox}>
            <strong>अस्पताल कैसे खोजें?</strong>
            <ul style={{margin: "10px 0 0", paddingLeft: "20px", fontSize: "13px", color: "#4b5563"}}>
              <li style={{marginBottom: "5px"}}>अपने नज़दीकी सरकारी अस्पताल (CHCs/PHCs) में जाएँ।</li>
              <li style={{marginBottom: "5px"}}>गंभीर स्थिति में सीधे ज़िला अस्पताल (District Hospital) जाएँ।</li>
              <li>हम जल्द ही 'Partner Hospitals' की लिस्ट यहाँ जोड़ेंगे जहाँ JeevSathi कार्ड मान्य होगा।</li>
            </ul>
          </div>
        </section>

        {/* FIRST AID TIPS */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>🩹 First Aid Tips (प्राथमिक उपचार)</h3>
          <div style={styles.tipsContainer}>
            <TipBox title="❤️ Heart Attack" desc="मरीज़ को आरामदायक स्थिति में बैठाएं, तंग कपड़े ढीले करें और तुरंत 108 पर कॉल करें।" />
            <TipBox title="🩸 Bleeding (खून बहना)" desc="साफ कपड़े से घाव को ज़ोर से दबा कर रखें ताकि खून का बहाव रुक सके।" />
            <TipBox title="🔥 Burns (जलना)" desc="जले हुए हिस्से पर तुरंत 10-15 मिनट तक ठंडा (बर्फ नहीं) पानी डालें।" />
          </div>
        </section>

      </main>
    </div>
  );
}

// ==========================================
// COMPONENTS
// ==========================================
function HelplineCard({ icon, name, number, color }) {
  return (
    <a href={`tel:${number}`} style={{...styles.helplineCard, borderLeftColor: color}}>
      <div style={{fontSize: "24px"}}>{icon}</div>
      <div>
        <h4 style={{margin: 0, fontSize: "14px", color: "#374151"}}>{name}</h4>
        <strong style={{fontSize: "18px", color: color}}>{number}</strong>
      </div>
    </a>
  );
}

function TipBox({ title, desc }) {
  return (
    <div style={styles.tipBox}>
      <h4 style={{margin: "0 0 5px", color: "#173b2a", fontSize: "14px"}}>{title}</h4>
      <p style={{margin: 0, fontSize: "12px", color: "#6b7280", lineHeight: "1.5"}}>{desc}</p>
    </div>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f9fafb", fontFamily: "Arial, sans-serif", paddingBottom: "40px" },
  header: { background: "#dc2626", padding: "15px 5%", color: "white", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 10px rgba(220,38,38,0.3)" },
  headerContent: { maxWidth: "800px", margin: "0 auto", display: "flex", alignItems: "center", gap: "15px" },
  backBtn: { background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" },
  title: { margin: 0, fontSize: "18px" },
  
  main: { maxWidth: "800px", margin: "20px auto", padding: "0 5%" },
  
  sosBanner: { background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", color: "white", padding: "25px", borderRadius: "12px", textAlign: "center", marginBottom: "30px", boxShadow: "0 10px 20px rgba(220,38,38,0.2)" },
  sosButton: { display: "inline-block", background: "white", color: "#b91c1c", textDecoration: "none", padding: "12px 25px", borderRadius: "30px", fontSize: "20px", fontWeight: "bold", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" },
  
  section: { background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.03)", marginBottom: "20px", border: "1px solid #f3f4f6" },
  sectionTitle: { margin: "0 0 15px", fontSize: "16px", color: "#173b2a", borderBottom: "1px solid #f3f4f6", paddingBottom: "10px" },
  
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px" },
  helplineCard: { display: "flex", alignItems: "center", gap: "15px", padding: "15px", background: "#f9fafb", borderRadius: "8px", textDecoration: "none", border: "1px solid #e5e7eb", borderLeft: "4px solid", transition: "transform 0.2s" },
  
  guidanceBox: { background: "#eff6ff", border: "1px solid #bfdbfe", padding: "15px", borderRadius: "8px" },
  
  tipsContainer: { display: "flex", flexDirection: "column", gap: "10px" },
  tipBox: { background: "#f8faf9", border: "1px solid #e1e9e4", padding: "12px 15px", borderRadius: "8px", borderLeft: "4px solid #16804d" }
};

export default Emergency;