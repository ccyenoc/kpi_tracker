import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './ProfilePage.css';
import PageTitle from '../components/page_title';
import { useAuth } from '../Auth';

const ProfilePage = () => {
    const { user } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [department, setDepartment] = useState('');
    const [phone, setPhone] = useState('');
    const [activeTab, setActiveTab] = useState('profile');
    
    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Message state
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const initials = fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

    // Load user data from Auth context on mount
    useEffect(() => {
        if (user) {
            setFullName(user.name || '');
            setEmail(user.email || '');
            setRole(user.role === 'manager' ? 'Manager' : 'Staff');
            // Normalize department to lowercase for dropdown matching
            const deptValue = (user.department || '').toLowerCase();
            setDepartment(deptValue);
            // Only set phone if it's not the default placeholder
            const phoneValue = user.phone || '';
            setPhone(phoneValue !== '0000000000' ? phoneValue : '');
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: fullName,
                    phone: phone,
                    department: department
                })
            });

            const data = await response.json();

            if (data.success) {
                // Update localStorage with new user data
                localStorage.setItem('user', JSON.stringify(data.user));
                setSuccessMsg('Profile updated successfully!');
                setTimeout(() => setSuccessMsg(''), 3000);
            } else {
                setErrorMsg(data.detail || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            setErrorMsg('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setErrorMsg('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setErrorMsg('New password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                    confirmPassword: confirmPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMsg('Password updated successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setSuccessMsg(''), 3000);
            } else {
                setErrorMsg(data.detail || 'Failed to update password');
            }
        } catch (error) {
            console.error('Password update error:', error);
            setErrorMsg('Failed to update password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure? This will permanently delete your account and all associated data. This action cannot be undone.')) {
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/profile', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/signin';
            } else {
                setErrorMsg(data.detail || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Account deletion error:', error);
            setErrorMsg('Failed to delete account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
            // Clear localStorage and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/signin';
        } catch (error) {
            console.error('Logout error:', error);
            // Still redirect even if API call fails
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/signin';
        }
    };

    return (
        <div className="d-flex flex-column">

            <PageTitle
                title="Profile Management"
                subtitle="Manage your account information and security settings" />

            {successMsg && (
                <div className="alert alert-success mx-3 mb-3" role="alert">
                    {successMsg}
                </div>
            )}

            {errorMsg && (
                <div className="alert alert-danger mx-3 mb-3" role="alert">
                    {errorMsg}
                </div>
            )}

            <div className="mx-3 mb-3" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    className="btn btn-outline-danger"
                    onClick={handleLogout}
                    style={{ fontSize: "14px" }}
                >
                    <i className="bi bi-box-arrow-right"></i> Logout
                </button>
            </div>

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

                    <form onSubmit={handleUpdateProfile}>
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
                                disabled
                            />
                        </div>

                        <div className="role">
                            <label className="role-label">Role</label>
                            <input
                                type="text"
                                className="form-control border-0 bg-transparent shadow-none"
                                value={role}
                                disabled
                                 style={{ fontSize:"16px"}}
                            />
                        </div>

                        <div className="department">
                            <label className="department-label"  style={{ fontSize:"16px"}}>Department</label>
                            <select
                                className="form-select border-0 bg-transparent shadow-none"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                 style={{ fontSize:"16px"}}
                            >
                                <option value="">Select Department</option>
                                <option value="hr">HR</option>
                                <option value="it">IT</option>
                                <option value="finance">Finance</option>
                                <option value="marketing">Marketing</option>
                            </select>
                        </div>

                        <div className="phone">
                            <label className="phone-label"  style={{ fontSize:"16px"}}>Phone (Optional)</label>
                            <input
                                type="tel"
                                className="form-control border-0 bg-transparent shadow-none"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+60 123-456-7890"
                                 style={{ fontSize:"16px"}} />
                        </div>

                        <button className="btn-update-profile" type="submit" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Profile'}
                        </button>
                    </form>
                </div>
            )}
            {activeTab === 'security' && (
                <div>
                    <div className="content-wrapper">
                        <div className="tab-header">
                            <h5 className="tab-title"  style={{ fontSize:"16px"}}>Change Password</h5>
                            <p className="tab-subtitle"  style={{ fontSize:"16px"}}>Update your password to keep your account secure</p>
                        </div>
                        <form onSubmit={handleUpdatePassword}>
                            <div className="first-input">
                                <label className="current-pw"  style={{ fontSize:"16px"}}>Current Password</label>
                                <input
                                    type="password"
                                    className="input-underline"
                                    placeholder=".........."
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required />
                            </div>
                            <div className="second-input">
                                <label className="new-pw"  style={{ fontSize:"16px"}}>New Password</label>
                                <input
                                    type="password"
                                    className="input-underline"
                                    placeholder=".........."
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required />
                            </div>
                            <div className="second-input">
                                <label className="confirm-pw"  style={{ fontSize:"16px"}}>Confirm Password</label>
                                <input
                                    type="password"
                                    className="input-underline"
                                    placeholder=".........."
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required />
                            </div>
                            <button className="btn-update-pw" type="submit" disabled={loading} style={{ fontSize:"16px"}}>
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                    <div className='content-wrapper danger-zone'>
                        <div className="tab-header">
                            <h5 className="tab-title text-danger"  style={{ fontSize:"16px"}}>Danger Zone</h5>
                            <p className="tab-subtitle"  style={{ fontSize:"16px"}}>Permanently delete your account and all associated data</p>
                        </div>
                        <button className="btn-danger" type="button" onClick={handleDeleteAccount} disabled={loading} style={{ fontSize:"16px"}}>
                            {loading ? 'Deleting...' : 'Delete Account'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
