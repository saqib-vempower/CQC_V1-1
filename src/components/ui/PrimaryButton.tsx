
import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}

const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  className = '',
  onClick,
  href,
}) => {
  const commonClasses = `inline-flex items-center justify-center text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[0.98] px-5 py-3 rounded-xl shadow-md transition cursor-pointer pointer-events-auto ${className}`;

  if (href) {
    return (
      <Link href={href} className={commonClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={commonClasses}>
      {children}
    </button>
  );
};

export default PrimaryButton;
