import { AStarPathfinder } from "./AStarPathFinder";
import type { ConnectionPoint, Grid, Shape } from "./shape/Shape";

export class Scene {
    private gridSize = 15;
    private left = 0;
    private right = 0;
    private top = 0;
    private bottom = 0;

    private shapes: Shape[] = [];
    private occupiedArea: Grid[] = [];

    public constructor(gridSize: number) {
        this.gridSize = gridSize;
    }

    public addShape(shape: Shape) {
        this.shapes.push(shape);

        // Update scene's size
        if (shape.x < this.left) this.left = shape.x;
        if (shape.y < this.top) this.top = shape.y;
        const size = shape.calculateSize();
        if (shape.x + size.width - 1 > this.right) this.right = shape.x + size.width - 1;
        if (shape.y + size.height - 1 > this.bottom) this.bottom = shape.y + size.height - 1;

        // Update scene's occupied area
        if (shape.occupiedArea && shape.occupiedArea.length > 0) {
            const allGrids = [...this.occupiedArea, ...shape.occupiedArea];
            this.occupiedArea = this.mergeGrids(allGrids);
        }
    }
    
    /**
     * Merges an array of potentially overlapping grids into a minimal set of non-overlapping grids.
     * This implementation uses a sweep-line algorithm for high performance.
     * @param grids - An array of Grid objects.
     * @returns An optimized array of Grid objects.
     */
    private mergeGrids(grids: Grid[]): Grid[] {
        if (!grids || grids.length === 0) {
            return [];
        }

        // Step 1: Collect all unique x-coordinates (start and end of each grid).
        // These define the vertical "strips" for the sweep-line.
        const xCoords = new Set<number>();
        for (const grid of grids) {
            xCoords.add(grid.x);
            xCoords.add(grid.x + (grid.dx ?? 1));
        }
        
        const sortedX = Array.from(xCoords).sort((a, b) => a - b);
        const result: Grid[] = [];

        // Step 2: Iterate through each vertical strip defined by two consecutive x-coordinates.
        for (let i = 0; i < sortedX.length - 1; i++) {
            const x1 = sortedX[i];
            const x2 = sortedX[i+1];
            const stripWidth = x2 - x1;
            
            if (stripWidth <= 0) continue;

            // Step 3: For the current strip, find all grids that cover it and collect their y-intervals.
            const yIntervals: { start: number, end: number }[] = [];
            for (const grid of grids) {
                const gridX1 = grid.x;
                const gridX2 = grid.x + (grid.dx ?? 1);
                
                if (gridX1 <= x1 && gridX2 >= x2) {
                    yIntervals.push({ 
                        start: grid.y, 
                        end: grid.y + (grid.dy ?? 1)
                    });
                }
            }

            if (yIntervals.length === 0) continue;
            
            // Step 4: Merge the collected 1D y-intervals.
            yIntervals.sort((a, b) => a.start - b.start);
            
            const mergedYIntervals: { start: number, end: number }[] = [];
            let currentMerge = { ...yIntervals[0] };

            for (let j = 1; j < yIntervals.length; j++) {
                const nextInterval = yIntervals[j];
                // If the next interval overlaps or is adjacent to the current merged one
                if (nextInterval.start <= currentMerge.end) {
                    currentMerge.end = Math.max(currentMerge.end, nextInterval.end);
                } else {
                    mergedYIntervals.push(currentMerge);
                    currentMerge = { ...nextInterval };
                }
            }
            mergedYIntervals.push(currentMerge);

            // Step 5: Create new grids from the merged y-intervals for the current strip.
            for (const interval of mergedYIntervals) {
                const newGrid: Grid = {
                    x: x1,
                    y: interval.start
                };
                const dy = interval.end - interval.start;

                if (stripWidth > 1) newGrid.dx = stripWidth;
                if (dy > 1) newGrid.dy = dy;
                
                result.push(newGrid);
            }
        }

        return result;
    }

    public select(query: string) {
        const firstDot = query.indexOf(".");
        if (firstDot === -1) {
            return this.shapes.find((value) => value.id === query);
        } else {
            const shapeId = query.substring(0, firstDot);
            const shape = this.shapes.find((value) => value.id === shapeId);
            return shape?.findConnectionPoint(query.substring(firstDot + 1));
        }
    }

    public link(port1query: string, port2query: string) {
        const port1 = this.select(port1query) as ConnectionPoint;
        const port2 = this.select(port2query) as ConnectionPoint;

        if (!port1 || !port2) {
            console.error("One or both connection points not found.");
            return;
        }

        const startPoint = { x: port1.x, y: port1.y };
        const endPoint = { x: port2.x, y: port2.y };

        console.log(startPoint, endPoint)
        
        const astar = new AStarPathfinder(this.occupiedArea, this.gridSize);
        const path = astar.findPath(startPoint, endPoint);

        if (path) {
            console.log("Path found:", path);
            return path;
        } else {
            console.log("No path found between the two points.");
        }
    }
}