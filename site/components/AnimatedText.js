import React, { useState, useEffect } from 'react';

const AnimatedText = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50); // Speed of typing

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  return (
    <span style={{ 
      color: '#fff',
      fontFamily: 'M PLUS Rounded 1c',
      fontSize: '16px',
      lineHeight: '1.5'
    }}>
      {displayedText}
    </span>
  );
};

export default AnimatedText; 