---
id: version-0.40-share
title: share
original_id: share
---
<a id="content"></a><h1><a class="anchor" name="share"></a>Share <a class="hash-link" href="docs/share.html#share">#</a></h1><div><div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/share.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="share"></a><span class="methodType">static </span>share<span class="methodType">(content, options)</span> <a class="hash-link" href="docs/share.html#share">#</a></h4><div><p>Open a dialog to share text content.</p><p>In iOS, Returns a Promise which will be invoked an object containing <code>action</code>, <code>activityType</code>.
If the user dismissed the dialog, the Promise will still be resolved with action being <code>Share.dismissedAction</code>
and all the other keys being undefined.</p><p>In Android, Returns a Promise which always be resolved with action being <code>Share.sharedAction</code>.</p><h3><a class="anchor" name="content"></a>Content <a class="hash-link" href="docs/share.html#content">#</a></h3><ul><li><code>message</code> - a message to share</li><li><code>title</code> - title of the message</li></ul><h4><a class="anchor" name="ios"></a>iOS <a class="hash-link" href="docs/share.html#ios">#</a></h4><ul><li><code>url</code> - an URL to share</li></ul><p>At least one of URL and message is required.</p><h3><a class="anchor" name="options"></a>Options <a class="hash-link" href="docs/share.html#options">#</a></h3><h4><a class="anchor" name="ios"></a>iOS <a class="hash-link" href="docs/share.html#ios">#</a></h4><ul><li><code>excludedActivityTypes</code></li><li><code>tintColor</code></li></ul><h4><a class="anchor" name="android"></a>Android <a class="hash-link" href="docs/share.html#android">#</a></h4><ul><li><code>dialogTitle</code></li></ul></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="sharedaction"></a><span class="methodType">static </span>sharedAction<span class="methodType">(0)</span> <a class="hash-link" href="docs/share.html#sharedaction">#</a></h4><div><p>The content was successfully shared.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="dismissedaction"></a><span class="methodType">static </span>dismissedAction<span class="methodType">(0)</span> <a class="hash-link" href="docs/share.html#dismissedaction">#</a></h4><div><p>The dialog has been dismissed.
@platform ios</p></div></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Share/Share.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/share.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/ShareExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  StyleSheet<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  Share<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>framework <span class="token operator">=</span> <span class="token string">'React'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'Share'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Share data with other Apps.'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Share Text Content'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;ShareMessageExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">;</span>

class <span class="token class-name">ShareMessageExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  _shareMessage<span class="token punctuation">:</span> Function<span class="token punctuation">;</span>
  _shareText<span class="token punctuation">:</span> Function<span class="token punctuation">;</span>
  _showResult<span class="token punctuation">:</span> Function<span class="token punctuation">;</span>
  state<span class="token punctuation">:</span> any<span class="token punctuation">;</span>

  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">this</span><span class="token punctuation">.</span>_shareMessage <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_shareMessage<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_shareText <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_shareText<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_showResult <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_showResult<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>
      result<span class="token punctuation">:</span> <span class="token string">''</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;TouchableHighlight style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_shareMessage<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>Click to share message&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_shareText<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>Click to share message<span class="token punctuation">,</span> URL and title&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>result<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">_shareMessage<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    Share<span class="token punctuation">.</span><span class="token function">share<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      message<span class="token punctuation">:</span> <span class="token string">'React Native | A framework for building native apps using React'</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span>
    <span class="token punctuation">.</span><span class="token function">then<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>_showResult<span class="token punctuation">)</span>
    <span class="token punctuation">.</span><span class="token keyword">catch</span><span class="token punctuation">(</span><span class="token punctuation">(</span>error<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>result<span class="token punctuation">:</span> <span class="token string">'error: '</span> <span class="token operator">+</span> error<span class="token punctuation">.</span>message<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">_shareText<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    Share<span class="token punctuation">.</span><span class="token function">share<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      message<span class="token punctuation">:</span> <span class="token string">'A framework for building native apps using React'</span><span class="token punctuation">,</span>
      url<span class="token punctuation">:</span> <span class="token string">'http://facebook.github.io/react-native/'</span><span class="token punctuation">,</span>
      title<span class="token punctuation">:</span> <span class="token string">'React Native'</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
      dialogTitle<span class="token punctuation">:</span> <span class="token string">'Share React Native website'</span><span class="token punctuation">,</span>
      excludedActivityTypes<span class="token punctuation">:</span> <span class="token punctuation">[</span>
        <span class="token string">'com.apple.UIKit.activity.PostToTwitter'</span>
      <span class="token punctuation">]</span><span class="token punctuation">,</span>
      tintColor<span class="token punctuation">:</span> <span class="token string">'green'</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span>
    <span class="token punctuation">.</span><span class="token function">then<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>_showResult<span class="token punctuation">)</span>
    <span class="token punctuation">.</span><span class="token keyword">catch</span><span class="token punctuation">(</span><span class="token punctuation">(</span>error<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>result<span class="token punctuation">:</span> <span class="token string">'error: '</span> <span class="token operator">+</span> error<span class="token punctuation">.</span>message<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">_showResult<span class="token punctuation">(</span></span>result<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>result<span class="token punctuation">.</span>action <span class="token operator">===</span> Share<span class="token punctuation">.</span>sharedAction<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">if</span> <span class="token punctuation">(</span>result<span class="token punctuation">.</span>activityType<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>result<span class="token punctuation">:</span> <span class="token string">'shared with an activityType: '</span> <span class="token operator">+</span> result<span class="token punctuation">.</span>activityType<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>result<span class="token punctuation">:</span> <span class="token string">'shared'</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>result<span class="token punctuation">.</span>action <span class="token operator">===</span> Share<span class="token punctuation">.</span>dismissedAction<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>result<span class="token punctuation">:</span> <span class="token string">'dismissed'</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

<span class="token punctuation">}</span>


<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  wrapper<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  button<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#eeeeee'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22Share%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/settings.html#content">← Prev</a><a class="docs-next" href="docs/statusbarios.html#content">Next →</a></div>