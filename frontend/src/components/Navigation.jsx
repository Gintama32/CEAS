import React, { useState, useEffect } from 'react';
import './Navigation.css';

const Navigation = () => {
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleUserMenuClick = () => {
        setShowUserMenu(!showUserMenu);
    };

    const handleSettingsClick = () => {
        setShowUserMenu(false);
        alert('Settings page would open here! (This is a prototype)');
    };

    const handleProfileClick = () => {
        setShowUserMenu(false);
        alert('Profile page would open here! (This is a prototype)');
    };

    const handleLogoutClick = () => {
        setShowUserMenu(false);
        alert('Logout functionality would be here! (This is a prototype)');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showUserMenu && !event.target.closest('[data-user-menu]')) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    return (
        <header className="navigation-bar">
            <div className="navigation-container">
                {/* Logo */}
                <div className="logo-container">
                    <div className="logo">
                        CEAS
                    </div>
                    <div>
                        <h1 style={{ 
                            margin: '0', 
                            color: '#333',
                            fontSize: '24px',
                            fontWeight: 'bold'
                        }}>
                            Construction Estimate & Analysis System
                        </h1>
                        <p style={{ 
                            margin: '0', 
                            color: '#666',
                            fontSize: '14px'
                        }}>
                            Professional Construction Estimating Platform
                        </p>
                    </div>
                    
                    {/* Optional: Add navigation links here if needed */}
                    {/* <div className="nav-links">
                        <a href="#" className="nav-link">Dashboard</a>
                        <a href="#" className="nav-link">Projects</a>
                        <a href="#" className="nav-link">Reports</a>
                    </div> */}
                </div>

                {/* User Profile */}
                <div className="user-profile" data-user-menu>
                    <div
                        onClick={handleUserMenuClick}
                        className="user-button"
                        style={{
                            backgroundColor: showUserMenu ? '#f8f9fa' : 'transparent'
                        }}
                    >
                        <div className="user-avatar">
                            JD
                        </div>
                        <div>
                            <div style={{ 
                                fontSize: '14px', 
                                fontWeight: 'bold', 
                                color: '#333',
                                margin: '0'
                            }}>
                                John Doe
                            </div>
                            <div style={{ 
                                fontSize: '12px', 
                                color: '#666',
                                margin: '0'
                            }}>
                                Project Manager
                            </div>
                        </div>
                        <div style={{ 
                            fontSize: '12px', 
                            color: '#666',
                            transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                        }}>
                            ▼
                        </div>
                    </div>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                        <div className="dropdown-menu">
                            <div
                                onClick={handleProfileClick}
                                className="menu-item"
                            >
                                <span>👤</span>
                                <span>My Profile</span>
                            </div>
                            <div
                                onClick={handleSettingsClick}
                                className="menu-item"
                            >
                                <span>⚙️</span>
                                <span>Settings</span>
                            </div>
                            <div
                                onClick={handleLogoutClick}
                                className="menu-item danger"
                            >
                                <span>🚪</span>
                                <span>Logout</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navigation;
