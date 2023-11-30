# @callstack/out-of-tree-platforms

[![Version][version-badge]][package]

Utilities for Out of Tree (OOT) platforms.

## `getPlatformResolver`

```js
getPlatformResolver(options: ResolverConfig): CustomResolver
```

### options

```js
type ResolverConfig = {
  platformImplementations: {[platform: string]: string},
};
```
