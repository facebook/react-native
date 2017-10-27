---
id: version-0.22-animations
title: animations
original_id: animations
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="animations"></a>Animations <a class="hash-link" href="docs/animations.html#animations">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/Animations.md">Edit on GitHub</a></td></tr></tbody></table><div><p>Fluid, meaningful animations are essential to the mobile user experience. Like
everything in React Native, Animation APIs for React Native are currently under
development, but have started to coalesce around two complementary systems:
<code>LayoutAnimation</code> for animated global layout transactions, and <code>Animated</code> for
more granular and interactive control of specific values.</p><h3><a class="anchor" name="animated"></a>Animated <a class="hash-link" href="docs/animations.html#animated">#</a></h3><p>The <code>Animated</code> library is designed to make it very easy to concisely express a
wide variety of interesting animation and interaction patterns in a very
performant way. <code>Animated</code> focuses on declarative relationships between inputs
and outputs, with configurable transforms in between, and simple <code>start</code>/<code>stop</code>
methods to control time-based animation execution.  For example, a complete
component with a simple spring bounce on mount looks like this:</p><div class="prism language-javascript">class <span class="token class-name">Playground</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">:</span> any<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>
      bounceValue<span class="token punctuation">:</span> <span class="token keyword">new</span> <span class="token class-name">Animated<span class="token punctuation">.</span>Value</span><span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;Animated<span class="token punctuation">.</span>Image                        <span class="token comment" spellcheck="true"> // Base: Image, Text, View
</span>        source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> <span class="token string">'http://i.imgur.com/XMKOH81.jpg'</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
        style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
          flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
          transform<span class="token punctuation">:</span> <span class="token punctuation">[</span>                       <span class="token comment" spellcheck="true"> // `transform` is an ordered array
</span>            <span class="token punctuation">{</span>scale<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>bounceValue<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token comment" spellcheck="true"> // Map `bounceValue` to `scale`
</span>          <span class="token punctuation">]</span>
        <span class="token punctuation">}</span><span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  <span class="token function">componentDidMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>bounceValue<span class="token punctuation">.</span><span class="token function">setValue<span class="token punctuation">(</span></span><span class="token number">1.5</span><span class="token punctuation">)</span><span class="token punctuation">;</span>    <span class="token comment" spellcheck="true"> // Start large
</span>    Animated<span class="token punctuation">.</span><span class="token function">spring<span class="token punctuation">(</span></span>                         <span class="token comment" spellcheck="true"> // Base: spring, decay, timing
</span>      <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>bounceValue<span class="token punctuation">,</span>                <span class="token comment" spellcheck="true"> // Animate `bounceValue`
</span>      <span class="token punctuation">{</span>
        toValue<span class="token punctuation">:</span> <span class="token number">0.8</span><span class="token punctuation">,</span>                        <span class="token comment" spellcheck="true"> // Animate to smaller size
</span>        friction<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>                         <span class="token comment" spellcheck="true"> // Bouncier spring
</span>      <span class="token punctuation">}</span>
    <span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">start<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>                               <span class="token comment" spellcheck="true"> // Start the animation
</span>  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p><code>bounceValue</code> is initialized as part of <code>state</code> in the constructor, and mapped
to the scale transform on the image.  Behind the scenes, the numeric value is
extracted and used to set scale.  When the component mounts, the scale is set to
1.5 and then a spring animation is started on <code>bounceValue</code> which will update
all of its dependent mappings on each frame as the spring animates (in this
case, just the scale). This is done in an optimized way that is faster than
calling <code>setState</code> and re-rendering.  Because the entire configuration is
declarative, we will be able to implement further optimizations that serialize
the configuration and runs the animation on a high-priority thread.</p><h4><a class="anchor" name="core-api"></a>Core API <a class="hash-link" href="docs/animations.html#core-api">#</a></h4><p>Most everything you need hangs directly off the <code>Animated</code> module.  This
includes two value types, <code>Value</code> for single values and <code>ValueXY</code> for vectors,
three animation types, <code>spring</code>, <code>decay</code>, and <code>timing</code>, and three component
types, <code>View</code>, <code>Text</code>, and <code>Image</code>.  You can make any other component animated with
<code>Animated.createAnimatedComponent</code>.</p><p>The three animation types can be used to create almost any animation curve you
want because each can be customized:</p><ul><li><code>spring</code>: Simple single-spring physics model that matches <a href="https://facebook.github.io/origami/" target="_blank">Origami</a>.<ul><li><code>friction</code>: Controls "bounciness"/overshoot.  Default 7.</li><li><code>tension</code>: Controls speed.  Default 40.</li></ul></li><li><code>decay</code>: Starts with an initial velocity and gradually slows to a stop.<ul><li><code>velocity</code>: Initial velocity.  Required.</li><li><code>deceleration</code>: Rate of decay.  Default 0.997.</li></ul></li><li><code>timing</code>: Maps time range to easing value.<ul><li><code>duration</code>: Length of animation (milliseconds).  Default 500.</li><li><code>easing</code>: Easing function to define curve.  See <code>Easing</code> module for several
predefined functions.  iOS default is <code>Easing.inOut(Easing.ease)</code>.</li><li><code>delay</code>: Start the animation after delay (milliseconds).  Default 0.</li></ul></li></ul><p>Animations are started by calling <code>start</code>.  <code>start</code> takes a completion callback
that will be called when the animation is done.  If the animation is done
because it finished running normally, the completion callback will be invoked
with <code>{finished: true}</code>, but if the animation is done because <code>stop</code> was called
on it before it could finish (e.g. because it was interrupted by a gesture or
another animation), then it will receive <code>{finished: false}</code>.</p><h4><a class="anchor" name="composing-animations"></a>Composing Animations <a class="hash-link" href="docs/animations.html#composing-animations">#</a></h4><p>Animations can also be composed with <code>parallel</code>, <code>sequence</code>, <code>stagger</code>, and
<code>delay</code>, each of which simply take an array of animations to execute and
automatically calls start/stop as appropriate.  For example:</p><div class="prism language-javascript">Animated<span class="token punctuation">.</span><span class="token function">sequence<span class="token punctuation">(</span></span><span class="token punctuation">[</span>           <span class="token comment" spellcheck="true"> // spring to start and twirl after decay finishes
</span>  Animated<span class="token punctuation">.</span><span class="token function">decay<span class="token punctuation">(</span></span>position<span class="token punctuation">,</span> <span class="token punctuation">{</span>  <span class="token comment" spellcheck="true"> // coast to a stop
</span>    velocity<span class="token punctuation">:</span> <span class="token punctuation">{</span>x<span class="token punctuation">:</span> gestureState<span class="token punctuation">.</span>vx<span class="token punctuation">,</span> y<span class="token punctuation">:</span> gestureState<span class="token punctuation">.</span>vy<span class="token punctuation">}</span><span class="token punctuation">,</span><span class="token comment" spellcheck="true"> // velocity from gesture release
</span>    deceleration<span class="token punctuation">:</span> <span class="token number">0.997</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  Animated<span class="token punctuation">.</span><span class="token function">parallel<span class="token punctuation">(</span></span><span class="token punctuation">[</span>         <span class="token comment" spellcheck="true"> // after decay, in parallel:
</span>    Animated<span class="token punctuation">.</span><span class="token function">spring<span class="token punctuation">(</span></span>position<span class="token punctuation">,</span> <span class="token punctuation">{</span>
      toValue<span class="token punctuation">:</span> <span class="token punctuation">{</span>x<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span> y<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">}</span>   <span class="token comment" spellcheck="true"> // return to start
</span>    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    Animated<span class="token punctuation">.</span><span class="token function">timing<span class="token punctuation">(</span></span>twirl<span class="token punctuation">,</span> <span class="token punctuation">{</span>  <span class="token comment" spellcheck="true"> // and twirl
</span>      toValue<span class="token punctuation">:</span> <span class="token number">360</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">start<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>                   <span class="token comment" spellcheck="true"> // start the sequence group</span></div><p>By default, if one animation is stopped or interrupted, then all other
animations in the group are also stopped.  Parallel has a <code>stopTogether</code> option
that can be set to <code>false</code> to disable this.</p><h4><a class="anchor" name="interpolation"></a>Interpolation <a class="hash-link" href="docs/animations.html#interpolation">#</a></h4><p>Another powerful part of the <code>Animated</code> API is the <code>interpolate</code> function.  It
allows input ranges to map to different output ranges.  For example, a simple
mapping to convert a 0-1 range to a 0-100 range would be</p><div class="prism language-javascript">value<span class="token punctuation">.</span><span class="token function">interpolate<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  inputRange<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
  outputRange<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">,</span> <span class="token number">100</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p><code>interpolate</code> supports multiple range segments as well, which is handy for
defining dead zones and other handy tricks.  For example, to get an negation
relationship at -300 that goes to 0 at -100, then back up to 1 at 0, and then
back down to zero at 100 followed by a dead-zone that remains at 0 for
everything beyond that, you could do:</p><div class="prism language-javascript">value<span class="token punctuation">.</span><span class="token function">interpolate<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  inputRange<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token operator">-</span><span class="token number">300</span><span class="token punctuation">,</span> <span class="token operator">-</span><span class="token number">100</span><span class="token punctuation">,</span> <span class="token number">0</span><span class="token punctuation">,</span> <span class="token number">100</span><span class="token punctuation">,</span> <span class="token number">101</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
  outputRange<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token number">300</span><span class="token punctuation">,</span>    <span class="token number">0</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">,</span>   <span class="token number">0</span><span class="token punctuation">,</span>   <span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>Which would map like so:</p><table><thead><tr><th>Input</th><th>Output</th></tr></thead><thead><tr><td>  -400</td><td>450</td></tr><tr><td>  -300</td><td>300</td></tr><tr><td>  -200</td><td>150</td></tr><tr><td>  -100</td><td>0</td></tr><tr><td>   -50</td><td>0.5</td></tr><tr><td>     0</td><td>1</td></tr><tr><td>    50</td><td>0.5</td></tr><tr><td>   100</td><td>0</td></tr><tr><td>   101</td><td>0</td></tr><tr><td>   200</td><td>0</td></tr></thead></table><p><code>interpolation</code> also supports arbitrary easing functions, many of which are
already implemented in the
<a href="https://github.com/facebook/react-native/blob/master/Libraries/Animation/Animated/Easing.js" target="_blank"><code>Easing</code></a>
class including quadratic, exponential, and bezier curves as well as functions
like step and bounce. <code>interpolation</code> also has configurable behavior for
extrapolating the <code>outputRange</code>. You can set the extrapolation by setting the <code>extrapolate</code>,
<code>extrapolateLeft</code> or <code>extrapolateRight</code> options. The default value is
<code>extend</code> but you can use <code>clamp</code> to prevent the output value from exceeding
<code>outputRange</code>.</p><h4><a class="anchor" name="tracking-dynamic-values"></a>Tracking Dynamic Values <a class="hash-link" href="docs/animations.html#tracking-dynamic-values">#</a></h4><p>Animated values can also track other values.  Just set the <code>toValue</code> of an
animation to another animated value instead of a plain number, for example with
spring physics for an interaction like "Chat Heads", or via <code>timing</code> with
<code>duration: 0</code> for rigid/instant tracking.  They can also be composed with
interpolations:</p><div class="prism language-javascript">Animated<span class="token punctuation">.</span><span class="token function">spring<span class="token punctuation">(</span></span>follower<span class="token punctuation">,</span> <span class="token punctuation">{</span>toValue<span class="token punctuation">:</span> leader<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">start<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
Animated<span class="token punctuation">.</span><span class="token function">timing<span class="token punctuation">(</span></span>opacity<span class="token punctuation">,</span> <span class="token punctuation">{</span>
  toValue<span class="token punctuation">:</span> pan<span class="token punctuation">.</span>x<span class="token punctuation">.</span><span class="token function">interpolate<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
    inputRange<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">,</span> <span class="token number">300</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
    outputRange<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">start<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p><code>ValueXY</code> is a handy way to deal with 2D interactions, such as panning/dragging.
It is a simple wrapper that basically just contains two <code>Animated.Value</code>
instances and some helper functions that call through to them, making <code>ValueXY</code>
a drop-in replacement for <code>Value</code> in many cases.  For example, in the code
snippet above, <code>leader</code> and <code>follower</code> could both be of type <code>ValueXY</code> and the x
and y values will both track as you would expect.</p><h4><a class="anchor" name="input-events"></a>Input Events <a class="hash-link" href="docs/animations.html#input-events">#</a></h4><p><code>Animated.event</code> is the input side of the Animated API, allowing gestures and
other events to map directly to animated values.  This is done with a structured
map syntax so that values can be extracted from complex event objects.  The
first level is an array to allow mapping across multiple args, and that array
contains nested objects.  In the example, you can see that <code>scrollX</code> maps to
<code>event.nativeEvent.contentOffset.x</code> (<code>event</code> is normally the first arg to the
handler), and <code>pan.x</code> and <code>pan.y</code> map to <code>gestureState.dx</code> and <code>gestureState.dy</code>,
respectively (<code>gestureState</code> is the second arg passed to the <code>PanResponder</code> handler).</p><div class="prism language-javascript">onScroll<span class="token operator">=</span><span class="token punctuation">{</span>Animated<span class="token punctuation">.</span><span class="token function">event<span class="token punctuation">(</span></span>
 <span class="token comment" spellcheck="true"> // scrollX = e.nativeEvent.contentOffset.x
</span>  <span class="token punctuation">[</span><span class="token punctuation">{</span>nativeEvent<span class="token punctuation">:</span> <span class="token punctuation">{</span>contentOffset<span class="token punctuation">:</span> <span class="token punctuation">{</span>x<span class="token punctuation">:</span> scrollX<span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token punctuation">]</span>
<span class="token punctuation">)</span><span class="token punctuation">}</span>
onPanResponderMove<span class="token operator">=</span><span class="token punctuation">{</span>Animated<span class="token punctuation">.</span><span class="token function">event<span class="token punctuation">(</span></span><span class="token punctuation">[</span>
  <span class="token keyword">null</span><span class="token punctuation">,</span>                                         <span class="token comment" spellcheck="true"> // ignore the native event
</span> <span class="token comment" spellcheck="true"> // extract dx and dy from gestureState
</span> <span class="token comment" spellcheck="true"> // like 'pan.x = gestureState.dx, pan.y = gestureState.dy'
</span>  <span class="token punctuation">{</span>dx<span class="token punctuation">:</span> pan<span class="token punctuation">.</span>x<span class="token punctuation">,</span> dy<span class="token punctuation">:</span> pan<span class="token punctuation">.</span>y<span class="token punctuation">}</span>
<span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><h4><a class="anchor" name="responding-to-the-current-animation-value"></a>Responding to the Current Animation Value <a class="hash-link" href="docs/animations.html#responding-to-the-current-animation-value">#</a></h4><p>You may notice that there is no obvious way to read the current value while
animating - this is because the value may only be known in the native runtime
due to optimizations.  If you need to run JavaScript in response to the current
value, there are two approaches:</p><ul><li><code>spring.stopAnimation(callback)</code> will stop the animation and invoke <code>callback</code>
with the final value - this is useful when making gesture transitions.</li><li><code>spring.addListener(callback)</code> will invoke <code>callback</code> asynchronously while the
animation is running, providing a recent value.  This is useful for triggering
state changes, for example snapping a bobble to a new option as the user drags
it closer, because these larger state changes are less sensitive to a few frames
of lag compared to continuous gestures like panning which need to run at 60fps.</li></ul><h4><a class="anchor" name="future-work"></a>Future Work <a class="hash-link" href="docs/animations.html#future-work">#</a></h4><p>As previously mentioned, we're planning on optimizing Animated under the hood to
make it even more performant.  We would also like to experiment with more
declarative and higher level gestures and triggers, such as horizontal vs.
vertical panning.</p><p>The above API gives a powerful tool for expressing all sorts of animations in a
concise, robust, and performant way.  Check out more example code in
<a href="https://github.com/facebook/react-native/tree/master/Examples/UIExplorer/AnimatedGratuitousApp" target="_blank">UIExplorer/AnimationExample</a>.  Of course there may still be times where <code>Animated</code>
doesn't support what you need, and the following sections cover other animation
systems.</p><h3><a class="anchor" name="layoutanimation"></a>LayoutAnimation <a class="hash-link" href="docs/animations.html#layoutanimation">#</a></h3><p><code>LayoutAnimation</code> allows you to globally configure <code>create</code> and <code>update</code>
animations that will be used for all views in the next render/layout cycle.
This is useful for doing flexbox layout updates without bothering to measure or
calculate specific properties in order to animate them directly, and is
especially useful when layout changes may affect ancestors, for example a "see
more" expansion that also increases the size of the parent and pushes down the
row below which would otherwise require explicit coordination between the
components in order to animate them all in sync.</p><p>Note that although <code>LayoutAnimation</code> is very powerful and can be quite useful,
it provides much less control than <code>Animated</code> and other animation libraries, so
you may need to use another approach if you can't get <code>LayoutAnimation</code> to do
what you want.</p><p><img src="img/LayoutAnimationExample.gif" alt=""></p><div class="prism language-javascript"><span class="token keyword">var</span> App <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">componentWillMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // Animate creation
</span>    LayoutAnimation<span class="token punctuation">.</span><span class="token function">spring<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span> w<span class="token punctuation">:</span> <span class="token number">100</span><span class="token punctuation">,</span> h<span class="token punctuation">:</span> <span class="token number">100</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_onPress<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // Animate the update
</span>    LayoutAnimation<span class="token punctuation">.</span><span class="token function">spring<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>w<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>w <span class="token operator">+</span> <span class="token number">15</span><span class="token punctuation">,</span> h<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>h <span class="token operator">+</span> <span class="token number">15</span><span class="token punctuation">}</span><span class="token punctuation">)</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>box<span class="token punctuation">,</span> <span class="token punctuation">{</span>width<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>w<span class="token punctuation">,</span> height<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>h<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TouchableOpacity onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onPress<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>buttonText<span class="token punctuation">}</span><span class="token operator">&gt;</span>Press me<span class="token operator">!</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableOpacity<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p><a href="https://rnplay.org/apps/uaQrGQ" target="_blank">Run this example</a></p><p>This example uses a preset value, you can customize the animations as
you need, see <a href="https://github.com/facebook/react-native/blob/master/Libraries/LayoutAnimation/LayoutAnimation.js" target="_blank">LayoutAnimation.js</a>
for more information.</p><h3><a class="anchor" name="requestanimationframe"></a>requestAnimationFrame <a class="hash-link" href="docs/animations.html#requestanimationframe">#</a></h3><p><code>requestAnimationFrame</code> is a polyfill from the browser that you might be
familiar with. It accepts a function as its only argument and calls that
function before the next repaint. It is an essential building block for
animations that underlies all of the JavaScript-based animation APIs.  In
general, you shouldn't need to call this yourself - the animation APIs will
manage frame updates for you.</p><h3><a class="anchor" name="react-tween-state-not-recommended-use-animated-animated-instead"></a>react-tween-state (Not recommended - use <a href="#animated" target="">Animated</a> instead) <a class="hash-link" href="docs/animations.html#react-tween-state-not-recommended-use-animated-animated-instead">#</a></h3><p><a href="https://github.com/chenglou/react-tween-state" target="_blank">react-tween-state</a> is a
minimal library that does exactly what its name suggests: it <em>tweens</em> a
value in a component's state, starting at a <strong>from</strong> value and ending at
a <strong>to</strong> value. This means that it generates the values in between those
two values, and it sets the state on every <code>requestAnimationFrame</code> with
the intermediary value.</p><blockquote><p>Tweening definition from <a href="https://en.wikipedia.org/wiki/Inbetweening" target="_blank">Wikipedia</a></p><p>"... tweening is the process of generating intermediate frames between two
images to give the appearance that the first image evolves smoothly
into the second image. [Tweens] are the drawings between the key
frames which help to create the illusion of motion."</p></blockquote><p>The most obvious way to animate from one value to another is linearly:
you subtract the end value from the start value and divide the result by
the number of frames over which the animation occurs, and then add that
value to the current value on each frame until the end value is reached.
Linear easing often looks awkward and unnatural, so react-tween-state
provides a selection of popular <a href="http://easings.net/" target="_blank">easing functions</a>
that can be applied to make your animations more pleasing.</p><p>This library does not ship with React Native - in order to use it on
your project, you will need to install it with <code>npm i react-tween-state
--save</code> from your project directory.</p><div class="prism language-javascript">import tweenState from <span class="token string">'react-tween-state'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> App <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  mixins<span class="token punctuation">:</span> <span class="token punctuation">[</span>tweenState<span class="token punctuation">.</span>Mixin<span class="token punctuation">]</span><span class="token punctuation">,</span>

  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span> opacity<span class="token punctuation">:</span> <span class="token number">1</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_animateOpacity<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">tweenState<span class="token punctuation">(</span></span><span class="token string">'opacity'</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
      easing<span class="token punctuation">:</span> tweenState<span class="token punctuation">.</span>easingTypes<span class="token punctuation">.</span>easeOutQuint<span class="token punctuation">,</span>
      duration<span class="token punctuation">:</span> <span class="token number">1000</span><span class="token punctuation">,</span>
      endValue<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>opacity <span class="token operator">===</span> <span class="token number">0.2</span> <span class="token operator">?</span> <span class="token number">1</span> <span class="token punctuation">:</span> <span class="token number">0.2</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span> justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span> alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;TouchableWithoutFeedback onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_animateOpacity<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View ref<span class="token operator">=</span><span class="token punctuation">{</span>component <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_box <span class="token operator">=</span> component<span class="token punctuation">}</span>
                style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>width<span class="token punctuation">:</span> <span class="token number">200</span><span class="token punctuation">,</span> height<span class="token punctuation">:</span> <span class="token number">200</span><span class="token punctuation">,</span> backgroundColor<span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">,</span>
                        opacity<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">getTweeningValue<span class="token punctuation">(</span></span><span class="token string">'opacity'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableWithoutFeedback<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p><a href="https://rnplay.org/apps/4FUQ-A" target="_blank">Run this example</a></p><p><img src="img/TweenState.gif" alt=""></p><p>Here we animated the opacity, but as you might guess, we can animate any
numeric value. Read more about react-tween-state in its
<a href="https://github.com/chenglou/react-tween-state" target="_blank">README</a>.</p><h3><a class="anchor" name="rebound-not-recommended-use-animated-docs-animation-html-instead"></a>Rebound (Not recommended - use <a href="docs/animation.html" target="_blank">Animated</a> instead) <a class="hash-link" href="docs/animations.html#rebound-not-recommended-use-animated-docs-animation-html-instead">#</a></h3><p><a href="https://github.com/facebook/rebound-js" target="_blank">Rebound.js</a> is a JavaScript port of
<a href="https://github.com/facebook/rebound" target="_blank">Rebound for Android</a>. It is
similar in concept to react-tween-state: you have an initial value and
set an end value, then Rebound generates intermediate values that you can
use for your animation. Rebound is modeled after spring physics; we
don't provide a duration when animating with springs, it is
calculated for us depending on the spring tension, friction, current
value and end value.  Rebound <a href="https://github.com/facebook/react-native/search?utf8=%E2%9C%93&amp;q=rebound" target="_blank">is used
internally</a>
by React Native on <code>Navigator</code> and <code>WarningBox</code>.</p><p><img src="img/ReboundImage.gif" alt=""></p><p>Notice that Rebound animations can be interrupted - if you release in
the middle of a press, it will animate back from the current state to
the original value.</p><div class="prism language-javascript">import rebound from <span class="token string">'rebound'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> App <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
 <span class="token comment" spellcheck="true"> // First we initialize the spring and add a listener, which calls
</span> <span class="token comment" spellcheck="true"> // setState whenever it updates
</span>  <span class="token function">componentWillMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // Initialize the spring that will drive animations
</span>    <span class="token keyword">this</span><span class="token punctuation">.</span>springSystem <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">rebound<span class="token punctuation">.</span>SpringSystem</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_scrollSpring <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>springSystem<span class="token punctuation">.</span><span class="token function">createSpring<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">var</span> springConfig <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_scrollSpring<span class="token punctuation">.</span><span class="token function">getSpringConfig<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    springConfig<span class="token punctuation">.</span>tension <span class="token operator">=</span> <span class="token number">230</span><span class="token punctuation">;</span>
    springConfig<span class="token punctuation">.</span>friction <span class="token operator">=</span> <span class="token number">10</span><span class="token punctuation">;</span>

    <span class="token keyword">this</span><span class="token punctuation">.</span>_scrollSpring<span class="token punctuation">.</span><span class="token function">addListener<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      onSpringUpdate<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>scale<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_scrollSpring<span class="token punctuation">.</span><span class="token function">getCurrentValue<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

   <span class="token comment" spellcheck="true"> // Initialize the spring value at 1
</span>    <span class="token keyword">this</span><span class="token punctuation">.</span>_scrollSpring<span class="token punctuation">.</span><span class="token function">setCurrentValue<span class="token punctuation">(</span></span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_onPressIn<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_scrollSpring<span class="token punctuation">.</span><span class="token function">setEndValue<span class="token punctuation">(</span></span><span class="token number">0.5</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_onPressOut<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_scrollSpring<span class="token punctuation">.</span><span class="token function">setEndValue<span class="token punctuation">(</span></span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> imageStyle <span class="token operator">=</span> <span class="token punctuation">{</span>
      width<span class="token punctuation">:</span> <span class="token number">250</span><span class="token punctuation">,</span>
      height<span class="token punctuation">:</span> <span class="token number">200</span><span class="token punctuation">,</span>
      transform<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token punctuation">{</span>scaleX<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>scale<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>scaleY<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>scale<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>

    <span class="token keyword">var</span> imageUri <span class="token operator">=</span> <span class="token string">"img/ReboundExample.png"</span><span class="token punctuation">;</span>

    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;TouchableWithoutFeedback onPressIn<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onPressIn<span class="token punctuation">}</span>
                                  onPressOut<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onPressOut<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Image source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> imageUri<span class="token punctuation">}</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>imageStyle<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableWithoutFeedback<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p><a href="https://rnplay.org/apps/NNI5eA" target="_blank">Run this example</a></p><p>You can also clamp the spring values so that they don't overshoot and
oscillate around the end value. In the above example, we would add
<code>this._scrollSpring.setOvershootClampingEnabled(true)</code> to change this.
See the below gif for an example of where in your interface you might
use this.</p><p><img src="img/Rebound.gif" alt=""> Screenshot from
<a href="https://github.com/brentvatne/react-native-scrollable-tab-view" target="_blank">react-native-scrollable-tab-view</a>.
You can run a similar example <a href="https://rnplay.org/apps/qHU_5w" target="_blank">here</a>.</p><h4><a class="anchor" name="a-sidenote-about-setnativeprops"></a>A sidenote about setNativeProps <a class="hash-link" href="docs/animations.html#a-sidenote-about-setnativeprops">#</a></h4><p>As mentioned <a href="docs/direct-manipulation.html" target="_blank">in the Direction Manipulation section</a>,
<code>setNativeProps</code> allows us to modify properties of native-backed
components (components that are actually backed by native views, unlike
composite components) directly, without having to <code>setState</code> and
re-render the component hierarchy.</p><p>We could use this in the Rebound example to update the scale - this
might be helpful if the component that we are updating is deeply nested
and hasn't been optimized with <code>shouldComponentUpdate</code>.</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// Back inside of the App component, replace the scrollSpring listener
</span><span class="token comment" spellcheck="true">// in componentWillMount with this:
</span><span class="token keyword">this</span><span class="token punctuation">.</span>_scrollSpring<span class="token punctuation">.</span><span class="token function">addListener<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  onSpringUpdate<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>_photo<span class="token punctuation">)</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> <span class="token punctuation">}</span>
    <span class="token keyword">var</span> v <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_scrollSpring<span class="token punctuation">.</span><span class="token function">getCurrentValue<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">var</span> newProps <span class="token operator">=</span> <span class="token punctuation">{</span>style<span class="token punctuation">:</span> <span class="token punctuation">{</span>transform<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token punctuation">{</span>scaleX<span class="token punctuation">:</span> v<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>scaleY<span class="token punctuation">:</span> v<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_photo<span class="token punctuation">.</span><span class="token function">setNativeProps<span class="token punctuation">(</span></span>newProps<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment" spellcheck="true">
// Lastly, we update the render function to no longer pass in the
</span><span class="token comment" spellcheck="true">// transform via style (avoid clashes when re-rendering) and to set the
</span><span class="token comment" spellcheck="true">// photo ref
</span>render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
      &lt;TouchableWithoutFeedback onPressIn<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onPressIn<span class="token punctuation">}</span> onPressOut<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onPressOut<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Image ref<span class="token operator">=</span><span class="token punctuation">{</span>component <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_photo <span class="token operator">=</span> component<span class="token punctuation">}</span>
               source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> <span class="token string">"img/ReboundExample.png"</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
               style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>width<span class="token punctuation">:</span> <span class="token number">250</span><span class="token punctuation">,</span> height<span class="token punctuation">:</span> <span class="token number">200</span><span class="token punctuation">}</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>TouchableWithoutFeedback<span class="token operator">&gt;</span>
    &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><p><a href="https://rnplay.org/apps/fUqjAg" target="_blank">Run this example</a></p><p>It would not make sense to use <code>setNativeProps</code> with react-tween-state
because the updated tween values are set on the state automatically by
the library - Rebound on the other hand gives us an updated value for
each frame with the <code>onSpringUpdate</code> function.</p><p>If you find your animations with dropping frames (performing below 60
frames per second), look into using <code>setNativeProps</code> or
<code>shouldComponentUpdate</code> to optimize them. You may also want to defer any
computationally intensive work until after animations are complete,
using the
<a href="docs/interactionmanager.html" target="_blank">InteractionManager</a>. You
can monitor the frame rate by using the In-App Developer Menu "FPS
Monitor" tool.</p><h3><a class="anchor" name="navigator-scene-transitions"></a>Navigator Scene Transitions <a class="hash-link" href="docs/animations.html#navigator-scene-transitions">#</a></h3><p>As mentioned in the <a href="docs/navigator-comparison.html#content" target="_blank">Navigator
Comparison</a>,
<code>Navigator</code> is implemented in JavaScript and <code>NavigatorIOS</code> is a wrapper
around native functionality provided by <code>UINavigationController</code>, so
these scene transitions apply only to <code>Navigator</code>. In order to re-create
the various animations provided by <code>UINavigationController</code> and also
make them customizable, React Native exposes a
<a href="https://github.com/facebook/react-native/blob/master/Libraries/CustomComponents/Navigator/NavigatorSceneConfigs.js" target="_blank">NavigatorSceneConfigs</a> API which is then handed over to the <a href="https://github.com/facebook/react-native/blob/master/Libraries/CustomComponents/Navigator/Navigator.js" target="_blank">Navigator</a> <code>configureScene</code> prop.</p><div class="prism language-javascript">import <span class="token punctuation">{</span> Dimensions <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> SCREEN_WIDTH <span class="token operator">=</span> Dimensions<span class="token punctuation">.</span><span class="token keyword">get</span><span class="token punctuation">(</span><span class="token string">'window'</span><span class="token punctuation">)</span><span class="token punctuation">.</span>width<span class="token punctuation">;</span>
<span class="token keyword">var</span> BaseConfig <span class="token operator">=</span> Navigator<span class="token punctuation">.</span>SceneConfigs<span class="token punctuation">.</span>FloatFromRight<span class="token punctuation">;</span>

<span class="token keyword">var</span> CustomLeftToRightGesture <span class="token operator">=</span> Object<span class="token punctuation">.</span><span class="token function">assign<span class="token punctuation">(</span></span><span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">,</span> BaseConfig<span class="token punctuation">.</span>gestures<span class="token punctuation">.</span>pop<span class="token punctuation">,</span> <span class="token punctuation">{</span>
 <span class="token comment" spellcheck="true"> // Make it snap back really quickly after canceling pop
</span>  snapVelocity<span class="token punctuation">:</span> <span class="token number">8</span><span class="token punctuation">,</span>

 <span class="token comment" spellcheck="true"> // Make it so we can drag anywhere on the screen
</span>  edgeHitWidth<span class="token punctuation">:</span> SCREEN_WIDTH<span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> CustomSceneConfig <span class="token operator">=</span> Object<span class="token punctuation">.</span><span class="token function">assign<span class="token punctuation">(</span></span><span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">,</span> BaseConfig<span class="token punctuation">,</span> <span class="token punctuation">{</span>
 <span class="token comment" spellcheck="true"> // A very tightly wound spring will make this transition fast
</span>  springTension<span class="token punctuation">:</span> <span class="token number">100</span><span class="token punctuation">,</span>
  springFriction<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>

 <span class="token comment" spellcheck="true"> // Use our custom gesture defined above
</span>  gestures<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    pop<span class="token punctuation">:</span> CustomLeftToRightGesture<span class="token punctuation">,</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p><a href="https://rnplay.org/apps/HPy6UA" target="_blank">Run this example</a></p><p>For further information about customizing scene transitions, <a href="https://github.com/facebook/react-native/blob/master/Libraries/CustomComponents/Navigator/NavigatorSceneConfigs.js" target="_blank">read the
source</a>.</p></div><div class="docs-prevnext"><a class="docs-next" href="docs/accessibility.html#content">Next →</a></div>