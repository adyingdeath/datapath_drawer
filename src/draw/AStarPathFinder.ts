import type { Area } from './Area';

/**
 * @interface Point
 * Defines a 2D coordinate on the GRID.
 */
interface Point {
    x: number;
    y: number;
}

/**
 * @class AStarNode
 * Represents a node (a single grid cell) in the A* search.
 */
class AStarNode {
    public x: number;
    public y: number;
    public g: number; // Cost from start to current node
    public h: number; // Heuristic cost from current node to end
    public f: number; // Total cost (g + h)
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
 * A class to find the shortest, straightest path between two GRID points.
 * The pathfinding algorithm operates on a grid, not on pixels.
 */
export class AStarPathfinder {
    private readonly occupiedArea: Area;

    /**
     * Initializes the pathfinder with the map's obstacle layout.
     * @param occupiedArea - An `Area` object representing all impassable regions on the grid.
     */
    public constructor(occupiedArea: Area) {
        this.occupiedArea = occupiedArea;
    }

    /**
     * Finds the shortest path between a start and end point on the grid.
     * @param start - The starting point {x, y} in GRID coordinates.
     * @param end - The ending point {x, y} in GRID coordinates.
     * @param turnPenalty - The additional cost for making a turn. A higher value encourages straighter paths.
     *                    Since the base cost per step is 1, a penalty of 2-5 is usually effective.
     * @returns An array of points (in GRID coordinates) representing the corners of the path, or null if no path is found.
     */
    public findPath(start: Point, end: Point, turnPenalty: number = 2): Point[] | null {
        const startNode = new AStarNode(start.x, start.y);
        const endNode = new AStarNode(end.x, end.y);

        const openList: AStarNode[] = [];
        const closedSet = new Set<string>();

        // Check if start or end points are inside an obstacle.
        if (this.occupiedArea.isOccupied(start.x, start.y) || this.occupiedArea.isOccupied(end.x, end.y)) {
            return null; 
        }

        startNode.h = this.getHeuristic(startNode, endNode);
        startNode.f = startNode.h;
        openList.push(startNode);

        while (openList.length > 0) {
            // Find the node with the lowest F score in the open list.
            let lowestIndex = 0;
            for (let i = 1; i < openList.length; i++) {
                if (openList[i].f < openList[lowestIndex].f) {
                    lowestIndex = i;
                }
            }
            const currentNode = openList[lowestIndex];

            // Path has been found.
            if (currentNode.x === endNode.x && currentNode.y === endNode.y) {
                const fullPath = this.reconstructPath(currentNode);
                return this.simplifyPath(fullPath);
            }

            // Move current node from open to closed list.
            openList.splice(lowestIndex, 1);
            closedSet.add(`${currentNode.x},${currentNode.y}`);

            for (const neighbor of this.getNeighbors(currentNode)) {
                const neighborId = `${neighbor.x},${neighbor.y}`;

                if (closedSet.has(neighborId) || this.occupiedArea.isOccupied(neighbor.x, neighbor.y)) {
                    continue; // Skip if neighbor is already evaluated or is an obstacle.
                }

                // Calculate cost to reach this neighbor.
                let currentTurnPenalty = 0;
                if (currentNode.parent) {
                    const prevDx = currentNode.x - currentNode.parent.x;
                    const prevDy = currentNode.y - currentNode.parent.y;
                    const currentDx = neighbor.x - currentNode.x;
                    const currentDy = neighbor.y - currentNode.y;
                    // Add penalty if direction changes.
                    if (prevDx !== currentDx || prevDy !== currentDy) {
                        currentTurnPenalty = turnPenalty;
                    }
                }

                const tentativeG = currentNode.g + 1 + currentTurnPenalty;
                const existingNode = openList.find(node => node.x === neighbor.x && node.y === neighbor.y);

                if (existingNode) {
                    // If we found a better path to this existing node, update it.
                    if (tentativeG < existingNode.g) {
                        existingNode.g = tentativeG;
                        existingNode.f = existingNode.g + existingNode.h;
                        existingNode.parent = currentNode;
                    }
                } else {
                    // This is a new node, so calculate its scores and add to open list.
                    neighbor.g = tentativeG;
                    neighbor.h = this.getHeuristic(neighbor, endNode);
                    neighbor.f = neighbor.g + neighbor.h;
                    openList.push(neighbor);
                }
            }
        }

        return null; // No path found.
    }
    
    /**
     * Gets the valid, non-diagonal neighbors of a grid node.
     */
    private getNeighbors(node: AStarNode): AStarNode[] {
        return [
            new AStarNode(node.x, node.y - 1, node), // North
            new AStarNode(node.x, node.y + 1, node), // South
            new AStarNode(node.x - 1, node.y, node), // West
            new AStarNode(node.x + 1, node.y, node)  // East
        ];
    }
    
    /**
     * Calculates the heuristic (Manhattan distance) between two points.
     */
    private getHeuristic = (a: Point, b: Point): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    /**
     * Reconstructs the full path by tracing back from the end node using parent pointers.
     * @returns The full path from start to end, cell by cell.
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
     * Simplifies a grid path by removing intermediate points on straight line segments.
     * @param path - The full, cell-by-cell grid path.
     * @returns A new path array containing only the start, end, and corner points.
     */
    private simplifyPath(path: Point[]): Point[] {
        if (path.length < 3) {
            return path;
        }

        const simplifiedPath: Point[] = [path[0]]; // Always include the start point.

        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i - 1];
            const current = path[i];
            const next = path[i + 1];

            // Calculate direction vectors between grid cells.
            const dir1x = current.x - prev.x;
            const dir1y = current.y - prev.y;
            const dir2x = next.x - current.x;
            const dir2y = next.y - current.y;

            // If the direction changes, the current point is a corner and should be kept.
            if (dir1x !== dir2x || dir1y !== dir2y) {
                simplifiedPath.push(current);
            }
        }

        simplifiedPath.push(path[path.length - 1]); // Always include the end point.
        return simplifiedPath;
    }
}