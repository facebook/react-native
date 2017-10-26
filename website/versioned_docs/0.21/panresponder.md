---
id: panresponder
title: panresponder
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="panresponder"></a>PanResponder <a class="hash-link" href="undefined#panresponder">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/vendor/react/browser/eventPlugins/PanResponder.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p><code>PanResponder</code> reconciles several touches into a single gesture. It makes
single-touch gestures resilient to extra touches, and can be used to
recognize simple multi-touch gestures.</p><p>It provides a predictable wrapper of the responder handlers provided by the
<a href="docs/gesture-responder-system.html" target="_blank">gesture responder system</a>.
For each handler, it provides a new <code>gestureState</code> object alongside the
native event object:</p><div class="prism language-javascript">onPanResponderMove<span class="token punctuation">:</span> <span class="token punctuation">(</span>event<span class="token punctuation">,</span> gestureState<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span><span class="token punctuation">}</span></div><p>A native event is a synthetic touch event with the following form:</p><ul><li><code>nativeEvent</code><ul><li><code>changedTouches</code> - Array of all touch events that have changed since the last event</li><li><code>identifier</code> - The ID of the touch</li><li><code>locationX</code> - The X position of the touch, relative to the element</li><li><code>locationY</code> - The Y position of the touch, relative to the element</li><li><code>pageX</code> - The X position of the touch, relative to the root element</li><li><code>pageY</code> - The Y position of the touch, relative to the root element</li><li><code>target</code> - The node id of the element receiving the touch event</li><li><code>timestamp</code> - A time identifier for the touch, useful for velocity calculation</li><li><code>touches</code> - Array of all current touches on the screen</li></ul></li></ul><p>A <code>gestureState</code> object has the following:</p><ul><li><code>stateID</code> - ID of the gestureState- persisted as long as there at least
 one touch on screen</li><li><code>moveX</code> - the latest screen coordinates of the recently-moved touch</li><li><code>moveY</code> - the latest screen coordinates of the recently-moved touch</li><li><code>x0</code> - the screen coordinates of the responder grant</li><li><code>y0</code> - the screen coordinates of the responder grant</li><li><code>dx</code> - accumulated distance of the gesture since the touch started</li><li><code>dy</code> - accumulated distance of the gesture since the touch started</li><li><code>vx</code> - current velocity of the gesture</li><li><code>vy</code> - current velocity of the gesture</li><li><code>numberActiveTouches</code> - Number of touches currently on screen</li></ul><h3><a class="anchor" name="basic-usage"></a>Basic Usage <a class="hash-link" href="undefined#basic-usage">#</a></h3><div class="prism language-javascript">  componentWillMount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_panResponder <span class="token operator">=</span> PanResponder<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
     <span class="token comment" spellcheck="true"> // Ask to be the responder:
</span>      onStartShouldSetPanResponder<span class="token punctuation">:</span> <span class="token punctuation">(</span>evt<span class="token punctuation">,</span> gestureState<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
      onStartShouldSetPanResponderCapture<span class="token punctuation">:</span> <span class="token punctuation">(</span>evt<span class="token punctuation">,</span> gestureState<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
      onMoveShouldSetPanResponder<span class="token punctuation">:</span> <span class="token punctuation">(</span>evt<span class="token punctuation">,</span> gestureState<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
      onMoveShouldSetPanResponderCapture<span class="token punctuation">:</span> <span class="token punctuation">(</span>evt<span class="token punctuation">,</span> gestureState<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token boolean">true</span><span class="token punctuation">,</span>

      onPanResponderGrant<span class="token punctuation">:</span> <span class="token punctuation">(</span>evt<span class="token punctuation">,</span> gestureState<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
       <span class="token comment" spellcheck="true"> // The guesture has started. Show visual feedback so the user knows
</span>       <span class="token comment" spellcheck="true"> // what is happening!
</span>
       <span class="token comment" spellcheck="true"> // gestureState.{x,y}0 will be set to zero now
</span>      <span class="token punctuation">}</span><span class="token punctuation">,</span>
      onPanResponderMove<span class="token punctuation">:</span> <span class="token punctuation">(</span>evt<span class="token punctuation">,</span> gestureState<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
       <span class="token comment" spellcheck="true"> // The most recent move distance is gestureState.move{X,Y}
</span>
       <span class="token comment" spellcheck="true"> // The accumulated gesture distance since becoming responder is
</span>       <span class="token comment" spellcheck="true"> // gestureState.d{x,y}
</span>      <span class="token punctuation">}</span><span class="token punctuation">,</span>
      onPanResponderTerminationRequest<span class="token punctuation">:</span> <span class="token punctuation">(</span>evt<span class="token punctuation">,</span> gestureState<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
      onPanResponderRelease<span class="token punctuation">:</span> <span class="token punctuation">(</span>evt<span class="token punctuation">,</span> gestureState<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
       <span class="token comment" spellcheck="true"> // The user has released all touches while this view is the
</span>       <span class="token comment" spellcheck="true"> // responder. This typically means a gesture has succeeded
</span>      <span class="token punctuation">}</span><span class="token punctuation">,</span>
      onPanResponderTerminate<span class="token punctuation">:</span> <span class="token punctuation">(</span>evt<span class="token punctuation">,</span> gestureState<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
       <span class="token comment" spellcheck="true"> // Another component has become the responder, so this gesture
</span>       <span class="token comment" spellcheck="true"> // should be cancelled
</span>      <span class="token punctuation">}</span><span class="token punctuation">,</span>
      onShouldBlockNativeResponder<span class="token punctuation">:</span> <span class="token punctuation">(</span>evt<span class="token punctuation">,</span> gestureState<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
       <span class="token comment" spellcheck="true"> // Returns whether this component should block native components from becoming the JS
</span>       <span class="token comment" spellcheck="true"> // responder. Returns true by default. Is currently only supported on android.
</span>        <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View <span class="token punctuation">{</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token keyword">this</span><span class="token punctuation">.</span>_panResponder<span class="token punctuation">.</span>panHandlers<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span></div><h3><a class="anchor" name="working-example"></a>Working Example <a class="hash-link" href="undefined#working-example">#</a></h3><p>To see it in action, try the
<a href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/PanResponderExample.js" target="_blank">PanResponder example in UIExplorer</a></p></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="undefined#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="create"></a><span class="propType">static </span>create<span class="propType">(config: object)</span> <a class="hash-link" href="undefined#create">#</a></h4><div><p>@param {object} config Enhanced versions of all of the responder callbacks
that provide not only the typical <code>ResponderSyntheticEvent</code>, but also the
<code>PanResponder</code> gesture state.  Simply replace the word <code>Responder</code> with
<code>PanResponder</code> in each of the typical <code>onResponder*</code> callbacks. For
example, the <code>config</code> object would look like:</p><ul><li><code>onMoveShouldSetPanResponder: (e, gestureState) =&gt; {...}</code></li><li><code>onMoveShouldSetPanResponderCapture: (e, gestureState) =&gt; {...}</code></li><li><code>onStartShouldSetPanResponder: (e, gestureState) =&gt; {...}</code></li><li><code>onStartShouldSetPanResponderCapture: (e, gestureState) =&gt; {...}</code></li><li><code>onPanResponderReject: (e, gestureState) =&gt; {...}</code></li><li><code>onPanResponderGrant: (e, gestureState) =&gt; {...}</code></li><li><code>onPanResponderStart: (e, gestureState) =&gt; {...}</code></li><li><code>onPanResponderEnd: (e, gestureState) =&gt; {...}</code></li><li><code>onPanResponderRelease: (e, gestureState) =&gt; {...}</code></li><li><code>onPanResponderMove: (e, gestureState) =&gt; {...}</code></li><li><code>onPanResponderTerminate: (e, gestureState) =&gt; {...}</code></li><li><code>onPanResponderTerminationRequest: (e, gestureState) =&gt; {...}</code></li><li><p><code>onShouldBlockNativeResponder: (e, gestureState) =&gt; {...}</code></p><p>In general, for events that have capture equivalents, we update the
gestureState once in the capture phase and can use it in the bubble phase
as well.</p><p>Be careful with onStartShould* callbacks. They only reflect updated
<code>gestureState</code> for start/end events that bubble/capture to the Node.
Once the node is the responder, you can rely on every start/end event
being processed by the gesture and <code>gestureState</code> being updated
accordingly. (numberActiveTouches) may not be totally accurate unless you
are the responder.</p></li></ul></div></div></div></span></div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="undefined#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/PanResponderExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  PanResponder<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  processColor<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>

<span class="token keyword">var</span> CIRCLE_SIZE <span class="token operator">=</span> <span class="token number">80</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> CIRCLE_COLOR <span class="token operator">=</span> <span class="token string">'blue'</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> CIRCLE_HIGHLIGHT_COLOR <span class="token operator">=</span> <span class="token string">'green'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> PanResponderExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>

  statics<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'PanResponder Sample'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Shows the use of PanResponder to provide basic gesture handling.'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _panResponder<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
  _previousLeft<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
  _previousTop<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
  _circleStyles<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
  circle<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token keyword">null</span> <span class="token punctuation">:</span> <span class="token operator">?</span><span class="token punctuation">{</span> <span class="token function">setNativeProps<span class="token punctuation">(</span></span>props<span class="token punctuation">:</span> Object<span class="token punctuation">)</span><span class="token punctuation">:</span> void <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">,</span>

  componentWillMount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_panResponder <span class="token operator">=</span> PanResponder<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      onStartShouldSetPanResponder<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_handleStartShouldSetPanResponder<span class="token punctuation">,</span>
      onMoveShouldSetPanResponder<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_handleMoveShouldSetPanResponder<span class="token punctuation">,</span>
      onPanResponderGrant<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_handlePanResponderGrant<span class="token punctuation">,</span>
      onPanResponderMove<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_handlePanResponderMove<span class="token punctuation">,</span>
      onPanResponderRelease<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_handlePanResponderEnd<span class="token punctuation">,</span>
      onPanResponderTerminate<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_handlePanResponderEnd<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_previousLeft <span class="token operator">=</span> <span class="token number">20</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_previousTop <span class="token operator">=</span> <span class="token number">84</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_circleStyles <span class="token operator">=</span> <span class="token punctuation">{</span>
      style<span class="token punctuation">:</span> <span class="token punctuation">{</span>
        left<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_previousLeft<span class="token punctuation">,</span>
        top<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_previousTop
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  componentDidMount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_updatePosition<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View
        style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;View
          ref<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>circle<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span>circle <span class="token operator">=</span> circle<span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>circle<span class="token punctuation">}</span>
          <span class="token punctuation">{</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token keyword">this</span><span class="token punctuation">.</span>_panResponder<span class="token punctuation">.</span>panHandlers<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _highlight<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    const circle <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>circle<span class="token punctuation">;</span>
    circle &amp;&amp; circle<span class="token punctuation">.</span><span class="token function">setNativeProps<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      style<span class="token punctuation">:</span> <span class="token punctuation">{</span>
        backgroundColor<span class="token punctuation">:</span> <span class="token function">processColor<span class="token punctuation">(</span></span>CIRCLE_HIGHLIGHT_COLOR<span class="token punctuation">)</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _unHighlight<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    const circle <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>circle<span class="token punctuation">;</span>
    circle &amp;&amp; circle<span class="token punctuation">.</span><span class="token function">setNativeProps<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      style<span class="token punctuation">:</span> <span class="token punctuation">{</span>
        backgroundColor<span class="token punctuation">:</span> <span class="token function">processColor<span class="token punctuation">(</span></span>CIRCLE_COLOR<span class="token punctuation">)</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _updatePosition<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>circle &amp;&amp; <span class="token keyword">this</span><span class="token punctuation">.</span>circle<span class="token punctuation">.</span><span class="token function">setNativeProps<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>_circleStyles<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _handleStartShouldSetPanResponder<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>e<span class="token punctuation">:</span> Object<span class="token punctuation">,</span> gestureState<span class="token punctuation">:</span> Object<span class="token punctuation">)</span><span class="token punctuation">:</span> boolean <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // Should we become active when the user presses down on the circle?
</span>    <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _handleMoveShouldSetPanResponder<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>e<span class="token punctuation">:</span> Object<span class="token punctuation">,</span> gestureState<span class="token punctuation">:</span> Object<span class="token punctuation">)</span><span class="token punctuation">:</span> boolean <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // Should we become active when the user moves a touch over the circle?
</span>    <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _handlePanResponderGrant<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>e<span class="token punctuation">:</span> Object<span class="token punctuation">,</span> gestureState<span class="token punctuation">:</span> Object<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_highlight<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  _handlePanResponderMove<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>e<span class="token punctuation">:</span> Object<span class="token punctuation">,</span> gestureState<span class="token punctuation">:</span> Object<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_circleStyles<span class="token punctuation">.</span>style<span class="token punctuation">.</span>left <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_previousLeft <span class="token operator">+</span> gestureState<span class="token punctuation">.</span>dx<span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_circleStyles<span class="token punctuation">.</span>style<span class="token punctuation">.</span>top <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_previousTop <span class="token operator">+</span> gestureState<span class="token punctuation">.</span>dy<span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_updatePosition<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  _handlePanResponderEnd<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>e<span class="token punctuation">:</span> Object<span class="token punctuation">,</span> gestureState<span class="token punctuation">:</span> Object<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_unHighlight<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_previousLeft <span class="token operator">+</span><span class="token operator">=</span> gestureState<span class="token punctuation">.</span>dx<span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_previousTop <span class="token operator">+</span><span class="token operator">=</span> gestureState<span class="token punctuation">.</span>dy<span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  circle<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> CIRCLE_SIZE<span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> CIRCLE_SIZE<span class="token punctuation">,</span>
    borderRadius<span class="token punctuation">:</span> CIRCLE_SIZE <span class="token operator">/</span> <span class="token number">2</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> CIRCLE_COLOR<span class="token punctuation">,</span>
    position<span class="token punctuation">:</span> <span class="token string">'absolute'</span><span class="token punctuation">,</span>
    left<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
    top<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  container<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    paddingTop<span class="token punctuation">:</span> <span class="token number">64</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

module<span class="token punctuation">.</span>exports <span class="token operator">=</span> PanResponderExample<span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="pixelratio.html#content">Next →</a></div>