import React, {useEffect} from "react";
import Auth from "./auth";
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import TokenAuth from './TokenAuth'
import Home from './Home'
import "./App.css";

export default function App() {
  
  // auth handler hook
  useEffect(() => {
    if (!window.location.pathname.includes('token')) {
      if (!Auth.isAuthorizedUser()) {
        console.error('Unauthorized user, requesting sign in.')
        Auth.signIn()
      } else {
        // refresh token
        const token = Auth.getToken() 
        if (token && token.refreshToken) {
          Auth.refreshToken()
        } else {
          if (token) {
            console.info(`Token does not have refresh privilages, if you want to expand past the ${token.expiresIn}s limit you need to sign in again.`)
          }
        }
      }
    }
  }, [])

  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home}/>
        <Route path="/token" component={TokenAuth}/>
      </Switch>
    </Router>
  );
}
