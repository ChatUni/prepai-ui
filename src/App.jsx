import { observer } from 'mobx-react-lite';
import './App.css';
import { useState } from 'react';
import languageStore from './stores/languageStore';

// Import components
import TopNavBar from './components/layout/TopNavBar';
import LeftMenu from './components/layout/LeftMenu';
import MainContent from './components/layout/MainContent';
import InstructorPage from './components/pages/instructor/InstructorPage';
import InstructorChatPage from './components/pages/instructor/InstructorChatPage';
import FavoritesPage from './components/FavoritesPage';
import VideoPlayerPage from './components/pages/course/VideoPlayerPage';
import PPTPlayerPage from './components/pages/course/PPTPlayerPage';
//import SeriesSettingsPage from './components/pages/series/SeriesSettingsPage';
import ExamPage from './components/ExamPage';
import QuestionPage from './components/pages/exam/QuestionPage';
import SeriesListPage from './components/pages/series/SeriesListPage';
import SeriesDetailPage from './components/pages/series/SeriesDetailPage';
import EditSeriesPage from './components/pages/series/EditSeriesPage';
import EditBannerPage from './components/pages/series/EditBannerPage';
import AddCoursePage from './components/pages/series/AddCoursePage';
import InstructorSelectPage from './components/pages/instructor/InstructorSelectPage';
import AssistantsPage from './components/pages/assistant/AssistantsPage';
import AssistantSelectPage from './components/pages/assistant/AssistantSelectPage';
import EditAssistantPage from './components/pages/assistant/EditAssistantPage';
import EditInstructorPage from './components/pages/instructor/EditInstructorPage';
import AssistantChatPage from './components/pages/assistant/AssistantChatPage';
import AccountPage from './components/pages/account/AccountPage';
import AdminPage from './components/pages/account/AdminPage';
import LoginPage from './components/pages/account/LoginPage';
import AuthRoute from './components/auth/AuthRoute';
import AuthWrapper from './components/auth/AuthWrapper';
// Import commented out for removal
// import ApiSwitcher from './components/ui/ApiSwitcher';

// Log import for debugging
console.log('AccountPage imported:', AccountPage);

// Import stores to ensure they're initialized
import './stores/uiStore';
import coursesStore from './stores/coursesStore';
import examStore from './stores/examStore';
import videoPlayerStore from './stores/videoPlayerStore';
import userStore from './stores/userStore';
import routeStore from './stores/routeStore';
import './stores/instructorChatStore';
import './stores/assistantsStore';
import './stores/instructorsStore';
import './stores/languageStore';
import './stores/seriesStore';
import './stores/clientStore';

import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import uiStore from './stores/uiStore';
import db from './utils/db';

// Make coursesStore available globally for debugging and fallback
window.coursesStore = coursesStore;

// RouteHandler component to sync route store with current location
const RouteHandler = observer(() => {
  const location = useLocation();
  
  // Sync route parameters with the store on location change
  useEffect(() => {
    routeStore.syncWithLocation(location);
  }, [location]);
  
  return null;
});

// MainLayout component to handle all the application content
const MainLayout = observer(() => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  // Check if we're on the account page
  const isSpecialLayoutPage = location.pathname === '/account' || location.pathname === '/admin';
  
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
        {/* For account and admin pages, we use a different layout without the left menu */}
        {isSpecialLayoutPage ? (
          <div className="flex w-full justify-center items-center overflow-y-auto bg-gray-100">
            <Routes>
              <Route path="/account" element={
                <AuthRoute>
                  <AccountPage />
                </AuthRoute>
              } />
              <Route path="/admin" element={
                <AuthRoute>
                  <AdminPage />
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
            <div className="flex flex-col flex-grow w-full mb-12 overflow-y-auto">
              <Routes>
                {/* Public route */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected routes */}
                <Route path="/" element={
                  <AuthRoute>
                    <SeriesListPage />
                  </AuthRoute>
                } />
                <Route path="/series" element={
                  <AuthRoute>
                    <SeriesListPage />
                  </AuthRoute>
                } />
                <Route path="/series/select" element={
                  <AuthRoute>
                    <SeriesListPage />
                  </AuthRoute>
                } />
                <Route path="/series/:id" element={
                  <AuthRoute>
                    <SeriesDetailPage />
                  </AuthRoute>
                } />
                <Route path="/series/settings" element={
                  <AuthRoute>
                    <SeriesListPage />
                  </AuthRoute>
                } />
                <Route path="/series/new" element={
                  <AuthRoute>
                    <EditSeriesPage />
                  </AuthRoute>
                } />
                <Route path="/series/:id/edit" element={
                  <AuthRoute>
                    <EditSeriesPage />
                  </AuthRoute>
                } />
                <Route path="/series/banners" element={
                  <AuthRoute>
                    <EditBannerPage />
                  </AuthRoute>
                } />
                <Route path="/series/:id/course" element={
                  <AuthRoute>
                    <AddCoursePage />
                  </AuthRoute>
                } />
                <Route path="/instructors" element={
                  <AuthRoute>
                    <InstructorPage />
                  </AuthRoute>
                } />
                <Route path="/instructors/new" element={
                  <AuthRoute>
                    <EditInstructorPage />
                  </AuthRoute>
                } />
                <Route path="/instructors/select" element={
                  <AuthRoute>
                    <InstructorSelectPage />
                  </AuthRoute>
                } />
                <Route path="/instructors/:id/edit" element={
                  <AuthRoute>
                    <EditInstructorPage />
                  </AuthRoute>
                } />
                <Route path="/instructor/:id/chat" element={
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
                    <SeriesListPage />
                  </AuthRoute>
                } />
                <Route path="/exam/questions/:courseId" element={
                  <AuthRoute>
                    <QuestionPage />
                  </AuthRoute>
                } />
                <Route path="/assistants/select" element={
                  <AuthRoute>
                    <AssistantSelectPage />
                  </AuthRoute>
                } />
                <Route path="/assistants" element={
                  <AuthRoute>
                    <AssistantsPage />
                  </AuthRoute>
                } />
                <Route path="/assistants/add" element={
                  <AuthRoute>
                    <EditAssistantPage />
                  </AuthRoute>
                } />
                <Route path="/assistants/:id/edit" element={
                  <AuthRoute>
                    <EditAssistantPage />
                  </AuthRoute>
                } />
                <Route path="/assistants/:assistantId/chat" element={
                  <AuthRoute>
                    <AssistantChatPage />
                  </AuthRoute>
                } />
              </Routes>
            </div>
          </>
        )}
      </div>
      
      {/* API Tools removed */}
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
