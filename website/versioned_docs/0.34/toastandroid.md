---
id: toastandroid
title: toastandroid
---
<a id="content"></a><h1><a class="anchor" name="toastandroid"></a>ToastAndroid <a class="hash-link" href="docs/toastandroid.html#toastandroid">#</a></h1><div><div><p>This exposes the native ToastAndroid module as a JS module. This has a function 'show'
which takes the following parameters:</p><ol><li>String message: A string with the text to toast</li><li>int duration: The duration of the toast. May be ToastAndroid.SHORT or ToastAndroid.LONG</li></ol><p>There is also a function <code>showWithGravity</code> to specify the layout gravity. May be
ToastAndroid.TOP, ToastAndroid.BOTTOM, ToastAndroid.CENTER</p></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/toastandroid.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="show"></a><span class="methodType">static </span>show<span class="methodType">(message, duration)</span> <a class="hash-link" href="docs/toastandroid.html#show">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="showwithgravity"></a><span class="methodType">static </span>showWithGravity<span class="methodType">(message, duration, gravity)</span> <a class="hash-link" href="docs/toastandroid.html#showwithgravity">#</a></h4></div></div></span><span><h3><a class="anchor" name="properties"></a>Properties <a class="hash-link" href="docs/toastandroid.html#properties">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="short"></a>SHORT<span class="propType">: MemberExpression</span> <a class="hash-link" href="docs/toastandroid.html#short">#</a></h4><div><p>// Toast duration constants</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="long"></a>LONG<span class="propType">: MemberExpression</span> <a class="hash-link" href="docs/toastandroid.html#long">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="top"></a>TOP<span class="propType">: MemberExpression</span> <a class="hash-link" href="docs/toastandroid.html#top">#</a></h4><div><p>// Toast gravity constants</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="bottom"></a>BOTTOM<span class="propType">: MemberExpression</span> <a class="hash-link" href="docs/toastandroid.html#bottom">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="center"></a>CENTER<span class="propType">: MemberExpression</span> <a class="hash-link" href="docs/toastandroid.html#center">#</a></h4></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/ToastAndroid/ToastAndroid.android.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/toastandroid.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/ToastAndroidExample.android.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  ToastAndroid<span class="token punctuation">,</span>
  TouchableWithoutFeedback<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

<span class="token keyword">var</span> UIExplorerBlock <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'UIExplorerBlock'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> UIExplorerPage <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'UIExplorerPage'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

class <span class="token class-name">ToastExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  static title <span class="token operator">=</span> <span class="token string">'Toast Example'</span><span class="token punctuation">;</span>
  static description <span class="token operator">=</span> <span class="token string">'Example that demonstrates the use of an Android Toast to provide feedback.'</span><span class="token punctuation">;</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;UIExplorerPage title<span class="token operator">=</span><span class="token string">"ToastAndroid"</span><span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Simple toast"</span><span class="token operator">&gt;</span>
          &lt;TouchableWithoutFeedback
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span>
              ToastAndroid<span class="token punctuation">.</span><span class="token function">show<span class="token punctuation">(</span></span><span class="token string">'This is a toast with short duration'</span><span class="token punctuation">,</span> ToastAndroid<span class="token punctuation">.</span>SHORT<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>text<span class="token punctuation">}</span><span class="token operator">&gt;</span>Click me<span class="token punctuation">.</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableWithoutFeedback<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Toast with long duration"</span><span class="token operator">&gt;</span>
          &lt;TouchableWithoutFeedback
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span>
              ToastAndroid<span class="token punctuation">.</span><span class="token function">show<span class="token punctuation">(</span></span><span class="token string">'This is a toast with long duration'</span><span class="token punctuation">,</span> ToastAndroid<span class="token punctuation">.</span>LONG<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>text<span class="token punctuation">}</span><span class="token operator">&gt;</span>Click me<span class="token punctuation">.</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableWithoutFeedback<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Toast with top gravity"</span><span class="token operator">&gt;</span>
          &lt;TouchableWithoutFeedback
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span>
              ToastAndroid<span class="token punctuation">.</span><span class="token function">showWithGravity<span class="token punctuation">(</span></span>
                <span class="token string">'This is a toast with top gravity'</span><span class="token punctuation">,</span>
                ToastAndroid<span class="token punctuation">.</span>SHORT<span class="token punctuation">,</span>
                ToastAndroid<span class="token punctuation">.</span>TOP<span class="token punctuation">,</span>
              <span class="token punctuation">)</span>
            <span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>text<span class="token punctuation">}</span><span class="token operator">&gt;</span>Click me<span class="token punctuation">.</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableWithoutFeedback<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Toast with center gravity"</span><span class="token operator">&gt;</span>
          &lt;TouchableWithoutFeedback
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span>
              ToastAndroid<span class="token punctuation">.</span><span class="token function">showWithGravity<span class="token punctuation">(</span></span>
                <span class="token string">'This is a toast with center gravity'</span><span class="token punctuation">,</span>
                ToastAndroid<span class="token punctuation">.</span>SHORT<span class="token punctuation">,</span>
                ToastAndroid<span class="token punctuation">.</span>CENTER<span class="token punctuation">,</span>
              <span class="token punctuation">)</span>
            <span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>text<span class="token punctuation">}</span><span class="token operator">&gt;</span>Click me<span class="token punctuation">.</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableWithoutFeedback<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Toast with bottom gravity"</span><span class="token operator">&gt;</span>
          &lt;TouchableWithoutFeedback
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span>
              ToastAndroid<span class="token punctuation">.</span><span class="token function">showWithGravity<span class="token punctuation">(</span></span>
                <span class="token string">'This is a toast with bottom gravity'</span><span class="token punctuation">,</span>
                ToastAndroid<span class="token punctuation">.</span>SHORT<span class="token punctuation">,</span>
                ToastAndroid<span class="token punctuation">.</span>BOTTOM<span class="token punctuation">,</span>
              <span class="token punctuation">)</span>
            <span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>text<span class="token punctuation">}</span><span class="token operator">&gt;</span>Click me<span class="token punctuation">.</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableWithoutFeedback<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>UIExplorerPage<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  text<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    color<span class="token punctuation">:</span> <span class="token string">'black'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

module<span class="token punctuation">.</span>exports <span class="token operator">=</span> ToastExample<span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="338" src="img/uiexplorer_main_android.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/q7wkvt42v6bkr0pzt1n0gmbwfr?device=nexus5&amp;scale=65&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22ToastAndroid%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/timepickerandroid.html#content">← Prev</a><a class="docs-next" href="docs/vibration.html#content">Next →</a></div>