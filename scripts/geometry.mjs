/** Foundry V14 token reach: occupy grid squares, not artwork centers. */
export function tokenReachFeet(a, b, grid, gridSize, gridDistance) {
  const size = Number(gridSize), cellDistance = Number(gridDistance);
  if (!(size > 0 && cellDistance > 0)) return Infinity;
  const bounds = token => {
    const d = token?.document ?? token;
    const x = Number(d?.x ?? token?.x), y = Number(d?.y ?? token?.y);
    const width = Number(token?.w ?? (Number(d?.width) * size));
    const height = Number(token?.h ?? (Number(d?.height) * size));
    return [x, y, width, height].every(Number.isFinite) && width > 0 && height > 0
      ? { x, y, width, height } : null;
  };
  const ra = bounds(a), rb = bounds(b);
  if (!ra || !rb) return Infinity;
  const center = r => ({x:r.x+r.width/2,y:r.y+r.height/2});
  const square = grid?.isSquare === true || (grid?.isSquare !== false && !grid?.isGridless && !grid?.isHexagonal);
  if (square) {
    const cells = r => {
      try {
        const arr = grid?.getOffsetRange?.(r);
        if (Array.isArray(arr) && arr.length === 4 && arr.every(Number.isFinite)
            && arr[2] > arr[0] && arr[3] > arr[1]) return arr;
      } catch { /* Pixel fallback if grid internals differ */ }
      const epsilon = Math.min(0.01, size * 0.00001);
      return [Math.floor((r.x + epsilon)/size),Math.floor((r.y + epsilon)/size),
        Math.ceil((r.x + r.width - epsilon)/size),Math.ceil((r.y + r.height - epsilon)/size)];
    };
    const [ai0,aj0,ai1,aj1] = cells(ra);
    const [bi0,bj0,bi1,bj1] = cells(rb);
    const gap = (a0,a1,b0,b1) => Math.max(0,a0-b1+1,b0-a1+1);
    const dx = gap(ai0,ai1,bi0,bi1), dy = gap(aj0,aj1,bj0,bj1);
    const steps = Math.max(dx,dy);
    // D&D 5e melee reach: adjacent cells, INCLUDING diagonal, are within 5 feet.
    if (steps <= 1) return steps * cellDistance;
    if (typeof grid?.getCenterPoint === "function" && typeof grid?.measurePath === "function") {
      const closest = (a0,a1,b0,b1) => a1 <= b0 ? [a1-1,b0]
        : b1 <= a0 ? [a0,b1-1] : [Math.max(a0,b0),Math.max(a0,b0)];
      const [ai,bi] = closest(ai0,ai1,bi0,bi1), [aj,bj] = closest(aj0,aj1,bj0,bj1);
      try {
        const p1 = grid.getCenterPoint({i:ai,j:aj}), p2 = grid.getCenterPoint({i:bi,j:bj});
        const measured = Number(grid.measurePath([p1,p2])?.distance);
        if (Number.isFinite(measured) && measured >= 0) return measured;
      } catch { /* distance fallback below */ }
    }
    return steps * cellDistance;
  }
  if (grid?.isGridless) {
    const dx = Math.max(0,ra.x-rb.x-rb.width,rb.x-ra.x-ra.width);
    const dy = Math.max(0,ra.y-rb.y-rb.height,rb.y-ra.y-ra.height);
    return Math.hypot(dx,dy) / size * cellDistance;
  }
  // Hex and other grid types are measured using the scene's native rules.
  try {
    const result = Number(grid?.measurePath?.([center(ra),center(rb)])?.distance);
    if (Number.isFinite(result) && result >= 0) return result;
  } catch { /* final fallback */ }
  return Math.hypot(center(ra).x-center(rb).x,center(ra).y-center(rb).y)/size*cellDistance;
}