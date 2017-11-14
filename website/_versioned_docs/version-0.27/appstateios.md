---
id: version-0.27-appstateios
original_id: appstateios
title: appstateios
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="appstateios"></a>AppStateIOS <a class="hash-link" href="docs/appstateios.html#appstateios">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.27-stable/Libraries/AppStateIOS/AppStateIOS.ios.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p><code>AppStateIOS</code> can tell you if the app is in the foreground or background,
and notify you when the state changes.</p><p>AppStateIOS is frequently used to determine the intent and proper behavior when
handling push notifications.</p><h3><a class="anchor" name="ios-app-states"></a>iOS App States <a class="hash-link" href="docs/appstateios.html#ios-app-states">#</a></h3><ul><li><code>active</code> - The app is running in the foreground</li><li><code>background</code> - The app is running in the background. The user is either
 in another app or on the home screen</li><li><code>inactive</code> - This is a state that occurs when transitioning between
   foreground &amp; background, and during periods of inactivity such as
   entering the Multitasking view or in the event of an incoming call</li></ul><p>For more information, see
<a href="https://developer.apple.com/library/ios/documentation/iPhone/Conceptual/iPhoneOSProgrammingGuide/TheAppLifeCycle/TheAppLifeCycle.html" target="_blank">Apple's documentation</a></p><h3><a class="anchor" name="basic-usage"></a>Basic Usage <a class="hash-link" href="docs/appstateios.html#basic-usage">#</a></h3><p>To see the current state, you can check <code>AppStateIOS.currentState</code>, which
will be kept up-to-date. However, <code>currentState</code> will be null at launch
while <code>AppStateIOS</code> retrieves it over the bridge.</p><div class="prism language-javascript">getInitialState<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">{</span>
    currentAppState<span class="token punctuation">:</span> AppStateIOS<span class="token punctuation">.</span>currentState<span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span>
componentDidMount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  AppStateIOS<span class="token punctuation">.</span><span class="token function">addEventListener<span class="token punctuation">(</span></span><span class="token string">'change'</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_handleAppStateChange<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span>
componentWillUnmount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  AppStateIOS<span class="token punctuation">.</span><span class="token function">removeEventListener<span class="token punctuation">(</span></span><span class="token string">'change'</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_handleAppStateChange<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span>
_handleAppStateChange<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>currentAppState<span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span> currentAppState<span class="token punctuation">,</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span>
render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    &lt;Text<span class="token operator">&gt;</span>Current state is<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>currentAppState<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span></div><p>This example will only ever appear to say "Current state is: active" because
the app is only visible to the user when in the <code>active</code> state, and the null
state will happen only momentarily.</p></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/appstateios.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="addeventlistener"></a><span class="propType">static </span>addEventListener<span class="propType">(type, handler)</span> <a class="hash-link" href="docs/appstateios.html#addeventlistener">#</a></h4><div><p>Add a handler to AppState changes by listening to the <code>change</code> event type
and providing the handler</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="removeeventlistener"></a><span class="propType">static </span>removeEventListener<span class="propType">(type, handler)</span> <a class="hash-link" href="docs/appstateios.html#removeeventlistener">#</a></h4><div><p>Remove a handler by passing the <code>change</code> event type and the handler</p></div></div></div></span><span><h3><a class="anchor" name="properties"></a>Properties <a class="hash-link" href="docs/appstateios.html#properties">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="currentstate"></a>currentState<span class="propType">: TypeCastExpression</span> <a class="hash-link" href="docs/appstateios.html#currentstate">#</a></h4><div><p>// TODO: getCurrentAppState callback seems to be called at a really late stage
// after app launch. Trying to get currentState when mounting App component
// will likely to have the initial value here.
// Initialize to 'active' instead of null.</p></div></div></div></span></div><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/appstateios.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.27-stable/Examples/UIExplorer/AppStateIOSExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  AppStateIOS<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

<span class="token keyword">var</span> AppStateSubscription <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      appState<span class="token punctuation">:</span> AppStateIOS<span class="token punctuation">.</span>currentState<span class="token punctuation">,</span>
      previousAppStates<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
      memoryWarnings<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  componentDidMount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    AppStateIOS<span class="token punctuation">.</span><span class="token function">addEventListener<span class="token punctuation">(</span></span><span class="token string">'change'</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_handleAppStateChange<span class="token punctuation">)</span><span class="token punctuation">;</span>
    AppStateIOS<span class="token punctuation">.</span><span class="token function">addEventListener<span class="token punctuation">(</span></span><span class="token string">'memoryWarning'</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_handleMemoryWarning<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  componentWillUnmount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    AppStateIOS<span class="token punctuation">.</span><span class="token function">removeEventListener<span class="token punctuation">(</span></span><span class="token string">'change'</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_handleAppStateChange<span class="token punctuation">)</span><span class="token punctuation">;</span>
    AppStateIOS<span class="token punctuation">.</span><span class="token function">removeEventListener<span class="token punctuation">(</span></span><span class="token string">'memoryWarning'</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_handleMemoryWarning<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  _handleMemoryWarning<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>memoryWarnings<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>memoryWarnings <span class="token operator">+</span> <span class="token number">1</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  _handleAppStateChange<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>appState<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> previousAppStates <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>previousAppStates<span class="token punctuation">.</span><span class="token function">slice<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    previousAppStates<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>appState<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      appState<span class="token punctuation">,</span>
      previousAppStates<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>showMemoryWarnings<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>memoryWarnings<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>showCurrentOnly<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>appState<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span>JSON<span class="token punctuation">.</span><span class="token function">stringify<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>previousAppStates<span class="token punctuation">)</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'AppStateIOS'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'iOS app background status'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'AppStateIOS.currentState'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Can be null on app initialization'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span>AppStateIOS<span class="token punctuation">.</span>currentState<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Subscribed AppStateIOS:'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'This changes according to the current state, so you can only ever see it rendered as "active"'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;AppStateSubscription showCurrentOnly<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Previous states:'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;AppStateSubscription showCurrentOnly<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Memory Warnings'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'In the simulator, hit Shift+Command+M to simulate a memory warning.'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;AppStateSubscription showMemoryWarnings<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/appstate.html#content">Next →</a></div>