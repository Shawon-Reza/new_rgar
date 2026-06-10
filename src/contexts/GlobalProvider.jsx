import React, { createContext } from 'react'


export const GlobalContext = createContext()

const GlobalProvider = ({ children }) => {




    const dummyInfo = {
        name: "Reza",
        email: "reza@example.com"
    }
    const value = {
        dummyInfo,
    }


    return (
        <GlobalContext.Provider value={value}>
            {children}
        </GlobalContext.Provider>
    )
}

export default GlobalProvider