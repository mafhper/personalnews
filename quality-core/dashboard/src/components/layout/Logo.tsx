import { cn } from '@/lib/utils';
import { useTheme } from '../ThemeProvider';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <svg 
      width="512" 
      height="512" 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-8 h-8 flex-shrink-0", className)}
    >
      <path d="M390.506 483H31V123.494H390.506V483ZM70.3213 460.531H324.503V452.531H70.3213V460.531ZM102.62 425.848V433.848H262.713V425.848H102.62ZM102.62 407.167H306.247V399.167H102.62V407.167ZM102.62 380.485H236.03V372.485H102.62V380.485ZM102.62 353.802H280.969V345.802H102.62V353.802ZM70.3213 327.121H136.324V319.121H70.3213V327.121ZM70.3213 300.438H351.186V292.438H70.3213V300.438ZM70.3213 273.757H262.713V265.757H70.3213V273.757ZM102.62 247.074H324.503V239.074H102.62V247.074ZM102.62 220.392H306.247V212.392H102.62V220.392ZM70.3213 193.71H236.031V185.71H70.3213V193.71ZM70.3213 167.028H262.713V159.028H70.3213V167.028Z" fill="#2EC195"/>
      <path d="M126.494 387.506H486L390.506 483H31L126.494 387.506Z" fill="black" fill-opacity="0.23"/>
      <path d="M31 123.494L126.494 28H486V387.506L390.506 483H31V123.494Z" fill="#A28F8F" fill-opacity="0.4"/>
      <rect x="126.494" y="28" width="359.506" height="359.506" fill={isDark ? "#F1F7F7" : "#021A1A"}/>
      <rect x="144.75" y="58.8951" width="210.648" height="115.154" rx="8" fill="#02DF82"/>
      <rect x="369.441" y="58.8951" width="98.3025" height="115.154" rx="8" fill="#02DF82"/>
      <rect x="144.75" y="188.093" width="210.648" height="115.154" rx="8" fill="#02DF82"/>
      <rect width="210.648" height="39.321" rx="8" transform="matrix(1 0 0 -1 144.75 356.611)" fill="#02DF82"/>
      <rect x="369.441" y="188.093" width="98.3025" height="168.519" rx="8" fill="#02DF82"/>
    </svg>
  );
}