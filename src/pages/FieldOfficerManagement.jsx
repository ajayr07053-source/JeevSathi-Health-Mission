import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

function FieldOfficerManagement() {
  const [officers, setOfficers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    username: "",
    password: "",
    supervisor: "",
    block: "",
    district: "",
    status: "Active",
  });

  // =====================================================
  // LOAD DATA
  // =====================================================

  const loadData = async () => {
    try {
      setLoading(true);

      const {
        data: officerData,
        error: officerError,
      } = await supabase
        .from("field_officers")
        .select("*")
        .order("id", { ascending: false });

      if (officerError) {
        console.error(officerError);
        alert(
          "Field Officers load नहीं हो सके.\n\n" +
            officerError.message
        );
        setOfficers([]);
      } else {
        setOfficers(officerData || []);
      }

      const {
        data: supervisorData,
        error: supervisorError,
      } = await supabase
        .from("supervisors")
        .select("*")
        .order("id", { ascending: false });

      if (supervisorError) {
        console.error(supervisorError);
        alert(
          "Supervisors load नहीं हो सके.\n\n" +
            supervisorError.message
        );
        setSupervisors([]);
      } else {
        setSupervisors(supervisorData || []);
      }
    } catch (error) {
      console.error(error);

      alert(
        "Data load करने में समस्या हुई.\n\n" +
          error.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // DISTRICTS
  // =====================================================

  const districts = useMemo(() => {
    const list = supervisors
      .map((item) => String(item.district || "").trim())
      .filter(Boolean);

    return [...new Set(list)].sort();
  }, [supervisors]);

  // =====================================================
  // BLOCKS
  // =====================================================

  const blocks = useMemo(() => {
    if (!form.district) return [];

    const list = supervisors
      .filter(
        (item) =>
          String(item.district || "").trim() ===
          form.district.trim()
      )
      .map((item) => String(item.block || "").trim())
      .filter(Boolean);

    return [...new Set(list)].sort();
  }, [supervisors, form.district]);

  // =====================================================
  // AUTOMATIC SUPERVISOR
  // =====================================================

  const findSupervisor = (district, block) => {
    if (!district || !block) return "";

    const supervisor = supervisors.find(
      (item) =>
        String(item.district || "").trim() ===
          district.trim() &&
        String(item.block || "").trim() ===
          block.trim()
    );

    return supervisor?.name || "";
  };

  // =====================================================
  // FORM RESET
  // =====================================================

  const resetForm = () => {
    setForm({
      name: "",
      mobile: "",
      email: "",
      username: "",
      password: "",
      supervisor: "",
      block: "",
      district: "",
      status: "Active",
    });

    setEditingOfficer(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (officer) => {
    setEditingOfficer(officer);

    setForm({
      name: officer.name || "",
      mobile: officer.mobile || "",
      email: officer.email || "",
      username: officer.username || "",
      password: officer.password || "",
      supervisor:
        officer.supervisor ||
        officer.supervisor_name ||
        "",
      block: officer.block || "",
      district: officer.district || "",
      status: officer.status || "Active",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    resetForm();
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // DISTRICT CHANGE
    if (name === "district") {
      setForm((prev) => ({
        ...prev,
        district: value,
        block: "",
        supervisor: "",
      }));

      return;
    }

    // BLOCK CHANGE
    if (name === "block") {
      const automaticSupervisor = findSupervisor(
        form.district,
        value
      );

      setForm((prev) => ({
        ...prev,
        block: value,
        supervisor: automaticSupervisor,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // SAVE
  // =====================================================

  const saveOfficer = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("⚠️ Field Officer का नाम डालें।");
      return;
    }

    if (!form.mobile.trim()) {
      alert("⚠️ Mobile Number डालें।");
      return;
    }

    if (!form.username.trim()) {
      alert("⚠️ Username डालें।");
      return;
    }

    if (!form.password.trim()) {
      alert("⚠️ Password डालें।");
      return;
    }

    if (!form.district.trim()) {
      alert("⚠️ District select करें।");
      return;
    }

    if (!form.block.trim()) {
      alert("⚠️ Block select करें।");
      return;
    }

    const automaticSupervisor = findSupervisor(
      form.district,
      form.block
    );

    if (!automaticSupervisor) {
      alert(
        "⚠️ इस District और Block के लिए Supervisor नहीं मिला।"
      );
      return;
    }

    try {
      setSaving(true);

      const officerData = {
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password.trim(),
        supervisor: automaticSupervisor,
        block: form.block.trim(),
        district: form.district.trim(),
        status: form.status,
      };

      if (editingOfficer) {
        const { error } = await supabase
          .from("field_officers")
          .update(officerData)
          .eq("id", editingOfficer.id);

        if (error) throw error;

        alert("✅ Field Officer successfully updated!");
      } else {
        const { error } = await supabase
          .from("field_officers")
          .insert([officerData]);

        if (error) throw error;

        alert("✅ Field Officer successfully added!");
      }

      setShowForm(false);
      resetForm();

      await loadData();
    } catch (error) {
      console.error("Save Officer Error:", error);

      alert(
        "❌ Field Officer save नहीं हो सका.\n\n" +
          error.message
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const deleteOfficer = async (officer) => {
    const confirmDelete = window.confirm(
      `क्या आप "${officer.name}" को Delete करना चाहते हैं?`
    );

    if (!confirmDelete) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("field_officers")
        .delete()
        .eq("id", officer.id);

      if (error) throw error;

      alert("🗑️ Field Officer deleted successfully!");

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        "❌ Delete नहीं हो सका.\n\n" +
          error.message
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // STATUS
  // =====================================================

  const toggleStatus = async (officer) => {
    const newStatus =
      String(officer.status || "").toLowerCase() ===
      "active"
        ? "Inactive"
        : "Active";

    try {
      setSaving(true);

      const { error } = await supabase
        .from("field_officers")
        .update({
          status: newStatus,
        })
        .eq("id", officer.id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        "❌ Status change नहीं हो सका.\n\n" +
          error.message
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredOfficers = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return officers;

    return officers.filter((officer) => {
      return (
        String(officer.name || "")
          .toLowerCase()
          .includes(q) ||
        String(officer.mobile || "")
          .toLowerCase()
          .includes(q) ||
        String(officer.email || "")
          .toLowerCase()
          .includes(q) ||
        String(officer.username || "")
          .toLowerCase()
          .includes(q) ||
        String(officer.supervisor || "")
          .toLowerCase()
          .includes(q) ||
        String(officer.block || "")
          .toLowerCase()
          .includes(q) ||
        String(officer.district || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [officers, search]);

  const activeOfficers = officers.filter(
    (officer) =>
      String(officer.status || "").toLowerCase() ===
      "active"
  );

  const inactiveOfficers = officers.filter(
    (officer) =>
      String(officer.status || "").toLowerCase() ===
      "inactive"
  );

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="officer-page">

      {/* SIDEBAR */}

      <aside className="officer-sidebar">

        <div className="sidebar-logo">
          <div className="logo-circle">🌿</div>

          <div>
            <h2>JeevSathi</h2>
            <span>Health Mission</span>
          </div>
        </div>

        <nav className="officer-nav">

          <Link
            to="/admin-dashboard"
            className="nav-item"
          >
            🏠
            <span>Dashboard</span>
          </Link>

          <Link
            to="/supervisors"
            className="nav-item"
          >
            👑
            <span>Supervisors</span>
          </Link>

          <Link
            to="/field-officers"
            className="nav-item active"
          >
            👨‍💼
            <span>Field Officers</span>
          </Link>

          <Link
            to="/patient-registration"
            className="nav-item"
          >
            🪪
            <span>Health Card Patients</span>
          </Link>

          <Link
            to="/camp-patient-registration"
            className="nav-item"
          >
            🏕️
            <span>Camp Registration</span>
          </Link>

        </nav>

        <div className="sidebar-bottom">

          <div className="admin-profile">

            <div className="profile-avatar">
              A
            </div>

            <div>
              <strong>Administrator</strong>
              <small>Super Admin</small>
            </div>

          </div>

          <Link
            to="/login"
            className="logout-btn"
          >
            🚪 Logout
          </Link>

        </div>

      </aside>

      {/* MAIN */}

      <main className="officer-main">

        <header className="page-header">

          <div>
            <h1>Field Officer Management</h1>

            <p>
              JeevSathi Health Mission —
              Field Team Management
            </p>
          </div>

          <div className="header-actions">

            <button
              className="refresh-btn"
              onClick={loadData}
              disabled={loading}
            >
              🔄 Refresh
            </button>

            <button
              className="add-btn"
              onClick={openAddForm}
            >
              ➕ Add Field Officer
            </button>

          </div>

        </header>

        {/* WELCOME */}

        <section className="welcome-banner">

          <div>
            <span>JEEVSATHI FIELD TEAM</span>

            <h2>
              Field Officers को Manage करें
            </h2>

            <p>
              District और Block select करें।
              Supervisor automatically assign होगा।
            </p>
          </div>

          <div className="welcome-icon">
            👨‍💼
          </div>

        </section>

        {/* STATS */}

        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon">👨‍💼</div>

            <strong>{officers.length}</strong>

            <span>Total Field Officers</span>
          </div>

          <div className="stat-card active-card">
            <div className="stat-icon">🟢</div>

            <strong>
              {activeOfficers.length}
            </strong>

            <span>Active Officers</span>
          </div>

          <div className="stat-card inactive-card">
            <div className="stat-icon">🔴</div>

            <strong>
              {inactiveOfficers.length}
            </strong>

            <span>Inactive Officers</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👑</div>

            <strong>{supervisors.length}</strong>

            <span>Total Supervisors</span>
          </div>

        </section>

        {/* MANAGEMENT */}

        <section className="management-section">

          <div className="section-heading">

            <div>
              <h2>👨‍💼 Field Officer List</h2>

              <p>
                सभी Field Officers की जानकारी
              </p>
            </div>

            <span className="count-badge">
              {filteredOfficers.length} Officers
            </span>

          </div>

          {/* SEARCH */}

          <div className="search-box">

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="🔍 Name, Mobile, Username, Supervisor, Block, District..."
            />

            <button
              onClick={() => setSearch("")}
            >
              Clear
            </button>

          </div>

          {/* TABLE */}

          {loading ? (

            <div className="loading-box">
              ⏳ Field Officers loading...
            </div>

          ) : filteredOfficers.length === 0 ? (

            <div className="empty-box">

              <div>👨‍💼</div>

              <h3>
                No Field Officers Found
              </h3>

              <p>
                अभी कोई Field Officer उपलब्ध नहीं है।
              </p>

              <button
                className="add-btn"
                onClick={openAddForm}
              >
                ➕ Add First Field Officer
              </button>

            </div>

          ) : (

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>
                    <th>Officer</th>
                    <th>Mobile</th>
                    <th>Username</th>
                    <th>Supervisor</th>
                    <th>Block</th>
                    <th>District</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredOfficers.map(
                    (officer) => {

                      const active =
                        String(
                          officer.status || ""
                        ).toLowerCase() ===
                        "active";

                      return (
                        <tr key={officer.id}>

                          <td>

                            <div className="officer-cell">

                              <div className="officer-avatar">
                                👨‍💼
                              </div>

                              <div>

                                <strong>
                                  {officer.name ||
                                    "Field Officer"}
                                </strong>

                                <small>
                                  {officer.email ||
                                    "No Email"}
                                </small>

                              </div>

                            </div>

                          </td>

                          <td>
                            {officer.mobile || "-"}
                          </td>

                          <td>
                            <span className="username">
                              {officer.username || "-"}
                            </span>
                          </td>

                          <td>
                            {officer.supervisor ||
                              officer.supervisor_name ||
                              "-"}
                          </td>

                          <td>
                            {officer.block || "-"}
                          </td>

                          <td>
                            {officer.district || "-"}
                          </td>

                          <td>

                            <button
                              className={
                                active
                                  ? "status-active"
                                  : "status-inactive"
                              }
                              onClick={() =>
                                toggleStatus(
                                  officer
                                )
                              }
                              disabled={saving}
                            >
                              {active
                                ? "🟢 Active"
                                : "🔴 Inactive"}
                            </button>

                          </td>

                          <td>

                            <div className="actions">

                              <button
                                className="edit-btn"
                                onClick={() =>
                                  openEditForm(
                                    officer
                                  )
                                }
                              >
                                ✏️ Edit
                              </button>

                              <button
                                className="delete-btn"
                                onClick={() =>
                                  deleteOfficer(
                                    officer
                                  )
                                }
                                disabled={saving}
                              >
                                🗑️ Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        <footer className="page-footer">

          <span>
            © 2026 JeevSathi Health Mission
          </span>

          <span>
            Field Officer Management • Supabase
          </span>

        </footer>

      </main>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showForm && (

        <div
          className="modal-overlay"
          onClick={closeForm}
        >

          <div
            className="form-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="modal-tag">
                  👨‍💼 FIELD OFFICER
                </span>

                <h2>
                  {editingOfficer
                    ? "Edit Field Officer"
                    : "Add Field Officer"}
                </h2>

              </div>

              <button
                className="close-btn"
                onClick={closeForm}
              >
                ✕
              </button>

            </div>

            <form onSubmit={saveOfficer}>

              <div className="form-body">

                {/* NAME */}

                <div className="form-group">

                  <label>
                    Full Name *
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Field Officer का नाम"
                  />

                </div>

                {/* MOBILE */}

                <div className="form-group">

                  <label>
                    Mobile Number *
                  </label>

                  <input
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    placeholder="10 Digit Mobile Number"
                    maxLength="10"
                  />

                </div>

                {/* EMAIL */}

                <div className="form-group">

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="officer@example.com"
                  />

                </div>

                {/* USERNAME */}

                <div className="form-group">

                  <label>
                    Username *
                  </label>

                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Login Username"
                  />

                </div>

                {/* PASSWORD */}

                <div className="form-group">

                  <label>
                    Password *
                  </label>

                  <input
                    type="text"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Login Password"
                  />

                </div>

                {/* DISTRICT */}

                <div className="form-group">

                  <label>
                    District *
                  </label>

                  <select
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                  >

                    <option value="">
                      Select District
                    </option>

                    {districts.map(
                      (district) => (
                        <option
                          key={district}
                          value={district}
                        >
                          {district}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* BLOCK */}

                <div className="form-group">

                  <label>
                    Block *
                  </label>

                  <select
                    name="block"
                    value={form.block}
                    onChange={handleChange}
                    disabled={!form.district}
                  >

                    <option value="">
                      {form.district
                        ? "Select Block"
                        : "First Select District"}
                    </option>

                    {blocks.map(
                      (block) => (
                        <option
                          key={block}
                          value={block}
                        >
                          {block}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* AUTOMATIC SUPERVISOR */}

                <div className="form-group">

                  <label>
                    Supervisor
                  </label>

                  <input
                    value={
                      form.supervisor ||
                      "Supervisor will be automatic"
                    }
                    readOnly
                    className={
                      form.supervisor
                        ? "automatic-field selected"
                        : "automatic-field"
                    }
                  />

                  <small className="auto-help">
                    District + Block select करने पर
                    Supervisor automatically आएगा।
                  </small>

                </div>

                {/* STATUS */}

                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >

                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>

                  </select>

                </div>

              </div>

              {/* FOOTER */}

              <div className="form-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "⏳ Saving..."
                    : editingOfficer
                    ? "💾 Update Officer"
                    : "✅ Add Officer"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* CSS */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          background: #f3f8f5;
        }

        button,
        input,
        select {
          font-family: inherit;
        }

        .officer-page {
          min-height: 100vh;
          display: flex;
          background: #f3f8f5;
        }

        .officer-sidebar {
          width: 245px;
          min-height: 100vh;
          background: #123b29;
          color: white;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          padding: 20px 14px;
          z-index: 10;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          margin-bottom: 25px;
        }

        .logo-circle {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #e9f8ef;
          color: #16804d;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
        }

        .sidebar-logo h2 {
          margin: 0;
          font-size: 19px;
        }

        .sidebar-logo span {
          font-size: 10px;
          color: #b9d5c6;
        }

        .officer-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .nav-item {
          width: 100%;
          text-decoration: none;
          color: #d8e8df;
          background: transparent;
          padding: 12px 13px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          cursor: pointer;
        }

        .nav-item:hover,
        .nav-item.active {
          background: #1d5a3d;
          color: white;
        }

        .sidebar-bottom {
          margin-top: auto;
        }

        .admin-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 5px;
          border-top: 1px solid rgba(255,255,255,.12);
        }

        .profile-avatar {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background: #e9f8ef;
          color: #16804d;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .admin-profile strong {
          display: block;
          font-size: 12px;
        }

        .admin-profile small {
          display: block;
          font-size: 10px;
          color: #8ea99b;
        }

        .logout-btn {
          display: block;
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          background: #9d3030;
          color: white;
          text-decoration: none;
          text-align: center;
          font-weight: bold;
          font-size: 12px;
        }

        .officer-main {
          margin-left: 245px;
          width: calc(100% - 245px);
          padding: 25px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 15px;
        }

        .page-header h1 {
          margin: 0 0 5px;
          color: #173b2a;
          font-size: 27px;
        }

        .page-header p {
          margin: 0;
          color: #718078;
          font-size: 12px;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .refresh-btn,
        .add-btn {
          border: none;
          padding: 11px 15px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: bold;
          font-size: 11px;
        }

        .refresh-btn {
          background: white;
          color: #16804d;
          border: 1px solid #d6e5dc;
        }

        .add-btn {
          background: #16804d;
          color: white;
        }

        .welcome-banner {
          background: linear-gradient(
            120deg,
            #176a46,
            #26945e
          );
          color: white;
          padding: 25px;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .welcome-banner span {
          font-size: 10px;
          font-weight: bold;
          opacity: .8;
        }

        .welcome-banner h2 {
          margin: 8px 0;
          font-size: 24px;
        }

        .welcome-banner p {
          margin: 0;
          font-size: 12px;
          opacity: .9;
        }

        .welcome-icon {
          font-size: 55px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: white;
          border-radius: 13px;
          padding: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,.04);
        }

        .stat-icon {
          font-size: 22px;
          margin-bottom: 9px;
        }

        .stat-card strong {
          display: block;
          font-size: 24px;
          color: #173b2a;
        }

        .stat-card span {
          display: block;
          color: #77847d;
          font-size: 11px;
          margin-top: 4px;
        }

        .active-card {
          border: 1px solid #c9e7d3;
        }

        .inactive-card {
          border: 1px solid #f0d0d0;
        }

        .management-section {
          background: white;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,.04);
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 17px;
        }

        .section-heading h2 {
          margin: 0;
          color: #173b2a;
          font-size: 18px;
        }

        .section-heading p {
          margin: 4px 0 0;
          color: #7b8881;
          font-size: 11px;
        }

        .count-badge {
          background: #e8f5ed;
          color: #16804d;
          padding: 7px 11px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: bold;
        }

        .search-box {
          display: flex;
          gap: 8px;
          margin-bottom: 15px;
        }

        .search-box input {
          flex: 1;
          border: 1px solid #d8e5dd;
          background: #fbfdfc;
          padding: 12px 14px;
          border-radius: 9px;
          outline: none;
          font-size: 12px;
        }

        .search-box button {
          border: none;
          background: #edf3ef;
          color: #4d5d54;
          padding: 10px 15px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: bold;
        }

        .table-wrapper {
          overflow-x: auto;
          border: 1px solid #e2ebe5;
          border-radius: 11px;
        }

        table {
          width: 100%;
          min-width: 1050px;
          border-collapse: collapse;
        }

        th {
          background: #f1f8f4;
          color: #405148;
          font-size: 10px;
          text-align: left;
          padding: 12px 10px;
          border-bottom: 1px solid #dce9e1;
        }

        td {
          padding: 12px 10px;
          border-bottom: 1px solid #edf1ee;
          font-size: 10px;
          color: #425249;
          vertical-align: middle;
        }

        .officer-cell {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .officer-avatar {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          background: #eaf6ef;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .officer-cell strong {
          display: block;
          color: #263d32;
          font-size: 11px;
        }

        .officer-cell small {
          display: block;
          color: #7b8881;
          font-size: 9px;
          margin-top: 3px;
        }

        .username {
          background: #eef5ff;
          color: #2864b7;
          padding: 5px 8px;
          border-radius: 12px;
          font-weight: bold;
          font-size: 9px;
        }

        .status-active,
        .status-inactive {
          border: none;
          padding: 6px 9px;
          border-radius: 15px;
          font-size: 9px;
          font-weight: bold;
          cursor: pointer;
        }

        .status-active {
          background: #e4f6ea;
          color: #16804d;
        }

        .status-inactive {
          background: #ffe8e8;
          color: #c62828;
        }

        .actions {
          display: flex;
          gap: 5px;
        }

        .edit-btn,
        .delete-btn {
          border: none;
          padding: 7px 9px;
          border-radius: 7px;
          font-size: 9px;
          font-weight: bold;
          cursor: pointer;
        }

        .edit-btn {
          background: #e8f1ff;
          color: #2864b7;
        }

        .delete-btn {
          background: #ffe8e8;
          color: #c62828;
        }

        .loading-box,
        .empty-box {
          text-align: center;
          padding: 45px 15px;
          color: #75827b;
        }

        .empty-box > div {
          font-size: 40px;
        }

        .empty-box h3 {
          color: #35483e;
          margin: 9px 0 4px;
          font-size: 16px;
        }

        .empty-box p {
          font-size: 11px;
          margin-bottom: 15px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }

        .form-modal {
          width: 100%;
          max-width: 720px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 17px;
          box-shadow: 0 20px 60px rgba(0,0,0,.25);
        }

        .modal-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #edf1ee;
        }

        .modal-tag {
          color: #16804d;
          background: #e8f5ed;
          padding: 5px 8px;
          border-radius: 15px;
          font-size: 9px;
          font-weight: bold;
        }

        .modal-header h2 {
          margin: 10px 0 0;
          color: #173b2a;
          font-size: 21px;
        }

        .close-btn {
          width: 34px;
          height: 34px;
          border: none;
          background: #f1f4f2;
          color: #526159;
          border-radius: 50%;
          cursor: pointer;
        }

        .form-body {
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 13px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          color: #405148;
          font-size: 10px;
          font-weight: bold;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          border: 1px solid #d8e5dd;
          background: #fbfdfc;
          padding: 11px 12px;
          border-radius: 8px;
          outline: none;
          font-size: 11px;
        }

        .form-group input:focus,
        .form-group select:focus {
          border-color: #16804d;
          background: white;
        }

        .automatic-field {
          background: #f1f5f3 !important;
          color: #7b8881;
          font-weight: 600;
        }

        .automatic-field.selected {
          background: #e8f5ed !important;
          color: #16804d;
          border-color: #a8d5b9 !important;
        }

        .auto-help {
          color: #7b8881;
          font-size: 9px;
        }

        .form-footer {
          border-top: 1px solid #edf1ee;
          padding: 15px 20px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .cancel-btn,
        .save-btn {
          border: none;
          padding: 10px 17px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-size: 11px;
        }

        .cancel-btn {
          background: #edf2ef;
          color: #526159;
        }

        .save-btn {
          background: #16804d;
          color: white;
        }

        .save-btn:disabled,
        .cancel-btn:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .page-footer {
          display: flex;
          justify-content: space-between;
          padding: 20px 5px;
          color: #849089;
          font-size: 10px;
        }

        @media(max-width:1100px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media(max-width:700px) {

          .officer-page {
            display: block;
          }

          .officer-sidebar {
            position: relative;
            width: 100%;
            min-height: auto;
          }

          .officer-main {
            margin-left: 0;
            width: 100%;
            padding: 12px;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions button {
            flex: 1;
          }

          .welcome-icon {
            display: none;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .section-heading {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .form-body {
            grid-template-columns: 1fr;
          }

          .search-box {
            flex-direction: column;
          }

          .page-footer {
            flex-direction: column;
            gap: 7px;
          }
        }

      `}</style>

    </div>
  );
}

export default FieldOfficerManagement;