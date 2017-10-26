---
id: listview
title: listview
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="listview"></a>ListView <a class="hash-link" href="docs/listview.html#listview">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/CustomComponents/ListView/ListView.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>ListView - A core component designed for efficient display of vertically
scrolling lists of changing data.  The minimal API is to create a
<code>ListView.DataSource</code>, populate it with a simple array of data blobs, and
instantiate a <code>ListView</code> component with that data source and a <code>renderRow</code>
callback which takes a blob from the data array and returns a renderable
component.</p><p>Minimal example:</p><div class="prism language-javascript">getInitialState<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">var</span> ds <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ListView<span class="token punctuation">.</span>DataSource</span><span class="token punctuation">(</span><span class="token punctuation">{</span>rowHasChanged<span class="token punctuation">:</span> <span class="token punctuation">(</span>r1<span class="token punctuation">,</span> r2<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> r1 <span class="token operator">!</span><span class="token operator">==</span> r2<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token keyword">return</span> <span class="token punctuation">{</span>
    dataSource<span class="token punctuation">:</span> ds<span class="token punctuation">.</span><span class="token function">cloneWithRows<span class="token punctuation">(</span></span><span class="token punctuation">[</span><span class="token string">'row 1'</span><span class="token punctuation">,</span> <span class="token string">'row 2'</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span>

render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    &lt;ListView
      dataSource<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>dataSource<span class="token punctuation">}</span>
      renderRow<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>rowData<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span>rowData<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span><span class="token punctuation">}</span>
    <span class="token operator">/</span><span class="token operator">&gt;</span>
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span></div><p>ListView also supports more advanced features, including sections with sticky
section headers, header and footer support, callbacks on reaching the end of
the available data (<code>onEndReached</code>) and on the set of rows that are visible
in the device viewport change (<code>onChangeVisibleRows</code>), and several
performance optimizations.</p><p>There are a few performance operations designed to make ListView scroll
smoothly while dynamically loading potentially very large (or conceptually
infinite) data sets:</p><ul><li><p>Only re-render changed rows - the rowHasChanged function provided to the
data source tells the ListView if it needs to re-render a row because the
source data has changed - see ListViewDataSource for more details.</p></li><li><p>Rate-limited row rendering - By default, only one row is rendered per
event-loop (customizable with the <code>pageSize</code> prop).  This breaks up the
work into smaller chunks to reduce the chance of dropping frames while
rendering rows.</p></li></ul></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/listview.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="scrollview"></a><a href="docs/scrollview.html#props">ScrollView props...</a> <a class="hash-link" href="docs/listview.html#scrollview">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="datasource"></a>dataSource <span class="propType">ListViewDataSource</span> <a class="hash-link" href="docs/listview.html#datasource">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="initiallistsize"></a>initialListSize <span class="propType">number</span> <a class="hash-link" href="docs/listview.html#initiallistsize">#</a></h4><div><p>How many rows to render on initial component mount.  Use this to make
it so that the first screen worth of data appears at one time instead of
over the course of multiple frames.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onchangevisiblerows"></a>onChangeVisibleRows <span class="propType">function</span> <a class="hash-link" href="docs/listview.html#onchangevisiblerows">#</a></h4><div><p>(visibleRows, changedRows) =&gt; void</p><p>Called when the set of visible rows changes.  <code>visibleRows</code> maps
{ sectionID: { rowID: true }} for all the visible rows, and
<code>changedRows</code> maps { sectionID: { rowID: true | false }} for the rows
that have changed their visibility, with true indicating visible, and
false indicating the view has moved out of view.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onendreached"></a>onEndReached <span class="propType">function</span> <a class="hash-link" href="docs/listview.html#onendreached">#</a></h4><div><p>Called when all rows have been rendered and the list has been scrolled
to within onEndReachedThreshold of the bottom.  The native scroll
event is provided.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onendreachedthreshold"></a>onEndReachedThreshold <span class="propType">number</span> <a class="hash-link" href="docs/listview.html#onendreachedthreshold">#</a></h4><div><p>Threshold in pixels (virtual, not physical) for calling onEndReached.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="pagesize"></a>pageSize <span class="propType">number</span> <a class="hash-link" href="docs/listview.html#pagesize">#</a></h4><div><p>Number of rows to render per event loop. Note: if your 'rows' are actually
cells, i.e. they don't span the full width of your view (as in the
ListViewGridLayoutExample), you should set the pageSize to be a multiple
of the number of cells per row, otherwise you're likely to see gaps at
the edge of the ListView as new pages are loaded.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="removeclippedsubviews"></a>removeClippedSubviews <span class="propType">bool</span> <a class="hash-link" href="docs/listview.html#removeclippedsubviews">#</a></h4><div><p>A performance optimization for improving scroll perf of
large lists, used in conjunction with overflow: 'hidden' on the row
containers.  This is enabled by default.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="renderfooter"></a>renderFooter <span class="propType">function</span> <a class="hash-link" href="docs/listview.html#renderfooter">#</a></h4><div><p>() =&gt; renderable</p><p>The header and footer are always rendered (if these props are provided)
on every render pass.  If they are expensive to re-render, wrap them
in StaticContainer or other mechanism as appropriate.  Footer is always
at the bottom of the list, and header at the top, on every render pass.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="renderheader"></a>renderHeader <span class="propType">function</span> <a class="hash-link" href="docs/listview.html#renderheader">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="renderrow"></a>renderRow <span class="propType">function</span> <a class="hash-link" href="docs/listview.html#renderrow">#</a></h4><div><p>(rowData, sectionID, rowID, highlightRow) =&gt; renderable</p><p>Takes a data entry from the data source and its ids and should return
a renderable component to be rendered as the row.  By default the data
is exactly what was put into the data source, but it's also possible to
provide custom extractors. ListView can be notified when a row is
being highlighted by calling highlightRow function. The separators above and
below will be hidden when a row is highlighted. The highlighted state of
a row can be reset by calling highlightRow(null).</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="renderscrollcomponent"></a>renderScrollComponent <span class="propType">function</span> <a class="hash-link" href="docs/listview.html#renderscrollcomponent">#</a></h4><div><p>(props) =&gt; renderable</p><p>A function that returns the scrollable component in which the list rows
are rendered. Defaults to returning a ScrollView with the given props.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="rendersectionheader"></a>renderSectionHeader <span class="propType">function</span> <a class="hash-link" href="docs/listview.html#rendersectionheader">#</a></h4><div><p>(sectionData, sectionID) =&gt; renderable</p><p>If provided, a sticky header is rendered for this section.  The sticky
behavior means that it will scroll with the content at the top of the
section until it reaches the top of the screen, at which point it will
stick to the top until it is pushed off the screen by the next section
header.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="renderseparator"></a>renderSeparator <span class="propType">function</span> <a class="hash-link" href="docs/listview.html#renderseparator">#</a></h4><div><p>(sectionID, rowID, adjacentRowHighlighted) =&gt; renderable</p><p>If provided, a renderable component to be rendered as the separator
below each row but not the last row if there is a section header below.
Take a sectionID and rowID of the row above and whether its adjacent row
is highlighted.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="scrollrenderaheaddistance"></a>scrollRenderAheadDistance <span class="propType">number</span> <a class="hash-link" href="docs/listview.html#scrollrenderaheaddistance">#</a></h4><div><p>How early to start rendering rows before they come on screen, in
pixels.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="stickyheaderindices"></a><span class="platform">ios</span>stickyHeaderIndices <span class="propType">[number]</span> <a class="hash-link" href="docs/listview.html#stickyheaderindices">#</a></h4><div><p>An array of child indices determining which children get docked to the
top of the screen when scrolling. For example, passing
<code>stickyHeaderIndices={[0]}</code> will cause the first child to be fixed to the
top of the scroll view. This property is not supported in conjunction
with <code>horizontal={true}</code>.</p></div></div></div></div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/listview.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/ListViewExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  Image<span class="token punctuation">,</span>
  ListView<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  RecyclerViewBackedScrollView<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>

<span class="token keyword">var</span> UIExplorerPage <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./UIExplorerPage'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> ListViewSimpleExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  statics<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'&lt;ListView&gt;'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Performant, scrollable list of data.'</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  getInitialState<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> ds <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ListView<span class="token punctuation">.</span>DataSource</span><span class="token punctuation">(</span><span class="token punctuation">{</span>rowHasChanged<span class="token punctuation">:</span> <span class="token punctuation">(</span>r1<span class="token punctuation">,</span> r2<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> r1 <span class="token operator">!</span><span class="token operator">==</span> r2<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      dataSource<span class="token punctuation">:</span> ds<span class="token punctuation">.</span><span class="token function">cloneWithRows<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_genRows<span class="token punctuation">(</span></span><span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _pressData<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token punctuation">[</span>key<span class="token punctuation">:</span> number<span class="token punctuation">]</span><span class="token punctuation">:</span> boolean<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">,</span>

  componentWillMount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_pressData <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;UIExplorerPage
        title<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator <span class="token operator">?</span> <span class="token keyword">null</span> <span class="token punctuation">:</span> <span class="token string">'&lt;ListView&gt;'</span><span class="token punctuation">}</span>
        noSpacer<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
        noScroll<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;ListView
          dataSource<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>dataSource<span class="token punctuation">}</span>
          renderRow<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_renderRow<span class="token punctuation">}</span>
          renderScrollComponent<span class="token operator">=</span><span class="token punctuation">{</span>props <span class="token operator">=</span><span class="token operator">&gt;</span> &lt;RecyclerViewBackedScrollView <span class="token punctuation">{</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">}</span>
          renderSeparator<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>sectionID<span class="token punctuation">,</span> rowID<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> &lt;View key<span class="token operator">=</span><span class="token punctuation">{</span>`$<span class="token punctuation">{</span>sectionID<span class="token punctuation">}</span><span class="token operator">-</span>$<span class="token punctuation">{</span>rowID<span class="token punctuation">}</span>`<span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>separator<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>UIExplorerPage<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _renderRow<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>rowData<span class="token punctuation">:</span> string<span class="token punctuation">,</span> sectionID<span class="token punctuation">:</span> number<span class="token punctuation">,</span> rowID<span class="token punctuation">:</span> number<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> rowHash <span class="token operator">=</span> Math<span class="token punctuation">.</span><span class="token function">abs<span class="token punctuation">(</span></span><span class="token function">hashCode<span class="token punctuation">(</span></span>rowData<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">var</span> imgSource <span class="token operator">=</span> THUMB_URLS<span class="token punctuation">[</span>rowHash <span class="token operator">%</span> THUMB_URLS<span class="token punctuation">.</span>length<span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;TouchableHighlight onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_pressRow<span class="token punctuation">(</span></span>rowID<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>row<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Image style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>thumb<span class="token punctuation">}</span> source<span class="token operator">=</span><span class="token punctuation">{</span>imgSource<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>text<span class="token punctuation">}</span><span class="token operator">&gt;</span>
              <span class="token punctuation">{</span>rowData <span class="token operator">+</span> <span class="token string">' - '</span> <span class="token operator">+</span> LOREM_IPSUM<span class="token punctuation">.</span><span class="token function">substr<span class="token punctuation">(</span></span><span class="token number">0</span><span class="token punctuation">,</span> rowHash <span class="token operator">%</span> <span class="token number">301</span> <span class="token operator">+</span> <span class="token number">10</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _genRows<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>pressData<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token punctuation">[</span>key<span class="token punctuation">:</span> number<span class="token punctuation">]</span><span class="token punctuation">:</span> boolean<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">:</span> Array&lt;string<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> dataBlob <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">var</span> ii <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> ii &lt; <span class="token number">100</span><span class="token punctuation">;</span> ii<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">var</span> pressedText <span class="token operator">=</span> pressData<span class="token punctuation">[</span>ii<span class="token punctuation">]</span> <span class="token operator">?</span> <span class="token string">' (pressed)'</span> <span class="token punctuation">:</span> <span class="token string">''</span><span class="token punctuation">;</span>
      dataBlob<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span><span class="token string">'Row '</span> <span class="token operator">+</span> ii <span class="token operator">+</span> pressedText<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">return</span> dataBlob<span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _pressRow<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>rowID<span class="token punctuation">:</span> number<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_pressData<span class="token punctuation">[</span>rowID<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>_pressData<span class="token punctuation">[</span>rowID<span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>dataSource<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>dataSource<span class="token punctuation">.</span><span class="token function">cloneWithRows<span class="token punctuation">(</span></span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_genRows<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>_pressData<span class="token punctuation">)</span>
    <span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> THUMB_URLS <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./Thumbnails/like.png'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./Thumbnails/dislike.png'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./Thumbnails/call.png'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./Thumbnails/fist.png'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./Thumbnails/bandaged.png'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./Thumbnails/flowers.png'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./Thumbnails/heart.png'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./Thumbnails/liking.png'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./Thumbnails/party.png'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./Thumbnails/poke.png'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./Thumbnails/superlike.png'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./Thumbnails/victory.png'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token punctuation">]</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> LOREM_IPSUM <span class="token operator">=</span> <span class="token string">'Lorem ipsum dolor sit amet, ius ad pertinax oportere accommodare, an vix civibus corrumpit referrentur. Te nam case ludus inciderint, te mea facilisi adipiscing. Sea id integre luptatum. In tota sale consequuntur nec. Erat ocurreret mei ei. Eu paulo sapientem vulputate est, vel an accusam intellegam interesset. Nam eu stet pericula reprimique, ea vim illud modus, putant invidunt reprehendunt ne qui.'</span><span class="token punctuation">;</span>

<span class="token comment" spellcheck="true">/* eslint no-bitwise: 0 */</span>
<span class="token keyword">var</span> hashCode <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>str<span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">var</span> hash <span class="token operator">=</span> <span class="token number">15</span><span class="token punctuation">;</span>
  <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">var</span> ii <span class="token operator">=</span> str<span class="token punctuation">.</span>length <span class="token operator">-</span> <span class="token number">1</span><span class="token punctuation">;</span> ii <span class="token operator">&gt;=</span> <span class="token number">0</span><span class="token punctuation">;</span> ii<span class="token operator">--</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    hash <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">(</span>hash &lt;&lt; <span class="token number">5</span><span class="token punctuation">)</span> <span class="token operator">-</span> hash<span class="token punctuation">)</span> <span class="token operator">+</span> str<span class="token punctuation">.</span><span class="token function">charCodeAt<span class="token punctuation">(</span></span>ii<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  <span class="token keyword">return</span> hash<span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  row<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#F6F6F6'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  separator<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    height<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#CCCCCC'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  thumb<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> <span class="token number">64</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">64</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  text<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

module<span class="token punctuation">.</span>exports <span class="token operator">=</span> ListViewSimpleExample<span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/mapview.html#content">Next →</a></div>