import { Link } from 'react-router-dom';
import { useAlgorithms } from '../contexts/AlgorithmContext.tsx';
import { ArrowRight, BarChart3, GitGraph, Zap, Code2, Loader2, Cpu, Play, Server } from 'lucide-react';
import { cn } from '../lib/utils.ts';

const SplitText = ({ text, className }: { text: string, className?: string }) => (
  <span className={cn("lando-text", className)}>
    {text.split("").map((char, i) => (
      <span key={i} className="lando-char" style={{ '--i': i } as React.CSSProperties}>
        {char === " " ? "\u00A0" : char}
      </span>
    ))}
  </span>
);

export default function HomePage() {
  const { algorithms, isLoading, isServerWaking } = useAlgorithms();

  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('sort')) return <BarChart3 className="w-8 h-8 text-indigo-400" />;
    if (category.toLowerCase().includes('path')) return <GitGraph className="w-8 h-8 text-emerald-400" />;
    return <Cpu className="w-8 h-8 text-pink-400" />;
  };

  const getCategoryColor = (category: string) => {
    if (category.toLowerCase().includes('sort')) return "from-indigo-500/20 to-blue-600/5 border-indigo-500/30 hover:border-indigo-400";
    if (category.toLowerCase().includes('path')) return "from-emerald-500/20 to-teal-600/5 border-emerald-500/30 hover:border-emerald-400";
    return "from-pink-500/20 to-rose-600/5 border-pink-500/30 hover:border-pink-400";
  };

  const getCategoryDescription = (category: string) => {
    if (category.toLowerCase().includes('sort')) return "Master the art of ordering. Visualize Bubble, Insertion, and Selection sort in real-time.";
    if (category.toLowerCase().includes('path')) return "Navigate the maze. Watch BFS, DFS, and Dijkstra find the shortest path through complex grids.";
    return "Explore fundamental algorithmic concepts through interactive visualizations.";
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center">
      
      <div className="container mx-auto px-4 py-16 flex flex-col gap-16 items-center">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto group cursor-default">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium">
            <Zap size={14} fill="currentColor" className="text-yellow-400"/>
            Interactive Learning Tool
          </div>
          
          <div className="flex flex-col items-center">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-snug">
               <SplitText text="Master Algorithms" />
               <br/>
               <span className="text-blue-500">
                 <SplitText text="Visually" />
               </span>
            </h1>
          </div>
          
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            A powerful visualization tool designed to help you understand complex algorithms through real-time animations and step-by-step execution.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <a href="#algorithms" className="px-8 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20">
              <Play size={18} fill="currentColor" /> Start Visualizing
            </a>
          </div>
        </div>

        {/* Algorithm Categories */}
        <div id="algorithms" className="w-full max-w-5xl scroll-mt-24">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />

                    {/* Conditional Waking Message */}
                    {isServerWaking && (
                        <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="flex items-center gap-2 text-yellow-400 font-medium bg-yellow-400/10 px-4 py-2 rounded-full border border-yellow-400/20">
                                <Server size={16} /> Server is waking up...
                            </span>
                            <p className="text-gray-500 text-sm mt-3 max-w-md">
                                Using Render's free tier. This usually takes about <span className="text-gray-300 font-bold">50 seconds</span> for the initial cold start. Please hold on!
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {algorithms && Object.keys(algorithms).map((category) => (
                    <Link
                        key={category}
                        to={`/${category}`}
                        className={`group relative overflow-hidden rounded-3xl border p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-gradient-to-br ${getCategoryColor(category)} bg-gray-800/50`}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-6 h-6 text-white -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                        </div>

                        <div className="flex flex-col h-full justify-between gap-6">
                            <div>
                                <div className="mb-4 inline-block rounded-2xl bg-gray-900 p-3 shadow-inner border border-gray-800">
                                    {getCategoryIcon(category)}
                                </div>
                                <h2 className="text-3xl font-bold text-white capitalize mb-2">
                                    {category}
                                </h2>
                                <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                                    {getCategoryDescription(category)}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 group-hover:text-white transition-colors">
                                <span>Launch Visualizer</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                    ))}
                </div>
            )}
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl pt-12 border-t border-gray-800">
             <FeatureItem 
                icon={<Zap className="text-yellow-400" />}
                title="Lightning Fast"
                desc="Powered by a FastAPI backend and WebSocket streaming for instant, lag-free visualizations."
             />
             <FeatureItem 
                icon={<Code2 className="text-blue-400" />}
                title="Code Sync"
                desc="Real-time pseudocode highlighting lets you follow the logic line-by-line as it executes."
             />
             <FeatureItem 
                icon={<GitGraph className="text-purple-400" />}
                title="Interactive Grids"
                desc="Draw walls, move nodes, and generate mazes to test pathfinding edge cases dynamically."
             />
        </div>

      </div>
    </div>
  );
}

const FeatureItem = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div className="flex flex-col items-center text-center gap-3 p-4">
        <div className="p-3 rounded-full bg-gray-800 border border-gray-700 shadow-sm">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-gray-200">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
);