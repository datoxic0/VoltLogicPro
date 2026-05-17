import { LadderNode, LadderState } from './types';

/**
 * Simplified Ladder Logic Solver
 * For real-life usage, this would be a scan-cycle based solver.
 */
export function solveCircuit(state: LadderState): Record<string, boolean | number> {
  const values = { ...state.simulation.values };
  
  // Scoped references for internal state if needed
  // For timers, we need to track accumulation over time.
  // We'll store it directly in values with a prefix for simplicity.

  const rungsY = Array.from(new Set(state.nodes.map(n => Math.round(n.y))));
  rungsY.sort((a, b) => a - b);

  for (const y of rungsY) {
    const rungNodes = state.nodes.filter(n => Math.round(n.y) === y);
    rungNodes.sort((a, b) => a.x - b.x); // Left to right

    const outputs = rungNodes.filter(n => 
      n.type === 'coil' || 
      n.type === 'coil-latch' ||
      n.type === 'coil-unlatch' ||
      n.type === 'one-shot' ||
      n.type === 'timer-on' || 
      n.type === 'timer-off' ||
      n.type === 'retentive-timer' ||
      n.type === 'counter-up' || 
      n.type === 'counter-down' ||
      n.type === 'reset' ||
      n.type.startsWith('compare') ||
      n.type.startsWith('math')
    );
    
    // Simple series continuity helper
    const checkPathTo = (targetX: number) => {
      const seriesToLeft = rungNodes.filter(n => n.type.startsWith('contact') && n.x < targetX);
      if (seriesToLeft.length === 0) return true; // Direct connection if nothing is in series
      
      return seriesToLeft.every(contact => {
        const addrVal = Boolean(values[contact.address]);
        return contact.type === 'contact-no' ? addrVal : !addrVal;
      });
    };

    const getValue = (valOrAddr: string | number | undefined): number => {
      if (valOrAddr === undefined) return 0;
      if (typeof valOrAddr === 'number') return valOrAddr;
      if (values[valOrAddr] !== undefined) return Number(values[valOrAddr]);
      return 0;
    };

    for (const output of outputs) {
      const isPathEnergized = checkPathTo(output.x);
      
      // Update Output based on path
      if (output.type === 'coil') {
        values[output.address] = isPathEnergized;
      } else if (output.type === 'coil-latch') {
        if (isPathEnergized) values[output.address] = true;
      } else if (output.type === 'coil-unlatch') {
        if (isPathEnergized) values[output.address] = false;
      } else if (output.type === 'one-shot') {
        const lastStateKey = `${output.address}_ONS_LAST`;
        const lastState = Boolean(values[lastStateKey]);
        const result = isPathEnergized && !lastState;
        values[lastStateKey] = isPathEnergized;
        values[output.address] = result;
      } else if (output.type === 'timer-on') {
        const preset = (output.params?.preset || 0) * 1000;
        const accumKey = `${output.address}_ACC`;
        const dnKey = `${output.address}_DN`;
        let accum = Number(values[accumKey]) || 0;

        if (isPathEnergized) {
          if (accum < preset) {
             accum += 100; // Assuming 100ms interval
          }
        } else {
          accum = 0; 
        }
        
        values[accumKey] = accum;
        values[dnKey] = preset > 0 && accum >= preset;
        values[output.address] = values[dnKey]; // Main bit is DN
      } else if (output.type === 'timer-off') {
        const preset = (output.params?.preset || 0) * 1000;
        const accumKey = `${output.address}_ACC`;
        const dnKey = `${output.address}_DN`;
        let accum = Number(values[accumKey]) || 0;

        if (!isPathEnergized) {
          if (accum < preset) {
            accum += 100;
          }
        } else {
          accum = 0;
        }

        values[accumKey] = accum;
        values[dnKey] = isPathEnergized || (preset > 0 && accum < preset);
        values[output.address] = values[dnKey];
      } else if (output.type === 'retentive-timer') {
        const preset = (output.params?.preset || 0) * 1000;
        const accumKey = `${output.address}_ACC`;
        const dnKey = `${output.address}_DN`;
        let accum = Number(values[accumKey]) || 0;

        if (isPathEnergized && accum < preset) {
          accum += 100;
        }

        values[accumKey] = accum;
        values[dnKey] = preset > 0 && accum >= preset;
        values[output.address] = values[dnKey];
      } else if (output.type === 'counter-up') {
        const preset = output.params?.preset || 0;
        const accumKey = `${output.address}_ACC`;
        const cuKey = `${output.address}_CU`;
        const dnKey = `${output.address}_DN`;
        const lastInKey = `${output.address}_LAST_IN`;
        
        let accum = Number(values[accumKey]) || 0;
        const lastIn = Boolean(values[lastInKey]);

        // Rising edge detection for counter
        if (isPathEnergized && !lastIn) {
          accum += 1;
        }

        values[accumKey] = accum;
        values[cuKey] = isPathEnergized;
        values[dnKey] = accum >= preset;
        values[lastInKey] = isPathEnergized;
        values[output.address] = values[dnKey];
      } else if (output.type === 'counter-down') {
        const preset = output.params?.preset || 0;
        const accumKey = `${output.address}_ACC`;
        const cdKey = `${output.address}_CD`;
        const dnKey = `${output.address}_DN`;
        const lastInKey = `${output.address}_LAST_IN`;
        
        let accum = Number(values[accumKey]) || 0;
        const lastIn = Boolean(values[lastInKey]);

        if (isPathEnergized && !lastIn) {
          accum -= 1;
        }

        values[accumKey] = accum;
        values[cdKey] = isPathEnergized;
        values[dnKey] = accum >= preset;
        values[lastInKey] = isPathEnergized;
        values[output.address] = values[dnKey];
      } else if (output.type === 'reset') {
        if (isPathEnergized) {
          values[`${output.address}_ACC`] = 0;
          values[`${output.address}_DN`] = false;
          values[output.address] = false;
        }
      } else if (output.type.startsWith('compare-')) {
        const a = getValue(output.params?.sourceA);
        const b = getValue(output.params?.sourceB);
        let result = false;
        
        if (output.type === 'compare-eq') result = a === b;
        else if (output.type === 'compare-ne') result = a !== b;
        else if (output.type === 'compare-lt') result = a < b;
        else if (output.type === 'compare-gt') result = a > b;
        
        values[output.address] = result;
      } else if (output.type.startsWith('math-')) {
        if (isPathEnergized) {
          const a = getValue(output.params?.sourceA);
          const b = getValue(output.params?.sourceB);
          const dest = output.params?.dest || output.address;
          let result = 0;
          
          if (output.type === 'math-add') result = a + b;
          else if (output.type === 'math-sub') result = a - b;
          else if (output.type === 'math-mul') result = a * b;
          else if (output.type === 'math-div') result = b !== 0 ? a / b : 0;
          else if (output.type === 'math-mov') result = a;
          
          values[dest] = result;
        }
      }
    }
  }

  // Apply Forces
  if (state.simulation.forcesEnabled && state.simulation.forces) {
    Object.entries(state.simulation.forces).forEach(([addr, val]) => {
      values[addr] = val;
    });
  }

  return values;
}
