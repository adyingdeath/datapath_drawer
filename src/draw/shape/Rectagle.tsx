import React from 'react';
import { Shape, type ShapeOptions } from './Shape';

/**
 * Defines additional options specific to a Rectangle.
 */
export interface RectangleOptions extends ShapeOptions {
    width: number; // Width in grid units.
    height: number; // Height in grid units.
    fillColor?: string; // Optional fill color.
    strokeColor?: string; // Optional stroke color.
    strokeWidth?: number; // Optional stroke width.
}

export class Rectangle extends Shape {
    public width: number;
    public height: number;
    public fillColor: string;
    public strokeColor: string;
    public strokeWidth: number;

    constructor(options: RectangleOptions) {
        super(options); // Call the parent constructor to set x, y, id, and base color.
        this.width = options.width;
        this.height = options.height;

        // Subclass decides how to use colors. Here, we use the base 'color' as a default
        // for both fill and stroke if they aren't specified.
        this.fillColor = options.fillColor ?? 'none';
        this.strokeColor = options.strokeColor ?? this.color;
        this.strokeWidth = options.strokeWidth ?? 1;
    }

    /**
     * Overrides the abstract method to return a JSX <rect> element.
     */
    public override toSvgElement(gridSize: number): React.ReactElement {
        // Convert grid units to pixel values using the helper method.
        const pixelX = this.toPixel(this.x, gridSize);
        const pixelY = this.toPixel(this.y, gridSize);
        const pixelWidth = this.toPixel(this.width, gridSize);
        const pixelHeight = this.toPixel(this.height, gridSize);
        
        // Return a JSX element.
        // Using 'key' is a React best-practice for lists of elements.
        return (
            <rect
                key={this.id}
                id={this.id}
                x={pixelX}
                y={pixelY}
                width={pixelWidth}
                height={pixelHeight}
                fill={this.fillColor}
                stroke={this.strokeColor}
                strokeWidth={this.strokeWidth}
            />
        );
    }
}