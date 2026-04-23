import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './RegisterAcc.css';

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

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="text-center mb-4">
                        <span className="auth-header">KPI Management</span>
                    <h3 className="auth-title">Create an account</h3>
                    <p className="auth-subtitle">Enter your information to get started</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="auth-label">Full Name</label>
                        <input 
                            type="text" id="fullName" className="form-control" 
                            placeholder="John Doe" required 
                            onChange={handleChange} 
                        />
                    </div>

                    <div className="mb-3">
                        <label className="auth-label">Email</label>
                        <input 
                            type="email" id="email" className="form-control" 
                            placeholder="name@company.com" required 
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                            <label className="auth-label">Role</label>
                            <select id="role" className="form-select" required onChange={handleChange}>
                                <option value="">Select Role</option>
                                <option value="manager">Manager</option>
                                <option value="employee">Employee</option>
                            </select>

                        <div className="col-6 mb-3">
                            <label className="auth-label">Department</label>
                            <select id="department" className="form-select" required onChange={handleChange}>
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
                        <input
                            type="password" id="password" className="form-control" 
                            placeholder="Min. 6 characters" required 
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
            <label className="auth-label">Confirm Password</label>
            <div className="auth-input-group">
              <i className="bi bi-lock input-icon"></i>
              <input
                type="password"
                className="form-control"
                name="confirmPassword"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
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