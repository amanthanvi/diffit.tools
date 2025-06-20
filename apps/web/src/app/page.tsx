import { SimpleFooter } from "@/components/layout/simple-footer";
import { SimpleHeader } from "@/components/layout/simple-header";
import { SimpleButton } from "@/components/simple-button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SimpleHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto relative py-24 lg:py-32 px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Compare text with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">precision</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl">
              Advanced diff visualization for developers, writers, and teams. 
              Compare files, track changes, and collaborate in real-time.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <SimpleButton href="/diff" size="lg">
                Start Comparing
              </SimpleButton>
              <SimpleButton href="/docs" variant="outline" size="lg">
                Learn More
              </SimpleButton>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto py-16 lg:py-24 px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Everything you need
            </h2>
            <p className="mt-4 text-center text-lg text-gray-600">
              Powerful features designed for modern development workflows
            </p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-blue-600 text-xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Comparison</h3>
                <p className="text-gray-600">Compare large texts instantly with our optimized diff algorithm.</p>
              </div>
              <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-green-600 text-xl">📄</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">File Support</h3>
                <p className="text-gray-600">Upload and compare files directly in your browser.</p>
              </div>
              <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-purple-600 text-xl">💾</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Export Results</h3>
                <p className="text-gray-600">Export your comparisons in multiple formats for sharing.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SimpleFooter />
    </div>
  );
}