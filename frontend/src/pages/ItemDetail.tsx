import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Tag, Typography, Modal, Descriptions, Avatar, Image, Space, Divider, message, Spin } from 'antd';
import { ShoppingCartOutlined, MessageOutlined, ArrowLeftOutlined, UserOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const { Title, Paragraph, Text } = Typography;

const ItemDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isLoggedIn, user } = useAuth();
    const [isBuying, setIsBuying] = useState(false);
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Fetch product details from backend
    useEffect(() => {
        const fetchProductDetail = async () => {
            if (!id) return;

            setLoading(true);
            try {
                const response = await api.get(`/products/${id}`);
                console.log('Product detail response:', response.data);

                if (response.data && response.data.code === 200 && response.data.data) {
                    const productData = response.data.data;

                    // Map backend format to frontend format
                    const mappedProduct = {
                        id: productData.ID?.toString() || productData.id?.toString(),
                        title: productData.title || productData.Title,
                        price: productData.price || productData.Price,
                        description: productData.description || productData.Description,
                        category: productData.category || productData.Category,
                        image: productData.image_url || productData.ImageUrl || 'https://placehold.co/600x400?text=No+Image',
                        seller: productData.seller_addr || productData.SellerAddr || 'Unknown',
                        sellerAddress: productData.seller_addr || productData.SellerAddr,
                        status: productData.status === 1 ? 'AVAILABLE' : productData.status === 3 ? 'SOLD' : 'PENDING',
                        createdAt: productData.CreatedAt || productData.created_at,
                        updatedAt: productData.UpdatedAt || productData.updated_at
                    };

                    setItem(mappedProduct);
                } else {
                    console.warn('Product not found or unexpected response format');
                    message.error('Product not found');
                    navigate('/');
                }
            } catch (error: any) {
                console.error('Failed to fetch product details:', error);
                message.error('Failed to load product details');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetail();
    }, [id, navigate]);

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

    const handleDelete = async () => {
        Modal.confirm({
            title: 'Delete Product',
            content: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const response = await api.delete(`/auth/products/${item.id}`);
                    console.log('Delete response:', response.data);

                    if (response.data && response.data.code === 200) {
                        message.success('Product deleted successfully');
                        navigate('/profile');
                    } else {
                        throw new Error(response.data?.message || 'Failed to delete product');
                    }
                } catch (error: any) {
                    console.error('Failed to delete product:', error);
                    message.error(error.response?.data?.message || 'Failed to delete product');
                }
            }
        });
    };

    const handleEdit = () => {
        navigate(`/edit-listing/${item.id}`);
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <Spin size="large" tip="Loading product details..." />
            </div>
        );
    }

    if (!item) {
        return <div className="container" style={{ padding: '2rem' }}>Item not found</div>;
    }

    // Check if current user is the owner of this product
    const isOwner = user?.address && item.sellerAddress === user.address;

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
                Back
            </Button>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '2rem' }}>
                {/* Image Section */}
                <Card
                    bodyStyle={{ padding: 0 }}
                    bordered={false}
                    style={{ overflow: 'hidden', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <img
                        src={item.image}
                        alt={item.title}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                        }}
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
                                <Text strong>Seller</Text>
                                <br />
                                <Text type="secondary" copyable={{ text: item.sellerAddress }} style={{ fontSize: '12px' }}>
                                    {item.sellerAddress?.substring(0, 6)}...{item.sellerAddress?.substring(item.sellerAddress.length - 4)}
                                </Text>
                            </div>
                        </Space>
                        {item.createdAt && (
                            <>
                                <Divider />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Listed: {new Date(item.createdAt).toLocaleDateString()}
                                </Text>
                            </>
                        )}
                    </Card>

                    {/* Action Buttons */}
                    {isOwner ? (
                        // Owner sees Edit and Delete buttons
                        <Space size="middle" style={{ width: '100%' }}>
                            <Button
                                type="primary"
                                size="large"
                                icon={<EditOutlined />}
                                onClick={handleEdit}
                                style={{ flex: 1 }}
                            >
                                Edit
                            </Button>
                            <Button
                                danger
                                size="large"
                                icon={<DeleteOutlined />}
                                onClick={handleDelete}
                                style={{ flex: 1 }}
                            >
                                Delete
                            </Button>
                        </Space>
                    ) : (
                        // Non-owners see Buy and Contact buttons
                        <Space size="middle" style={{ width: '100%' }}>
                            <Button
                                type="primary"
                                size="large"
                                icon={<ShoppingCartOutlined />}
                                onClick={handleBuy}
                                disabled={item.status !== 'AVAILABLE'}
                                loading={isBuying}
                                style={{ flex: 1, minWidth: '150px' }}
                            >
                                {item.status === 'AVAILABLE' ? 'Buy Now' : item.status}
                            </Button>
                            <Button
                                size="large"
                                icon={<MessageOutlined />}
                                onClick={() => navigate(`/chat?seller=${item.sellerAddress}`)}
                                style={{ flex: 1 }}
                            >
                                Contact Seller
                            </Button>
                        </Space>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemDetail;
