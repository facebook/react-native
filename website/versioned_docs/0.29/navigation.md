---
id: navigation
title: navigation
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="navigation"></a>Navigation <a class="hash-link" href="docs/navigation.html#navigation">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.29-stable/docs/Navigation.md">Edit on GitHub</a></td></tr></tbody></table><div><p>This guide covers the various navigation components available in React Native. If you are just getting started with navigation, you will probably want to use  <code>Navigator</code>. If you are only targeting iOS and would like to stick to the native look and feel, check out <code>NavigatorIOS</code>. If you are looking for greater control over your navigation stack, you can't go wrong with <code>NavigationExperimental</code>.</p><h2><a class="anchor" name="navigator"></a>Navigator <a class="hash-link" href="docs/navigation.html#navigator">#</a></h2><p><code>Navigator</code> provides a JavaScript implementation of a navigation stack, so it works on both iOS and Android and is easy to customize. This is the same component you used to build your first navigation stack in the <a href="docs/navigators.html" target="_blank">navigators tutorial</a>.</p><p><img src="img/NavigationStack-Navigator.gif" alt=""></p><p><code>Navigator</code> can easily be adapted to render different components based on the current route in its <code>renderScene</code> function. It will transition new scenes onto the screen by sliding in from the right by default, but you can control this behavior by using the <code>configureScene</code> function. You can also configure a navigation bar through the <code>navigationBar</code> prop.</p><p>Check out the <a href="docs/navigator.html" target="_blank">Navigator API reference</a> for specific examples that cover each of these scenarios.</p><h2><a class="anchor" name="navigatorios"></a>NavigatorIOS <a class="hash-link" href="docs/navigation.html#navigatorios">#</a></h2><p>If you are targeting iOS only, you may also want to consider using <a href="docs/navigatorios.html" target="_blank">NavigatorIOS</a>. It looks and feels just like <a href="https://developer.apple.com/library/ios/documentation/UIKit/Reference/UINavigationController_Class/" target="_blank"><code>UINavigationController</code></a>, because it is actually built on top of it.</p><p><img src="img/NavigationStack-NavigatorIOS.gif" alt=""></p><div class="prism language-javascript">&lt;NavigatorIOS
  initialRoute<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
    component<span class="token punctuation">:</span> MyScene<span class="token punctuation">,</span>
    title<span class="token punctuation">:</span> <span class="token string">'My Initial Scene'</span><span class="token punctuation">,</span>
    passProps<span class="token punctuation">:</span> <span class="token punctuation">{</span> myProp<span class="token punctuation">:</span> <span class="token string">'foo'</span> <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">}</span>
<span class="token operator">/</span><span class="token operator">&gt;</span></div><p>Just like <code>Navigator</code>, <code>NavigatorIOS</code> uses routes to represent scenes, with some important differences. The actual component that will be rendered can be specified using the <code>component</code> key in the route, and any props that should be passed to this component can be specified in <code>passProps</code>. A "navigator" object is automatically passed as a prop to the component, allowing you to call <code>push</code> and <code>pop</code> as needed.</p><p>As <code>NavigatorIOS</code> leverages native UIKit navigation, it will automatically render a navigation bar with a back button and title.</p><div class="prism language-javascript">import React<span class="token punctuation">,</span> <span class="token punctuation">{</span> Component<span class="token punctuation">,</span> PropTypes <span class="token punctuation">}</span> from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span> NavigatorIOS<span class="token punctuation">,</span> Text<span class="token punctuation">,</span> TouchableHighlight<span class="token punctuation">,</span> View <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>

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
    <span class="token punctuation">)</span>
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
<span class="token punctuation">}</span></div><p>Check out the <a href="docs/navigatorios.html" target="_blank"><code>NavigatorIOS</code> reference docs</a> to learn more about this component.</p><blockquote><p>You may also want to check out <a href="https://github.com/wix/react-native-navigation" target="_blank">react-native-navigation</a>, a component that aims to provide native navigation on both iOS and Android.</p></blockquote><h2><a class="anchor" name="navigationexperimental"></a>NavigationExperimental <a class="hash-link" href="docs/navigation.html#navigationexperimental">#</a></h2><p><code>Navigator</code> and <code>NavigatorIOS</code> are both stateful components. If your app has multiple of these, it can become tricky to coordinate navigation transitions between them. NavigationExperimental provides a different approach to navigation, allowing any view to act as a navigation view and using reducers to manipulate state at a top-level object. It is bleeding edge as the name implies, but you might want to check it out if you are craving greater control over your app's navigation.</p><div class="prism language-javascript">&lt;NavigationCardStack
  onNavigateBack<span class="token operator">=</span><span class="token punctuation">{</span>onPopRouteFunc<span class="token punctuation">}</span>
  navigationState<span class="token operator">=</span><span class="token punctuation">{</span>myNavigationState<span class="token punctuation">}</span>
  renderScene<span class="token operator">=</span><span class="token punctuation">{</span>renderSceneFun<span class="token punctuation">}</span>
<span class="token operator">/</span><span class="token operator">&gt;</span></div><p>You can import <code>NavigationExperimental</code> like any other component in React Native. Once you have that, you can deconstruct any additional components from <code>NavigationExperimental</code> that you may find useful. Since I am feeling like building navigation stacks today, I'll go ahead and pick out <code>NavigationCardStack</code> and <code>NavigationStateUtils</code>.</p><div class="prism language-javascript">import React<span class="token punctuation">,</span> <span class="token punctuation">{</span> Component <span class="token punctuation">}</span> from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span> NavigationExperimental <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>

const <span class="token punctuation">{</span>
  CardStack<span class="token punctuation">:</span> NavigationCardStack<span class="token punctuation">,</span>
  StateUtils<span class="token punctuation">:</span> NavigationStateUtils<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> NavigationExperimental<span class="token punctuation">;</span></div><p>As I said earlier, <code>NavigationExperimental</code> takes a different approach than <code>Navigator</code> and <code>NavigatorIOS</code>. Using it to build a navigation stack requires a few more steps than the stateful components, but the payoff is worth it.</p><h3><a class="anchor" name="step-1-define-initial-state-and-top-level-component"></a>Step 1. Define Initial State and Top Level Component <a class="hash-link" href="docs/navigation.html#step-1-define-initial-state-and-top-level-component">#</a></h3><p>Create a new component for your application. This will be the top-level object, so we will define the initial state here. The navigation state will be defined in the <code>navigationState</code> key, where we define our initial route:</p><div class="prism language-javascript">class <span class="token class-name">BleedingEdgeApplication</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">,</span> context<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">,</span> context<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>
     <span class="token comment" spellcheck="true"> // This defines the initial navigation state.
</span>      navigationState<span class="token punctuation">:</span> <span class="token punctuation">{</span>
        index<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span><span class="token comment" spellcheck="true"> // Starts with first route focused.
</span>        routes<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token punctuation">{</span>key<span class="token punctuation">:</span> <span class="token string">'My Initial Scene'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">,</span><span class="token comment" spellcheck="true"> // Starts with only one route.
</span>      <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>

   <span class="token comment" spellcheck="true"> // We'll define this function later - hang on
</span>    <span class="token keyword">this</span><span class="token punctuation">.</span>_onNavigationChange <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_onNavigationChange<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">_onNavigationChange<span class="token punctuation">(</span></span>type<span class="token punctuation">)</span> <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // It's literally the next step. We'll get to it!
</span>  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;Text<span class="token operator">&gt;</span>This is a placeholder<span class="token punctuation">.</span> We will come back to <span class="token keyword">this</span> and render our navigation here later<span class="token punctuation">.</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>Alright, now we have a simple stateful component that doesn't do much at all. We can change that. Our initial state contains one route, and the current index. That looks suspiciously just like our initial route definition in Navigator. Do you remember which actions its navigator object provided?</p><p>Push and pop, of course. That seems pretty straightforward to implement. I promised you earlier we would be using reducers to manage state at the top-level object. Sit tight.</p><h3><a class="anchor" name="step-2-reducing-the-navigation-state"></a>Step 2. Reducing the Navigation State <a class="hash-link" href="docs/navigation.html#step-2-reducing-the-navigation-state">#</a></h3><p>NavigationExperimental comes built-in with a some useful reducers, and they are all available as part of NavigationStateUtils. The two we will be using right now are called -- yep -- push and pop. They take a navigationState object, and return a new navigationState object.</p><p>We can use them to write our <code>_onNavigationChange</code> function which, given a "push" or "pop" action, will reduce the state accordingly.</p><div class="prism language-javascript"><span class="token function">_onNavigationChange<span class="token punctuation">(</span></span>type<span class="token punctuation">)</span> <span class="token punctuation">{</span>
 <span class="token comment" spellcheck="true"> // Extract the navigationState from the current state:
</span>  <span class="token keyword">let</span> <span class="token punctuation">{</span>navigationState<span class="token punctuation">}</span> <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">;</span>

  switch <span class="token punctuation">(</span>type<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    case <span class="token string">'push'</span><span class="token punctuation">:</span>
     <span class="token comment" spellcheck="true"> // Push a new route, which in our case is an object with a key value.
</span>     <span class="token comment" spellcheck="true"> // I am fond of cryptic keys (but seriously, keys should be unique)
</span>      const route <span class="token operator">=</span> <span class="token punctuation">{</span>key<span class="token punctuation">:</span> <span class="token string">'Route-'</span> <span class="token operator">+</span> Date<span class="token punctuation">.</span><span class="token function">now<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">;</span>

     <span class="token comment" spellcheck="true"> // Use the push reducer provided by NavigationStateUtils
</span>      navigationState <span class="token operator">=</span> NavigationStateUtils<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span>navigationState<span class="token punctuation">,</span> route<span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">break</span><span class="token punctuation">;</span>

    case <span class="token string">'pop'</span><span class="token punctuation">:</span>
     <span class="token comment" spellcheck="true"> // Pop the current route using the pop reducer.
</span>      navigationState <span class="token operator">=</span> NavigationStateUtils<span class="token punctuation">.</span><span class="token function">pop<span class="token punctuation">(</span></span>navigationState<span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">break</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

 <span class="token comment" spellcheck="true"> // NavigationStateUtils gives you back the same `navigationState` if nothing
</span> <span class="token comment" spellcheck="true"> // has changed. We will only update state if it has changed.
</span>  <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>navigationState <span class="token operator">!</span><span class="token operator">==</span> navigationState<span class="token punctuation">)</span> <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // Always use setState() when setting a new state!
</span>    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>navigationState<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
   <span class="token comment" spellcheck="true"> // If you are new to ES6, the above is equivalent to:
</span>   <span class="token comment" spellcheck="true"> // this.setState({navigationState: navigationState});
</span>  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>Cool. I'm getting the hang of this. This is the heart of NavigationExperimental. We are only handling two actions here, but a more complex application could also take into account a "back" action (e.g. Android back button), as well as handle the transition between several tabs in a tabbed application.</p><p>I am still missing the initial scene that will be rendered (as well as the actual navigator that will wrap it, but let's not get ahead of ourselves).</p><h3><a class="anchor" name="step-3-define-scenes"></a>Step 3. Define Scenes <a class="hash-link" href="docs/navigation.html#step-3-define-scenes">#</a></h3><p>First I want to define a Row component out of convenience. It displays some text and can call some function when pressed.</p><div class="prism language-javascript">class <span class="token class-name">TappableRow</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;TouchableHighlight
        style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>row<span class="token punctuation">}</span>
        underlayColor<span class="token operator">=</span><span class="token string">"#D0D0D0"</span>
        onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>onPress<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>buttonText<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>text<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>Now I will define my actual scene. It uses a scroll view to display a vertical list of items. The first row displays the current route's key, and two more rows will call our theoretical navigator's push and pop functions.</p><div class="prism language-javascript">class <span class="token class-name">MyVeryComplexScene</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;ScrollView style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>scrollView<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>row<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Route<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>route<span class="token punctuation">.</span>key<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;TappableRow
          text<span class="token operator">=</span><span class="token string">"Tap me to load the next scene"</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>onPushRoute<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TappableRow
          text<span class="token operator">=</span><span class="token string">"Tap me to go back"</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>onPopRoute<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>ScrollView<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><h3><a class="anchor" name="step-4-create-a-navigation-stack"></a>Step 4. Create a Navigation Stack <a class="hash-link" href="docs/navigation.html#step-4-create-a-navigation-stack">#</a></h3><p>Now that I have defined the state and a function to manage it, I think I can go ahead and create a proper navigator component now. While I'm at it, I'll render my scene after configuring it with the current route's props.</p><div class="prism language-javascript">class <span class="token class-name">MyVerySimpleNavigator</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>

 <span class="token comment" spellcheck="true"> // This sets up the methods (e.g. Pop, Push) for navigation.
</span>  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">,</span> context<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">,</span> context<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">this</span><span class="token punctuation">.</span>_onPushRoute <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>onNavigationChange<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token string">'push'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>_onPopRoute <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>onNavigationChange<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">null</span><span class="token punctuation">,</span> <span class="token string">'pop'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">this</span><span class="token punctuation">.</span>_renderScene <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_renderScene<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

 <span class="token comment" spellcheck="true"> // Now we finally get to use the `NavigationCardStack` to render the scenes.
</span>  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;NavigationCardStack
        onNavigateBack<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onPopRoute<span class="token punctuation">}</span>
        navigationState<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>navigationState<span class="token punctuation">}</span>
        renderScene<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_renderScene<span class="token punctuation">}</span>
        style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>navigator<span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

 <span class="token comment" spellcheck="true"> // Render a scene for route.
</span> <span class="token comment" spellcheck="true"> // The detailed spec of `sceneProps` is defined at `NavigationTypeDefinition`
</span> <span class="token comment" spellcheck="true"> // as type `NavigationSceneRendererProps`.
</span> <span class="token comment" spellcheck="true"> // Here you could choose to render a different component for each route, but
</span> <span class="token comment" spellcheck="true"> // we'll keep it simple.
</span>  <span class="token function">_renderScene<span class="token punctuation">(</span></span>sceneProps<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;MyVeryComplexScene
        route<span class="token operator">=</span><span class="token punctuation">{</span>sceneProps<span class="token punctuation">.</span>scene<span class="token punctuation">.</span>route<span class="token punctuation">}</span>
        onPushRoute<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onPushRoute<span class="token punctuation">}</span>
        onPopRoute<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onPopRoute<span class="token punctuation">}</span>
        onExit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>onExit<span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>That's it -- so close to the finish line I can smell it. Let's plug our new navigator into our top-level component:</p><div class="prism language-javascript">class <span class="token class-name">BleedingEdgeApplication</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>

 <span class="token comment" spellcheck="true"> // constructor and other methods omitted for clarity
</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;MyVerySimpleNavigator
        navigationState<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>navigationState<span class="token punctuation">}</span>
        onNavigationChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_onNavigationChange<span class="token punctuation">}</span>
        onExit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_exit<span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>We're done! Bask in the glory of NavigationExperimental.</p><h4><a class="anchor" name="hey-i-think-you-are-missing-something"></a>Hey -- I think you are missing something. <a class="hash-link" href="docs/navigation.html#hey-i-think-you-are-missing-something">#</a></h4><p>(Oh yes, sorry about that -- here's our missing imports and styles.)</p><div class="prism language-javascript">import <span class="token punctuation">{</span> NavigationExperimental<span class="token punctuation">,</span> PixelRatio<span class="token punctuation">,</span> ScrollView<span class="token punctuation">,</span> StyleSheet<span class="token punctuation">,</span> Text<span class="token punctuation">,</span> TouchableHighlight <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>

const styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  navigator<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  scrollView<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    marginTop<span class="token punctuation">:</span> <span class="token number">64</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  row<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    padding<span class="token punctuation">:</span> <span class="token number">15</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'white'</span><span class="token punctuation">,</span>
    borderBottomWidth<span class="token punctuation">:</span> <span class="token number">1</span> <span class="token operator">/</span> PixelRatio<span class="token punctuation">.</span><span class="token keyword">get</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    borderBottomColor<span class="token punctuation">:</span> <span class="token string">'#CDCDCD'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  rowText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">17</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  buttonText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">17</span><span class="token punctuation">,</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'500'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><h3><a class="anchor" name="homework"></a>Homework <a class="hash-link" href="docs/navigation.html#homework">#</a></h3><p>You are now an expert navigator. Take a look at <a href="https://github.com/facebook/react-native/tree/master/Examples/UIExplorer/NavigationExperimental" target="_blank">NavigationExperimental in UIExplorer</a> to learn how to implement other types of navigation hierarchies, such as a tabbed application with multiple navigation stacks.</p></div><div class="docs-prevnext"><a class="docs-next" href="docs/performance.html#content">Next →</a></div><div class="survey"><div class="survey-image"></div><p>Recently, we have been working hard to make the documentation better based on your feedback. Your responses to this yes/no style survey will help us gauge whether we moved in the right direction with the improvements. Thank you!</p><center><a class="button" href="https://www.facebook.com/survey?oid=516954245168428">Take Survey</a></center></div>