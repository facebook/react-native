---
id: sliderios
title: sliderios
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="sliderios"></a>SliderIOS <a class="hash-link" href="#sliderios">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/SliderIOS/SliderIOS.ios.js">Edit on GitHub</a></td></tr></tbody></table><div><noscript></noscript><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="docs/view.html#props">View props...</a> <a class="hash-link" href="#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="disabled"></a>disabled <span class="propType">bool</span> <a class="hash-link" href="#disabled">#</a></h4><div><p>If true the user won't be able to move the slider.
Default value is false.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="maximumtrackimage"></a>maximumTrackImage <span class="propType">Image.propTypes.source</span> <a class="hash-link" href="#maximumtrackimage">#</a></h4><div><p>Assigns a maximum track image. Only static images are supported. The
leftmost pixel of the image will be stretched to fill the track.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="maximumtracktintcolor"></a>maximumTrackTintColor <span class="propType">string</span> <a class="hash-link" href="#maximumtracktintcolor">#</a></h4><div><p>The color used for the track to the right of the button. Overrides the
default blue gradient image.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="maximumvalue"></a>maximumValue <span class="propType">number</span> <a class="hash-link" href="#maximumvalue">#</a></h4><div><p>Initial maximum value of the slider. Default value is 1.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="minimumtrackimage"></a>minimumTrackImage <span class="propType">Image.propTypes.source</span> <a class="hash-link" href="#minimumtrackimage">#</a></h4><div><p>Assigns a minimum track image. Only static images are supported. The
rightmost pixel of the image will be stretched to fill the track.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="minimumtracktintcolor"></a>minimumTrackTintColor <span class="propType">string</span> <a class="hash-link" href="#minimumtracktintcolor">#</a></h4><div><p>The color used for the track to the left of the button. Overrides the
default blue gradient image.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="minimumvalue"></a>minimumValue <span class="propType">number</span> <a class="hash-link" href="#minimumvalue">#</a></h4><div><p>Initial minimum value of the slider. Default value is 0.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onslidingcomplete"></a>onSlidingComplete <span class="propType">function</span> <a class="hash-link" href="#onslidingcomplete">#</a></h4><div><p>Callback called when the user finishes changing the value (e.g. when
the slider is released).</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onvaluechange"></a>onValueChange <span class="propType">function</span> <a class="hash-link" href="#onvaluechange">#</a></h4><div><p>Callback continuously called while the user is dragging the slider.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="step"></a>step <span class="propType">number</span> <a class="hash-link" href="#step">#</a></h4><div><p>Step value of the slider. The value should be
between 0 and (maximumValue - minimumValue).
Default value is 0.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="style"></a>style <span class="propType"><a href="docs/view.html#style">View#style</a></span> <a class="hash-link" href="#style">#</a></h4><div><p>Used to style and layout the <code>Slider</code>.  See <code>StyleSheet.js</code> and
<code>ViewStylePropTypes.js</code> for more info.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="thumbimage"></a>thumbImage <span class="propType">Image.propTypes.source</span> <a class="hash-link" href="#thumbimage">#</a></h4><div><p>Sets an image for the thumb. It only supports static images.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="trackimage"></a>trackImage <span class="propType">Image.propTypes.source</span> <a class="hash-link" href="#trackimage">#</a></h4><div><p>Assigns a single image for the track. Only static images are supported.
The center pixel of the image will be stretched to fill the track.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="value"></a>value <span class="propType">number</span> <a class="hash-link" href="#value">#</a></h4><div><p>Initial value of the slider. The value should be between minimumValue
and maximumValue, which default to 0 and 1 respectively.
Default value is 0.</p><p><em>This is not a controlled component</em>, e.g. if you don't update
the value, the component won't be reset to its initial value.</p></div></div></div></div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/SliderIOSExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  SliderIOS<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>

<span class="token keyword">var</span> SliderExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      value<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>text<span class="token punctuation">}</span> <span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>value<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;SliderIOS
          <span class="token punctuation">{</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span>
          onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>value<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>value<span class="token punctuation">:</span> value<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  slider<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    height<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
    margin<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  text<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">14</span><span class="token punctuation">,</span>
    textAlign<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'500'</span><span class="token punctuation">,</span>
    margin<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;SliderIOS&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>displayName <span class="token operator">=</span> <span class="token string">'SliderExample'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Slider input for numeric values'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Default settings'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;SliderExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'minimumValue: -1, maximumValue: 2'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;SliderExample
          minimumValue<span class="token operator">=</span><span class="token punctuation">{</span><span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">}</span>
          maximumValue<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">2</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'step: 0.25'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;SliderExample step<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">0.25</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom min/max track tint color'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;SliderExample
          minimumTrackTintColor<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">'red'</span><span class="token punctuation">}</span>
          maximumTrackTintColor<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">'green'</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom thumb image'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;SliderExample thumbImage<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./uie_thumb_big.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom track image'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;SliderExample trackImage<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./slider.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom min/max track image'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;SliderExample
          minimumTrackImage<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./slider-left.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          maximumTrackImage<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./slider-right.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/statusbar.html#content">Next →</a></div>