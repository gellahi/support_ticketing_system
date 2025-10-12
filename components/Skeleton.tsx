import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = true
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded',
    circular: 'rounded-full'
  };

  const animationClasses = animation ? 'animate-pulse' : '';

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton components for common use cases
export const SkeletonText: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton {...props} variant="text" />
);

export const SkeletonRectangular: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton {...props} variant="rectangular" />
);

export const SkeletonCircular: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton {...props} variant="circular" />
);

// Card skeleton for ticket/dashboard cards
export const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="space-y-4">
      <SkeletonText className="w-3/4" />
      <SkeletonText className="w-1/2" />
      <div className="flex space-x-2">
        <SkeletonCircular width={24} height={24} />
        <SkeletonText className="w-20" />
      </div>
    </div>
  </div>
);

// Table row skeleton
export const SkeletonTableRow: React.FC = () => (
  <tr className="border-b border-gray-200 dark:border-gray-700">
    <td className="px-6 py-4">
      <SkeletonText className="w-32" />
    </td>
    <td className="px-6 py-4">
      <SkeletonText className="w-24" />
    </td>
    <td className="px-6 py-4">
      <SkeletonText className="w-20" />
    </td>
    <td className="px-6 py-4">
      <SkeletonText className="w-16" />
    </td>
  </tr>
);

// List item skeleton
export const SkeletonListItem: React.FC = () => (
  <div className="flex items-center space-x-4 p-4 border-b border-gray-200 dark:border-gray-700">
    <SkeletonCircular width={40} height={40} />
    <div className="flex-1 space-y-2">
      <SkeletonText className="w-3/4" />
      <SkeletonText className="w-1/2" />
    </div>
    <SkeletonText className="w-16" />
  </div>
);

// Dashboard stats skeleton
export const SkeletonStats: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonText className="w-20" />
            <SkeletonText className="w-12 text-2xl" />
          </div>
          <SkeletonCircular width={48} height={48} />
        </div>
      </div>
    ))}
  </div>
);

// Form skeleton
export const SkeletonForm: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <SkeletonText className="w-24" />
      <SkeletonRectangular className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <SkeletonText className="w-32" />
      <SkeletonRectangular className="h-24 w-full" />
    </div>
    <div className="flex space-x-4">
      <SkeletonRectangular className="h-10 w-24" />
      <SkeletonRectangular className="h-10 w-20" />
    </div>
  </div>
);