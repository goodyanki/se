import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import ItemDetail from './pages/ItemDetail';
import CreateListing from './pages/CreateListing';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import Chat from './pages/Chat';
import './index.css';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0072CE',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          borderRadius: 8,
        },
      }}
    >
      <AuthProvider>
        <Router>
          <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <div className="content" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8F9FA' }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/items/:id" element={<ItemDetail />} />
                <Route path="/create-listing" element={<CreateListing />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/verify" element={<VerifyEmail />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <footer style={{
              textAlign: 'center',
              padding: '2rem 1rem',
              color: '#6C757D',
              fontSize: '0.9rem',
              borderTop: '1px solid #E9ECEF',
              background: '#fff'
            }}>
              &copy; 2026 Web3 Campus Marketplace (Mock)
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
