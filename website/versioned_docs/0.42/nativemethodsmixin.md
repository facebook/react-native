---
id: version-0.42-nativemethodsmixin
title: nativemethodsmixin
original_id: nativemethodsmixin
---
<a id="content"></a><h1><a class="anchor" name="nativemethodsmixin"></a>NativeMethodsMixin <a class="hash-link" href="docs/nativemethodsmixin.html#nativemethodsmixin">#</a></h1><div><div><p><code>NativeMethodsMixin</code> provides methods to access the underlying native
component directly. This can be useful in cases when you want to focus
a view or measure its on-screen dimensions, for example.</p><p>The methods described here are available on most of the default components
provided by React Native. Note, however, that they are <em>not</em> available on
composite components that aren't directly backed by a native view. This will
generally include most components that you define in your own app. For more
information, see <a href="docs/direct-manipulation.html" target="_blank">Direct
Manipulation</a>.</p></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/nativemethodsmixin.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="measure"></a><span class="methodType">static </span>measure<span class="methodType">(callback)</span> <a class="hash-link" href="docs/nativemethodsmixin.html#measure">#</a></h4><div><p>Determines the location on screen, width, and height of the given view and
returns the values via an async callback. If successful, the callback will
be called with the following arguments:</p><ul><li>x</li><li>y</li><li>width</li><li>height</li><li>pageX</li><li>pageY</li></ul><p>Note that these measurements are not available until after the rendering
has been completed in native. If you need the measurements as soon as
possible, consider using the <a href="docs/view.html#onlayout" target="_blank"><code>onLayout</code>
prop</a> instead.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="measureinwindow"></a><span class="methodType">static </span>measureInWindow<span class="methodType">(callback)</span> <a class="hash-link" href="docs/nativemethodsmixin.html#measureinwindow">#</a></h4><div><p>Determines the location of the given view in the window and returns the
values via an async callback. If the React root view is embedded in
another native view, this will give you the absolute coordinates. If
successful, the callback will be called with the following
arguments:</p><ul><li>x</li><li>y</li><li>width</li><li>height</li></ul><p>Note that these measurements are not available until after the rendering
has been completed in native.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="measurelayout"></a><span class="methodType">static </span>measureLayout<span class="methodType">(relativeToNativeNode, onSuccess, onFail)</span> <a class="hash-link" href="docs/nativemethodsmixin.html#measurelayout">#</a></h4><div><p>Like <a href="#measure" target=""><code>measure()</code></a>, but measures the view relative an ancestor,
specified as <code>relativeToNativeNode</code>. This means that the returned x, y
are relative to the origin x, y of the ancestor view.</p><p>As always, to obtain a native node handle for a component, you can use
<code>React.findNodeHandle(component)</code>.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="focus"></a><span class="methodType">static </span>focus<span class="methodType">()</span> <a class="hash-link" href="docs/nativemethodsmixin.html#focus">#</a></h4><div><p>Requests focus for the given input or view. The exact behavior triggered
will depend on the platform and type of view.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="blur"></a><span class="methodType">static </span>blur<span class="methodType">()</span> <a class="hash-link" href="docs/nativemethodsmixin.html#blur">#</a></h4><div><p>Removes focus from an input or view. This is the opposite of <code>focus()</code>.</p></div></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Renderer/src/renderers/native/NativeMethodsMixin.js">edit the content above on GitHub</a> and send us a pull request!</p><div class="docs-prevnext"><a class="docs-prev" href="docs/linking.html#content">← Prev</a><a class="docs-next" href="docs/netinfo.html#content">Next →</a></div>