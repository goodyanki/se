import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, InputNumber, Button, Card, Typography, message, Upload, Modal } from 'antd';
import { useAuth } from '../context/AuthContext';
import { UploadOutlined } from '@ant-design/icons';
import { CATEGORIES } from '../utils/mockData';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CreateListing: React.FC = () => {
    const navigate = useNavigate();
    const { user, isLoading, isWalletConnected } = useAuth();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    // Redirect if not verified
    React.useEffect(() => {
        if (!isLoading && user && !user.isVerified) {
            Modal.warning({
                title: 'Verification Required',
                content: 'You must verify your student email before posting items.',
                okText: 'Verify Now',
                onOk: () => navigate('/verify'),
                onCancel: () => navigate('/'),
                closable: true,
                maskClosable: false
            });
        }
    }, [user, isLoading, navigate]);

    if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;

    if (!user) {
        return (
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <Card>
                    <Title level={4}>Authentication Required</Title>
                    <Typography.Paragraph>
                        {isWalletConnected
                            ? "Wallet connected, but authentication failed. Please check your network connection to the backend server."
                            : "Please connect your wallet to continue."}
                    </Typography.Paragraph>
                    <Button type="primary" onClick={() => navigate('/login')}>Go to Login</Button>
                </Card>
            </div>
        );
    }

    const onFinish = async (values: any) => {
        console.log('Submission:', values);
        setLoading(true);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        message.success('Listing created successfully!');
        setLoading(false);
        navigate('/');
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
            <Title level={2} style={{ marginBottom: '2rem' }}>Create New Listing</Title>
            <Card>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ category: CATEGORIES[1] }}
                >
                    <Form.Item
                        name="title"
                        label="Item Title"
                        rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                        <Input placeholder="e.g. Introduction to Algorithms" size="large" />
                    </Form.Item>

                    <Form.Item label="Price & Category" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Form.Item
                                name="price"
                                rules={[{ required: true, message: 'Price is required' }]}
                            >
                                <InputNumber<string | number>
                                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                                    style={{ width: '100%' }}
                                    size="large"
                                    min={0}
                                    placeholder="Price"
                                />
                            </Form.Item>

                            <Form.Item
                                name="category"
                                rules={[{ required: true }]}
                            >
                                <Select size="large">
                                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                                        <Option key={c} value={c}>{c}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </div>
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                        rules={[{ required: true, message: 'Please describe your item' }]}
                    >
                        <TextArea rows={4} placeholder="Describe condition, reason for selling..." />
                    </Form.Item>

                    <Form.Item
                        label="Photos"
                        name="photos"
                    >
                        <Upload listType="picture" maxCount={3} beforeUpload={() => false}>
                            <Button icon={<UploadOutlined />}>Upload (Mock)</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                            Publish Listing
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default CreateListing;
