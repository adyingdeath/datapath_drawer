import { useEffect, useRef, useState } from 'react';
import Board from './Board'
import { DataPathElement } from './draw/shape/DataPathElement'
import { Polyline } from './draw/shape/Polyline';
import { Scene } from './draw/Scene';
import { Shape } from './draw/shape/Shape';

function App() {
  const [scene, setScene] = useState(new Scene(15));

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

  const [points, setPoints] = useState<{ x: number, y: number }[]>([]);

  useEffect(() => {
    scene.addShape(datapath);
    setPoints(scene.link("reg-file.rs1_addr", "reg-file.rs2_data") ?? []);
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
          {scene.shapes.map((s) => s.toSvgElement())}
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
                scene.occupiedArea.isOccupied(x, y) ?
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
