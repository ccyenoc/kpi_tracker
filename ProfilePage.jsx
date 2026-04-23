import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './ProfilePage.css';

const ProfilePage = () => {
    const [fullName, setFullName] = useState('John Manager'); 
    const [email, setEmail] = useState('john.manager@example.com'); 
    const [role, setRole] = useState('Manager'); 
    const [department, setDepartment] = useState('HR'); 
    const [phone, setPhone] = useState('(+60) 123-456-7890');

    return (
        <div className="sidebar">
                <div className="mb-5">
                    <div className="mb-2"><i className="bi bi-grid"></i> Dashboard</div>
                    <div className="mb-2"><i className="bi bi-graph-up"></i> KPI Management</div>
                    <div className="mb-2"><i className="bi bi-shield-check"></i> Verify KPI</div>
                </div>
                
                    <div className="profile-pic">{initials}</div>
                    <div>
                        <p className="full-name-bold">{fullName}</p>
                        <p className="role-small">{role}</p>
                    </div>

            <main className="header">
                <header className="main-header">
                    <nav className="profile-nav">Profile</nav>
                    <div className="profile-actions">
                        <i className="bi bi-moon me-3 cursor-pointer"></i>
                    </div>
                </header>

                <h2 className="profile-header">Profile Management</h2>
                <p className="profile-subheader">Manage your account information and security settings</p>

                <div className="tab-pill-navigation">
                    <button 
                        className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile Information
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        Security
                    </button>
                </div>

                <div className="content-wrapper">
                    <div className="profile-header">
                        <h5 className="profile-title">Personal Information</h5>
                        <p className="profile-subtitle">View and update your personal details</p>
                    </div>

                    <div className="content-wrapper">
                        <div className="full-name">
                            <label className="full-name-label">Full Name</label>
                                    <i className="bi bi-person me-2 text-muted"></i>
                                    <input 
                                        type="text" 
                                        className="input-full-name" 
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>

                            <div className="email">
                                <label className="email-label">Email</label>
                                    <i className="bi bi-envelope me-2 text-muted"></i>
                                    <input 
                                        type="email" 
                                        className="input-email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                            </div>

                            <div className="role">
                                <label className="role-label">Role</label>
                                    <i className="bi bi-briefcase me-2 text-muted"></i>
                                    <select 
                                        className="form-select border-0 bg-transparent shadow-none"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="Manager">Manager</option>
                                        <option value="Staff">Staff</option>
                                    </select>
                            </div>

                            <div className="department">
                                <label className="department-label">Department</label>
                                    <i className="bi bi-building me-2 text-muted"></i>
                                    <select 
                                        className="form-select border-0 bg-transparent shadow-none"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                    >
                                        <option value="HR">HR</option>
                                        <option value="IT">IT</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Marketing">Marketing</option>
                                    </select>
                            </div>

                            <div className="phone">
                                <label className="phone-label">Phone</label>
                                    <i className="bi bi-telephone me-2 text-muted"></i>
                                    <input 
                                        type="tel" 
                                        className="form-control border-0 bg-transparent shadow-none" 
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}/>
                                </div>
                            
                            <button className="btn-update-profile">Update Profile</button>
                        </div>
                        </div>
            </main>
        </div>
    );
};

export default ProfilePage;
