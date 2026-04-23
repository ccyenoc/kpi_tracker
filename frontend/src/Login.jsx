import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css';

const Login = () => {
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials({ ...credentials, [name]: value });
    };

    const handleSignIn = (e) => {
        e.preventDefault();
        console.log("Logging in with:", credentials);
        alert(`Welcome back, ${credentials.email}!`);
    };

    return (
        <div className="login-wrapper">
                <div className="welcome-back">
                    <h2 className="big-title">Welcome back</h2>
                    <p className="subtitle">Enter your credentials to access your account</p>

                <form onSubmit={handleSignIn}>
                    <div className="mb-3">
                        <label className="email-label">Email</label>
                            <i className="bi bi-envelope"></i>
                            <input 
                                type="email" 
                                name="email"
                                className="form-control-custom" 
                                placeholder="name@company.com" 
                                value={credentials.email}
                                onChange={handleChange}
                                required
                            />
                    </div>

                    <div className="password">
                        <label className="password-label">Password</label>
                            <i className="bi bi-lock"></i>
                            <input 
                                type="password" 
                                name="password"
                                className="form-control-custom" 
                                placeholder="Enter your password" 
                                value={credentials.password}
                                onChange={handleChange}
                                required
                            />
                    </div>

                    <button type="submit" className="btn btn-primary w-100 py-2 fw-bold mb-3">
                        Sign in
                    </button>
                </form>

                    <footer className="small text-muted">
                        Don't have an account? <a href="/signup" className="text-decoration-none">Sign up</a>
                    </footer>
                </div>
            </div>
    );
};

export default Login;
