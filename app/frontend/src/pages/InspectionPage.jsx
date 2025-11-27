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
  const [useCanvasPreview, setUseCanvasPreview] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const readinessTimeoutRef = useRef(null);
  const previewAnimationRef = useRef(null);
  const imageCaptureRef = useRef(null);
  
  const navigate = useNavigate();

  // --- INITIALIZATION ---
  useEffect(() => {
    loadReferences();
    return () => {
      stopCamera(); // Cleanup on unmount
    };
  }, []);

  // --- MODE SWITCHING ---
  useEffect(() => {
    if (mode === 'camera' && selectedGoodClass && !stream) {
      console.debug('[Camera] Mode switched to camera. Starting camera...');
      startCamera(selectedCameraId);
    } else if (mode !== 'camera') {
      console.debug('[Camera] Mode switched to', mode, 'stopping camera.');
      stopCamera();
    }
  }, [mode, selectedGoodClass]);

  // --- CAMERA SELECTION CHANGE ---
  useEffect(() => {
    if (mode === 'camera' && selectedGoodClass && selectedCameraId && stream) {
      // Only restart if we already have a stream running to avoid double-init
      console.debug('[Camera] Selected camera changed to', selectedCameraId, '- restarting stream');
      startCamera(selectedCameraId, true);
    }
  }, [selectedCameraId]);

  // --- CRITICAL FIX: HANDLE STREAM ATTACHMENT ---
  // This effect runs whenever 'stream' or 'useCanvasPreview' changes.
  // It ensures the video element exists before we try to attach the stream.
  useEffect(() => {
    if (!stream) return;

    if (!useCanvasPreview && videoRef.current) {
      // STANDARD VIDEO MODE
      console.debug('[Camera] Attaching stream to video element');
      const videoEl = videoRef.current;
      videoEl.srcObject = stream;
      
      videoEl.play()
        .then(() => {
            console.debug('[Camera] Video playing successfully');
            markCameraReady();
        })
        .catch(err => {
            console.error('[Camera] Play error:', err);
            // If standard video fails, try the fallback
            setCameraError('Video play failed. Attempting snapshot mode...');
            setUseCanvasPreview(true); 
        });

    } else if (useCanvasPreview && previewCanvasRef.current) {
      // SNAPSHOT FALLBACK MODE
      // We start the custom drawing loop here
      startSnapshotLoop(stream);
    }

  }, [stream, useCanvasPreview]);

  const loadReferences = async () => {
    try {
      setLoading(true);
      const modelData = await api.get('/model/classes').catch(() => ({ classes: [] }));
      const modelClasses = modelData.classes || [];
      const refData = await api.get('/references/list').catch(() => ({ references: [] }));
      const uploadedRefs = refData.references || [];
      
      const classSamples = modelClasses.map(className => {
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
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      if (!selectedCameraId && videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Camera enumeration error:', error);
    }
  };

  const stopPreviewLoop = () => {
    if (previewAnimationRef.current) {
      cancelAnimationFrame(previewAnimationRef.current);
      previewAnimationRef.current = null;
    }
    imageCaptureRef.current = null;
  };

  const startSnapshotLoop = (mediaStream) => {
     // This logic is now called by the useEffect when useCanvasPreview is true
     stopPreviewLoop();

     // Check if ImageCapture is supported
     if (!('ImageCapture' in window)) {
        setCameraError('Live preview not supported. You can still capture images blindly.');
        return;
     }

     const [track] = mediaStream.getVideoTracks();
     if (!track) return;

     try {
       const imageCapture = new ImageCapture(track);
       imageCaptureRef.current = imageCapture;
       
       const drawFrame = async () => {
         if (!previewCanvasRef.current || !imageCaptureRef.current) return;
         try {
           const bitmap = await imageCapture.grabFrame();
           const canvas = previewCanvasRef.current;
           // Check if canvas still exists (user might have navigated away)
           if (canvas) {
               const ctx = canvas.getContext('2d');
               canvas.width = bitmap.width;
               canvas.height = bitmap.height;
               ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
               if (!cameraReady) markCameraReady();
           }
         } catch (err) {
           // Ignore insignificant errors during loop
         }
         previewAnimationRef.current = requestAnimationFrame(drawFrame);
       };

       drawFrame();
     } catch (error) {
       console.error('ImageCapture init error:', error);
       setCameraError('Preview failed. Please check connection.');
     }
  };

  const handleSelectGoodClass = (className) => {
    if (selectedGoodClass === className) {
      setSelectedGoodClass(null);
    } else {
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
      clearTimeout(readinessTimeoutRef.current);
      readinessTimeoutRef.current = null;
    }
    setCameraReady(true);
    setCameraError(null);
  };

  const startCamera = async (preferredCameraId, forceRestart = false) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera API not supported. Use Upload mode.');
      setMode('upload');
      return;
    }

    if (cameraLoading) return;
    if (stream && !forceRestart) return;

    try {
      setCameraLoading(true);
      setCameraError(null);
      setCameraReady(false);
      setUseCanvasPreview(false); // Reset to standard video mode initially

      // Stop existing stream if restarting
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
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

      console.debug('[Camera] Requesting access...');
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: videoConstraints,
          audio: false
        });
      } catch (err) {
        console.warn('Constraint error, retrying with defaults', err);
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      // NOTE: We do NOT attach srcObject here anymore.
      // We just set the state. The useEffect will handle the attachment
      // once the <video> element renders.
      setStream(mediaStream);

      // Handle stream ending unexpectedly
      const [videoTrack] = mediaStream.getVideoTracks();
      if (videoTrack) {
        videoTrack.onended = () => {
          setCameraError('Camera disconnected.');
          setCameraReady(false);
          stopPreviewLoop();
        };
      }

      refreshCameras();

      // Set a fallback timeout in case the video never plays
      readinessTimeoutRef.current = setTimeout(() => {
        if (!cameraReady) {
            console.warn('[Camera] Timeout reached, forcing snapshot mode');
            setUseCanvasPreview(true); // This will trigger the fallback effect
        }
      }, 8000);

    } catch (error) {
      console.error('Camera error:', error);
      setCameraError(error.message || 'Unable to access camera');
      alert(`Camera access failed: ${error.message}\n\nPlease ensure HTTPS is used or localhost.`);
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
        // Create a temporary canvas if ref is missing
        return;
    }

    // Determine dimensions and source
    let source = null;
    let width = 0;
    let height = 0;

    if (useCanvasPreview && previewCanvasRef.current) {
        source = previewCanvasRef.current;
        width = source.width;
        height = source.height;
    } else if (videoRef.current) {
        source = videoRef.current;
        width = source.videoWidth;
        height = source.videoHeight;
    }

    if (!source || width === 0 || height === 0) {
        alert('Camera not ready for capture');
        return;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert('Failed to capture image');
        return;
      }
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
      if (!imageBlob) throw new Error('Invalid image data');
      
      let batchId = currentBatchId;
      if (!batchId) {
        const batch = await api.post('/batches', { 
          name: `Inspection ${formatLocalDateTime(new Date())}` 
        });
        batchId = batch.id;
        setCurrentBatchId(batchId);
        await api.post(`/batches/${batchId}/select-color`, {
          selectedGoodClass: selectedGoodClass
        });
      }
      
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
      
      if (!uploadResponse.ok) throw new Error('Classification failed');
      
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
      alert(`Error: ${error.message}`);
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

  // --- RENDER ---

  if (mode === 'select') {
    if (loading) {
      return (
        <div className="inspection-page">
          <h1>Loading...</h1>
          <p>Connecting to inference service...</p>
        </div>
      );
    }
    
    return (
      <div className="inspection-page">
        <h1>Select Acceptable Cone Tip</h1>
        <p>Choose which cone tip type is GOOD.</p>
        
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
                <div className="placeholder-image">📷</div>
              )}
              <div className="reference-label">
                <h3>{ref.class.replace(/_/g, ' ')}</h3>
                <button className={selectedGoodClass === ref.class ? 'selected' : ''}>
                  {selectedGoodClass === ref.class ? '✓ Selected' : 'Select'}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {selectedGoodClass && (
          <div className="confirm-selection">
            <button onClick={handleConfirmSelection} className="btn-confirm">
              ✓ Start Inspection
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="inspection-page">
      <div className="inspection-header">
        <div>
          <h1>Inspection Mode</h1>
          <p>Target: <strong>{selectedGoodClass?.replace(/_/g, ' ')}</strong> <button onClick={changeGoodClass} className="btn-secondary">Change</button></p>
        </div>
        <div className="mode-toggle">
          <button onClick={() => { setMode('camera'); startCamera(); }} className={mode === 'camera' ? 'active' : ''}>📷 Camera</button>
          <button onClick={() => { setMode('upload'); stopCamera(); }} className={mode === 'upload' ? 'active' : ''}>📁 Upload</button>
        </div>
      </div>

      <div className="inspection-content">
        {mode === 'camera' && (
          <div className="camera-section">
            <div className="camera-toolbar">
                <select 
                    value={selectedCameraId} 
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    disabled={availableCameras.length === 0}
                >
                    {availableCameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label || c.deviceId.slice(0,5)}</option>)}
                </select>
                <button onClick={refreshCameras}>🔄</button>
            </div>

            {cameraError && <p className="camera-error">⚠️ {cameraError}</p>}

            {!stream ? (
              <button onClick={() => startCamera(selectedCameraId, true)} className="btn-large" disabled={cameraLoading}>
                {cameraLoading ? 'Starting...' : 'Start Camera'}
              </button>
            ) : (
              <>
                <div className="video-container" style={{ position: 'relative', minHeight: '300px', backgroundColor: '#000' }}>
                    {/* VIDEO MODE */}
                    {!useCanvasPreview && (
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline
                            muted
                            style={{ width: '100%', maxWidth: '640px' }}
                        />
                    )}

                    {/* CANVAS FALLBACK MODE */}
                    {useCanvasPreview && (
                        <canvas 
                            ref={previewCanvasRef}
                            className="camera-preview"
                            style={{ width: '100%', maxWidth: '640px' }}
                        />
                    )}
                </div>

                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {!capturedImage && (
                  <button onClick={captureImage} className="btn-capture" disabled={!cameraReady && !useCanvasPreview}>
                    📸 Capture
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {mode === 'upload' && !capturedImage && (
           <div className="upload-section">
             <input type="file" onChange={handleFileUpload} accept="image/*" />
             <p>Select an image to inspect</p>
           </div>
        )}

        {capturedImage && result && (
          <div className={`result-card ${result.classification}`}>
            <h2>{result.classification.toUpperCase()}</h2>
            <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
            <button onClick={resetCapture} className="btn-secondary">Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionPage;