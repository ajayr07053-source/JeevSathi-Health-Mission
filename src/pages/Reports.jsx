import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Reports() {
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [filter, setFilter] = useState({
    status: "ALL",
    type: "ALL", // Normal or Camp
    startDate: "",
    endDate: ""
  });

  // ==========================================
  // 1. AUTH CHECK & LOAD DATA
  // ==========================================
  useEffect(() => {
    const savedUser = localStorage.getItem("jeevsathi_logged_user");
    if (!savedUser) {
      navigate("/login", { replace: true });
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("camp_patients")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (err) {
      console.error(err);
      alert("डेटा लोड करने में समस्या आई।");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 2. FILTER LOGIC
  // ==========================================
  const filteredData = useMemo(() => {
    return patients.filter(p => {
      // Status Filter
      let statusMatch = true;
      if (filter.status === "APPROVED") statusMatch = String(p.admin_status).toUpperCase() === "APPROVED";
      else if (filter.status === "PENDING_PAYMENT") statusMatch = String(p.payment_status).toUpperCase() !== "RECEIVED";
      
      // Type Filter
      let typeMatch = true;
      if (filter.type === "CAMP") typeMatch = !!p.camp_id;
      else if (filter.type === "NORMAL") typeMatch = !p.camp_id;

      // Date Filter
      let dateMatch = true;
      if (filter.startDate && filter.endDate) {
        const pDate = new Date(p.created_at).getTime();
        const sDate = new Date(filter.startDate).getTime();
        const eDate = new Date(filter.endDate).setHours(23, 59, 59, 999);
        dateMatch = pDate >= sDate && pDate <= eDate;
      }

      return statusMatch && typeMatch && dateMatch;
    });
  }, [patients, filter]);

  // ==========================================
  // 3. CALCULATE STATS FOR DASHBOARD
  // ==========================================
  const stats = useMemo(() => {
    const total = filteredData.length;
    const normal = filteredData.filter(p => !p.camp_id).length;
    const camp = filteredData.filter(p => !!p.camp_id).length;
    const approved = filteredData.filter(p => String(p.admin_status).toUpperCase() === "APPROVED").length;
    const revenue = filteredData.filter(p => String(p.payment_status).toUpperCase() === "RECEIVED" && !p.camp_id).length * 150;

    return { total, normal, camp, approved, revenue };
  }, [filteredData]);

  // ==========================================
  // 4. EXPORT TO CSV (EXCEL)
  // ==========================================
  const exportToCSV = () => {
    if (filteredData.length === 0) return alert("डाउनलोड करने के लिए कोई डेटा नहीं है!");

    const headers = ["ID", "Patient Name", "Mobile", "Age", "Gender", "Registration Type", "Camp Name", "Payment Status", "Admin Status", "Date"];
    
    const csvRows = filteredData.map(p => [
      p.id,
      `"${p.patient_name}"`, // Quotes to handle spaces/commas in name
      p.mobile,
      p.age,
      p.gender,
      p.camp_id ? "Camp" : "Normal",
      p.camp_name ? `"${p.camp_name}"` : "-",
      p.payment_status || "PENDING",
      p.admin_status || "PENDING",
      new Date(p.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers.join(","), ...csvRows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `JeevSathi_Report_${new Date().toLocaleDateString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // 5. PRINT (PDF)
  // ==========================================
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* CSS For Print Mode (Hides buttons and filters when printing) */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { width: 100% !important; padding: 0 !important; margin: 0 !important; }
          body { background: white !important; }
        }
      `}</style>

      <div style={styles.page} className="print-area">
        
        {/* HEADER */}
        <header style={styles.header} className="no-print">
          <div style={styles.headerContent}>
            <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
            <h1 style={styles.title}>📊 Master Reports & Analytics</h1>
          </div>
          <button style={styles.logoutBtn} onClick={() => { localStorage.clear(); navigate("/login"); }}>🚪 Logout</button>
        </header>

        <main style={styles.main}>
          
          {/* FILTERS (Hidden on Print) */}
          <div style={styles.filterCard} className="no-print">
            <h3 style={{margin: "0 0 15px", color: "#173b2a"}}>🔍 Report Filters</h3>
            <div style={styles.filterGrid}>
              <div>
                <label style={styles.label}>Registration Type</label>
                <select style={styles.input} value={filter.type} onChange={e => setFilter({...filter, type: e.target.value})}>
                  <option value="ALL">All Patients</option>
                  <option value="NORMAL">Normal Health Cards</option>
                  <option value="CAMP">Camp Patients</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Card Status</label>
                <select style={styles.input} value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})}>
                  <option value="ALL">All Status</option>
                  <option value="APPROVED">Fully Approved (Active)</option>
                  <option value="PENDING_PAYMENT">Payment Pending</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Start Date</label>
                <input type="date" style={styles.input} value={filter.startDate} onChange={e => setFilter({...filter, startDate: e.target.value})} />
              </div>
              <div>
                <label style={styles.label}>End Date</label>
                <input type="date" style={styles.input} value={filter.endDate} onChange={e => setFilter({...filter, endDate: e.target.value})} />
              </div>
            </div>
          </div>

          {/* REPORT SUMMARY */}
          <div style={styles.statsGrid}>
            <StatBox title="Total Patients (Filtered)" value={stats.total} color="#2878d0" />
            <StatBox title="Normal Registrations" value={stats.normal} color="#16804d" />
            <StatBox title="Camp Registrations" value={stats.camp} color="#f97316" />
            <StatBox title="Approved Cards" value={stats.approved} color="#16a34a" />
            <StatBox title="Total Revenue (Normal x ₹150)" value={`₹${stats.revenue}`} color="#b45309" bg="#fffbeb" />
          </div>

          {/* ACTION BUTTONS (Export & Print) */}
          <div style={styles.actionRow} className="no-print">
            <h3 style={{margin: 0, color: "#173b2a"}}>📋 Detailed Record Table</h3>
            <div style={{display: 'flex', gap: '10px'}}>
              <button style={styles.exportBtn} onClick={exportToCSV}>📥 Download Excel (CSV)</button>
              <button style={styles.printBtn} onClick={handlePrint}>🖨️ Print / Save PDF</button>
            </div>
          </div>

          {/* DATA TABLE */}
          {loading ? (
            <div style={{textAlign: "center", padding: "50px"}}>⏳ Report Data Loading...</div>
          ) : (
            <div style={styles.tableCard}>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Patient Details</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Payment Status</th>
                      <th style={styles.th}>Admin Status</th>
                      <th style={styles.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr><td colSpan="6" style={{textAlign: "center", padding: "20px", color: "#666"}}>कोई डेटा नहीं मिला।</td></tr>
                    ) : (
                      filteredData.map(p => (
                        <tr key={p.id} style={styles.tr}>
                          <td style={styles.td}><strong>#{p.id}</strong></td>
                          <td style={styles.td}>
                            <strong>{p.patient_name}</strong><br/>
                            <span style={{fontSize: "11px", color: "#666"}}>📱 {p.mobile} | {p.age}Y/{p.gender}</span>
                          </td>
                          <td style={styles.td}>
                            {p.camp_id ? <span style={styles.campBadge}>🏕️ {p.camp_name}</span> : <span style={styles.normalBadge}>💳 Normal</span>}
                          </td>
                          <td style={styles.td}>
                            {String(p.payment_status).toUpperCase() === "RECEIVED" ? <span style={{color: "#166534"}}>✅ Received</span> : <span style={{color: "#991b1b"}}>⏳ Pending</span>}
                          </td>
                          <td style={styles.td}>
                            {String(p.admin_status).toUpperCase() === "APPROVED" ? <span style={{color: "#166534"}}>✅ Approved</span> : "⏳ Pending"}
                          </td>
                          <td style={styles.td}>{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}

// ==========================================
// COMPONENTS & STYLES
// ==========================================
function StatBox({ title, value, color, bg = "white" }) {
  return (
    <div style={{ background: bg, borderTop: `4px solid ${color}`, padding: "15px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <p style={{ margin: "0 0 5px", fontSize: "11px", color: "#666", fontWeight: "bold", textTransform: "uppercase" }}>{title}</p>
      <h3 style={{ margin: 0, fontSize: "24px", color: color }}>{value}</h3>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", backgroundColor: "#f3f8f5", fontFamily: "Arial, sans-serif", paddingBottom: "40px" },
  header: { background: "#173b2a", padding: "15px 5%", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerContent: { display: "flex", alignItems: "center", gap: "15px" },
  backBtn: { background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" },
  title: { margin: 0, fontSize: "18px" },
  logoutBtn: { background: "#dc2626", border: "none", color: "white", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" },
  
  main: { maxWidth: "1200px", margin: "30px auto", padding: "0 5%" },
  
  filterCard: { background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", marginBottom: "25px", border: "1px solid #e1e9e4" },
  filterGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" },
  label: { display: "block", fontSize: "12px", fontWeight: "bold", color: "#4b5563", marginBottom: "5px" },
  input: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", boxSizing: "border-box" },
  
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px", marginBottom: "30px" },
  
  actionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" },
  exportBtn: { background: "#16a34a", color: "white", border: "none", padding: "10px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
  printBtn: { background: "#2563eb", color: "white", border: "none", padding: "10px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" },
  
  tableCard: { background: "white", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", border: "1px solid #e1e9e4", overflow: "hidden" },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "800px" },
  th: { background: "#f9fafb", color: "#4b5563", padding: "12px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "12px", fontSize: "13px", color: "#374151" },
  
  campBadge: { background: "#fffbeb", color: "#b45309", padding: "4px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold" },
  normalBadge: { background: "#e8f5ec", color: "#16804d", padding: "4px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: "bold" },
};

export default Reports;