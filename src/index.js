// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client'; // Ensure this import is present
import App from './App';
import './index.css'; // Your CSS file if needed

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
