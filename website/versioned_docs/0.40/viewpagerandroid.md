---
id: version-0.40-viewpagerandroid
title: viewpagerandroid
original_id: viewpagerandroid
---
<a id="content"></a><h1><a class="anchor" name="viewpagerandroid"></a>ViewPagerAndroid <a class="hash-link" href="docs/viewpagerandroid.html#viewpagerandroid">#</a></h1><div><div><p>Container that allows to flip left and right between child views. Each
child view of the <code>ViewPagerAndroid</code> will be treated as a separate page
and will be stretched to fill the <code>ViewPagerAndroid</code>.</p><p>It is important all children are <code>&lt;View&gt;</code>s and not composite components.
You can set style properties like <code>padding</code> or <code>backgroundColor</code> for each
child.</p><p>Example:</p><div class="prism language-javascript">render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    &lt;ViewPagerAndroid
      style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>viewPager<span class="token punctuation">}</span>
      initialPage<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">0</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>pageStyle<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>First page&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>pageStyle<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>Second page&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    &lt;<span class="token operator">/</span>ViewPagerAndroid<span class="token operator">&gt;</span>
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> <span class="token punctuation">{</span>
  <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
  pageStyle<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/viewpagerandroid.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="docs/view.html#props">View props...</a> <a class="hash-link" href="docs/viewpagerandroid.html#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="initialpage"></a>initialPage <span class="propType">number</span> <a class="hash-link" href="docs/viewpagerandroid.html#initialpage">#</a></h4><div><p>Index of initial page that should be selected. Use <code>setPage</code> method to
update the page, and <code>onPageSelected</code> to monitor page changes</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="keyboarddismissmode"></a>keyboardDismissMode <span class="propType">enum('none', 'on-drag')</span> <a class="hash-link" href="docs/viewpagerandroid.html#keyboarddismissmode">#</a></h4><div><p>Determines whether the keyboard gets dismissed in response to a drag.
  - 'none' (the default), drags do not dismiss the keyboard.
  - 'on-drag', the keyboard is dismissed when a drag begins.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onpagescroll"></a>onPageScroll <span class="propType">function</span> <a class="hash-link" href="docs/viewpagerandroid.html#onpagescroll">#</a></h4><div><p>Executed when transitioning between pages (ether because of animation for
the requested page change or when user is swiping/dragging between pages)
The <code>event.nativeEvent</code> object for this callback will carry following data:
 - position - index of first page from the left that is currently visible
 - offset - value from range [0,1) describing stage between page transitions.
   Value x means that (1 - x) fraction of the page at "position" index is
   visible, and x fraction of the next page is visible.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onpagescrollstatechanged"></a>onPageScrollStateChanged <span class="propType">function</span> <a class="hash-link" href="docs/viewpagerandroid.html#onpagescrollstatechanged">#</a></h4><div><p>Function called when the page scrolling state has changed.
The page scrolling state can be in 3 states:
- idle, meaning there is no interaction with the page scroller happening at the time
- dragging, meaning there is currently an interaction with the page scroller
- settling, meaning that there was an interaction with the page scroller, and the
  page scroller is now finishing it's closing or opening animation</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onpageselected"></a>onPageSelected <span class="propType">function</span> <a class="hash-link" href="docs/viewpagerandroid.html#onpageselected">#</a></h4><div><p>This callback will be called once ViewPager finish navigating to selected page
(when user swipes between pages). The <code>event.nativeEvent</code> object passed to this
callback will have following fields:
 - position - index of page that has been selected</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="pagemargin"></a>pageMargin <span class="propType">number</span> <a class="hash-link" href="docs/viewpagerandroid.html#pagemargin">#</a></h4><div><p>Blank space to show between pages. This is only visible while scrolling, pages are still
edge-to-edge.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="scrollenabled"></a>scrollEnabled <span class="propType">bool</span> <a class="hash-link" href="docs/viewpagerandroid.html#scrollenabled">#</a></h4><div><p>When false, the content does not scroll.
The default value is true.</p></div></div></div><span><h3><a class="anchor" name="type-definitions"></a>Type Definitions <a class="hash-link" href="docs/viewpagerandroid.html#type-definitions">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="viewpagerscrollstate"></a>ViewPagerScrollState <a class="hash-link" href="docs/viewpagerandroid.html#viewpagerscrollstate">#</a></h4><strong>Type:</strong><br>$Enum<div><br><strong>Constants:</strong><table class="params"><thead><tr><th>Value</th><th>Description</th></tr></thead><tbody><tr><td>idle</td><td class="description"><noscript></noscript></td></tr><tr><td>dragging</td><td class="description"><noscript></noscript></td></tr><tr><td>settling</td><td class="description"><noscript></noscript></td></tr></tbody></table></div></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/ViewPager/ViewPagerAndroid.android.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/viewpagerandroid.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/ViewPagerAndroidExample.android.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  Image<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableWithoutFeedback<span class="token punctuation">,</span>
  TouchableOpacity<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  ViewPagerAndroid<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

import type <span class="token punctuation">{</span> ViewPagerScrollState <span class="token punctuation">}</span> from <span class="token string">'ViewPagerAndroid'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> PAGES <span class="token operator">=</span> <span class="token number">5</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> BGCOLOR <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token string">'#fdc08e'</span><span class="token punctuation">,</span> <span class="token string">'#fff6b9'</span><span class="token punctuation">,</span> <span class="token string">'#99d1b7'</span><span class="token punctuation">,</span> <span class="token string">'#dde5fe'</span><span class="token punctuation">,</span> <span class="token string">'#f79273'</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> IMAGE_URIS <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token string">'https://apod.nasa.gov/apod/image/1410/20141008tleBaldridge001h990.jpg'</span><span class="token punctuation">,</span>
  <span class="token string">'https://apod.nasa.gov/apod/image/1409/volcanicpillar_vetter_960.jpg'</span><span class="token punctuation">,</span>
  <span class="token string">'https://apod.nasa.gov/apod/image/1409/m27_snyder_960.jpg'</span><span class="token punctuation">,</span>
  <span class="token string">'https://apod.nasa.gov/apod/image/1409/PupAmulti_rot0.jpg'</span><span class="token punctuation">,</span>
  <span class="token string">'https://apod.nasa.gov/apod/image/1510/lunareclipse_27Sep_beletskycrop4.jpg'</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span>

class <span class="token class-name">LikeCount</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    likes<span class="token punctuation">:</span> <span class="token number">7</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  onClick <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>likes<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>likes <span class="token operator">+</span> <span class="token number">1</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> thumbsUp <span class="token operator">=</span> <span class="token string">'\uD83D\uDC4D'</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>likeContainer<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;TouchableOpacity onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>onClick<span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>likeButton<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>likesText<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            <span class="token punctuation">{</span>thumbsUp <span class="token operator">+</span> <span class="token string">' Like'</span><span class="token punctuation">}</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableOpacity<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>likesText<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>likes <span class="token operator">+</span> <span class="token string">' likes'</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">Button</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  _handlePress <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>enabled &amp;&amp; <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>onPress<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span><span class="token function">onPress<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;TouchableWithoutFeedback onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_handlePress<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>enabled <span class="token operator">?</span> <span class="token punctuation">{</span><span class="token punctuation">}</span> <span class="token punctuation">:</span> styles<span class="token punctuation">.</span>buttonDisabled<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>buttonText<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>text<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>TouchableWithoutFeedback<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">ProgressBar</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> fractionalPosition <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>progress<span class="token punctuation">.</span>position <span class="token operator">+</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>progress<span class="token punctuation">.</span>offset<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">var</span> progressBarSize <span class="token operator">=</span> <span class="token punctuation">(</span>fractionalPosition <span class="token operator">/</span> <span class="token punctuation">(</span>PAGES <span class="token operator">-</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token operator">*</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>size<span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>progressBarContainer<span class="token punctuation">,</span> <span class="token punctuation">{</span>width<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>size<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>progressBar<span class="token punctuation">,</span> <span class="token punctuation">{</span>width<span class="token punctuation">:</span> progressBarSize<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">ViewPagerAndroidExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  static title <span class="token operator">=</span> <span class="token string">'&lt;ViewPagerAndroid&gt;'</span><span class="token punctuation">;</span>
  static description <span class="token operator">=</span> <span class="token string">'Container that allows to flip left and right between child views.'</span><span class="token punctuation">;</span>

  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    page<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
    animationsAreEnabled<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    scrollEnabled<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    progress<span class="token punctuation">:</span> <span class="token punctuation">{</span>
      position<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
      offset<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  onPageSelected <span class="token operator">=</span> <span class="token punctuation">(</span>e<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>page<span class="token punctuation">:</span> e<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>position<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  onPageScroll <span class="token operator">=</span> <span class="token punctuation">(</span>e<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>progress<span class="token punctuation">:</span> e<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  onPageScrollStateChanged <span class="token operator">=</span> <span class="token punctuation">(</span>state <span class="token punctuation">:</span> ViewPagerScrollState<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>scrollState<span class="token punctuation">:</span> state<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  move <span class="token operator">=</span> <span class="token punctuation">(</span>delta<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> page <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>page <span class="token operator">+</span> delta<span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">go<span class="token punctuation">(</span></span>page<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  go <span class="token operator">=</span> <span class="token punctuation">(</span>page<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>animationsAreEnabled<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>viewPager<span class="token punctuation">.</span><span class="token function">setPage<span class="token punctuation">(</span></span>page<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>viewPager<span class="token punctuation">.</span><span class="token function">setPageWithoutAnimation<span class="token punctuation">(</span></span>page<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>page<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> pages <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">var</span> i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> i &lt; PAGES<span class="token punctuation">;</span> i<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">var</span> pageStyle <span class="token operator">=</span> <span class="token punctuation">{</span>
        backgroundColor<span class="token punctuation">:</span> BGCOLOR<span class="token punctuation">[</span>i <span class="token operator">%</span> BGCOLOR<span class="token punctuation">.</span>length<span class="token punctuation">]</span><span class="token punctuation">,</span>
        alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
        padding<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">;</span>
      pages<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span>
        &lt;View key<span class="token operator">=</span><span class="token punctuation">{</span>i<span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>pageStyle<span class="token punctuation">}</span> collapsable<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Image
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>image<span class="token punctuation">}</span>
            source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> IMAGE_URIS<span class="token punctuation">[</span>i <span class="token operator">%</span> BGCOLOR<span class="token punctuation">.</span>length<span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;LikeCount <span class="token operator">/</span><span class="token operator">&gt;</span>
       &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">var</span> <span class="token punctuation">{</span> page<span class="token punctuation">,</span> animationsAreEnabled <span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;ViewPagerAndroid
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>viewPager<span class="token punctuation">}</span>
          initialPage<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">0</span><span class="token punctuation">}</span>
          scrollEnabled<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>scrollEnabled<span class="token punctuation">}</span>
          onPageScroll<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>onPageScroll<span class="token punctuation">}</span>
          onPageSelected<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>onPageSelected<span class="token punctuation">}</span>
          onPageScrollStateChanged<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>onPageScrollStateChanged<span class="token punctuation">}</span>
          pageMargin<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">10</span><span class="token punctuation">}</span>
          ref<span class="token operator">=</span><span class="token punctuation">{</span>viewPager <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">this</span><span class="token punctuation">.</span>viewPager <span class="token operator">=</span> viewPager<span class="token punctuation">;</span> <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span>pages<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>ViewPagerAndroid<span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>buttons<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Button
            enabled<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            text<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>scrollEnabled <span class="token operator">?</span> <span class="token string">'Scroll Enabled'</span> <span class="token punctuation">:</span> <span class="token string">'Scroll Disabled'</span><span class="token punctuation">}</span>
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>scrollEnabled<span class="token punctuation">:</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>scrollEnabled<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>buttons<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span> animationsAreEnabled <span class="token operator">?</span>
            &lt;Button
              text<span class="token operator">=</span><span class="token string">"Turn off animations"</span>
              enabled<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
              onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>animationsAreEnabled<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span> <span class="token punctuation">:</span>
            &lt;Button
              text<span class="token operator">=</span><span class="token string">"Turn animations back on"</span>
              enabled<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
              onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>animationsAreEnabled<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span> <span class="token punctuation">}</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>scrollStateText<span class="token punctuation">}</span><span class="token operator">&gt;</span>ScrollState<span class="token punctuation">[</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>scrollState<span class="token punctuation">}</span> <span class="token punctuation">]</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>buttons<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Button text<span class="token operator">=</span><span class="token string">"Start"</span> enabled<span class="token operator">=</span><span class="token punctuation">{</span>page <span class="token operator">&gt;</span> <span class="token number">0</span><span class="token punctuation">}</span> onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">go<span class="token punctuation">(</span></span><span class="token number">0</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Button text<span class="token operator">=</span><span class="token string">"Prev"</span> enabled<span class="token operator">=</span><span class="token punctuation">{</span>page <span class="token operator">&gt;</span> <span class="token number">0</span><span class="token punctuation">}</span> onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">move<span class="token punctuation">(</span></span><span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>buttonText<span class="token punctuation">}</span><span class="token operator">&gt;</span>Page <span class="token punctuation">{</span>page <span class="token operator">+</span> <span class="token number">1</span><span class="token punctuation">}</span> <span class="token operator">/</span> <span class="token punctuation">{</span>PAGES<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;ProgressBar size<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">100</span><span class="token punctuation">}</span> progress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>progress<span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Button text<span class="token operator">=</span><span class="token string">"Next"</span> enabled<span class="token operator">=</span><span class="token punctuation">{</span>page &lt; PAGES <span class="token operator">-</span> <span class="token number">1</span><span class="token punctuation">}</span> onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">move<span class="token punctuation">(</span></span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Button text<span class="token operator">=</span><span class="token string">"Last"</span> enabled<span class="token operator">=</span><span class="token punctuation">{</span>page &lt; PAGES <span class="token operator">-</span> <span class="token number">1</span><span class="token punctuation">}</span> onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">go<span class="token punctuation">(</span></span>PAGES <span class="token operator">-</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  buttons<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">30</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'black'</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'space-between'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  button<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    width<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
    margin<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'gray'</span><span class="token punctuation">,</span>
    borderWidth<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'gray'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  buttonDisabled<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'black'</span><span class="token punctuation">,</span>
    opacity<span class="token punctuation">:</span> <span class="token number">0.5</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  buttonText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    color<span class="token punctuation">:</span> <span class="token string">'white'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  scrollStateText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    color<span class="token punctuation">:</span> <span class="token string">'#99d1b7'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  container<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'white'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  image<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> <span class="token number">300</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">200</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  likeButton<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'rgba(0, 0, 0, 0.1)'</span><span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'#333333'</span><span class="token punctuation">,</span>
    borderWidth<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    margin<span class="token punctuation">:</span> <span class="token number">8</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">8</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  likeContainer<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  likesText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">18</span><span class="token punctuation">,</span>
    alignSelf<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  progressBarContainer<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    height<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
    margin<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'#eeeeee'</span><span class="token punctuation">,</span>
    borderWidth<span class="token punctuation">:</span> <span class="token number">2</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  progressBar<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    alignSelf<span class="token punctuation">:</span> <span class="token string">'flex-start'</span><span class="token punctuation">,</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#eeeeee'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  viewPager<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

module<span class="token punctuation">.</span>exports <span class="token operator">=</span> ViewPagerAndroidExample<span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="338" src="img/uiexplorer_main_android.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/q7wkvt42v6bkr0pzt1n0gmbwfr?device=nexus5&amp;scale=65&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22ViewPagerAndroid%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/view.html#content">← Prev</a><a class="docs-next" href="docs/webview.html#content">Next →</a></div>