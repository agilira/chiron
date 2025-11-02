---
title: Cache Plugin
description: High-performance caching solution with multiple backends
sidebar: plugins
---

# Cache Plugin

The Cache Plugin provides a flexible caching layer with support for multiple storage backends.

## Features

- **Multiple Backends**: Redis, Memcached, In-Memory, and File-based caching
- **TTL Support**: Automatic expiration with time-to-live
- **Cache Invalidation**: Smart invalidation strategies
- **Compression**: Optional compression for large values

## Quick Start

```javascript
const cache = require('@mylib/plugin-cache');

cache.configure({
  backend: 'redis',
  host: 'localhost',
  port: 6379
});

// Set a value
await cache.set('user:123', userData, { ttl: 3600 });

// Get a value
const user = await cache.get('user:123');
```

## Documentation

- [API Reference](api-reference.html) - Complete API documentation

## Performance

The Cache Plugin is designed for high performance:

- **Sub-millisecond** access times with Redis
- **Automatic connection pooling**
- **Batch operations** for multiple keys
- **LRU eviction** for memory-based backends
