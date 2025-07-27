import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Link } from "react-router-dom";
import "../user/Profile.css";
import "../style/global.css";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all users and their orders from Firestore
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch users
        const usersCol = collection(db, "users");
        const userSnapshot = await getDocs(usersCol);
        const userList = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userList);

        // Fetch newOrders subcollection for each user
        const ordersByUser = {};
        for (const user of userList) {
          const ordersColRef = collection(db, "users", user.id, "newOrders");
          const ordersSnapshot = await getDocs(ordersColRef);
          ordersByUser[user.id] = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
        }
        setOrders(ordersByUser);
      } catch (err) {
        setError("Kunne ikke hente brukere eller ordre: " + err.message);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Delete user
  const handleDelete = async (userId) => {
    if (!window.confirm("Er du sikker på at du vil slette denne brukeren?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert("Kunne ikke slette bruker: " + err.message);
    }
  };

  if (loading) return <p>Laster brukere...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="profile-container" style={{ maxWidth: 900, margin: "40px auto" }}>
      <h1 className="global-title">Adminpanel</h1>
      <h2>Brukere</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8 }}>Navn</th>
            <th style={{ textAlign: "left", padding: 8 }}>E-post</th>
            <th style={{ textAlign: "left", padding: 8 }}>Telefon</th>
            <th style={{ textAlign: "left", padding: 8 }}>Handling</th>
            <th style={{ textAlign: "left", padding: 8 }}>Ordre</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} style={{ borderBottom: "1px solid #eee", verticalAlign: "top" }}>
              <td style={{ padding: 8 }}>{user.name || "-"}</td>
              <td style={{ padding: 8 }}>{user.email || "-"}</td>
              <td style={{ padding: 8 }}>{user.phone || "-"}</td>
              <td style={{ padding: 8 }}>
                <button
                  style={{
                    background: "#e74c3c",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 14px",
                    cursor: "pointer",
                  }}
                  onClick={() => handleDelete(user.id)}
                >
                  Slett
                </button>
              </td>
              <td style={{ padding: 8 }}>
                {orders[user.id] && orders[user.id].length > 0
                  ? (
                    <Link
                      to={`/customer-orders/${user.id}`}
                      style={{ color: "#007bff", textDecoration: "underline", cursor: "pointer" }}
                    >
                      {orders[user.id].filter(order => order && Object.keys(order).length > 1).length} ordre
                    </Link>
                  )
                  : <span style={{ color: "#aaa" }}>Ingen ordre</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}