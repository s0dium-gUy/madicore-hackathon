/**
 * Smart OPD Queue Management System
 * Main Application Logic — Fetches data from API, renders views, handles interactions
 */

// ─── STATE ───────────────────────────────────────────────────────────────────

let opdData = { doctors: [], patients: [] };

const API_BASE = "/api";


// ─── API LAYER ───────────────────────────────────────────────────────────────

async function fetchDashboardData() {
  try {
    const res = await fetch(`${API_BASE}/dashboard`);
    const json = await res.json();
    if (json.success) {
      opdData = json.data;
    }
  } catch (err) {
    console.error("Failed to fetch dashboard data:", err);
  }
}

async function updateDoctorStatus(doctorId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const json = await res.json();
    if (json.success) {
      await refreshAll();
    }
  } catch (err) {
    console.error("Failed to update doctor status:", err);
  }
}

async function updatePatientQueueStatus(patientId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/patients/${patientId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queueStatus: newStatus }),
    });
    const json = await res.json();
    if (json.success) {
      await refreshAll();
    }
  } catch (err) {
    console.error("Failed to update patient status:", err);
  }
}

async function updatePrescriptionStatus(patientId, rxId, newStatus) {
  try {
    const res = await fetch(
      `${API_BASE}/patients/${patientId}/prescriptions/${rxId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }
    );
    const json = await res.json();
    if (json.success) {
      await refreshAll();
    }
  } catch (err) {
    console.error("Failed to update prescription status:", err);
  }
}

async function refreshAll() {
  await fetchDashboardData();
  renderDoctorsView();
  renderPatientView();
}


// ─── UTILITIES ───────────────────────────────────────────────────────────────

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const options = {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  return date.toLocaleDateString("en-US", options);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatStatus(status) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getInitials(name) {
  return name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getDoctorNameById(id) {
  const doc = opdData.doctors.find((d) => d.id === id);
  return doc ? doc.name : id;
}

function getPharmacyStatusLabel(status) {
  const map = {
    pending_at_pharmacy: "Pending at Pharmacy",
    ready_for_pickup: "Ready for Pickup",
    dispensed: "Dispensed",
  };
  return map[status] || formatStatus(status);
}

function getPharmacyBadgeClass(status) {
  if (status.includes("pending")) return "pharmacy-badge--pending";
  if (status.includes("ready")) return "pharmacy-badge--ready";
  if (status.includes("dispensed")) return "pharmacy-badge--dispensed";
  return "pharmacy-badge--pending";
}


// ─── RENDER: DOCTOR CARDS ────────────────────────────────────────────────────

function renderDoctorCard(doctor) {
  const statusLabel = doctor.status === "available" ? "Available" : "On Break";
  const toggleStatus = doctor.status === "available" ? "on_break" : "available";
  const toggleLabel = doctor.status === "available" ? "Set On Break" : "Set Available";

  return `
    <article class="doctor-card" id="doctor-${doctor.id}">
      <div class="doctor-card__header">
        <div class="doctor-card__avatar">🩺</div>
        <div class="doctor-card__info">
          <h3 class="doctor-card__name">${doctor.name}</h3>
          <p class="doctor-card__specialization">${doctor.specialization}</p>
          <span class="doctor-card__id">${doctor.id}</span>
        </div>
        <span class="status-badge status-badge--${doctor.status}">
          <span class="status-dot status-dot--${doctor.status}"></span>
          ${statusLabel}
        </span>
      </div>

      <div class="doctor-card__body">
        <div class="doctor-card__meta-row">
          <span class="icon">🕐</span>
          Last updated: ${formatTimestamp(doctor.statusLastUpdated)}
        </div>

        <div>
          <div class="doctor-card__meta-row" style="margin-bottom: 8px;">
            <span class="icon">📅</span>
            Daily Schedule
          </div>
          <div class="doctor-card__schedule">
            ${doctor.availabilitySchedule
              .map((slot) => `<span class="schedule-chip">${slot}</span>`)
              .join("")}
          </div>
        </div>

        <div class="patient-count-badge">
          <span class="patient-count-badge__number">${doctor.currentPatientCount}</span>
          <span class="patient-count-badge__label">Current<br>Patients</span>
        </div>

        <button class="action-btn action-btn--sm" onclick="updateDoctorStatus('${doctor.id}', '${toggleStatus}')">
          ${toggleLabel}
        </button>
      </div>
    </article>
  `;
}

function renderDoctorsView() {
  const container = document.getElementById("doctors-grid");
  if (!container) return;
  container.innerHTML = opdData.doctors.map(renderDoctorCard).join("");

  // Update count badge
  const countEl = document.getElementById("doctor-count");
  if (countEl) countEl.textContent = opdData.doctors.length;
}


// ─── RENDER: PATIENT DASHBOARD ───────────────────────────────────────────────

function renderPatientView() {
  const patient = opdData.patients[0]; // Display first patient
  if (!patient) return;

  // Banner
  const bannerEl = document.getElementById("patient-banner");
  if (bannerEl) {
    bannerEl.innerHTML = `
      <div class="patient-banner__info">
        <div class="patient-banner__avatar">${getInitials(patient.name)}</div>
        <div>
          <h1 class="patient-banner__name">${patient.name}</h1>
          <span class="patient-banner__id">${patient.id}</span>
        </div>
      </div>
      <div class="patient-banner__token">
        <div class="patient-banner__token-label">Token Number</div>
        <div class="patient-banner__token-number">${patient.tokenNumber}</div>
      </div>
    `;
  }

  // Status Bar
  const statusBarEl = document.getElementById("patient-status-bar");
  if (statusBarEl) {
    const queueStatusClass =
      patient.queueStatus === "waiting"
        ? "queue-badge--waiting"
        : patient.queueStatus === "in_consultation"
        ? "queue-badge--in_consultation"
        : "queue-badge--completed";

    // Build queue action buttons
    const queueActions = ["waiting", "in_consultation", "completed"]
      .filter((s) => s !== patient.queueStatus)
      .map(
        (s) =>
          `<button class="action-btn action-btn--xs" onclick="updatePatientQueueStatus('${patient.id}', '${s}')">${formatStatus(s)}</button>`
      )
      .join("");

    statusBarEl.innerHTML = `
      <div class="status-bar__item">
        <div class="status-bar__icon status-bar__icon--queue">⏳</div>
        <div>
          <div class="status-bar__label">Queue Status</div>
          <div class="status-bar__value">
            <span class="queue-badge ${queueStatusClass}">
              ${formatStatus(patient.queueStatus)}
            </span>
          </div>
          <div class="status-bar__actions">${queueActions}</div>
        </div>
      </div>
      <div class="status-bar__item">
        <div class="status-bar__icon status-bar__icon--time">🕐</div>
        <div>
          <div class="status-bar__label">Booked Slot</div>
          <div class="status-bar__value">${patient.bookedTimeSlot}</div>
        </div>
      </div>
      <div class="status-bar__item">
        <div class="status-bar__icon status-bar__icon--route">🔀</div>
        <div>
          <div class="status-bar__label">Routing</div>
          <div class="status-bar__value">${formatStatus(patient.routingPreference)}</div>
        </div>
      </div>
      <div class="status-bar__item">
        <div class="status-bar__icon status-bar__icon--doctor">👨‍⚕️</div>
        <div>
          <div class="status-bar__label">Assigned Doctor</div>
          <div class="status-bar__value">${getDoctorNameById(patient.assignedDoctorId)}</div>
        </div>
      </div>
    `;
  }

  // Vitals & Stats Panel
  const vitalsEl = document.getElementById("patient-vitals");
  if (vitalsEl) {
    const stats = patient.patientStats;
    vitalsEl.innerHTML = `
      <div class="panel__header">
        <div class="panel__header-icon panel__header-icon--vitals">❤️</div>
        <h3 class="panel__title">Patient Statistics & Vitals</h3>
      </div>
      <div class="vitals-grid">
        <div class="vital-card">
          <div class="vital-card__icon">🎂</div>
          <div class="vital-card__label">Age</div>
          <div class="vital-card__value">${stats.age}</div>
          <div class="vital-card__unit">years</div>
        </div>
        <div class="vital-card">
          <div class="vital-card__icon">🩸</div>
          <div class="vital-card__label">Blood Group</div>
          <div class="vital-card__value">${stats.bloodGroup}</div>
        </div>
        <div class="vital-card">
          <div class="vital-card__icon">💓</div>
          <div class="vital-card__label">Blood Pressure</div>
          <div class="vital-card__value">${stats.vitals.bp}</div>
          <div class="vital-card__unit">mmHg</div>
        </div>
        <div class="vital-card">
          <div class="vital-card__icon">🌡️</div>
          <div class="vital-card__label">Temperature</div>
          <div class="vital-card__value">${stats.vitals.temp}</div>
        </div>
      </div>
    `;
  }

  // Past Records Timeline
  const recordsEl = document.getElementById("patient-records");
  if (recordsEl) {
    const recordsHTML =
      patient.pastRecords.length > 0
        ? `<div class="timeline">
            ${patient.pastRecords
              .map(
                (rec) => `
              <div class="timeline__item">
                <div class="timeline__dot"></div>
                <div class="timeline__date">${formatDate(rec.date)}</div>
                <div class="timeline__diagnosis">${rec.diagnosis}</div>
                <div class="timeline__notes">${rec.notes}</div>
              </div>
            `
              )
              .join("")}
          </div>`
        : `<div class="empty-state">
            <div class="empty-state__icon">📋</div>
            <p class="empty-state__text">No past records found.</p>
          </div>`;

    recordsEl.innerHTML = `
      <div class="panel__header">
        <div class="panel__header-icon panel__header-icon--records">📋</div>
        <h3 class="panel__title">Past Medical Records</h3>
      </div>
      ${recordsHTML}
    `;
  }

  // Prescriptions
  const rxEl = document.getElementById("patient-prescriptions");
  if (rxEl) {
    const rxHTML =
      patient.currentPrescriptions.length > 0
        ? patient.currentPrescriptions
            .map((rx) => {
              // Build pharmacy action buttons
              const rxActions = [
                "pending_at_pharmacy",
                "ready_for_pickup",
                "dispensed",
              ]
                .filter((s) => s !== rx.status)
                .map(
                  (s) =>
                    `<button class="action-btn action-btn--xs" onclick="updatePrescriptionStatus('${patient.id}', '${rx.prescriptionId}', '${s}')">${getPharmacyStatusLabel(s)}</button>`
                )
                .join("");

              return `
                <div class="rx-card">
                  <div class="rx-card__header">
                    <span class="rx-card__medication">💊 ${rx.medication}</span>
                    <span class="rx-card__id">${rx.prescriptionId}</span>
                  </div>
                  <div class="rx-card__details">
                    <span class="rx-card__detail-item">
                      👨‍⚕️ ${getDoctorNameById(rx.issuedBy)}
                    </span>
                    <span class="pharmacy-badge ${getPharmacyBadgeClass(rx.status)}">
                      ${getPharmacyStatusLabel(rx.status)}
                    </span>
                  </div>
                  <div class="rx-card__actions">${rxActions}</div>
                </div>
              `;
            })
            .join("")
        : `<div class="empty-state">
            <div class="empty-state__icon">💊</div>
            <p class="empty-state__text">No active prescriptions.</p>
          </div>`;

    rxEl.innerHTML = `
      <div class="panel__header">
        <div class="panel__header-icon panel__header-icon--rx">💊</div>
        <h3 class="panel__title">Current Prescriptions</h3>
      </div>
      ${rxHTML}
    `;
  }
}


// ─── VIEW SWITCHING ──────────────────────────────────────────────────────────

function switchView(viewId) {
  // Toggle active view
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.remove("view--active");
  });
  const activeView = document.getElementById(viewId);
  if (activeView) activeView.classList.add("view--active");

  // Toggle active tab
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.remove("nav-tab--active");
  });
  const activeTab = document.querySelector(`[data-view="${viewId}"]`);
  if (activeTab) activeTab.classList.add("nav-tab--active");
}


// ─── LIVE CLOCK ──────────────────────────────────────────────────────────────

function updateClock() {
  const clockEl = document.getElementById("live-clock");
  if (!clockEl) return;
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}


// ─── INITIALIZATION ──────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  // Fetch data from API and render
  await refreshAll();

  // Tab navigation
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const viewId = tab.getAttribute("data-view");
      if (viewId) switchView(viewId);
    });
  });

  // Live clock
  updateClock();
  setInterval(updateClock, 1000);

  // Auto-refresh data every 30 seconds
  setInterval(refreshAll, 30000);

  // Default view
  switchView("view-doctors");
});
