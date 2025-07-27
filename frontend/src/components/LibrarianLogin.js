 // src/components/LibrarianLogin.js
    import React, { useState, useContext } from 'react';
    import axios from 'axios';
    import { AuthContext } from '../context/AuthContext'; // Import AuthContext

    function LibrarianLogin() {
        const [username, setUsername] = useState('');
        const [password, setPassword] = useState('');
        const [error, setError] = useState('');
        const { login } = useContext(AuthContext); // Get login function from AuthContext

        const handleSubmit = async (e) => {
            e.preventDefault();
            setError(''); // Clear previous errors

            try {
                const res = await axios.post('http://localhost:5000/api/librarian/login', {
                    username,
                    password,
                });
                
                // If login is successful, call the login function from AuthContext
                login(res.data.token, res.data.role);

            } catch (err) {
                console.error('Login error:', err.response ? err.response.data : err.message);
                setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
            }
        };

        return (
            <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', backgroundColor: 'var(--card-background)', borderRadius: '8px', boxShadow: '0 4px 8px var(--shadow-light)' }}>
                <h2 style={{ color: 'var(--primary-color)', textAlign: 'center', marginBottom: '30px' }}>Librarian Login</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label>Username:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Login</button>
                </form>
            </div>
        );
    }

    export default LibrarianLogin;
    