import React from 'react';
import { Card as AntCard, CardProps as AntCardProps } from 'antd';

interface CustomCardProps extends AntCardProps {
    children: React.ReactNode;
    onClick?: () => void;
    hoverable?: boolean;
}

const Card: React.FC<CustomCardProps> = ({ children, className = '', onClick, hoverable = false, style, ...props }) => {
    return (
        <AntCard
            className={className}
            hoverable={hoverable || !!onClick}
            onClick={onClick}
            style={{ borderRadius: '8px', ...style }}
            {...props}
        >
            {children}
        </AntCard>
    );
};

export default Card;
