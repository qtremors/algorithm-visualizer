import { Link } from 'react-router-dom';
import { useAlgorithms } from '../contexts/AlgorithmContext.tsx';
import { ArrowRight, BarChart3, GitGraph, Zap, Code2, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { algorithms, isLoading } = useAlgorithms();

  // Helper to get icon based on category name
  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('sort')) return <BarChart3 className="w-6 h-6 text-blue-400" />;
    if (category.toLowerCase().includes('path')) return <GitGraph className="w-6 h-6 text-green-400" />;
    return <Code2 className="w-6 h-6 text-purple-400" />;
  };

  const getCategoryDescription = (category: string) => {
    if (category.toLowerCase().includes('sort')) return "Visualize classic sorting algorithms like Bubble Sort, Merge Sort, and Quick Sort with dynamic bar charts.";
    if (category.toLowerCase().includes('path')) return "Interactive pathfinding on grids using Dijkstra, A*, and BFS. Draw walls and watch them find the shortest path.";
    return "Explore various algorithmic concepts through interactive visualizations.";
  };

  return (
    <div className="flex flex-col gap-12 max-w-5xl mx-auto">
      
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800 text-blue-300 text-sm font-medium mb-4">
          <Zap size={14} fill="currentColor" /> Interactive Learning Tool
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white">
          Master Algorithms <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Visually
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          A powerful, interactive visualization tool designed to help developers and students understand complex algorithms through real-time animations and step-by-step execution.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl">
          <div className="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center mb-4">
            <Zap className="text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Real-Time Execution</h3>
          <p className="text-gray-400 text-sm">Watch algorithms run step-by-step with adjustable speeds and pause/play controls.</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl">
          <div className="w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4">
            <Code2 className="text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Code & Logic</h3>
          <p className="text-gray-400 text-sm">Follow along with highlighted pseudocode and a detailed status log for every operation.</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl">
           <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center mb-4">
            <GitGraph className="text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Interactive Inputs</h3>
          <p className="text-gray-400 text-sm">Draw your own graphs, generate random arrays, and test edge cases instantly.</p>
        </div>
      </div>

      {/* Category Selection */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-4">
          Explore Categories
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {algorithms && Object.keys(algorithms).map((category) => (
              <Link
                key={category}
                to={`/${category}`}
                className="group relative bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-500/50 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                    <div className="p-3 bg-gray-900 rounded-xl border border-gray-700 group-hover:border-blue-500/30 transition-colors">
                        {getCategoryIcon(category)}
                    </div>
                    <div className="bg-gray-900 rounded-full p-2 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all">
                        <ArrowRight size={20} />
                    </div>
                </div>
                
                <div>
                    <h3 className="text-2xl font-bold text-white capitalize mb-2 group-hover:text-blue-400 transition-colors">
                        {category}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                        {getCategoryDescription(category)}
                    </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}