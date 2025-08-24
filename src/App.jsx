import { observer } from 'mobx-react-lite';
import './App.css';
import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import languageStore from './stores/languageStore';

// Import components
import TopNavBar from './components/layout/TopNavBar';
import LeftMenu from './components/layout/LeftMenu';
import MainContent from './components/layout/MainContent';
import InstructorChatPage from './components/pages/instructor/InstructorChatPage';
import FavoritesPage from './components/FavoritesPage';
import VideoPlayerPage from './components/pages/course/VideoPlayerPage';
import PPTPlayerPage from './components/pages/course/PPTPlayerPage';
//import SeriesSettingsPage from './components/pages/series/SeriesSettingsPage';
import ExamPage from './components/pages/exam/ExamPage';
import QuestionPage from './components/pages/exam/QuestionPage';
import SeriesListPage from './components/pages/series/SeriesListPage';
import SeriesDetailPage from './components/pages/series/SeriesDetailPage';
import EditSeriesPage from './components/pages/series/EditSeriesPage';
import EditBannerPage from './components/pages/account/EditBannerPage';
import EditCoursePage from './components/pages/series/EditCoursePage';
import AssistantPage from './components/pages/assistant/AssistantPage';
import EditAssistantPage from './components/pages/assistant/EditAssistantPage';
import EditInstructorPage from './components/pages/instructor/EditInstructorPage';
import AssistantChatPage from './components/pages/assistant/AssistantChatPage';
import AccountPage from './components/pages/account/AccountPage';
import MyAccountPage from './components/pages/account/MyAccountPage';
import AdminPage from './components/pages/account/AdminPage';
import LoginPage from './components/pages/account/LoginPage';
import MembershipListPage from './components/pages/membership/MembershipListPage';
import AuthRoute from './components/auth/AuthRoute';
import AuthWrapper from './components/auth/AuthWrapper';

// Import stores to ensure they're initialized
import './stores/uiStore';
import seriesStore from './stores/seriesStore';
import examStore from './stores/questionStore';
import videoPlayerStore from './stores/videoPlayerStore';
import userStore from './stores/userStore';
import routeStore from './stores/routeStore';
import './stores/instructorChatStore';
import './stores/assistantStore';
import './stores/instructorStore';
import './stores/languageStore';
import './stores/seriesStore';
import './stores/clientStore';

import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import uiStore from './stores/uiStore';
import db from './utils/db';
import clientStore from './stores/clientStore';
import EditClientPage from './components/pages/client/EditClientPage';
import AboutPage from './components/pages/client/AboutPage';
import UserListPage from './components/pages/account/UserListPage';
import Upgrade from './components/pages/membership/Upgrade';

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
            
            {/* Mobile menu - slides in from right on mobile only, hidden on desktop */}
            <div
              className={`
                ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
                fixed top-0 right-0 z-30 h-full w-64 md:hidden
                transition-transform duration-300 ease-in-out
                pt-16
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
                <Route path="/series/paid" element={
                  <AuthRoute>
                    <SeriesListPage />
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
                <Route path="/video/:seriesId/:courseId" element={
                  <AuthRoute>
                    <VideoPlayerPage />
                  </AuthRoute>
                } />
                <Route path="/ppt/:seriesId/:courseId" element={
                  <AuthRoute>
                    <PPTPlayerPage />
                  </AuthRoute>
                } />
                <Route path="/exams" element={
                  <AuthRoute>
                    <ExamPage />
                  </AuthRoute>
                } />
                <Route path="/exams/settings" element={
                  <AuthRoute>
                    <ExamPage />
                  </AuthRoute>
                } />
                <Route path="/exams/:id" element={
                  <AuthRoute>
                    <QuestionPage />
                  </AuthRoute>
                } />
                <Route path="/assistants" element={
                  <AuthRoute>
                    <AssistantPage />
                  </AuthRoute>
                } />
                <Route path="/assistants/user" element={
                  <AuthRoute>
                    <AssistantPage />
                  </AuthRoute>
                } />
                <Route path="/assistants/settings" element={
                  <AuthRoute>
                    <AssistantPage />
                  </AuthRoute>
                } />
                <Route path="/assistants/:assistantId/chat" element={
                  <AuthRoute>
                    <AssistantChatPage />
                  </AuthRoute>
                } />
                <Route path="/memberships" element={
                  <AuthRoute>
                    <MembershipListPage />
                  </AuthRoute>
                } />
                <Route path="/memberships/settings" element={
                  <AuthRoute>
                    <MembershipListPage />
                  </AuthRoute>
                } />
                <Route path="/memberships/upgrade" element={
                  <AuthRoute>
                    <Upgrade />
                  </AuthRoute>
                } />
                <Route path="/settings/banners" element={
                  <AuthRoute>
                    <EditBannerPage />
                  </AuthRoute>
                } />
                <Route path="/client/settings" element={
                  <AuthRoute>
                    <EditClientPage />
                  </AuthRoute>
                } />
                <Route path="/client/advanced-settings" element={
                  <AuthRoute>
                    <EditClientPage mode="advanced" />
                  </AuthRoute>
                } />
                <Route path="/users/settings" element={
                  <AuthRoute>
                    <UserListPage />
                  </AuthRoute>
                } />
                <Route path="/my_account" element={
                  <AuthRoute>
                    <MyAccountPage />
                  </AuthRoute>
                } />
                <Route path="/about" element={
                  <AuthRoute>
                    <AboutPage />
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
        <DndProvider backend={HTML5Backend}>
          <MainLayout />
          <RouteHandler />
        </DndProvider>
      </AuthWrapper>
    </BrowserRouter>
  );
});

export default App;
