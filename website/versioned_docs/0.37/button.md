---
id: version-0.37-button
title: button
original_id: button
---
<a id="content"></a><h1><a class="anchor" name="button"></a>Button <a class="hash-link" href="docs/button.html#button">#</a></h1><div><div><p>A basic button component that should render nicely on any platform. Supports
a minimal level of customization.</p><span><center><img src="img/buttonExample.png"></center>

</span><p>If this button doesn't look right for your app, you can build your own
button using <a href="https://facebook.github.io/react-native/docs/touchableopacity.html" target="_blank">TouchableOpacity</a>
or <a href="https://facebook.github.io/react-native/docs/touchablenativefeedback.html" target="_blank">TouchableNativeFeedback</a>.
For inspiration, look at the <a href="https://github.com/facebook/react-native/blob/master/Libraries/Components/Button.js" target="_blank">source code for this button component</a>.
Or, take a look at the <a href="https://js.coach/react-native?search=button" target="_blank">wide variety of button components built by the community</a>.</p><p>Example usage:</p><div class="prism language-javascript">&lt;Button
  onPress<span class="token operator">=</span><span class="token punctuation">{</span>onPressLearnMore<span class="token punctuation">}</span>
  title<span class="token operator">=</span><span class="token string">"Learn More"</span>
  color<span class="token operator">=</span><span class="token string">"#841584"</span>
  accessibilityLabel<span class="token operator">=</span><span class="token string">"Learn more about this purple button"</span>
<span class="token operator">/</span><span class="token operator">&gt;</span></div></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/button.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="accessibilitylabel"></a>accessibilityLabel <span class="propType">string</span> <a class="hash-link" href="docs/button.html#accessibilitylabel">#</a></h4><div><p>Text to display for blindness accessibility features</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="color"></a>color <span class="propType"><a href="docs/colors.html">color</a></span> <a class="hash-link" href="docs/button.html#color">#</a></h4><div><p>Color of the text (iOS), or background color of the button (Android)</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="disabled"></a>disabled <span class="propType">bool</span> <a class="hash-link" href="docs/button.html#disabled">#</a></h4><div><p>If true, disable all interactions for this component.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onpress"></a>onPress <span class="propType">function</span> <a class="hash-link" href="docs/button.html#onpress">#</a></h4><div><p>Handler to be called when the user taps the button</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="title"></a>title <span class="propType">string</span> <a class="hash-link" href="docs/button.html#title">#</a></h4><div><p>Text to display inside the button</p></div></div></div></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/Button.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/button.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/ButtonExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

const React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const <span class="token punctuation">{</span>
  Alert<span class="token punctuation">,</span>
  Button<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

const onButtonPress <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
  Alert<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span><span class="token string">'Button has been pressed!'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>displayName <span class="token operator">=</span> <span class="token string">'ButtonExample'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>framework <span class="token operator">=</span> <span class="token string">'React'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;Button&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Simple React Native button component.'</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Simple Button'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'The title and onPress handler are required. It is '</span> <span class="token operator">+</span>
      <span class="token string">'recommended to set accessibilityLabel to help make your app usable by '</span> <span class="token operator">+</span>
      <span class="token string">'everyone.'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;Button
          onPress<span class="token operator">=</span><span class="token punctuation">{</span>onButtonPress<span class="token punctuation">}</span>
          title<span class="token operator">=</span><span class="token string">"Press Me"</span>
          accessibilityLabel<span class="token operator">=</span><span class="token string">"See an informative alert"</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Adjusted color'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Adjusts the color in a way that looks standard on each '</span> <span class="token operator">+</span>
      <span class="token string">'platform. On iOS, the color prop controls the color of the text. On '</span> <span class="token operator">+</span>
      <span class="token string">'Android, the color adjusts the background color of the button.'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;Button
          onPress<span class="token operator">=</span><span class="token punctuation">{</span>onButtonPress<span class="token punctuation">}</span>
          title<span class="token operator">=</span><span class="token string">"Press Purple"</span>
          color<span class="token operator">=</span><span class="token string">"#841584"</span>
          accessibilityLabel<span class="token operator">=</span><span class="token string">"Learn more about purple"</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Fit to text layout'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'This layout strategy lets the title define the width of '</span> <span class="token operator">+</span>
      <span class="token string">'the button'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span> justifyContent<span class="token punctuation">:</span> <span class="token string">'space-between'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Button
            onPress<span class="token operator">=</span><span class="token punctuation">{</span>onButtonPress<span class="token punctuation">}</span>
            title<span class="token operator">=</span><span class="token string">"This looks great!"</span>
            accessibilityLabel<span class="token operator">=</span><span class="token string">"This sounds great!"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Button
            onPress<span class="token operator">=</span><span class="token punctuation">{</span>onButtonPress<span class="token punctuation">}</span>
            title<span class="token operator">=</span><span class="token string">"Ok!"</span>
            color<span class="token operator">=</span><span class="token string">"#841584"</span>
            accessibilityLabel<span class="token operator">=</span><span class="token string">"Ok, Great!"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Disabled Button'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'All interactions for the component are disabled.'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;Button
          disabled
          onPress<span class="token operator">=</span><span class="token punctuation">{</span>onButtonPress<span class="token punctuation">}</span>
          title<span class="token operator">=</span><span class="token string">"I Am Disabled"</span>
          accessibilityLabel<span class="token operator">=</span><span class="token string">"See an informative alert"</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22Button%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/activityindicator.html#content">← Prev</a><a class="docs-next" href="docs/datepickerios.html#content">Next →</a></div>