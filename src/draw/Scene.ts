import { Area } from "./Area";
import { AStarPathfinder } from "./AStarPathFinder";
import { Polyline } from "./shape/Polyline";
import type { ConnectionPoint, Grid, Shape } from "./shape/Shape";

export class Scene {
    private gridSize = 15;
    private left = 0;
    private right = 0;
    private top = 0;
    private bottom = 0;

    public shapes: Shape[] = [];
    public occupiedArea: Area = new Area();

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

        this.occupiedArea = Area.union(this.occupiedArea, shape.occupiedArea);
        console.log(this.shapes);
    }

    public select(query: string) {
        const firstDot = query.indexOf(".");
        if (firstDot === -1) {
            return this.shapes.find((value) => value.id === query);
        } else {
            const shapeId = query.substring(0, firstDot);
            const shape = this.shapes.find((value) => value.id === shapeId);
            return shape?.findConnectionPoint(query.substring(firstDot + 1));
        }
    }

    public link(port1query: string, port2query: string) {
        const port1 = this.select(port1query) as ConnectionPoint;
        const port2 = this.select(port2query) as ConnectionPoint;

        if (!port1 || !port2) {
            console.error("One or both connection points not found.");
            return;
        }

        const startPoint = { x: port1.x, y: port1.y };
        const endPoint = { x: port2.x, y: port2.y };

        const astar = new AStarPathfinder(this.occupiedArea);
        const path = astar.findPath(startPoint, endPoint);

        if (path) {
            const line = new Polyline({
                id: 'data-bus-1',
                x: 0,
                y: 0,
                gridSize: this.gridSize,
                points: path,
                color: '#000', // Fuchsia color
                style: 'solid',
                startArrow: true,
                endArrow: true,
                startBitWidth: 32,
                endBitWidth: 16,
                strokeWidth: 1
            });
            this.addShape(line);
        } else {
            console.log("No path found between the two points.");
        }
    }
}