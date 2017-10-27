---
id: version-0.35-keyboardavoidingview
title: keyboardavoidingview
original_id: keyboardavoidingview
---
<a id="content"></a><h1><a class="anchor" name="keyboardavoidingview"></a>KeyboardAvoidingView <a class="hash-link" href="docs/keyboardavoidingview.html#keyboardavoidingview">#</a></h1><div><div><p>It is a component to solve the common problem of views that need to move out of the way of the virtual keyboard.
It can automatically adjust either its position or bottom padding based on the position of the keyboard.</p></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/keyboardavoidingview.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="docs/view.html#props">View props...</a> <a class="hash-link" href="docs/keyboardavoidingview.html#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="behavior"></a>behavior <span class="propType">PropTypes.oneOf(['height', 'position', 'padding'])</span> <a class="hash-link" href="docs/keyboardavoidingview.html#behavior">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="contentcontainerstyle"></a>contentContainerStyle <span class="propType"><a href="docs/view.html#style">View#style</a></span> <a class="hash-link" href="docs/keyboardavoidingview.html#contentcontainerstyle">#</a></h4><div><p>The style of the content container(View) when behavior is 'position'.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="keyboardverticaloffset"></a>keyboardVerticalOffset <span class="propType">PropTypes.number.isRequired</span> <a class="hash-link" href="docs/keyboardavoidingview.html#keyboardverticaloffset">#</a></h4><div><p>This is the distance between the top of the user screen and the react native view,
may be non-zero in some use cases.</p></div></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/keyboardavoidingview.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="relativekeyboardheight"></a>relativeKeyboardHeight<span class="methodType">(keyboardFrame): </span> <a class="hash-link" href="docs/keyboardavoidingview.html#relativekeyboardheight">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="onkeyboardchange"></a>onKeyboardChange<span class="methodType">(event)</span> <a class="hash-link" href="docs/keyboardavoidingview.html#onkeyboardchange">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="onlayout"></a>onLayout<span class="methodType">(event)</span> <a class="hash-link" href="docs/keyboardavoidingview.html#onlayout">#</a></h4></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/Keyboard/KeyboardAvoidingView.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/keyboardavoidingview.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/KeyboardAvoidingViewExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

const React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'React'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const <span class="token punctuation">{</span>
  KeyboardAvoidingView<span class="token punctuation">,</span>
  Modal<span class="token punctuation">,</span>
  SegmentedControlIOS<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TextInput<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

const UIExplorerBlock <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./UIExplorerBlock'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const UIExplorerPage <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./UIExplorerPage'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

class <span class="token class-name">KeyboardAvoidingViewExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  static title <span class="token operator">=</span> <span class="token string">'&lt;KeyboardAvoidingView&gt;'</span><span class="token punctuation">;</span>
  static description <span class="token operator">=</span> <span class="token string">'Base component for views that automatically adjust their height or position to move out of the way of the keyboard.'</span><span class="token punctuation">;</span>

  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    behavior<span class="token punctuation">:</span> <span class="token string">'padding'</span><span class="token punctuation">,</span>
    modalOpen<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  onSegmentChange <span class="token operator">=</span> <span class="token punctuation">(</span>segment<span class="token punctuation">:</span> String<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>behavior<span class="token punctuation">:</span> segment<span class="token punctuation">.</span><span class="token function">toLowerCase<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  renderExample <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>outerContainer<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Modal animationType<span class="token operator">=</span><span class="token string">"fade"</span> visible<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>modalOpen<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;KeyboardAvoidingView behavior<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>behavior<span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;SegmentedControlIOS
              onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>onSegmentChange<span class="token punctuation">}</span>
              selectedIndex<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>behavior <span class="token operator">===</span> <span class="token string">'padding'</span> <span class="token operator">?</span> <span class="token number">0</span> <span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">}</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>segment<span class="token punctuation">}</span>
              values<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span><span class="token string">'Padding'</span><span class="token punctuation">,</span> <span class="token string">'Position'</span><span class="token punctuation">]</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
            &lt;TextInput
              placeholder<span class="token operator">=</span><span class="token string">"&lt;TextInput /&gt;"</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>textInput<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>KeyboardAvoidingView<span class="token operator">&gt;</span>
          &lt;TouchableHighlight
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>modalOpen<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>closeButton<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>Close&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>Modal<span class="token operator">&gt;</span>

        &lt;TouchableHighlight onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>modalOpen<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>Open Example&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;UIExplorerPage title<span class="token operator">=</span><span class="token string">"Keyboard Avoiding View"</span><span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Keyboard-avoiding views move out of the way of the keyboard."</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">renderExample<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>UIExplorerPage<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

const styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  outerContainer<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  container<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    paddingHorizontal<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
    paddingTop<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  textInput<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    borderWidth<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">44</span><span class="token punctuation">,</span>
    paddingHorizontal<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  segment<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  closeButton<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    position<span class="token punctuation">:</span> <span class="token string">'absolute'</span><span class="token punctuation">,</span>
    top<span class="token punctuation">:</span> <span class="token number">30</span><span class="token punctuation">,</span>
    left<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

module<span class="token punctuation">.</span>exports <span class="token operator">=</span> KeyboardAvoidingViewExample<span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22KeyboardAvoidingView%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/image.html#content">← Prev</a><a class="docs-next" href="docs/listview.html#content">Next →</a></div>