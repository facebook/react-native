---
id: version-0.45-listview
title: listview
original_id: listview
---
<a id="content"></a><h1><a class="anchor" name="listview"></a>ListView <a class="hash-link" href="docs/listview.html#listview">#</a></h1><div><div><p>ListView - A core component designed for efficient display of vertically
scrolling lists of changing data. The minimal API is to create a
<a href="docs/listviewdatasource.html" target="_blank"><code>ListView.DataSource</code></a>, populate it with a simple
array of data blobs, and instantiate a <code>ListView</code> component with that data
source and a <code>renderRow</code> callback which takes a blob from the data array and
returns a renderable component.</p><p>Minimal example:</p><div class="prism language-javascript">class <span class="token class-name">MyComponent</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">constructor<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    const ds <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ListView<span class="token punctuation">.</span>DataSource</span><span class="token punctuation">(</span><span class="token punctuation">{</span>rowHasChanged<span class="token punctuation">:</span> <span class="token punctuation">(</span>r1<span class="token punctuation">,</span> r2<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> r1 <span class="token operator">!</span><span class="token operator">==</span> r2<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>
      dataSource<span class="token punctuation">:</span> ds<span class="token punctuation">.</span><span class="token function">cloneWithRows<span class="token punctuation">(</span></span><span class="token punctuation">[</span><span class="token string">'row 1'</span><span class="token punctuation">,</span> <span class="token string">'row 2'</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;ListView
        dataSource<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>dataSource<span class="token punctuation">}</span>
        renderRow<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>rowData<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span>rowData<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span><span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>ListView also supports more advanced features, including sections with sticky
section headers, header and footer support, callbacks on reaching the end of
the available data (<code>onEndReached</code>) and on the set of rows that are visible
in the device viewport change (<code>onChangeVisibleRows</code>), and several
performance optimizations.</p><p>There are a few performance operations designed to make ListView scroll
smoothly while dynamically loading potentially very large (or conceptually
infinite) data sets:</p><ul><li><p>Only re-render changed rows - the rowHasChanged function provided to the
data source tells the ListView if it needs to re-render a row because the
source data has changed - see ListViewDataSource for more details.</p></li><li><p>Rate-limited row rendering - By default, only one row is rendered per
event-loop (customizable with the <code>pageSize</code> prop). This breaks up the
work into smaller chunks to reduce the chance of dropping frames while
rendering rows.</p></li></ul></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/listview.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="scrollview"></a><a href="docs/scrollview.html#props">ScrollView props...</a> <a class="hash-link" href="docs/listview.html#scrollview">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="datasource"></a>dataSource?: <span class="propType">PropTypes.instanceOf(ListViewDataSource).isRequired</span> <a class="hash-link" href="docs/listview.html#datasource">#</a></h4><div><p>An instance of <a href="docs/listviewdatasource.html" target="_blank">ListView.DataSource</a> to use</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="enableemptysections"></a>enableEmptySections?: <span class="propType">PropTypes.bool</span> <a class="hash-link" href="docs/listview.html#enableemptysections">#</a></h4><div><p>Flag indicating whether empty section headers should be rendered. In the future release
empty section headers will be rendered by default, and the flag will be deprecated.
If empty sections are not desired to be rendered their indices should be excluded from sectionID object.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="initiallistsize"></a>initialListSize?: <span class="propType">PropTypes.number.isRequired</span> <a class="hash-link" href="docs/listview.html#initiallistsize">#</a></h4><div><p>How many rows to render on initial component mount. Use this to make
it so that the first screen worth of data appears at one time instead of
over the course of multiple frames.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onchangevisiblerows"></a>onChangeVisibleRows?: <span class="propType">PropTypes.func</span> <a class="hash-link" href="docs/listview.html#onchangevisiblerows">#</a></h4><div><p>(visibleRows, changedRows) =&gt; void</p><p>Called when the set of visible rows changes. <code>visibleRows</code> maps
{ sectionID: { rowID: true }} for all the visible rows, and
<code>changedRows</code> maps { sectionID: { rowID: true | false }} for the rows
that have changed their visibility, with true indicating visible, and
false indicating the view has moved out of view.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onendreached"></a>onEndReached?: <span class="propType">PropTypes.func</span> <a class="hash-link" href="docs/listview.html#onendreached">#</a></h4><div><p>Called when all rows have been rendered and the list has been scrolled
to within onEndReachedThreshold of the bottom. The native scroll
event is provided.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onendreachedthreshold"></a>onEndReachedThreshold?: <span class="propType">PropTypes.number.isRequired</span> <a class="hash-link" href="docs/listview.html#onendreachedthreshold">#</a></h4><div><p>Threshold in pixels (virtual, not physical) for calling onEndReached.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="pagesize"></a>pageSize?: <span class="propType">PropTypes.number.isRequired</span> <a class="hash-link" href="docs/listview.html#pagesize">#</a></h4><div><p>Number of rows to render per event loop. Note: if your 'rows' are actually
cells, i.e. they don't span the full width of your view (as in the
ListViewGridLayoutExample), you should set the pageSize to be a multiple
of the number of cells per row, otherwise you're likely to see gaps at
the edge of the ListView as new pages are loaded.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="removeclippedsubviews"></a>removeClippedSubviews?: <span class="propType">PropTypes.bool</span> <a class="hash-link" href="docs/listview.html#removeclippedsubviews">#</a></h4><div><p>A performance optimization for improving scroll perf of
large lists, used in conjunction with overflow: 'hidden' on the row
containers. This is enabled by default.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="renderfooter"></a>renderFooter?: <span class="propType">PropTypes.func</span> <a class="hash-link" href="docs/listview.html#renderfooter">#</a></h4><div><p>() =&gt; renderable</p><p>The header and footer are always rendered (if these props are provided)
on every render pass. If they are expensive to re-render, wrap them
in StaticContainer or other mechanism as appropriate. Footer is always
at the bottom of the list, and header at the top, on every render pass.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="renderheader"></a>renderHeader?: <span class="propType">PropTypes.func</span> <a class="hash-link" href="docs/listview.html#renderheader">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="renderrow"></a>renderRow?: <span class="propType">PropTypes.func.isRequired</span> <a class="hash-link" href="docs/listview.html#renderrow">#</a></h4><div><p>(rowData, sectionID, rowID, highlightRow) =&gt; renderable</p><p>Takes a data entry from the data source and its ids and should return
a renderable component to be rendered as the row. By default the data
is exactly what was put into the data source, but it's also possible to
provide custom extractors. ListView can be notified when a row is
being highlighted by calling <code>highlightRow(sectionID, rowID)</code>. This
sets a boolean value of adjacentRowHighlighted in renderSeparator, allowing you
to control the separators above and below the highlighted row. The highlighted
state of a row can be reset by calling highlightRow(null).</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="renderscrollcomponent"></a>renderScrollComponent?: <span class="propType">PropTypes.func.isRequired</span> <a class="hash-link" href="docs/listview.html#renderscrollcomponent">#</a></h4><div><p>(props) =&gt; renderable</p><p>A function that returns the scrollable component in which the list rows
are rendered. Defaults to returning a ScrollView with the given props.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="rendersectionheader"></a>renderSectionHeader?: <span class="propType">PropTypes.func</span> <a class="hash-link" href="docs/listview.html#rendersectionheader">#</a></h4><div><p>(sectionData, sectionID) =&gt; renderable</p><p>If provided, a header is rendered for this section.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="renderseparator"></a>renderSeparator?: <span class="propType">PropTypes.func</span> <a class="hash-link" href="docs/listview.html#renderseparator">#</a></h4><div><p>(sectionID, rowID, adjacentRowHighlighted) =&gt; renderable</p><p>If provided, a renderable component to be rendered as the separator
below each row but not the last row if there is a section header below.
Take a sectionID and rowID of the row above and whether its adjacent row
is highlighted.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="scrollrenderaheaddistance"></a>scrollRenderAheadDistance?: <span class="propType">PropTypes.number.isRequired</span> <a class="hash-link" href="docs/listview.html#scrollrenderaheaddistance">#</a></h4><div><p>How early to start rendering rows before they come on screen, in
pixels.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="stickyheaderindices"></a>stickyHeaderIndices?: <span class="propType">PropTypes.arrayOf(PropTypes.number).isRequired</span> <a class="hash-link" href="docs/listview.html#stickyheaderindices">#</a></h4><div><p>An array of child indices determining which children get docked to the
top of the screen when scrolling. For example, passing
<code>stickyHeaderIndices={[0]}</code> will cause the first child to be fixed to the
top of the scroll view. This property is not supported in conjunction
with <code>horizontal={true}</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="stickysectionheadersenabled"></a>stickySectionHeadersEnabled?: <span class="propType">PropTypes.bool</span> <a class="hash-link" href="docs/listview.html#stickysectionheadersenabled">#</a></h4><div><p>Makes the sections headers sticky. The sticky behavior means that it
will scroll with the content at the top of the section until it reaches
the top of the screen, at which point it will stick to the top until it
is pushed off the screen by the next section header. This property is
not supported in conjunction with <code>horizontal={true}</code>. Only enabled by
default on iOS because of typical platform standards.</p></div></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/listview.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="getmetrics"></a>getMetrics<span class="methodType">()</span> <a class="hash-link" href="docs/listview.html#getmetrics">#</a></h4><div><p>Exports some data, e.g. for perf investigations or analytics.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="scrollto"></a>scrollTo<span class="methodType">(...args: Array)</span> <a class="hash-link" href="docs/listview.html#scrollto">#</a></h4><div><p>Scrolls to a given x, y offset, either immediately or with a smooth animation.</p><p>See <code>ScrollView#scrollTo</code>.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="scrolltoend"></a>scrollToEnd<span class="methodType">(options?: object)</span> <a class="hash-link" href="docs/listview.html#scrolltoend">#</a></h4><div><p>If this is a vertical ListView scrolls to the bottom.
If this is a horizontal ListView scrolls to the right.</p><p>Use <code>scrollToEnd({animated: true})</code> for smooth animated scrolling,
<code>scrollToEnd({animated: false})</code> for immediate scrolling.
If no options are passed, <code>animated</code> defaults to true.</p><p>See <code>ScrollView#scrollToEnd</code>.</p></div></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Lists/ListView/ListView.js">edit the content above on GitHub</a> and send us a pull request!</p><div class="docs-prevnext"><a class="docs-prev" href="docs/keyboardavoidingview.html#content">← Prev</a><a class="docs-next" href="docs/modal.html#content">Next →</a></div>