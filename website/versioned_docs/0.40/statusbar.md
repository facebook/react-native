---
id: statusbar
title: statusbar
---
<a id="content"></a><h1><a class="anchor" name="statusbar"></a>StatusBar <a class="hash-link" href="docs/statusbar.html#statusbar">#</a></h1><div><div><p>Component to control the app status bar.</p><h3><a class="anchor" name="usage-with-navigator"></a>Usage with Navigator <a class="hash-link" href="docs/statusbar.html#usage-with-navigator">#</a></h3><p>It is possible to have multiple <code>StatusBar</code> components mounted at the same
time. The props will be merged in the order the <code>StatusBar</code> components were
mounted. One use case is to specify status bar styles per route using <code>Navigator</code>.</p><div class="prism language-javascript"> &lt;View<span class="token operator">&gt;</span>
   &lt;StatusBar
     backgroundColor<span class="token operator">=</span><span class="token string">"blue"</span>
     barStyle<span class="token operator">=</span><span class="token string">"light-content"</span>
   <span class="token operator">/</span><span class="token operator">&gt;</span>
   &lt;Navigator
     initialRoute<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>statusBarHidden<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
     renderScene<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>route<span class="token punctuation">,</span> navigator<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span>
       &lt;View<span class="token operator">&gt;</span>
         &lt;StatusBar hidden<span class="token operator">=</span><span class="token punctuation">{</span>route<span class="token punctuation">.</span>statusBarHidden<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
         <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
       &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
     <span class="token punctuation">}</span>
   <span class="token operator">/</span><span class="token operator">&gt;</span>
 &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span></div><h3><a class="anchor" name="imperative-api"></a>Imperative API <a class="hash-link" href="docs/statusbar.html#imperative-api">#</a></h3><p>For cases where using a component is not ideal, there is also an imperative
API exposed as static functions on the component. It is however not recommended
to use the static API and the component for the same prop because any value
set by the static API will get overriden by the one set by the component in
the next render.</p><h3><a class="anchor" name="constants"></a>Constants <a class="hash-link" href="docs/statusbar.html#constants">#</a></h3><p><code>currentHeight</code> (Android only) The height of the status bar.</p></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/statusbar.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="animated"></a>animated <span class="propType">bool</span> <a class="hash-link" href="docs/statusbar.html#animated">#</a></h4><div><p>If the transition between status bar property changes should be animated.
Supported for backgroundColor, barStyle and hidden.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="hidden"></a>hidden <span class="propType">bool</span> <a class="hash-link" href="docs/statusbar.html#hidden">#</a></h4><div><p>If the status bar is hidden.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="backgroundcolor"></a><span class="platform">android</span>backgroundColor <span class="propType"><a href="docs/colors.html">color</a></span> <a class="hash-link" href="docs/statusbar.html#backgroundcolor">#</a></h4><div><p>The background color of the status bar.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="translucent"></a><span class="platform">android</span>translucent <span class="propType">bool</span> <a class="hash-link" href="docs/statusbar.html#translucent">#</a></h4><div><p>If the status bar is translucent.
When translucent is set to true, the app will draw under the status bar.
This is useful when using a semi transparent status bar color.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="barstyle"></a><span class="platform">ios</span>barStyle <span class="propType">enum('default', 'light-content', 'dark-content')</span> <a class="hash-link" href="docs/statusbar.html#barstyle">#</a></h4><div><p>Sets the color of the status bar text.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="networkactivityindicatorvisible"></a><span class="platform">ios</span>networkActivityIndicatorVisible <span class="propType">bool</span> <a class="hash-link" href="docs/statusbar.html#networkactivityindicatorvisible">#</a></h4><div><p>If the network activity indicator should be visible.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="showhidetransition"></a><span class="platform">ios</span>showHideTransition <span class="propType">enum('fade', 'slide')</span> <a class="hash-link" href="docs/statusbar.html#showhidetransition">#</a></h4><div><p>The transition effect when showing and hiding the status bar using the <code>hidden</code>
prop. Defaults to 'fade'.</p></div></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/statusbar.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="sethidden"></a><span class="methodType">static </span>setHidden<span class="methodType">(hidden, animation?)</span> <a class="hash-link" href="docs/statusbar.html#sethidden">#</a></h4><div><p>Show or hide the status bar</p></div><div><strong>Parameters:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>hidden<br><br><div><span>boolean</span></div></td><td class="description"><div><p>Hide the status bar.</p></div></td></tr><tr><td>[animation]<br><br><div><span><a href="docs/#statusbaranimation">StatusBarAnimation</a></span></div></td><td class="description"><div><p>Optional animation when
   changing the status bar hidden property.</p></div></td></tr></tbody></table></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="setbarstyle"></a><span class="methodType">static </span>setBarStyle<span class="methodType">(style, animated?)</span> <a class="hash-link" href="docs/statusbar.html#setbarstyle">#</a></h4><div><p>Set the status bar style</p></div><div><strong>Parameters:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>style<br><br><div><span><a href="docs/#statusbarstyle">StatusBarStyle</a></span></div></td><td class="description"><div><p>Status bar style to set</p></div></td></tr><tr><td>[animated]<br><br><div><span>boolean</span></div></td><td class="description"><div><p>Animate the style change.</p></div></td></tr></tbody></table></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="setnetworkactivityindicatorvisible"></a><span class="methodType">static </span>setNetworkActivityIndicatorVisible<span class="methodType">(visible)</span> <a class="hash-link" href="docs/statusbar.html#setnetworkactivityindicatorvisible">#</a></h4><div><p>Control the visibility of the network activity indicator</p></div><div><strong>Parameters:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>visible<br><br><div><span>boolean</span></div></td><td class="description"><div><p>Show the indicator.</p></div></td></tr></tbody></table></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="setbackgroundcolor"></a><span class="methodType">static </span>setBackgroundColor<span class="methodType">(color, animated?)</span> <a class="hash-link" href="docs/statusbar.html#setbackgroundcolor">#</a></h4><div><p>Set the background color for the status bar</p></div><div><strong>Parameters:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>color<br><br><div><span>string</span></div></td><td class="description"><div><p>Background color.</p></div></td></tr><tr><td>[animated]<br><br><div><span>boolean</span></div></td><td class="description"><div><p>Animate the style change.</p></div></td></tr></tbody></table></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="settranslucent"></a><span class="methodType">static </span>setTranslucent<span class="methodType">(translucent)</span> <a class="hash-link" href="docs/statusbar.html#settranslucent">#</a></h4><div><p>Control the translucency of the status bar</p></div><div><strong>Parameters:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>translucent<br><br><div><span>boolean</span></div></td><td class="description"><div><p>Set as translucent.</p></div></td></tr></tbody></table></div></div></div></span><span><h3><a class="anchor" name="type-definitions"></a>Type Definitions <a class="hash-link" href="docs/statusbar.html#type-definitions">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="statusbarstyle"></a>StatusBarStyle <a class="hash-link" href="docs/statusbar.html#statusbarstyle">#</a></h4><div><p>Status bar style</p></div><strong>Type:</strong><br>$Enum<div><br><strong>Constants:</strong><table class="params"><thead><tr><th>Value</th><th>Description</th></tr></thead><tbody><tr><td>default</td><td class="description"><div><p>Default status bar style (dark for iOS, light for Android)</p></div></td></tr><tr><td>light-content</td><td class="description"><div><p>Dark background, white texts and icons</p></div></td></tr><tr><td>dark-content</td><td class="description"><div><p>Light background, dark texts and icons</p></div></td></tr></tbody></table></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="statusbaranimation"></a>StatusBarAnimation <a class="hash-link" href="docs/statusbar.html#statusbaranimation">#</a></h4><div><p>Status bar animation</p></div><strong>Type:</strong><br>$Enum<div><br><strong>Constants:</strong><table class="params"><thead><tr><th>Value</th><th>Description</th></tr></thead><tbody><tr><td>none</td><td class="description"><div><p>No animation</p></div></td></tr><tr><td>fade</td><td class="description"><div><p>Fade animation</p></div></td></tr><tr><td>slide</td><td class="description"><div><p>Slide animation</p></div></td></tr></tbody></table></div></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/StatusBar/StatusBar.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/statusbar.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/StatusBarExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

const React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const <span class="token punctuation">{</span>
  StatusBar<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>framework <span class="token operator">=</span> <span class="token string">'React'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;StatusBar&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Component for controlling the status bar'</span><span class="token punctuation">;</span>

const colors <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token string">'#ff0000'</span><span class="token punctuation">,</span>
  <span class="token string">'#00ff00'</span><span class="token punctuation">,</span>
  <span class="token string">'#0000ff'</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span>

const barStyles <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token string">'default'</span><span class="token punctuation">,</span>
  <span class="token string">'light-content'</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span>

const showHideTransitions <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token string">'fade'</span><span class="token punctuation">,</span>
  <span class="token string">'slide'</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span>

<span class="token keyword">function</span> getValue&lt;T<span class="token operator">&gt;</span><span class="token punctuation">(</span>values<span class="token punctuation">:</span> Array&lt;T<span class="token operator">&gt;</span><span class="token punctuation">,</span> index<span class="token punctuation">:</span> number<span class="token punctuation">)</span><span class="token punctuation">:</span> T <span class="token punctuation">{</span>
  <span class="token keyword">return</span> values<span class="token punctuation">[</span>index <span class="token operator">%</span> values<span class="token punctuation">.</span>length<span class="token punctuation">]</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

class <span class="token class-name">StatusBarHiddenExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    animated<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    hidden<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    showHideTransition<span class="token punctuation">:</span> <span class="token function">getValue<span class="token punctuation">(</span></span>showHideTransitions<span class="token punctuation">,</span> <span class="token number">0</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _showHideTransitionIndex <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>

  _onChangeAnimated <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>animated<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _onChangeHidden <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>hidden<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>hidden<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _onChangeTransition <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_showHideTransitionIndex<span class="token operator">++</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      showHideTransition<span class="token punctuation">:</span> <span class="token function">getValue<span class="token punctuation">(</span></span>showHideTransitions<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_showHideTransitionIndex<span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;StatusBar
          hidden<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>hidden<span class="token punctuation">}</span>
          showHideTransition<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>showHideTransition<span class="token punctuation">}</span>
          animated<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onChangeHidden<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>hidden<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>hidden <span class="token operator">?</span> <span class="token string">'true'</span> <span class="token punctuation">:</span> <span class="token string">'false'</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onChangeAnimated<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>animated <span class="token punctuation">(</span>ios only<span class="token punctuation">)</span><span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated <span class="token operator">?</span> <span class="token string">'true'</span> <span class="token punctuation">:</span> <span class="token string">'false'</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onChangeTransition<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              showHideTransition <span class="token punctuation">(</span>ios only<span class="token punctuation">)</span><span class="token punctuation">:</span>
              <span class="token string">'{getValue(showHideTransitions, this._showHideTransitionIndex)}'</span>
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">StatusBarStyleExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  _barStyleIndex <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>

  _onChangeBarStyle <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_barStyleIndex<span class="token operator">++</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>barStyle<span class="token punctuation">:</span> <span class="token function">getValue<span class="token punctuation">(</span></span>barStyles<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_barStyleIndex<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _onChangeAnimated <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>animated<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    animated<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    barStyle<span class="token punctuation">:</span> <span class="token function">getValue<span class="token punctuation">(</span></span>barStyles<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_barStyleIndex<span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;StatusBar
          animated<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated<span class="token punctuation">}</span>
          barStyle<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>barStyle<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onChangeBarStyle<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>style<span class="token punctuation">:</span> <span class="token string">'{getValue(barStyles, this._barStyleIndex)}'</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onChangeAnimated<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>animated<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated <span class="token operator">?</span> <span class="token string">'true'</span> <span class="token punctuation">:</span> <span class="token string">'false'</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">StatusBarNetworkActivityExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    networkActivityIndicatorVisible<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _onChangeNetworkIndicatorVisible <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      networkActivityIndicatorVisible<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>networkActivityIndicatorVisible<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;StatusBar
          networkActivityIndicatorVisible<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>networkActivityIndicatorVisible<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onChangeNetworkIndicatorVisible<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              networkActivityIndicatorVisible<span class="token punctuation">:</span>
              <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>networkActivityIndicatorVisible <span class="token operator">?</span> <span class="token string">'true'</span> <span class="token punctuation">:</span> <span class="token string">'false'</span><span class="token punctuation">}</span>
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">StatusBarBackgroundColorExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    animated<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token function">getValue<span class="token punctuation">(</span></span>colors<span class="token punctuation">,</span> <span class="token number">0</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _colorIndex <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>

  _onChangeBackgroundColor <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_colorIndex<span class="token operator">++</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token function">getValue<span class="token punctuation">(</span></span>colors<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_colorIndex<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _onChangeAnimated <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>animated<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;StatusBar
          backgroundColor<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>backgroundColor<span class="token punctuation">}</span>
          animated<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onChangeBackgroundColor<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'{getValue(colors, this._colorIndex)}'</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onChangeAnimated<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>animated<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated <span class="token operator">?</span> <span class="token string">'true'</span> <span class="token punctuation">:</span> <span class="token string">'false'</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">StatusBarTranslucentExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    translucent<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _onChangeTranslucent <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      translucent<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>translucent<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;StatusBar
          translucent<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>translucent<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onChangeTranslucent<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>translucent<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>translucent <span class="token operator">?</span> <span class="token string">'true'</span> <span class="token punctuation">:</span> <span class="token string">'false'</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">StatusBarStaticIOSExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            StatusBar<span class="token punctuation">.</span><span class="token function">setHidden<span class="token punctuation">(</span></span><span class="token boolean">true</span><span class="token punctuation">,</span> <span class="token string">'slide'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token function">setHidden<span class="token punctuation">(</span></span><span class="token boolean">true</span><span class="token punctuation">,</span> <span class="token string">'slide'</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            StatusBar<span class="token punctuation">.</span><span class="token function">setHidden<span class="token punctuation">(</span></span><span class="token boolean">false</span><span class="token punctuation">,</span> <span class="token string">'fade'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token function">setHidden<span class="token punctuation">(</span></span><span class="token boolean">false</span><span class="token punctuation">,</span> <span class="token string">'fade'</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            StatusBar<span class="token punctuation">.</span><span class="token function">setBarStyle<span class="token punctuation">(</span></span><span class="token string">'default'</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token function">setBarStyle<span class="token punctuation">(</span></span><span class="token string">'default'</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            StatusBar<span class="token punctuation">.</span><span class="token function">setBarStyle<span class="token punctuation">(</span></span><span class="token string">'light-content'</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token function">setBarStyle<span class="token punctuation">(</span></span><span class="token string">'light-content'</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            StatusBar<span class="token punctuation">.</span><span class="token function">setNetworkActivityIndicatorVisible<span class="token punctuation">(</span></span><span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token function">setNetworkActivityIndicatorVisible<span class="token punctuation">(</span></span><span class="token boolean">true</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            StatusBar<span class="token punctuation">.</span><span class="token function">setNetworkActivityIndicatorVisible<span class="token punctuation">(</span></span><span class="token boolean">false</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token function">setNetworkActivityIndicatorVisible<span class="token punctuation">(</span></span><span class="token boolean">false</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">StatusBarStaticAndroidExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            StatusBar<span class="token punctuation">.</span><span class="token function">setHidden<span class="token punctuation">(</span></span><span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token function">setHidden<span class="token punctuation">(</span></span><span class="token boolean">true</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            StatusBar<span class="token punctuation">.</span><span class="token function">setHidden<span class="token punctuation">(</span></span><span class="token boolean">false</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token function">setHidden<span class="token punctuation">(</span></span><span class="token boolean">false</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            StatusBar<span class="token punctuation">.</span><span class="token function">setBackgroundColor<span class="token punctuation">(</span></span><span class="token string">'#ff00ff'</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token function">setBackgroundColor<span class="token punctuation">(</span></span><span class="token string">'#ff00ff'</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            StatusBar<span class="token punctuation">.</span><span class="token function">setBackgroundColor<span class="token punctuation">(</span></span><span class="token string">'#00ff00'</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token function">setBackgroundColor<span class="token punctuation">(</span></span><span class="token string">'#00ff00'</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            StatusBar<span class="token punctuation">.</span><span class="token function">setTranslucent<span class="token punctuation">(</span></span><span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            StatusBar<span class="token punctuation">.</span><span class="token function">setBackgroundColor<span class="token punctuation">(</span></span><span class="token string">'rgba(0, 0, 0, 0.4)'</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token function">setTranslucent<span class="token punctuation">(</span></span><span class="token boolean">true</span><span class="token punctuation">)</span> and <span class="token function">setBackgroundColor<span class="token punctuation">(</span></span><span class="token string">'rgba(0, 0, 0, 0.4)'</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            StatusBar<span class="token punctuation">.</span><span class="token function">setTranslucent<span class="token punctuation">(</span></span><span class="token boolean">false</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            StatusBar<span class="token punctuation">.</span><span class="token function">setBackgroundColor<span class="token punctuation">(</span></span><span class="token string">'black'</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token function">setTranslucent<span class="token punctuation">(</span></span><span class="token boolean">false</span><span class="token punctuation">)</span> and <span class="token function">setBackgroundColor<span class="token punctuation">(</span></span><span class="token string">'black'</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

const examples <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'StatusBar hidden'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;StatusBarHiddenExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'StatusBar style'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;StatusBarStyleExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  platform<span class="token punctuation">:</span> <span class="token string">'ios'</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'StatusBar network activity indicator'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;StatusBarNetworkActivityExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  platform<span class="token punctuation">:</span> <span class="token string">'ios'</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'StatusBar background color'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;StatusBarBackgroundColorExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  platform<span class="token punctuation">:</span> <span class="token string">'android'</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'StatusBar background color'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;StatusBarTranslucentExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  platform<span class="token punctuation">:</span> <span class="token string">'android'</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'StatusBar static API'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;StatusBarStaticIOSExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  platform<span class="token punctuation">:</span> <span class="token string">'ios'</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'StatusBar static API'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;StatusBarStaticAndroidExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  platform<span class="token punctuation">:</span> <span class="token string">'android'</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'StatusBar dimensions'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>Height <span class="token punctuation">(</span>Android only<span class="token punctuation">)</span><span class="token punctuation">:</span> <span class="token punctuation">{</span>StatusBar<span class="token punctuation">.</span>currentHeight<span class="token punctuation">}</span> pts&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  platform<span class="token punctuation">:</span> <span class="token string">'android'</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> examples<span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  wrapper<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  button<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#eeeeee'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  title<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    marginTop<span class="token punctuation">:</span> <span class="token number">16</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">8</span><span class="token punctuation">,</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22StatusBar%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/snapshotviewios.html#content">← Prev</a><a class="docs-next" href="docs/switch.html#content">Next →</a></div>