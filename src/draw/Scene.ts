import type { Shape } from "../shape/Shape";

export class ShapeGenerator {
    private gridSize = 15;
    private left = 0;
    private right = 0;
    private top = 0;
    private bottom = 0;

    private shapes: Shape[] = [];

    public constructor(gridSize: number) {
        this.gridSize = gridSize;
    }

    public addShape(shape: Shape) {
        this.shapes.push(shape);
        // Update scene's size
        if (shape.x < this.left) this.left = shape.x;
        if (shape.y < this.top) this.top = shape.y;
        const size = shape.calculateSize();
        if (shape.x + size.width - 1 > this.right) this.right = shape.x + size.width - 1;
        if (shape.y + size.height - 1 > this.bottom) this.bottom = shape.y + size.height - 1;
    }
}