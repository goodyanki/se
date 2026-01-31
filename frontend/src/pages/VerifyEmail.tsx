import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Form, Input, Button, Typography, Result, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const VerifyEmail: React.FC = () => {
    const { verifyEmail, sendVerificationCode, user, isLoading } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<'email' | 'code'>('email');
    const [email, setEmail] = useState('');

    const onFinishEmail = async (values: any) => {
        try {
            await sendVerificationCode(values.email);
            setEmail(values.email);
            setStep('code');
            message.success('Verification code sent to your email!');
        } catch (error) {
            message.error('Failed to send code. Please try again.');
        }
    };

    const onFinishCode = async (values: any) => {
        try {
            await verifyEmail(email, values.code);
            message.success('Verification successful!');
            navigate('/profile');
        } catch (error) {
            message.error('Invalid verification code.');
        }
    };

    if (user?.isVerified) {
        return (
            <div className="container" style={{ padding: '4rem 1rem' }}>
                <Result
                    status="success"
                    title="Successfully Verified"
                    subTitle="You have full access to CampusMarket."
                    extra={[
                        <Button type="primary" key="home" onClick={() => navigate('/')}>
                            Go Home
                        </Button>,
                        <Button key="profile" onClick={() => navigate('/profile')}>
                            My Profile
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '500px', margin: '0 auto' }}>
            <Card>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <Title level={2}>Campus Verification</Title>
                    <Paragraph type="secondary">
                        To ensure trust, all users must verify their campus email address.
                    </Paragraph>
                </div>

                {step === 'email' ? (
                    <Form onFinish={onFinishEmail} layout="vertical">
                        <Form.Item
                            name="email"
                            label="School Email"
                            rules={[
                                { required: true, message: 'Please input your email!' },
                                { type: 'email', message: 'The input is not valid E-mail!' }
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined />}
                                placeholder="your_name@e.ntu.edu.sg"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
                                Send Verification Code
                            </Button>
                        </Form.Item>
                    </Form>
                ) : (
                    <Form onFinish={onFinishCode} layout="vertical">
                        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                            <Paragraph>
                                Enter the 6-digit code sent to <strong>{email}</strong>
                            </Paragraph>
                        </div>
                        <Form.Item
                            name="code"
                            label="Verification Code"
                            rules={[{ required: true, message: 'Please input the code!' }]}
                        >
                            <Input
                                placeholder="123456"
                                size="large"
                                maxLength={6}
                                style={{ textAlign: 'center', letterSpacing: '4px' }}
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
                                Verify Code
                            </Button>
                            <Button type="link" block onClick={() => setStep('email')} disabled={isLoading}>
                                Change Email
                            </Button>
                        </Form.Item>
                    </Form>
                )}
            </Card>
        </div>
    );
};

export default VerifyEmail;
