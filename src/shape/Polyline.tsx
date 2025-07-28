import React from 'react';
import { Shape, type ShapeOptions } from './Shape';

export interface Point {
    x: number;
    y: number;
}

export interface PolylineOptions extends ShapeOptions {
    points: Point[];
    startArrow?: boolean;
    endArrow?: boolean;
    style?: 'solid' | 'dashed';
    startBitWidth?: number;
    endBitWidth?: number;
    strokeWidth?: number;
    fontSize?: number;
}

/**
 * Represents a multi-segment line (Polyline).
 * Coordinates are specified in absolute pixels, not grid units.
 * Supports arrowheads, dashing, and bit width annotations.
 */
export class Polyline extends Shape {
    public readonly points: Point[];
    public readonly startArrow: boolean;
    public readonly endArrow: boolean;
    public readonly style: 'solid' | 'dashed';
    public readonly startBitWidth?: number;
    public readonly endBitWidth?: number;
    public readonly strokeWidth: number;
    public readonly fontSize: number;

    constructor(options: PolylineOptions) {
        super({ ...options, x: 0, y: 0 });

        this.points = options.points;
        this.startArrow = options.startArrow ?? false;
        this.endArrow = options.endArrow ?? false;
        this.style = options.style ?? 'solid';
        this.startBitWidth = options.startBitWidth;
        this.endBitWidth = options.endBitWidth;
        this.strokeWidth = options.strokeWidth ?? 2;
        this.fontSize = options.fontSize ?? 10;
    }
    
    /**
     * Renders the bit width annotation (a 45-degree slash with a number) on a line segment.
     * @param p1 The starting point of the segment.
     * @param p2 The ending point of the segment.
     * @param bitWidth The number to display.
     * @returns A React element for the annotation.
     */
    private _renderBitWidthAnnotation(p1: Point, p2: Point, bitWidth: number): React.ReactElement {
        // --- MODIFICATION IS HERE ---
        const OFFSET_FROM_ENDPOINT = 20; // How far from p1 to place the annotation center
        const SLASH_HALF_LENGTH = 7;     // The length of the slash from the center point
        const TEXT_PERPENDICULAR_OFFSET = 8; // How far "up" from the line to place the text

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const segmentLength = Math.sqrt(dx * dx + dy * dy);

        if (segmentLength === 0) {
            return <></>;
        }
        
        // Calculate the center position of the annotation on the line segment
        const annotationX = p1.x + (dx / segmentLength) * OFFSET_FROM_ENDPOINT;
        const annotationY = p1.y + (dy / segmentLength) * OFFSET_FROM_ENDPOINT;

        // Calculate the angle of the segment for rotating the entire annotation group
        const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

        // This transform moves the annotation to the correct point on the line
        // and rotates its coordinate system so that the local x-axis aligns with the line.
        const groupTransform = `translate(${annotationX}, ${annotationY}) rotate(${angleDeg})`;

        return (
            <g transform={groupTransform} stroke={this.color} fill={this.color}>
                {/* The slash, drawn vertically and then rotated by -45 degrees
                    relative to the line's perpendicular axis. This results in a
                    45-degree angle to the line itself. */}
                <line 
                    x1="0" y1={-SLASH_HALF_LENGTH} 
                    x2="0" y2={SLASH_HALF_LENGTH} 
                    strokeWidth="1.5"
                    transform="rotate(-45)"
                />
                {/* The bit width text. It is positioned perpendicularly "above" the line.
                    The text itself is counter-rotated to remain upright and readable. */}
                <text
                    x="0" // Centered on the annotation point
                    y={-TEXT_PERPENDICULAR_OFFSET} // Offset perpendicularly
                    dominantBaseline="middle"
                    textAnchor="middle" // Anchor from its center
                    fontSize={this.fontSize}
                    stroke="none" // Text should not have a stroke
                    transform={`rotate(${-angleDeg})`} // Counter-rotate text to keep it upright
                >
                    {bitWidth}
                </text>
            </g>
        );
    }


    /**
     * Converts this Polyline into its React-renderable SVG representation. (Unchanged)
     */
    public toSvgElement(): React.ReactElement {
        if (this.points.length < 2) {
            return <></>;
        }
        
        const pointsString = this.points.map(p => `${p.x},${p.y}`).join(' ');
        const markerId = `arrowhead-${this.id}`;

        const needsMarker = this.startArrow || this.endArrow;

        return (
            <g key={this.id}>
                {needsMarker && (
                    <defs>
                        <marker
                            id={markerId}
                            viewBox="0 0 10 10"
                            refX="10"
                            refY="5"
                            markerWidth="6"
                            markerHeight="6"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 0 L 10 5 L 0 10 z" fill={this.color} />
                        </marker>
                    </defs>
                )}

                <polyline
                    points={pointsString}
                    fill="none"
                    stroke={this.color}
                    strokeWidth={this.strokeWidth}
                    strokeDasharray={this.style === 'dashed' ? '5,5' : undefined}
                    markerStart={this.startArrow ? `url(#${markerId})` : undefined}
                    markerEnd={this.endArrow ? `url(#${markerId})` : undefined}
                />
                
                {this.startBitWidth !== undefined && (
                   this._renderBitWidthAnnotation(this.points[0], this.points[1], this.startBitWidth)
                )}
                {this.endBitWidth !== undefined && (
                    this._renderBitWidthAnnotation(
                        this.points[this.points.length - 1],
                        this.points[this.points.length - 2], 
                        this.endBitWidth
                    )
                )}
            </g>
        );
    }
}