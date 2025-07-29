import React from 'react';
import { Shape, type ShapeOptions, type Grid, ConnectionPoint } from './Shape';
import { Area } from '../Area';

export interface Point {
    x: number;
    y: number;
}

export interface PolylineOptions extends ShapeOptions {
    points: Point[]; // These are now GRID coordinates.
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
 * Coordinates are specified in grid units and rendered connecting the center of grid cells.
 */
export class Polyline extends Shape {
    public readonly points: Point[]; // Grid coordinates
    public readonly startArrow: boolean;
    public readonly endArrow: boolean;
    public readonly style: 'solid' | 'dashed';
    public readonly startBitWidth?: number;
    public readonly endBitWidth?: number;
    public readonly strokeWidth: number;
    public readonly fontSize: number;
    public readonly connectionPoints: ConnectionPoint[];
    public readonly occupiedArea: Area;

    constructor(options: PolylineOptions) {
        // Polyline's own (x,y) is not used for positioning, it's defined by its points.
        super({ ...options, x: 0, y: 0 });

        this.points = options.points;
        this.startArrow = options.startArrow ?? false;
        this.endArrow = options.endArrow ?? false;
        this.style = options.style ?? 'solid';
        this.startBitWidth = options.startBitWidth;
        this.endBitWidth = options.endBitWidth;
        this.strokeWidth = options.strokeWidth ?? 2;
        this.fontSize = options.fontSize ?? 10;

        this.connectionPoints = this._calculateConnectionPoints();
        this.occupiedArea = new Area(this.calculateOccupiedArea());
    }

    /**
     * Creates ConnectionPoint objects (using grid coordinates) for the start and end of the polyline.
     */
    private _calculateConnectionPoints(): ConnectionPoint[] {
        const points: ConnectionPoint[] = [];

        if (this.points.length > 0) {
            const start = this.points[0];
            points.push(new ConnectionPoint('start', start.x, start.y, this.toPixelCenter(start.x), this.toPixelCenter(start.y)));
        }

        if (this.points.length > 1) {
            const end = this.points[this.points.length - 1];
            points.push(new ConnectionPoint('end', end.x, end.y, this.toPixelCenter(end.x), this.toPixelCenter(end.y)));
        }
        
        return points;
    }
    
    /**
     * Calculates all grid cells occupied by the polyline's path.
     * It traces the line connecting the center of grid cells.
     */
    public calculateOccupiedArea(): Grid[] {
        if (!this.points || this.points.length < 2) {
            return [];
        }
        
        const occupiedCells = new Set<string>();

        for (let i = 0; i < this.points.length - 1; i++) {
            const p1_grid = this.points[i];
            const p2_grid = this.points[i + 1];

            // Convert grid points to centered pixel coordinates for line tracing
            const p1 = { x: this.toPixelCenter(p1_grid.x), y: this.toPixelCenter(p1_grid.y) };
            const p2 = { x: this.toPixelCenter(p2_grid.x), y: this.toPixelCenter(p2_grid.y) };

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;

            const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / this.gridSize) * 2;
            
            if (steps === 0) {
                const gridX = Math.floor(p1.x / this.gridSize);
                const gridY = Math.floor(p1.y / this.gridSize);
                occupiedCells.add(`${gridX},${gridY}`);
                continue;
            }

            const xIncrement = dx / steps;
            const yIncrement = dy / steps;
            
            for (let j = 0; j <= steps; j++) {
                const currentX = p1.x + j * xIncrement;
                const currentY = p1.y + j * yIncrement;
                
                const gridX = Math.floor(currentX / this.gridSize);
                const gridY = Math.floor(currentY / this.gridSize);
                
                occupiedCells.add(`${gridX},${gridY}`);
            }
        }
        
        return Array.from(occupiedCells, cell => {
            const [x, y] = cell.split(',').map(Number);
            return { x, y };
        });
    }

    /**
     * Renders the bit width annotation on a line segment defined by pixel coordinates.
     */
    private _renderBitWidthAnnotation(p1: Point, p2: Point, bitWidth: number): React.ReactElement {
        const OFFSET_FROM_ENDPOINT = 20;
        const SLASH_HALF_LENGTH = 5;
        const TEXT_PERPENDICULAR_OFFSET = 8;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const segmentLength = Math.sqrt(dx * dx + dy * dy);

        if (segmentLength === 0) {
            return <></>;
        }
        
        const annotationX = p1.x + (dx / segmentLength) * OFFSET_FROM_ENDPOINT;
        const annotationY = p1.y + (dy / segmentLength) * OFFSET_FROM_ENDPOINT;
        const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
        const groupTransform = `translate(${annotationX}, ${annotationY}) rotate(${angleDeg})`;

        return (
            <g transform={groupTransform} stroke={this.color} fill={this.color}>
                <line 
                    x1="0" y1={-SLASH_HALF_LENGTH} 
                    x2="0" y2={SLASH_HALF_LENGTH} 
                    strokeWidth="1"
                    transform="rotate(-45)"
                />
                <text
                    x="0"
                    y={-TEXT_PERPENDICULAR_OFFSET}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fontSize={this.fontSize}
                    stroke="none"
                    transform={`rotate(${-angleDeg})`}
                >
                    {bitWidth}
                </text>
            </g>
        );
    }


    /**
     * Converts this Polyline into its React-renderable SVG representation.
     */
    public toSvgElement(): React.ReactElement {
        if (this.points.length < 2) {
            return <></>;
        }
        
        // Convert grid coordinates to centered pixel coordinates for the <polyline> element.
        const pointsString = this.points.map(p => `${this.toPixelCenter(p.x)},${this.toPixelCenter(p.y)}`).join(' ');
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
                   this._renderBitWidthAnnotation(
                       { x: this.toPixelCenter(this.points[0].x), y: this.toPixelCenter(this.points[0].y) },
                       { x: this.toPixelCenter(this.points[1].x), y: this.toPixelCenter(this.points[1].y) },
                       this.startBitWidth
                   )
                )}
                {this.endBitWidth !== undefined && (
                    this._renderBitWidthAnnotation(
                        { x: this.toPixelCenter(this.points[this.points.length - 1].x), y: this.toPixelCenter(this.points[this.points.length - 1].y) },
                        { x: this.toPixelCenter(this.points[this.points.length - 2].x), y: this.toPixelCenter(this.points[this.points.length - 2].y) },
                        this.endBitWidth
                    )
                )}
            </g>
        );
    }
}