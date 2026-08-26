function pindahHalaman(id) {
    document.querySelectorAll('.tab-content').forEach(h => h.classList.remove('aktif'));
    document.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('aktif');
    if(id === 'halaman-kasir') document.getElementById('tab-kasir').classList.add('active');
    if(id === 'halaman-admin') document.getElementById('tab-admin').classList.add('active');
    if(id === 'halaman-laporan') document.getElementById('tab-laporan').classList.add('active');
}

const produkAwal = [
    { id: "1", nama: "Minyak Goreng 2L (Dus)", modal: 145000, harga: 165000, stok: 20 },
    { id: "2", nama: "Mie Instan (Dus)", modal: 100000, harga: 115000, stok: 45 },
    { id: "3", nama: "Gula Pasir 10kg", modal: 120000, harga: 140000, stok: 15 }
];

let dataMentahProduk = localStorage.getItem('grosir_master_produk');
let daftarProduk = produkAwal;

try {
    if (dataMentahProduk) {
        let cekData = JSON.parse(dataMentahProduk);
        if (cekData.length > 0 && typeof cekData.modal !== 'undefined') {
            daftarProduk = cekData;
        } else {
            localStorage.clear();
            daftarProduk = produkAwal;
        }
    }
} catch(e) {
    localStorage.clear();
    daftarProduk = produkAwal;
}

let keranjang = JSON.parse(localStorage.getItem('grosir_keranjang')) || [];
let riwayatPenjualan = JSON.parse(localStorage.getItem('grosir_riwayat_penjualan')) || [];
let totalBelanja = 0;

window.onload = function() { refreshSemuaData(); };

function refreshSemuaData() {
    localStorage.setItem('grosir_master_produk', JSON.stringify(daftarProduk));
    localStorage.setItem('grosir_keranjang', JSON.stringify(keranjang));
    localStorage.setItem('grosir_riwayat_penjualan', JSON.stringify(riwayatPenjualan));
    renderPilihanProdukKasir(); renderKeranjang(); renderTabelMasterProduk(); renderLaporanKeuangan();
}

function renderTabelMasterProduk() {
    const t = document.getElementById('tabel-master-produk'); if(!t) return; t.innerHTML = '';
    daftarProduk.forEach((p) => {
        t.innerHTML += `<tr><td><strong>${p.nama}</strong></td><td>Rp${p.modal.toLocaleString('id-ID')}</td><td>Rp${p.harga.toLocaleString('id-ID')}</td><td style="color:${p.stok<=5?'red':'black'}; font-weight:bold;">${p.stok} Pcs</td><td><button class="btn-warning" onclick="picuEditProduk('${p.id}')">✏️</button><button class="btn-sm-danger" onclick="hapusProduk('${p.id}')">🗑️</button></td></tr>`;
    });
}

function simpanProduk(e) {
    e.preventDefault();
    const idEdit = document.getElementById('edit-id').value;
    const nama = document.getElementById('input-nama').value;
    const modal = parseInt(document.getElementById('input-modal').value);
    const harga = parseInt(document.getElementById('input-harga').value);
    const stok = parseInt(document.getElementById('input-stok').value);

    if (idEdit) {
        const idx = daftarProduk.findIndex(p => p.id === idEdit); daftarProduk[idx] = { id: idEdit, nama, modal, harga, stok }; batalEdit();
    } else { dataBaru = { id: Date.now().toString(), nama, modal, harga, stok }; daftarProduk.push(dataBaru); }
    document.getElementById('form-produk').reset(); refreshSemuaData();
}

function picuEditProduk(id) {
    const p = daftarProduk.find(x => x.id === id);
    if (p) {
        document.getElementById('edit-id').value = p.id; document.getElementById('input-nama').value = p.nama; document.getElementById('input-modal').value = p.modal; document.getElementById('input-harga').value = p.harga; document.getElementById('input-stok').value = p.stok;
        document.getElementById('btn-simpan-produk').innerText = "Simpan Perubahan"; document.getElementById('btn-batal-edit').classList.remove('d-none');
    }
}

function batalEdit() { document.getElementById('edit-id').value = ''; document.getElementById('btn-simpan-produk').innerText = "Simpan Produk"; document.getElementById('btn-batal-edit').classList.add('d-none'); }
function hapusProduk(id) { if (confirm("Hapus produk?")) { daftarProduk = daftarProduk.filter(p => p.id !== id); refreshSemuaData(); } }

// FUNGSI MANDIRI MEMASUKKAN BARANG KE DAFTAR PILIHAN KASIR DI ATAS
function renderPilihanProdukKasir() {
    const s = document.getElementById('pilih-produk'); if(!s) return; s.innerHTML = '<option value="" disabled selected>-- Pilih Barang --</option>';
    daftarProduk.forEach(p => { s.innerHTML += `<option value="${p.id}">${p.nama}</option>`; });
    updateInfoHarga();
}

function updateInfoHarga() {
    const id = document.getElementById('pilih-produk').value; const p = daftarProduk.find(x => x.id === id);
    if (p) { document.getElementById('info-stok').value = p.stok + " Pcs"; document.getElementById('harga-satuan').value = "Rp" + p.harga.toLocaleString('id-ID'); } 
    else { document.getElementById('info-stok').value = "0"; document.getElementById('harga-satuan').value = "Rp0"; }
}

function tambahKeKeranjang(e) {
    e.preventDefault(); const id = document.getElementById('pilih-produk').value; const qty = parseInt(document.getElementById('jumlah-beli').value); const p = daftarProduk.find(x => x.id === id);
    if (!p) return; if (qty > p.stok) { alert(`Stok kurang! Sisa: ${p.stok}`); return; }
    const idx = keranjang.findIndex(item => item.id === id);
    if (idx > -1) {
        if ((keranjang[idx].qty + qty) > p.stok) { alert("Jumlah total melebihi stok gudang!"); return; }
        keranjang[idx].qty += qty; keranjang[idx].subtotal = keranjang[idx].qty * p.harga;
    } else { keranjang.push({ id, nama: p.nama, modal: p.modal, harga: p.harga, qty, subtotal: p.harga * qty }); }
    refreshSemuaData(); document.getElementById('jumlah-beli').value = 1;
}

function renderKeranjang() {
    const t = document.getElementById('tabel-keranjang'); if(!t) return; t.innerHTML = ''; totalBelanja = 0;
    if (keranjang.length === 0) { t.innerHTML = `<tr><td colspan="5" style="text-align:center;color:gray;">Keranjang Kosong</td></tr>`; document.getElementById('total-belanja').innerText = "Rp0"; document.getElementById('uang-kembali').value = "Rp0"; return; }
    keranjang.forEach((item, idx) => {
        totalBelanja += item.subtotal;
        t.innerHTML += `<tr><td>${item.nama}</td><td>Rp${item.harga.toLocaleString('id-ID')}</td><td>${item.qty}</td><td>Rp${item.subtotal.toLocaleString('id-ID')}</td><td><button class="btn-sm-danger" onclick="hapusItemKeranjang(${idx})">❌</button></td></tr>`;
    });
    document.getElementById('total-belanja').innerText = "Rp" + totalBelanja.toLocaleString('id-ID'); hitungKembalian();
}

function hapusItemKeranjang(idx) { keranjang.splice(idx, 1); refreshSemuaData(); }
function hitungKembalian() {
    const bayar = parseInt(document.getElementById('uang-bayar').value) || 0; const kembali = document.getElementById('uang-kembali');
    if (bayar >= totalBelanja) { kembali.value = "Rp" + (bayar - totalBelanja).toLocaleString('id-ID'); kembali.style.color = "green"; } 
    else { kembali.value = "Uang Kurang"; kembali.style.color = "red"; }
}

function selesaikanTransaksi() {
    if (keranjang.length === 0) { alert("Keranjang kosong!"); return; }
    const bayar = parseInt(document.getElementById('uang-bayar').value) || 0; if (bayar < totalBelanja) { alert("Pembayaran kurang!"); return; }
    const waktu = new Date().toLocaleString('id-ID'); const sItems = document.getElementById('struk-items'); sItems.innerHTML = '';

    keranjang.forEach(item => {
        const pm = daftarProduk.find(x => x.id === item.id);
        if (pm) {
            pm.stok -= item.qty; riwayatPenjualan.push({ waktu, nama: item.nama, qty: item.qty, totalJual: item.subtotal, totalModal: item.modal * item.qty, laba: (item.harga - item.modal) * item.qty });
            sItems.innerHTML += `<div class="flex-box"><span>${item.nama} (x${item.qty})</span><span>Rp${item.subtotal.toLocaleString('id-ID')}</span></div>`;
        }
    });

    document.getElementById('struk-waktu').innerText = waktu; document.getElementById('struk-total').innerText = "Rp" + totalBelanja.toLocaleString('id-ID');
    document.getElementById('struk-tunai').innerText = "Rp" + bayar.toLocaleString('id-ID'); document.getElementById('struk-kembali').innerText = "Rp" + (bayar - totalBelanja).toLocaleString('id-ID');
    document.getElementById('konten-aplikasi').classList.add('d-none'); document.getElementById('area-cetak-struk').classList.remove('d-none');
    keranjang = []; document.getElementById('uang-bayar').value = ''; refreshSemuaData();
}

function tutupStruk() { document.getElementById('konten-aplikasi').classList.remove('d-none'); document.getElementById('area-cetak-struk').classList.add('d-none'); }
function resetKasir() { if(confirm("Kosongkan keranjang?")) { keranjang = []; document.getElementById('uang-bayar').value = ''; refreshSemuaData(); } }

function renderLaporanKeuangan() {
    const t = document.getElementById('tabel-riwayat-penjualan'); if(!t) return; t.innerHTML = '';
    let omset = 0, modal = 0, laba = 0;
    if (riwayatPenjualan.length === 0) { t.innerHTML = `<tr><td colspan="5" style="text-align:center;color:gray;">Belum ada riwayat transaksi</td></tr>`; } 
    else {
        [...riwayatPenjualan].reverse().forEach(n => {
            omset += n.totalJual; modal += n.totalModal; laba += n.laba;
            t.innerHTML += `<tr><td><small>${n.waktu}</small></td><td><strong>${n.nama}</strong></td><td>${n.qty}</td><td>Rp${n.totalJual.toLocaleString('id-ID')}</td><td style="color:green;font-weight:bold;">+Rp${n.laba.toLocaleString('id-ID')}</td></tr>`;
        });
    }
    document.getElementById('lap-omset').innerText = "Rp" + omset.toLocaleString('id-ID');
    document.getElementById('lap-modal').innerText = "Rp" + modal.toLocaleString('id-ID');
    document.getElementById('lap-untung').innerText = "Rp" + laba.toLocaleString('id-ID');
}
