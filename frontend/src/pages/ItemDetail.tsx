import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Tag, Typography, Modal, Avatar, Space, Divider, message, Spin, Alert } from 'antd';
import { ShoppingCartOutlined, MessageOutlined, ArrowLeftOutlined, UserOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useWriteContract, useSignMessage } from 'wagmi';
import { CAMPUS_MARKETPLACE_CONFIG } from '../utils/contracts';
import { parseEther, encodePacked, keccak256, parseEventLogs } from 'viem';
import { config as wagmiConfig } from '../wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';

const { Title, Paragraph, Text } = Typography;

// Helper to confirm purchase with backend
const confirmPurchaseWithBackend = async (productId: number | string, transactionId: string) => {
    try {
        const response = await api.post('/auth/confirm-purchase', {
            product_id: Number(productId),
            on_chain_tx_id: transactionId.toString()
        });
        return response.data;
    } catch (error) {
        console.error('Backend sync error:', error);
        throw error;
    }
};

const ItemDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isLoggedIn, user, isWalletConnected } = useAuth();
    const [isBuying, setIsBuying] = useState(false);
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Web3 Hooks
    const { writeContractAsync } = useWriteContract();
    const { signMessageAsync } = useSignMessage();

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
                        status: productData.status === 1 ? 'AVAILABLE' : productData.status === 2 ? 'LOCKED' : productData.status === 3 ? 'SOLD' : 'PENDING',
                        createdAt: productData.CreatedAt || productData.created_at,
                        updatedAt: productData.UpdatedAt || productData.updated_at,

                        // IMPORTANT: We need the contract listing ID to buy
                        // Backend sends "on_chain_id" (string) or "OnChainID"
                        contractListingId: productData.on_chain_id || productData.OnChainID || 0,
                        // Backend sends "on_chain_tx_id" (string) or "OnChainTxID"
                        onChainTxId: productData.on_chain_tx_id || productData.OnChainTxID
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

    // Handle Buy Logic
    const handleBuy = async () => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        if (!item.contractListingId) {
            // Fallback for old items not on chain
            message.warning('This item is not listed on the blockchain. Support for legacy items is coming soon.');
            return;
        }

        Modal.confirm({
            title: `Confirm Purchase on Blockchain`,
            content: (
                <div>
                    <p>You are about to buy <b>{item.title}</b> for <b>{item.price} tokens</b> (ETH).</p>
                    <Alert
                        message="Web3 Transaction"
                        description="This process involves: 1. Signing a purchase intent. 2. Sending ETH to the smart contract escrow."
                        type="info"
                        showIcon
                    />
                </div>
            ),
            okText: 'Pay with Wallet',
            cancelText: 'Cancel',
            onOk: async () => {
                setIsBuying(true);
                const hideLoading = message.loading('Processing purchase...', 0);

                try {
                    // 1. Generate Signature
                    // Hash: keccak256(abi.encodePacked(listingId, price, buyer, seller))
                    const priceInWei = parseEther(item.price.toString());
                    const listingId = BigInt(item.contractListingId);

                    if (!user?.address) throw new Error("User address not found");

                    const messageHash = keccak256(encodePacked(
                        ['uint256', 'uint256', 'address', 'address'],
                        [listingId, priceInWei, user.address as `0x${string}`, item.sellerAddress as `0x${string}`]
                    ));

                    console.log("Signing hash for:", { listingId, price: item.price, buyer: user.address, seller: item.sellerAddress });

                    // Sign the hash
                    const signature = await signMessageAsync({
                        message: { raw: messageHash }
                    });

                    message.loading("Signature signed! Please confirm transaction...", 1);

                    // 2. Send Transaction
                    const txHash = await writeContractAsync({
                        ...CAMPUS_MARKETPLACE_CONFIG,
                        functionName: 'createTransaction',
                        args: [listingId, signature],
                        value: priceInWei
                    });

                    message.loading("Transaction sent! Waiting for confirmation...", 0);

                    // 3. Wait for Receipt
                    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

                    if (receipt.status !== 'success') {
                        throw new Error("Transaction reverted on chain.");
                    }

                    // 4. Parse Logs to get Transaction ID
                    const logs = parseEventLogs({
                        abi: CAMPUS_MARKETPLACE_CONFIG.abi,
                        eventName: 'TransactionCreated',
                        logs: receipt.logs,
                    });

                    // Extract newTxId handling potential logging issues
                    if (!logs || logs.length === 0) {
                        throw new Error("Transaction ID not found in logs");
                    }

                    const newTxId = (logs[0] as any).args.txId;
                    console.log("On-Chain Transaction ID:", newTxId);

                    // 5. Create Order Record in Backend
                    await api.post('/auth/orders', {
                        product_id: Number(item.id),
                        on_chain_id: item.contractListingId.toString(),
                        buyer_addr: user.address,
                        seller_addr: item.sellerAddress,
                        price: Number(item.price),
                        tx_hash: txHash
                    });

                    // 6. Sync with Backend (Update Product Status)
                    await confirmPurchaseWithBackend(item.id, newTxId.toString());

                    hideLoading();

                    Modal.success({
                        title: 'Purchase Successful!',
                        content: (
                            <div>
                                <p>Funds are now held in escrow.</p>
                                <p>Tx Hash: <Text code copyable>{txHash.substring(0, 10)}...</Text></p>
                            </div>
                        ),
                        onOk: () => window.location.reload() // Reload to update status
                    });

                } catch (error: any) {
                    hideLoading();
                    console.error("Purchase failed:", error);
                    let errMsg = error.message || "Unknown error";
                    if (errMsg.includes("User rejected")) errMsg = "Transaction rejected by user.";
                    if (errMsg.includes("Insufficient funds")) errMsg = "Insufficient funds in wallet.";

                    Modal.error({
                        title: 'Purchase Failed',
                        content: errMsg
                    });
                } finally {
                    setIsBuying(false);
                }
            }
        });
    };

    // Confirm Receipt (Release Funds)
    const handleConfirmReceipt = async () => {
        if (!item.onChainTxId) {
            message.error("Cannot confirm receipt: Missing on-chain transaction ID.");
            return;
        }

        Modal.confirm({
            title: 'Confirm Receipt',
            content: 'Are you sure you have received the item? This will release funds to the seller.',
            okText: 'Release Funds',
            cancelText: 'Cancel',
            onOk: async () => {
                const hideLoading = message.loading('Releasing funds...', 0);
                try {
                    // 1. Call Contract
                    const txHash = await writeContractAsync({
                        ...CAMPUS_MARKETPLACE_CONFIG,
                        functionName: 'releaseFunds',
                        args: [BigInt(item.onChainTxId)]
                    });

                    await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

                    // 2. Sync with Backend
                    await api.post('/auth/confirm-receipt', { product_id: Number(item.id) });

                    hideLoading();
                    message.success("Funds released! Transaction completed.");
                    window.location.reload();

                } catch (error: any) {
                    hideLoading();
                    console.error("Release funds failed:", error);
                    message.error("Failed to release funds: " + (error.message || "Unknown error"));
                }
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
                    if (response.data && response.data.code === 200) {
                        message.success('Product deleted successfully');
                        navigate('/profile');
                    } else {
                        throw new Error(response.data?.message || 'Failed to delete product');
                    }
                } catch (error: any) {
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

    // Status Logic
    const isLocked = item.status === 'LOCKED';
    const isSold = item.status === 'SOLD';

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
                        <Title level={2} style={{ color: '#0072CE', margin: 0 }}>${item.price} ETH</Title>
                        <Tag color={isSold ? 'default' : isLocked ? 'warning' : 'success'} style={{ fontSize: '1rem', padding: '4px 8px' }}>
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
                        <Divider />
                        <Space>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Contract Listing ID: {item.contractListingId || 'N/A'}
                            </Text>
                        </Space>
                    </Card>

                    {/* Action Buttons */}
                    {isOwner ? (
                        // Owner Actions
                        <Space size="middle" style={{ width: '100%' }}>
                            {isLocked ? (
                                <Alert message="Item is currently in a transaction (Locked). Waiting for buyer confirmation." type="warning" showIcon style={{ width: '100%' }} />
                            ) : (
                                <>
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<EditOutlined />}
                                        onClick={handleEdit}
                                        style={{ flex: 1 }}
                                        disabled={isSold}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        danger
                                        size="large"
                                        icon={<DeleteOutlined />}
                                        onClick={handleDelete}
                                        style={{ flex: 1 }}
                                        disabled={isSold}
                                    >
                                        Delete
                                    </Button>
                                </>
                            )}
                        </Space>
                    ) : (
                        // Buyer Actions
                        <Space size="middle" style={{ width: '100%', flexDirection: 'column' }}>
                            {isLocked ? (
                                <div style={{ width: '100%' }}>
                                    <Alert
                                        message="Item is Locked"
                                        description="You have purchased this item. Please inspect it and confirm receipt to release funds to the seller."
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: '1rem' }}
                                    />
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<CheckCircleOutlined />}
                                        onClick={handleConfirmReceipt}
                                        block
                                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                    >
                                        Confirm Receipt (Release Funds)
                                    </Button>
                                </div>
                            ) : isSold ? (
                                <Button size="large" disabled block>Sold Out</Button>
                            ) : (
                                <Space style={{ width: '100%' }}>
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<ShoppingCartOutlined />}
                                        onClick={handleBuy}
                                        loading={isBuying}
                                        style={{ flex: 1, minWidth: '150px' }}
                                    >
                                        Buy Now
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
                        </Space>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemDetail;
