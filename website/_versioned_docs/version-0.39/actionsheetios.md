---
id: version-0.39-actionsheetios
original_id: actionsheetios
title: actionsheetios
---
<a id="content"></a><h1><a class="anchor" name="actionsheetios"></a>ActionSheetIOS <a class="hash-link" href="docs/actionsheetios.html#actionsheetios">#</a></h1><div><div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/actionsheetios.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="showactionsheetwithoptions"></a><span class="methodType">static </span>showActionSheetWithOptions<span class="methodType">(options, callback)</span> <a class="hash-link" href="docs/actionsheetios.html#showactionsheetwithoptions">#</a></h4><div><p>Display an iOS action sheet. The <code>options</code> object must contain one or more
of:</p><ul><li><code>options</code> (array of strings) - a list of button titles (required)</li><li><code>cancelButtonIndex</code> (int) - index of cancel button in <code>options</code></li><li><code>destructiveButtonIndex</code> (int) - index of destructive button in <code>options</code></li><li><code>title</code> (string) - a title to show above the action sheet</li><li><code>message</code> (string) - a message to show below the title</li></ul></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="showshareactionsheetwithoptions"></a><span class="methodType">static </span>showShareActionSheetWithOptions<span class="methodType">(options, failureCallback, successCallback)</span> <a class="hash-link" href="docs/actionsheetios.html#showshareactionsheetwithoptions">#</a></h4><div><p>Display the iOS share sheet. The <code>options</code> object should contain
one or both of <code>message</code> and <code>url</code> and can additionally have
a <code>subject</code> or <code>excludedActivityTypes</code>:</p><ul><li><code>url</code> (string) - a URL to share</li><li><code>message</code> (string) - a message to share</li><li><code>subject</code> (string) - a subject for the message</li><li><code>excludedActivityTypes</code> (array) - the activities to exclude from the ActionSheet</li></ul><p>NOTE: if <code>url</code> points to a local file, or is a base64-encoded
uri, the file it points to will be loaded and shared directly.
In this way, you can share images, videos, PDF files, etc.</p></div></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/ActionSheetIOS/ActionSheetIOS.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/actionsheetios.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/ActionSheetIOSExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

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

class <span class="token class-name">ActionSheetExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    clicked<span class="token punctuation">:</span> <span class="token string">'none'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

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
  <span class="token punctuation">}</span>

  showActionSheet <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    ActionSheetIOS<span class="token punctuation">.</span><span class="token function">showActionSheetWithOptions<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      options<span class="token punctuation">:</span> BUTTONS<span class="token punctuation">,</span>
      cancelButtonIndex<span class="token punctuation">:</span> CANCEL_INDEX<span class="token punctuation">,</span>
      destructiveButtonIndex<span class="token punctuation">:</span> DESTRUCTIVE_INDEX<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">(</span>buttonIndex<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span> clicked<span class="token punctuation">:</span> BUTTONS<span class="token punctuation">[</span>buttonIndex<span class="token punctuation">]</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

class <span class="token class-name">ActionSheetTintExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    clicked<span class="token punctuation">:</span> <span class="token string">'none'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

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
  <span class="token punctuation">}</span>

  showActionSheet <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    ActionSheetIOS<span class="token punctuation">.</span><span class="token function">showActionSheetWithOptions<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      options<span class="token punctuation">:</span> BUTTONS<span class="token punctuation">,</span>
      cancelButtonIndex<span class="token punctuation">:</span> CANCEL_INDEX<span class="token punctuation">,</span>
      destructiveButtonIndex<span class="token punctuation">:</span> DESTRUCTIVE_INDEX<span class="token punctuation">,</span>
      tintColor<span class="token punctuation">:</span> <span class="token string">'green'</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">(</span>buttonIndex<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span> clicked<span class="token punctuation">:</span> BUTTONS<span class="token punctuation">[</span>buttonIndex<span class="token punctuation">]</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

class <span class="token class-name">ShareActionSheetExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    text<span class="token punctuation">:</span> <span class="token string">''</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

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
  <span class="token punctuation">}</span>

  showShareActionSheet <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
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
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

class <span class="token class-name">ShareScreenshotExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    text<span class="token punctuation">:</span> <span class="token string">''</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

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
  <span class="token punctuation">}</span>

  showShareActionSheet <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
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
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

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
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;ActionSheetExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Show Action Sheet with tinted buttons'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;ActionSheetTintExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Show Share Action Sheet'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;ShareActionSheetExample url<span class="token operator">=</span><span class="token string">"https://code.facebook.com"</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Share Local Image'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;ShareActionSheetExample url<span class="token operator">=</span><span class="token string">"bunny.png"</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Share Screenshot'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;ShareScreenshotExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22ActionSheetIOS%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/webview.html#content">← Prev</a><a class="docs-next" href="docs/adsupportios.html#content">Next →</a></div>