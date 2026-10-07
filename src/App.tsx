import { Nav } from './components/Nav/Nav'
import { AboutHero } from './components/AboutHero/AboutHero'

export function App() {
  return (
    <>
      <Nav />
      <main>
        <AboutHero />
        {/* Placeholder for the rest of the About page (out of scope). */}
        <div className="page-continue" aria-hidden="true" />
      </main>
    </>
  )
}
