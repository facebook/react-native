---
id: stylesheet
title: stylesheet
---
<a id="content"></a><h1>StyleSheet</h1><div><div><p>A StyleSheet is an abstraction similar to CSS StyleSheets</p><p>Create a new StyleSheet:</p><div class="prism language-javascript"><span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  container<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">4</span><span class="token punctuation">,</span>
    borderWidth<span class="token punctuation">:</span> <span class="token number">0.5</span><span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'#d6d7da'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  title<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">19</span><span class="token punctuation">,</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  activeTitle<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    color<span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>Use a StyleSheet:</p><div class="prism language-javascript">&lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
  &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>title<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>isActive &amp;&amp; styles<span class="token punctuation">.</span>activeTitle<span class="token punctuation">]</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
&lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span></div><p>Code quality:</p><ul><li>By moving styles away from the render function, you're making the code
easier to understand.</li><li>Naming the styles is a good way to add meaning to the low level components
in the render function.</li></ul><p>Performance:</p><ul><li>Making a stylesheet from a style object makes it possible to refer to it
by ID instead of creating a new style object every time.</li><li>It also allows to send the style only once through the bridge. All
subsequent uses are going to refer an id (not implemented yet).</li></ul></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="create"></a><span class="propType">static </span>create<span class="propType">(obj: {[key: string]: any})</span> <a class="hash-link" href="#create">#</a></h4></div></div></span></div><div class="docs-prevnext"><a class="docs-next" href="toastandroid.html#content">Next →</a></div>