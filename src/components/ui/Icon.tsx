import type { SVGProps } from 'react';

const PATHS = {
  user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM4 21a8 8 0 0 1 16 0',
  heart: 'M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.700 3.700 4.500 7 4.500c2 0 3.400 1 5 3 1.600-2 3-3 5-3 3.300 0 5.400 3.200 4.200 6.600-1.700 4.800-9.200 9.400-9.200 9.400Z',
  bag: 'M5 8h14l-1 12H6L5 8Zm4 0V6.500a3 3 0 0 1 6 0V8',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'm6 6 12 12M18 6 6 18',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-13v2m0 14v2M3 12h2m14 0h2M5.600 5.600 7 7m10 10 1.400 1.400M5.600 18.400 7 17M17 7l1.400-1.400',
  moon: 'M20 14.500A8 8 0 0 1 9.500 4 8 8 0 1 0 20 14.500Z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4.500 4.500',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.500 2h-15L6 16Zm4 4a2 2 0 0 0 4 0',
  mail: 'M4 6h16v12H4V6Zm0 1 8 6 8-6',
  chat: 'M4 5h16v11H9l-5 4V5Z',
  phone: 'M6.500 3.500 9 3l1.500 4-2 1.500a11 11 0 0 0 6 6L16 12.500l4 1.500-.5 2.500c-.2 1.200-1.300 2-2.500 2A14 14 0 0 1 3 4.500c0-1.200.800-2.300 2-2.500',
  pin: 'M12 21s-6.500-5.800-6.500-11a6.500 6.500 0 0 1 13 0c0 5.200-6.500 11-6.500 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.500-1.500h.01',
  facebook: 'M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v7h4v-7h3l1-4h-4V8.500c0-.300.200-.500.500-.500Z',
  youtube: 'M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8Zm7 1.500v5l4.500-2.500L10 9.500Z',
  whatsapp: 'M4 20l1.300-4.200A8 8 0 1 1 8.300 19L4 20Zm5-11c0 3.500 3 6.500 6.500 6.500l1-1.500-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2L9 9Z',
  shield: 'M12 3 4.500 6v5.500c0 4.500 3 8 7.500 9.500 4.500-1.500 7.500-5 7.500-9.500V6L12 3Zm-3 9 2.500 2.500L15.500 10',
  gem: 'M6 4h12l3 5-9 11L3 9l3-5Zm-3 5h18M9 4l3 5 3-5M9 9l3 11 3-11',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2',
  check: 'm5 12.500 4.500 4.500L19 7.500',
  checkDouble: 'M18 6 7 17l-5-5m20-7-7.5 7.5L13 16',
  alert: 'M12 4 2.500 20h19L12 4Zm0 6v4.500m0 2.500h.01',
  inbox: 'M3 13l3-8h12l3 8v6H3v-6Zm0 0h5l1 2h6l1-2h5',
  arrowRight: 'M5 12h14m-5-5 5 5-5 5',
  arrowLeft: 'M19 12H5m5-5-5 5 5 5',
  chevronDown: 'm6 9 6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4',
  trash: 'M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13',
  package: 'M3 8l9-5 9 5v8l-9 5-9-5V8Zm0 0 9 5 9-5m-9 5v8',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4m-4-4h11',
  dashboard: 'M4 4h7v9H4V4Zm9 0h7v5h-7V4ZM4 15h7v5H4v-5Zm9-4h7v9h-7v-9Z',
  image: 'M4 5h16v14H4V5Zm0 11 4.500-4.500 4 4L16 12l4 4M9 9.500h.01',
  twitter: 'M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z',
} as const;

export type IconName = "twitter" | keyof typeof PATHS;

interface Props extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
