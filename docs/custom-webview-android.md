---
id: version-0.50-custom-webview-android
title: custom-webview-android
original_id: custom-webview-android
---
<a id="content"></a><h1><a class="anchor" name="custom-webview"></a>Custom WebView <a class="hash-link" href="docs/custom-webview-android.html#custom-webview">#</a></h1><div class="banner-crna-ejected"><h3>Project with Native Code Required</h3><p>This page only applies to projects made with <code>react-native init</code> or to those made with Create React Native App which have since ejected. For more information about ejecting, please see the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on the Create React Native App repository.</p></div><div><p>While the built-in web view has a lot of features, it is not possible to handle every use-case in React Native. You can, however, extend the web view with native code without forking React Native or duplicating all the existing web view code.</p><p>Before you do this, you should be familiar with the concepts in <a href="native-components-android" target="_blank">native UI components</a>. You should also familiarise yourself with the <a href="https://github.com/facebook/react-native/blob/master/ReactAndroid/src/main/java/com/facebook/react/views/webview/ReactWebViewManager.java" target="_blank">native code for web views</a>, as you will have to use this as a reference when implementing new features—although a deep understanding is not required.</p><h2><a class="anchor" name="native-code"></a>Native Code <a class="hash-link" href="docs/custom-webview-android.html#native-code">#</a></h2><p>To get started, you'll need to create a subclass of <code>ReactWebViewManager</code>, <code>ReactWebView</code>, and <code>ReactWebViewClient</code>. In your view manager, you'll then need to override:</p><ul><li><code>createReactWebViewInstance</code></li><li><code>getName</code></li><li><code>addEventEmitters</code></li></ul><div class="prism language-java">@<span class="token function">ReactModule<span class="token punctuation">(</span></span>name <span class="token operator">=</span> CustomWebViewManager<span class="token punctuation">.</span>REACT_CLASS<span class="token punctuation">)</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">CustomWebViewManager</span> <span class="token keyword">extends</span> <span class="token class-name">ReactWebViewManager</span> <span class="token punctuation">{</span>
  <span class="token comment" spellcheck="true">/* This name must match what we're referring to in JS */</span>
  <span class="token keyword">protected</span> <span class="token keyword">static</span> <span class="token keyword">final</span> String REACT_CLASS <span class="token operator">=</span> <span class="token string">"RCTCustomWebView"</span><span class="token punctuation">;</span>

  <span class="token keyword">protected</span> <span class="token keyword">static</span> <span class="token keyword">class</span> <span class="token class-name">CustomWebViewClient</span> <span class="token keyword">extends</span> <span class="token class-name">ReactWebViewClient</span> <span class="token punctuation">{</span> <span class="token punctuation">}</span>

  <span class="token keyword">protected</span> <span class="token keyword">static</span> <span class="token keyword">class</span> <span class="token class-name">CustomWebView</span> <span class="token keyword">extends</span> <span class="token class-name">ReactWebView</span> <span class="token punctuation">{</span>
    <span class="token keyword">public</span> <span class="token function">CustomWebView<span class="token punctuation">(</span></span>ThemedReactContext reactContext<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">super</span><span class="token punctuation">(</span>reactContext<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  @Override
  <span class="token keyword">protected</span> ReactWebView <span class="token function">createReactWebViewInstance<span class="token punctuation">(</span></span>ThemedReactContext reactContext<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">CustomWebView</span><span class="token punctuation">(</span>reactContext<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  @Override
  <span class="token keyword">public</span> String <span class="token function">getName<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> REACT_CLASS<span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  @Override
  <span class="token keyword">protected</span> <span class="token keyword">void</span> <span class="token function">addEventEmitters<span class="token punctuation">(</span></span>ThemedReactContext reactContext<span class="token punctuation">,</span> WebView view<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    view<span class="token punctuation">.</span><span class="token function">setWebViewClient<span class="token punctuation">(</span></span><span class="token keyword">new</span> <span class="token class-name">CustomWebViewClient</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>You'll need to follow the usual steps to <a href="docs/native-modules-android.html#register-the-module" target="_blank">register the module</a>.</p><h3><a class="anchor" name="adding-new-properties"></a>Adding New Properties <a class="hash-link" href="docs/custom-webview-android.html#adding-new-properties">#</a></h3><p>To add a new property, you'll need to add it to <code>CustomWebView</code>, and then expose it in <code>CustomWebViewManager</code>.</p><div class="prism language-java"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">CustomWebViewManager</span> <span class="token keyword">extends</span> <span class="token class-name">ReactWebViewManager</span> <span class="token punctuation">{</span>
  <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>

  <span class="token keyword">protected</span> <span class="token keyword">static</span> <span class="token keyword">class</span> <span class="token class-name">CustomWebView</span> <span class="token keyword">extends</span> <span class="token class-name">ReactWebView</span> <span class="token punctuation">{</span>
    <span class="token keyword">public</span> <span class="token function">CustomWebView<span class="token punctuation">(</span></span>ThemedReactContext reactContext<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">super</span><span class="token punctuation">(</span>reactContext<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">protected</span> @Nullable String mFinalUrl<span class="token punctuation">;</span>

    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">setFinalUrl<span class="token punctuation">(</span></span>String url<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        mFinalUrl <span class="token operator">=</span> url<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">public</span> String <span class="token function">getFinalUrl<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> mFinalUrl<span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>

  @<span class="token function">ReactProp<span class="token punctuation">(</span></span>name <span class="token operator">=</span> <span class="token string">"finalUrl"</span><span class="token punctuation">)</span>
  <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">setFinalUrl<span class="token punctuation">(</span></span>WebView view<span class="token punctuation">,</span> String url<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token punctuation">(</span><span class="token punctuation">(</span>CustomWebView<span class="token punctuation">)</span> view<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setFinalUrl<span class="token punctuation">(</span></span>url<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><h3><a class="anchor" name="adding-new-events"></a>Adding New Events <a class="hash-link" href="docs/custom-webview-android.html#adding-new-events">#</a></h3><p>For events, you'll first need to make create event subclass.</p><div class="prism language-java"><span class="token comment" spellcheck="true">// NavigationCompletedEvent.java
</span><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">NavigationCompletedEvent</span> <span class="token keyword">extends</span> <span class="token class-name">Event</span><span class="token operator">&lt;</span>NavigationCompletedEvent<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
  <span class="token keyword">private</span> WritableMap mParams<span class="token punctuation">;</span>

  <span class="token keyword">public</span> <span class="token function">NavigationCompletedEvent<span class="token punctuation">(</span></span><span class="token keyword">int</span> viewTag<span class="token punctuation">,</span> WritableMap params<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">super</span><span class="token punctuation">(</span>viewTag<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>mParams <span class="token operator">=</span> params<span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  @Override
  <span class="token keyword">public</span> String <span class="token function">getEventName<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token string">"navigationCompleted"</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  @Override
  <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">dispatch<span class="token punctuation">(</span></span>RCTEventEmitter rctEventEmitter<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">init<span class="token punctuation">(</span></span><span class="token function">getViewTag<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    rctEventEmitter<span class="token punctuation">.</span><span class="token function">receiveEvent<span class="token punctuation">(</span></span><span class="token function">getViewTag<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token function">getEventName<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">,</span> mParams<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>You can trigger the event in your web view client. You can hook existing handlers if your events are based on them.</p><p>You should refer to  <a href="https://github.com/facebook/react-native/blob/master/ReactAndroid/src/main/java/com/facebook/react/views/webview/ReactWebViewManager.java" target="_blank">ReactWebViewManager.java</a> in the React Native codebase to see what handlers are available and how they are implemented. You can extend any methods here to provide extra functionality.</p><div class="prism language-java"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">NavigationCompletedEvent</span> <span class="token keyword">extends</span> <span class="token class-name">Event</span><span class="token operator">&lt;</span>NavigationCompletedEvent<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
  <span class="token keyword">private</span> WritableMap mParams<span class="token punctuation">;</span>

  <span class="token keyword">public</span> <span class="token function">NavigationCompletedEvent<span class="token punctuation">(</span></span><span class="token keyword">int</span> viewTag<span class="token punctuation">,</span> WritableMap params<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">super</span><span class="token punctuation">(</span>viewTag<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>mParams <span class="token operator">=</span> params<span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  @Override
  <span class="token keyword">public</span> String <span class="token function">getEventName<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token string">"navigationCompleted"</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  @Override
  <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">dispatch<span class="token punctuation">(</span></span>RCTEventEmitter rctEventEmitter<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">init<span class="token punctuation">(</span></span><span class="token function">getViewTag<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    rctEventEmitter<span class="token punctuation">.</span><span class="token function">receiveEvent<span class="token punctuation">(</span></span><span class="token function">getViewTag<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token function">getEventName<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">,</span> mParams<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
<span class="token comment" spellcheck="true">
// CustomWebViewManager.java
</span><span class="token keyword">protected</span> <span class="token keyword">static</span> <span class="token keyword">class</span> <span class="token class-name">CustomWebViewClient</span> <span class="token keyword">extends</span> <span class="token class-name">ReactWebViewClient</span> <span class="token punctuation">{</span>
  @Override
  <span class="token keyword">public</span> <span class="token keyword">boolean</span> <span class="token function">shouldOverrideUrlLoading<span class="token punctuation">(</span></span>WebView view<span class="token punctuation">,</span> String url<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">boolean</span> shouldOverride <span class="token operator">=</span> <span class="token keyword">super</span><span class="token punctuation">.</span><span class="token function">shouldOverrideUrlLoading<span class="token punctuation">(</span></span>view<span class="token punctuation">,</span> url<span class="token punctuation">)</span><span class="token punctuation">;</span>
    String finalUrl <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">(</span>CustomWebView<span class="token punctuation">)</span> view<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">getFinalUrl<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>shouldOverride <span class="token operator">&amp;&amp;</span> url <span class="token operator">!=</span> null <span class="token operator">&amp;&amp;</span> finalUrl <span class="token operator">!=</span> null <span class="token operator">&amp;&amp;</span> <span class="token keyword">new</span> <span class="token class-name">String</span><span class="token punctuation">(</span>url<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">equals<span class="token punctuation">(</span></span>finalUrl<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">final</span> WritableMap params <span class="token operator">=</span> Arguments<span class="token punctuation">.</span><span class="token function">createMap<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token function">dispatchEvent<span class="token punctuation">(</span></span>view<span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">NavigationCompletedEvent</span><span class="token punctuation">(</span>view<span class="token punctuation">.</span><span class="token function">getId<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">,</span> params<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">return</span> shouldOverride<span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>Finally, you'll need to expose the events in <code>CustomWebViewManager</code> through <code>getExportedCustomDirectEventTypeConstants</code>. Note that currently, the default implementation returns <code>null</code>, but this may change in the future.</p><div class="prism language-java"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">CustomWebViewManager</span> <span class="token keyword">extends</span> <span class="token class-name">ReactWebViewManager</span> <span class="token punctuation">{</span>
  <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>

  @Override
  <span class="token keyword">public</span> @Nullable
  Map <span class="token function">getExportedCustomDirectEventTypeConstants<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    Map<span class="token operator">&lt;</span>String<span class="token punctuation">,</span> Object<span class="token operator">&gt;</span> export <span class="token operator">=</span> <span class="token keyword">super</span><span class="token punctuation">.</span><span class="token function">getExportedCustomDirectEventTypeConstants<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>export <span class="token operator">==</span> null<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      export <span class="token operator">=</span> MapBuilder<span class="token punctuation">.</span><span class="token function">newHashMap<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    export<span class="token punctuation">.</span><span class="token function">put<span class="token punctuation">(</span></span><span class="token string">"navigationCompleted"</span><span class="token punctuation">,</span> MapBuilder<span class="token punctuation">.</span><span class="token function">of<span class="token punctuation">(</span></span><span class="token string">"registrationName"</span><span class="token punctuation">,</span> <span class="token string">"onNavigationCompleted"</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> export<span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><h2><a class="anchor" name="javascript-interface"></a>JavaScript Interface <a class="hash-link" href="docs/custom-webview-android.html#javascript-interface">#</a></h2><p>To use your custom web view, you'll need to create a class for it. Your class must:</p><ul><li>Export all the prop types from <code>WebView.propTypes</code></li><li>Return a <code>WebView</code> component with the prop <code>nativeConfig.component</code> set to your native component (see below)</li></ul><p>To get your native component, you must use <code>requireNativeComponent</code>: the same as for regular custom components. However, you must pass in an extra third argument, <code>WebView.extraNativeComponentConfig</code>. This third argument contains prop types that are only required for native code.</p><div class="prism language-js"><span class="token keyword">import</span> React<span class="token punctuation">,</span> <span class="token punctuation">{</span> Component<span class="token punctuation">,</span> PropTypes <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'react'</span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token punctuation">{</span> WebView<span class="token punctuation">,</span> requireNativeComponent <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'react-native'</span><span class="token punctuation">;</span>

<span class="token keyword">export</span> <span class="token keyword">default</span> <span class="token keyword">class</span> <span class="token class-name">CustomWebView</span> <span class="token keyword">extends</span> <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token keyword">static</span> propTypes <span class="token operator">=</span> WebView<span class="token punctuation">.</span>propTypes

  <span class="token function">render</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      <span class="token operator">&lt;</span>WebView
        <span class="token punctuation">{</span><span class="token operator">...</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span>
        nativeConfig<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span> component<span class="token punctuation">:</span> RCTCustomWebView <span class="token punctuation">}</span><span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">const</span> RCTCustomWebView <span class="token operator">=</span> <span class="token function">requireNativeComponent</span><span class="token punctuation">(</span>
  <span class="token string">'RCTCustomWebView'</span><span class="token punctuation">,</span>
  CustomWebView<span class="token punctuation">,</span>
  WebView<span class="token punctuation">.</span>extraNativeComponentConfig
<span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>If you want to add custom props to your native component, you can use <code>nativeConfig.props</code> on the web view.</p><p>For events, the event handler must always be set to a function. This means it isn't safe to use the event handler directly from <code>this.props</code>, as the user might not have provided one. The standard approach is to create a event handler in your class, and then invoking the event handler given in <code>this.props</code> if it exists.</p><p>If you are unsure how something should be implemented from the JS side, look at <a href="https://github.com/facebook/react-native/blob/master/Libraries/Components/WebView/WebView.android.js" target="_blank">WebView.android.js</a> in the React Native source.</p><div class="prism language-js"><span class="token keyword">export</span> <span class="token keyword">default</span> <span class="token keyword">class</span> <span class="token class-name">CustomWebView</span> <span class="token keyword">extends</span> <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token keyword">static</span> propTypes <span class="token operator">=</span> <span class="token punctuation">{</span>
    <span class="token operator">...</span>WebView<span class="token punctuation">.</span>propTypes<span class="token punctuation">,</span>
    finalUrl<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>string<span class="token punctuation">,</span>
    onNavigationCompleted<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>func<span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token keyword">static</span> defaultProps <span class="token operator">=</span> <span class="token punctuation">{</span>
    finalUrl<span class="token punctuation">:</span> <span class="token string">'about:blank'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _onNavigationCompleted <span class="token operator">=</span> <span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">const</span> <span class="token punctuation">{</span> onNavigationCompleted <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">;</span>
    onNavigationCompleted <span class="token operator">&amp;&amp;</span> <span class="token function">onNavigationCompleted</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      <span class="token operator">&lt;</span>WebView
        <span class="token punctuation">{</span><span class="token operator">...</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span>
        nativeConfig<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
          component<span class="token punctuation">:</span> RCTCustomWebView<span class="token punctuation">,</span>
          props<span class="token punctuation">:</span> <span class="token punctuation">{</span>
            finalUrl<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>finalUrl<span class="token punctuation">,</span>
            onNavigationCompleted<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_onNavigationCompleted<span class="token punctuation">,</span>
          <span class="token punctuation">}</span>
        <span class="token punctuation">}</span><span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>Just like for regular native components, you must provide all your prop types in the component to have them forwarded on to the native component. However, if you have some prop types that are only used internally in component, you can add them to the <code>nativeOnly</code> property of the third argument previously mentioned. For event handlers, you have to use the value <code>true</code> instead of a regular prop type.</p><p>For example, if you wanted to add an internal event handler called <code>onScrollToBottom</code>, you would use,</p><div class="prism language-js"><span class="token keyword">const</span> RCTCustomWebView <span class="token operator">=</span> <span class="token function">requireNativeComponent</span><span class="token punctuation">(</span>
  <span class="token string">'RCTCustomWebView'</span><span class="token punctuation">,</span>
  CustomWebView<span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    <span class="token operator">...</span>WebView<span class="token punctuation">.</span>extraNativeComponentConfig<span class="token punctuation">,</span>
    nativeOnly<span class="token punctuation">:</span> <span class="token punctuation">{</span>
      <span class="token operator">...</span>WebView<span class="token punctuation">.</span>extraNativeComponentConfig<span class="token punctuation">.</span>nativeOnly<span class="token punctuation">,</span>
      onScrollToBottom<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">)</span><span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-prev btn" href="docs/native-components-android.html#content">← Previous</a><a class="docs-next btn" href="docs/headless-js-android.html#content">Continue Reading →</a></div><p class="edit-page-block"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/CustomWebViewAndroid.md">Improve this page</a> by sending a pull request!</p>