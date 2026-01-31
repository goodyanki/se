import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Tag, Typography, Modal, Descriptions, Avatar, Image, Space, Divider, message } from 'antd';
import { ShoppingCartOutlined, MessageOutlined, ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import { MOCK_ITEMS } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph, Text } = Typography;

const ItemDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isLoggedIn, user } = useAuth();
    const [isBuying, setIsBuying] = useState(false);

    const item = MOCK_ITEMS.find(i => i.id === id);

    if (!item) {
        return <div className="container" style={{ padding: '2rem' }}>Item not found</div>;
    }

    const handleBuy = async () => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        // Mock Buy Flow
        Modal.confirm({
            title: `Confirm Purchase`,
            content: `Buy ${item.title} for $${item.price}?`,
            okText: 'Confirm',
            cancelText: 'Cancel',
            onOk: () => {
                setIsBuying(true);
                setTimeout(() => {
                    setIsBuying(false);
                    Modal.success({
                        title: 'Transaction Successful!',
                        content: (
                            <div>
                                <p>Transaction Hash:</p>
                                <Text code copyable>0x{Math.random().toString(16).substr(2, 40)}</Text>
                            </div>
                        ),
                        onOk: () => navigate('/')
                    });
                }, 1000);
            }
        });
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
                Back
            </Button>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '2rem' }}>
                {/* Image Section */}
                <Card bodyStyle={{ padding: 0 }} bordered={false} style={{ overflow: 'hidden' }}>
                    <Image
                        src={item.image}
                        alt={item.title}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                </Card>

                {/* Info Section */}
                <div>
                    <Title level={2} style={{ marginBottom: '0.5rem' }}>{item.title}</Title>
                    <Space align="center" style={{ marginBottom: '1.5rem' }}>
                        <Title level={2} style={{ color: '#0072CE', margin: 0 }}>${item.price}</Title>
                        <Tag color={item.status === 'AVAILABLE' ? 'success' : 'error'} style={{ fontSize: '1rem', padding: '4px 8px' }}>
                            {item.status}
                        </Tag>
                        <Tag>{item.category}</Tag>
                    </Space>

                    <Card style={{ marginBottom: '2rem' }}>
                        <Paragraph type="secondary" style={{ fontSize: '1.1rem' }}>{item.description}</Paragraph>
                        <Divider />
                        <Space>
                            <Avatar icon={<UserOutlined />} />
                            <div>
                                <Text strong>{item.seller}</Text>
                                <br />
                                <Text type="secondary" copyable={{ text: item.sellerAddress }} style={{ fontSize: '12px' }}>
                                    {item.sellerAddress.substring(0, 6)}...{item.sellerAddress.substring(item.sellerAddress.length - 4)}
                                </Text>
                            </div>
                        </Space>
                    </Card>

                    <Space size="middle" style={{ width: '100%' }}>
                        <Button
                            type="primary"
                            size="large"
                            icon={<ShoppingCartOutlined />}
                            onClick={handleBuy}
                            disabled={item.status !== 'AVAILABLE' || item.seller === user?.username}
                            loading={isBuying}
                            style={{ flex: 1, minWidth: '150px' }}
                        >
                            {item.status === 'AVAILABLE' ? 'Buy Now' : item.status}
                        </Button>
                        <Button
                            size="large"
                            icon={<MessageOutlined />}
                            onClick={() => navigate('/chat')}
                            style={{ flex: 1 }}
                        >
                            Contact Seller
                        </Button>
                    </Space>
                </div>
            </div>
        </div>
    );
};

export default ItemDetail;
