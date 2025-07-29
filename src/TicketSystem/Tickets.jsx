import React, { useEffect, useState, useRef } from "react";
import "./Tickete.css";
import QRCodeComponent from "./QRCodeComponent";
import QRModal from "./QRModal";
import { db, auth } from "../firebase";
import { doc, collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [countdowns, setCountdowns] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [refundedTickets, setRefundedTickets] = useState({});
  const intervalsRef = useRef({});

  // Fetch tickets from Firestore and localStorage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);

      if (currentUser) {
        // Fetch tickets from Firestore
        try {
          const userDocRef = doc(db, "users", currentUser.email.toLowerCase());
          const ordersColRef = collection(userDocRef, "newOrders");
          const querySnapshot = await getDocs(ordersColRef);
          
          const firestoreTickets = [];
          querySnapshot.docs.forEach((doc) => {
            const orderData = doc.data();
            // Extract tickets from order items
            if (orderData.items) {
              orderData.items.forEach((item) => {
                if (item.category === "lek" && item.type === "ticket") {
                  firestoreTickets.push({
                    id: `${orderData.orderReference}-${item.productId}`,
                    name: item.name,
                    customerName: orderData.buyerName,
                    orderReference: orderData.orderReference,
                    datePurchased: orderData.datePurchased,
                    duration: item.duration,
                    category: item.category,
                    type: item.type,
                    quantity: item.quantity,
                    price: item.price
                  });
                }
              });
            }
          });

          console.log("Fetched tickets from Firestore:", firestoreTickets);
          
          // Add dummy tickets for testing even when logged in
          const dummyTickets = [
            {
              id: "dummy1",
              name: "2 Timer Lek",
              customerName: "John Doe",
              orderReference: "ORD123456",
              datePurchased: new Date().toISOString(),
              duration: 120, // 2 hours in minutes
              category: "lek",
              type: "ticket"
            },
            {
              id: "dummy2", 
              name: "30 Minutter Lek",
              customerName: "Jane Smith",
              orderReference: "ORD789012",
              datePurchased: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
              duration: 30, // 30 minutes
              category: "lek",
              type: "ticket"
            }
          ];
          
          // Combine Firestore tickets with dummy tickets
          setTickets([...dummyTickets, ...firestoreTickets]);
        } catch (error) {
          console.error("Error fetching tickets from Firestore:", error);
          // Fallback to localStorage if Firestore fails
          loadFromLocalStorage();
        }
      } else {
        // User not logged in, load from localStorage only
        loadFromLocalStorage();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fallback function to load from localStorage
  const loadFromLocalStorage = () => {
    // Add dummy tickets for testing
    const dummyTickets = [
      {
        id: "dummy1",
        name: "2 Timer Lek",
        customerName: "John Doe",
        orderReference: "ORD123456",
        datePurchased: new Date().toISOString(),
        duration: 120, // 2 hours in minutes
        category: "lek",
        type: "ticket"
      },
      {
        id: "dummy2", 
        name: "30 Minutter Lek",
        customerName: "Jane Smith",
        orderReference: "ORD789012",
        datePurchased: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        duration: 30, // 30 minutes
        category: "lek",
        type: "ticket"
      }
    ];
    
    const storedCart = localStorage.getItem("cartItems");
    if (storedCart) {
      const parsed = JSON.parse(storedCart)
        .filter(item => item.category === "lek" && item.type === "ticket")
        .map(item => ({
          ...item,
          id: item.productId || item.orderReference || Math.random().toString(36).slice(2),
        }));
      // Combine real tickets with dummy tickets for testing
      setTickets([...dummyTickets, ...parsed]);
    } else {
      setTickets(dummyTickets);
    }
  };

  // Restore countdown state from localStorage when component mounts
  useEffect(() => {
    restoreCountdownState();
    loadRefundedTickets();
    
    // Set up interval to check for refund updates every 5 seconds
    const refundCheckInterval = setInterval(() => {
      loadRefundedTickets();
    }, 5000);

    return () => clearInterval(refundCheckInterval);
  }, []);

  // Load refunded tickets from Firestore and localStorage
  const loadRefundedTickets = async () => {
    const refundedItems = JSON.parse(localStorage.getItem("refundedItems") || "{}");
    const refundedOrders = JSON.parse(localStorage.getItem("refundedOrders") || "{}");
    
    // If user is logged in, also fetch from Firestore
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.email.toLowerCase());
        const ordersColRef = collection(userDocRef, "newOrders");
        const querySnapshot = await getDocs(ordersColRef);
        
        const firestoreRefundedItems = {};
        const firestoreRefundedOrders = {};
        
        querySnapshot.docs.forEach((doc) => {
          const orderData = doc.data();
          
          // Load refunded items from database
          if (orderData.refundedItems) {
            Object.assign(firestoreRefundedItems, orderData.refundedItems);
          }
          
          // Load fully refunded orders from database
          if (orderData.fullyRefunded) {
            firestoreRefundedOrders[orderData.orderReference] = true;
          }
        });
        
        // Merge localStorage and Firestore data (Firestore takes priority)
        const mergedRefundedItems = { ...refundedItems, ...firestoreRefundedItems };
        const mergedRefundedOrders = { ...refundedOrders, ...firestoreRefundedOrders };
        
        setRefundedTickets({ items: mergedRefundedItems, orders: mergedRefundedOrders });
        
        // Update localStorage with latest data
        localStorage.setItem("refundedItems", JSON.stringify(mergedRefundedItems));
        localStorage.setItem("refundedOrders", JSON.stringify(mergedRefundedOrders));
        
      } catch (error) {
        console.error("Error fetching refund data from Firestore:", error);
        // Fall back to localStorage only
        setRefundedTickets({ items: refundedItems, orders: refundedOrders });
      }
    } else {
      // User not logged in, use localStorage only
      setRefundedTickets({ items: refundedItems, orders: refundedOrders });
    }
  };

  // Check if a ticket is refunded
  const isTicketRefunded = (ticket) => {
    // Check if entire order is refunded
    if (refundedTickets.orders && refundedTickets.orders[ticket.orderReference]) {
      return true;
    }
    // Check if specific ticket item is refunded
    if (refundedTickets.items) {
      const key = `${ticket.orderReference}_${ticket.name}`;
      const refundedQty = refundedTickets.items[key] || 0;
      return refundedQty > 0;
    }
    return false;
  };

  // Save countdown state to localStorage
  const saveCountdownState = (countdownData) => {
    localStorage.setItem("ticketCountdowns", JSON.stringify(countdownData));
  };

  // Restore countdown state from localStorage
  const restoreCountdownState = () => {
    const saved = localStorage.getItem("ticketCountdowns");
    if (saved) {
      const countdownData = JSON.parse(saved);
      const currentTime = Date.now();
      const restoredCountdowns = {};

      Object.entries(countdownData).forEach(([ticketId, data]) => {
        const elapsed = Math.floor((currentTime - data.startedAt) / 1000);
        const remaining = data.totalDuration - elapsed;
        
        if (remaining > 0) {
          restoredCountdowns[ticketId] = remaining;
          // Restart the interval for this countdown
          intervalsRef.current[ticketId] = setInterval(() => {
            setCountdowns(prev => {
              const newVal = (prev[ticketId] || 0) - 1;
              if (newVal <= 0) {
                clearInterval(intervalsRef.current[ticketId]);
                delete intervalsRef.current[ticketId];
                // Remove from localStorage when finished
                const currentSaved = JSON.parse(localStorage.getItem("ticketCountdowns") || "{}");
                delete currentSaved[ticketId];
                saveCountdownState(currentSaved);
                return { ...prev, [ticketId]: 0 };
              }
              return { ...prev, [ticketId]: newVal };
            });
          }, 1000);
        } else {
          // Timer already finished, remove from localStorage
          const currentSaved = JSON.parse(localStorage.getItem("ticketCountdowns") || "{}");
          delete currentSaved[ticketId];
          saveCountdownState(currentSaved);
        }
      });

      setCountdowns(restoredCountdowns);
    }
  };



  // Start countdown for a ticket
  const startCountdown = (ticket) => {
    // Check if ticket is refunded
    if (isTicketRefunded(ticket)) {
      alert("Denne billetten er refundert og kan ikke aktiveres.");
      return;
    }
    
    if (intervalsRef.current[ticket.id] || countdowns[ticket.id]) return;
    
    const totalDuration = ticket.duration * 60;
    const startTime = Date.now();
    
    setCountdowns(prev => ({
      ...prev,
      [ticket.id]: totalDuration,
    }));

    // Save countdown data to localStorage
    const currentSaved = JSON.parse(localStorage.getItem("ticketCountdowns") || "{}");
    currentSaved[ticket.id] = {
      startedAt: startTime,
      totalDuration: totalDuration,
    };
    saveCountdownState(currentSaved);

    intervalsRef.current[ticket.id] = setInterval(() => {
      setCountdowns(prev => {
        const newVal = (prev[ticket.id] || 0) - 1;
        if (newVal <= 0) {
          clearInterval(intervalsRef.current[ticket.id]);
          delete intervalsRef.current[ticket.id];
          // Remove from localStorage when finished
          const currentSaved = JSON.parse(localStorage.getItem("ticketCountdowns") || "{}");
          delete currentSaved[ticket.id];
          saveCountdownState(currentSaved);
          return { ...prev, [ticket.id]: 0 };
        }
        return { ...prev, [ticket.id]: newVal };
      });
    }, 1000);
  };

  // Clean up intervals on unmount
  useEffect(() => {
    const intervals = intervalsRef.current; // capture ref value
    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, []);

  function formatTime(secs) {
    if (secs <= 0) return "00:00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map(x => String(x).padStart(2, "0")).join(":");
  }

  function formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h} ${h === 1 ? "time" : "timer"} og ${m} minutter`;
    if (h > 0) return `${h} ${h === 1 ? "time" : "timer"}`;
    return `${m} minutter`;
  }

  // Open QR modal for specific ticket
  const openQRModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowQRModal(true);
  };

  // Close QR modal
  const closeQRModal = () => {
    setShowQRModal(false);
    setSelectedTicket(null);
  };

  return (
    <div className="tickets-page">
      <h1>Dine Billetter</h1>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Laster billetter...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Ingen billetter funnet.</p>
          {!user && <p>Logg inn for å se dine kjøpte billetter.</p>}
        </div>
      ) : (
        <ul className="ticket-list">
        {tickets.map(ticket => (
          <li key={ticket.id} className={`ticket-item ${isTicketRefunded(ticket) ? 'refunded-ticket' : ''}`}>
            <div className="ticket-content">
              <div className="ticket-status">
                {(() => {
                  if (isTicketRefunded(ticket)) {
                    return <span className="status-badge refunded">Refundert</span>;
                  }
                  const countdown = countdowns[ticket.id];
                  if (countdown === undefined) {
                    return <span className="status-badge not-activated">Ikke aktivert</span>;
                  } else if (countdown > 0) {
                    return <span className="status-badge active">Aktiv</span>;
                  } else {
                    return <span className="status-badge time-over">Tid over</span>;
                  }
                })()}
              </div>
              
              <strong>{ticket.name}</strong>
              {ticket.customerName && (
                <div>
                  Kunde: <span>{ticket.customerName}</span>
                </div>
              )}
              <div>
                Ordre-ID: <span>{ticket.orderReference || "Ukjent"}</span>
              </div>
              <div>
                Kjøpt:{" "}
                <span>
                  {ticket.datePurchased
                    ? (() => {
                        const d = new Date(ticket.datePurchased);
                        const day = String(d.getDate()).padStart(2, "0");
                        const month = String(d.getMonth() + 1).padStart(2, "0");
                        const year = String(d.getFullYear()).slice(-2);
                        const hour = String(d.getHours()).padStart(2, "0");
                        const min = String(d.getMinutes()).padStart(2, "0");
                        return `${day}.${month}.${year} kl.${hour}:${min}`;
                      })()
                    : "Ukjent"}
                </span>
              </div>

              <div className="ticket-duration">
                Varighet: {ticket.duration ? formatDuration(ticket.duration) : "Ukjent"}
              </div>

              {/* Only show countdown when started */}
              {countdowns[ticket.id] !== undefined ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                  <span style={{ fontWeight: 600 }}>Tid igjen:</span>
                  <h3 className="ticket-timer" style={{ margin: 0 }}>
                    {formatTime(countdowns[ticket.id])}
                  </h3>
                </div>
              ) : (
                <button
                  className="start-ticket-btn"
                  onClick={() => startCountdown(ticket)}
                  style={{ marginTop: 10 }}
                >
                  Start nedtelling
                </button>
              )}

              {/* QR Code Button for each ticket - moved below countdown/button */}
              <QRCodeComponent 
                ticket={ticket} 
                isActive={!isTicketRefunded(ticket) && countdowns[ticket.id] !== undefined && countdowns[ticket.id] > 0}
                onShowQR={() => openQRModal(ticket)}
              />
            </div>
          </li>
        ))}
      </ul>
      )}

      {/* QR Modal */}
      {showQRModal && selectedTicket && (
        <QRModal
          isOpen={showQRModal}
          onClose={closeQRModal}
          ticket={selectedTicket}
          isActive={countdowns[selectedTicket.id] !== undefined && countdowns[selectedTicket.id] > 0}
        />
      )}
    </div>
  );
}
