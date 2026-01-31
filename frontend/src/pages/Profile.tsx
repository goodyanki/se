import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Avatar, Statistic, Tag, Descriptions, Row, Col, Typography, Modal, Tabs, List, Empty, Spin } from 'antd';
import { UserOutlined, MailTwoTone, SafetyCertificateTwoTone, WalletOutlined, ShoppingOutlined, AppstoreOutlined } from '@ant-design/icons';
import { MOCK_ITEMS } from '../utils/mockData';
import api from '../utils/api';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
    const { user, login } = useAuth();
    const [activeTab, setActiveTab] = useState('1');
    const [myListings, setMyListings] = useState<typeof MOCK_ITEMS>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Refresh user data (call login API) on mount to ensure is_verified is up to date
    useEffect(() => {
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

    // Fetch user's products from backend
    useEffect(() => {
        const fetchMyProducts = async () => {
            if (!user) {
                setMyListings([]);
                return;
            }

            setLoadingProducts(true);
            try {
                const response = await api.get('/auth/my-products');
                console.log('My products response:', response.data);

                if (response.data && response.data.code === 200) {
                    // Handle both empty array and null data
                    const dataArray = response.data.data || [];

                    if (Array.isArray(dataArray) && dataArray.length > 0) {
                        // Map backend product format to frontend format
                        const products = dataArray.map((item: any) => ({
                            id: item.ID?.toString() || item.id?.toString(),
                            title: item.title || item.Title,
                            price: item.price || item.Price,
                            description: item.description || item.Description,
                            category: item.category || item.Category,
                            image: item.image_url || item.ImageUrl || 'https://placehold.co/400x300?text=No+Image',
                            seller: user.username,
                            sellerAddress: user.address,
                            status: (item.status === 1 ? 'AVAILABLE' : item.status === 3 ? 'SOLD' : 'PENDING') as 'AVAILABLE' | 'SOLD' | 'PENDING',
                            createdAt: item.CreatedAt || item.created_at || new Date().toISOString()
                        }));
                        setMyListings(products);
                    } else {
                        console.log('No products found, setting empty array');
                        setMyListings([]);
                    }
                } else {
                    console.warn('Unexpected response format or error code');
                    setMyListings([]);
                }
            } catch (error: any) {
                console.error('Failed to fetch products:', error);
                console.error('Error details:', error.response?.data);
                // Don't show error to user, just use empty array
                setMyListings([]);
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchMyProducts();
    }, [user]);

    // Mock purchases - in real implementation, this would come from backend
    // For now, showing items where user is NOT the seller as mock purchases
    const myPurchases = MOCK_ITEMS.filter(item =>
        item.status === 'SOLD' && item.sellerAddress !== user.address
    ).slice(0, 3); // Limit to 3 for demo

    const renderProductCard = (item: typeof MOCK_ITEMS[0]) => (
        <List.Item style={{ width: '100%', display: 'flex' }}>
            <Link to={`/items/${item.id}`} style={{ width: '100%', display: 'block' }}>
                <Card
                    hoverable
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                    bodyStyle={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '16px'
                    }}
                    cover={
                        <div style={{ width: '100%', paddingTop: '75%', position: 'relative', background: '#f5f5f5' }}>
                            <img
                                alt={item.title}
                                src={item.image}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>
                    }
                >
                    <Card.Meta
                        title={
                            <div style={{ minHeight: '48px', display: 'flex', alignItems: 'flex-start' }}>
                                <Text strong style={{ fontSize: '16px', lineHeight: '24px', width: '100%' }}>
                                    {item.title.length > 25 ? `${item.title.substring(0, 25)}...` : item.title}
                                </Text>
                            </div>
                        }
                        description={
                            <div>
                                <Title level={4} style={{ color: '#0072CE', margin: '8px 0' }}>${item.price}</Title>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Tag color={item.status === 'AVAILABLE' ? 'success' : item.status === 'SOLD' ? 'error' : 'warning'}>
                                        {item.status}
                                    </Tag>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>{item.category}</Text>
                                </div>
                            </div>
                        }
                    />
                </Card>
            </Link>
        </List.Item>
    );

    const tabItems = [
        {
            key: '1',
            label: (
                <span>
                    <AppstoreOutlined />
                    My Listings ({myListings.length})
                </span>
            ),
            children: (
                <div style={{ marginTop: '1rem' }}>
                    {loadingProducts ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <Spin size="large" />
                        </div>
                    ) : myListings.length === 0 ? (
                        <Empty description="You haven't listed any items yet" />
                    ) : (
                        <List
                            grid={{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 4 }}
                            dataSource={myListings}
                            renderItem={renderProductCard}
                        />
                    )}
                </div>
            )
        },
        {
            key: '2',
            label: (
                <span>
                    <ShoppingOutlined />
                    My Purchases ({myPurchases.length})
                </span>
            ),
            children: (
                <div style={{ marginTop: '1rem' }}>
                    {myPurchases.length === 0 ? (
                        <Empty description="You haven't purchased any items yet" />
                    ) : (
                        <List
                            grid={{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 4 }}
                            dataSource={myPurchases}
                            renderItem={renderProductCard}
                        />
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
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

                    <Card style={{ marginTop: '1rem' }}>
                        <Row gutter={16} style={{ textAlign: 'center' }}>
                            <Col span={12}>
                                <Statistic title="Sold" value={MOCK_ITEMS.filter(i => i.sellerAddress === user.address && i.status === 'SOLD').length} />
                            </Col>
                            <Col span={12}>
                                <Statistic title="Active" value={myListings.filter(i => i.status === 'AVAILABLE').length} />
                            </Col>
                        </Row>
                    </Card>

                    <Card title="Danger Zone" headStyle={{ color: '#ff4d4f' }} style={{ borderColor: '#ffa39e', marginTop: '1rem' }}>
                        <p>Deleting your account will permanently erase all data and transaction history.</p>
                        <Button type="primary" danger onClick={handleDelete}>Delete Account</Button>
                    </Card>
                </Col>

                <Col xs={24} md={16}>
                    <Card>
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            items={tabItems}
                            size="large"
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Profile;

