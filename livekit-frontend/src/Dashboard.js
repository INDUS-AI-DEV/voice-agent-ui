import React from 'react';

const Banking = () => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <iframe
        src="https://massist.indusai.app/"
        title="NBFC Loan Recovery Dashboard"
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
      />
    </div>
  );
};

export default Banking;
