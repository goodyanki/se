import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Avatar, Statistic, Tag, Descriptions, Row, Col, Typography, Modal } from 'antd';
import { UserOutlined, MailTwoTone, SafetyCertificateTwoTone, WalletOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
    const { user, login } = useAuth();

    // Refresh user data (call login API) on mount to ensure is_verified is up to date
    React.useEffect(() => {
        login();
    }, []);

    if (!user) return <div className="container" style={{ padding: 20 }}>Please login</div>;

    const handleDelete = () => {
        Modal.confirm({
            title: 'Delete Account',
            content: 'Are you sure? This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk() {
                // Mock delete
                console.log('Account deleted');
            }
        });
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <Title level={2} style={{ marginBottom: '2rem' }}>My Profile</Title>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card style={{ textAlign: 'center' }}>
                        <Avatar
                            size={100}
                            icon={<UserOutlined />}
                            style={{ backgroundColor: '#0072CE', marginBottom: '1rem' }}
                        >
                            {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Title level={3} style={{ margin: '0 0 0.5rem 0' }}>{user.username}</Title>
                        <div style={{ marginBottom: '1rem' }}>
                            {user.isVerified ? (
                                <Tag icon={<SafetyCertificateTwoTone twoToneColor="#52c41a" />} color="success">Verified Student</Tag>
                            ) : (
                                <Tag icon={<MailTwoTone twoToneColor="#eb2f96" />} color="error">Unverified</Tag>
                            )}
                        </div>
                        <Text type="secondary" copyable={{ text: user.address }}>
                            <WalletOutlined /> {user.address.substring(0, 6)}...{user.address.substring(user.address.length - 4)}
                        </Text>
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Card style={{ marginBottom: '2rem' }}>
                        <Row gutter={16} style={{ textAlign: 'center' }}>
                            <Col span={12}>
                                <Statistic title="Items Sold" value={12} />
                            </Col>
                            <Col span={12}>
                                <Statistic title="Active Listings" value={5} />
                            </Col>
                        </Row>
                        <Descriptions title="Account Info" bordered column={1} style={{ marginTop: '2rem' }}>
                            <Descriptions.Item label="Username">{user.username}</Descriptions.Item>
                            <Descriptions.Item label="Wallet">{user.address}</Descriptions.Item>
                            <Descriptions.Item label="Status">
                                {user.isVerified ? 'Campus Verified' : 'Guest / Unverified'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card title="Danger Zone" headStyle={{ color: '#ff4d4f' }} style={{ borderColor: '#ffa39e' }}>
                        <p>If you delete your account, you will lose all data and transaction history.</p>
                        <Button type="primary" danger onClick={handleDelete}>Delete Account</Button>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Profile;
