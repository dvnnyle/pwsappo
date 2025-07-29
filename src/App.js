import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Navbar from "./comp/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import Sor from "./pages/parks/Sor";
import BookingPage from "./pages/BookingPage";
import Products from "./shop/Products";
import CreateUser from "./user/CreateUser";
import LogIn from "./user/LogIn";
import ForgotPassword from "./user/ForgotPassword";
import Profile from "./user/Profile";
import MyCart from "./shop/MyCart";
import PaymentReturn from "./shop/PaymentReturn";
import News from "./pages/News/News.jsx";
import NewsForm from "./pages/News/NewsForm";
import Settings from "./user/SettingsTabs/Settings";
import Tickets from "./TicketSystem/Tickets";
import Support from "./user/SettingsTabs/Support";
import Orders from "./user/SettingsTabs/Orders";
import Coupons from "./user/SettingsTabs/Coupons";

import Admin from "./console/admin";
import AdminDashboard from "./console/AdminDashboard";
import CustomerOrderList from "./console/CustomerOrderList";
import NewCoupon from "./console/newCoupon.jsx";

import PageTransition from "./comp/PageTransition";

function AnimatedRoutes() {
  useEffect(() => {
    const setAppHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    return () => window.removeEventListener('resize', setAppHeight);
  }, []);

  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Home />
            </PageTransition>
          }
        />
        <Route
          path="/NewsForm"
          element={
            <PageTransition>
              <NewsForm />
            </PageTransition>
          }
        />
        <Route
          path="/News"
          element={
            <PageTransition>
              <News />
            </PageTransition>
          }
        />
        <Route
          path="/PaymentReturn"
          element={
            <PageTransition>
              <PaymentReturn />
            </PageTransition>
          }
        />
        <Route
          path="/about"
          element={
            <PageTransition>
              <About />
            </PageTransition>
          }
        />
        <Route
          path="/sor"
          element={
            <PageTransition>
              <Sor />
            </PageTransition>
          }
        />
        <Route
          path="/BookingPage"
          element={
            <PageTransition>
              <BookingPage />
            </PageTransition>
          }
        />
        <Route
          path="/Products"
          element={
            <PageTransition>
              <Products />
            </PageTransition>
          }
        />
        <Route
          path="/CreateUser"
          element={
            <PageTransition>
              <CreateUser />
            </PageTransition>
          }
        />
        <Route
          path="/LogIn"
          element={
            <PageTransition>
              <LogIn />
            </PageTransition>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PageTransition>
              <ForgotPassword />
            </PageTransition>
          }
        />
        <Route
          path="/MyCart"
          element={
            <PageTransition>
              <MyCart />
            </PageTransition>
          }
        />
        <Route
          path="/Profile"
          element={
            <PageTransition>
              <Profile />
            </PageTransition>
          }
        />
        <Route
          path="/Settings"
          element={
            <PageTransition>
              <Settings />
            </PageTransition>
          }
        />
        <Route
          path="/tickets"
          element={
            <PageTransition>
              <Tickets />
            </PageTransition>
          }
        />
        <Route
          path="/Orders"
          element={
            <PageTransition>
              <Orders />
            </PageTransition>
          }
        />
        <Route
          path="/support"
          element={
            <PageTransition>
              <Support />
            </PageTransition>
          }
        />
        <Route
          path="/coupons"
          element={
            <PageTransition>
              <Coupons />
            </PageTransition>
          }
        />
        <Route
          path="/customer-orders/:userId"
          element={
            <PageTransition>
              <CustomerOrderList />
            </PageTransition>
          }
        />
        <Route
          path="/admin"
          element={
            <PageTransition>
              <Admin />
            </PageTransition>
          }
        />
        <Route
          path="/AdminDashboard"
          element={
            <PageTransition>
              <AdminDashboard />
            </PageTransition>
          }
        />
        <Route
          path="/NewCoupon"
          element={
            <PageTransition>
              <NewCoupon />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
