---
id: maskedviewios
title: maskedviewios
---
<a id="content"></a><h1><a class="anchor" name="maskedviewios"></a>MaskedViewIOS <a class="hash-link" href="docs/maskedviewios.html#maskedviewios">#</a></h1><div><div><p>Renders the child view with a mask specified in the <code>maskElement</code> prop.</p><div class="prism language-javascript"><span class="token keyword">import</span> React <span class="token keyword">from</span> <span class="token string">'react'</span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token punctuation">{</span> MaskedViewIOS<span class="token punctuation">,</span> Text<span class="token punctuation">,</span> View <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'react-native'</span><span class="token punctuation">;</span>

<span class="token keyword">class</span> <span class="token class-name">MyMaskedView</span> <span class="token keyword">extends</span> <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      <span class="token operator">&lt;</span>MaskedViewIOS
        style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span> flex<span class="token punctuation">:</span> <span class="token number">1</span> <span class="token punctuation">}</span><span class="token punctuation">}</span>
        maskElement<span class="token operator">=</span><span class="token punctuation">{</span>
          <span class="token operator">&lt;</span>View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>maskContainerStyle<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            <span class="token operator">&lt;</span>Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>maskTextStyle<span class="token punctuation">}</span><span class="token operator">&gt;</span>
              Basic Mask
            <span class="token operator">&lt;</span><span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          <span class="token operator">&lt;</span><span class="token operator">/</span>View<span class="token operator">&gt;</span>
        <span class="token punctuation">}</span>
      <span class="token operator">&gt;</span>
        <span class="token operator">&lt;</span>View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span> flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span> backgroundColor<span class="token punctuation">:</span> <span class="token string">'blue'</span> <span class="token punctuation">}</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token operator">&lt;</span><span class="token operator">/</span>MaskedViewIOS<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>The above example will render a view with a blue background that fills its
parent, and then mask that view with text that says "Basic Mask".</p><p>The alpha channel of the view rendered by the <code>maskElement</code> prop determines how
much of the view's content and background shows through. Fully or partially
opaque pixels allow the underlying content to show through but fully
transparent pixels block that content.</p></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/maskedviewios.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="viewproptypes"></a><a href="docs/viewproptypes.html#props">ViewPropTypes props...</a> <a class="hash-link" href="docs/maskedviewios.html#viewproptypes">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="maskelement"></a>maskElement: <span class="propType">element</span> <a class="hash-link" href="docs/maskedviewios.html#maskelement">#</a></h4></div></div></div><p class="edit-page-block"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/MaskedView/MaskedViewIOS.ios.js">Improve this page</a> by sending a pull request!</p><div class="docs-prevnext"><a class="docs-prev" href="docs/listview.html#content">← Prev</a><a class="docs-next" href="docs/modal.html#content">Next →</a></div>