---
id: performance
title: Performance
layout: docs
category: Guides
permalink: docs/performance.html
next: upgrading
---

A compelling reason for using React Native instead of WebView-based
tools is to achieve 60 FPS and a native look & feel to your apps. Where
possible, we would like for React Native to do the right thing and help
you to focus on your app instead of performance optimization, but there
are areas where we're not quite there yet, and others where React Native
(similar to writing native code directly) cannot possibly determine the
best way to optimize for you and so manual intervention will be
necessary.

This guide is intended to teach you some basics to help you
to troubleshoot performance issues, as well as discuss common sources of
problems and their suggested solutions.

### What you need to know about frames

Your grandparents' generation called movies ["moving
pictures"](https://www.youtube.com/watch?v=F1i40rnpOsA) for a reason:
realistic motion in video is an illusion created by quickly changing
static images at a consistent speed. We refer to each of these images as
frames. The number of frames that is displayed each second has a direct
impact on how smooth and ultimately life-like a video (or user
interface) seems to be. iOS devices display 60 frames per second, which
gives you and the UI system about 16.67ms to do all of the work needed to
generate the static image (frame) that the user will see on the screen
for that interval. If you are unable to do the work necessary to
generate that frame within the allotted 16.67ms, then you will "drop a
frame" and the UI will appear unresponsive.

Now to confuse the matter a little bit, open up the developer menu in
your app and toggle `Show FPS Monitor`. You will notice that there are
two different frame rates.

#### JavaScript frame rate

For most React Native applications, your business logic will run on the
JavaScript thread. This is where your React application lives, API calls
are made, touch events are processed, etc... Updates to native-backed
views are batched and sent over to the native side at the end of each iteration of the event loop, before the frame deadline (if
all goes well). If the JavaScript thread is unresponsive for a frame, it
will be considered a dropped frame. For example, if you were to call
`this.setState` on the root component of a complex application and it
resulted in re-rendering computationally expensive component subtrees,
it's conceivable that this might take 200ms and result in 12 frames
being dropped. Any animations controlled by JavaScript would appear to freeze during that time. If anything takes longer than 100ms, the user will feel it.

This often happens during Navigator transitions: when you push a new
route, the JavaScript thread needs to render all of the components
necessary for the scene in order to send over the proper commands to the
native side to create the backing views. It's common for the work being
done here to take a few frames and cause jank because the transition is
controlled by the JavaScript thread. Sometimes components will do
additional work on `componentDidMount`, which might result in a second
stutter in the transition.

Another example is responding to touches: if you are doing work across
multiple frames on the JavaScript thread, you might notice a delay in
responding to TouchableOpacity, for example. This is because the JavaScript thread is busy and cannot process the raw touch events sent over from the main thread. As a result, TouchableOpacity cannot react to the touch events and command the native view to adjust its opacity.

#### Main thread (aka UI thread) frame rate

Many people have noticed that performance of `NavigatorIOS` is better
out of the box than `Navigator`. The reason for this is that the
animations for the transitions are done entirely on the main thread, and
so they are not interrupted by frame drops on the JavaScript thread.
([Read about why you should probably use Navigator
anyways.](docs/navigator-comparison.html))

Similarly, you can happily scroll up and down through a ScrollView when
the JavaScript thread is locked up because the ScrollView lives on the
main thread (the scroll events are dispatched to the JS thread though,
but their receipt is not necessary for the scroll to occur).

### Common sources of performance problems

#### Console.log statements 

When running a bundled app, these statements can cause a big bottleneck in the JavaScript thread. This includes calls from debugging libraries such as [redux-logger](https://github.com/evgenyrodionov/redux-logger), so make sure to remove them before bundling.

#### Development mode (dev=true)

JavaScript thread performance suffers greatly when running in dev mode.
This is unavoidable: a lot more work needs to be done at runtime to
provide you with good warnings and error messages, such as validating
propTypes and various other assertions.

#### Slow navigator transitions

As mentioned above, `Navigator` animations are controlled by the
JavaScript thread. Imagine the "push from right" scene transition: each
frame, the new scene is moved from the right to left, starting offscreen
(let's say at an x-offset of 320) and ultimately settling when the scene sits
at an x-offset of 0. Each frame during this transition, the
JavaScript thread needs to send a new x-offset to the main thread.
If the JavaScript thread is locked up, it cannot do this and so no
update occurs on that frame and the animation stutters.

Part of the long-term solution to this is to allow for JavaScript-based
animations to be offloaded to the main thread. If we were to do the same
thing as in the above example with this approach, we might calculate a
list of all x-offsets for the new scene when we are starting the
transition and send them to the main thread to execute in an
optimized way. Now that the JavaScript thread is freed of this
responsibility, it's not a big deal if it drops a few frames while
rendering the scene -- you probably won't even notice because you will be
too distracted by the pretty transition.

Unfortunately this solution is not yet implemented, and so in the
meantime we should use the InteractionManager to selectively render the
minimal amount of content necessary for the new scene as long as the
animation is in progress. `InteractionManager.runAfterInteractions` takes
a callback as its only argument, and that callback is fired when the
navigator transition is complete (each animation from the `Animated` API
also notifies the InteractionManager, but that's beyond the scope of
this discussion).

Your scene component might look something like this:

```js
class ExpensiveScene extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {renderPlaceholderOnly: true};
  }

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.setState({renderPlaceholderOnly: false});
    });
  }

  render() {
    if (this.state.renderPlaceholderOnly) {
      return this._renderPlaceholderView();
    }

    return (
      <View>
        <Text>Your full view goes here</Text>
      </View>
    );
  }


  _renderPlaceholderView() {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }
};
```

You don't need to be limited to rendering some loading indicator, you
could alternatively render part of your content -- for example, when you
load the Facebook app you see a placeholder news feed item with grey
rectangles where text will be. If you are rendering a Map in your new
scene, you might want to display a grey placeholder view or a spinner
until the transition is complete as this can actually cause frames to be
dropped on the main thread.

#### ListView initial rendering is too slow or scroll performance is bad for large lists

This is an issue that comes up frequently because iOS ships with
UITableView which gives you very good performance by re-using underlying
UIViews. Work is in progress to do something similar with React Native,
but until then we have some tools at our disposal to help us tweak the
performance to suit our needs. It may not be possible to get all the way
there, but a little bit of creativity and experimentation with these
options can go a long way.

##### initialListSize

This prop specifies how many rows we want to render on our first render
pass. If we are concerned with getting *something* on screen as quickly
as possible, we could set the `initialListSize` to 1, and we'll quickly
see other rows fill in on subsequent frames. The number of rows per
frame is determined by the `pageSize`.

##### pageSize

After the initial render where `initialListSize` is used, ListView looks
at the `pageSize` to determine how many rows to render per frame. The
default here is 1 -- but if your views are very small and inexpensive to
render, you might want to bump this up. Tweak it and find what works for
your use case.

##### scrollRenderAheadDistance

"How early to start rendering rows before they come on screen, in pixels."

If we had a list with 2000 items and rendered them all immediately that
would be a poor use of both memory and computational resources. It would
also probably cause some pretty awful jank. So the scrollRenderAhead
distance allows us to specify how far beyond the current viewport we
should continue to render rows.

##### removeClippedSubviews

"When true, offscreen child views (whose `overflow` value is `hidden`)
are removed from their native backing superview when offscreen.  This
can improve scrolling performance on long lists. The default value is
`true`."(The default value is `false` before version 0.14-rc).

This is an extremely important optimization to apply on large ListViews.
On Android the `overflow` value is always `hidden` so you don't need to
worry about setting it, but on iOS you need to be sure to set `overflow:
hidden` on row containers.

#### My component renders too slowly and I don't need it all immediately

It's common at first to overlook ListView, but using it properly is
often key to achieving solid performance. As discussed above, it
provides you with a set of tools that lets you split rendering of your
view across various frames and tweak that behavior to fit your specific
needs. Remember that ListView can be horizontal too.

#### JS FPS plunges when re-rendering a view that hardly changes

If you are using a ListView, you must provide a `rowHasChanged` function
that can reduce a lot of work by quickly determining whether or not a
row needs to be re-rendered. If you are using immutable data structures,
this would be as simple as a reference equality check.

Similarly, you can implement `shouldComponentUpdate` and indicate the
exact conditions under which you would like the component to re-render.
If you write pure components (where the return value of the render
function is entirely dependent on props and state), you can leverage
PureRenderMixin to do this for you. Once again, immutable data
structures are useful to keep this fast -- if you have to do a deep
comparison of a large list of objects, it may be that re-rendering your
entire component would be quicker, and it would certainly require less
code.

#### Dropping JS thread FPS because of doing a lot of work on the JavaScript thread at the same time

"Slow Navigator transitions" is the most common manifestation of this,
but there are other times this can happen. Using InteractionManager can
be a good approach, but if the user experience cost is too high to delay
work during an animation, then you might want to consider
LayoutAnimation.

The Animated api currently calculates each keyframe on-demand on the
JavaScript thread, while LayoutAnimation leverages Core Animation and is
unaffected by JS thread and main thread frame drops.

One case where I have used this is for animating in a modal (sliding
down from top and fading in a translucent overlay) while
initializing and perhaps receiving responses for several network
requests, rendering the contents of the modal, and updating the view
where the modal was opened from. See the Animations guide for more
information about how to use LayoutAnimation.

Caveats:
- LayoutAnimation only works for fire-and-forget animations ("static"
  animations) -- if it must be be interruptible, you will need to use
Animated.

#### Moving a view on the screen (scrolling, translating, rotating) drops UI thread FPS

This is especially true when you have text with a transparent background
positioned on top of an image, or any other situation where alpha
compositing would be required to re-draw the view on each frame. You
will find that enabling `shouldRasterizeIOS` or `renderToHardwareTextureAndroid`
can help with this significantly.

Be careful not to overuse this or your memory usage could go through the
roof. Profile your performance and memory usage when using these props. If you don't plan to move a view anymore, turn this property off.

#### Animating the size of an image drops UI thread FPS

On iOS, each time you adjust the width or height of an Image component
it is re-cropped and scaled from the original image. This can be very expensive,
especially for large images. Instead, use the `transform: [{scale}]`
style property to animate the size. An example of when you might do this is
when you tap an image and zoom it in to full screen.

#### My TouchableX view isn't very responsive

Sometimes, if we do an action in the same frame that we are adjusting
the opacity or highlight of a component that is responding to a touch,
we won't see that effect until after the `onPress` function has returned.
If `onPress` does a `setState` that results in a lot of work and a few
frames dropped, this may occur. A solution to this is to wrap any action
inside of your `onPress` handler in `requestAnimationFrame`:

```js
handleOnPress() {
  // Always use TimerMixin with requestAnimationFrame, setTimeout and
  // setInterval
  this.requestAnimationFrame(() => {
    this.doExpensiveAction();
  });
}
```

### Profiling

Use the built-in Profiler to get detailed information about work done in
the JavaScript thread and main thread side-by-side.

For iOS, Instruments are an invaluable tool, and on Android you should
learn to use systrace.
