---
id: vibrationios
title: vibrationios
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="vibrationios"></a>VibrationIOS <a class="hash-link" href="docs/vibrationios.html#vibrationios">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Vibration/VibrationIOS.ios.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>NOTE: <code>VibrationIOS</code> is being deprecated. Use <code>Vibration</code> instead.</p><p>The Vibration API is exposed at <code>VibrationIOS.vibrate()</code>. On iOS, calling this
function will trigger a one second vibration. The vibration is asynchronous
so this method will return immediately.</p><p>There will be no effect on devices that do not support Vibration, eg. the iOS
simulator.</p><p>Vibration patterns are currently unsupported.</p></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/vibrationios.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="vibrate"></a><span class="propType">static </span>vibrate<span class="propType">()</span> <a class="hash-link" href="docs/vibrationios.html#vibrate">#</a></h4><div><p>@deprecated</p></div></div></div></span></div><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/vibrationios.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/VibrationIOSExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  StyleSheet<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  VibrationIOS
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>framework <span class="token operator">=</span> <span class="token string">'React'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'VibrationIOS'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Vibration API for iOS'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'VibrationIOS.vibrate()'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;TouchableHighlight
        style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
        onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> VibrationIOS<span class="token punctuation">.</span><span class="token function">vibrate<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>Vibrate&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  wrapper<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  button<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#eeeeee'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/vibration.html#content">Next →</a></div>