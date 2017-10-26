---
id: direct-manipulation
title: direct-manipulation
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="direct-manipulation"></a>Direct Manipulation <a class="hash-link" href="docs/direct-manipulation.html#direct-manipulation">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.27-stable/docs/DirectManipulation.md">Edit on GitHub</a></td></tr></tbody></table><div><p>It is sometimes necessary to make changes directly to a component
without using state/props to trigger a re-render of the entire subtree.
When using React in the browser for example, you sometimes need to
directly modify a DOM node, and the same is true for views in mobile
apps. <code>setNativeProps</code> is the React Native equivalent to setting
properties directly on a DOM node.</p><blockquote><p>Use setNativeProps when frequent re-rendering creates a performance bottleneck</p><p>Direct manipulation will not be a tool that you reach for
frequently; you will typically only be using it for creating
continuous animations to avoid the overhead of rendering the component
hierarchy and reconciling many views. <code>setNativeProps</code> is imperative
and stores state in the native layer (DOM, UIView, etc.) and not
within your React components, which makes your code more difficult to
reason about. Before you use it, try to solve your problem with <code>setState</code>
and <a href="http://facebook.github.io/react/docs/advanced-performance.html#shouldcomponentupdate-in-action" target="_blank">shouldComponentUpdate</a>.</p></blockquote><h2><a class="anchor" name="setnativeprops-with-touchableopacity"></a>setNativeProps with TouchableOpacity <a class="hash-link" href="docs/direct-manipulation.html#setnativeprops-with-touchableopacity">#</a></h2><p><a href="https://github.com/facebook/react-native/blob/master/Libraries/Components/Touchable/TouchableOpacity.js" target="_blank">TouchableOpacity</a>
uses <code>setNativeProps</code> internally to update the opacity of its child
component:</p><div class="prism language-javascript">setOpacityTo<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>value<span class="token punctuation">)</span> <span class="token punctuation">{</span>
 <span class="token comment" spellcheck="true"> // Redacted: animation related code
</span>  <span class="token keyword">this</span><span class="token punctuation">.</span>refs<span class="token punctuation">[</span>CHILD_REF<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">setNativeProps<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
    opacity<span class="token punctuation">:</span> value
  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span></div><p>This allows us to write the following code and know that the child will
have its opacity updated in response to taps, without the child having
any knowledge of that fact or requiring any changes to its implementation:</p><div class="prism language-javascript">&lt;TouchableOpacity onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_handlePress<span class="token punctuation">}</span><span class="token operator">&gt;</span>
  &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
    &lt;Text<span class="token operator">&gt;</span>Press me<span class="token operator">!</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
  &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
&lt;<span class="token operator">/</span>TouchableOpacity<span class="token operator">&gt;</span></div><p>Let's imagine that <code>setNativeProps</code> was not available. One way that we
might implement it with that constraint is to store the opacity value
in the state, then update that value whenever <code>onPress</code> is fired:</p><div class="prism language-javascript"><span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">{</span> myButtonOpacity<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span>

<span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    &lt;TouchableOpacity onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>myButtonOpacity<span class="token punctuation">:</span> <span class="token number">0.5</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
                      onPressOut<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>myButtonOpacity<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">,</span> <span class="token punctuation">{</span>opacity<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>myButtonOpacity<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>Press me<span class="token operator">!</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    &lt;<span class="token operator">/</span>TouchableOpacity<span class="token operator">&gt;</span>
  <span class="token punctuation">)</span>
<span class="token punctuation">}</span></div><p>This is computationally intensive compared to the original example -
React needs to re-render the component hierarchy each time the opacity
changes, even though other properties of the view and its children
haven't changed. Usually this overhead isn't a concern but when
performing continuous animations and responding to gestures, judiciously
optimizing your components can improve your animations' fidelity.</p><p>If you look at the implementation of <code>setNativeProps</code> in
<a href="https://github.com/facebook/react-native/blob/master/Libraries/ReactIOS/NativeMethodsMixin.js" target="_blank">NativeMethodsMixin.js</a>
you will notice that it is a wrapper around <code>RCTUIManager.updateView</code> -
this is the exact same function call that results from re-rendering -
see <a href="https://github.com/facebook/react-native/blob/master/Libraries/ReactNative/ReactNativeBaseComponent.js" target="_blank">receiveComponent in
ReactNativeBaseComponent.js</a>.</p><h2><a class="anchor" name="composite-components-and-setnativeprops"></a>Composite components and setNativeProps <a class="hash-link" href="docs/direct-manipulation.html#composite-components-and-setnativeprops">#</a></h2><p>Composite components are not backed by a native view, so you cannot call
<code>setNativeProps</code> on them. Consider this example:</p><div class="prism language-javascript"><span class="token keyword">var</span> MyButton <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>label<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> App <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;TouchableOpacity<span class="token operator">&gt;</span>
        &lt;MyButton label<span class="token operator">=</span><span class="token string">"Press me!"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>TouchableOpacity<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p><a href="https://rnplay.org/apps/JXkgmQ" target="_blank">Run this example</a></p><p>If you run this you will immediately see this error: <code>Touchable child
must either be native or forward setNativeProps to a native component</code>.
This occurs because <code>MyButton</code> isn't directly backed by a native view
whose opacity should be set. You can think about it like this: if you
define a component with <code>React.createClass</code> you would not expect to be
able to set a style prop on it and have that work - you would need to
pass the style prop down to a child, unless you are wrapping a native
component. Similarly, we are going to forward <code>setNativeProps</code> to a
native-backed child component.</p><h4><a class="anchor" name="forward-setnativeprops-to-a-child"></a>Forward setNativeProps to a child <a class="hash-link" href="docs/direct-manipulation.html#forward-setnativeprops-to-a-child">#</a></h4><p>All we need to do is provide a <code>setNativeProps</code> method on our component
that calls <code>setNativeProps</code> on the appropriate child with the given
arguments.</p><div class="prism language-javascript"><span class="token keyword">var</span> MyButton <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">setNativeProps<span class="token punctuation">(</span></span>nativeProps<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_root<span class="token punctuation">.</span><span class="token function">setNativeProps<span class="token punctuation">(</span></span>nativeProps<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View ref<span class="token operator">=</span><span class="token punctuation">{</span>component <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_root <span class="token operator">=</span> component<span class="token punctuation">}</span> <span class="token punctuation">{</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>label<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p><a href="https://rnplay.org/apps/YJxnEQ" target="_blank">Run this example</a></p><p>You can now use <code>MyButton</code> inside of <code>TouchableOpacity</code>! A sidenote for
clarity: we used the <a href="https://facebook.github.io/react/docs/more-about-refs.html#the-ref-callback-attribute" target="_blank">ref callback</a> syntax here, rather than the traditional string-based ref.</p><p>You may have noticed that we passed all of the props down to the child
view using <code>{...this.props}</code>. The reason for this is that
<code>TouchableOpacity</code> is actually a composite component, and so in addition
to depending on <code>setNativeProps</code> on its child, it also requires that the
child perform touch handling. To do this, it passes on <a href="docs/view.html#onmoveshouldsetresponder" target="_blank">various
props</a>
that call back to the <code>TouchableOpacity</code> component.
<code>TouchableHighlight</code>, in contrast, is backed by a native view and only
requires that we implement <code>setNativeProps</code>.</p><h2><a class="anchor" name="setnativeprops-to-clear-textinput-value"></a>setNativeProps to clear TextInput value <a class="hash-link" href="docs/direct-manipulation.html#setnativeprops-to-clear-textinput-value">#</a></h2><p>Another very common use case of <code>setNativeProps</code> is to clear the value
of a TextInput. The <code>controlled</code> prop of TextInput can sometimes drop
characters when the <code>bufferDelay</code> is low and the user types very
quickly. Some developers prefer to skip this prop entirely and instead
use <code>setNativeProps</code> to directly manipulate the TextInput value when
necessary. For example, the following code demonstrates clearing the
input when you tap a button:</p><div class="prism language-javascript"><span class="token keyword">var</span> App <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">clearText<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_textInput<span class="token punctuation">.</span><span class="token function">setNativeProps<span class="token punctuation">(</span></span><span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">''</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;TextInput ref<span class="token operator">=</span><span class="token punctuation">{</span>component <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_textInput <span class="token operator">=</span> component<span class="token punctuation">}</span>
                   style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>textInput<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TouchableOpacity onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>clearText<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>Clear text&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableOpacity<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p><a href="https://rnplay.org/plays/pOI9bA" target="_blank">Run this example</a></p><h2><a class="anchor" name="avoiding-conflicts-with-the-render-function"></a>Avoiding conflicts with the render function <a class="hash-link" href="docs/direct-manipulation.html#avoiding-conflicts-with-the-render-function">#</a></h2><p>If you update a property that is also managed by the render function,
you might end up with some unpredictable and confusing bugs because
anytime the component re-renders and that property changes, whatever
value was previously set from <code>setNativeProps</code> will be completely
ignored and overridden. <a href="https://rnplay.org/apps/bp1DvQ" target="_blank">See this example</a>
for a demonstration of what can happen if these two collide - notice
the jerky animation each 250ms when <code>setState</code> triggers a re-render.</p><h2><a class="anchor" name="setnativeprops-shouldcomponentupdate"></a>setNativeProps &amp; shouldComponentUpdate <a class="hash-link" href="docs/direct-manipulation.html#setnativeprops-shouldcomponentupdate">#</a></h2><p>By <a href="https://facebook.github.io/react/docs/advanced-performance.html#avoiding-reconciling-the-dom" target="_blank">intelligently applying
<code>shouldComponentUpdate</code></a>
you can avoid the unnecessary overhead involved in reconciling unchanged
component subtrees, to the point where it may be performant enough to
use <code>setState</code> instead of <code>setNativeProps</code>.</p></div><div class="docs-prevnext"><a class="docs-next" href="docs/debugging.html#content">Next →</a></div><div class="survey"><div class="survey-image"></div><p>We are planning improvements to the React Native documentation. Your responses to this short survey will go a long way in helping us provide valuable content. Thank you!</p><center><a class="button" href="https://www.facebook.com/survey?oid=681969738611332">Take Survey</a></center></div>