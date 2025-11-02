---
title: Auth Plugin - API Reference
description: Complete API reference for the Authentication Plugin
sidebar: plugins
---

# Authentication Plugin - API Reference

Complete API documentation for the Authentication Plugin.

## Core Methods

### `auth.configure(options)`

Configure the authentication plugin with your settings.

**Parameters:**
- `options` (Object) - Configuration options
  - `provider` (String) - Authentication provider ('oauth', 'saml', 'custom')
  - `clientId` (String) - OAuth client ID
  - `clientSecret` (String) - OAuth client secret
  - `callbackUrl` (String) - Callback URL after authentication

**Returns:** `void`

**Example:**
```javascript
auth.configure({
  provider: 'oauth',
  clientId: 'abc123',
  clientSecret: 'secret456',
  callbackUrl: 'https://myapp.com/callback'
});
```

### `auth.login(credentials)`

Authenticate a user with credentials.

**Parameters:**
- `credentials` (Object) - User credentials
  - `username` (String) - Username or email
  - `password` (String) - User password

**Returns:** `Promise<User>` - Authenticated user object

**Example:**
```javascript
const user = await auth.login({
  username: 'user@example.com',
  password: 'securepassword'
});
```

### `auth.logout()`

Log out the current user and clear session.

**Returns:** `Promise<void>`

**Example:**
```javascript
await auth.logout();
```

## Session Management

### `auth.getSession()`

Get the current session information.

**Returns:** `Session | null` - Current session or null if not authenticated

### `auth.refreshSession()`

Refresh the current session token.

**Returns:** `Promise<Session>` - Updated session

## Events

The plugin emits the following events:

- `login` - Fired when user logs in successfully
- `logout` - Fired when user logs out
- `session:refresh` - Fired when session is refreshed
- `error` - Fired on authentication errors

**Example:**
```javascript
auth.on('login', (user) => {
  console.log('User logged in:', user.email);
});
```

## Error Handling

All methods throw specific error types:

- `AuthenticationError` - Invalid credentials
- `ConfigurationError` - Invalid configuration
- `SessionError` - Session-related errors

**Example:**
```javascript
try {
  await auth.login(credentials);
} catch (error) {
  if (error instanceof auth.AuthenticationError) {
    console.error('Invalid credentials');
  }
}
```
