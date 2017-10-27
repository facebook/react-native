---
id: version-0.39-activityindicator
title: activityindicator
original_id: activityindicator
---
<a id="content"></a><h1><a class="anchor" name="activityindicator"></a>ActivityIndicator <a class="hash-link" href="docs/activityindicator.html#activityindicator">#</a></h1><div><div><p>Displays a circular loading indicator.</p></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/activityindicator.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="docs/view.html#props">View props...</a> <a class="hash-link" href="docs/activityindicator.html#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="animating"></a>animating <span class="propType">bool</span> <a class="hash-link" href="docs/activityindicator.html#animating">#</a></h4><div><p>Whether to show the indicator (true, the default) or hide it (false).</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="color"></a>color <span class="propType"><a href="docs/colors.html">color</a></span> <a class="hash-link" href="docs/activityindicator.html#color">#</a></h4><div><p>The foreground color of the spinner (default is gray).</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="size"></a>size <span class="propType">enum('small', 'large'), number</span> <a class="hash-link" href="docs/activityindicator.html#size">#</a></h4><div><p>Size of the indicator (default is 'small').
Passing a number to the size prop is only supported on Android.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="hideswhenstopped"></a><span class="platform">ios</span>hidesWhenStopped <span class="propType">bool</span> <a class="hash-link" href="docs/activityindicator.html#hideswhenstopped">#</a></h4><div><p>Whether the indicator should hide when not animating (true by default).</p></div></div></div></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/ActivityIndicator/ActivityIndicator.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/activityindicator.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/ActivityIndicatorExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

import React<span class="token punctuation">,</span> <span class="token punctuation">{</span> Component <span class="token punctuation">}</span> from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span> ActivityIndicator<span class="token punctuation">,</span> StyleSheet<span class="token punctuation">,</span> View <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>

<span class="token comment" spellcheck="true">/**
 * Optional Flowtype state and timer types definition
 */</span>
type State <span class="token operator">=</span> <span class="token punctuation">{</span> animating<span class="token punctuation">:</span> boolean<span class="token punctuation">;</span> <span class="token punctuation">}</span><span class="token punctuation">;</span>
type Timer <span class="token operator">=</span> number<span class="token punctuation">;</span>

class <span class="token class-name">ToggleAnimatingActivityIndicator</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token comment" spellcheck="true">/**
   * Optional Flowtype state and timer types
   */</span>
  state<span class="token punctuation">:</span> State<span class="token punctuation">;</span>
  _timer<span class="token punctuation">:</span> Timer<span class="token punctuation">;</span>

  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>
      animating<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">componentDidMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setToggleTimeout<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">componentWillUnmount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">clearTimeout<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>_timer<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">setToggleTimeout<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_timer <span class="token operator">=</span> <span class="token function">setTimeout<span class="token punctuation">(</span></span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>animating<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animating<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setToggleTimeout<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">2000</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;ActivityIndicator
        animating<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animating<span class="token punctuation">}</span>
        style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>centering<span class="token punctuation">,</span> <span class="token punctuation">{</span>height<span class="token punctuation">:</span> <span class="token number">80</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
        size<span class="token operator">=</span><span class="token string">"large"</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>



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
          size<span class="token operator">=</span><span class="token string">"large"</span>
          color<span class="token operator">=</span><span class="token string">"white"</span>
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
  <span class="token punctuation">{</span>
    platform<span class="token punctuation">:</span> <span class="token string">'android'</span><span class="token punctuation">,</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom size (size: 75)'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;ActivityIndicator
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>centering<span class="token punctuation">}</span>
          size<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">75</span><span class="token punctuation">}</span>
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
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22ActivityIndicator%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/button.html#content">Next →</a></div>