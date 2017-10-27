---
id: version-0.50-accessibilityinfo
title: accessibilityinfo
original_id: accessibilityinfo
---
<a id="content"></a><h1><a class="anchor" name="accessibilityinfo"></a>AccessibilityInfo <a class="hash-link" href="docs/accessibilityinfo.html#accessibilityinfo">#</a></h1><div><div><p>Sometimes it's useful to know whether or not the device has a screen reader that is currently active. The
<code>AccessibilityInfo</code> API is designed for this purpose. You can use it to query the current state of the
screen reader as well as to register to be notified when the state of the screen reader changes.</p><p>Here's a small example illustrating how to use <code>AccessibilityInfo</code>:</p><div class="prism language-javascript"><span class="token keyword">class</span> <span class="token class-name">ScreenReaderStatusExample</span> <span class="token keyword">extends</span> <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    screenReaderEnabled<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span>

  <span class="token function">componentDidMount</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    AccessibilityInfo<span class="token punctuation">.</span><span class="token function">addEventListener</span><span class="token punctuation">(</span>
      <span class="token string">'change'</span><span class="token punctuation">,</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>_handleScreenReaderToggled
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
    AccessibilityInfo<span class="token punctuation">.</span><span class="token function">fetch</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">done</span><span class="token punctuation">(</span><span class="token punctuation">(</span>isEnabled<span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState</span><span class="token punctuation">(</span><span class="token punctuation">{</span>
        screenReaderEnabled<span class="token punctuation">:</span> isEnabled
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">componentWillUnmount</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    AccessibilityInfo<span class="token punctuation">.</span><span class="token function">removeEventListener</span><span class="token punctuation">(</span>
      <span class="token string">'change'</span><span class="token punctuation">,</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>_handleScreenReaderToggled
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  _handleScreenReaderToggled <span class="token operator">=</span> <span class="token punctuation">(</span>isEnabled<span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState</span><span class="token punctuation">(</span><span class="token punctuation">{</span>
      screenReaderEnabled<span class="token punctuation">:</span> isEnabled<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      <span class="token operator">&lt;</span>View<span class="token operator">&gt;</span>
        <span class="token operator">&lt;</span>Text<span class="token operator">&gt;</span>
          The screen reader is <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>screenReaderEnabled <span class="token operator">?</span> <span class="token string">'enabled'</span> <span class="token punctuation">:</span> <span class="token string">'disabled'</span><span class="token punctuation">}</span><span class="token punctuation">.</span>
        <span class="token operator">&lt;</span><span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      <span class="token operator">&lt;</span><span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/accessibilityinfo.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="fetch"></a><span class="methodType">static </span>fetch<span class="methodType">()</span> <a class="hash-link" href="docs/accessibilityinfo.html#fetch">#</a></h4><div><p>Query whether a screen reader is currently enabled. Returns a promise which
resolves to a boolean. The result is <code>true</code> when a screen reader is enabled
and <code>false</code> otherwise.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="addeventlistener"></a><span class="methodType">static </span>addEventListener<span class="methodType">(eventName, handler)</span> <a class="hash-link" href="docs/accessibilityinfo.html#addeventlistener">#</a></h4><div><p>Add an event handler. Supported events:</p><ul><li><code>change</code>: Fires when the state of the screen reader changes. The argument
to the event handler is a boolean. The boolean is <code>true</code> when a screen
reader is enabled and <code>false</code> otherwise.</li><li><code>announcementFinished</code>: iOS-only event. Fires when the screen reader has
finished making an announcement. The argument to the event handler is a dictionary
with these keys:<ul><li><code>announcement</code>: The string announced by the screen reader.</li><li><code>success</code>: A boolean indicating whether the announcement was successfully made.</li></ul></li></ul></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="setaccessibilityfocus"></a><span class="methodType">static </span>setAccessibilityFocus<span class="methodType">(reactTag)</span> <a class="hash-link" href="docs/accessibilityinfo.html#setaccessibilityfocus">#</a></h4><div><p>iOS-Only. Set accessibility focus to a react component.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="announceforaccessibility"></a><span class="methodType">static </span>announceForAccessibility<span class="methodType">(announcement)</span> <a class="hash-link" href="docs/accessibilityinfo.html#announceforaccessibility">#</a></h4><div><p>iOS-Only. Post a string to be announced by the screen reader.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="removeeventlistener"></a><span class="methodType">static </span>removeEventListener<span class="methodType">(eventName, handler)</span> <a class="hash-link" href="docs/accessibilityinfo.html#removeeventlistener">#</a></h4><div><p>Remove an event handler.</p></div></div></div></span></div><p class="edit-page-block"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/AccessibilityInfo/AccessibilityInfo.ios.js">Improve this page</a> by sending a pull request!</p><div class="docs-prevnext"><a class="docs-prev" href="docs/webview.html#content">← Prev</a><a class="docs-next" href="docs/actionsheetios.html#content">Next →</a></div>