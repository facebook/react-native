---
id: version-0.30-webview
title: webview
original_id: webview
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="webview"></a>WebView <a class="hash-link" href="docs/webview.html#webview">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.30-stable/Libraries/Components/WebView/WebView.ios.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p><code>WebView</code> renders web content in a native view.</p><div class="prism language-javascript">import React<span class="token punctuation">,</span> <span class="token punctuation">{</span> Component <span class="token punctuation">}</span> from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span> WebView <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>

class <span class="token class-name">MyWeb</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;WebView
        source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> <span class="token string">'https://github.com/facebook/react-native'</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
        style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginTop<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>You can use this component to navigate back and forth in the web view's
history and configure various properties for the web content.</p></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/webview.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="docs/view.html#props">View props...</a> <a class="hash-link" href="docs/webview.html#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="automaticallyadjustcontentinsets"></a>automaticallyAdjustContentInsets <span class="propType">bool</span> <a class="hash-link" href="docs/webview.html#automaticallyadjustcontentinsets">#</a></h4><div><p>Controls whether to adjust the content inset for web views that are
placed behind a navigation bar, tab bar, or toolbar. The default value
is <code>true</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="contentinset"></a>contentInset <span class="propType">{top: number, left: number, bottom: number, right: number}</span> <a class="hash-link" href="docs/webview.html#contentinset">#</a></h4><div><p>The amount by which the web view content is inset from the edges of
the scroll view. Defaults to {top: 0, left: 0, bottom: 0, right: 0}.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="html"></a>html <span class="propType">string</span> <a class="hash-link" href="docs/webview.html#html">#</a></h4><div class="deprecated"><div class="deprecatedTitle"><img class="deprecatedIcon" src="img/Warning.png"><span>Deprecated</span></div><div class="deprecatedMessage"><div><p>Use the <code>source</code> prop instead.</p></div></div></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="injectedjavascript"></a>injectedJavaScript <span class="propType">string</span> <a class="hash-link" href="docs/webview.html#injectedjavascript">#</a></h4><div><p>Set this to provide JavaScript that will be injected into the web page
when the view loads.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="mediaplaybackrequiresuseraction"></a>mediaPlaybackRequiresUserAction <span class="propType">bool</span> <a class="hash-link" href="docs/webview.html#mediaplaybackrequiresuseraction">#</a></h4><div><p>Boolean that determines whether HTML5 audio and video requires the user
to tap them before they start playing. The default value is <code>false</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onerror"></a>onError <span class="propType">function</span> <a class="hash-link" href="docs/webview.html#onerror">#</a></h4><div><p>Function that is invoked when the <code>WebView</code> load fails.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onload"></a>onLoad <span class="propType">function</span> <a class="hash-link" href="docs/webview.html#onload">#</a></h4><div><p>Function that is invoked when the <code>WebView</code> has finished loading.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onloadend"></a>onLoadEnd <span class="propType">function</span> <a class="hash-link" href="docs/webview.html#onloadend">#</a></h4><div><p>Function that is invoked when the <code>WebView</code> load succeeds or fails.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onloadstart"></a>onLoadStart <span class="propType">function</span> <a class="hash-link" href="docs/webview.html#onloadstart">#</a></h4><div><p>Function that is invoked when the <code>WebView</code> starts loading.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onnavigationstatechange"></a>onNavigationStateChange <span class="propType">function</span> <a class="hash-link" href="docs/webview.html#onnavigationstatechange">#</a></h4><div><p>Function that is invoked when the <code>WebView</code> loading starts or ends.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="rendererror"></a>renderError <span class="propType">function</span> <a class="hash-link" href="docs/webview.html#rendererror">#</a></h4><div><p>Function that returns a view to show if there's an error.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="renderloading"></a>renderLoading <span class="propType">function</span> <a class="hash-link" href="docs/webview.html#renderloading">#</a></h4><div><p>Function that returns a loading indicator.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="scalespagetofit"></a>scalesPageToFit <span class="propType">bool</span> <a class="hash-link" href="docs/webview.html#scalespagetofit">#</a></h4><div><p>Boolean that controls whether the web content is scaled to fit
the view and enables the user to change the scale. The default value
is <code>true</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="source"></a>source <span class="propType">{uri: string, method: string, headers: object, body: string}, {html: string, baseUrl: string}, number</span> <a class="hash-link" href="docs/webview.html#source">#</a></h4><div><p>Loads static html or a uri (with optional headers) in the WebView.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="startinloadingstate"></a>startInLoadingState <span class="propType">bool</span> <a class="hash-link" href="docs/webview.html#startinloadingstate">#</a></h4><div><p>Boolean value that forces the <code>WebView</code> to show the loading view
on the first load.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="style"></a>style <span class="propType"><a href="docs/view.html#style">View#style</a></span> <a class="hash-link" href="docs/webview.html#style">#</a></h4><div><p>The style to apply to the <code>WebView</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="url"></a>url <span class="propType">string</span> <a class="hash-link" href="docs/webview.html#url">#</a></h4><div class="deprecated"><div class="deprecatedTitle"><img class="deprecatedIcon" src="img/Warning.png"><span>Deprecated</span></div><div class="deprecatedMessage"><div><p>Use the <code>source</code> prop instead.</p></div></div></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="domstorageenabled"></a><span class="platform">android</span>domStorageEnabled <span class="propType">bool</span> <a class="hash-link" href="docs/webview.html#domstorageenabled">#</a></h4><div><p>Boolean value to control whether DOM Storage is enabled. Used only in
Android.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="javascriptenabled"></a><span class="platform">android</span>javaScriptEnabled <span class="propType">bool</span> <a class="hash-link" href="docs/webview.html#javascriptenabled">#</a></h4><div><p>Boolean value to enable JavaScript in the <code>WebView</code>. Used on Android only
as JavaScript is enabled by default on iOS. The default value is <code>true</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="useragent"></a><span class="platform">android</span>userAgent <span class="propType">string</span> <a class="hash-link" href="docs/webview.html#useragent">#</a></h4><div><p>Sets the user-agent for the <code>WebView</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="allowsinlinemediaplayback"></a><span class="platform">ios</span>allowsInlineMediaPlayback <span class="propType">bool</span> <a class="hash-link" href="docs/webview.html#allowsinlinemediaplayback">#</a></h4><div><p>Boolean that determines whether HTML5 videos play inline or use the
native full-screen controller. The default value is <code>false</code>.</p><p><strong>NOTE</strong> : In order for video to play inline, not only does this
property need to be set to <code>true</code>, but the video element in the HTML
document must also include the <code>webkit-playsinline</code> attribute.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="bounces"></a><span class="platform">ios</span>bounces <span class="propType">bool</span> <a class="hash-link" href="docs/webview.html#bounces">#</a></h4><div><p>Boolean value that determines whether the web view bounces
when it reaches the edge of the content. The default value is <code>true</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="decelerationrate"></a><span class="platform">ios</span>decelerationRate <span class="propType">ScrollView.propTypes.decelerationRate</span> <a class="hash-link" href="docs/webview.html#decelerationrate">#</a></h4><div><p>A floating-point number that determines how quickly the scroll view
decelerates after the user lifts their finger. You may also use the
string shortcuts <code>"normal"</code> and <code>"fast"</code> which match the underlying iOS
settings for <code>UIScrollViewDecelerationRateNormal</code> and
<code>UIScrollViewDecelerationRateFast</code> respectively:</p><ul><li>normal: 0.998</li><li>fast: 0.99 (the default for iOS web view)</li></ul></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onshouldstartloadwithrequest"></a><span class="platform">ios</span>onShouldStartLoadWithRequest <span class="propType">function</span> <a class="hash-link" href="docs/webview.html#onshouldstartloadwithrequest">#</a></h4><div><p>Function that allows custom handling of any web view requests. Return
<code>true</code> from the function to continue loading the request and <code>false</code>
to stop loading.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="scrollenabled"></a><span class="platform">ios</span>scrollEnabled <span class="propType">bool</span> <a class="hash-link" href="docs/webview.html#scrollenabled">#</a></h4><div><p>Boolean value that determines whether scrolling is enabled in the
<code>WebView</code>. The default value is <code>true</code>.</p></div></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/webview.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="goforward"></a>goForward<span class="methodType">(0)</span> <a class="hash-link" href="docs/webview.html#goforward">#</a></h4><div><p>Go forward one page in the web view's history.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="goback"></a>goBack<span class="methodType">(0)</span> <a class="hash-link" href="docs/webview.html#goback">#</a></h4><div><p>Go back one page in the web view's history.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="reload"></a>reload<span class="methodType">(0)</span> <a class="hash-link" href="docs/webview.html#reload">#</a></h4><div><p>Reloads the current page.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="stoploading"></a>stopLoading<span class="methodType">(0)</span> <a class="hash-link" href="docs/webview.html#stoploading">#</a></h4><div><p>Stop loading the current page.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="getwebviewhandle"></a>getWebViewHandle<span class="methodType">(0): </span> <a class="hash-link" href="docs/webview.html#getwebviewhandle">#</a></h4><div><p>Returns the native <code>WebView</code> node.</p></div></div></div></span></div><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/webview.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.30-stable/Examples/UIExplorer/WebViewExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TextInput<span class="token punctuation">,</span>
  TouchableWithoutFeedback<span class="token punctuation">,</span>
  TouchableOpacity<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  WebView
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

<span class="token keyword">var</span> HEADER <span class="token operator">=</span> <span class="token string">'#3b5998'</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> BGWASH <span class="token operator">=</span> <span class="token string">'rgba(255,255,255,0.8)'</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> DISABLED_WASH <span class="token operator">=</span> <span class="token string">'rgba(255,255,255,0.25)'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> TEXT_INPUT_REF <span class="token operator">=</span> <span class="token string">'urlInput'</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> WEBVIEW_REF <span class="token operator">=</span> <span class="token string">'webview'</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> DEFAULT_URL <span class="token operator">=</span> <span class="token string">'https://m.facebook.com'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> WebViewExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>

  getInitialState<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      url<span class="token punctuation">:</span> DEFAULT_URL<span class="token punctuation">,</span>
      status<span class="token punctuation">:</span> <span class="token string">'No Page Loaded'</span><span class="token punctuation">,</span>
      backButtonEnabled<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
      forwardButtonEnabled<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
      loading<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
      scalesPageToFit<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  inputText<span class="token punctuation">:</span> <span class="token string">''</span><span class="token punctuation">,</span>

  handleTextInputChange<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> url <span class="token operator">=</span> event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text<span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token regex">/^[a-zA-Z-_]+:/</span><span class="token punctuation">.</span><span class="token function">test<span class="token punctuation">(</span></span>url<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      url <span class="token operator">=</span> <span class="token string">'http://'</span> <span class="token operator">+</span> url<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>inputText <span class="token operator">=</span> url<span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>inputText <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>url<span class="token punctuation">;</span>

    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>addressBarRow<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;TouchableOpacity
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>goBack<span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>backButtonEnabled <span class="token operator">?</span> styles<span class="token punctuation">.</span>navButton <span class="token punctuation">:</span> styles<span class="token punctuation">.</span>disabledButton<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
               <span class="token punctuation">{</span><span class="token string">'&lt;'</span><span class="token punctuation">}</span>
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableOpacity<span class="token operator">&gt;</span>
          &lt;TouchableOpacity
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>goForward<span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>forwardButtonEnabled <span class="token operator">?</span> styles<span class="token punctuation">.</span>navButton <span class="token punctuation">:</span> styles<span class="token punctuation">.</span>disabledButton<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              <span class="token punctuation">{</span><span class="token string">'&gt;'</span><span class="token punctuation">}</span>
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableOpacity<span class="token operator">&gt;</span>
          &lt;TextInput
            ref<span class="token operator">=</span><span class="token punctuation">{</span>TEXT_INPUT_REF<span class="token punctuation">}</span>
            autoCapitalize<span class="token operator">=</span><span class="token string">"none"</span>
            defaultValue<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>url<span class="token punctuation">}</span>
            onSubmitEditing<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>onSubmitEditing<span class="token punctuation">}</span>
            onChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>handleTextInputChange<span class="token punctuation">}</span>
            clearButtonMode<span class="token operator">=</span><span class="token string">"while-editing"</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>addressBarTextInput<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TouchableOpacity onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>pressGoButton<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>goButton<span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text<span class="token operator">&gt;</span>
                 Go<span class="token operator">!</span>
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableOpacity<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;WebView
          ref<span class="token operator">=</span><span class="token punctuation">{</span>WEBVIEW_REF<span class="token punctuation">}</span>
          automaticallyAdjustContentInsets<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>webView<span class="token punctuation">}</span>
          source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>url<span class="token punctuation">}</span><span class="token punctuation">}</span>
          javaScriptEnabled<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
          domStorageEnabled<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
          decelerationRate<span class="token operator">=</span><span class="token string">"normal"</span>
          onNavigationStateChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>onNavigationStateChange<span class="token punctuation">}</span>
          onShouldStartLoadWithRequest<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>onShouldStartLoadWithRequest<span class="token punctuation">}</span>
          startInLoadingState<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
          scalesPageToFit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>scalesPageToFit<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>statusBar<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>statusBarText<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>status<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  goBack<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>refs<span class="token punctuation">[</span>WEBVIEW_REF<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">goBack<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  goForward<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>refs<span class="token punctuation">[</span>WEBVIEW_REF<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">goForward<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  reload<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>refs<span class="token punctuation">[</span>WEBVIEW_REF<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">reload<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  onShouldStartLoadWithRequest<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // Implement any custom loading logic here, don't forget to return!
</span>    <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  onNavigationStateChange<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>navState<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      backButtonEnabled<span class="token punctuation">:</span> navState<span class="token punctuation">.</span>canGoBack<span class="token punctuation">,</span>
      forwardButtonEnabled<span class="token punctuation">:</span> navState<span class="token punctuation">.</span>canGoForward<span class="token punctuation">,</span>
      url<span class="token punctuation">:</span> navState<span class="token punctuation">.</span>url<span class="token punctuation">,</span>
      status<span class="token punctuation">:</span> navState<span class="token punctuation">.</span>title<span class="token punctuation">,</span>
      loading<span class="token punctuation">:</span> navState<span class="token punctuation">.</span>loading<span class="token punctuation">,</span>
      scalesPageToFit<span class="token punctuation">:</span> <span class="token boolean">true</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  onSubmitEditing<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">pressGoButton<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  pressGoButton<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> url <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>inputText<span class="token punctuation">.</span><span class="token function">toLowerCase<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>url <span class="token operator">===</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>url<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">reload<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
        url<span class="token punctuation">:</span> url<span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
   <span class="token comment" spellcheck="true"> // dismiss keyboard
</span>    <span class="token keyword">this</span><span class="token punctuation">.</span>refs<span class="token punctuation">[</span>TEXT_INPUT_REF<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">blur<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> Button <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  _handlePress<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>enabled <span class="token operator">!</span><span class="token operator">==</span> <span class="token boolean">false</span> &amp;&amp; <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>onPress<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span><span class="token function">onPress<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;TouchableWithoutFeedback onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_handlePress<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>enabled <span class="token operator">?</span> <span class="token punctuation">{</span><span class="token punctuation">}</span> <span class="token punctuation">:</span> styles<span class="token punctuation">.</span>buttonDisabled<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>buttonText<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>text<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>TouchableWithoutFeedback<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> ScaledWebView <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>

  getInitialState<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      scalingEnabled<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;WebView
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
            backgroundColor<span class="token punctuation">:</span> BGWASH<span class="token punctuation">,</span>
            height<span class="token punctuation">:</span> <span class="token number">200</span><span class="token punctuation">,</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span>
          source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> <span class="token string">'https://facebook.github.io/react/'</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
          scalesPageToFit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>scalingEnabled<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>buttons<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        <span class="token punctuation">{</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>scalingEnabled <span class="token operator">?</span>
          &lt;Button
            text<span class="token operator">=</span><span class="token string">"Scaling:ON"</span>
            enabled<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>scalingEnabled<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span> <span class="token punctuation">:</span>
          &lt;Button
            text<span class="token operator">=</span><span class="token string">"Scaling:OFF"</span>
            enabled<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>scalingEnabled<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span> <span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  container<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> HEADER<span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  addressBarRow<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">8</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  webView<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> BGWASH<span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">350</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  addressBarTextInput<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> BGWASH<span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'transparent'</span><span class="token punctuation">,</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    borderWidth<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">24</span><span class="token punctuation">,</span>
    paddingLeft<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
    paddingTop<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    paddingBottom<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">14</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  navButton<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    marginRight<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> BGWASH<span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'transparent'</span><span class="token punctuation">,</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  disabledButton<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    marginRight<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> DISABLED_WASH<span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'transparent'</span><span class="token punctuation">,</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  goButton<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    height<span class="token punctuation">:</span> <span class="token number">24</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    marginLeft<span class="token punctuation">:</span> <span class="token number">8</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> BGWASH<span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'transparent'</span><span class="token punctuation">,</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    alignSelf<span class="token punctuation">:</span> <span class="token string">'stretch'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  statusBar<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    paddingLeft<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">22</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  statusBarText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    color<span class="token punctuation">:</span> <span class="token string">'white'</span><span class="token punctuation">,</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">13</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  spinner<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
    marginRight<span class="token punctuation">:</span> <span class="token number">6</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  buttons<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">30</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'black'</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'space-between'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  button<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">0.5</span><span class="token punctuation">,</span>
    width<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
    margin<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'gray'</span><span class="token punctuation">,</span>
    borderWidth<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'gray'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

const HTML <span class="token operator">=</span> `
&lt;<span class="token operator">!</span>DOCTYPE html<span class="token operator">&gt;</span>\n
&lt;html<span class="token operator">&gt;</span>
  &lt;head<span class="token operator">&gt;</span>
    &lt;title<span class="token operator">&gt;</span>Hello Static World&lt;<span class="token operator">/</span>title<span class="token operator">&gt;</span>
    &lt;meta http<span class="token operator">-</span>equiv<span class="token operator">=</span><span class="token string">"content-type"</span> content<span class="token operator">=</span><span class="token string">"text/html; charset=utf-8"</span><span class="token operator">&gt;</span>
    &lt;meta name<span class="token operator">=</span><span class="token string">"viewport"</span> content<span class="token operator">=</span><span class="token string">"width=320, user-scalable=no"</span><span class="token operator">&gt;</span>
    &lt;style type<span class="token operator">=</span><span class="token string">"text/css"</span><span class="token operator">&gt;</span>
      body <span class="token punctuation">{</span>
        margin<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">;</span>
        padding<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">;</span>
        font<span class="token punctuation">:</span> <span class="token number">62.5</span><span class="token operator">%</span> arial<span class="token punctuation">,</span> sans<span class="token operator">-</span>serif<span class="token punctuation">;</span>
        background<span class="token punctuation">:</span> #ccc<span class="token punctuation">;</span>
      <span class="token punctuation">}</span>
      h1 <span class="token punctuation">{</span>
        padding<span class="token punctuation">:</span> 45px<span class="token punctuation">;</span>
        margin<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">;</span>
        text<span class="token operator">-</span>align<span class="token punctuation">:</span> center<span class="token punctuation">;</span>
        color<span class="token punctuation">:</span> #33f<span class="token punctuation">;</span>
      <span class="token punctuation">}</span>
    &lt;<span class="token operator">/</span>style<span class="token operator">&gt;</span>
  &lt;<span class="token operator">/</span>head<span class="token operator">&gt;</span>
  &lt;body<span class="token operator">&gt;</span>
    &lt;h1<span class="token operator">&gt;</span>Hello Static World&lt;<span class="token operator">/</span>h1<span class="token operator">&gt;</span>
  &lt;<span class="token operator">/</span>body<span class="token operator">&gt;</span>
&lt;<span class="token operator">/</span>html<span class="token operator">&gt;</span>
`<span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>displayName <span class="token operator">=</span> <span class="token punctuation">(</span>undefined<span class="token punctuation">:</span> <span class="token operator">?</span>string<span class="token punctuation">)</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;WebView&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Base component to display web content'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Simple Browser'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;WebViewExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Scale Page to Fit'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;ScaledWebView<span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Bundled HTML'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;WebView
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
            backgroundColor<span class="token punctuation">:</span> BGWASH<span class="token punctuation">,</span>
            height<span class="token punctuation">:</span> <span class="token number">100</span><span class="token punctuation">,</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span>
          source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./helloworld.html'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          scalesPageToFit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Static HTML'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;WebView
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
            backgroundColor<span class="token punctuation">:</span> BGWASH<span class="token punctuation">,</span>
            height<span class="token punctuation">:</span> <span class="token number">100</span><span class="token punctuation">,</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span>
          source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>html<span class="token punctuation">:</span> HTML<span class="token punctuation">}</span><span class="token punctuation">}</span>
          scalesPageToFit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'POST Test'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;WebView
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
            backgroundColor<span class="token punctuation">:</span> BGWASH<span class="token punctuation">,</span>
            height<span class="token punctuation">:</span> <span class="token number">100</span><span class="token punctuation">,</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span>
          source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
            uri<span class="token punctuation">:</span> <span class="token string">'http://www.posttestserver.com/post.php'</span><span class="token punctuation">,</span>
            method<span class="token punctuation">:</span> <span class="token string">'POST'</span><span class="token punctuation">,</span>
            body<span class="token punctuation">:</span> <span class="token string">'foo=bar&amp;bar=foo'</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span>
          scalesPageToFit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22WebView%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/actionsheetios.html#content">Next →</a></div>