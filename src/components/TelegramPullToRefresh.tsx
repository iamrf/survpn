import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { hapticImpact } from '@/lib/telegram';

interface TelegramPullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number; // Distance in pixels to trigger refresh
}

/**
 * Pull-to-refresh component with Telegram-style haptic feedback
 */
export function TelegramPullToRefresh({
  onRefresh,
  children,
  disabled = false,
  threshold = 80,
}: TelegramPullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the scrollable area
      if (container.scrollTop > 0) return;
      
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return;

      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);

      // Prevent default scrolling when pulling down
      if (distance > 0 && container.scrollTop === 0) {
        e.preventDefault();
        setPullDistance(distance);

        // Haptic feedback when threshold is reached
        if (distance >= threshold && pullDistance < threshold) {
          hapticImpact('medium');
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        hapticImpact('light');
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }

      isPulling.current = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isRefreshing, onRefresh, threshold, pullDistance]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const shouldShowIndicator = pullDistance > 0 || isRefreshing;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-auto">
      {/* Pull-to-refresh indicator */}
      {shouldShowIndicator && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 transition-transform duration-200"
          style={{
            transform: `translateY(${Math.max(0, pullDistance - 40)}px)`,
            opacity: pullProgress,
          }}
        >
          <div className="flex flex-col items-center gap-2 p-4">
            <RefreshCw
              className={`w-6 h-6 text-primary transition-transform ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={{
                transform: `rotate(${pullProgress * 180}deg)`,
              }}
            />
            {isRefreshing && (
              <span className="text-xs text-muted-foreground font-vazir">
                در حال به‌روزرسانی...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: `translateY(${Math.max(0, pullDistance)}px)`,
          transition: isRefreshing ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
