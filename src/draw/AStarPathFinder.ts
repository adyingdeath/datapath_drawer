/**
 * @interface Point
 * Defines a 2D pixel coordinate.
 */
interface Point {
    x: number;
    y: number;
}

/**
 * @interface Grid
 * Defines a rectangular area in GRID coordinates. This will be converted to pixels.
 * x, y: Top-left corner of the rectangle in the grid.
 * dx, dy: Width and height of the rectangle in grid cells. Defaults to 1.
 */
export interface Grid {
    x: number;
    y: number;
    dx?: number;
    dy?: number;
}

/**
 * @class AStarNode
 * Represents a node (a single pixel) in the A* search.
 */
class AStarNode {
    public x: number;
    public y: number;
    public g: number;
    public h: number;
    public f: number;
    public parent: AStarNode | null;

    constructor(x: number, y: number, parent: AStarNode | null = null) {
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.g = 0;
        this.h = 0;
        this.f = 0;
    }
}

/**
 * @class AStarPathfinder
 * A class to find the shortest, straightest path between two PIXEL points.
 */
export class AStarPathfinder {
    private occupiedPixels: Set<string>;
    private readonly gridSize: number;

    /**
     * Initializes the pathfinder. It converts grid-based obstacles into a pixel-based lookup set.
     * @param obstacles - An array of Grid objects representing impassable areas.
     * @param gridSize - The size of one grid cell in pixels, used to interpret the obstacles.
     */
    public constructor(obstacles: Grid[], gridSize: number) {
        this.occupiedPixels = new Set<string>();
        this.gridSize = gridSize;
        this.initializeOccupiedPixels(obstacles);
    }

    /**
     * Finds the shortest path between a start and end point, running on a pixel-by-pixel basis.
     * @param start - The starting point {x, y} in pixel coordinates.
     * @param end - The ending point {x, y} in pixel coordinates.
     * @param turnPenalty - The additional cost for making a turn. A higher value makes the path straighter.
     * @returns An array of points (in pixel coordinates) representing the corners of the path, or null if no path is found.
     */
    public findPath(start: Point, end: Point, turnPenalty: number = 20): Point[] | null {
        // --- A* algorithm now runs directly on pixel coordinates ---
        const startNode = new AStarNode(start.x, start.y);
        const endNode = new AStarNode(end.x, end.y);

        const openList: AStarNode[] = [];
        const closedSet = new Set<string>();

        if (this.isOccupied(start.x, start.y) || this.isOccupied(end.x, end.y)) {
            return null; // Start or end point is inside an obstacle.
        }

        startNode.h = this.getHeuristic(startNode, endNode);
        startNode.f = startNode.h;
        openList.push(startNode);

        while (openList.length > 0) {
            let lowestIndex = 0;
            for (let i = 1; i < openList.length; i++) {
                if (openList[i].f < openList[lowestIndex].f) {
                    lowestIndex = i;
                }
            }
            const currentNode = openList[lowestIndex];

            // Path found
            if (currentNode.x === endNode.x && currentNode.y === endNode.y) {
                const fullPath = this.reconstructPath(currentNode);
                return this.simplifyPath(fullPath);
            }

            openList.splice(lowestIndex, 1);
            closedSet.add(`${currentNode.x},${currentNode.y}`);

            for (const neighbor of this.getNeighbors(currentNode)) {
                const neighborId = `${neighbor.x},${neighbor.y}`;

                if (closedSet.has(neighborId) || this.isOccupied(neighbor.x, neighbor.y)) {
                    continue;
                }

                let currentTurnPenalty = 0;
                if (currentNode.parent) {
                    const prevDx = currentNode.x - currentNode.parent.x;
                    const prevDy = currentNode.y - currentNode.parent.y;
                    const currentDx = neighbor.x - currentNode.x;
                    const currentDy = neighbor.y - currentNode.y;
                    if (prevDx !== currentDx || prevDy !== currentDy) {
                        currentTurnPenalty = turnPenalty;
                    }
                }

                const tentativeG = currentNode.g + 1 + currentTurnPenalty;
                const existingNode = openList.find(node => node.x === neighbor.x && node.y === neighbor.y);

                if (existingNode) {
                    if (tentativeG < existingNode.g) {
                        existingNode.g = tentativeG;
                        existingNode.f = existingNode.g + existingNode.h;
                        existingNode.parent = currentNode;
                    }
                } else {
                    neighbor.g = tentativeG;
                    neighbor.h = this.getHeuristic(neighbor, endNode);
                    neighbor.f = neighbor.g + neighbor.h;
                    openList.push(neighbor);
                }
            }
        }

        return null; // No path found
    }
    
    /**
     * Populates the set of occupied PIXELS by "rasterizing" the grid-based obstacles.
     */
    private initializeOccupiedPixels(obstacles: Grid[]): void {
        for (const grid of obstacles) {
            const startX = grid.x * this.gridSize;
            const startY = grid.y * this.gridSize;
            const pixelWidth = (grid.dx ?? 1) * this.gridSize;
            const pixelHeight = (grid.dy ?? 1) * this.gridSize;

            for (let px = startX; px < startX + pixelWidth; px++) {
                for (let py = startY; py < startY + pixelHeight; py++) {
                    this.occupiedPixels.add(`${px},${py}`);
                }
            }
        }
    }

    /**
     * Checks if a given pixel coordinate is occupied.
     */
    private isOccupied(x: number, y: number): boolean {
        return this.occupiedPixels.has(`${x},${y}`);
    }

    private getNeighbors(node: AStarNode): AStarNode[] {
        return [
            new AStarNode(node.x, node.y - 1, node),
            new AStarNode(node.x, node.y + 1, node),
            new AStarNode(node.x - 1, node.y, node),
            new AStarNode(node.x + 1, node.y, node)
        ];
    }
    
    private getHeuristic = (a: Point, b: Point): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    /**
     * Reconstructs the full path by tracing back from the end node.
     * @returns The full path from start to end, including every pixel.
     */
    private reconstructPath(endNode: AStarNode): Point[] {
        const path: Point[] = [];
        let currentNode: AStarNode | null = endNode;
        while (currentNode) {
            path.push({ x: currentNode.x, y: currentNode.y });
            currentNode = currentNode.parent;
        }
        return path.reverse();
    }

    /**
     * Simplifies a path by removing intermediate points on straight lines.
     * @param path - The full path array, with every pixel.
     * @returns A new path array containing only the start, end, and corner points.
     */
    private simplifyPath(path: Point[]): Point[] {
        if (path.length < 3) {
            return path; // Cannot simplify a path with 0, 1, or 2 points.
        }

        const simplifiedPath: Point[] = [path[0]]; // Always include the start point.

        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const current = path[i];
            const next = path[i + 1];

            // Calculate direction vectors
            const dir1x = current.x - prev.x;
            const dir1y = current.y - prev.y;
            const dir2x = next.x - current.x;
            const dir2y = next.y - current.y;

            // If the direction changes, the current point is a corner.
            if (dir1x !== dir2x || dir1y !== dir2y) {
                simplifiedPath.push(current);
            }
        }

        simplifiedPath.push(path[path.length - 1]); // Always include the end point.
        return simplifiedPath;
    }
}