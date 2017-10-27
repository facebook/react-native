---
id: version-0.18-webview
title: webview
original_id: webview
---
<a id="content"></a><h1>WebView</h1><div><div><p>Renders a native WebView.</p></div><h3><a class="anchor" name="props"></a><a class="edit-github" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/WebView/WebView.ios.js">Edit on GitHub</a>Props <a class="hash-link" href="#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="view.html#props">View props...</a> <a class="hash-link" href="#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="automaticallyadjustcontentinsets"></a>automaticallyAdjustContentInsets <span class="propType">bool</span> <a class="hash-link" href="#automaticallyadjustcontentinsets">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="contentinset"></a>contentInset <span class="propType">{top: number, left: number, bottom: number, right: number}</span> <a class="hash-link" href="#contentinset">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="html"></a>html <span class="propType">string</span> <a class="hash-link" href="#html">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="injectedjavascript"></a>injectedJavaScript <span class="propType">string</span> <a class="hash-link" href="#injectedjavascript">#</a></h4><div><p>Sets the JS to be injected when the webpage loads.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onnavigationstatechange"></a>onNavigationStateChange <span class="propType">function</span> <a class="hash-link" href="#onnavigationstatechange">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="rendererror"></a>renderError <span class="propType">function</span> <a class="hash-link" href="#rendererror">#</a></h4><div><p>Function that returns a view to show if there's an error.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="renderloading"></a>renderLoading <span class="propType">function</span> <a class="hash-link" href="#renderloading">#</a></h4><div><p>Function that returns a loading indicator.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="startinloadingstate"></a>startInLoadingState <span class="propType">bool</span> <a class="hash-link" href="#startinloadingstate">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="style"></a>style <span class="propType"><a href="view.html#style">View#style</a></span> <a class="hash-link" href="#style">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="url"></a>url <span class="propType">string</span> <a class="hash-link" href="#url">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="allowsinlinemediaplayback"></a><span class="platform">ios</span>allowsInlineMediaPlayback <span class="propType">bool</span> <a class="hash-link" href="#allowsinlinemediaplayback">#</a></h4><div><p>Determines whether HTML5 videos play inline or use the native full-screen
controller.
default value <code>false</code>
<strong>NOTE</strong> : "In order for video to play inline, not only does this
property need to be set to true, but the video element in the HTML
document must also include the webkit-playsinline attribute."</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="bounces"></a><span class="platform">ios</span>bounces <span class="propType">bool</span> <a class="hash-link" href="#bounces">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="domstorageenabledandroid"></a><span class="platform">android</span>domStorageEnabledAndroid <span class="propType">bool</span> <a class="hash-link" href="#domstorageenabledandroid">#</a></h4><div><p>Used on Android only, controls whether DOM Storage is enabled or not</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="javascriptenabledandroid"></a><span class="platform">android</span>javaScriptEnabledAndroid <span class="propType">bool</span> <a class="hash-link" href="#javascriptenabledandroid">#</a></h4><div><p>Used on Android only, JS is enabled by default for WebView on iOS</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onshouldstartloadwithrequest"></a><span class="platform">ios</span>onShouldStartLoadWithRequest <span class="propType">function</span> <a class="hash-link" href="#onshouldstartloadwithrequest">#</a></h4><div><p>Allows custom handling of any webview requests by a JS handler. Return true
or false from this method to continue loading the request.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="scalespagetofit"></a><span class="platform">ios</span>scalesPageToFit <span class="propType">bool</span> <a class="hash-link" href="#scalespagetofit">#</a></h4><div><p>Sets whether the webpage scales to fit the view and the user can change the scale.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="scrollenabled"></a><span class="platform">ios</span>scrollEnabled <span class="propType">bool</span> <a class="hash-link" href="#scrollenabled">#</a></h4></div></div></div><div><h3><a class="anchor" name="examples"></a><a class="edit-github" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/WebViewExample.js">Edit on GitHub</a>Examples <a class="hash-link" href="#examples">#</a></h3><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TextInput<span class="token punctuation">,</span>
  TouchableOpacity<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  WebView
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>

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
    <span class="token keyword">this</span><span class="token punctuation">.</span>inputText <span class="token operator">=</span> event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text<span class="token punctuation">;</span>
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
          url<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>url<span class="token punctuation">}</span>
          javaScriptEnabledAndroid<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
          domStorageEnabledAndroid<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
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
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>displayName <span class="token operator">=</span> <span class="token punctuation">(</span>undefined<span class="token punctuation">:</span> <span class="token operator">?</span>string<span class="token punctuation">)</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;WebView&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Base component to display web content'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'WebView'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;WebViewExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="actionsheetios.html#content">Next →</a></div>