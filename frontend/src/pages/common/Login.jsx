import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css';
import logo from "../../assets/achievepro.png";
import { auth } from '../../api/api';

const Login = () => {

    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });

    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;

        setCredentials({
            ...credentials,
            [name]: value
        });

        setErrorMessage('');
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        console.log(credentials);

        //blank email/password
        if (
            credentials.email.trim() === '' ||
            credentials.password.trim() === ''
        ) {
            setErrorMessage("Please fill in all blanks");
            return;
        }

        try {
            const data = await auth.login(credentials);

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            window.location.href = data.dashboard;

        } catch (error) {
            console.error('Login error:', error);
            setErrorMessage(error.message || "Authentication record not found");
        }
    };

    return (
        <div className="login-wrapper">
            <div className="welcome-back">

                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <img
                        src={logo}
                        alt="Achieve Logo"
                        style={{ width: "120px", height: "auto" }}
                    />
                </div>

                <h2 className="big-title">Welcome back</h2>
                <p className="subtitle">
                    Enter your credentials to access your account
                </p>

                {errorMessage && (
                    <div className="alert alert-danger py-2">
                        {errorMessage}
                    </div>
                )}

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
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 py-2 fw-bold mb-3"
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center"
                        }}
                    >
                        Sign In
                    </button>

                </form>

                <footer className="small text-muted">
                    Don't have an account?{" "}
                    <a
                        href="/signup"
                        className="text-decoration-none"
                    >
                        Sign up
                    </a>
                </footer>

            </div>
        </div>
    );
};

export default Login;
