---
title: Cache Plugin - API Reference
description: Complete API reference for the Cache Plugin
sidebar: plugins
---

# Cache Plugin - API Reference

Complete API documentation for the Cache Plugin.

## Configuration

### `cache.configure(options)`

Configure the cache plugin.

**Parameters:**
- `options` (Object) - Configuration options
  - `backend` (String) - Backend type ('redis', 'memcached', 'memory', 'file')
  - `host` (String) - Backend host (for Redis/Memcached)
  - `port` (Number) - Backend port
  - `defaultTTL` (Number) - Default time-to-live in seconds (default: 3600)
  - `compression` (Boolean) - Enable compression (default: false)

**Example:**
```javascript
cache.configure({
  backend: 'redis',
  host: 'localhost',
  port: 6379,
  defaultTTL: 3600,
  compression: true
});
```

## Core Methods

### `cache.set(key, value, options)`

Store a value in the cache.

**Parameters:**
- `key` (String) - Cache key
- `value` (Any) - Value to store (will be serialized)
- `options` (Object, optional) - Options
  - `ttl` (Number) - Time-to-live in seconds
  - `compress` (Boolean) - Override compression setting

**Returns:** `Promise<boolean>` - Success status

**Example:**
```javascript
await cache.set('user:123', { name: 'John', email: 'john@example.com' }, {
  ttl: 1800
});
```

### `cache.get(key)`

Retrieve a value from the cache.

**Parameters:**
- `key` (String) - Cache key

**Returns:** `Promise<Any | null>` - Cached value or null if not found

**Example:**
```javascript
const user = await cache.get('user:123');
if (user) {
  console.log('Cache hit:', user.name);
}
```

### `cache.delete(key)`

Delete a value from the cache.

**Parameters:**
- `key` (String) - Cache key

**Returns:** `Promise<boolean>` - Success status

**Example:**
```javascript
await cache.delete('user:123');
```

### `cache.clear(pattern)`

Clear multiple keys matching a pattern.

**Parameters:**
- `pattern` (String, optional) - Key pattern (supports wildcards: `*`)

**Returns:** `Promise<number>` - Number of keys deleted

**Example:**
```javascript
// Clear all user keys
await cache.clear('user:*');

// Clear entire cache
await cache.clear();
```

## Batch Operations

### `cache.mget(keys)`

Get multiple values at once.

**Parameters:**
- `keys` (Array<String>) - Array of cache keys

**Returns:** `Promise<Array<Any | null>>` - Array of values (null for missing keys)

**Example:**
```javascript
const [user1, user2] = await cache.mget(['user:123', 'user:456']);
```

### `cache.mset(entries, options)`

Set multiple values at once.

**Parameters:**
- `entries` (Object) - Key-value pairs
- `options` (Object, optional) - Options (same as `set()`)

**Returns:** `Promise<boolean>` - Success status

**Example:**
```javascript
await cache.mset({
  'user:123': userData1,
  'user:456': userData2
}, { ttl: 3600 });
```

## Cache Statistics

### `cache.stats()`

Get cache statistics.

**Returns:** `Promise<Object>` - Statistics object
- `hits` (Number) - Cache hits
- `misses` (Number) - Cache misses
- `keys` (Number) - Total keys
- `memory` (Number) - Memory usage in bytes

**Example:**
```javascript
const stats = await cache.stats();
console.log(`Hit rate: ${(stats.hits / (stats.hits + stats.misses) * 100).toFixed(2)}%`);
```

## Events

- `hit` - Cache hit occurred
- `miss` - Cache miss occurred
- `set` - Value was set
- `delete` - Value was deleted
- `error` - Error occurred

**Example:**
```javascript
cache.on('miss', (key) => {
  console.log('Cache miss for key:', key);
});
```
