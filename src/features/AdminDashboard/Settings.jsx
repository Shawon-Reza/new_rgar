import { NavLink, Outlet } from 'react-router-dom'

const LINKS = [
    { to: 'profile', label: 'Profile' },
    { to: 'notifications', label: 'Notifications' },
    { to: 'security', label: 'Security' },
    { to: 'theme', label: 'Theme' }
]

const Settings = () => {
    return (
        <div className="text-[#172033]">
            <header className="-mx-2 -mt-4 border-b border-[#dfe3ea] bg-white px-6 py-4 sm:-mx-6">
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#2B76F4]">Account Settings</span>
                <h1 className="mt-1 text-2xl font-semibold leading-8 tracking-normal text-[#111827] md:text-3xl">Settings</h1>
            </header>

            <section className="mx-auto w-full max-w-6xl px-1 py-6 sm:px-0 md:py-8">
                <nav aria-label="Settings navigation" className="mx-auto w-full max-w-[635px]">
                    <ul className="grid h-10 grid-cols-4 rounded-md bg-[#eef0f3] p-1">
                        {LINKS.map(({ to, label }) => (
                            <li key={to} className="min-w-0">
                                <NavLink
                                    to={to}
                                    className={({ isActive }) =>
                                        `flex h-8 min-w-0 items-center justify-center rounded px-2 text-sm font-medium transition-all duration-200 ${isActive
                                            ? 'bg-white text-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
                                            : 'text-[#737f92] hover:text-[#172033]'
                                        }`
                                    }
                                    end
                                >
                                    <span className="truncate">{label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <section className="mt-6">
                    <Outlet></Outlet>
                </section>
            </section>
        </div>
    )
}

export default Settings
