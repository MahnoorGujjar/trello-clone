
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-lFuR1JkxV-gT8TZZmx-SMLXQELIKnR8",
  authDomain: "sign-up-log-in-form-2771e.firebaseapp.com",
  projectId: "sign-up-log-in-form-2771e",
  storageBucket: "sign-up-log-in-form-2771e.firebasestorage.app",
  messagingSenderId: "462822975889",
  appId: "1:462822975889:web:afaea0422cae4f4ca35230",
  measurementId: "G-E6VDFE0YY6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Wait until the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Logout button functionality
  let logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth).then(() => {
        alert("Logged out successfully!");
        window.location.href = "index.html"; // Redirect to the login page
      }).catch((error) => {
        console.error("Error logging out:", error);
      });
    });
  }

  // Signup button functionality
  document.getElementById('signupBtn')?.addEventListener('click', (e) => {
    e.preventDefault();

    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert('Signup Successfully!');
        window.location.href = 'main.html'; // Redirect to home page
      })
      .catch(error => document.getElementById('message').innerText = error.message);
  });

  // Login button functionality
  document.getElementById("loginBtn")?.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert("Login Successful");
        window.location.href = "main.html"; // Redirect to home page
      })
      .catch(error => document.getElementById("message").innerText = error.message);
  });

});

