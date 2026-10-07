import { Nav } from './components/Nav/Nav'
import { AboutHero } from './components/AboutHero/AboutHero'
import { ApproachSection } from './components/Approach/ApproachSection'

export function App() {
  return (
    <>
      <Nav />
      <main>
        <AboutHero />
        <ApproachSection />
        {/* Placeholder for the rest of the About page (out of scope). */}
        <div className="page-continue" aria-hidden="true" />
      </main>
    </>
  )
}
