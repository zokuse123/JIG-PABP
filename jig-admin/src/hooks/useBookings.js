import { useState, useCallback } from "react";
import { DUMMY_BOOKINGS } from "../data/dummy";
import { bookingApi } from "../utils/api";

/**
 * Hook untuk state & operasi CRUD booking.
 * Menggunakan dummy data jika backend belum siap.
 */
export function useBookings() {
  const [bookings, setBookings] = useState(DUMMY_BOOKINGS);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  /** Fetch dari backend (opsional) */
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingApi.getAll();
      setBookings(data);
    } catch (err) {
      // Fallback ke dummy data jika backend belum siap
      console.warn("Backend belum siap, menggunakan dummy data:", err.message);
      setBookings(DUMMY_BOOKINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Tambah booking baru */
  const addBooking = useCallback(async (data) => {
    const newBooking = {
      ...data,
      id: Date.now(),
      hargaDeal: +data.hargaDeal || 0,
      dp: +data.dp || 0,
      feeDriver: +data.feeDriver || 0,
      biayaTambahan: +data.biayaTambahan || 0,
    };
    // Optimistic update
    setBookings((prev) => [...prev, newBooking]);
    try {
      await bookingApi.create(newBooking);
    } catch {
      // Diam saja jika backend belum ada
    }
    return newBooking;
  }, []);

  /** Update booking */
  const updateBooking = useCallback(async (id, data) => {
    const updated = {
      ...data,
      id,
      hargaDeal: +data.hargaDeal || 0,
      dp: +data.dp || 0,
      feeDriver: +data.feeDriver || 0,
      biayaTambahan: +data.biayaTambahan || 0,
    };
    setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
    try {
      await bookingApi.update(id, updated);
    } catch {
      // Diam saja jika backend belum ada
    }
    return updated;
  }, []);

  /** Hapus booking */
  const deleteBooking = useCallback(async (id) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    try {
      await bookingApi.delete(id);
    } catch {
      // Diam saja jika backend belum ada
    }
  }, []);

  /** Sync dari Google Sheets */
  const syncFromSheets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingApi.syncFromSheets();
      if (Array.isArray(data)) {
        setBookings((prev) => {
          const existingIds = new Set(prev.map((b) => b.id));
          const newItems = data.filter((d) => !existingIds.has(d.id));
          return [...prev, ...newItems];
        });
        return { success: true, count: data.length };
      }
      return { success: true, count: 0 };
    } catch (err) {
      // Simulasi data masuk jika backend belum ada
      const simulasi = {
        id: Date.now(),
        customer: "[Sync] Data dari Google Sheets",
        phone: "08000000000",
        date: new Date().toISOString().split("T")[0],
        destination: "Kawah Putih",
        car: null,
        driver: null,
        hargaDeal: 900000,
        dp: 0,
        feeDriver: 150000,
        biayaTambahan: 0,
        status: "pending",
        notes: "Di-import dari Google Sheets",
      };
      setBookings((prev) => {
        const exists = prev.some((b) => b.notes === simulasi.notes && b.customer === simulasi.customer);
        return exists ? prev : [...prev, simulasi];
      });
      return { success: true, count: 1, simulated: true };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    bookings,
    setBookings,
    loading,
    error,
    fetchBookings,
    addBooking,
    updateBooking,
    deleteBooking,
    syncFromSheets,
  };
}
