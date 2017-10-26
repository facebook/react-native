---
id: alertios
title: alertios
---
<a id="content"></a><h1>AlertIOS</h1><div><div><p>Launches an alert dialog with the specified title and message.</p><p>Optionally provide a list of buttons. Tapping any button will fire the
respective onPress callback and dismiss the alert. By default, the only
button will be an 'OK' button.</p><p>Use this API for iOS-specific features, such as prompting the user to enter
some information. In other cases, especially to show static alerts, use
the cross-platform <code>Alert</code> API.</p><div class="prism language-javascript">AlertIOS<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
  <span class="token string">'Enter password'</span><span class="token punctuation">,</span>
  <span class="token keyword">null</span><span class="token punctuation">,</span>
  <span class="token punctuation">[</span>
    <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Submit'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span>text<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Password: '</span> <span class="token operator">+</span> text<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token string">'secure-text'</span>
<span class="token punctuation">)</span></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="alert"></a><span class="propType">static </span>alert<span class="propType">(title: string, message?: string, buttons?: Array&lt;{
      text?: string;
      onPress?: ?Function;
      style?: AlertButtonStyle;
    }&gt;, type?: AlertType)</span> <a class="hash-link" href="#alert">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="prompt"></a><span class="propType">static </span>prompt<span class="propType">(title: string, value?: string, buttons?: Array&lt;{
      text?: string;
      onPress?: ?Function;
      style?: AlertButtonStyle;
    }&gt;, callback?: Function)</span> <a class="hash-link" href="#prompt">#</a></h4><div><p>Prompt the user to enter some text.</p></div></div></div></span></div><div><h3><a class="anchor" name="examples"></a><a class="edit-github" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/AlertIOSExample.js">Edit on GitHub</a><a class="run-example" target="_blank" href="https://rnplay.org/apps/l3Zi2g?route=AlertIOS&amp;file=AlertIOSExample.js">Run this example</a>Examples <a class="hash-link" href="#examples">#</a></h3><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  StyleSheet<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  AlertIOS<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>

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
  title<span class="token punctuation">:</span> <span class="token string">'Alert Types'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> AlertIOS<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
            <span class="token string">'Hello World'</span><span class="token punctuation">,</span>
            <span class="token keyword">null</span><span class="token punctuation">,</span>
            <span class="token punctuation">[</span>
              <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'OK'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span>text<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'OK pressed'</span><span class="token punctuation">)</span><span class="token punctuation">,</span> type<span class="token punctuation">:</span> <span class="token string">'default'</span><span class="token punctuation">}</span>
            <span class="token punctuation">]</span>
          <span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>

          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              <span class="token punctuation">{</span><span class="token string">'default'</span><span class="token punctuation">}</span>
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>

        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> AlertIOS<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
            <span class="token string">'Plain Text Entry'</span><span class="token punctuation">,</span>
            <span class="token keyword">null</span><span class="token punctuation">,</span>
            <span class="token punctuation">[</span>
              <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Submit'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span>text<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Text: '</span> <span class="token operator">+</span> text<span class="token punctuation">)</span><span class="token punctuation">,</span> type<span class="token punctuation">:</span> <span class="token string">'plain-text'</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
              <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Cancel'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Cancel'</span><span class="token punctuation">)</span><span class="token punctuation">,</span> style<span class="token punctuation">:</span> <span class="token string">'cancel'</span><span class="token punctuation">}</span>
            <span class="token punctuation">]</span>
          <span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>

          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              plain<span class="token operator">-</span>text
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>

        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> AlertIOS<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
            <span class="token string">'Secure Text Entry'</span><span class="token punctuation">,</span>
            <span class="token keyword">null</span><span class="token punctuation">,</span>
            <span class="token punctuation">[</span>
              <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Submit'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span>text<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Password: '</span> <span class="token operator">+</span> text<span class="token punctuation">)</span><span class="token punctuation">,</span> type<span class="token punctuation">:</span> <span class="token string">'secure-text'</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
              <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Cancel'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Cancel'</span><span class="token punctuation">)</span><span class="token punctuation">,</span> style<span class="token punctuation">:</span> <span class="token string">'cancel'</span><span class="token punctuation">}</span>
            <span class="token punctuation">]</span>
          <span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>

          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              secure<span class="token operator">-</span>text
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>

        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> AlertIOS<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
            <span class="token string">'Login &amp; Password'</span><span class="token punctuation">,</span>
            <span class="token keyword">null</span><span class="token punctuation">,</span>
            <span class="token punctuation">[</span>
              <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Submit'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span>details<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Login: '</span> <span class="token operator">+</span> details<span class="token punctuation">.</span>login <span class="token operator">+</span> <span class="token string">'; Password: '</span> <span class="token operator">+</span> details<span class="token punctuation">.</span>password<span class="token punctuation">)</span><span class="token punctuation">,</span> type<span class="token punctuation">:</span> <span class="token string">'login-password'</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
              <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Cancel'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Cancel'</span><span class="token punctuation">)</span><span class="token punctuation">,</span> style<span class="token punctuation">:</span> <span class="token string">'cancel'</span><span class="token punctuation">}</span>
            <span class="token punctuation">]</span>
          <span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>

          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              login<span class="token operator">-</span>password
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>

        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Prompt'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Component <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;PromptExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">;</span>

class <span class="token class-name">PromptExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">this</span><span class="token punctuation">.</span>promptResponse <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>promptResponse<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>
      promptValue<span class="token punctuation">:</span> undefined<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>

    <span class="token keyword">this</span><span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'Type a value'</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>defaultValue <span class="token operator">=</span> <span class="token string">'Default value'</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>buttons <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">{</span>
      text<span class="token punctuation">:</span> <span class="token string">'Custom OK'</span><span class="token punctuation">,</span>
      onPress<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>promptResponse
    <span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
      text<span class="token punctuation">:</span> <span class="token string">'Custom Cancel'</span><span class="token punctuation">,</span>
      style<span class="token punctuation">:</span> <span class="token string">'cancel'</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginBottom<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>Prompt value<span class="token punctuation">:</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>promptValue<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>

        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>prompt<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>title<span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>promptResponse<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>

          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              prompt <span class="token keyword">with</span> title &amp; callback
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>

        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>prompt<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>title<span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>buttons<span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>

          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              prompt <span class="token keyword">with</span> title &amp; custom buttons
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>

        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>prompt<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>title<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>defaultValue<span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>promptResponse<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>

          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              prompt <span class="token keyword">with</span> title<span class="token punctuation">,</span> default value &amp; callback
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>

        &lt;TouchableHighlight
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>prompt<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>title<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>defaultValue<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>buttons<span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>

          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>
              prompt <span class="token keyword">with</span> title<span class="token punctuation">,</span> default value &amp; custom buttons
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">prompt<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // Flow's apply support is broken: #7035621
</span>    <span class="token punctuation">(</span><span class="token punctuation">(</span>AlertIOS<span class="token punctuation">.</span>prompt<span class="token punctuation">:</span> any<span class="token punctuation">)</span><span class="token punctuation">.</span>apply<span class="token punctuation">:</span> any<span class="token punctuation">)</span><span class="token punctuation">(</span>AlertIOS<span class="token punctuation">,</span> arguments<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">promptResponse<span class="token punctuation">(</span></span>promptValue<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span> promptValue <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
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
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="animated.html#content">Next →</a></div>