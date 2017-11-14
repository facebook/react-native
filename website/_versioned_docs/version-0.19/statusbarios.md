---
id: version-0.19-statusbarios
original_id: statusbarios
title: statusbarios
---
<a id="content"></a><h1>StatusBarIOS</h1><div><div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="setstyle"></a><span class="propType">static </span>setStyle<span class="propType">(style: StatusBarStyle, animated?: boolean)</span> <a class="hash-link" href="#setstyle">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="sethidden"></a><span class="propType">static </span>setHidden<span class="propType">(hidden: boolean, animation?: StatusBarAnimation)</span> <a class="hash-link" href="#sethidden">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="setnetworkactivityindicatorvisible"></a><span class="propType">static </span>setNetworkActivityIndicatorVisible<span class="propType">(visible: boolean)</span> <a class="hash-link" href="#setnetworkactivityindicatorvisible">#</a></h4></div></div></span></div><div><h3><a class="anchor" name="examples"></a><a class="edit-github" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/StatusBarIOSExample.js">Edit on GitHub</a>Examples <a class="hash-link" href="#examples">#</a></h3><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  StyleSheet<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  StatusBarIOS<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>framework <span class="token operator">=</span> <span class="token string">'React'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'StatusBarIOS'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Module for controlling iOS status bar'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Status Bar Style'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        <span class="token punctuation">{</span><span class="token punctuation">[</span><span class="token string">'default'</span><span class="token punctuation">,</span> <span class="token string">'light-content'</span><span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>style<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span>
          &lt;TouchableHighlight key<span class="token operator">=</span><span class="token punctuation">{</span>style<span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> StatusBarIOS<span class="token punctuation">.</span><span class="token function">setStyle<span class="token punctuation">(</span></span>style<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text<span class="token operator">&gt;</span><span class="token function">setStyle<span class="token punctuation">(</span></span><span class="token string">'{style}'</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        <span class="token punctuation">)</span><span class="token punctuation">}</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Status Bar Style Animated'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        <span class="token punctuation">{</span><span class="token punctuation">[</span><span class="token string">'default'</span><span class="token punctuation">,</span> <span class="token string">'light-content'</span><span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>style<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span>
          &lt;TouchableHighlight key<span class="token operator">=</span><span class="token punctuation">{</span>style<span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> StatusBarIOS<span class="token punctuation">.</span><span class="token function">setStyle<span class="token punctuation">(</span></span>style<span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text<span class="token operator">&gt;</span><span class="token function">setStyle<span class="token punctuation">(</span></span><span class="token string">'{style}'</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        <span class="token punctuation">)</span><span class="token punctuation">}</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Status Bar Hidden'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        <span class="token punctuation">{</span><span class="token punctuation">[</span><span class="token string">'none'</span><span class="token punctuation">,</span> <span class="token string">'fade'</span><span class="token punctuation">,</span> <span class="token string">'slide'</span><span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>animation<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span>
          &lt;View key<span class="token operator">=</span><span class="token punctuation">{</span>animation<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;TouchableHighlight style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
              onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> StatusBarIOS<span class="token punctuation">.</span><span class="token function">setHidden<span class="token punctuation">(</span></span><span class="token boolean">true</span><span class="token punctuation">,</span> animation<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
                &lt;Text<span class="token operator">&gt;</span><span class="token function">setHidden<span class="token punctuation">(</span></span><span class="token boolean">true</span><span class="token punctuation">,</span> <span class="token string">'{animation}'</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
            &lt;TouchableHighlight style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
              onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> StatusBarIOS<span class="token punctuation">.</span><span class="token function">setHidden<span class="token punctuation">(</span></span><span class="token boolean">false</span><span class="token punctuation">,</span> animation<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
                &lt;Text<span class="token operator">&gt;</span><span class="token function">setHidden<span class="token punctuation">(</span></span><span class="token boolean">false</span><span class="token punctuation">,</span> <span class="token string">'{animation}'</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        <span class="token punctuation">)</span><span class="token punctuation">}</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Status Bar Network Activity Indicator'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;TouchableHighlight style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> StatusBarIOS<span class="token punctuation">.</span><span class="token function">setNetworkActivityIndicatorVisible<span class="token punctuation">(</span></span><span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token function">setNetworkActivityIndicatorVisible<span class="token punctuation">(</span></span><span class="token boolean">true</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> StatusBarIOS<span class="token punctuation">.</span><span class="token function">setNetworkActivityIndicatorVisible<span class="token punctuation">(</span></span><span class="token boolean">false</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span><span class="token function">setNetworkActivityIndicatorVisible<span class="token punctuation">(</span></span><span class="token boolean">false</span><span class="token punctuation">)</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  wrapper<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  button<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#eeeeee'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="stylesheet.html#content">Next →</a></div>