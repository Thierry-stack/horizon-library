 // src/index.js
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import './index.css'; // We will create this file next for global styles
    import App from './App';
    import { BrowserRouter as Router } from 'react-router-dom'; // Import BrowserRouter
    import { AuthProvider } from './context/AuthContext'; // Import AuthProvider

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <Router> {/* Wrap App with Router */}
          <AuthProvider> {/* Wrap App with AuthProvider */}
            <App />
          </AuthProvider>
        </Router>
      </React.StrictMode>
    );