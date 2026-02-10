
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(container);
// StrictMode removed to avoid double API calls in dev (React 18 double-invokes effects).
// To re-enable, wrap with <StrictMode> and use AbortController in page useEffects for fetches.
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
