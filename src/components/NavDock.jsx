const NAV_ITEMS = [
  {
    id: 'home',
    label: '首頁',
    icon: (
      <path d="M4 11.5 12 4l8 7.5M6 10.5V19h5v-5h2v5h5v-8.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    id: 'pet',
    label: '寵物',
    icon: (
      <>
        <circle cx="7" cy="9" r="1.6" fill="currentColor" />
        <circle cx="12" cy="6.5" r="1.6" fill="currentColor" />
        <circle cx="17" cy="9" r="1.6" fill="currentColor" />
        <ellipse cx="12" cy="14" rx="5" ry="4" fill="currentColor" />
      </>
    ),
  },
  {
    id: 'stats',
    label: '統計',
    icon: (
      <>
        <path d="M5 20V10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M12 20V4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M19 20v-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: 'shop',
    label: '商店',
    icon: (
      <>
        <path d="M6 8h12l-1 12H7L6 8Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: 'skillTree',
    label: '技能樹',
    icon: (
      <path
        d="M12 2 15 9l7 1-5 5 1.5 7L12 18.5 5.5 22 7 15 2 10l7-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    id: 'settings',
    label: '設定',
    icon: (
      <>
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path
          d="M12 3v2.4M12 18.6V21M21 12h-2.4M5.4 12H3M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3 5.6 5.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </>
    ),
  },
]

export default function NavDock({ activePage, onNavigate }) {
  return (
    <nav className="nav-dock">
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === activePage
        return (
          <button
            key={item.id}
            type="button"
            className={`nav-dock__item${isActive ? ' nav-dock__item--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
            onClick={() => onNavigate(item.id)}
          >
            <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">
              {item.icon}
            </svg>
          </button>
        )
      })}
    </nav>
  )
}
