import React from 'react';
import './Navbar.css';

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <a href="https://sadikshyabashyal.github.io/Oscillart-Play/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <img src="play.svg" alt="Oscillart" />
                    <h1>Oscillart Play</h1>
                </a>
            </div>
        </nav>
    );
}

export default Navbar;