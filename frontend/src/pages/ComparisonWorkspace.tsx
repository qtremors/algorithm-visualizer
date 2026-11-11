import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAlgorithms } from '../contexts/algorithm-context';
import { useEditorSession } from '../hooks/useEditorSession';
import { useComparison } from '../hooks/useComparison';
import { useGraphEditor } from '../hooks/useGraphEditor';
import { algorithmInputError } from '../lib/input';
import type { GridTool, InputData } from '../types/input';
import WorkspaceHeader from '../components/workspace/WorkspaceHeader';
import VisualizerPanel from '../components/workspace/VisualizerPanel';
import InfoModal from '../components/core/InfoModal';
import RunSummary from '../components/core/RunSummary';
import LearningTabs from '../components/core/LearningTabs';
import Timeline from '../components/core/Timeline';
import WeightEditor from '../components/core/WeightEditor';
import VisualizerLegend from '../components/core/VisualizerLegend';

export default function ComparisonWorkspace() {
  const { category = 'sorting' } = useParams();
  const { algorithms, isLoading, error } = useAlgorithms();
  const editor = useEditorSession(category);
  const [leftSelection, setLeft] = useState(editor.session.selection);
  const [rightSelection, setRight] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [tool, setTool] = useState<GridTool>('wall');
  const available =
    algorithms && Object.hasOwn(algorithms, category)
      ? algorithms[category]
      : undefined;
  const names = Object.keys(available || {});
  const leftName = names.includes(leftSelection)
    ? leftSelection
    : names[0] || '';
  const rightName = names.includes(rightSelection)
    ? rightSelection
    : names[1] || names[0] || '';
  const comparison = useComparison(category, leftName, rightName);
  const { session } = editor;
  const input: InputData | null =
    category === 'trees'
      ? session.drafts.tree
      : category === 'sorting'
        ? session.drafts.array
        : session.view === 'grid'
          ? session.drafts.grid
          : session.drafts.graph;
  const update = (data: InputData | null) => {
    if (!comparison.busy) {
      comparison.reset();
      editor.update(data);
    }
  };
  const graph = useGraphEditor(session.drafts.graph, comparison.busy, update);
  if (isLoading) return <p role="status">Loading algorithms...</p>;
  if (!available || error)
    return (
      <p>
        Comparison is unavailable. <Link to="/">Return home</Link>
      </p>
    );
  const validation =
    algorithmInputError(input, available[leftName]) ||
    algorithmInputError(input, available[rightName]);
  const p = comparison.playback;
  return (
    <div className="space-y-4 min-w-0">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Compare {category} algorithms</h1>
        <Link className="text-blue-300 text-sm" to={`/${category}`}>
          Single workspace
        </Link>
      </header>
      <p className="text-sm text-gray-400">
        Both lanes use identical input and one shared timeline. The shorter run
        holds its last frame while the longer run continues.
      </p>
      <div className="comparison-selectors">
        {[
          { label: 'Left algorithm', name: leftName, change: setLeft },
          { label: 'Right algorithm', name: rightName, change: setRight },
        ].map(({ label, name, change }) => (
          <div key={label} className="control-field">
            <label
              className="text-xs text-gray-400"
              htmlFor={
                label === 'Left algorithm'
                  ? 'comparison-left'
                  : 'comparison-right'
              }
            >
              {label}
            </label>
            <div className="flex gap-2 min-w-0">
              <select
                id={
                  label === 'Left algorithm'
                    ? 'comparison-left'
                    : 'comparison-right'
                }
                aria-label={label}
                disabled={comparison.busy}
                className="control-input"
                value={name}
                onChange={(event) => {
                  comparison.reset();
                  change(event.target.value);
                }}
              >
                {names.map((key) => (
                  <option key={key} value={key}>
                    {available[key].name}
                  </option>
                ))}
              </select>
              <button
                className="control-icon"
                aria-label={`About ${label.toLowerCase()}`}
                onClick={() => setInfo(name)}
              >
                i
              </button>
            </div>
          </div>
        ))}
      </div>
      {category === 'pathfinding' && (
        <div className="tool-group" role="group" aria-label="Pathfinding view">
          <button
            className="action-secondary"
            aria-pressed={session.view === 'grid'}
            disabled={comparison.busy}
            onClick={() => {
              comparison.reset();
              editor.setView('grid');
            }}
          >
            Grid View
          </button>
          <button
            className="action-secondary"
            aria-pressed={session.view === 'graph'}
            disabled={comparison.busy}
            onClick={() => {
              comparison.reset();
              editor.setView('graph');
            }}
          >
            Graph View
          </button>
        </div>
      )}
      <WorkspaceHeader
        hideAlgorithm
        category={category}
        algorithms={available}
        selectedAlgoName={leftName}
        onAlgoChange={(name) => {
          comparison.reset();
          setLeft(name);
        }}
        viewMode={session.view}
        onViewModeChange={(view) => {
          comparison.reset();
          editor.setView(view);
        }}
        onOpenInfo={() => setInfo(leftName)}
        busy={comparison.busy}
        inputData={input}
        onInputUpdate={update}
        visualizationMode={tool}
        setVisualizationMode={setTool}
        graphTool={graph.tool}
        setGraphTool={graph.setTool}
        directed={graph.directed}
        onDirectedChange={graph.setDirected}
        seed={session.seed}
      />
      <div className="comparison-controls">
        <button
          className="action-primary"
          disabled={comparison.busy || !!validation}
          onClick={() => input && comparison.run(input)}
        >
          Compare algorithms
        </button>
        <button
          className="action-secondary"
          disabled={!comparison.count}
          onClick={p.isPlaying ? p.pause : p.play}
        >
          {p.isPlaying ? 'Pause comparison' : 'Play comparison'}
        </button>
        <button className="action-secondary" onClick={comparison.reset}>
          Reset comparison
        </button>
        <label className="playback-speed">
          Speed
          <input
            aria-label="Comparison speed"
            type="range"
            min={10}
            max={500}
            value={510 - p.speed}
            onChange={(event) => p.setSpeed(510 - Number(event.target.value))}
          />
        </label>
      </div>
      {validation && <p className="text-sm text-amber-300">{validation}</p>}
      {(comparison.failed || graph.error) && (
        <p role="alert" className="text-red-300">
          {comparison.left.error || comparison.right.error || graph.error}
        </p>
      )}
      <Timeline
        breakpointHint={false}
        index={p.currentStepIndex}
        length={comparison.count}
        streaming={comparison.streaming}
        disabled={!comparison.count || comparison.failed}
        onSeek={p.seek}
        operation={p.operation}
        onOperationChange={p.setOperation}
      />
      <VisualizerLegend category={category} />
      <div className="comparison-lanes">
        {[
          {
            runner: comparison.left,
            name: leftName,
            index: comparison.leftIndex,
          },
          {
            runner: comparison.right,
            name: rightName,
            index: comparison.rightIndex,
          },
        ].map(({ runner, name, index }, lane) => (
          <section
            key={lane}
            aria-label={lane === 0 ? 'Left comparison' : 'Right comparison'}
            className="comparison-lane"
          >
            <h2 className="comparison-lane-heading font-semibold">
              <span>{available[name].name}</span>
              <span className="text-xs text-gray-400 font-normal">
                {runner.status}
                {runner.steps.length
                  ? ` · ${index + 1}/${runner.steps.length}`
                  : ''}
              </span>
            </h2>
            <div className="comparison-canvas">
              <VisualizerPanel
                algorithmMetadata={available[name]}
                currentStep={runner.steps[index]}
                inputData={input}
                visualizationMode={tool}
                graphTool={graph.tool}
                busy={comparison.busy}
                onInputUpdate={update}
                onGraphInteraction={graph.interact}
                onWeightChange={graph.weightClick}
                tempLine={graph.line}
                zoom={1}
                isFitToScreen
                showEdgeColors={false}
                showPath
              />
            </div>
            <RunSummary
              steps={runner.steps}
              index={index}
              metrics={runner.metrics}
              category={category}
            />
            <LearningTabs
              code={available[name].pseudocode}
              step={runner.steps[index]}
              steps={runner.steps}
              index={index}
              algorithm={name}
              messages={runner.steps
                .slice(0, index + 1)
                .map((step) => step.message)}
            />
          </section>
        ))}
      </div>
      {info && (
        <InfoModal metadata={available[info]} onClose={() => setInfo(null)} />
      )}
      {graph.edge && (
        <WeightEditor
          {...graph.edge}
          onSave={graph.saveWeight}
          onClose={graph.closeWeight}
        />
      )}
    </div>
  );
}
