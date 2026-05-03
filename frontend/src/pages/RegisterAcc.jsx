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
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });

        setErrorMessage('');
        setSuccessMessage('');
    };

    // Password validation
    const isStrongPassword = (password) => {
        const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        return regex.test(password);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setErrorMessage('');
        setSuccessMessage('');

        // Check empty fields
        if (
            !formData.fullName ||
            !formData.email ||
            !formData.role ||
            !formData.department ||
            !formData.password ||
            !formData.confirmPassword
        ) {
            setErrorMessage("Please fill in all blanks");
            return;
        }

        // Check email format
        if (!formData.email.includes("@")) {
            setErrorMessage("Email format is incomplete");
            return;
        }

        // Check password strength
        if (!isStrongPassword(formData.password)) {
            setErrorMessage("Create a 8 digit password with number letter");
            return;
        }

        // Check confirm password
        if (formData.password !== formData.confirmPassword) {
            setErrorMessage("Password not match");
            return;
        }

        const payload = {
            name: formData.fullName,
            email: formData.email,
            password: formData.password,
            phone: formData.phone || "",
            role: formData.role === "employee" ? "staff" : formData.role,
            department: formData.department
        };

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMessage("Account created successfully! Redirecting...");
                setTimeout(() => {
                    window.location.href = '/signin';
                }, 1500);
            } else {
                if (
                    data.detail &&
                    data.detail.toLowerCase().includes("email")
                ) {
                    setErrorMessage("Email already registered");
                } else {
                    setErrorMessage("Registration failed. Please try again.");
                }
            }

        } catch (error) {
            console.error("Registration error:", error);
            setErrorMessage("Registration failed. Please check your connection.");
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">

                <div className="text-center mb-4">
                    <div style={{ textAlign: "center" }}>
                        <img
                            src={logo}
                            alt="Achieve Logo"
                            style={{ width: "120px", height: "auto" }}
                        />
                    </div>

                    <span className="auth-header">AchievePro</span>
                    <h3 className="auth-title">Create an account</h3>
                    <p className="auth-subtitle">
                        Enter your information to get started
                    </p>
                </div>

                {/* UI Error Message */}
                {errorMessage && (
                    <div className="alert alert-danger text-center py-2">
                        {errorMessage}
                    </div>
                )}

                {/* UI Success Message */}
                {successMessage && (
                    <div className="alert alert-success text-center py-2">
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="mb-3">
                        <label className="auth-label">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            className="form-control-custom"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="auth-label">Email</label>
                        <input
                            type="text"
                            id="email"
                            className="form-control-custom"
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="auth-label">Role</label>
                        <select
                            id="role"
                            className="form-control-custom"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="">Select Role</option>
                            <option value="manager">Manager</option>
                            <option value="employee">Employee</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="auth-label">Department</label>
                        <select
                            id="department"
                            className="form-control-custom"
                            value={formData.department}
                            onChange={handleChange}
                        >
                            <option value="">Choose Department</option>
                            <option value="hr">HR</option>
                            <option value="it">IT</option>
                            <option value="finance">Finance</option>
                            <option value="marketing">Marketing</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="auth-label">Phone (Optional)</label>
                        <input
                            type="tel"
                            id="phone"
                            className="form-control-custom"
                            placeholder="+60 123-456-7890"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="auth-label">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="form-control-custom"
                            placeholder="Minimum 8 characters"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="auth-label">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="form-control-custom"
                            placeholder="Confirm password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" className="btn-create-acc">
                        Create Account
                    </button>

                </form>

                <footer className="text-center mt-3">
                    Already have an account? <Link to="/signin">Sign in</Link>
                </footer>

            </div>
        </div>
    );
};

export default RegisterAcc;
