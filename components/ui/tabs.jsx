import React from 'react';

export function Tabs({ value, onValueChange, children }) {
  return (
    <div data-tabs>
      {React.Children.map(children, (child) => {
        return child;
      })}
    </div>
  );
}

export function TabsList({ children, className }) {
  return (
    <div role="tablist" aria-orientation="horizontal" className={`${className || ''} flex gap-2`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, currentValue, onClick, children }) {
  const active = value === currentValue;
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => onClick(value)}
      className={`${active ? 'bg-white shadow' : 'bg-gray-100'} px-3 py-2 rounded`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, currentValue, children }) {
  if (value !== currentValue) return null;
  return <div role="tabpanel">{children}</div>;
}

export default Tabs;
