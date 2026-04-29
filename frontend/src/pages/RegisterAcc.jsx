import React, { useState } from 'react';
import { Link } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import './RegisterAcc.css';
import logo from "../assets/achievepro.png";

const RegisterAcc = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: '',
        department: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };
    

    const handleSubmit = (e) => {
  e.preventDefault(); // stop page reload

  console.log("Form Data:", formData);

  //check if both pasword entered the same
  if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  // need to change to backend 
  alert("Account created!");
};


    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="text-center mb-4">
                     <div style={{ 
                        textAlign: "center", }}>
                                         <img 
                                            src={logo} 
                                            alt="Achieve Logo" 
                                            style={{ width: "120px", height: "auto" }}
                                        />
                                        </div>
                        <span className="auth-header">AchievePro</span>
                    <h3 className="auth-title">Create an account</h3>
                    <p className="auth-subtitle">Enter your information to get started</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="auth-label">Full Name</label>
                        <input 
                            type="text" id="fullName" className="form-control-custom"
                            placeholder="John Doe" required 
                            onChange={handleChange} 
                             style={{
                                fontSize:"16px",
                                paddingLeft:"20px",
                            }} />
                    </div>

                    <div className="mb-3">
                        <label className="auth-label">Email</label>
                        <input 
                            type="email" id="email" className="form-control-custom"
                            placeholder="name@company.com" required 
                            onChange={handleChange}
                            style={{
                                fontSize:"16px",
                                paddingLeft:"20px",
                            }} />
                    </div>

                    <div className="mb-3">
                            <label className="auth-label">Role</label>
                            <select 
                            id="role" 
                            className="form-control-custom" 
                            required onChange={handleChange}
                            style={{
                                fontSize:"16px",
                                paddingLeft:"20px",
                            }}>
                                <option value="">Select Role</option>
                                <option value="manager">Manager</option>
                                <option value="employee">Employee</option>
                            </select>

                        <div className="mb-3">
                            <label className="auth-label">Department</label>
                            <select 
                            id="department" 
                            className="form-control-custom" 
                            required onChange={handleChange}
                            style={{
                                fontSize:"16px",
                                paddingLeft:"20px",
                            }}>
                                <option value="">Choose Department</option>
                                <option value="hr">HR</option>
                                <option value="it">IT</option>
                                <option value="finance">Finance</option>
                                <option value="marketing">Marketing</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="auth-label">Password</label>
                        <div 
            className="auth-input-group">
                        <i className="bi bi-lock input-icon"></i>
                        <input
                            type="password" id="password" className="form-control-custom"
                            placeholder="Min. 6 characters" required 
                            onChange={handleChange}
                             style={{
                                fontSize:"16px",
                            }} />
                    </div>
                    </div>

                    <div className="mb-3">

            <label className="auth-label">Confirm Password</label>
            <div 
            className="auth-input-group">
              <i className="bi bi-lock input-icon"></i>
              <input
                type="password"
                id="confirmPassword"
                className="form-control-custom"
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                 style={{
                     fontSize:"16px",
                }} />
              </div>
              </div>


                    <button type="submit" className="btn-create-acc">
                        Create Account
                    </button>
                </form>

                <footer className="text-center">
                Already have an account? <Link to="/signin">Sign in</Link>
                 </footer>
            </div>
        </div>
    );
};

export default RegisterAcc;
