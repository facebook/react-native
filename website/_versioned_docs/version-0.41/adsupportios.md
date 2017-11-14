---
id: version-0.41-adsupportios
original_id: adsupportios
title: adsupportios
---
<a id="content"></a><h1><a class="anchor" name="adsupportios"></a>AdSupportIOS <a class="hash-link" href="docs/adsupportios.html#adsupportios">#</a></h1><div><div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/adsupportios.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="getadvertisingid"></a><span class="methodType">static </span>getAdvertisingId<span class="methodType">(onSuccess, onFailure)</span> <a class="hash-link" href="docs/adsupportios.html#getadvertisingid">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="getadvertisingtrackingenabled"></a><span class="methodType">static </span>getAdvertisingTrackingEnabled<span class="methodType">(onSuccess, onFailure)</span> <a class="hash-link" href="docs/adsupportios.html#getadvertisingtrackingenabled">#</a></h4></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/AdSupport/AdSupportIOS.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/adsupportios.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/AdSupportIOSExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  AdSupportIOS<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>framework <span class="token operator">=</span> <span class="token string">'React'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'Advertising ID'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Example of using the ad support API.'</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Ad Support IOS'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;AdSupportIOSExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span>

class <span class="token class-name">AdSupportIOSExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    deviceID<span class="token punctuation">:</span> <span class="token string">'No IDFA yet'</span><span class="token punctuation">,</span>
    hasAdvertiserTracking<span class="token punctuation">:</span> <span class="token string">'unset'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">componentDidMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    AdSupportIOS<span class="token punctuation">.</span><span class="token function">getAdvertisingId<span class="token punctuation">(</span></span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>_onDeviceIDSuccess<span class="token punctuation">,</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>_onDeviceIDFailure
    <span class="token punctuation">)</span><span class="token punctuation">;</span>

    AdSupportIOS<span class="token punctuation">.</span><span class="token function">getAdvertisingTrackingEnabled<span class="token punctuation">(</span></span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>_onHasTrackingSuccess<span class="token punctuation">,</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>_onHasTrackingFailure
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  _onHasTrackingSuccess <span class="token operator">=</span> <span class="token punctuation">(</span>hasTracking<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      <span class="token string">'hasAdvertiserTracking'</span><span class="token punctuation">:</span> hasTracking<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _onHasTrackingFailure <span class="token operator">=</span> <span class="token punctuation">(</span>e<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      <span class="token string">'hasAdvertiserTracking'</span><span class="token punctuation">:</span> <span class="token string">'Error!'</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _onDeviceIDSuccess <span class="token operator">=</span> <span class="token punctuation">(</span>deviceID<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      <span class="token string">'deviceID'</span><span class="token punctuation">:</span> deviceID<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _onDeviceIDFailure <span class="token operator">=</span> <span class="token punctuation">(</span>e<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      <span class="token string">'deviceID'</span><span class="token punctuation">:</span> <span class="token string">'Error!'</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>title<span class="token punctuation">}</span><span class="token operator">&gt;</span>Advertising ID<span class="token punctuation">:</span> &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          <span class="token punctuation">{</span>JSON<span class="token punctuation">.</span><span class="token function">stringify<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>deviceID<span class="token punctuation">)</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>title<span class="token punctuation">}</span><span class="token operator">&gt;</span>Has Advertiser Tracking<span class="token punctuation">:</span> &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          <span class="token punctuation">{</span>JSON<span class="token punctuation">.</span><span class="token function">stringify<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>hasAdvertiserTracking<span class="token punctuation">)</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'500'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22AdSupportIOS%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/actionsheetios.html#content">← Prev</a><a class="docs-next" href="docs/alert.html#content">Next →</a></div>