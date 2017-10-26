---
id: touchablehighlight
title: touchablehighlight
---
<a id="content"></a><h1><a class="anchor" name="touchablehighlight"></a>TouchableHighlight <a class="hash-link" href="docs/touchablehighlight.html#touchablehighlight">#</a></h1><div><div><p>A wrapper for making views respond properly to touches.
On press down, the opacity of the wrapped view is decreased, which allows
the underlay color to show through, darkening or tinting the view.</p><p>The underlay comes from wrapping the child in a new View, which can affect
layout, and sometimes cause unwanted visual artifacts if not used correctly,
for example if the backgroundColor of the wrapped view isn't explicitly set
to an opaque color.</p><p>TouchableHighlight must have one child (not zero or more than one).
If you wish to have several child components, wrap them in a View.</p><p>Example:</p><div class="prism language-javascript">renderButton<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    <span class="token operator">&lt;</span>TouchableHighlight onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onPressButton<span class="token punctuation">}</span><span class="token operator">&gt;</span>
      <span class="token operator">&lt;</span>Image
        style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span>
        source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require</span><span class="token punctuation">(</span><span class="token string">'./myButton.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token operator">&lt;</span><span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span></div><h3><a class="anchor" name="example"></a>Example <a class="hash-link" href="docs/touchablehighlight.html#example">#</a></h3><div class="web-player"><div class="prism language-javascript"><span class="token keyword">import</span> React<span class="token punctuation">,</span> <span class="token punctuation">{</span> Component <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'react'</span>
<span class="token keyword">import</span> <span class="token punctuation">{</span>
  AppRegistry<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'react-native'</span>

<span class="token keyword">class</span> <span class="token class-name">App</span> <span class="token keyword">extends</span> <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">constructor</span><span class="token punctuation">(</span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">super</span><span class="token punctuation">(</span>props<span class="token punctuation">)</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span> count<span class="token punctuation">:</span> <span class="token number">0</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  onPress <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState</span><span class="token punctuation">(</span><span class="token punctuation">{</span>
      count<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>count<span class="token operator">+</span><span class="token number">1</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span>
  <span class="token punctuation">}</span>

 <span class="token function">render</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      <span class="token operator">&lt;</span>View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        <span class="token operator">&lt;</span>TouchableHighlight
         style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span>
         onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>onPress<span class="token punctuation">}</span>
        <span class="token operator">&gt;</span>
         <span class="token operator">&lt;</span>Text<span class="token operator">&gt;</span> Touch Here <span class="token operator">&lt;</span><span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        <span class="token operator">&lt;</span><span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        <span class="token operator">&lt;</span>View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>countContainer<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token operator">&lt;</span>Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>countText<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            <span class="token punctuation">{</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>count <span class="token operator">!==</span> <span class="token number">0</span> <span class="token operator">?</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>count<span class="token punctuation">:</span> <span class="token keyword">null</span><span class="token punctuation">}</span>
          <span class="token operator">&lt;</span><span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        <span class="token operator">&lt;</span><span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token operator">&lt;</span><span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">const</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create</span><span class="token punctuation">(</span><span class="token punctuation">{</span>
  container<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    paddingHorizontal<span class="token punctuation">:</span> <span class="token number">10</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  button<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#DDDDDD'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">10</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  countContainer<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">10</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  countText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    color<span class="token punctuation">:</span> <span class="token string">'#FF00FF'</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span>

AppRegistry<span class="token punctuation">.</span><span class="token function">registerComponent</span><span class="token punctuation">(</span><span class="token string">'App'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> App<span class="token punctuation">)</span></div><iframe style="margin-top:4px;" width="880" height="420" data-src="//cdn.rawgit.com/dabbott/react-native-web-player/gh-v1.2.6/index.html#code=import%20React%2C%20%7B%20Component%20%7D%20from%20'react'%0Aimport%20%7B%0A%20%20AppRegistry%2C%0A%20%20StyleSheet%2C%0A%20%20TouchableHighlight%2C%0A%20%20Text%2C%0A%20%20View%2C%0A%7D%20from%20'react-native'%0A%0Aclass%20App%20extends%20Component%20%7B%0A%20%20constructor(props)%20%7B%0A%20%20%20%20super(props)%0A%20%20%20%20this.state%20%3D%20%7B%20count%3A%200%20%7D%0A%20%20%7D%0A%0A%20%20onPress%20%3D%20()%20%3D%3E%20%7B%0A%20%20%20%20this.setState(%7B%0A%20%20%20%20%20%20count%3A%20this.state.count%2B1%0A%20%20%20%20%7D)%0A%20%20%7D%0A%0A%20render()%20%7B%0A%20%20%20%20return%20(%0A%20%20%20%20%20%20%3CView%20style%3D%7Bstyles.container%7D%3E%0A%20%20%20%20%20%20%20%20%3CTouchableHighlight%0A%20%20%20%20%20%20%20%20%20style%3D%7Bstyles.button%7D%0A%20%20%20%20%20%20%20%20%20onPress%3D%7Bthis.onPress%7D%0A%20%20%20%20%20%20%20%20%3E%0A%20%20%20%20%20%20%20%20%20%3CText%3E%20Touch%20Here%20%3C%2FText%3E%0A%20%20%20%20%20%20%20%20%3C%2FTouchableHighlight%3E%0A%20%20%20%20%20%20%20%20%3CView%20style%3D%7B%5Bstyles.countContainer%5D%7D%3E%0A%20%20%20%20%20%20%20%20%20%20%3CText%20style%3D%7B%5Bstyles.countText%5D%7D%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%7B%20this.state.count%20!%3D%3D%200%20%3F%20this.state.count%3A%20null%7D%0A%20%20%20%20%20%20%20%20%20%20%3C%2FText%3E%0A%20%20%20%20%20%20%20%20%3C%2FView%3E%0A%20%20%20%20%20%20%3C%2FView%3E%0A%20%20%20%20)%0A%20%20%7D%0A%7D%0A%0Aconst%20styles%20%3D%20StyleSheet.create(%7B%0A%20%20container%3A%20%7B%0A%20%20%20%20flex%3A%201%2C%0A%20%20%20%20justifyContent%3A%20'center'%2C%0A%20%20%20%20paddingHorizontal%3A%2010%0A%20%20%7D%2C%0A%20%20button%3A%20%7B%0A%20%20%20%20alignItems%3A%20'center'%2C%0A%20%20%20%20backgroundColor%3A%20'%23DDDDDD'%2C%0A%20%20%20%20padding%3A%2010%0A%20%20%7D%2C%0A%20%20countContainer%3A%20%7B%0A%20%20%20%20alignItems%3A%20'center'%2C%0A%20%20%20%20padding%3A%2010%0A%20%20%7D%2C%0A%20%20countText%3A%20%7B%0A%20%20%20%20color%3A%20'%23FF00FF'%0A%20%20%7D%0A%7D)%0A%0AAppRegistry.registerComponent('App'%2C%20()%20%3D%3E%20App)" frameborder="0"></iframe></div></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/touchablehighlight.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="touchablewithoutfeedback"></a><a href="docs/touchablewithoutfeedback.html#props">TouchableWithoutFeedback props...</a> <a class="hash-link" href="docs/touchablehighlight.html#touchablewithoutfeedback">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="activeopacity"></a>activeOpacity?: <span class="propType">number</span> <a class="hash-link" href="docs/touchablehighlight.html#activeopacity">#</a></h4><div><p>Determines what the opacity of the wrapped view should be when touch is
active.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onhideunderlay"></a>onHideUnderlay?: <span class="propType">function</span> <a class="hash-link" href="docs/touchablehighlight.html#onhideunderlay">#</a></h4><div><p>Called immediately after the underlay is hidden</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onshowunderlay"></a>onShowUnderlay?: <span class="propType">function</span> <a class="hash-link" href="docs/touchablehighlight.html#onshowunderlay">#</a></h4><div><p>Called immediately after the underlay is shown</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="style"></a>style?: <span class="propType">ViewPropTypes.style</span> <a class="hash-link" href="docs/touchablehighlight.html#style">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="underlaycolor"></a>underlayColor?: <span class="propType"><a href="docs/colors.html">color</a></span> <a class="hash-link" href="docs/touchablehighlight.html#underlaycolor">#</a></h4><div><p>The color of the underlay that will show through when the touch is
active.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="hastvpreferredfocus"></a><span class="platform">ios</span>hasTVPreferredFocus?: <span class="propType">bool</span> <a class="hash-link" href="docs/touchablehighlight.html#hastvpreferredfocus">#</a></h4><div><p><em>(Apple TV only)</em> TV preferred focus (see documentation for the View component).</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="tvparallaxproperties"></a><span class="platform">ios</span>tvParallaxProperties?: <span class="propType">object</span> <a class="hash-link" href="docs/touchablehighlight.html#tvparallaxproperties">#</a></h4><div><p><em>(Apple TV only)</em> Object with properties to control Apple TV parallax effects.</p><p>enabled: If true, parallax effects are enabled.  Defaults to true.
shiftDistanceX: Defaults to 2.0.
shiftDistanceY: Defaults to 2.0.
tiltAngle: Defaults to 0.05.
magnification: Defaults to 1.0.</p></div></div></div></div><p class="edit-page-block"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/Touchable/TouchableHighlight.js">Improve this page</a> by sending a pull request!</p><div class="docs-prevnext"><a class="docs-prev" href="docs/toolbarandroid.html#content">← Prev</a><a class="docs-next" href="docs/touchablenativefeedback.html#content">Next →</a></div>