import React, { useState, useEffect, useRef } from 'react';
import { MdTrendingUp, MdTrendingDown, MdWarning, MdCheckCircle, MdPeople, MdBarChart, MdStorage, MdAnalytics } from 'react-icons/md';

const ChurnOverviewCard = ({ title, value, change, trend, icon, color = 'primary', delay = 0 }) => {
  // Initialize displayValue with the actual value to prevent flickering
  const getInitialDisplayValue = () => {
    if (typeof value === 'string' && (value.includes('%') || value.includes('$') || value.includes('RWF'))) {
      return value;
    }
    const numValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^0-9.]/g, '')) || 0
      : parseFloat(value) || 0;
    return numValue.toLocaleString();
  };
  
  const [displayValue, setDisplayValue] = useState(() => getInitialDisplayValue());
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
      case 'people':
        return <MdPeople />;
      case 'analytics':
        return <MdAnalytics />;
      case 'storage':
        return <MdStorage />;
      case 'bar-chart':
        return <MdBarChart />;
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
  // Removed IntersectionObserver to prevent cards from disappearing
  // Cards are now always visible for stability

  // Track previous value to detect actual changes (not just animation updates)
  const prevValueRef = useRef(value);
  const animationTimerRef = useRef(null);
  
  // Initialize prevValueRef on mount (only once)
  useEffect(() => {
    if (prevValueRef.current === undefined || prevValueRef.current === null) {
      prevValueRef.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  useEffect(() => {
    // Clear any existing animation
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    // Extract numeric value from the display string (handles commas, %, $, etc.)
    const numericValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^0-9.]/g, '')) || 0
      : parseFloat(value) || 0;

    // Get previous value's numeric equivalent
    const prevNumericValue = typeof prevValueRef.current === 'string'
      ? parseFloat(prevValueRef.current.toString().replace(/[^0-9.]/g, '')) || 0
      : parseFloat(prevValueRef.current) || 0;

    // If value hasn't actually changed, don't re-animate
    if (Math.abs(numericValue - prevNumericValue) < 0.01) {
      // Still update displayValue if format changed
      if (prevValueRef.current !== value) {
        setDisplayValue(value);
        prevValueRef.current = value;
      }
      return;
    }

    if (isNaN(numericValue)) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    // Check if value contains % or currency symbol
    const isPercentage = typeof value === 'string' && value.includes('%');
    const isCurrency = typeof value === 'string' && (value.includes('$') || value.includes('RWF'));
    
    const duration = 800; // Shorter duration for smoother updates
    const steps = 40;
    const startValue = prevNumericValue;
    const endValue = numericValue;
    const increment = (endValue - startValue) / steps;
    let stepCount = 0;

    animationTimerRef.current = setInterval(() => {
      stepCount++;
      const current = Math.min(startValue + (increment * stepCount), endValue);
      
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
        setDisplayValue(value);
        prevValueRef.current = value;
        if (animationTimerRef.current) {
          clearInterval(animationTimerRef.current);
          animationTimerRef.current = null;
        }
      }
    }, duration / steps);

    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, [value]); // Removed isVisible and displayValue from dependencies to prevent infinite loops

  return (
    <div 
      ref={cardRef}
      className="bk-card h-100 dashboard-card"
      style={{
        opacity: 1, // Always visible to prevent flickering
        transform: 'translateY(0)',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        borderRadius: '0.5rem',
        minHeight: '120px' // Prevent layout shift
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
              animation: 'iconPulse 0.6s ease-out 0.3s both'
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

