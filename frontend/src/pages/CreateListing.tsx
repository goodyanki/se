import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, InputNumber, Button, Card, Typography, message, Upload, Modal } from 'antd';
import { useAuth } from '../context/AuthContext';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { CATEGORIES } from '../utils/mockData';
import api from '../utils/api';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CreateListing: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user, isLoading, isWalletConnected } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [form] = Form.useForm();
    const [loadingProduct, setLoadingProduct] = useState(false);

    // Determine if we're in edit mode
    const isEditMode = !!id;

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

    // Fetch product details in edit mode
    useEffect(() => {
        const fetchProductDetails = async () => {
            if (!isEditMode || !id) return;

            setLoadingProduct(true);
            try {
                const response = await api.get(`/products/${id}`);
                console.log('Fetching product for edit:', response.data);

                if (response.data && response.data.code === 200 && response.data.data) {
                    const product = response.data.data;

                    // Pre-fill form
                    form.setFieldsValue({
                        title: product.title || product.Title,
                        price: product.price || product.Price,
                        category: product.category || product.Category,
                        description: product.description || product.Description
                    });

                    // Set existing image URL
                    const existingImageUrl = product.image_url || product.ImageUrl;
                    if (existingImageUrl) {
                        setImageUrl(existingImageUrl);
                        // Create a mock file list item for display
                        setFileList([{
                            uid: '-1',
                            name: 'Current Image',
                            status: 'done',
                            url: existingImageUrl
                        }]);
                    }
                } else {
                    message.error('Failed to load product details');
                    navigate('/');
                }
            } catch (error: any) {
                console.error('Failed to fetch product:', error);
                message.error('Failed to load product details');
                navigate('/');
            } finally {
                setLoadingProduct(false);
            }
        };

        fetchProductDetails();
    }, [id, isEditMode, form, navigate]);

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

    // Handle image upload
    const handleUpload = async (file: RcFile) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file); // Backend expects 'file' as the field name

        try {
            console.log('Uploading file:', file.name, 'Size:', file.size);
            const response = await api.post('/auth/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Upload response:', response.data);

            // Backend returns: { code: 200, msg: "上传成功", url: "http://..." }
            if (response.data && response.data.code === 200 && response.data.url) {
                const uploadedUrl = response.data.url;

                // Save URL to state
                setImageUrl(uploadedUrl);

                // Save URL to localStorage for persistence
                localStorage.setItem('lastUploadedImageUrl', uploadedUrl);
                localStorage.setItem('lastUploadResponse', JSON.stringify(response.data));

                console.log('Image URL saved:', uploadedUrl);

                setFileList([{
                    uid: file.uid,
                    name: file.name,
                    status: 'done',
                    url: uploadedUrl,
                }]);
                message.success(response.data.msg || 'Image uploaded successfully!');
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error: any) {
            console.error('Upload failed:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Error headers:', error.response?.headers);

            const errorMsg = error.response?.data?.message || error.response?.data?.msg || error.response?.data?.error || 'Failed to upload image. Please try again.';
            message.error(`Upload failed: ${errorMsg}`);
            setFileList([]);
        } finally {
            setUploading(false);
        }

        return false; // Prevent default upload behavior
    };

    // Handle image removal
    const handleRemove = () => {
        setImageUrl(null);
        setFileList([]);
    };

    // Submit product creation or update
    const onFinish = async (values: any) => {
        if (!imageUrl) {
            message.error('Please upload an image first!');
            return;
        }

        setLoading(true);

        try {
            const productData = {
                title: values.title,
                description: values.description,
                price: Number(values.price),
                image_url: imageUrl,
                category: values.category,
                seller_addr: user.address,
                status: 1 // 1 = Available for sale
            };

            console.log(isEditMode ? 'Updating product:' : 'Creating product:', productData);

            const response = isEditMode
                ? await api.put(`/auth/products/${id}`, productData)
                : await api.post('/auth/products', productData);

            console.log(isEditMode ? '=== Product Update Response ===' : '=== Product Creation Response ===');
            console.log('Full response:', response);
            console.log('Response data:', response.data);
            console.log('Response code:', response.data?.code);
            console.log('Response message:', response.data?.msg || response.data?.message);
            console.log('Product data:', response.data?.data);
            console.log('================================');

            if (response.data && response.data.code === 200) {
                message.success(isEditMode ? 'Product updated successfully!' : 'Listing created successfully!');

                if (isEditMode) {
                    // Navigate back to product detail page
                    navigate(`/items/${id}`);
                } else {
                    // Clear form and navigate to home
                    form.resetFields();
                    setImageUrl(null);
                    setFileList([]);
                    navigate('/');
                }
            } else {
                throw new Error(response.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} listing`);
            }
        } catch (error: any) {
            console.error(`Product ${isEditMode ? 'update' : 'creation'} failed:`, error);
            message.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} listing. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    if (loadingProduct) {
        return (
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <Typography.Text>Loading product details...</Typography.Text>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
            <Title level={2} style={{ marginBottom: '2rem' }}>
                {isEditMode ? 'Edit Listing' : 'Create New Listing'}
            </Title>
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
                        label="Product Image"
                        required
                        help={!imageUrl ? "Please upload at least one image" : undefined}
                    >
                        <Upload
                            listType="picture-card"
                            fileList={fileList}
                            beforeUpload={handleUpload}
                            onRemove={handleRemove}
                            maxCount={1}
                            accept="image/*"
                        >
                            {fileList.length === 0 && (
                                <div>
                                    <UploadOutlined />
                                    <div style={{ marginTop: 8 }}>
                                        {uploading ? 'Uploading...' : 'Upload Image'}
                                    </div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            loading={loading}
                            disabled={!imageUrl || uploading}
                        >
                            Publish Listing
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default CreateListing;
