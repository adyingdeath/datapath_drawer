import Board from './Board'

function App() {

  return (
    <div className="w-full h-dvh flex">
      <div className="w-72">
        <textarea className="w-full h-full resize-none"></textarea>
      </div>
      <div className="flex-1 w-full h-full overflow-auto">
        <Board width={4000} height={3000}></Board>
      </div>
    </div>
  )
}

export default App
