import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyCart.css";

export default function MyCart() {
  const [cartItems, setCartItems] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    const storedCart = localStorage.getItem("cartItems");
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (cartItems.length === 0) {
    return <div className="empty-cart">Handlekurven er tom.</div>;
  }

  const handlePayNow = (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      alert("Vennligst skriv inn et telefonnummer.");
      return;
    }
    alert(`Betaling initiert med telefonnummer: ${phoneNumber}`);
  };

  return (
    <>
      <div className="mycart-wrapper">

        <h1>Sammendrag</h1>
        <ul className="cart-summary-list">
          {cartItems.map((item) => (
            <li key={item.productId} className="cart-summary-item">
              {item.quantity}x {item.name} = {item.price * item.quantity} kr
            </li>
          ))}
        </ul>

        <div className="cart-summary-total">
          <h2>Totalsum: {totalPrice} kr</h2>
        </div>
      </div>

      <form onSubmit={handlePayNow} className="phone-pay-form">
        <label htmlFor="phone" className="phone-label">
          Telefonnummer for betalingsvarsling:
        </label>
        <input
          type="tel"
          id="phone"
          className="phone-input"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Skriv inn telefonnummer"
          required
        />
        <button type="submit" className="pay-now-btn">
          Betal med Vipps
        </button>
      </form>
    </>
  );
}
