---
id: slider
title: slider
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="slider"></a>Slider <a class="hash-link" href="docs/slider.html#slider">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/Slider/Slider.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>A component used to select a single value from a range of values.</p></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/slider.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="docs/view.html#props">View props...</a> <a class="hash-link" href="docs/slider.html#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="disabled"></a>disabled <span class="propType">bool</span> <a class="hash-link" href="docs/slider.html#disabled">#</a></h4><div><p>If true the user won't be able to move the slider.
Default value is false.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="maximumvalue"></a>maximumValue <span class="propType">number</span> <a class="hash-link" href="docs/slider.html#maximumvalue">#</a></h4><div><p>Initial maximum value of the slider. Default value is 1.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="minimumvalue"></a>minimumValue <span class="propType">number</span> <a class="hash-link" href="docs/slider.html#minimumvalue">#</a></h4><div><p>Initial minimum value of the slider. Default value is 0.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onslidingcomplete"></a>onSlidingComplete <span class="propType">function</span> <a class="hash-link" href="docs/slider.html#onslidingcomplete">#</a></h4><div><p>Callback called when the user finishes changing the value (e.g. when
the slider is released).</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onvaluechange"></a>onValueChange <span class="propType">function</span> <a class="hash-link" href="docs/slider.html#onvaluechange">#</a></h4><div><p>Callback continuously called while the user is dragging the slider.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="step"></a>step <span class="propType">number</span> <a class="hash-link" href="docs/slider.html#step">#</a></h4><div><p>Step value of the slider. The value should be
between 0 and (maximumValue - minimumValue).
Default value is 0.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="style"></a>style <span class="propType"><a href="docs/view.html#style">View#style</a></span> <a class="hash-link" href="docs/slider.html#style">#</a></h4><div><p>Used to style and layout the <code>Slider</code>.  See <code>StyleSheet.js</code> and
<code>ViewStylePropTypes.js</code> for more info.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="testid"></a>testID <span class="propType">string</span> <a class="hash-link" href="docs/slider.html#testid">#</a></h4><div><p>Used to locate this view in UI automation tests.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="value"></a>value <span class="propType">number</span> <a class="hash-link" href="docs/slider.html#value">#</a></h4><div><p>Initial value of the slider. The value should be between minimumValue
and maximumValue, which default to 0 and 1 respectively.
Default value is 0.</p><p><em>This is not a controlled component</em>, you don't need to update the
value during dragging.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="maximumtrackimage"></a><span class="platform">ios</span>maximumTrackImage <span class="propType">Image.propTypes.source</span> <a class="hash-link" href="docs/slider.html#maximumtrackimage">#</a></h4><div><p>Assigns a maximum track image. Only static images are supported. The
leftmost pixel of the image will be stretched to fill the track.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="maximumtracktintcolor"></a><span class="platform">ios</span>maximumTrackTintColor <span class="propType">string</span> <a class="hash-link" href="docs/slider.html#maximumtracktintcolor">#</a></h4><div><p>The color used for the track to the right of the button. Overrides the
default blue gradient image.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="minimumtrackimage"></a><span class="platform">ios</span>minimumTrackImage <span class="propType">Image.propTypes.source</span> <a class="hash-link" href="docs/slider.html#minimumtrackimage">#</a></h4><div><p>Assigns a minimum track image. Only static images are supported. The
rightmost pixel of the image will be stretched to fill the track.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="minimumtracktintcolor"></a><span class="platform">ios</span>minimumTrackTintColor <span class="propType">string</span> <a class="hash-link" href="docs/slider.html#minimumtracktintcolor">#</a></h4><div><p>The color used for the track to the left of the button. Overrides the
default blue gradient image.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="thumbimage"></a><span class="platform">ios</span>thumbImage <span class="propType">Image.propTypes.source</span> <a class="hash-link" href="docs/slider.html#thumbimage">#</a></h4><div><p>Sets an image for the thumb. Only static images are supported.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="trackimage"></a><span class="platform">ios</span>trackImage <span class="propType">Image.propTypes.source</span> <a class="hash-link" href="docs/slider.html#trackimage">#</a></h4><div><p>Assigns a single image for the track. Only static images are supported.
The center pixel of the image will be stretched to fill the track.</p></div></div></div></div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/slider.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/SliderExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  Slider<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

<span class="token keyword">var</span> SliderExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getDefaultProps<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      value<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      value<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>value<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>text<span class="token punctuation">}</span> <span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>value &amp;&amp; <span class="token operator">+</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>value<span class="token punctuation">.</span><span class="token function">toFixed<span class="token punctuation">(</span></span><span class="token number">3</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Slider
          <span class="token punctuation">{</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span>
          onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>value<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>value<span class="token punctuation">:</span> value<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> SlidingCompleteExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      slideCompletionValue<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
      slideCompletionCount<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;SliderExample
          <span class="token punctuation">{</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span>
          onSlidingComplete<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>value<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
              slideCompletionValue<span class="token punctuation">:</span> value<span class="token punctuation">,</span>
              slideCompletionCount<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>slideCompletionCount <span class="token operator">+</span> <span class="token number">1</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          Completions<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>slideCompletionCount<span class="token punctuation">}</span> Value<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>slideCompletionValue<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
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

exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;Slider&gt;'</span><span class="token punctuation">;</span>
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
    title<span class="token punctuation">:</span> <span class="token string">'Initial value: 0.5'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;SliderExample value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">0.5</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
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
    title<span class="token punctuation">:</span> <span class="token string">'onSlidingComplete'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;SlidingCompleteExample <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom min/max track tint color'</span><span class="token punctuation">,</span>
    platform<span class="token punctuation">:</span> <span class="token string">'ios'</span><span class="token punctuation">,</span>
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
    platform<span class="token punctuation">:</span> <span class="token string">'ios'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;SliderExample thumbImage<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./uie_thumb_big.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom track image'</span><span class="token punctuation">,</span>
    platform<span class="token punctuation">:</span> <span class="token string">'ios'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;SliderExample trackImage<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./slider.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom min/max track image'</span><span class="token punctuation">,</span>
    platform<span class="token punctuation">:</span> <span class="token string">'ios'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;SliderExample
          minimumTrackImage<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./slider-left.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          maximumTrackImage<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./slider-right.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/sliderios.html#content">Next →</a></div>