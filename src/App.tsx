import { useEffect, useRef, useState } from 'react';
import Board from './Board'
import { DataPathElement } from './draw/shape/DataPathElement'
import { Polyline } from './draw/shape/Polyline';
import { Scene } from './draw/Scene';
import { Shape } from './draw/shape/Shape';

function App() {
  const scene = useRef(new Scene(15));

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
        x: datapath.findConnectionPoint("rs1_addr").pixelX,
        y: datapath.findConnectionPoint("rs1_addr").pixelY,
      },
      { x: datapath.findConnectionPoint("rs1_addr").pixelX - 100, y: datapath.findConnectionPoint("rs1_addr").pixelY },
      { x: datapath.findConnectionPoint("rs2_addr").pixelX - 100, y: datapath.findConnectionPoint("rs2_addr").pixelY },
      {
        x: datapath.findConnectionPoint("rs2_addr").pixelX,
        y: datapath.findConnectionPoint("rs2_addr").pixelY,
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

  const [points, setPoints] = useState<{ x: number, y: number }[]>([]);

  useEffect(() => {
    scene.current.addShape(datapath);
    console.log(scene.current.occupiedArea.isOccupied(9, 5));
    setPoints(scene.current.link("reg-file.rs1_addr", "reg-file.rs2_addr") ?? []);
  }, []);

  return (
    <div className="w-full h-dvh flex">
      <div className="w-72">
        <textarea className="w-full h-full resize-none"></textarea>
      </div>
      <div className="flex-1 w-full h-full overflow-auto">
        <Board width={4000} height={3000}>
          {new Array(40).fill(0).map((_, index) => (
            <>
              <line x1={0} y1={15 * index} x2={15 * 80} y2={15 * index} stroke="#CCC" strokeWidth={1}></line>
              <line x1={15 * index} x2={15 * index} y1={0} y2={15 * 80} stroke="#CCC" strokeWidth={1}></line>
            </>
          ))}
          {datapath.toSvgElement()}
          {<rect
            x={datapath.findConnectionPoint("rs1_addr").pixelX - 1}
            y={datapath.findConnectionPoint("rs1_addr").pixelY - 1}
            width={2}
            height={2}
            fill="#FF0000"
            stroke="#FF0000"
          />}
          {<rect
            x={datapath.findConnectionPoint("rs2_addr").pixelX - 1}
            y={datapath.findConnectionPoint("rs2_addr").pixelY - 1}
            width={2}
            height={2}
            fill="#FF0000"
            stroke="#FF0000"
          />}
          {<rect
            x={datapath.findConnectionPoint("rd_addr").pixelX - 1}
            y={datapath.findConnectionPoint("rd_addr").pixelY - 1}
            width={2}
            height={2}
            fill="#FF0000"
            stroke="#FF0000"
          />}
          {<rect
            x={datapath.findConnectionPoint("rd_data").pixelX - 1}
            y={datapath.findConnectionPoint("rd_data").pixelY - 1}
            width={2}
            height={2}
            fill="#FF0000"
            stroke="#FF0000"
          />}
          {<rect
            x={datapath.findConnectionPoint("rs1_data").pixelX - 1}
            y={datapath.findConnectionPoint("rs1_data").pixelY - 1}
            width={2}
            height={2}
            fill="#FF0000"
            stroke="#FF0000"
          />}
          {/* line2.toSvgElement() */}
          {points.map((p) => (
            <rect
              x={p.x * 15 + 7.5 - 1}
              y={p.y * 15 + 7.5 - 1}
              width={2}
              height={2}
              fill="#00FF00"
              stroke="#00FF00"
            />
          ))}
          {Array.from({length: 40}).map((_, x) => {
            return Array.from({length: 40}).map((_, y) => {
              return (
                scene.current.occupiedArea.isOccupied(x, y) ?
                  <rect
                    x={x * 15}
                    y={y * 15}
                    width={15}
                    height={15}
                    fill="#00F2"
                    stroke="#00F2"
                  /> : <></>
              );
            })
          }).flat()}
        </Board>
      </div>
    </div>
  )
}

export default App
