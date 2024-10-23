import type React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', color = '#D4A574' }) => {
  const sizeClass = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
  }[size];

  return (
    <div className={`relative ${sizeClass}`}>
      <div className={`absolute inset-0 border-4 border-${color} rounded-full animate-pulse`} />
      <div className={`absolute inset-3 border-4 border-${color} rounded-full animate-pulse delay-150`} />
      <div className={`absolute inset-6 border-4 border-${color} rounded-full animate-pulse delay-300`} />
    </div>
  );
};
