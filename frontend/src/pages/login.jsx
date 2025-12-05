import { useState } from "react";
import axios from "../utils/axiosInstance";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import "./Auth.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("/login", form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">EchoNote</h1>
          <p className="auth-subtitle">Your AI-Powered Note Assistant</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              className="form-input"
              placeholder="Enter your email address" 
              type="email"
              value={form.email}
              onChange={(e)=>setForm({...form, email:e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-wrapper">
              <input 
                className="form-input"
                placeholder="Enter your password" 
                type={showPassword ? "text" : "password"} 
                value={form.password}
                onChange={(e)=>setForm({...form, password:e.target.value})}
                required
              />
              <button 
                type="button" 
                className="password-toggle-simple"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-actions-simple">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password-link">Forgot password?</a>
          </div>

          <button type="submit" className="auth-button-simple">
            Login
          </button>

          <div className="auth-footer-simple">
            Don't have an account? <Link to="/signup">Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
