import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaRegCircle, FaEllipsisH, FaList } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { directApiCall } from '../../utils/direct-api';

// List of available icons
const ICONS = ['📝', '🛒', '🏠', '🎉', '💼', '🍽️', '🧹', '📚', '🎯', '🎁', '🚗', '💰', '🏋️', '🧘', '🎮', '🔧'];

export default function TodosPage() {
  const { isAuthenticated, user } = useAuth();
  const { darkMode } = useTheme();
  const [lists, setLists] = useState([]);
  const [activeList, setActiveList] = useState(null);
  const [showListModal, setShowListModal] = useState(false);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [currentList, setCurrentList] = useState(null);
  const [currentTodo, setCurrentTodo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listFormData, setListFormData] = useState({
    title: '',
    icon: '📝'
  });
  const [todoFormData, setTodoFormData] = useState({
    text: ''
  });
  
  // Fetch todo lists from API when component mounts
  useEffect(() => {
    const fetchTodoLists = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const data = await directApiCall.getTodoLists();
        setLists(data);
        if (data.length > 0) {
          setActiveList(data[0]);
        }
      } catch (err) {
        console.error('Error fetching todo lists:', err);
        setError('Failed to load your todo lists. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTodoLists();
  }, [isAuthenticated]);

  const handleAddList = () => {
    setCurrentList(null);
    setListFormData({
      title: '',
      icon: '📝'
    });
    setShowListModal(true);
  };

  const handleEditList = (list) => {
    setCurrentList(list);
    setListFormData({
      title: list.title,
      icon: list.icon
    });
    setShowListModal(true);
  };

  const handleDeleteList = async (id) => {
    if (confirm('Are you sure you want to delete this list?')) {
      try {
        await directApiCall.deleteTodoList(id);
        const newLists = lists.filter(list => list._id !== id);
        setLists(newLists);
        
        // If the active list is deleted, set the first list as active
        if (activeList._id === id && newLists.length > 0) {
          setActiveList(newLists[0]);
        } else if (newLists.length === 0) {
          setActiveList(null);
        }
      } catch (err) {
        console.error('Error deleting list:', err);
        alert('Failed to delete the list. Please try again.');
      }
    }
  };

  const handleListSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (currentList) {
        // Update existing list
        const updatedList = await directApiCall.updateTodoList(currentList._id, {
          title: listFormData.title,
          icon: listFormData.icon
        });
        
        const updatedLists = lists.map(list => 
          list._id === currentList._id ? updatedList : list
        );
        setLists(updatedLists);
        
        // Update active list if it's the one being edited
        if (activeList._id === currentList._id) {
          setActiveList(updatedList);
        }
      } else {
        // Add new list
        const newList = await directApiCall.addTodoList({
          title: listFormData.title,
          icon: listFormData.icon
        });
        
        const updatedLists = [...lists, newList];
        setLists(updatedLists);
        
        // If this is the first list, set it as active
        if (updatedLists.length === 1) {
          setActiveList(newList);
        }
      }
      
      setShowListModal(false);
    } catch (err) {
      console.error('Error saving list:', err);
      alert('Failed to save the list. Please try again.');
    }
  };

  const handleAddTodo = () => {
    setCurrentTodo(null);
    setTodoFormData({
      text: ''
    });
    setShowTodoModal(true);
  };

  const handleEditTodo = (todo) => {
    setCurrentTodo(todo);
    setTodoFormData({
      text: todo.text
    });
    setShowTodoModal(true);
  };

  const handleDeleteTodo = async (id) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        // This returns the updated list without the deleted todo
        const updatedList = await directApiCall.deleteTodo(activeList._id, id);
        
        // Update the active list with the response from the API
        setActiveList(updatedList);
        
        // Also update the list in the lists array
        const updatedLists = lists.map(list => 
          list._id === activeList._id ? updatedList : list
        );
        setLists(updatedLists);
      } catch (err) {
        console.error('Error deleting todo:', err);
        alert('Failed to delete the task. Please try again.');
      }
    }
  };

  const handleTodoSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (currentTodo) {
        // Update existing todo
        const updatedTodo = await directApiCall.updateTodo(
          activeList._id, 
          currentTodo._id, 
          { text: todoFormData.text }
        );
        
        // Update the active list with the updated todo
        const updatedTodos = activeList.todos.map(todo => 
          todo._id === currentTodo._id ? updatedTodo : todo
        );
        const updatedList = { ...activeList, todos: updatedTodos };
        setActiveList(updatedList);
        
        // Also update the list in the lists array
        const updatedLists = lists.map(list => 
          list._id === activeList._id ? updatedList : list
        );
        setLists(updatedLists);
      } else {
        // Add new todo
        const updatedList = await directApiCall.addTodo(
          activeList._id, 
          { text: todoFormData.text }
        );
        
        // Update the active list with the returned list that includes the new todo
        setActiveList(updatedList);
        
        // Also update the list in the lists array
        const updatedLists = lists.map(list => 
          list._id === activeList._id ? updatedList : list
        );
        setLists(updatedLists);
      }
      
      setShowTodoModal(false);
    } catch (err) {
      console.error('Error saving todo:', err);
      alert('Failed to save the task. Please try again.');
    }
  };

  const toggleTodoStatus = async (id) => {
    try {
      // Find the todo in the active list
      const todoIndex = activeList.todos.findIndex(todo => todo._id === id);
      
      if (todoIndex === -1) {
        console.error('Todo not found');
        return;
      }
      
      // Toggle completed status
      const newStatus = !activeList.todos[todoIndex].completed;
      
      // Update todo in API - this returns the full updated list
      const updatedList = await directApiCall.updateTodo(
        activeList._id,
        id,
        { completed: newStatus }
      );
      
      // Update the active list with the response from the API
      setActiveList(updatedList);
      
      // Also update the list in the lists array
      const updatedLists = lists.map(list => 
        list._id === activeList._id ? updatedList : list
      );
      setLists(updatedLists);
    } catch (err) {
      console.error('Error toggling todo status:', err);
      alert('Failed to update the task status. Please try again.');
    }
  };

  const getCompletedCount = (list) => {
    return list.todos ? list.todos.filter(todo => todo.completed).length : 0;
  };
  
  const getTotalCount = (list) => {
    return list.todos ? list.todos.length : 0;
  };

  return (
    <Layout>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-md p-4 hidden md:block transition-colors duration-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold dark:text-white">My Lists</h2>
            <button 
              onClick={handleAddList}
              className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors duration-200"
              title="Add new list"
            >
              <FaPlus />
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 dark:text-red-400 text-center py-4">{error}</div>
          ) : (
            <ul className="space-y-2">
              {lists.map(list => (
                <li key={list._id}>
                  <button
                    onClick={() => setActiveList(list)}
                    className={`w-full flex items-center justify-between p-2 rounded-md transition-colors duration-200 ${
                      activeList?._id === list._id 
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">{list.icon}</span>
                      <span className="truncate">{list.title}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {getCompletedCount(list)}/{getTotalCount(list)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Mobile List Selector */}
        <div className="md:hidden p-4 bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
          <div className="flex justify-between items-center">
            <div className="relative w-full">
              <select
                value={activeList?._id || ''}
                onChange={(e) => {
                  const selected = lists.find(list => list._id === e.target.value);
                  setActiveList(selected);
                }}
                className="block appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-3 pr-10 text-base dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                disabled={lists.length === 0}
              >
                {lists.length === 0 ? (
                  <option value="">No lists available</option>
                ) : (
                  lists.map(list => (
                    <option key={list._id} value={list._id}>
                      {list.icon} {list.title}
                    </option>
                  ))
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <button 
              onClick={handleAddList}
              className="ml-2 p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors duration-200"
              title="Add new list"
            >
              <FaPlus />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
            </div>
          ) : !isAuthenticated ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">Please sign in to view and manage your to-do lists.</p>
                </div>
              </div>
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">You don't have any to-do lists yet. Click "New List" to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {/* Active List */}
              {activeList ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">{activeList.icon}</span>
                      <h2 className="text-2xl font-semibold dark:text-white">{activeList.title}</h2>
                      <div className="ml-4 flex space-x-2">
                        <button 
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                          onClick={() => handleEditList(activeList)}
                          disabled={!isAuthenticated}
                          title="Edit List"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                          onClick={() => handleDeleteList(activeList._id)}
                          disabled={!isAuthenticated}
                          title="Delete List"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={handleAddTodo}
                      className="btn-primary flex items-center"
                      disabled={!isAuthenticated}
                    >
                      <FaPlus className="mr-2" /> Add Task
                    </button>
                  </div>
                  
                  {activeList.todos && activeList.todos.length === 0 ? (
                    <div className="text-center py-8">
                      <FaList className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                      <p className="mt-4 text-gray-500 dark:text-gray-400">No tasks in this list yet.</p>
                      <button 
                        onClick={handleAddTodo}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/20 hover:bg-primary-200 dark:hover:bg-primary-900/30 transition-colors duration-200"
                        disabled={!isAuthenticated}
                      >
                        <FaPlus className="mr-2" /> Add your first task
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Incomplete todos first */}
                      {activeList.todos && activeList.todos
                        .filter(todo => !todo.completed)
                        .map(todo => (
                          <div 
                            key={todo._id} 
                            className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 dark:text-white"
                          >
                            <div className="flex items-center">
                              <button 
                                className="p-1 mr-3 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                                onClick={() => toggleTodoStatus(todo._id)}
                                disabled={!isAuthenticated}
                              >
                                <FaRegCircle />
                              </button>
                              <span>{todo.text}</span>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                                onClick={() => handleEditTodo(todo)}
                                disabled={!isAuthenticated}
                              >
                                <FaEdit />
                              </button>
                              <button 
                                className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                                onClick={() => handleDeleteTodo(todo._id)}
                                disabled={!isAuthenticated}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        ))}
                      
                      {/* Completed todos */}
                      {activeList.todos && activeList.todos.filter(todo => todo.completed).length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Completed</h3>
                          <div className="space-y-2">
                            {activeList.todos
                              .filter(todo => todo.completed)
                              .map(todo => (
                                <div 
                                  key={todo._id} 
                                  className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 transition-colors duration-200"
                                >
                                  <div className="flex items-center">
                                    <button 
                                      className="p-1 mr-3 text-primary-600 dark:text-primary-400"
                                      onClick={() => toggleTodoStatus(todo._id)}
                                      disabled={!isAuthenticated}
                                    >
                                      <FaCheck />
                                    </button>
                                    <span className="line-through">{todo.text}</span>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button 
                                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                                      onClick={() => handleEditTodo(todo)}
                                      disabled={!isAuthenticated}
                                    >
                                      <FaEdit />
                                    </button>
                                    <button 
                                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                                      onClick={() => handleDeleteTodo(todo._id)}
                                      disabled={!isAuthenticated}
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">Select a list to view tasks.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit List Modal */}
      {showListModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowListModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full transition-colors duration-200">
              <form onSubmit={handleListSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 transition-colors duration-200">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    {currentList ? 'Edit List' : 'Create New List'}
                  </h3>
                  
                  <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">List Name</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={listFormData.title}
                      onChange={(e) => setListFormData({ ...listFormData, title: e.target.value })}
                      className="input-field mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                    <div className="grid grid-cols-8 gap-2">
                      {ICONS.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setListFormData({ ...listFormData, icon })}
                          className={`h-10 w-10 flex items-center justify-center text-xl rounded-md ${
                            listFormData.icon === icon 
                              ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500 dark:border-primary-400' 
                              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                          } transition-colors duration-200`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse transition-colors duration-200">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                    disabled={!isAuthenticated}
                  >
                    {currentList ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowListModal(false)}
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

      {/* Add/Edit Todo Modal */}
      {showTodoModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowTodoModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full transition-colors duration-200">
              <form onSubmit={handleTodoSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 transition-colors duration-200">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    {currentTodo ? 'Edit Task' : 'Add New Task'}
                  </h3>
                  
                  <div>
                    <label htmlFor="text" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task</label>
                    <input
                      type="text"
                      id="text"
                      name="text"
                      value={todoFormData.text}
                      onChange={(e) => setTodoFormData({ ...todoFormData, text: e.target.value })}
                      className="input-field mt-1"
                      required
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse transition-colors duration-200">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
                    disabled={!isAuthenticated}
                  >
                    {currentTodo ? 'Update' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTodoModal(false)}
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
