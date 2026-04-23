import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './SecurityPage.css';

const SecurityPage = () => {
    const [activeTab, setActiveTab] = useState('profile');

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
                    <nav className="security-nav">Profile</nav>
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
                        <div className="security-views">
                            <div className="first-card">
                                <h5 className="change-pw">Change Password</h5>
                                <p className="update-pw">Update your password to keep your account secure</p>
                                
                                <div className="first-input">
                                    <label className="current-pw">Current Password</label>
                                    <input type="password" underline className="input-underline" placeholder=".........." />
                                </div>
                                <div className="second-input">
                                    <label className="new-pw">New Password</label>
                                    <input type="password" underline className="input-underline" placeholder=".........." />
                                </div>
                                <button className="btn-update-pw">Update Password</button>
                            </div>

                            <div className="danger-zone-card">
                                <h5 className="danger-zone">Danger Zone</h5>
                                <p className="text-muted small">Permanently delete your account and all associated data</p>
                                <button className="btn-danger"><i className="bi bi-trash me-2"></i>Delete Account</button>
                            </div>
                        </div>
                </div>
            </main>
        </div>
    );
};

export default SecurityPage;