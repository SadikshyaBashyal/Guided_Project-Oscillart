import React from 'react';
import './Navbar.css';
import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <img href="/play.svg" alt="Oscillart" />
                    <h1>Oscillart Play</h1>
                </Link>
            </div>
        </nav>
    );
}

export default Navbar;