import { AuthorizationRequest } from "@openid/appauth/built/authorization_request";
import { AuthorizationNotifier } from "@openid/appauth/built/authorization_request_handler";
import { AuthorizationServiceConfiguration } from "@openid/appauth/built/authorization_service_configuration";
import { log } from "@openid/appauth/built/logger";
import { RedirectRequestHandler } from "@openid/appauth/built/redirect_based_handler";
import {
  GRANT_TYPE_AUTHORIZATION_CODE,
  GRANT_TYPE_REFRESH_TOKEN,
  TokenRequest,
} from "@openid/appauth/built/token_request";
import { BaseTokenRequestHandler } from "@openid/appauth/built/token_request_handler";
import { FetchRequestor } from "@openid/appauth/built/xhr";
import { RevokeTokenRequest } from "@openid/appauth/built/revoke_token_request";

const AUTH_TOKEN = 'appauth_token'

const requestor = new FetchRequestor();

/* an example open id connect provider */
const openIdConnectUrl = "https://accounts.google.com";

/* example client configuration */
const clientId = "511828570984-7nmej36h9j2tebiqmpqh835naet4vci4.apps.googleusercontent.com";
const redirectUri = "http://localhost:8000/token";
const scope = "openid";

class Auth {
  constructor() {
    this.notifier = new AuthorizationNotifier();
    this.authorizationHandler = new RedirectRequestHandler();
    this.tokenHandler = new BaseTokenRequestHandler(requestor);
    // set notifier to deliver responses
    this.authorizationHandler.setAuthorizationNotifier(this.notifier);
    // set a listener to listen for authorization responses
    this.notifier.setAuthorizationListener((request, response, error) => {
      if (response) {
        this.request = request;
        this.response = response;
        // authorization code to make token requests
        // we don't save in local storage so that we require
        // login once tokens expire
        this.code = response.code;
      }
    });
  }

  // get from local storage
  getToken() {
    const tokenStorage = localStorage.getItem(AUTH_TOKEN)
    const token = typeof tokenStorage === 'string' ? JSON.parse(tokenStorage) : null

    if (
      token && 
      token.tokenType && 
      token.scope && 
      token.accessToken && 
      !isNaN(token.issuedAt) && 
      !isNaN(token.expiresIn)
    ) {
      const now = new Date().getTime()
      const timeLeft = token.issuedAt + token.expiresIn - now / 1000
      const isStillValid = timeLeft > 0

      if (isStillValid) {
        return token
      }
    }

    return null
  }

  // set from local storage
  setToken(token) {
    return localStorage.setItem(AUTH_TOKEN, JSON.stringify(token))
  }

  logger(...args) {
    const shouldLog = true
    if (shouldLog) {
      log(...args)
    }
  }

  // authorized if has auth code or access token
  isAuthorizedUser() {
    return !!this.code || !!this.getToken();
  }

  // revokes the current token
  signOut() {
    if (!this.configuration) {
      this.logger("Please fetch service configuration.");
      return;
    }

    let request = null;
    const token = this.getToken()
    if (token) {
      // use the token response to make a request for an access token
      request = new RevokeTokenRequest({
        client_id: clientId,
        token: token.accessToken,
      });
    }

    if (request) {
      return this.tokenHandler
        .performRevokeTokenRequest(this.configuration, request)
        .then((response) => {
          this.code = undefined;
          localStorage.removeItem(AUTH_TOKEN)
        })
        .catch((error) => {
          this.logger("Issue revoking token", error);
        });
    }
  }

  fetchServiceConfiguration() {
    return AuthorizationServiceConfiguration.fetchFromIssuer(
      openIdConnectUrl,
      requestor
    )
      .then((response) => {
        this.configuration = response;
      })
      .catch((error) => {
        this.logger("Problem fetching service config", error);
      });
  }

  makeAuthorizationRequest() {
    // create a request
    const request = new AuthorizationRequest({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scope,
      response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
      state: undefined,
      extras: { prompt: "consent", access_type: "offline" },
    });

    if (this.configuration) {
      this.authorizationHandler.performAuthorizationRequest(
        this.configuration,
        request
      );
    } else {
      this.logger(
        "Fetch Authorization Service configuration, before you make the authorization request."
      );
    }
  }

  refreshToken() {
    return this.fetchServiceConfiguration().then(() => this.makeTokenRequest());
  }

  // gets or refreshes token
  makeTokenRequest() {
    if (!this.configuration) {
      this.logger("Please fetch service configuration.");
      return;
    }

    let request = null;
    const token = this.getToken()
    if (token && token.refreshToken) {
      // use the token response to make a request for an access token
      request = new TokenRequest({
        client_id: clientId,
        redirect_uri: redirectUri,
        grant_type: GRANT_TYPE_REFRESH_TOKEN,
        code: undefined,
        refresh_token: token.refreshToken,
        extras: undefined,
      });
    } else if (this.code) {
      let extras = undefined;
      // initial code request, for PKCE we need code_verifier challange
      if (this.request && this.request.internal) {
        extras = {};
        extras["code_verifier"] = this.request.internal["code_verifier"];
      }
      // use the code to make the token request.
      request = new TokenRequest({
        client_id: clientId,
        redirect_uri: redirectUri,
        grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
        code: this.code,
        refresh_token: undefined,
        extras,
      });
    }

    if (request) {
      return this.tokenHandler
        .performTokenRequest(this.configuration, request)
        .then((response) => {
          this.setToken(response)
        })
        .catch((error) => {
          this.logger("Failed to perform token request", error);
        });
    } else {
      this.logger("Error: Token request requires auth code or refresh token.");
    }
  }

  signIn() {
    return this.fetchServiceConfiguration().then(() => this.makeAuthorizationRequest());
  }

  checkForAuthorizationResponse() {
    return this.authorizationHandler.completeAuthorizationRequestIfPossible();
  }
}

// keep in one instance so don't lose this.code value
const auth = new Auth()

export default auth
