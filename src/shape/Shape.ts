import React from 'react';

export interface Grid {
    x: number;
    y: number;
    dx?: number;
    dy?: number;
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

    public readonly occupiedArea: Grid[];

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

        this.occupiedArea = this.calculateOccupiedArea();
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
     * A helper method to convert grid units to pixel values.
     * @param gridUnit The value in grid units (e.g., this.x or a width).
     * @returns The corresponding value in pixels.
     */
    protected toPixel(gridUnit: number): number {
        return gridUnit * this.gridSize;
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