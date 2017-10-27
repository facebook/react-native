---
id: version-0.25-native-modules-android
title: native-modules-android
original_id: native-modules-android
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="native-modules"></a>Native Modules <a class="hash-link" href="docs/native-modules-android.html#native-modules">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/NativeModulesAndroid.md">Edit on GitHub</a></td></tr></tbody></table><div><p>Sometimes an app needs access to a platform API that React Native doesn't have a corresponding module for yet. Maybe you want to reuse some existing Java code without having to reimplement it in JavaScript, or write some high performance, multi-threaded code such as for image processing, a database, or any number of advanced extensions.</p><p>We designed React Native such that it is possible for you to write real native code and have access to the full power of the platform. This is a more advanced feature and we don't expect it to be part of the usual development process, however it is essential that it exists. If React Native doesn't support a native feature that you need, you should be able to build it yourself.</p><h2><a class="anchor" name="the-toast-module"></a>The Toast Module <a class="hash-link" href="docs/native-modules-android.html#the-toast-module">#</a></h2><p>This guide will use the <a href="http://developer.android.com/reference/android/widget/Toast.html" target="_blank">Toast</a> example. Let's say we would like to be able to create a toast message from JavaScript.</p><p>We start by creating a native module. A native module is a Java class that usually extends the <code>ReactContextBaseJavaModule</code> class and implements the functionality required by the JavaScript. Our goal here is to be able to write <code>ToastAndroid.show('Awesome', ToastAndroid.SHORT);</code> from JavaScript to display a short toast on the screen.</p><div class="prism language-javascript">package com<span class="token punctuation">.</span>facebook<span class="token punctuation">.</span>react<span class="token punctuation">.</span>modules<span class="token punctuation">.</span>toast<span class="token punctuation">;</span>

import android<span class="token punctuation">.</span>widget<span class="token punctuation">.</span>Toast<span class="token punctuation">;</span>

import com<span class="token punctuation">.</span>facebook<span class="token punctuation">.</span>react<span class="token punctuation">.</span>bridge<span class="token punctuation">.</span>NativeModule<span class="token punctuation">;</span>
import com<span class="token punctuation">.</span>facebook<span class="token punctuation">.</span>react<span class="token punctuation">.</span>bridge<span class="token punctuation">.</span>ReactApplicationContext<span class="token punctuation">;</span>
import com<span class="token punctuation">.</span>facebook<span class="token punctuation">.</span>react<span class="token punctuation">.</span>bridge<span class="token punctuation">.</span>ReactContext<span class="token punctuation">;</span>
import com<span class="token punctuation">.</span>facebook<span class="token punctuation">.</span>react<span class="token punctuation">.</span>bridge<span class="token punctuation">.</span>ReactContextBaseJavaModule<span class="token punctuation">;</span>
import com<span class="token punctuation">.</span>facebook<span class="token punctuation">.</span>react<span class="token punctuation">.</span>bridge<span class="token punctuation">.</span>ReactMethod<span class="token punctuation">;</span>

import java<span class="token punctuation">.</span>util<span class="token punctuation">.</span>Map<span class="token punctuation">;</span>

public class <span class="token class-name">ToastModule</span> extends <span class="token class-name">ReactContextBaseJavaModule</span> <span class="token punctuation">{</span>

  private static final String DURATION_SHORT_KEY <span class="token operator">=</span> <span class="token string">"SHORT"</span><span class="token punctuation">;</span>
  private static final String DURATION_LONG_KEY <span class="token operator">=</span> <span class="token string">"LONG"</span><span class="token punctuation">;</span>

  public <span class="token function">ToastModule<span class="token punctuation">(</span></span>ReactApplicationContext reactContext<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>reactContext<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p><code>ReactContextBaseJavaModule</code> requires that a method called <code>getName</code> is implemented. The purpose of this method is to return the string name of the <code>NativeModule</code> which represents this class in JavaScript. So here we will call this <code>ToastAndroid</code> so that we can access it through <code>React.NativeModules.ToastAndroid</code> in JavaScript.</p><div class="prism language-javascript">  @Override
  public String <span class="token function">getName<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token string">"ToastAndroid"</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span></div><p>An optional method called <code>getConstants</code> returns the constant values exposed to JavaScript. Its implementation is not required but is very useful to key pre-defined values that need to be communicated from JavaScript to Java in sync.</p><div class="prism language-javascript">  @Override
  public Map&lt;String<span class="token punctuation">,</span> Object<span class="token operator">&gt;</span> <span class="token function">getConstants<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    final Map&lt;String<span class="token punctuation">,</span> Object<span class="token operator">&gt;</span> constants <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">HashMap</span>&lt;<span class="token operator">&gt;</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    constants<span class="token punctuation">.</span><span class="token function">put<span class="token punctuation">(</span></span>DURATION_SHORT_KEY<span class="token punctuation">,</span> Toast<span class="token punctuation">.</span>LENGTH_SHORT<span class="token punctuation">)</span><span class="token punctuation">;</span>
    constants<span class="token punctuation">.</span><span class="token function">put<span class="token punctuation">(</span></span>DURATION_LONG_KEY<span class="token punctuation">,</span> Toast<span class="token punctuation">.</span>LENGTH_LONG<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> constants<span class="token punctuation">;</span>
  <span class="token punctuation">}</span></div><p>To expose a method to JavaScript a Java method must be annotated using <code>@ReactMethod</code>. The return type of bridge methods is always <code>void</code>. React Native bridge is asynchronous, so the only way to pass a result to JavaScript is by using callbacks or emitting events (see below).</p><div class="prism language-javascript">  @ReactMethod
  public void <span class="token function">show<span class="token punctuation">(</span></span>String message<span class="token punctuation">,</span> int duration<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    Toast<span class="token punctuation">.</span><span class="token function">makeText<span class="token punctuation">(</span></span><span class="token function">getReactApplicationContext<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">,</span> message<span class="token punctuation">,</span> duration<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">show<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span></div><h3><a class="anchor" name="argument-types"></a>Argument Types <a class="hash-link" href="docs/native-modules-android.html#argument-types">#</a></h3><p>The following argument types are supported for methods annotated with <code>@ReactMethod</code> and they directly map to their JavaScript equivalents</p><div class="prism language-javascript">Boolean <span class="token operator">-</span><span class="token operator">&gt;</span> Bool
Integer <span class="token operator">-</span><span class="token operator">&gt;</span> Number
Double <span class="token operator">-</span><span class="token operator">&gt;</span> Number
Float <span class="token operator">-</span><span class="token operator">&gt;</span> Number
String <span class="token operator">-</span><span class="token operator">&gt;</span> String
Callback <span class="token operator">-</span><span class="token operator">&gt;</span> <span class="token keyword">function</span>
ReadableMap <span class="token operator">-</span><span class="token operator">&gt;</span> Object
ReadableArray <span class="token operator">-</span><span class="token operator">&gt;</span> Array</div><p>Read more about <a href="https://github.com/facebook/react-native/blob/master/ReactAndroid/src/main/java/com/facebook/react/bridge/ReadableMap.java" target="_blank">ReadableMap</a> and <a href="https://github.com/facebook/react-native/blob/master/ReactAndroid/src/main/java/com/facebook/react/bridge/ReadableArray.java" target="_blank">ReadableArray</a></p><h3><a class="anchor" name="register-the-module"></a>Register the Module <a class="hash-link" href="docs/native-modules-android.html#register-the-module">#</a></h3><p>The last step within Java is to register the Module; this happens in the <code>createNativeModules</code> of your apps package. If a module is not registered it will not be available from JavaScript.</p><div class="prism language-javascript">class <span class="token class-name">AnExampleReactPackage</span> implements <span class="token class-name">ReactPackage</span> <span class="token punctuation">{</span>

  @Override
  public List&lt;Class&lt;<span class="token operator">?</span> extends <span class="token class-name">JavaScriptModule</span><span class="token operator">&gt;</span><span class="token operator">&gt;</span> <span class="token function">createJSModules<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> Collections<span class="token punctuation">.</span><span class="token function">emptyList<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  @Override
  public List&lt;ViewManager<span class="token operator">&gt;</span> <span class="token function">createViewManagers<span class="token punctuation">(</span></span>ReactApplicationContext reactContext<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> Collections<span class="token punctuation">.</span><span class="token function">emptyList<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  @Override
  public List&lt;NativeModule<span class="token operator">&gt;</span> <span class="token function">createNativeModules<span class="token punctuation">(</span></span>
                              ReactApplicationContext reactContext<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    List&lt;NativeModule<span class="token operator">&gt;</span> modules <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ArrayList</span>&lt;<span class="token operator">&gt;</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    modules<span class="token punctuation">.</span><span class="token function">add<span class="token punctuation">(</span></span><span class="token keyword">new</span> <span class="token class-name">ToastModule</span><span class="token punctuation">(</span>reactContext<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">return</span> modules<span class="token punctuation">;</span>
  <span class="token punctuation">}</span></div><p>The package needs to be provided in the <code>getPackages</code> method of the <code>MainActivity.java</code> file. This file exists under the android folder in your react-native application directory. The path to this file is: <code>android/app/src/main/java/com/your-app-name/MainActivity.java</code>.</p><div class="prism language-javascript">protected List&lt;ReactPackage<span class="token operator">&gt;</span> <span class="token function">getPackages<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> Arrays<span class="token punctuation">.</span>&lt;ReactPackage<span class="token operator">&gt;</span><span class="token function">asList<span class="token punctuation">(</span></span>
            <span class="token keyword">new</span> <span class="token class-name">MainReactPackage</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
            <span class="token keyword">new</span> <span class="token class-name">AnExampleReactPackage</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span><span class="token comment" spellcheck="true"> // &lt;-- Add this line with your package name.
</span><span class="token punctuation">}</span></div><p>To make it simpler to access your new functionality from JavaScript, it is common to wrap the native module in a JavaScript module. This is not necessary but saves the consumers of your library the need to pull it off of <code>NativeModules</code> each time. This JavaScript file also becomes a good location for you to add any JavaScript side functionality.</p><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>
<span class="token comment" spellcheck="true">/**
 * This exposes the native ToastAndroid module as a JS module. This has a
 * function 'show' which takes the following parameters:
 *
 * 1. String message: A string with the text to toast
 * 2. int duration: The duration of the toast. May be ToastAndroid.SHORT or
 *    ToastAndroid.LONG
 */</span>
import <span class="token punctuation">{</span> NativeModules <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>
module<span class="token punctuation">.</span>exports <span class="token operator">=</span> NativeModules<span class="token punctuation">.</span>ToastAndroid<span class="token punctuation">;</span></div><p>Now, from your other JavaScript file you can call the method like this:</p><div class="prism language-javascript">import ToastAndroid from <span class="token string">'./ToastAndroid'</span><span class="token punctuation">;</span>

ToastAndroid<span class="token punctuation">.</span><span class="token function">show<span class="token punctuation">(</span></span><span class="token string">'Awesome'</span><span class="token punctuation">,</span> ToastAndroid<span class="token punctuation">.</span>SHORT<span class="token punctuation">)</span><span class="token punctuation">;</span></div><h2><a class="anchor" name="beyond-toasts"></a>Beyond Toasts <a class="hash-link" href="docs/native-modules-android.html#beyond-toasts">#</a></h2><h3><a class="anchor" name="callbacks"></a>Callbacks <a class="hash-link" href="docs/native-modules-android.html#callbacks">#</a></h3><p>Native modules also support a special kind of argument - a callback. In most cases it is used to provide the function call result to JavaScript.</p><div class="prism language-javascript">public class <span class="token class-name">UIManagerModule</span> extends <span class="token class-name">ReactContextBaseJavaModule</span> <span class="token punctuation">{</span>

<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>

  @ReactMethod
  public void <span class="token function">measureLayout<span class="token punctuation">(</span></span>
      int tag<span class="token punctuation">,</span>
      int ancestorTag<span class="token punctuation">,</span>
      Callback errorCallback<span class="token punctuation">,</span>
      Callback successCallback<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">try</span> <span class="token punctuation">{</span>
      <span class="token function">measureLayout<span class="token punctuation">(</span></span>tag<span class="token punctuation">,</span> ancestorTag<span class="token punctuation">,</span> mMeasureBuffer<span class="token punctuation">)</span><span class="token punctuation">;</span>
      float relativeX <span class="token operator">=</span> PixelUtil<span class="token punctuation">.</span><span class="token function">toDIPFromPixel<span class="token punctuation">(</span></span>mMeasureBuffer<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      float relativeY <span class="token operator">=</span> PixelUtil<span class="token punctuation">.</span><span class="token function">toDIPFromPixel<span class="token punctuation">(</span></span>mMeasureBuffer<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      float width <span class="token operator">=</span> PixelUtil<span class="token punctuation">.</span><span class="token function">toDIPFromPixel<span class="token punctuation">(</span></span>mMeasureBuffer<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      float height <span class="token operator">=</span> PixelUtil<span class="token punctuation">.</span><span class="token function">toDIPFromPixel<span class="token punctuation">(</span></span>mMeasureBuffer<span class="token punctuation">[</span><span class="token number">3</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      successCallback<span class="token punctuation">.</span><span class="token function">invoke<span class="token punctuation">(</span></span>relativeX<span class="token punctuation">,</span> relativeY<span class="token punctuation">,</span> width<span class="token punctuation">,</span> height<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">IllegalViewOperationException</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      errorCallback<span class="token punctuation">.</span><span class="token function">invoke<span class="token punctuation">(</span></span>e<span class="token punctuation">.</span><span class="token function">getMessage<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span></div><p>This method would be accessed in JavaScript using:</p><div class="prism language-javascript">UIManager<span class="token punctuation">.</span><span class="token function">measureLayout<span class="token punctuation">(</span></span>
  <span class="token number">100</span><span class="token punctuation">,</span>
  <span class="token number">100</span><span class="token punctuation">,</span>
  <span class="token punctuation">(</span>msg<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span>msg<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">(</span>x<span class="token punctuation">,</span> y<span class="token punctuation">,</span> width<span class="token punctuation">,</span> height<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span>x <span class="token operator">+</span> <span class="token string">':'</span> <span class="token operator">+</span> y <span class="token operator">+</span> <span class="token string">':'</span> <span class="token operator">+</span> width <span class="token operator">+</span> <span class="token string">':'</span> <span class="token operator">+</span> height<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>A native module is supposed to invoke its callback only once. It can, however, store the callback and invoke it later.</p><p>It is very important to highlight that the callback is not invoked immediately after the native function completes - remember that bridge communication is asynchronous, and this too is tied to the run loop.</p><h3><a class="anchor" name="promises"></a>Promises <a class="hash-link" href="docs/native-modules-android.html#promises">#</a></h3><p>Native modules can also fulfill a promise, which can simplify your code, especially when using ES2016's <code>async/await</code> syntax. When the last parameter of a bridged native method is a <code>Promise</code>, its corresponding JS method will return a JS Promise object.</p><p>Refactoring the above code to use a promise instead of callbacks looks like this:</p><div class="prism language-javascript">public class <span class="token class-name">UIManagerModule</span> extends <span class="token class-name">ReactContextBaseJavaModule</span> <span class="token punctuation">{</span>

<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>

  @ReactMethod
  public void <span class="token function">measureLayout<span class="token punctuation">(</span></span>
      int tag<span class="token punctuation">,</span>
      int ancestorTag<span class="token punctuation">,</span>
      Promise promise<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">try</span> <span class="token punctuation">{</span>
      <span class="token function">measureLayout<span class="token punctuation">(</span></span>tag<span class="token punctuation">,</span> ancestorTag<span class="token punctuation">,</span> mMeasureBuffer<span class="token punctuation">)</span><span class="token punctuation">;</span>

      WritableMap map <span class="token operator">=</span> Arguments<span class="token punctuation">.</span><span class="token function">createMap<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>

      map<span class="token punctuation">.</span><span class="token function">putDouble<span class="token punctuation">(</span></span><span class="token string">"relativeX"</span><span class="token punctuation">,</span> PixelUtil<span class="token punctuation">.</span><span class="token function">toDIPFromPixel<span class="token punctuation">(</span></span>mMeasureBuffer<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      map<span class="token punctuation">.</span><span class="token function">putDouble<span class="token punctuation">(</span></span><span class="token string">"relativeY"</span><span class="token punctuation">,</span> PixelUtil<span class="token punctuation">.</span><span class="token function">toDIPFromPixel<span class="token punctuation">(</span></span>mMeasureBuffer<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      map<span class="token punctuation">.</span><span class="token function">putDouble<span class="token punctuation">(</span></span><span class="token string">"width"</span><span class="token punctuation">,</span> PixelUtil<span class="token punctuation">.</span><span class="token function">toDIPFromPixel<span class="token punctuation">(</span></span>mMeasureBuffer<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      map<span class="token punctuation">.</span><span class="token function">putDouble<span class="token punctuation">(</span></span><span class="token string">"height"</span><span class="token punctuation">,</span> PixelUtil<span class="token punctuation">.</span><span class="token function">toDIPFromPixel<span class="token punctuation">(</span></span>mMeasureBuffer<span class="token punctuation">[</span><span class="token number">3</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

      promise<span class="token punctuation">.</span><span class="token function">resolve<span class="token punctuation">(</span></span>map<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">IllegalViewOperationException</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      promise<span class="token punctuation">.</span><span class="token function">reject<span class="token punctuation">(</span></span>e<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span></div><p>The JavaScript counterpart of this method returns a Promise. This means you can use the <code>await</code> keyword within an async function to call it and wait for its result:</p><div class="prism language-javascript">async <span class="token keyword">function</span> <span class="token function">measureLayout<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">try</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> <span class="token punctuation">{</span>
      relativeX<span class="token punctuation">,</span>
      relativeY<span class="token punctuation">,</span>
      width<span class="token punctuation">,</span>
      height<span class="token punctuation">,</span>
    <span class="token punctuation">}</span> <span class="token operator">=</span> await UIManager<span class="token punctuation">.</span><span class="token function">measureLayout<span class="token punctuation">(</span></span><span class="token number">100</span><span class="token punctuation">,</span> <span class="token number">100</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span>relativeX <span class="token operator">+</span> <span class="token string">':'</span> <span class="token operator">+</span> relativeY <span class="token operator">+</span> <span class="token string">':'</span> <span class="token operator">+</span> width <span class="token operator">+</span> <span class="token string">':'</span> <span class="token operator">+</span> height<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">e</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    console<span class="token punctuation">.</span><span class="token function">error<span class="token punctuation">(</span></span>e<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token function">measureLayout<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><h3><a class="anchor" name="threading"></a>Threading <a class="hash-link" href="docs/native-modules-android.html#threading">#</a></h3><p>Native modules should not have any assumptions about what thread they are being called on, as the current assignment is subject to change in the future. If a blocking call is required, the heavy work should be dispatched to an internally managed worker thread, and any callbacks distributed from there.</p><h3><a class="anchor" name="sending-events-to-javascript"></a>Sending Events to JavaScript <a class="hash-link" href="docs/native-modules-android.html#sending-events-to-javascript">#</a></h3><p>Native modules can signal events to JavaScript without being invoked directly. The easiest way to do this is to use the <code>RCTDeviceEventEmitter</code> which can be obtained from the <code>ReactContext</code> as in the code snippet below.</p><div class="prism language-javascript"><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
private void <span class="token function">sendEvent<span class="token punctuation">(</span></span>ReactContext reactContext<span class="token punctuation">,</span>
                       String eventName<span class="token punctuation">,</span>
                       @Nullable WritableMap params<span class="token punctuation">)</span> <span class="token punctuation">{</span>
  reactContext
      <span class="token punctuation">.</span><span class="token function">getJSModule<span class="token punctuation">(</span></span>DeviceEventManagerModule<span class="token punctuation">.</span>RCTDeviceEventEmitter<span class="token punctuation">.</span>class<span class="token punctuation">)</span>
      <span class="token punctuation">.</span><span class="token function">emit<span class="token punctuation">(</span></span>eventName<span class="token punctuation">,</span> params<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
WritableMap params <span class="token operator">=</span> Arguments<span class="token punctuation">.</span><span class="token function">createMap<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
<span class="token function">sendEvent<span class="token punctuation">(</span></span>reactContext<span class="token punctuation">,</span> <span class="token string">"keyboardWillShow"</span><span class="token punctuation">,</span> params<span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>JavaScript modules can then register to receive events by <code>addListenerOn</code> using the <code>Subscribable</code> mixin</p><div class="prism language-javascript">import <span class="token punctuation">{</span> DeviceEventEmitter <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>
<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>

<span class="token keyword">var</span> ScrollResponderMixin <span class="token operator">=</span> <span class="token punctuation">{</span>
  mixins<span class="token punctuation">:</span> <span class="token punctuation">[</span>Subscribable<span class="token punctuation">.</span>Mixin<span class="token punctuation">]</span><span class="token punctuation">,</span>


  componentWillMount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">addListenerOn<span class="token punctuation">(</span></span>DeviceEventEmitter<span class="token punctuation">,</span>
                       <span class="token string">'keyboardWillShow'</span><span class="token punctuation">,</span>
                       <span class="token keyword">this</span><span class="token punctuation">.</span>scrollResponderKeyboardWillShow<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  scrollResponderKeyboardWillShow<span class="token punctuation">:</span><span class="token keyword">function</span><span class="token punctuation">(</span>e<span class="token punctuation">:</span> Event<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>keyboardWillOpenTo <span class="token operator">=</span> e<span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>onKeyboardWillShow &amp;&amp; <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span><span class="token function">onKeyboardWillShow<span class="token punctuation">(</span></span>e<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span></div><p>You can also directly use the <code>DeviceEventEmitter</code> module to listen for events.</p><div class="prism language-javascript"><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
componentWillMount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  DeviceEventEmitter<span class="token punctuation">.</span><span class="token function">addListener<span class="token punctuation">(</span></span><span class="token string">'keyboardWillShow'</span><span class="token punctuation">,</span> <span class="token keyword">function</span><span class="token punctuation">(</span>e<span class="token punctuation">:</span> Event<span class="token punctuation">)</span> <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // handle event.
</span>  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span></div><h3><a class="anchor" name="getting-activity-result-from-startactivityforresult"></a>Getting activity result from <code>startActivityForResult</code> <a class="hash-link" href="docs/native-modules-android.html#getting-activity-result-from-startactivityforresult">#</a></h3><p>You'll need to listen to <code>onActivityResult</code> if you want to get results from an activity you started with <code>startActivityForResult</code>. To to do this, the module must implement <code>ActivityEventListener</code>. Then, you need to register a listener in the module's constructor,</p><div class="prism language-javascript">reactContext<span class="token punctuation">.</span><span class="token function">addActivityEventListener<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>Now you can listen to <code>onActivityResult</code> by implementing the following method:</p><div class="prism language-javascript">@Override
public void <span class="token function">onActivityResult<span class="token punctuation">(</span></span>final int requestCode<span class="token punctuation">,</span> final int resultCode<span class="token punctuation">,</span> final Intent intent<span class="token punctuation">)</span> <span class="token punctuation">{</span>
 <span class="token comment" spellcheck="true"> // Your logic here
</span><span class="token punctuation">}</span></div><p>We will implement a simple image picker to demonstrate this. The image picker will expose the method <code>pickImage</code> to JavaScript, which will return the path of the image when called.</p><div class="prism language-javascript">public class <span class="token class-name">ImagePickerModule</span> extends <span class="token class-name">ReactContextBaseJavaModule</span> implements <span class="token class-name">ActivityEventListener</span> <span class="token punctuation">{</span>

  private static final int IMAGE_PICKER_REQUEST <span class="token operator">=</span> <span class="token number">467081</span><span class="token punctuation">;</span>
  private static final String E_ACTIVITY_DOES_NOT_EXIST <span class="token operator">=</span> <span class="token string">"E_ACTIVITY_DOES_NOT_EXIST"</span><span class="token punctuation">;</span>
  private static final String E_PICKER_CANCELLED <span class="token operator">=</span> <span class="token string">"E_PICKER_CANCELLED"</span><span class="token punctuation">;</span>
  private static final String E_FAILED_TO_SHOW_PICKER <span class="token operator">=</span> <span class="token string">"E_FAILED_TO_SHOW_PICKER"</span><span class="token punctuation">;</span>
  private static final String E_NO_IMAGE_DATA_FOUND <span class="token operator">=</span> <span class="token string">"E_NO_IMAGE_DATA_FOUND"</span><span class="token punctuation">;</span>

  private Promise mPickerPromise<span class="token punctuation">;</span>

  public <span class="token function">ImagePickerModule<span class="token punctuation">(</span></span>ReactApplicationContext reactContext<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>reactContext<span class="token punctuation">)</span><span class="token punctuation">;</span>

   <span class="token comment" spellcheck="true"> // Add the listener for `onActivityResult`
</span>    reactContext<span class="token punctuation">.</span><span class="token function">addActivityEventListener<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  @Override
  public String <span class="token function">getName<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token string">"ImagePickerModule"</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  @ReactMethod
  public void <span class="token function">pickImage<span class="token punctuation">(</span></span>final Promise promise<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    Activity currentActivity <span class="token operator">=</span> <span class="token function">getCurrentActivity<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>currentActivity <span class="token operator">==</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      promise<span class="token punctuation">.</span><span class="token function">reject<span class="token punctuation">(</span></span>E_ACTIVITY_DOES_NOT_EXIST<span class="token punctuation">,</span> <span class="token string">"Activity doesn't exist"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">return</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

   <span class="token comment" spellcheck="true"> // Store the promise to resolve/reject when picker returns data
</span>    mPickerPromise <span class="token operator">=</span> promise<span class="token punctuation">;</span>

    <span class="token keyword">try</span> <span class="token punctuation">{</span>
      final Intent galleryIntent <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Intent</span><span class="token punctuation">(</span>Intent<span class="token punctuation">.</span>ACTION_PICK<span class="token punctuation">)</span><span class="token punctuation">;</span>

      galleryIntent<span class="token punctuation">.</span><span class="token function">setType<span class="token punctuation">(</span></span><span class="token string">"image/*"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

      final Intent chooserIntent <span class="token operator">=</span> Intent<span class="token punctuation">.</span><span class="token function">createChooser<span class="token punctuation">(</span></span>galleryIntent<span class="token punctuation">,</span> <span class="token string">"Pick an image"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

      currentActivity<span class="token punctuation">.</span><span class="token function">startActivityForResult<span class="token punctuation">(</span></span>chooserIntent<span class="token punctuation">,</span> PICK_IMAGE<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">Exception</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      mPickerPromise<span class="token punctuation">.</span><span class="token function">reject<span class="token punctuation">(</span></span>E_FAILED_TO_SHOW_PICKER<span class="token punctuation">,</span> e<span class="token punctuation">)</span><span class="token punctuation">;</span>
      mPickerPromise <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>

 <span class="token comment" spellcheck="true"> // You can get the result here
</span>  @Override
  public void <span class="token function">onActivityResult<span class="token punctuation">(</span></span>final int requestCode<span class="token punctuation">,</span> final int resultCode<span class="token punctuation">,</span> final Intent intent<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>requestCode <span class="token operator">==</span> IMAGE_PICKER_REQUEST<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">if</span> <span class="token punctuation">(</span>mPickerPromise <span class="token operator">!</span><span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>resultCode <span class="token operator">==</span> Activity<span class="token punctuation">.</span>RESULT_CANCELED<span class="token punctuation">)</span> <span class="token punctuation">{</span>
          mPickerPromise<span class="token punctuation">.</span><span class="token function">reject<span class="token punctuation">(</span></span>E_PICKER_CANCELLED<span class="token punctuation">,</span> <span class="token string">"Image picker was cancelled"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>resultCode <span class="token operator">==</span> Activity<span class="token punctuation">.</span>RESULT_OK<span class="token punctuation">)</span> <span class="token punctuation">{</span>
          Uri uri <span class="token operator">=</span> intent<span class="token punctuation">.</span><span class="token function">getData<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>

          <span class="token keyword">if</span> <span class="token punctuation">(</span>uri <span class="token operator">==</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            mPickerPromise<span class="token punctuation">.</span><span class="token function">reject<span class="token punctuation">(</span></span>E_NO_IMAGE_DATA_FOUND<span class="token punctuation">,</span> <span class="token string">"No image data found"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
            mPickerPromise<span class="token punctuation">.</span><span class="token function">resolve<span class="token punctuation">(</span></span>uri<span class="token punctuation">.</span><span class="token function">toString<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span>
        <span class="token punctuation">}</span>

        mPickerPromise <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><h3><a class="anchor" name="listening-to-lifecycle-events"></a>Listening to LifeCycle events <a class="hash-link" href="docs/native-modules-android.html#listening-to-lifecycle-events">#</a></h3><p>Listening to the activity's LifeCycle events such as <code>onResume</code>, <code>onPause</code> etc. is very similar to how we implemented <code>ActivityEventListener</code>. The module must implement <code>LifecycleEventListener</code>. Then, you need to register a listener in the module's constructor,</p><div class="prism language-javascript">reactContext<span class="token punctuation">.</span><span class="token function">addLifecycleEventListener<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>Now you can listen to the activity's LifeCycle events by implementing the following methods:</p><div class="prism language-javascript">@Override
public void <span class="token function">onHostResume<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // Actvity `onResume`
</span><span class="token punctuation">}</span>

@Override
public void <span class="token function">onHostPause<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // Actvity `onPause`
</span><span class="token punctuation">}</span>

@Override
public void <span class="token function">onHostDestroy<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // Actvity `onDestroy`
</span><span class="token punctuation">}</span></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/native-components-android.html#content">Next →</a></div><div class="survey"><div class="survey-image"></div><p>We are planning improvements to the React Native documentation. Your responses to this short survey will go a long way in helping us provide valuable content. Thank you!</p><center><a class="button" href="https://www.facebook.com/survey?oid=681969738611332">Take Survey</a></center></div>