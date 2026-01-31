import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, message, Button } from 'antd';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

const Login: React.FC = () => {
    const { isLoggedIn, user, isWalletConnected, isLoading, debugLog, login } = useAuth();
    const navigate = useNavigate();

    /* 
    // Removed auto-redirect to support manual verification flow check
    useEffect(() => {
        if (isLoggedIn && user) {
            if (user.isVerified) {
                navigate('/');
            } else {
                message.warning("Please verify your email to continue.");
                navigate('/verify');
            }
        }
    }, [isLoggedIn, user, navigate]);
    */

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Card style={{ width: '100%', maxWidth: '450px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <Title level={2} style={{ color: '#0072CE', margin: 0 }}>Welcome Back</Title>
                    <Text type="secondary">Sign in to CampusMarket</Text>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <Paragraph style={{ textAlign: 'center' }}>
                        Connect your wallet to access the marketplace.
                    </Paragraph>

                    <div style={{ transform: 'scale(1.1)' }}>
                        <ConnectButton
                            label="Connect Wallet"
                            accountStatus="address"
                            chainStatus="icon"
                            showBalance={false}
                        />
                    </div>

                    {/* State Debug Info (Temporary) */}
                    <div style={{ fontSize: '10px', color: '#ccc', marginTop: '10px' }}>
                        Connected: {isWalletConnected ? 'Yes' : 'No'} |
                        LoggedIn: {isLoggedIn ? 'Yes' : 'No'} |
                        User: {user ? 'Yes' : 'No'} |
                        Loading: {isLoading ? 'Yes' : 'No'}
                    </div>

                    {isWalletConnected && !isLoggedIn && !isLoading && (
                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => login()}
                                style={{ marginTop: '10px' }}
                            >
                                Check Status
                            </Button>

                            {/* Optional error hint if needed */}
                            {/* 
                            <div style={{ marginTop: '1rem', color: '#ff4d4f' }}>
                                <Paragraph type="danger">
                                    Wallet connected. Click "Check Status" to login.
                                </Paragraph>
                            </div>
                             */}
                        </div>
                    )}

                    {/* New Logic: Show buttons based on verification status after login */}
                    {isLoggedIn && user && (
                        <div style={{ marginTop: '20px', width: '100%', textAlign: 'center' }}>
                            <div style={{ marginBottom: '10px' }}>
                                <Text strong>Authentication Status:</Text>
                            </div>

                            {user.isVerified ? (
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    disabled
                                    style={{
                                        backgroundColor: '#52c41a',
                                        borderColor: '#52c41a',
                                        color: 'white',
                                        cursor: 'not-allowed'
                                    }}
                                >
                                    Verified
                                </Button>
                            ) : (
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    danger
                                    onClick={() => navigate('/verify')}
                                >
                                    Verify Email
                                </Button>
                            )}
                        </div>
                    )}

                    {isLoading && (
                        <div style={{ marginTop: '1rem' }}>Logging in...</div>
                    )}

                    {/* Debug Log Section */}
                    <div style={{ marginTop: '20px', width: '100%', textAlign: 'left' }}>
                        <details>
                            <summary style={{ cursor: 'pointer', color: '#888' }}>Show Debug Logs</summary>
                            <pre style={{
                                background: '#f5f5f5',
                                padding: '10px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                overflowX: 'auto',
                                marginTop: '5px',
                                maxHeight: '200px',
                                overflowY: 'auto'
                            }}>
                                {debugLog || 'No logs yet...'}
                            </pre>
                        </details>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Login;
