import React, { useState } from "react";
import './CreateUser.css';

import { auth, db } from "../firebase"; // Your firebase config file
import {
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

export default function CreateUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update displayName in Auth profile
      await updateProfile(user, { displayName: name });

      // Store additional user info in Firestore under uid
      await setDoc(doc(db, "users", user.uid), {
        name,
        email: email.toLowerCase(),
        phone,
        createdAt: serverTimestamp(),
      });

      setMsg("User created successfully!");
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
    } catch (error) {
      setMsg("Error: " + error.message);
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Create User"}
      </button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
