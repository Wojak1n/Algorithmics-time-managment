import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 32 }: LogoProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="relative">
        <Image
          src="/logo.svg"
          alt="Automated Time Management Logo"
          width={size}
          height={size}
          className="rounded-lg"
        />
      </div>
      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
        Automated Time Management
      </span>
    </div>
  );
}

export function LogoOnly({ className = "", size = 40 }: LogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/logo.svg"
        alt="Automated Time Management"
        width={size}
        height={size}
        className="rounded-lg"
      />
    </div>
  );
}

export function LogoIcon({ className = "", size = 32 }: LogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt="Automated Time Management"
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
    />
  );
}
