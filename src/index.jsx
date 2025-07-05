// frontend/src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client'; // Correct import for React 18+
import App from './App'; // Ensure App is correctly imported as a default export
import './App.css'; // Import your global application CSS

// Get the root DOM element where your React app will be mounted
const rootElement = document.getElementById('root');

// Create a React root and render the App component
// React.StrictMode is a tool for highlighting potential problems in an application.
// It activates additional checks and warnings for its descendants.
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
