import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import { formatLocalDateTime } from '../utils/dateFormat.js';

const InspectionPage = () => {
  const [references, setReferences] = useState([]);
  const [selectedGoodClass, setSelectedGoodClass] = useState(null);
  const [mode, setMode] = useState('select'); // 'select', 'camera', 'upload'
  const [stream, setStream] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [result, setResult] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const readinessTimeoutRef = useRef(null);
  const previewAnimationRef = useRef(null);
  const imageCaptureRef = useRef(null);
  const [useCanvasPreview, setUseCanvasPreview] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadReferences();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (readinessTimeoutRef.current) {
        clearTimeout(readinessTimeoutRef.current);
        readinessTimeoutRef.current = null;
      }
      stopPreviewLoop();
    };
  }, []);


  useEffect(() => {
    if (mode === 'camera' && selectedGoodClass && !stream) {
      console.debug('[Camera] Mode switched to camera. Starting camera...');
      startCamera(selectedCameraId);
    } else if (mode !== 'camera') {
      console.debug('[Camera] Mode switched to', mode, 'stopping camera.');
      stopCamera();
    }
  }, [mode, selectedGoodClass]);

  useEffect(() => {
    if (mode === 'camera' && selectedGoodClass && selectedCameraId) {
      console.debug('[Camera] Selected camera changed to', selectedCameraId, '- restarting stream');
      startCamera(selectedCameraId, true);
    }
  }, [selectedCameraId]);

  const loadReferences = async () => {
    try {
      setLoading(true);
      
      // Get model classes from YOLO model
      const modelData = await api.get('/model/classes').catch(() => ({ classes: [] }));
      const modelClasses = modelData.classes || [];
      
      // Get uploaded reference images (use /list endpoint accessible to all authenticated users)
      const refData = await api.get('/references/list').catch(() => ({ references: [] }));
      const uploadedRefs = refData.references || [];
      
      // Create reference list with model classes
      const classSamples = modelClasses.map(className => {
        // Find first uploaded image for this class
        const uploadedRef = uploadedRefs.find(ref => ref.class === className);
        
        return {
          class: className,
          filename: uploadedRef?.filename || null,
          path: uploadedRef?.path || null,
          hasImage: !!uploadedRef
        };
      });
      
      setReferences(classSamples);
    } catch (error) {
      console.error('Failed to load references:', error);
      setReferences([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshCameras = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      console.debug('[Camera] Refreshing available cameras...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.debug('[Camera] Devices found:', videoDevices);
      setAvailableCameras(videoDevices);
      if (!selectedCameraId && videoDevices.length > 0) {
        console.debug('[Camera] Selecting default camera:', videoDevices[0].deviceId);
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Camera enumeration error:', error);
      setCameraError('Unable to list cameras. Please ensure the browser has camera access.');
    }
  };

  const stopPreviewLoop = () => {
    if (previewAnimationRef.current) {
      console.debug('[Camera] Stopping snapshot preview loop');
      cancelAnimationFrame(previewAnimationRef.current);
      previewAnimationRef.current = null;
    }
    imageCaptureRef.current = null;
    setUseCanvasPreview(false);
  };

  const startImageCapturePreview = (mediaStream) => {
    console.debug('[Camera] Starting snapshot preview fallback');
    stopPreviewLoop();
    if (!('ImageCapture' in window)) {
      console.warn('[Camera] ImageCapture API not supported in this browser');
      setCameraError('Live preview not supported in this browser. You can still capture images.');
      return;
    }
    const [track] = mediaStream.getVideoTracks();
    if (!track) return;

    try {
      const imageCapture = new ImageCapture(track);
      imageCaptureRef.current = imageCapture;
      setUseCanvasPreview(true);

    const drawFrame = async () => {
        if (!previewCanvasRef.current) return;
        try {
          const bitmap = await imageCapture.grabFrame();
          const canvas = previewCanvasRef.current;
          const ctx = canvas.getContext('2d');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          markCameraReady();
        } catch (err) {
          console.warn('ImageCapture error:', err);
        }
        previewAnimationRef.current = requestAnimationFrame(drawFrame);
      };

      drawFrame();
    } catch (error) {
      console.error('ImageCapture init error:', error);
      setCameraError('Unable to render camera preview. Try reconnecting the USB camera.');
    }
  };

  const handleSelectGoodClass = (className) => {
    // Toggle: if clicking the same class, deselect it
    if (selectedGoodClass === className) {
      setSelectedGoodClass(null);
    } else {
      // Select new class (stay on selection page)
      setSelectedGoodClass(className);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedGoodClass) {
      setMode('camera');
    }
  };

  const markCameraReady = () => {
    if (readinessTimeoutRef.current) {
      console.debug('[Camera] Clearing readiness timeout on cleanup');
      clearTimeout(readinessTimeoutRef.current);
      readinessTimeoutRef.current = null;
    }
    setCameraReady(true);
    setCameraError(null);
  };

  const startCamera = async (preferredCameraId, forceRestart = false) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera API not supported. Please use Upload mode.');
      setMode('upload');
      return;
    }

    if (cameraLoading) return;

    if (stream && !forceRestart) {
      return;
    }

    try {
      setCameraLoading(true);
      setCameraError(null);

      setCameraReady(false);
      if (stream) {
        stopCamera();
      }
      stopPreviewLoop();

      const videoConstraints = {
        width: { ideal: 640 },
        height: { ideal: 480 }
      };

      if (preferredCameraId) {
        videoConstraints.deviceId = { exact: preferredCameraId };
      } else {
        videoConstraints.facingMode = 'environment';
      }

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: videoConstraints,
          audio: false
        });
      } catch (err) {
        // Retry with default constraints if current setup is not supported
        if (err.name === 'OverconstrainedError' || err.name === 'NotReadableError') {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } else {
          throw err;
        }
      }

      if (videoRef.current) {
        const videoEl = videoRef.current;
        videoEl.srcObject = null;
        videoEl.srcObject = mediaStream;
        videoEl.muted = true;
        videoEl.playsInline = true;

        const attemptPlay = async () => {
          try {
            await videoEl.play();
            markCameraReady();
            setUseCanvasPreview(false);
          } catch (err) {
            console.error('Video play error:', err);
            setCameraError('Unable to start live preview. Using snapshot mode.');
            startImageCapturePreview(mediaStream);
          }
        };

        attemptPlay();

        videoEl.onloadeddata = markCameraReady;
        videoEl.onplaying = () => {
          markCameraReady();
          setUseCanvasPreview(false);
        };
        videoEl.onpause = () => setCameraReady(false);

        readinessTimeoutRef.current = setTimeout(() => {
          if (!videoEl || videoEl.readyState < 2) {
            console.warn('Camera did not initialize within timeout', videoEl.readyState);
            setCameraError('Camera stream did not start. Using snapshot mode.');
            startImageCapturePreview(mediaStream);
          }
        }, 6000);
      }

      setStream(mediaStream);

      const [videoTrack] = mediaStream.getVideoTracks();
      if (videoTrack) {
        videoTrack.onended = () => {
          setCameraError('Camera stream ended. Please restart the camera or check the USB connection.');
          setCameraReady(false);
          stopPreviewLoop();
        };
      }

      refreshCameras();
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError(error.message || 'Unable to access camera');
      alert(`Camera access failed: ${error.message}\n\nPlease ensure the USB camera is connected and that camera permission is granted.`);
      setMode('upload');
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraReady(false);
    stopPreviewLoop();
    if (readinessTimeoutRef.current) {
      clearTimeout(readinessTimeoutRef.current);
      readinessTimeoutRef.current = null;
    }
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert('Camera not ready');
      return;
    }

    if (!cameraReady) {
      alert('Camera not initialized yet. Please wait a moment after starting the camera.');
      return;
    }

    if (useCanvasPreview && previewCanvasRef.current) {
      const previewCanvas = previewCanvasRef.current;
      canvas.width = previewCanvas.width;
      canvas.height = previewCanvas.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(previewCanvas, 0, 0);
    } else {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        alert('Camera not initialized yet. Please wait a moment after starting the camera.');
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
    }

    console.debug('[Camera] Capturing frame. Source mode:', useCanvasPreview ? 'snapshot' : 'video', 'size:', canvas.width, 'x', canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert('Failed to capture image');
        return;
      }
      console.debug('[Camera] Frame captured. Blob size:', blob.size);
      setCapturedImage(blob);
      await classifyImage(blob);
    }, 'image/jpeg', 0.95);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setCapturedImage(file);
      await classifyImage(file);
    }
  };

  const classifyImage = async (imageBlob) => {
    setClassifying(true);
    setResult(null);
    
    try {
      // Ensure we have a valid blob
      if (!imageBlob || !(imageBlob instanceof Blob || imageBlob instanceof File)) {
        throw new Error('Invalid image data');
      }
      
      // Create batch if first image
      let batchId = currentBatchId;
      if (!batchId) {
        const batch = await api.post('/batches', { 
          name: `Inspection ${formatLocalDateTime(new Date())}` 
        });
        batchId = batch.id;
        setCurrentBatchId(batchId);
        
        // Save selected good class to batch_metadata
        await api.post(`/batches/${batchId}/select-color`, {
          selectedGoodClass: selectedGoodClass
        });
      }
      
      // Create form data and upload
      const formData = new FormData();
      formData.append('file', imageBlob, imageBlob.name || 'capture.jpg');
      
      const token = localStorage.getItem('token');
      const uploadResponse = await fetch(
        `/api/inspection/classify-and-save?batchId=${batchId}&selectedGoodClass=${selectedGoodClass}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }
      );
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Classification failed');
      }
      
      const classificationResult = await uploadResponse.json();
      
      const finalResult = {
        ...classificationResult,
        selectedGoodClass,
        timestamp: new Date().toISOString()
      };
      
      setResult(finalResult);
      setBatchResults(prev => [...prev, finalResult]);
      
    } catch (error) {
      console.error('Classification error:', error);
      alert(`Classification failed: ${error.message}`);
    } finally {
      setClassifying(false);
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setResult(null);
  };

  const changeGoodClass = () => {
    setMode('select');
    setSelectedGoodClass(null);
    setBatchResults([]);
    setCurrentBatchId(null);
    stopCamera();
  };

  const viewBatch = () => {
    if (currentBatchId) {
      navigate(`/gallery/${currentBatchId}`);
    }
  };

  // Step 1: Select good class
  if (mode === 'select') {
    if (loading) {
      return (
        <div className="inspection-page">
          <h1>Loading...</h1>
          <p>Connecting to YOLO inference service...</p>
        </div>
      );
    }
    
    return (
      <div className="inspection-page">
        <h1>Select Acceptable Cone Tip</h1>
        <p>Choose which cone tip type should be classified as GOOD. All others will be REJECTED.</p>
        <p className="model-info">Classes loaded from YOLO model (best.pt)</p>
        
        <div className="reference-selection">
          {references.map((ref) => (
            <div 
              key={ref.class} 
              className={`reference-option ${!ref.hasImage ? 'no-image' : ''} ${selectedGoodClass === ref.class ? 'selected' : ''}`}
              onClick={() => handleSelectGoodClass(ref.class)}
            >
              {ref.hasImage ? (
                <img src={ref.path} alt={ref.class} />
              ) : (
                <div className="placeholder-image">
                  <span className="placeholder-icon">📷</span>
                  <span className="placeholder-text">No reference image</span>
                  <span className="placeholder-hint">Upload in References page</span>
                </div>
              )}
              <div className="reference-label">
                <h3>{ref.class.replace(/_/g, ' ')}</h3>
                <button className={selectedGoodClass === ref.class ? 'selected' : ''}>
                  {selectedGoodClass === ref.class ? '✓ Selected as GOOD' : 'Select as GOOD'}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {references.length === 0 && (
          <div className="empty-state">
            <p>⚠️ No model classes found.</p>
            <p>Make sure the YOLO inference service is running:</p>
            <code>cd inference-service && python http_server.py</code>
          </div>
        )}
        
        {selectedGoodClass && (
          <div className="confirm-selection">
            <button onClick={handleConfirmSelection} className="btn-confirm">
              ✓ Confirm Selection & Start Inspection
            </button>
            <p className="selection-info">
              Selected: <strong>{selectedGoodClass.replace(/_/g, ' ')}</strong> as GOOD
            </p>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Camera or Upload mode
  return (
    <div className="inspection-page">
      <div className="inspection-header">
        <div>
          <h1>Cone Tip Inspection</h1>
          <p>
            Selected GOOD class: <strong>{selectedGoodClass?.replace(/_/g, ' ')}</strong>
            <button onClick={changeGoodClass} className="btn-secondary">Change</button>
          </p>
          <p>Inspected: {batchResults.length} | Good: {batchResults.filter(r => r.classification === 'good').length} | Reject: {batchResults.filter(r => r.classification === 'reject').length}</p>
        </div>
        
        <div className="mode-toggle">
          <button 
            onClick={() => { setMode('camera'); startCamera(); }}
            className={mode === 'camera' ? 'active' : ''}
          >
            📷 Camera
          </button>
          <button 
            onClick={() => { setMode('upload'); stopCamera(); }}
            className={mode === 'upload' ? 'active' : ''}
          >
            📁 Upload
          </button>
        </div>
      </div>

      <div className="inspection-content">
        {mode === 'camera' && (
          <div className="camera-section">
            <div className="camera-toolbar">
              <div className="camera-select">
                <label htmlFor="cameraSelect"><strong>Camera:</strong></label>
                <select
                  id="cameraSelect"
                  value={selectedCameraId || ''}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  disabled={availableCameras.length === 0}
                >
                  {availableCameras.length === 0 && (
                    <option value="">No cameras detected</option>
                  )}
                  {availableCameras.map((camera) => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${camera.deviceId.slice(0, 6)}`}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn-small" onClick={refreshCameras} disabled={cameraLoading}>
                  🔄 Refresh
                </button>
              </div>
              {cameraError && (
                <p className="camera-error">
                  ⚠️ {cameraError}<br />
                  <small>
                    Tip: On Raspbian/Linux ensure the USB camera is connected and the browser is served over HTTPS to allow camera access.
                  </small>
                </p>
              )}
            </div>

            {!stream && (
              <button onClick={() => startCamera(selectedCameraId, true)} className="btn-large" disabled={cameraLoading}>
                Start Camera
              </button>
            )}
            
            {stream && (
              <>
                {useCanvasPreview ? (
                  <canvas 
                    ref={previewCanvasRef}
                    className="camera-preview"
                  />
                ) : (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    muted
                    className="camera-preview"
                  />
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {useCanvasPreview && (
                  <p className="camera-info">Snapshot preview mode is active. Live video is not available, but you can still capture images.</p>
                )}
                
                {!capturedImage && (
                  <button onClick={captureImage} className="btn-capture" disabled={!cameraReady || cameraLoading}>
                    {cameraReady ? '📸 Capture' : 'Initializing camera...'}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {mode === 'upload' && !capturedImage && (
          <div className="upload-section">
            <label htmlFor="imageUpload" className="upload-label">
              <div className="upload-box">
                <p>📁 Click to upload image</p>
                <p className="upload-hint">or drag and drop</p>
              </div>
            </label>
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {capturedImage && (
          <div className="result-section">
            <div className="captured-preview">
              <img src={URL.createObjectURL(capturedImage)} alt="Captured" />
            </div>
            
            {classifying && (
              <div className="classifying">
                <div className="spinner"></div>
                <p>Classifying...</p>
              </div>
            )}
            
            {result && (
              <div className={`result-card ${result.classification}`}>
                <h2>{result.classification.toUpperCase()}</h2>
                <div className="result-details">
                  <p><strong>Detected:</strong> {result.predicted_class?.replace(/_/g, ' ')}</p>
                  <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%</p>
                  <p><strong>Time:</strong> {result.inference_time_ms}ms</p>
                </div>
                
                <div className="result-actions">
                  <button onClick={resetCapture} className="btn-secondary">
                    {mode === 'camera' ? 'Capture Next' : 'Upload Next'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {batchResults.length > 0 && (
        <div className="batch-summary-bottom">
          <h3>Summary</h3>
          <div className="summary-stats-horizontal">
            <div className="stat-item">
              <span className="stat-value">{batchResults.length}</span>
              <span className="stat-label">TOTAL</span>
            </div>
            <div className="stat-item good">
              <span className="stat-value">{batchResults.filter(r => r.classification === 'good').length}</span>
              <span className="stat-label">GOOD</span>
            </div>
            <div className="stat-item reject">
              <span className="stat-value">{batchResults.filter(r => r.classification === 'reject').length}</span>
              <span className="stat-label">REJECT</span>
            </div>
          </div>
          <button onClick={viewBatch} className="btn-view-results-bottom">
            View Full Results
          </button>
        </div>
      )}
    </div>
  );
};

export default InspectionPage;
