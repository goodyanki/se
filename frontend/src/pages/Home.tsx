import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Input, Radio, List, Tag, Typography, Empty, Card as AntCard } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { MOCK_ITEMS, CATEGORIES } from '../utils/mockData';

const { Title, Text } = Typography;
const { Meta } = AntCard;

const Home: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredItems = useMemo(() => {
        return MOCK_ITEMS.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory]);

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
                    <List.Item style={{ width: '100%' }}>
                        <Link to={`/items/${item.id}`}>
                            <AntCard
                                hoverable
                                style={{ height: '100%', minHeight: '380px' }}
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
