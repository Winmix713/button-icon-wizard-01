import React from 'react';
import { TrendingUp, Clock, Users, Award } from 'lucide-react';

export function Stats() {
  const stats = [
    {
      icon: TrendingUp,
      value: "95-100%",
      label: "Visual Accuracy",
      description: "Pixel-perfect recreation of Figma designs"
    },
    {
      icon: Clock,
      value: "<30s",
      label: "Generation Time",
      description: "From design to production-ready code"
    },
    {
      icon: Users,
      value: "10,000+",
      label: "Components Generated",
      description: "Trusted by developers worldwide"
    },
    {
      icon: Award,
      value: "WCAG 2.1",
      label: "AA Compliant",
      description: "Accessibility built-in by default"
    }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-indigo-600">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Proven Results
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Numbers that speak to the quality and reliability of our 
            AI-powered design-to-code generation system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="text-center group hover:scale-105 transition-transform duration-300"
            >
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all">
                <div className="bg-white/20 p-4 rounded-xl w-fit mx-auto mb-4 group-hover:bg-white/30 transition-colors">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold text-blue-100 mb-2">
                  {stat.label}
                </div>
                <p className="text-sm text-blue-200 leading-relaxed">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to revolutionize your design-to-code workflow?
            </h3>
            <p className="text-blue-100 mb-6 leading-relaxed">
              Join thousands of developers and designers who have already transformed 
              their productivity with our AI-powered component generator.
            </p>
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300">
              Start Free Trial
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}