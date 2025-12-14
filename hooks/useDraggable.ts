import React, { useRef, useCallback, useEffect, useState } from 'react';
import { NotePosition } from '../types';

interface DragOptions {
  initialPosition: NotePosition;
  onDragEnd: (pos: NotePosition) => void;
  onDragStart?: () => void;
}

export const useDraggable = ({ initialPosition, onDragEnd, onDragStart }: DragOptions) => {
  // We use specific refs to track state without triggering re-renders during the drag loop
  const ref = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  
  // To update UI for cursor styles, we still need one state, but we won't use it for position
  const [isActive, setIsActive] = useState(false);

  // Store starting values
  const startPos = useRef({ x: 0, y: 0 }); // Mouse position
  const startFrame = useRef({ x: 0, y: 0, width: 0, height: 0 }); // Element position/size

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (onDragStart) onDragStart();
    
    isDragging.current = true;
    setIsActive(true);
    
    startPos.current = { x: e.clientX, y: e.clientY };
    startFrame.current = { ...initialPosition };
    
    // Remove transition during drag for instant response
    if (ref.current) {
        ref.current.style.transition = 'none';
    }
  }, [initialPosition, onDragStart]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onDragStart) onDragStart();

    isResizing.current = true;
    setIsActive(true);
    
    startPos.current = { x: e.clientX, y: e.clientY };
    startFrame.current = { ...initialPosition };

    if (ref.current) {
        ref.current.style.transition = 'none';
    }
  }, [initialPosition, onDragStart]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current && !isResizing.current) return;
      if (!ref.current) return;

      // Calculate deltas
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;

      // Direct DOM manipulation for 60fps performance
      // We do NOT update React state here
      if (isDragging.current) {
        const newX = startFrame.current.x + deltaX;
        const newY = startFrame.current.y + deltaY;
        ref.current.style.transform = `translate(${newX}px, ${newY}px)`;
      } else if (isResizing.current) {
        const newWidth = Math.max(250, startFrame.current.width + deltaX);
        const newHeight = Math.max(200, startFrame.current.height + deltaY);
        ref.current.style.width = `${newWidth}px`;
        ref.current.style.height = `${newHeight}px`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging.current && !isResizing.current) return;

      // Calculate final values to save to store
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;
      
      let finalPos = { ...initialPosition };

      if (isDragging.current) {
         finalPos.x = startFrame.current.x + deltaX;
         finalPos.y = startFrame.current.y + deltaY;
      } else if (isResizing.current) {
         finalPos.width = Math.max(250, startFrame.current.width + deltaX);
         finalPos.height = Math.max(200, startFrame.current.height + deltaY);
      }

      // Reset flags
      isDragging.current = false;
      isResizing.current = false;
      setIsActive(false);

      // Restore transition (optional, depends if we want it to snap or float)
      if (ref.current) {
        ref.current.style.transition = '';
      }

      // Commit to store
      onDragEnd(finalPos);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [initialPosition, onDragEnd]);

  return {
    ref,
    isDragging: isActive,
    handleMouseDown,
    handleResizeStart
  };
};