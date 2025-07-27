// src/App.js
    import React, { useContext } from 'react';
    import { Routes, Route, Link, Navigate } from 'react-router-dom';
    import { AuthContext } from './context/AuthContext'; // Import AuthContext
    import Home from './components/Home'; // Import Home component

    // Placeholder components (will be created in later steps)
    import LibrarianLogin from './components/LibrarianLogin';
    import LibrarianDashboard from './components/LibrarianDashboard';
    import StudentDashboard from './components/StudentDashboard';

    // ProtectedRoute component
    const ProtectedRoute = ({ children, allowedRoles }) => {
        const { isAuthenticated, role } = useContext(AuthContext);

        if (!isAuthenticated) {
            // Not authenticated, redirect to login
            return <Navigate to="/librarian/login" replace />;
        }

        if (allowedRoles && !allowedRoles.includes(role)) {
            // Authenticated but not authorized, redirect to home or an unauthorized page
            return <Navigate to="/" replace />; // Or a specific /unauthorized page
        }

        return children;
    };

    function App() {
        const { isAuthenticated, role } = useContext(AuthContext);

        return (
            <div className="App">
                <nav style={{ backgroundColor: 'var(--navbar-background)', padding: '15px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <Link to="/" style={{ color: 'var(--navbar-text)', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1em' }}>Home</Link>
                        <Link to="/student" style={{ color: 'var(--navbar-text)', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1em' }}>Student Access</Link>
                        {!isAuthenticated && (
                            <Link to="/librarian/login" style={{ color: 'var(--navbar-text)', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1em' }}>Librarian Login</Link>
                        )}
                        {isAuthenticated && role === 'librarian' && (
                            <Link to="/librarian" style={{ color: 'var(--navbar-text)', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1em' }}>Librarian Dashboard</Link>
                        )}
                    </div>
                </nav>

                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/student" element={<StudentDashboard />} />
                    <Route path="/librarian/login" element={<LibrarianLogin />} />
                    <Route
                        path="/librarian"
                        element={
                            <ProtectedRoute allowedRoles={['librarian']}>
                                <LibrarianDashboard />
                            </ProtectedRoute>
                        }
                    />
                    {/* Add a catch-all route for 404 Not Found */}
                    <Route path="*" element={<h2 style={{ textAlign: 'center', marginTop: '50px', color: 'var(--error-color)' }}>404 - Page Not Found</h2>} />
                </Routes>
            </div>
        );
    }

    export default App;
    