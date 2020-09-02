This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:8000](http://localhost:8000) to view it in the browser.

## App Auth

This project uses [appauth.io](https://appauth.io) based on the electron app sample, app sample in the appauth.io repo `/app` directory, and some additional functionality added.

### Flow

1. run the application with `npm start`

2. Go to `http://localhost:8000`

3. Click "login" for which you will be prompted to login with google

4. Upon the redirect to `http://localhost:8000/app/redirect.html`, you will be redirected to `http://localhost:8000` after 1 second

5. Upon reaching the home page from the redirect, a token request will be made using your authorized user code you just received. The new token will update the useState hook to be logged in.

### Welcome improvements

1. Local storage to properly retrieve user tokens from prior logins to make token requests based on prior authorization

2. Auth react hook to get the current logged in status
