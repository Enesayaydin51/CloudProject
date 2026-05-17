// src/services/authService.js
const API_BASE_URL = "http://10.0.2.2:3000";

export async function updateUserDetails({ token, height, weight, goal, illnesses }) {
  console.log("➡ UPDATE USER DETAILS token:", token); // DEBUG

  const res = await fetch(`${API_BASE_URL}/api/auth/user-details`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`   // 🔥🔥 En kritik nokta!
    },
    body: JSON.stringify({ height, weight, goal, illnesses }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Profil güncellenemedi");
  }

  return res.json();
}
