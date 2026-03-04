// ============================
// CONFIG & STORAGE
// ============================
const LS_MOTORS = "srew_motors";
const LS_PASS = "srew_password";
const LS_SESSION = "srew_session";
const LS_BACKUP = "srew_last_backup";
const LS_BACKUP_DISMISS = "srew_backup_dismiss";
const DEFAULT_PASS_HASH = hashStr("Admin@123");
const DEFAULT_USER = "Shree Ram Electric Works";

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h.toString(36);
}
function getPass() {
  return localStorage.getItem(LS_PASS) || DEFAULT_PASS_HASH;
}
function getMotors() {
  const r = localStorage.getItem(LS_MOTORS);
  return r ? JSON.parse(r) : getSampleData();
}
function saveMotors(arr) {
  localStorage.setItem(LS_MOTORS, JSON.stringify(arr));
}

function getSampleData() {
  const data = [
    {
      id: 1,
      brand: "Crompton",
      manufacturer: "Crompton Greaves Ltd",
      motorType: "AC",
      phase: "Single",
      ratedVoltage: "230V",
      ratedCurrent: "8.5A",
      ratedFrequency: "50Hz",
      ratedRPM: 1440,
      ratedPowerHP: 1.5,
      ratedPowerKW: "1.1186",
      insulationClass: "B",
      efficiency: "82%",
      frameSize: "D90S",
      runningCurrent: "8.2A",
      statorSlots: 36,
      slotLength: "42mm",
      totalCoilTurns: 720,
      turnsPerCoil: 90,
      coilPitch: "1-8",
      windingConnection: "",
      coilWireType: "Copper",
      wireGauge: "22 SWG",
      coilWeight: "1.15",
      pitchTurns: [{ pitch: "1-8", turns: "90" }],
      startingCoilTurns: 480,
      runningCoilTurns: 240,
      startingCoilWeight: "0.42",
      runningCoilWeight: "0.73",
      capacitorValue: "25µF / 4µF",
      lineVoltage: "",
      phaseVoltage: "",
      lineCurrent: "",
      phaseCurrent: "",
      starDeltaConn: "",
      shaftDiameter: "24mm",
      shaftLength: "55mm",
      bearingFront: "6305",
      bearingRear: "6203",
      fanSize: "160mm",
      fanCoverSize: "180mm",
      motorWeight: "11.5",
      bodyMaterial: "Cast Iron",
      oldCoilWeight: "1.0",
      newCoilWeight: "1.15",
      notes: "Motor rewound after burnout. Running perfectly.",
      added: Date.now() - 86400000 * 10,
    },
    {
      id: 2,
      brand: "Kirloskar",
      manufacturer: "Kirloskar Electric Co.",
      motorType: "AC",
      phase: "Three",
      ratedVoltage: "415V",
      ratedCurrent: "7.8A",
      ratedFrequency: "50Hz",
      ratedRPM: 1450,
      ratedPowerHP: 3,
      ratedPowerKW: "2.2371",
      insulationClass: "F",
      efficiency: "87%",
      frameSize: "D100L",
      runningCurrent: "7.5A",
      statorSlots: 36,
      slotLength: "55mm",
      totalCoilTurns: 576,
      turnsPerCoil: 72,
      coilPitch: "1-9",
      windingConnection: "Star",
      coilWireType: "Copper",
      wireGauge: "20 SWG",
      coilWeight: "2.8",
      pitchTurns: [{ pitch: "1-9", turns: "72" }],
      startingCoilTurns: 0,
      runningCoilTurns: 0,
      startingCoilWeight: "",
      runningCoilWeight: "",
      capacitorValue: "",
      lineVoltage: "415V",
      phaseVoltage: "240V",
      lineCurrent: "7.8A",
      phaseCurrent: "4.5A",
      starDeltaConn: "Star",
      shaftDiameter: "28mm",
      shaftLength: "60mm",
      bearingFront: "6206",
      bearingRear: "6204",
      fanSize: "200mm",
      fanCoverSize: "220mm",
      motorWeight: "18.5",
      bodyMaterial: "Cast Iron",
      oldCoilWeight: "2.5",
      newCoilWeight: "2.8",
      notes: "Rewound after flood damage. Star connected.",
      added: Date.now() - 86400000 * 5,
    },
  ];
  saveMotors(data);
  return data;
}

// ============================
// PWA — SERVICE WORKER
// ============================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// PWA install prompt
let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  ["topInstallBtn", "sidebarInstallBtn"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "";
  });
  setTimeout(() => {
    if (sessionStorage.getItem(LS_SESSION) === "1") {
      const banner = document.getElementById("installBanner");
      if (banner) banner.style.display = "block";
    }
  }, 3000);
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  ["topInstallBtn", "sidebarInstallBtn", "installBanner"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  const msg = document.getElementById("pwaInstalledMsg");
  if (msg) msg.style.display = "block";
  showToast("App installed! Launch from your home screen.");
});

function installPWA() {
  if (!deferredInstallPrompt) {
    showToast(
      "App may already be installed, or your browser supports manual install from the address bar.",
      "warn",
    );
    return;
  }
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then((result) => {
    if (result.outcome === "accepted") showToast("Installing app...");
    deferredInstallPrompt = null;
  });
}
function dismissInstall() {
  const b = document.getElementById("installBanner");
  if (b) b.style.display = "none";
}

// ============================
// DAILY BACKUP REMINDER
// ============================
function checkBackupReminder() {
  updateBackupLabels();
  const last = localStorage.getItem(LS_BACKUP);
  const dismissed = localStorage.getItem(LS_BACKUP_DISMISS);
  const now = Date.now();
  const ONE_DAY = 86400000;
  if (!last || now - parseInt(last) > ONE_DAY) {
    if (!dismissed || now - parseInt(dismissed) > ONE_DAY) {
      setTimeout(() => {
        const b = document.getElementById("backupBanner");
        if (b) b.style.display = "flex";
      }, 5000);
    }
  }
}
function dismissBackup() {
  localStorage.setItem(LS_BACKUP_DISMISS, Date.now().toString());
  const b = document.getElementById("backupBanner");
  if (b) b.style.display = "none";
}
function updateBackupLabels() {
  const last = localStorage.getItem(LS_BACKUP);
  const motors = getMotors();
  const label = last ? new Date(parseInt(last)).toLocaleString() : "Never";
  ["lastBackupDate", "lastBackupLabel"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = label;
  });
  const trl = document.getElementById("totalRecordsLabel");
  if (trl) trl.textContent = motors.length;
}

// ============================
// LOGIN
// ============================
document.getElementById("loginPass").addEventListener("keydown", (e) => {
  if (e.key === "Enter") doLogin();
});
document.getElementById("loginUser").addEventListener("keydown", (e) => {
  if (e.key === "Enter") doLogin();
});

function doLogin() {
  const u = document.getElementById("loginUser").value.trim();
  const p = document.getElementById("loginPass").value.trim();
  if (u === DEFAULT_USER && hashStr(p) === getPass()) {
    sessionStorage.setItem(LS_SESSION, "1");
    document.getElementById("loginOverlay").style.display = "none";
    document.getElementById("appWrap").style.display = "flex";
    refreshAll();
    checkBackupReminder();
  } else {
    document.getElementById("loginErr").style.display = "block";
  }
}
function logout() {
  sessionStorage.removeItem(LS_SESSION);
  location.reload();
}

if (sessionStorage.getItem(LS_SESSION) === "1") {
  document.getElementById("loginOverlay").style.display = "none";
  document.getElementById("appWrap").style.display = "flex";
  refreshAll();
  checkBackupReminder();
}

// ============================
// NAVIGATION
// ============================
function showPage(id, el) {
  document
    .querySelectorAll(".page-content")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  document.getElementById("page-" + id).classList.add("active");
  el.classList.add("active");
  if (id === "dashboard") renderDashboard();
  if (id === "motors") filterMotors();
  if (id === "export") updateBackupLabels();
}
function refreshAll() {
  renderDashboard();
  filterMotors();
  updateBackupLabels();
}

// ============================
// DASHBOARD
// ============================
function renderDashboard() {
  const motors = getMotors();
  const total = motors.length;
  const ac = motors.filter((m) => m.motorType === "AC").length;
  const dc = motors.filter((m) => m.motorType === "DC").length;
  const single = motors.filter((m) => m.phase === "Single").length;
  const three = motors.filter((m) => m.phase === "Three").length;
  const rewound = motors.filter((m) => m.newCoilWeight).length;
  const avgHP = total
    ? motors.reduce((s, m) => s + parseFloat(m.ratedPowerHP || 0), 0) / total
    : 0;
  const avgRPM = total
    ? motors.reduce((s, m) => s + parseFloat(m.ratedRPM || 0), 0) / total
    : 0;

  document.getElementById("statsGrid").innerHTML = `
    <div class="stat-card c1"><div class="sc-icon">⚡</div><div class="sc-num">${total}</div><div class="sc-label">Total Motors</div></div>
    <div class="stat-card c2"><div class="sc-icon">🔵</div><div class="sc-num" style="color:var(--teal)">${ac}</div><div class="sc-label">AC Motors</div></div>
    <div class="stat-card c6"><div class="sc-icon">🔴</div><div class="sc-num" style="color:var(--red)">${dc}</div><div class="sc-label">DC Motors</div></div>
    <div class="stat-card c4"><div class="sc-icon">🔌</div><div class="sc-num" style="color:var(--yellow)">${single}</div><div class="sc-label">Single Phase</div></div>
    <div class="stat-card c5"><div class="sc-icon">⚡</div><div class="sc-num" style="color:var(--green)">${three}</div><div class="sc-label">Three Phase</div></div>
    <div class="stat-card c1"><div class="sc-icon">💪</div><div class="sc-num">${avgHP.toFixed(2)}</div><div class="sc-label">Avg HP</div></div>
    <div class="stat-card c2"><div class="sc-icon">🔄</div><div class="sc-num">${Math.round(avgRPM)}</div><div class="sc-label">Avg RPM</div></div>
    <div class="stat-card c5"><div class="sc-icon">🔧</div><div class="sc-num" style="color:var(--green)">${rewound}</div><div class="sc-label">Rewound</div></div>`;

  const typeData = [
    ["AC Motors", ac],
    ["DC Motors", dc],
    ["Single Phase", single],
    ["Three Phase", three],
    ["Rewound", rewound],
  ];
  const maxT = Math.max(...typeData.map((t) => t[1]), 1);
  document.getElementById("typeChart").innerHTML = typeData
    .map(
      ([l, v], i) => `
    <div class="bar-wrap"><div class="bar-lbl">${l}</div>
    <div class="bar-track"><div class="bar-fill${i === 1 ? " teal" : ""}" style="width:${((v / maxT) * 100).toFixed(1)}%"></div></div>
    <div class="bar-val">${v}</div></div>`,
    )
    .join("");

  const bc = {};
  motors.forEach((m) => {
    bc[m.brand] = (bc[m.brand] || 0) + 1;
  });
  const bArr = Object.entries(bc)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxB = Math.max(...bArr.map((b) => b[1]), 1);
  document.getElementById("brandChart").innerHTML = bArr
    .map(
      ([b, v]) => `
    <div class="bar-wrap"><div class="bar-lbl" style="width:100px">${b}</div>
    <div class="bar-track"><div class="bar-fill" style="width:${((v / maxB) * 100).toFixed(1)}%"></div></div>
    <div class="bar-val">${v}</div></div>`,
    )
    .join("");

  const recent = [...motors]
    .sort((a, b) => (b.added || 0) - (a.added || 0))
    .slice(0, 8);
  document.getElementById("recentBody").innerHTML = recent
    .map(
      (m) => `
    <tr>
      <td><div class="motor-name-cell"><strong>${m.brand}</strong><small>${m.frameSize || ""}</small></div></td>
      <td>${m.brand}</td><td>${m.ratedPowerHP || "-"} HP</td><td>${m.ratedRPM || "-"}</td>
      <td><span class="badge ${m.phase === "Three" ? "badge-3ph" : "badge-1ph"}">${m.phase || "-"} Phase</span></td>
      <td><span class="badge ${m.motorType === "AC" ? "badge-ac" : "badge-dc"}">${m.motorType || "-"}</span></td>
    </tr>`,
    )
    .join("");
}

// ============================
// MOTORS TABLE
// ============================
let mFiltered = [],
  mSort = "brand",
  mSortDir = 1,
  mPage = 1;
const M_PER = 12;

function filterMotors() {
  const motors = getMotors();
  const q = (document.getElementById("motorSearch")?.value || "").toLowerCase();
  const type = document.getElementById("typeFilter")?.value || "";
  const phase = document.getElementById("phaseFilter")?.value || "";
  mFiltered = motors.filter((m) => {
    const txt = [
      m.brand,
      m.manufacturer,
      m.frameSize,
      m.ratedVoltage,
      m.ratedPowerHP,
      m.ratedRPM,
      m.wireGauge,
    ]
      .join(" ")
      .toLowerCase();
    return (
      (!q || txt.includes(q)) &&
      (!type || m.motorType === type) &&
      (!phase || m.phase === phase)
    );
  });
  mFiltered.sort((a, b) => {
    let av = a[mSort] || "",
      bv = b[mSort] || "";
    if (!isNaN(av) && !isNaN(bv)) {
      av = parseFloat(av);
      bv = parseFloat(bv);
    } else {
      av = String(av).toLowerCase();
      bv = String(bv).toLowerCase();
    }
    return av < bv ? -mSortDir : av > bv ? mSortDir : 0;
  });
  mPage = 1;
  renderMotorsTable();
}
function sortMotors(col) {
  if (mSort === col) mSortDir *= -1;
  else {
    mSort = col;
    mSortDir = 1;
  }
  filterMotors();
}

function renderMotorsTable() {
  const slice = mFiltered.slice((mPage - 1) * M_PER, mPage * M_PER);
  const tb = document.getElementById("motorBody");
  if (!slice.length) {
    tb.innerHTML = `<tr><td colspan="11"><div class="empty-state"><div class="es-icon">🔍</div><p>No motors found</p></div></td></tr>`;
  } else {
    tb.innerHTML = slice
      .map(
        (m) => `
      <tr>
        <td><div class="motor-name-cell"><strong>${m.brand}</strong><small>${m.manufacturer || ""}</small></div></td>
        <td>${m.frameSize || "-"}</td>
        <td><strong>${m.ratedPowerHP || "-"}</strong> HP</td>
        <td>${m.ratedRPM || "-"}</td>
        <td>${m.ratedVoltage || "-"}</td>
        <td><span class="badge ${m.motorType === "AC" ? "badge-ac" : "badge-dc"}">${m.motorType || "-"}</span></td>
        <td><span class="badge ${m.phase === "Three" ? "badge-3ph" : "badge-1ph"}">${m.phase || "-"}</span></td>
        <td>${m.wireGauge || "-"}</td>
        <td>${m.totalCoilTurns || "-"}</td>
        <td>${m.coilWeight || "-"} kg</td>
        <td style="white-space:nowrap">
          <button class="btn btn-light btn-sm" onclick="openDetail(${m.id})" title="View">👁</button>
          <button class="btn btn-navy btn-sm" onclick="saveMotorPDF(${m.id})" style="margin:0 3px" title="Save PDF">📄</button>
          <button class="btn btn-orange btn-sm" onclick="openEditModal(${m.id})" style="margin-right:3px" title="Edit">✏️</button>
          <button class="btn btn-red btn-sm" onclick="openDeleteConfirm(${m.id})" title="Delete">🗑️</button>
        </td>
      </tr>`,
      )
      .join("");
  }
  const tp = Math.ceil(mFiltered.length / M_PER) || 1;
  let pg = `<span class="pg-info">${mFiltered.length} record${mFiltered.length !== 1 ? "s" : ""}</span>`;
  if (tp > 1) {
    if (mPage > 1)
      pg += `<button class="pg-btn" onclick="goMPage(${mPage - 1})">‹</button>`;
    for (let i = 1; i <= tp; i++) {
      if (i === 1 || i === tp || Math.abs(i - mPage) <= 1)
        pg += `<button class="pg-btn${i === mPage ? " active" : ""}" onclick="goMPage(${i})">${i}</button>`;
      else if (Math.abs(i - mPage) === 2)
        pg += `<span style="padding:0 4px;color:var(--muted)">…</span>`;
    }
    if (mPage < tp)
      pg += `<button class="pg-btn" onclick="goMPage(${mPage + 1})">›</button>`;
  }
  document.getElementById("motorPagination").innerHTML = pg;
}
function goMPage(p) {
  mPage = p;
  renderMotorsTable();
}

// ============================
// PITCH TURNS
// ============================
function addPitchRow(pitch = "", turns = "") {
  const container = document.getElementById("pitchTurnsContainer");
  const row = document.createElement("div");
  row.className = "pitch-row";
  row.style.cssText = "display:flex;align-items:center;gap:10px";
  row.innerHTML = `
    <div class="fg" style="flex:1;gap:4px">
      <label style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px">Pitch</label>
      <input type="text" class="pitch-input" placeholder="e.g. 1-8" value="${pitch}"
        style="padding:9px 12px;border:2px solid var(--border);border-radius:10px;font-family:'DM Sans',sans-serif;font-size:.9rem;outline:none;width:100%;color:var(--text)" />
    </div>
    <div class="fg" style="flex:1;gap:4px">
      <label style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px">Turns</label>
      <input type="number" class="turns-input" placeholder="e.g. 90" value="${turns}"
        style="padding:9px 12px;border:2px solid var(--border);border-radius:10px;font-family:'DM Sans',sans-serif;font-size:.9rem;outline:none;width:100%;color:var(--text)" />
    </div>
    <button type="button" onclick="this.parentElement.remove()"
      style="margin-top:18px;background:var(--light);border:none;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:1rem;color:var(--muted);flex-shrink:0">✕</button>`;
  container.appendChild(row);
}
function getPitchTurns() {
  const result = [];
  document
    .querySelectorAll("#pitchTurnsContainer .pitch-row")
    .forEach((row) => {
      const pitch = row.querySelector(".pitch-input").value.trim();
      const turns = row.querySelector(".turns-input").value.trim();
      if (pitch || turns) result.push({ pitch, turns });
    });
  return result;
}
function renderPitchTurns(arr) {
  document.getElementById("pitchTurnsContainer").innerHTML = "";
  if (arr && arr.length)
    arr.forEach((item) => addPitchRow(item.pitch, item.turns));
}

// ============================
// ADD / EDIT MOTOR
// ============================
let editingId = null,
  currentPhase = "Single";

function setPhase(p) {
  currentPhase = p;
  document.getElementById("phBtn1").classList.toggle("active", p === "Single");
  document.getElementById("phBtn3").classList.toggle("active", p === "Three");
  document.getElementById("singlePhaseSection").style.display =
    p === "Single" ? "" : "none";
  document.getElementById("threePhaseSection").style.display =
    p === "Three" ? "" : "none";
  document.getElementById("f_phase").value = p;
}
function onPhaseChange() {
  setPhase(document.getElementById("f_phase").value || "Single");
}
function autoKW() {
  const hp = parseFloat(document.getElementById("f_ratedPowerHP").value) || 0;
  document.getElementById("f_ratedPowerKW").value = hp
    ? (hp * 0.7457).toFixed(4)
    : "";
}

const FIELDS = [
  "brand",
  "manufacturer",
  "motorType",
  "phase",
  "ratedVoltage",
  "ratedCurrent",
  "ratedFrequency",
  "ratedRPM",
  "ratedPowerHP",
  "ratedPowerKW",
  "insulationClass",
  "efficiency",
  "frameSize",
  "runningCurrent",
  "statorSlots",
  "slotLength",
  "totalCoilTurns",
  "turnsPerCoil",
  "coilPitch",
  "windingConnection",
  "coilWireType",
  "wireGauge",
  "coilWeight",
  "startingCoilTurns",
  "runningCoilTurns",
  "startingCoilWeight",
  "runningCoilWeight",
  "capacitorValue",
  "lineVoltage",
  "phaseVoltage",
  "lineCurrent",
  "phaseCurrent",
  "starDeltaConn",
  "shaftDiameter",
  "shaftLength",
  "bearingFront",
  "bearingRear",
  "fanSize",
  "fanCoverSize",
  "motorWeight",
  "bodyMaterial",
  "oldCoilWeight",
  "newCoilWeight",
  "notes",
];

function openAddModal() {
  editingId = null;
  document.getElementById("mModalTitle").textContent =
    "➕ Add New Motor Record";
  FIELDS.forEach((f) => {
    const el = document.getElementById("f_" + f);
    if (el) el.value = "";
  });
  renderPitchTurns([]);
  setPhase("Single");
  document.getElementById("motorModal").style.display = "flex";
}
function openEditModal(id) {
  const m = getMotors().find((x) => x.id === id);
  if (!m) return;
  editingId = id;
  document.getElementById("mModalTitle").textContent = "✏️ Edit Motor Record";
  FIELDS.forEach((f) => {
    const el = document.getElementById("f_" + f);
    if (el) el.value = m[f] || "";
  });
  renderPitchTurns(m.pitchTurns || []);
  setPhase(m.phase === "Three" ? "Three" : "Single");
  document.getElementById("motorModal").style.display = "flex";
}
function closeMotorModal() {
  document.getElementById("motorModal").style.display = "none";
}
function closeMModalOutside(e) {
  if (e.target === document.getElementById("motorModal")) closeMotorModal();
}

function saveMotor() {
  const brand = document.getElementById("f_brand").value.trim();
  const phase = document.getElementById("f_phase").value;
  const type = document.getElementById("f_motorType").value;
  if (!brand || !phase || !type) {
    showToast("Please fill required fields: Brand, Phase, Type", "err");
    return;
  }
  const motors = getMotors();
  const obj = {
    id: editingId || Date.now(),
    added: editingId
      ? motors.find((m) => m.id === editingId)?.added || Date.now()
      : Date.now(),
  };
  FIELDS.forEach((f) => {
    const el = document.getElementById("f_" + f);
    if (el) obj[f] = el.value.trim();
  });
  obj.ratedPowerKW = obj.ratedPowerHP
    ? (parseFloat(obj.ratedPowerHP) * 0.7457).toFixed(4)
    : obj.ratedPowerKW;
  obj.pitchTurns = getPitchTurns();
  let updated;
  if (editingId) {
    updated = motors.map((m) => (m.id === editingId ? obj : m));
    showToast("✅ Motor updated");
  } else {
    updated = [...motors, obj];
    showToast("✅ Motor added");
  }
  saveMotors(updated);
  closeMotorModal();
  refreshAll();
}

// ============================
// DETAIL VIEW
// ============================
function openDetail(id) {
  const m = getMotors().find((x) => x.id === id);
  if (!m) return;
  document.getElementById("detailTitle").textContent =
    `${m.brand} — ${m.frameSize || "Motor Detail"}`;
  document.getElementById("detailEditBtn").onclick = () => {
    closeDetail();
    openEditModal(id);
  };
  document.getElementById("detailPdfBtn").onclick = () => saveMotorPDF(id);

  const sec = (title, icon, items) => {
    const filled = items.filter(([, v]) => v);
    if (!filled.length) return "";
    return `<div class="detail-section">
      <div class="detail-section-title"><span>${icon}</span>${title}</div>
      <div class="detail-grid">${filled.map(([l, v]) => `<div class="detail-item"><div class="di-label">${l}</div><div class="di-val">${v}</div></div>`).join("")}</div></div>`;
  };

  let pitchHtml = "";
  if (m.pitchTurns && m.pitchTurns.length) {
    pitchHtml = `<div class="detail-section"><div class="detail-section-title"><span>🔢</span>Turns per Pitch</div>
      <div class="detail-grid">${m.pitchTurns.map((pt) => `<div class="detail-item"><div class="di-label">Pitch ${pt.pitch}</div><div class="di-val">${pt.turns} turns</div></div>`).join("")}</div></div>`;
  }

  document.getElementById("detailBody").innerHTML = `
    ${sec("Nameplate Details", "🏷️", [
      ["Brand", m.brand],
      ["Manufacturer", m.manufacturer],
      ["Motor Type", m.motorType],
      ["Phase", m.phase ? m.phase + " Phase" : ""],
      ["Rated Voltage", m.ratedVoltage],
      ["Rated Current", m.ratedCurrent],
      ["Frequency", m.ratedFrequency],
      ["Rated RPM", m.ratedRPM],
      [
        "Rated Power",
        m.ratedPowerHP
          ? m.ratedPowerHP + " HP / " + m.ratedPowerKW + " kW"
          : "",
      ],
      ["Insulation Class", m.insulationClass],
      ["Efficiency", m.efficiency],
      ["Frame Size", m.frameSize],
    ])}
    ${sec("Electrical", "⚡", [["Running Current", m.runningCurrent]])}
    ${sec("Winding / Coil", "🔩", [
      ["Stator Slots", m.statorSlots],
      ["Slot Length", m.slotLength],
      ["Total Coil Turns", m.totalCoilTurns],
      ["Turns Per Coil", m.turnsPerCoil],
      ["Coil Pitch", m.coilPitch],
      ["Winding Connection", m.windingConnection],
      ["Wire Type", m.coilWireType],
      ["Wire Gauge (SWG)", m.wireGauge],
      ["Coil Weight", m.coilWeight ? m.coilWeight + " kg" : ""],
    ])}
    ${pitchHtml}
    ${
      m.phase === "Single"
        ? sec("Single Phase Coils", "🔌", [
            ["Starting Coil Turns", m.startingCoilTurns],
            ["Running Coil Turns", m.runningCoilTurns],
            [
              "Starting Coil Wt",
              m.startingCoilWeight ? m.startingCoilWeight + " kg" : "",
            ],
            [
              "Running Coil Wt",
              m.runningCoilWeight ? m.runningCoilWeight + " kg" : "",
            ],
            ["Capacitor Value", m.capacitorValue],
          ])
        : ""
    }
    ${
      m.phase === "Three"
        ? sec("Three Phase Details", "⚡", [
            ["Line Voltage", m.lineVoltage],
            ["Phase Voltage", m.phaseVoltage],
            ["Line Current", m.lineCurrent],
            ["Phase Current", m.phaseCurrent],
            ["Star/Delta", m.starDeltaConn],
          ])
        : ""
    }
    ${sec("Mechanical", "⚙️", [
      ["Shaft Diameter", m.shaftDiameter],
      ["Shaft Length", m.shaftLength],
      ["Bearing Front", m.bearingFront],
      ["Bearing Rear", m.bearingRear],
      ["Fan Size", m.fanSize],
      ["Fan Cover Size", m.fanCoverSize],
      ["Motor Weight", m.motorWeight ? m.motorWeight + " kg" : ""],
      ["Body Material", m.bodyMaterial],
    ])}
    ${sec("Repair History", "🔧", [
      ["Old Coil Weight", m.oldCoilWeight ? m.oldCoilWeight + " kg" : ""],
      ["New Coil Weight", m.newCoilWeight ? m.newCoilWeight + " kg" : ""],
    ])}
    ${
      m.notes
        ? `<div class="detail-section"><div class="detail-section-title"><span>📝</span>Notes</div>
      <div style="background:#f8fafd;border-radius:10px;padding:14px;font-size:.9rem;border:1px solid var(--border)">${m.notes}</div></div>`
        : ""
    }`;
  document.getElementById("detailModal").style.display = "flex";
}
function closeDetail() {
  document.getElementById("detailModal").style.display = "none";
}
function closeDetailOutside(e) {
  if (e.target === document.getElementById("detailModal")) closeDetail();
}

// ============================
// DELETE (auto-backup first)
// ============================
let deleteId = null;
function openDeleteConfirm(id) {
  deleteId = id;
  const m = getMotors().find((x) => x.id === id);
  document.getElementById("confirmMsg").textContent =
    `"${m?.brand} ${m?.frameSize || ""}" will be permanently deleted.`;
  document.getElementById("confirmModal").style.display = "flex";
}
function closeConfirm() {
  document.getElementById("confirmModal").style.display = "none";
  deleteId = null;
}
function confirmDelete() {
  if (!deleteId) return;
  // Auto-backup before delete
  const all = getMotors();
  dl(
    "srew_backup_before_delete_" + Date.now() + ".json",
    "application/json",
    JSON.stringify(all, null, 2),
  );
  localStorage.setItem(LS_BACKUP, Date.now().toString());
  updateBackupLabels();
  saveMotors(all.filter((m) => m.id !== deleteId));
  closeConfirm();
  showToast("🗑️ Deleted. Backup downloaded automatically.");
  refreshAll();
}

// ============================
// SETTINGS
// ============================
function changePassword() {
  const cur = document.getElementById("curPass").value;
  const nw = document.getElementById("newPass").value;
  const cn = document.getElementById("conPass").value;
  if (hashStr(cur) !== getPass()) {
    showToast("Current password is incorrect", "err");
    return;
  }
  if (nw.length < 6) {
    showToast("New password must be at least 6 characters", "err");
    return;
  }
  if (nw !== cn) {
    showToast("Passwords do not match", "err");
    return;
  }
  localStorage.setItem(LS_PASS, hashStr(nw));
  ["curPass", "newPass", "conPass"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  showToast("✅ Password changed successfully");
}
function clearAllData() {
  if (
    confirm(
      "Are you sure? This will delete ALL motor records permanently!\n\nA JSON backup will download first.",
    )
  ) {
    exportJSON();
    setTimeout(() => {
      localStorage.removeItem(LS_MOTORS);
      refreshAll();
      showToast("All data cleared. Backup downloaded.", "warn");
    }, 500);
  }
}

// ============================
// PDF — SINGLE MOTOR JOB CARD
// ============================
function saveMotorPDF(id) {
  const m = getMotors().find((x) => x.id === id);
  if (!m) {
    showToast("Motor not found", "err");
    return;
  }
  if (!window.jspdf) {
    showToast("PDF library loading, please try again in a moment.", "warn");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = 210,
    ph = 297,
    mg = 14;
  let y = 0;

  // Header
  doc.setFillColor(13, 27, 42);
  doc.rect(0, 0, pw, 28, "F");
  doc.setFillColor(244, 137, 10);
  doc.rect(0, 26, pw, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text("SHREE RAM ELECTRIC WORKS", mg, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(190, 200, 215);
  doc.text("Motor Rewinding & Repair Specialists  •  Motor Job Card", mg, 18);
  doc.text("Date: " + new Date().toLocaleDateString(), mg, 24);
  doc.setTextColor(244, 137, 10);
  doc.text("shreeramelectricwork.vercel.app", pw - mg, 24, { align: "right" });
  y = 34;

  // Motor title
  doc.setFillColor(244, 137, 10);
  doc.roundedRect(mg, y, pw - mg * 2, 11, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `${m.brand || ""}  ${m.frameSize || ""}  |  ${m.ratedPowerHP || "?"}HP  ${m.phase || ""} Phase  ${m.motorType || ""}`,
    mg + 4,
    y + 7.5,
  );
  y += 17;

  function newPageCheck() {
    if (y > ph - 24) {
      doc.addPage();
      y = 16;
      doc.setFillColor(13, 27, 42);
      doc.rect(0, 0, pw, 12, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("SHREE RAM ELECTRIC WORKS — Motor Data Sheet (cont.)", mg, 8);
      doc.setFillColor(244, 137, 10);
      doc.rect(0, 12, pw, 1.5, "F");
      y = 18;
    }
  }

  function drawSection(title, rows) {
    const filled = rows.filter(
      ([, v]) => v !== undefined && v !== null && String(v).trim() !== "",
    );
    if (!filled.length) return;
    newPageCheck();
    doc.setFillColor(237, 242, 248);
    doc.roundedRect(mg, y, pw - mg * 2, 7.5, 1, 1, "F");
    doc.setFillColor(244, 137, 10);
    doc.rect(mg, y, 3, 7.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(13, 27, 42);
    doc.text(title, mg + 6, y + 5.5);
    y += 10;
    const cols = 3,
      colW = (pw - mg * 2) / cols;
    let col = 0;
    filled.forEach(([label, val]) => {
      newPageCheck();
      const x = mg + col * colW;
      doc.setFillColor(col === 0 ? 255 : col === 1 ? 252 : 249, 252, 255);
      doc.rect(x, y, colW, 11, "F");
      doc.setDrawColor(220, 228, 238);
      doc.rect(x, y, colW, 11, "S");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(110, 130, 150);
      doc.text(String(label).toUpperCase().substring(0, 28), x + 2.5, y + 4);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(13, 27, 42);
      const v = String(val);
      doc.text(v.length > 25 ? v.substring(0, 24) + "…" : v, x + 2.5, y + 9);
      col++;
      if (col >= cols) {
        col = 0;
        y += 11;
      }
    });
    if (col > 0) y += 11;
    y += 3;
  }

  function drawPitchTurns() {
    if (!m.pitchTurns || !m.pitchTurns.length) return;
    newPageCheck();
    doc.setFillColor(237, 242, 248);
    doc.roundedRect(mg, y, pw - mg * 2, 7.5, 1, 1, "F");
    doc.setFillColor(244, 137, 10);
    doc.rect(mg, y, 3, 7.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(13, 27, 42);
    doc.text("TURNS PER PITCH", mg + 6, y + 5.5);
    y += 10;
    const colW = (pw - mg * 2) / Math.max(m.pitchTurns.length, 1);
    m.pitchTurns.forEach((pt, i) => {
      const x = mg + i * colW;
      doc.setFillColor(255, 248, 240);
      doc.rect(x, y, colW, 16, "F");
      doc.setDrawColor(244, 137, 10);
      doc.rect(x, y, colW, 16, "S");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(150, 120, 80);
      doc.text("PITCH", x + 3, y + 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(244, 137, 10);
      doc.text(pt.pitch || "-", x + 3, y + 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(13, 27, 42);
      doc.text((pt.turns || "0") + " turns", x + colW / 2, y + 12, {
        align: "center",
      });
    });
    y += 20;
  }

  drawSection("NAMEPLATE DETAILS", [
    ["Brand", m.brand],
    ["Manufacturer", m.manufacturer],
    ["Motor Type", m.motorType],
    ["Phase", m.phase ? m.phase + " Phase" : ""],
    ["Frame Size", m.frameSize],
    ["Rated Voltage", m.ratedVoltage],
    ["Rated Current", m.ratedCurrent],
    ["Frequency", m.ratedFrequency],
    ["Rated RPM", m.ratedRPM],
    ["Rated Power HP", m.ratedPowerHP ? m.ratedPowerHP + " HP" : ""],
    ["Rated Power kW", m.ratedPowerKW ? m.ratedPowerKW + " kW" : ""],
    ["Insulation Class", m.insulationClass],
    ["Efficiency", m.efficiency],
  ]);
  drawSection("ELECTRICAL", [["Running Current", m.runningCurrent]]);
  drawSection("WINDING / COIL DETAILS", [
    ["Stator Slots", m.statorSlots],
    ["Slot Length", m.slotLength],
    ["Total Coil Turns", m.totalCoilTurns],
    ["Turns Per Coil", m.turnsPerCoil],
    ["Coil Pitch", m.coilPitch],
    ["Winding Connection", m.windingConnection],
    ["Wire Type", m.coilWireType],
    ["Wire Gauge SWG", m.wireGauge],
    ["Coil Weight", m.coilWeight ? m.coilWeight + " kg" : ""],
  ]);
  drawPitchTurns();
  if (m.phase === "Single")
    drawSection("SINGLE PHASE — COIL DETAILS", [
      ["Starting Coil Turns", m.startingCoilTurns],
      ["Running Coil Turns", m.runningCoilTurns],
      [
        "Starting Coil Weight",
        m.startingCoilWeight ? m.startingCoilWeight + " kg" : "",
      ],
      [
        "Running Coil Weight",
        m.runningCoilWeight ? m.runningCoilWeight + " kg" : "",
      ],
      ["Capacitor Value", m.capacitorValue],
    ]);
  if (m.phase === "Three")
    drawSection("THREE PHASE — ELECTRICAL DETAILS", [
      ["Line Voltage", m.lineVoltage],
      ["Phase Voltage", m.phaseVoltage],
      ["Line Current", m.lineCurrent],
      ["Phase Current", m.phaseCurrent],
      ["Star/Delta", m.starDeltaConn],
    ]);
  drawSection("MECHANICAL DETAILS", [
    ["Shaft Diameter", m.shaftDiameter],
    ["Shaft Length", m.shaftLength],
    ["Bearing Front", m.bearingFront],
    ["Bearing Rear", m.bearingRear],
    ["Fan Size", m.fanSize],
    ["Fan Cover Size", m.fanCoverSize],
    ["Motor Weight", m.motorWeight ? m.motorWeight + " kg" : ""],
    ["Body Material", m.bodyMaterial],
  ]);
  drawSection("REPAIR HISTORY", [
    ["Old Coil Weight", m.oldCoilWeight ? m.oldCoilWeight + " kg" : ""],
    ["New Coil Weight", m.newCoilWeight ? m.newCoilWeight + " kg" : ""],
  ]);

  if (m.notes) {
    newPageCheck();
    doc.setFillColor(255, 248, 240);
    doc.roundedRect(mg, y, pw - mg * 2, 28, 2, 2, "F");
    doc.setDrawColor(244, 137, 10);
    doc.roundedRect(mg, y, pw - mg * 2, 28, 2, 2, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(244, 137, 10);
    doc.text("NOTES / OBSERVATIONS", mg + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(13, 27, 42);
    doc.text(doc.splitTextToSize(m.notes, pw - mg * 2 - 10), mg + 4, y + 13);
    y += 32;
  }

  // Footer
  doc.setFillColor(13, 27, 42);
  doc.rect(0, ph - 12, pw, 12, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(140, 155, 170);
  doc.text(
    "Shree Ram Electric Works  •  Motor Data Management System",
    mg,
    ph - 5,
  );
  doc.setTextColor(244, 137, 10);
  doc.text("shreeramelectricwork.vercel.app", pw - mg, ph - 5, {
    align: "right",
  });

  const fname = `SREW_${(m.brand || "Motor").replace(/\s+/g, "_")}_${m.frameSize || m.id}_JobCard.pdf`;
  doc.save(fname);
  showToast(`📄 PDF saved: ${fname}`);
}

// ============================
// PDF — ALL MOTORS LIST
// ============================
function exportAllPDF() {
  const motors = getMotors();
  if (!motors.length) {
    showToast("No motors to export", "warn");
    return;
  }
  if (!window.jspdf) {
    showToast("PDF library loading, please try again in a moment.", "warn");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pw = 297,
    ph = 210,
    mg = 12;

  doc.setFillColor(13, 27, 42);
  doc.rect(0, 0, pw, 22, "F");
  doc.setFillColor(244, 137, 10);
  doc.rect(0, 20, pw, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("SHREE RAM ELECTRIC WORKS", mg, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(190, 200, 215);
  doc.text(
    "Motor Records Report  •  Generated: " + new Date().toLocaleString(),
    mg,
    17,
  );
  doc.setTextColor(244, 137, 10);
  doc.text("Total: " + motors.length + " motors", pw - mg, 17, {
    align: "right",
  });

  const head = [
    [
      "#",
      "Brand",
      "Frame",
      "HP",
      "RPM",
      "Voltage",
      "Phase",
      "Type",
      "Wire Gauge",
      "Coil Turns",
      "Coil Wt",
      "Run Current",
      "Old Wt",
      "New Wt",
    ],
  ];
  const body = motors.map((m, i) => [
    i + 1,
    m.brand || "",
    m.frameSize || "",
    m.ratedPowerHP || "",
    m.ratedRPM || "",
    m.ratedVoltage || "",
    m.phase || "",
    m.motorType || "",
    m.wireGauge || "",
    m.totalCoilTurns || "",
    m.coilWeight || "",
    m.runningCurrent || "",
    m.oldCoilWeight || "",
    m.newCoilWeight || "",
  ]);

  doc.autoTable({
    head,
    body,
    startY: 26,
    margin: { left: mg, right: mg },
    styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [13, 27, 42] },
    headStyles: {
      fillColor: [13, 27, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 22 },
      2: { cellWidth: 16 },
    },
    didDrawPage: (data) => {
      doc.setFillColor(13, 27, 42);
      doc.rect(0, ph - 10, pw, 10, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(140, 155, 170);
      doc.text("Shree Ram Electric Works — Motor Records", mg, ph - 4);
      doc.setTextColor(244, 137, 10);
      doc.text("Page " + data.pageNumber, pw - mg, ph - 4, { align: "right" });
    },
  });

  doc.save(`SREW_All_Motors_${new Date().toISOString().split("T")[0]}.pdf`);
  showToast("📄 All motors PDF saved!");
}

// ============================
// CSV / JSON / PRINT / COPY
// ============================
function exportCSV() {
  const motors = getMotors();
  const headers = [...FIELDS, "pitchTurns"];
  const rows = motors.map((m) =>
    headers
      .map((f) => {
        const val =
          f === "pitchTurns"
            ? (m.pitchTurns || [])
                .map((pt) => `${pt.pitch}:${pt.turns}`)
                .join(" | ")
            : (m[f] || "").toString();
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(","),
  );
  dl(
    "srew_motors_export.csv",
    "text/csv",
    [headers.join(","), ...rows].join("\n"),
  );
  showToast("📊 CSV exported");
}
function exportJSON() {
  dl(
    "srew_motors_backup_" + new Date().toISOString().split("T")[0] + ".json",
    "application/json",
    JSON.stringify(getMotors(), null, 2),
  );
  localStorage.setItem(LS_BACKUP, Date.now().toString());
  updateBackupLabels();
  dismissBackup();
  showToast("💾 JSON backup downloaded & saved!");
}
function printReport() {
  const motors = getMotors();
  const w = window.open("", "_blank");
  w.document.write(`<html><head><title>SREW Motor Report</title>
    <style>body{font-family:sans-serif;padding:20px;font-size:11px}
    h1{font-size:16px;margin-bottom:2px}
    table{width:100%;border-collapse:collapse;margin-bottom:16px}
    th,td{border:1px solid #ddd;padding:5px 7px;text-align:left}
    th{background:#0d1b2a;color:#fff}tr:nth-child(even){background:#f5f5f5}
    .meta{color:#666;font-size:10px;margin-bottom:16px}</style></head><body>
    <h1>⚡ Shree Ram Electric Works</h1>
    <div class="meta">Motor Report · ${new Date().toLocaleString()} · Total: ${motors.length} records</div>
    <table><thead><tr><th>#</th><th>Brand</th><th>HP</th><th>RPM</th><th>Voltage</th>
    <th>Phase</th><th>Type</th><th>Gauge</th><th>Turns</th><th>Coil Wt</th><th>Frame</th></tr></thead><tbody>
    ${motors
      .map(
        (
          m,
          i,
        ) => `<tr><td>${i + 1}</td><td>${m.brand || ""}</td><td>${m.ratedPowerHP || ""}</td>
    <td>${m.ratedRPM || ""}</td><td>${m.ratedVoltage || ""}</td><td>${m.phase || ""}</td>
    <td>${m.motorType || ""}</td><td>${m.wireGauge || ""}</td><td>${m.totalCoilTurns || ""}</td>
    <td>${m.coilWeight || ""}</td><td>${m.frameSize || ""}</td></tr>`,
      )
      .join("")}
    </tbody></table></body></html>`);
  w.document.close();
  w.print();
}
function copyTable() {
  const motors = getMotors();
  const hdrs = [
    "Brand",
    "HP",
    "RPM",
    "Voltage",
    "Phase",
    "Type",
    "Wire Gauge",
    "Coil Turns",
    "Coil Weight",
    "Frame",
  ];
  const rows = motors.map((m) =>
    [
      m.brand,
      m.ratedPowerHP,
      m.ratedRPM,
      m.ratedVoltage,
      m.phase,
      m.motorType,
      m.wireGauge,
      m.totalCoilTurns,
      m.coilWeight,
      m.frameSize,
    ].join("\t"),
  );
  navigator.clipboard
    .writeText([hdrs.join("\t"), ...rows].join("\n"))
    .then(() => showToast("📋 Copied to clipboard"));
}
function dl(name, type, content) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
}

// ============================
// IMPORT
// ============================
function dzOver(e) {
  e.preventDefault();
  document.getElementById("dropZone").classList.add("drag-over");
}
function dzLeave() {
  document.getElementById("dropZone").classList.remove("drag-over");
}
function dzDrop(e) {
  e.preventDefault();
  dzLeave();
  const f = e.dataTransfer.files[0];
  if (f) readJSON(f);
}
function handleImport(inp) {
  if (inp.files[0]) readJSON(inp.files[0]);
}
function readJSON(file) {
  const r = new FileReader();
  r.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error();
      document.getElementById("importPreview").innerHTML = `
        <div style="background:var(--light);border-radius:12px;padding:16px;margin-top:12px;border:1px solid var(--border)">
          <strong>Preview:</strong> ${data.length} motor records found
          <div style="margin-top:14px;display:flex;gap:10px">
            <button class="btn btn-orange" onclick='importMerge(${JSON.stringify(data).replace(/'/g, "&#39;")})'>Merge (keep existing)</button>
            <button class="btn btn-red" onclick='importReplace(${JSON.stringify(data).replace(/'/g, "&#39;")})'>Replace All</button>
          </div>
        </div>`;
    } catch {
      showToast("❌ Invalid JSON file", "err");
    }
  };
  r.readAsText(file);
}
function importMerge(data) {
  const ex = getMotors();
  saveMotors([...ex, ...data.filter((d) => !ex.find((e) => e.id === d.id))]);
  refreshAll();
  showToast(`✅ Merged ${data.length} records`);
}
function importReplace(data) {
  saveMotors(data);
  refreshAll();
  showToast(`✅ Replaced with ${data.length} records`);
}

// ============================
// TOAST
// ============================
// ============================
// MOBILE SIDEBAR TOGGLE
// ============================
function openAdminSidebar() {
  document.querySelector(".sidebar").classList.add("open");
  const ov = document.getElementById("sidebarOverlay");
  if (ov) {
    ov.classList.add("open");
    ov.style.display = "block";
  }
}
function closeAdminSidebar() {
  document.querySelector(".sidebar").classList.remove("open");
  const ov = document.getElementById("sidebarOverlay");
  if (ov) {
    ov.classList.remove("open");
    ov.style.display = "none";
  }
}

function showToast(msg, type = "ok") {
  const t = document.createElement("div");
  t.className =
    "toast" + (type === "err" ? " err" : type === "warn" ? " warn" : "");
  t.innerHTML =
    (type === "err" ? "❌ " : type === "warn" ? "⚠️ " : "✅ ") + msg;
  document.getElementById("toastWrap").appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateX(40px)";
    t.style.transition = ".3s";
    setTimeout(() => t.remove(), 300);
  }, 3500);
}
