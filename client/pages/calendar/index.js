import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, parseISO, isToday, isSameDay } from 'date-fns';
import { FaPlus, FaEdit, FaTrash, FaClock, FaMapMarkerAlt, FaUserFriends } from 'react-icons/fa';
import { apiCall } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const EVENT_CATEGORIES = [
  { value: 'personal', label: 'Personal', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
  { value: 'work', label: 'Work', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' },
  { value: 'health', label: 'Health', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' },
  { value: 'entertainment', label: 'Entertainment', color: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800' },
  { value: 'chores', label: 'Chores', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600' },
];

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const { darkMode } = useTheme();
  
  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (isAuthenticated) {
          setLoading(true);
          const data = await apiCall.getEvents();
          setEvents(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [isAuthenticated]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date(),
    endDate: new Date(),
    location: '',
    description: '',
    category: 'personal'
  });

  // Filter events for the selected date
  const eventsForSelectedDate = events.filter(event => 
    isSameDay(parseISO(event.date), selectedDate)
  );

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleAddEvent = () => {
    setCurrentEvent(null);
    const newDate = new Date(selectedDate);
    newDate.setHours(9, 0, 0, 0);
    
    const endDate = new Date(selectedDate);
    endDate.setHours(10, 0, 0, 0);
    
    setFormData({
      title: '',
      date: newDate,
      endDate: endDate,
      location: '',
      description: '',
      category: 'personal'
    });
    setShowModal(true);
  };

  const handleEditEvent = (event) => {
    setCurrentEvent(event);
    setFormData({
      title: event.title,
      date: parseISO(event.date),
      endDate: parseISO(event.endDate),
      location: event.location || '',
      description: event.description || '',
      category: event.category || 'personal'
    });
    setShowModal(true);
  };

  const handleDeleteEvent = async (id) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await apiCall.deleteEvent(id);
        setEvents(events.filter(event => event._id !== id));
      } catch (err) {
        console.error('Error deleting event:', err);
        alert('Failed to delete the event. Please try again.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    const [hours, minutes] = value.split(':').map(Number);
    
    if (name === 'startTime') {
      const newDate = new Date(formData.date);
      newDate.setHours(hours, minutes, 0, 0);
      setFormData({
        ...formData,
        date: newDate
      });
    } else if (name === 'endTime') {
      const newEndDate = new Date(formData.endDate);
      newEndDate.setHours(hours, minutes, 0, 0);
      setFormData({
        ...formData,
        endDate: newEndDate
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const eventData = {
        title: formData.title,
        date: formData.date.toISOString(),
        endDate: formData.endDate.toISOString(),
        location: formData.location,
        description: formData.description,
        category: formData.category
      };
      
      let updatedEvent;
      
      if (currentEvent) {
        // Update existing event
        updatedEvent = await apiCall.updateEvent(currentEvent._id, eventData);
        setEvents(events.map(event => 
          event._id === currentEvent._id ? updatedEvent : event
        ));
      } else {
        // Create new event
        updatedEvent = await apiCall.addEvent(eventData);
        setEvents([...events, updatedEvent]);
      }
      
      setShowModal(false);
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Failed to save the event. Please try again.');
    }
  };

  const getCategoryColor = (category) => {
    return EVENT_CATEGORIES.find(cat => cat.value === category)?.color || EVENT_CATEGORIES[5].color;
  };

  // Function to add custom content to calendar tiles
  const tileContent = ({ date, view }) => {
    // Only add content to month view
    if (view !== 'month') return null;
    
    // Find events for this date
    const eventsOnDate = events.filter(event => 
      isSameDay(parseISO(event.date), date)
    );
    
    if (eventsOnDate.length === 0) return null;
    
    // Group events by category
    const eventsByCategory = {};
    eventsOnDate.forEach(event => {
      const category = event.category || 'other';
      if (!eventsByCategory[category]) {
        eventsByCategory[category] = [];
      }
      eventsByCategory[category].push(event);
    });
    
    // Return dots representing event categories
    return (
      <div className="flex justify-center mt-1 space-x-1">
        {Object.keys(eventsByCategory).map((category, index) => (
          <div 
            key={index} 
            className="h-2 w-2 rounded-full"
            style={{ 
              backgroundColor: getCategoryColor(category).includes('bg-blue') ? '#3b82f6' : 
                              getCategoryColor(category).includes('bg-purple') ? '#8b5cf6' : 
                              getCategoryColor(category).includes('bg-green') ? '#10b981' : 
                              getCategoryColor(category).includes('bg-pink') ? '#ec4899' : 
                              getCategoryColor(category).includes('bg-yellow') ? '#f59e0b' : 
                              '#6b7280'
            }}
          ></div>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:space-x-8">
          {/* Calendar Section */}
          <div className="md:w-2/3 mb-8 md:mb-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors duration-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h2>
                <button 
                  onClick={handleAddEvent}
                  className="btn-primary flex items-center"
                  disabled={!isAuthenticated}
                >
                  <FaPlus className="mr-2" /> Add Event
                </button>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`calendar-container ${darkMode ? 'dark-calendar' : ''}`}>
                  <Calendar 
                    onChange={handleDateChange}
                    value={selectedDate}
                    tileContent={tileContent}
                    className="rounded-lg border-none shadow-sm w-full"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Events Section */}
          <div className="md:w-1/3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-full transition-colors duration-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {format(selectedDate, 'MMMM d, yyyy')}
                  {isToday(selectedDate) && <span className="ml-2 text-sm font-medium text-primary-600 dark:text-primary-400">(Today)</span>}
                </h2>
              </div>
              
              {!isAuthenticated ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">Please sign in to view and manage your events.</p>
                    </div>
                  </div>
                </div>
              ) : eventsForSelectedDate.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No events scheduled for this day.</p>
                  <button 
                    onClick={handleAddEvent}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/20 hover:bg-primary-200 dark:hover:bg-primary-900/30 transition-colors duration-200"
                  >
                    <FaPlus className="mr-2" /> Add Event
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {eventsForSelectedDate
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(event => (
                      <div 
                        key={event._id} 
                        className={`p-3 rounded-lg border ${getCategoryColor(event.category)} transition-colors duration-200`}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold">{event.title}</h3>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditEvent(event)}
                              className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              onClick={() => handleDeleteEvent(event._id)}
                              className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-sm">
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <FaClock className="mr-1" />
                            <span>{format(parseISO(event.date), 'h:mm a')} - {format(parseISO(event.endDate), 'h:mm a')}</span>
                          </div>
                          
                          {event.location && (
                            <div className="flex items-center mt-1 text-gray-600 dark:text-gray-400">
                              <FaMapMarkerAlt className="mr-1" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          
                          {event.description && (
                            <div className="mt-2 text-gray-700 dark:text-gray-300">
                              {event.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Add/Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full transition-colors duration-200">
              <form onSubmit={handleSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 transition-colors duration-200">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    {currentEvent ? 'Edit Event' : 'Add New Event'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Event Title</label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="input-field mt-1"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
                        <input
                          type="time"
                          id="startTime"
                          name="startTime"
                          value={format(formData.date, 'HH:mm')}
                          onChange={handleTimeChange}
                          className="input-field mt-1"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
                        <input
                          type="time"
                          id="endTime"
                          name="endTime"
                          value={format(formData.endDate, 'HH:mm')}
                          onChange={handleTimeChange}
                          className="input-field mt-1"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location (optional)</label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="input-field mt-1"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="input-field mt-1"
                      >
                        {EVENT_CATEGORIES.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className="input-field mt-1"
                      ></textarea>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse transition-colors duration-200">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                  >
                    {currentEvent ? 'Update' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
