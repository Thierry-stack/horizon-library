 // src/components/LibrarianDashboard.js
    import React, { useState, useEffect, useContext } from 'react';
    import axios from 'axios';
    import { AuthContext } from '../context/AuthContext'; // Import AuthContext

    function LibrarianDashboard() {
        const { token, logout } = useContext(AuthContext); // Get token and logout from context
        const [books, setBooks] = useState([]);
        const [formData, setFormData] = useState({
            title: '',
            author: '',
            isbn: '',
            published_date: '',
            description: '',
            shelf_number: '',
            row_position: ''
        });
        const [coverImageFile, setCoverImageFile] = useState(null); // New state for the file object
        const [currentCoverImageUrl, setCurrentCoverImageUrl] = useState(''); // To display existing image during edit
        const [editingBookId, setEditingBookId] = useState(null); // To track which book is being edited
        const [error, setError] = useState('');
        const [message, setMessage] = useState('');

        // Axios instance with auth token for protected routes
        const api = axios.create({
            baseURL: 'http://localhost:5000/api/librarian', // Base URL for librarian API
            headers: {
                // 'Content-Type' will be set to 'multipart/form-data' by Axios automatically when sending FormData
            },
        });

        // Add an interceptor to include the token in every request
        api.interceptors.request.use(config => {
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        }, error => {
            return Promise.reject(error);
        });

        // Function to fetch all books
        const fetchBooks = async () => {
            try {
                // This fetches from /api/books (public)
                const res = await axios.get('http://localhost:5000/api/books');
                setBooks(res.data);
            } catch (err) {
                console.error('Error fetching books:', err.response ? err.response.data : err.message);
                setError('Failed to fetch books.');
            }
        };

        // Fetch books on component mount
        useEffect(() => {
            fetchBooks();
        }, []);

        const handleChange = (e) => {
            if (e.target.name === 'coverImage') { // Handle file input separately
                setCoverImageFile(e.target.files[0]);
            } else {
                setFormData({ ...formData, [e.target.name]: e.target.value });
            }
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            setError('');
            setMessage('');

            try {
                const dataToSend = new FormData(); // Create FormData object for file uploads

                // Append all text fields from formData
                for (const key in formData) {
                    dataToSend.append(key, formData[key]);
                }

                // Append the file if it exists
                if (coverImageFile) {
                    dataToSend.append('coverImage', coverImageFile); // 'coverImage' must match the field name in multer config
                } else if (editingBookId && currentCoverImageUrl === null) {
                    // If in edit mode and user explicitly cleared the image (by setting currentCoverImageUrl to null)
                    // and no new file was selected, send an empty string to backend to clear it.
                    dataToSend.append('cover_image_url', ''); // Send empty string to clear it in DB
                }


                if (editingBookId) {
                    // Update existing book
                    await api.put(`/books/${editingBookId}`, dataToSend, {
                        headers: {
                            'Content-Type': 'multipart/form-data', // Important for file uploads
                        },
                    });
                    setMessage('Book updated successfully!');
                } else {
                    // Add new book
                    await api.post('/books', dataToSend, {
                        headers: {
                            'Content-Type': 'multipart/form-data', // Important for file uploads
                        },
                    });
                    setMessage('Book added successfully!');
                }
                setFormData({ // Clear form
                    title: '', author: '', isbn: '', published_date: '', description: '',
                    shelf_number: '', row_position: ''
                });
                setCoverImageFile(null); // Clear file input
                setCurrentCoverImageUrl(''); // Clear current image display
                setEditingBookId(null); // Exit edit mode
                fetchBooks(); // Refresh book list
            } catch (err) {
                console.error('Book operation failed:', err.response ? err.response.data : err.message);
                setError(err.response?.data?.message || 'Operation failed.');
            }
        };

        const handleEdit = (book) => {
            setFormData({
                title: book.title,
                author: book.author,
                isbn: book.isbn,
                published_date: book.published_date ? book.published_date.split('T')[0] : '', // Format date for input type="date"
                description: book.description || '',
                shelf_number: book.shelf_number || '',
                row_position: book.row_position || ''
            });
            setCurrentCoverImageUrl(book.cover_image_url || ''); // Store current URL for display
            setCoverImageFile(null); // Clear any previously selected file
            setEditingBookId(book.id);
            window.scrollTo(0, 0); // Scroll to top to show form
        };

        const handleDelete = async (bookId) => {
            if (window.confirm('Are you sure you want to delete this book?')) {
                try {
                    await api.delete(`/books/${bookId}`);
                    setMessage('Book deleted successfully!');
                    fetchBooks(); // Refresh book list
                } catch (err) {
                    console.error('Delete failed:', err.response ? err.response.data : err.message);
                    setError(err.response?.data?.message || 'Deletion failed.');
                }
            }
        };

        const handleLogout = () => {
            logout(); // Call logout function from AuthContext
            // navigate('/'); // AuthContext will handle redirect via ProtectedRoute
        };

        return (
            <div style={{ padding: '20px', maxWidth: '1000px', margin: '20px auto', backgroundColor: 'var(--background-color)', borderRadius: '8px', boxShadow: '0 4px 8px var(--shadow-light)' }}>
                <h2 style={{ color: 'var(--primary-color)', textAlign: 'center', marginBottom: '30px' }}>Librarian Dashboard</h2>
                <button onClick={handleLogout} style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: 'red', margin: '0' }}>Logout</button>

                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message" style={{ color: 'green', backgroundColor: '#e6ffe6', border: '1px solid green', padding: '8px 15px', borderRadius: '5px', marginBottom: '15px' }}>{message}</div>}

                {/* Book Add/Edit Form */}
                <div style={{ backgroundColor: 'var(--card-background)', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px var(--shadow-light)', marginBottom: '30px' }}>
                    <h3 style={{ color: 'var(--secondary-color)', textAlign: 'center', marginBottom: '20px' }}>{editingBookId ? 'Edit Book' : 'Add New Book'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label>Title:</label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange} required />
                            </div>
                            <div>
                                <label>Author:</label>
                                <input type="text" name="author" value={formData.author} onChange={handleChange} required />
                            </div>
                            <div>
                                <label>ISBN:</label>
                                <input type="text" name="isbn" value={formData.isbn} onChange={handleChange} required />
                            </div>
                            <div>
                                <label>Published Date:</label>
                                <input type="date" name="published_date" value={formData.published_date} onChange={handleChange} required />
                            </div>
                        </div>
                        {/* File Input for Cover Image */}
                        <div style={{ marginBottom: '20px' }}>
                            <label>Upload Cover Image:</label>
                            <input type="file" name="coverImage" accept="image/*" onChange={handleChange} style={{ display: 'block', marginTop: '5px' }} />
                            {editingBookId && currentCoverImageUrl && (
                                <div style={{ marginTop: '10px' }}>
                                    <p style={{ fontSize: '0.9em', color: 'var(--light-text-color)', marginBottom: '5px' }}>Current Cover:</p>
                                    <img
                                        src={`http://localhost:5000${currentCoverImageUrl}`} // Prepend backend URL for display
                                        alt="Current Cover"
                                        style={{ maxWidth: '100px', height: 'auto', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setCurrentCoverImageUrl(null)} // Allow clearing existing image
                                        style={{ backgroundColor: '#f44336', padding: '5px 10px', fontSize: '0.7em', marginLeft: '10px' }}
                                    >
                                        Clear Current
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* New fields for Shelf and Row Position */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label>Shelf Number:</label>
                                <input type="text" name="shelf_number" value={formData.shelf_number} onChange={handleChange} placeholder="e.g., A3" />
                            </div>
                            <div>
                                <label>Row Position:</label>
                                <input type="text" name="row_position" value={formData.row_position} onChange={handleChange} placeholder="e.g., 5" />
                            </div>
                        </div>
                        <div>
                            <label>Description:</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="4"></textarea>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button type="submit">{editingBookId ? 'Update Book' : 'Add Book'}</button>
                            {editingBookId && (
                                <button type="button" onClick={() => {
                                    setEditingBookId(null);
                                    setFormData({ title: '', author: '', isbn: '', published_date: '', description: '', shelf_number: '', row_position: '' }); // Clear all text fields
                                    setCoverImageFile(null); // Clear file input
                                    setCurrentCoverImageUrl(''); // Clear current image display
                                    setError('');
                                    setMessage('');
                                }} style={{ backgroundColor: '#f44336' }}>Cancel Edit</button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Book List */}
                <div style={{ backgroundColor: 'var(--card-background)', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px var(--shadow-light)' }}>
                    <h3 style={{ color: 'var(--secondary-color)', textAlign: 'center', marginBottom: '20px' }}>Current Books</h3>
                    {books.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--light-text-color)' }}>No books found. Add some!</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {books.map((book) => (
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
                                                src={`http://localhost:5000${book.cover_image_url}`} // Prepend backend URL
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
                                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        <button onClick={() => handleEdit(book)} style={{ backgroundColor: 'var(--secondary-color)', padding: '8px 15px', fontSize: '0.8em' }}>Edit</button>
                                        <button onClick={() => handleDelete(book.id)} style={{ backgroundColor: '#f44336', padding: '8px 15px', fontSize: '0.8em' }}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    export default LibrarianDashboard;
    