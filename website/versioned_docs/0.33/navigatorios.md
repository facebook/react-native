---
id: version-0.33-navigatorios
title: navigatorios
original_id: navigatorios
---
<a id="content"></a><h1><a class="anchor" name="navigatorios"></a>NavigatorIOS <a class="hash-link" href="docs/navigatorios.html#navigatorios">#</a></h1><div><div><p><code>NavigatorIOS</code> is a wrapper around
<a href="https://developer.apple.com/library/ios/documentation/UIKit/Reference/UINavigationController_Class/" target="_blank"><code>UINavigationController</code></a>,
enabling you to implement a navigation stack. It works exactly the same as it
would on a native app using <code>UINavigationController</code>, providing the same
animations and behavior from UIKIt.</p><p>As the name implies, it is only available on iOS. Take a look at
<a href="/react-native/docs/navigator.html" target=""><code>Navigator</code></a> for a similar solution for your
cross-platform needs, or check out
<a href="https://github.com/wix/react-native-navigation" target="_blank">react-native-navigation</a>, a
component that aims to provide native navigation on both iOS and Android.</p><p>To set up the navigator, provide the <code>initialRoute</code> prop with a route
object. A route object is used to describe each scene that your app
navigates to. <code>initialRoute</code> represents the first route in your navigator.</p><div class="prism language-javascript">import React<span class="token punctuation">,</span> <span class="token punctuation">{</span> Component<span class="token punctuation">,</span> PropTypes <span class="token punctuation">}</span> from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span> NavigatorIOS<span class="token punctuation">,</span> Text <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>

export default class <span class="token class-name">NavigatorIOSApp</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;NavigatorIOS
        initialRoute<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
          component<span class="token punctuation">:</span> MyScene<span class="token punctuation">,</span>
          title<span class="token punctuation">:</span> <span class="token string">'My Initial Scene'</span><span class="token punctuation">,</span>
        <span class="token punctuation">}</span><span class="token punctuation">}</span>
        style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">MyScene</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  static propTypes <span class="token operator">=</span> <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>string<span class="token punctuation">.</span>isRequired<span class="token punctuation">,</span>
    navigator<span class="token punctuation">:</span> PropTypes<span class="token punctuation">.</span>object<span class="token punctuation">.</span>isRequired<span class="token punctuation">,</span>
  <span class="token punctuation">}</span>

  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">,</span> context<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">,</span> context<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_onForward <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_onForward<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_onBack <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_onBack<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">_onForward<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      title<span class="token punctuation">:</span> <span class="token string">'Scene '</span> <span class="token operator">+</span> nextIndex<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>Current Scene<span class="token punctuation">:</span> <span class="token punctuation">{</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>title <span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;TouchableHighlight onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onForward<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>Tap me to load the next scene&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>In this code, the navigator renders the component specified in initialRoute,
which in this case is <code>MyScene</code>. This component will receive a <code>route</code> prop
and a <code>navigator</code> prop representing the navigator. The navigator's navigation
bar will render the title for the current scene, "My Initial Scene".</p><p>You can optionally pass in a <code>passProps</code> property to your <code>initialRoute</code>.
<code>NavigatorIOS</code> passes this in as props to the rendered component:</p><div class="prism language-javascript">initialRoute<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
  component<span class="token punctuation">:</span> MyScene<span class="token punctuation">,</span>
  title<span class="token punctuation">:</span> <span class="token string">'My Initial Scene'</span><span class="token punctuation">,</span>
  passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span> myProp<span class="token punctuation">:</span> <span class="token string">'foo'</span> <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">}</span></div><p>You can then access the props passed in via <code>{this.props.myProp}</code>.</p><h4><a class="anchor" name="handling-navigation"></a>Handling Navigation <a class="hash-link" href="docs/navigatorios.html#handling-navigation">#</a></h4><p>To trigger navigation functionality such as pushing or popping a view, you
have access to a <code>navigator</code> object. The object is passed in as a prop to any
component that is rendered by <code>NavigatorIOS</code>. You can then call the
relevant methods to perform the navigation action you need:</p><div class="prism language-javascript">class <span class="token class-name">MyView</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">_handleBackPress<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">pop<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">_handleNextPress<span class="token punctuation">(</span></span>nextRoute<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span>nextRoute<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    const nextRoute <span class="token operator">=</span> <span class="token punctuation">{</span>
      component<span class="token punctuation">:</span> MyView<span class="token punctuation">,</span>
      title<span class="token punctuation">:</span> <span class="token string">'Bar That'</span><span class="token punctuation">,</span>
      passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span> myProp<span class="token punctuation">:</span> <span class="token string">'bar'</span> <span class="token punctuation">}</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span><span class="token punctuation">(</span>
      &lt;TouchableHighlight onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_handleNextPress<span class="token punctuation">(</span></span>nextRoute<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginTop<span class="token punctuation">:</span> <span class="token number">200</span><span class="token punctuation">,</span> alignSelf<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          See you on the other nav <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>myProp<span class="token punctuation">}</span><span class="token operator">!</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>You can also trigger navigator functionality from the <code>NavigatorIOS</code>
component:</p><div class="prism language-javascript">class <span class="token class-name">NavvyIOS</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">_handleNavigationRequest<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>refs<span class="token punctuation">.</span>nav<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      component<span class="token punctuation">:</span> MyView<span class="token punctuation">,</span>
      title<span class="token punctuation">:</span> <span class="token string">'Genius'</span><span class="token punctuation">,</span>
      passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span> myProp<span class="token punctuation">:</span> <span class="token string">'genius'</span> <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;NavigatorIOS
        ref<span class="token operator">=</span><span class="token string">'nav'</span>
        initialRoute<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
          component<span class="token punctuation">:</span> MyView<span class="token punctuation">,</span>
          title<span class="token punctuation">:</span> <span class="token string">'Foo This'</span><span class="token punctuation">,</span>
          passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span> myProp<span class="token punctuation">:</span> <span class="token string">'foo'</span> <span class="token punctuation">}</span><span class="token punctuation">,</span>
          rightButtonTitle<span class="token punctuation">:</span> <span class="token string">'Add'</span><span class="token punctuation">,</span>
          onRightButtonPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_handleNavigationRequest<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">,</span>
        <span class="token punctuation">}</span><span class="token punctuation">}</span>
        style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>The code above adds a <code>_handleNavigationRequest</code> private method that is
invoked from the <code>NavigatorIOS</code> component when the right navigation bar item
is pressed. To get access to the navigator functionality, a reference to it
is saved in the <code>ref</code> prop and later referenced to push a new scene into the
navigation stack.</p><h4><a class="anchor" name="navigation-bar-configuration"></a>Navigation Bar Configuration <a class="hash-link" href="docs/navigatorios.html#navigation-bar-configuration">#</a></h4><p>Props passed to <code>NavigatorIOS</code> will set the default configuration
for the navigation bar. Props passed as properties to a route object will set
the configuration for that route's navigation bar, overriding any props
passed to the <code>NavigatorIOS</code> component.</p><div class="prism language-javascript"><span class="token function">_handleNavigationRequest<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">this</span><span class="token punctuation">.</span>refs<span class="token punctuation">.</span>nav<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> //...
</span>    passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span> myProp<span class="token punctuation">:</span> <span class="token string">'genius'</span> <span class="token punctuation">}</span><span class="token punctuation">,</span>
    barTintColor<span class="token punctuation">:</span> <span class="token string">'#996699'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    &lt;NavigatorIOS
     <span class="token comment" spellcheck="true"> //...
</span>      style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
      barTintColor<span class="token operator">=</span><span class="token string">'#ffffcc'</span>
    <span class="token operator">/</span><span class="token operator">&gt;</span>
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><p>In the example above the navigation bar color is changed when the new route
is pushed.</p></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/navigatorios.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="bartintcolor"></a>barTintColor <span class="propType">string</span> <a class="hash-link" href="docs/navigatorios.html#bartintcolor">#</a></h4><div><p>The default background color of the navigation bar.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="initialroute"></a>initialRoute <span class="propType">{component: function, title: string, titleImage: Image.propTypes.source, passProps: object, backButtonIcon: Image.propTypes.source, backButtonTitle: string, leftButtonIcon: Image.propTypes.source, leftButtonTitle: string, onLeftButtonPress: function, rightButtonIcon: Image.propTypes.source, rightButtonTitle: string, onRightButtonPress: function, wrapperStyle: [object Object], navigationBarHidden: bool, shadowHidden: bool, tintColor: string, barTintColor: string, titleTextColor: string, translucent: bool}</span> <a class="hash-link" href="docs/navigatorios.html#initialroute">#</a></h4><div><p>NavigatorIOS uses <code>route</code> objects to identify child views, their props,
and navigation bar configuration. Navigation operations such as push
operations expect routes to look like this the <code>initialRoute</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="interactivepopgestureenabled"></a>interactivePopGestureEnabled <span class="propType">bool</span> <a class="hash-link" href="docs/navigatorios.html#interactivepopgestureenabled">#</a></h4><div><p>Boolean value that indicates whether the interactive pop gesture is
enabled. This is useful for enabling/disabling the back swipe navigation
gesture.</p><p>If this prop is not provided, the default behavior is for the back swipe
gesture to be enabled when the navigation bar is shown and disabled when
the navigation bar is hidden. Once you've provided the
<code>interactivePopGestureEnabled</code> prop, you can never restore the default
behavior.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="itemwrapperstyle"></a>itemWrapperStyle <span class="propType"><a href="docs/view.html#style">View#style</a></span> <a class="hash-link" href="docs/navigatorios.html#itemwrapperstyle">#</a></h4><div><p>The default wrapper style for components in the navigator.
A common use case is to set the <code>backgroundColor</code> for every scene.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="navigationbarhidden"></a>navigationBarHidden <span class="propType">bool</span> <a class="hash-link" href="docs/navigatorios.html#navigationbarhidden">#</a></h4><div><p>Boolean value that indicates whether the navigation bar is hidden
by default.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="shadowhidden"></a>shadowHidden <span class="propType">bool</span> <a class="hash-link" href="docs/navigatorios.html#shadowhidden">#</a></h4><div><p>Boolean value that indicates whether to hide the 1px hairline shadow
by default.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="tintcolor"></a>tintColor <span class="propType">string</span> <a class="hash-link" href="docs/navigatorios.html#tintcolor">#</a></h4><div><p>The default color used for the buttons in the navigation bar.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="titletextcolor"></a>titleTextColor <span class="propType">string</span> <a class="hash-link" href="docs/navigatorios.html#titletextcolor">#</a></h4><div><p>The default text color of the navigation bar title.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="translucent"></a>translucent <span class="propType">bool</span> <a class="hash-link" href="docs/navigatorios.html#translucent">#</a></h4><div><p>Boolean value that indicates whether the navigation bar is
translucent by default</p></div></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/navigatorios.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="push"></a>push<span class="methodType">(route)</span> <a class="hash-link" href="docs/navigatorios.html#push">#</a></h4><div><p>Navigate forward to a new route.</p></div><div><strong>Parameters:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>route<br><br><div><span>object</span></div></td><td class="description"><div><p>The new route to navigate to.</p></div></td></tr></tbody></table></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="popn"></a>popN<span class="methodType">(n)</span> <a class="hash-link" href="docs/navigatorios.html#popn">#</a></h4><div><p>Go back N scenes at once. When N=1, behavior matches <code>pop()</code>.</p></div><div><strong>Parameters:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>n<br><br><div><span>number</span></div></td><td class="description"><div><p>The number of scenes to pop.</p></div></td></tr></tbody></table></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="pop"></a>pop<span class="methodType">(0)</span> <a class="hash-link" href="docs/navigatorios.html#pop">#</a></h4><div><p>Pop back to the previous scene.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="replaceatindex"></a>replaceAtIndex<span class="methodType">(route, index)</span> <a class="hash-link" href="docs/navigatorios.html#replaceatindex">#</a></h4><div><p>Replace a route in the navigation stack.</p></div><div><strong>Parameters:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>route<br><br><div><span>object</span></div></td><td class="description"><div><p>The new route that will replace the specified one.</p></div></td></tr><tr><td>index<br><br><div><span>number</span></div></td><td class="description"><div><p>The route into the stack that should be replaced.
   If it is negative, it counts from the back of the stack.</p></div></td></tr></tbody></table></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="replace"></a>replace<span class="methodType">(route)</span> <a class="hash-link" href="docs/navigatorios.html#replace">#</a></h4><div><p>Replace the route for the current scene and immediately
load the view for the new route.</p></div><div><strong>Parameters:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>route<br><br><div><span>object</span></div></td><td class="description"><div><p>The new route to navigate to.</p></div></td></tr></tbody></table></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="replaceprevious"></a>replacePrevious<span class="methodType">(route)</span> <a class="hash-link" href="docs/navigatorios.html#replaceprevious">#</a></h4><div><p>Replace the route/view for the previous scene.</p></div><div><strong>Parameters:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>route<br><br><div><span>object</span></div></td><td class="description"><div><p>The new route to will replace the previous scene.</p></div></td></tr></tbody></table></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="poptotop"></a>popToTop<span class="methodType">(0)</span> <a class="hash-link" href="docs/navigatorios.html#poptotop">#</a></h4><div><p>Go back to the topmost item in the navigation stack.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="poptoroute"></a>popToRoute<span class="methodType">(route)</span> <a class="hash-link" href="docs/navigatorios.html#poptoroute">#</a></h4><div><p>Go back to the item for a particular route object.</p></div><div><strong>Parameters:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>route<br><br><div><span>object</span></div></td><td class="description"><div><p>The new route to navigate to.</p></div></td></tr></tbody></table></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="replacepreviousandpop"></a>replacePreviousAndPop<span class="methodType">(route)</span> <a class="hash-link" href="docs/navigatorios.html#replacepreviousandpop">#</a></h4><div><p>Replaces the previous route/view and transitions back to it.</p></div><div><strong>Parameters:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>route<br><br><div><span>object</span></div></td><td class="description"><div><p>The new route that replaces the previous scene.</p></div></td></tr></tbody></table></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="resetto"></a>resetTo<span class="methodType">(route)</span> <a class="hash-link" href="docs/navigatorios.html#resetto">#</a></h4><div><p>Replaces the top item and pop to it.</p></div><div><strong>Parameters:</strong><table class="params"><thead><tr><th>Name and Type</th><th>Description</th></tr></thead><tbody><tr><td>route<br><br><div><span>object</span></div></td><td class="description"><div><p>The new route that will replace the topmost item.</p></div></td></tr></tbody></table></div></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/Navigation/NavigatorIOS.ios.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/navigatorios.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/NavigatorIOSExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

const React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const ViewExample <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./ViewExample'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const createExamplePage <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./createExamplePage'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const <span class="token punctuation">{</span>
  AlertIOS<span class="token punctuation">,</span>
  NavigatorIOS<span class="token punctuation">,</span>
  ScrollView<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

class <span class="token class-name">EmptyPage</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>emptyPage<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>emptyPageText<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>text<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">NavigatorIOSExamplePage</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> recurseTitle <span class="token operator">=</span> <span class="token string">'Recurse Navigation'</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>depth <span class="token operator">||</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>depth <span class="token operator">===</span> <span class="token number">1</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      recurseTitle <span class="token operator">+</span><span class="token operator">=</span> <span class="token string">' - more examples here'</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;ScrollView style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>list<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>line<span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>group<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderRow<span class="token punctuation">(</span></span>recurseTitle<span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
              title<span class="token punctuation">:</span> NavigatorIOSExample<span class="token punctuation">.</span>title<span class="token punctuation">,</span>
              component<span class="token punctuation">:</span> NavigatorIOSExamplePage<span class="token punctuation">,</span>
              backButtonTitle<span class="token punctuation">:</span> <span class="token string">'Custom Back'</span><span class="token punctuation">,</span>
              passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span>depth<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>depth <span class="token operator">?</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>depth <span class="token operator">+</span> <span class="token number">1</span> <span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
            <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderRow<span class="token punctuation">(</span></span><span class="token string">'Push View Example'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
              title<span class="token punctuation">:</span> <span class="token string">'Very Long Custom View Example Title'</span><span class="token punctuation">,</span>
              component<span class="token punctuation">:</span> <span class="token function">createExamplePage<span class="token punctuation">(</span></span><span class="token keyword">null</span><span class="token punctuation">,</span> ViewExample<span class="token punctuation">)</span><span class="token punctuation">,</span>
            <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderRow<span class="token punctuation">(</span></span><span class="token string">'Custom title image Example'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigator<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
              title<span class="token punctuation">:</span> <span class="token string">'Custom title image Example'</span><span class="token punctuation">,</span>
              titleImage<span class="token punctuation">:</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./relay.png'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
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
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderReplace<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderReplacePrevious<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderReplacePreviousAndPop<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderRow<span class="token punctuation">(</span></span><span class="token string">'Exit NavigatorIOS Example'</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>onExampleExit<span class="token punctuation">)</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>line<span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>ScrollView<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  _renderReplace <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>depth<span class="token punctuation">)</span> <span class="token punctuation">{</span>
     <span class="token comment" spellcheck="true"> // this is to avoid replacing the top of the stack
</span>      <span class="token keyword">return</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">return</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderRow<span class="token punctuation">(</span></span><span class="token string">'Replace here'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
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
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _renderReplacePrevious <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>depth <span class="token operator">||</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>depth &lt; <span class="token number">2</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
     <span class="token comment" spellcheck="true"> // this is to avoid replacing the top of the stack
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
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _renderReplacePreviousAndPop <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>depth <span class="token operator">||</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>depth &lt; <span class="token number">2</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
     <span class="token comment" spellcheck="true"> // this is to avoid replacing the top of the stack
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
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _renderRow <span class="token operator">=</span> <span class="token punctuation">(</span>title<span class="token punctuation">:</span> string<span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> Function<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
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
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

class <span class="token class-name">NavigatorIOSExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  static title <span class="token operator">=</span> <span class="token string">'&lt;NavigatorIOS&gt;'</span><span class="token punctuation">;</span>
  static description <span class="token operator">=</span> <span class="token string">'iOS navigation capabilities'</span><span class="token punctuation">;</span>
  static external <span class="token operator">=</span> <span class="token boolean">true</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    const <span class="token punctuation">{</span>onExampleExit<span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;NavigatorIOS
        style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span>
        initialRoute<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
          title<span class="token punctuation">:</span> NavigatorIOSExample<span class="token punctuation">.</span>title<span class="token punctuation">,</span>
          component<span class="token punctuation">:</span> NavigatorIOSExamplePage<span class="token punctuation">,</span>
          passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span>onExampleExit<span class="token punctuation">}</span><span class="token punctuation">,</span>
        <span class="token punctuation">}</span><span class="token punctuation">}</span>
        tintColor<span class="token operator">=</span><span class="token string">"#008888"</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

const styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  container<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
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

module<span class="token punctuation">.</span>exports <span class="token operator">=</span> NavigatorIOSExample<span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22NavigatorIOS%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/navigator.html#content">← Prev</a><a class="docs-next" href="docs/picker.html#content">Next →</a></div>