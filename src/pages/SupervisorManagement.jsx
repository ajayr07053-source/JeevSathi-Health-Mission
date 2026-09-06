import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

function SupervisorManagement() {
  // =====================================================
  // STATE
  // =====================================================

  const [supervisors, setSupervisors] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const emptyForm = {
    name: "",
    email: "",
    mobile: "",
    username: "",
    password: "",
    district_id: "",
    block_id: "",
    district: "",
    block: "",
    status: "Active",
  };

  const [form, setForm] = useState(emptyForm);

  // =====================================================
  // LOAD DISTRICTS
  // =====================================================

  const loadDistricts = async () => {
    const { data, error } = await supabase
      .from("districts")
      .select("id, name, state, status")
      .order("name", { ascending: true });

    if (error) {
      console.error("District Error:", error);
      alert(
        "District list load नहीं हो सकी.\n\n" +
          error.message
      );
      return;
    }

    const activeDistricts = (data || []).filter((item) => {
      if (!item.status) return true;

      return (
        String(item.status).toLowerCase() === "active"
      );
    });

    setDistricts(activeDistricts);
  };

  // =====================================================
  // LOAD BLOCKS
  // =====================================================

  const loadBlocks = async () => {
    const { data, error } = await supabase
      .from("blocks")
      .select("id, name, district_id, status")
      .order("name", { ascending: true });

    if (error) {
      console.error("Block Error:", error);
      alert(
        "Block list load नहीं हो सकी.\n\n" +
          error.message
      );
      return;
    }

    const activeBlocks = (data || []).filter((item) => {
      if (!item.status) return true;

      return (
        String(item.status).toLowerCase() === "active"
      );
    });

    setBlocks(activeBlocks);
  };

  // =====================================================
  // LOAD SUPERVISORS
  // =====================================================

  const loadSupervisors = async () => {
    const { data, error } = await supabase
      .from("supervisors")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Supervisor Error:", error);

      alert(
        "Supervisor data load नहीं हो सका.\n\n" +
          error.message
      );

      setSupervisors([]);
      return;
    }

    setSupervisors(data || []);
  };

  // =====================================================
  // LOAD ALL
  // =====================================================

  const loadAll = async () => {
    try {
      setLoading(true);

      await Promise.all([
        loadDistricts(),
        loadBlocks(),
        loadSupervisors(),
      ]);
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
    loadAll();
  }, []);

  // =====================================================
  // RESET
  // =====================================================

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
  };

  // =====================================================
  // OPEN ADD
  // =====================================================

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // GENERAL INPUT
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  };

  // =====================================================
  // DISTRICT CHANGE
  // =====================================================

  const handleDistrictChange = (e) => {
    const districtId = e.target.value;

    const district = districts.find(
      (item) =>
        String(item.id) === String(districtId)
    );

    setForm((old) => ({
      ...old,

      district_id: districtId,

      district: district
        ? district.name
        : "",

      block_id: "",
      block: "",
    }));
  };

  // =====================================================
  // AVAILABLE BLOCKS
  // =====================================================

  const availableBlocks = useMemo(() => {
    if (!form.district_id) {
      return [];
    }

    return blocks.filter(
      (item) =>
        String(item.district_id) ===
        String(form.district_id)
    );
  }, [blocks, form.district_id]);

  // =====================================================
  // BLOCK CHANGE
  // =====================================================

  const handleBlockChange = (e) => {
    const blockId = e.target.value;

    const block = availableBlocks.find(
      (item) =>
        String(item.id) === String(blockId)
    );

    setForm((old) => ({
      ...old,

      block_id: blockId,

      block: block
        ? block.name
        : "",
    }));
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateForm = () => {
    if (!form.name.trim()) {
      alert("Supervisor Name डालें.");
      return false;
    }

    if (!form.email.trim()) {
      alert("Email डालें.");
      return false;
    }

    if (!form.mobile.trim()) {
      alert("Mobile Number डालें.");
      return false;
    }

    if (!form.username.trim()) {
      alert("Username डालें.");
      return false;
    }

    if (!editingId && !form.password.trim()) {
      alert("Password डालें.");
      return false;
    }

    if (!form.district_id) {
      alert("District select करें.");
      return false;
    }

    if (!form.block_id) {
      alert("Block select करें.");
      return false;
    }

    return true;
  };

  // =====================================================
  // SAVE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const dataToSave = {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        username: form.username.trim(),

        district_id: Number(form.district_id),
        block_id: Number(form.block_id),

        district: form.district.trim(),
        block: form.block.trim(),

        status: form.status,
      };

      // Password only when entered
      if (form.password.trim()) {
        dataToSave.password =
          form.password.trim();
      }

      // -----------------------------------------------
      // UPDATE
      // -----------------------------------------------

      if (editingId) {
        const { error } = await supabase
          .from("supervisors")
          .update(dataToSave)
          .eq("id", editingId);

        if (error) {
          throw error;
        }

        alert(
          "✅ Supervisor successfully updated."
        );
      }

      // -----------------------------------------------
      // INSERT
      // -----------------------------------------------

      else {
        const { error } = await supabase
          .from("supervisors")
          .insert([dataToSave]);

        if (error) {
          throw error;
        }

        alert(
          "✅ Supervisor successfully created."
        );
      }

      resetForm();

      await loadSupervisors();
    } catch (error) {
      console.error(
        "SUPERVISOR SAVE ERROR:",
        error
      );

      alert(
        "❌ Supervisor save नहीं हो सका.\n\n" +
          error.message
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // EDIT
  // =====================================================

  const editSupervisor = (supervisor) => {
    setEditingId(supervisor.id);

    setForm({
      name: supervisor.name || "",
      email: supervisor.email || "",
      mobile: supervisor.mobile || "",
      username: supervisor.username || "",

      // Security:
      // Password blank रहेगा
      password: "",

      district_id:
        supervisor.district_id != null
          ? String(supervisor.district_id)
          : "",

      block_id:
        supervisor.block_id != null
          ? String(supervisor.block_id)
          : "",

      district: supervisor.district || "",
      block: supervisor.block || "",

      status:
        supervisor.status || "Active",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // DELETE
  // =====================================================

  const deleteSupervisor = async (supervisor) => {
    const ok = window.confirm(
      `क्या आप "${supervisor.name}" को delete करना चाहते हैं?`
    );

    if (!ok) {
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("supervisors")
        .delete()
        .eq("id", supervisor.id);

      if (error) {
        throw error;
      }

      alert(
        "🗑️ Supervisor successfully deleted."
      );

      await loadSupervisors();
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

  const toggleStatus = async (supervisor) => {
    const active =
      String(
        supervisor.status || ""
      ).toLowerCase() === "active";

    const newStatus = active
      ? "Inactive"
      : "Active";

    try {
      setSaving(true);

      const { error } = await supabase
        .from("supervisors")
        .update({
          status: newStatus,
        })
        .eq("id", supervisor.id);

      if (error) {
        throw error;
      }

      await loadSupervisors();
    } catch (error) {
      console.error(error);

      alert(
        "❌ Status update नहीं हो सका.\n\n" +
          error.message
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredSupervisors = useMemo(() => {
    const q = search
      .trim()
      .toLowerCase();

    if (!q) {
      return supervisors;
    }

    return supervisors.filter((item) => {
      return (
        String(item.name || "")
          .toLowerCase()
          .includes(q) ||

        String(item.email || "")
          .toLowerCase()
          .includes(q) ||

        String(item.mobile || "")
          .toLowerCase()
          .includes(q) ||

        String(item.username || "")
          .toLowerCase()
          .includes(q) ||

        String(item.district || "")
          .toLowerCase()
          .includes(q) ||

        String(item.block || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [supervisors, search]);

  // =====================================================
  // COUNTS
  // =====================================================

  const activeCount = supervisors.filter(
    (item) =>
      String(
        item.status || ""
      ).toLowerCase() === "active"
  ).length;

  const inactiveCount =
    supervisors.length - activeCount;

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="supervisor-page">

      {/* HEADER */}
      <div className="top-header">

        <div>
          <div className="logo-text">
            🌿 JeevSathi
          </div>

          <h1>
            👑 Supervisor Management
          </h1>

          <p>
            Supervisor और Area Management
          </p>
        </div>

        <div className="header-buttons">

          <Link
            to="/admin-dashboard"
            className="dashboard-btn"
          >
            ← Dashboard
          </Link>

          <button
            type="button"
            className="add-button"
            onClick={openAddForm}
          >
            ➕ Add Supervisor
          </button>

        </div>

      </div>

      {/* FORM */}
      {showForm && (
        <div className="card form-card">

          <div className="card-title-row">

            <div>
              <h2>
                {editingId
                  ? "✏️ Edit Supervisor"
                  : "➕ Create Supervisor"}
              </h2>

              <p>
                Login और District / Block details
              </p>
            </div>

            <button
              type="button"
              className="close-btn"
              onClick={resetForm}
              disabled={saving}
            >
              ✕
            </button>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-grid">

              {/* NAME */}
              <div className="field">
                <label>
                  Supervisor Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Supervisor Name"
                />
              </div>

              {/* EMAIL */}
              <div className="field">
                <label>
                  Email *
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="supervisor@email.com"
                />
              </div>

              {/* MOBILE */}
              <div className="field">
                <label>
                  Mobile Number *
                </label>

                <input
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="10 digit mobile"
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>

              {/* USERNAME */}
              <div className="field">
                <label>
                  Username *
                </label>

                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Supervisor Username"
                />
              </div>

              {/* PASSWORD */}
              <div className="field">
                <label>
                  Password {!editingId && "*"}
                </label>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    editingId
                      ? "Blank = old password"
                      : "Create password"
                  }
                />
              </div>

              {/* DISTRICT */}
              <div className="field">
                <label>
                  District *
                </label>

                <select
                  value={form.district_id}
                  onChange={handleDistrictChange}
                >

                  <option value="">
                    -- Select District --
                  </option>

                  {districts.map((district) => (
                    <option
                      key={district.id}
                      value={district.id}
                    >
                      {district.name}
                    </option>
                  ))}

                </select>
              </div>

              {/* BLOCK */}
              <div className="field">
                <label>
                  Block *
                </label>

                <select
                  value={form.block_id}
                  onChange={handleBlockChange}
                  disabled={
                    !form.district_id
                  }
                >

                  <option value="">
                    {!form.district_id
                      ? "-- पहले District चुनें --"
                      : "-- Select Block --"}
                  </option>

                  {availableBlocks.map(
                    (block) => (
                      <option
                        key={block.id}
                        value={block.id}
                      >
                        {block.name}
                      </option>
                    )
                  )}

                </select>

                {form.district_id &&
                  availableBlocks.length === 0 && (
                    <div className="warning">
                      ⚠️ इस District के लिए Block नहीं मिला।
                    </div>
                  )}
              </div>

              {/* STATUS */}
              <div className="field">
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

            <div className="form-actions">

              <button
                type="button"
                className="cancel-btn"
                onClick={resetForm}
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
                  : editingId
                  ? "💾 Update Supervisor"
                  : "✅ Create Supervisor"}
              </button>

            </div>

          </form>
        </div>
      )}

      {/* STATS */}
      <div className="stats-grid">

        <div className="stat-card">
          <span>👑</span>
          <strong>
            {supervisors.length}
          </strong>
          <small>
            Total Supervisors
          </small>
        </div>

        <div className="stat-card">
          <span>🟢</span>
          <strong>
            {activeCount}
          </strong>
          <small>
            Active
          </small>
        </div>

        <div className="stat-card">
          <span>🔴</span>
          <strong>
            {inactiveCount}
          </strong>
          <small>
            Inactive
          </small>
        </div>

        <div className="stat-card">
          <span>📍</span>
          <strong>
            {districts.length}
          </strong>
          <small>
            Districts
          </small>
        </div>

      </div>

      {/* LIST */}
      <div className="card">

        <div className="list-header">

          <div>
            <h2>
              👑 Supervisor List
            </h2>

            <p>
              सभी registered supervisors
            </p>
          </div>

          <button
            type="button"
            className="refresh-btn"
            onClick={loadAll}
            disabled={loading}
          >
            🔄 Refresh
          </button>

        </div>

        {/* SEARCH */}
        <div className="search-box">

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="🔍 Name, Mobile, Username, District, Block..."
          />

        </div>

        {/* LOADING */}
        {loading ? (
          <div className="message">
            ⏳ Loading...
          </div>
        ) : filteredSupervisors.length === 0 ? (
          <div className="message">

            <div className="big-icon">
              👑
            </div>

            <h3>
              No Supervisor Found
            </h3>

            <button
              type="button"
              className="add-button"
              onClick={openAddForm}
            >
              ➕ Add Supervisor
            </button>

          </div>
        ) : (
          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>Supervisor</th>
                  <th>Contact</th>
                  <th>Username</th>
                  <th>District</th>
                  <th>Block</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredSupervisors.map(
                  (supervisor) => {

                    const active =
                      String(
                        supervisor.status || ""
                      ).toLowerCase() ===
                      "active";

                    return (
                      <tr
                        key={
                          supervisor.id
                        }
                      >

                        <td>
                          <div className="person">
                            <div className="avatar">
                              👑
                            </div>

                            <div>
                              <strong>
                                {
                                  supervisor.name ||
                                  "-"
                                }
                              </strong>

                              <small>
                                ID:{" "}
                                {
                                  supervisor.id
                                }
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <strong>
                            {
                              supervisor.mobile ||
                              "-"
                            }
                          </strong>

                          <small>
                            {
                              supervisor.email ||
                              "-"
                            }
                          </small>
                        </td>

                        <td>
                          <span className="username">
                            {
                              supervisor.username ||
                              "-"
                            }
                          </span>
                        </td>

                        <td>
                          <span className="district-tag">
                            📍{" "}
                            {
                              supervisor.district ||
                              "-"
                            }
                          </span>
                        </td>

                        <td>
                          <span className="block-tag">
                            🏘️{" "}
                            {
                              supervisor.block ||
                              "-"
                            }
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={
                              active
                                ? "status-active"
                                : "status-inactive"
                            }
                            onClick={() =>
                              toggleStatus(
                                supervisor
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
                              type="button"
                              className="edit-btn"
                              onClick={() =>
                                editSupervisor(
                                  supervisor
                                )
                              }
                            >
                              ✏️ Edit
                            </button>

                            <button
                              type="button"
                              className="delete-btn"
                              onClick={() =>
                                deleteSupervisor(
                                  supervisor
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

      </div>

      {/* FOOTER */}
      <div className="footer">
        © 2026 JeevSathi Health Mission
      </div>

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

        .supervisor-page {
          min-height: 100vh;
          padding: 25px;
          background: #f3f8f5;
        }

        .top-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 22px;
        }

        .logo-text {
          color: #16804d;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .top-header h1 {
          margin: 0;
          color: #173b2a;
          font-size: 27px;
        }

        .top-header p {
          margin: 5px 0 0;
          color: #718078;
          font-size: 12px;
        }

        .header-buttons {
          display: flex;
          gap: 9px;
        }

        .dashboard-btn,
        .add-button {
          padding: 11px 15px;
          border-radius: 9px;
          border: none;
          text-decoration: none;
          font-size: 11px;
          font-weight: bold;
          cursor: pointer;
        }

        .dashboard-btn {
          background: white;
          color: #405148;
          border: 1px solid #dce8e1;
        }

        .add-button {
          background: #16804d;
          color: white;
        }

        .add-button:hover {
          background: #126b40;
        }

        .card {
          background: white;
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,.04);
        }

        .card-title-row,
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 18px;
        }

        .card h2 {
          margin: 0;
          color: #173b2a;
          font-size: 18px;
        }

        .card p {
          margin: 5px 0 0;
          color: #7b8881;
          font-size: 11px;
        }

        .close-btn {
          width: 35px;
          height: 35px;
          border: none;
          border-radius: 50%;
          background: #edf2ef;
          cursor: pointer;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .field label {
          display: block;
          margin-bottom: 6px;
          color: #405148;
          font-size: 10px;
          font-weight: bold;
        }

        .field input,
        .field select {
          width: 100%;
          padding: 11px 12px;
          border: 1px solid #d8e5dd;
          border-radius: 8px;
          outline: none;
          background: #fbfdfc;
          font-size: 11px;
        }

        .field input:focus,
        .field select:focus {
          border-color: #16804d;
          background: white;
        }

        .field select:disabled {
          background: #edf2ef;
          cursor: not-allowed;
        }

        .warning {
          margin-top: 5px;
          color: #c47b00;
          font-size: 9px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #edf1ee;
        }

        .cancel-btn,
        .save-btn {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 11px;
          font-weight: bold;
          cursor: pointer;
        }

        .cancel-btn {
          background: #edf2ef;
          color: #526159;
        }

        .save-btn {
          background: #16804d;
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: white;
          padding: 17px;
          border-radius: 13px;
          box-shadow: 0 4px 15px rgba(0,0,0,.04);
        }

        .stat-card span {
          display: block;
          font-size: 21px;
          margin-bottom: 7px;
        }

        .stat-card strong {
          display: block;
          color: #173b2a;
          font-size: 24px;
        }

        .stat-card small {
          color: #77847d;
          font-size: 10px;
        }

        .refresh-btn {
          border: none;
          background: #e8f5ed;
          color: #16804d;
          padding: 9px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .search-box {
          margin-bottom: 15px;
        }

        .search-box input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #d8e5dd;
          border-radius: 9px;
          outline: none;
          font-size: 11px;
        }

        .table-container {
          overflow-x: auto;
          border: 1px solid #e2ebe5;
          border-radius: 10px;
        }

        table {
          width: 100%;
          min-width: 1050px;
          border-collapse: collapse;
        }

        th {
          background: #f1f8f4;
          padding: 12px;
          text-align: left;
          color: #405148;
          font-size: 10px;
        }

        td {
          padding: 12px;
          border-top: 1px solid #edf1ee;
          color: #405148;
          font-size: 10px;
          vertical-align: middle;
        }

        td strong {
          display: block;
          font-size: 11px;
        }

        td small {
          display: block;
          margin-top: 3px;
          color: #7b8881;
          font-size: 9px;
        }

        .person {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .avatar {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          background: #eaf6ef;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .username,
        .district-tag,
        .block-tag {
          display: inline-block;
          padding: 6px 8px;
          border-radius: 7px;
          font-size: 9px;
          font-weight: bold;
        }

        .username {
          background: #eef5ff;
          color: #2864b7;
        }

        .district-tag {
          background: #eef8f2;
          color: #16804d;
        }

        .block-tag {
          background: #fff6e7;
          color: #9b681b;
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

        .message {
          text-align: center;
          padding: 50px 20px;
          color: #75827b;
        }

        .message h3 {
          color: #35483e;
          margin: 8px 0 15px;
        }

        .big-icon {
          font-size: 40px;
        }

        .footer {
          text-align: center;
          padding: 20px;
          color: #849089;
          font-size: 10px;
        }

        @media(max-width: 1000px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media(max-width: 700px) {

          .supervisor-page {
            padding: 12px;
          }

          .top-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-buttons {
            width: 100%;
          }

          .dashboard-btn,
          .add-button {
            flex: 1;
            text-align: center;
          }

          .form-grid,
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions button {
            width: 100%;
          }

        }

      `}</style>
    </div>
  );
}

export default SupervisorManagement;