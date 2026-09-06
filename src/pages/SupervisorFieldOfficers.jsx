import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

// =====================================================
// JEEVSATHI HEALTH MISSION
// SUPERVISOR - FIELD OFFICERS MANAGEMENT
// =====================================================
// ✅ No App.css import
// ✅ All CSS included inside this file
// ✅ Supabase connected
// ✅ Block-wise Field Officer filtering
// ✅ Search
// ✅ Status filter
// ✅ Officer details modal
// ✅ Refresh
// ✅ Responsive design
// =====================================================

function SupervisorFieldOfficers() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [supervisor, setSupervisor] = useState(null);
  const [fieldOfficers, setFieldOfficers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedOfficer, setSelectedOfficer] = useState(null);

  // =====================================================
  // GET LOGGED USER
  // =====================================================

  const getLoggedUser = () => {
    try {
      return JSON.parse(
        localStorage.getItem("jeevsathi_logged_user") || "null"
      );
    } catch (error) {
      console.error("Logged user error:", error);
      return null;
    }
  };

  // =====================================================
  // LOAD SUPERVISOR
  // =====================================================

  const loadSupervisor = async () => {
    const loggedUser = getLoggedUser();

    if (!loggedUser) {
      navigate("/login");
      return null;
    }

    let currentSupervisor = {
      ...loggedUser,
    };

    const username =
      loggedUser.username ||
      loggedUser.email ||
      "";

    try {
      const { data, error } = await supabase
        .from("supervisors")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (!error && data) {
        currentSupervisor = {
          ...loggedUser,
          ...data,
        };
      }
    } catch (error) {
      console.error(
        "Supervisor loading error:",
        error
      );
    }

    setSupervisor(currentSupervisor);

    return currentSupervisor;
  };

  // =====================================================
  // LOAD FIELD OFFICERS
  // =====================================================

  const loadFieldOfficers = async (
    currentSupervisor
  ) => {
    try {
      if (!currentSupervisor) {
        setFieldOfficers([]);
        return;
      }

      const blockId =
        currentSupervisor.block_id;

      if (!blockId) {
        setFieldOfficers([]);
        return;
      }

      const { data, error } = await supabase
        .from("field_officers")
        .select("*")
        .eq("block_id", blockId)
        .order("id", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Field Officers Error:",
          error
        );

        setFieldOfficers([]);
        return;
      }

      setFieldOfficers(data || []);
    } catch (error) {
      console.error(
        "Field Officer loading error:",
        error
      );

      setFieldOfficers([]);
    }
  };

  // =====================================================
  // LOAD ALL DATA
  // =====================================================

  const loadData = async (
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const currentSupervisor =
        await loadSupervisor();

      if (!currentSupervisor) {
        return;
      }

      await loadFieldOfficers(
        currentSupervisor
      );
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadData(true);
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    const confirmLogout =
      window.confirm(
        "क्या आप Logout करना चाहते हैं?"
      );

    if (!confirmLogout) {
      return;
    }

    localStorage.removeItem(
      "jeevsathi_logged_user"
    );

    navigate("/login");
  };

  // =====================================================
  // STATUS HELPERS
  // =====================================================

  const isActive = (officer) => {
    return (
      String(
        officer?.status || ""
      )
        .trim()
        .toLowerCase() === "active"
    );
  };

  const isInactive = (officer) => {
    return !isActive(officer);
  };

  // =====================================================
  // OFFICER COUNTS
  // =====================================================

  const totalOfficers =
    fieldOfficers.length;

  const activeOfficers =
    fieldOfficers.filter(
      isActive
    ).length;

  const inactiveOfficers =
    fieldOfficers.filter(
      isInactive
    ).length;

  // =====================================================
  // FILTERED OFFICERS
  // =====================================================

  const filteredOfficers = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return fieldOfficers.filter(
      (officer) => {
        const officerName = String(
          officer?.name || ""
        ).toLowerCase();

        const username = String(
          officer?.username || ""
        ).toLowerCase();

        const mobile = String(
          officer?.mobile ||
            officer?.phone ||
            officer?.mobile_number ||
            ""
        ).toLowerCase();

        const officerId = String(
          officer?.id || ""
        ).toLowerCase();

        const status = String(
          officer?.status || ""
        ).toLowerCase();

        const matchesSearch =
          !searchText ||
          officerName.includes(searchText) ||
          username.includes(searchText) ||
          mobile.includes(searchText) ||
          officerId.includes(searchText);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" &&
            status === "active") ||
          (statusFilter === "inactive" &&
            status !== "active");

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    fieldOfficers,
    search,
    statusFilter,
  ]);

  // =====================================================
  // DISPLAY HELPERS
  // =====================================================

  const getOfficerName = (officer) => {
    return (
      officer?.name ||
      officer?.full_name ||
      officer?.username ||
      "Field Officer"
    );
  };

  const getMobile = (officer) => {
    return (
      officer?.mobile ||
      officer?.phone ||
      officer?.mobile_number ||
      "-"
    );
  };

  const getEmail = (officer) => {
    return (
      officer?.email ||
      "-"
    );
  };

  const getVillage = (officer) => {
    return (
      officer?.village_name ||
      officer?.village ||
      "-"
    );
  };

  const getBlock = (officer) => {
    return (
      officer?.block_name ||
      officer?.block ||
      supervisor?.block_name ||
      supervisor?.block ||
      "-"
    );
  };

  const getDistrict = (officer) => {
    return (
      officer?.district_name ||
      officer?.district ||
      supervisor?.district_name ||
      supervisor?.district ||
      "-"
    );
  };

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    try {
      return new Date(
        date
      ).toLocaleDateString(
        "en-IN"
      );
    } catch {
      return "-";
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="field-officer-page">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        {/* LOGO */}

        <div className="logo-area">

          <div className="logo-circle">
            🌿
          </div>

          <div>
            <h2>
              JeevSathi
            </h2>

            <span>
              Health Mission
            </span>
          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="sidebar-nav">

          <Link
            to="/supervisor-dashboard"
            className="nav-link"
          >
            🏠
            <span>
              Dashboard
            </span>
          </Link>

          <Link
            to="/supervisor-field-officers"
            className="nav-link active"
          >
            👨‍💼
            <span>
              Field Officers
            </span>
          </Link>

          <Link
            to="/camp-management"
            className="nav-link"
          >
            🏕️
            <span>
              Camp Management
            </span>
          </Link>

          <Link
            to="/camp-patients"
            className="nav-link"
          >
            👥
            <span>
              Camp Patients
            </span>
          </Link>

          <Link
            to="/health-card"
            className="nav-link"
          >
            💳
            <span>
              Health Cards
            </span>
          </Link>

          <Link
            to="/verify-card"
            className="nav-link"
          >
            🔍
            <span>
              Verify Card
            </span>
          </Link>

        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">

          <div className="sidebar-user">

            <div className="user-avatar">
              👨‍💼
            </div>

            <div>

              <strong>
                {supervisor?.name ||
                  "Supervisor"}
              </strong>

              <small>
                Block Supervisor
              </small>

            </div>

          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            🚪 Logout
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="main-content">

        {/* HEADER */}

        <header className="top-header">

          <div>

            <div className="breadcrumb">
              Supervisor Portal
              <span>›</span>
              Field Officers
            </div>

            <h1>
              👨‍💼 Field Officers
            </h1>

            <p>
              अपने assigned Block के
              Field Officers manage करें।
            </p>

          </div>

          <div className="header-profile">

            <div className="header-avatar">
              👨‍💼
            </div>

            <div>

              <strong>
                {supervisor?.name ||
                  "Supervisor"}
              </strong>

              <small>
                {supervisor?.username ||
                  "Block Supervisor"}
              </small>

            </div>

          </div>

        </header>

        {/* =================================================
            WELCOME BANNER
        ================================================= */}

        <section className="welcome-banner">

          <div className="welcome-icon">
            👨‍💼
          </div>

          <div className="welcome-content">

            <span>
              BLOCK FIELD OFFICER MANAGEMENT
            </span>

            <h2>
              {supervisor?.name
                ? `Welcome, ${supervisor.name}`
                : "Welcome, Supervisor"}
            </h2>

            <p>
              केवल आपके assigned Block के
              Field Officers यहाँ दिखाई देंगे।
            </p>

          </div>

          <div className="location-box">

            <div>
              <small>
                DISTRICT
              </small>

              <strong>
                {supervisor?.district_name ||
                  supervisor?.district ||
                  "Lakhimpur Kheri"}
              </strong>
            </div>

            <div>
              <small>
                BLOCK
              </small>

              <strong>
                {supervisor?.block_name ||
                  supervisor?.block ||
                  "Mitauli"}
              </strong>
            </div>

          </div>

        </section>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="loading-box">
            <div className="loading-spinner">
              ⏳
            </div>

            <div>
              <strong>
                Field Officers Loading...
              </strong>

              <span>
                Supabase से data लाया जा रहा है।
              </span>
            </div>
          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <section className="stats-grid">

          {/* TOTAL */}

          <div className="stats-card total">

            <div className="stats-icon">
              👨‍💼
            </div>

            <div>

              <span>
                Total Field Officers
              </span>

              <strong>
                {totalOfficers}
              </strong>

              <small>
                आपके Block में
              </small>

            </div>

          </div>

          {/* ACTIVE */}

          <div className="stats-card active">

            <div className="stats-icon">
              🟢
            </div>

            <div>

              <span>
                Active Officers
              </span>

              <strong>
                {activeOfficers}
              </strong>

              <small>
                Currently Active
              </small>

            </div>

          </div>

          {/* INACTIVE */}

          <div className="stats-card inactive">

            <div className="stats-icon">
              🔴
            </div>

            <div>

              <span>
                Inactive Officers
              </span>

              <strong>
                {inactiveOfficers}
              </strong>

              <small>
                Need Attention
              </small>

            </div>

          </div>

          {/* BLOCK */}

          <div className="stats-card block">

            <div className="stats-icon">
              📍
            </div>

            <div>

              <span>
                Assigned Block
              </span>

              <strong className="block-name">
                {supervisor?.block_name ||
                  supervisor?.block ||
                  "Mitauli"}
              </strong>

              <small>
                Supervisor Area
              </small>

            </div>

          </div>

        </section>

        {/* =================================================
            OFFICER SECTION
        ================================================= */}

        <section className="officer-section">

          {/* SECTION HEADER */}

          <div className="section-header">

            <div>

              <div className="section-title-row">

                <div className="section-title-icon">
                  👨‍💼
                </div>

                <div>

                  <h2>
                    My Field Officers
                  </h2>

                  <p>
                    आपके Block में assigned
                    Field Officers की सूची
                  </p>

                </div>

              </div>

            </div>

            <button
              className="refresh-button"
              onClick={() =>
                loadData(false)
              }
              disabled={refreshing}
            >
              {refreshing
                ? "⏳ Loading..."
                : "🔄 Refresh"}
            </button>

          </div>

          {/* =================================================
              SEARCH + FILTER
          ================================================= */}

          <div className="toolbar">

            <div className="search-box">

              <span>
                🔍
              </span>

              <input
                type="text"
                placeholder="Name, ID, Mobile या Username से खोजें..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              {search && (
                <button
                  onClick={() =>
                    setSearch("")
                  }
                >
                  ✕
                </button>
              )}

            </div>

            <div className="filter-buttons">

              <button
                className={
                  statusFilter === "all"
                    ? "filter-button selected"
                    : "filter-button"
                }
                onClick={() =>
                  setStatusFilter("all")
                }
              >
                👥 All
                <span>
                  {totalOfficers}
                </span>
              </button>

              <button
                className={
                  statusFilter === "active"
                    ? "filter-button active-filter"
                    : "filter-button"
                }
                onClick={() =>
                  setStatusFilter("active")
                }
              >
                🟢 Active
                <span>
                  {activeOfficers}
                </span>
              </button>

              <button
                className={
                  statusFilter === "inactive"
                    ? "filter-button inactive-filter"
                    : "filter-button"
                }
                onClick={() =>
                  setStatusFilter("inactive")
                }
              >
                🔴 Inactive
                <span>
                  {inactiveOfficers}
                </span>
              </button>

            </div>

          </div>

          {/* =================================================
              RESULT INFO
          ================================================= */}

          <div className="result-info">

            <span>
              Showing{" "}
              <strong>
                {filteredOfficers.length}
              </strong>{" "}
              of{" "}
              <strong>
                {totalOfficers}
              </strong>{" "}
              Field Officers
            </span>

            {(search ||
              statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters ✕
              </button>
            )}

          </div>

          {/* =================================================
              OFFICER LIST
          ================================================= */}

          {filteredOfficers.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                👨‍💼
              </div>

              <h3>
                {fieldOfficers.length === 0
                  ? "No Field Officers Found"
                  : "No Matching Officers"}
              </h3>

              <p>
                {fieldOfficers.length === 0
                  ? "इस Block में अभी कोई Field Officer उपलब्ध नहीं है।"
                  : "आपकी search या filter के अनुसार कोई officer नहीं मिला।"}
              </p>

              {fieldOfficers.length > 0 && (
                <button
                  className="clear-button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  🔄 Reset Filters
                </button>
              )}

            </div>

          ) : (

            <div className="officer-grid">

              {filteredOfficers.map(
                (officer, index) => {

                  const active =
                    isActive(officer);

                  return (
                    <div
                      className="officer-card"
                      key={
                        officer.id ||
                        index
                      }
                    >

                      {/* TOP */}

                      <div className="officer-card-top">

                        <div className="big-avatar">
                          👨‍💼
                        </div>

                        <div
                          className={
                            active
                              ? "status-pill active"
                              : "status-pill inactive"
                          }
                        >
                          {active
                            ? "🟢 Active"
                            : "🔴 Inactive"}
                        </div>

                      </div>

                      {/* NAME */}

                      <div className="officer-name">

                        <h3>
                          {getOfficerName(
                            officer
                          )}
                        </h3>

                        <span>
                          Officer ID:{" "}
                          <strong>
                            {officer.id ||
                              "-"}
                          </strong>
                        </span>

                      </div>

                      {/* DETAILS */}

                      <div className="officer-details">

                        <div className="detail-row">

                          <span>
                            📱
                          </span>

                          <div>
                            <small>
                              Mobile
                            </small>

                            <strong>
                              {getMobile(
                                officer
                              )}
                            </strong>
                          </div>

                        </div>

                        <div className="detail-row">

                          <span>
                            👤
                          </span>

                          <div>
                            <small>
                              Username
                            </small>

                            <strong>
                              {officer.username ||
                                "-"}
                            </strong>
                          </div>

                        </div>

                        <div className="detail-row">

                          <span>
                            📍
                          </span>

                          <div>
                            <small>
                              Block
                            </small>

                            <strong>
                              {getBlock(
                                officer
                              )}
                            </strong>
                          </div>

                        </div>

                      </div>

                      {/* FOOTER */}

                      <div className="officer-card-footer">

                        <button
                          className="view-button"
                          onClick={() =>
                            setSelectedOfficer(
                              officer
                            )
                          }
                        >
                          👁️ View Details
                        </button>

                        <span className="officer-number">
                          #{index + 1}
                        </span>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>

        {/* =================================================
            SECURITY NOTICE
        ================================================= */}

        <section className="security-notice">

          <div className="security-icon">
            🔒
          </div>

          <div>

            <strong>
              Block-Level Data Security
            </strong>

            <p>
              यह page केवल Supervisor के assigned
              Block के Field Officers दिखाता है।
              दूसरे Blocks का data यहाँ उपलब्ध नहीं होगा।
              सभी Blocks का complete management केवल
              Admin Portal से किया जाएगा।
            </p>

          </div>

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="page-footer">

          <span>
            © 2026 JeevSathi Health Mission
          </span>

          <span>
            Supervisor Portal • Supabase Connected
          </span>

        </footer>

      </main>

      {/* =================================================
          OFFICER DETAILS MODAL
      ================================================= */}

      {selectedOfficer && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedOfficer(null)
          }
        >

          <div
            className="officer-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="modal-header">

              <div className="modal-title-area">

                <div className="modal-big-avatar">
                  👨‍💼
                </div>

                <div>

                  <h2>
                    {getOfficerName(
                      selectedOfficer
                    )}
                  </h2>

                  <p>
                    Field Officer ID:{" "}
                    {selectedOfficer.id ||
                      "-"}
                  </p>

                </div>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedOfficer(null)
                }
              >
                ✕
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="modal-body">

              {/* STATUS */}

              <div
                className={
                  isActive(
                    selectedOfficer
                  )
                    ? "modal-status active"
                    : "modal-status inactive"
                }
              >
                {isActive(
                  selectedOfficer
                )
                  ? "🟢 Officer is Active"
                  : "🔴 Officer is Inactive"}
              </div>

              {/* DETAILS GRID */}

              <div className="modal-grid">

                <div className="modal-detail">

                  <span>
                    👤 Full Name
                  </span>

                  <strong>
                    {getOfficerName(
                      selectedOfficer
                    )}
                  </strong>

                </div>

                <div className="modal-detail">

                  <span>
                    🆔 Officer ID
                  </span>

                  <strong>
                    {selectedOfficer.id ||
                      "-"}
                  </strong>

                </div>

                <div className="modal-detail">

                  <span>
                    🔑 Username
                  </span>

                  <strong>
                    {selectedOfficer.username ||
                      "-"}
                  </strong>

                </div>

                <div className="modal-detail">

                  <span>
                    📱 Mobile Number
                  </span>

                  <strong>
                    {getMobile(
                      selectedOfficer
                    )}
                  </strong>

                </div>

                <div className="modal-detail">

                  <span>
                    📧 Email
                  </span>

                  <strong>
                    {getEmail(
                      selectedOfficer
                    )}
                  </strong>

                </div>

                <div className="modal-detail">

                  <span>
                    📍 District
                  </span>

                  <strong>
                    {getDistrict(
                      selectedOfficer
                    )}
                  </strong>

                </div>

                <div className="modal-detail">

                  <span>
                    🏘️ Block
                  </span>

                  <strong>
                    {getBlock(
                      selectedOfficer
                    )}
                  </strong>

                </div>

                <div className="modal-detail">

                  <span>
                    🏡 Village
                  </span>

                  <strong>
                    {getVillage(
                      selectedOfficer
                    )}
                  </strong>

                </div>

                <div className="modal-detail">

                  <span>
                    📅 Created
                  </span>

                  <strong>
                    {formatDate(
                      selectedOfficer.created_at
                    )}
                  </strong>

                </div>

                <div className="modal-detail">

                  <span>
                    ⚡ Status
                  </span>

                  <strong>
                    {selectedOfficer.status ||
                      "Inactive"}
                  </strong>

                </div>

              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="modal-footer">

              <button
                className="modal-close-button"
                onClick={() =>
                  setSelectedOfficer(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          COMPLETE CSS
      ================================================= */}

      <style>{`

        /* =================================================
           GLOBAL
        ================================================= */

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          background: #f3f8f5;
        }

        button,
        input {
          font-family: inherit;
        }

        a {
          text-decoration: none;
        }

        /* =================================================
           PAGE
        ================================================= */

        .field-officer-page {
          min-height: 100vh;
          background:
            linear-gradient(
              135deg,
              #f1f8f4 0%,
              #f8fbf9 50%,
              #eef7f2 100%
            );
          color: #193b2b;
        }

        /* =================================================
           SIDEBAR
        ================================================= */

        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 245px;
          background:
            linear-gradient(
              180deg,
              #0d3b28,
              #145638,
              #0b3021
            );
          color: white;
          padding: 20px 14px;
          display: flex;
          flex-direction: column;
          z-index: 100;
          box-shadow:
            5px 0 25px rgba(0,0,0,.08);
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 8px;
          margin-bottom: 25px;
        }

        .logo-circle {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow:
            0 5px 15px rgba(0,0,0,.12);
        }

        .logo-area h2 {
          margin: 0;
          font-size: 20px;
          letter-spacing: .3px;
        }

        .logo-area span {
          display: block;
          color: #b8d9c8;
          font-size: 10px;
          margin-top: 2px;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #d5e8dd;
          padding: 12px 13px;
          border-radius: 10px;
          font-size: 12px;
          transition: .2s ease;
        }

        .nav-link:hover {
          background: rgba(255,255,255,.10);
          color: white;
          transform: translateX(2px);
        }

        .nav-link.active {
          background:
            linear-gradient(
              90deg,
              #23935d,
              #1a7148
            );
          color: white;
          box-shadow:
            0 5px 15px rgba(0,0,0,.12);
        }

        .sidebar-bottom {
          margin-top: auto;
        }

        .sidebar-user {
          border-top:
            1px solid rgba(255,255,255,.12);
          padding: 15px 5px;
          display: flex;
          gap: 9px;
          align-items: center;
        }

        .user-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
        }

        .sidebar-user strong {
          display: block;
          font-size: 11px;
        }

        .sidebar-user small {
          display: block;
          color: #a9c7b7;
          font-size: 9px;
          margin-top: 3px;
        }

        .logout-button {
          width: 100%;
          border: 0;
          background:
            linear-gradient(
              135deg,
              #bd3c3c,
              #8f2929
            );
          color: white;
          padding: 10px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: bold;
          font-size: 11px;
        }

        .logout-button:hover {
          transform: translateY(-1px);
        }

        /* =================================================
           MAIN
        ================================================= */

        .main-content {
          margin-left: 245px;
          padding: 25px;
          width: calc(100% - 245px);
          min-height: 100vh;
        }

        /* =================================================
           HEADER
        ================================================= */

        .top-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .breadcrumb {
          color: #7d8c84;
          font-size: 9px;
          margin-bottom: 6px;
        }

        .breadcrumb span {
          padding: 0 5px;
          color: #1b8a55;
        }

        .top-header h1 {
          margin: 0;
          color: #153b29;
          font-size: 28px;
        }

        .top-header p {
          margin: 5px 0 0;
          color: #718078;
          font-size: 11px;
        }

        .header-profile {
          display: flex;
          align-items: center;
          gap: 9px;
          background: white;
          padding: 9px 13px;
          border-radius: 12px;
          box-shadow:
            0 5px 20px rgba(0,0,0,.05);
        }

        .header-avatar {
          width: 39px;
          height: 39px;
          border-radius: 50%;
          background: #e5f5ec;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .header-profile strong {
          display: block;
          color: #243d31;
          font-size: 10px;
        }

        .header-profile small {
          display: block;
          color: #7a8780;
          font-size: 8px;
          margin-top: 3px;
        }

        /* =================================================
           WELCOME
        ================================================= */

        .welcome-banner {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 20px;
          margin-bottom: 20px;
          color: white;
          border-radius: 17px;
          background:
            radial-gradient(
              circle at 90% 20%,
              rgba(255,255,255,.16),
              transparent 35%
            ),
            linear-gradient(
              120deg,
              #12613e,
              #27945d
            );
          box-shadow:
            0 10px 30px rgba(18,97,62,.15);
        }

        .welcome-icon {
          width: 65px;
          height: 65px;
          border-radius: 16px;
          background:
            rgba(255,255,255,.14);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 31px;
        }

        .welcome-content {
          flex: 1;
        }

        .welcome-content span {
          font-size: 8px;
          opacity: .72;
          font-weight: bold;
          letter-spacing: .5px;
        }

        .welcome-content h2 {
          margin: 5px 0;
          font-size: 21px;
        }

        .welcome-content p {
          margin: 0;
          font-size: 10px;
          opacity: .86;
        }

        .location-box {
          display: flex;
          gap: 9px;
        }

        .location-box > div {
          min-width: 125px;
          padding: 11px;
          border-radius: 10px;
          background:
            rgba(255,255,255,.10);
          border:
            1px solid rgba(255,255,255,.10);
        }

        .location-box small {
          display: block;
          font-size: 7px;
          opacity: .7;
        }

        .location-box strong {
          display: block;
          margin-top: 4px;
          font-size: 11px;
        }

        /* =================================================
           LOADING
        ================================================= */

        .loading-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px;
          margin-bottom: 20px;
          background: white;
          border-radius: 12px;
          border-left: 4px solid #16804d;
          box-shadow:
            0 5px 20px rgba(0,0,0,.04);
        }

        .loading-spinner {
          font-size: 25px;
        }

        .loading-box strong {
          display: block;
          color: #173b2a;
          font-size: 11px;
        }

        .loading-box span {
          display: block;
          color: #7b8881;
          font-size: 9px;
          margin-top: 3px;
        }

        /* =================================================
           STATS
        ================================================= */

        .stats-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }

        .stats-card {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 17px;
          border-radius: 14px;
          background: white;
          border: 1px solid #e1ebe5;
          box-shadow:
            0 6px 22px rgba(0,0,0,.04);
        }

        .stats-card::after {
          content: "";
          position: absolute;
          right: -22px;
          bottom: -25px;
          width: 75px;
          height: 75px;
          border-radius: 50%;
          background: rgba(23,128,77,.05);
        }

        .stats-card.total {
          border-top: 4px solid #16804d;
        }

        .stats-card.active {
          border-top: 4px solid #229954;
        }

        .stats-card.inactive {
          border-top: 4px solid #d83a3a;
        }

        .stats-card.block {
          border-top: 4px solid #e38b12;
        }

        .stats-icon {
          width: 47px;
          height: 47px;
          flex-shrink: 0;
          border-radius: 12px;
          background: #e7f5ed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .stats-card.active .stats-icon {
          background: #e3f7e9;
        }

        .stats-card.inactive .stats-icon {
          background: #ffe9e9;
        }

        .stats-card.block .stats-icon {
          background: #fff1dc;
        }

        .stats-card span {
          display: block;
          color: #78857e;
          font-size: 9px;
        }

        .stats-card strong {
          display: block;
          color: #173b2a;
          font-size: 23px;
          margin-top: 3px;
        }

        .stats-card small {
          display: block;
          color: #9aa59f;
          font-size: 8px;
          margin-top: 3px;
        }

        .stats-card strong.block-name {
          font-size: 15px;
          margin-top: 6px;
        }

        /* =================================================
           OFFICER SECTION
        ================================================= */

        .officer-section {
          background: white;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow:
            0 6px 25px rgba(0,0,0,.04);
          border-top: 4px solid #16804d;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .section-title-row {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .section-title-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          background: #e8f5ed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .section-header h2 {
          margin: 0;
          color: #173b2a;
          font-size: 18px;
        }

        .section-header p {
          margin: 4px 0 0;
          color: #7a8780;
          font-size: 9px;
        }

        .refresh-button {
          border: 0;
          background:
            linear-gradient(
              135deg,
              #16804d,
              #11683f
            );
          color: white;
          padding: 9px 13px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 10px;
          font-weight: bold;
        }

        .refresh-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        /* =================================================
           TOOLBAR
        ================================================= */

        .toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          padding: 13px;
          background: #f7faf8;
          border: 1px solid #e3ebe6;
          border-radius: 12px;
        }

        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 200px;
          background: white;
          border: 1px solid #dce6e0;
          border-radius: 9px;
          padding: 0 10px;
        }

        .search-box > span {
          font-size: 15px;
        }

        .search-box input {
          width: 100%;
          border: 0;
          outline: 0;
          padding: 10px 5px;
          font-size: 10px;
          color: #263d32;
          background: transparent;
        }

        .search-box input::placeholder {
          color: #a0aaa5;
        }

        .search-box button {
          border: 0;
          background: #edf3ef;
          color: #64736b;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
        }

        .filter-buttons {
          display: flex;
          gap: 6px;
        }

        .filter-button {
          border: 1px solid #dce6e0;
          background: white;
          color: #65736c;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 9px;
          font-weight: bold;
        }

        .filter-button span {
          display: inline-block;
          margin-left: 4px;
          padding: 2px 5px;
          border-radius: 10px;
          background: #f0f4f2;
        }

        .filter-button:hover,
        .filter-button.selected {
          background: #16804d;
          color: white;
          border-color: #16804d;
        }

        .filter-button.active-filter {
          background: #e5f6eb;
          color: #16804d;
          border-color: #bce2c9;
        }

        .filter-button.inactive-filter {
          background: #ffeaea;
          color: #c52e2e;
          border-color: #f2c0c0;
        }

        /* =================================================
           RESULT INFO
        ================================================= */

        .result-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 13px;
          color: #7d8983;
          font-size: 9px;
        }

        .result-info strong {
          color: #16804d;
        }

        .result-info button {
          border: 0;
          background: transparent;
          color: #c23b3b;
          cursor: pointer;
          font-size: 9px;
          font-weight: bold;
        }

        /* =================================================
           OFFICER GRID
        ================================================= */

        .officer-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 13px;
        }

        .officer-card {
          background:
            linear-gradient(
              145deg,
              #ffffff,
              #f9fcfa
            );
          border: 1px solid #dfebe4;
          border-radius: 13px;
          padding: 15px;
          transition: .2s ease;
          position: relative;
          overflow: hidden;
        }

        .officer-card:hover {
          transform: translateY(-3px);
          border-color: #86c5a3;
          box-shadow:
            0 10px 25px rgba(23,128,77,.10);
        }

        .officer-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background:
            linear-gradient(
              90deg,
              #16804d,
              #f28c18
            );
        }

        .officer-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .big-avatar {
          width: 53px;
          height: 53px;
          border-radius: 14px;
          background:
            linear-gradient(
              135deg,
              #e3f6eb,
              #d5f0e1
            );
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
        }

        .status-pill {
          padding: 6px 8px;
          border-radius: 20px;
          font-size: 8px;
          font-weight: bold;
        }

        .status-pill.active {
          color: #16804d;
          background: #e3f7e9;
        }

        .status-pill.inactive {
          color: #c42e2e;
          background: #ffe8e8;
        }

        .officer-name {
          margin-top: 12px;
        }

        .officer-name h3 {
          margin: 0;
          color: #263d32;
          font-size: 13px;
        }

        .officer-name span {
          display: block;
          color: #8a9690;
          font-size: 8px;
          margin-top: 4px;
        }

        .officer-name strong {
          color: #16804d;
        }

        .officer-details {
          margin-top: 13px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px;
          background: #f5f9f6;
          border-radius: 8px;
        }

        .detail-row > span {
          width: 25px;
          height: 25px;
          border-radius: 7px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .detail-row small {
          display: block;
          color: #8b9691;
          font-size: 7px;
        }

        .detail-row strong {
          display: block;
          color: #34483e;
          font-size: 9px;
          margin-top: 2px;
          max-width: 170px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .officer-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 13px;
          padding-top: 11px;
          border-top: 1px solid #e8efeb;
        }

        .view-button {
          border: 0;
          background: #16804d;
          color: white;
          padding: 7px 10px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 8px;
          font-weight: bold;
        }

        .view-button:hover {
          background: #116b40;
        }

        .officer-number {
          color: #a0aaa5;
          font-size: 8px;
        }

        /* =================================================
           EMPTY
        ================================================= */

        .empty-state {
          text-align: center;
          padding: 50px 20px;
          border: 1px dashed #d8e5dd;
          border-radius: 12px;
          background: #fbfdfc;
        }

        .empty-icon {
          width: 70px;
          height: 70px;
          margin: auto;
          border-radius: 20px;
          background: #e9f6ee;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        }

        .empty-state h3 {
          margin: 12px 0 5px;
          color: #35483e;
          font-size: 15px;
        }

        .empty-state p {
          margin: 0;
          color: #849089;
          font-size: 9px;
        }

        .clear-button {
          margin-top: 14px;
          border: 0;
          background: #16804d;
          color: white;
          padding: 8px 13px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 9px;
          font-weight: bold;
        }

        /* =================================================
           SECURITY
        ================================================= */

        .security-notice {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 15px;
          background: #fff9e8;
          border: 1px solid #f0e1b5;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .security-icon {
          font-size: 22px;
        }

        .security-notice strong {
          color: #66551d;
          font-size: 11px;
        }

        .security-notice p {
          margin: 5px 0 0;
          color: #806f36;
          font-size: 9px;
          line-height: 1.5;
        }

        /* =================================================
           FOOTER
        ================================================= */

        .page-footer {
          display: flex;
          justify-content: space-between;
          color: #849089;
          font-size: 8px;
          padding: 10px 5px 20px;
        }

        /* =================================================
           MODAL
        ================================================= */

        .modal-overlay {
          position: fixed;
          inset: 0;
          background:
            rgba(7,35,22,.62);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }

        .officer-modal {
          width: 100%;
          max-width: 650px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 18px;
          box-shadow:
            0 25px 80px rgba(0,0,0,.25);
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 20px;
          border-bottom: 1px solid #e5ece8;
          background:
            linear-gradient(
              135deg,
              #f5fbf7,
              #ffffff
            );
        }

        .modal-title-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-big-avatar {
          width: 58px;
          height: 58px;
          border-radius: 15px;
          background: #e2f4e9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 27px;
        }

        .modal-header h2 {
          margin: 0;
          color: #173b2a;
          font-size: 18px;
        }

        .modal-header p {
          margin: 5px 0 0;
          color: #7c8982;
          font-size: 9px;
        }

        .modal-close {
          width: 33px;
          height: 33px;
          border: 0;
          border-radius: 50%;
          background: #eef3f0;
          color: #526159;
          cursor: pointer;
          font-size: 14px;
        }

        .modal-body {
          padding: 20px;
        }

        .modal-status {
          padding: 10px 12px;
          border-radius: 9px;
          font-size: 9px;
          font-weight: bold;
          margin-bottom: 14px;
        }

        .modal-status.active {
          background: #e6f7eb;
          color: #16804d;
        }

        .modal-status.inactive {
          background: #ffe9e9;
          color: #c42e2e;
        }

        .modal-grid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 10px;
        }

        .modal-detail {
          padding: 12px;
          border: 1px solid #e2ebe6;
          border-radius: 9px;
          background: #fbfdfc;
        }

        .modal-detail span {
          display: block;
          color: #7b8881;
          font-size: 8px;
        }

        .modal-detail strong {
          display: block;
          color: #263d32;
          font-size: 10px;
          margin-top: 5px;
          word-break: break-word;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 14px 20px;
          border-top: 1px solid #e5ece8;
        }

        .modal-close-button {
          border: 0;
          background: #16804d;
          color: white;
          padding: 9px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 10px;
          font-weight: bold;
        }

        /* =================================================
           RESPONSIVE
        ================================================= */

        @media (max-width: 1150px) {

          .stats-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .officer-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

        }

        @media (max-width: 850px) {

          .sidebar {
            width: 210px;
          }

          .main-content {
            margin-left: 210px;
            width: calc(100% - 210px);
          }

          .welcome-banner {
            flex-wrap: wrap;
          }

          .location-box {
            width: 100%;
          }

          .toolbar {
            flex-direction: column;
          }

          .filter-buttons {
            flex-wrap: wrap;
          }

        }

        @media (max-width: 700px) {

          .sidebar {
            position: relative;
            width: 100%;
            min-height: auto;
          }

          .main-content {
            margin-left: 0;
            width: 100%;
            padding: 12px;
          }

          .top-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .header-profile {
            width: 100%;
          }

          .welcome-banner {
            flex-direction: column;
            align-items: flex-start;
          }

          .location-box {
            flex-direction: column;
          }

          .location-box > div {
            width: 100%;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .officer-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .refresh-button {
            width: 100%;
          }

          .filter-buttons {
            display: grid;
            grid-template-columns:
              repeat(3, 1fr);
          }

          .filter-button {
            width: 100%;
          }

          .modal-grid {
            grid-template-columns: 1fr;
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

export default SupervisorFieldOfficers;