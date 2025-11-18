interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const Loading = ({ size = 'md', text }: LoadingProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div
        className={`${sizeClasses[size]} border-primary-600 border-t-transparent rounded-full animate-spin`}
      />
      {text && (
        <p className="mt-4 text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
};

export default Loading;
