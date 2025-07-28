/**
 * Defines the data structure for a square.
 * Using a TypeScript interface ensures type safety and code clarity.
 */
interface SquareData {
	id: string;          // A unique identifier, useful as a key when rendering lists.
	x: number;           // The x-coordinate of the top-left corner.
	y: number;           // The y-coordinate of the top-left corner.
	size: number;        // The length of one side (width and height are the same).
	fill: string;        // The fill color.
	stroke?: string;     // The border color (optional).
	strokeWidth?: number; // The border width (optional).
}

/**
 * Defines the props for the Board component.
 * This allows us to customize the SVG canvas size from the outside.
 */
interface BoardProps {
	width: number;
	height: number;
	children: React.ReactNode;
}

/**
 * The Board component, which renders an SVG canvas with a dynamically generated square.
 * It is declared using the 'function' syntax.
 * @param {BoardProps} props - The component's props, including width and height for the SVG.
 */
function Board({ width, height, children }: BoardProps) {
	return (
		<div>
			<svg
				width={width}
				height={height}
				style={{ backgroundColor: '#f9f9f9' }}
			>
				{children}
			</svg>
		</div>
	);
}

export default Board;