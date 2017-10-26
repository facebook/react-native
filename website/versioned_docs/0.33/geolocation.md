---
id: geolocation
title: geolocation
---
<a id="content"></a><h1><a class="anchor" name="geolocation"></a>Geolocation <a class="hash-link" href="docs/geolocation.html#geolocation">#</a></h1><div><div><p>The Geolocation API follows the web spec:
<a href="https://developer.mozilla.org/en-US/docs/Web/API/Geolocation">https://developer.mozilla.org/en-US/docs/Web/API/Geolocation</a></p><h3><a class="anchor" name="ios"></a>iOS <a class="hash-link" href="docs/geolocation.html#ios">#</a></h3><p>You need to include the <code>NSLocationWhenInUseUsageDescription</code> key
in Info.plist to enable geolocation. Geolocation is enabled by default
when you create a project with <code>react-native init</code>.</p><h3><a class="anchor" name="android"></a>Android <a class="hash-link" href="docs/geolocation.html#android">#</a></h3><p>To request access to location, you need to add the following line to your
app's <code>AndroidManifest.xml</code>:</p><p><code>&lt;uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" /&gt;</code></p></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/geolocation.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="getcurrentposition"></a><span class="methodType">static </span>getCurrentPosition<span class="methodType">(geo_success, geo_error?, geo_options?)</span> <a class="hash-link" href="docs/geolocation.html#getcurrentposition">#</a></h4><div><p>Invokes the success callback once with the latest location info.  Supported
options: timeout (ms), maximumAge (ms), enableHighAccuracy (bool)
On Android, this can return almost immediately if the location is cached or
request an update, which might take a while.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="watchposition"></a><span class="methodType">static </span>watchPosition<span class="methodType">(success, error?, options?)</span> <a class="hash-link" href="docs/geolocation.html#watchposition">#</a></h4><div><p>Invokes the success callback whenever the location changes.  Supported
options: timeout (ms), maximumAge (ms), enableHighAccuracy (bool), distanceFilter(m)</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="clearwatch"></a><span class="methodType">static </span>clearWatch<span class="methodType">(watchID)</span> <a class="hash-link" href="docs/geolocation.html#clearwatch">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="stopobserving"></a><span class="methodType">static </span>stopObserving<span class="methodType">(0)</span> <a class="hash-link" href="docs/geolocation.html#stopobserving">#</a></h4></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Geolocation/Geolocation.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/geolocation.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/GeolocationExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token comment" spellcheck="true">/* eslint no-console: 0 */</span>
<span class="token string">'use strict'</span><span class="token punctuation">;</span>


<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>framework <span class="token operator">=</span> <span class="token string">'React'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'Geolocation'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Examples of using the Geolocation API.'</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'navigator.geolocation'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;GeolocationExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span>

class <span class="token class-name">GeolocationExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    initialPosition<span class="token punctuation">:</span> <span class="token string">'unknown'</span><span class="token punctuation">,</span>
    lastPosition<span class="token punctuation">:</span> <span class="token string">'unknown'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  watchID<span class="token punctuation">:</span> <span class="token operator">?</span>number <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>

  <span class="token function">componentDidMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    navigator<span class="token punctuation">.</span>geolocation<span class="token punctuation">.</span><span class="token function">getCurrentPosition<span class="token punctuation">(</span></span>
      <span class="token punctuation">(</span>position<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">var</span> initialPosition <span class="token operator">=</span> JSON<span class="token punctuation">.</span><span class="token function">stringify<span class="token punctuation">(</span></span>position<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>initialPosition<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">,</span>
      <span class="token punctuation">(</span>error<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token function">alert<span class="token punctuation">(</span></span>error<span class="token punctuation">)</span><span class="token punctuation">,</span>
      <span class="token punctuation">{</span>enableHighAccuracy<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span> timeout<span class="token punctuation">:</span> <span class="token number">20000</span><span class="token punctuation">,</span> maximumAge<span class="token punctuation">:</span> <span class="token number">1000</span><span class="token punctuation">}</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>watchID <span class="token operator">=</span> navigator<span class="token punctuation">.</span>geolocation<span class="token punctuation">.</span><span class="token function">watchPosition<span class="token punctuation">(</span></span><span class="token punctuation">(</span>position<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">var</span> lastPosition <span class="token operator">=</span> JSON<span class="token punctuation">.</span><span class="token function">stringify<span class="token punctuation">(</span></span>position<span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>lastPosition<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">componentWillUnmount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    navigator<span class="token punctuation">.</span>geolocation<span class="token punctuation">.</span><span class="token function">clearWatch<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>watchID<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>title<span class="token punctuation">}</span><span class="token operator">&gt;</span>Initial position<span class="token punctuation">:</span> &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>initialPosition<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>title<span class="token punctuation">}</span><span class="token operator">&gt;</span>Current position<span class="token punctuation">:</span> &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>lastPosition<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'500'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22Geolocation%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/easing.html#content">← Prev</a><a class="docs-next" href="docs/imageeditor.html#content">Next →</a></div>