import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import LoginPage    from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import BookingPage   from "./pages/BookingPage";
import MobilPage     from "./pages/MobilPage";
import KeuanganPage  from "./pages/KeuanganPage";
import SyncPage      from "./pages/SyncPage";
import { useBookings } from "./hooks/useBookings";
import { useCars }     from "./hooks/useCars";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("jig_token"));
  const [page, setPage]         = useState("dashboard");

  const {
    bookings,
    loading: bookingLoading,
    addBooking,
    updateBooking,
    deleteBooking,
    syncFromSheets,
  } = useBookings();

  const { cars, updateCar } = useCars();

  const handleLogout = () => {
    localStorage.removeItem("jig_token");
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar active={page} setActive={setPage} onLogout={handleLogout} />

      <main
        style={{
          marginLeft: 220,
          flex: 1,
          padding: "28px 28px",
          minHeight: "100vh",
          background: "#f1f5f1",
        }}
      >
        {page === "dashboard" && (
          <DashboardPage bookings={bookings} cars={cars} />
        )}
        {page === "booking" && (
          <BookingPage
            bookings={bookings}
            addBooking={addBooking}
            updateBooking={updateBooking}
            deleteBooking={deleteBooking}
            cars={cars}
          />
        )}
        {page === "mobil" && (
          <MobilPage cars={cars} updateCar={updateCar} />
        )}
        {page === "keuangan" && (
          <KeuanganPage bookings={bookings} />
        )}
        {page === "sync" && (
          <SyncPage syncFromSheets={syncFromSheets} loading={bookingLoading} />
        )}
      </main>
    </div>
  );
}
