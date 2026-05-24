import React, { useState } from 'react';
import { Link } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import './RegisterAcc.css';
import logo from "../../assets/achievepro.png";
import { auth } from '../../api/api';


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

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState('');
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({
            ...formData,
            [id]: value
        });

        if (id === 'email') {
            setIsEmailVerified(false);
            setVerificationStatus('');
            setVerificationCode('');
        }

        setErrorMessage('');
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    // Create Password
    const isStrongPassword = (password) => {
        const regex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        return regex.test(password);
    };
    // Email validation
    const isValidEmail = (email) => {
        const regex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    };


    const sendVerificationCode = async () => {
        const email = formData.email.trim().toLowerCase();
        setErrorMessage('');
        setSuccessMessage('');
        setVerificationStatus('');

        if (!email) {
            setErrorMessage('Please enter your email first');
            setShowErrorModal(true);
            return;
        }

        if (!isValidEmail(email)) {
            setErrorMessage('Please enter a valid email address before requesting a code');
            setShowErrorModal(true);
            return;
        }

        setIsSendingCode(true);
        
        try {
            const data = await auth.sendVerificationEmail(email);

            setVerificationStatus('Verification code sent. Please check your email.');
            setIsEmailVerified(false);
        } catch (error) {
            console.error('Verification email error:', error);
            setErrorMessage(error.message || 'Failed to send verification code. Please try again.');
            setShowErrorModal(true);
        } finally {
            setIsSendingCode(false);
        }
    };


    const verifyCode = async () => {
        const email = formData.email.trim().toLowerCase();
        const code = verificationCode.trim();
        setErrorMessage('');

        if (!email) {
            setErrorMessage('Please enter your email first');
            setShowErrorModal(true);
            return;
        }

        if (!/^\d{6}$/.test(code)) {
            setErrorMessage('Verification code must be 6 digits');
            setShowErrorModal(true);
            return;
        }

        setIsVerifyingCode(true);
        
        try {
            const data = await auth.verifyEmailCode(email, code);

            setIsEmailVerified(true);
            setVerificationStatus('Email verified successfully. You can continue signup.');
        } catch (error) {
            console.error('Verify code error:', error);
            setErrorMessage(error.message || 'Failed to verify code. Please try again.');
            setShowErrorModal(true);
        } finally {
            setIsVerifyingCode(false);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        // Check required fields
        if (!formData.fullName.trim()) {
            setErrorMessage("Full name is required");
            setShowErrorModal(true);
            return;
        }

        if (!formData.email.trim()) {
            setErrorMessage("Email is required");
            setShowErrorModal(true);
            return;
        }

        // Check email format
        if (!isValidEmail(formData.email.trim())) {
            setErrorMessage("Please enter a valid email address (e.g., name@company.com)");
            setShowErrorModal(true);
            return;
        }

        if (!isEmailVerified) {
            setErrorMessage("Please verify your email before creating an account");
            setShowErrorModal(true);
            return;
        }

        if (!formData.role) {
            setErrorMessage("Please select a role");
            setShowErrorModal(true);
            return;
        }

        if (!formData.department) {
            setErrorMessage("Please select a department");
            setShowErrorModal(true);
            return;
        }

        if (!formData.password.trim()) {
            setErrorMessage("Password is required");
            setShowErrorModal(true);
            return;
        }

        // Check password strength
        if (!isStrongPassword(formData.password)) {
            setErrorMessage("Password must be at least 8 characters and include both letters and numbers");
            setShowErrorModal(true);
            return;
        }

        // Check confirm password
        if (formData.password !== formData.confirmPassword) {
            setErrorMessage("Password not match");
            setShowErrorModal(true);
            return;
        }

        const payload = {
            name: formData.fullName,
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            phone: formData.phone || "",
            role: formData.role === "employee" ? "staff" : formData.role,
            department: formData.department
        };

        try {
            const data = await auth.register(payload);

                setSuccessMessage("Account created successfully! You can now log in.");
                setShowSuccessModal(true);
                setTimeout(() => {
                    window.location.href = '/signin';
                }, 2000);

        } catch (error) {
            console.error("Registration failed: ", error);
            setErrorMessage(error.message || "Registration failed. Please check your connection.");
            setShowErrorModal(true);
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

                <form onSubmit={handleSubmit}>

                    <div className="mb-3">
                        <label className="auth-label">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            className="form-control-custom"
                            placeholder="John Doe"
                            required
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="auth-label">Email</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="text"
                                id="email"
                                className="form-control-custom"
                                placeholder="name@company.com"
                                required
                                onChange={handleChange}
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={sendVerificationCode}
                                disabled={isSendingCode}
                                style={{
                                    border: '1px solid #0d6efd',
                                    background: '#0d6efd',
                                    color: '#fff',
                                    borderRadius: '6px',
                                    padding: '10px 12px',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.9em'
                                }}
                            >
                                {isSendingCode ? 'Sending...' : 'Send Code'}
                            </button>
                        </div>
                        {verificationStatus && (
                            <p style={{ marginTop: '8px', marginBottom: '0', fontSize: '0.85em', color: isEmailVerified ? '#198754' : '#0d6efd' }}>
                                {verificationStatus}
                            </p>
                        )}
                    </div>

                    <div className="mb-3">
                        <label className="auth-label">Verification Code</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="text"
                                id="verificationCode"
                                className="form-control-custom"
                                placeholder="6-digit code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                maxLength={6}
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={verifyCode}
                                disabled={isVerifyingCode}
                                style={{
                                    border: '1px solid #198754',
                                    background: '#198754',
                                    color: '#fff',
                                    borderRadius: '6px',
                                    padding: '10px 12px',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.9em'
                                }}
                            >
                                {isVerifyingCode ? 'Verifying...' : 'Verify'}
                            </button>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="auth-label">Role</label>
                        <select
                            id="role"
                            className="form-control-custom"
                            required
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
                            required
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
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="auth-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                className="form-control-custom"
                                placeholder="Minimum 8 characters"
                                required
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.2em',
                                    color: '#666'
                                }}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="auth-label">Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                className="form-control-custom"
                                placeholder="Confirm password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                onClick={toggleConfirmPasswordVisibility}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.2em',
                                    color: '#666'
                                }}
                            >
                                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-create-acc">
                        Create Account
                    </button>

                </form>

                {/* Error Modal */}
                {showErrorModal && (
                    <div style={{
                        position: 'fixed',
                        top: '0',
                        left: '0',
                        right: '0',
                        bottom: '0',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: '1000'
                    }}>
                        <div style={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            padding: '30px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                            maxWidth: '400px',
                            width: '90%',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#dc3545', fontSize: '3em', marginBottom: '15px' }}>⚠️</div>
                            <h4 style={{ color: '#333', marginBottom: '15px' }}>Error</h4>
                            <p style={{ color: '#666', marginBottom: '25px', fontSize: '0.95em' }}>{errorMessage}</p>
                            <button
                                onClick={() => setShowErrorModal(false)}
                                style={{
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 30px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '0.95em',
                                    fontWeight: '600'
                                }}
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* Success Modal */}
                {showSuccessModal && (
                    <div style={{
                        position: 'fixed',
                        top: '0',
                        left: '0',
                        right: '0',
                        bottom: '0',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: '1000'
                    }}>
                        <div style={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            padding: '30px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                            maxWidth: '400px',
                            width: '90%',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#28a745', fontSize: '3em', marginBottom: '15px' }}>✓</div>
                            <h4 style={{ color: '#333', marginBottom: '15px' }}>Success</h4>
                            <p style={{ color: '#666', marginBottom: '25px', fontSize: '0.95em' }}>{successMessage}</p>
                            <p style={{ color: '#999', fontSize: '0.85em' }}>Redirecting to login...</p>
                        </div>
                    </div>
                )}

                <footer className="text-center mt-3">
                    Already have an account? <Link to="/signin">Sign in</Link>
                </footer>

            </div>
        </div>
    );
};
export default RegisterAcc;
