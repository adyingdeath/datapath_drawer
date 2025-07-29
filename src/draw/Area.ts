/**
 * Defines a basic rectangular region on the grid.
 * (x, y) is the top-left coordinate.
 * dx/dy are optional width/height, defaulting to 1.
 */
export interface Grid {
    x: number;
    y: number;
    dx?: number; // width in grid units
    dy?: number; // height in grid units
}

/**
 * Represents an arbitrary area on a 2D grid.
 * 
 * An Area is defined by a set of "positive" regions and a set of "negative" regions (holes).
 * A point (x, y) is considered part of the Area if it falls within a positive region
 * but NOT within a negative region. This allows for complex shapes like doughnuts.
 * 
 * The internal lists of grids are always kept optimized by merging overlapping
 * or adjacent rectangles.
 */
export class Area {
    /** A list of grids that are explicitly included in the area. */
    private positive: Grid[] = [];

    /** A list of grids that are explicitly excluded (holes) from the positive area. */
    private negative: Grid[] = [];

    /**
     * Creates a new Area instance.
     * @param initialGrids - An optional array of grids to initialize the Area's positive space.
     */
    public constructor(initialGrids?: Grid[]) {
        if (initialGrids && initialGrids.length > 0) {
            this.add(initialGrids);
        }
    }

    /**
     * Adds new positive regions to this Area. The added grids will be
     * merged with the existing positive regions.
     * @param gridsToAdd - An array of Grid objects to add.
     * @returns The current Area instance for method chaining.
     * 
     * @example
     * const area = new Area();
     * area.add([{ x: 0, y: 0, dx: 5, dy: 5 }]); // Adds a 5x5 square
     */
    public add(gridsToAdd: Grid[]): this {
        if (!gridsToAdd || gridsToAdd.length === 0) {
            return this;
        }
        const allPositive = [...this.positive, ...gridsToAdd];
        this.positive = Area._mergeGrids(allPositive);
        return this;
    }

    /**
     * Subtracts regions from this Area, effectively creating holes.
     * The subtracted grids will be merged with the existing negative regions.
     * @param gridsToSubtract - An array of Grid objects to subtract.
     * @returns The current Area instance for method chaining.
     * 
     * @example
     * const doughnut = new Area([{ x: 0, y: 0, dx: 5, dy: 5 }])
     *   .subtract([{ x: 1, y: 1, dx: 3, dy: 3 }]); // Creates a 3x3 hole in a 5x5 square
     */
    public subtract(gridsToSubtract: Grid[]): this {
        if (!gridsToSubtract || gridsToSubtract.length === 0) {
            return this;
        }
        const allNegative = [...this.negative, ...gridsToSubtract];
        this.negative = Area._mergeGrids(allNegative);
        return this;
    }

    /**
     * Checks if a specific grid coordinate is occupied by this Area.
     * A point is occupied if it is within a positive region AND NOT within a negative region.
     * @param x - The x-coordinate to check.
     * @param y - The y-coordinate to check.
     * @returns `true` if the coordinate is occupied, `false` otherwise.
     */
    public isOccupied(x: number, y: number): boolean {
        // The point must be within a positive region.
        const isInPositive = Area._isPointInGrids(x, y, this.positive);
        if (!isInPositive) {
            return false;
        }

        // And it must NOT be within a negative (hole) region.
        const isInNegative = Area._isPointInGrids(x, y, this.negative);
        
        return !isInNegative;
    }
    
    /**
     * Returns the optimized list of positive regions for this Area.
     * Note: This does NOT account for the negative (hole) regions. This is primarily
     * useful for external systems like pathfinders that need a simple list of obstacles.
     * @returns A readonly array of the positive `Grid` regions.
     */
    public getPositiveRegions(): readonly Grid[] {
        return this.positive;
    }

    /**
     * Creates a new Area that is the union of two existing Areas.
     * The positive and negative regions of both areas are combined and merged.
     * @param a - The first Area.
     * @param b - The second Area.
     * @returns A new Area instance representing the union of `a` and `b`.
     */
    public static union(a: Area, b: Area): Area {
        const newArea = new Area();
        
        newArea.positive = Area._mergeGrids([...a.positive, ...b.positive]);
        newArea.negative = Area._mergeGrids([...a.negative, ...b.negative]);
        
        return newArea;
    }

    /**
     * Internal helper to check if a point is within any grid in a given list.
     */
    private static _isPointInGrids(x: number, y: number, grids: Grid[]): boolean {
        for (const grid of grids) {
            if (
                x >= grid.x &&
                x < grid.x + (grid.dx ?? 1) &&
                y >= grid.y &&
                y < grid.y + (grid.dy ?? 1)
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * Merges an array of potentially overlapping grids into a minimal set of
     * non-overlapping grids using a sweep-line algorithm.
     * @param grids - An array of Grid objects.
     * @returns An optimized array of Grid objects.
     */
    private static _mergeGrids(grids: Grid[]): Grid[] {
        if (!grids || grids.length === 0) {
            return [];
        }

        // Step 1: Collect all unique x-coordinates to define vertical "strips".
        const xCoords = new Set<number>();
        for (const grid of grids) {
            xCoords.add(grid.x);
            xCoords.add(grid.x + (grid.dx ?? 1));
        }
        
        const sortedX = Array.from(xCoords).sort((a, b) => a - b);
        const result: Grid[] = [];

        // Step 2: Sweep across each vertical strip.
        for (let i = 0; i < sortedX.length - 1; i++) {
            const x1 = sortedX[i];
            const x2 = sortedX[i+1];
            const stripWidth = x2 - x1;
            
            if (stripWidth <= 0) continue;

            // Step 3: Find all grids covering this strip and get their y-intervals.
            const yIntervals: { start: number, end: number }[] = [];
            for (const grid of grids) {
                if (grid.x <= x1 && (grid.x + (grid.dx ?? 1)) >= x2) {
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
                const newGrid: Grid = { x: x1, y: interval.start };
                const dy = interval.end - interval.start;

                if (stripWidth > 1) newGrid.dx = stripWidth;
                if (dy > 1) newGrid.dy = dy;
                
                result.push(newGrid);
            }
        }

        return result;
    }
}