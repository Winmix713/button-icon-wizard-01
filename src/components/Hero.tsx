import React from 'react';
import { ArrowRight, Zap, Target, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative py-20 px-6 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">AI-Powered Design-to-Code Revolution</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            From <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Figma</span>
            <br />
            to <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Production Code</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Generate pixel-perfect React, HTML, and Vue components from Figma designs with 
            <strong className="text-gray-900"> 95-100% visual accuracy</strong> in under 30 seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
            <button className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 flex items-center space-x-2">
              <span>Start Converting</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:shadow-xl transition-all duration-300">
              View Demo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-3 bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
              <div className="bg-green-100 p-3 rounded-full">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900">95-100%</div>
                <div className="text-sm text-gray-600">Visual Accuracy</div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3 bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
              <div className="bg-blue-100 p-3 rounded-full">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900">&lt;30s</div>
                <div className="text-sm text-gray-600">Generation Time</div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3 bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
              <div className="bg-purple-100 p-3 rounded-full">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900">WCAG 2.1</div>
                <div className="text-sm text-gray-600">AA Compliant</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}