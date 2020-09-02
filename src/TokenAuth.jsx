import React, { useEffect } from 'react';
import Auth from './auth'

const TokenAuth = () => {
  useEffect(() => {
    const redirect_uri = '/';
    const queryString = window.location.search.substring(1); // includes '?'

    // if querystring present, change to a hash for Auth service to check
    if (queryString) {
      const path = ['/token', queryString].join("#");
      window.location.assign(path);
    } else {
      const path = redirect_uri
      const refreshTokenOrForceSignIn = () => {
        if (Auth.isAuthorizedUser()) {
          return Auth.fetchServiceConfiguration().then(() => Auth.makeTokenRequest())
        } else {
          // set to true to force sign in
          const forceSignIn = true 
          if (forceSignIn) {
            return Auth.signIn()
          } else {
            return Promise.resolve()
          }
        }
      }
      if (window.location.hash.includes('scope=openid')) {
        Auth.checkForAuthorizationResponse().then(() => {
          refreshTokenOrForceSignIn().then(() => {
            window.location.assign(path);
          })
        });
      } else {
        refreshTokenOrForceSignIn().then(() => {
          window.location.assign(path);
        })
      }
    }
  })

  return (
    <></>
  );
};

export default TokenAuth;
