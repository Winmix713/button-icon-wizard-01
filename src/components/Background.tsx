import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0">
      <img 
        src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1600&auto=format&fit=crop" 
        alt="Ambient background" 
        className="w-full h-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black/80 to-black/70"></div>
      <div className="absolute -top-16 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-3xl"></div>
      <div className="absolute bottom-16 -left-20 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full bg-gradient-to-br from-rose-500/20 to-orange-500/20 blur-3xl opacity-70"></div>
    </div>
  );
};

export default Background;