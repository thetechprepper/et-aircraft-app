import React from 'react';

export default function Airplane({ heading = 0, flight, altitude, speed, track, isSelected = false, onSelect = () => {} }) {
  return (
    <div
      onClick={onSelect}
      onTouchStart={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transform: `rotate(${heading}deg)`,
        transformOrigin: 'center',
        fontSize: '1.4rem',
        cursor: 'pointer',
        position: 'relative',
      }}
      title={`Flight: ${flight || 'N/A'}
Altitude: ${altitude} ft
Speed: ${speed} kt
Track: ${track}°`}
    >
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            left: '-8px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '2px solid red',
            backgroundColor: 'transparent',
            zIndex: -1,
          }}
        />
      )}
      <span role="img" aria-label="airplane">✈️</span>
      <span
        style={{
          transform: `rotate(${-heading}deg)`,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          userSelect: 'none'
        }}
      >
        {flight || 'N/A'}
      </span>
    </div>
  );
}
