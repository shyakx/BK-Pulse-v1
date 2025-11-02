import React, { useState, useEffect, useRef } from 'react';
import { MdTrendingUp, MdTrendingDown, MdWarning, MdCheckCircle } from 'react-icons/md';

const ChurnOverviewCard = ({ title, value, change, trend, icon, color = 'primary', delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState('0');
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);
  const getIcon = () => {
    switch (icon) {
      case 'trending-up':
        return <MdTrendingUp />;
      case 'trending-down':
        return <MdTrendingDown />;
      case 'warning':
        return <MdWarning />;
      case 'check':
        return <MdCheckCircle />;
      default:
        return <MdTrendingUp />;
    }
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-success';
    if (trend === 'down') return 'text-danger';
    return 'text-muted';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <MdTrendingUp className="ms-1" />;
    if (trend === 'down') return <MdTrendingDown className="ms-1" />;
    return null;
  };

  // Animate number counting - trigger on mount and value changes
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          // Apply delay before showing
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [isVisible, delay]);

  // Reset animation when value changes
  useEffect(() => {
    if (value && value !== displayValue) {
      setIsVisible(false);
      // Trigger animation again after a brief delay
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [value]);

  useEffect(() => {
    if (!isVisible) return;

    // Extract numeric value from the display string (handles commas, %, $, etc.)
    const numericValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^0-9.]/g, '')) || 0
      : parseFloat(value) || 0;

    if (isNaN(numericValue)) {
      setDisplayValue(value);
      return;
    }

    // Check if value contains % or currency symbol
    const isPercentage = typeof value === 'string' && value.includes('%');
    const isCurrency = typeof value === 'string' && (value.includes('$') || value.includes('RWF'));
    
    const duration = 1500; // Animation duration in ms
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      current = Math.min(increment * stepCount, numericValue);
      
      // Format the number
      let formatted;
      if (isPercentage) {
        formatted = `${Math.floor(current)}%`;
      } else if (isCurrency) {
        formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: isCurrency ? 1 : 0,
          maximumFractionDigits: isCurrency ? 1 : 0
        }).format(current);
      } else {
        formatted = Math.floor(current).toLocaleString();
      }

      setDisplayValue(formatted);

      if (stepCount >= steps) {
        // Ensure final value is exactly the target
        if (isPercentage) {
          setDisplayValue(value);
        } else if (isCurrency) {
          setDisplayValue(value);
        } else {
          setDisplayValue(typeof value === 'string' ? value : numericValue.toLocaleString());
        }
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  return (
    <div 
      ref={cardRef}
      className="bk-card h-100 dashboard-card"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        borderRadius: '0.5rem'
      }}
    >
      <div className="bk-card-body" style={{ padding: '1rem' }}>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div 
            className={`bg-${color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center`}
            style={{ 
              width: '36px', 
              height: '36px',
              transition: 'transform 0.3s ease',
              animation: isVisible ? 'iconPulse 0.6s ease-out 0.3s both' : 'none'
            }}
          >
            <span className={`text-${color}`} style={{ fontSize: '1.1rem' }}>
              {getIcon()}
            </span>
          </div>
          <div className={`${getTrendColor()}`} style={{ fontSize: '0.75rem' }}>
            {change}
            {getTrendIcon()}
          </div>
        </div>
        
        <h4 className="fw-bold mb-1" style={{ transition: 'color 0.3s ease', fontSize: '1.5rem', lineHeight: '1.3' }}>
          {displayValue}
        </h4>
        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>{title}</p>
      </div>
      
      <style>{`
        @keyframes iconPulse {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .dashboard-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15) !important;
          transition: transform 0.3s ease, box-shadow 0.3s ease !important;
        }
        
        .dashboard-card {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default ChurnOverviewCard;

