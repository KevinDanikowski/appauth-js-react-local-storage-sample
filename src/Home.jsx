import React from 'react'
import Auth from './auth'

export default function Home() {
  const token = Auth.getToken()
  return (
    <div className="App">
      <button onClick={() => Auth.signIn()}>Login</button>
      <button onClick={() => Auth.signOut()}>Logout</button>
      <div className="profile">
        <div>
          <strong>Logged In</strong>: {Auth.isAuthorizedUser() ? "True" : "False"}
        </div>
        <div>
          <strong>Has refreshToken Attribute</strong>: {(token && token.refreshToken) ? "True" : "False"}
        </div>
      </div>
      <button onClick={() => Auth.refreshToken()}>Refresh Token</button>
      <button onClick={() => console.log(token)}>Token to Console</button>
    </div>
  )
}