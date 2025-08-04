import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import './ShopAnalyzer.css';

const ShopImageAnalyzer = () => {
  const [imageData, setImageData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputMethod, setInputMethod] = useState('upload');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setImageData(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setError(null);
    } else {
      setError('Please select a valid image file (JPG, JPEG, PNG)');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setError(null);
      }
    } catch (err) {
      setError('Camera access denied or not available');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          setImageData(file);
          setImagePreview(canvas.toDataURL());
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const analyzeImage = async () => {
    if (!imageData) {
      setError('Please upload an image or take a photo first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', imageData);

      const serverUrl = process.env.REACT_APP_BACKEND_SERVER || 'http://localhost:8000';
      const response = await fetch(`${serverUrl}/api/analyze-shop-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const results = await response.json();
      setAnalysisResults(results);
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setImageData(null);
    setImagePreview(null);
    setAnalysisResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    stopCamera();
  };

  return (
    <div className="shop-analyzer-container">
      <div className="main-title-container">
        <h1>🛍️ Shop Image Analyzer</h1>
        <p>Upload an image or use your camera to identify if it's a shop, extract its name, and business type.</p>
      </div>

      <div className="analyzer-layout">
        {/* Input Column */}
        <div className="column-container column-bg-1">
          <h2>Input</h2>
          <div className="input-method-selector">
            <label className="radio-option">
              <input
                type="radio"
                value="upload"
                checked={inputMethod === 'upload'}
                onChange={(e) => {
                  setInputMethod(e.target.value);
                  stopCamera();
                }}
              />
              <span>Upload Photo</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                value="camera"
                checked={inputMethod === 'camera'}
                onChange={(e) => {
                  setInputMethod(e.target.value);
                  if (e.target.value === 'camera') {
                    startCamera();
                  } else {
                    stopCamera();
                  }
                }}
              />
              <span>Live Camera</span>
            </label>
          </div>

          {inputMethod === 'upload' && (
            <div className="upload-section">
              <div 
                className="drag-drop-area"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={48} />
                <p>Drag & Drop or Click to Browse</p>
                <small>Supports JPG, JPEG, PNG</small>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {inputMethod === 'camera' && (
            <div className="camera-section">
              {!isCameraActive ? (
                <button onClick={startCamera} className="camera-button">
                  <Camera size={20} />
                  Start Camera
                </button>
              ) : (
                <div className="camera-controls">
                  <button onClick={capturePhoto} className="capture-button">
                    📸 Capture Photo
                  </button>
                  <button onClick={stopCamera} className="stop-button">
                    Stop Camera
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="action-buttons">
            <button 
              onClick={analyzeImage} 
              disabled={!imageData || isAnalyzing}
              className="analyze-button"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Analyzing...
                </>
              ) : (
                'Analyze Image'
              )}
            </button>
            
            <button onClick={resetAnalysis} className="reset-button">
              Reset
            </button>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Image Preview Column */}
        <div className="column-container column-bg-2">
          <h2>Image Preview</h2>
          <div className="image-preview-container">
            {isCameraActive && inputMethod === 'camera' ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="camera-video"
              />
            ) : imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="image-preview"
              />
            ) : (
              <div className="image-placeholder">
                <Upload size={64} />
                <p>Image will appear here</p>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Results Column */}
        <div className="column-container column-bg-3">
          <h2>Analysis Results</h2>
          <div className="results-container">
            {isAnalyzing ? (
              <div className="analyzing-state">
                <Loader2 size={32} className="spinner" />
                <p>Analyzing image with AI vision...</p>
                <small>This may take a moment</small>
              </div>
            ) : analysisResults ? (
              <div className="results-content">
                <div className="shop-detection-status">
                  {analysisResults.is_shop_present ? (
                    <div className="detection-positive">
                      <CheckCircle size={20} />
                      <span>✅ Yes ({analysisResults.total_shops_detected} shop(s) found)</span>
                    </div>
                  ) : (
                    <div className="detection-negative">
                      <XCircle size={20} />
                      <span>❌ No shops detected</span>
                    </div>
                  )}
                </div>

                {analysisResults.is_shop_present && analysisResults.shops && analysisResults.shops.length > 0 && (
                  <div className="shops-details">
                    <hr />
                    {analysisResults.shops.map((shop, index) => (
                      <div key={index} className="shop-detail">
                        <h4>Shop {index + 1}:</h4>
                        <div className="shop-info">
                          <p><strong>Name:</strong> {shop.shop_name || 'N/A'}</p>
                          <p><strong>Type:</strong> {shop.shop_type || 'N/A'}</p>
                          <p><strong>Confidence:</strong> {shop.confidence_score || 'N/A'}%</p>
                        </div>
                        {index < analysisResults.shops.length - 1 && <hr />}
                      </div>
                    ))}
                  </div>
                )}

                {analysisResults.is_shop_present && (!analysisResults.shops || analysisResults.shops.length === 0) && (
                  <div className="warning-message">
                    <AlertCircle size={16} />
                    <p>No specific shop details could be extracted despite a shop being detected. This might be due to AI limitations or image clarity.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-results">
                <p>Results will appear here after analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <hr />
        <p>Developed with React and AI Vision</p>
      </footer>
    </div>
  );
};

export default ShopImageAnalyzer;