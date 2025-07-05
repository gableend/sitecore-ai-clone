export function Hero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center px-6 overflow-hidden">
      {/* Floating elements */}
      <div className="floating-element w-32 h-32 top-20 left-[10%] opacity-60"></div>
      <div className="floating-element w-24 h-24 top-40 right-[15%] opacity-40" style={{ animationDelay: '2s' }}></div>
      <div className="floating-element w-40 h-40 bottom-32 left-[20%] opacity-30" style={{ animationDelay: '4s' }}></div>
      <div className="floating-element w-28 h-28 top-60 right-[30%] opacity-50" style={{ animationDelay: '1s' }}></div>
      <div className="floating-element w-20 h-20 bottom-40 right-[10%] opacity-45" style={{ animationDelay: '3s' }}></div>

      <div className="text-center max-w-4xl relative z-10">
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-300">Sitecore.ai</span>
        </h1>

        <h2 className="text-2xl md:text-3xl text-gray-200 mb-8 font-light">
          Experience what's next, now.
        </h2>

        <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
          We're entering a new era, where human insight meets intelligent automation
          to shape fluid, personalized journeys. Sitecore.ai is your front-row seat to
          this next evolution of digital.
        </p>

        {/* Pagination dots */}
        <div className="flex justify-center space-x-2 mt-12">
          <div className="w-3 h-3 bg-white rounded-full"></div>
          <div className="w-3 h-3 bg-white/40 rounded-full"></div>
          <div className="w-3 h-3 bg-white/40 rounded-full"></div>
        </div>
      </div>
    </section>
  )
}
