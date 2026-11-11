import { useState } from 'react';
import type { TreeInputData } from '../../types/input';
import { parseArray } from '../../lib/input';

export default function TreeInput({
  data,
  onChange,
  disabled,
}: {
  data: TreeInputData;
  onChange: (data: TreeInputData) => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState({
    source: data.values,
    text: data.values.join(', '),
  });
  const [operation, setOperation] = useState<'insert' | 'delete' | 'search'>(
    'insert',
  );
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const text =
    draft.source === data.values ? draft.text : data.values.join(', ');
  const editValues = (text: string) => {
    try {
      const values = text.trim() ? parseArray(text) : [];
      if (values.length > 40) throw new Error('Use at most 40 initial values.');
      setDraft({ source: values, text });
      onChange({ ...data, values, invalid: false });
      setError('');
    } catch (problem) {
      setDraft({ source: data.values, text });
      onChange({ ...data, invalid: true });
      setError(problem instanceof Error ? problem.message : 'Invalid values.');
    }
  };
  const add = () => {
    if (
      !/^[+-]?\d+$/.test(value.trim()) ||
      !Number.isSafeInteger(Number(value))
    ) {
      setError('Use a safe integer for the operation.');
      return;
    }
    if (data.operations.length >= 40) {
      setError('Use at most 40 operations.');
      return;
    }
    onChange({
      ...data,
      operations: [
        ...data.operations,
        { type: operation, value: Number(value) },
      ],
    });
    setError('');
  };
  return (
    <fieldset disabled={disabled} className="grid-editor">
      <legend className="sr-only">Tree input</legend>
      <label className="control-field">
        <span>Initial values</span>
        <input
          aria-label="Tree values"
          className="control-input font-mono"
          value={text}
          onChange={(event) => editValues(event.target.value)}
        />
      </label>
      <div className="grid-editor-row">
        <label className="control-field">
          <span>Operation</span>
          <select
            aria-label="Tree operation"
            value={operation}
            onChange={(event) =>
              setOperation(event.target.value as typeof operation)
            }
            className="control-input"
          >
            <option value="insert">Insert</option>
            <option value="delete">Delete</option>
            <option value="search">Search</option>
          </select>
        </label>
        <label className="control-field w-24">
          <span>Value</span>
          <input
            aria-label="Tree operation value"
            type="number"
            className="control-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <button type="button" className="action-secondary" onClick={add}>
          Add operation
        </button>
        <label className="control-field">
          <span>Traversal</span>
          <select
            aria-label="Tree traversal"
            className="control-input"
            value={data.traversal}
            onChange={(event) =>
              onChange({
                ...data,
                traversal: event.target.value as TreeInputData['traversal'],
              })
            }
          >
            <option value="inorder">Inorder</option>
            <option value="preorder">Preorder</option>
            <option value="postorder">Postorder</option>
          </select>
        </label>
        <button
          type="button"
          className="action-secondary"
          onClick={() => onChange({ ...data, operations: [] })}
        >
          Clear operations
        </button>
      </div>
      {!!data.operations.length && (
        <ol
          aria-label="Tree operations"
          className="flex flex-wrap gap-2 text-xs"
        >
          {data.operations.map((op, i) => (
            <li key={i}>
              <button
                type="button"
                aria-label={`Remove operation ${i + 1}`}
                className="action-secondary"
                onClick={() =>
                  onChange({
                    ...data,
                    operations: data.operations.filter(
                      (_, index) => index !== i,
                    ),
                  })
                }
              >
                {op.type} {op.value} ×
              </button>
            </li>
          ))}
        </ol>
      )}
      {error && (
        <p role="alert" className="text-red-300 text-sm">
          {error}
        </p>
      )}
    </fieldset>
  );
}
