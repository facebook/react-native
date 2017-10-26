---
id: activityindicator
title: activityindicator
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="activityindicator"></a>ActivityIndicator <a class="hash-link" href="docs/activityindicator.html#activityindicator">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.28-stable/Libraries/Components/ActivityIndicator/ActivityIndicator.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>Displays a circular loading indicator.</p></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/activityindicator.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="docs/view.html#props">View props...</a> <a class="hash-link" href="docs/activityindicator.html#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="animating"></a>animating <span class="propType">bool</span> <a class="hash-link" href="docs/activityindicator.html#animating">#</a></h4><div><p>Whether to show the indicator (true, the default) or hide it (false).</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="color"></a>color <span class="propType"><a href="docs/colors.html">color</a></span> <a class="hash-link" href="docs/activityindicator.html#color">#</a></h4><div><p>The foreground color of the spinner (default is gray).</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="size"></a>size <span class="propType">enum('small', 'large')</span> <a class="hash-link" href="docs/activityindicator.html#size">#</a></h4><div><p>Size of the indicator. Small has a height of 20, large has a height of 36.
Other sizes can be obtained using a scale transform.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="hideswhenstopped"></a><span class="platform">ios</span>hidesWhenStopped <span class="propType">bool</span> <a class="hash-link" href="docs/activityindicator.html#hideswhenstopped">#</a></h4><div><p>Whether the indicator should hide when not animating (true by default).</p></div></div></div></div><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/activityindicator.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.28-stable/Examples/UIExplorer/ActivityIndicatorExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

const React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const <span class="token punctuation">{</span>
  ActivityIndicator<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>
const TimerMixin <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-timer-mixin'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

const ToggleAnimatingActivityIndicator <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  mixins<span class="token punctuation">:</span> <span class="token punctuation">[</span>TimerMixin<span class="token punctuation">]</span><span class="token punctuation">,</span>

  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      animating<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">setToggleTimeout<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setTimeout<span class="token punctuation">(</span></span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>animating<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animating<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setToggleTimeout<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">2000</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">componentDidMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setToggleTimeout<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;ActivityIndicator
        animating<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animating<span class="token punctuation">}</span>
        style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>centering<span class="token punctuation">,</span> <span class="token punctuation">{</span>height<span class="token punctuation">:</span> <span class="token number">80</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
        size<span class="token operator">=</span><span class="token string">"large"</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>displayName <span class="token operator">=</span> <span class="token punctuation">(</span>undefined<span class="token punctuation">:</span> <span class="token operator">?</span>string<span class="token punctuation">)</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>framework <span class="token operator">=</span> <span class="token string">'React'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;ActivityIndicator&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Animated loading indicators.'</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Default (small, white)'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;ActivityIndicator
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>centering<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>gray<span class="token punctuation">]</span><span class="token punctuation">}</span>
          color<span class="token operator">=</span><span class="token string">"white"</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Gray'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;ActivityIndicator
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>centering<span class="token punctuation">]</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;ActivityIndicator
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>centering<span class="token punctuation">,</span> <span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#eeeeee'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom colors'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>horizontal<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;ActivityIndicator color<span class="token operator">=</span><span class="token string">"#0000ff"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;ActivityIndicator color<span class="token operator">=</span><span class="token string">"#aa00aa"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;ActivityIndicator color<span class="token operator">=</span><span class="token string">"#aa3300"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;ActivityIndicator color<span class="token operator">=</span><span class="token string">"#00aa00"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Large'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;ActivityIndicator
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>centering<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>gray<span class="token punctuation">]</span><span class="token punctuation">}</span>
          color<span class="token operator">=</span><span class="token string">"white"</span>
          size<span class="token operator">=</span><span class="token string">"large"</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Large, custom colors'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>horizontal<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;ActivityIndicator
            size<span class="token operator">=</span><span class="token string">"large"</span>
            color<span class="token operator">=</span><span class="token string">"#0000ff"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;ActivityIndicator
            size<span class="token operator">=</span><span class="token string">"large"</span>
            color<span class="token operator">=</span><span class="token string">"#aa00aa"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;ActivityIndicator
            size<span class="token operator">=</span><span class="token string">"large"</span>
            color<span class="token operator">=</span><span class="token string">"#aa3300"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;ActivityIndicator
            size<span class="token operator">=</span><span class="token string">"large"</span>
            color<span class="token operator">=</span><span class="token string">"#00aa00"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Start/stop'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;ToggleAnimatingActivityIndicator <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom size'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;ActivityIndicator
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>centering<span class="token punctuation">,</span> <span class="token punctuation">{</span>transform<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token punctuation">{</span>scale<span class="token punctuation">:</span> <span class="token number">1.5</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
          size<span class="token operator">=</span><span class="token string">"large"</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span>

const styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  centering<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">8</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  gray<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#cccccc'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  horizontal<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'space-around'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">8</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/datepickerios.html#content">Next →</a></div>