import { useState } from 'react'
import { MapCanvas } from './components/market-map/MapCanvas'
import { mockStalls } from './data/mockStalls'

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="h-screen w-screen">
      <MapCanvas
        stalls={mockStalls}
        editable={true}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onStallDragEnd={() => {}}
        onScaleChange={() => {}}
      />
    </div>
  )
}

export default App
