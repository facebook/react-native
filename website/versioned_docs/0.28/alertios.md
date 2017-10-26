---
id: alertios
title: alertios
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="alertios"></a>AlertIOS <a class="hash-link" href="docs/alertios.html#alertios">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.28-stable/Libraries/Utilities/AlertIOS.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>The AlertsIOS utility provides two functions: <code>alert</code> and <code>prompt</code>. All
functionality available through <code>AlertIOS.alert</code> is also available in the
cross-platform <code>Alert.alert</code>, which we recommend you use if you don't need
iOS-specific functionality.</p><p><code>AlertIOS.prompt</code> allows you to prompt the user for input inside of an
alert popup.</p></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/alertios.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="alert"></a><span class="propType">static </span>alert<span class="propType">(title, message?, callbackOrButtons?, type?)</span> <a class="hash-link" href="docs/alertios.html#alert">#</a></h4><div><p>Creates a popup to alert the user. See
<a href="docs/alert.html" target="_blank">Alert</a>.</p><ul><li>title: string -- The dialog's title.</li><li>message: string -- An optional message that appears above the text input.</li><li><p>callbackOrButtons -- This optional argument should be either a
single-argument function or an array of buttons. If passed a function,
it will be called when the user taps 'OK'.</p><p>If passed an array of button configurations, each button should include
a <code>text</code> key, as well as optional <code>onPress</code> and <code>style</code> keys.
<code>style</code> should be one of 'default', 'cancel' or 'destructive'.</p></li><li>type -- <em>deprecated, do not use</em></li></ul><p>Example:</p><div class="prism language-javascript">AlertIOS<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
 <span class="token string">'Sync Complete'</span><span class="token punctuation">,</span>
 <span class="token string">'All your data are belong to us.'</span>
<span class="token punctuation">)</span><span class="token punctuation">;</span></div></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="prompt"></a><span class="propType">static </span>prompt<span class="propType">(title, message?, callbackOrButtons?, type?, defaultValue?)</span> <a class="hash-link" href="docs/alertios.html#prompt">#</a></h4><div><p>Prompt the user to enter some text.</p><ul><li>title: string -- The dialog's title.</li><li>message: string -- An optional message that appears above the text input.</li><li><p>callbackOrButtons -- This optional argument should be either a
single-argument function or an array of buttons. If passed a function,
it will be called with the prompt's value when the user taps 'OK'.</p><p>If passed an array of button configurations, each button should include
a <code>text</code> key, as well as optional <code>onPress</code> and <code>style</code> keys (see example).
<code>style</code> should be one of 'default', 'cancel' or 'destructive'.</p></li><li>type: string -- This configures the text input. One of 'plain-text',
'secure-text' or 'login-password'.</li><li>defaultValue: string -- the default value for the text field.</li></ul><p>Example with custom buttons:</p><div class="prism language-javascript">AlertIOS<span class="token punctuation">.</span><span class="token function">prompt<span class="token punctuation">(</span></span>
  <span class="token string">'Enter password'</span><span class="token punctuation">,</span>
  <span class="token string">'Enter your password to claim your $1.5B in lottery winnings'</span><span class="token punctuation">,</span>
  <span class="token punctuation">[</span>
    <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Cancel'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Cancel Pressed'</span><span class="token punctuation">)</span><span class="token punctuation">,</span> style<span class="token punctuation">:</span> <span class="token string">'cancel'</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'OK'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> password <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'OK Pressed, password: '</span> <span class="token operator">+</span> password<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token string">'secure-text'</span>
<span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>Example with the default button and a custom callback:</p><div class="prism language-javascript">AlertIOS<span class="token punctuation">.</span><span class="token function">prompt<span class="token punctuation">(</span></span>
  <span class="token string">'Update username'</span><span class="token punctuation">,</span>
  <span class="token keyword">null</span><span class="token punctuation">,</span>
  text <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">"Your username is "</span><span class="token operator">+</span>text<span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token keyword">null</span><span class="token punctuation">,</span>
  <span class="token string">'default'</span>
<span class="token punctuation">)</span></div></div></div></div></span></div><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/alertios.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.28-stable/Examples/UIExplorer/AlertIOSExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  StyleSheet<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  AlertIOS<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

<span class="token keyword">var</span> <span class="token punctuation">{</span> SimpleAlertExampleBlock <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./AlertExample'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>framework <span class="token operator">=</span> <span class="token string">'React'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'AlertIOS'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'iOS alerts and action sheets'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Alerts'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;SimpleAlertExampleBlock <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Prompt Options'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;PromptOptions <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Prompt Types'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> AlertIOS<span class="token punctuation">.</span><span class="token function">prompt<span class="token punctuation">(</span></span><span class="token string">'Plain Text Entry'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>

          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              plain<span class="token operator">-</span>text
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>

        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> AlertIOS<span class="token punctuation">.</span><span class="token function">prompt<span class="token punctuation">(</span></span><span class="token string">'Secure Text'</span><span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token string">'secure-text'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>

          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              secure<span class="token operator">-</span>text
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>

        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> AlertIOS<span class="token punctuation">.</span><span class="token function">prompt<span class="token punctuation">(</span></span><span class="token string">'Login &amp; Password'</span><span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token string">'login-password'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>

          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              login<span class="token operator">-</span>password
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>

        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">;</span>

class <span class="token class-name">PromptOptions</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state<span class="token punctuation">:</span> any<span class="token punctuation">;</span>
  customButtons<span class="token punctuation">:</span> Array&lt;Object<span class="token operator">&gt;</span><span class="token punctuation">;</span>

  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>

   <span class="token comment" spellcheck="true"> // $FlowFixMe this seems to be a Flow bug, `saveResponse` is defined below
</span>    <span class="token keyword">this</span><span class="token punctuation">.</span>saveResponse <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>saveResponse<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">this</span><span class="token punctuation">.</span>customButtons <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">{</span>
      text<span class="token punctuation">:</span> <span class="token string">'Custom OK'</span><span class="token punctuation">,</span>
      onPress<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>saveResponse
    <span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
      text<span class="token punctuation">:</span> <span class="token string">'Custom Cancel'</span><span class="token punctuation">,</span>
      style<span class="token punctuation">:</span> <span class="token string">'cancel'</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">;</span>

    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>
      promptValue<span class="token punctuation">:</span> undefined<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginBottom<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>Prompt value<span class="token punctuation">:</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>promptValue<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>

        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> AlertIOS<span class="token punctuation">.</span><span class="token function">prompt<span class="token punctuation">(</span></span><span class="token string">'Type a value'</span><span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>saveResponse<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>

          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              prompt <span class="token keyword">with</span> title &amp; callback
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>

        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> AlertIOS<span class="token punctuation">.</span><span class="token function">prompt<span class="token punctuation">(</span></span><span class="token string">'Type a value'</span><span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>customButtons<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>

          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              prompt <span class="token keyword">with</span> title &amp; custom buttons
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>

        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> AlertIOS<span class="token punctuation">.</span><span class="token function">prompt<span class="token punctuation">(</span></span><span class="token string">'Type a value'</span><span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>saveResponse<span class="token punctuation">,</span> undefined<span class="token punctuation">,</span> <span class="token string">'Default value'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>

          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              prompt <span class="token keyword">with</span> title<span class="token punctuation">,</span> callback &amp; default value
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>

        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> AlertIOS<span class="token punctuation">.</span><span class="token function">prompt<span class="token punctuation">(</span></span><span class="token string">'Type a value'</span><span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>customButtons<span class="token punctuation">,</span> <span class="token string">'login-password'</span><span class="token punctuation">,</span> <span class="token string">'admin@site.com'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>

          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              prompt <span class="token keyword">with</span> title<span class="token punctuation">,</span> custom buttons<span class="token punctuation">,</span> login<span class="token operator">/</span>password &amp; default value
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">saveResponse<span class="token punctuation">(</span></span>promptValue<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span> promptValue<span class="token punctuation">:</span> JSON<span class="token punctuation">.</span><span class="token function">stringify<span class="token punctuation">(</span></span>promptValue<span class="token punctuation">)</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  wrapper<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  button<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#eeeeee'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/animated.html#content">Next →</a></div>