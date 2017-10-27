---
id: version-0.50-custom-webview-ios
title: custom-webview-ios
original_id: custom-webview-ios
---
<a id="content"></a><h1><a class="anchor" name="custom-webview"></a>Custom WebView <a class="hash-link" href="docs/custom-webview-ios.html#custom-webview">#</a></h1><div class="banner-crna-ejected"><h3>Project with Native Code Required</h3><p>This page only applies to projects made with <code>react-native init</code> or to those made with Create React Native App which have since ejected. For more information about ejecting, please see the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on the Create React Native App repository.</p></div><div><p>While the built-in web view has a lot of features, it is not possible to handle every use-case in React Native. You can, however, extend the web view with native code without forking React Native or duplicating all the existing web view code.</p><p>Before you do this, you should be familiar with the concepts in <a href="native-components-ios" target="_blank">native UI components</a>. You should also familiarise yourself with the <a href="https://github.com/facebook/react-native/blob/master/React/Views/RCTWebViewManager.m" target="_blank">native code for web views</a>, as you will have to use this as a reference when implementing new features—although a deep understanding is not required.</p><h2><a class="anchor" name="native-code"></a>Native Code <a class="hash-link" href="docs/custom-webview-ios.html#native-code">#</a></h2><p>Like for regular native components, you need a view manager and an web view.</p><p>For the view, you'll need to make a subclass of <code>RCTWebView</code>.</p><div class="prism language-objc"><span class="token comment" spellcheck="true">// RCTCustomWebView.h
</span>#<span class="token keyword">import</span> <span class="token operator">&lt;</span>React<span class="token operator">/</span>RCTWebView<span class="token punctuation">.</span>h<span class="token operator">&gt;</span>

@<span class="token keyword">interface</span> <span class="token class-name">RCTCustomWebView</span> <span class="token punctuation">:</span> RCTWebView

@end
<span class="token comment" spellcheck="true">
// RCTCustomWebView.m
</span>#<span class="token keyword">import</span> <span class="token string">"RCTCustomWebView.h"</span>

@<span class="token keyword">interface</span> <span class="token class-name">RCTCustomWebView</span> <span class="token punctuation">(</span><span class="token punctuation">)</span>

@end

@implementation RCTCustomWebView <span class="token punctuation">{</span> <span class="token punctuation">}</span>

@end</div><p>For the view manager, you need to make a subclass <code>RCTWebViewManager</code>. You must still include:</p><ul><li><code>(UIView *)view</code> that returns your custom view</li><li>The <code>RCT_EXPORT_MODULE()</code> tag</li></ul><div class="prism language-objc"><span class="token comment" spellcheck="true">// RCTCustomWebViewManager.h
</span>#<span class="token keyword">import</span> <span class="token operator">&lt;</span>React<span class="token operator">/</span>RCTWebViewManager<span class="token punctuation">.</span>h<span class="token operator">&gt;</span>

@<span class="token keyword">interface</span> <span class="token class-name">RCTCustomWebViewManager</span> <span class="token punctuation">:</span> RCTWebViewManager

@end
<span class="token comment" spellcheck="true">
// RCTCustomWebViewManager.m
</span>#<span class="token keyword">import</span> <span class="token string">"RCTCustomWebViewManager.h"</span>
#<span class="token keyword">import</span> <span class="token string">"RCTCustomWebView.h"</span>

@<span class="token keyword">interface</span> <span class="token class-name">RCTCustomWebViewManager</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">&lt;</span>RCTWebViewDelegate<span class="token operator">&gt;</span>

@end

@implementation RCTCustomWebViewManager <span class="token punctuation">{</span> <span class="token punctuation">}</span>

<span class="token function">RCT_EXPORT_MODULE</span><span class="token punctuation">(</span><span class="token punctuation">)</span>

<span class="token operator">-</span> <span class="token punctuation">(</span>UIView <span class="token operator">*</span><span class="token punctuation">)</span>view
<span class="token punctuation">{</span>
  RCTCustomWebView <span class="token operator">*</span>webView <span class="token operator">=</span> <span class="token punctuation">[</span>RCTCustomWebView <span class="token keyword">new</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
  webView<span class="token punctuation">.</span>delegate <span class="token operator">=</span> self<span class="token punctuation">;</span>
  <span class="token keyword">return</span> webView<span class="token punctuation">;</span>
<span class="token punctuation">}</span>

@end</div><h3><a class="anchor" name="adding-new-events-and-properties"></a>Adding New Events and Properties <a class="hash-link" href="docs/custom-webview-ios.html#adding-new-events-and-properties">#</a></h3><p>Adding new properties and events is the same as regular UI components. For properties, you define an <code>@property</code> in the header. For events, you define a <code>RCTDirectEventBlock</code> in the view's <code>@interface</code>.</p><div class="prism language-objc"><span class="token comment" spellcheck="true">// RCTCustomWebView.h
</span>@property <span class="token punctuation">(</span>nonatomic<span class="token punctuation">,</span> copy<span class="token punctuation">)</span> NSString <span class="token operator">*</span>finalUrl<span class="token punctuation">;</span>
<span class="token comment" spellcheck="true">
// RCTCustomWebView.m
</span>@<span class="token keyword">interface</span> <span class="token class-name">RCTCustomWebView</span> <span class="token punctuation">(</span><span class="token punctuation">)</span>

@property <span class="token punctuation">(</span>nonatomic<span class="token punctuation">,</span> copy<span class="token punctuation">)</span> RCTDirectEventBlock onNavigationCompleted<span class="token punctuation">;</span>

@end</div><p>Then expose it in the view manager's <code>@implementation</code>.</p><div class="prism language-objc"><span class="token comment" spellcheck="true">// RCTCustomWebViewManager.m
</span><span class="token function">RCT_EXPORT_VIEW_PROPERTY</span><span class="token punctuation">(</span>onNavigationCompleted<span class="token punctuation">,</span> RCTDirectEventBlock<span class="token punctuation">)</span>
<span class="token function">RCT_EXPORT_VIEW_PROPERTY</span><span class="token punctuation">(</span>finalUrl<span class="token punctuation">,</span> NSString<span class="token punctuation">)</span></div><h3><a class="anchor" name="extending-existing-events"></a>Extending Existing Events <a class="hash-link" href="docs/custom-webview-ios.html#extending-existing-events">#</a></h3><p>You should refer to  <a href="https://github.com/facebook/react-native/blob/master/React/Views/RCTWebView.m" target="_blank">RCTWebView.m</a> in the React Native codebase to see what handlers are available and how they are implemented. You can extend any methods here to provide extra functionality.</p><p>By default, most methods aren't exposed from RCTWebView. If you need to expose them, you need to create an <a href="https://developer.apple.com/library/content/documentation/Cocoa/Conceptual/ProgrammingWithObjectiveC/CustomizingExistingClasses/CustomizingExistingClasses.html" target="_blank">Objective C category</a>, and then expose all the methods you need to use.</p><div class="prism language-objc"><span class="token comment" spellcheck="true">// RCTWebView+Custom.h
</span>#<span class="token keyword">import</span> <span class="token operator">&lt;</span>React<span class="token operator">/</span>RCTWebView<span class="token punctuation">.</span>h<span class="token operator">&gt;</span>

@<span class="token keyword">interface</span> <span class="token class-name">RCTWebView</span> <span class="token punctuation">(</span>Custom<span class="token punctuation">)</span>
<span class="token operator">-</span> <span class="token punctuation">(</span>BOOL<span class="token punctuation">)</span>webView<span class="token punctuation">:</span><span class="token punctuation">(</span>__unused UIWebView <span class="token operator">*</span><span class="token punctuation">)</span>webView shouldStartLoadWithRequest<span class="token punctuation">:</span><span class="token punctuation">(</span>NSURLRequest <span class="token operator">*</span><span class="token punctuation">)</span>request navigationType<span class="token punctuation">:</span><span class="token punctuation">(</span>UIWebViewNavigationType<span class="token punctuation">)</span>navigationType<span class="token punctuation">;</span>
<span class="token operator">-</span> <span class="token punctuation">(</span>NSMutableDictionary<span class="token operator">&lt;</span>NSString <span class="token operator">*</span><span class="token punctuation">,</span> id<span class="token operator">&gt;</span> <span class="token operator">*</span><span class="token punctuation">)</span>baseEvent<span class="token punctuation">;</span>
@end</div><p>Once these are exposed, you can reference them in your custom web view class.</p><div class="prism language-objc"><span class="token comment" spellcheck="true">// RCTCustomWebView.m
</span><span class="token comment" spellcheck="true">
// Remember to import the category file.
</span>#<span class="token keyword">import</span> <span class="token string">"RCTWebView+Custom.h"</span>

<span class="token operator">-</span> <span class="token punctuation">(</span>BOOL<span class="token punctuation">)</span>webView<span class="token punctuation">:</span><span class="token punctuation">(</span>__unused UIWebView <span class="token operator">*</span><span class="token punctuation">)</span>webView shouldStartLoadWithRequest<span class="token punctuation">:</span><span class="token punctuation">(</span>NSURLRequest <span class="token operator">*</span><span class="token punctuation">)</span>request
 navigationType<span class="token punctuation">:</span><span class="token punctuation">(</span>UIWebViewNavigationType<span class="token punctuation">)</span>navigationType
<span class="token punctuation">{</span>
  BOOL allowed <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token keyword">super</span> webView<span class="token punctuation">:</span>webView shouldStartLoadWithRequest<span class="token punctuation">:</span>request navigationType<span class="token punctuation">:</span>navigationType<span class="token punctuation">]</span><span class="token punctuation">;</span>

  <span class="token keyword">if</span> <span class="token punctuation">(</span>allowed<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    NSString<span class="token operator">*</span> url <span class="token operator">=</span> request<span class="token punctuation">.</span>URL<span class="token punctuation">.</span>absoluteString<span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>url <span class="token operator">&amp;&amp;</span> <span class="token punctuation">[</span>url isEqualToString<span class="token punctuation">:</span>_finalUrl<span class="token punctuation">]</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">if</span> <span class="token punctuation">(</span>_onNavigationCompleted<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        NSMutableDictionary<span class="token operator">&lt;</span>NSString <span class="token operator">*</span><span class="token punctuation">,</span> id<span class="token operator">&gt;</span> <span class="token operator">*</span>event <span class="token operator">=</span> <span class="token punctuation">[</span>self baseEvent<span class="token punctuation">]</span><span class="token punctuation">;</span>
        <span class="token function">_onNavigationCompleted</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

  <span class="token keyword">return</span> allowed<span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><h2><a class="anchor" name="javascript-interface"></a>JavaScript Interface <a class="hash-link" href="docs/custom-webview-ios.html#javascript-interface">#</a></h2><p>To use your custom web view, you'll need to create a class for it. Your class must:</p><ul><li>Export all the prop types from <code>WebView.propTypes</code></li><li>Return a <code>WebView</code> component with the prop <code>nativeConfig.component</code> set to your native component (see below)</li></ul><p>To get your native component, you must use <code>requireNativeComponent</code>: the same as for regular custom components. However, you must pass in an extra third argument, <code>WebView.extraNativeComponentConfig</code>. This third argument contains prop types that are only required for native code.</p><div class="prism language-js">
<span class="token keyword">import</span> React<span class="token punctuation">,</span> <span class="token punctuation">{</span> Component<span class="token punctuation">,</span> PropTypes <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'react'</span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token punctuation">{</span> WebView<span class="token punctuation">,</span> requireNativeComponent<span class="token punctuation">,</span> NativeModules <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'react-native'</span><span class="token punctuation">;</span>
<span class="token keyword">const</span> <span class="token punctuation">{</span> CustomWebViewManager <span class="token punctuation">}</span> <span class="token operator">=</span> NativeModules<span class="token punctuation">;</span> 

<span class="token keyword">export</span> <span class="token keyword">default</span> <span class="token keyword">class</span> <span class="token class-name">CustomWebView</span> <span class="token keyword">extends</span> <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token keyword">static</span> propTypes <span class="token operator">=</span> WebView<span class="token punctuation">.</span>propTypes

  <span class="token function">render</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      <span class="token operator">&lt;</span>WebView
        <span class="token punctuation">{</span><span class="token operator">...</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span>
        nativeConfig<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span> 
          component<span class="token punctuation">:</span> RCTCustomWebView<span class="token punctuation">,</span>
          viewManager<span class="token punctuation">:</span> CustomWebViewManager
        <span class="token punctuation">}</span><span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">const</span> RCTCustomWebView <span class="token operator">=</span> <span class="token function">requireNativeComponent</span><span class="token punctuation">(</span>
  <span class="token string">'RCTCustomWebView'</span><span class="token punctuation">,</span>
  CustomWebView<span class="token punctuation">,</span>
  WebView<span class="token punctuation">.</span>extraNativeComponentConfig
<span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>If you want to add custom props to your native component, you can use <code>nativeConfig.props</code> on the web view. For iOS, you should also set the <code>nativeConfig.viewManager</code> prop with your custom WebView ViewManager as in the example above.</p><p>For events, the event handler must always be set to a function. This means it isn't safe to use the event handler directly from <code>this.props</code>, as the user might not have provided one. The standard approach is to create a event handler in your class, and then invoking the event handler given in <code>this.props</code> if it exists.</p><p>If you are unsure how something should be implemented from the JS side, look at <a href="https://github.com/facebook/react-native/blob/master/Libraries/Components/WebView/WebView.ios.js" target="_blank">WebView.ios.js</a> in the React Native source.</p><div class="prism language-js"><span class="token keyword">export</span> <span class="token keyword">default</span> <span class="token keyword">class</span> <span class="token class-name">CustomWebView</span> <span class="token keyword">extends</span> <span class="token class-name">Component</span> <span class="token punctuation">{</span>
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
          <span class="token punctuation">}</span><span class="token punctuation">,</span>
          viewManager<span class="token punctuation">:</span> CustomWebViewManager
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
<span class="token punctuation">)</span><span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-prev btn" href="docs/native-components-ios.html#content">← Previous</a><a class="docs-next btn" href="docs/linking-libraries-ios.html#content">Continue Reading →</a></div><p class="edit-page-block"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/CustomWebViewIOS.md">Improve this page</a> by sending a pull request!</p>