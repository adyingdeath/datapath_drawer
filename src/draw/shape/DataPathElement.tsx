import React from 'react';
import { ConnectionPoint, Shape, type Grid, type ShapeOptions } from './Shape';
import { Area } from '../Area';

export interface Port {
    id: string;
    title: string;
}

export interface DataPathElementOptions extends ShapeOptions {
    ports?: {
        left?: Port[];
        right?: Port[];
    };
    topTitle?: string;
    centerTitle?: string;
    bottomTitle?: string;
    fontSize?: number;
    fontFamily?: string;
    fillColor?: string;
}

class TextMeasurer {
    private static context: CanvasRenderingContext2D | null = null;
    private static getContext(): CanvasRenderingContext2D {
        if (!this.context) {
            const canvas = document.createElement('canvas');
            this.context = canvas.getContext('2d')!;
        }
        return this.context;
    }
    public static measure(text: string, fontSize: number, fontFamily: string): number {
        const context = this.getContext();
        context.font = `${fontSize}px ${fontFamily}`;
        return context.measureText(text).width;
    }
}

/**
 * Represents a data path element.
 * Its core rectangle and ports are aligned to the center of grid cells.
 * The component's (x, y) refers to the grid coordinate of the top-left
 * of its main rectangle body.
 */
export class DataPathElement extends Shape {
    public readonly ports: {
        left: Port[];
        right: Port[];
    };
    public readonly topTitle?: string;
    public readonly centerTitle?: string;
    public readonly bottomTitle?: string;
    public readonly fontSize: number;
    public readonly fontFamily: string;
    public readonly fillColor: string;
    public readonly connectionPoints: ConnectionPoint[];
    public readonly occupiedArea: Area;

    // Pre-calculated grid and rendering data.
    private readonly renderData: {
        widthInGrid: number;
        heightInGrid: number;
        portGridSpacing: number;
        leftPortsStartYGridOffset: number;
        rightPortsStartYGridOffset: number;
        textPadding: number;
        externalTitleMargin: number;
    };

    constructor(options: DataPathElementOptions) {
        super(options);

        this.ports = {
            left: options.ports?.left ?? [],
            right: options.ports?.right ?? [],
        };
        this.topTitle = options.topTitle;
        this.centerTitle = options.centerTitle;
        this.bottomTitle = options.bottomTitle;
        this.fontSize = options.fontSize ?? 12;
        this.fontFamily = options.fontFamily ?? 'sans-serif';
        this.fillColor = options.fillColor ?? '#FFFFFF';

        this.renderData = this._calculateRenderData();
        this.connectionPoints = this._calculateConnectionPoints();
        this.occupiedArea = new Area(this.calculateOccupiedArea());

        // Remove the grids those ports are in from occupied area
        this.occupiedArea.subtract(this.connectionPoints.map((point) => ({ x: point.x, y: point.y})));
    }
    
    /**
     * Calculates all rendering data in grid units.
     */
    private _calculateRenderData() {
        const textPadding = this.fontSize * 0.75;
        const externalTitleMargin = this.fontSize * 0.5;

        // --- 1. Measure Text in Pixels ---
        const measure = (text: string) => TextMeasurer.measure(text, this.fontSize, this.fontFamily);
        const leftPortTitlesWidth = Math.max(0, ...this.ports.left.map(p => measure(p.title)));
        const rightPortTitlesWidth = Math.max(0, ...this.ports.right.map(p => measure(p.title)));
        const centerTitleWidth = measure(this.centerTitle ?? '');
        const topBottomTitleWidth = Math.max(measure(this.topTitle ?? ''), measure(this.bottomTitle ?? ''));

        // --- 2. Calculate Required Dimensions in Grid Units ---
        const minContentWidthPx = leftPortTitlesWidth + centerTitleWidth + rightPortTitlesWidth + 4 * textPadding;
        const minWidthPx = Math.max(minContentWidthPx, topBottomTitleWidth);
        const widthInGrid = Math.max(1, Math.ceil(minWidthPx / this.gridSize));

        const minPortSpacingPx = 2.5 * this.fontSize;
        const portGridSpacing = Math.max(1, Math.ceil(minPortSpacingPx / this.gridSize));
        
        const calcMinHeight = (portCount: number) => {
            if (portCount === 0) return 1;
            // Total height needed for the ports themselves, including spacing.
            // A top and bottom margin of `portGridSpacing` is added.
            return (portCount - 1) * portGridSpacing + 2 * portGridSpacing;
        };

        const minHeightInGrid = Math.max(calcMinHeight(this.ports.left.length), calcMinHeight(this.ports.right.length));
        const heightInGrid = Math.max(1, minHeightInGrid);

        const calcPortStartYOffset = (portCount: number) => {
            if (portCount === 0) return 0;
            // Total span of ports from first to last center
            const blockGridSpan = (portCount - 1) * portGridSpacing + 1;
            const remainingSpace = heightInGrid - blockGridSpan;
            return Math.floor(remainingSpace / 2);
        };

        const leftPortsStartYGridOffset = calcPortStartYOffset(this.ports.left.length);
        const rightPortsStartYGridOffset = calcPortStartYOffset(this.ports.right.length);

        return {
            widthInGrid, heightInGrid, portGridSpacing,
            leftPortsStartYGridOffset, rightPortsStartYGridOffset,
            textPadding, externalTitleMargin
        };
    }

    /**
     * Calculates all connection points and their absolute grid coordinates.
     */
    private _calculateConnectionPoints(): ConnectionPoint[] {
        const points: ConnectionPoint[] = [];
        const { widthInGrid, portGridSpacing, leftPortsStartYGridOffset, rightPortsStartYGridOffset } = this.renderData;

        // Calculate left port grid coordinates
        this.ports.left.forEach((port, index) => {
            const gridX = this.x;
            const gridY = this.y + leftPortsStartYGridOffset + (index * portGridSpacing);
            points.push(new ConnectionPoint(port.id, gridX, gridY, this.toPixelCenter(gridX), this.toPixelCenter(gridY)));
        });

        // Calculate right port grid coordinates
        this.ports.right.forEach((port, index) => {
            const gridX = this.x + widthInGrid - 1;
            const gridY = this.y + rightPortsStartYGridOffset + (index * portGridSpacing);
            points.push(new ConnectionPoint(port.id, gridX, gridY, this.toPixelCenter(gridX), this.toPixelCenter(gridY)));
        });

        return points;
    }
    
    /**
     * Calculates the total bounding box of the element in grid units.
     */
    public calculateOccupiedArea(): Grid[] {
        const { widthInGrid, heightInGrid, externalTitleMargin } = this.renderData;

        let topOffsetGrid = 0;
        if (this.topTitle) {
            topOffsetGrid = Math.ceil((this.fontSize + externalTitleMargin) / this.gridSize);
        }

        let bottomOffsetGrid = 0;
        if (this.bottomTitle) {
            bottomOffsetGrid = Math.ceil((this.fontSize + externalTitleMargin) / this.gridSize);
        }

        const occupiedX = this.x;
        const occupiedY = this.y - topOffsetGrid;
        const occupiedW = widthInGrid;
        const occupiedH = topOffsetGrid + heightInGrid + bottomOffsetGrid;

        return [{
            x: occupiedX,
            y: occupiedY,
            dx: occupiedW,
            dy: occupiedH,
        }];
    }

    /**
     * Converts this DataPathElement into its React-renderable SVG representation.
     */
    public toSvgElement(): React.ReactElement {
        const { widthInGrid, heightInGrid, textPadding, externalTitleMargin } = this.renderData;

        // --- Calculate Pixel Geometry for Rendering ---
        
        // The rectangle's corners are at the center of grid cells.
        const rectPx = this.toPixelCenter(this.x);
        const rectPy = this.toPixelCenter(this.y);
        const rectWidthPx = (widthInGrid > 1) ? (widthInGrid - 1) * this.gridSize : 0;
        const rectHeightPx = (heightInGrid > 1) ? (heightInGrid - 1) * this.gridSize : 0;

        const rectCenterX = rectPx + rectWidthPx / 2;
        const rectCenterY = rectPy + rectHeightPx / 2;

        return (
            <g key={this.id} fontFamily={this.fontFamily}>
                {/* Top Title (External) */}
                {this.topTitle && (
                    <text x={rectCenterX} y={rectPy - externalTitleMargin} textAnchor="middle" dominantBaseline="alphabetic" fontSize={this.fontSize} fill={this.color}>
                        {this.topTitle}
                    </text>
                )}

                {/* Main Rectangle Body */}
                <rect
                    x={rectPx}
                    y={rectPy}
                    width={rectWidthPx}
                    height={rectHeightPx}
                    fill={this.fillColor}
                    stroke={this.color}
                    strokeWidth="1"
                />

                {/* Center Title (Internal) */}
                {this.centerTitle && (
                    <text x={rectCenterX} y={rectCenterY} textAnchor="middle" dominantBaseline="middle" fontSize={this.fontSize} fill={this.color}>
                        {this.centerTitle}
                    </text>
                )}

                {/* Bottom Title (External) */}
                {this.bottomTitle && (
                    <text x={rectCenterX} y={rectPy + rectHeightPx + externalTitleMargin} textAnchor="middle" dominantBaseline="hanging" fontSize={this.fontSize} fill={this.color}>
                        {this.bottomTitle}
                    </text>
                )}
                
                {/* Port Rendering */}
                <g className="ports">
                    {/* Left Ports */}
                    {this.ports.left.map((port) => {
                        const cp = this.findConnectionPoint(port.id);
                        const portPx = this.toPixelCenter(cp.x);
                        const portPy = this.toPixelCenter(cp.y);
                        return (
                            <text key={port.id} x={portPx + textPadding} y={portPy} dominantBaseline="middle" fontSize={this.fontSize} fill={this.color}>
                                {port.title}
                            </text>
                        );
                    })}

                    {/* Right Ports */}
                    {this.ports.right.map((port) => {
                        const cp = this.findConnectionPoint(port.id);
                        const portPx = this.toPixelCenter(cp.x);
                        const portPy = this.toPixelCenter(cp.y);
                        return (
                            <text key={port.id} x={portPx - textPadding} y={portPy} textAnchor="end" dominantBaseline="middle" fontSize={this.fontSize} fill={this.color}>
                                {port.title}
                            </text>
                        );
                    })}
                </g>
            </g>
        );
    }
}