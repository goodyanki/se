import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Input, Radio, List, Tag, Typography, Empty, Card as AntCard, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { CATEGORIES } from '../utils/mockData';
import api from '../utils/api';

const { Title, Text } = Typography;
const { Meta } = AntCard;

const Home: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch all products from backend
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const response = await api.get('/products');
                console.log('Products API response:', response.data);

                if (response.data && response.data.code === 200 && response.data.data) {
                    // Map backend format to frontend format
                    const mappedProducts = response.data.data.map((item: any) => ({
                        id: item.ID?.toString() || item.id?.toString(),
                        title: item.title || item.Title,
                        price: item.price || item.Price,
                        description: item.description || item.Description,
                        category: item.category || item.Category,
                        image: item.image_url || item.ImageUrl || 'https://placehold.co/400x300?text=No+Image',
                        seller: item.seller_addr || item.SellerAddr || 'Unknown',
                        sellerAddress: item.seller_addr || item.SellerAddr,
                        status: item.status === 1 ? 'AVAILABLE' : item.status === 3 ? 'SOLD' : 'PENDING',
                        createdAt: item.CreatedAt || item.created_at || new Date().toISOString()
                    }));
                    setProducts(mappedProducts);
                } else {
                    console.warn('No products found or unexpected response format');
                    setProducts([]);
                }
            } catch (error: any) {
                console.error('Failed to fetch products:', error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const filteredItems = useMemo(() => {
        return products.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory, products]);

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

            {/* Search and Filter Section */}
            <div style={{ marginBottom: '2rem', width: '100%' }}>
                <div style={{ marginBottom: '1rem', width: '100%' }}>
                    <Input
                        size="large"
                        placeholder="Search for books, electronics..."
                        prefix={<SearchOutlined />}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <Radio.Group
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        buttonStyle="solid"
                    >
                        {CATEGORIES.slice(0, 5).map(cat => (
                            <Radio.Button key={cat} value={cat}>{cat}</Radio.Button>
                        ))}
                    </Radio.Group>
                </div>
            </div>

            {/* Grid */}
            <List
                grid={{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 4 }}
                dataSource={filteredItems}
                locale={{ emptyText: <Empty description="No items found" /> }}
                renderItem={item => (
                    <List.Item
                        style={{ width: '100%' }}
                        data-product-id={item.id}
                    >
                        <Link to={`/items/${item.id}`}>
                            <AntCard
                                hoverable
                                style={{ height: '100%', minHeight: '380px' }}
                                data-id={item.id}
                                data-title={item.title}
                                data-price={item.price}
                                cover={
                                    <div style={{ height: 200, overflow: 'hidden', background: '#f5f5f5' }}>
                                        <img alt={item.title} src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                }
                            >
                                <Meta
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
                                                <Tag color={item.status === 'AVAILABLE' ? 'success' : 'error'}>{item.status}</Tag>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>{item.category}</Text>
                                            </div>
                                        </div>
                                    }
                                />
                            </AntCard>
                        </Link>
                    </List.Item>
                )}
            />
        </div>
    );
};

export default Home;
