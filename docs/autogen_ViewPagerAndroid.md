---
id: viewpagerandroid
title: ViewPagerAndroid
sidebar: api
category: Components
permalink: docs/viewpagerandroid.html
---
<div><div><p>Container that allows to flip left and right between child views. Each
child view of the <code>ViewPagerAndroid</code> will be treated as a separate page
and will be stretched to fill the <code>ViewPagerAndroid</code>.</p><p>It is important all children are <code>&lt;View&gt;</code>s and not composite components.
You can set style properties like <code>padding</code> or <code>backgroundColor</code> for each
child.</p><p>Example:</p><div class="prism language-javascript">render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    <span class="token operator">&lt;</span>ViewPagerAndroid
      style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>viewPager<span class="token punctuation">}</span>
      initialPage<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">0</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
      <span class="token operator">&lt;</span>View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>pageStyle<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        <span class="token operator">&lt;</span>Text<span class="token operator">&gt;</span>First page<span class="token operator">&lt;</span><span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      <span class="token operator">&lt;</span><span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token operator">&lt;</span>View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>pageStyle<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        <span class="token operator">&lt;</span>Text<span class="token operator">&gt;</span>Second page<span class="token operator">&lt;</span><span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      <span class="token operator">&lt;</span><span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token operator">&lt;</span><span class="token operator">/</span>ViewPagerAndroid<span class="token operator">&gt;</span>
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token operator">...</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> <span class="token punctuation">{</span>
  <span class="token operator">...</span>
  pageStyle<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/viewpagerandroid.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="viewproptypes"></a><a href="docs/viewproptypes.html#props">ViewPropTypes props...</a> <a class="hash-link" href="docs/viewpagerandroid.html#viewproptypes">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="initialpage"></a>initialPage?: <span class="propType">number</span> <a class="hash-link" href="docs/viewpagerandroid.html#initialpage">#</a></h4><div><p>Index of initial page that should be selected. Use <code>setPage</code> method to
update the page, and <code>onPageSelected</code> to monitor page changes</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="keyboarddismissmode"></a>keyboardDismissMode?: <span class="propType"><span><span>literal | </span>literal</span></span> <a class="hash-link" href="docs/viewpagerandroid.html#keyboarddismissmode">#</a></h4><div><p>Determines whether the keyboard gets dismissed in response to a drag.
  - 'none' (the default), drags do not dismiss the keyboard.
  - 'on-drag', the keyboard is dismissed when a drag begins.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onpagescroll"></a>onPageScroll?: <span class="propType">Function</span> <a class="hash-link" href="docs/viewpagerandroid.html#onpagescroll">#</a></h4><div><p>Executed when transitioning between pages (ether because of animation for
the requested page change or when user is swiping/dragging between pages)
The <code>event.nativeEvent</code> object for this callback will carry following data:
 - position - index of first page from the left that is currently visible
 - offset - value from range [0,1) describing stage between page transitions.
   Value x means that (1 - x) fraction of the page at "position" index is
   visible, and x fraction of the next page is visible.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onpagescrollstatechanged"></a>onPageScrollStateChanged?: <span class="propType">Function</span> <a class="hash-link" href="docs/viewpagerandroid.html#onpagescrollstatechanged">#</a></h4><div><p>Function called when the page scrolling state has changed.
The page scrolling state can be in 3 states:
- idle, meaning there is no interaction with the page scroller happening at the time
- dragging, meaning there is currently an interaction with the page scroller
- settling, meaning that there was an interaction with the page scroller, and the
  page scroller is now finishing it's closing or opening animation</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onpageselected"></a>onPageSelected?: <span class="propType">Function</span> <a class="hash-link" href="docs/viewpagerandroid.html#onpageselected">#</a></h4><div><p>This callback will be called once ViewPager finish navigating to selected page
(when user swipes between pages). The <code>event.nativeEvent</code> object passed to this
callback will have following fields:
 - position - index of page that has been selected</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="pagemargin"></a>pageMargin?: <span class="propType">number</span> <a class="hash-link" href="docs/viewpagerandroid.html#pagemargin">#</a></h4><div><p>Blank space to show between pages. This is only visible while scrolling, pages are still
edge-to-edge.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="peekenabled"></a>peekEnabled?: <span class="propType">boolean</span> <a class="hash-link" href="docs/viewpagerandroid.html#peekenabled">#</a></h4><div><p>Whether enable showing peekFraction or not. If this is true, the preview of
last and next page will show in current screen. Defaults to false.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="scrollenabled"></a>scrollEnabled?: <span class="propType">boolean</span> <a class="hash-link" href="docs/viewpagerandroid.html#scrollenabled">#</a></h4><div><p>When false, the content does not scroll.
The default value is true.</p></div></div></div><span><h3><a class="anchor" name="type-definitions"></a>Type Definitions <a class="hash-link" href="docs/viewpagerandroid.html#type-definitions">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="viewpagerscrollstate"></a>ViewPagerScrollState <a class="hash-link" href="docs/viewpagerandroid.html#viewpagerscrollstate">#</a></h4><strong>Type:</strong><br>$Enum<div><br><strong>Constants:</strong><table class="params"><thead><tr><th>Value</th><th>Description</th></tr></thead><tbody><tr><td>idle</td><td class="description"><noscript></noscript></td></tr><tr><td>dragging</td><td class="description"><noscript></noscript></td></tr><tr><td>settling</td><td class="description"><noscript></noscript></td></tr></tbody></table></div></div></div></span></div>