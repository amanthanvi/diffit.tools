export function SimpleFooter() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Diffit</h3>
            <p className="text-sm text-gray-600">
              Advanced text comparison tool for developers, writers, and teams.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Real-time text comparison</li>
              <li>File upload support</li>
              <li>Export capabilities</li>
              <li>Responsive design</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/docs" className="hover:text-gray-900">Documentation</a>
              </li>
              <li>
                <a href="https://github.com/amanthanvi/diffit.tools" className="hover:text-gray-900" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
          <p>&copy; 2024 Diffit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}