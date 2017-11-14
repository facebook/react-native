---
id: version-0.30-alertios
original_id: alertios
title: alertios
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="alertios"></a>AlertIOS <a class="hash-link" href="docs/alertios.html#alertios">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.30-stable/Libraries/Utilities/AlertIOS.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p><code>AlertIOS</code> provides functionality to create an iOS alert dialog with a
message or create a prompt for user input.</p><p>Creating an iOS alert:</p><div class="prism language-javascript">AlertIOS<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
 <span class="token string">'Sync Complete'</span><span class="token punctuation">,</span>
 <span class="token string">'All your data are belong to us.'</span>
<span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>Creating an iOS prompt:</p><div class="prism language-javascript">AlertIOS<span class="token punctuation">.</span><span class="token function">prompt<span class="token punctuation">(</span></span>
  <span class="token string">'Enter a value'</span><span class="token punctuation">,</span>
  <span class="token keyword">null</span><span class="token punctuation">,</span>
  text <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">"You entered "</span><span class="token operator">+</span>text<span class="token punctuation">)</span>
<span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>We recommend using the <a href="/docs/alert.html" target=""><code>Alert.alert</code></a> method for
cross-platform support if you don't need to create iOS-only prompts.</p></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/alertios.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="alert"></a><span class="methodType">static </span>alert<span class="methodType">(title, message?, callbackOrButtons?, type?)</span> <a class="hash-link" href="docs/alertios.html#alert">#</a></h4><div><p>Create and display a popup alert.</p></div><div><strong>Parameters:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>title<br><br><div><span>string</span></div></td><td class="description"><div><p>The dialog's title.</p></div></td></tr><tr><td>[message]<br><br><div><span>string</span></div></td><td class="description"><div><p>An optional message that appears below
    the dialog's title.</p></div></td></tr><tr><td>[callbackOrButtons]<br><br><div><span>?(() =&gt; void) | </span><span><a href="docs/alertios.html#buttonsarray">ButtonsArray</a></span></div></td><td class="description"><div><p>This optional argument should
   be either a single-argument function or an array of buttons. If passed
   a function, it will be called when the user taps 'OK'.</p><p>   If passed an array of button configurations, each button should include
   a <code>text</code> key, as well as optional <code>onPress</code> and <code>style</code> keys. <code>style</code>
   should be one of 'default', 'cancel' or 'destructive'.</p></div></td></tr><tr><td>[type]<br><br><div><span><a href="docs/alertios.html#alerttype">AlertType</a></span></div></td><td class="description"><div><p>Deprecated, do not use.</p></div></td></tr></tbody></table></div><div><br>Example with custom buttons:<div class="prism language-javascript">AlertIOS<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
 <span class="token string">'Update available'</span><span class="token punctuation">,</span>
 <span class="token string">'Keep your app up to date to enjoy the latest features'</span><span class="token punctuation">,</span>
 <span class="token punctuation">[</span>
   <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Cancel'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Cancel Pressed'</span><span class="token punctuation">)</span><span class="token punctuation">,</span> style<span class="token punctuation">:</span> <span class="token string">'cancel'</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
   <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Install'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Install Pressed'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
 <span class="token punctuation">]</span><span class="token punctuation">,</span>
<span class="token punctuation">)</span><span class="token punctuation">;</span></div></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="prompt"></a><span class="methodType">static </span>prompt<span class="methodType">(title, message?, callbackOrButtons?, type?, defaultValue?)</span> <a class="hash-link" href="docs/alertios.html#prompt">#</a></h4><div><p>Create and display a prompt to enter some text.</p></div><div><strong>Parameters:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>title<br><br><div><span>string</span></div></td><td class="description"><div><p>The dialog's title.</p></div></td></tr><tr><td>[message]<br><br><div><span>string</span></div></td><td class="description"><div><p>An optional message that appears above the text
   input.</p></div></td></tr><tr><td>[callbackOrButtons]<br><br><div><span>?((text: string) =&gt; void) | </span><span><a href="docs/alertios.html#buttonsarray">ButtonsArray</a></span></div></td><td class="description"><div><p>This optional argument should
   be either a single-argument function or an array of buttons. If passed
   a function, it will be called with the prompt's value when the user
   taps 'OK'.</p><p>   If passed an array of button configurations, each button should include
   a <code>text</code> key, as well as optional <code>onPress</code> and <code>style</code> keys (see
   example). <code>style</code> should be one of 'default', 'cancel' or 'destructive'.</p></div></td></tr><tr><td>[type]<br><br><div><span><a href="docs/alertios.html#alerttype">AlertType</a></span></div></td><td class="description"><div><p>This configures the text input. One of 'plain-text',
   'secure-text' or 'login-password'.</p></div></td></tr><tr><td>[defaultValue]<br><br><div><span>string</span></div></td><td class="description"><div><p>The dialog's title.</p></div></td></tr></tbody></table></div><div><br>Example with custom buttons:<div class="prism language-javascript">AlertIOS<span class="token punctuation">.</span><span class="token function">prompt<span class="token punctuation">(</span></span>
  <span class="token string">'Enter password'</span><span class="token punctuation">,</span>
  <span class="token string">'Enter your password to claim your $1.5B in lottery winnings'</span><span class="token punctuation">,</span>
  <span class="token punctuation">[</span>
    <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Cancel'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Cancel Pressed'</span><span class="token punctuation">)</span><span class="token punctuation">,</span> style<span class="token punctuation">:</span> <span class="token string">'cancel'</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'OK'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> password <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'OK Pressed, password: '</span> <span class="token operator">+</span> password<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token string">'secure-text'</span>
<span class="token punctuation">)</span><span class="token punctuation">;</span></div></div><div><br>Example with the default button and a custom callback:<div class="prism language-javascript">AlertIOS<span class="token punctuation">.</span><span class="token function">prompt<span class="token punctuation">(</span></span>
  <span class="token string">'Update username'</span><span class="token punctuation">,</span>
  <span class="token keyword">null</span><span class="token punctuation">,</span>
  text <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">"Your username is "</span><span class="token operator">+</span>text<span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token keyword">null</span><span class="token punctuation">,</span>
  <span class="token string">'default'</span>
<span class="token punctuation">)</span><span class="token punctuation">;</span></div></div></div></div></span><span><h3><a class="anchor" name="type-definitions"></a>Type Definitions <a class="hash-link" href="docs/alertios.html#type-definitions">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="alerttype"></a>AlertType <a class="hash-link" href="docs/alertios.html#alerttype">#</a></h4><div><p>An Alert button type</p></div><strong>Type:</strong><br>$Enum<div><br><strong>Constants:</strong><table class="params"><thead><tr><th>Value</th><th>Description</th></tr></thead><tbody><tr><td>default</td><td class="description"><div><p>Default alert with no inputs</p></div></td></tr><tr><td>plain-text</td><td class="description"><div><p>Plain text input alert</p></div></td></tr><tr><td>secure-text</td><td class="description"><div><p>Secure text input alert</p></div></td></tr><tr><td>login-password</td><td class="description"><div><p>Login and password alert</p></div></td></tr></tbody></table></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="alertbuttonstyle"></a>AlertButtonStyle <a class="hash-link" href="docs/alertios.html#alertbuttonstyle">#</a></h4><div><p>An Alert button style</p></div><strong>Type:</strong><br>$Enum<div><br><strong>Constants:</strong><table class="params"><thead><tr><th>Value</th><th>Description</th></tr></thead><tbody><tr><td>default</td><td class="description"><div><p>Default button style</p></div></td></tr><tr><td>cancel</td><td class="description"><div><p>Cancel button style</p></div></td></tr><tr><td>destructive</td><td class="description"><div><p>Destructive button style</p></div></td></tr></tbody></table></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="buttonsarray"></a>ButtonsArray <a class="hash-link" href="docs/alertios.html#buttonsarray">#</a></h4><div><p>Array or buttons</p></div><strong>Type:</strong><br>Array<div><br><strong>Properties:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>[text]<br><br><div><span>string</span></div></td><td class="description"><div><p>Button label</p></div></td></tr><tr><td>[onPress]<br><br><div><span>function</span></div></td><td class="description"><div><p>Callback function when button pressed</p></div></td></tr><tr><td>[style]<br><br><div><span><a href="docs/alertios.html#alertbuttonstyle">AlertButtonStyle</a></span></div></td><td class="description"><div><p>Button style</p></div></td></tr></tbody></table></div></div></div></span></div><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/alertios.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.30-stable/Examples/UIExplorer/AlertIOSExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

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
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22AlertIOS%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/animated.html#content">Next →</a></div>