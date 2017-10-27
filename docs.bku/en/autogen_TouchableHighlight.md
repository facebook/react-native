---
id: touchablehighlight
title: TouchableHighlight
category: Components
permalink: docs/touchablehighlight.html
---
<div><div><p>A wrapper for making views respond properly to touches.
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
<span class="token punctuation">}</span><span class="token punctuation">,</span></div></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/touchablehighlight.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="touchablewithoutfeedback"></a><a href="docs/touchablewithoutfeedback.html#props">TouchableWithoutFeedback props...</a> <a class="hash-link" href="docs/touchablehighlight.html#touchablewithoutfeedback">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="activeopacity"></a>activeOpacity?: <span class="propType">number</span> <a class="hash-link" href="docs/touchablehighlight.html#activeopacity">#</a></h4><div><p>Determines what the opacity of the wrapped view should be when touch is
active.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onhideunderlay"></a>onHideUnderlay?: <span class="propType">function</span> <a class="hash-link" href="docs/touchablehighlight.html#onhideunderlay">#</a></h4><div><p>Called immediately after the underlay is hidden</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onshowunderlay"></a>onShowUnderlay?: <span class="propType">function</span> <a class="hash-link" href="docs/touchablehighlight.html#onshowunderlay">#</a></h4><div><p>Called immediately after the underlay is shown</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="style"></a>style?: <span class="propType">ViewPropTypes.style</span> <a class="hash-link" href="docs/touchablehighlight.html#style">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="underlaycolor"></a>underlayColor?: <span class="propType"><a href="docs/colors.html">color</a></span> <a class="hash-link" href="docs/touchablehighlight.html#underlaycolor">#</a></h4><div><p>The color of the underlay that will show through when the touch is
active.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="hastvpreferredfocus"></a><span class="platform">ios</span>hasTVPreferredFocus?: <span class="propType">bool</span> <a class="hash-link" href="docs/touchablehighlight.html#hastvpreferredfocus">#</a></h4><div><p><em>(Apple TV only)</em> TV preferred focus (see documentation for the View component).</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="tvparallaxproperties"></a><span class="platform">ios</span>tvParallaxProperties?: <span class="propType">object</span> <a class="hash-link" href="docs/touchablehighlight.html#tvparallaxproperties">#</a></h4><div><p><em>(Apple TV only)</em> Object with properties to control Apple TV parallax effects.</p><p>enabled: If true, parallax effects are enabled.  Defaults to true.
shiftDistanceX: Defaults to 2.0.
shiftDistanceY: Defaults to 2.0.
tiltAngle: Defaults to 0.05.
magnification: Defaults to 1.0.</p></div></div></div></div>