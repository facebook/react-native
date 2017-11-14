---
id: version-0.36-layout-props
original_id: layout-props
title: layout-props
---
<a id="content"></a><h1><a class="anchor" name="layout-props"></a>Layout Props <a class="hash-link" href="docs/layout-props.html#layout-props">#</a></h1><div><noscript></noscript><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/layout-props.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="alignitems"></a>alignItems <span class="propType">ReactPropTypes.oneOf([
  'flex-start',
  'flex-end',
  'center',
  'stretch'
])</span> <a class="hash-link" href="docs/layout-props.html#alignitems">#</a></h4><div><p><code>alignItems</code> aligns children in the cross direction.
 For example, if children are flowing vertically, <code>alignItems</code>
 controls how they align horizontally.
 It works like <code>align-items</code> in CSS (default: stretch).
 See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/align-items">https://developer.mozilla.org/en-US/docs/Web/CSS/align-items</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="alignself"></a>alignSelf <span class="propType">ReactPropTypes.oneOf([
  'auto',
  'flex-start',
  'flex-end',
  'center',
  'stretch'
])</span> <a class="hash-link" href="docs/layout-props.html#alignself">#</a></h4><div><p><code>alignSelf</code> controls how a child aligns in the cross direction,
 overriding the <code>alignItems</code> of the parent. It works like <code>align-self</code>
 in CSS (default: auto).
 See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/align-self">https://developer.mozilla.org/en-US/docs/Web/CSS/align-self</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="borderbottomwidth"></a>borderBottomWidth <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#borderbottomwidth">#</a></h4><div><p><code>borderBottomWidth</code> works like <code>border-bottom-width</code> in CSS.
See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/border-bottom-width">https://developer.mozilla.org/en-US/docs/Web/CSS/border-bottom-width</a>
for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="borderleftwidth"></a>borderLeftWidth <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#borderleftwidth">#</a></h4><div><p><code>borderLeftWidth</code> works like <code>border-left-width</code> in CSS.
See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/border-left-width">https://developer.mozilla.org/en-US/docs/Web/CSS/border-left-width</a>
for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="borderrightwidth"></a>borderRightWidth <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#borderrightwidth">#</a></h4><div><p><code>borderRightWidth</code> works like <code>border-right-width</code> in CSS.
See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/border-right-width">https://developer.mozilla.org/en-US/docs/Web/CSS/border-right-width</a>
for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="bordertopwidth"></a>borderTopWidth <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#bordertopwidth">#</a></h4><div><p><code>borderTopWidth</code> works like <code>border-top-width</code> in CSS.
See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/border-top-width">https://developer.mozilla.org/en-US/docs/Web/CSS/border-top-width</a>
for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="borderwidth"></a>borderWidth <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#borderwidth">#</a></h4><div><p><code>borderWidth</code> works like <code>border-width</code> in CSS.
See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/border-width">https://developer.mozilla.org/en-US/docs/Web/CSS/border-width</a>
for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="bottom"></a>bottom <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#bottom">#</a></h4><div><p><code>bottom</code> is the number of logical pixels to offset the bottom edge of
 this component.</p><p> It works similarly to <code>bottom</code> in CSS, but in React Native you must
 use logical pixel units, rather than percents, ems, or any of that.</p><p> See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/bottom">https://developer.mozilla.org/en-US/docs/Web/CSS/bottom</a>
 for more details of how <code>bottom</code> affects layout.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="flex"></a>flex <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#flex">#</a></h4><div><p>In React Native <code>flex</code> does not work the same way that it does in CSS.
 <code>flex</code> is a number rather than a string, and it works
 according to the <code>css-layout</code> library
 at <a href="https://github.com/facebook/css-layout">https://github.com/facebook/css-layout</a>.</p><p> When <code>flex</code> is a positive number, it makes the component flexible
 and it will be sized proportional to its flex value. So a
 component with <code>flex</code> set to 2 will take twice the space as a
 component with <code>flex</code> set to 1.</p><p> When <code>flex</code> is 0, the component is sized according to <code>width</code>
 and <code>height</code> and it is inflexible.</p><p> When <code>flex</code> is -1, the component is normally sized according
 <code>width</code> and <code>height</code>. However, if there's not enough space,
 the component will shrink to its <code>minWidth</code> and <code>minHeight</code>.</p><p>flexGrow, flexShrink, and flexBasis work the same as in CSS.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="flexbasis"></a>flexBasis <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#flexbasis">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="flexdirection"></a>flexDirection <span class="propType">ReactPropTypes.oneOf([
  'row',
  'row-reverse',
  'column',
  'column-reverse'
])</span> <a class="hash-link" href="docs/layout-props.html#flexdirection">#</a></h4><div><p><code>flexDirection</code> controls which directions children of a container go.
 <code>row</code> goes left to right, <code>column</code> goes top to bottom, and you may
 be able to guess what the other two do. It works like <code>flex-direction</code>
 in CSS, except the default is <code>column</code>.
 See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/flex-direction">https://developer.mozilla.org/en-US/docs/Web/CSS/flex-direction</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="flexgrow"></a>flexGrow <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#flexgrow">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="flexshrink"></a>flexShrink <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#flexshrink">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="flexwrap"></a>flexWrap <span class="propType">ReactPropTypes.oneOf([
  'wrap',
  'nowrap'
])</span> <a class="hash-link" href="docs/layout-props.html#flexwrap">#</a></h4><div><p><code>flexWrap</code> controls whether children can wrap around after they
 hit the end of a flex container.
 It works like <code>flex-wrap</code> in CSS (default: nowrap).
 See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/flex-wrap">https://developer.mozilla.org/en-US/docs/Web/CSS/flex-wrap</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="height"></a>height <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#height">#</a></h4><div><p><code>height</code> sets the height of this component.</p><p> It works similarly to <code>height</code> in CSS, but in React Native you
 must use logical pixel units, rather than percents, ems, or any of that.
 See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/height">https://developer.mozilla.org/en-US/docs/Web/CSS/height</a> for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="justifycontent"></a>justifyContent <span class="propType">ReactPropTypes.oneOf([
  'flex-start',
  'flex-end',
  'center',
  'space-between',
  'space-around'
])</span> <a class="hash-link" href="docs/layout-props.html#justifycontent">#</a></h4><div><p><code>justifyContent</code> aligns children in the main direction.
 For example, if children are flowing vertically, <code>justifyContent</code>
 controls how they align vertically.
 It works like <code>justify-content</code> in CSS (default: flex-start).
 See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content">https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="left"></a>left <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#left">#</a></h4><div><p><code>left</code> is the number of logical pixels to offset the left edge of
 this component.</p><p> It works similarly to <code>left</code> in CSS, but in React Native you must
 use logical pixel units, rather than percents, ems, or any of that.</p><p> See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/left">https://developer.mozilla.org/en-US/docs/Web/CSS/left</a>
 for more details of how <code>left</code> affects layout.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="margin"></a>margin <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#margin">#</a></h4><div><p>Setting <code>margin</code> has the same effect as setting each of
 <code>marginTop</code>, <code>marginLeft</code>, <code>marginBottom</code>, and <code>marginRight</code>.
 See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/margin">https://developer.mozilla.org/en-US/docs/Web/CSS/margin</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="marginbottom"></a>marginBottom <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#marginbottom">#</a></h4><div><p><code>marginBottom</code> works like <code>margin-bottom</code> in CSS.
 See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/margin-bottom">https://developer.mozilla.org/en-US/docs/Web/CSS/margin-bottom</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="marginhorizontal"></a>marginHorizontal <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#marginhorizontal">#</a></h4><div><p>Setting <code>marginHorizontal</code> has the same effect as setting
 both <code>marginLeft</code> and <code>marginRight</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="marginleft"></a>marginLeft <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#marginleft">#</a></h4><div><p><code>marginLeft</code> works like <code>margin-left</code> in CSS.
 See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/margin-left">https://developer.mozilla.org/en-US/docs/Web/CSS/margin-left</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="marginright"></a>marginRight <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#marginright">#</a></h4><div><p><code>marginRight</code> works like <code>margin-right</code> in CSS.
 See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/margin-right">https://developer.mozilla.org/en-US/docs/Web/CSS/margin-right</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="margintop"></a>marginTop <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#margintop">#</a></h4><div><p><code>marginTop</code> works like <code>margin-top</code> in CSS.
 See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/margin-top">https://developer.mozilla.org/en-US/docs/Web/CSS/margin-top</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="marginvertical"></a>marginVertical <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#marginvertical">#</a></h4><div><p>Setting <code>marginVertical</code> has the same effect as setting both
 <code>marginTop</code> and <code>marginBottom</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="maxheight"></a>maxHeight <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#maxheight">#</a></h4><div><p><code>maxHeight</code> is the maximum height for this component, in logical pixels.</p><p> It works similarly to <code>max-height</code> in CSS, but in React Native you
 must use logical pixel units, rather than percents, ems, or any of that.</p><p> See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/max-height">https://developer.mozilla.org/en-US/docs/Web/CSS/max-height</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="maxwidth"></a>maxWidth <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#maxwidth">#</a></h4><div><p><code>maxWidth</code> is the maximum width for this component, in logical pixels.</p><p> It works similarly to <code>max-width</code> in CSS, but in React Native you
 must use logical pixel units, rather than percents, ems, or any of that.</p><p> See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/max-width">https://developer.mozilla.org/en-US/docs/Web/CSS/max-width</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="minheight"></a>minHeight <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#minheight">#</a></h4><div><p><code>minHeight</code> is the minimum height for this component, in logical pixels.</p><p> It works similarly to <code>min-height</code> in CSS, but in React Native you
 must use logical pixel units, rather than percents, ems, or any of that.</p><p> See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/min-height">https://developer.mozilla.org/en-US/docs/Web/CSS/min-height</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="minwidth"></a>minWidth <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#minwidth">#</a></h4><div><p><code>minWidth</code> is the minimum width for this component, in logical pixels.</p><p> It works similarly to <code>min-width</code> in CSS, but in React Native you
 must use logical pixel units, rather than percents, ems, or any of that.</p><p> See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/min-width">https://developer.mozilla.org/en-US/docs/Web/CSS/min-width</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="overflow"></a>overflow <span class="propType">ReactPropTypes.oneOf([
  'visible',
  'hidden',
  'scroll',
])</span> <a class="hash-link" href="docs/layout-props.html#overflow">#</a></h4><div><p><code>overflow</code> controls how a children are measured and displayed.
 <code>overflow: hidden</code> causes views to be clipped while <code>overflow: scroll</code>
 causes views to be measured independently of their parents main axis.<code>It works like</code>overflow` in CSS (default: visible).
 See <a href="https://developer.mozilla.org/en/docs/Web/CSS/overflow">https://developer.mozilla.org/en/docs/Web/CSS/overflow</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="padding"></a>padding <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#padding">#</a></h4><div><p>Setting <code>padding</code> has the same effect as setting each of
 <code>paddingTop</code>, <code>paddingBottom</code>, <code>paddingLeft</code>, and <code>paddingRight</code>.
 See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/padding">https://developer.mozilla.org/en-US/docs/Web/CSS/padding</a>
 for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="paddingbottom"></a>paddingBottom <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#paddingbottom">#</a></h4><div><p><code>paddingBottom</code> works like <code>padding-bottom</code> in CSS.
See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/padding-bottom">https://developer.mozilla.org/en-US/docs/Web/CSS/padding-bottom</a>
for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="paddinghorizontal"></a>paddingHorizontal <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#paddinghorizontal">#</a></h4><div><p>Setting <code>paddingHorizontal</code> is like setting both of
 <code>paddingLeft</code> and <code>paddingRight</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="paddingleft"></a>paddingLeft <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#paddingleft">#</a></h4><div><p><code>paddingLeft</code> works like <code>padding-left</code> in CSS.
See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/padding-left">https://developer.mozilla.org/en-US/docs/Web/CSS/padding-left</a>
for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="paddingright"></a>paddingRight <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#paddingright">#</a></h4><div><p><code>paddingRight</code> works like <code>padding-right</code> in CSS.
See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/padding-right">https://developer.mozilla.org/en-US/docs/Web/CSS/padding-right</a>
for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="paddingtop"></a>paddingTop <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#paddingtop">#</a></h4><div><p><code>paddingTop</code> works like <code>padding-top</code> in CSS.
See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/padding-top">https://developer.mozilla.org/en-US/docs/Web/CSS/padding-top</a>
for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="paddingvertical"></a>paddingVertical <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#paddingvertical">#</a></h4><div><p>Setting <code>paddingVertical</code> is like setting both of
 <code>paddingTop</code> and <code>paddingBottom</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="position"></a>position <span class="propType">ReactPropTypes.oneOf([
  'absolute',
  'relative'
])</span> <a class="hash-link" href="docs/layout-props.html#position">#</a></h4><div><p><code>position</code> in React Native is similar to regular CSS, but
 everything is set to <code>relative</code> by default, so <code>absolute</code>
 positioning is always just relative to the parent.</p><p> If you want to position a child using specific numbers of logical
 pixels relative to its parent, set the child to have <code>absolute</code>
 position.</p><p> If you want to position a child relative to something
 that is not its parent, just don't use styles for that. Use the
 component tree.</p><p> See <a href="https://github.com/facebook/css-layout">https://github.com/facebook/css-layout</a>
 for more details on how <code>position</code> differs between React Native
 and CSS.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="right"></a>right <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#right">#</a></h4><div><p><code>right</code> is the number of logical pixels to offset the right edge of
 this component.</p><p> It works similarly to <code>right</code> in CSS, but in React Native you must
 use logical pixel units, rather than percents, ems, or any of that.</p><p> See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/right">https://developer.mozilla.org/en-US/docs/Web/CSS/right</a>
 for more details of how <code>right</code> affects layout.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="top"></a>top <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#top">#</a></h4><div><p><code>top</code> is the number of logical pixels to offset the top edge of
 this component.</p><p> It works similarly to <code>top</code> in CSS, but in React Native you must
 use logical pixel units, rather than percents, ems, or any of that.</p><p> See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/top">https://developer.mozilla.org/en-US/docs/Web/CSS/top</a>
 for more details of how <code>top</code> affects layout.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="width"></a>width <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#width">#</a></h4><div><p><code>width</code> sets the width of this component.</p><p> It works similarly to <code>width</code> in CSS, but in React Native you
 must use logical pixel units, rather than percents, ems, or any of that.
 See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/width">https://developer.mozilla.org/en-US/docs/Web/CSS/width</a> for more details.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="zindex"></a>zIndex <span class="propType">ReactPropTypes.number</span> <a class="hash-link" href="docs/layout-props.html#zindex">#</a></h4><div><p><code>zIndex</code> controls which components display on top of others.
 Normally, you don't use <code>zIndex</code>. Components render according to
 their order in the document tree, so later components draw over
 earlier ones. <code>zIndex</code> may be useful if you have animations or custom
 modal interfaces where you don't want this behavior.</p><p> It works like the CSS <code>z-index</code> property - components with a larger
 <code>zIndex</code> will render on top. Think of the z-direction like it's
 pointing from the phone into your eyeball.
 See <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/z-index">https://developer.mozilla.org/en-US/docs/Web/CSS/z-index</a> for
 more details.</p></div></div></div></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/StyleSheet/LayoutPropTypes.js">edit the content above on GitHub</a> and send us a pull request!</p><div class="docs-prevnext"><a class="docs-prev" href="docs/vibrationios.html#content">← Prev</a><a class="docs-next" href="docs/shadow-props.html#content">Next →</a></div>