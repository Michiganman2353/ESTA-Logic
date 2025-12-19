import { useRef, useState } from 'react';
import { useWizard } from '../WizardContext';

/**
 * SecureCameraStep - Secure Document Capture
 *
 * Allows users to capture photos of compliance documents using their device camera
 * Works on mobile and desktop with fallback support
 */
export default function SecureCameraStep() {
  const { setStep, data, update } = useWizard();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setStream(mediaStream);
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError(
        'Unable to access camera. Please ensure you have granted camera permissions.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capture = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0);
      const image = canvas.toDataURL('image/jpeg', 0.92);
      setPhoto(image);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  const handleSaveAndContinue = () => {
    if (photo) {
      const existingDocs = data.capturedDocuments || [];
      update({ capturedDocuments: [...existingDocs, photo] });
    }
    setStep(5);
  };

  const handleSkip = () => {
    stopCamera();
    setStep(5);
  };

  const handleBack = () => {
    stopCamera();
    setStep(3);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-3 text-3xl font-bold text-gray-900">
          Secure Document Capture
        </h1>
        <p className="text-lg text-gray-600">
          Optionally capture compliance documents for your records. This step is
          not required.
        </p>
      </div>

      {/* Main Content */}
      <div className="mb-8 rounded-xl bg-white p-8 shadow-lg">
        {!cameraActive && !photo && (
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
              <svg
                className="h-12 w-12 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>

            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              What you can capture
            </h2>
            <ul className="mb-6 space-y-2 text-left text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Employee roster or organizational chart</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Business license or incorporation documents</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Previous sick time policy documentation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Any relevant compliance materials</span>
              </li>
            </ul>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              onClick={startCamera}
              className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Start Camera
            </button>
          </div>
        )}

        {/* Camera View */}
        {cameraActive && !photo && (
          <div>
            <div className="relative mb-4 overflow-hidden rounded-lg bg-black">
              <video
                ref={videoRef}
                className="w-full"
                playsInline
                autoPlay
                muted
              />

              {/* Overlay Guide */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-5/6 w-11/12 rounded-lg border-4 border-dashed border-white opacity-50"></div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={stopCamera}
                className="rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={capture}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                </svg>
                Capture Photo
              </button>
            </div>
          </div>
        )}

        {/* Photo Preview */}
        {photo && (
          <div>
            <div className="mb-4 overflow-hidden rounded-lg">
              <img
                src={photo}
                alt="Captured document"
                className="h-auto w-full"
              />
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={retakePhoto}
                className="rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Retake Photo
              </button>
              <button
                onClick={handleSaveAndContinue}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 font-semibold text-white shadow-md transition-colors hover:bg-green-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save & Continue
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      {!photo && (
        <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <div>
              <h3 className="mb-1 font-semibold text-green-900">
                Your privacy is protected
              </h3>
              <p className="text-sm text-green-800">
                Photos are stored securely and encrypted. They are only used for
                your compliance records and are never shared.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <button
          onClick={handleBack}
          className="rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          ← Back
        </button>
        {!photo && (
          <button
            onClick={handleSkip}
            className="rounded-xl bg-gray-600 px-8 py-3 font-semibold text-white shadow-md transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Skip for Now →
          </button>
        )}
      </div>
    </div>
  );
}
