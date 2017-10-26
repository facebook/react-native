---
id: actionsheetios
title: actionsheetios
---
<a id="content"></a><h1>ActionSheetIOS</h1><div><div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="showactionsheetwithoptions"></a><span class="propType">static </span>showActionSheetWithOptions<span class="propType">(options: Object, callback: Function)</span> <a class="hash-link" href="#showactionsheetwithoptions">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="showshareactionsheetwithoptions"></a><span class="propType">static </span>showShareActionSheetWithOptions<span class="propType">(options: Object, failureCallback: Function, successCallback: Function)</span> <a class="hash-link" href="#showshareactionsheetwithoptions">#</a></h4></div></div></span></div><div><h3><a class="anchor" name="examples"></a><a class="edit-github" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/ActionSheetIOSExample.js">Edit on GitHub</a>Examples <a class="hash-link" href="#examples">#</a></h3><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  ActionSheetIOS<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>

<span class="token keyword">var</span> BUTTONS <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token string">'Option 0'</span><span class="token punctuation">,</span>
  <span class="token string">'Option 1'</span><span class="token punctuation">,</span>
  <span class="token string">'Option 2'</span><span class="token punctuation">,</span>
  <span class="token string">'Delete'</span><span class="token punctuation">,</span>
  <span class="token string">'Cancel'</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> DESTRUCTIVE_INDEX <span class="token operator">=</span> <span class="token number">3</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> CANCEL_INDEX <span class="token operator">=</span> <span class="token number">4</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> ActionSheetExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      clicked<span class="token punctuation">:</span> <span class="token string">'none'</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>showActionSheet<span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>style<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Click to show the ActionSheet
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          Clicked button<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>clicked<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">showActionSheet<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    ActionSheetIOS<span class="token punctuation">.</span><span class="token function">showActionSheetWithOptions<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      options<span class="token punctuation">:</span> BUTTONS<span class="token punctuation">,</span>
      cancelButtonIndex<span class="token punctuation">:</span> CANCEL_INDEX<span class="token punctuation">,</span>
      destructiveButtonIndex<span class="token punctuation">:</span> DESTRUCTIVE_INDEX<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">(</span>buttonIndex<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span> clicked<span class="token punctuation">:</span> BUTTONS<span class="token punctuation">[</span>buttonIndex<span class="token punctuation">]</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> ActionSheetTintExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      clicked<span class="token punctuation">:</span> <span class="token string">'none'</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>showActionSheet<span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>style<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Click to show the ActionSheet
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          Clicked button<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>clicked<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">showActionSheet<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    ActionSheetIOS<span class="token punctuation">.</span><span class="token function">showActionSheetWithOptions<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      options<span class="token punctuation">:</span> BUTTONS<span class="token punctuation">,</span>
      cancelButtonIndex<span class="token punctuation">:</span> CANCEL_INDEX<span class="token punctuation">,</span>
      destructiveButtonIndex<span class="token punctuation">:</span> DESTRUCTIVE_INDEX<span class="token punctuation">,</span>
      tintColor<span class="token punctuation">:</span> <span class="token string">'green'</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">(</span>buttonIndex<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span> clicked<span class="token punctuation">:</span> BUTTONS<span class="token punctuation">[</span>buttonIndex<span class="token punctuation">]</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>


<span class="token keyword">var</span> ShareActionSheetExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      text<span class="token punctuation">:</span> <span class="token string">''</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>showShareActionSheet<span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>style<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Click to show the Share ActionSheet
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>text<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">showShareActionSheet<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    ActionSheetIOS<span class="token punctuation">.</span><span class="token function">showShareActionSheetWithOptions<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      url<span class="token punctuation">:</span> <span class="token string">'https://code.facebook.com'</span><span class="token punctuation">,</span>
      message<span class="token punctuation">:</span> <span class="token string">'message to go with the shared url'</span><span class="token punctuation">,</span>
      subject<span class="token punctuation">:</span> <span class="token string">'a subject to go in the email heading'</span><span class="token punctuation">,</span>
      excludedActivityTypes<span class="token punctuation">:</span> <span class="token punctuation">[</span>
        <span class="token string">'com.apple.UIKit.activity.PostToTwitter'</span>
      <span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">(</span>error<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      console<span class="token punctuation">.</span><span class="token function">error<span class="token punctuation">(</span></span>error<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">(</span>success<span class="token punctuation">,</span> method<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">var</span> text<span class="token punctuation">;</span>
      <span class="token keyword">if</span> <span class="token punctuation">(</span>success<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        text <span class="token operator">=</span> `Shared via $<span class="token punctuation">{</span>method<span class="token punctuation">}</span>`<span class="token punctuation">;</span>
      <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
        text <span class="token operator">=</span> <span class="token string">'You didn\'t share'</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>text<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> style <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  button<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'500'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'ActionSheetIOS'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Interface to show iOS\' action sheets'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Show Action Sheet'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;ActionSheetExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Show Action Sheet with tinted buttons'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;ActionSheetTintExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Show Share Action Sheet'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;ShareActionSheetExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="alert.html#content">Next →</a></div>