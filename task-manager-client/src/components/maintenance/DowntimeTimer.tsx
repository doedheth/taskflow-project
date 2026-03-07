import { useState, useEffect } from 'react';
import { parseISO, differenceInSeconds } from 'date-fns';

interface DowntimeTimerProps {
  startTime: string;
  endTime?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSeconds?: boolean;
  color?: 'red' | 'blue' | 'gray';
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

const colorClasses = {
  red: 'text-red-600 dark:text-red-400',
  blue: 'text-blue-600 dark:text-blue-400',
  gray: 'text-gray-900 dark:text-white',
};

export default function DowntimeTimer({
  startTime,
  endTime,
  size = 'md',
  showSeconds = true,
  color = 'red',
}: DowntimeTimerProps) {
  const [duration, setDuration] = useState('0:00:00');

  useEffect(() => {
    const calculateDuration = () => {
      try {
        const start = parseISO(startTime);
        const end = endTime ? parseISO(endTime) : new Date();
        const totalSeconds = Math.max(0, differenceInSeconds(end, start));
        
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (showSeconds) {
          if (hours > 0) {
            setDuration(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          } else {
            setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
          }
        } else {
          if (hours > 0) {
            setDuration(`${hours}j ${minutes}m`);
          } else {
            setDuration(`${minutes}m`);
          }
        }
      } catch {
        setDuration('0:00:00');
      }
    };

    calculateDuration();

    // Only update if there's no end time (still running)
    if (!endTime) {
      const interval = setInterval(calculateDuration, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, endTime, showSeconds]);

  return (
    <div className={`font-mono font-bold ${sizeClasses[size]} ${colorClasses[color]}`}>
      {duration}
    </div>
  );
}


