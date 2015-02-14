Displaying images is a fascinating subject, React Native uses some cool tricks to make it a better experience.

## No Automatic Sizing

If you don't give a size to an image, the browser is going to render a 0x0 element, download the image, and then render the image based with the correct size. The big issue with this behavior is that your UI is going to jump all around as images load, this makes for a very bad user experience.

In React Native, this behavior is intentionally not implemented. It is more work for the developer to know the dimensions (or just aspect ratio) of the image in advance, but we believe that it leads to a better user experience.

## Background Image via Nesting

A common feature request from developers familiar with the web is `background-image`. It turns out that iOS has a very elegant solution to this: you can add elements as a children to an `<Image>` component. This simplifies the API and solves the use case.

```javascript
return (
  <Image source={...}>
    <Text>Inside</Text>
  </Image>
);
```

## Off-thread Decoding

Image decoding can take more than a frame-worth of time. This is one of the major source of frame drops on the web because decoding is done in the main thread. In React Native, image decoding is done in a different thread. In practice, you already need to handle the case when the image is not downloaded yet, so displaying the placeholder for a few more frames while it is decoding does not require any code change.

## Static Assets

In the course of a project you add and remove images and in many instances, you end up shipping images you are not using anymore in the app. In order to fight this, we need to find a way to know statically which images are being used in the app. To do that, we introduced a marker called `ix`. The only allowed way to refer to an image in the bundle is to literally write `ix('name-of-the-asset')` in the source.

```javascript
var { ix } = React;

// GOOD
<Image source={ix('my-icon')} />

// BAD
var icon = this.props.active ? 'my-icon-active' : 'my-icon-inactive';
<Image source={ix(icon)} />

// GOOD
var icon = this.props.active ? ix('my-icon-active') : ix('my-icon-inactive');
<Image source={icon} />
```

When your entire codebase respects this convention, you're able to do interesting things like automatically packaging the assets that are being used in your app. Note that in the current form, nothing is enforced, but it will be in the future.

## Best Camera Roll Image

iOS saves multiple sizes for the same image in your Camera Roll, it is very important to pick the one that's as close as possible for performance reasons. You wouldn't want to use the full quality 3264x2448 image as source when displaying a 200x200 thumbnail. If there's an exact match, React Native will pick it, otherwise it's going to use the first one that's at least 50% bigger in order to avoid blur when resizing from a close size. All of this is done by default so you don't have to worry about writing the tedious (and error prone) code to do it yourself.

