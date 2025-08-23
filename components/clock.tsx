"use client";
import { useEffect, useState } from "react";

export default function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = ((now.getHours() + 11) % 12 + 1).toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      const ampm = now.getHours() >= 12 ? "PM" : "AM";
      setTime(`${hours}:${minutes}:${seconds} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-2xl lg:text-3xl font-mono font-extrabold text-pink-600 tracking-widest
                     bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500
                     bg-clip-text text-transparent
                     animate-pulse">
      {time}
    </span>
  );
}
