import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

function FindHospital() {
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  
  // सर्च और फ़िल्टर स्टेट
  const [searchQuery, setSearchQuery] = useState("");
  const [ayushmanFilter, setAyushmanFilter] = useState("ALL"); // ALL, YES, NO

  // पेज लोड होते ही सारे अस्पताल मँगा लें
  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("hospitals").select("*").order("name");
    
    if (error) {
      console.error("Error fetching hospitals:", error);
    } else {
      setHospitals(data || []);
    }
    setLoading(false);
  };

  // सर्च अल्गोरिदम (बीमारी, नाम या पते के हिसाब से खोजना)
  const filteredHospitals = hospitals.filter(h => {
    const query = searchQuery.toLowerCase();
    const matchSearch = 
      (h.treatments && h.treatments.toLowerCase().includes(query)) ||
      (h.name && h.name.toLowerCase().includes(query)) ||
      (h.facilities && h.facilities.toLowerCase().includes(query)) ||
      (h.address && h.address.toLowerCase().includes(query));
      
    const matchAyushman = 
      ayushmanFilter === "ALL" ? true : 
      ayushmanFilter === "YES" ? h.ayushman === "Yes" : 
      h.ayushman === "No";

    return matchSearch && matchAyushman;
  });

  return (
    <div style={styles.page}>
      {/* 🟢 HEADER */}
      <header style={styles.header}>
        <h2 style={{margin: 0, fontSize: "20px"}}>🏥 Find Hospital</h2>
        <p style={{margin: "4px 0 0 0", fontSize: "12px", color: "#d1fae5"}}>JeevSathi Smart Search</p>
      </header>

      <main style={styles.main}>
        
        {/* 🔍 SEARCH BOX */}
        <div style={styles.searchCard}>
          <h3 style={{marginTop: 0, color: "#1e3a8a", fontSize: "16px"}}>अपनी बीमारी या अस्पताल खोजें</h3>
          <input 
            type="text" 
            style={styles.searchInput} 
            placeholder="🔍 जैसे: Eye, Dental, Sugar, या अस्पताल का नाम..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <div style={styles.filterBox}>
            <label style={styles.filterLabel}>Ayushman Status:</label>
            <div style={{display: "flex", gap: "10px", marginTop: "5px"}}>
              <button onClick={() => setAyushmanFilter("ALL")} style={ayushmanFilter === "ALL" ? styles.btnFilterActive : styles.btnFilter}>All</button>
              <button onClick={() => setAyushmanFilter("YES")} style={ayushmanFilter === "YES" ? styles.btnFilterActive : styles.btnFilter}>✅ Ayushman Only</button>
            </div>
          </div>
        </div>

        {/* 🏥 HOSPITAL RESULTS */}
        <div>
          <h4 style={{color: "#475569", marginBottom: "15px"}}>
            {loading ? "⏳ ढूँढ रहे हैं..." : `📊 ${filteredHospitals.length} अस्पताल मिले`}
          </h4>

          <div style={styles.hospitalGrid}>
            {filteredHospitals.map(h => (
              <div key={h.id} style={styles.hospitalCard}>
                
                {/* Ayushman & JeevSathi Badge */}
                {h.ayushman === "Yes" ? (
                  <div style={styles.ayushmanBadge}>🟢 AYUSHMAN BENEFIT AVAILABLE</div>
                ) : (
                  <div style={styles.jeevsathiBadge}>🔵 JEEVSATHI PARTNER HOSPITAL</div>
                )}

                <h3 style={styles.hospName}>{h.name}</h3>
                <p style={styles.hospAddress}>📍 {h.address}</p>
                
                <div style={styles.hospDetails}>
                  <p><strong>🩺 Treatments:</strong> {h.treatments}</p>
                  <p><strong>🏥 Facilities:</strong> {h.facilities}</p>
                  <p><strong>👨‍⚕️ Doctors:</strong> {h.doctors_count} Available</p>
                </div>

                <div style={styles.discountBox}>
                  <strong>🎁 JeevSathi Card Benefit:</strong><br/>
                  <span style={{color: "#c2410c", fontSize: "15px"}}>{h.discount}</span>
                </div>

                <div style={styles.actionButtons}>
                  <a href={`tel:${h.contact_number}`} style={styles.btnCall}>📞 CALL</a>
                  <button onClick={() => alert("Appointment System Coming Soon!")} style={styles.btnAppt}>📅 APPOINTMENT</button>
                </div>

              </div>
            ))}

            {!loading && filteredHospitals.length === 0 && (
              <div style={{textAlign: "center", padding: "40px", color: "#64748b", background: "white", borderRadius: "12px", border: "1px dashed #cbd5e1"}}>
                <p style={{fontSize: "40px", margin: "0 0 10px 0"}}>🏥</p>
                <h3>कोई अस्पताल नहीं मिला</h3>
                <p>कृपया किसी अन्य बीमारी या पते से खोजें।</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// 🎨 STYLES (Mobile First)
const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f1f5f9", fontFamily: "'Inter', sans-serif" },
  header: { background: "#064e3b", padding: "15px 5%", color: "white", textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
  main: { padding: "20px 5%", maxWidth: "800px", margin: "0 auto" },
  
  searchCard: { background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", marginBottom: "20px" },
  searchInput: { width: "100%", padding: "14px", borderRadius: "8px", border: "2px solid #2563eb", fontSize: "16px", outline: "none", boxSizing: "border-box" },
  filterBox: { marginTop: "15px" },
  filterLabel: { fontSize: "12px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase" },
  btnFilter: { background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569", padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" },
  btnFilterActive: { background: "#dcfce7", border: "1px solid #16a34a", color: "#166534", padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" },
  
  hospitalGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "20px" },
  hospitalCard: { background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  
  ayushmanBadge: { background: "#dcfce7", color: "#166534", padding: "8px 15px", fontSize: "11px", fontWeight: "bold", textAlign: "center", letterSpacing: "0.5px" },
  jeevsathiBadge: { background: "#e0f2fe", color: "#0369a1", padding: "8px 15px", fontSize: "11px", fontWeight: "bold", textAlign: "center", letterSpacing: "0.5px" },
  
  hospName: { margin: "15px 15px 5px", fontSize: "18px", color: "#0f172a" },
  hospAddress: { margin: "0 15px 15px", fontSize: "13px", color: "#64748b" },
  hospDetails: { padding: "0 15px", fontSize: "13px", color: "#334155", lineHeight: "1.6" },
  
  discountBox: { background: "#fff7ed", borderTop: "1px dashed #fed7aa", borderBottom: "1px dashed #fed7aa", padding: "12px 15px", marginTop: "15px", fontSize: "13px" },
  
  actionButtons: { display: "flex", padding: "15px", gap: "10px" },
  btnCall: { flex: 1, background: "#16a34a", color: "white", textDecoration: "none", textAlign: "center", padding: "12px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", display: "inline-block" },
  btnAppt: { flex: 1, background: "#ea580c", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", cursor: "pointer" }
};

export default FindHospital;