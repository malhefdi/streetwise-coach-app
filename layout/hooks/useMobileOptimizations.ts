'use client';

import { useEffect, useState, useCallback } from 'react';

interface UseMobileOptimizationsOptions {
  autoHideDelay?: number;
  scrollThreshold?: number;
  enableFocusMode?: boolean;
}

interface UseMobileOptimizationsReturn {
  isFocusMode: boolean;
  isTopbarHidden: boolean;
  isCompact: boolean;
  toggleFocusMode: () => void;
  showFocusIndicator: boolean;
}

export const useMobileOptimizations = (options: UseMobileOptimizationsOptions = {}): UseMobileOptimizationsReturn => {
  const {
    autoHideDelay = 3000, // 3 seconds
    scrollThreshold = 100, // 100px
    enableFocusMode = true
  } = options;

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isTopbarHidden, setIsTopbarHidden] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [showFocusIndicator, setShowFocusIndicator] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);

  // Load focus mode state from localStorage
  useEffect(() => {
    const savedFocusMode = localStorage.getItem('focusMode');
    if (savedFocusMode === 'true') {
      setIsFocusMode(true);
      setShowFocusIndicator(true);
      // Hide indicator after 3 seconds
      setTimeout(() => setShowFocusIndicator(false), 3000);
    }
  }, []);

  // Save focus mode state to localStorage
  useEffect(() => {
    localStorage.setItem('focusMode', isFocusMode.toString());
  }, [isFocusMode]);

  // Apply focus mode classes to body
  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add('focus-mode');
    } else {
      document.body.classList.remove('focus-mode');
    }

    return () => {
      document.body.classList.remove('focus-mode');
    };
  }, [isFocusMode]);

  // Handle scroll events for auto-hide
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    // Determine scroll direction
    if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
      setScrollDirection('down');
    } else if (currentScrollY < lastScrollY) {
      setScrollDirection('up');
    }
    
    setLastScrollY(currentScrollY);

    // Clear existing timer
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }

    // Set new timer for auto-hide
    const timer = setTimeout(() => {
      if (scrollDirection === 'down' && currentScrollY > scrollThreshold) {
        setIsTopbarHidden(true);
      } else {
        setIsTopbarHidden(false);
      }
    }, autoHideDelay);

    setAutoHideTimer(timer);
  }, [lastScrollY, scrollDirection, scrollThreshold, autoHideDelay, autoHideTimer]);

  // Handle scroll events
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [handleScroll, autoHideTimer]);

  // Handle window resize for compact mode
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 991;
      const isLandscape = window.innerWidth > window.innerHeight;
      
      setIsCompact(isMobile && isLandscape);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Apply classes to topbar
  useEffect(() => {
    const topbar = document.querySelector('.layout-topbar');
    if (topbar) {
      topbar.classList.toggle('auto-hide', isTopbarHidden);
      topbar.classList.toggle('compact', isCompact);
      topbar.classList.toggle('scroll-up', scrollDirection === 'up');
      topbar.classList.toggle('scroll-down', scrollDirection === 'down');
    }
    
    // Apply focus mode class to toggle button
    const focusToggle = document.querySelector('.focus-mode-toggle');
    if (focusToggle) {
      focusToggle.classList.toggle('active', isFocusMode);
    }
  }, [isTopbarHidden, isCompact, scrollDirection, isFocusMode]);

  // Toggle focus mode
  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => {
      const newFocusMode = !prev;
      setShowFocusIndicator(true);
      
      // Hide indicator after 3 seconds
      setTimeout(() => setShowFocusIndicator(false), 3000);
      
      return newFocusMode;
    });
  }, []);

  // Show topbar on mouse move (desktop only)
  useEffect(() => {
    if (window.innerWidth > 991) {
      const handleMouseMove = () => {
        if (isTopbarHidden) {
          setIsTopbarHidden(false);
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isTopbarHidden]);

  // Listen for custom focus mode toggle events
  useEffect(() => {
    const handleToggleFocusMode = () => {
      toggleFocusMode();
    };

    window.addEventListener('toggle-focus-mode', handleToggleFocusMode);
    
    return () => {
      window.removeEventListener('toggle-focus-mode', handleToggleFocusMode);
    };
  }, [toggleFocusMode]);

  return {
    isFocusMode,
    isTopbarHidden,
    isCompact,
    toggleFocusMode,
    showFocusIndicator
  };
};
