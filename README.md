# DomPin 👛 - Dompet Pintar
## 📖 Tentang DomPin

**DomPin** adalah singkatan dari **"Dompet Pintar"** — sebuah aplikasi web mobile-friendly yang dirancang untuk membantu pengguna mengelola keuangan harian secara intuitif, modern, dan bijak.

Aplikasi ini memungkinkan Anda untuk:
- ✅ Melacak pengeluaran harian dengan mudah
- 📊 Memvisualisasikan distribusi spending dengan chart interaktif
- 💰 Mengelola budget bulanan dan per kategori
- 🎨 Menikmati pengalaman menggunakan app dengan dark/light mode
- 📱 Mengakses dari berbagai device dengan responsive design

---

## ✨ Fitur Utama

### MVP Features (Required)

#### 1️⃣ Input Form Transaksi
- Input nama barang, jumlah (Rupiah), dan kategori
- Validasi semua field harus terisi
- Tambah transaksi ke daftar dengan satu klik

#### 2️⃣ Daftar Transaksi
- List scrollable semua transaksi
- Menampilkan nama, kategori, waktu, dan jumlah
- Hapus transaksi dengan konfirmasi

#### 3️⃣ Total Saldo
- Display total pengeluaran bulan ini
- Auto-update saat transaksi ditambah/dihapus
- Format Rupiah yang mudah dibaca

#### 4️⃣ Visualisasi Chart
- **Pie Chart**: Distribusi pengeluaran per kategori
- **Line Chart**: Trend spending bulanan
- Update otomatis saat data berubah

---

## 🌟 Enhanced Features & Challenges Completed

Aplikasi ini berhasil menyelesaikan **SEMUA (5/5) Optional Challenges** yang diminta, melebihi requirement minimal 3 challenges:

### ✅ 1. Custom Categories
- Tambah kategori spending kustom dengan emoji
- Edit dan hapus kategori
- Kategori tersimpan dan dapat digunakan untuk transaksi

### ✅ 2. Monthly Summary View
- Halaman Analysis dengan line chart trend spending
- Perbandingan dengan bulan sebelumnya
- Peak spend annotation pada chart

### ✅ 3. Sort Transactions
- Urutkan berdasarkan: Terbaru, Tertinggi, Terendah, Kategori
- Real-time re-ordering
- Smooth UI transitions

### ✅ 4. Spending Limit Highlight
- Warning alert saat melebihi budget
- Progress indicator dengan percentage
- Visual feedback dengan color coding

### ✅ 5. Dark/Light Mode Toggle
- Switch theme dengan satu klik
- CSS Variables untuk smooth transition
- Preference tersimpan di localStorage

---

## 🎯 Fitur Tambahan (Beyond Requirements)

- **Period Selector**: Filter transaksi berdasarkan bulan
- **Resource Usage per Category**: Progress bar budget tracking
- **Multi-page Navigation**: Home, Analysis, Budgets, Settings
- **Budget Management**: Set budget bulanan dan per kategori
- **Data Export/Import**: Backup dan restore data
- **Responsive Design**: Optimized untuk mobile dan desktop
- **Indonesian Localization**: Interface dalam Bahasa Indonesia

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Struktur aplikasi |
| **CSS3** | Styling dan responsive design |
| **Vanilla JavaScript** | Logic dan interactivity (No frameworks) |
| **Chart.js** | Pie chart & line chart visualization |
| **Material Icons** | Icon system |
| **LocalStorage API** | Data persistence (client-side) |

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- No installation atau setup required!

### Menjalankan Aplikasi

#### Opsi 1: Live Demo
Kunjungi: **(https://rasyadhafi-create.github.io/CodingCamp-3August26-HafiyyanMuhammadRasyad/)**

#### Opsi 2: Local Development
```bash
# Clone repository
git clone https://github.com/rasyadhafi-create/CodingCamp-3August26-HafiyyanMuhammadRasyad.git

# Navigate to folder
cd CodingCamp-3August26-HafiyyanMuhammadRasyad

# Open di browser
# Buka index.html langsung, atau gunakan local server:
# Dengan Python:
python -m http.server 8000
# Atau dengan VS Code Live Server extension
