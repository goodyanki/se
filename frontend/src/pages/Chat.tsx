import React, { useState, useEffect } from 'react';
import { Input, Button, List, Avatar, Typography, Layout, theme } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Sider, Content } = Layout;
const { Text } = Typography;

const Chat: React.FC = () => {
    const { user } = useAuth(); // Get current user (with ID)
    const [socket, setSocket] = useState<WebSocket | null>(null);

    // Conversations now carry not just name (address) but also the target UserID
    const [conversations, setConversations] = useState<{ id: string, name: string, lastMsg: string, userId: number }[]>([
        // Mock initial
        // { id: '1', name: 'Student_A', lastMsg: 'Yes, it is!', userId: 999 } 
    ]);
    const [selectedChat, setSelectedChat] = useState<{ id: string, name: string, lastMsg: string, userId: number } | null>(null);

    const [messages, setMessages] = useState<{ id: number, text: string, sender: 'me' | 'them' }[]>([]);
    const [input, setInput] = useState('');
    const [newAddress, setNewAddress] = useState('');

    const {
        token: { colorBgContainer, colorPrimary },
    } = theme.useToken();

    // Connect to WebSocket
    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem('auth_token');
        const wsUrl = `ws://192.168.0.7:8080/api/auth/ws?token=${token}`;

        console.log('Connecting to WS:', wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket Connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WS Message:', data);
                // Handle incoming message (simplified for now)
                // Assuming data structure matches backend Message struct
                if (data.content) {
                    const isMe = data.from_user_id === user.id;
                    setMessages(prev => [...prev, {
                        id: Date.now(),
                        text: data.content,
                        sender: isMe ? 'me' : 'them'
                    }]);
                }
            } catch (e) {
                console.error('WS Parse Error:', e);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, [user]); // Re-connect if user changes

    const handleSend = () => {
        if (!input.trim() || !user || !selectedChat || !socket) return;

        const messagePayload = {
            from_user_id: user.id,
            to_user_id: selectedChat.userId, // The ID of the user we are chatting with
            content: input.trim(),
            product_id: 1, // Defaulting to 1 as per instruction/context, or could be passed in
            is_read: false
        };

        // Optimistic UI update
        setMessages(prev => [...prev, { id: Date.now(), text: input, sender: 'me' }]);

        // Send to Backend
        try {
            socket.send(JSON.stringify(messagePayload));
            console.log('Sent:', messagePayload);
        } catch (e) {
            console.error('Send failed:', e);
        }

        setInput('');
    };

    const handleCreateChat = () => {
        if (!newAddress.trim()) return;

        // Check if already exists
        const exists = conversations.find(c => c.name === newAddress);
        if (exists) {
            setSelectedChat(exists);
            setNewAddress('');
            return;
        }

        // MOCK: Generate a fake User ID for this address so we can send messages
        // In reality, we need an API to resolve Address -> UserId
        // For testing, we just use a random ID or hash
        const mockTargetId = Math.floor(Math.random() * 10000) + 10;

        const newChat = {
            id: Date.now().toString(),
            name: newAddress,
            lastMsg: 'New conversation started',
            userId: mockTargetId // Store this ID!
        };

        console.log(`Created chat for ${newAddress} mapped to Mock ID: ${mockTargetId}`);

        setConversations([newChat, ...conversations]);
        setSelectedChat(newChat);
        setNewAddress('');

        // Reset messages for new chat (mock)
        setMessages([]);
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <Layout style={{ height: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                <Sider width={300} style={{ background: colorBgContainer, borderRight: '1px solid #f0f0f0' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ fontWeight: 600, marginBottom: '10px' }}>Conversations</div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <Input
                                placeholder="Enter Wallet Address"
                                value={newAddress}
                                onChange={e => setNewAddress(e.target.value)}
                                size="small"
                            />
                            <Button type="primary" size="small" onClick={handleCreateChat}>Create</Button>
                        </div>
                    </div>
                    <List
                        itemLayout="horizontal"
                        dataSource={conversations}
                        renderItem={item => (
                            <List.Item
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    background: selectedChat.id === item.id ? '#e6f7ff' : 'transparent'
                                }}
                                onClick={() => setSelectedChat(item)}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar icon={<UserOutlined />} />}
                                    title={<Text ellipsis style={{ maxWidth: 180 }}>{item.name}</Text>}
                                    description={item.lastMsg}
                                />
                            </List.Item>
                        )}
                    />
                </Sider>

                <Content style={{ background: colorBgContainer, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>
                        {selectedChat ? selectedChat.name : 'Select a Chat'}
                    </div>

                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                        {!selectedChat ? (
                            <div style={{ textAlign: 'center', marginTop: '50px', color: '#ccc' }}>
                                Please select or create a chat to start messaging.
                            </div>
                        ) : (
                            <>
                                {messages.map(m => (
                                    <div key={m.id} style={{
                                        marginBottom: '10px',
                                        textAlign: m.sender === 'me' ? 'right' : 'left'
                                    }}>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '8px 16px',
                                            borderRadius: '16px',
                                            background: m.sender === 'me' ? colorPrimary : '#f0f0f0',
                                            color: m.sender === 'me' ? '#fff' : 'inherit',
                                            maxWidth: '70%',
                                            textAlign: 'left'
                                        }}>
                                            <Text style={{ color: 'inherit' }}>{m.text}</Text>
                                        </div>
                                    </div>
                                ))}
                                {messages.length === 0 && (
                                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#ccc' }}>
                                        Start chatting with {selectedChat.name} (User ID: {selectedChat.userId})
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
                        <Input
                            size="large"
                            placeholder="Type a message..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onPressEnter={handleSend}
                            suffix={
                                <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={handleSend} />
                            }
                        />
                    </div>
                </Content>
            </Layout>
        </div>
    );
};

export default Chat;
