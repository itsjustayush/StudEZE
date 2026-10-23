import React from 'react';
import ReactDOM from 'react-dom/client';
import { SideDeck } from './SideDeck';
import './styles/sidepanel.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element in sidepanel/index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <SideDeck />
  </React.StrictMode>
);
