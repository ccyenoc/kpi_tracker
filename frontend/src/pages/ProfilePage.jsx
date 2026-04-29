import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './ProfilePage.css';
import PageTitle from '../components/page_title';

const ProfilePage = () => {
    const [fullName, setFullName] = useState('John Manager');
    const [email, setEmail] = useState('john.manager@example.com');
    const [role, setRole] = useState('Manager');
    const [department, setDepartment] = useState('HR');
    const [phone, setPhone] = useState('(+60) 123-456-7890');
    const [activeTab, setActiveTab] = useState('profile');
    const initials = fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

    return (
        <div className="d-flex flex-column">

            <PageTitle
                title="Profile Management"
                subtitle="Manage your account information and security settings" />

            <div className="mx-3 mb-3 tab-pill-navigation">
                <div className={`button-slider ${activeTab === 'profile' ? 'profileActive' : activeTab === 'security' ? 'securityActive' : ''}`} />
                <div className="row tab-pill-navigation-buttons">
                    <button
                        className={`col tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                        style={{ fontSize:"16px"}}
                    >
                        Profile Information
                    </button>

                    <button
                        className={`col tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                         style={{ fontSize:"16px"}}
                        onClick={() => setActiveTab('security')}
                    >
                        Security
                    </button>
                </div>

            </div>

            {activeTab === 'profile' && (
                <div className="content-wrapper">
                    <div className="tab-header">
                        <h5 className="tab-title"  style={{ fontSize:"16px"}}>Personal Information</h5>
                        <p className="tab-subtitle"  style={{ fontSize:"14px"}}>View and update your personal details</p>
                    </div>

                    <div>
                        <div className="full-name">
                            <label className="full-name-label"  style={{ fontSize:"16px"}}>Full Name</label>
                            <input
                                type="text"
                                className="input-full-name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>

                        <div className="email">
                            <label className="email-label"  style={{ fontSize:"16px"}}>Email</label>
                            <input
                                type="email"
                                className="input-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="role">
                            <label className="role-label">Role</label>
                            <select
                                className="form-select border-0 bg-transparent shadow-none"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                 style={{ fontSize:"16px"}}
                            >
                                <option value="Manager">Manager</option>
                                <option value="Staff">Staff</option>
                            </select>
                        </div>

                        <div className="department">
                            <label className="department-label"  style={{ fontSize:"16px"}}>Department</label>
                            <select
                                className="form-select border-0 bg-transparent shadow-none"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                 style={{ fontSize:"16px"}}
                            >
                                <option value="HR">HR</option>
                                <option value="IT">IT</option>
                                <option value="Finance">Finance</option>
                                <option value="Marketing">Marketing</option>
                            </select>
                        </div>

                        <div className="phone">
                            <label className="phone-label"  style={{ fontSize:"16px"}}>Phone</label>
                            <input
                                type="tel"
                                className="form-control border-0 bg-transparent shadow-none"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                 style={{ fontSize:"16px"}} />
                        </div>

                        <button className="btn-update-profile" type="button">Update Profile</button>
                    </div>
                </div>
            )}
            {activeTab === 'security' && (
                <div>
                    <div className="content-wrapper">
                        <div className="tab-header">
                            <h5 className="tab-title"  style={{ fontSize:"16px"}}>Change Password</h5>
                            <p className="tab-subtitle"  style={{ fontSize:"16px"}}>Update your password to keep your account secure</p>
                        </div>
                        <div className="first-input">
                            <label className="current-pw"  style={{ fontSize:"16px"}}>Current Password</label>
                            <input type="password" underline className="input-underline" placeholder=".........." />
                        </div>
                        <div className="second-input">
                            <label className="new-pw"  style={{ fontSize:"16px"}}>New Password</label>
                            <input type="password" underline className="input-underline" placeholder=".........." />
                        </div>
                        <div className="second-input">
                            <label className="confirm-pw"  style={{ fontSize:"16px"}}>Confirm Password</label>
                            <input type="password" underline className="input-underline" placeholder=".........." />
                        </div>
                        <button className="btn-update-pw"  style={{ fontSize:"16px"}}>Update Password</button>
                    </div>
                    <div className='content-wrapper danger-zone'>
                        <div className="tab-header">
                            <h5 className="tab-title text-danger"  style={{ fontSize:"16px"}}>Danger Zone</h5>
                            <p className="tab-subtitle"  style={{ fontSize:"16px"}}>Permanently delete your account and all associated data</p>
                        </div>
                        <button className="btn-danger"  style={{ fontSize:"16px"}}>Delete Account</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
