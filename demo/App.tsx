import { StickyContainer, StickyItem } from '../src'
import './App.scss'

function App() {

  return (
    <>
      <header>
        <div>React Sticky Demo</div>

        <a href="https://github.com/oe">Github</a>
      </header>
      <main>
        <StickyContainer offsetTop={90} defaultMode="replace">
          <div style={{ height: '400px' }}>
            <h1>Sticky Header</h1>
          </div>
          <StickyItem>
            <div className="sticky-item" style={{ height: '30px', background: 'lightblue' }}>
              <span>Sticky Item 1</span>
            </div>
          </StickyItem>
          <div style={{ height: '300px', background: 'lightgray' }}>
            spacer
          </div>
          <StickyItem>
            <div className="sticky-item" style={{ height: '30px', background: 'lightgreen' }}>
              <span>Sticky Item 2</span>
            </div>
          </StickyItem>
          <div className="content">
            <p>Content goes here...</p>
          </div>
        </StickyContainer>
      </main>
      <footer>
        <p>Footer content</p>
      </footer>
    </>
  )
}

export default App
