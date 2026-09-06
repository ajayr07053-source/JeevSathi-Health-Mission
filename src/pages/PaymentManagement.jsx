import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function PaymentManagement() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [loggedUser, setLoggedUser] = useState(null);

  // =====================================================
  // LOAD USER
  // =====================================================

  useEffect(() => {
    const storedUser = localStorage.getItem(
      "jeevsathi_logged_user"
    );

    if (storedUser) {
      try {
        setLoggedUser(JSON.parse(storedUser));
      } catch (err) {
        console.error(err);
      }
    }

    loadPatients();
  }, []);

  // =====================================================
  // LOAD PATIENTS
  // =====================================================

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("camp_patients")
        .select("*")
        .not("health_card_number", "is", null)
        .order("id", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setPatients(data || []);
    } catch (err) {
      console.error("Payment patients error:", err);

      setError(
        err?.message ||
          "Patient data load नहीं हो सका।"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CARD NUMBER
  // =====================================================

  const getCardNumber = (patient) => {
    return (
      patient.health_card_number ||
      `JHM${String(patient.id).padStart(6, "0")}`
    );
  };

  // =====================================================
  // PAYMENT RECEIVED
  // =====================================================

  const markPaymentReceived = async (patient) => {
    const confirmPayment = window.confirm(
      `क्या ₹150 payment receive हो गया है?\n\nPatient: ${
        patient.patient_name
      }\nCard: ${getCardNumber(patient)}`
    );

    if (!confirmPayment) {
      return;
    }

    try {
      setProcessingId(patient.id);
      setError("");
      setSuccess("");

      const userName =
        loggedUser?.name ||
        loggedUser?.username ||
        "Officer";

      const { error: updateError } = await supabase
        .from("camp_patients")
        .update({
          payment_amount: 150,
          payment_status: "RECEIVED",
          payment_received_by: userName,
          payment_received_at: new Date().toISOString(),
          payment_waived: false,
          payment_notes: "Offline payment received",
          supervisor_approval_status: "PENDING",
          admin_approval_status: "PENDING",
          card_status: "PENDING",
        })
        .eq("id", patient.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(
        `Payment received successfully — ${getCardNumber(
          patient
        )}`
      );

      await loadPatients();
    } catch (err) {
      console.error("Payment received error:", err);

      setError(
        err?.message ||
          "Payment update नहीं हो सका।"
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =====================================================
  // PAYMENT WAIVED
  // =====================================================

  const markPaymentWaived = async (patient) => {
    const reason = window.prompt(
      "Payment माफ करने का कारण लिखें:"
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      setError(
        "Payment माफ करने के लिए reason जरूरी है।"
      );
      return;
    }

    const confirmWaiver = window.confirm(
      `क्या इस patient की ₹150 fee माफ करनी है?\n\nPatient: ${
        patient.patient_name
      }\nCard: ${getCardNumber(patient)}\n\nReason: ${reason}`
    );

    if (!confirmWaiver) {
      return;
    }

    try {
      setProcessingId(patient.id);
      setError("");
      setSuccess("");

      const userName =
        loggedUser?.name ||
        loggedUser?.username ||
        "Officer";

      const { error: updateError } = await supabase
        .from("camp_patients")
        .update({
          payment_amount: 0,
          payment_status: "WAIVED",
          payment_received_by: userName,
          payment_received_at: new Date().toISOString(),
          payment_waived: true,
          payment_notes: reason.trim(),
          supervisor_approval_status: "PENDING",
          admin_approval_status: "PENDING",
          card_status: "PENDING",
        })
        .eq("id", patient.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(
        `Payment waived successfully — ${getCardNumber(
          patient
        )}`
      );

      await loadPatients();
    } catch (err) {
      console.error("Payment waived error:", err);

      setError(
        err?.message ||
          "Payment waiver update नहीं हो सका।"
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredPatients = patients.filter((patient) => {
    const text = search.toLowerCase().trim();

    if (!text) {
      return true;
    }

    return (
      String(patient.patient_name || "")
        .toLowerCase()
        .includes(text) ||
      String(patient.mobile || "")
        .toLowerCase()
        .includes(text) ||
      String(patient.health_card_number || "")
        .toLowerCase()
        .includes(text) ||
      String(patient.district || "")
        .toLowerCase()
        .includes(text) ||
      String(patient.block || "")
        .toLowerCase()
        .includes(text)
    );
  });

  // =====================================================
  // COUNTS
  // =====================================================

  const pendingCount = patients.filter(
    (p) =>
      !p.payment_status ||
      p.payment_status === "PENDING"
  ).length;

  const receivedCount = patients.filter(
    (p) =>
      p.payment_status === "RECEIVED"
  ).length;

  const waivedCount = patients.filter(
    (p) =>
      p.payment_status === "WAIVED"
  ).length;

  // =====================================================
  // STATUS
  // =====================================================

  const getStatus = (status) => {
    if (status === "RECEIVED") {
      return {
        text: "Payment Received",
        className: "status-received",
      };
    }

    if (status === "WAIVED") {
      return {
        text: "Payment Waived",
        className: "status-waived",
      };
    }

    return {
      text: "Payment Pending",
      className: "status-pending",
    };
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="pm-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="pm-header">

        <div>

          <h1>
            💳 Payment Management
          </h1>

          <p>
            Offline Health Card ₹150 Payment
          </p>

        </div>

        <button
          className="pm-refresh"
          onClick={loadPatients}
          disabled={loading}
        >
          🔄 Refresh
        </button>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="pm-container">

        {/* MESSAGE */}

        {error && (
          <div className="pm-message pm-error">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="pm-message pm-success">
            ✅ {success}
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="pm-summary">

          <div className="pm-summary-card">

            <span>⏳</span>

            <div>
              <small>Pending</small>
              <strong>{pendingCount}</strong>
            </div>

          </div>

          <div className="pm-summary-card">

            <span>✅</span>

            <div>
              <small>Received</small>
              <strong>{receivedCount}</strong>
            </div>

          </div>

          <div className="pm-summary-card">

            <span>🟠</span>

            <div>
              <small>Waived</small>
              <strong>{waivedCount}</strong>
            </div>

          </div>

        </div>

        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="pm-search">

          <input
            type="search"
            placeholder="Search Patient / Card Number / Mobile / District..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <section className="pm-table-card">

          <div className="pm-table-header">

            <div>
              <h2>Health Card Patients</h2>

              <p>
                Total: {filteredPatients.length}
              </p>
            </div>

          </div>

          {loading ? (
            <div className="pm-loading">
              <div className="pm-spinner"></div>
              <p>Patient data loading...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="pm-empty">
              <div>📋</div>
              <h3>No Patient Found</h3>
              <p>
                अभी कोई Health Card patient नहीं मिला।
              </p>
            </div>
          ) : (
            <div className="pm-table-wrapper">

              <table>

                <thead>

                  <tr>
                    <th>Card Number</th>
                    <th>Patient</th>
                    <th>Mobile</th>
                    <th>District / Block</th>
                    <th>Payment</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredPatients.map(
                    (patient) => {

                      const status =
                        getStatus(
                          patient.payment_status
                        );

                      const processing =
                        processingId ===
                        patient.id;

                      return (
                        <tr key={patient.id}>

                          {/* CARD */}

                          <td>

                            <strong className="pm-card-number">
                              {getCardNumber(patient)}
                            </strong>

                          </td>

                          {/* PATIENT */}

                          <td>

                            <div className="pm-patient">

                              <strong>
                                {patient.patient_name ||
                                  "-"}
                              </strong>

                              <small>
                                ID: {patient.id}
                              </small>

                            </div>

                          </td>

                          {/* MOBILE */}

                          <td>
                            {patient.mobile || "-"}
                          </td>

                          {/* LOCATION */}

                          <td>

                            <div className="pm-location">

                              <strong>
                                {patient.district ||
                                  "-"}
                              </strong>

                              <small>
                                {patient.block ||
                                  "-"}
                              </small>

                            </div>

                          </td>

                          {/* STATUS */}

                          <td>

                            <div className="pm-payment">

                              <span
                                className={`pm-status ${status.className}`}
                              >
                                {status.text}
                              </span>

                              <small>
                                ₹
                                {patient.payment_status ===
                                "WAIVED"
                                  ? "0"
                                  : "150"}
                              </small>

                            </div>

                          </td>

                          {/* ACTION */}

                          <td>

                            <div className="pm-actions">

                              {patient.payment_status !==
                                "RECEIVED" && (
                                <button
                                  className="pm-received-btn"
                                  disabled={
                                    processing
                                  }
                                  onClick={() =>
                                    markPaymentReceived(
                                      patient
                                    )
                                  }
                                >
                                  {processing
                                    ? "Saving..."
                                    : "✓ Payment Received"}
                                </button>
                              )}

                              {patient.payment_status !==
                                "WAIVED" && (
                                <button
                                  className="pm-waived-btn"
                                  disabled={
                                    processing
                                  }
                                  onClick={() =>
                                    markPaymentWaived(
                                      patient
                                    )
                                  }
                                >
                                  {processing
                                    ? "Saving..."
                                    : "₹150 Waive"}
                                </button>
                              )}

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

      </main>

      {/* =================================================
          CSS
      ================================================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family:
            Arial,
            "Noto Sans Devanagari",
            sans-serif;
          background: #f2f7f4;
          color: #27372e;
        }

        .pm-page {
          min-height: 100vh;
          background: #f2f7f4;
        }

        /* HEADER */

        .pm-header {
          background: white;
          border-bottom: 1px solid #dce8e1;
          min-height: 72px;
          padding: 12px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .pm-header h1 {
          margin: 0;
          font-size: 20px;
          color: #173b2a;
        }

        .pm-header p {
          margin: 5px 0 0;
          color: #78857e;
          font-size: 11px;
        }

        .pm-refresh {
          border: 1px solid #d2e1d8;
          background: white;
          color: #176a42;
          border-radius: 8px;
          padding: 10px 15px;
          font-size: 11px;
          font-weight: bold;
          cursor: pointer;
        }

        .pm-refresh:disabled {
          opacity: .6;
        }

        /* CONTAINER */

        .pm-container {
          max-width: 1250px;
          margin: auto;
          padding: 25px 20px 50px;
        }

        /* MESSAGE */

        .pm-message {
          padding: 12px 15px;
          border-radius: 9px;
          margin-bottom: 15px;
          font-size: 12px;
          font-weight: bold;
        }

        .pm-error {
          background: #fff0f0;
          color: #c62828;
          border: 1px solid #ffd2d2;
        }

        .pm-success {
          background: #eaf8ef;
          color: #167443;
          border: 1px solid #c8e8d3;
        }

        /* SUMMARY */

        .pm-summary {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 18px;
        }

        .pm-summary-card {
          background: white;
          border: 1px solid #dfebe4;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow:
            0 4px 15px rgba(0,0,0,.03);
        }

        .pm-summary-card > span {
          width: 40px;
          height: 40px;
          border-radius: 9px;
          background: #eaf6ee;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .pm-summary-card div {
          display: flex;
          flex-direction: column;
        }

        .pm-summary-card small {
          color: #7d8983;
          font-size: 10px;
        }

        .pm-summary-card strong {
          margin-top: 3px;
          color: #173b2a;
          font-size: 20px;
        }

        /* SEARCH */

        .pm-search {
          margin-bottom: 15px;
        }

        .pm-search input {
          width: 100%;
          height: 43px;
          border: 1px solid #d6e3db;
          border-radius: 9px;
          background: white;
          padding: 0 14px;
          outline: none;
          font-size: 12px;
        }

        .pm-search input:focus {
          border-color: #16804d;
          box-shadow:
            0 0 0 3px
            rgba(22,128,77,.08);
        }

        /* TABLE */

        .pm-table-card {
          background: white;
          border: 1px solid #dfebe4;
          border-radius: 13px;
          overflow: hidden;
          box-shadow:
            0 5px 20px rgba(0,0,0,.04);
        }

        .pm-table-header {
          padding: 17px 18px;
          border-bottom: 1px solid #e8efeb;
        }

        .pm-table-header h2 {
          margin: 0;
          color: #173b2a;
          font-size: 16px;
        }

        .pm-table-header p {
          margin: 4px 0 0;
          color: #7d8982;
          font-size: 10px;
        }

        .pm-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 950px;
        }

        th {
          background: #f6faf8;
          color: #65746b;
          font-size: 10px;
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid #e4ece7;
          white-space: nowrap;
        }

        td {
          padding: 13px 12px;
          border-bottom: 1px solid #edf2ef;
          font-size: 11px;
          color: #435249;
          vertical-align: middle;
        }

        tbody tr:hover {
          background: #fbfdfc;
        }

        /* CARD NUMBER */

        .pm-card-number {
          color: #12613a;
          font-size: 12px;
          letter-spacing: .6px;
        }

        /* PATIENT */

        .pm-patient {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .pm-patient strong {
          color: #273d31;
          font-size: 11px;
        }

        .pm-patient small {
          color: #8a968f;
          font-size: 9px;
        }

        /* LOCATION */

        .pm-location {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .pm-location strong {
          color: #3c4e44;
          font-size: 10px;
        }

        .pm-location small {
          color: #8a968f;
          font-size: 9px;
        }

        /* PAYMENT */

        .pm-payment {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .pm-status {
          display: inline-block;
          padding: 5px 7px;
          border-radius: 5px;
          font-size: 8px;
          font-weight: bold;
          white-space: nowrap;
        }

        .status-pending {
          background: #fff4df;
          color: #a66a00;
        }

        .status-received {
          background: #e8f7ed;
          color: #167443;
        }

        .status-waived {
          background: #fff0e5;
          color: #b05a1a;
        }

        .pm-payment small {
          color: #67756d;
          font-weight: bold;
          font-size: 9px;
        }

        /* ACTIONS */

        .pm-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .pm-actions button {
          border: none;
          border-radius: 6px;
          padding: 7px 9px;
          font-size: 8px;
          font-weight: bold;
          cursor: pointer;
          white-space: nowrap;
        }

        .pm-received-btn {
          background: #16804d;
          color: white;
        }

        .pm-waived-btn {
          background: #fff0e5;
          color: #a95316;
          border: 1px solid #f0d1b9 !important;
        }

        .pm-actions button:hover {
          opacity: .88;
        }

        .pm-actions button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        /* LOADING */

        .pm-loading {
          min-height: 220px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: #718078;
        }

        .pm-spinner {
          width: 38px;
          height: 38px;
          border: 4px solid #dceee3;
          border-top-color: #16804d;
          border-radius: 50%;
          animation: pmspin .8s linear infinite;
        }

        .pm-loading p {
          font-size: 11px;
        }

        @keyframes pmspin {
          to {
            transform: rotate(360deg);
          }
        }

        /* EMPTY */

        .pm-empty {
          text-align: center;
          padding: 55px 20px;
          color: #77847d;
        }

        .pm-empty div {
          font-size: 40px;
        }

        .pm-empty h3 {
          color: #31473a;
          margin: 10px 0 5px;
        }

        .pm-empty p {
          font-size: 11px;
          margin: 0;
        }

        /* MOBILE */

        @media(max-width: 700px) {

          .pm-header {
            padding: 12px 15px;
          }

          .pm-header h1 {
            font-size: 16px;
          }

          .pm-refresh {
            padding: 8px 10px;
          }

          .pm-container {
            padding: 18px 10px 40px;
          }

          .pm-summary {
            grid-template-columns: 1fr;
          }

        }

      `}</style>

    </div>
  );
}

export default PaymentManagement;