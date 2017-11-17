---
id: asyncstorage
title: AsyncStorage
layout: docs
category: APIs
permalink: docs/asyncstorage.html
next: backandroid
previous: appstate
---

`AsyncStorage` is a simple, unencrypted, asynchronous, persistent, key-value storage system that is global to the app.  It should be used instead of LocalStorage.

It is recommended that you use an abstraction on top of `AsyncStorage` instead of `AsyncStorage` directly for anything more than light usage since it operates globally.

On iOS, `AsyncStorage` is backed by native code that stores small values in a serialized dictionary and larger values in separate files. On Android, `AsyncStorage` will use either [RocksDB](http://rocksdb.org/) or SQLite based on what is available.

The `AsyncStorage` JavaScript code is a simple facade that provides a clear JavaScript API, real `Error` objects, and simple non-multi functions. Each method in the API returns a `Promise` object.

Persisting data:

```javascript
try {
  await AsyncStorage.setItem('@MySuperStore:key', 'I like to save it.');
} catch (error) {
  // Error saving data
}
```

Fetching data:

```javascript
try {
  const value = await AsyncStorage.getItem('@MySuperStore:key');
  if (value !== null){
    // We have data!!
    console.log(value);
  }
} catch (error) {
  // Error retrieving data
}
```

Merging data:

```javascript
let UID123_object = {
  name: 'Chris',
  age: 30,
  traits: {hair: 'brown', eyes: 'brown'},
};
// You only need to define what will be added or updated
let UID123_delta = {
  age: 31,
  traits: {eyes: 'blue', shoe_size: 10}
};

AsyncStorage.setItem('UID123', JSON.stringify(UID123_object), () => {
  AsyncStorage.mergeItem('UID123', JSON.stringify(UID123_delta), () => {
    AsyncStorage.getItem('UID123', (err, result) => {
      console.log(result);
    });
  });
});

// Console log result:
// => {'name':'Chris','age':31,'traits':
//    {'shoe_size':10,'hair':'brown','eyes':'blue'}}
```


Multi merge example:

```javascript

// first user, initial values
let UID234_object = {
 name: 'Chris',
 age: 30,
 traits: {hair: 'brown', eyes: 'brown'},
};

// first user, delta values
let UID234_delta = {
 age: 31,
 traits: {eyes: 'blue', shoe_size: 10},
};

// second user, initial values
let UID345_object = {
 name: 'Marge',
 age: 25,
 traits: {hair: 'blonde', eyes: 'blue'},
};

// second user, delta values
let UID345_delta = {
 age: 26,
 traits: {eyes: 'green', shoe_size: 6},
};

let multi_set_pairs   = [['UID234', JSON.stringify(UID234_object)], ['UID345', JSON.stringify(UID345_object)]]
let multi_merge_pairs = [['UID234', JSON.stringify(UID234_delta)], ['UID345', JSON.stringify(UID345_delta)]]

AsyncStorage.multiSet(multi_set_pairs, (err) => {
  AsyncStorage.multiMerge(multi_merge_pairs, (err) => {
    AsyncStorage.multiGet(['UID234','UID345'], (err, stores) => {
      stores.map( (result, i, store) => {
        let key = store[i][0];
        let val = store[i][1];
        console.log(key, val);
      });
    });
  });
});

// Console log results:
// => UID234 {"name":"Chris","age":31,"traits":{"shoe_size":10,"hair":"brown","eyes":"blue"}}
// => UID345 {"name":"Marge","age":26,"traits":{"shoe_size":6,"hair":"blonde","eyes":"green"}}
```

Fetching multiple items:

```javascript
AsyncStorage.getAllKeys((err, keys) => {
  AsyncStorage.multiGet(keys, (err, stores) => {
   stores.map((result, i, store) => {
     // get at each store's key/value so you can work with it
     let key = store[i][0];
     let value = store[i][1];
    });
  });
});
```

Removing multiple items:

```javascript

let keys = ['k1', 'k2'];
AsyncStorage.multiRemove(keys, (err) => {
  // keys k1 & k2 removed, if they existed
  // do most stuff after removal (if you want)
});
```



### Methods

- [`getItem`](docs/asyncstorage.html#getitem)
- [`setItem`](docs/asyncstorage.html#setitem)
- [`removeItem`](docs/asyncstorage.html#removeitem)
- [`mergeItem`](docs/asyncstorage.html#mergeitem)
- [`clear`](docs/asyncstorage.html#clear)
- [`getAllKeys`](docs/asyncstorage.html#getallkeys)

The following batched functions are useful for executing a lot of operations at once, allowing for native optimizations and provide the convenience of a single callback after all operations are complete.

These functions return arrays of errors, potentially one for every key. For key-specific errors, the Error object will have a key property to indicate which key caused the error.

- [`flushGetRequests`](docs/asyncstorage.html#flushgetrequests)
- [`multiGet`](docs/asyncstorage.html#multiget)
- [`multiSet`](docs/asyncstorage.html#multiset)
- [`multiRemove`](docs/asyncstorage.html#multiremove)
- [`multiMerge`](docs/asyncstorage.html#multimerge)




---

# Reference

## Methods

### `getItem()`

```javascript
AsyncStorage.getItem(key, [callback])
```

Fetches an item for a `key` and invokes a callback upon completion.
Returns a `Promise` object.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| key | string | Yes | Key of the item to fetch. |
| callback | ?(error: ?Error, result: ?string) => void | No | Function that will be called with a result if found or   any error. |




---

### `setItem()`

```javascript
AsyncStorage.setItem(key, value, [callback])
```

Sets the value for a `key` and invokes a callback upon completion. 

Returns a `Promise` object.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| key | string | Yes | Key of the item to set. |
| value | string | Yes | Value to set for the `key`. |
| callback | ?(error: ?Error) => void | No | Function that will be called with any error. |




---

### `removeItem()`

```javascript
AsyncStorage.removeItem(key, [callback])
```

Removes an item for a `key` and invokes a callback upon completion.
Returns a `Promise` object.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| key | string | Yes | Key of the item to remove. |
| callback | ?(error: ?Error) => void | No | Function that will be called with any error. |


---

### `mergeItem()`

```javascript
AsyncStorage.mergeItem(key, value, [callback])
```

Merges an existing `key` value with an input value, assuming both values are stringified JSON. Returns a `Promise` object.

> Note:
> This is not supported by all native implementations.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| key | string | Yes | Key of the item to modify. |
| value | string | Yes | New value to merge for the `key`. |
| callback | ?(error: ?Error) => void | No | Function that will be called with any error. |


---

### `clear()`

```javascript
AsyncStorage.clear([callback])
```

Erases *all* `AsyncStorage` for all clients, libraries, etc.  You probably don't want to call this; use `removeItem` or `multiRemove` to clear only your app's keys. Returns a `Promise` object.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| callback | ?(error: ?Error) => void | No | Function that will be called with any error. |




---

### `getAllKeys()`

```javascript
AsyncStorage.getAllKeys([callback])
```

Gets *all* keys known to your app; for all callers, libraries, etc.
Returns a `Promise` object.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| callback | ?(error: ?Error, keys: ?Array<string>) => void | No | Function that will be called the keys found and any error. |




---

### `flushGetRequests()`

```javascript
AsyncStorage.flushGetRequests()
```

Flushes any pending requests using a single batch call to get the data.

---

### `multiGet()`

```javascript
AsyncStorage.multiGet(keys, [callback])
```

This allows you to batch the fetching of items given an array of `key` inputs. Your callback will be invoked with an array of corresponding key-value pairs found:

```
multiGet(['k1', 'k2'], cb) -> cb([['k1', 'val1'], ['k2', 'val2']])
```

The method returns a `Promise` object.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| keys | Array<string> | Yes | Array of key for the items to get. |
| callback | ?(errors: ?Array<Error>, result: ?Array<Array<string>>) => void | No | Function that will be called with a key-value array of the results, plus an array of any key-specific errors found. |





---

### `multiSet()`

```javascript
AsyncStorage.multiSet(keyValuePairs, [callback])
```

Use this as a batch operation for storing multiple key-value pairs. When
the operation completes you'll get a single callback with any errors:

```
multiSet([['k1', 'val1'], ['k2', 'val2']], cb);
```

The method returns a `Promise` object.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| keyValuePairs | Array<Array<string>> | Yes | Array of key-value array for the items to set. |
| callback | ?(errors: ?Array<Error>) => void | No | Function that will be called with an array of any   key-specific errors found. |




---

### `multiRemove()`

```javascript
AsyncStorage.multiRemove(keys, [callback])
```

Call this to batch the deletion of all keys in the `keys` array. Returns
a `Promise` object.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| keys | Array<string> | Yes | Array of key for the items to delete. |
| callback | ?(errors: ?Array<Error>) => void | No | Function that will be called an array of any key-specific   errors found. |




---

### `multiMerge()`

```javascript
AsyncStorage.multiMerge(keyValuePairs, [callback])
```

Batch operation to merge in existing and new values for a given set of
keys. This assumes that the values are stringified JSON. Returns a
`Promise` object.

**NOTE**: This is not supported by all native implementations.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| keyValuePairs | Array<Array<string>> | Yes | Array of key-value array for the items to merge. |
| callback | ?(errors: ?Array<Error>) => void | No | Function that will be called with an array of any   key-specific errors found. |


