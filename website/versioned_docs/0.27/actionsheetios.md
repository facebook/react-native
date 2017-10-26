---
id: actionsheetios
title: actionsheetios
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="actionsheetios"></a>ActionSheetIOS <a class="hash-link" href="docs/actionsheetios.html#actionsheetios">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.27-stable/Libraries/ActionSheetIOS/ActionSheetIOS.js">Edit on GitHub</a></td></tr></tbody></table><div><div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/actionsheetios.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="showactionsheetwithoptions"></a><span class="propType">static </span>showActionSheetWithOptions<span class="propType">(options, callback)</span> <a class="hash-link" href="docs/actionsheetios.html#showactionsheetwithoptions">#</a></h4><div><p>Display an iOS action sheet. The <code>options</code> object must contain one or more
of:</p><ul><li><code>options</code> (array of strings) - a list of button titles (required)</li><li><code>cancelButtonIndex</code> (int) - index of cancel button in <code>options</code></li><li><code>destructiveButtonIndex</code> (int) - index of destructive button in <code>options</code></li><li><code>title</code> (string) - a title to show above the action sheet</li><li><code>message</code> (string) - a message to show below the title</li></ul></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="showshareactionsheetwithoptions"></a><span class="propType">static </span>showShareActionSheetWithOptions<span class="propType">(options, failureCallback, successCallback)</span> <a class="hash-link" href="docs/actionsheetios.html#showshareactionsheetwithoptions">#</a></h4><div><p>Display the iOS share sheet. The <code>options</code> object should contain
one or both of:</p><ul><li><code>message</code> (string) - a message to share</li><li><code>url</code> (string) - a URL to share</li></ul><p>NOTE: if <code>url</code> points to a local file, or is a base64-encoded
uri, the file it points to will be loaded and shared directly.
In this way, you can share images, videos, PDF files, etc.</p></div></div></div></span></div><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/actionsheetios.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.27-stable/Examples/UIExplorer/ActionSheetIOSExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  ActionSheetIOS<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  UIManager<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

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
      url<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>url<span class="token punctuation">,</span>
      message<span class="token punctuation">:</span> <span class="token string">'message to go with the shared url'</span><span class="token punctuation">,</span>
      subject<span class="token punctuation">:</span> <span class="token string">'a subject to go in the email heading'</span><span class="token punctuation">,</span>
      excludedActivityTypes<span class="token punctuation">:</span> <span class="token punctuation">[</span>
        <span class="token string">'com.apple.UIKit.activity.PostToTwitter'</span>
      <span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">(</span>error<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token function">alert<span class="token punctuation">(</span></span>error<span class="token punctuation">)</span><span class="token punctuation">,</span>
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

<span class="token keyword">var</span> ShareScreenshotExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
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
   <span class="token comment" spellcheck="true"> // Take the snapshot (returns a temp file uri)
</span>    UIManager<span class="token punctuation">.</span><span class="token function">takeSnapshot<span class="token punctuation">(</span></span><span class="token string">'window'</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">then<span class="token punctuation">(</span></span><span class="token punctuation">(</span>uri<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
     <span class="token comment" spellcheck="true"> // Share image data
</span>      ActionSheetIOS<span class="token punctuation">.</span><span class="token function">showShareActionSheetWithOptions<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
        url<span class="token punctuation">:</span> uri<span class="token punctuation">,</span>
        excludedActivityTypes<span class="token punctuation">:</span> <span class="token punctuation">[</span>
          <span class="token string">'com.apple.UIKit.activity.PostToTwitter'</span>
        <span class="token punctuation">]</span>
      <span class="token punctuation">}</span><span class="token punctuation">,</span>
      <span class="token punctuation">(</span>error<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token function">alert<span class="token punctuation">(</span></span>error<span class="token punctuation">)</span><span class="token punctuation">,</span>
      <span class="token punctuation">(</span>success<span class="token punctuation">,</span> method<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">var</span> text<span class="token punctuation">;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>success<span class="token punctuation">)</span> <span class="token punctuation">{</span>
          text <span class="token operator">=</span> `Shared via $<span class="token punctuation">{</span>method<span class="token punctuation">}</span>`<span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
          text <span class="token operator">=</span> <span class="token string">'You didn\'t share'</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>text<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token keyword">catch</span><span class="token punctuation">(</span><span class="token punctuation">(</span>error<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token function">alert<span class="token punctuation">(</span></span>error<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
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
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;ShareActionSheetExample url<span class="token operator">=</span><span class="token string">"https://code.facebook.com"</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Share Local Image'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;ShareActionSheetExample url<span class="token operator">=</span><span class="token string">"bunny.png"</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Share Screenshot'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;ShareScreenshotExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/alert.html#content">Next →</a></div>