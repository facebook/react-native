---
id: version-0.36-keyboard
original_id: keyboard
title: keyboard
---
<a id="content"></a><h1><a class="anchor" name="keyboard"></a>Keyboard <a class="hash-link" href="docs/keyboard.html#keyboard">#</a></h1><div><div><p><code>Keyboard</code> module to control keyboard events.</p><h3><a class="anchor" name="usage"></a>Usage <a class="hash-link" href="docs/keyboard.html#usage">#</a></h3><p>The Keyboard module allows you to listen for native events and react to them, as
well as make changes to the keyboard, like dismissing it.</p><div class="prism language-javascript">import React<span class="token punctuation">,</span> <span class="token punctuation">{</span> Component <span class="token punctuation">}</span> from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span> Keyboard<span class="token punctuation">,</span> TextInput <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>

class <span class="token class-name">Example</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  componentWillMount <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>keyboardDidShowListener <span class="token operator">=</span> Keyboard<span class="token punctuation">.</span><span class="token function">addListener<span class="token punctuation">(</span></span><span class="token string">'keyboardDidShow'</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_keyboardDidShow<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>keyboardDidHideListener <span class="token operator">=</span> Keyboard<span class="token punctuation">.</span><span class="token function">addListener<span class="token punctuation">(</span></span><span class="token string">'keyboardDidHide'</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_keyboardDidHide<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  componentWillUnmount <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>keyboardDidShowListener<span class="token punctuation">.</span><span class="token function">remove<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>keyboardDidHideListener<span class="token punctuation">.</span><span class="token function">remove<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  _keyboardDidShow <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">alert<span class="token punctuation">(</span></span><span class="token string">'Keyboard Shown'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  _keyboardDidHide <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">alert<span class="token punctuation">(</span></span><span class="token string">'Keyboard Hidden'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;TextInput
        onSubmitEditing<span class="token operator">=</span><span class="token punctuation">{</span>Keyboard<span class="token punctuation">.</span>dismiss<span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/keyboard.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="addlistener"></a><span class="methodType">static </span>addListener<span class="methodType">(eventName, callback)</span> <a class="hash-link" href="docs/keyboard.html#addlistener">#</a></h4><div><p>The <code>addListener</code> function connects a JavaScript function to an identified native
keyboard notification event.</p><p>This function then returns the reference to the listener.</p><p>@param {string} eventName The <code>nativeEvent</code> is the string that identifies the event you're listening for.  This
can be any of the following:</p><ul><li><code>keyboardWillShow</code></li><li><code>keyboardDidShow</code></li><li><code>keyboardWillHide</code></li><li><code>keyboardDidHide</code></li><li><code>keyboardWillChangeFrame</code></li><li><code>keyboardDidChangeFrame</code></li></ul><p>@param {function} callback function to be called when the event fires.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="removelistener"></a><span class="methodType">static </span>removeListener<span class="methodType">(eventName, callback)</span> <a class="hash-link" href="docs/keyboard.html#removelistener">#</a></h4><div><p>Removes a specific listener.</p><p>@param {string} eventName The <code>nativeEvent</code> is the string that identifies the event you're listening for.
@param {function} callback function to be called when the event fires.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="removealllisteners"></a><span class="methodType">static </span>removeAllListeners<span class="methodType">(eventName)</span> <a class="hash-link" href="docs/keyboard.html#removealllisteners">#</a></h4><div><p>Removes all listeners for a specific event type.</p><p>@param {string} eventType The native event string listeners are watching which will be removed.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="dismiss"></a><span class="methodType">static </span>dismiss<span class="methodType">(0)</span> <a class="hash-link" href="docs/keyboard.html#dismiss">#</a></h4><div><p>Dismisses the active keyboard and removes focus.</p></div></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/Keyboard/Keyboard.js">edit the content above on GitHub</a> and send us a pull request!</p><div class="docs-prevnext"><a class="docs-prev" href="docs/interactionmanager.html#content">← Prev</a><a class="docs-next" href="docs/layoutanimation.html#content">Next →</a></div>