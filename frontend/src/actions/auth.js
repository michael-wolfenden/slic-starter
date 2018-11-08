import { Auth } from 'aws-amplify'
import * as errors from '../errors'

export const LOGIN_REQUEST = 'LOGIN_REQUEST'
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS'
export const LOGIN_FAILURE = 'LOGIN_FAILURE'

export function logIn({ username, password }) {
  return function(dispatch) {
    dispatch({ type: LOGIN_REQUEST })
    Auth.signIn(username, password).then(
      () => dispatch({ type: LOGIN_SUCCESS }),
      err =>
        dispatch({ type: LOGIN_FAILURE, error: translateCognitoError(err) })
    )
  }
}

export const LOGIN_VALIDATED = 'LOGIN_VALIDATED'

export function checkAuthentication() {
  return function(dispatch) {
    Auth.currentSession().then(() => dispatch({ type: LOGIN_VALIDATED }))
  }
}

export const LOGOUT_REQUEST = 'LOGOUT_REQUEST'
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS'
export const LOGOUT_FAILURE = 'LOGOUT_FAILURE'

export function logOut() {
  return function(dispatch) {
    dispatch({ type: LOGOUT_REQUEST })
    Auth.signOut().then(
      () => dispatch({ type: LOGOUT_SUCCESS }),
      err => dispatch({ type: LOGOUT_FAILURE, error: err })
    )
  }
}

function translateCognitoError(cognitoErr) {
  let errorId

  switch (cognitoErr.code) {
    case 'UserNotConfirmedException':
      errorId = errors.USER_NOT_CONFIRMED
      break
    case 'UserNotFoundException':
      errorId = errors.USER_NOT_FOUND
      break
    default:
      errorId = errors.UNKNOWN_AUTHENTICATION_ERROR
      break
  }

  return {
    id: errorId
  }
}