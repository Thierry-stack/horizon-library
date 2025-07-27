 // src/components/StudentDashboard.js
    import React, { useEffect, useState } from 'react';
    import axios from 'axios';

    // Updated: Using your Render backend URL
    const BACKEND_URL = 'https://horizon-library-backend.onrender.com';

    function StudentDashboard() {
        const [books, setBooks] = useState([]);
        const [filteredBooks, setFilteredBooks] = useState([]); // For search results
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [searchTerm, setSearchTerm] = useState('');

        // Function to fetch all books
        const fetchBooks = async () => {
            try {
                // This fetches from /api/books (public)
                const response = await axios.get(`${BACKEND_URL}/api/books`);
                setBooks(response.data);
                setFilteredBooks(response.data); // Initially, all books are filtered
            } catch (err) {
                setError('Failed to load books. Please try again later.');
                console.error('Error fetching books:', err.response ? err.response.data : err.message);
            } finally {
                setLoading(false);
            }
        };

        // Fetch books on component mount
        useEffect(() => {
            fetchBooks();
        }, []);

        // Handle search input change
        useEffect(() => {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            const results = books.filter(book =>
                book.title.toLowerCase().includes(lowercasedSearchTerm) ||
                book.author.toLowerCase().includes(lowercasedSearchTerm) ||
                book.isbn.toLowerCase().includes(lowercasedSearchTerm) || // Allow searching by ISBN
                (book.description && book.description.toLowerCase().includes(lowercasedSearchTerm)) // Allow searching by description
            );
            setFilteredBooks(results);
        }, [searchTerm, books]); // Re-filter when search term or original books list changes

        if (loading) return <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2em', color: 'var(--light-text-color)' }}>Loading books...</div>;
        if (error) return <div className="error-message" style={{ margin: '20px auto', maxWidth: '600px' }}>Error: {error}</div>;

        return (
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '20px auto', backgroundColor: 'var(--background-color)', borderRadius: '8px', boxShadow: '0 4px 8px var(--shadow-light)' }}>
                <h2 style={{ color: 'var(--primary-color)', textAlign: 'center', marginBottom: '30px' }}>Welcome, Student!</h2>
                <p style={{ textAlign: 'center', color: 'var(--light-text-color)', fontSize: '1.1em', marginBottom: '20px' }}>Explore our vast collection of books.</p>

                {/* Search Bar */}
                <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search by title, author, ISBN, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '80%', maxWidth: '500px', padding: '12px', borderRadius: '5px', border: '1px solid var(--border-color)', fontSize: '1em' }}
                    />
                </div>

                {/* Book List */}
                <div style={{ backgroundColor: 'var(--card-background)', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px var(--shadow-light)' }}>
                    <h3 style={{ color: 'var(--secondary-color)', textAlign: 'center', marginBottom: '20px' }}>Available Books:</h3>
                    {filteredBooks.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--light-text-color)' }}>No books found matching your search. Try a different term!</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {filteredBooks.map(book => (
                                <div key={book.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '15px', backgroundColor: '#fff', boxShadow: '0 1px 3px var(--shadow-light)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    {/* Image container - now flexible height */}
                                    <div style={{ 
                                        width: '100%', 
                                        maxWidth: '150px', /* Constraint for image width */
                                        marginBottom: '10px', 
                                        borderRadius: '4px',
                                        backgroundColor: '#e0e0e0', /* Placeholder background */
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        overflow: 'hidden' /* Hide overflow if image is too large */
                                    }}>
                                        {book.cover_image_url ? (
                                            <img
                                                src={`${BACKEND_URL}${book.cover_image_url}`} // Prepend backend URL
                                                alt={`Cover of ${book.title}`}
                                                style={{ maxWidth: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150x200?text=No+Image'; }} // Fallback image
                                            />
                                        ) : (
                                            <img
                                                src="https://via.placeholder.com/150x200?text=No+Image"
                                                alt="No Cover Available"
                                                style={{ maxWidth: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
                                            />
                                        )}
                                    </div>
                                    
                                    <h4 style={{ color: 'var(--primary-color)', margin: '0 0 10px 0', textAlign: 'center' }}>{book.title}</h4>
                                    <p style={{ fontSize: '0.9em', color: 'var(--light-text-color)', textAlign: 'center' }}>By: {book.author}</p>
                                    <p style={{ fontSize: '0.9em', color: 'var(--light-text-color)', textAlign: 'center' }}>ISBN: {book.isbn}</p>
                                    <p style={{ fontSize: '0.9em', color: 'var(--light-text-color)', textAlign: 'center' }}>Published: {new Date(book.published_date).toLocaleDateString()}</p>
                                    {book.shelf_number && <p style={{ fontSize: '0.9em', color: 'var(--light-text-color)', textAlign: 'center' }}>Shelf: {book.shelf_number}</p>}
                                    {book.row_position && <p style={{ fontSize: '0.9em', color: 'var(--light-text-color)', textAlign: 'center' }}>Row: {book.row_position}</p>}
                                    {book.description && <p style={{ fontSize: '0.85em', color: 'var(--text-color)', marginTop: '10px', textAlign: 'center' }}>{book.description}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    export default StudentDashboard;
    
