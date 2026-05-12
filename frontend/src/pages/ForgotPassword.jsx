import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    newPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await api.post("/auth/reset-password", form);

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        alert(response.data.message || "Failed to reset password");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>FoodAI 🍱</h1>
        <p>Reset Password</p>

        {success ? (
          <div style={{ color: "green", marginBottom: "1rem" }}>
            Password reset successful! Redirecting to login...
          </div>
        ) : (
          <>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="newPassword"
              placeholder="Enter new password"
              onChange={handleChange}
              required
            />
            <button type="submit">
              {loading ? "Loading..." : "Reset Password"}
            </button>
          </>
        )}

        <span>
          Remember your password?{" "}
          <Link to="/login">Login</Link>
        </span>
      </form>
    </div>
  );
}

export default ForgotPassword;
