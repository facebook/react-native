---
id: statusbar
title: statusbar
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="statusbar"></a>StatusBar <a class="hash-link" href="undefined#statusbar">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/StatusBar/StatusBar.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>Component to control the app status bar.</p><h3><a class="anchor" name="usage-with-navigator"></a>Usage with Navigator <a class="hash-link" href="undefined#usage-with-navigator">#</a></h3><p>It is possible to have multiple <code>StatusBar</code> components mounted at the same
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
 &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span></div></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="undefined#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="animated"></a>animated <span class="propType">bool</span> <a class="hash-link" href="undefined#animated">#</a></h4><div><p>If the transition between status bar property changes should be animated.
Supported for backgroundColor, barStyle and hidden.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="hidden"></a>hidden <span class="propType">bool</span> <a class="hash-link" href="undefined#hidden">#</a></h4><div><p>If the status bar is hidden.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="backgroundcolor"></a><span class="platform">android</span>backgroundColor <span class="propType"><a href="colors.html">color</a></span> <a class="hash-link" href="undefined#backgroundcolor">#</a></h4><div><p>The background color of the status bar.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="translucent"></a><span class="platform">android</span>translucent <span class="propType">bool</span> <a class="hash-link" href="undefined#translucent">#</a></h4><div><p>If the status bar is translucent.
When translucent is set to true, the app will draw under the status bar.
This is useful when using a semi transparent status bar color.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="barstyle"></a><span class="platform">ios</span>barStyle <span class="propType">enum('default', 'light-content')</span> <a class="hash-link" href="undefined#barstyle">#</a></h4><div><p>Sets the color of the status bar text.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="networkactivityindicatorvisible"></a><span class="platform">ios</span>networkActivityIndicatorVisible <span class="propType">bool</span> <a class="hash-link" href="undefined#networkactivityindicatorvisible">#</a></h4><div><p>If the network activity indicator should be visible.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="showhidetransition"></a><span class="platform">ios</span>showHideTransition <span class="propType">enum('fade', 'slide')</span> <a class="hash-link" href="undefined#showhidetransition">#</a></h4><div><p>The transition effect when showing and hiding the status bar using the <code>hidden</code>
prop. Defaults to 'fade'.</p></div></div></div></div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="undefined#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/StatusBarExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

const React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const <span class="token punctuation">{</span>
  StyleSheet<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  StatusBar<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>

type BarStyle <span class="token operator">=</span> <span class="token string">'default'</span> <span class="token operator">|</span> <span class="token string">'light-content'</span><span class="token punctuation">;</span>
type ShowHideTransition <span class="token operator">=</span> <span class="token string">'fade'</span> <span class="token operator">|</span> <span class="token string">'slide'</span><span class="token punctuation">;</span>

type State <span class="token operator">=</span> <span class="token punctuation">{</span>
  animated<span class="token punctuation">:</span> boolean<span class="token punctuation">,</span>
  backgroundColor<span class="token punctuation">:</span> string<span class="token punctuation">,</span>
  hidden<span class="token operator">?</span><span class="token punctuation">:</span> boolean<span class="token punctuation">,</span>
  showHideTransition<span class="token punctuation">:</span> ShowHideTransition<span class="token punctuation">,</span>
  translucent<span class="token operator">?</span><span class="token punctuation">:</span> boolean<span class="token punctuation">,</span>
  barStyle<span class="token operator">?</span><span class="token punctuation">:</span> BarStyle<span class="token punctuation">,</span>
  networkActivityIndicatorVisible<span class="token operator">?</span><span class="token punctuation">:</span> boolean
<span class="token punctuation">}</span><span class="token punctuation">;</span>

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

const StatusBarExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> State <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      animated<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
      backgroundColor<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_getValue<span class="token punctuation">(</span></span>colors<span class="token punctuation">,</span> <span class="token number">0</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
      showHideTransition<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_getValue<span class="token punctuation">(</span></span>showHideTransitions<span class="token punctuation">,</span> <span class="token number">0</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _colorIndex<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
  _barStyleIndex<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
  _showHideTransitionIndex<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>

  <span class="token function">_getValue<span class="token punctuation">(</span></span>values<span class="token punctuation">:</span> Array&lt;any<span class="token operator">&gt;</span><span class="token punctuation">,</span> index<span class="token punctuation">:</span> number<span class="token punctuation">)</span><span class="token punctuation">:</span> any <span class="token punctuation">{</span>
    <span class="token keyword">return</span> values<span class="token punctuation">[</span>index <span class="token operator">%</span> values<span class="token punctuation">.</span>length<span class="token punctuation">]</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;StatusBar
          backgroundColor<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>backgroundColor<span class="token punctuation">}</span>
          translucent<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>translucent<span class="token punctuation">}</span>
          hidden<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>hidden<span class="token punctuation">}</span>
          showHideTransition<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>showHideTransition<span class="token punctuation">}</span>
          animated<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated<span class="token punctuation">}</span>
          barStyle<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>barStyle<span class="token punctuation">}</span>
          networkActivityIndicatorVisible<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>networkActivityIndicatorVisible<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TouchableHighlight
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>animated<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text<span class="token operator">&gt;</span>animated<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animated <span class="token operator">?</span> <span class="token string">'true'</span> <span class="token punctuation">:</span> <span class="token string">'false'</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TouchableHighlight
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>hidden<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>hidden<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text<span class="token operator">&gt;</span>hidden<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>hidden <span class="token operator">?</span> <span class="token string">'true'</span> <span class="token punctuation">:</span> <span class="token string">'false'</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>title<span class="token punctuation">}</span><span class="token operator">&gt;</span>iOS&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TouchableHighlight
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
              <span class="token keyword">this</span><span class="token punctuation">.</span>_barStyleIndex<span class="token operator">++</span><span class="token punctuation">;</span>
              <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>barStyle<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_getValue<span class="token punctuation">(</span></span>barStyles<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_barStyleIndex<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text<span class="token operator">&gt;</span>style<span class="token punctuation">:</span> <span class="token string">'{this._getValue(barStyles, this._barStyleIndex)}'</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TouchableHighlight
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
              networkActivityIndicatorVisible<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>networkActivityIndicatorVisible<span class="token punctuation">,</span>
            <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text<span class="token operator">&gt;</span>
                networkActivityIndicatorVisible<span class="token punctuation">:</span>
                <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>networkActivityIndicatorVisible <span class="token operator">?</span> <span class="token string">'true'</span> <span class="token punctuation">:</span> <span class="token string">'false'</span><span class="token punctuation">}</span>
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TouchableHighlight
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
              <span class="token keyword">this</span><span class="token punctuation">.</span>_showHideTransitionIndex<span class="token operator">++</span><span class="token punctuation">;</span>
              <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
                showHideTransition<span class="token punctuation">:</span>
                <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_getValue<span class="token punctuation">(</span></span>showHideTransitions<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_showHideTransitionIndex<span class="token punctuation">)</span><span class="token punctuation">,</span>
              <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text<span class="token operator">&gt;</span>
                showHideTransition<span class="token punctuation">:</span>
                <span class="token string">'{this._getValue(showHideTransitions, this._showHideTransitionIndex)}'</span>
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>title<span class="token punctuation">}</span><span class="token operator">&gt;</span>Android&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TouchableHighlight
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
              <span class="token keyword">this</span><span class="token punctuation">.</span>_colorIndex<span class="token operator">++</span><span class="token punctuation">;</span>
              <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_getValue<span class="token punctuation">(</span></span>colors<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_colorIndex<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text<span class="token operator">&gt;</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'{this._getValue(colors, this._colorIndex)}'</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TouchableHighlight
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
              <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
                translucent<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>translucent<span class="token punctuation">,</span>
                backgroundColor<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>translucent <span class="token operator">?</span> <span class="token string">'rgba(0, 0, 0, 0.4)'</span> <span class="token punctuation">:</span> <span class="token string">'black'</span><span class="token punctuation">,</span>
              <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text<span class="token operator">&gt;</span>translucent<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>translucent <span class="token operator">?</span> <span class="token string">'true'</span> <span class="token punctuation">:</span> <span class="token string">'false'</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Status Bar'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;StatusBarExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">;</span>

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
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="switch.html#content">Next →</a></div>