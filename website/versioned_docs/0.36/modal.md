---
id: modal
title: modal
---
<a id="content"></a><h1><a class="anchor" name="modal"></a>Modal <a class="hash-link" href="docs/modal.html#modal">#</a></h1><div><div><p>The Modal component is a simple way to present content above an enclosing view.</p><p><em>Note: If you need more control over how to present modals over the rest of your app,
then consider using a top-level Navigator.</em></p><div class="prism language-javascript">import React<span class="token punctuation">,</span> <span class="token punctuation">{</span> Component <span class="token punctuation">}</span> from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span> Modal<span class="token punctuation">,</span> Text<span class="token punctuation">,</span> TouchableHighlight<span class="token punctuation">,</span> View <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>

class <span class="token class-name">ModalExample</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>

  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>modalVisible<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">setModalVisible<span class="token punctuation">(</span></span>visible<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>modalVisible<span class="token punctuation">:</span> visible<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginTop<span class="token punctuation">:</span> <span class="token number">22</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Modal
          animationType<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">"slide"</span><span class="token punctuation">}</span>
          transparent<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
          visible<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>modalVisible<span class="token punctuation">}</span>
          onRequestClose<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span><span class="token function">alert<span class="token punctuation">(</span></span><span class="token string">"Modal has been closed."</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
          <span class="token operator">&gt;</span>
         &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginTop<span class="token punctuation">:</span> <span class="token number">22</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View<span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>Hello World<span class="token operator">!</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>

            &lt;TouchableHighlight onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
              <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setModalVisible<span class="token punctuation">(</span></span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>modalVisible<span class="token punctuation">)</span>
            <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text<span class="token operator">&gt;</span>Hide Modal&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>

          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
         &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>Modal<span class="token operator">&gt;</span>

        &lt;TouchableHighlight onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
          <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setModalVisible<span class="token punctuation">(</span></span><span class="token boolean">true</span><span class="token punctuation">)</span>
        <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>Show Modal&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>

      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/modal.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="animated"></a>animated <span class="propType">bool</span> <a class="hash-link" href="docs/modal.html#animated">#</a></h4><div class="deprecated"><div class="deprecatedTitle"><img class="deprecatedIcon" src="img/Warning.png"><span>Deprecated</span></div><div class="deprecatedMessage"><div><p>Use the <code>animationType</code> prop instead.</p></div></div></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="animationtype"></a>animationType <span class="propType">PropTypes.oneOf(['none', 'slide', 'fade'])</span> <a class="hash-link" href="docs/modal.html#animationtype">#</a></h4><div><p>The <code>animationType</code> prop controls how the modal animates.</p><ul><li><code>slide</code> slides in from the bottom</li><li><code>fade</code> fades into view</li><li><code>none</code> appears without an animation</li></ul></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onrequestclose"></a>onRequestClose <span class="propType">Platform.OS === 'android' ? PropTypes.func.isRequired : PropTypes.func</span> <a class="hash-link" href="docs/modal.html#onrequestclose">#</a></h4><div><p>The <code>onRequestClose</code> prop allows passing a function that will be called once the modal has been dismissed.</p><p><em>On the Android platform, this is a required function.</em></p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onshow"></a>onShow <span class="propType">PropTypes.func</span> <a class="hash-link" href="docs/modal.html#onshow">#</a></h4><div><p>The <code>onShow</code> prop allows passing a function that will be called once the modal has been shown.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="transparent"></a>transparent <span class="propType">PropTypes.bool</span> <a class="hash-link" href="docs/modal.html#transparent">#</a></h4><div><p>The <code>transparent</code> prop determines whether your modal will fill the entire view. Setting this to <code>true</code> will render the modal over a transparent background.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="visible"></a>visible <span class="propType">PropTypes.bool</span> <a class="hash-link" href="docs/modal.html#visible">#</a></h4><div><p>The <code>visible</code> prop determines whether your modal is visible.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onorientationchange"></a><span class="platform">ios</span>onOrientationChange <span class="propType">PropTypes.func</span> <a class="hash-link" href="docs/modal.html#onorientationchange">#</a></h4><div><p>The <code>onOrientationChange</code> callback is called when the orientation changes while the modal is being displayed.
The orientation provided is only 'portrait' or 'landscape'. This callback is also called on initial render, regardless of the current orientation.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="supportedorientations"></a><span class="platform">ios</span>supportedOrientations <span class="propType">PropTypes.arrayOf(PropTypes.oneOf(['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']))</span> <a class="hash-link" href="docs/modal.html#supportedorientations">#</a></h4><div><p>The <code>supportedOrientations</code> prop allows the modal to be rotated to any of the specified orientations.
On iOS, the modal is still restricted by what's specified in your app's Info.plist's UISupportedInterfaceOrientations field.</p></div></div></div></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Modal/Modal.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/modal.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/ModalExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  Modal<span class="token punctuation">,</span>
  Picker<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Switch<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

const Item <span class="token operator">=</span> Picker<span class="token punctuation">.</span>Item<span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>displayName <span class="token operator">=</span> <span class="token punctuation">(</span>undefined<span class="token punctuation">:</span> <span class="token operator">?</span>string<span class="token punctuation">)</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>framework <span class="token operator">=</span> <span class="token string">'React'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;Modal&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Component for presenting modal views.'</span><span class="token punctuation">;</span>

class <span class="token class-name">Button</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    active<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _onHighlight <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>active<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _onUnhighlight <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>active<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> colorStyle <span class="token operator">=</span> <span class="token punctuation">{</span>
      color<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>active <span class="token operator">?</span> <span class="token string">'#fff'</span> <span class="token punctuation">:</span> <span class="token string">'#000'</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;TouchableHighlight
        onHideUnderlay<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onUnhighlight<span class="token punctuation">}</span>
        onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>onPress<span class="token punctuation">}</span>
        onShowUnderlay<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onHighlight<span class="token punctuation">}</span>
        style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>style<span class="token punctuation">]</span><span class="token punctuation">}</span>
        underlayColor<span class="token operator">=</span><span class="token string">"#a9d9d4"</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>buttonText<span class="token punctuation">,</span> colorStyle<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>children<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

const supportedOrientationsPickerValues <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">[</span><span class="token string">'portrait'</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token punctuation">[</span><span class="token string">'landscape'</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token punctuation">[</span><span class="token string">'landscape-left'</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token punctuation">[</span><span class="token string">'portrait'</span><span class="token punctuation">,</span> <span class="token string">'landscape-right'</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token punctuation">[</span><span class="token string">'portrait'</span><span class="token punctuation">,</span> <span class="token string">'landscape'</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span>

class <span class="token class-name">ModalExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    animationType<span class="token punctuation">:</span> <span class="token string">'none'</span><span class="token punctuation">,</span>
    modalVisible<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    transparent<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    selectedSupportedOrientation<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
    currentOrientation<span class="token punctuation">:</span> <span class="token string">'unknown'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _setModalVisible <span class="token operator">=</span> <span class="token punctuation">(</span>visible<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>modalVisible<span class="token punctuation">:</span> visible<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _setAnimationType <span class="token operator">=</span> <span class="token punctuation">(</span>type<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>animationType<span class="token punctuation">:</span> type<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _toggleTransparent <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>transparent<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>transparent<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> modalBackgroundStyle <span class="token operator">=</span> <span class="token punctuation">{</span>
      backgroundColor<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>transparent <span class="token operator">?</span> <span class="token string">'rgba(0, 0, 0, 0.5)'</span> <span class="token punctuation">:</span> <span class="token string">'#f5fcff'</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
    <span class="token keyword">var</span> innerContainerTransparentStyle <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>transparent
      <span class="token operator">?</span> <span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#fff'</span><span class="token punctuation">,</span> padding<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">}</span>
      <span class="token punctuation">:</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
    <span class="token keyword">var</span> activeButtonStyle <span class="token operator">=</span> <span class="token punctuation">{</span>
      backgroundColor<span class="token punctuation">:</span> <span class="token string">'#ddd'</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>

    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Modal
          animationType<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animationType<span class="token punctuation">}</span>
          transparent<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>transparent<span class="token punctuation">}</span>
          visible<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>modalVisible<span class="token punctuation">}</span>
          onRequestClose<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_setModalVisible<span class="token punctuation">(</span></span><span class="token boolean">false</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          supportedOrientations<span class="token operator">=</span><span class="token punctuation">{</span>supportedOrientationsPickerValues<span class="token punctuation">[</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>selectedSupportedOrientation<span class="token punctuation">]</span><span class="token punctuation">}</span>
          onOrientationChange<span class="token operator">=</span><span class="token punctuation">{</span>evt <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>currentOrientation<span class="token punctuation">:</span> evt<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>orientation<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">,</span> modalBackgroundStyle<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>innerContainer<span class="token punctuation">,</span> innerContainerTransparentStyle<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text<span class="token operator">&gt;</span>This modal was presented <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animationType <span class="token operator">===</span> <span class="token string">'none'</span> <span class="token operator">?</span> <span class="token string">'without'</span> <span class="token punctuation">:</span> <span class="token string">'with'</span><span class="token punctuation">}</span> animation<span class="token punctuation">.</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text<span class="token operator">&gt;</span>It is currently displayed <span class="token keyword">in</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>currentOrientation<span class="token punctuation">}</span> mode<span class="token punctuation">.</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Button
                onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_setModalVisible<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token boolean">false</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
                style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>modalButton<span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Close
              &lt;<span class="token operator">/</span>Button<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>Modal<span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>row<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>rowTitle<span class="token punctuation">}</span><span class="token operator">&gt;</span>Animation Type&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Button onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_setAnimationType<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token string">'none'</span><span class="token punctuation">)</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animationType <span class="token operator">===</span> <span class="token string">'none'</span> <span class="token operator">?</span> activeButtonStyle <span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            none
          &lt;<span class="token operator">/</span>Button<span class="token operator">&gt;</span>
          &lt;Button onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_setAnimationType<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token string">'slide'</span><span class="token punctuation">)</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animationType <span class="token operator">===</span> <span class="token string">'slide'</span> <span class="token operator">?</span> activeButtonStyle <span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            slide
          &lt;<span class="token operator">/</span>Button<span class="token operator">&gt;</span>
          &lt;Button onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_setAnimationType<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token string">'fade'</span><span class="token punctuation">)</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animationType <span class="token operator">===</span> <span class="token string">'fade'</span> <span class="token operator">?</span> activeButtonStyle <span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            fade
          &lt;<span class="token operator">/</span>Button<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>

        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>row<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>rowTitle<span class="token punctuation">}</span><span class="token operator">&gt;</span>Transparent&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Switch value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>transparent<span class="token punctuation">}</span> onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_toggleTransparent<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>

        &lt;View<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>rowTitle<span class="token punctuation">}</span><span class="token operator">&gt;</span>Supported orientations&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Picker
            selectedValue<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>selectedSupportedOrientation<span class="token punctuation">}</span>
            onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>_<span class="token punctuation">,</span> i<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>selectedSupportedOrientation<span class="token punctuation">:</span> i<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
            itemStyle<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>pickerItem<span class="token punctuation">}</span>
            <span class="token operator">&gt;</span>
            &lt;Item label<span class="token operator">=</span><span class="token string">"Portrait"</span> value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">0</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
            &lt;Item label<span class="token operator">=</span><span class="token string">"Landscape"</span> value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">1</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
            &lt;Item label<span class="token operator">=</span><span class="token string">"Landscape left"</span> value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">2</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
            &lt;Item label<span class="token operator">=</span><span class="token string">"Portrait and landscape right"</span> value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">3</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
            &lt;Item label<span class="token operator">=</span><span class="token string">"Portrait and landscape"</span> value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">4</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
            &lt;Item label<span class="token operator">=</span><span class="token string">"Default supportedOrientations"</span> value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">5</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>Picker<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>

        &lt;Button onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_setModalVisible<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Present
        &lt;<span class="token operator">/</span>Button<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Modal Presentation'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Modals can be presented with or without animation'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> &lt;ModalExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  container<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  innerContainer<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  row<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  rowTitle<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  button<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">44</span><span class="token punctuation">,</span>
    alignSelf<span class="token punctuation">:</span> <span class="token string">'stretch'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    overflow<span class="token punctuation">:</span> <span class="token string">'hidden'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  buttonText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">18</span><span class="token punctuation">,</span>
    margin<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    textAlign<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  modalButton<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    marginTop<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  pickerItem<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">16</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22Modal%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/mapview.html#content">← Prev</a><a class="docs-next" href="docs/navigator.html#content">Next →</a></div>