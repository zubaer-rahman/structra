export function HowItWorks() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b to-white from-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Streamlined Project Partnership Workflow
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl sm:max-w-4xl mx-auto px-4">
            From project conception to contractor selection, our platform orchestrates 
            seamless collaboration between homeowners and qualified professionals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <span className="text-white text-lg sm:text-xl font-bold">1</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Strategic Project Briefing</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
              Homeowners create comprehensive project specifications with detailed requirements, 
              budget parameters, timeline expectations, and location-based contractor targeting
            </p>
          </div>

          <div className="text-center group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <span className="text-white text-lg sm:text-xl font-bold">2</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Professional Proposal Submission</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
              Qualified contractors submit detailed proposals with comprehensive cost breakdowns, 
              project timelines, technical specifications, and portfolio showcases
            </p>
          </div>

          <div className="text-center group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <span className="text-white text-lg sm:text-xl font-bold">3</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Strategic Partnership Formation</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed px-2">
              Homeowners evaluate proposals using our analytics tools, conduct contractor interviews, 
              and establish professional partnerships for successful project execution
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
