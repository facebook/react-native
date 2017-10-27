---
id: version-0.28-image
title: image
original_id: image
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="image"></a>Image <a class="hash-link" href="docs/image.html#image">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.28-stable/Libraries/Image/Image.ios.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>A React component for displaying different types of images,
including network images, static resources, temporary local images, and
images from local disk, such as the camera roll.</p><p>Example usage:</p><div class="prism language-javascript">renderImages<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    &lt;View<span class="token operator">&gt;</span>
      &lt;Image
        style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>icon<span class="token punctuation">}</span>
        source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./myIcon.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;Image
        style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>logo<span class="token punctuation">}</span>
        source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> <span class="token string">'http://facebook.github.io/react/img/logo_og.png'</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span></div></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/image.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="onlayout"></a>onLayout <span class="propType">function</span> <a class="hash-link" href="docs/image.html#onlayout">#</a></h4><div><p>Invoked on mount and layout changes with
<code>{nativeEvent: {layout: {x, y, width, height}}}</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onload"></a>onLoad <span class="propType">function</span> <a class="hash-link" href="docs/image.html#onload">#</a></h4><div><p>Invoked when load completes successfully</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onloadend"></a>onLoadEnd <span class="propType">function</span> <a class="hash-link" href="docs/image.html#onloadend">#</a></h4><div><p>Invoked when load either succeeds or fails</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onloadstart"></a>onLoadStart <span class="propType">function</span> <a class="hash-link" href="docs/image.html#onloadstart">#</a></h4><div><p>Invoked on load start</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="resizemode"></a>resizeMode <span class="propType">enum('cover', 'contain', 'stretch')</span> <a class="hash-link" href="docs/image.html#resizemode">#</a></h4><div><p>Determines how to resize the image when the frame doesn't match the raw
image dimensions.</p><p>'cover': Scale the image uniformly (maintain the image's aspect ratio)
so that both dimensions (width and height) of the image will be equal
to or larger than the corresponding dimension of the view (minus padding).</p><p>'contain': Scale the image uniformly (maintain the image's aspect ratio)
so that both dimensions (width and height) of the image will be equal to
or less than the corresponding dimension of the view (minus padding).</p><p>'stretch': Scale width and height independently, This may change the
aspect ratio of the src.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="source"></a>source <span class="propType">ImageSourcePropType</span> <a class="hash-link" href="docs/image.html#source">#</a></h4><div><p>The image source (either a remote URL or a local file resource).</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="style"></a>style <span class="propType">style</span> <a class="hash-link" href="docs/image.html#style">#</a></h4><div class="compactProps"><div class="prop"><h6 class="propTitle"><a href="docs/flexbox.html#proptypes">Flexbox...</a></h6></div><div class="prop"><h6 class="propTitle"><a href="docs/shadowproptypesios.html#style">ShadowPropTypesIOS#style...</a></h6></div><div class="prop"><h6 class="propTitle"><a href="docs/transforms.html#proptypes">Transforms...</a></h6></div><div class="prop"><h6 class="propTitle">backfaceVisibility <span class="propType">enum('visible', 'hidden')</span> </h6></div><div class="prop"><h6 class="propTitle">backgroundColor <span class="propType"><a href="docs/colors.html">color</a></span> </h6></div><div class="prop"><h6 class="propTitle">borderBottomLeftRadius <span class="propType">number</span> </h6></div><div class="prop"><h6 class="propTitle">borderBottomRightRadius <span class="propType">number</span> </h6></div><div class="prop"><h6 class="propTitle">borderColor <span class="propType"><a href="docs/colors.html">color</a></span> </h6></div><div class="prop"><h6 class="propTitle">borderRadius <span class="propType">number</span> </h6></div><div class="prop"><h6 class="propTitle">borderTopLeftRadius <span class="propType">number</span> </h6></div><div class="prop"><h6 class="propTitle">borderTopRightRadius <span class="propType">number</span> </h6></div><div class="prop"><h6 class="propTitle">borderWidth <span class="propType">number</span> </h6></div><div class="prop"><h6 class="propTitle">opacity <span class="propType">number</span> </h6></div><div class="prop"><h6 class="propTitle">overflow <span class="propType">enum('visible', 'hidden')</span> </h6></div><div class="prop"><h6 class="propTitle">resizeMode <span class="propType">Object.keys(ImageResizeMode)</span> </h6></div><div class="prop"><h6 class="propTitle">tintColor <span class="propType"><a href="docs/colors.html">color</a></span> <div><p>Changes the color of all the non-transparent pixels to the tintColor.</p></div></h6></div><div class="prop"><h6 class="propTitle"><span class="platform">android</span>overlayColor <span class="propType">string</span> <div><p>When the image has rounded corners, specifying an overlayColor will
cause the remaining space in the corners to be filled with a solid color.
This is useful in cases which are not supported by the Android
implementation of rounded corners:
  - Certain resize modes, such as 'contain'
  - Animated GIFs</p><p>A typical way to use this prop is with images displayed on a solid
background and setting the <code>overlayColor</code> to the same color
as the background.</p><p>For details of how this works under the hood, see
<a href="http://frescolib.org/docs/rounded-corners-and-circles.html">http://frescolib.org/docs/rounded-corners-and-circles.html</a></p></div></h6></div></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="testid"></a>testID <span class="propType">string</span> <a class="hash-link" href="docs/image.html#testid">#</a></h4><div><p>A unique identifier for this element to be used in UI Automation
testing scripts.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="accessibilitylabel"></a><span class="platform">ios</span>accessibilityLabel <span class="propType">string</span> <a class="hash-link" href="docs/image.html#accessibilitylabel">#</a></h4><div><p>The text that's read by the screen reader when the user interacts with
the image.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="accessible"></a><span class="platform">ios</span>accessible <span class="propType">bool</span> <a class="hash-link" href="docs/image.html#accessible">#</a></h4><div><p>When true, indicates the image is an accessibility element.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="blurradius"></a><span class="platform">ios</span>blurRadius <span class="propType">number</span> <a class="hash-link" href="docs/image.html#blurradius">#</a></h4><div><p>blurRadius: the blur radius of the blur filter added to the image</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="capinsets"></a><span class="platform">ios</span>capInsets <span class="propType">{top: number, left: number, bottom: number, right: number}</span> <a class="hash-link" href="docs/image.html#capinsets">#</a></h4><div><p>When the image is resized, the corners of the size specified
by capInsets will stay a fixed size, but the center content and borders
of the image will be stretched.  This is useful for creating resizable
rounded buttons, shadows, and other resizable assets.  More info on
<a href="https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIImage_Class/index.html#//apple_ref/occ/instm/UIImage/resizableImageWithCapInsets" target="_blank">Apple documentation</a></p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="defaultsource"></a><span class="platform">ios</span>defaultSource <span class="propType">{uri: string, width: number, height: number, scale: number}, number</span> <a class="hash-link" href="docs/image.html#defaultsource">#</a></h4><div><p>A static image to display while loading the image source.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onerror"></a><span class="platform">ios</span>onError <span class="propType">function</span> <a class="hash-link" href="docs/image.html#onerror">#</a></h4><div><p>Invoked on load error with <code>{nativeEvent: {error}}</code></p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onprogress"></a><span class="platform">ios</span>onProgress <span class="propType">function</span> <a class="hash-link" href="docs/image.html#onprogress">#</a></h4><div><p>Invoked on download progress with <code>{nativeEvent: {loaded, total}}</code></p></div></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/image.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="getsize"></a><span class="propType">static </span>getSize<span class="propType">(uri: string, success: (width: number, height: number) =&gt; void, failure: (error: any) =&gt; void)</span> <a class="hash-link" href="docs/image.html#getsize">#</a></h4><div><p>Retrieve the width and height (in pixels) of an image prior to displaying it.
This method can fail if the image cannot be found, or fails to download.</p><p>In order to retrieve the image dimensions, the image may first need to be
loaded or downloaded, after which it will be cached. This means that in
principle you could use this method to preload images, however it is not
optimized for that purpose, and may in future be implemented in a way that
does not fully load/download the image data. A proper, supported way to
preload images will be provided as a separate API.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="prefetch"></a><span class="propType">static </span>prefetch<span class="propType">(url: string)</span> <a class="hash-link" href="docs/image.html#prefetch">#</a></h4><div><p>Prefetches a remote image for later use by downloading it to the disk
cache</p></div></div></div></span></div><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/image.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.28-stable/Examples/UIExplorer/ImageExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  Image<span class="token punctuation">,</span>
  Platform<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  ActivityIndicatorIOS
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

<span class="token keyword">var</span> base64Icon <span class="token operator">=</span> <span class="token string">'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABLCAQAAACSR7JhAAADtUlEQVR4Ac3YA2Bj6QLH0XPT1Fzbtm29tW3btm3bfLZtv7e2ObZnms7d8Uw098tuetPzrxv8wiISrtVudrG2JXQZ4VOv+qUfmqCGGl1mqLhoA52oZlb0mrjsnhKpgeUNEs91Z0pd1kvihA3ULGVHiQO2narKSHKkEMulm9VgUyE60s1aWoMQUbpZOWE+kaqs4eLEjdIlZTcFZB0ndc1+lhB1lZrIuk5P2aib1NBpZaL+JaOGIt0ls47SKzLC7CqrlGF6RZ09HGoNy1lYl2aRSWL5GuzqWU1KafRdoRp0iOQEiDzgZPnG6DbldcomadViflnl/cL93tOoVbsOLVM2jylvdWjXolWX1hmfZbGR/wjypDjFLSZIRov09BgYmtUqPQPlQrPapecLgTIy0jMgPKtTeob2zWtrGH3xvjUkPCtNg/tm1rjwrMa+mdUkPd3hWbH0jArPGiU9ufCsNNWFZ40wpwn+62/66R2RUtoso1OB34tnLOcy7YB1fUdc9e0q3yru8PGM773vXsuZ5YIZX+5xmHwHGVvlrGPN6ZSiP1smOsMMde40wKv2VmwPPVXNut4sVpUreZiLBHi0qln/VQeI/LTMYXpsJtFiclUN+5HVZazim+Ky+7sAvxWnvjXrJFneVtLWLyPJu9K3cXLWeOlbMTlrIelbMDlrLenrjEQOtIF+fuI9xRp9ZBFp6+b6WT8RrxEpdK64BuvHgDk+vUy+b5hYk6zfyfs051gRoNO1usU12WWRWL73/MMEy9pMi9qIrR4ZpV16Rrvduxazmy1FSvuFXRkqTnE7m2kdb5U8xGjLw/spRr1uTov4uOgQE+0N/DvFrG/Jt7i/FzwxbA9kDanhf2w+t4V97G8lrT7wc08aA2QNUkuTfW/KimT01wdlfK4yEw030VfT0RtZbzjeMprNq8m8tnSTASrTLti64oBNdpmMQm0eEwvfPwRbUBywG5TzjPCsdwk3IeAXjQblLCoXnDVeoAz6SfJNk5TTzytCNZk/POtTSV40NwOFWzw86wNJRpubpXsn60NJFlHeqlYRbslqZm2jnEZ3qcSKgm0kTli3zZVS7y/iivZTweYXJ26Y+RTbV1zh3hYkgyFGSTKPfRVbRqWWVReaxYeSLarYv1Qqsmh1s95S7G+eEWK0f3jYKTbV6bOwepjfhtafsvUsqrQvrGC8YhmnO9cSCk3yuY984F1vesdHYhWJ5FvASlacshUsajFt2mUM9pqzvKGcyNJW0arTKN1GGGzQlH0tXwLDgQTurS8eIQAAAABJRU5ErkJggg=='</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> ImageCapInsetsExample <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./ImageCapInsetsExample'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const IMAGE_PREFETCH_URL <span class="token operator">=</span> <span class="token string">'http://facebook.github.io/origami/public/images/blog-hero.jpg?r=1&amp;t='</span> <span class="token operator">+</span> Date<span class="token punctuation">.</span><span class="token function">now<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> prefetchTask <span class="token operator">=</span> Image<span class="token punctuation">.</span><span class="token function">prefetch<span class="token punctuation">(</span></span>IMAGE_PREFETCH_URL<span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> NetworkImageCallbackExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  getInitialState<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      events<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
      startLoadPrefetched<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
      mountTime<span class="token punctuation">:</span> <span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">componentWillMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>mountTime<span class="token punctuation">:</span> <span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> <span class="token punctuation">{</span> mountTime <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">;</span>

    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Image
          source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>source<span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> <span class="token punctuation">{</span>overflow<span class="token punctuation">:</span> <span class="token string">'visible'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
          onLoadStart<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_loadEventFired<span class="token punctuation">(</span></span>`✔ onLoadStart <span class="token punctuation">(</span><span class="token operator">+</span>$<span class="token punctuation">{</span><span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-</span> mountTime<span class="token punctuation">}</span>ms<span class="token punctuation">)</span>`<span class="token punctuation">)</span><span class="token punctuation">}</span>
          onLoad<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_loadEventFired<span class="token punctuation">(</span></span>`✔ onLoad <span class="token punctuation">(</span><span class="token operator">+</span>$<span class="token punctuation">{</span><span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-</span> mountTime<span class="token punctuation">}</span>ms<span class="token punctuation">)</span>`<span class="token punctuation">)</span><span class="token punctuation">}</span>
          onLoadEnd<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_loadEventFired<span class="token punctuation">(</span></span>`✔ onLoadEnd <span class="token punctuation">(</span><span class="token operator">+</span>$<span class="token punctuation">{</span><span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-</span> mountTime<span class="token punctuation">}</span>ms<span class="token punctuation">)</span>`<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>startLoadPrefetched<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
              prefetchTask<span class="token punctuation">.</span><span class="token function">then<span class="token punctuation">(</span></span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
                <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_loadEventFired<span class="token punctuation">(</span></span>`✔ Prefetch OK <span class="token punctuation">(</span><span class="token operator">+</span>$<span class="token punctuation">{</span><span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-</span> mountTime<span class="token punctuation">}</span>ms<span class="token punctuation">)</span>`<span class="token punctuation">)</span><span class="token punctuation">;</span>
              <span class="token punctuation">}</span><span class="token punctuation">,</span> error <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
                <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_loadEventFired<span class="token punctuation">(</span></span>`✘ Prefetch failed <span class="token punctuation">(</span><span class="token operator">+</span>$<span class="token punctuation">{</span><span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-</span> mountTime<span class="token punctuation">}</span>ms<span class="token punctuation">)</span>`<span class="token punctuation">)</span><span class="token punctuation">;</span>
              <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>startLoadPrefetched <span class="token operator">?</span>
          &lt;Image
            source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>prefetchedSource<span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> <span class="token punctuation">{</span>overflow<span class="token punctuation">:</span> <span class="token string">'visible'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            onLoadStart<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_loadEventFired<span class="token punctuation">(</span></span>`✔ <span class="token punctuation">(</span>prefetched<span class="token punctuation">)</span> onLoadStart <span class="token punctuation">(</span><span class="token operator">+</span>$<span class="token punctuation">{</span><span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-</span> mountTime<span class="token punctuation">}</span>ms<span class="token punctuation">)</span>`<span class="token punctuation">)</span><span class="token punctuation">}</span>
            onLoad<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_loadEventFired<span class="token punctuation">(</span></span>`✔ <span class="token punctuation">(</span>prefetched<span class="token punctuation">)</span> onLoad <span class="token punctuation">(</span><span class="token operator">+</span>$<span class="token punctuation">{</span><span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-</span> mountTime<span class="token punctuation">}</span>ms<span class="token punctuation">)</span>`<span class="token punctuation">)</span><span class="token punctuation">}</span>
            onLoadEnd<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_loadEventFired<span class="token punctuation">(</span></span>`✔ <span class="token punctuation">(</span>prefetched<span class="token punctuation">)</span> onLoadEnd <span class="token punctuation">(</span><span class="token operator">+</span>$<span class="token punctuation">{</span><span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-</span> mountTime<span class="token punctuation">}</span>ms<span class="token punctuation">)</span>`<span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          <span class="token punctuation">:</span> <span class="token keyword">null</span><span class="token punctuation">}</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginTop<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>events<span class="token punctuation">.</span><span class="token function">join<span class="token punctuation">(</span></span><span class="token string">'\n'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_loadEventFired<span class="token punctuation">(</span></span>event<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">(</span>state<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> state<span class="token punctuation">.</span>events <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>events<span class="token punctuation">,</span> event<span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> NetworkImageExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  getInitialState<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      error<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
      loading<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
      progress<span class="token punctuation">:</span> <span class="token number">0</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> loader <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>loading <span class="token operator">?</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>progress<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>progress<span class="token punctuation">}</span><span class="token operator">%</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;ActivityIndicatorIOS style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginLeft<span class="token punctuation">:</span><span class="token number">5</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span> <span class="token punctuation">:</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>error <span class="token operator">?</span>
      &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>error<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span> <span class="token punctuation">:</span>
      &lt;Image
        source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>source<span class="token punctuation">}</span>
        style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> <span class="token punctuation">{</span>overflow<span class="token punctuation">:</span> <span class="token string">'visible'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
        onLoadStart<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>e<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>loading<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        onError<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>e<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>error<span class="token punctuation">:</span> e<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>error<span class="token punctuation">,</span> loading<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        onProgress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>e<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>progress<span class="token punctuation">:</span> Math<span class="token punctuation">.</span><span class="token function">round<span class="token punctuation">(</span></span><span class="token number">100</span> <span class="token operator">*</span> e<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>loaded <span class="token operator">/</span> e<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>total<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        onLoad<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>loading<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span> error<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        <span class="token punctuation">{</span>loader<span class="token punctuation">}</span>
      &lt;<span class="token operator">/</span>Image<span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> ImageSizeExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  getInitialState<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      width<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
      height<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  componentDidMount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    Image<span class="token punctuation">.</span><span class="token function">getSize<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>source<span class="token punctuation">.</span>uri<span class="token punctuation">,</span> <span class="token punctuation">(</span>width<span class="token punctuation">,</span> height<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>width<span class="token punctuation">,</span> height<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Image
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
            width<span class="token punctuation">:</span> <span class="token number">60</span><span class="token punctuation">,</span>
            height<span class="token punctuation">:</span> <span class="token number">60</span><span class="token punctuation">,</span>
            backgroundColor<span class="token punctuation">:</span> <span class="token string">'transparent'</span><span class="token punctuation">,</span>
            marginRight<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span>
          source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>source<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          Actual dimensions<span class="token punctuation">:</span><span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
          Width<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>width<span class="token punctuation">}</span><span class="token punctuation">,</span> Height<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>height<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>displayName <span class="token operator">=</span> <span class="token punctuation">(</span>undefined<span class="token punctuation">:</span> <span class="token operator">?</span>string<span class="token punctuation">)</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>framework <span class="token operator">=</span> <span class="token string">'React'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;Image&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Base component for displaying different types of images.'</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Plain Network Image'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'If the `source` prop `uri` property is prefixed with '</span> <span class="token operator">+</span>
    <span class="token string">'"http", then it will be downloaded from the network.'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;Image
          source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> <span class="token string">'http://facebook.github.io/react/img/logo_og.png'</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Plain Static Image'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Static assets should be placed in the source code tree, and '</span> <span class="token operator">+</span>
    <span class="token string">'required in the same way as JavaScript modules.'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>horizontal<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Image source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./uie_thumb_normal.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>icon<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Image source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./uie_thumb_selected.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>icon<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Image source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./uie_comment_normal.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>icon<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Image source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./uie_comment_highlighted.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>icon<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Image Loading Events'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;NetworkImageCallbackExample source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> <span class="token string">'http://facebook.github.io/origami/public/images/blog-hero.jpg?r=1&amp;t='</span> <span class="token operator">+</span> Date<span class="token punctuation">.</span><span class="token function">now<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
          prefetchedSource<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> IMAGE_PREFETCH_URL<span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Error Handler'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;NetworkImageExample source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> <span class="token string">'http://TYPO_ERROR_facebook.github.io/react/img/logo_og.png'</span><span class="token punctuation">}</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    platform<span class="token punctuation">:</span> <span class="token string">'ios'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Image Download Progress'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;NetworkImageExample source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> <span class="token string">'http://facebook.github.io/origami/public/images/blog-hero.jpg?r=1'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    platform<span class="token punctuation">:</span> <span class="token string">'ios'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'defaultSource'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Show a placeholder image when a network image is loading'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;Image
          defaultSource<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./bunny.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> <span class="token string">'http://facebook.github.io/origami/public/images/birds.jpg'</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    platform<span class="token punctuation">:</span> <span class="token string">'ios'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Border Color'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>horizontal<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Image
            source<span class="token operator">=</span><span class="token punctuation">{</span>smallImage<span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>
              styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span>
              styles<span class="token punctuation">.</span>background<span class="token punctuation">,</span>
              <span class="token punctuation">{</span>borderWidth<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span> borderColor<span class="token punctuation">:</span> <span class="token string">'#f099f0'</span><span class="token punctuation">}</span>
            <span class="token punctuation">]</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Border Width'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>horizontal<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Image
            source<span class="token operator">=</span><span class="token punctuation">{</span>smallImage<span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>
              styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span>
              styles<span class="token punctuation">.</span>background<span class="token punctuation">,</span>
              <span class="token punctuation">{</span>borderWidth<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span> borderColor<span class="token punctuation">:</span> <span class="token string">'#f099f0'</span><span class="token punctuation">}</span>
            <span class="token punctuation">]</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Border Radius'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>horizontal<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Image
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> <span class="token punctuation">{</span>borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            source<span class="token operator">=</span><span class="token punctuation">{</span>fullImage<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Image
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">,</span> <span class="token punctuation">{</span>borderRadius<span class="token punctuation">:</span> <span class="token number">19</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            source<span class="token operator">=</span><span class="token punctuation">{</span>fullImage<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Background Color'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>horizontal<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Image source<span class="token operator">=</span><span class="token punctuation">{</span>smallImage<span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Image
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>
              styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span>
              styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">,</span>
              <span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'rgba(0, 0, 100, 0.25)'</span><span class="token punctuation">}</span>
            <span class="token punctuation">]</span><span class="token punctuation">}</span>
            source<span class="token operator">=</span><span class="token punctuation">{</span>smallImage<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Image
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">,</span> <span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            source<span class="token operator">=</span><span class="token punctuation">{</span>smallImage<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Image
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">,</span> <span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'black'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            source<span class="token operator">=</span><span class="token punctuation">{</span>smallImage<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Opacity'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>horizontal<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Image
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> <span class="token punctuation">{</span>opacity<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            source<span class="token operator">=</span><span class="token punctuation">{</span>fullImage<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Image
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">,</span> <span class="token punctuation">{</span>opacity<span class="token punctuation">:</span> <span class="token number">0.8</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            source<span class="token operator">=</span><span class="token punctuation">{</span>fullImage<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Image
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">,</span> <span class="token punctuation">{</span>opacity<span class="token punctuation">:</span> <span class="token number">0.6</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            source<span class="token operator">=</span><span class="token punctuation">{</span>fullImage<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Image
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">,</span> <span class="token punctuation">{</span>opacity<span class="token punctuation">:</span> <span class="token number">0.4</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            source<span class="token operator">=</span><span class="token punctuation">{</span>fullImage<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Image
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">,</span> <span class="token punctuation">{</span>opacity<span class="token punctuation">:</span> <span class="token number">0.2</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            source<span class="token operator">=</span><span class="token punctuation">{</span>fullImage<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Image
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">,</span> <span class="token punctuation">{</span>opacity<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            source<span class="token operator">=</span><span class="token punctuation">{</span>fullImage<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Nesting'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;Image
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>width<span class="token punctuation">:</span> <span class="token number">60</span><span class="token punctuation">,</span> height<span class="token punctuation">:</span> <span class="token number">60</span><span class="token punctuation">,</span> backgroundColor<span class="token punctuation">:</span> <span class="token string">'transparent'</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
          source<span class="token operator">=</span><span class="token punctuation">{</span>fullImage<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>nestedText<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            React
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>Image<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Tint Color'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'The `tintColor` style prop changes all the non-alpha '</span> <span class="token operator">+</span>
      <span class="token string">'pixels to the tint color.'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>horizontal<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Image
              source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./uie_thumb_normal.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>icon<span class="token punctuation">,</span> <span class="token punctuation">{</span>borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span> tintColor<span class="token punctuation">:</span> <span class="token string">'#5ac8fa'</span> <span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
            &lt;Image
              source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./uie_thumb_normal.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>icon<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">,</span> <span class="token punctuation">{</span>borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span> tintColor<span class="token punctuation">:</span> <span class="token string">'#4cd964'</span> <span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
            &lt;Image
              source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./uie_thumb_normal.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>icon<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">,</span> <span class="token punctuation">{</span>borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span> tintColor<span class="token punctuation">:</span> <span class="token string">'#ff2d55'</span> <span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
            &lt;Image
              source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./uie_thumb_normal.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>icon<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">,</span> <span class="token punctuation">{</span>borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span> tintColor<span class="token punctuation">:</span> <span class="token string">'#8e8e93'</span> <span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>sectionText<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            It also works <span class="token keyword">with</span> downloaded images<span class="token punctuation">:</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>horizontal<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Image
              source<span class="token operator">=</span><span class="token punctuation">{</span>smallImage<span class="token punctuation">}</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> <span class="token punctuation">{</span>borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span> tintColor<span class="token punctuation">:</span> <span class="token string">'#5ac8fa'</span> <span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
            &lt;Image
              source<span class="token operator">=</span><span class="token punctuation">{</span>smallImage<span class="token punctuation">}</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">,</span> <span class="token punctuation">{</span>borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span> tintColor<span class="token punctuation">:</span> <span class="token string">'#4cd964'</span> <span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
            &lt;Image
              source<span class="token operator">=</span><span class="token punctuation">{</span>smallImage<span class="token punctuation">}</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">,</span> <span class="token punctuation">{</span>borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span> tintColor<span class="token punctuation">:</span> <span class="token string">'#ff2d55'</span> <span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
            &lt;Image
              source<span class="token operator">=</span><span class="token punctuation">{</span>smallImage<span class="token punctuation">}</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>base<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">,</span> <span class="token punctuation">{</span>borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span> tintColor<span class="token punctuation">:</span> <span class="token string">'#8e8e93'</span> <span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Resize Mode'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'The `resizeMode` style prop controls how the image is '</span> <span class="token operator">+</span>
      <span class="token string">'rendered within the frame.'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token punctuation">[</span>smallImage<span class="token punctuation">,</span> fullImage<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>image<span class="token punctuation">,</span> index<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> <span class="token punctuation">(</span>
            &lt;View key<span class="token operator">=</span><span class="token punctuation">{</span>index<span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>horizontal<span class="token punctuation">}</span><span class="token operator">&gt;</span>
                &lt;View<span class="token operator">&gt;</span>
                  &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>resizeModeText<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                    Contain
                  &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
                  &lt;Image
                    style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>resizeMode<span class="token punctuation">}</span>
                    resizeMode<span class="token operator">=</span><span class="token punctuation">{</span>Image<span class="token punctuation">.</span>resizeMode<span class="token punctuation">.</span>contain<span class="token punctuation">}</span>
                    source<span class="token operator">=</span><span class="token punctuation">{</span>image<span class="token punctuation">}</span>
                  <span class="token operator">/</span><span class="token operator">&gt;</span>
                &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
                &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">}</span><span class="token operator">&gt;</span>
                  &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>resizeModeText<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                    Cover
                  &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
                  &lt;Image
                    style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>resizeMode<span class="token punctuation">}</span>
                    resizeMode<span class="token operator">=</span><span class="token punctuation">{</span>Image<span class="token punctuation">.</span>resizeMode<span class="token punctuation">.</span>cover<span class="token punctuation">}</span>
                    source<span class="token operator">=</span><span class="token punctuation">{</span>image<span class="token punctuation">}</span>
                  <span class="token operator">/</span><span class="token operator">&gt;</span>
                &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
              &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
              &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>horizontal<span class="token punctuation">}</span><span class="token operator">&gt;</span>
                &lt;View<span class="token operator">&gt;</span>
                  &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>resizeModeText<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                    Stretch
                  &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
                  &lt;Image
                    style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>resizeMode<span class="token punctuation">}</span>
                    resizeMode<span class="token operator">=</span><span class="token punctuation">{</span>Image<span class="token punctuation">.</span>resizeMode<span class="token punctuation">.</span>stretch<span class="token punctuation">}</span>
                    source<span class="token operator">=</span><span class="token punctuation">{</span>image<span class="token punctuation">}</span>
                  <span class="token operator">/</span><span class="token operator">&gt;</span>
                &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
                <span class="token punctuation">{</span> Platform<span class="token punctuation">.</span>OS <span class="token operator">===</span> <span class="token string">'android'</span> <span class="token operator">?</span>
                  &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>leftMargin<span class="token punctuation">}</span><span class="token operator">&gt;</span>
                    &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>resizeModeText<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                      Center
                    &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
                    &lt;Image
                      style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>resizeMode<span class="token punctuation">}</span>
                      resizeMode<span class="token operator">=</span><span class="token punctuation">{</span>Image<span class="token punctuation">.</span>resizeMode<span class="token punctuation">.</span>center<span class="token punctuation">}</span>
                      source<span class="token operator">=</span><span class="token punctuation">{</span>image<span class="token punctuation">}</span>
                    <span class="token operator">/</span><span class="token operator">&gt;</span>
                  &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
                <span class="token punctuation">:</span> <span class="token keyword">null</span> <span class="token punctuation">}</span>
              &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          <span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Animated GIF'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;Image
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>gif<span class="token punctuation">}</span>
          source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> <span class="token string">'http://38.media.tumblr.com/9e9bd08c6e2d10561dd1fb4197df4c4e/tumblr_mfqekpMktw1rn90umo1_500.gif'</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    platform<span class="token punctuation">:</span> <span class="token string">'ios'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Base64 image'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;Image
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>base64<span class="token punctuation">}</span>
          source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> base64Icon<span class="token punctuation">,</span> scale<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    platform<span class="token punctuation">:</span> <span class="token string">'ios'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Cap Insets'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span>
      <span class="token string">'When the image is resized, the corners of the size specified '</span> <span class="token operator">+</span>
      <span class="token string">'by capInsets will stay a fixed size, but the center content and '</span> <span class="token operator">+</span>
      <span class="token string">'borders of the image will be stretched. This is useful for creating '</span> <span class="token operator">+</span>
      <span class="token string">'resizable rounded buttons, shadows, and other resizable assets.'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;ImageCapInsetsExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    platform<span class="token punctuation">:</span> <span class="token string">'ios'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Image Size'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;ImageSizeExample source<span class="token operator">=</span><span class="token punctuation">{</span>fullImage<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> fullImage <span class="token operator">=</span> <span class="token punctuation">{</span>uri<span class="token punctuation">:</span> <span class="token string">'http://facebook.github.io/react/img/logo_og.png'</span><span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> smallImage <span class="token operator">=</span> <span class="token punctuation">{</span>uri<span class="token punctuation">:</span> <span class="token string">'http://facebook.github.io/react/img/logo_small_2x.png'</span><span class="token punctuation">}</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  base<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> <span class="token number">38</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">38</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  progress<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    width<span class="token punctuation">:</span> <span class="token number">100</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  leftMargin<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    marginLeft<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  background<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#222222'</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  sectionText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    marginVertical<span class="token punctuation">:</span> <span class="token number">6</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  nestedText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    marginLeft<span class="token punctuation">:</span> <span class="token number">12</span><span class="token punctuation">,</span>
    marginTop<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'transparent'</span><span class="token punctuation">,</span>
    color<span class="token punctuation">:</span> <span class="token string">'white'</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  resizeMode<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> <span class="token number">90</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">60</span><span class="token punctuation">,</span>
    borderWidth<span class="token punctuation">:</span> <span class="token number">0.5</span><span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'black'</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  resizeModeText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">11</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  icon<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> <span class="token number">15</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">15</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  horizontal<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  gif<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">200</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  base64<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">50</span><span class="token punctuation">,</span>
    resizeMode<span class="token punctuation">:</span> <span class="token string">'contain'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/listview.html#content">Next →</a></div>