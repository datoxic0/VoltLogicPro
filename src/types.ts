/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NodeType = 
  | 'contact-no' 
  | 'contact-nc' 
  | 'coil' 
  | 'coil-latch'
  | 'coil-unlatch'
  | 'one-shot'
  | 'timer-on' 
  | 'timer-off'
  | 'retentive-timer'
  | 'counter-up'
  | 'counter-down'
  | 'reset'
  | 'compare-eq'
  | 'compare-ne'
  | 'compare-lt'
  | 'compare-gt'
  | 'math-add'
  | 'math-sub'
  | 'math-mul'
  | 'math-div'
  | 'math-mov'
  | 'branch-start'
  | 'branch-end'
  | 'wire-vertical'
  | 'wire-junction';

export interface LadderNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  tag: string;       // Name of component
  address: string;   // PLC address (e.g., I:0/1, O:0/1, B3:0/0)
  description?: string; // Optional description
  params?: {
    preset?: number;
    accum?: number;
    sourceA?: string | number;
    sourceB?: string | number;
    dest?: string;
  };
}

export interface Wire {
  id: string;
  fromId: string;
  fromSide: 'left' | 'right';
  toId: string;
  toSide: 'left' | 'right';
  points: number[];
}

export interface LadderState {
  nodes: LadderNode[];
  wires: Wire[];
  rungComments?: Record<number, string>;
  simulation: {
    isRunning: boolean;
    forcesEnabled: boolean;
    forces: Record<string, boolean | number>;
    values: Record<string, boolean | number>;
    history: Record<string, number[]>;
    logs: { id: string; timestamp: number; message: string; type: 'info' | 'warning' | 'error' }[];
  };
}

export const GRID_SIZE = 32;
export const RUNG_HEIGHT = 128; 
export const NODE_WIDTH = 96;
export const NODE_HEIGHT = 48;
export const LEFT_RAIL_X = 64; 
export const RIGHT_RAIL_X = 1120;
