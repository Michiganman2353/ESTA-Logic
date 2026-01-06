/**
 * TestDocumentScanner Page
 *
 * Test page for E2E testing of DocumentScanner component
 * This page is only used in development/testing environments
 */

import DocumentScanner from '@/components/DocumentScanner';

export default function TestDocumentScanner() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <DocumentScanner
        onComplete={(file) => {
          console.log('Document scanned:', file);
        }}
        onCancel={() => {
          console.log('Scan cancelled');
        }}
      />
    </div>
  );
}
