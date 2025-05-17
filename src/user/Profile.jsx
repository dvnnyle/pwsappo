import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { FaUserCircle } from "react-icons/fa";
import "./Profile.css";
import '../style/global.css';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setError("User data not found.");
          }
        } catch (err) {
          setError("Error fetching user data: " + err.message);
        }
      } else {
        setError("No logged in user.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // Redirect to login after logout
    } catch (err) {
      alert("Logout failed: " + err.message);
    }
  };

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="profile-page">
      <div className="global-rectangle">
        <h1 className="global-title">PROFIL</h1>
      </div>

      <div className="profile-container" style={{ textAlign: "center" }}>
        <FaUserCircle size={100} color="#555" style={{ marginBottom: 20 }} />
        <h2 className="nameTag" style={{ textTransform: "uppercase" }}>
          Hei, {userData.name}
        </h2>
        <p><strong>Email:</strong> {userData.email}</p>
        {userData.phone && <p><strong>Phone:</strong> {userData.phone}</p>}
        {userData.createdAt && (
          <p>
            <strong>Member since:</strong>{" "}
            {userData.createdAt.toDate
              ? userData.createdAt.toDate().toLocaleDateString()
              : userData.createdAt}
          </p>
        )}
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        Logg ut
      </button>
    </div>
  );
}
