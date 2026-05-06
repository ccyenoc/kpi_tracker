import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css';
import logo from "../assets/achievepro.png";

{/* mock data */}
import { users } from "../data/userData";


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

        //blank email/password
        if (
            credentials.email.trim() === '' ||
            credentials.password.trim() === ''
        ) {
            setErrorMessage("Please fill in all blanks");
            return;
        }

        try {
            const foundUser = users.find(
                u => u.email === credentials.email
            );
            
            if(!foundUser){
                setErrorMessage("Authentication record not found");
                return;
            }

            if(foundUser.password != credentials.password){
                setErrorMessage("Invalid email or password");
                return;
            }

            // when login is successfull
            const {password, ...userWithoutPassword}= foundUser;

            localStorage.setItem("user",JSON.stringify(userWithoutPassword));
            localStorage.setItem("token","fake-token");

            // redict to dashboard based on role
            if(foundUser.role === 'manager'){
                window.location.href = '/manager/dashboard';
            }
            else{
                window.location.href = '/staff/dashboard';
            }
        

        } catch (error) {
            console.error('Login error:', error);
            setErrorMessage("Something went wrong");
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

                   <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-2 fw-bold mb-3"
                    style={{
                     display: "flex",
                     justifyContent: "center",
                     alignItems: "center"
                    }}>Sign In
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
