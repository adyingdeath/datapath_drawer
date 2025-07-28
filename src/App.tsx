import Board from './Board'
import { DataPathElement, type Port } from './shape/DataPathElement'
import { Rectangle } from './shape/Rectagle'

function App() {
  const datapath = new DataPathElement({
    gridSize: 15,
    x: 4,
    y: 3,
    id: 'reg-file',
    color: '#1971c2',
    fillColor: '#e7f5ff',
    fontSize: 12,
    topTitle: "Register File",
    centerTitle: "32 x 32-bit",
    bottomTitle: "Combinational Read",
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

  return (
    <div className="w-full h-dvh flex">
      <div className="w-72">
        <textarea className="w-full h-full resize-none"></textarea>
      </div>
      <div className="flex-1 w-full h-full overflow-auto">
        <Board width={4000} height={3000}>
          {datapath.toSvgElement()}
          {<rect
            x={datapath.getPortConnectionPoint("rs1_addr")?.x}
            y={datapath.getPortConnectionPoint("rs1_addr")?.y}
            width={3}
            height={3}
            fill="#FF0000"
            stroke="#FF0000"
          />}
          {<rect
            x={datapath.getPortConnectionPoint("rs2_addr")?.x}
            y={datapath.getPortConnectionPoint("rs2_addr")?.y}
            width={3}
            height={3}
            fill="#FF0000"
            stroke="#FF0000"
          />}
        </Board>
      </div>
    </div>
  )
}

export default App
