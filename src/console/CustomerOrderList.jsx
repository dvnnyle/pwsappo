import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import "./CustomerOrderList.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function CustomerOrderList() {
  const { userId } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const [refundedItems, setRefundedItems] = useState({});
  const [refundedOrders, setRefundedOrders] = useState({});
  const [refundQtys, setRefundQtys] = useState({});

  useEffect(() => {
    async function fetchOrders() {
      try {
        const ordersColRef = collection(db, "users", userId, "newOrders");
        const ordersSnapshot = await getDocs(ordersColRef);
        setOrders(
          ordersSnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((order) => !!order.orderReference)
        );
      } catch (err) {
        setError("Kunne ikke hente ordre: " + err.message);
      }
      setLoading(false);
    }
    fetchOrders();
  }, [userId]);

  useEffect(() => {
    // Load refunded state from localStorage on mount (only for refunds)
    const refundedItemsLS = JSON.parse(localStorage.getItem("refundedItems") || "{}");
    const refundedOrdersLS = JSON.parse(localStorage.getItem("refundedOrders") || "{}");
    setRefundedItems(refundedItemsLS);
    setRefundedOrders(refundedOrdersLS);
  }, [orders]);

  const toggleDropdown = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  function updateRefundedItems(newRefundedItems) {
    setRefundedItems(newRefundedItems);
    localStorage.setItem("refundedItems", JSON.stringify(newRefundedItems));
  }

  function updateRefundedOrders(newRefundedOrders) {
    setRefundedOrders(newRefundedOrders);
    localStorage.setItem("refundedOrders", JSON.stringify(newRefundedOrders));
  }

  // Helper function to check if order is captured (based on database only)
  const isOrderCaptured = (order) => {
    return order.captureStatus === "CAPTURED";
  };

  async function handleRefund(orderReference, item, refundQty, pricePerUnit) {
    try {
      const refundReason = item
        ? `Refund item: ${item.name} x${refundQty}`
        : "Full order refund";

      const amountInMinorUnits = Math.round(pricePerUnit * refundQty * 100);

      const response = await fetch(`${BACKEND_URL}/refund-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: orderReference,
          amountValue: amountInMinorUnits,
          refundReason: refundReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Refund failed: ${error.error || JSON.stringify(error)}`);
        return;
      }

      alert("Refund successful");

      if (item) {
        const key = `${orderReference}_${item.name}`;
        const prevQty = refundedItems[key] || 0;
        const newRefundedItems = {
          ...refundedItems,
          [key]: prevQty + refundQty,
        };
        setRefundedItems(newRefundedItems);
        localStorage.setItem("refundedItems", JSON.stringify(newRefundedItems));
      } else {
        const newRefundedOrders = {
          ...refundedOrders,
          [orderReference]: true,
        };
        setRefundedOrders(newRefundedOrders);
        localStorage.setItem("refundedOrders", JSON.stringify(newRefundedOrders));
      }
    } catch (error) {
      alert("Refund error: " + error.message);
    }
  }

  async function handleCapture(orderReference, totalPrice) {
    try {
      console.log('Attempting manual capture for:', {
        orderReference,
        totalPrice,
        amountInMinorUnits: Math.round(totalPrice * 100)
      });

      const amountInMinorUnits = Math.round(totalPrice * 100);

      const response = await fetch(`${BACKEND_URL}/capture-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: orderReference,
          amountValue: amountInMinorUnits,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Capture error details:', error);
        alert(`Capture failed: ${error.error || error.detail || JSON.stringify(error)}`);
        return;
      }

      const captureResult = await response.json();
      console.log('Manual capture successful:', captureResult);
      alert("Payment captured successfully");

      // Update the order in Firestore with capture status
      try {
        const orderToUpdate = orders.find(o => o.orderReference === orderReference);
        if (orderToUpdate) {
          const orderDocRef = doc(db, "users", userId, "newOrders", orderToUpdate.id);
          await updateDoc(orderDocRef, {
            captureStatus: "CAPTURED",
            capturedAt: new Date().toISOString(),
            capturedAmount: amountInMinorUnits,
            vippsCaptureResponse: captureResult
          });
          console.log("Updated order capture status in Firestore");
          
          // Update the local orders state to reflect the change immediately
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.orderReference === orderReference 
                ? { 
                    ...order, 
                    captureStatus: "CAPTURED",
                    capturedAt: new Date().toISOString(),
                    capturedAmount: amountInMinorUnits,
                    vippsCaptureResponse: captureResult
                  }
                : order
            )
          );
        }
      } catch (firestoreError) {
        console.error("Failed to update Firestore:", firestoreError);
      }
    } catch (error) {
      console.error('Capture error:', error);
      alert("Capture error: " + error.message);
    }
  }

  async function checkPaymentStatus(orderReference) {
    try {
      const response = await fetch(`${BACKEND_URL}/payment-details/${orderReference}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to get payment details: ${error.error || JSON.stringify(error)}`);
        return;
      }

      const paymentDetails = await response.json();
      console.log('Payment details:', paymentDetails);
      
      // Auto-capture suggestion for authorized but not captured payments
      if (paymentDetails.state === 'AUTHORIZED' && paymentDetails.aggregate?.capturedAmount?.value === 0) {
        const shouldAutoCapture = confirm('Payment is authorized but not captured. Auto-capture now?');
        if (shouldAutoCapture) {
          const order = orders.find(o => o.orderReference === orderReference);
          if (order) {
            await handleCapture(orderReference, order.totalPrice);
            return; // Exit early, handleCapture will show success message
          }
        }
      }
      
      // Show key payment info in alert
      const amount = paymentDetails.amount?.value || 'Unknown';
      const state = paymentDetails.state || 'Unknown';
      const aggregatedCaptureAmount = paymentDetails.aggregate?.capturedAmount?.value || 0;
      const aggregatedRefundedAmount = paymentDetails.aggregate?.refundedAmount?.value || 0;
      
      alert(`Payment Status for ${orderReference}:
State: ${state}
Original Amount: ${amount} øre (${(amount/100).toFixed(2)} NOK)
Captured: ${aggregatedCaptureAmount} øre (${(aggregatedCaptureAmount/100).toFixed(2)} NOK)
Refunded: ${aggregatedRefundedAmount} øre (${(aggregatedRefundedAmount/100).toFixed(2)} NOK)
Available to capture: ${amount - aggregatedCaptureAmount} øre (${((amount - aggregatedCaptureAmount)/100).toFixed(2)} NOK)`);
      
    } catch (error) {
      console.error('Error checking payment status:', error);
      alert("Error checking payment status: " + error.message);
    }
  }

  if (loading) return <p>Laster ordre...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="customer-orders-container">
      <h1 className="customer-orders-title">Ordre for bruker</h1>
      <Link to="/admin" className="customer-orders-backlink">
        ← Tilbake til admin
      </Link>
      {orders.length === 0 ? (
        <p style={{ marginTop: 24 }}>Ingen ordre funnet for denne brukeren.</p>
      ) : (
        <ul className="customer-orders-list">
          {orders.map((order, idx) => (
            <li key={order.id || idx} className="customer-orders-listitem">
              <button
                className="customer-orders-togglebtn"
                onClick={() => toggleDropdown(idx)}
              >
                Ordre Referanse: {order.orderReference || order.id || "Ukjent"}{" "}
                <span style={{ float: "right" }}>
                  {openIndex === idx ? "▲" : "▼"}
                </span>
              </button>
              {openIndex === idx && (
                <div className="customer-orders-ordercontent">
                  <div>
                    <strong>Navn:</strong> {order.buyerName || "Ukjent"}
                  </div>
                  <div>
                    <strong>Telefonnummer:</strong> {order.phoneNumber || "Ukjent"}
                  </div>
                  <div>
                    <strong>Kjøpsdato:</strong>{" "}
                    {order.datePurchased
                      ? (() => {
                          const d = new Date(order.datePurchased);
                          const day = String(d.getDate()).padStart(2, "0");
                          const month = String(d.getMonth() + 1).padStart(2, "0");
                          const year = String(d.getFullYear()).slice(-2);
                          const hour = String(d.getHours()).padStart(2, "0");
                          const min = String(d.getMinutes()).padStart(2, "0");
                          return `${day}.${month}.${year} kl.${hour}:${min}`;
                        })()
                      : "Ukjent"}
                  </div>
                  <div>
                    <strong>Totalt:</strong>{" "}
                    {order.totalPrice ? `${order.totalPrice} kr` : "Ukjent"}
                  </div>
                  
                  {/* CAPTURE STATUS - Based purely on database auto-capture */}
                  <div>
                    <strong>Capture Status:</strong>{" "}
                    <span style={{ 
                      color: isOrderCaptured(order) ? "green" : "orange",
                      fontWeight: "bold"
                    }}>
                      {order.captureStatus || "PENDING"}
                    </span>
                    {order.capturedAt && (
                      <span style={{ fontSize: "0.9em", marginLeft: "8px" }}>
                        ({new Date(order.capturedAt).toLocaleString()})
                      </span>
                    )}
                    {isOrderCaptured(order) && (
                      <span style={{ fontSize: "0.8em", marginLeft: "8px", color: "green" }}>
                        ✅ Auto-captured
                      </span>
                    )}
                  </div>

                  <ul className="customer-orders-products">
                    {(order.items || order.products || []).map((item, i) => {
                      const totalItemPrice =
                        item.price && item.quantity
                          ? item.price * item.quantity
                          : item.price || 0;
                      const key = `${order.orderReference}_${item.name}`;
                      const refundedQty = refundedItems[key] || 0;
                      const remainingQty = (item.quantity || 1) - refundedQty;
                      const currentRefundQty = 1;

                      return (
                        <li key={i} className={remainingQty === 0 ? "refunded-item" : ""}>
                          {item.quantity}x {item.name} = {totalItemPrice} kr{" "}
                          {remainingQty === 0 ? (
                            <span className="refunded-label">All refunded</span>
                          ) : (
                            <>
                              <button
                                className="refund-btn"
                                style={{ marginLeft: 8 }}
                                onClick={() =>
                                  handleRefund(order.orderReference, item, currentRefundQty, item.price)
                                }
                                disabled={remainingQty === 0}
                              >
                                Refund 1x
                              </button>
                              {refundedQty > 0 && (
                                <span className="refunded-label" style={{ marginLeft: 8 }}>
                                  Refunded: {refundedQty}x
                                </span>
                              )}
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <div style={{ marginTop: 12, display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      style={{ padding: "6px 12px" }}
                      className="capture-btn"
                      onClick={() => checkPaymentStatus(order.orderReference)}
                    >
                      Check Status
                    </button>
                    
                    {/* CAPTURE BUTTON - Based purely on database status */}
                    <button
                      style={{ padding: "6px 12px" }}
                      className={isOrderCaptured(order) ? "captured-order" : "capture-btn"}
                      onClick={() => handleCapture(order.orderReference, order.totalPrice)}
                      disabled={isOrderCaptured(order)}
                    >
                      {isOrderCaptured(order) ? "Payment Captured" : "Capture Payment"}
                    </button>
                    
                    <button
                      style={{ padding: "6px 12px" }}
                      className={
                        refundedOrders[order.orderReference]
                          ? "refunded-order"
                          : "refund-btn"
                      }
                      onClick={() =>
                        handleRefund(order.orderReference, null, order.totalPrice, 1)
                      }
                      disabled={refundedOrders[order.orderReference]}
                    >
                      {refundedOrders[order.orderReference]
                        ? "Full amount refunded"
                        : "Refund Full Order"}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
