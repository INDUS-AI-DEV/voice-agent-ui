import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import AppTTS from './DaburTTS';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ObjectionHandling from './ObjectionHandling';
import ObjectionHandlingManagerReview from './ObjectionHandlingManagerReview';
import ObjectionHandlingObjHandling from './ObjectionHandlingObjHandling';
import ObjectionHandlingRolePlay from './ObjectionHandlingRolePlay';
import ObjectionHandlingBackup from './ObjectionHandlingBackup'
import ShopImageAnalyzer from './components/ShopImageAnalyzer';
import Plumber from './Plumber';
import ShadeformDashboard from './ShadeformDashboard';
import Banking from './Dashboard';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/objection-handling-v1" element={<ObjectionHandling />} />
        <Route path="/objection-manager-review" element={<ObjectionHandlingManagerReview />} />
        <Route path="/objection-obj-handling" element={<ObjectionHandlingObjHandling />} />
        <Route path="/objection-role-play" element={<ObjectionHandlingRolePlay />} />
	      <Route path="objection-handling" element={<ObjectionHandlingBackup />} />
        <Route path="/shop-analyzer" element={<ShopImageAnalyzer />} />
        <Route path="/plumber" element={<Plumber />} />
        <Route path="/tts-server" element={<ShadeformDashboard />} />
        <Route path="/tts-sales-agent" element={<AppTTS />} />
        <Route path="/dashboard" element={<Banking />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
