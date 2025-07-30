import React from 'react';
import { Puck } from '@measured/puck';
import { config } from '../puck.config';
import '@measured/puck/puck.css';

const PuckEditor: React.FC = () => {
  const [data, setData] = React.useState(null);

  return (
    <div style={{ height: '100vh' }}>
      <Puck
        config={config}
        data={data}
        onPublish={(data: any) => {
          console.log('Published data:', data);
          // Save to localStorage or send to backend
          localStorage.setItem('puck-data', JSON.stringify(data));
          alert('Content saved successfully!');
        }}
        onChange={(data: any) => {
          setData(data);
        }}
      />
    </div>
  );
};

export default PuckEditor;