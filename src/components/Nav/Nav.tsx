import './Nav.css'

const LINKS = ['Work', 'Labs', 'About', 'Careers', 'Press']

export function Nav() {
  return (
    <nav className="nav" aria-label="Primary">
      <div className="nav__bar">
        <a className="nav__logo" href="/" aria-label="Ownpath home">
          ownpath
        </a>
        <ul className="nav__links">
          {LINKS.map((label) => (
            <li key={label}>
              <a href="#" aria-current={label === 'About' ? 'page' : undefined}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <a className="nav__cta" href="#">
        Get in touch
      </a>
    </nav>
  )
}
