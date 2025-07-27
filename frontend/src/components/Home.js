// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '40px'
        }}>
            <h1 style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                flexWrap: 'wrap' 
            }}>
                <span style={{ color: 'var(--primary-color)' }}>Digital</span>
                <span style={{ color: 'var(--secondary-color)' }}>Library</span>
                <h3 style={{ 
                    color: 'red', 
                    margin: 0, 
                    fontSize: '1.2rem' 
                }}>
                    (Academic Nexus)
                </h3>
            </h1>

            <p style={{
                color: 'var(--text-color)',
                fontSize: '1.2em',
                marginBottom: '40px',
                maxWidth: '600px',
                textAlign: 'center'
            }}>
                Your gateway to a world of knowledge. Whether you're a student looking for your next read or a librarian managing the collection, we've got you covered.
            </p>

            <div style={{ display: 'flex', gap: '20px' }}>
                <Link to="/student" style={{
                    backgroundColor: 'var(--secondary-color)',
                    color: 'white',
                    padding: '15px 30px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '1.1em',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    transition: 'background-color 0.3s ease',
                    cursor: 'pointer'
                }}>
                    I am a Student
                </Link>

                <Link to="/librarian/login" style={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    padding: '15px 30px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '1.1em',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    transition: 'background-color 0.3s ease',
                    cursor: 'pointer'
                }}>
                    I am a Librarian
                </Link>
            </div>
        </div>
    );
}

export default Home;
