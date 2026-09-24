"use client";

import React, { useState, useEffect } from "react";

export interface CountdownTimerProps {
  targetDate: string | Date;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
        setIsPast(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsPast(true);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (isPast) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D0D0D] border border-[#FF0000]/40 text-[#FF0000] font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,0,0,0.2)]">
        <span className="h-2 w-2 rounded-full bg-[#FF0000] animate-pulse" />
        EVENT IN PROGRESS / RECENTLY CONCLUDED
      </div>
    );
  }

  const units = [
    { label: "DAYS", value: timeLeft.days },
    { label: "HOURS", value: timeLeft.hours },
    { label: "MINUTES", value: timeLeft.minutes },
    { label: "SECONDS", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 select-none">
      {units.map((unit) => (
        <div
          key={unit.label}
          className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-[#080808]/90 border border-[#222222] min-w-[72px] sm:min-w-[96px] shadow-[0_4px_20px_rgba(0,0,0,0.8)] relative overflow-hidden group hover:border-[#FF0000]/50 transition-colors"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#FF0000]/30 group-hover:bg-[#FF0000] transition-colors" />
          <span className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tight group-hover:text-[#FF0000] transition-colors">
            {String(unit.value).padStart(2, "0")}
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[#A0A0A0] tracking-widest uppercase mt-1">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
};
