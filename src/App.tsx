import Board from './Board'
import { DataPathElement } from './shape/DataPathElement'
import { Polyline } from './shape/Polyline';

function App() {
  const datapath = new DataPathElement({
    gridSize: 15,
    x: 8,
    y: 6,
    id: 'reg-file',
    color: '#000',
    fillColor: '#fff',
    fontSize: 12,
    topTitle: "Register File",
    ports: {
      left: [
        { id: 'rs1_addr', title: 'Read Addr 1' },
        { id: 'rs2_addr', title: 'Read Addr 2' },
        { id: 'rd_addr', title: 'Write Addr' },
        { id: 'rd_data', title: 'Write Data' },
        { id: 'reg_write', title: 'RegWrite' },
      ],
      right: [
        { id: 'rs1_data', title: 'Read Data 1' },
        { id: 'rs2_data', title: 'Read Data 2' },
      ],
    },
  });

  const line2 = new Polyline({
    id: 'data-bus-1',
    x: 0,
    y: 0,
    gridSize: 1,
    points: [
      {
        x: datapath.getPortConnectionPoint("rs1_addr").x,
        y: datapath.getPortConnectionPoint("rs1_addr").y,
      },
      { x: datapath.getPortConnectionPoint("rs1_addr").x - 100, y: datapath.getPortConnectionPoint("rs1_addr").y },
      { x: datapath.getPortConnectionPoint("rs2_addr").x - 100, y: datapath.getPortConnectionPoint("rs2_addr").y },
      {
        x: datapath.getPortConnectionPoint("rs2_addr").x,
        y: datapath.getPortConnectionPoint("rs2_addr").y,
      }
    ],
    color: '#000', // Fuchsia color
    style: 'solid',
    startArrow: true,
    endArrow: true,
    startBitWidth: 32,
    endBitWidth: 16,
    strokeWidth: 1
  });

  return (
    <div className="w-full h-dvh flex">
      <div className="w-72">
        <textarea className="w-full h-full resize-none"></textarea>
      </div>
      <div className="flex-1 w-full h-full overflow-auto">
        <Board width={4000} height={3000}>
          {datapath.toSvgElement()}
          {<rect
            x={datapath.getPortConnectionPoint("rs1_addr").x - 1}
            y={datapath.getPortConnectionPoint("rs1_addr").y - 1}
            width={2}
            height={2}
            fill="#FF0000"
            stroke="#FF0000"
          />}
          {<rect
            x={datapath.getPortConnectionPoint("rs2_addr").x - 1}
            y={datapath.getPortConnectionPoint("rs2_addr").y - 1}
            width={2}
            height={2}
            fill="#FF0000"
            stroke="#FF0000"
          />}
          {<rect
            x={datapath.getPortConnectionPoint("rd_addr").x - 1}
            y={datapath.getPortConnectionPoint("rd_addr").y - 1}
            width={2}
            height={2}
            fill="#FF0000"
            stroke="#FF0000"
          />}
          {<rect
            x={datapath.getPortConnectionPoint("rd_data").x - 1}
            y={datapath.getPortConnectionPoint("rd_data").y - 1}
            width={2}
            height={2}
            fill="#FF0000"
            stroke="#FF0000"
          />}
          {<rect
            x={datapath.getPortConnectionPoint("rs1_data").x - 1}
            y={datapath.getPortConnectionPoint("rs1_data").y - 1}
            width={2}
            height={2}
            fill="#FF0000"
            stroke="#FF0000"
          />}
          {line2.toSvgElement()}
        </Board>
      </div>
    </div>
  )
}

export default App
