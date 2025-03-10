import { observer } from 'mobx-react-lite';
import './App.css';
import { useState } from 'react';

// Import components
import TopNavBar from './components/layout/TopNavBar';
import LeftMenu from './components/layout/LeftMenu';
import MainContent from './components/layout/MainContent';
import InstructorPage from './components/InstructorPage';
import InstructorChatPage from './components/InstructorChatPage';
import FavoritesPage from './components/FavoritesPage';
import VideoPlayerPage from './components/VideoPlayerPage';
import PPTPlayerPage from './components/PPTPlayerPage';
import ExamPage from './components/ExamPage';
import QuestionPage from './components/QuestionPage';
import AccountPage from './components/AccountPage';
import LoginPage from './components/LoginPage';
import AuthRoute from './components/auth/AuthRoute';
import AuthWrapper from './components/auth/AuthWrapper';

// Log import for debugging
console.log('AccountPage imported:', AccountPage);

// Import stores to ensure they're initialized
import './stores/uiStore';
import coursesStore from './stores/coursesStore';
import examStore from './stores/examStore';
import videoPlayerStore from './stores/videoPlayerStore';
import userStore from './stores/userStore';
import './stores/instructorChatStore';

import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import uiStore from './stores/uiStore';
import db from './utils/db';

// Make coursesStore available globally for debugging and fallback
window.coursesStore = coursesStore;

// RouteHandler component to handle navigation based on active category
const RouteHandler = observer(() => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Check if we're on the account page or login page - if so, don't redirect
    if (location.pathname === '/account' || location.pathname === '/login') {
      console.log(`On ${location.pathname} page, skipping navigation control`);
      return;
    }
    
    // Handle navigation based on active category
    if (uiStore.activeCategory === '收藏' && location.pathname !== '/favorites') {
      navigate('/favorites');
    }
    else if (uiStore.activeCategory === '考测' && !location.pathname.startsWith('/exam')) {
      navigate('/exam');
    }
    else if (uiStore.activeCategory === '私教' &&
             !location.pathname.startsWith('/instructor')) {
      navigate('/instructor');
    }
    // Navigate to home if leaving a special category page
    else if (
      (uiStore.activeCategory !== '收藏' && location.pathname === '/favorites') ||
      (uiStore.activeCategory !== '考测' && location.pathname.startsWith('/exam')) ||
      (uiStore.activeCategory !== '私教' && location.pathname === '/instructor')
    ) {
      navigate('/');
    }
  }, [uiStore.activeCategory, location.pathname, navigate]);
  
  return null;
});

// MainLayout component to handle all the application content
const MainLayout = observer(() => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  // Check if we're on the account page
  const isAccountPage = location.pathname === '/account';
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Initialize course state effects
  useEffect(() => {
    // Fetch instructors
    db.getAllInstructors()
      .then(instructors => {
        console.log('Fetched instructors:', instructors);
        coursesStore.setInstructors(instructors || []);
      })
      .catch(error => {
        console.error('API request error:', error);
        coursesStore.setInstructors([]);
      });
    
    // Fetch courses
    db.getAllCourses()
      .then(courses => {
        console.log('Fetched courses:', courses);
        console.log('Number of courses:', courses?.length || 0);
        coursesStore.setCourses(courses || []);
      })
      .catch(error => {
        console.error('API request error:', error);
        coursesStore.setCourses([]);
      });
    
  }, []);
  
  return (
    <div className="flex flex-col h-screen bg-white">
      <TopNavBar onMenuToggle={toggleMobileMenu} />
      
      {/* Main content layout */}
      <div className="flex flex-1 overflow-y-auto">
        {/* For account page, we use a different layout without the left menu */}
        {isAccountPage ? (
          <div className="flex w-full justify-center items-center overflow-y-auto bg-gray-100">
            <Routes>
              <Route path="/account" element={
                <AuthRoute>
                  <AccountPage />
                </AuthRoute>
              } />
            </Routes>
          </div>
        ) : (
          <>
            {/* Mobile menu overlay */}
            {mobileMenuOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
            )}
            
            {/* Mobile menu - slides in from right on mobile, static on desktop */}
            <div
              className={`
                ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
                fixed top-0 right-0 z-30 h-full w-64 md:w-56 md:static md:translate-x-0
                transition-transform duration-300 ease-in-out
                md:flex-shrink-0 md:block md:left-0 md:right-auto
                pt-16 md:pt-0
              `}
            >
              <LeftMenu onItemClick={() => setMobileMenuOpen(false)} />
            </div>
            
            {/* Main content area - takes full width on mobile */}
            <div className="flex w-full overflow-y-auto">
              <Routes>
                {/* Public route */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected routes */}
                <Route path="/" element={
                  <AuthRoute>
                    <MainContent />
                  </AuthRoute>
                } />
                <Route path="/instructor" element={
                  <AuthRoute>
                    <InstructorPage />
                  </AuthRoute>
                } />
                <Route path="/instructor/:instructorId" element={
                  <AuthRoute>
                    <InstructorPage />
                  </AuthRoute>
                } />
                <Route path="/instructor/:instructorId/chat" element={
                  <AuthRoute>
                    <InstructorChatPage />
                  </AuthRoute>
                } />
                <Route path="/favorites" element={
                  <AuthRoute>
                    <FavoritesPage />
                  </AuthRoute>
                } />
                <Route path="/video/:courseId" element={
                  <AuthRoute>
                    <VideoPlayerPage />
                  </AuthRoute>
                } />
                <Route path="/ppt/:courseId" element={
                  <AuthRoute>
                    <PPTPlayerPage />
                  </AuthRoute>
                } />
                <Route path="/exam" element={
                  <AuthRoute>
                    <ExamPage />
                  </AuthRoute>
                } />
                <Route path="/exam/questions/:courseId" element={
                  <AuthRoute>
                    <QuestionPage />
                  </AuthRoute>
                } />
              </Routes>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

const App = observer(() => {
  return (
    <BrowserRouter>
      <AuthWrapper>
        <MainLayout />
        <RouteHandler />
      </AuthWrapper>
    </BrowserRouter>
  );
});

export default App;
