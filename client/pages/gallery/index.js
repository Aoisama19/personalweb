import { useState, useRef, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { FaPlus, FaEdit, FaTrash, FaFolder, FaImage, FaSearch, FaHeart } from 'react-icons/fa';
import { apiCall } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext'; // Import useTheme

export default function GalleryPage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const { darkMode } = useTheme(); // Use darkMode from context
  const [activeAlbum, setActiveAlbum] = useState(null); // State for selected album
  const [selectedPhoto, setSelectedPhoto] = useState(null); // State for selected photo (for viewing)
  const [showPhotoModal, setShowPhotoModal] = useState(false); // State to control visibility of photo modal
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  const [albumFormData, setAlbumFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [photoFormData, setPhotoFormData] = useState({
    caption: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch albums from API
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        if (isAuthenticated) {
          setLoading(true);
          const data = await apiCall.getAlbums();
          setAlbums(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching albums:', err);
        setError('Failed to load albums. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [isAuthenticated]);

  // Filter albums based on search term
  const filteredAlbums = albums.filter(album =>
    album.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    album.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddAlbum = () => {
    setCurrentAlbum(null);
    setAlbumFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAlbumModal(true);
  };

  const handleEditAlbum = (album) => {
    setCurrentAlbum(album);
    setAlbumFormData({
      title: album.title,
      description: album.description || '',
      date: album.date
    });
    setShowAlbumModal(true);
  };

  const handleDeleteAlbum = async (id) => {
    if (confirm('Are you sure you want to delete this album?')) {
      try {
        await apiCall.deleteAlbum(id);
        setAlbums(albums.filter(album => album._id !== id));

        if (activeAlbum && activeAlbum._id === id) {
          setActiveAlbum(null);
        }
      } catch (err) {
        console.error('Error deleting album:', err);
        alert('Failed to delete the album. Please try again.');
      }
    }
  };

  const handleAlbumSubmit = async (e) => {
    e.preventDefault();

    const albumData = {
      title: albumFormData.title,
      description: albumFormData.description,
      date: albumFormData.date
    };

    try {
      if (currentAlbum) {
        // Update existing album
        const updatedAlbum = await apiCall.updateAlbum(currentAlbum._id, albumData);
        const updatedAlbums = albums.map(album =>
          album._id === currentAlbum._id ? updatedAlbum : album
        );
        setAlbums(updatedAlbums);

        // If this is the active album, update it
        if (activeAlbum && activeAlbum._id === currentAlbum._id) {
          setActiveAlbum(updatedAlbum);
        }
      } else {
        // Add new album
        const newAlbum = await apiCall.addAlbum(albumData);
        setAlbums([...albums, newAlbum]);
      }

      setShowAlbumModal(false);
    } catch (err) {
      console.error('Error saving album:', err);
      alert('Failed to save the album. Please try again.');
    }
  };

  const handleAddPhoto = () => {
    if (!activeAlbum) {
      alert('Please select an album first');
      return;
    }

    setPhotoFormData({
      caption: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowPhotoModal(true);
  };

  const handlePhotoSubmit = async (e) => {
    e.preventDefault();

    if (!activeAlbum) return;

    // Get file from input
    const fileInput = fileInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert('Please select a photo to upload');
      return;
    }

    const file = fileInput.files[0];

    try {
      // Create photo data object
      const photoData = {
        file: file,
        caption: photoFormData.caption,
        date: photoFormData.date
      };

      // Upload photo to API
      const updatedAlbum = await apiCall.addPhoto(activeAlbum._id, photoData);

      // Update albums array
      const updatedAlbums = albums.map(album =>
        album._id === activeAlbum._id ? updatedAlbum : album
      );

      // Update state
      setAlbums(updatedAlbums);
      setActiveAlbum(updatedAlbum);
      setShowPhotoModal(false);
    } catch (err) {
      console.error('Error uploading photo:', err);
      alert('Failed to upload the photo. Please try again.');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!activeAlbum) return;

    if (confirm('Are you sure you want to delete this photo?')) {
      try {
        await apiCall.deletePhoto(activeAlbum._id, photoId);

        // Create updated album with photo removed
        const updatedAlbum = {
          ...activeAlbum,
          photos: activeAlbum.photos.filter(photo => photo._id !== photoId)
        };

        // Update albums array
        const updatedAlbums = albums.map(album =>
          album._id === activeAlbum._id ? updatedAlbum : album
        );

        // Update state
        setAlbums(updatedAlbums);
        setActiveAlbum(updatedAlbum);

        // Close photo view if the deleted photo was being viewed
        if (selectedPhoto && selectedPhoto._id === photoId) {
          setSelectedPhoto(null);
        }
      } catch (err) {
        console.error('Error deleting photo:', err);
        alert('Failed to delete the photo. Please try again.');
      }
    }
  };

  const handlePhotoClick = (photo) => {
    console.log('Photo clicked:', photo);
    setSelectedPhoto(photo);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  const handleClosePhotoView = () => {
    setSelectedPhoto(null);
    document.body.style.overflow = ''; // Restore scrolling
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape' && selectedPhoto) {
      handleClosePhotoView();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    
    // Clean up event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedPhoto]); // Re-add listener when selectedPhoto changes

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 dark:text-white transition-colors duration-200">Photo Gallery</h1>

        {loading && (
          <div className="flex justify-center py-8">
            <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Loading albums...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 transition-colors duration-200">
            <p className="text-red-700 dark:text-red-400 transition-colors duration-200">{error}</p>
          </div>
        )}

        {!isAuthenticated && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6 transition-colors duration-200">
            <p className="text-yellow-700 dark:text-yellow-400 transition-colors duration-200">
              Please log in to view and manage your photo albums.
            </p>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search albums..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors duration-200"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 transition-colors duration-200" />
          </div>

          <button
            onClick={handleAddAlbum}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <FaPlus className="mr-2" />
            New Album
          </button>
        </div>

        {activeAlbum ? (
          <div>
            <div className="flex items-center mb-6">
              <button
                onClick={() => setActiveAlbum(null)}
                className="mr-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
                ← Back to Albums
              </button>

              <h2 className="text-xl font-semibold flex-grow dark:text-white transition-colors duration-200">{activeAlbum.title}</h2>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditAlbum(activeAlbum)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDeleteAlbum(activeAlbum._id)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
                >
                  <FaTrash />
                </button>
                <button
                  onClick={handleAddPhoto}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
                >
                  <FaPlus className="mr-2" />
                  Add Photo
                </button>
              </div>
            </div>

            {activeAlbum.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors duration-200">{activeAlbum.description}</p>
            )}

            {activeAlbum.photos && activeAlbum.photos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeAlbum.photos.map(photo => (
                  <div
                    key={photo._id}
                    className="relative group overflow-hidden rounded-lg shadow-md dark:shadow-gray-900 transition-colors duration-200"
                  >
                    <div className="w-full h-48 overflow-hidden relative">
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Photo'}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Overlay with enlarge button */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-300">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Enlarge button clicked for photo:', photo);
                            handlePhotoClick(photo);
                          }}
                          className="bg-white text-gray-800 px-4 py-2 rounded-md font-medium opacity-0 group-hover:opacity-100 transform scale-95 group-hover:scale-100 transition-all duration-300 hover:bg-primary-500 hover:text-white"
                        >
                          Enlarge
                        </button>
                      </div>
                    </div>
                    
                    {/* Photo info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      {photo.caption && <p className="font-medium">{photo.caption}</p>}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm">{photo.date}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photo._id);
                          }}
                          className="text-white hover:text-red-300"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-200">
                <FaImage className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-300 transition-colors duration-200" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">No photos</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">Get started by adding a photo to this album.</p>
                <div className="mt-6">
                  <button
                    onClick={handleAddPhoto}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                    Add Photo
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {filteredAlbums.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredAlbums.map(album => (
                  <div
                    key={album._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200"
                  >
                    <div
                      className="h-40 bg-gray-200 dark:bg-gray-700 relative cursor-pointer transition-colors duration-200"
                      onClick={() => setActiveAlbum(album)}
                    >
                      {album.coverImage ? (
                        <img
                          src={album.coverImage}
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <FaFolder className="text-gray-400 dark:text-gray-500 text-5xl transition-colors duration-200" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium">View Album</span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <h3
                          className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                          onClick={() => setActiveAlbum(album)}
                        >
                          {album.title}
                        </h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAlbum(album);
                            }}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAlbum(album._id);
                            }}
                            className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{album.date}</p>

                      {album.description && (
                        <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm line-clamp-2">{album.description}</p>
                      )}

                      <div className="flex justify-between items-center mt-3 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          {album.photos?.length || 0} photos
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-200">
                <FaFolder className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-300 transition-colors duration-200" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">No albums</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">Get started by creating a new album.</p>
                <div className="mt-6">
                  <button
                    onClick={handleAddAlbum}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                    New Album
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-90 z-50" onClick={handleClosePhotoView}>
          <div className="relative max-w-4xl w-full mx-4" onClick={e => e.stopPropagation()}>
            {/* Close button */}
            <button 
              className="absolute -top-10 right-0 text-white text-3xl font-bold z-10"
              onClick={handleClosePhotoView}
            >
              &times;
            </button>
            
            {/* Photo */}
            <div className="bg-transparent rounded-lg overflow-hidden">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.caption || 'Photo'} 
                className="w-full object-contain max-h-[70vh]" 
              />
              
              {/* Caption */}
              {(selectedPhoto.caption || selectedPhoto.date) && (
                <div className="p-4 bg-black bg-opacity-50 text-white">
                  {selectedPhoto.caption && (
                    <h3 className="text-xl font-medium">{selectedPhoto.caption}</h3>
                  )}
                  {selectedPhoto.date && (
                    <p className="text-sm text-gray-300 mt-1">{selectedPhoto.date}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Album Modal */}
      {showAlbumModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowAlbumModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full transition-colors duration-200">
              <form onSubmit={handleAlbumSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 transition-colors duration-200">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 transition-colors duration-200">
                    {currentAlbum ? 'Edit Album' : 'Create New Album'}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Album Title</label>
                      <input
                        type="text"
                        id="title"
                        value={albumFormData.title}
                        onChange={(e) => setAlbumFormData({ ...albumFormData, title: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Description (optional)</label>
                      <textarea
                        id="description"
                        value={albumFormData.description}
                        onChange={(e) => setAlbumFormData({ ...albumFormData, description: e.target.value })}
                        rows="3"
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      ></textarea>
                    </div>

                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Date</label>
                      <input
                        type="date"
                        id="date"
                        value={albumFormData.date}
                        onChange={(e) => setAlbumFormData({ ...albumFormData, date: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse transition-colors duration-200">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {currentAlbum ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAlbumModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full transition-colors duration-200">
            <form onSubmit={handlePhotoSubmit}>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Add New Photo
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Photo</label>
                    <div
                      className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md cursor-pointer dark:bg-gray-700"
                      onClick={handleFileSelect}
                    >
                      <div className="space-y-1 text-center">
                        <FaImage className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-300" />
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                          <label className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-primary-600 hover:text-primary-500">
                            <span>Upload a file</span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="sr-only"
                              accept="image/*"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Caption (optional)</label>
                    <input
                      type="text"
                      id="caption"
                      value={photoFormData.caption}
                      onChange={(e) => setPhotoFormData({ ...photoFormData, caption: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="photoDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                    <input
                      type="date"
                      id="photoDate"
                      value={photoFormData.date}
                      onChange={(e) => setPhotoFormData({ ...photoFormData, date: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse transition-colors duration-200">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}