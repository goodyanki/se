import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Dropdown, Avatar, Space } from 'antd';
import { UserOutlined, LogoutOutlined, MessageOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

const { Header } = Layout;

const Navbar: React.FC = () => {
    const { user, isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const connectButtonStyle: React.CSSProperties = {
        // Custom styles for connect button
    };

    const userMenu = {
        items: [
            {
                key: 'profile',
                label: <Link to="/profile">My Profile</Link>,
                icon: <UserOutlined />,
            },
            {
                key: 'logout',
                label: 'Logout',
                icon: <LogoutOutlined />,
                onClick: handleLogout,
            },
        ]
    };

    return (
        <Header style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            padding: '10px 16px',
            height: 'auto',
            minHeight: '64px',
            flexWrap: 'wrap',
            lineHeight: 'normal'
        }}>
            <div className="logo" style={{ marginRight: 'auto' }}>
                <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0072CE' }}>
                    CampusMarket
                </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginRight: '25px' }}>
                <Link to="/" style={{ color: '#595959', fontWeight: 500 }}>Home</Link>
                <Link to="/create-listing" style={{ color: '#595959', fontWeight: 500 }}>Sell</Link>

                {isLoggedIn ? (
                    <>
                        <Link to="/chat" style={{ color: '#595959', fontSize: '1.2rem' }}>
                            <MessageOutlined />
                        </Link>
                        <Dropdown menu={userMenu} placement="bottomRight" arrow>
                            <Space style={{ cursor: 'pointer' }}>
                                <Avatar
                                    style={{ backgroundColor: '#0072CE' }}
                                    icon={<UserOutlined />}
                                >
                                    {user?.username?.charAt(0).toUpperCase()}
                                </Avatar>
                                <span style={{ color: '#595959' }}>{user?.username}</span>
                            </Space>
                        </Dropdown>
                    </>
                ) : (
                    <Button type="primary" onClick={() => navigate('/login')} style={connectButtonStyle}>
                        Connect Wallet
                    </Button>
                )}
            </div>
        </Header>
    );
};

export default Navbar;
