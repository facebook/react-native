---
id: imageeditor
title: ImageEditor
layout: docs
category: APIs
permalink: docs/imageeditor.html
next: imagepickerios
previous: geolocation
---



### Methods

- [`cropImage`](docs/imageeditor.html#cropimage)




---

# Reference

## Methods

### `cropImage()`

```javascript
static cropImage(uri, cropData, success, failure)
```


Crop the image specified by the URI param. If URI points to a remote
image, it will be downloaded automatically. If the image cannot be
loaded/downloaded, the failure callback will be called.

If the cropping process is successful, the resultant cropped image
will be stored in the ImageStore, and the URI returned in the success
callback will point to the image in the store. Remember to delete the
cropped image from the ImageStore when you are done with it.




