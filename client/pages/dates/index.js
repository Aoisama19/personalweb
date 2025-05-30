import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { FaPlus, FaEdit, FaTrash, FaBell } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, differenceInDays, isBefore, addYears } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext'; // Import useTheme
import { apiCall } from '../../utils/api';

// Category definitions for important dates
const CATEGORIES = [
  { value: 'birthday', label: 'Birthday', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'anniversary', label: 'Anniversary', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { value: 'bill', label: 'Bill Payment', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'event', label: 'Special Event', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800 border-gray-200' },
];

export default function Dates() {
  const { isAuthenticated, user } = useAuth();
  const { darkMode } = useTheme(); // Use darkMode from context
  const [dates, setDates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date(),
    category: 'event',
    recurring: false,
    notes: ''
  });

  // Fetch dates from API when component mounts
  useEffect(() => {
    const fetchDates = async () => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        const data = await apiCall.getDates();
        // Convert string dates to Date objects
        const formattedDates = data.map(date => ({
          ...date,
          date: new Date(date.date)
        }));
        setDates(formattedDates);
      } catch (err) {
        console.error('Error fetching dates:', err);
        setError('Failed to load your important dates. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDates();
  }, [isAuthenticated]);

  // Calculate upcoming dates, accounting for recurring events
  const getUpcomingDates = () => {
    const today = new Date();
    const upcomingDates = dates.map(date => {
      let nextOccurrence = new Date(date.date);

      // If it's a recurring event (like birthday or anniversary)
      if (date.recurring) {
        // If this year's occurrence has already passed, show next year's
        while (isBefore(nextOccurrence, today)) {
          nextOccurrence = addYears(nextOccurrence, 1);
        }
      }

      const daysRemaining = differenceInDays(nextOccurrence, today);

      return {
        ...date,
        nextOccurrence,
        daysRemaining
      };
    });

    // Sort by days remaining
    return upcomingDates.sort((a, b) => a.daysRemaining - b.daysRemaining);
  };

  const upcomingDates = getUpcomingDates();

  const handleAddDate = () => {
    setCurrentDate(null);
    setFormData({
      title: '',
      date: new Date(),
      category: 'event',
      recurring: false,
      notes: ''
    });
    setShowModal(true);
  };

  const handleEditDate = (date) => {
    setCurrentDate(date);
    setFormData({
      title: date.title,
      date: new Date(date.date),
      category: date.category,
      recurring: date.recurring,
      notes: date.notes || ''
    });
    setShowModal(true);
  };

  const handleDeleteDate = async (id) => {
    if (confirm('Are you sure you want to delete this date?')) {
      try {
        await apiCall.deleteDate(id);
        setDates(dates.filter(date => date._id !== id));
      } catch (err) {
        console.error('Error deleting date:', err);
        alert('Failed to delete the date. Please try again.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      date
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (currentDate) {
        // Update existing date
        const updatedDate = await apiCall.updateDate(currentDate._id, formData);
        setDates(dates.map(date =>
          date._id === currentDate._id
            ? { ...updatedDate, date: new Date(updatedDate.date) }
            : date
        ));
      } else {
        // Add new date
        const newDate = await apiCall.addDate(formData);
        setDates([...dates, { ...newDate, date: new Date(newDate.date) }]);
      }

      setShowModal(false);
    } catch (err) {
      console.error('Error saving date:', err);
      alert('Failed to save the date. Please try again.');
    }
  };

  const getCategoryColor = (category) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.color : CATEGORIES[4].color; // Default to 'other' if not found
  };

  const getCategoryLabel = (category) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : CATEGORIES[4].label; // Default to 'other' if not found
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Important Dates</h1>
          <button
            onClick={handleAddDate}
            className="btn-primary flex items-center"
            disabled={!isAuthenticated}
          >
            <FaPlus className="mr-2" /> Add Date
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 transition-colors duration-200">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-400 transition-colors duration-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : !isAuthenticated ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-6 transition-colors duration-200">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-400 transition-colors duration-200">Please sign in to view and manage your important dates.</p>
              </div>
            </div>
          </div>
        ) : dates.length === 0 ? (
          <div className="text-center py-12 dark:bg-gray-700 transition-colors duration-200">
            <p className="text-gray-500 dark:text-gray-400 transition-colors duration-200">You don't have any important dates yet. Click "Add Date" to create one.</p>
          </div>
        ) : (
          <div>
            {/* Upcoming dates section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 transition-colors duration-200">
              <h2 className="text-xl font-semibold mb-4 dark:text-white transition-colors duration-200">Upcoming Dates</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingDates.map(date => (
                  <div key={date._id} className="card overflow-hidden dark:bg-gray-900 dark:border-gray-700 transition-colors duration-200">
                    <div className={`px-4 py-2 ${getCategoryColor(date.category)}`}>
                      <span className="font-medium">{getCategoryLabel(date.category)}</span>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-semibold mb-2 dark:text-white transition-colors duration-200">{date.title}</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditDate(date)}
                            className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors duration-200"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteDate(date._id)}
                            className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors duration-200"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-3 dark:text-gray-300 transition-colors duration-200">
                        {format(date.nextOccurrence, 'MMMM d, yyyy')}
                        {date.recurring && ' (recurring)'}
                      </p>

                      <div className="flex items-center mt-4">
                        <FaBell className="text-primary-600 mr-2" />
                        <span className="text-sm font-medium dark:text-gray-400 transition-colors duration-200">
                          {date.daysRemaining === 0
                            ? 'Today!'
                            : date.daysRemaining === 1
                              ? 'Tomorrow!'
                              : `${date.daysRemaining} days away`}
                        </span>
                      </div>

                      {date.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
                          <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">{date.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* All dates section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold mb-4 dark:text-white transition-colors duration-200">All Important Dates</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
                  <thead className="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 transition-colors duration-200">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 transition-colors duration-200">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 transition-colors duration-200">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 transition-colors duration-200">Recurring</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 transition-colors duration-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700 transition-colors duration-200">
                    {dates.map((date) => (
                      <tr key={date._id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white transition-colors duration-200">{date.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${getCategoryColor(date.category)}`}>
                            {getCategoryLabel(date.category)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 transition-colors duration-200">
                          {format(new Date(date.date), 'MMMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 transition-colors duration-200">
                          {date.recurring ? 'Yes' : 'No'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditDate(date)}
                              className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 transition-colors duration-200"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteDate(date._id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors duration-200"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Date Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 transition-colors duration-200"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full transition-colors duration-200">
              <form onSubmit={handleSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 transition-colors duration-200">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 transition-colors duration-200">
                    {currentDate ? 'Edit Important Date' : 'Add New Important Date'}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Title</label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="input-field mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 transition-colors duration-200"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Date</label>
                      <DatePicker
                        selected={formData.date}
                        onChange={handleDateChange}
                        className="input-field mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 transition-colors duration-200"
                        dateFormat="MMMM d, yyyy"
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Category</label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="input-field mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 transition-colors duration-200"
                      >
                        {CATEGORIES.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="recurring"
                        name="recurring"
                        checked={formData.recurring}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 transition-colors duration-200"
                      />
                      <label htmlFor="recurring" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 transition-colors duration-200">
                        Recurring yearly (for birthdays, anniversaries, etc.)
                      </label>
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Notes (optional)</label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="3"
                        className="input-field mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 transition-colors duration-200"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse transition-colors duration-200">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                    disabled={!isAuthenticated}
                  >
                    {currentDate ? 'Update' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-900 transition-colors duration-200"
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