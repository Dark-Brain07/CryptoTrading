'use client';

import React from 'react';

interface TokenIconProps {
  ticker: string;
  className?: string;
  size?: number;
}

export function TokenIcon({ ticker, className = 'w-7 h-7', size = 28 }: TokenIconProps) {
  const norm = (ticker || '').toUpperCase().trim();
  const baseTicker = norm.replace(/C$/, ''); // Remove 'c' suffix for tokenized stocks (e.g., NVDAc -> NVDA)

  switch (baseTicker) {
    case 'ETH':
    case 'WETH':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#627EEA" />
          <path fill="#FFFFFF" fillOpacity="0.6" d="M16.498 4v8.87l7.497 3.35z" />
          <path fill="#FFFFFF" d="M16.498 4L9 16.22l7.498-3.35z" />
          <path fill="#FFFFFF" fillOpacity="0.6" d="M16.498 21.968v6.027L24 17.616z" />
          <path fill="#FFFFFF" d="M16.498 27.995v-6.028L9 17.616z" />
          <path fill="#FFFFFF" fillOpacity="0.2" d="M16.498 20.573l7.497-4.353-7.497-3.348z" />
          <path fill="#FFFFFF" fillOpacity="0.6" d="M9 16.22l7.498 4.353v-7.701z" />
        </svg>
      );

    case 'USDC':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#2775CA" />
          <path
            fill="#FFFFFF"
            d="M16 6.5C10.75 6.5 6.5 10.75 6.5 16s4.25 9.5 9.5 9.5 9.5-4.25 9.5-9.5S21.25 6.5 16 6.5zm0 17.2c-4.25 0-7.7-3.45-7.7-7.7s3.45-7.7 7.7-7.7 7.7 3.45 7.7 7.7-3.45 7.7-7.7 7.7z"
          />
          <path
            fill="#FFFFFF"
            d="M16.7 13.8c-1.3-.3-1.8-.6-1.8-1.2 0-.6.6-1 1.5-1 1 0 1.9.4 2.5.9l1.1-1.4c-.8-.7-1.9-1.2-3.1-1.3V8.5h-1.8v1.3c-1.7.3-2.9 1.4-2.9 2.8 0 1.8 1.4 2.5 3.3 2.9 1.4.3 1.8.7 1.8 1.3 0 .7-.7 1.1-1.7 1.1-1.2 0-2.3-.5-3-1.2l-1.1 1.4c.9.9 2.2 1.5 3.6 1.6v1.4h1.8v-1.4c1.8-.3 3-1.5 3-2.9 0-1.7-1.3-2.5-3.3-2.9z"
          />
        </svg>
      );

    case 'CBBTC':
    case 'BTC':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#F7931A" />
          <path
            fill="#FFFFFF"
            d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.792.41.018.025-1.256-.314-1.256-.314l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.701 2.812 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.537c-.535 2.146-4.15 1.014-5.323.722l.95-3.808c1.173.293 4.927.872 4.373 3.086zm.535-5.579c-.488 1.953-3.498.96-4.478.716l.86-3.45c.98.244 4.128.7 3.618 2.734z"
          />
        </svg>
      );

    case 'AERO':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#0052FF" />
          <path fill="#FFFFFF" d="M16 6L7 22h4.5l4.5-8.5 4.5 8.5H25L16 6zm0 7.5L13.2 19h5.6L16 13.5z" />
        </svg>
      );

    case 'VIRTUAL':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#0A0B0E" />
          <path fill="#00FFA3" d="M16 7l7 12-3.5 6H12.5L9 19l7-12z" />
          <circle cx="16" cy="17" r="3" fill="#FFFFFF" />
        </svg>
      );

    case 'DEGEN':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#A36EFD" />
          <path fill="#FFFFFF" d="M10 18h12v4H10zm2-8h8v6h-8zm-4 12h16v2H8z" />
        </svg>
      );

    case 'NVDA':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#76B900" />
          <path
            fill="#FFFFFF"
            d="M16 9c-3.87 0-7 3.13-7 7s3.13 7 7 7c2.9 0 5.4-1.76 6.47-4.27h-2.31A4.84 4.84 0 0 1 16 20.84c-2.67 0-4.84-2.17-4.84-4.84s2.17-4.84 4.84-4.84c1.84 0 3.44 1.04 4.23 2.56h2.24C21.47 10.96 18.96 9 16 9zm0 4.16c-1.57 0-2.84 1.27-2.84 2.84s1.27 2.84 2.84 2.84c1.17 0 2.18-.71 2.61-1.72h-2.61v-1.12h3.94c.03.22.06.44.06.68 0 2.21-1.79 4-4 4-2.21 0-4-1.79-4-4s1.79-4 4-4c1.47 0 2.76.8 3.44 1.98l-1.04.58c-.52-.89-1.46-1.44-2.4-1.44z"
          />
        </svg>
      );

    case 'TSLA':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#E82127" />
          <path
            fill="#FFFFFF"
            d="M16 11.2c2.2 0 4.7.4 6.8 1.4l.7-2.4C21.2 9.4 18.5 9 16 9s-5.2.4-7.5 1.2l.7 2.4c2.1-1 4.6-1.4 6.8-1.4zm0 2.6c-2.5 0-5.1.7-6.9 1.8l.6 2.1c1.8-.9 4.1-1.5 6.3-1.5s4.5.6 6.3 1.5l.6-2.1c-1.8-1.1-4.4-1.8-6.9-1.8zm-1.2 5.2v8h2.4V19c1.9.1 3.8.5 5.5 1.2l.6-2.2c-2.2-.9-4.8-1.4-7.3-1.4s-5.1.5-7.3 1.4l.6 2.2c1.7-.7 3.6-1.1 5.5-1.2z"
          />
        </svg>
      );

    case 'AAPL':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#1E293B" />
          <path
            fill="#FFFFFF"
            d="M18.8 8.4c.6-.8 1-1.9.9-3-.9.1-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3zm2.7 6.4c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.4-.1-2.8.8-3.5.8-.8 0-1.9-.8-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.4-.9-2.4-3.5z"
          />
        </svg>
      );

    case 'META':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#0668E1" />
          <path
            fill="#FFFFFF"
            d="M21.2 11c-1.8 0-3.3 1.1-4.1 2.6-.4-.7-.9-1.3-1.5-1.7-1.1-.7-2.4-.9-3.7-.6-2.5.5-4.4 2.8-4.4 5.3 0 3 2.3 5.4 5.2 5.4 1.8 0 3.3-1.1 4.1-2.6.4.7.9 1.3 1.5 1.7 1.1.7 2.4.9 3.7.6 2.5-.5 4.4-2.8 4.4-5.3 0-3-2.3-5.4-5.2-5.4zm-8.7 8.7c-1.8 0-3.2-1.4-3.2-3.2s1.4-3.2 3.2-3.2c1.2 0 2.3.7 2.8 1.8l-1.3 2.3c-.3-.5-.8-.8-1.4-.8-.8 0-1.5.6-1.5 1.4s.6 1.4 1.4 1.4c.5 0 1-.3 1.2-.7l1.7.9c-.7 1.3-1.7 2.1-2.9 2.1zm8.7 0c-1.2 0-2.2-.8-2.9-2.1l1.7-.9c.3.5.7.7 1.2.7.8 0 1.4-.6 1.4-1.4s-.6-1.4-1.5-1.4c-.6 0-1.1.3-1.4.8l-1.3-2.3c.5-1.1 1.6-1.8 2.8-1.8 1.8 0 3.2 1.4 3.2 3.2s-1.4 3.2-3.2 3.2z"
          />
        </svg>
      );

    case 'GOOGL':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#FFFFFF" />
          <path
            fill="#4285F4"
            d="M24.6 16.2c0-.6-.1-1.2-.2-1.7H16v3.3h4.8c-.2 1.1-.9 2.1-1.8 2.7v2.3h2.9c1.7-1.6 2.7-3.9 2.7-6.6z"
          />
          <path
            fill="#34A853"
            d="M16 25c2.4 0 4.5-.8 6-2.2l-2.9-2.3c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H7.9v2.3C9.4 22.8 12.4 25 16 25z"
          />
          <path
            fill="#FBBC05"
            d="M10.9 17.6c-.2-.6-.3-1.1-.3-1.6 0-.6.1-1.2.3-1.6V12.1H7.9c-.6 1.2-1 2.6-1 3.9s.4 2.7 1 3.9l3-2.3z"
          />
          <path
            fill="#EA4335"
            d="M16 10.2c1.3 0 2.5.5 3.4 1.4l2.6-2.6C20.4 7.6 18.4 7 16 7 12.4 7 9.4 9.2 7.9 12.1l3 2.3c.7-2.2 2.7-4.2 5.1-4.2z"
          />
        </svg>
      );

    case 'AMZN':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#232F3E" />
          <path
            fill="#FF9900"
            d="M9 20.5c4.5 2.5 10 2.5 14 0 .3-.2.7.1.4.5-3.8 3.2-10.2 3.2-14.8 0-.4-.3 0-.7.4-.5z"
          />
          <path
            fill="#FF9900"
            d="M23.5 19.5c-.3.4-1.2 1.1-2 1.2-.2 0-.3-.2-.1-.4.5-.6 1.3-1.1 1.7-1.7.1-.1.3 0 .4.2.1.2.1.5 0 .7z"
          />
          <path
            fill="#FFFFFF"
            d="M13.5 12h2.2v4.8c0 .8.4 1.2 1.1 1.2.6 0 1.2-.4 1.5-1.1V12h2.2v6.5h-2v-.9c-.6.7-1.4 1.1-2.3 1.1-1.5 0-2.7-.9-2.7-2.6V12z"
          />
        </svg>
      );

    case 'MSFT':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#F1F5F9" />
          <rect x="8.5" y="8.5" width="6.5" height="6.5" fill="#F25022" />
          <rect x="17" y="8.5" width="6.5" height="6.5" fill="#7FBA00" />
          <rect x="8.5" y="17" width="6.5" height="6.5" fill="#00A4EF" />
          <rect x="17" y="17" width="6.5" height="6.5" fill="#FFB900" />
        </svg>
      );

    case 'MSTR':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#D9272E" />
          <path fill="#FFFFFF" d="M9 9h3.5l3.5 6.5L19.5 9H23v14h-3.2v-8.5L16.5 20h-1L12.2 14.5V23H9V9z" />
        </svg>
      );

    case 'SNDK':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#ED1C24" />
          <path
            fill="#FFFFFF"
            d="M11 11c1.5-1.2 3.2-1.8 5-1.8 4 0 6.5 2.2 6.5 5.5 0 2.5-1.5 4.2-4.5 5.2l-1.5.5c-1.8.6-2.5 1.2-2.5 2.2 0 1.2 1.2 2 3 2 1.8 0 3.2-.6 4.5-1.8l1.5 2c-1.8 1.5-3.8 2.2-6 2.2-4.2 0-7-2.4-7-6 0-2.8 1.8-4.5 4.8-5.5l1.5-.5c1.5-.5 2.2-1.1 2.2-2 0-1-.8-1.8-2.5-1.8-1.5 0-2.8.5-4 1.5L11 11z"
          />
        </svg>
      );

    case 'SPCX':
      return (
        <svg viewBox="0 0 32 32" className={className} width={size} height={size}>
          <circle cx="16" cy="16" r="16" fill="#005288" />
          <path
            fill="#FFFFFF"
            d="M10 10l5 6-5 6h3l3.5-4.5L20 22h3l-5-6 5-6h-3l-3.5 4.5L13 10h-3z"
          />
        </svg>
      );

    default:
      return (
        <div
          className={`${className} rounded-full bg-base-blue/15 border border-base-blue/30 flex items-center justify-center font-bold text-base-blue text-[10px] uppercase font-mono shrink-0 shadow-sm`}
          style={{ width: size, height: size }}
        >
          {norm.substring(0, 3)}
        </div>
      );
  }
}
