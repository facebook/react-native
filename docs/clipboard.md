---
id: clipboard
title: Clipboard
layout: docs
category: APIs
permalink: docs/clipboard.html
next: datepickerandroid
previous: cameraroll
---

`Clipboard` gives you an interface for setting and getting content from Clipboard on both iOS and Android


### Methods

- [`getString`](docs/clipboard.html#getstring)
- [`setString`](docs/clipboard.html#setstring)




---

# Reference

## Methods

### `getString()`

```javascript
static getString()
```


Get content of string type, this method returns a `Promise`, so you can use following code to get clipboard content
```javascript
async _getContent() {
  var content = await Clipboard.getString();
}
```




---

### `setString()`

```javascript
static setString(content)
```


Set content of string type. You can use following code to set clipboard content
```javascript
_setContent() {
  Clipboard.setString('hello world');
}
```
@param the content to be stored in the clipboard.




