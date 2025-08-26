import React from 'react';
import { 
  Zap, 
  Shield, 
  Smartphone, 
  Palette, 
  Code, 
  Users,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate production-ready components in under 30 seconds with our optimized AI pipeline.",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: Shield,
      title: "WCAG 2.1 AA Compliant",
      description: "Automatically generates accessible code that meets international accessibility standards.",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: Smartphone,
      title: "Responsive by Default",
      description: "Every component is automatically optimized for mobile, tablet, and desktop breakpoints.",
      color: "from-blue-400 to-cyan-500"
    },
    {
      icon: Palette,
      title: "Design System Ready",
      description: "Extracts and applies design tokens, maintaining consistency across your component library.",
      color: "from-purple-400 to-pink-500"
    },
    {
      icon: Code,
      title: "Multi-Framework Support",
      description: "Generate components for React, Vue, Angular, or plain HTML with TypeScript support.",
      color: "from-indigo-400 to-purple-500"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share generated components with your team and maintain design-code synchronization.",
      color: "from-teal-400 to-blue-500"
    }
  ];

  const capabilities = [
    "Pixel-perfect layout recreation",
    "Advanced CSS animations and transitions",
    "Interactive state management",
    "Component prop inference",
    "Auto-generated TypeScript types",
    "Storybook integration ready",
    "Design token extraction",
    "Cross-browser compatibility"
  ];

  return (
    <section id="features" className="py-20 px-6 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">Advanced Capabilities</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Built for Production
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Every feature is designed to generate enterprise-grade code that's ready 
            for production deployment without additional modifications.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className={`bg-gradient-to-r ${feature.color} p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Capabilities List */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Advanced Code Generation
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Our AI system goes beyond basic layout generation to create sophisticated, 
                maintainable code that follows industry best practices and coding standards.
              </p>
              <div className="space-y-3">
                {capabilities.slice(0, 4).map((capability, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{capability}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Enterprise Features
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Built with enterprise requirements in mind, including team collaboration, 
                version control integration, and scalable architecture patterns.
              </p>
              <div className="space-y-3">
                {capabilities.slice(4).map((capability, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{capability}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}