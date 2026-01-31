import React, { useState } from 'react';
import { Input, Button, List, Avatar, Typography, Layout, theme } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;
const { Text } = Typography;

const Chat: React.FC = () => {
    const [messages, setMessages] = useState([
        { id: 1, text: 'Hi, is the book still available?', sender: 'me' },
        { id: 2, text: 'Yes, it is!', sender: 'them' }
    ]);
    const [input, setInput] = useState('');

    const {
        token: { colorBgContainer, colorPrimary },
    } = theme.useToken();

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, { id: Date.now(), text: input, sender: 'me' }]);
        setInput('');
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <Layout style={{ height: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                <Sider width={300} style={{ background: colorBgContainer, borderRight: '1px solid #f0f0f0' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>
                        Conversations
                    </div>
                    <List
                        itemLayout="horizontal"
                        dataSource={[{ name: 'Student_A', lastMsg: 'Yes, it is!' }]}
                        renderItem={item => (
                            <List.Item style={{ padding: '12px 16px', cursor: 'pointer', background: '#e6f7ff' }}>
                                <List.Item.Meta
                                    avatar={<Avatar icon={<UserOutlined />} />}
                                    title={item.name}
                                    description={item.lastMsg}
                                />
                            </List.Item>
                        )}
                    />
                </Sider>

                <Content style={{ background: colorBgContainer, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>
                        Student_A
                    </div>

                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
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
