---
id: dimensions
title: Dimensions
sidebar: api
category: APIs
permalink: docs/dimensions.html
---
<div><div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/dimensions.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="set"></a><span class="methodType">static </span>set<span class="methodType">(dims)</span> <a class="hash-link" href="docs/dimensions.html#set">#</a></h4><div><p>This should only be called from native code by sending the
didUpdateDimensions event.</p><p>@param {object} dims Simple string-keyed object of dimensions to set</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="get"></a><span class="methodType">static </span>get<span class="methodType">(dim)</span> <a class="hash-link" href="docs/dimensions.html#get">#</a></h4><div><p>Initial dimensions are set before <code>runApplication</code> is called so they should
be available before any other require's are run, but may be updated later.</p><p>Note: Although dimensions are available immediately, they may change (e.g
due to device rotation) so any rendering logic or styles that depend on
these constants should try to call this function on every render, rather
than caching the value (for example, using inline styles rather than
setting a value in a <code>StyleSheet</code>).</p><p>Example: <code>var {height, width} = Dimensions.get('window');</code></p><p>@param {string} dim Name of dimension as defined when calling <code>set</code>.
@returns {Object?} Value for the dimension.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="addeventlistener"></a><span class="methodType">static </span>addEventListener<span class="methodType">(type, handler)</span> <a class="hash-link" href="docs/dimensions.html#addeventlistener">#</a></h4><div><p>Add an event handler. Supported events:</p><ul><li><code>change</code>: Fires when a property within the <code>Dimensions</code> object changes. The argument
to the event handler is an object with <code>window</code> and <code>screen</code> properties whose values
are the same as the return values of <code>Dimensions.get('window')</code> and
<code>Dimensions.get('screen')</code>, respectively.</li></ul></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="removeeventlistener"></a><span class="methodType">static </span>removeEventListener<span class="methodType">(type, handler)</span> <a class="hash-link" href="docs/dimensions.html#removeeventlistener">#</a></h4><div><p>Remove an event handler.</p></div></div></div></span></div>