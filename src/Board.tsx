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
}

/**
 * The Board component, which renders an SVG canvas with a dynamically generated square.
 * It is declared using the 'function' syntax.
 * @param {BoardProps} props - The component's props, including width and height for the SVG.
 */
function Board({ width, height }: BoardProps) {

	// --- Core Logic: Generate the square's data programmatically here ---
	// In a real application, this data could come from an API call,
	// user input, or state management.
	const square: SquareData = {
		id: 'unique-square-1',
		x: 50,
		y: 50,
		size: 100,
		fill: 'deepskyblue',
		stroke: 'steelblue',
		strokeWidth: 2,
	};
	// --------------------------------------------------------------------

	// Example of how you would define multiple squares
	// const squares: SquareData[] = [
	//   { id: 'sq1', x: 50, y: 50, size: 100, fill: 'skyblue' },
	//   { id: 'sq2', x: 180, y: 80, size: 50, fill: 'lightgreen' },
	// ];

	return (
		<div>
			<svg
				width={width}
				height={height}
				style={{ backgroundColor: '#f9f9f9' }}
			>
				{/*
          The SVG <rect> element is used to draw rectangles and squares.
          We dynamically bind its attributes to the properties of our 'square' object.
        */}
				<rect
					x={square.x}
					y={square.y}
					width={square.size}
					height={square.size} // For a square, height is the same as width
					fill={square.fill}
					stroke={square.stroke}
					strokeWidth={square.strokeWidth}
				/>

				{/*
          If you wanted to render multiple squares, you would map over the array.
          Don't forget to use the 'key' prop for list rendering in React.
          
          {squares.map(sq => (
            <rect
              key={sq.id}
              x={sq.x}
              y={sq.y}
              width={sq.size}
              height={sq.size}
              fill={sq.fill}
            />
          ))}
        */}
			</svg>
		</div>
	);
}

export default Board;