import { SimpleFooter } from "@/components/layout/simple-footer";
import { SimpleHeader } from "@/components/layout/simple-header";

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SimpleHeader />
      <main className="flex-1">
        <div className="container mx-auto py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Documentation</h1>
            
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
              <p className="text-gray-600 mb-6">
                Diffit is a powerful text comparison tool that helps you identify differences 
                between two pieces of text quickly and accurately.
              </p>

              <h3 className="text-xl font-semibold mb-3">How to Use</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-6">
                <li>Navigate to the <a href="/diff" className="text-blue-600 hover:underline">Diff page</a></li>
                <li>Paste or type your original text in the left panel</li>
                <li>Paste or type your modified text in the right panel</li>
                <li>Click &quot;Compare&quot; to see the differences</li>
                <li>Use &quot;Clear&quot; to reset both panels</li>
              </ol>

              <h3 className="text-xl font-semibold mb-3">Features</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
                <li>Real-time text comparison</li>
                <li>Clean, easy-to-read diff visualization</li>
                <li>Responsive design that works on all devices</li>
                <li>Fast and secure - all processing happens in your browser</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Tips</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
                <li>For best results, format your text consistently before comparing</li>
                <li>The tool works with any type of text content</li>
                <li>Your data never leaves your browser, ensuring complete privacy</li>
              </ul>

              <h2 className="text-2xl font-semibold mb-4">Support</h2>
              <p className="text-gray-600">
                If you encounter any issues or have suggestions for improvement, 
                please feel free to reach out through our GitHub repository.
              </p>
            </div>
          </div>
        </div>
      </main>
      <SimpleFooter />
    </div>
  );
}