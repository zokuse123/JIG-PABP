/**
 * Format angka ke format Rupiah
 * @param {number} amount
 * @returns {string}
 */
export const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

/**
 * Format tanggal ISO ke lokal Indonesia
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {string}
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Hitung profit dari booking
 * @param {object} booking
 * @returns {number}
 */
export const hitungProfit = ({ hargaDeal = 0, feeDriver = 0, biayaTambahan = 0 }) =>
  hargaDeal - feeDriver - biayaTambahan;

/**
 * Cek apakah ada jadwal bentrok
 * @param {array} bookings - list booking
 * @param {string} date - tanggal baru
 * @param {string} carName - nama mobil baru
 * @param {number|null} excludeId - id booking yang sedang diedit
 * @returns {boolean}
 */
export const cekBentrok = (bookings, date, carName, excludeId = null) => {
  if (!date || !carName) return false;
  return bookings.some(
    (b) =>
      b.id !== excludeId &&
      b.date === date &&
      b.car === carName &&
      !["cancel", "selesai"].includes(b.status)
  );
};
