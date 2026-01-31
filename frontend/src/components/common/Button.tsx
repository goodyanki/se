import React from 'react';
import { Button as AntButton, type ButtonProps as AntButtonProps } from 'antd';

interface CustomButtonProps extends Omit<AntButtonProps, 'variant'> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    isLoading?: boolean;
}

const Button: React.FC<CustomButtonProps> = ({
    children,
    variant = 'primary',
    isLoading = false,
    ...props
}) => {
    // Map our custom variants to Ant Design types
    let type: AntButtonProps['type'] = 'default';
    let danger = false;
    let style: React.CSSProperties = {};

    switch (variant) {
        case 'primary':
            type = 'primary';
            break;
        case 'secondary':
            // Ant Design doesn't have a direct "secondary" type that matches orange/accent easily without theme config, 
            // but we can use default with custom style or ghost.
            // Or we can rely on proper theme tokens. Let's use 'default' with custom class or style for now to match the orange.
            style = { borderColor: '#FF8C00', color: '#FF8C00' };
            break;
        case 'outline':
            type = 'default';
            break;
        case 'danger':
            type = 'primary';
            danger = true;
            break;
    }

    // If using secondary (orange), we might want a solid orange button?
    if (variant === 'secondary') {
        style = { backgroundColor: '#FF8C00', borderColor: '#FF8C00', color: 'white' };
        type = 'primary'; // to get the solid feel structure, but override color
    }

    return (
        <AntButton
            type={type}
            danger={danger}
            loading={isLoading}
            style={style}
            size="large"
            {...props}
        >
            {children}
        </AntButton>
    );
};

export default Button;
