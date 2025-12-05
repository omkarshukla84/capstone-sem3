import { useState } from "react";
import axios from "../utils/axiosInstance";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, AudioWaveform } from "lucide-react";

import "./Auth.css";

export default function Signup() {
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Backend requires name, so we derive it from email or use a placeholder
      const name = form.email.split('@')[0] || "User";
      
      await axios.post("/signup", {
        name: name,
        email: form.email,
        password: form.password
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-logo-simple">
            <AudioWaveform size={28} color="white" />
          </div>
          <h1 className="auth-title">EchoNote</h1>
          <h2 className="auth-heading">Create your account</h2>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              className="form-input"
              placeholder="Enter your email" 
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

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="password-wrapper">
              <input 
                className="form-input"
                placeholder="Confirm your password" 
                type={showConfirmPassword ? "text" : "password"} 
                value={form.confirmPassword}
                onChange={(e)=>setForm({...form, confirmPassword:e.target.value})}
                required
              />
              <button 
                type="button" 
                className="password-toggle-simple"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-button-simple">
            Register
          </button>

          <div className="auth-footer-simple">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
