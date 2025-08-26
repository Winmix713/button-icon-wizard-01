import React from 'react';
import { Database, Code, Layers, ArrowRight } from 'lucide-react';

export function ProcessFlow() {
  const phases = [
    {
      id: 1,
      title: "Figma API Data Extraction",
      description: "Complete metadata extraction including layer structure, positions, colors, typography, and layout properties",
      icon: Database,
      color: "from-blue-500 to-blue-600",
      details: ["REST API Integration", "Layer Structure Analysis", "Style Properties", "Component Mapping"]
    },
    {
      id: 2,
      title: "JSX + CSS Processing",
      description: "Refactor and optimize plugin-generated code from ~80% to production-ready accuracy",
      icon: Code,
      color: "from-indigo-500 to-indigo-600",
      details: ["Code Parsing", "Style Optimization", "Component Structure", "Type Generation"]
    },
    {
      id: 3,
      title: "Full CSS Layer Processing",
      description: "Analyze and optimize 4000+ line CSS exports for complete design reconstruction",
      icon: Layers,
      color: "from-purple-500 to-purple-600",
      details: ["CSS Analysis", "Responsive Design", "Performance Optimization", "Cross-browser Support"]
    }
  ];

  return (
    <section id="process" className="py-20 px-6 bg-white/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            3-Phase Processing Pipeline
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our advanced AI system processes Figma designs through three sophisticated phases 
            to achieve unparalleled accuracy and production-ready code quality.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {phases.map((phase, index) => (
            <div key={phase.id} className="relative group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className={`bg-gradient-to-r ${phase.color} p-4 rounded-xl`}>
                    <phase.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-sm font-bold text-gray-400">
                    Phase {phase.id}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {phase.title}
                </h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {phase.description}
                </p>

                <div className="space-y-3">
                  {phase.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-700">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {index < phases.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="bg-white rounded-full p-2 shadow-lg border border-gray-200">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}