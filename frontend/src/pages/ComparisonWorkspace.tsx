import { useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { useAlgorithms } from '../contexts/algorithm-context';
import { useEditorSession } from '../hooks/useEditorSession';
import { useComparison } from '../hooks/useComparison';
import { usePlaybackShortcuts } from '../hooks/usePlaybackShortcuts';
import { useGraphEditor } from '../hooks/useGraphEditor';
import { algorithmInputError } from '../lib/input';
import type { GridTool, InputData } from '../types/input';
import WorkspaceHeader from '../components/workspace/WorkspaceHeader';
import VisualizerPanel from '../components/workspace/VisualizerPanel';
import InfoModal from '../components/core/InfoModal';
import { ArrowLeftRight } from 'lucide-react';
import { categoryNames } from '../lib/presentation';
import { playbackRate } from '../lib/runState';
import RangeControl from '../components/core/RangeControl';
import RunBadge from '../components/core/RunBadge';
import ComparisonOutcome from '../components/workspace/ComparisonOutcome';
import RunSummary from '../components/core/RunSummary';
import LearningTabs from '../components/core/LearningTabs';
import Timeline from '../components/core/Timeline';
import WeightEditor from '../components/core/WeightEditor';
import VisualizerLegend from '../components/core/VisualizerLegend';

export default function ComparisonWorkspace() {
  const { category = 'sorting' } = useParams();
  const { algorithms, isLoading } = useAlgorithms();
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
  usePlaybackShortcuts({
    length: comparison.count,
    playing: comparison.playback.isPlaying,
    failed: comparison.failed,
    play: comparison.playback.play,
    pause: comparison.playback.pause,
    next: comparison.playback.nextStep,
    previous: comparison.playback.prevStep,
    first: comparison.playback.first,
    last: comparison.playback.last,
    reset: comparison.reset,
  });
  if (isLoading) return <p role="status">Loading algorithms...</p>;
  if (!available)
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
      <header className="workspace-heading">
        <div>
          <p className="section-eyebrow">Side-by-side learning</p>
          <h1>
            Compare {categoryNames[category]?.toLowerCase() || category}{' '}
            algorithms
          </h1>
        </div>
        <Link className="action-secondary" to={`/${category}`}>
          Single workspace
        </Link>
      </header>
      <p className="text-sm text-gray-400">
        Both lanes use identical input and one shared timeline. The shorter run
        holds its last frame while the longer run continues.
      </p>
      <nav
        className="comparison-category-links"
        aria-label="Comparison category"
      >
        {Object.entries(categoryNames).map(([key, label]) => (
          <NavLink key={key} to={`/compare/${key}`}>
            {label}
          </NavLink>
        ))}
      </nav>
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
        <div className="comparison-selector-footer">
          <span>One shared input for both lanes</span>
          <button
            className="action-secondary"
            disabled={comparison.busy}
            onClick={() => {
              comparison.reset();
              setLeft(rightName);
              setRight(leftName);
            }}
          >
            <ArrowLeftRight size={15} aria-hidden="true" />
            Swap algorithms
          </button>
        </div>
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
          disabled={!comparison.count || comparison.failed}
          onClick={p.isPlaying ? p.pause : p.play}
        >
          {p.isPlaying ? 'Pause comparison' : 'Play comparison'}
        </button>
        <button className="action-secondary" onClick={comparison.reset}>
          Reset comparison
        </button>
        <RangeControl
          label="Speed"
          accessibleLabel="Comparison speed"
          value={510 - p.speed}
          min={10}
          max={500}
          displayValue={playbackRate(p.speed)}
          onChange={(value) => p.setSpeed(510 - value)}
        />
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
      <VisualizerLegend category={category} view={session.view} />
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
              <span className="comparison-lane-state">
                <RunBadge
                  status={runner.status}
                  length={runner.steps.length}
                  index={index}
                  playing={p.isPlaying}
                />
                <span>
                  {runner.steps.length
                    ? ` · ${index + 1}/${runner.steps.length}`
                    : ''}
                </span>
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
      <ComparisonOutcome
        category={category}
        complete={
          comparison.left.status === 'completed' &&
          comparison.right.status === 'completed'
        }
        left={{
          name: available[leftName].name,
          steps: comparison.left.steps,
          metrics: comparison.left.metrics,
        }}
        right={{
          name: available[rightName].name,
          steps: comparison.right.steps,
          metrics: comparison.right.metrics,
        }}
      />
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
