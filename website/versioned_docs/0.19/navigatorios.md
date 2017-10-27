---
id: version-0.19-navigatorios
title: navigatorios
original_id: navigatorios
---
<a id="content"></a><h1>NavigatorIOS</h1><div><div><p>NavigatorIOS wraps UIKit navigation and allows you to add back-swipe
functionality across your app.</p><blockquote><p><strong>NOTE</strong>: This Component is not maintained by Facebook</p><p>This component is under community responsibility.
If a pure JavaScript solution fits your needs you may try the <code>Navigator</code>
component instead.</p></blockquote><h4><a class="anchor" name="routes"></a>Routes <a class="hash-link" href="#routes">#</a></h4><p>A route is an object used to describe each page in the navigator. The first
route is provided to NavigatorIOS as <code>initialRoute</code>:</p><div class="prism language-javascript">render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    &lt;NavigatorIOS
      initialRoute<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
        component<span class="token punctuation">:</span> MyView<span class="token punctuation">,</span>
        title<span class="token punctuation">:</span> <span class="token string">'My View Title'</span><span class="token punctuation">,</span>
        passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span> myProp<span class="token punctuation">:</span> <span class="token string">'foo'</span> <span class="token punctuation">}</span><span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">}</span>
    <span class="token operator">/</span><span class="token operator">&gt;</span>
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span></div><p>Now MyView will be rendered by the navigator. It will receive the route
object in the <code>route</code> prop, a navigator, and all of the props specified in
<code>passProps</code>.</p><p>See the initialRoute propType for a complete definition of a route.</p><h4><a class="anchor" name="navigator"></a>Navigator <a class="hash-link" href="#navigator">#</a></h4><p>A <code>navigator</code> is an object of navigation functions that a view can call. It
is passed as a prop to any component rendered by NavigatorIOS.</p><div class="prism language-javascript"><span class="token keyword">var</span> MyView <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  _handleBackButtonPress<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">pop<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  _handleNextButtonPress<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span>nextRoute<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>A navigation object contains the following functions:</p><ul><li><code>push(route)</code> - Navigate forward to a new route</li><li><code>pop()</code> - Go back one page</li><li><code>popN(n)</code> - Go back N pages at once. When N=1, behavior matches <code>pop()</code></li><li><code>replace(route)</code> - Replace the route for the current page and immediately
load the view for the new route</li><li><code>replacePrevious(route)</code> - Replace the route/view for the previous page</li><li><code>replacePreviousAndPop(route)</code> - Replaces the previous route/view and
transitions back to it</li><li><code>resetTo(route)</code> - Replaces the top item and popToTop</li><li><code>popToRoute(route)</code> - Go back to the item for a particular route object</li><li><code>popToTop()</code> - Go back to the top item</li></ul><p>Navigator functions are also available on the NavigatorIOS component:</p><div class="prism language-javascript"><span class="token keyword">var</span> MyView <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  _handleNavigationRequest<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>refs<span class="token punctuation">.</span>nav<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span>otherRoute<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">(</span>
    &lt;NavigatorIOS
      ref<span class="token operator">=</span><span class="token string">"nav"</span>
      initialRoute<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">}</span>
    <span class="token operator">/</span><span class="token operator">&gt;</span>
  <span class="token punctuation">)</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>Props passed to the NavigatorIOS component will set the default configuration
for the navigation bar. Props passed as properties to a route object will set
the configuration for that route's navigation bar, overriding any props
passed to the NavigatorIOS component.</p></div><h3><a class="anchor" name="props"></a><a class="edit-github" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/Navigation/NavigatorIOS.ios.js">Edit on GitHub</a>Props <a class="hash-link" href="#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="bartintcolor"></a>barTintColor <span class="propType">string</span> <a class="hash-link" href="#bartintcolor">#</a></h4><div><p>The default background color of the navigation bar</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="initialroute"></a>initialRoute <span class="propType">{component: function, title: string, passProps: object, backButtonIcon: Image.propTypes.source, backButtonTitle: string, leftButtonIcon: Image.propTypes.source, leftButtonTitle: string, onLeftButtonPress: function, rightButtonIcon: Image.propTypes.source, rightButtonTitle: string, onRightButtonPress: function, wrapperStyle: [object Object], navigationBarHidden: bool, shadowHidden: bool, tintColor: string, barTintColor: string, titleTextColor: string, translucent: bool}</span> <a class="hash-link" href="#initialroute">#</a></h4><div><p>NavigatorIOS uses "route" objects to identify child views, their props,
and navigation bar configuration. "push" and all the other navigation
operations expect routes to be like this:</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="itemwrapperstyle"></a>itemWrapperStyle <span class="propType"><a href="view.html#style">View#style</a></span> <a class="hash-link" href="#itemwrapperstyle">#</a></h4><div><p>The default wrapper style for components in the navigator.
A common use case is to set the backgroundColor for every page</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="navigationbarhidden"></a>navigationBarHidden <span class="propType">bool</span> <a class="hash-link" href="#navigationbarhidden">#</a></h4><div><p>A Boolean value that indicates whether the navigation bar is hidden by default</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="shadowhidden"></a>shadowHidden <span class="propType">bool</span> <a class="hash-link" href="#shadowhidden">#</a></h4><div><p>A Boolean value that indicates whether to hide the 1px hairline shadow by default</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="tintcolor"></a>tintColor <span class="propType">string</span> <a class="hash-link" href="#tintcolor">#</a></h4><div><p>The default color used for buttons in the navigation bar</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="titletextcolor"></a>titleTextColor <span class="propType">string</span> <a class="hash-link" href="#titletextcolor">#</a></h4><div><p>The default text color of the navigation bar title</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="translucent"></a>translucent <span class="propType">bool</span> <a class="hash-link" href="#translucent">#</a></h4><div><p>A Boolean value that indicates whether the navigation bar is translucent by default</p></div></div></div></div><div><h3><a class="anchor" name="examples"></a><a class="edit-github" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/NavigatorIOSExample.js">Edit on GitHub</a>Examples <a class="hash-link" href="#examples">#</a></h3><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ViewExample <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./ViewExample'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> createExamplePage <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./createExamplePage'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  AlertIOS<span class="token punctuation">,</span>
  ScrollView<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>

<span class="token keyword">var</span> EmptyPage <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>emptyPage<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>emptyPageText<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>text<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> NavigatorIOSExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>

  statics<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'&lt;NavigatorIOS&gt;'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'iOS navigation capabilities'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> recurseTitle <span class="token operator">=</span> <span class="token string">'Recurse Navigation'</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>topExampleRoute<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      recurseTitle <span class="token operator">+</span><span class="token operator">=</span> <span class="token string">' - more examples here'</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;ScrollView style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>list<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>line<span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>group<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>row<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>rowNote<span class="token punctuation">}</span><span class="token operator">&gt;</span>
              See <span class="token operator">&amp;lt;</span>UIExplorerApp<span class="token ignore">&amp;gt;</span> <span class="token keyword">for</span> top<span class="token operator">-</span>level usage<span class="token punctuation">.</span>
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>line<span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>groupSpace<span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>line<span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>group<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderRow<span class="token punctuation">(</span></span>recurseTitle<span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
              title<span class="token punctuation">:</span> NavigatorIOSExample<span class="token punctuation">.</span>title<span class="token punctuation">,</span>
              component<span class="token punctuation">:</span> NavigatorIOSExample<span class="token punctuation">,</span>
              backButtonTitle<span class="token punctuation">:</span> <span class="token string">'Custom Back'</span><span class="token punctuation">,</span>
              passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span>topExampleRoute<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>topExampleRoute <span class="token operator">||</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>route<span class="token punctuation">}</span><span class="token punctuation">,</span>
            <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderRow<span class="token punctuation">(</span></span><span class="token string">'Push View Example'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
              title<span class="token punctuation">:</span> <span class="token string">'Very Long Custom View Example Title'</span><span class="token punctuation">,</span>
              component<span class="token punctuation">:</span> <span class="token function">createExamplePage<span class="token punctuation">(</span></span><span class="token keyword">null</span><span class="token punctuation">,</span> ViewExample<span class="token punctuation">)</span><span class="token punctuation">,</span>
            <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderRow<span class="token punctuation">(</span></span><span class="token string">'Custom Right Button'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
              title<span class="token punctuation">:</span> NavigatorIOSExample<span class="token punctuation">.</span>title<span class="token punctuation">,</span>
              component<span class="token punctuation">:</span> EmptyPage<span class="token punctuation">,</span>
              rightButtonTitle<span class="token punctuation">:</span> <span class="token string">'Cancel'</span><span class="token punctuation">,</span>
              onRightButtonPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">pop<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">,</span>
              passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span>
                text<span class="token punctuation">:</span> <span class="token string">'This page has a right button in the nav bar'</span><span class="token punctuation">,</span>
              <span class="token punctuation">}</span>
            <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderRow<span class="token punctuation">(</span></span><span class="token string">'Custom Left &amp; Right Icons'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
              title<span class="token punctuation">:</span> NavigatorIOSExample<span class="token punctuation">.</span>title<span class="token punctuation">,</span>
              component<span class="token punctuation">:</span> EmptyPage<span class="token punctuation">,</span>
              leftButtonTitle<span class="token punctuation">:</span> <span class="token string">'Custom Left'</span><span class="token punctuation">,</span>
              onLeftButtonPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">pop<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">,</span>
              rightButtonIcon<span class="token punctuation">:</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'image!NavBarButtonPlus'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
              onRightButtonPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
                AlertIOS<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
                  <span class="token string">'Bar Button Action'</span><span class="token punctuation">,</span>
                  <span class="token string">'Recognized a tap on the bar button icon'</span><span class="token punctuation">,</span>
                  <span class="token punctuation">[</span>
                    <span class="token punctuation">{</span>
                      text<span class="token punctuation">:</span> <span class="token string">'OK'</span><span class="token punctuation">,</span>
                      onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Tapped OK'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
                    <span class="token punctuation">}</span><span class="token punctuation">,</span>
                  <span class="token punctuation">]</span>
                <span class="token punctuation">)</span><span class="token punctuation">;</span>
              <span class="token punctuation">}</span><span class="token punctuation">,</span>
              passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span>
                text<span class="token punctuation">:</span> <span class="token string">'This page has an icon for the right button in the nav bar'</span><span class="token punctuation">,</span>
              <span class="token punctuation">}</span>
            <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderRow<span class="token punctuation">(</span></span><span class="token string">'Pop'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">pop<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderRow<span class="token punctuation">(</span></span><span class="token string">'Pop to top'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">popToTop<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderRow<span class="token punctuation">(</span></span><span class="token string">'Replace here'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">var</span> prevRoute <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>route<span class="token punctuation">;</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">replace<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
              title<span class="token punctuation">:</span> <span class="token string">'New Navigation'</span><span class="token punctuation">,</span>
              component<span class="token punctuation">:</span> EmptyPage<span class="token punctuation">,</span>
              rightButtonTitle<span class="token punctuation">:</span> <span class="token string">'Undo'</span><span class="token punctuation">,</span>
              onRightButtonPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">replace<span class="token punctuation">(</span></span>prevRoute<span class="token punctuation">)</span><span class="token punctuation">,</span>
              passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span>
                text<span class="token punctuation">:</span> <span class="token string">'The component is replaced, but there is currently no '</span> <span class="token operator">+</span>
                  <span class="token string">'way to change the right button or title of the current route'</span><span class="token punctuation">,</span>
              <span class="token punctuation">}</span>
            <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderReplacePrevious<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderReplacePreviousAndPop<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderPopToTopNavExample<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>line<span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>ScrollView<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _renderPopToTopNavExample<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>topExampleRoute<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">return</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderRow<span class="token punctuation">(</span></span><span class="token string">'Pop to top NavigatorIOSExample'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">popToRoute<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>topExampleRoute<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _renderReplacePrevious<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>topExampleRoute<span class="token punctuation">)</span> <span class="token punctuation">{</span>
     <span class="token comment" spellcheck="true"> // this is to avoid replacing the UIExplorerList at the top of the stack
</span>      <span class="token keyword">return</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">return</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderRow<span class="token punctuation">(</span></span><span class="token string">'Replace previous'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">replacePrevious<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
        title<span class="token punctuation">:</span> <span class="token string">'Replaced'</span><span class="token punctuation">,</span>
        component<span class="token punctuation">:</span> EmptyPage<span class="token punctuation">,</span>
        passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span>
          text<span class="token punctuation">:</span> <span class="token string">'This is a replaced "previous" page'</span><span class="token punctuation">,</span>
        <span class="token punctuation">}</span><span class="token punctuation">,</span>
        wrapperStyle<span class="token punctuation">:</span> styles<span class="token punctuation">.</span>customWrapperStyle<span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _renderReplacePreviousAndPop<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>topExampleRoute<span class="token punctuation">)</span> <span class="token punctuation">{</span>
     <span class="token comment" spellcheck="true"> // this is to avoid replacing the UIExplorerList at the top of the stack
</span>      <span class="token keyword">return</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">return</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderRow<span class="token punctuation">(</span></span><span class="token string">'Replace previous and pop'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">replacePreviousAndPop<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
        title<span class="token punctuation">:</span> <span class="token string">'Replaced and Popped'</span><span class="token punctuation">,</span>
        component<span class="token punctuation">:</span> EmptyPage<span class="token punctuation">,</span>
        passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span>
          text<span class="token punctuation">:</span> <span class="token string">'This is a replaced "previous" page'</span><span class="token punctuation">,</span>
        <span class="token punctuation">}</span><span class="token punctuation">,</span>
        wrapperStyle<span class="token punctuation">:</span> styles<span class="token punctuation">.</span>customWrapperStyle<span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _renderRow<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>title<span class="token punctuation">:</span> string<span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> Function<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;TouchableHighlight onPress<span class="token operator">=</span><span class="token punctuation">{</span>onPress<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>row<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>rowText<span class="token punctuation">}</span><span class="token operator">&gt;</span>
              <span class="token punctuation">{</span>title<span class="token punctuation">}</span>
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>separator<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  customWrapperStyle<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#bbdddd'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  emptyPage<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    paddingTop<span class="token punctuation">:</span> <span class="token number">64</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  emptyPageText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    margin<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  list<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#eeeeee'</span><span class="token punctuation">,</span>
    marginTop<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  group<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'white'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  groupSpace<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    height<span class="token punctuation">:</span> <span class="token number">15</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  line<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#bbbbbb'</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> StyleSheet<span class="token punctuation">.</span>hairlineWidth<span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  row<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'white'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    paddingHorizontal<span class="token punctuation">:</span> <span class="token number">15</span><span class="token punctuation">,</span>
    paddingVertical<span class="token punctuation">:</span> <span class="token number">15</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  separator<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    height<span class="token punctuation">:</span> StyleSheet<span class="token punctuation">.</span>hairlineWidth<span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#bbbbbb'</span><span class="token punctuation">,</span>
    marginLeft<span class="token punctuation">:</span> <span class="token number">15</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  rowNote<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">17</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  rowText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">17</span><span class="token punctuation">,</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'500'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

module<span class="token punctuation">.</span>exports <span class="token operator">=</span> NavigatorIOSExample<span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="pickerios.html#content">Next →</a></div>