export type GridInputData = {
    grid: number[][];
    start: { row: number, col: number };
    end: { row: number, col: number };
    rows: number;
    cols: number;
};

export type GraphInputData = {
    nodes: Record<string, { x: number; y: number }>;
    adjacency: Record<string, Record<string, number>>;
    start?: string;
    end?: string;
};

export type ArrayInputData = number[];

export type InputData = GridInputData | GraphInputData | ArrayInputData;
