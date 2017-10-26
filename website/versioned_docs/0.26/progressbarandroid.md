---
id: progressbarandroid
title: progressbarandroid
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="progressbarandroid"></a>ProgressBarAndroid <a class="hash-link" href="docs/progressbarandroid.html#progressbarandroid">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/ProgressBarAndroid/ProgressBarAndroid.android.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>React component that wraps the Android-only <code>ProgressBar</code>. This component is used to indicate
that the app is loading or there is some activity in the app.</p><p>Example:</p><div class="prism language-javascript">render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">var</span> progressBar <span class="token operator">=</span>
    &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
      &lt;ProgressBar styleAttr<span class="token operator">=</span><span class="token string">"Inverse"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
    &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span><span class="token punctuation">;</span>

  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    &lt;MyLoadingComponent
      componentView<span class="token operator">=</span><span class="token punctuation">{</span>componentView<span class="token punctuation">}</span>
      loadingView<span class="token operator">=</span><span class="token punctuation">{</span>progressBar<span class="token punctuation">}</span>
      style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>loadingComponent<span class="token punctuation">}</span>
    <span class="token operator">/</span><span class="token operator">&gt;</span>
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span></div></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/progressbarandroid.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="docs/view.html#props">View props...</a> <a class="hash-link" href="docs/progressbarandroid.html#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="color"></a>color <span class="propType"><a href="docs/colors.html">color</a></span> <a class="hash-link" href="docs/progressbarandroid.html#color">#</a></h4><div><p>Color of the progress bar.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="indeterminate"></a>indeterminate <span class="propType">indeterminateType</span> <a class="hash-link" href="docs/progressbarandroid.html#indeterminate">#</a></h4><div><p>If the progress bar will show indeterminate progress. Note that this
can only be false if styleAttr is Horizontal.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="progress"></a>progress <span class="propType">number</span> <a class="hash-link" href="docs/progressbarandroid.html#progress">#</a></h4><div><p>The progress value (between 0 and 1).</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="styleattr"></a>styleAttr <span class="propType">STYLE_ATTRIBUTES</span> <a class="hash-link" href="docs/progressbarandroid.html#styleattr">#</a></h4><div><p>Style of the ProgressBar. One of:</p><ul><li>Horizontal</li><li>Normal (default)</li><li>Small</li><li>Large</li><li>Inverse</li><li>SmallInverse</li><li>LargeInverse</li></ul></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="testid"></a>testID <span class="propType">string</span> <a class="hash-link" href="docs/progressbarandroid.html#testid">#</a></h4><div><p>Used to locate this view in end-to-end tests.</p></div></div></div></div><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/progressbarandroid.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/ProgressBarAndroidExample.android.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> ProgressBar <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'ProgressBarAndroid'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'React'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> UIExplorerBlock <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'UIExplorerBlock'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> UIExplorerPage <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'UIExplorerPage'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> TimerMixin <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-timer-mixin'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> MovingBar <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  mixins<span class="token punctuation">:</span> <span class="token punctuation">[</span>TimerMixin<span class="token punctuation">]</span><span class="token punctuation">,</span>

  getInitialState<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      progress<span class="token punctuation">:</span> <span class="token number">0</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  componentDidMount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setInterval<span class="token punctuation">(</span></span>
      <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">var</span> progress <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>progress <span class="token operator">+</span> <span class="token number">0.02</span><span class="token punctuation">)</span> <span class="token operator">%</span> <span class="token number">1</span><span class="token punctuation">;</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>progress<span class="token punctuation">:</span> progress<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">50</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;ProgressBar progress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>progress<span class="token punctuation">}</span> <span class="token punctuation">{</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> ProgressBarAndroidExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>

  statics<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'&lt;ProgressBarAndroid&gt;'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Visual indicator of progress of some operation. '</span> <span class="token operator">+</span>
        <span class="token string">'Shows either a cyclic animation or a horizontal bar.'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;UIExplorerPage title<span class="token operator">=</span><span class="token string">"ProgressBar Examples"</span><span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Default ProgressBar"</span><span class="token operator">&gt;</span>
          &lt;ProgressBar <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>

        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Normal ProgressBar"</span><span class="token operator">&gt;</span>
          &lt;ProgressBar styleAttr<span class="token operator">=</span><span class="token string">"Normal"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>

        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Small ProgressBar"</span><span class="token operator">&gt;</span>
          &lt;ProgressBar styleAttr<span class="token operator">=</span><span class="token string">"Small"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>

        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Large ProgressBar"</span><span class="token operator">&gt;</span>
          &lt;ProgressBar styleAttr<span class="token operator">=</span><span class="token string">"Large"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>

        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Inverse ProgressBar"</span><span class="token operator">&gt;</span>
          &lt;ProgressBar styleAttr<span class="token operator">=</span><span class="token string">"Inverse"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>

        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Small Inverse ProgressBar"</span><span class="token operator">&gt;</span>
          &lt;ProgressBar styleAttr<span class="token operator">=</span><span class="token string">"SmallInverse"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>

        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Large Inverse ProgressBar"</span><span class="token operator">&gt;</span>
          &lt;ProgressBar styleAttr<span class="token operator">=</span><span class="token string">"LargeInverse"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>

        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Horizontal Indeterminate ProgressBar"</span><span class="token operator">&gt;</span>
          &lt;ProgressBar styleAttr<span class="token operator">=</span><span class="token string">"Horizontal"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>

        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Horizontal ProgressBar"</span><span class="token operator">&gt;</span>
          &lt;MovingBar styleAttr<span class="token operator">=</span><span class="token string">"Horizontal"</span> indeterminate<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>

        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Large Red ProgressBar"</span><span class="token operator">&gt;</span>
          &lt;ProgressBar styleAttr<span class="token operator">=</span><span class="token string">"Large"</span> color<span class="token operator">=</span><span class="token string">"red"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>

        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Horizontal Black Indeterminate ProgressBar"</span><span class="token operator">&gt;</span>
          &lt;ProgressBar styleAttr<span class="token operator">=</span><span class="token string">"Horizontal"</span> color<span class="token operator">=</span><span class="token string">"black"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>

        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Horizontal Blue ProgressBar"</span><span class="token operator">&gt;</span>
          &lt;MovingBar styleAttr<span class="token operator">=</span><span class="token string">"Horizontal"</span> indeterminate<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span> color<span class="token operator">=</span><span class="token string">"blue"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>UIExplorerPage<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

module<span class="token punctuation">.</span>exports <span class="token operator">=</span> ProgressBarAndroidExample<span class="token punctuation">;</span></div></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/progressviewios.html#content">Next →</a></div>