---
id: version-0.45-integration-with-existing-apps
title: integration-with-existing-apps
original_id: integration-with-existing-apps
---
<a id="content"></a><h1><a class="anchor" name="integration-with-existing-apps"></a>Integration With Existing Apps <a class="hash-link" href="docs/integration-with-existing-apps.html#integration-with-existing-apps">#</a></h1><div class="banner-crna-ejected"><h3>Project with Native Code Required</h3><p>This page only applies to projects made with <code>react-native init</code> or to those made with Create React Native App which have since ejected. For more information about ejecting, please see the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on the Create React Native App repository.</p></div><div><span><style>
  .toggler li {
    display: inline-block;
    position: relative;
    top: 1px;
    padding: 10px;
    margin: 0px 2px 0px 2px;
    border: 1px solid #05A5D1;
    border-bottom-color: transparent;
    border-radius: 3px 3px 0px 0px;
    color: #05A5D1;
    background-color: transparent;
    font-size: 0.99em;
    cursor: pointer;
  }
  .toggler li:first-child {
    margin-left: 0;
  }
  .toggler li:last-child {
    margin-right: 0;
  }
  .toggler ul {
    width: 100%;
    display: inline-block;
    list-style-type: none;
    margin: 0;
    border-bottom: 1px solid #05A5D1;
    cursor: default;
  }
  @media screen and (max-width: 960px) {
    .toggler li,
    .toggler li:first-child,
    .toggler li:last-child {
      display: block;
      border-bottom-color: #05A5D1;
      border-radius: 3px;
      margin: 2px 0px 2px 0px;
    }
    .toggler ul {
      border-bottom: 0;
    }
  }
  .toggler a {
    display: inline-block;
    padding: 10px 5px;
    margin: 2px;
    border: 1px solid #05A5D1;
    border-radius: 3px;
    text-decoration: none !important;
  }
  .display-platform-objc .toggler .button-objc,
  .display-platform-swift .toggler .button-swift,
  .display-platform-android .toggler .button-android {
    background-color: #05A5D1;
    color: white;
  }
  block { display: none; }
  .display-platform-objc .objc,
  .display-platform-swift .swift,
  .display-platform-android .android {
    display: block;
  }
</style>

</span><p>React Native is great when you are starting a new mobile app from scratch. However, it also works well for adding a single view or user flow to existing native applications. With a few steps, you can add new React Native based features, screens, views, etc.</p><p>The specific steps are different depending on what platform you're targeting.</p><span><div class="toggler">
  <ul role="tablist">
    <li id="objc" class="button-objc" aria-selected="false" role="tab" tabindex="0" aria-controls="objctab" onclick="display('platform', 'objc')">
      iOS (Objective-C)
    </li>
    <li id="swift" class="button-swift" aria-selected="false" role="tab" tabindex="0" aria-controls="swifttab" onclick="display('platform', 'swift')">
      iOS (Swift)
    </li>
    <li id="android" class="button-android" aria-selected="false" role="tab" tabindex="0" aria-controls="androidtab" onclick="display('platform', 'android')">
      Android (Java)
    </li>
  </ul>
</div>

</span><span><block class="objc swift android">

</block></span><h2><a class="anchor" name="key-concepts"></a>Key Concepts <a class="hash-link" href="docs/integration-with-existing-apps.html#key-concepts">#</a></h2><span><block class="objc swift">

</block></span><p>The keys to integrating React Native components into your iOS application are to:</p><ol><li>Set up React Native dependencies and directory structure.</li><li>Understand what React Native components you will use in your app.</li><li>Add these components as dependencies using CocoaPods.</li><li>Develop your React Native components in JavaScript.</li><li>Add a <code>RCTRootView</code> to your iOS app. This view will serve as the container for your React Native component.</li><li>Start the React Native server and run your native application.</li><li>Verify that the React Native aspect of your application works as expected.</li></ol><span><block class="android">

</block></span><p>The keys to integrating React Native components into your Android application are to:</p><ol><li>Set up React Native dependencies and directory structure.</li><li>Develop your React Native components in JavaScript.</li><li>Add a <code>ReactRootView</code> to your Android app. This view will serve as the container for your React Native component.</li><li>Start the React Native server and run your native application.</li><li>Verify that the React Native aspect of your application works as expected.</li></ol><span><block class="objc swift android">

</block></span><h2><a class="anchor" name="prerequisites"></a>Prerequisites <a class="hash-link" href="docs/integration-with-existing-apps.html#prerequisites">#</a></h2><span><block class="objc swift">

</block></span><p>Follow the instructions for building apps with native code from the <a href="docs/getting-started.html" target="_blank">Getting Started guide</a> to configure your development environment for building React Native apps for iOS.</p><h3><a class="anchor" name="1-set-up-directory-structure"></a>1. Set up directory structure <a class="hash-link" href="docs/integration-with-existing-apps.html#1-set-up-directory-structure">#</a></h3><p>To ensure a smooth experience, create a new folder for your integrated React Native project, then copy your existing iOS project to a <code>/ios</code> subfolder.</p><span><block class="android">

</block></span><p>Follow the instructions for building apps with native code from the <a href="docs/getting-started.html" target="_blank">Getting Started guide</a> to configure your development environment for building React Native apps for Android.</p><h3><a class="anchor" name="1-set-up-directory-structure"></a>1. Set up directory structure <a class="hash-link" href="docs/integration-with-existing-apps.html#1-set-up-directory-structure">#</a></h3><p>To ensure a smooth experience, create a new folder for your integrated React Native project, then copy your existing Android project to a <code>/android</code> subfolder.</p><span><block class="objc swift android">

</block></span><h3><a class="anchor" name="2-install-javascript-dependencies"></a>2. Install JavaScript dependencies <a class="hash-link" href="docs/integration-with-existing-apps.html#2-install-javascript-dependencies">#</a></h3><p>Go to the root directory for your project and create a new <code>package.json</code> file with the following contents:</p><div class="prism language-javascript"><span class="token punctuation">{</span>
  <span class="token string">"name"</span><span class="token punctuation">:</span> <span class="token string">"MyReactNativeApp"</span><span class="token punctuation">,</span>
  <span class="token string">"version"</span><span class="token punctuation">:</span> <span class="token string">"0.0.1"</span><span class="token punctuation">,</span>
  <span class="token string">"private"</span><span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
  <span class="token string">"scripts"</span><span class="token punctuation">:</span> <span class="token punctuation">{</span>
    <span class="token string">"start"</span><span class="token punctuation">:</span> <span class="token string">"node node_modules/react-native/local-cli/cli.js start"</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>Next, you will install the <code>react</code> and <code>react-native</code> packages. Open a terminal or command prompt, then navigate to the root directory for your project and type the following commands:</p><div class="prism language-javascript">$ npm install <span class="token operator">--</span>save react react<span class="token operator">-</span>native</div><p>This will create a new <code>/node_modules</code> folder in your project's root directory. This folder stores all the JavaScript dependencies required to build your project.</p><span><block class="objc swift">

</block></span><h3><a class="anchor" name="3-install-cocoapods"></a>3. Install CocoaPods <a class="hash-link" href="docs/integration-with-existing-apps.html#3-install-cocoapods">#</a></h3><p><a href="http://cocoapods.org" target="_blank">CocoaPods</a> is a package management tool for iOS and macOS development. We use it to add the actual React Native framework code locally into your current project.</p><p>We recommend installing CocoaPods using <a href="http://brew.sh/" target="_blank">Homebrew</a>.</p><div class="prism language-javascript">$ brew install cocoapods</div><blockquote><p>It is technically possible not to use CocoaPods, but that would require manual library and linker additions that would overly complicate this process.</p></blockquote><span><block class="objc swift">

</block></span><h2><a class="anchor" name="adding-react-native-to-your-app"></a>Adding React Native to your app <a class="hash-link" href="docs/integration-with-existing-apps.html#adding-react-native-to-your-app">#</a></h2><span><block class="objc">

</block></span><p>Assume the <a href="https://github.com/JoelMarcey/iOS-2048" target="_blank">app for integration</a> is a <a href="https://en.wikipedia.org/wiki/2048_%28video_game%29" target="_blank">2048</a> game. Here is what the main menu of the native application looks like without React Native.</p><span><block class="swift">

</block></span><p>Assume the <a href="https://github.com/JoelMarcey/swift-2048" target="_blank">app for integration</a> is a <a href="https://en.wikipedia.org/wiki/2048_%28video_game%29" target="_blank">2048</a> game. Here is what the main menu of the native application looks like without React Native.</p><span><block class="objc swift">

</block></span><p><img src="img/react-native-existing-app-integration-ios-before.png" alt="Before RN Integration"></p><h3><a class="anchor" name="configuring-cocoapods-dependencies"></a>Configuring CocoaPods dependencies <a class="hash-link" href="docs/integration-with-existing-apps.html#configuring-cocoapods-dependencies">#</a></h3><p>Before you integrate React Native into your application, you will want to decide what parts of the React Native framework you would like to integrate. We will use CocoaPods to specify which of these "subspecs" your app will depend on.</p><p>The list of supported <code>subspec</code>s is available in <a href="https://github.com/facebook/react-native/blob/master/React.podspec" target="_blank"><code>/node_modules/react-native/React.podspec</code></a>. They are generally named by functionality. For example, you will generally always want the <code>Core</code> <code>subspec</code>. That will get you the <code>AppRegistry</code>, <code>StyleSheet</code>, <code>View</code> and other core React Native libraries. If you want to add the React Native <code>Text</code> library (e.g., for <code>&lt;Text&gt;</code> elements), then you will need the <code>RCTText</code> <code>subspec</code>. If you want the <code>Image</code> library (e.g., for <code>&lt;Image&gt;</code> elements), then you will need the <code>RCTImage</code> <code>subspec</code>.</p><p>You can specify which <code>subspec</code>s your app will depend on in a <code>Podfile</code> file. The easiest way to create a <code>Podfile</code> is by running the CocoaPods <code>init</code> command in the <code>/ios</code> subfolder of your project:</p><div class="prism language-javascript">$ pod init</div><p>The <code>Podfile</code> will contain a boilerplate setup that you will tweak for your integration purposes. In the end, <code>Podfile</code> should look something similar to this:</p><span><block class="objc">

</block></span><div class="prism language-javascript"># The target name is most likely the name of your project<span class="token punctuation">.</span>
target <span class="token string">'NumberTileGame'</span> <span class="token keyword">do</span>

  # Your <span class="token string">'node_modules'</span> directory is probably <span class="token keyword">in</span> the root of your project<span class="token punctuation">,</span>
  # but <span class="token keyword">if</span> not<span class="token punctuation">,</span> adjust the `<span class="token punctuation">:</span>path` accordingly
  pod <span class="token string">'React'</span><span class="token punctuation">,</span> <span class="token punctuation">:</span>path <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token string">'../node_modules/react-native'</span><span class="token punctuation">,</span> <span class="token punctuation">:</span>subspecs <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">[</span>
    <span class="token string">'Core'</span><span class="token punctuation">,</span>
    <span class="token string">'RCTText'</span><span class="token punctuation">,</span>
    <span class="token string">'RCTNetwork'</span><span class="token punctuation">,</span>
    <span class="token string">'RCTWebSocket'</span><span class="token punctuation">,</span> # needed <span class="token keyword">for</span> debugging
    # Add any other subspecs you want to use <span class="token keyword">in</span> your project
  <span class="token punctuation">]</span>
  # Explicitly include Yoga <span class="token keyword">if</span> you are using RN <span class="token operator">&gt;=</span> <span class="token number">0.42</span><span class="token punctuation">.</span><span class="token number">0</span>
  pod <span class="token string">"Yoga"</span><span class="token punctuation">,</span> <span class="token punctuation">:</span>path <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token string">"../node_modules/react-native/ReactCommon/yoga"</span>

end</div><span><block class="swift">

</block></span><div class="prism language-javascript">source <span class="token string">'https://github.com/CocoaPods/Specs.git'</span>

# Required <span class="token keyword">for</span> Swift apps
platform <span class="token punctuation">:</span>ios<span class="token punctuation">,</span> <span class="token string">'8.0'</span>
use_frameworks<span class="token operator">!</span>

# The target name is most likely the name of your project<span class="token punctuation">.</span>
target <span class="token string">'swift-2048'</span> <span class="token keyword">do</span>

  # Your <span class="token string">'node_modules'</span> directory is probably <span class="token keyword">in</span> the root of your project<span class="token punctuation">,</span>
  # but <span class="token keyword">if</span> not<span class="token punctuation">,</span> adjust the `<span class="token punctuation">:</span>path` accordingly
  pod <span class="token string">'React'</span><span class="token punctuation">,</span> <span class="token punctuation">:</span>path <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token string">'../node_modules/react-native'</span><span class="token punctuation">,</span> <span class="token punctuation">:</span>subspecs <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">[</span>
    <span class="token string">'Core'</span><span class="token punctuation">,</span>
    <span class="token string">'RCTText'</span><span class="token punctuation">,</span>
    <span class="token string">'RCTNetwork'</span><span class="token punctuation">,</span>
    <span class="token string">'RCTWebSocket'</span><span class="token punctuation">,</span> # needed <span class="token keyword">for</span> debugging
    # Add any other subspecs you want to use <span class="token keyword">in</span> your project
  <span class="token punctuation">]</span>
  # Explicitly include Yoga <span class="token keyword">if</span> you are using RN <span class="token operator">&gt;=</span> <span class="token number">0.42</span><span class="token punctuation">.</span><span class="token number">0</span>
  pod <span class="token string">"Yoga"</span><span class="token punctuation">,</span> <span class="token punctuation">:</span>path <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token string">"../node_modules/react-native/ReactCommon/yoga"</span>

end</div><span><block class="objc swift">

</block></span><p>After you have created your <code>Podfile</code>, you are ready to install the React Native pod.</p><div class="prism language-javascript">$ pod install</div><p>Your should see output such as:</p><div class="prism language-javascript">Analyzing dependencies
Fetching podspec <span class="token keyword">for</span> `React` from `<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token operator">/</span>node_modules<span class="token operator">/</span>react<span class="token operator">-</span>native`
Downloading dependencies
Installing React <span class="token punctuation">(</span><span class="token number">0.26</span><span class="token punctuation">.</span><span class="token number">0</span><span class="token punctuation">)</span>
Generating Pods project
Integrating client project
Sending stats
Pod installation complete<span class="token operator">!</span> There are <span class="token number">3</span> dependencies from the Podfile and <span class="token number">1</span> total pod installed<span class="token punctuation">.</span></div><span><block class="swift">

</block></span><blockquote><p>If you get a warning such as "<em>The <code>swift-2048 [Debug]</code> target overrides the <code>FRAMEWORK_SEARCH_PATHS</code> build setting defined in <code>Pods/Target Support Files/Pods-swift-2048/Pods-swift-2048.debug.xcconfig</code>. This can lead to problems with the CocoaPods installation</em>", then make sure the <code>Framework Search Paths</code> in <code>Build Settings</code> for both <code>Debug</code> and <code>Release</code> only contain <code>$(inherited)</code>.</p></blockquote><span><block class="objc swift">

</block></span><h3><a class="anchor" name="code-integration"></a>Code integration <a class="hash-link" href="docs/integration-with-existing-apps.html#code-integration">#</a></h3><p>Now we will actually modify the native iOS application to integrate React Native. For our 2048 sample app, we will add a "High Score" screen in React Native.</p><h4><a class="anchor" name="the-react-native-component"></a>The React Native component <a class="hash-link" href="docs/integration-with-existing-apps.html#the-react-native-component">#</a></h4><p>The first bit of code we will write is the actual React Native code for the new "High Score" screen that will be integrated into our application.</p><h5><a class="anchor" name="1-create-a-index-ios-js-file"></a>1. Create a <code>index.ios.js</code> file <a class="hash-link" href="docs/integration-with-existing-apps.html#1-create-a-index-ios-js-file">#</a></h5><p>First, create an empty <code>index.ios.js</code> file in the root of your React Native project.</p><p><code>index.ios.js</code> is the starting point for React Native applications on iOS, and it is always required. It can be a small file that <code>require</code>s other file that are part of your React Native component or application, or it can contain all the code that is needed for it. In our case, we will just put everything in <code>index.ios.js</code>.</p><h5><a class="anchor" name="2-add-your-react-native-code"></a>2. Add your React Native code <a class="hash-link" href="docs/integration-with-existing-apps.html#2-add-your-react-native-code">#</a></h5><p>In your <code>index.ios.js</code>, create your component. In our sample here, we will add simple <code>&lt;Text&gt;</code> component within a styled <code>&lt;View&gt;</code></p><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

import React from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span>
  AppRegistry<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View
<span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>

class <span class="token class-name">RNHighScores</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> contents <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">[</span><span class="token string">"scores"</span><span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span>
      score <span class="token operator">=</span><span class="token operator">&gt;</span> &lt;Text key<span class="token operator">=</span><span class="token punctuation">{</span>score<span class="token punctuation">.</span>name<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span>score<span class="token punctuation">.</span>name<span class="token punctuation">}</span><span class="token punctuation">:</span><span class="token punctuation">{</span>score<span class="token punctuation">.</span>value<span class="token punctuation">}</span><span class="token punctuation">{</span><span class="token string">"\n"</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>highScoresTitle<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token number">2048</span> High Scores<span class="token operator">!</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>scores<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span>contents<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

const styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  container<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#FFFFFF'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  highScoresTitle<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
    textAlign<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    margin<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  scores<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    textAlign<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    color<span class="token punctuation">:</span> <span class="token string">'#333333'</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment" spellcheck="true">
// Module name
</span>AppRegistry<span class="token punctuation">.</span><span class="token function">registerComponent<span class="token punctuation">(</span></span><span class="token string">'RNHighScores'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> RNHighScores<span class="token punctuation">)</span><span class="token punctuation">;</span></div><blockquote><p><code>RNHighScores</code> is the name of your module that will be used when you add a view to React Native from within your iOS application.</p></blockquote><h4><a class="anchor" name="the-magic-rctrootview"></a>The Magic: <code>RCTRootView</code> <a class="hash-link" href="docs/integration-with-existing-apps.html#the-magic-rctrootview">#</a></h4><p>Now that your React Native component is created via <code>index.ios.js</code>, you need to add that component to a new or existing <code>ViewController</code>. The easiest path to take is to optionally create an event path to your component and then add that component to an existing <code>ViewController</code>.</p><p>We will tie our React Native component with a new native view in the <code>ViewController</code> that will actually host it called <code>RCTRootView</code> .</p><h5><a class="anchor" name="1-create-an-event-path"></a>1. Create an Event Path <a class="hash-link" href="docs/integration-with-existing-apps.html#1-create-an-event-path">#</a></h5><p>You can add a new link on the main game menu to go to the "High Score" React Native page.</p><p><img src="img/react-native-add-react-native-integration-link.png" alt="Event Path"></p><h5><a class="anchor" name="2-event-handler"></a>2. Event Handler <a class="hash-link" href="docs/integration-with-existing-apps.html#2-event-handler">#</a></h5><p>We will now add an event handler from the menu link. A method will be added to the main <code>ViewController</code> of your application. This is where <code>RCTRootView</code> comes into play.</p><p>When you build a React Native application, you use the React Native packager to create an <code>index.ios.bundle</code> that will be served by the React Native server. Inside <code>index.ios.bundle</code> will be our <code>RNHighScore</code> module. So, we need to point our <code>RCTRootView</code> to the location of the <code>index.ios.bundle</code> resource (via <code>NSURL</code>) and tie it to the module.</p><p>We will, for debugging purposes, log that the event handler was invoked. Then, we will create a string with the location of our React Native code that exists inside the <code>index.ios.bundle</code>. Finally, we will create the main <code>RCTRootView</code>. Notice how we provide <code>RNHighScores</code> as the <code>moduleName</code> that we created <a href="#the-react-native-component" target="">above</a> when writing the code for our React Native component.</p><span><block class="objc">

</block></span><p>First <code>import</code> the <code>RCTRootView</code> header.</p><div class="prism language-javascript">#import &lt;React<span class="token operator">/</span>RCTRootView<span class="token punctuation">.</span>h<span class="token operator">&gt;</span></div><blockquote><p>The <code>initialProperties</code> are here for illustration purposes so we have some data for our high score screen. In our React Native component, we will use <code>this.props</code> to get access to that data.</p></blockquote><div class="prism language-javascript"><span class="token operator">-</span> <span class="token punctuation">(</span>IBAction<span class="token punctuation">)</span>highScoreButtonPressed<span class="token punctuation">:</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span>sender <span class="token punctuation">{</span>
    <span class="token function">NSLog<span class="token punctuation">(</span></span>@<span class="token string">"High Score Button Pressed"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    NSURL <span class="token operator">*</span>jsCodeLocation <span class="token operator">=</span> <span class="token punctuation">[</span>NSURL
                             URLWithString<span class="token punctuation">:</span>@<span class="token string">"http://localhost:8081/index.ios.bundle?platform=ios"</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
    RCTRootView <span class="token operator">*</span>rootView <span class="token operator">=</span>
      <span class="token punctuation">[</span><span class="token punctuation">[</span>RCTRootView alloc<span class="token punctuation">]</span> initWithBundleURL <span class="token punctuation">:</span> jsCodeLocation
                           moduleName        <span class="token punctuation">:</span> @<span class="token string">"RNHighScores"</span>
                           initialProperties <span class="token punctuation">:</span>
                             @<span class="token punctuation">{</span>
                               @<span class="token string">"scores"</span> <span class="token punctuation">:</span> @<span class="token punctuation">[</span>
                                 @<span class="token punctuation">{</span>
                                   @<span class="token string">"name"</span> <span class="token punctuation">:</span> @<span class="token string">"Alex"</span><span class="token punctuation">,</span>
                                   @<span class="token string">"value"</span><span class="token punctuation">:</span> @<span class="token string">"42"</span>
                                  <span class="token punctuation">}</span><span class="token punctuation">,</span>
                                 @<span class="token punctuation">{</span>
                                   @<span class="token string">"name"</span> <span class="token punctuation">:</span> @<span class="token string">"Joel"</span><span class="token punctuation">,</span>
                                   @<span class="token string">"value"</span><span class="token punctuation">:</span> @<span class="token string">"10"</span>
                                 <span class="token punctuation">}</span>
                               <span class="token punctuation">]</span>
                             <span class="token punctuation">}</span>
                           launchOptions    <span class="token punctuation">:</span> nil<span class="token punctuation">]</span><span class="token punctuation">;</span>
    UIViewController <span class="token operator">*</span>vc <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">[</span>UIViewController alloc<span class="token punctuation">]</span> init<span class="token punctuation">]</span><span class="token punctuation">;</span>
    vc<span class="token punctuation">.</span>view <span class="token operator">=</span> rootView<span class="token punctuation">;</span>
    <span class="token punctuation">[</span>self presentViewController<span class="token punctuation">:</span>vc animated<span class="token punctuation">:</span>YES completion<span class="token punctuation">:</span>nil<span class="token punctuation">]</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><blockquote><p>Note that <code>RCTRootView initWithURL</code> starts up a new JSC VM. To save resources and simplify the communication between RN views in different parts of your native app, you can have multiple views powered by React Native that are associated with a single JS runtime. To do that, instead of using <code>[RCTRootView alloc] initWithURL</code>, use <a href="https://github.com/facebook/react-native/blob/master/React/Base/RCTBridge.h#L93" target="_blank"><code>RCTBridge initWithBundleURL</code></a> to create a bridge and then use <code>RCTRootView initWithBridge</code>.</p></blockquote><span><block class="swift">

</block></span><p>First <code>import</code> the <code>React</code> library.</p><div class="prism language-javascript">import React</div><blockquote><p>The <code>initialProperties</code> are here for illustration purposes so we have some data for our high score screen. In our React Native component, we will use <code>this.props</code> to get access to that data.</p></blockquote><div class="prism language-javascript">@IBAction func <span class="token function">highScoreButtonTapped<span class="token punctuation">(</span></span>sender <span class="token punctuation">:</span> UIButton<span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token function">NSLog<span class="token punctuation">(</span></span><span class="token string">"Hello"</span><span class="token punctuation">)</span>
  <span class="token keyword">let</span> jsCodeLocation <span class="token operator">=</span> <span class="token function">URL<span class="token punctuation">(</span></span>string<span class="token punctuation">:</span> <span class="token string">"http://localhost:8081/index.ios.bundle?platform=ios"</span><span class="token punctuation">)</span>
  <span class="token keyword">let</span> mockData<span class="token punctuation">:</span>NSDictionary <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token string">"scores"</span><span class="token punctuation">:</span>
      <span class="token punctuation">[</span>
          <span class="token punctuation">[</span><span class="token string">"name"</span><span class="token punctuation">:</span><span class="token string">"Alex"</span><span class="token punctuation">,</span> <span class="token string">"value"</span><span class="token punctuation">:</span><span class="token string">"42"</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
          <span class="token punctuation">[</span><span class="token string">"name"</span><span class="token punctuation">:</span><span class="token string">"Joel"</span><span class="token punctuation">,</span> <span class="token string">"value"</span><span class="token punctuation">:</span><span class="token string">"10"</span><span class="token punctuation">]</span>
      <span class="token punctuation">]</span>
  <span class="token punctuation">]</span>

  <span class="token keyword">let</span> rootView <span class="token operator">=</span> <span class="token function">RCTRootView<span class="token punctuation">(</span></span>
      bundleURL<span class="token punctuation">:</span> jsCodeLocation<span class="token punctuation">,</span>
      moduleName<span class="token punctuation">:</span> <span class="token string">"RNHighScores"</span><span class="token punctuation">,</span>
      initialProperties<span class="token punctuation">:</span> mockData as <span class="token punctuation">[</span>NSObject <span class="token punctuation">:</span> AnyObject<span class="token punctuation">]</span><span class="token punctuation">,</span>
      launchOptions<span class="token punctuation">:</span> nil
  <span class="token punctuation">)</span>
  <span class="token keyword">let</span> vc <span class="token operator">=</span> <span class="token function">UIViewController<span class="token punctuation">(</span></span><span class="token punctuation">)</span>
  vc<span class="token punctuation">.</span>view <span class="token operator">=</span> rootView
  self<span class="token punctuation">.</span><span class="token function">present<span class="token punctuation">(</span></span>vc<span class="token punctuation">,</span> animated<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span> completion<span class="token punctuation">:</span> nil<span class="token punctuation">)</span>
<span class="token punctuation">}</span></div><blockquote><p>Note that <code>RCTRootView bundleURL</code> starts up a new JSC VM. To save resources and simplify the communication between RN views in different parts of your native app, you can have multiple views powered by React Native that are associated with a single JS runtime. To do that, instead of using <code>RCTRootView bundleURL</code>, use <a href="https://github.com/facebook/react-native/blob/master/React/Base/RCTBridge.h#L89" target="_blank"><code>RCTBridge initWithBundleURL</code></a> to create a bridge and then use <code>RCTRootView initWithBridge</code>.</p></blockquote><span><block class="objc">

</block></span><blockquote><p>When moving your app to production, the <code>NSURL</code> can point to a pre-bundled file on disk via something like <code>[[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];</code>. You can use the <code>react-native-xcode.sh</code> script in <code>node_modules/react-native/packager/</code> to generate that pre-bundled file.</p></blockquote><span><block class="swift">

</block></span><blockquote><p>When moving your app to production, the <code>NSURL</code> can point to a pre-bundled file on disk via something like <code>let mainBundle = NSBundle(URLForResource: "main" withExtension:"jsbundle")</code>. You can use the <code>react-native-xcode.sh</code> script in <code>node_modules/react-native/packager/</code> to generate that pre-bundled file.</p></blockquote><span><block class="objc swift">

</block></span><h5><a class="anchor" name="3-wire-up"></a>3. Wire Up <a class="hash-link" href="docs/integration-with-existing-apps.html#3-wire-up">#</a></h5><p>Wire up the new link in the main menu to the newly added event handler method.</p><p><img src="img/react-native-add-react-native-integration-wire-up.png" alt="Event Path"></p><blockquote><p>One of the easier ways to do this is to open the view in the storyboard and right click on the new link. Select something such as the <code>Touch Up Inside</code> event, drag that to the storyboard and then select the created method from the list provided.</p></blockquote><h3><a class="anchor" name="test-your-integration"></a>Test your integration <a class="hash-link" href="docs/integration-with-existing-apps.html#test-your-integration">#</a></h3><p>You have now done all the basic steps to integrate React Native with your current application. Now we will start the React Native packager to build the <code>index.ios.bundle</code> package and the server running on <code>localhost</code> to serve it.</p><h5><a class="anchor" name="1-add-app-transport-security-exception"></a>1. Add App Transport Security exception <a class="hash-link" href="docs/integration-with-existing-apps.html#1-add-app-transport-security-exception">#</a></h5><p>Apple has blocked implicit cleartext HTTP resource loading. So we need to add the following our project's <code>Info.plist</code> (or equivalent) file.</p><div class="prism language-javascript">&lt;key<span class="token operator">&gt;</span>NSAppTransportSecurity&lt;<span class="token operator">/</span>key<span class="token operator">&gt;</span>
&lt;dict<span class="token operator">&gt;</span>
    &lt;key<span class="token operator">&gt;</span>NSExceptionDomains&lt;<span class="token operator">/</span>key<span class="token operator">&gt;</span>
    &lt;dict<span class="token operator">&gt;</span>
        &lt;key<span class="token operator">&gt;</span>localhost&lt;<span class="token operator">/</span>key<span class="token operator">&gt;</span>
        &lt;dict<span class="token operator">&gt;</span>
            &lt;key<span class="token operator">&gt;</span>NSTemporaryExceptionAllowsInsecureHTTPLoads&lt;<span class="token operator">/</span>key<span class="token operator">&gt;</span>
            &lt;<span class="token boolean">true</span><span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>dict<span class="token operator">&gt;</span>
    &lt;<span class="token operator">/</span>dict<span class="token operator">&gt;</span>
&lt;<span class="token operator">/</span>dict<span class="token operator">&gt;</span></div><blockquote><p>App Transport Security is good for your users. Make sure to re-enable it prior to releasing your app for production.</p></blockquote><h5><a class="anchor" name="2-run-the-packager"></a>2. Run the packager <a class="hash-link" href="docs/integration-with-existing-apps.html#2-run-the-packager">#</a></h5><p>To run your app, you need to first start the development server. To do this, simply run the following command in the root directory of your React Native project:</p><div class="prism language-javascript">$ npm start</div><h5><a class="anchor" name="3-run-the-app"></a>3. Run the app <a class="hash-link" href="docs/integration-with-existing-apps.html#3-run-the-app">#</a></h5><p>If you are using Xcode or your favorite editor, build and run your native iOS application as normal. Alternatively, you can run the app from the command line using:</p><div class="prism language-javascript"># From the root of your project
$ react<span class="token operator">-</span>native run<span class="token operator">-</span>ios</div><p>In our sample application, you should see the link to the "High Scores" and then when you click on that you will see the rendering of your React Native component.</p><p>Here is the <em>native</em> application home screen:</p><p><img src="img/react-native-add-react-native-integration-example-home-screen.png" alt="Home Screen"></p><p>Here is the <em>React Native</em> high score screen:</p><p><img src="img/react-native-add-react-native-integration-example-high-scores.png" alt="High Scores"></p><blockquote><p>If you are getting module resolution issues when running your application please see <a href="https://github.com/facebook/react-native/issues/4968" target="_blank">this GitHub issue</a> for information and possible resolution. <a href="https://github.com/facebook/react-native/issues/4968#issuecomment-220941717" target="_blank">This comment</a> seemed to be the latest possible resolution.</p></blockquote><h3><a class="anchor" name="see-the-code"></a>See the Code <a class="hash-link" href="docs/integration-with-existing-apps.html#see-the-code">#</a></h3><span><block class="objc">

</block></span><p>You can examine the code that added the React Native screen to our sample app on <a href="https://github.com/JoelMarcey/iOS-2048/commit/9ae70c7cdd53eb59f5f7c7daab382b0300ed3585" target="_blank">GitHub</a>.</p><span><block class="swift">

</block></span><p>You can examine the code that added the React Native screen to our sample app on <a href="https://github.com/JoelMarcey/swift-2048/commit/13272a31ee6dd46dc68b1dcf4eaf16c1a10f5229" target="_blank">GitHub</a>.</p><span><block class="android">

</block></span><h2><a class="anchor" name="adding-react-native-to-your-app"></a>Adding React Native to your app <a class="hash-link" href="docs/integration-with-existing-apps.html#adding-react-native-to-your-app">#</a></h2><h3><a class="anchor" name="configuring-maven"></a>Configuring maven <a class="hash-link" href="docs/integration-with-existing-apps.html#configuring-maven">#</a></h3><p>Add the React Native dependency to your app's <code>build.gradle</code> file:</p><div class="prism language-javascript">dependencies <span class="token punctuation">{</span>
    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
    compile <span class="token string">"com.facebook.react:react-native:+"</span><span class="token comment" spellcheck="true"> // From node_modules.
</span><span class="token punctuation">}</span></div><blockquote><p>If you want to ensure that you are always using a specific React Native version in your native build, replace <code>+</code> with an actual React Native version you've downloaded from <code>npm</code>.</p></blockquote><p>Add an entry for the local React Native maven directory to <code>build.gradle</code>. Be sure to add it to the "allprojects" block:</p><div class="prism language-javascript">allprojects <span class="token punctuation">{</span>
    repositories <span class="token punctuation">{</span>
        <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
        maven <span class="token punctuation">{</span>
           <span class="token comment" spellcheck="true"> // All of React Native (JS, Android binaries) is installed from npm
</span>            url <span class="token string">"$rootDir/node_modules/react-native/android"</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
<span class="token punctuation">}</span></div><blockquote><p>Make sure that the path is correct! You shouldn’t run into any “Failed to resolve: com.facebook.react:react-native:0.x.x" errors after running Gradle sync in Android Studio.</p></blockquote><h3><a class="anchor" name="configuring-permissions"></a>Configuring permissions <a class="hash-link" href="docs/integration-with-existing-apps.html#configuring-permissions">#</a></h3><p>Next, make sure you have the Internet permission in your <code>AndroidManifest.xml</code>:</p><div class="prism language-javascript">&lt;uses<span class="token operator">-</span>permission android<span class="token punctuation">:</span>name<span class="token operator">=</span><span class="token string">"android.permission.INTERNET"</span> <span class="token operator">/</span><span class="token operator">&gt;</span></div><p>If you need to access to the <code>DevSettingsActivity</code> add to your <code>AndroidManifest.xml</code>:</p><div class="prism language-javascript">&lt;activity android<span class="token punctuation">:</span>name<span class="token operator">=</span><span class="token string">"com.facebook.react.devsupport.DevSettingsActivity"</span> <span class="token operator">/</span><span class="token operator">&gt;</span></div><p>This is only really used in dev mode when reloading JavaScript from the development server, so you can strip this in release builds if you need to.</p><h3><a class="anchor" name="code-integration"></a>Code integration <a class="hash-link" href="docs/integration-with-existing-apps.html#code-integration">#</a></h3><p>Now we will actually modify the native Android application to integrate React Native.</p><h4><a class="anchor" name="the-react-native-component"></a>The React Native component <a class="hash-link" href="docs/integration-with-existing-apps.html#the-react-native-component">#</a></h4><p>The first bit of code we will write is the actual React Native code for the new "High Score" screen that will be integrated into our application.</p><h5><a class="anchor" name="1-create-a-index-android-js-file"></a>1. Create a <code>index.android.js</code> file <a class="hash-link" href="docs/integration-with-existing-apps.html#1-create-a-index-android-js-file">#</a></h5><p>First, create an empty <code>index.android.js</code> file in the root of your React Native project.</p><p><code>index.android.js</code> is the starting point for React Native applications on Android, and it is always required. It can be a small file that <code>require</code>s other file that are part of your React Native component or application, or it can contain all the code that is needed for it. In our case, we will just put everything in <code>index.android.js</code>.</p><h5><a class="anchor" name="2-add-your-react-native-code"></a>2. Add your React Native code <a class="hash-link" href="docs/integration-with-existing-apps.html#2-add-your-react-native-code">#</a></h5><p>In your <code>index.android.js</code>, create your component. In our sample here, we will add simple <code>&lt;Text&gt;</code> component within a styled <code>&lt;View&gt;</code>:</p><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

import React from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span>
  AppRegistry<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View
<span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>

class <span class="token class-name">HelloWorld</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>hello<span class="token punctuation">}</span><span class="token operator">&gt;</span>Hello<span class="token punctuation">,</span> World&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  container<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  hello<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
    textAlign<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    margin<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

AppRegistry<span class="token punctuation">.</span><span class="token function">registerComponent<span class="token punctuation">(</span></span><span class="token string">'HelloWorld'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> HelloWorld<span class="token punctuation">)</span><span class="token punctuation">;</span></div><h5><a class="anchor" name="3-configure-permissions-for-development-error-overlay"></a>3. Configure permissions for development error overlay <a class="hash-link" href="docs/integration-with-existing-apps.html#3-configure-permissions-for-development-error-overlay">#</a></h5><p>If your app is targeting the Android <code>API level 23</code> or greater, make sure you have the <code>overlay</code> permission enabled for the development build. You can check it with <code>Settings.canDrawOverlays(this);</code>. This is required in dev builds because react native development errors must be displayed above all the other windows. Due to the new permissions system introduced in the API level 23, the user needs to approve it. This can be achieved by adding the following code to the Activity file in the onCreate() method. OVERLAY_PERMISSION_REQ_CODE is a field of the class which would be responsible for passing the result back to the Activity.</p><div class="prism language-javascript"><span class="token keyword">if</span> <span class="token punctuation">(</span>Build<span class="token punctuation">.</span>VERSION<span class="token punctuation">.</span>SDK_INT <span class="token operator">&gt;=</span> Build<span class="token punctuation">.</span>VERSION_CODES<span class="token punctuation">.</span>M<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>Settings<span class="token punctuation">.</span><span class="token function">canDrawOverlays<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        Intent intent <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Intent</span><span class="token punctuation">(</span>Settings<span class="token punctuation">.</span>ACTION_MANAGE_OVERLAY_PERMISSION<span class="token punctuation">,</span>
                                   Uri<span class="token punctuation">.</span><span class="token function">parse<span class="token punctuation">(</span></span><span class="token string">"package:"</span> <span class="token operator">+</span> <span class="token function">getPackageName<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">startActivityForResult<span class="token punctuation">(</span></span>intent<span class="token punctuation">,</span> OVERLAY_PERMISSION_REQ_CODE<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>Finally, the <code>onActivityResult()</code> method (as shown in the code below) has to be overridden to handle the permission Accepted or Denied cases for consistent UX.</p><div class="prism language-javascript">@Override
protected void <span class="token function">onActivityResult<span class="token punctuation">(</span></span>int requestCode<span class="token punctuation">,</span> int resultCode<span class="token punctuation">,</span> Intent data<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>requestCode <span class="token operator">==</span> OVERLAY_PERMISSION_REQ_CODE<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>Build<span class="token punctuation">.</span>VERSION<span class="token punctuation">.</span>SDK_INT <span class="token operator">&gt;=</span> Build<span class="token punctuation">.</span>VERSION_CODES<span class="token punctuation">.</span>M<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>Settings<span class="token punctuation">.</span><span class="token function">canDrawOverlays<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
               <span class="token comment" spellcheck="true"> // SYSTEM_ALERT_WINDOW permission not granted...
</span>            <span class="token punctuation">}</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><h4><a class="anchor" name="the-magic-reactrootview"></a>The Magic: <code>ReactRootView</code> <a class="hash-link" href="docs/integration-with-existing-apps.html#the-magic-reactrootview">#</a></h4><p>You need to add some native code in order to start the React Native runtime and get it to render something. To do this, we're going to create an <code>Activity</code> that creates a <code>ReactRootView</code>, starts a React application inside it and sets it as the main content view.</p><blockquote><p>If you are targetting Android version &lt;5, use the <code>AppCompatActivity</code> class from the <code>com.android.support:appcompat</code> package instead of <code>Activity</code>.</p></blockquote><div class="prism language-javascript">public class <span class="token class-name">MyReactActivity</span> extends <span class="token class-name">Activity</span> implements <span class="token class-name">DefaultHardwareBackBtnHandler</span> <span class="token punctuation">{</span>
    private ReactRootView mReactRootView<span class="token punctuation">;</span>
    private ReactInstanceManager mReactInstanceManager<span class="token punctuation">;</span>

    @Override
    protected void <span class="token function">onCreate<span class="token punctuation">(</span></span>Bundle savedInstanceState<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        super<span class="token punctuation">.</span><span class="token function">onCreate<span class="token punctuation">(</span></span>savedInstanceState<span class="token punctuation">)</span><span class="token punctuation">;</span>

        mReactRootView <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ReactRootView</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        mReactInstanceManager <span class="token operator">=</span> ReactInstanceManager<span class="token punctuation">.</span><span class="token function">builder<span class="token punctuation">(</span></span><span class="token punctuation">)</span>
                <span class="token punctuation">.</span><span class="token function">setApplication<span class="token punctuation">(</span></span><span class="token function">getApplication<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">)</span>
                <span class="token punctuation">.</span><span class="token function">setBundleAssetName<span class="token punctuation">(</span></span><span class="token string">"index.android.bundle"</span><span class="token punctuation">)</span>
                <span class="token punctuation">.</span><span class="token function">setJSMainModuleName<span class="token punctuation">(</span></span><span class="token string">"index.android"</span><span class="token punctuation">)</span>
                <span class="token punctuation">.</span><span class="token function">addPackage<span class="token punctuation">(</span></span><span class="token keyword">new</span> <span class="token class-name">MainReactPackage</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
                <span class="token punctuation">.</span><span class="token function">setUseDeveloperSupport<span class="token punctuation">(</span></span>BuildConfig<span class="token punctuation">.</span>DEBUG<span class="token punctuation">)</span>
                <span class="token punctuation">.</span><span class="token function">setInitialLifecycleState<span class="token punctuation">(</span></span>LifecycleState<span class="token punctuation">.</span>RESUMED<span class="token punctuation">)</span>
                <span class="token punctuation">.</span><span class="token function">build<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        mReactRootView<span class="token punctuation">.</span><span class="token function">startReactApplication<span class="token punctuation">(</span></span>mReactInstanceManager<span class="token punctuation">,</span> <span class="token string">"HelloWorld"</span><span class="token punctuation">,</span> <span class="token keyword">null</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token function">setContentView<span class="token punctuation">(</span></span>mReactRootView<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    @Override
    public void <span class="token function">invokeDefaultOnBackPressed<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        super<span class="token punctuation">.</span><span class="token function">onBackPressed<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><blockquote><p>If you are using a starter kit for React Native, replace the "HelloWorld" string with the one in your index.android.js file (it’s the first argument to the <code>AppRegistry.registerComponent()</code> method).</p></blockquote><p>If you are using Android Studio, use <code>Alt + Enter</code> to add all missing imports in your MyReactActivity class. Be careful to use your package’s <code>BuildConfig</code> and not the one from the <code>...facebook...</code> package.</p><p>We need set the theme of <code>MyReactActivity</code> to <code>Theme.AppCompat.Light.NoActionBar</code> because some components rely on this theme.</p><div class="prism language-javascript">&lt;activity
  android<span class="token punctuation">:</span>name<span class="token operator">=</span><span class="token string">".MyReactActivity"</span>
  android<span class="token punctuation">:</span>label<span class="token operator">=</span><span class="token string">"@string/app_name"</span>
  android<span class="token punctuation">:</span>theme<span class="token operator">=</span><span class="token string">"@style/Theme.AppCompat.Light.NoActionBar"</span><span class="token operator">&gt;</span>
&lt;<span class="token operator">/</span>activity<span class="token operator">&gt;</span></div><blockquote><p>A <code>ReactInstanceManager</code> can be shared amongst multiple activities and/or fragments. You will want to make your own <code>ReactFragment</code> or <code>ReactActivity</code> and have a singleton <em>holder</em> that holds a <code>ReactInstanceManager</code>. When you need the <code>ReactInstanceManager</code> (e.g., to hook up the <code>ReactInstanceManager</code> to the lifecycle of those Activities or Fragments) use the one provided by the singleton.</p></blockquote><p>Next, we need to pass some activity lifecycle callbacks down to the <code>ReactInstanceManager</code>:</p><div class="prism language-javascript">@Override
protected void <span class="token function">onPause<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    super<span class="token punctuation">.</span><span class="token function">onPause<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>mReactInstanceManager <span class="token operator">!</span><span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        mReactInstanceManager<span class="token punctuation">.</span><span class="token function">onHostPause<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

@Override
protected void <span class="token function">onResume<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    super<span class="token punctuation">.</span><span class="token function">onResume<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>mReactInstanceManager <span class="token operator">!</span><span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        mReactInstanceManager<span class="token punctuation">.</span><span class="token function">onHostResume<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

@Override
protected void <span class="token function">onDestroy<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    super<span class="token punctuation">.</span><span class="token function">onDestroy<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>mReactInstanceManager <span class="token operator">!</span><span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        mReactInstanceManager<span class="token punctuation">.</span><span class="token function">onHostDestroy<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>We also need to pass back button events to React Native:</p><div class="prism language-javascript">@Override
 public void <span class="token function">onBackPressed<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>mReactInstanceManager <span class="token operator">!</span><span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        mReactInstanceManager<span class="token punctuation">.</span><span class="token function">onBackPressed<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
        super<span class="token punctuation">.</span><span class="token function">onBackPressed<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>This allows JavaScript to control what happens when the user presses the hardware back button (e.g. to implement navigation). When JavaScript doesn't handle a back press, your <code>invokeDefaultOnBackPressed</code> method will be called. By default this simply finishes your <code>Activity</code>.</p><p>Finally, we need to hook up the dev menu. By default, this is activated by (rage) shaking the device, but this is not very useful in emulators. So we make it show when you press the hardware menu button (use <code>Ctrl + M</code> if you're using Android Studio emulator):</p><div class="prism language-javascript">@Override
public boolean <span class="token function">onKeyUp<span class="token punctuation">(</span></span>int keyCode<span class="token punctuation">,</span> KeyEvent event<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>keyCode <span class="token operator">==</span> KeyEvent<span class="token punctuation">.</span>KEYCODE_MENU &amp;&amp; mReactInstanceManager <span class="token operator">!</span><span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        mReactInstanceManager<span class="token punctuation">.</span><span class="token function">showDevOptionsDialog<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">return</span> super<span class="token punctuation">.</span><span class="token function">onKeyUp<span class="token punctuation">(</span></span>keyCode<span class="token punctuation">,</span> event<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><p>Now your activity is ready to run some JavaScript code.</p><h3><a class="anchor" name="test-your-integration"></a>Test your integration <a class="hash-link" href="docs/integration-with-existing-apps.html#test-your-integration">#</a></h3><p>You have now done all the basic steps to integrate React Native with your current application. Now we will start the React Native packager to build the <code>index.android.bundle</code> package and the server running on localhost to serve it.</p><h5><a class="anchor" name="1-run-the-packager"></a>1. Run the packager <a class="hash-link" href="docs/integration-with-existing-apps.html#1-run-the-packager">#</a></h5><p>To run your app, you need to first start the development server. To do this, simply run the following command in the root directory of your React Native project:</p><div class="prism language-javascript">$ npm start</div><h5><a class="anchor" name="2-run-the-app"></a>2. Run the app <a class="hash-link" href="docs/integration-with-existing-apps.html#2-run-the-app">#</a></h5><p>Now build and run your Android app as normal.</p><p>Once you reach your React-powered activity inside the app, it should load the JavaScript code from the development server and display:</p><p><img src="img/EmbeddedAppAndroid.png" alt="Screenshot"></p><h3><a class="anchor" name="creating-a-release-build-in-android-studio"></a>Creating a release build in Android Studio <a class="hash-link" href="docs/integration-with-existing-apps.html#creating-a-release-build-in-android-studio">#</a></h3><p>You can use Android Studio to create your release builds too! It’s as easy as creating release builds of your previously-existing native Android app. There’s just one additional step, which you’ll have to do before every release build. You need to execute the following to create a React Native bundle, which’ll be included with your native Android app:</p><div class="prism language-javascript">$ react<span class="token operator">-</span>native bundle <span class="token operator">--</span>platform android <span class="token operator">--</span>dev <span class="token boolean">false</span> <span class="token operator">--</span>entry<span class="token operator">-</span>file index<span class="token punctuation">.</span>android<span class="token punctuation">.</span>js <span class="token operator">--</span>bundle<span class="token operator">-</span>output android<span class="token operator">/</span>com<span class="token operator">/</span>your<span class="token operator">-</span>company<span class="token operator">-</span>name<span class="token operator">/</span>app<span class="token operator">-</span>package<span class="token operator">-</span>name<span class="token operator">/</span>src<span class="token operator">/</span>main<span class="token operator">/</span>assets<span class="token operator">/</span>index<span class="token punctuation">.</span>android<span class="token punctuation">.</span>bundle <span class="token operator">--</span>assets<span class="token operator">-</span>dest android<span class="token operator">/</span>com<span class="token operator">/</span>your<span class="token operator">-</span>company<span class="token operator">-</span>name<span class="token operator">/</span>app<span class="token operator">-</span>package<span class="token operator">-</span>name<span class="token operator">/</span>src<span class="token operator">/</span>main<span class="token regex">/res/</span></div><p>Don’t forget to replace the paths with correct ones and create the assets folder if it doesn’t exist!</p><p>Now just create a release build of your native app from within Android Studio as usual and you should be good to go!</p><span><block class="objc swift android">

</block></span><h3><a class="anchor" name="now-what"></a>Now what? <a class="hash-link" href="docs/integration-with-existing-apps.html#now-what">#</a></h3><p>At this point you can continue developing your app as usual. Refer to our <a href="/docs/debugging.html" target="">debugging</a> and <a href="docs/running-on-device.html" target="_blank">deployment</a> docs to learn more about working with React Native.</p><span><script>
// Convert <div>...<span><block /></span>...</div>
// Into <div>...<block />...</div>
var blocks = document.getElementsByTagName('block');
for (var i = 0; i < blocks.length; ++i) {
  var block = blocks[i];
  var span = blocks[i].parentNode;
  var container = span.parentNode;
  container.insertBefore(block, span);
  container.removeChild(span);
}
// Convert <div>...<block />content<block />...</div>
// Into <div>...<block>content</block><block />...</div>
blocks = document.getElementsByTagName('block');
for (var i = 0; i < blocks.length; ++i) {
  var block = blocks[i];
  while (block.nextSibling && block.nextSibling.tagName !== 'BLOCK') {
    block.appendChild(block.nextSibling);
  }
}
function display(type, value) {
  var container = document.getElementsByTagName('block')[0].parentNode;
  container.className = 'display-' + type + '-' + value + ' ' +
    container.className.replace(RegExp('display-' + type + '-[a-z]+ ?'), '');
  console.log(container.className);
  event && event.preventDefault();
}

// If we are coming to the page with a hash in it (i.e. from a search, for example), try to get
// us as close as possible to the correct platform and dev os using the hashtag and block walk up.
var foundHash = false;
if (window.location.hash !== '' && window.location.hash !== 'content') { // content is default
  var hashLinks = document.querySelectorAll('a.hash-link');
  for (var i = 0; i < hashLinks.length && !foundHash; ++i) {
    if (hashLinks[i].hash === window.location.hash) {
      var parent = hashLinks[i].parentElement;
      while (parent) {
        if (parent.tagName === 'BLOCK') {
          var targetPlatform = null;
          // Could be more than one target platform, but just choose some sort of order
          // of priority here.

          // Target Platform
          if (parent.className.indexOf('objc') > -1) {
            targetPlatform = 'objc';
          } else if (parent.className.indexOf('swift') > -1) {
            targetPlatform = 'swift';
          } else if (parent.className.indexOf('android') > -1) {
            targetPlatform = 'android';
          } else {
            break; // assume we don't have anything.
          }
          // We would have broken out if both targetPlatform and devOS hadn't been filled.
          display('platform', targetPlatform);
          foundHash = true;
          break;
        }
        parent = parent.parentElement;
      }
    }
  }
}
// Do the default if there is no matching hash
if (!foundHash) {
  var isMac = navigator.platform === 'MacIntel';
  display('platform', isMac ? 'objc' : 'android');
}
</script>
</span></div><div class="docs-prevnext"><a class="docs-prev" href="docs/colors.html#content">← Prev</a><a class="docs-next" href="docs/running-on-device.html#content">Next →</a></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/IntegrationWithExistingApps.md">edit the content above on GitHub</a> and send us a pull request!</p>