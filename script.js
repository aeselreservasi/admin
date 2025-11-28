const FUNCTION_URL = "https://yuwfecfaoouylnzsdlnr.supabase.co/functions/v1/admin";
const statusEl = document.getElementById("status");
const tableBody = document.querySelector("#data-table tbody");
const btnDownloadAll = document.getElementById("btn-download-all");
const filterStatusSelect = document.getElementById("filter-status");
const filterLayananSelect = document.getElementById("filter-layanan");
const editModalEl = document.getElementById("editModal");
const editModal = new bootstrap.Modal(editModalEl);
const editForm = document.getElementById("edit-form");
const editId = document.getElementById("edit-id");
const editNama = document.getElementById("edit-nama");
const editTelepon = document.getElementById("edit-telepon");
const editJenisUjian = document.getElementById("edit-jenis-ujian");
const editIdPrometrik = document.getElementById("edit-id-prometrik");
const editPassword = document.getElementById("edit-password");
const editTglLahir = document.getElementById("edit-tgl-lahir");
const editJenisKelamin = document.getElementById("edit-jenis-kelamin");
const editLokasi = document.getElementById("edit-lokasi");
const editTanggalUjian = document.getElementById("edit-tanggal-ujian");
const editJamUjian = document.getElementById("edit-jam-ujian");
let currentRows = [];
async function callFunction(action, payload, method = "POST") {
  const url = method === "GET" ? `${FUNCTION_URL}?action=${encodeURIComponent(action)}` : `${FUNCTION_URL}?action=${encodeURIComponent(action)}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (method !== "GET" && payload) {
    options.body = JSON.stringify(payload);
  }
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}
function applyFilters() {
  if (!currentRows || currentRows.length === 0) {
    tableBody.innerHTML = "";
    statusEl.textContent = "Belum ada data.";
    return;
  }
  const selectedStatus = filterStatusSelect ? filterStatusSelect.value : "ALL";
  const selectedLayanan = filterLayananSelect ? filterLayananSelect.value : "ALL";
  let rows = currentRows.slice();
  if (selectedStatus !== "ALL") {
    rows = rows.filter((row) => {
      const status = (row.status_pembayaran || "BELUM BAYAR").replace(/_/g, " ").toUpperCase();
      return status === selectedStatus.toUpperCase();
    });
  }
  if (selectedLayanan !== "ALL") {
    rows = rows.filter((row) => {
      const lay = (row.layanan || "").toLowerCase();
      return lay === selectedLayanan.toLowerCase();
    });
  }
  renderTable(rows);
  let info = `Total data: ${rows.length}`;
  const filterInfo = [];
  if (selectedLayanan !== "ALL") filterInfo.push(`Layanan: ${selectedLayanan}`);
  if (selectedStatus !== "ALL") filterInfo.push(`Status: ${selectedStatus}`);
  if (filterInfo.length > 0) info += ` (${filterInfo.join(", ")})`;
  statusEl.textContent = info;
}
function formatTanggalIndo(isoDate) {
  if (!isoDate) return "";
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const [y, m, d] = isoDate.split("-");
  const tanggal = String(d).padStart(2, "0");
  return `${tanggal} ${bulan[parseInt(m) - 1]} ${y}`;
}
async function loadData() {
  statusEl.textContent = "Memuat data dari server...";
  try {
    const { data, error } = await callFunction("list", null, "GET");
    if (error) {
      console.error("Function list error:", error);
      statusEl.textContent = "Gagal memuat data dari server. Cek console untuk detail error.";
      return;
    }
    if (!data || data.length === 0) {
      statusEl.textContent = "Belum ada data.";
      currentRows = [];
      tableBody.innerHTML = "";
      return;
    }
    currentRows = data;
    applyFilters();
  } catch (err) {
    console.error("loadData error:", err);
    statusEl.textContent = "Terjadi kesalahan saat memuat data. Cek console untuk detail error.";
  }
}
function renderTable(rows) {
  tableBody.innerHTML = "";
  rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    const jenisText = `${row.jenis_ujian_nama}`;
    const rawStatus = (row.status_pembayaran || "BELUM BAYAR").replace(/_/g, " ");
    const status = rawStatus.toUpperCase();
    let badgeClass = "bg-secondary";
    if (status === "SETTLEMENT") {
      badgeClass = "bg-success";
    } else if (status === "BELUM BAYAR") {
      badgeClass = "bg-danger";
    } else if (status === "PENDING") {
      badgeClass = "bg-warning text-dark";
    } else if (status === "CANCEL" || status === "EXPIRE" || status === "DENY") {
      badgeClass = "bg-danger";
    }
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <strong>${row.nama_lengkap || "-"}</strong><br>
        <span class="text-muted" style="font-size: 0.8rem;">${row.nomor_telepon || "-"}</span>
      </td>
      <td>
        <span class="badge rounded-pill badge-jenis">${jenisText}</span>
      </td>
      <td>${row.lokasi_ujian || "-"}</td>
      <td>${row.tanggal_ujian || "-"}</td>
      <td>${row.jam_ujian || "-"}</td>
      <td>
        <span class="badge ${badgeClass}">${status}</span><br>
        <small class="text-muted" style="font-size: 0.7rem;">
          ${row.order_id || "-"}
        </small>
      </td>
      <td>
        <button class="btn btn-sm btn-download">Download</button>
        <button class="btn btn-sm btn-outline-secondary ms-1 btn-edit">Edit</button>
        <button class="btn btn-sm btn-outline-danger ms-1 btn-delete">Delete</button>
        <button class="btn btn-sm btn-success ms-1 btn-set-lunas">Set Lunas</button>
        <button class="btn btn-sm btn-outline-success ms-1 btn-chat-wa">Chat Peserta</button>
      </td>
    `;
    const btnDownload = tr.querySelector(".btn-download");
    const btnEdit = tr.querySelector(".btn-edit");
    const btnDelete = tr.querySelector(".btn-delete");
    const btnSetLunas = tr.querySelector(".btn-set-lunas");
    const btnChatWa = tr.querySelector(".btn-chat-wa");
    btnDownload.addEventListener("click", () => downloadJsonForRow(row));
    btnEdit.addEventListener("click", () => openEditModal(row));
    btnDelete.addEventListener("click", () => deleteRow(row));
    btnSetLunas.addEventListener("click", () => setStatusLunas(row));
    btnChatWa.addEventListener("click", () => chatPeserta(row));
    tableBody.appendChild(tr);
  });
}
function buildJsonFromRow(row) {
  return {
    "Nama Lengkap": row.nama_lengkap || "",
    "Nomor Telepon": row.nomor_telepon || "",
    "Jenis Ujian": row.jenis_ujian_kode || "",
    "ID Prometrik": row.id_prometrik || "",
    Password: row.password || "",
    "Tanggal Lahir": row.tanggal_lahir || "",
    "Jenis Kelamin": row.jenis_kelamin || "",
    "Lokasi Ujian": row.lokasi_ujian || "",
    "Tanggal Ujian": row.tanggal_ujian || "",
    "Jam Ujian": row.jam_ujian || "",
  };
}
function downloadJsonForRow(row) {
  const payload = buildJsonFromRow(row);
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const nama = (row.nama_lengkap || "noname").trim();
  const kode = row.jenis_ujian_kode || "UNKNOWN";
  const safeNama = nama.replace(/[\\/:*?"<>|]/g, "");
  const fileName = `${safeNama}-${kode}.json`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
async function downloadAllAsZip() {
  if (!currentRows || currentRows.length === 0) {
    alert("Belum ada data untuk di-download.");
    return;
  }
  statusEl.textContent = "Mempersiapkan file ZIP...";
  const zip = new JSZip();
  currentRows.forEach((row) => {
    const payload = buildJsonFromRow(row);
    const jsonString = JSON.stringify(payload, null, 2);
    const nama = (row.nama_lengkap || "noname").trim();
    const kode = row.jenis_ujian_kode || "UNKNOWN";
    const safeNama = nama.replace(/[\\/:*?"<>|]/g, "");
    const fileName = `${safeNama}-${kode}.json`;
    zip.file(fileName, jsonString);
  });
  try {
    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = "reservasi_ujian-json.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    statusEl.textContent = `ZIP berhasil dibuat. Total file: ${currentRows.length}`;
  } catch (err) {
    console.error("Error generate ZIP:", err);
    statusEl.textContent = "Gagal membuat ZIP. Cek console untuk detail error.";
  }
}
function openEditModal(row) {
  editId.value = row.id;
  editNama.value = row.nama_lengkap || "";
  editTelepon.value = row.nomor_telepon || "";
  editJenisUjian.value = row.jenis_ujian_kode || "";
  editIdPrometrik.value = row.id_prometrik || "";
  editPassword.value = row.password || "";
  editTglLahir.value = row.tanggal_lahir_iso || "";
  editJenisKelamin.value = row.jenis_kelamin || "";
  editLokasi.value = row.lokasi_ujian || "";
  editTanggalUjian.value = row.tanggal_ujian_iso || "";
  editJamUjian.value = row.jam_ujian || "";
  editModal.show();
}
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = editId.value;
  if (!id) {
    alert("ID tidak ditemukan.");
    return;
  }
  const nama = editNama.value.trim();
  const telepon = editTelepon.value.trim();
  const kodeUjian = editJenisUjian.value;
  const jenisOption = editJenisUjian.options[editJenisUjian.selectedIndex];
  const namaJenisUjian = jenisOption ? jenisOption.textContent : kodeUjian;
  const idPrometrik = editIdPrometrik.value.trim();
  const password = editPassword.value.trim();
  const tglLahirIso = editTglLahir.value || null;
  const jenisKelamin = editJenisKelamin.value || null;
  const lokasi = editLokasi.value.trim();
  const tanggalUjianIso = editTanggalUjian.value;
  const jamUjian = editJamUjian.value.trim();
  if (!nama || !telepon || !kodeUjian || !idPrometrik || !password || !tanggalUjianIso || !jamUjian) {
    alert("Beberapa field wajib masih kosong.");
    return;
  }
  const tglLahirFormatted = tglLahirIso ? formatTanggalIndo(tglLahirIso) : null;
  const tanggalUjianFormatted = formatTanggalIndo(tanggalUjianIso);
  statusEl.textContent = "Menyimpan perubahan ke server...";
  try {
    const payload = {
      id: Number(id),
      nama_lengkap: nama,
      nomor_telepon: telepon,
      jenis_ujian_kode: kodeUjian,
      jenis_ujian_nama: namaJenisUjian,
      id_prometrik: idPrometrik,
      password: password,
      tanggal_lahir_iso: tglLahirIso,
      tanggal_lahir: tglLahirFormatted,
      jenis_kelamin: jenisKelamin,
      lokasi_ujian: lokasi,
      tanggal_ujian_iso: tanggalUjianIso,
      tanggal_ujian: tanggalUjianFormatted,
      jam_ujian: jamUjian,
    };
    const { error } = await callFunction("update", payload, "POST");
    if (error) {
      console.error("Update error:", error);
      alert("Gagal menyimpan perubahan. Cek console untuk detail error.");
      statusEl.textContent = "Gagal menyimpan perubahan.";
      return;
    }
    editModal.hide();
    statusEl.textContent = "Perubahan berhasil disimpan.";
    loadData();
  } catch (err) {
    console.error("Update error:", err);
    alert("Gagal menyimpan perubahan. Cek console untuk detail error.");
    statusEl.textContent = "Gagal menyimpan perubahan.";
  }
});
async function deleteRow(row) {
  const nama = row.nama_lengkap || "(tanpa nama)";
  const konfirmasi = confirm(`Yakin ingin menghapus data:\n${nama}?`);
  if (!konfirmasi) return;
  statusEl.textContent = "Menghapus data dari server...";
  try {
    const payload = { id: row.id };
    const { error } = await callFunction("delete", payload, "POST");
    if (error) {
      console.error("Delete error:", error);
      alert("Gagal menghapus data. Cek console untuk detail error.");
      statusEl.textContent = "Gagal menghapus data.";
      return;
    }
    statusEl.textContent = "Data berhasil dihapus.";
    loadData();
  } catch (err) {
    console.error("Delete error:", err);
    alert("Gagal menghapus data. Cek console untuk detail error.");
    statusEl.textContent = "Gagal menghapus data.";
  }
}
async function setStatusLunas(row) {
  const nama = row.nama_lengkap || "(tanpa nama)";
  const invoice = row.order_id || "-";
  const konfirmasi = confirm(`Set status LUNAS untuk:\n` + `Nama   : ${nama}\n` + `Invoice: ${invoice}\n\n` + `Pastikan sudah terima pembayaran.`);
  if (!konfirmasi) return;
  statusEl.textContent = "Mengubah status pembayaran menjadi LUNAS...";
  try {
    const payload = { id: row.id };
    const { error } = await callFunction("set_lunas", payload, "POST");
    if (error) {
      console.error("Set lunas error:", error);
      alert("Gagal mengubah status pembayaran. Cek console untuk detail error.");
      statusEl.textContent = "Gagal mengubah status pembayaran.";
      return;
    }
    statusEl.textContent = "Status pembayaran berhasil diubah menjadi LUNAS.";
    loadData();
  } catch (err) {
    console.error("Set lunas error:", err);
    alert("Gagal mengubah status pembayaran. Cek console untuk detail error.");
    statusEl.textContent = "Gagal mengubah status pembayaran.";
  }
}
function normalizePhoneForWa(phone) {
  if (!phone) return null;
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("0")) {
    p = "62" + p.slice(1);
  } else if (p.startsWith("8")) {
    p = "62" + p;
  }
  if (!p.startsWith("62")) return null;
  return p;
}
function chatPeserta(row) {
  const phone = normalizePhoneForWa(row.nomor_telepon);
  if (!phone) {
    alert("Nomor telepon peserta tidak valid atau kosong.");
    return;
  }
  const status = (row.status_pembayaran || "BELUM BAYAR").replace(/_/g, " ").toUpperCase();
  if (status !== "SETTLEMENT") {
    const ok = confirm(`Status pembayaran di sistem saat ini: ${status}.\n` + `Biasanya pesan LUNAS hanya dikirim jika status sudah SETTLEMENT.\n\n` + `Tetap kirim pesan LUNAS ke peserta?`);
    if (!ok) return;
  }
  const layanan = (row.layanan || "reservasi").toLowerCase();
  const nama = row.nama_lengkap || "-";
  const jenisUjian = row.jenis_ujian_nama || row.jenis_ujian_kode || "-";
  const lokasi = row.lokasi_ujian || "-";
  const tanggal = row.tanggal_ujian || "-";
  const jam = row.jam_ujian || "-";
  const invoice = row.order_id || "-";
  let layananLine = "";
  let extraInfo = "";
  if (layanan === "reschedule") {
    layananLine = "Layanan     : Reschedule (Biaya admin Rp 50.000)\n";
    extraInfo = `pembayaran sudah tercatat *LUNAS* di sistem kami.\n`;
  } else {
    layananLine = "Layanan     : Reservasi Ujian\n";
    extraInfo = `Pendaftaran dan pembayaran ujian Anda sudah kami terima dan tercatat *LUNAS* di sistem.\n`;
  }
  const pesan =
    `*KONFIRMASI PEMBAYARAN UJIAN LUNAS*\n` +
    `--------------------------------\n` +
    `Kode Invoice : *${invoice}*\n` +
    `Status       : *LUNAS*\n` +
    `--------------------------------\n` +
    `*Data Peserta*\n` +
    `Nama         : ${nama}\n` +
    `${layananLine}` +
    `Jenis Ujian  : ${jenisUjian}\n` +
    `Lokasi Ujian : ${lokasi}\n` +
    `Tanggal Ujian: ${tanggal}\n` +
    `Jam Ujian    : ${jam}\n` +
    `--------------------------------\n` +
    `${extraInfo}` +
    `Terima kasih.\n` +
    `- Admin Aesel Reservasi -`;
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`;
  window.open(waUrl, "_blank");
}
if (filterStatusSelect) {
  filterStatusSelect.addEventListener("change", applyFilters);
}
if (filterLayananSelect) {
  filterLayananSelect.addEventListener("change", applyFilters);
}
btnDownloadAll.addEventListener("click", downloadAllAsZip);
loadData();
