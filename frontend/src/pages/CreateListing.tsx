import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, InputNumber, Button, Card, Typography, message, Upload, Modal, Alert, Steps } from 'antd';
import { useAuth } from '../context/AuthContext';
import { UploadOutlined, DeleteOutlined, RocketOutlined } from '@ant-design/icons';
import { CATEGORIES } from '../utils/mockData';
import api from '../utils/api';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import { useWriteContract } from 'wagmi';
import { CAMPUS_MARKETPLACE_CONFIG } from '../utils/contracts';
import { parseEther, parseEventLogs } from 'viem';
import { config as wagmiConfig } from '../wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const CreateListing: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user, isLoading, isWalletConnected } = useAuth();
    const [loading, setLoading] = useState(false);
    const [submittingStep, setSubmittingStep] = useState<number>(0);
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [form] = Form.useForm();
    const [loadingProduct, setLoadingProduct] = useState(false);

    // Web3 Hooks
    const { writeContractAsync } = useWriteContract();

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

            if (response.data && response.data.code === 200 && response.data.url) {
                const uploadedUrl = response.data.url;
                setImageUrl(uploadedUrl);
                setFileList([{
                    uid: file.uid,
                    name: file.name,
                    status: 'done',
                    url: uploadedUrl,
                }]);
                message.success('Image uploaded successfully!');
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error: any) {
            console.error('Upload failed:', error);
            message.error('Failed to upload image. Please try again.');
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
            let contractListingId = 0;
            let txHash = "";

            if (!isEditMode) {
                // === Web3 Creation Flow ===
                setSubmittingStep(1); // 1: Blockchain

                message.loading({ content: 'Please sign the transaction in your wallet...', key: 'tx' });

                // 1. Send Transaction
                txHash = await writeContractAsync({
                    ...CAMPUS_MARKETPLACE_CONFIG,
                    functionName: 'createListing',
                    args: [
                        values.title,          // Title
                        "",                    // Description (Empty to save gas, stored in DB)
                        parseEther(values.price.toString()), // Price in Wei
                        ""                     // ImageHash (Empty to save gas, stored in DB)
                    ]
                });

                message.loading({ content: 'Transaction sent! Waiting for confirmation...', key: 'tx' });
                console.log("Creation Tx Hash:", txHash);

                // 2. Wait for Receipt
                const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

                if (receipt.status !== 'success') {
                    throw new Error("Blockchain transaction failed.");
                }

                // 3. Parse Logs for Listing ID
                console.log("Transaction Receipt:", receipt);
                console.log("Raw Logs:", receipt.logs);

                // Attempt 1: Standard viem parsing
                const logs = parseEventLogs({
                    abi: CAMPUS_MARKETPLACE_CONFIG.abi,
                    eventName: 'ListingCreated',
                    logs: receipt.logs,
                });

                console.log("Parsed Logs (Attempt 1):", logs);

                if (logs && logs.length > 0) {
                    contractListingId = Number((logs[0] as any).args.id);
                    console.log("✅ CHECKPOINT: Captured ID via standard parsing:", contractListingId);
                } else {
                    console.warn("⚠️ Standard parsing failed. Trying manual fallback...");
                    try {
                        // Manual fallback: Check topics directly
                        // Event: ListingCreated(uint256 indexed id, address indexed seller, ...)
                        // Topics: [Signature, id, seller]
                        const targetLog = receipt.logs.find(l => l.topics.length >= 2);
                        if (targetLog) {
                            const idHex = targetLog.topics[1]; // First indexed param
                            if (idHex) {
                                contractListingId = parseInt(idHex, 16);
                                console.log("✅ CHECKPOINT: Captured ID via manual fallback:", contractListingId);
                            }
                        }
                    } catch (err) {
                        console.error("Manual fallback failed:", err);
                    }
                }

                if (contractListingId === 0) {
                    console.error("❌ CRITICAL: Failed to get Listing ID. Backend sync will likely fail.");
                    message.error("Warning: Blockchain ID missing. Check console for details.");
                }

                message.success({ content: 'Blockchain transaction verified!', key: 'tx' });
            }

            // === Backend Sync ===
            setSubmittingStep(2); // 2: Backend Sync

            const productData = {
                title: values.title,
                description: values.description,
                price: Number(values.price),
                image_url: imageUrl,
                category: values.category,
                seller_addr: user.address,
                status: 1, // 1 = Available

                // New Fields matching Backend Schema
                on_chain_id: contractListingId.toString(),
                on_chain_tx_id: "",
            };

            console.log(isEditMode ? 'Updating product:' : 'Creating product:', productData);

            const response = isEditMode
                ? await api.put(`/auth/products/${id}`, productData)
                : await api.post('/auth/products', productData);

            if (response.data && response.data.code === 200) {
                setSubmittingStep(3); // Done
                message.success(isEditMode ? 'Product updated successfully!' : 'Listing created on Blockchain & Database!');

                if (isEditMode) {
                    navigate(`/items/${id}`);
                } else {
                    form.resetFields();
                    setImageUrl(null);
                    setFileList([]);

                    // Show success modal
                    Modal.success({
                        title: 'Listing Published!',
                        content: (
                            <div>
                                <p>Your item is now live on the blockchain.</p>
                                <p>Listing ID: {contractListingId}</p>
                            </div>
                        ),
                        onOk: () => navigate('/')
                    });
                }
            } else {
                throw new Error(response.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} listing`);
            }
        } catch (error: any) {
            console.error(`Product ${isEditMode ? 'update' : 'creation'} failed:`, error);

            let errMsg = error.message || "Unknown error";
            if (errMsg.includes("User rejected")) errMsg = "Transaction rejected by user.";

            message.error(error.response?.data?.message || errMsg || `Failed to ${isEditMode ? 'update' : 'create'} listing.`);
        } finally {
            setLoading(false);
            setSubmittingStep(0);
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

            {!isEditMode && loading && (
                <Card style={{ marginBottom: '2rem' }}>
                    <Steps current={submittingStep}>
                        <Step title="Sign Transaction" description="Wallet approval" />
                        <Step title="Blockchain Confirm" description="Wait for block" />
                        <Step title="Sync Database" description="Save details" />
                    </Steps>
                </Card>
            )}

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
                                    placeholder="Price in ETH"
                                    disabled={isEditMode} // Disable price edit to prevent chain desync
                                    addonAfter="ETH"
                                />
                            </Form.Item>

                            {isEditMode && <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '-10px', marginBottom: '10px' }}>Price cannot be changed after listing.</Text>}

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
                            icon={!isEditMode && <RocketOutlined />}
                        >
                            {isEditMode ? 'Update Listing' : 'Publish to Blockchain'}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default CreateListing;
