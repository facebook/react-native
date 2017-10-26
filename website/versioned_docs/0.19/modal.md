---
id: modal
title: modal
---
<a id="content"></a><h1>Modal</h1><div><div><p>A Modal component covers the native view (e.g. UIViewController, Activity)
that contains the React Native root.</p><p>Use Modal in hybrid apps that embed React Native; Modal allows the portion of
your app written in React Native to present content above the enclosing
native view hierarchy.</p><p>In apps written with React Native from the root view down, you should use
Navigator instead of Modal. With a top-level Navigator, you have more control
over how to present the modal scene over the rest of your app by using the
configureScene property.</p><p>This component is only available in iOS at this time.</p></div><h3><a class="anchor" name="props"></a><a class="edit-github" href="https://github.com/facebook/react-native/blob/master/Libraries/Modal/Modal.js">Edit on GitHub</a>Props <a class="hash-link" href="#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="animated"></a>animated <span class="propType">bool</span> <a class="hash-link" href="#animated">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="ondismiss"></a>onDismiss <span class="propType">function</span> <a class="hash-link" href="#ondismiss">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="transparent"></a>transparent <span class="propType">bool</span> <a class="hash-link" href="#transparent">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="visible"></a>visible <span class="propType">bool</span> <a class="hash-link" href="#visible">#</a></h4></div></div></div><div><h3><a class="anchor" name="examples"></a><a class="edit-github" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/ModalExample.js">Edit on GitHub</a>Examples <a class="hash-link" href="#examples">#</a></h3><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  Modal<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  SwitchIOS<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>displayName <span class="token operator">=</span> <span class="token punctuation">(</span>undefined<span class="token punctuation">:</span> <span class="token operator">?</span>string<span class="token punctuation">)</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>framework <span class="token operator">=</span> <span class="token string">'React'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;Modal&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Component for presenting modal views.'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> Button <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      active<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_onHighlight<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>active<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_onUnhighlight<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>active<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

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
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> ModalExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      animated<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
      modalVisible<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
      transparent<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_setModalVisible<span class="token punctuation">(</span></span>visible<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>modalVisible<span class="token punctuation">:</span> visible<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_toggleAnimated<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>animated<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_toggleTransparent<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>transparent<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>transparent<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> modalBackgroundStyle <span class="token operator">=</span> <span class="token punctuation">{</span>
      backgroundColor<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>transparent <span class="token operator">?</span> <span class="token string">'rgba(0, 0, 0, 0.5)'</span> <span class="token punctuation">:</span> <span class="token string">'#f5fcff'</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
    <span class="token keyword">var</span> innerContainerTransparentStyle <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>transparent
      <span class="token operator">?</span> <span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#fff'</span><span class="token punctuation">,</span> padding<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">}</span>
      <span class="token punctuation">:</span> <span class="token keyword">null</span><span class="token punctuation">;</span>

    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Modal
          animated<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated<span class="token punctuation">}</span>
          transparent<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>transparent<span class="token punctuation">}</span>
          visible<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>modalVisible<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">,</span> modalBackgroundStyle<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>innerContainer<span class="token punctuation">,</span> innerContainerTransparentStyle<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text<span class="token operator">&gt;</span>This modal was presented <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated <span class="token operator">?</span> <span class="token string">'with'</span> <span class="token punctuation">:</span> <span class="token string">'without'</span><span class="token punctuation">}</span> animation<span class="token punctuation">.</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Button
                onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_setModalVisible<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token boolean">false</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
                style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>modalButton<span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Close
              &lt;<span class="token operator">/</span>Button<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>Modal<span class="token operator">&gt;</span>

        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>row<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>rowTitle<span class="token punctuation">}</span><span class="token operator">&gt;</span>Animated&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;SwitchIOS value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated<span class="token punctuation">}</span> onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_toggleAnimated<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>

        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>row<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>rowTitle<span class="token punctuation">}</span><span class="token operator">&gt;</span>Transparent&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;SwitchIOS value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>transparent<span class="token punctuation">}</span> onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_toggleTransparent<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>

        &lt;Button onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_setModalVisible<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Present
        &lt;<span class="token operator">/</span>Button<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

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
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="navigator.html#content">Next →</a></div>