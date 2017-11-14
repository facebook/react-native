---
id: cameraroll
title: CameraRoll
---

`CameraRoll` provides access to the local camera roll / gallery.
Before using this you must link the `RCTCameraRoll` library.
You can refer to [Linking](docs/linking-libraries-ios.html) for help.

### Permissions
The user's permission is required in order to access the Camera Roll on devices running iOS 10 or later.
Add the `NSPhotoLibraryUsageDescription` key in your `Info.plist` with a string that describes how your
app will use this data. This key will appear as `Privacy - Photo Library Usage Description` in Xcode.



### Methods

- [`saveToCameraRoll`](docs/cameraroll.html#savetocameraroll)
- [`getPhotos`](docs/cameraroll.html#getphotos)




---

# Reference

## Methods

### `saveToCameraRoll()`

```javascript
CameraRoll.saveToCameraRoll(tag, type?)
```


Saves the photo or video to the camera roll / gallery.

On Android, the tag must be a local image or video URI, such as `"file:///sdcard/img.png"`.

On iOS, the tag can be any image URI (including local, remote asset-library and base64 data URIs)
or a local video file URI (remote or data URIs are not supported for saving video at this time).

If the tag has a file extension of .mov or .mp4, it will be inferred as a video. Otherwise
it will be treated as a photo. To override the automatic choice, you can pass an optional
`type` parameter that must be one of 'photo' or 'video'.

Returns a Promise which will resolve with the new URI.




---

### `getPhotos()`

```javascript
CameraRoll.getPhotos(params)
```


Returns a Promise with photo identifier objects from the local camera
roll of the device matching shape defined by `getPhotosReturnChecker`.

Expects a params object of the following shape:

- `first` : {number} : The number of photos wanted in reverse order of the photo application (i.e. most recent first for SavedPhotos).
- `after` : {string} : A cursor that matches `page_info { end_cursor }` returned from a previous call to `getPhotos`.
- `groupTypes` : {string} : Specifies which group types to filter the results to. Valid values are:
     - `Album`
     - `All`
     - `Event`
     - `Faces`
     - `Library`
     - `PhotoStream`
     - `SavedPhotos` // default
- `groupName` : {string} : Specifies filter on group names, like 'Recent Photos' or custom album titles.
- `assetType` : {string} : Specifies filter on asset type. Valid values are:
     - `All`
     - `Videos`
     - `Photos` // default
- `mimeTypes` : {string} : Filter by mimetype (e.g. image/jpeg).

Returns a Promise which when resolved will be of the following shape:

- `edges` : {Array<node>} An array of node objects
     - `node`: {object} An object with the following shape:
         - `type`: {string}
         - `group_name`: {string}
         - `image`: {object} : An object with the following shape:
             - `uri`: {string}
             - `height`: {number}
             - `width`: {number}
             - `isStored`: {boolean}
         - `timestamp`: {number}
         - `location`: {object} : An object with the following shape:
             - `latitude`: {number}
             - `longitude`: {number}
             - `altitude`: {number}
             - `heading`: {number}
             - `speed`: {number}
- `page_info` : {object} : An object with the following shape:
     - `has_next_page`: {boolean}
     - `start_cursor`: {boolean}
     - `end_cursor`: {boolean}

Loading images:
```
_handleButtonPress = () => {
   CameraRoll.getPhotos({
       first: 20,
       assetType: 'All',
     })
     .then(r => {
       this.setState({ photos: r.edges });
     })
     .catch((err) => {
        //Error Loading Images
     });
   };
render() {
 return (
   <View>
     <Button title="Load Images" onPress={this._handleButtonPress} />
     <ScrollView>
       {this.state.photos.map((p, i) => {
       return (
         <Image
           key={i}
           style={{
             width: 300,
             height: 100,
           }}
           source={{ uri: p.node.image.uri }}
         />
       );
     })}
     </ScrollView>
   </View>
 );
}
```




