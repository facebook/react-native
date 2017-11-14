---
id: toastandroid
title: ToastAndroid
---

This exposes the native ToastAndroid module as a JS module. This has a function 'show'
which takes the following parameters:

1. String message: A string with the text to toast
2. int duration: The duration of the toast. May be ToastAndroid.SHORT or ToastAndroid.LONG

There is also a function `showWithGravity` to specify the layout gravity. May be
ToastAndroid.TOP, ToastAndroid.BOTTOM, ToastAndroid.CENTER.

The 'showWithGravityAndOffset' function adds on the ability to specify offset
These offset values will translate to pixels.

Basic usage:

```javascript
ToastAndroid.show('A pikachu appeared nearby !', ToastAndroid.SHORT);
ToastAndroid.showWithGravity('All Your Base Are Belong To Us', ToastAndroid.SHORT, ToastAndroid.CENTER);
ToastAndroid.showWithGravityAndOffset('A wild toast appeared!', ToastAndroid.LONG, ToastAndroid.BOTTOM, 25, 50);
```


### Methods

- [`show`](docs/toastandroid.html#show)
- [`showWithGravity`](docs/toastandroid.html#showwithgravity)
- [`showWithGravityAndOffset`](docs/toastandroid.html#showwithgravityandoffset)


### Properties

- [`SHORT`](docs/toastandroid.html#short)
- [`LONG`](docs/toastandroid.html#long)
- [`TOP`](docs/toastandroid.html#top)
- [`BOTTOM`](docs/toastandroid.html#bottom)
- [`CENTER`](docs/toastandroid.html#center)




---

# Reference

## Methods

### `show()`

```javascript
ToastAndroid.show(message, duration)
```



---

### `showWithGravity()`

```javascript
ToastAndroid.showWithGravity(message, duration, gravity)
```



---

### `showWithGravityAndOffset()`

```javascript
ToastAndroid.showWithGravityAndOffset(message, duration, gravity, xOffset, yOffset)
```



## Properties

### `SHORT`

---

### `LONG`

---

### `TOP`

---

### `BOTTOM`


---

### `CENTER`


