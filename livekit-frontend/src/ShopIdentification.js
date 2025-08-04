import React, { useState, useRef } from 'react';
import './ShopIdentification.css';

// Import assets (assuming similar structure to App.js)
// You may need to add these assets to your assets folder
// import shopLogo from './assets/shop-logo.png';

function ShopIdentification() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useCamera, setUseCamera] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setUseCamera(true);
      setError('');
    } catch (err) {
      setError('Failed to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setUseCamera(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        setSelectedImage(file);
        setImagePreview(canvas.toDataURL());
        stopCamera();
      });
    }
  };

  // Analyze image
  const analyzeImage = async () => {
    if (!selectedImage) {
      setError('Please select an image first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const server_url = process.env.REACT_APP_BACKEND_SERVER || 'http://localhost:8000';
      const response = await fetch(`${server_url}/api/analyze-shop-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err.message || 'An error occurred during analysis');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError('');
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="shop-identification-container">
      <div className="shop-phone-mockup">
        {/* Header */}
        <div className="shop-header">
          <div className="shop-logo-container">
            <h1 className="shop-title">🛍️ Shop Identifier</h1>
            <p className="shop-subtitle">AI-Powered Shop Recognition</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="shop-main-content">
          {/* Input Section */}
          <div className="shop-input-section">
            <h2>Upload Image</h2>
            
            {/* Toggle between file upload and camera */}
            <div className="shop-input-toggle">
              <button 
                className={`toggle-btn ${!useCamera ? 'active' : ''}`}
                onClick={() => {
                  setUseCamera(false);
                  stopCamera();
                }}
              >
                📁 Upload File
              </button>
              <button 
                className={`toggle-btn ${useCamera ? 'active' : ''}`}
                onClick={startCamera}
              >
                📷 Use Camera
              </button>
            </div>

            {/* File Upload */}
            {!useCamera && (
              <div className="file-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="file-input"
                />
                <div className="upload-placeholder">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                  ) : (
                    <div className="upload-text">
                      <p>📸 Click to select an image</p>
                      <p>or drag and drop here</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Camera Section */}
            {useCamera && (
              <div className="camera-section">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="camera-video"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="camera-controls">
                  <button onClick={capturePhoto} className="capture-btn">
                    📸 Capture Photo
                  </button>
                  <button onClick={stopCamera} className="stop-camera-btn">
                    ❌ Stop Camera
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                onClick={analyzeImage}
                disabled={!selectedImage || loading}
                className="analyze-btn"
              >
                {loading ? '🔄 Analyzing...' : '🔍 Analyze Shop'}
              </button>
              <button onClick={resetForm} className="reset-btn">
                🔄 Reset
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="shop-results-section">
            <h2>Analysis Results</h2>
            
            {loading && (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Analyzing image with AI...</p>
              </div>
            )}

            {analysisResult && !loading && (
              <div className="results-container">
                <div className="result-summary">
                  <h3>
                    {analysisResult.is_shop_present ? '✅ Shop Detected!' : '❌ No Shop Found'}
                  </h3>
                  {analysisResult.total_shops_detected > 0 && (
                    <p>Found {analysisResult.total_shops_detected} shop(s)</p>
                  )}
                </div>

                {analysisResult.shops && analysisResult.shops.length > 0 && (
                  <div className="shops-list">
                    {analysisResult.shops.map((shop, index) => (
                      <div key={index} className="shop-item">
                        <h4>Shop {index + 1}</h4>
                        <div className="shop-details">
                          <p><strong>Name:</strong> {shop.shop_name || 'N/A'}</p>
                          <p><strong>Type:</strong> {shop.shop_type || 'N/A'}</p>
                          <p><strong>Confidence:</strong> {shop.confidence_score}%</p>
                        </div>
                        <div className="confidence-bar">
                          <div 
                            className="confidence-fill" 
                            style={{ width: `${shop.confidence_score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!analysisResult.is_shop_present && (
                  <div className="no-shop-message">
                    <p>The AI couldn't identify any shops in this image.</p>
                    <p>Try uploading a clearer image of a storefront.</p>
                  </div>
                )}
              </div>
            )}

            {!analysisResult && !loading && (
              <div className="placeholder-message">
                <p>🔍 Upload an image to see analysis results</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shop-footer">
          <p>Powered by AI Vision Technology</p>
        </div>
      </div>
    </div>
  );
}

export default ShopIdentification;
