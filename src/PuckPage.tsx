import React from 'react';
import { Render } from '@measured/puck';
import { config } from '../puck.config';

interface PuckPageProps {
  data?: any;
}

const PuckPage: React.FC<PuckPageProps> = ({ data }) => {
  const [pageData, setPageData] = React.useState(data || null);

  React.useEffect(() => {
    if (!data) {
      // Load from localStorage if no data provided
      const savedData = localStorage.getItem('puck-data');
      if (savedData) {
        setPageData(JSON.parse(savedData));
      }
    }
  }, [data]);

  if (!pageData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>No content available</h2>
        <p>Use the Puck editor to create content.</p>
      </div>
    );
  }

  return <Render config={config} data={pageData} />;
};

export default PuckPage;