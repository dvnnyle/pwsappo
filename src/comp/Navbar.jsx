import React from "react";
import { Link } from "react-router-dom";
import { FaHome, FaTicketAlt, FaEnvelope, FaUser } from "react-icons/fa";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="nav">
      <ul className="nav-list">
        <li className="nav-item">
          <Link to="/" className="nav-link" aria-label="Home">
            <FaHome size={24} />
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/Products" className="nav-link" aria-label="Products">
            <FaTicketAlt size={24} />
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/contact" className="nav-link" aria-label="Contact">
            <FaEnvelope size={24} />
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/login" className="nav-link" aria-label="login">
            <FaUser size={24} />
          </Link>
        </li>
      </ul>
    </nav>
  );
}
