import { observer } from 'mobx-react-lite';
import './App.css';

// Import components
import TopNavBar from './components/layout/TopNavBar';
import LeftMenu from './components/layout/LeftMenu';
import MainContent from './components/layout/MainContent';
import InstructorPage from './components/InstructorPage';
import FavoritesPage from './components/FavoritesPage';
import VideoPlayerPage from './components/VideoPlayerPage';
import PPTPlayerPage from './components/PPTPlayerPage';
import ExamPage from './components/ExamPage';
import QuestionPage from './components/QuestionPage';

// Import stores to ensure they're initialized
import './stores/uiStore';
import coursesStore from './stores/coursesStore';
import './stores/examStore';

import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import uiStore from './stores/uiStore';

// Make coursesStore available globally for debugging and fallback
window.coursesStore = coursesStore;

// RouteHandler component to handle navigation based on active category
const RouteHandler = observer(() => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Handle navigation based on active category
    if (uiStore.activeCategory === '收藏' && location.pathname !== '/favorites') {
      navigate('/favorites');
    }
    else if (uiStore.activeCategory === '考测' && !location.pathname.startsWith('/exam')) {
      navigate('/exam');
    }
    // Navigate to home if leaving a special category page
    else if (
      (uiStore.activeCategory !== '收藏' && location.pathname === '/favorites') ||
      (uiStore.activeCategory !== '考测' && location.pathname.startsWith('/exam'))
    ) {
      navigate('/');
    }
  }, [uiStore.activeCategory, location.pathname, navigate]);
  
  return null;
});

const App = observer(() => {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen bg-white">
        <TopNavBar />
        <div className="flex flex-1 overflow-hidden">
          <LeftMenu />
          <Routes>
            <Route path="/" element={<MainContent />} />
            <Route path="/instructor/:instructorId" element={<InstructorPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/video/:courseId" element={<VideoPlayerPage />} />
            <Route path="/ppt/:courseId" element={<PPTPlayerPage />} />
            <Route path="/exam" element={<ExamPage />} />
            <Route path="/exam/questions/:courseId" element={<QuestionPage />} />
          </Routes>
        </div>
      </div>
      <RouteHandler />
    </BrowserRouter>
  );
});

export default App;
