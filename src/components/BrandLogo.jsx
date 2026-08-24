import React from 'react';
import { Link } from 'react-router-dom';
import logoMark from '../assets/logo-mark.png';

const SIZE_MAP = {
  xs: { icon: 'w-7 h-7', text: 'text-sm' },
  sm: { icon: 'w-8 h-8', text: 'text-base' },
  md: { icon: 'w-9 h-9', text: 'text-xl' },
  lg: { icon: 'w-11 h-11', text: 'text-2xl' },
};

export default function BrandLogo({
  to = '/',
  size = 'md',
  dark = false,
  showText = true,
  className = '',
  onClick,
}) {
  const sizes = SIZE_MAP[size] || SIZE_MAP.md;
  const textColor = dark ? 'text-white' : 'text-[#0B1F3A]';

  const content = (
    <>
      <img
        src={logoMark}
        alt=""
        aria-hidden="true"
        className={`${sizes.icon} rounded-full object-cover shrink-0 select-none`}
      />
      {showText && (
        <span className={`${sizes.text} ${textColor} font-bold font-display tracking-tight leading-none whitespace-nowrap`}>
          Printers <span className="text-[#E53935]">Companion</span>
        </span>
      )}
    </>
  );

  if (!to) {
    return <div className={`flex items-center gap-2.5 ${className}`}>{content}</div>;
  }

  return (
    <Link to={to} onClick={onClick} className={`flex items-center gap-2.5 w-fit ${className}`} aria-label="Printers Companion home">
      {content}
    </Link>
  );
}
