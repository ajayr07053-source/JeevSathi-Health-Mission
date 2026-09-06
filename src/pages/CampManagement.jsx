import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

function CampManagement() {
  const [camps, setCamps] = useState([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    loadCamps();
  }, []);

  async function loadCamps() {
    const { data, error } = await supabase
      .from("camps")
      .select("*")
      .order("id", { ascending: false });

    if (!error) setCamps(data || []);
  }

  async function createCamp(e) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Camp Name भरें");
      return;
    }

    const { error } = await supabase.from("camps").insert([
      {
        name,
        location,
        status: "Active",
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setLocation("");
    loadCamps();
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h2>Camp Management</h2>
        <Link to="/admin-dashboard">← Dashboard</Link>
      </header>

      <main style={styles.main}>
        <form onSubmit={createCamp} style={styles.form}>
          <h2>Create New Camp</h2>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Camp Name"
          />

          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Camp Location"
          />

          <button type="submit">Create Camp</button>
        </form>

        <h2>All Camps</h2>

        {camps.map((camp) => (
          <div style={styles.card} key={camp.id}>
            <h3>{camp.name}</h3>
            <p>Location: {camp.location || "-"}</p>
            <p>Status: {camp.status || "Active"}</p>
          </div>
        ))}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f5faf7", fontFamily: "Arial" },
  header: {
    background: "#123d29",
    color: "#fff",
    padding: "15px 5%",
    display: "flex",
    justifyContent: "space-between",
  },
  main: { maxWidth: 1000, margin: "auto", padding: 30 },
  form: {
    background: "#fff",
    padding: 25,
    borderRadius: 12,
    marginBottom: 30,
  },
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
};

export default CampManagement;