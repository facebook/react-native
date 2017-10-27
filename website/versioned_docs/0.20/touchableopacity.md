---
id: version-0.20-touchableopacity
title: touchableopacity
original_id: touchableopacity
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="touchableopacity"></a>TouchableOpacity <a class="hash-link" href="#touchableopacity">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/Touchable/TouchableOpacity.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>A wrapper for making views respond properly to touches.
On press down, the opacity of the wrapped view is decreased, dimming it.
This is done without actually changing the view hierarchy, and in general is
easy to add to an app without weird side-effects.</p><p>Example:</p><div class="prism language-javascript">renderButton<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    &lt;TouchableOpacity onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onPressButton<span class="token punctuation">}</span><span class="token operator">&gt;</span>
      &lt;Image
        style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span>
        source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'image!myButton'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    &lt;<span class="token operator">/</span>TouchableOpacity<span class="token operator">&gt;</span>
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span></div></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="touchablewithoutfeedback"></a><a href="docs/touchablewithoutfeedback.html#props">TouchableWithoutFeedback props...</a> <a class="hash-link" href="#touchablewithoutfeedback">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="activeopacity"></a>activeOpacity <span class="propType">number</span> <a class="hash-link" href="#activeopacity">#</a></h4><div><p>Determines what the opacity of the wrapped view should be when touch is
active.</p></div></div></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/touchablewithoutfeedback.html#content">Next →</a></div>