import React from 'react';
import { Input as AntInput, InputProps as AntInputProps } from 'antd';

interface CustomInputProps extends AntInputProps {
    label?: string;
    error?: string;
}

const Input: React.FC<CustomInputProps> = ({ label, error, style, ...props }) => {
    return (
        <div style={{ marginBottom: '1rem', width: '100%' }}>
            {label && (
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 500,
                    color: '#6C757D' // text-secondary
                }}>
                    {label}
                </label>
            )}
            <AntInput
                size="large"
                status={error ? 'error' : ''}
                style={{ ...style }}
                {...props}
            />
            {error && <span style={{ color: '#ff4d4f', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{error}</span>}
        </div>
    );
};

export default Input;
