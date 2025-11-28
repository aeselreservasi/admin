    const SUPABASE_URL = "https://yuwfecfaoouylnzsdlnr.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1d2ZlY2Zhb291eWxuenNkbG5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNDk1NDksImV4cCI6MjA3OTYyNTU0OX0.L1qJlQqHQyQskTk04GSg7CowfaG4NmVhaGc02htONoY";

    const supabaseClient = supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

    const statusEl = document.getElementById("status");
    const tableBody = document.querySelector("#data-table tbody");
    const btnDownloadAll = document.getElementById("btn-download-all");
    const filterStatusSelect = document.getElementById("filter-status");
    const filterLayananSelect = document.getElementById("filter-layanan");


    // Modal edit
    const editModalEl = document.getElementById('editModal');
    const editModal = new bootstrap.Modal(editModalEl);
    const editForm = document.getElementById('edit-form');

    // Input edit
    const editId = document.getElementById('edit-id');
    const editNama = document.getElementById('edit-nama');
    const editTelepon = document.getElementById('edit-telepon');
    const editJenisUjian = document.getElementById('edit-jenis-ujian');
    const editIdPrometrik = document.getElementById('edit-id-prometrik');
    const editPassword = document.getElementById('edit-password');
    const editTglLahir = document.getElementById('edit-tgl-lahir');
    const editJenisKelamin = document.getElementById('edit-jenis-kelamin');
    const editLokasi = document.getElementById('edit-lokasi');
    const editTanggalUjian = document.getElementById('edit-tanggal-ujian');
    const editJamUjian = document.getElementById('edit-jam-ujian');

    // Simpan data terakhir yang di-load untuk bisa di-download semua
    let currentRows = [];

    function applyFilters() {
      if (!currentRows || currentRows.length === 0) {
        tableBody.innerHTML = "";
        statusEl.textContent = "Belum ada data.";
        return;
      }

      const selectedStatus = filterStatusSelect ? filterStatusSelect.value : "ALL";
      const selectedLayanan = filterLayananSelect ? filterLayananSelect.value : "ALL";

      let rows = currentRows.slice();

      // Filter status
      if (selectedStatus !== "ALL") {
        rows = rows.filter(row => {
          const status = (row.status_pembayaran || "BELUM BAYAR").toUpperCase();
          return status === selectedStatus.toUpperCase();
        });
      }

      // Filter layanan
      if (selectedLayanan !== "ALL") {
        rows = rows.filter(row => {
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
      const bulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
      const [y, m, d] = isoDate.split("-");
      const tanggal = String(d).padStart(2, "0");
      return `${tanggal} ${bulan[parseInt(m)-1]} ${y}`;
    }

    async function loadData() {
      statusEl.textContent = "Memuat data dari Supabase...";

      const { data, error } = await supabaseClient
        .from("reservasi_ujian")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase select error:", error);
        statusEl.textContent =
          "Gagal memuat data dari Supabase. Cek console untuk detail error.";
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
    }

function renderTable(rows) {
  tableBody.innerHTML = "";

  rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    const jenisText = `${row.jenis_ujian_nama}`;
    
    // mapping status ke badge
    const rawStatus = row.status_pembayaran || "BELUM BAYAR";
    const status = rawStatus.toUpperCase();

    let badgeClass = "bg-secondary";

    // Lunas
    if (status === "SETTLEMENT") {
      badgeClass = "bg-success";
    // Belum Bayar → merah
    } else if (status === "BELUM BAYAR") {
      badgeClass = "bg-danger";
    // Pending → kuning
    } else if (status === "PENDING") {
      badgeClass = "bg-warning text-dark";
    // Cancel / error → merah
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

        // Builder JSON untuk satu row (dipakai per-row & untuk ZIP)
    function buildJsonFromRow(row) {
      return {
        "Nama Lengkap": row.nama_lengkap || "",
        "Nomor Telepon": row.nomor_telepon || "",
        "Jenis Ujian": row.jenis_ujian_kode || "",
        "ID Prometrik": row.id_prometrik || "",
        "Password": row.password || "",
        "Tanggal Lahir": row.tanggal_lahir || "",
        "Jenis Kelamin": row.jenis_kelamin || "",
        "Lokasi Ujian": row.lokasi_ujian || "",
        "Tanggal Ujian": row.tanggal_ujian || "",
        "Jam Ujian": row.jam_ujian || ""
      };
    }

    // Download satu peserta (file JSON tunggal)
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

    // Download semua dalam 1 ZIP (tiap peserta 1 file JSON)
    async function downloadAllAsZip() {
      if (!currentRows || currentRows.length === 0) {
        alert("Belum ada data untuk di-download.");
        return;
      }

      statusEl.textContent = "Mempersiapkan file ZIP...";

      const zip = new JSZip();

      currentRows.forEach(row => {
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

        // Buka modal edit & isi data
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

    // Simpan perubahan dari modal
    editForm.addEventListener('submit', async (e) => {
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

      statusEl.textContent = "Menyimpan perubahan ke Supabase...";

      const { data, error } = await supabaseClient
        .from('reservasi_ujian')
        .update({
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
          jam_ujian: jamUjian
        })
        .eq('id', id);

      if (error) {
        console.error("Supabase update error:", error);
        alert("Gagal menyimpan perubahan. Cek console untuk detail error.");
        statusEl.textContent = "Gagal menyimpan perubahan.";
        return;
      }

      editModal.hide();
      statusEl.textContent = "Perubahan berhasil disimpan.";
      loadData();
    });

    // Hapus row
    async function deleteRow(row) {
      const nama = row.nama_lengkap || "(tanpa nama)";
      const konfirmasi = confirm(`Yakin ingin menghapus data:\n${nama}?`);
      if (!konfirmasi) return;

      statusEl.textContent = "Menghapus data dari Supabase...";

      const { error } = await supabaseClient
        .from('reservasi_ujian')
        .delete()
        .eq('id', row.id);

      if (error) {
        console.error("Supabase delete error:", error);
        alert("Gagal menghapus data. Cek console untuk detail error.");
        statusEl.textContent = "Gagal menghapus data.";
        return;
      }

      statusEl.textContent = "Data berhasil dihapus.";
      loadData();
    }
    async function setStatusLunas(row) {
    const nama = row.nama_lengkap || "(tanpa nama)";
    const invoice = row.order_id || "-";

    const konfirmasi = confirm(
      `Set status LUNAS untuk:\n` +
      `Nama   : ${nama}\n` +
      `Invoice: ${invoice}\n\n` +
      `Pastikan sudah terima pembayaran.`
    );
    if (!konfirmasi) return;

    statusEl.textContent = "Mengubah status pembayaran menjadi LUNAS...";

    const { error } = await supabaseClient
      .from('reservasi_ujian')
      .update({ status_pembayaran: 'SETTLEMENT' })
      .eq('id', row.id);

    if (error) {
      console.error("Supabase update status error:", error);
      alert("Gagal mengubah status pembayaran. Cek console untuk detail error.");
      statusEl.textContent = "Gagal mengubah status pembayaran.";
      return;
    }

    statusEl.textContent = "Status pembayaran berhasil diubah menjadi LUNAS.";
    loadData(); // refresh tabel
  }

  function normalizePhoneForWa(phone) {
  if (!phone) return null;
  let p = phone.replace(/\D/g, ''); // buang semua non digit

  // kalau mulai dengan 0 → jadikan 62
  if (p.startsWith('0')) {
    p = '62' + p.slice(1);
  } else if (p.startsWith('8')) {
    // user kadang nulis 895... tanpa 0
    p = '62' + p;
  }

  // kalau nggak mulai dengan 62 di titik ini, kita anggap invalid
  if (!p.startsWith('62')) return null;

  return p;
}

function chatPeserta(row) {
  const phone = normalizePhoneForWa(row.nomor_telepon);
  if (!phone) {
    alert('Nomor telepon peserta tidak valid atau kosong.');
    return;
  }

  const status = (row.status_pembayaran || 'BELUM BAYAR').toUpperCase();

  // Opsional: warning kalau belum SETTLEMENT
  if (status !== 'SETTLEMENT') {
    const ok = confirm(
      `Status pembayaran di sistem saat ini: ${status}.\n` +
      `Biasanya pesan LUNAS hanya dikirim jika status sudah SETTLEMENT.\n\n` +
      `Tetap kirim pesan LUNAS ke peserta?`
    );
    if (!ok) return;
  }

  const layanan = (row.layanan || 'reservasi').toLowerCase();
  const nama = row.nama_lengkap || '-';
  const jenisUjian = row.jenis_ujian_nama || row.jenis_ujian_kode || '-';
  const lokasi = row.lokasi_ujian || '-';
  const tanggal = row.tanggal_ujian || '-';
  const jam = row.jam_ujian || '-';
  const invoice = row.order_id || '-';

  let layananLine = '';
  let extraInfo = '';

  if (layanan === 'reschedule') {
    layananLine = 'Layanan     : Reschedule (Biaya admin Rp 50.000)\n';
    extraInfo =
      `pembayaran sudah tercatat *LUNAS* di sistem kami.\n`;
  } else {
    layananLine = 'Layanan     : Reservasi Ujian\n';
    extraInfo =
      `Pendaftaran dan pembayaran ujian Anda sudah kami terima dan tercatat *LUNAS* di sistem.\n`;
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
    `${extraInfo}`\n` +
    `Terima kasih.\n` +
    `- Admin Aesel Reservasi -`;

  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`;
  window.open(waUrl, '_blank');
}

  if (filterStatusSelect) {
    filterStatusSelect.addEventListener("change", applyFilters);
  }
  if (filterLayananSelect) {
    filterLayananSelect.addEventListener("change", applyFilters);
  }

  btnDownloadAll.addEventListener("click", downloadAllAsZip);
  loadData();
