---
id: version-0.21-refreshcontrol
title: refreshcontrol
original_id: refreshcontrol
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="refreshcontrol"></a>RefreshControl <a class="hash-link" href="undefined#refreshcontrol">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/RefreshControl/RefreshControl.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>This component is used inside a ScrollView to add pull to refresh
functionality. When the ScrollView is at <code>scrollY: 0</code>, swiping down
triggers an <code>onRefresh</code> event.</p></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="undefined#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="view.html#props">View props...</a> <a class="hash-link" href="undefined#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onrefresh"></a>onRefresh <span class="propType">function</span> <a class="hash-link" href="undefined#onrefresh">#</a></h4><div><p>Called when the view starts refreshing.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="refreshing"></a>refreshing <span class="propType">bool</span> <a class="hash-link" href="undefined#refreshing">#</a></h4><div><p>Whether the view should be indicating an active refresh.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="colors"></a><span class="platform">android</span>colors <span class="propType">[[object Object]]</span> <a class="hash-link" href="undefined#colors">#</a></h4><div><p>The colors (at least one) that will be used to draw the refresh indicator.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="enabled"></a><span class="platform">android</span>enabled <span class="propType">bool</span> <a class="hash-link" href="undefined#enabled">#</a></h4><div><p>Whether the pull to refresh functionality is enabled.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="progressbackgroundcolor"></a><span class="platform">android</span>progressBackgroundColor <span class="propType"><a href="colors.html">color</a></span> <a class="hash-link" href="undefined#progressbackgroundcolor">#</a></h4><div><p>The background color of the refresh indicator.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="size"></a><span class="platform">android</span>size <span class="propType">RefreshLayoutConsts.SIZE.DEFAULT</span> <a class="hash-link" href="undefined#size">#</a></h4><div><p>Size of the refresh indicator, see RefreshControl.SIZE.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="tintcolor"></a><span class="platform">ios</span>tintColor <span class="propType"><a href="colors.html">color</a></span> <a class="hash-link" href="undefined#tintcolor">#</a></h4><div><p>The color of the refresh indicator.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="title"></a><span class="platform">ios</span>title <span class="propType">string</span> <a class="hash-link" href="undefined#title">#</a></h4><div><p>The title displayed under the refresh indicator.</p></div></div></div></div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="undefined#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/RefreshControlExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

const React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const <span class="token punctuation">{</span>
  ScrollView<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  RefreshControl<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableWithoutFeedback<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>

const styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  row<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'grey'</span><span class="token punctuation">,</span>
    borderWidth<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#3a5795'</span><span class="token punctuation">,</span>
    margin<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  text<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    alignSelf<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    color<span class="token punctuation">:</span> <span class="token string">'#fff'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  scrollview<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

const Row <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  _onClick<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span><span class="token function">onClick<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>data<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
     &lt;TouchableWithoutFeedback onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onClick<span class="token punctuation">}</span> <span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>row<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>text<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>data<span class="token punctuation">.</span>text <span class="token operator">+</span> <span class="token string">' ('</span> <span class="token operator">+</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>data<span class="token punctuation">.</span>clicks <span class="token operator">+</span> <span class="token string">' clicks)'</span><span class="token punctuation">}</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>TouchableWithoutFeedback<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

const RefreshControlExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  statics<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'&lt;RefreshControl&gt;'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Adds pull-to-refresh support to a scrollview.'</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      isRefreshing<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
      loaded<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
      rowData<span class="token punctuation">:</span> Array<span class="token punctuation">.</span><span class="token function">from<span class="token punctuation">(</span></span><span class="token keyword">new</span> <span class="token class-name">Array</span><span class="token punctuation">(</span><span class="token number">20</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span>
        <span class="token punctuation">(</span>val<span class="token punctuation">,</span> i<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">(</span><span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Initial row '</span> <span class="token operator">+</span> i<span class="token punctuation">,</span> clicks<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_onClick<span class="token punctuation">(</span></span>row<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    row<span class="token punctuation">.</span>clicks<span class="token operator">++</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      rowData<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>rowData<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    const rows <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>rowData<span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>row<span class="token punctuation">,</span> ii<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;Row key<span class="token operator">=</span><span class="token punctuation">{</span>ii<span class="token punctuation">}</span> data<span class="token operator">=</span><span class="token punctuation">{</span>row<span class="token punctuation">}</span> onClick<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onClick<span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;ScrollView
        style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>scrollview<span class="token punctuation">}</span>
        refreshControl<span class="token operator">=</span><span class="token punctuation">{</span>
          &lt;RefreshControl
            refreshing<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>isRefreshing<span class="token punctuation">}</span>
            onRefresh<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onRefresh<span class="token punctuation">}</span>
            tintColor<span class="token operator">=</span><span class="token string">"#ff0000"</span>
            title<span class="token operator">=</span><span class="token string">"Loading..."</span>
            colors<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span><span class="token string">'#ff0000'</span><span class="token punctuation">,</span> <span class="token string">'#00ff00'</span><span class="token punctuation">,</span> <span class="token string">'#0000ff'</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            progressBackgroundColor<span class="token operator">=</span><span class="token string">"#ffff00"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        <span class="token punctuation">}</span><span class="token operator">&gt;</span>
        <span class="token punctuation">{</span>rows<span class="token punctuation">}</span>
      &lt;<span class="token operator">/</span>ScrollView<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  <span class="token function">_onRefresh<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>isRefreshing<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">setTimeout<span class="token punctuation">(</span></span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
     <span class="token comment" spellcheck="true"> // prepend 10 items
</span>      const rowData <span class="token operator">=</span> Array<span class="token punctuation">.</span><span class="token function">from<span class="token punctuation">(</span></span><span class="token keyword">new</span> <span class="token class-name">Array</span><span class="token punctuation">(</span><span class="token number">10</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
      <span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>val<span class="token punctuation">,</span> i<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">(</span><span class="token punctuation">{</span>
        text<span class="token punctuation">:</span> <span class="token string">'Loaded row '</span> <span class="token operator">+</span> <span class="token punctuation">(</span><span class="token operator">+</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>loaded <span class="token operator">+</span> i<span class="token punctuation">)</span><span class="token punctuation">,</span>
        clicks<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
      <span class="token punctuation">.</span><span class="token function">concat<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>rowData<span class="token punctuation">)</span><span class="token punctuation">;</span>

      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
        loaded<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>loaded <span class="token operator">+</span> <span class="token number">10</span><span class="token punctuation">,</span>
        isRefreshing<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        rowData<span class="token punctuation">:</span> rowData<span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">5000</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

module<span class="token punctuation">.</span>exports <span class="token operator">=</span> RefreshControlExample<span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="scrollview.html#content">Next →</a></div>