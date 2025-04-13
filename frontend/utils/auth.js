const API_URL = "http://localhost:5001"; // Change if needed

// Sign Up Function
export const signUp = async (name, email, password, dob) => {
  const response = await fetch(`http://localhost:5001/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, dob }),
  });
  return response.json();
};

// Login Function
export const login = async (email, password) => {
  const response = await fetch(`http://localhost:5001/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();

  if (data.token) {
    localStorage.setItem("token", data.token); // Store token
  }
  return data;
};

export const isAuthenticated = () => !!localStorage.getItem("token");

// Logout Function
export const logout = () => {
  localStorage.removeItem("token");
};