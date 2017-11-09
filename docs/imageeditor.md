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
ImageEditor.cropImage(uri, cropData, success, failure)
```

Crop the image specified by the URI param. If URI points to a remote image, it will be downloaded automatically. If the image cannot be loaded/downloaded, the failure callback will be called.

If the cropping process is successful, the resultant cropped image will be stored in the ImageStore, and the URI returned in the success callback will point to the image in the store. Remember to delete the cropped image from the ImageStore when you are done with it.

**Crop Data Options:**

The following options can be used with the `cropData` parameter:

| Name | Type | Required | Description |
| - | - | - | - | 
| offset | `{ x: number, y: number}` | Yes | The top-left corner of the cropped image, specified in the original image's coordinate space. |
| size | `{ width: number, height: number }` | Yes | The size (dimensions) of the cropped image, specified in the original image's coordinate space. |
| displaySize | `{ width: number, height: number }` | No | Size to scale the cropped image to. |
| resizeMode | `enum( contain: string, cover: string, stretch: string }` | No | The resizing mode to use when scaling the image. If the `displaySize` param is not specified, this has no effect. |
