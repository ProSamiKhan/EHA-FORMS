
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Zap, AlertCircle, FlipHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onScan }) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  const startScanner = async () => {
    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");
    }

    try {
      setError(null);
      await html5QrCodeRef.current.start(
        { facingMode: cameraFacing },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          stopScanner().then(() => onScan(decodedText));
        },
        (errorMessage) => {
          // Ignore
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error("Scanner start failed", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner();
      }, 500);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
  }, [isOpen, cameraFacing]);

  const toggleCamera = () => {
    stopScanner().then(() => {
      setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Camera size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">QR Scanner</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scan Student Admission QR</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleCamera}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
              title="Switch Camera"
            >
              <FlipHorizontal size={20} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-8">
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-500">
                <AlertCircle size={32} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{error}</p>
                <p className="text-xs font-bold text-slate-400 mt-1">Make sure you have granted camera permissions in your browser.</p>
              </div>
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
              >
                Close Scanner
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative rounded-3xl overflow-hidden border-4 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 aspect-square">
                <div id="qr-reader" className="w-full h-full" />
                
                {/* Scanner Overlay UI */}
                <div className="absolute inset-0 pointer-events-none border-[40px] border-black/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-indigo-500 rounded-2xl shadow-[0_0_0_1000px_rgba(0,0,0,0.3)] pointer-events-none">
                   <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg" />
                   <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg" />
                   <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg" />
                   <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-lg" />
                   
                   {/* Scanning Line Animation */}
                   <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                   />
                </div>

                {!isScanning && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Initializing Camera...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-0.5">Quick Scan Tip</p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                    Position the student's QR code within the frame to automatically view their details.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
