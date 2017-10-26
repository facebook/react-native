---
id: integration-with-existing-apps
title: integration-with-existing-apps
---
<a id="content"></a><h1><a class="anchor" name="integration-with-existing-apps"></a>Integration With Existing Apps <a class="hash-link" href="docs/integration-with-existing-apps.html#integration-with-existing-apps">#</a></h1><div><span><div class="integration-toggler">
<style>
.integration-toggler a {
  display: inline-block;
  padding: 10px 5px;
  margin: 2px;
  border: 1px solid #05A5D1;
  border-radius: 3px;
  text-decoration: none !important;
}
.display-platform-objc .integration-toggler .button-objc,
.display-platform-swift .integration-toggler .button-swift,
.display-platform-android .integration-toggler .button-android {
  background-color: #05A5D1;
  color: white;
}
block { display: none; }
.display-platform-objc .objc,
.display-platform-swift .swift,
.display-platform-android .android {
  display: block;
}</style>
<span>Platform:</span>
<a href="javascript:void(0);" class="button-objc" onclick="display('platform', 'objc')">Objective-C</a>
<a href="javascript:void(0);" class="button-swift" onclick="display('platform', 'swift')">Swift</a>
<a href="javascript:void(0);" class="button-android" onclick="display('platform', 'android')">Android</a>
</div>

</span><span><block class="android">

</block></span><blockquote><p>This section will be updated shortly showing an integration into a more real world application such as the 2048 app that was used for Objective-C and Swift.</p></blockquote><span><block class="objc swift android">

</block></span><h2><a class="anchor" name="key-concepts"></a>Key Concepts <a class="hash-link" href="docs/integration-with-existing-apps.html#key-concepts">#</a></h2><p>React Native is great when you are starting a new mobile app from scratch. However, it also works well for adding a single view or user flow to existing native applications. With a few steps, you can add new React Native based features, screens, views, etc.</p><span><block class="objc swift">

</block></span><p>The keys to integrating React Native components into your iOS application are to:</p><ol><li>Understand what React Native components you want to integrate.</li><li>Create a <code>Podfile</code> with <code>subspec</code>s for all the React Native components you will need for your integration.</li><li>Create your actual React Native components in JavaScript.</li><li>Add a new event handler that creates a <code>RCTRootView</code> that points to your React Native component and its <code>AppRegistry</code> name that you defined in <code>index.ios.js</code>.</li><li>Start the React Native server and run your native application.</li><li>Optionally add more React Native components.</li><li><a href="/react-native/releases/next/docs/debugging.html" target="">Debug</a>.</li><li>Prepare for <a href="/react-native/docs/running-on-device-ios.html" target="">deployment</a> (e.g., via the <code>react-native-xcode.sh</code> script).</li><li>Deploy and Profit!</li></ol><span><block class="android">

</block></span><p>The keys to integrating React Native components into your Android application are to:</p><ol><li>Understand what React Native components you want to integrate.</li><li>Install <code>react-native</code> in your Android application root directory to create <code>node_modules/</code> directory.</li><li>Create your actual React Native components in JavaScript.</li><li>Add <code>com.facebook.react:react-native:+</code> and a <code>maven</code> pointing to the <code>react-native</code> binaries in <code>node_modules/</code> to your <code>build.gradle</code> file.</li><li>Create a custom React Native specific <code>Activity</code> that creates a <code>ReactRootView</code>.</li><li>Start the React Native server and run your native application.</li><li>Optionally add more React Native components.</li><li><a href="/react-native/releases/next/docs/debugging.html" target="">Debug</a>.</li><li><a href="/react-native/releases/next/docs/signed-apk-android.html" target="">Prepare</a> for <a href="/react-native/docs/running-on-device-android.html" target="">deployment</a>.</li><li>Deploy and Profit!</li></ol><span><block class="objc swift android">

</block></span><h2><a class="anchor" name="prerequisites"></a>Prerequisites <a class="hash-link" href="docs/integration-with-existing-apps.html#prerequisites">#</a></h2><span><block class="android">

</block></span><p>The <a href="/react-native/docs/getting-started.html" target="">Android Getting Started guide</a> will install the appropriate prerequisites (e.g., <code>npm</code>) for React Native on the Android target platform and your chosen development environment.</p><blockquote><p>To ensure a smooth experience, make sure your <code>android</code> project is under <code>$root/android</code>.</p></blockquote><span><block class="objc swift">

</block></span><h3><a class="anchor" name="general"></a>General <a class="hash-link" href="docs/integration-with-existing-apps.html#general">#</a></h3><p>First, follow the <a href="/react-native/docs/getting-started.html" target="">Getting Started guide</a> for your development environment and the iOS target platform to install the prerequisites for React Native.</p><blockquote><p>To ensure a smooth experience, make sure your <code>iOS</code> project is under <code>$root/ios</code>.</p></blockquote><h3><a class="anchor" name="cocoapods"></a>CocoaPods <a class="hash-link" href="docs/integration-with-existing-apps.html#cocoapods">#</a></h3><p><a href="http://cocoapods.org" target="_blank">CocoaPods</a> is a package management tool for iOS and Mac development. We use it to add the actual React Native framework code locally into your current project.</p><div class="prism language-javascript">$ sudo gem install cocoapods</div><blockquote><p>It is technically possible not to use CocoaPods, but this requires manual library and linker additions that overly complicates this process.</p></blockquote><h2><a class="anchor" name="our-sample-app"></a>Our Sample App <a class="hash-link" href="docs/integration-with-existing-apps.html#our-sample-app">#</a></h2><span><block class="objc">

</block></span><p>Assume the <a href="https://github.com/JoelMarcey/iOS-2048" target="_blank">app for integration</a> is a &lt;a href="https://en.wikipedia.org/wiki/2048_(video_game)"&gt;2048&lt;/a&gt; game. Here is what the main menu of the native application looks like without React Native.</p><span><block class="swift">

</block></span><p>Assume the <a href="https://github.com/JoelMarcey/swift-2048" target="_blank">app for integration</a> is a &lt;a href="https://en.wikipedia.org/wiki/2048_(video_game)"&gt;2048&lt;/a&gt; game. Here is what the main menu of the native application looks like without React Native.</p><span><block class="objc swift">

</block></span><p><img src="img/react-native-existing-app-integration-ios-before.png" alt="Before RN Integration"></p><h2><a class="anchor" name="package-dependencies"></a>Package Dependencies <a class="hash-link" href="docs/integration-with-existing-apps.html#package-dependencies">#</a></h2><p>React Native integration requires both the React and React Native node modules. The React Native Framework will provide the code to allow your application integration to happen.</p><h3><a class="anchor" name="package-json"></a><code>package.json</code> <a class="hash-link" href="docs/integration-with-existing-apps.html#package-json">#</a></h3><p>We will add the package dependencies to a <code>package.json</code> file. Create this file in the root of your project if it does not exist.</p><blockquote><p>Normally with React Native projects, you will put files like <code>package.json</code>, <code>index.ios.js</code>, etc. in the root directory of your project and then have your iOS specific native code in a subdirectory like <code>ios/</code> where your Xcode project is located (e.g., <code>.xcodeproj</code>).</p></blockquote><p>Below is an example of what your <code>package.json</code> file should minimally contain.</p><blockquote><p>Version numbers will vary according to your needs. Normally the latest versions for both <a href="https://github.com/facebook/react/releases" target="_blank">React</a> and <a href="https://github.com/facebook/react-native/releases" target="_blank">React Native</a> will be sufficient.</p></blockquote><span><block class="objc">

</block></span><div class="prism language-javascript"><span class="token punctuation">{</span>
  <span class="token string">"name"</span><span class="token punctuation">:</span> <span class="token string">"NumberTileGame"</span><span class="token punctuation">,</span>
  <span class="token string">"version"</span><span class="token punctuation">:</span> <span class="token string">"0.0.1"</span><span class="token punctuation">,</span>
  <span class="token string">"private"</span><span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
  <span class="token string">"scripts"</span><span class="token punctuation">:</span> <span class="token punctuation">{</span>
    <span class="token string">"start"</span><span class="token punctuation">:</span> <span class="token string">"node node_modules/react-native/local-cli/cli.js start"</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token string">"dependencies"</span><span class="token punctuation">:</span> <span class="token punctuation">{</span>
    <span class="token string">"react"</span><span class="token punctuation">:</span> <span class="token string">"15.0.2"</span><span class="token punctuation">,</span>
    <span class="token string">"react-native"</span><span class="token punctuation">:</span> <span class="token string">"0.26.1"</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><span><block class="swift">

</block></span><div class="prism language-javascript"><span class="token punctuation">{</span>
  <span class="token string">"name"</span><span class="token punctuation">:</span> <span class="token string">"swift-2048"</span><span class="token punctuation">,</span>
  <span class="token string">"version"</span><span class="token punctuation">:</span> <span class="token string">"0.0.1"</span><span class="token punctuation">,</span>
  <span class="token string">"private"</span><span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
  <span class="token string">"scripts"</span><span class="token punctuation">:</span> <span class="token punctuation">{</span>
    <span class="token string">"start"</span><span class="token punctuation">:</span> <span class="token string">"node node_modules/react-native/local-cli/cli.js start"</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token string">"dependencies"</span><span class="token punctuation">:</span> <span class="token punctuation">{</span>
    <span class="token string">"react"</span><span class="token punctuation">:</span> <span class="token string">"15.0.2"</span><span class="token punctuation">,</span>
    <span class="token string">"react-native"</span><span class="token punctuation">:</span> <span class="token string">"0.26.1"</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><span><block class="objc swift">

</block></span><h3><a class="anchor" name="packages-installation"></a>Packages Installation <a class="hash-link" href="docs/integration-with-existing-apps.html#packages-installation">#</a></h3><p>Install the React and React Native modules via the Node package manager. The Node modules will be installed into a <code>node_modules/</code> directory in the root of your project.</p><div class="prism language-javascript"># From the directory containing package<span class="token punctuation">.</span>json project<span class="token punctuation">,</span> install the modules
# The modules will be installed <span class="token keyword">in</span> node_modules<span class="token operator">/</span>
$ npm install</div><h2><a class="anchor" name="react-native-framework"></a>React Native Framework <a class="hash-link" href="docs/integration-with-existing-apps.html#react-native-framework">#</a></h2><p>The React Native Framework was installed as Node module in your project <a href="#package-dependencies" target="">above</a>. We will now install a CocoaPods <code>Podfile</code> with the components you want to use from the framework itself.</p><h3><a class="anchor" name="subspecs"></a>Subspecs <a class="hash-link" href="docs/integration-with-existing-apps.html#subspecs">#</a></h3><p>Before you integrate React Native into your application, you will want to decide what parts of the React Native Framework you would like to integrate. That is where <code>subspec</code>s come in. When you create your <code>Podfile</code>, you are going to specify React Native library dependencies that you will want installed so that your application can use those libraries. Each library will become a <code>subspec</code> in the <code>Podfile</code>.</p><p>The list of supported <code>subspec</code>s are in <a href="https://github.com/facebook/react-native/blob/master/React.podspec" target="_blank"><code>node_modules/react-native/React.podspec</code></a>. They are generally named by functionality. For example, you will generally always want the <code>Core</code> <code>subspec</code>. That will get you the <code>AppRegistry</code>, <code>StyleSheet</code>, <code>View</code> and other core React Native libraries. If you want to add the React Native <code>Text</code> library (e.g., for <code>&lt;Text&gt;</code> elements), then you will need the <code>RCTText</code> <code>subspec</code>. If you want the <code>Image</code> library (e.g., for <code>&lt;Image&gt;</code> elements), then you will need the <code>RCTImage</code> <code>subspec</code>.</p><h4><a class="anchor" name="podfile"></a>Podfile <a class="hash-link" href="docs/integration-with-existing-apps.html#podfile">#</a></h4><p>After you have used Node to install the React and React Native frameworks into the <code>node_modules</code> directory, and you have decided on what React Native elements you want to integrate, you are ready to create your <code>Podfile</code> so you can install those components for use in your application.</p><p>The easiest way to create a <code>Podfile</code> is by using the CocoaPods <code>init</code> command in the native iOS code directory of your project:</p><div class="prism language-javascript">## In the directory where your native iOS code is located <span class="token punctuation">(</span>e<span class="token punctuation">.</span>g<span class="token punctuation">.</span><span class="token punctuation">,</span> where your `<span class="token punctuation">.</span>xcodeproj` file is located<span class="token punctuation">)</span>
$ pod init</div><p>The <code>Podfile</code> will be created and saved in the <em>iOS</em> directory (e.g., <code>ios/</code>) of your current project and will contain a boilerplate setup that you will tweak for your integration purposes. In the end, <code>Podfile</code> should look something similar to this:</p><span><block class="objc">

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

end</div><span><block class="objc swift">

</block></span><h4><a class="anchor" name="pod-installation"></a>Pod Installation <a class="hash-link" href="docs/integration-with-existing-apps.html#pod-installation">#</a></h4><p>After you have created your <code>Podfile</code>, you are ready to install the React Native pod.</p><div class="prism language-javascript">$ pod install</div><p>Your should see output such as:</p><div class="prism language-javascript">Analyzing dependencies
Fetching podspec <span class="token keyword">for</span> `React` from `<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token operator">/</span>node_modules<span class="token operator">/</span>react<span class="token operator">-</span>native`
Downloading dependencies
Installing React <span class="token punctuation">(</span><span class="token number">0.26</span><span class="token punctuation">.</span><span class="token number">0</span><span class="token punctuation">)</span>
Generating Pods project
Integrating client project
Sending stats
Pod installation complete<span class="token operator">!</span> There are <span class="token number">3</span> dependencies from the Podfile and <span class="token number">1</span> total pod installed<span class="token punctuation">.</span></div><span><block class="swift">

</block></span><blockquote><p>If you get a warning such as "<em>The <code>swift-2048 [Debug]</code> target overrides the <code>FRAMEWORK_SEARCH_PATHS</code> build setting defined in <code>Pods/Target Support Files/Pods-swift-2048/Pods-swift-2048.debug.xcconfig</code>. This can lead to problems with the CocoaPods installation</em>", then make sure the <code>Framework Search Paths</code> in <code>Build Settings</code> for both <code>Debug</code> and <code>Release</code> only contain <code>$(inherited)</code>.</p></blockquote><span><block class="objc swift">

</block></span><h2><a class="anchor" name="code-integration"></a>Code Integration <a class="hash-link" href="docs/integration-with-existing-apps.html#code-integration">#</a></h2><p>Now that we have a package foundation, we will actually modify the native application to integrate React Native into the application. For our 2048 app, we will add a "High Score" screen in React Native.</p><h3><a class="anchor" name="the-react-native-component"></a>The React Native component <a class="hash-link" href="docs/integration-with-existing-apps.html#the-react-native-component">#</a></h3><p>The first bit of code we will write is the actual React Native code for the new "High Score" screen that will be integrated into our application.</p><h4><a class="anchor" name="create-a-index-ios-js-file"></a>Create a <code>index.ios.js</code> file <a class="hash-link" href="docs/integration-with-existing-apps.html#create-a-index-ios-js-file">#</a></h4><p>First, create an empty <code>index.ios.js</code> file. For ease, I am doing this in the root of the project.</p><blockquote><p><code>index.ios.js</code> is the starting point for React Native applications on iOS. And it is always required. It can be a small file that <code>require</code>s other file that are part of your React Native component or application, or it can contain all the code that is needed for it. In our case, we will just put everything in <code>index.ios.js</code></p></blockquote><div class="prism language-javascript"># In root of your project
$ touch index<span class="token punctuation">.</span>ios<span class="token punctuation">.</span>js</div><h4><a class="anchor" name="add-your-react-native-code"></a>Add Your React Native Code <a class="hash-link" href="docs/integration-with-existing-apps.html#add-your-react-native-code">#</a></h4><p>In your <code>index.ios.js</code>, create your component. In our sample here, we will add simple <code>&lt;Text&gt;</code> component within a styled <code>&lt;View&gt;</code></p><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

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
</span>AppRegistry<span class="token punctuation">.</span><span class="token function">registerComponent<span class="token punctuation">(</span></span><span class="token string">'RNHighScores'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> RNHighScores<span class="token punctuation">)</span><span class="token punctuation">;</span></div><blockquote><p><code>RNHighScores</code> is the name of your module that will be used when you add a view to React Native from within your iOS application.</p></blockquote><h2><a class="anchor" name="the-magic-rctrootview"></a>The Magic: <code>RCTRootView</code> <a class="hash-link" href="docs/integration-with-existing-apps.html#the-magic-rctrootview">#</a></h2><p>Now that your React Native component is created via <code>index.ios.js</code>, you need to add that component to a new or existing <code>ViewController</code>. The easiest path to take is to optionally create an event path to your component and then add that component to an existing <code>ViewController</code>.</p><p>We will tie our React Native component with a new native view in the <code>ViewController</code> that will actually host it called <code>RCTRootView</code> .</p><h3><a class="anchor" name="create-an-event-path"></a>Create an Event Path <a class="hash-link" href="docs/integration-with-existing-apps.html#create-an-event-path">#</a></h3><p>You can add a new link on the main game menu to go to the "High Score" React Native page.</p><p><img src="img/react-native-add-react-native-integration-link.png" alt="Event Path"></p><h4><a class="anchor" name="event-handler"></a>Event Handler <a class="hash-link" href="docs/integration-with-existing-apps.html#event-handler">#</a></h4><p>We will now add an event handler from the menu link. A method will be added to the main <code>ViewController</code> of your application. This is where <code>RCTRootView</code> comes into play.</p><p>When you build a React Native application, you use the React Native packager to create an <code>index.ios.bundle</code> that will be served by the React Native server. Inside <code>index.ios.bundle</code> will be our <code>RNHighScore</code> module. So, we need to point our <code>RCTRootView</code> to the location of the <code>index.ios.bundle</code> resource (via <code>NSURL</code>) and tie it to the module.</p><p>We will, for debugging purposes, log that the event handler was invoked. Then, we will create a string with the location of our React Native code that exists inside the <code>index.ios.bundle</code>. Finally, we will create the main <code>RCTRootView</code>. Notice how we provide <code>RNHighScores</code> as the <code>moduleName</code> that we created <a href="#the-react-native-component" target="">above</a> when writing the code for our React Native component.</p><span><block class="objc">

</block></span><p>First <code>import</code> the <code>RCTRootView</code> library.</p><div class="prism language-javascript">#import <span class="token string">"RCTRootView.h"</span></div><blockquote><p>The <code>initialProperties</code> are here for illustration purposes so we have some data for our high score screen. In our React Native component, we will use <code>this.props</code> to get access to that data.</p></blockquote><div class="prism language-javascript"><span class="token operator">-</span> <span class="token punctuation">(</span>IBAction<span class="token punctuation">)</span>highScoreButtonPressed<span class="token punctuation">:</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span>sender <span class="token punctuation">{</span>
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
  <span class="token keyword">let</span> jsCodeLocation <span class="token operator">=</span> <span class="token function">NSURL<span class="token punctuation">(</span></span>string<span class="token punctuation">:</span> <span class="token string">"http://localhost:8081/index.ios.bundle?platform=ios"</span><span class="token punctuation">)</span>
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
  self<span class="token punctuation">.</span><span class="token function">presentViewController<span class="token punctuation">(</span></span>vc<span class="token punctuation">,</span> animated<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span> completion<span class="token punctuation">:</span> nil<span class="token punctuation">)</span>
<span class="token punctuation">}</span></div><blockquote><p>Note that <code>RCTRootView bundleURL</code> starts up a new JSC VM. To save resources and simplify the communication between RN views in different parts of your native app, you can have multiple views powered by React Native that are associated with a single JS runtime. To do that, instead of using <code>RCTRootView bundleURL</code>, use <a href="https://github.com/facebook/react-native/blob/master/React/Base/RCTBridge.h#L93" target="_blank"><code>RCTBridge initWithBundleURL</code></a> to create a bridge and then use <code>RCTRootView initWithBridge</code>.</p></blockquote><span><block class="objc">

</block></span><blockquote><p>When moving your app to production, the <code>NSURL</code> can point to a pre-bundled file on disk via something like <code>[[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];</code>. You can use the <code>react-native-xcode.sh</code> script in <code>node_modules/react-native/packager/</code> to generate that pre-bundled file.</p></blockquote><span><block class="swift">

</block></span><blockquote><p>When moving your app to production, the <code>NSURL</code> can point to a pre-bundled file on disk via something like <code>let mainBundle = NSBundle(URLForResource: "main" withExtension:"jsbundle")</code>. You can use the <code>react-native-xcode.sh</code> script in <code>node_modules/react-native/packager/</code> to generate that pre-bundled file.</p></blockquote><span><block class="objc swift">

</block></span><h4><a class="anchor" name="wire-up"></a>Wire Up <a class="hash-link" href="docs/integration-with-existing-apps.html#wire-up">#</a></h4><p>Wire up the new link in the main menu to the newly added event handler method.</p><p><img src="img/react-native-add-react-native-integration-wire-up.png" alt="Event Path"></p><blockquote><p>One of the easier ways to do this is to open the view in the storyboard and right click on the new link. Select something such as the <code>Touch Up Inside</code> event, drag that to the storyboard and then select the created method from the list provided.</p></blockquote><h2><a class="anchor" name="test-your-integration"></a>Test Your Integration <a class="hash-link" href="docs/integration-with-existing-apps.html#test-your-integration">#</a></h2><p>You have now done all the basic steps to integrate React Native with your current application. Now we will start the React Native packager to build the <code>index.ios.bundle</code> packager and the server running on <code>localhost</code> to serve it.</p><h3><a class="anchor" name="app-transport-security"></a>App Transport Security <a class="hash-link" href="docs/integration-with-existing-apps.html#app-transport-security">#</a></h3><p>Apple has blocked implicit cleartext HTTP resource loading. So we need to add the following our project's <code>Info.plist</code> (or equivalent) file.</p><div class="prism language-javascript">&lt;key<span class="token operator">&gt;</span>NSAppTransportSecurity&lt;<span class="token operator">/</span>key<span class="token operator">&gt;</span>
&lt;dict<span class="token operator">&gt;</span>
    &lt;key<span class="token operator">&gt;</span>NSExceptionDomains&lt;<span class="token operator">/</span>key<span class="token operator">&gt;</span>
    &lt;dict<span class="token operator">&gt;</span>
        &lt;key<span class="token operator">&gt;</span>localhost&lt;<span class="token operator">/</span>key<span class="token operator">&gt;</span>
        &lt;dict<span class="token operator">&gt;</span>
            &lt;key<span class="token operator">&gt;</span>NSTemporaryExceptionAllowsInsecureHTTPLoads&lt;<span class="token operator">/</span>key<span class="token operator">&gt;</span>
            &lt;<span class="token boolean">true</span><span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>dict<span class="token operator">&gt;</span>
    &lt;<span class="token operator">/</span>dict<span class="token operator">&gt;</span>
&lt;<span class="token operator">/</span>dict<span class="token operator">&gt;</span></div><h3><a class="anchor" name="run-the-packager"></a>Run the Packager <a class="hash-link" href="docs/integration-with-existing-apps.html#run-the-packager">#</a></h3><div class="prism language-javascript"># From the root of your project<span class="token punctuation">,</span> where the `node_modules` directory is located<span class="token punctuation">.</span>
$ npm start</div><h3><a class="anchor" name="run-the-app"></a>Run the App <a class="hash-link" href="docs/integration-with-existing-apps.html#run-the-app">#</a></h3><p>If you are using Xcode or your favorite editor, build and run your native iOS application as normal. Alternatively, you can run the app from the command line using:</p><div class="prism language-javascript"># From the root of your project
$ react<span class="token operator">-</span>native run<span class="token operator">-</span>ios</div><p>In our sample application, you should see the link to the "High Scores" and then when you click on that you will see the rendering of your React Native component.</p><p>Here is the <em>native</em> application home screen:</p><p><img src="img/react-native-add-react-native-integration-example-home-screen.png" alt="Home Screen"></p><p>Here is the <em>React Native</em> high score screen:</p><p><img src="img/react-native-add-react-native-integration-example-high-scores.png" alt="High Scores"></p><blockquote><p>If you are getting module resolution issues when running your application please see <a href="https://github.com/facebook/react-native/issues/4968" target="_blank">this GitHub issue</a> for information and possible resolution. <a href="https://github.com/facebook/react-native/issues/4968#issuecomment-220941717" target="_blank">This comment</a> seemed to be the latest possible resolution.</p></blockquote><h3><a class="anchor" name="see-the-code"></a>See the Code <a class="hash-link" href="docs/integration-with-existing-apps.html#see-the-code">#</a></h3><span><block class="objc">

</block></span><p>You can examine the code that added the React Native screen on <a href="https://github.com/JoelMarcey/iOS-2048/commit/9ae70c7cdd53eb59f5f7c7daab382b0300ed3585" target="_blank">GitHub</a>.</p><span><block class="swift">

</block></span><p>You can examine the code that added the React Native screen on <a href="https://github.com/JoelMarcey/swift-2048/commit/13272a31ee6dd46dc68b1dcf4eaf16c1a10f5229" target="_blank">GitHub</a>.</p><span><block class="android">

</block></span><h2><a class="anchor" name="add-js-to-your-app"></a>Add JS to your app <a class="hash-link" href="docs/integration-with-existing-apps.html#add-js-to-your-app">#</a></h2><p>In your app's root folder, run:</p><div class="prism language-javascript">$ npm init
$ npm install <span class="token operator">--</span>save react react<span class="token operator">-</span>native
$ curl <span class="token operator">-</span>o <span class="token punctuation">.</span>flowconfig https<span class="token punctuation">:</span><span class="token operator">/</span><span class="token operator">/</span>raw<span class="token punctuation">.</span>githubusercontent<span class="token punctuation">.</span>com<span class="token operator">/</span>facebook<span class="token operator">/</span>react<span class="token operator">-</span>native<span class="token regex">/master/</span><span class="token punctuation">.</span>flowconfig</div><p>This creates a node module for your app and adds the <code>react-native</code> npm dependency. Now open the newly created <code>package.json</code> file and add this under <code>scripts</code>:</p><div class="prism language-javascript"><span class="token string">"start"</span><span class="token punctuation">:</span> <span class="token string">"node node_modules/react-native/local-cli/cli.js start"</span></div><p>Copy &amp; paste the following code to <code>index.android.js</code> in your root folder — it's a barebones React Native app:</p><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

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

AppRegistry<span class="token punctuation">.</span><span class="token function">registerComponent<span class="token punctuation">(</span></span><span class="token string">'HelloWorld'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> HelloWorld<span class="token punctuation">)</span><span class="token punctuation">;</span></div><h2><a class="anchor" name="prepare-your-current-app"></a>Prepare your current app <a class="hash-link" href="docs/integration-with-existing-apps.html#prepare-your-current-app">#</a></h2><p>In your app's <code>build.gradle</code> file add the React Native dependency:</p><div class="prism language-javascript">dependencies <span class="token punctuation">{</span>
    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
    compile <span class="token string">"com.facebook.react:react-native:+"</span><span class="token comment" spellcheck="true"> // From node_modules.
</span><span class="token punctuation">}</span></div><blockquote><p>If you want to ensure that you are always using a specific React Native version in your native build, replace <code>+</code> with an actual React Native version you've downloaded from <code>npm</code>.</p></blockquote><p>In your project's <code>build.gradle</code> file add an entry for the local React Native maven directory:</p><div class="prism language-javascript">allprojects <span class="token punctuation">{</span>
    repositories <span class="token punctuation">{</span>
        <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
        maven <span class="token punctuation">{</span>
           <span class="token comment" spellcheck="true"> // All of React Native (JS, Android binaries) is installed from npm
</span>            url <span class="token string">"$rootDir/../node_modules/react-native/android"</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
    <span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
<span class="token punctuation">}</span></div><blockquote><p>Make sure that the path is correct! You shouldn’t run into any “Failed to resolve: com.facebook.react:react-native:0.x.x" errors after running Gradle sync in Android Studio.</p></blockquote><p>Next, make sure you have the Internet permission in your <code>AndroidManifest.xml</code>:</p><div class="prism language-javascript">&lt;uses<span class="token operator">-</span>permission android<span class="token punctuation">:</span>name<span class="token operator">=</span><span class="token string">"android.permission.INTERNET"</span> <span class="token operator">/</span><span class="token operator">&gt;</span></div><p>If you need to access to the <code>DevSettingsActivity</code> add to your <code>AndroidManifest.xml</code>:</p><div class="prism language-javascript">&lt;activity android<span class="token punctuation">:</span>name<span class="token operator">=</span><span class="token string">"com.facebook.react.devsupport.DevSettingsActivity"</span> <span class="token operator">/</span><span class="token operator">&gt;</span></div><p>This is only really used in dev mode when reloading JavaScript from the development server, so you can strip this in release builds if you need to.</p><h2><a class="anchor" name="add-native-code"></a>Add native code <a class="hash-link" href="docs/integration-with-existing-apps.html#add-native-code">#</a></h2><p>You need to add some native code in order to start the React Native runtime and get it to render something. To do this, we're going to create an <code>Activity</code> that creates a <code>ReactRootView</code>, starts a React application inside it and sets it as the main content view.</p><blockquote><p>If you are targetting Android version &lt;5, use the <code>AppCompatActivity</code> class from the <code>com.android.support:appcompat</code> package instead of <code>Activity</code>.</p></blockquote><div class="prism language-javascript">public class <span class="token class-name">MyReactActivity</span> extends <span class="token class-name">Activity</span> implements <span class="token class-name">DefaultHardwareBackBtnHandler</span> <span class="token punctuation">{</span>
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
        mReactInstanceManager<span class="token punctuation">.</span><span class="token function">onPause<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

@Override
protected void <span class="token function">onResume<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    super<span class="token punctuation">.</span><span class="token function">onResume<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>mReactInstanceManager <span class="token operator">!</span><span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        mReactInstanceManager<span class="token punctuation">.</span><span class="token function">onResume<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

@Override
protected void <span class="token function">onDestroy<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    super<span class="token punctuation">.</span><span class="token function">onDestroy<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>mReactInstanceManager <span class="token operator">!</span><span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        mReactInstanceManager<span class="token punctuation">.</span><span class="token function">onDestroy<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
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
<span class="token punctuation">}</span></div><p>That's it, your activity is ready to run some JavaScript code.</p><h2><a class="anchor" name="run-your-app"></a>Run your app <a class="hash-link" href="docs/integration-with-existing-apps.html#run-your-app">#</a></h2><p>To run your app, you need to first start the development server. To do this, simply run the following command in your root folder:</p><div class="prism language-javascript">$ npm start</div><p>Now build and run your Android app as normal (<code>./gradlew installDebug</code> from command-line; in Android Studio just create debug build as usual).</p><blockquote><p>If you are using Android Studio for your builds and not the Gradle Wrapper directly, make sure you install <a href="https://facebook.github.io/watchman/" target="_blank">watchman</a> before running <code>npm start</code>. It will prevent the packager from crashing due to conflicts between Android Studio and the React Native packager.</p></blockquote><p>Once you reach your React-powered activity inside the app, it should load the JavaScript code from the development server and display:</p><p><img src="img/EmbeddedAppAndroid.png" alt="Screenshot"></p><span><script>
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

</span><h2><a class="anchor" name="creating-a-release-build-in-android-studio"></a>Creating a release build in Android Studio <a class="hash-link" href="docs/integration-with-existing-apps.html#creating-a-release-build-in-android-studio">#</a></h2><p>You can use Android Studio to create your release builds too! It’s as easy as creating release builds of your previously-existing native Android app. There’s just one additional step, which you’ll have to do before every release build. You need to execute the following to create a React Native bundle, which’ll be included with your native Android app:</p><div class="prism language-javascript">$ react<span class="token operator">-</span>native bundle <span class="token operator">--</span>platform android <span class="token operator">--</span>dev <span class="token boolean">false</span> <span class="token operator">--</span>entry<span class="token operator">-</span>file index<span class="token punctuation">.</span>android<span class="token punctuation">.</span>js <span class="token operator">--</span>bundle<span class="token operator">-</span>output android<span class="token operator">/</span>com<span class="token operator">/</span>your<span class="token operator">-</span>company<span class="token operator">-</span>name<span class="token operator">/</span>app<span class="token operator">-</span>package<span class="token operator">-</span>name<span class="token operator">/</span>src<span class="token operator">/</span>main<span class="token operator">/</span>assets<span class="token operator">/</span>index<span class="token punctuation">.</span>android<span class="token punctuation">.</span>bundle <span class="token operator">--</span>assets<span class="token operator">-</span>dest android<span class="token operator">/</span>com<span class="token operator">/</span>your<span class="token operator">-</span>company<span class="token operator">-</span>name<span class="token operator">/</span>app<span class="token operator">-</span>package<span class="token operator">-</span>name<span class="token operator">/</span>src<span class="token operator">/</span>main<span class="token regex">/res/</span></div><p>Don’t forget to replace the paths with correct ones and create the assets folder if it doesn’t exist!</p><p>Now just create a release build of your native app from within Android Studio as usual and you should be good to go!</p></div><div class="docs-prevnext"><a class="docs-prev" href="docs/more-resources.html#content">← Prev</a><a class="docs-next" href="docs/colors.html#content">Next →</a></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/IntegrationWithExistingApps.md">edit the content above on GitHub</a> and send us a pull request!</p>