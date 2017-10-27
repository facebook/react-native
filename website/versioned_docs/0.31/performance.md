---
id: version-0.31-performance
title: performance
original_id: performance
---
<a id="content"></a><h1><a class="anchor" name="performance"></a>Performance <a class="hash-link" href="docs/performance.html#performance">#</a></h1><div><p>A compelling reason for using React Native instead of WebView-based
tools is to achieve 60 FPS and a native look &amp; feel to your apps. Where
possible, we would like for React Native to do the right thing and help
you to focus on your app instead of performance optimization, but there
are areas where we're not quite there yet, and others where React Native
(similar to writing native code directly) cannot possibly determine the
best way to optimize for you and so manual intervention will be
necessary.</p><p>This guide is intended to teach you some basics to help you
to troubleshoot performance issues, as well as discuss common sources of
problems and their suggested solutions.</p><h3><a class="anchor" name="what-you-need-to-know-about-frames"></a>What you need to know about frames <a class="hash-link" href="docs/performance.html#what-you-need-to-know-about-frames">#</a></h3><p>Your grandparents' generation called movies <a href="https://www.youtube.com/watch?v=F1i40rnpOsA" target="_blank">"moving
pictures"</a> for a reason:
realistic motion in video is an illusion created by quickly changing
static images at a consistent speed. We refer to each of these images as
frames. The number of frames that is displayed each second has a direct
impact on how smooth and ultimately life-like a video (or user
interface) seems to be. iOS devices display 60 frames per second, which
gives you and the UI system about 16.67ms to do all of the work needed to
generate the static image (frame) that the user will see on the screen
for that interval. If you are unable to do the work necessary to
generate that frame within the allotted 16.67ms, then you will "drop a
frame" and the UI will appear unresponsive.</p><p>Now to confuse the matter a little bit, open up the developer menu in
your app and toggle <code>Show FPS Monitor</code>. You will notice that there are
two different frame rates.</p><h4><a class="anchor" name="javascript-frame-rate"></a>JavaScript frame rate <a class="hash-link" href="docs/performance.html#javascript-frame-rate">#</a></h4><p>For most React Native applications, your business logic will run on the
JavaScript thread. This is where your React application lives, API calls
are made, touch events are processed, etc... Updates to native-backed
views are batched and sent over to the native side at the end of each iteration of the event loop, before the frame deadline (if
all goes well). If the JavaScript thread is unresponsive for a frame, it
will be considered a dropped frame. For example, if you were to call
<code>this.setState</code> on the root component of a complex application and it
resulted in re-rendering computationally expensive component subtrees,
it's conceivable that this might take 200ms and result in 12 frames
being dropped. Any animations controlled by JavaScript would appear to freeze during that time. If anything takes longer than 100ms, the user will feel it.</p><p>This often happens during Navigator transitions: when you push a new
route, the JavaScript thread needs to render all of the components
necessary for the scene in order to send over the proper commands to the
native side to create the backing views. It's common for the work being
done here to take a few frames and cause jank because the transition is
controlled by the JavaScript thread. Sometimes components will do
additional work on <code>componentDidMount</code>, which might result in a second
stutter in the transition.</p><p>Another example is responding to touches: if you are doing work across
multiple frames on the JavaScript thread, you might notice a delay in
responding to TouchableOpacity, for example. This is because the JavaScript thread is busy and cannot process the raw touch events sent over from the main thread. As a result, TouchableOpacity cannot react to the touch events and command the native view to adjust its opacity.</p><h4><a class="anchor" name="main-thread-aka-ui-thread-frame-rate"></a>Main thread (aka UI thread) frame rate <a class="hash-link" href="docs/performance.html#main-thread-aka-ui-thread-frame-rate">#</a></h4><p>Many people have noticed that performance of <code>NavigatorIOS</code> is better
out of the box than <code>Navigator</code>. The reason for this is that the
animations for the transitions are done entirely on the main thread, and
so they are not interrupted by frame drops on the JavaScript thread.
(<a href="docs/navigator-comparison.html" target="_blank">Read about why you should probably use Navigator
anyways.</a>)</p><p>Similarly, you can happily scroll up and down through a ScrollView when
the JavaScript thread is locked up because the ScrollView lives on the
main thread (the scroll events are dispatched to the JS thread though,
but their receipt is not necessary for the scroll to occur).</p><h3><a class="anchor" name="common-sources-of-performance-problems"></a>Common sources of performance problems <a class="hash-link" href="docs/performance.html#common-sources-of-performance-problems">#</a></h3><h4><a class="anchor" name="console-log-statements"></a>Console.log statements <a class="hash-link" href="docs/performance.html#console-log-statements">#</a></h4><p>When running a bundled app, these statements can cause a big bottleneck in the JavaScript thread. This includes calls from debugging libraries such as <a href="https://github.com/evgenyrodionov/redux-logger" target="_blank">redux-logger</a>, so make sure to remove them before bundling.</p><h4><a class="anchor" name="development-mode-dev-true"></a>Development mode (dev=true) <a class="hash-link" href="docs/performance.html#development-mode-dev-true">#</a></h4><p>JavaScript thread performance suffers greatly when running in dev mode.
This is unavoidable: a lot more work needs to be done at runtime to
provide you with good warnings and error messages, such as validating
propTypes and various other assertions.</p><h4><a class="anchor" name="slow-navigator-transitions"></a>Slow navigator transitions <a class="hash-link" href="docs/performance.html#slow-navigator-transitions">#</a></h4><p>As mentioned above, <code>Navigator</code> animations are controlled by the
JavaScript thread. Imagine the "push from right" scene transition: each
frame, the new scene is moved from the right to left, starting offscreen
(let's say at an x-offset of 320) and ultimately settling when the scene sits
at an x-offset of 0. Each frame during this transition, the
JavaScript thread needs to send a new x-offset to the main thread.
If the JavaScript thread is locked up, it cannot do this and so no
update occurs on that frame and the animation stutters.</p><p>Part of the long-term solution to this is to allow for JavaScript-based
animations to be offloaded to the main thread. If we were to do the same
thing as in the above example with this approach, we might calculate a
list of all x-offsets for the new scene when we are starting the
transition and send them to the main thread to execute in an
optimized way. Now that the JavaScript thread is freed of this
responsibility, it's not a big deal if it drops a few frames while
rendering the scene -- you probably won't even notice because you will be
too distracted by the pretty transition.</p><p>Unfortunately this solution is not yet implemented, and so in the
meantime we should use the InteractionManager to selectively render the
minimal amount of content necessary for the new scene as long as the
animation is in progress. <code>InteractionManager.runAfterInteractions</code> takes
a callback as its only argument, and that callback is fired when the
navigator transition is complete (each animation from the <code>Animated</code> API
also notifies the InteractionManager, but that's beyond the scope of
this discussion).</p><p>Your scene component might look something like this:</p><div class="prism language-javascript">class <span class="token class-name">ExpensiveScene</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">,</span> context<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">,</span> context<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>renderPlaceholderOnly<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">componentDidMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    InteractionManager<span class="token punctuation">.</span><span class="token function">runAfterInteractions<span class="token punctuation">(</span></span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>renderPlaceholderOnly<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>renderPlaceholderOnly<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderPlaceholderView<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>Your full view goes here&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>


  <span class="token function">_renderPlaceholderView<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>Loading<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">;</span></div><p>You don't need to be limited to rendering some loading indicator, you
could alternatively render part of your content -- for example, when you
load the Facebook app you see a placeholder news feed item with grey
rectangles where text will be. If you are rendering a Map in your new
scene, you might want to display a grey placeholder view or a spinner
until the transition is complete as this can actually cause frames to be
dropped on the main thread.</p><h4><a class="anchor" name="listview-initial-rendering-is-too-slow-or-scroll-performance-is-bad-for-large-lists"></a>ListView initial rendering is too slow or scroll performance is bad for large lists <a class="hash-link" href="docs/performance.html#listview-initial-rendering-is-too-slow-or-scroll-performance-is-bad-for-large-lists">#</a></h4><p>This is an issue that comes up frequently because iOS ships with
UITableView which gives you very good performance by re-using underlying
UIViews. Work is in progress to do something similar with React Native,
but until then we have some tools at our disposal to help us tweak the
performance to suit our needs. It may not be possible to get all the way
there, but a little bit of creativity and experimentation with these
options can go a long way.</p><h5><a class="anchor" name="initiallistsize"></a>initialListSize <a class="hash-link" href="docs/performance.html#initiallistsize">#</a></h5><p>This prop specifies how many rows we want to render on our first render
pass. If we are concerned with getting <em>something</em> on screen as quickly
as possible, we could set the <code>initialListSize</code> to 1, and we'll quickly
see other rows fill in on subsequent frames. The number of rows per
frame is determined by the <code>pageSize</code>.</p><h5><a class="anchor" name="pagesize"></a>pageSize <a class="hash-link" href="docs/performance.html#pagesize">#</a></h5><p>After the initial render where <code>initialListSize</code> is used, ListView looks
at the <code>pageSize</code> to determine how many rows to render per frame. The
default here is 1 -- but if your views are very small and inexpensive to
render, you might want to bump this up. Tweak it and find what works for
your use case.</p><h5><a class="anchor" name="scrollrenderaheaddistance"></a>scrollRenderAheadDistance <a class="hash-link" href="docs/performance.html#scrollrenderaheaddistance">#</a></h5><p>"How early to start rendering rows before they come on screen, in pixels."</p><p>If we had a list with 2000 items and rendered them all immediately that
would be a poor use of both memory and computational resources. It would
also probably cause some pretty awful jank. So the scrollRenderAhead
distance allows us to specify how far beyond the current viewport we
should continue to render rows.</p><h5><a class="anchor" name="removeclippedsubviews"></a>removeClippedSubviews <a class="hash-link" href="docs/performance.html#removeclippedsubviews">#</a></h5><p>"When true, offscreen child views (whose <code>overflow</code> value is <code>hidden</code>)
are removed from their native backing superview when offscreen.  This
can improve scrolling performance on long lists. The default value is
<code>true</code>."(The default value is <code>false</code> before version 0.14-rc).</p><p>This is an extremely important optimization to apply on large ListViews.
On Android the <code>overflow</code> value is always <code>hidden</code> so you don't need to
worry about setting it, but on iOS you need to be sure to set <code>overflow:
hidden</code> on row containers.</p><h4><a class="anchor" name="my-component-renders-too-slowly-and-i-don-t-need-it-all-immediately"></a>My component renders too slowly and I don't need it all immediately <a class="hash-link" href="docs/performance.html#my-component-renders-too-slowly-and-i-don-t-need-it-all-immediately">#</a></h4><p>It's common at first to overlook ListView, but using it properly is
often key to achieving solid performance. As discussed above, it
provides you with a set of tools that lets you split rendering of your
view across various frames and tweak that behavior to fit your specific
needs. Remember that ListView can be horizontal too.</p><h4><a class="anchor" name="js-fps-plunges-when-re-rendering-a-view-that-hardly-changes"></a>JS FPS plunges when re-rendering a view that hardly changes <a class="hash-link" href="docs/performance.html#js-fps-plunges-when-re-rendering-a-view-that-hardly-changes">#</a></h4><p>If you are using a ListView, you must provide a <code>rowHasChanged</code> function
that can reduce a lot of work by quickly determining whether or not a
row needs to be re-rendered. If you are using immutable data structures,
this would be as simple as a reference equality check.</p><p>Similarly, you can implement <code>shouldComponentUpdate</code> and indicate the
exact conditions under which you would like the component to re-render.
If you write pure components (where the return value of the render
function is entirely dependent on props and state), you can leverage
PureRenderMixin to do this for you. Once again, immutable data
structures are useful to keep this fast -- if you have to do a deep
comparison of a large list of objects, it may be that re-rendering your
entire component would be quicker, and it would certainly require less
code.</p><h4><a class="anchor" name="dropping-js-thread-fps-because-of-doing-a-lot-of-work-on-the-javascript-thread-at-the-same-time"></a>Dropping JS thread FPS because of doing a lot of work on the JavaScript thread at the same time <a class="hash-link" href="docs/performance.html#dropping-js-thread-fps-because-of-doing-a-lot-of-work-on-the-javascript-thread-at-the-same-time">#</a></h4><p>"Slow Navigator transitions" is the most common manifestation of this,
but there are other times this can happen. Using InteractionManager can
be a good approach, but if the user experience cost is too high to delay
work during an animation, then you might want to consider
LayoutAnimation.</p><p>The Animated api currently calculates each keyframe on-demand on the
JavaScript thread, while LayoutAnimation leverages Core Animation and is
unaffected by JS thread and main thread frame drops.</p><p>One case where I have used this is for animating in a modal (sliding
down from top and fading in a translucent overlay) while
initializing and perhaps receiving responses for several network
requests, rendering the contents of the modal, and updating the view
where the modal was opened from. See the Animations guide for more
information about how to use LayoutAnimation.</p><p>Caveats:
- LayoutAnimation only works for fire-and-forget animations ("static"
  animations) -- if it must be be interruptible, you will need to use
Animated.</p><h4><a class="anchor" name="moving-a-view-on-the-screen-scrolling-translating-rotating-drops-ui-thread-fps"></a>Moving a view on the screen (scrolling, translating, rotating) drops UI thread FPS <a class="hash-link" href="docs/performance.html#moving-a-view-on-the-screen-scrolling-translating-rotating-drops-ui-thread-fps">#</a></h4><p>This is especially true when you have text with a transparent background
positioned on top of an image, or any other situation where alpha
compositing would be required to re-draw the view on each frame. You
will find that enabling <code>shouldRasterizeIOS</code> or <code>renderToHardwareTextureAndroid</code>
can help with this significantly.</p><p>Be careful not to overuse this or your memory usage could go through the
roof. Profile your performance and memory usage when using these props. If you don't plan to move a view anymore, turn this property off.</p><h4><a class="anchor" name="animating-the-size-of-an-image-drops-ui-thread-fps"></a>Animating the size of an image drops UI thread FPS <a class="hash-link" href="docs/performance.html#animating-the-size-of-an-image-drops-ui-thread-fps">#</a></h4><p>On iOS, each time you adjust the width or height of an Image component
it is re-cropped and scaled from the original image. This can be very expensive,
especially for large images. Instead, use the <code>transform: [{scale}]</code>
style property to animate the size. An example of when you might do this is
when you tap an image and zoom it in to full screen.</p><h4><a class="anchor" name="my-touchablex-view-isn-t-very-responsive"></a>My TouchableX view isn't very responsive <a class="hash-link" href="docs/performance.html#my-touchablex-view-isn-t-very-responsive">#</a></h4><p>Sometimes, if we do an action in the same frame that we are adjusting
the opacity or highlight of a component that is responding to a touch,
we won't see that effect until after the <code>onPress</code> function has returned.
If <code>onPress</code> does a <code>setState</code> that results in a lot of work and a few
frames dropped, this may occur. A solution to this is to wrap any action
inside of your <code>onPress</code> handler in <code>requestAnimationFrame</code>:</p><div class="prism language-javascript"><span class="token function">handleOnPress<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
 <span class="token comment" spellcheck="true"> // Always use TimerMixin with requestAnimationFrame, setTimeout and
</span> <span class="token comment" spellcheck="true"> // setInterval
</span>  <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">requestAnimationFrame<span class="token punctuation">(</span></span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">doExpensiveAction<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><h3><a class="anchor" name="profiling"></a>Profiling <a class="hash-link" href="docs/performance.html#profiling">#</a></h3><p>Use the built-in Profiler to get detailed information about work done in
the JavaScript thread and main thread side-by-side.</p><p>For iOS, Instruments are an invaluable tool, and on Android you should
learn to use systrace.</p></div><div class="docs-prevnext"><a class="docs-prev" href="docs/navigation.html#content">← Prev</a><a class="docs-next" href="docs/upgrading.html#content">Next →</a></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/Performance.md">edit the content above on GitHub</a> and send us a pull request!</p><div class="survey"><div class="survey-image"></div><p>Recently, we have been working hard to make the documentation better based on your feedback. Your responses to this yes/no style survey will help us gauge whether we moved in the right direction with the improvements. Thank you!</p><center><a class="button" href="https://www.facebook.com/survey?oid=516954245168428">Take Survey</a></center></div>