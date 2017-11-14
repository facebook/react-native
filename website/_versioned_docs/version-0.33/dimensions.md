---
id: version-0.33-dimensions
original_id: dimensions
title: dimensions
---
<a id="content"></a><h1><a class="anchor" name="dimensions"></a>Dimensions <a class="hash-link" href="docs/dimensions.html#dimensions">#</a></h1><div><div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/dimensions.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="set"></a><span class="methodType">static </span>set<span class="methodType">(dims)</span> <a class="hash-link" href="docs/dimensions.html#set">#</a></h4><div><p>This should only be called from native code by sending the
didUpdateDimensions event.</p><p>@param {object} dims Simple string-keyed object of dimensions to set</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="get"></a><span class="methodType">static </span>get<span class="methodType">(dim)</span> <a class="hash-link" href="docs/dimensions.html#get">#</a></h4><div><p>Initial dimensions are set before <code>runApplication</code> is called so they should
be available before any other require's are run, but may be updated later.</p><p>Note: Although dimensions are available immediately, they may change (e.g
due to device rotation) so any rendering logic or styles that depend on
these constants should try to call this function on every render, rather
than caching the value (for example, using inline styles rather than
setting a value in a <code>StyleSheet</code>).</p><p>Example: <code>var {height, width} = Dimensions.get('window');</code></p><p>@param {string} dim Name of dimension as defined when calling <code>set</code>.
@returns {Object?} Value for the dimension.</p></div></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Utilities/Dimensions.js">edit the content above on GitHub</a> and send us a pull request!</p><div class="docs-prevnext"><a class="docs-prev" href="docs/datepickerandroid.html#content">← Prev</a><a class="docs-next" href="docs/easing.html#content">Next →</a></div>