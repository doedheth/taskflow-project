import React, { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useTheme } from '@/context/ThemeContext'; // Assuming ThemeContext is available for styling

interface SignaturePadProps {
  onEnd: (dataUrl: string) => void;
  initialSignature?: string | null;
  width?: number;
  height?: number;
  penColor?: string;
  canvasClassName?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onEnd,
  initialSignature,
  width = 300,
  height = 150,
  penColor = '#000000',
  canvasClassName = '',
}) => {
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const { theme } = useTheme(); // Use theme for dynamic background/border

  useEffect(() => {
    if (initialSignature && sigCanvas.current) {
      sigCanvas.current.fromDataURL(initialSignature);
    }
  }, [initialSignature]);

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      onEnd(''); // Notify parent that signature is cleared
    }
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      onEnd(sigCanvas.current.toDataURL());
    }
  };

  const borderColor = theme === 'dark' ? 'border-dark-700' : 'border-gray-300';
  const backgroundColor = theme === 'dark' ? 'bg-dark-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative border ${borderColor} rounded-lg overflow-hidden ${backgroundColor} ${canvasClassName}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: width,
            height: height,
            className: 'signature-canvas',
            style: { backgroundColor: 'transparent' } // Canvas itself is transparent, parent div sets background
          }}
          penColor={penColor === '#000000' && theme === 'dark' ? '#ffffff' : penColor} // Adjust pen color for dark mode
          onEnd={handleEnd}
        />
        {/* Placeholder for signature area */}
        {!initialSignature && (
            <div className={`absolute inset-0 flex items-center justify-center ${textColor} opacity-30 pointer-events-none`}>
                <span className="text-sm">Tanda Tangan Disini</span>
            </div>
        )}
      </div>
      <button onClick={clearSignature} className="btn btn-secondary btn-sm mt-2">
        Clear Signature
      </button>
    </div>
  );
};
