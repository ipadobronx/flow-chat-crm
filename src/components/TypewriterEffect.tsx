import { useState, useEffect } from "react";

interface TypewriterEffectProps {
  messages: string[];
  speed?: number;
  deleteSpeed?: number;
  pauseTime?: number;
}

export function TypewriterEffect({ 
  messages, 
  speed = 100, 
  deleteSpeed = 50, 
  pauseTime = 2000 
}: TypewriterEffectProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseTime);
      return () => clearTimeout(pauseTimer);
    }

    const currentMessage = messages[currentMessageIndex];
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (currentText.length < currentMessage.length) {
          setCurrentText(currentMessage.slice(0, currentText.length + 1));
        } else {
          // Finished typing, start pause
          setIsPaused(true);
        }
      } else {
        // Deleting
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          // Finished deleting, move to next message
          setIsDeleting(false);
          setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        }
      }
    }, isDeleting ? deleteSpeed : speed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, isPaused, currentMessageIndex, messages, speed, deleteSpeed, pauseTime]);

  return (
    <div className="min-h-[60px] flex items-center">
      <span className="text-2xl font-medium text-white">
        {currentText}
        <span className="animate-pulse">|</span>
      </span>
    </div>
  );
}