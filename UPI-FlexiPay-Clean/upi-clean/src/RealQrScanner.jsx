import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { Camera, Flashlight, Image as ImageIcon, RefreshCw, AlertCircle, CheckCircle2, Zap } from "lucide-react";

export function parseUpiUri(uri) {
  try {
    if (!uri) return null;
    let query = uri;
    if (uri.startsWith("upi://pay")) {
      query = uri.split("?")[1] || "";
    }
    const params = new URLSearchParams(query);
    const pa = params.get("pa");
    const pn = params.get("pn");
    const am = params.get("am");

    if (pa || pn || am) {
      return {
        vpa: pa || "sharma@flexipay",
        merchant: pn ? decodeURIComponent(pn) : "Sharma Super Store",
        amount: am ? Number(am) : null
      };
    }
  } catch (e) {
    console.warn("UPI URI parse error:", e);
  }
  return null;
}

export default function RealQrScanner({ onScanSuccess, onFallbackSelect }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);

  // Start Camera Stream
  useEffect(() => {
    let stream = null;
    let animId = null;
    let isMounted = true;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasCamera(false);
          setCameraError("Camera access is not supported on this browser.");
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();

          // Check torch support
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack && videoTrack.getCapabilities) {
            const capabilities = videoTrack.getCapabilities();
            if (capabilities.torch) {
              setTorchSupported(true);
            }
          }

          // Start continuous QR scanning loop
          scanFrame();
        }
      } catch (err) {
        console.warn("Camera start failed:", err);
        setHasCamera(false);
        setCameraError(
          err.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access or upload an image."
            : "Could not access camera. Please use manual selection or image upload."
        );
      }
    }

    function scanFrame() {
      if (!isMounted) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert"
        });

        if (code && code.data) {
          console.log("[Camera Scanned QR Code]", code.data);
          handleDecodedData(code.data);
          return; // Stop scan loop on success
        }
      }

      animId = requestAnimationFrame(scanFrame);
    }

    startCamera();

    return () => {
      isMounted = false;
      if (animId) cancelAnimationFrame(animId);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleDecodedData = (rawData) => {
    try {
      if (navigator.vibrate) navigator.vibrate(100);
    } catch (e) {}

    const parsedUpi = parseUpiUri(rawData);
    if (parsedUpi) {
      setScannedResult(parsedUpi);
      setTimeout(() => {
        onScanSuccess(parsedUpi);
      }, 600);
      return;
    }

    // Try JSON payload
    try {
      const json = JSON.parse(rawData);
      if (json.amount || json.merchant || json.vpa) {
        const res = {
          merchant: json.merchant || "Sharma Super Store",
          vpa: json.vpa || "sharma@flexipay",
          amount: Number(json.amount) || 2500
        };
        setScannedResult(res);
        setTimeout(() => onScanSuccess(res), 600);
        return;
      }
    } catch (e) {}

    // Generic text payload
    const generic = {
      merchant: rawData.length < 30 ? rawData : "Store Merchant",
      vpa: "merchant@flexipay",
      amount: 2500
    };
    setScannedResult(generic);
    setTimeout(() => onScanSuccess(generic), 600);
  };

  // Toggle Torch / Flashlight
  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const track = videoRef.current.srcObject.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn }]
        });
        setTorchOn(!torchOn);
      } catch (e) {
        console.warn("Torch failed:", e);
      }
    }
  };

  // Upload QR Image from Gallery
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleDecodedData(code.data);
        } else {
          alert("No QR code detected in this image. Please try a clearer screenshot.");
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Scanner Viewfinder Box */}
      <div className="relative w-full max-w-sm mx-auto aspect-square rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border-2 border-slate-800">
        
        {hasCamera ? (
          <>
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="w-56 h-56 border-2 border-orange-500/80 rounded-3xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                
                {/* 4 Corner Markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#F47920] rounded-tl-xl"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#F47920] rounded-tr-xl"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#F47920] rounded-bl-xl"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#F47920] rounded-br-xl"></div>

                {/* Animated Laser Scanning Beam */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#F47920] to-transparent shadow-[0_0_10px_#F47920] animate-bounce top-1/2 -translate-y-1/2"></div>
              </div>
            </div>

            {/* Scanner Controls Floating Over Camera */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {torchSupported && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition cursor-pointer ${
                    torchOn ? "bg-amber-400 text-slate-950 font-bold" : "bg-slate-900/70 text-white"
                  }`}
                  title="Toggle Flash"
                >
                  <Flashlight size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-full bg-slate-900/70 text-white flex items-center justify-center backdrop-blur-md hover:bg-slate-900 transition cursor-pointer"
                title="Upload QR Image"
              >
                <ImageIcon size={18} />
              </button>
            </div>

            {/* Scanner Helper Status */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-slate-900/80 text-white backdrop-blur-md border border-slate-700/60 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-[#F47920] animate-ping"></span>
                Align merchant QR inside frame
              </span>
            </div>
          </>
        ) : (
          /* Camera Fallback UI */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900 text-slate-300">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Camera size={24} />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-white">Camera Unavailable</div>
              <p className="text-xs text-slate-400 leading-snug">{cameraError}</p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-4 rounded-xl bg-[#F47920] hover:bg-[#E06710] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <ImageIcon size={15} />
              <span>Upload QR Image from Gallery</span>
            </button>
          </div>
        )}

        {/* Scan Success Overlay */}
        {scannedResult && (
          <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-2 z-20 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
              <CheckCircle2 size={32} />
            </div>
            <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              QR Verified
            </div>
            <div className="text-lg font-black">{scannedResult.merchant}</div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              ₹{Number(scannedResult.amount || 0).toLocaleString("en-IN")}
            </div>
          </div>
        )}
      </div>

      {/* Alternative Options for Testing */}
      <div className="flex gap-2 max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <ImageIcon size={14} className="text-[#F47920]" />
          <span>Upload QR</span>
        </button>

        <button
          type="button"
          onClick={() => {
            // Auto-detect POS bill fallback
            onFallbackSelect();
          }}
          className="flex-1 py-2 px-3 rounded-xl border border-orange-200 bg-orange-50/50 hover:bg-orange-100/50 text-[#F47920] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <Zap size={14} />
          <span>Auto-Detect POS</span>
        </button>
      </div>
    </div>
  );
}
