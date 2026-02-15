import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const LINKS = [
    { to: 'profile', label: 'Profile' },
    { to: 'notifications', label: 'Notifications' },
    { to: 'security', label: 'Security' },
    { to: 'theme', label: 'Theme' }
]

const Settings = () => {
    return (
        <div className="bg-secondar  text-secondary">
            {/* settings  */}
            <section>
                <header className="space-y-1 pb-2">
                    <h1 className="text-4xl text-secondary font-bold">Settings</h1>
                    <p className="text-secondary text-lg opacity-85">Manage your account and system preferences</p>
                </header>

                <nav aria-label="Settings navigation" className="p-3 border rounded-lg max-w-md "
                    style={{
                        borderColor: "var(--color-primary)",
                    }}
                >
                    <ul className=" flex justify-between items-center">
                        {LINKS.map(({ to, label }) => (
                            <li key={to}>
                                <NavLink
                                    to={to}
                                    className={({ isActive }) =>
                                        `block text-lg px-2 sm:px-4 py-1 rounded transition-colors hover:bg-secondary font-semibold ${isActive
                                            ? 'bg-primary text-white '    // active link styling
                                            : 'text-secondary hover:bg-primary ' // inactive link styling
                                        }`
                                    }
                                    end
                                >
                                    {label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </section>

            {/* Settings child routes */}
            <section className='mt-10'>
                <Outlet></Outlet>
            </section>
        </div>
    )
}

export default Settings