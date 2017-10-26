---
id: layoutanimation
title: layoutanimation
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="layoutanimation"></a>LayoutAnimation <a class="hash-link" href="docs/layoutanimation.html#layoutanimation">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.28-stable/Libraries/LayoutAnimation/LayoutAnimation.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>Automatically animates views to their new positions when the
next layout happens.</p><p>A common way to use this API is to call <code>LayoutAnimation.configureNext</code>
before calling <code>setState</code>.</p></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/layoutanimation.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="configurenext"></a><span class="propType">static </span>configureNext<span class="propType">(config, onAnimationDidEnd?)</span> <a class="hash-link" href="docs/layoutanimation.html#configurenext">#</a></h4><div><p>Schedules an animation to happen on the next layout.</p><p>@param config Specifies animation properties:</p><ul><li><code>duration</code> in milliseconds</li><li><code>create</code>, config for animating in new views (see <code>Anim</code> type)</li><li><code>update</code>, config for animating views that have been updated
(see <code>Anim</code> type)</li></ul><p>@param onAnimationDidEnd Called when the animation finished.
Only supported on iOS.
@param onError Called on error. Only supported on iOS.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="create"></a><span class="propType">static </span>create<span class="propType">(duration, type, creationProp)</span> <a class="hash-link" href="docs/layoutanimation.html#create">#</a></h4><div><p>Helper for creating a config for <code>configureNext</code>.</p></div></div></div></span><span><h3><a class="anchor" name="properties"></a>Properties <a class="hash-link" href="docs/layoutanimation.html#properties">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="types"></a>Types<span class="propType">: CallExpression</span> <a class="hash-link" href="docs/layoutanimation.html#types">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="properties"></a>Properties<span class="propType">: CallExpression</span> <a class="hash-link" href="docs/layoutanimation.html#properties">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="configchecker"></a>configChecker<span class="propType">: CallExpression</span> <a class="hash-link" href="docs/layoutanimation.html#configchecker">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="presets"></a>Presets<span class="propType">: ObjectExpression</span> <a class="hash-link" href="docs/layoutanimation.html#presets">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="easeineaseout"></a>easeInEaseOut<span class="propType">: CallExpression</span> <a class="hash-link" href="docs/layoutanimation.html#easeineaseout">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="linear"></a>linear<span class="propType">: CallExpression</span> <a class="hash-link" href="docs/layoutanimation.html#linear">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="spring"></a>spring<span class="propType">: CallExpression</span> <a class="hash-link" href="docs/layoutanimation.html#spring">#</a></h4></div></div></span></div><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/layoutanimation.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.28-stable/Examples/UIExplorer/LayoutAnimationExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

const React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const <span class="token punctuation">{</span>
  LayoutAnimation<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  TouchableOpacity<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

const AddRemoveExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>

  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      views<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">componentWillUpdate<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    LayoutAnimation<span class="token punctuation">.</span><span class="token function">easeInEaseOut<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_onPressAddView<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">(</span>state<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">(</span><span class="token punctuation">{</span>views<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>views<span class="token punctuation">,</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_onPressRemoveView<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">(</span>state<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">(</span><span class="token punctuation">{</span>views<span class="token punctuation">:</span> state<span class="token punctuation">.</span>views<span class="token punctuation">.</span><span class="token function">slice<span class="token punctuation">(</span></span><span class="token number">0</span><span class="token punctuation">,</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    const views <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>views<span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>view<span class="token punctuation">,</span> i<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span>
      &lt;View key<span class="token operator">=</span><span class="token punctuation">{</span>i<span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>view<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span>i<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;TouchableOpacity onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onPressAddView<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>Add view&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableOpacity<span class="token operator">&gt;</span>
        &lt;TouchableOpacity onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onPressRemoveView<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>Remove view&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableOpacity<span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>viewContainer<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span>views<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

const GreenSquare <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span>
  &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>greenSquare<span class="token punctuation">}</span><span class="token operator">&gt;</span>
    &lt;Text<span class="token operator">&gt;</span>Green square&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
  &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span><span class="token punctuation">;</span>

const BlueSquare <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span>
  &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>blueSquare<span class="token punctuation">}</span><span class="token operator">&gt;</span>
    &lt;Text<span class="token operator">&gt;</span>Blue square&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
  &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span><span class="token punctuation">;</span>

const CrossFadeExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>

  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      toggled<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_onPressToggle<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    LayoutAnimation<span class="token punctuation">.</span><span class="token function">easeInEaseOut<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">(</span>state<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">(</span><span class="token punctuation">{</span>toggled<span class="token punctuation">:</span> <span class="token operator">!</span>state<span class="token punctuation">.</span>toggled<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;TouchableOpacity onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onPressToggle<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>Toggle&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableOpacity<span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>viewContainer<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>toggled <span class="token operator">?</span>
            &lt;GreenSquare <span class="token operator">/</span><span class="token operator">&gt;</span> <span class="token punctuation">:</span>
            &lt;BlueSquare <span class="token operator">/</span><span class="token operator">&gt;</span>
          <span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

const styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  container<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  button<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#eeeeee'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  buttonText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">16</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  viewContainer<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    flexWrap<span class="token punctuation">:</span> <span class="token string">'wrap'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  view<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    height<span class="token punctuation">:</span> <span class="token number">54</span><span class="token punctuation">,</span>
    width<span class="token punctuation">:</span> <span class="token number">54</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">,</span>
    margin<span class="token punctuation">:</span> <span class="token number">8</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  greenSquare<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> <span class="token number">150</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">150</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'green'</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  blueSquare<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> <span class="token number">150</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">150</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'blue'</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'Layout Animation'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Layout animation'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Add and remove views'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;AddRemoveExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Cross fade views'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;CrossFadeExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">;</span></div></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/linking.html#content">Next →</a></div>