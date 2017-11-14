---
id: version-0.47-stylesheet
original_id: stylesheet
title: stylesheet
---
<a id="content"></a><h1><a class="anchor" name="stylesheet"></a>StyleSheet <a class="hash-link" href="docs/stylesheet.html#stylesheet">#</a></h1><div><div><p>A StyleSheet is an abstraction similar to CSS StyleSheets</p><p>Create a new StyleSheet:</p><div class="prism language-javascript"><span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create</span><span class="token punctuation">(</span><span class="token punctuation">{</span>
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
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>Use a StyleSheet:</p><div class="prism language-javascript"><span class="token operator">&lt;</span>View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
  <span class="token operator">&lt;</span>Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>title<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>isActive <span class="token operator">&amp;&amp;</span> styles<span class="token punctuation">.</span>activeTitle<span class="token punctuation">]</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
<span class="token operator">&lt;</span><span class="token operator">/</span>View<span class="token operator">&gt;</span></div><p>Code quality:</p><ul><li>By moving styles away from the render function, you're making the code
easier to understand.</li><li>Naming the styles is a good way to add meaning to the low level components
in the render function.</li></ul><p>Performance:</p><ul><li>Making a stylesheet from a style object makes it possible to refer to it
by ID instead of creating a new style object every time.</li><li>It also allows to send the style only once through the bridge. All
subsequent uses are going to refer an id (not implemented yet).</li></ul></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/stylesheet.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="setstyleattributepreprocessor"></a><span class="methodType">static </span>setStyleAttributePreprocessor<span class="methodType">(property, process)</span> <a class="hash-link" href="docs/stylesheet.html#setstyleattributepreprocessor">#</a></h4><div><p>WARNING: EXPERIMENTAL. Breaking changes will probably happen a lot and will
not be reliably announced. The whole thing might be deleted, who knows? Use
at your own risk.</p><p>Sets a function to use to pre-process a style property value. This is used
internally to process color and transform values. You should not use this
unless you really know what you are doing and have exhausted other options.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="create"></a><span class="methodType">static </span>create<span class="methodType">(obj)</span> <a class="hash-link" href="docs/stylesheet.html#create">#</a></h4><div><p>Creates a StyleSheet style reference from the given object.</p></div></div></div></span><span><h3><a class="anchor" name="properties"></a>Properties <a class="hash-link" href="docs/stylesheet.html#properties">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="hairlinewidth"></a>hairlineWidth<span class="propType">: CallExpression</span> <a class="hash-link" href="docs/stylesheet.html#hairlinewidth">#</a></h4><div><p>This is defined as the width of a thin line on the platform. It can be
used as the thickness of a border or division between two elements.
Example:</p><div class="prism language-javascript">  <span class="token punctuation">{</span>
    borderBottomColor<span class="token punctuation">:</span> <span class="token string">'#bbb'</span><span class="token punctuation">,</span>
    borderBottomWidth<span class="token punctuation">:</span> StyleSheet<span class="token punctuation">.</span>hairlineWidth
  <span class="token punctuation">}</span></div><p>This constant will always be a round number of pixels (so a line defined
by it look crisp) and will try to match the standard width of a thin line
on the underlying platform. However, you should not rely on it being a
constant size, because on different platforms and screen densities its
value may be calculated differently.</p><p>A line with hairline width may not be visible if your simulator is downscaled.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="absolutefill"></a>absoluteFill<span class="propType">: CallExpression</span> <a class="hash-link" href="docs/stylesheet.html#absolutefill">#</a></h4><div><p>A very common pattern is to create overlays with position absolute and zero positioning,
so <code>absoluteFill</code> can be used for convenience and to reduce duplication of these repeated
styles.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="absolutefillobject"></a>absoluteFillObject<span class="propType">: ObjectExpression</span> <a class="hash-link" href="docs/stylesheet.html#absolutefillobject">#</a></h4><div><p>Sometimes you may want <code>absoluteFill</code> but with a couple tweaks - <code>absoluteFillObject</code> can be
used to create a customized entry in a <code>StyleSheet</code>, e.g.:</p><p>  const styles = StyleSheet.create({
    wrapper: {
      ...StyleSheet.absoluteFillObject,
      top: 10,
      backgroundColor: 'transparent',
    },
  });</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="flatten"></a>flatten<span class="propType">: CallExpression</span> <a class="hash-link" href="docs/stylesheet.html#flatten">#</a></h4><div><p>Flattens an array of style objects, into one aggregated style object.
Alternatively, this method can be used to lookup IDs, returned by
StyleSheet.register.</p><blockquote><p><strong>NOTE</strong>: Exercise caution as abusing this can tax you in terms of
optimizations.</p><p>IDs enable optimizations through the bridge and memory in general. Refering
to style objects directly will deprive you of these optimizations.</p></blockquote><p>Example:</p><div class="prism language-javascript"><span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create</span><span class="token punctuation">(</span><span class="token punctuation">{</span>
  listItem<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">16</span><span class="token punctuation">,</span>
    color<span class="token punctuation">:</span> <span class="token string">'white'</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  selectedListItem<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    color<span class="token punctuation">:</span> <span class="token string">'green'</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

StyleSheet<span class="token punctuation">.</span><span class="token function">flatten</span><span class="token punctuation">(</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>listItem<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>selectedListItem<span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token comment" spellcheck="true">
// returns { flex: 1, fontSize: 16, color: 'green' }</span></div><p>Alternative use:</p><div class="prism language-javascript">StyleSheet<span class="token punctuation">.</span><span class="token function">flatten</span><span class="token punctuation">(</span>styles<span class="token punctuation">.</span>listItem<span class="token punctuation">)</span><span class="token punctuation">;</span><span class="token comment" spellcheck="true">
// return { flex: 1, fontSize: 16, color: 'white' }
</span><span class="token comment" spellcheck="true">// Simply styles.listItem would return its ID (number)</span></div><p>This method internally uses <code>StyleSheetRegistry.getStyleByID(style)</code>
to resolve style objects represented by IDs. Thus, an array of style
objects (instances of StyleSheet.create), are individually resolved to,
their respective objects, merged as one and then returned. This also explains
the alternative use.</p></div></div></div></span></div><p class="edit-page-block"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/StyleSheet/StyleSheet.js">Improve this page</a> by sending a pull request!</p><div class="docs-prevnext"><a class="docs-prev" href="docs/statusbarios.html#content">← Prev</a><a class="docs-next" href="docs/systrace.html#content">Next →</a></div>