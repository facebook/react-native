---
id: geolocation
title: geolocation
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="geolocation"></a>Geolocation <a class="hash-link" href="undefined#geolocation">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Geolocation/Geolocation.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>The Geolocation API follows the web spec:
<a href="https://developer.mozilla.org/en-US/docs/Web/API/Geolocation">https://developer.mozilla.org/en-US/docs/Web/API/Geolocation</a></p><h3><a class="anchor" name="ios"></a>iOS <a class="hash-link" href="undefined#ios">#</a></h3><p>You need to include the <code>NSLocationWhenInUseUsageDescription</code> key
in Info.plist to enable geolocation. Geolocation is enabled by default
when you create a project with <code>react-native init</code>.</p><h3><a class="anchor" name="android"></a>Android <a class="hash-link" href="undefined#android">#</a></h3><p>To request access to location, you need to add the following line to your
app's <code>AndroidManifest.xml</code>:</p><p><code>&lt;uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" /&gt;</code></p></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="undefined#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="getcurrentposition"></a><span class="propType">static </span>getCurrentPosition<span class="propType">(geo_success: Function, geo_error?: Function, geo_options?: GeoOptions)</span> <a class="hash-link" href="undefined#getcurrentposition">#</a></h4><div><p>Invokes the success callback once with the latest location info.  Supported
options: timeout (ms), maximumAge (ms), enableHighAccuracy (bool)</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="watchposition"></a><span class="propType">static </span>watchPosition<span class="propType">(success: Function, error?: Function, options?: GeoOptions)</span> <a class="hash-link" href="undefined#watchposition">#</a></h4><div><p>Invokes the success callback whenever the location changes.  Supported
options: timeout (ms), maximumAge (ms), enableHighAccuracy (bool), distanceFilter(m)</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="clearwatch"></a><span class="propType">static </span>clearWatch<span class="propType">(watchID: number)</span> <a class="hash-link" href="undefined#clearwatch">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="stopobserving"></a><span class="propType">static </span>stopObserving<span class="propType">()</span> <a class="hash-link" href="undefined#stopobserving">#</a></h4></div></div></span></div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="undefined#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/GeolocationExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token comment" spellcheck="true">/* eslint no-console: 0 */</span>
<span class="token string">'use strict'</span><span class="token punctuation">;</span>


<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>framework <span class="token operator">=</span> <span class="token string">'React'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'Geolocation'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Examples of using the Geolocation API.'</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'navigator.geolocation'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;GeolocationExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> GeolocationExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  watchID<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token keyword">null</span><span class="token punctuation">:</span> <span class="token operator">?</span>number<span class="token punctuation">)</span><span class="token punctuation">,</span>

  getInitialState<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      initialPosition<span class="token punctuation">:</span> <span class="token string">'unknown'</span><span class="token punctuation">,</span>
      lastPosition<span class="token punctuation">:</span> <span class="token string">'unknown'</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  componentDidMount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    navigator<span class="token punctuation">.</span>geolocation<span class="token punctuation">.</span><span class="token function">getCurrentPosition<span class="token punctuation">(</span></span>
      <span class="token punctuation">(</span>position<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">var</span> initialPosition <span class="token operator">=</span> JSON<span class="token punctuation">.</span><span class="token function">stringify<span class="token punctuation">(</span></span>position<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>initialPosition<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">,</span>
      <span class="token punctuation">(</span>error<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token function">alert<span class="token punctuation">(</span></span>error<span class="token punctuation">.</span>message<span class="token punctuation">)</span><span class="token punctuation">,</span>
      <span class="token punctuation">{</span>enableHighAccuracy<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span> timeout<span class="token punctuation">:</span> <span class="token number">20000</span><span class="token punctuation">,</span> maximumAge<span class="token punctuation">:</span> <span class="token number">1000</span><span class="token punctuation">}</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>watchID <span class="token operator">=</span> navigator<span class="token punctuation">.</span>geolocation<span class="token punctuation">.</span><span class="token function">watchPosition<span class="token punctuation">(</span></span><span class="token punctuation">(</span>position<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">var</span> lastPosition <span class="token operator">=</span> JSON<span class="token punctuation">.</span><span class="token function">stringify<span class="token punctuation">(</span></span>position<span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>lastPosition<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  componentWillUnmount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    navigator<span class="token punctuation">.</span>geolocation<span class="token punctuation">.</span><span class="token function">clearWatch<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>watchID<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
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
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'500'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="network.html#content">Next →</a></div>