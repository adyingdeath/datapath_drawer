import React from 'react';
import { Shape, type ShapeOptions } from './Shape'; // Assuming Shape.tsx is in the same directory

// --- Interfaces ---

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

// --- TextMeasurer Utility (Unchanged) ---
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


// --- DataPathElement Class (Revised) ---

/**
 * Represents a data path element configured for a specific grid size.
 * Its dimensions and port locations are pre-calculated upon instantiation.
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

    // Pre-calculated rendering data, stored for efficiency.
    private readonly renderData: {
        px: number;
        py: number;
        rectWidthPx: number;
        rectHeightPx: number;
        rectYOffset: number;
        textPadding: number;
        externalTitleMargin: number;
        portSpacingPx: number;
        leftPortsStartY: number;
        rightPortsStartY: number;
    };

    constructor(options: DataPathElementOptions) {
        // Pass a subset of options to the parent constructor.
        super({ gridSize: options.gridSize, x: options.x, y: options.y, color: options.color, id: options.id });

        // Store configuration properties from options.
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

        // Pre-calculate all rendering data.
        this.renderData = this._calculateRenderData();
    }

    /**
     * Calculates and returns all necessary rendering data.
     * This is now a private method called only by the constructor.
     */
    private _calculateRenderData() {
        // --- 1. Define Spacing and Padding ---
        const minPortSpacingPx = 2.5 * this.fontSize;
        // Ensure spacing is a multiple of the grid size.
        const portSpacingPx = Math.ceil(minPortSpacingPx / this.gridSize) * this.gridSize;
        const textPadding = this.fontSize * 0.75;
        const externalTitleMargin = this.fontSize * 0.5;

        // --- 2. Measure Text ---
        const measure = (text: string) => TextMeasurer.measure(text, this.fontSize, this.fontFamily);
        
        const leftPortTitlesWidth = Math.max(0, ...this.ports.left.map(p => measure(p.title)));
        const rightPortTitlesWidth = Math.max(0, ...this.ports.right.map(p => measure(p.title)));
        
        const centerTitleWidth = measure(this.centerTitle ?? '');
        const topBottomTitleWidth = Math.max(measure(this.topTitle ?? ''), measure(this.bottomTitle ?? ''));
        
        // --- 3. Calculate Minimum Required Dimensions (Pixels) ---

        // YOUR MODIFICATION IS HERE: Use center title width for more accurate content width.
        const minContentWidth = leftPortTitlesWidth + centerTitleWidth + rightPortTitlesWidth + 4 * textPadding;
        const minWidthPx = Math.max(minContentWidth, topBottomTitleWidth);
        
        const verticalPortCount = Math.max(this.ports.left.length, this.ports.right.length);
        const portBlockHeight = verticalPortCount > 0 ? (verticalPortCount - 1) * portSpacingPx : 0;
        const minRectHeightPx = portBlockHeight + 2 * portSpacingPx;

        // --- 4. Snap Dimensions to Grid ---
        const rectWidthInGridUnits = Math.ceil(minWidthPx / this.gridSize);
        const rectHeightInGridUnits = Math.ceil(minRectHeightPx / this.gridSize);
        
        // --- 5. Final Pixel Values & Offsets ---
        const px = this.toPixel(this.x);
        const py = this.toPixel(this.y);
        
        const rectWidthPx = this.toPixel(rectWidthInGridUnits);
        const rectHeightPx = this.toPixel(rectHeightInGridUnits);
        
        const rectYOffset = this.topTitle ? (this.fontSize + externalTitleMargin) : 0;
        
        const calcPortStartY = (portCount: number) => {
            if (portCount === 0) return 0;
            const blockH = (portCount - 1) * portSpacingPx;
            return (rectHeightPx - blockH) / 2;
        };

        const leftPortsStartY = calcPortStartY(this.ports.left.length);
        const rightPortsStartY = calcPortStartY(this.ports.right.length);

        return {
            px, py, 
            rectWidthPx, rectHeightPx, rectYOffset,
            textPadding, externalTitleMargin, portSpacingPx,
            leftPortsStartY, rightPortsStartY
        };
    }

    /**
     * Converts this DataPathElement into its React-renderable SVG representation.
     */
    public toSvgElement(): React.ReactElement {
        // Use the pre-calculated renderData.
        const {
            px, py, 
            rectWidthPx, rectHeightPx, rectYOffset,
            textPadding, externalTitleMargin, portSpacingPx,
            leftPortsStartY, rightPortsStartY
        } = this.renderData;

        return (
            <g key={this.id} transform={`translate(${px}, ${py})`} fontFamily={this.fontFamily}>
                {/* Top Title (External) */}
                {this.topTitle && (
                    <text x={rectWidthPx / 2} y={this.fontSize} textAnchor="middle" dominantBaseline="middle" fontSize={this.fontSize} fill={this.color}>
                        {this.topTitle}
                    </text>
                )}

                {/* Main Rectangle Body */}
                <rect
                    y={rectYOffset}
                    width={rectWidthPx}
                    height={rectHeightPx}
                    fill={this.fillColor}
                    stroke={this.color}
                    strokeWidth="1"
                />

                {/* Center Title (Internal) */}
                {this.centerTitle && (
                    <text x={rectWidthPx / 2} y={rectYOffset + rectHeightPx / 2} textAnchor="middle" dominantBaseline="middle" fontSize={this.fontSize} fill={this.color}>
                        {this.centerTitle}
                    </text>
                )}

                {/* Bottom Title (External) */}
                {this.bottomTitle && (
                    <text x={rectWidthPx / 2} y={rectYOffset + rectHeightPx + externalTitleMargin + (this.fontSize / 2)} textAnchor="middle" dominantBaseline="middle" fontSize={this.fontSize} fill={this.color}>
                        {this.bottomTitle}
                    </text>
                )}
                
                {/* Port Rendering */}
                <g className="ports">
                    {/* Left Ports (Centered Group) */}
                    {this.ports.left.map((port, index) => {
                        const portY = rectYOffset + leftPortsStartY + index * portSpacingPx;
                        return (
                            <text key={port.id} x={textPadding} y={portY} dominantBaseline="middle" fontSize={this.fontSize} fill={this.color}>
                                {port.title}
                            </text>
                        );
                    })}

                    {/* Right Ports (Centered Group) */}
                    {this.ports.right.map((port, index) => {
                        const portY = rectYOffset + rightPortsStartY + index * portSpacingPx;
                        return (
                            <text key={port.id} x={rectWidthPx - textPadding} y={portY} textAnchor="end" dominantBaseline="middle" fontSize={this.fontSize} fill={this.color}>
                                {port.title}
                            </text>
                        );
                    })}
                </g>
            </g>
        );
    }
    
    /**
     * Finds the absolute coordinates of a connection point for a given port ID.
     */
    public getPortConnectionPoint(portId: string): { x: number; y: number } {
        // Use the pre-calculated renderData.
        const {
            px, py, 
            rectWidthPx, rectYOffset,
            portSpacingPx,
            leftPortsStartY, rightPortsStartY
        } = this.renderData;

        const leftIndex = this.ports.left.findIndex(p => p.id === portId);
        if (leftIndex !== -1) {
            const portY = leftPortsStartY + leftIndex * portSpacingPx;
            return { x: px, y: py + rectYOffset + portY - 1 };
        }

        const rightIndex = this.ports.right.findIndex(p => p.id === portId);
        if (rightIndex !== -1) {
            const portY = rightPortsStartY + rightIndex * portSpacingPx;
            return { x: px + rectWidthPx, y: py + rectYOffset + portY - 1 };
        }
        
        return { x: 0, y: 0 }; // Port not found
    }
}