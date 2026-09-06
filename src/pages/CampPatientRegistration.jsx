import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function CampPatientRegistration() {
  const navigate = useNavigate();
  const [loggedInFO, setLoggedInFO] = useState(null);
  const [assignedCamps, setAssignedCamps] = useState([]);
  
  const [formData, setFormData] = useState({
    patient_name: "", 
    age: "", 
    gender: "Male", 
    mobile: "", 
    district: "", 
    block: "", 
    village: "", 
    camp_id: "NONE", 
    symptoms: "General (सामान्य जाँच)", // डिफ़ॉल्ट बीमारी 
    custom_symptom: "", // Other चुनने पर कस्टम इनपुट के लिए
    is_referred: "No",
    ayushman_status: "DONT_KNOW" // 👈 आयुष्मान कार्ड स्टेटस
  });

  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🚀 30+ बीमारियों की लिस्ट
  const symptomOptions = [
    "General (सामान्य जाँच)",
    "Fever / Cold / Cough (बुखार / सर्दी / खाँसी)",
    "Body / Muscle Ache (बदन / मांसपेशियों में दर्द)",
    "Headache / Migraine (सिरदर्द / माइग्रेन)",
    "Weakness / Fatigue (कमज़ोरी / थकान)",
    "Stomach Ache (पेट दर्द)",
    "Acidity / Gas / Indigestion (एसिडिटी / गैस / अपच)",
    "Diarrhea / Loose Motions (दस्त / डायरिया)",
    "Constipation (कब्ज़)",
    "Vomiting / Nausea (उल्टी / जी मिचलाना)",
    "Breathing Problem / Asthma (साँस फूलना / अस्थमा)",
    "Chest Pain (छाती में दर्द)",
    "Joint Pain / Arthritis (जोड़ों में दर्द / गठिया)",
    "Back / Waist Pain (कमर दर्द)",
    "Neck Pain (गर्दन दर्द)",
    "Skin Infection / Itching (स्किन इन्फेक्शन / खुजली)",
    "Ringworm / Fungal (दाद / फंगल इन्फेक्शन)",
    "Wounds / Boils (घाव / फोड़े-फुंसी)",
    "Eye Problem (आँख की समस्या)",
    "Ear Pain / Discharge (कान दर्द / बहना)",
    "Toothache / Dental (दांत दर्द / मसूड़ों की समस्या)",
    "Blood Pressure (BP की समस्या)",
    "Diabetes / Sugar (डायबिटीज़ / शुगर)",
    "Thyroid (थायरॉइड)",
    "Urinary Issue / Burning (पेशाब में जलन / इन्फेक्शन)",
    "Allergy (एलर्जी)",
    "Anemia (खून की कमी / एनीमिया)",
    "Women: Menstrual Issues (मासिक धर्म की समस्या)",
    "Women: White Discharge (सफेद पानी की शिकायत)",
    "Women: Pregnancy Checkup (गर्भावस्था की जाँच)",
    "Child: Malnutrition (बच्चों में कुपोषण / कमज़ोरी)",
    "Child: Stomach Worms (पेट के कीड़े)",
    "Other (कोई अन्य बीमारी लिख कर बताएँ)"
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("jeevsathi_logged_user"));
    if (user) { 
      setLoggedInFO(user); 
      fetchCamps(); 
      setFormData(p => ({...p, district: user.district || "", block: user.block || ""})); 
    } 
    else {
      navigate("/login");
    }
    loadDistricts();
  }, [navigate]);

  const fetchCamps = async () => {
    try {
      const { data, error } = await supabase.from("camps").select("*").order("date", { ascending: false });
      if (!error && data) {
        setAssignedCamps(data);
      }
    } catch (err) {
      console.error("Camp load error:", err);
    }
  };

  const loadDistricts = async () => {
    const { data } = await supabase.from("districts").select("*").order("name");
    if(data) setDistricts(data);
  };

  useEffect(() => {
    if (formData.district && districts.length > 0) {
      const selectedDist = districts.find(d => d.name === formData.district);
      if (selectedDist && selectedDist.id) {
        supabase.from("blocks").select("*").eq("district_id", selectedDist.id).order("name")
        .then(({data}) => setBlocks(data || []));
      }
    } else {
      setBlocks([]);
    }
  }, [formData.district, districts]);

  const handleCampSelection = (e) => {
    const selectedCampId = e.target.value;
    
    if (selectedCampId === "NONE") {
      setFormData(prev => ({ ...prev, camp_id: "NONE", village: "" }));
    } else {
      const selectedCamp = assignedCamps.find(c => String(c.id) === String(selectedCampId));
      if (selectedCamp) {
        setFormData(prev => ({
          ...prev,
          camp_id: selectedCampId,
          district: selectedCamp.district || prev.district,
          block: selectedCamp.block || prev.block,
          village: selectedCamp.address || prev.village
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // अगर Other चुना है, तो जो टाइप किया है वो सेव होगा
    const finalSymptom = formData.symptoms === "Other (कोई अन्य बीमारी लिख कर बताएँ)" ? formData.custom_symptom : formData.symptoms;

    if (formData.symptoms === "Other (कोई अन्य बीमारी लिख कर बताएँ)" && !finalSymptom.trim()) {
      alert("⚠️ कृपया बीमारी का नाम लिखकर बताएँ!");
      setLoading(false);
      return;
    }

    const payload = {
      patient_name: formData.patient_name,
      age: formData.age ? parseInt(formData.age, 10) : null,
      gender: formData.gender,
      mobile: formData.mobile,
      district: formData.district,
      block: formData.block,
      village: formData.village,
      ayushman_status: formData.ayushman_status, // 👈 Supabase में आयुष्मान स्टेटस सेव होगा
      symptoms: finalSymptom, 
      is_referred: formData.is_referred,
      payment_status: "FREE_OPD", 
      payment_amount: 0,
      fo_name: loggedInFO?.name || "Field Officer", 
      fo_id: loggedInFO?.id ? String(loggedInFO.id) : null, 
      camp_id: formData.camp_id === "NONE" ? null : formData.camp_id,
      admin_status: "NOT_APPLICABLE", 
      supervisor_status: "NOT_APPLICABLE"
    };

    const { data, error } = await supabase.from("camp_patients").insert([payload]).select().single();
    setLoading(false);
    
    if (error) {
      alert("❌ Error: " + error.message);
    } else {
      alert(`✅ OPD Entry सफल! ID: ${data.id}\nमरीज़ को डॉक्टर के पास भेजें।`);
      navigate("/field-officer-dashboard");
    }
  };

  return (
    <div style={{background: "#eff6ff", minHeight: "100vh", padding: "20px", fontFamily: "Arial, sans-serif"}}>
      <button onClick={() => navigate("/field-officer-dashboard")} style={{padding: "10px 15px", marginBottom: "20px", cursor: "pointer", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", fontWeight: "bold", color: "#1e293b"}}>← Back to Dashboard</button>
      
      <div style={{background: "white", maxWidth: "800px", margin: "0 auto", padding: "30px", borderRadius: "12px", borderTop: "5px solid #2563eb", boxShadow: "0 4px 6px rgba(0,0,0,0.05)"}}>
        <h2 style={{color: "#1d4ed8", marginTop: 0}}>🏕️ Free Camp OPD Registration</h2>
        <form onSubmit={handleSubmit} style={{display: "grid", gap: "15px"}}>
          
          <div style={{display: "flex", flexDirection: "column", gap: "5px", background: "#fefce8", padding: "15px", borderRadius: "8px", border: "1px solid #fde68a"}}>
            <label style={{fontSize: "14px", fontWeight: "bold", color: "#b45309"}}>📍 Select Camp (कैम्प चुनें)</label>
            <select style={{...inp, borderColor: "#fcd34d", fontWeight: "bold", background: "#fff"}} value={formData.camp_id} onChange={handleCampSelection}>
              <option value="NONE">-- Direct Registration (कोई कैम्प नहीं) --</option>
              {assignedCamps.map(c => <option key={c.id} value={c.id}>{c.camp_name || c.name} ({c.district})</option>)}
            </select>
          </div>

          <input required style={inp} placeholder="Patient Name (मरीज़ का नाम)" value={formData.patient_name} onChange={e => setFormData({...formData, patient_name: e.target.value})} />
          
          <div style={{display: "flex", gap: "10px"}}>
            <input required type="number" style={inp} placeholder="Age (उम्र)" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
            <select style={inp} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          
          <input required type="tel" maxLength="10" style={inp} placeholder="Mobile Number" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
          
          <div style={{display: "flex", gap: "10px"}}>
            <select required style={inp} value={formData.district} onChange={e => setFormData({...formData, district: e.target.value, block: ""})}>
              <option value="">-- Select District --</option>
              {districts.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
            </select>
            <select required style={inp} value={formData.block} onChange={e => setFormData({...formData, block: e.target.value})}>
              <option value="">-- Select Block --</option>
              {blocks.map(b => <option key={b.id || b.name} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          
          <input required style={inp} placeholder="Village / Address (गाँव / पूरा पता)" value={formData.village} onChange={e => setFormData({...formData, village: e.target.value})} />
          
          {/* 🌟 AYUSHMAN CARD STATUS (नया जोड़ा गया कॉलम) */}
          <div style={{background: "#f0fdf4", padding: "15px", border: "1px solid #bbf7d0", borderRadius: "8px"}}>
            <label style={{fontSize: "13px", fontWeight: "bold", color: "#166534", display: "block", marginBottom: "8px"}}>
              💳 क्या मरीज़ के पास आयुष्मान कार्ड है? (Ayushman Card Status)
            </label>
            <div style={{display: "flex", gap: "10px", flexWrap: "wrap"}}>
              <button
                type="button"
                onClick={() => setFormData({...formData, ayushman_status: "YES"})}
                style={{
                  flex: 1, minWidth: "120px", padding: "10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px",
                  border: formData.ayushman_status === "YES" ? "2px solid #16a34a" : "1px solid #cbd5e1",
                  background: formData.ayushman_status === "YES" ? "#dcfce7" : "white",
                  color: formData.ayushman_status === "YES" ? "#15803d" : "#475569"
                }}
              >
                ✅ हाँ (Yes)
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, ayushman_status: "NO"})}
                style={{
                  flex: 1, minWidth: "120px", padding: "10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px",
                  border: formData.ayushman_status === "NO" ? "2px solid #ef4444" : "1px solid #cbd5e1",
                  background: formData.ayushman_status === "NO" ? "#fee2e2" : "white",
                  color: formData.ayushman_status === "NO" ? "#b91c1c" : "#475569"
                }}
              >
                ❌ नहीं (No)
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, ayushman_status: "DONT_KNOW"})}
                style={{
                  flex: 1, minWidth: "120px", padding: "10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px",
                  border: formData.ayushman_status === "DONT_KNOW" ? "2px solid #f59e0b" : "1px solid #cbd5e1",
                  background: formData.ayushman_status === "DONT_KNOW" ? "#fef3c7" : "white",
                  color: formData.ayushman_status === "DONT_KNOW" ? "#b45309" : "#475569"
                }}
              >
                🤷‍♂️ पता नहीं (Don't Know)
              </button>
            </div>
          </div>

          {/* 🚀 SMART Medical Details Section */}
          <div style={{background: "#f8fafc", padding: "15px", border: "1px solid #cbd5e1", borderRadius: "8px", marginTop: "5px"}}>
            <label style={{fontSize: "13px", fontWeight: "bold", color: "#1d4ed8"}}>🩺 क्या बीमारी है? (Symptoms) *</label>
            
            <select style={{...inp, marginTop: "8px", fontWeight: "bold", color: "#334155"}} value={formData.symptoms} onChange={e => setFormData({...formData, symptoms: e.target.value})}>
              {symptomOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            {/* अगर 'Other' चुना, तो टाइप करने वाला बॉक्स आ जाएगा */}
            {formData.symptoms === "Other (कोई अन्य बीमारी लिख कर बताएँ)" && (
              <input required style={{...inp, marginTop: "10px", borderColor: "#3b82f6"}} placeholder="✍️ यहाँ बीमारी का नाम लिखें..." value={formData.custom_symptom} onChange={e => setFormData({...formData, custom_symptom: e.target.value})} />
            )}
            
            <label style={{fontSize: "13px", fontWeight: "bold", display: "block", marginTop: "15px", color: "#1d4ed8"}}>🏥 क्या मरीज़ को बड़े अस्पताल रेफर किया गया?</label>
            <select style={{...inp, marginTop: "8px"}} value={formData.is_referred} onChange={e => setFormData({...formData, is_referred: e.target.value})}>
              <option value="No">नहीं (No)</option>
              <option value="Yes">हाँ, रेफर किया (Yes)</option>
            </select>
          </div>

          <button type="submit" disabled={loading} style={{background: "#2563eb", color: "white", padding: "15px", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "16px", marginTop: "10px"}}>
            {loading ? "⏳ Saving..." : "🏕️ Save Free OPD Entry"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inp = { padding: "12px", border: "1px solid #cbd5e1", borderRadius: "6px", width: "100%", boxSizing: "border-box", outline: "none", fontSize: "14px" };

export default CampPatientRegistration;