---
id: accessibilityinfo
title: accessibilityinfo
---
<a id="content"></a><h1><a class="anchor" name="accessibilityinfo"></a>AccessibilityInfo <a class="hash-link" href="docs/accessibilityinfo.html#accessibilityinfo">#</a></h1><div><div><p>Sometimes it's useful to know whether or not the device has a screen reader that is currently active. The
<code>AccessibilityInfo</code> API is designed for this purpose. You can use it to query the current state of the
screen reader as well as to register to be notified when the state of the screen reader changes.</p><p>Here's a small example illustrating how to use <code>AccessibilityInfo</code>:</p><div class="prism language-javascript">class <span class="token class-name">ScreenReaderStatusExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    screenReaderEnabled<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span>

  <span class="token function">componentDidMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    AccessibilityInfo<span class="token punctuation">.</span><span class="token function">addEventListener<span class="token punctuation">(</span></span>
      <span class="token string">'change'</span><span class="token punctuation">,</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>_handleScreenReaderToggled
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
    AccessibilityInfo<span class="token punctuation">.</span><span class="token function">fetch<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">done<span class="token punctuation">(</span></span><span class="token punctuation">(</span>isEnabled<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
        screenReaderEnabled<span class="token punctuation">:</span> isEnabled
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">componentWillUnmount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    AccessibilityInfo<span class="token punctuation">.</span><span class="token function">removeEventListener<span class="token punctuation">(</span></span>
      <span class="token string">'change'</span><span class="token punctuation">,</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>_handleScreenReaderToggled
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  _handleScreenReaderToggled <span class="token operator">=</span> <span class="token punctuation">(</span>isEnabled<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      screenReaderEnabled<span class="token punctuation">:</span> isEnabled<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          The screen reader is <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>screenReaderEnabled <span class="token operator">?</span> <span class="token string">'enabled'</span> <span class="token punctuation">:</span> <span class="token string">'disabled'</span><span class="token punctuation">}</span><span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/accessibilityinfo.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="fetch"></a><span class="methodType">static </span>fetch<span class="methodType">()</span> <a class="hash-link" href="docs/accessibilityinfo.html#fetch">#</a></h4><div><p>Query whether a screen reader is currently enabled. Returns a promise which
resolves to a boolean. The result is <code>true</code> when a screen reader is enabled
and <code>false</code> otherwise.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="addeventlistener"></a><span class="methodType">static </span>addEventListener<span class="methodType">(eventName, handler)</span> <a class="hash-link" href="docs/accessibilityinfo.html#addeventlistener">#</a></h4><div><p>Add an event handler. Supported events:</p><ul><li><code>change</code>: Fires when the state of the screen reader changes. The argument
to the event handler is a boolean. The boolean is <code>true</code> when a screen
reader is enabled and <code>false</code> otherwise.</li></ul></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="removeeventlistener"></a><span class="methodType">static </span>removeEventListener<span class="methodType">(eventName, handler)</span> <a class="hash-link" href="docs/accessibilityinfo.html#removeeventlistener">#</a></h4><div><p>Remove an event handler.</p></div></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/AccessibilityInfo/AccessibilityInfo.ios.js">edit the content above on GitHub</a> and send us a pull request!</p><div class="docs-prevnext"><a class="docs-prev" href="docs/webview.html#content">← Prev</a><a class="docs-next" href="docs/actionsheetios.html#content">Next →</a></div>