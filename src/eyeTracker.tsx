
import React, { useEffect, useRef } from 'react';

const EyeTracker: React.FC = () => {
  const anchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const handleMove = (event: MouseEvent) => {
      const pupils = anchor.querySelectorAll<HTMLElement>('.pupil');

      pupils.forEach((pupil) => {
        const rect = pupil.getBoundingClientRect();
        const pupilX = rect.left + rect.width / 2;
        const pupilY = rect.top + rect.height / 2;

        const dx = event.clientX - pupilX;
        const dy = event.clientY - pupilY;

        const distance = Math.sqrt(dx*dx+dy*dy);

        const maxOffset = 50;

        const factor = Math.min(maxOffset, distance) / distance;

        const offsetX = dx *factor;
        const offsetY = dy *factor;
        
        pupil.style.transform = `translate(${offsetX * 0.2}px, ${offsetY * 0.2}px)`;
      });

       
    };

    document.addEventListener('mousemove', handleMove);
    return () => document.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div
      ref={anchorRef}
      className="anchor"
      style={{ position: 'relative', width: 150, height: 100 }}>

      <div className = "eye" style={{...eyeStyle, right: 'auto', left: -15 }}>
        <div className="pupil" style={pupilStyle}></div>
      </div>

      <div className = "eye" style={{ ...eyeStyle, right: -15, left: 'auto' }}>
        <div className="pupil" style={pupilStyle}></div>
      </div>
      
    </div>
  );
};

function calculateAngle(cx: number, cy: number, ex: number, ey: number) {
  const dy = ey - cy;
  const dx = ex - cx;
  const theta = Math.atan2(dy, dx);
  let angle = (theta * 180) / Math.PI;
  if (angle < 0) angle += 360;
  return angle;
}

const eyeStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: 50,
  height: 50,
  borderRadius: '35%',
  background: '#fff',
  transformOrigin: '50% 50%',
};

const pupilStyle: React.CSSProperties = {
  position: 'absolute',
  left: 15,
  top: 15,
  width: 20,
  height: 20,
  borderRadius: '35%',
  background: '#000',
}

export default EyeTracker;