import React from 'react';

export interface Grid {
    x: number;
    y: number;
    dx?: number;
    dy?: number;
}

/**
 * Represents a connectable point on a shape, defined by its logical grid coordinates.
 * This is a simple value object.
 */
export class ConnectionPoint {
    public readonly id: string;
    public readonly x: number;
    public readonly y: number;
    public readonly pixelX: number;
    public readonly pixelY: number;

    constructor(id: string, x: number, y: number, pixelX: number, pixelY: number) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.pixelX = pixelX;
        this.pixelY = pixelY;
    }
}

/**
 * Defines the options required for constructing a Shape.
 */
export interface ShapeOptions {
    gridSize: number;
    /** The logical X coordinate on the grid (not in pixels). */
    x: number;
    /** The logical Y coordinate on the grid (not in pixels). */
    y: number;
    /** A basic color for the shape. Subclasses can decide how to use it (e.g., as fill or stroke). */
    color?: string;
    /** A unique identifier for the shape. If not provided, a random one will be generated. */
    id?: string;
}

/**
 * An abstract base class representing a geometric shape.
 * All specific shapes (e.g., Rectangle, Circle) should extend this class.
 */
export abstract class Shape {
    /**
     * The shape's X coordinate on the grid (logical unit, not pixels).
     * This must be an integer to align with the grid.
    */
    public x: number;

    /**
     * The shape's Y coordinate on the grid (logical unit, not pixels).
     * This must be an integer to align with the grid.
    */
    public y: number;

    /**
     * The primary color of the shape.
     * @default '#000000' (black)
    */
    public color: string;

    /**
     * A unique ID for the shape's SVG element.
    */
    public readonly id: string;

    public readonly gridSize: number;

    /**
     * A list of all connection points for this shape.
     * These are calculated once in the constructor of the subclass.
     */
    public abstract connectionPoints: ConnectionPoint[];
    
    public abstract occupiedArea: Grid[];


    /**
     * @param options The initialization options for the shape.
     */
    protected constructor(options: ShapeOptions) {
        this.gridSize = options.gridSize;

        // Ensure coordinates are integers to align with the grid.
        this.x = Math.round(options.x);
        this.y = Math.round(options.y);

        // Set the base color, with a default value.
        this.color = options.color ?? '#000000';

        // Set the ID, generating a random one if not provided.
        this.id = options.id ?? `shape-${crypto.randomUUID()}`;
    }

    /**
     * Finds a specific connection point by its ID from the pre-calculated list.
     * @param pointId The unique identifier of the connection point.
     * @returns The ConnectionPoint object, or a default 'null' point if not found.
     */
    public findConnectionPoint(pointId: string): ConnectionPoint {
        return this.connectionPoints.find(p => p.id === pointId) ?? new ConnectionPoint("null", 0, 0, 0, 0);
    }

    /**
     * Converts this shape into its React-renderable SVG element representation.
     * This is an abstract method and must be implemented by subclasses.
     * @returns A React.ReactElement (JSX) representing the shape.
     */
    public abstract toSvgElement(): React.ReactElement;

    /**
     * Calculates and returns all grid positions occupied by this shape.
     * 
     * Each returned Grid represents either:
     * - A single occupied cell (when dx/dy are undefined), or
     * - A rectangular area of occupied cells (when dx/dy are present)
     * 
     * Note: (x,y) always represents the top-left corner of the occupied area.
     */
    public abstract calculateOccupiedArea(): Grid[];

    /**
     * Calculates the total width and height of the shape based on its occupied area.
     * The width is the distance from the leftmost edge to the rightmost edge of all grids.
     * The height is the distance from the topmost edge to the bottommost edge of all grids.
     * @returns An object containing the total width and height.
     */
    public calculateSize(): { width: number; height: number } {
        const occupiedArea = this.calculateOccupiedArea();

        if (!occupiedArea || occupiedArea.length === 0) {
            return { width: 0, height: 0 };
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const grid of occupiedArea) {
            minX = Math.min(minX, grid.x);
            minY = Math.min(minY, grid.y);
            maxX = Math.max(maxX, grid.x + (grid.dx || 1));
            maxY = Math.max(maxY, grid.y + (grid.dy || 1));
        }

        const width = maxX - minX;
        const height = maxY - minY;

        return { width, height };
    }

    /**
     * A helper method to convert grid units to the top-left corner pixel values of a grid cell.
     * @param gridUnit The value in grid units (e.g., this.x or a width).
     * @returns The corresponding value in pixels.
     */
    protected toPixel(gridUnit: number): number {
        return gridUnit * this.gridSize;
    }

    /**
     * A helper method to convert grid units to the center pixel values of a grid cell.
     * @param gridUnit The value in grid units (e.g., this.x).
     * @returns The corresponding pixel value for the center of the grid cell.
     */
    protected toPixelCenter(gridUnit: number): number {
        return (gridUnit * this.gridSize) + (this.gridSize / 2);
    }


    /**
     * Checks if the specified coordinate is occupied by this shape.
     * @param x The x-coordinate to check
     * @param y The y-coordinate to check
     * @returns true if the coordinate is within any of the occupied areas
     */
    protected isOccupied(x: number, y: number): boolean {
        if (!this.occupiedArea) {
            return false;
        }

        for (const grid of this.occupiedArea) {
            // Check if it's a single cell (no dx/dy)
            if (grid.dx === undefined || grid.dy === undefined) {
                if (grid.x === x && grid.y === y) {
                    return true;
                }
            }
            // Check if it's within a rectangular area
            else {
                if (x >= grid.x &&
                    x < grid.x + grid.dx &&
                    y >= grid.y &&
                    y < grid.y + grid.dy) {
                    return true;
                }
            }
        }

        return false;
    }
}