---
id: sample-application-movies
title: sample-application-movies
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="movie-fetcher"></a>Movie Fetcher <a class="hash-link" href="docs/sample-application-movies.html#movie-fetcher">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.27-stable/docs/SampleApplication-Movies.md">Edit on GitHub</a></td></tr></tbody></table><div><h2><a class="anchor" name="overview"></a>Overview <a class="hash-link" href="docs/sample-application-movies.html#overview">#</a></h2><p>In this tutorial we'll be building a simple version of a Movies app that fetches 25 movies that are in theaters and displays them in a <code>ListView</code>.</p><h2><a class="anchor" name="setup"></a>Setup <a class="hash-link" href="docs/sample-application-movies.html#setup">#</a></h2><blockquote><p>This sample application requires the basic setup explained at
<a href="docs/quick-start/getting-started.html#content" target="_blank">React Native Getting Started</a>.</p></blockquote><p>After installing these dependencies there are two simple commands to get a React Native project all set up for development.</p><ol><li><p><code>npm install -g react-native-cli</code></p><p> react-native-cli is a command line interface that does the rest of the set up. It’s installable via npm. This will install <code>react-native</code> as a command in your terminal. You only ever need to do this once.</p></li><li><p><code>react-native init SampleAppMovies</code></p><p> This command fetches the React Native source code and dependencies and then creates a new Xcode project in <code>SampleAppMovies/iOS/SampleAppMovies.xcodeproj</code> and a gradle project in <code>SampleAppMovies/android/app</code>.</p></li></ol><h3><a class="anchor" name="starting-the-app-on-ios"></a>Starting the app on iOS <a class="hash-link" href="docs/sample-application-movies.html#starting-the-app-on-ios">#</a></h3><p>Open this new project (<code>SampleAppMovies/ios/SampleAppMovies.xcodeproj</code>) in Xcode and simply build and run it with <code>⌘+R</code>. Doing so will also start a Node server which enables live code reloading. With this you can see your changes by pressing <code>⌘+R</code> in the simulator rather than recompiling in Xcode.</p><h3><a class="anchor" name="starting-the-app-on-android"></a>Starting the app on Android <a class="hash-link" href="docs/sample-application-movies.html#starting-the-app-on-android">#</a></h3><p>In your terminal navigate into the <code>SampleAppMovies</code> and run:</p><div class="prism language-javascript">react<span class="token operator">-</span>native run<span class="token operator">-</span>android</div><p>This will install the generated app on your emulator or device, as well as start the Node server which enables live code reloading. To see your changes you have to open the rage-shake-menu (either shake the device or press the menu button on devices, press F2 or Page Up for emulator, ⌘+M for Genymotion), and then press <code>Reload JS</code>.</p><h3><a class="anchor" name="hello-world"></a>Hello World <a class="hash-link" href="docs/sample-application-movies.html#hello-world">#</a></h3><p><code>react-native init</code> will generate an app with the name of your project, in this case <code>SampleAppMovies</code>. This is a simple hello world app. For iOS, you can edit <code>index.ios.js</code> to make changes to the app and then press ⌘+R in the simulator to see the changes. For Android, you can edit <code>index.android.js</code> to make changes to the app and press <code>Reload JS</code> from the rage shake menu to see the changes.</p><h2><a class="anchor" name="actual-app"></a>Actual App <a class="hash-link" href="docs/sample-application-movies.html#actual-app">#</a></h2><p>Now that we have initialized our React Native project, we can begin creating our Movie application.</p><h3><a class="anchor" name="mocking-data"></a>Mocking data <a class="hash-link" href="docs/sample-application-movies.html#mocking-data">#</a></h3><p>Before we write the code to fetch actual Rotten Tomatoes data let's mock some data so we can get our hands dirty with React Native. At Facebook we typically declare constants at the top of JS files, just below the imports, but feel free to add the following constant wherever you like. In <code>index.ios.js</code> or <code>index.android.js</code> :</p><div class="prism language-javascript"><span class="token keyword">var</span> MOCKED_MOVIES_DATA <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>title<span class="token punctuation">:</span> <span class="token string">'Title'</span><span class="token punctuation">,</span> year<span class="token punctuation">:</span> <span class="token string">'2015'</span><span class="token punctuation">,</span> posters<span class="token punctuation">:</span> <span class="token punctuation">{</span>thumbnail<span class="token punctuation">:</span> <span class="token string">'http://i.imgur.com/UePbdph.jpg'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div><h3><a class="anchor" name="render-a-movie"></a>Render a movie <a class="hash-link" href="docs/sample-application-movies.html#render-a-movie">#</a></h3><p>We're going to render the title, year, and thumbnail for the movie. Since thumbnail is an Image component in React Native, add Image to the list of React imports below.</p><div class="prism language-javascript">import React<span class="token punctuation">,</span> <span class="token punctuation">{</span>
  Component<span class="token punctuation">,</span>
<span class="token punctuation">}</span> from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span>
  AppRegistry<span class="token punctuation">,</span>
  Image<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span></div><p>Now change the render function so that we're rendering the data mentioned above rather than hello world.</p><div class="prism language-javascript">  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> movie <span class="token operator">=</span> MOCKED_MOVIES_DATA<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span>movie<span class="token punctuation">.</span>title<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span>movie<span class="token punctuation">.</span>year<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Image source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> movie<span class="token punctuation">.</span>posters<span class="token punctuation">.</span>thumbnail<span class="token punctuation">}</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span></div><p>Press <code>⌘+R</code> / <code>Reload JS</code> and you should see "Title" above "2015". Notice that the Image doesn't render anything. This is because we haven't specified the width and height of the image we want to render. This is done via styles. While we're changing the styles let's also clean up the styles we're no longer using.</p><div class="prism language-javascript"><span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  container<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#F5FCFF'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  thumbnail<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> <span class="token number">53</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">81</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>And lastly we need to apply this style to the Image component:</p><div class="prism language-javascript">        &lt;Image
          source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> movie<span class="token punctuation">.</span>posters<span class="token punctuation">.</span>thumbnail<span class="token punctuation">}</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>thumbnail<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span></div><p>Press <code>⌘+R</code> / <code>Reload JS</code> and the image should now render.</p><span><div class="tutorial-mock">
  <img src="img/TutorialMock.png">
  <img src="img/TutorialMock2.png">
</div>


</span><h3><a class="anchor" name="add-some-styling"></a>Add some styling <a class="hash-link" href="docs/sample-application-movies.html#add-some-styling">#</a></h3><p>Great, we've rendered our data. Now let's make it look better. I'd like to put the text to the right of the image and make the title larger and centered within that area:</p><div class="prism language-javascript"><span class="token operator">+-</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span>
<span class="token operator">|</span><span class="token operator">+-</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">++</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">|</span>
<span class="token operator">||</span>       <span class="token operator">||</span>        Title         <span class="token operator">||</span>
<span class="token operator">||</span> Image <span class="token operator">||</span>                      <span class="token operator">||</span>
<span class="token operator">||</span>       <span class="token operator">||</span>        Year          <span class="token operator">||</span>
<span class="token operator">|</span><span class="token operator">+-</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">++</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span><span class="token operator">|</span>
<span class="token operator">+-</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">--</span><span class="token operator">+</span></div><p>We'll need to add another container in order to vertically lay out components within horizontally laid out components.</p><div class="prism language-javascript">      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Image
            source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> movie<span class="token punctuation">.</span>posters<span class="token punctuation">.</span>thumbnail<span class="token punctuation">}</span><span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>thumbnail<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>rightContainer<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>title<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span>movie<span class="token punctuation">.</span>title<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>year<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span>movie<span class="token punctuation">.</span>year<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span></div><p>Not too much has changed, we added a container around the Texts and then moved them after the Image (because they're to the right of the Image). Let's see what the style changes look like:</p><div class="prism language-javascript">  container<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#F5FCFF'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span></div><p>We use FlexBox for layout - see <a href="https://css-tricks.com/snippets/css/a-guide-to-flexbox/" target="_blank">this great guide</a> to learn more about it.</p><p>In the above code snippet, we simply added <code>flexDirection: 'row'</code> that will make children of our main container to be layed out horizontally instead of vertically.</p><p>Now add another style to the JS <code>style</code> object:</p><div class="prism language-javascript">  rightContainer<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span></div><p>This means that the <code>rightContainer</code> takes up the remaining space in the parent container that isn't taken up by the Image. If this doesn't make sense, add a <code>backgroundColor</code> to <code>rightContainer</code> and then try removing the <code>flex: 1</code>. You'll see that this causes the container's size to be the minimum size that fits its children.</p><p>Styling the text is pretty straightforward:</p><div class="prism language-javascript">  title<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">8</span><span class="token punctuation">,</span>
    textAlign<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  year<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    textAlign<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span></div><p>Go ahead and press <code>⌘+R</code> / <code>Reload JS</code> and you'll see the updated view.</p><span><div class="tutorial-mock">
  <img src="img/TutorialStyledMock.png">
  <img src="img/TutorialStyledMock2.png">
</div>

</span><h3><a class="anchor" name="fetching-real-data"></a>Fetching real data <a class="hash-link" href="docs/sample-application-movies.html#fetching-real-data">#</a></h3><p>Fetching data from Rotten Tomatoes's API isn't really relevant to learning React Native so feel free to breeze through this section.</p><p>Add the following constants to the top of the file (typically below the imports) to create the <code>REQUEST_URL</code>s used to request data with.</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">/**
 * For quota reasons we replaced the Rotten Tomatoes' API with a sample data of
 * their very own API that lives in React Native's Github repo.
 */</span>
<span class="token keyword">var</span> REQUEST_URL <span class="token operator">=</span> <span class="token string">'https://raw.githubusercontent.com/facebook/react-native/master/docs/MoviesExample.json'</span><span class="token punctuation">;</span></div><p>Add some initial state to our application so that we can check <code>this.state.movies === null</code> to determine whether the movies data has been loaded or not. We can set this data when the response comes back with <code>this.setState({movies: moviesData})</code>. Add this code just above the render function inside our React class.</p><div class="prism language-javascript">  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>
      movies<span class="token punctuation">:</span> <span class="token keyword">null</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span></div><p>We want to send off the request after the component has finished loading. <code>componentDidMount</code> is a function of React components that React will call exactly once, just after the component has been loaded.</p><div class="prism language-javascript">  <span class="token function">componentDidMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">fetchData<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span></div><p>Now add <code>fetchData</code> function used above to our main component. This method will be responsible for handling data fetching. All you need to do is call <code>this.setState({movies: data})</code> after resolving the promise chain because the way React works is that <code>setState</code> actually triggers a re-render and then the render function will notice that <code>this.state.movies</code> is no longer <code>null</code>.  Note that we call <code>done()</code> at the end of the promise chain - always make sure to call <code>done()</code> or any errors thrown will get swallowed.</p><div class="prism language-javascript">  <span class="token function">fetchData<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">fetch<span class="token punctuation">(</span></span>REQUEST_URL<span class="token punctuation">)</span>
      <span class="token punctuation">.</span><span class="token function">then<span class="token punctuation">(</span></span><span class="token punctuation">(</span>response<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> response<span class="token punctuation">.</span><span class="token function">json<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">)</span>
      <span class="token punctuation">.</span><span class="token function">then<span class="token punctuation">(</span></span><span class="token punctuation">(</span>responseData<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
          movies<span class="token punctuation">:</span> responseData<span class="token punctuation">.</span>movies<span class="token punctuation">,</span>
        <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span>
      <span class="token punctuation">.</span><span class="token function">done<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span></div><p>Now modify the render function to render a loading view if we don't have any movies data, and to render the first movie otherwise.</p><div class="prism language-javascript">  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>movies<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">renderLoadingView<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">var</span> movie <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>movies<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">renderMovie<span class="token punctuation">(</span></span>movie<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">renderLoadingView<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          Loading movies<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">renderMovie<span class="token punctuation">(</span></span>movie<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Image
          source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> movie<span class="token punctuation">.</span>posters<span class="token punctuation">.</span>thumbnail<span class="token punctuation">}</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>thumbnail<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>rightContainer<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>title<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span>movie<span class="token punctuation">.</span>title<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>year<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span>movie<span class="token punctuation">.</span>year<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span></div><p>Now press <code>⌘+R</code> / <code>Reload JS</code> and you should see "Loading movies..." until the response comes back, then it will render the first movie it fetched from Rotten Tomatoes.</p><span><div class="tutorial-mock">
  <img src="img/TutorialSingleFetched.png">
  <img src="img/TutorialSingleFetched2.png">
</div>

</span><h2><a class="anchor" name="listview"></a>ListView <a class="hash-link" href="docs/sample-application-movies.html#listview">#</a></h2><p>Let's now modify this application to render all of this data in a <code>ListView</code> component, rather than just rendering the first movie.</p><p>Why is a <code>ListView</code> better than just rendering all of these elements or putting them in a <code>ScrollView</code>? Despite React being fast, rendering a possibly infinite list of elements could be slow. <code>ListView</code> schedules rendering of views so that you only display the ones on screen and those already rendered but off screen are removed from the native view hierarchy.</p><p>First things first: add the <code>ListView</code> import to the top of the file.</p><div class="prism language-javascript">import React<span class="token punctuation">,</span> <span class="token punctuation">{</span>
  Component<span class="token punctuation">,</span>
<span class="token punctuation">}</span> from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span>
  AppRegistry<span class="token punctuation">,</span>
  Image<span class="token punctuation">,</span>
  ListView<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span></div><p>Now modify the render function so that once we have our data it renders a ListView of movies instead of a single movie.</p><div class="prism language-javascript">  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>loaded<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">renderLoadingView<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;ListView
        dataSource<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>dataSource<span class="token punctuation">}</span>
        renderRow<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>renderMovie<span class="token punctuation">}</span>
        style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>listView<span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span></div><p>The <code>dataSource</code> is an interface that <code>ListView</code> is using to determine which rows have changed over the course of updates.</p><p>You'll notice we used <code>dataSource</code> from <code>this.state</code>. The next step is to add an empty <code>dataSource</code> to the object returned by <code>constructor</code>. Also, now that we're storing the data in <code>dataSource</code>, we should no longer use <code>this.state.movies</code> to avoid storing data twice. We can use boolean property of the state (<code>this.state.loaded</code>) to tell whether data fetching has finished.</p><div class="prism language-javascript">  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>
      dataSource<span class="token punctuation">:</span> <span class="token keyword">new</span> <span class="token class-name">ListView<span class="token punctuation">.</span>DataSource</span><span class="token punctuation">(</span><span class="token punctuation">{</span>
        rowHasChanged<span class="token punctuation">:</span> <span class="token punctuation">(</span>row1<span class="token punctuation">,</span> row2<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> row1 <span class="token operator">!</span><span class="token operator">==</span> row2<span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
      loaded<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span></div><p>And here is the modified <code>fetchData</code> method that updates the state accordingly:</p><div class="prism language-javascript">  <span class="token function">fetchData<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">fetch<span class="token punctuation">(</span></span>REQUEST_URL<span class="token punctuation">)</span>
      <span class="token punctuation">.</span><span class="token function">then<span class="token punctuation">(</span></span><span class="token punctuation">(</span>response<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> response<span class="token punctuation">.</span><span class="token function">json<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">)</span>
      <span class="token punctuation">.</span><span class="token function">then<span class="token punctuation">(</span></span><span class="token punctuation">(</span>responseData<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
          dataSource<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>dataSource<span class="token punctuation">.</span><span class="token function">cloneWithRows<span class="token punctuation">(</span></span>responseData<span class="token punctuation">.</span>movies<span class="token punctuation">)</span><span class="token punctuation">,</span>
          loaded<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span>
      <span class="token punctuation">.</span><span class="token function">done<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span></div><p>Finally, we add styles for the <code>ListView</code> component to the <code>styles</code> JS object:</p><div class="prism language-javascript">  listView<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    paddingTop<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#F5FCFF'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span></div><p>And here's the final result:</p><span><div class="tutorial-mock">
  <img src="img/TutorialFinal.png">
  <img src="img/TutorialFinal2.png">
</div>

</span><p>There's still some work to be done to make it a fully functional app such as: adding navigation, search, infinite scroll loading, etc. Check the <a href="https://github.com/facebook/react-native/tree/master/Examples/Movies" target="_blank">Movies Example</a> to see it all working.</p><h3><a class="anchor" name="final-source-code"></a>Final source code <a class="hash-link" href="docs/sample-application-movies.html#final-source-code">#</a></h3><div class="prism language-javascript"><span class="token comment" spellcheck="true">/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */</span>

import React<span class="token punctuation">,</span> <span class="token punctuation">{</span>
  Component<span class="token punctuation">,</span>
<span class="token punctuation">}</span> from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span>
  AppRegistry<span class="token punctuation">,</span>
  Image<span class="token punctuation">,</span>
  ListView<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> REQUEST_URL <span class="token operator">=</span> <span class="token string">'https://raw.githubusercontent.com/facebook/react-native/master/docs/MoviesExample.json'</span><span class="token punctuation">;</span>

class <span class="token class-name">SampleAppMovies</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>
      dataSource<span class="token punctuation">:</span> <span class="token keyword">new</span> <span class="token class-name">ListView<span class="token punctuation">.</span>DataSource</span><span class="token punctuation">(</span><span class="token punctuation">{</span>
        rowHasChanged<span class="token punctuation">:</span> <span class="token punctuation">(</span>row1<span class="token punctuation">,</span> row2<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> row1 <span class="token operator">!</span><span class="token operator">==</span> row2<span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
      loaded<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">componentDidMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">fetchData<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">fetchData<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">fetch<span class="token punctuation">(</span></span>REQUEST_URL<span class="token punctuation">)</span>
      <span class="token punctuation">.</span><span class="token function">then<span class="token punctuation">(</span></span><span class="token punctuation">(</span>response<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> response<span class="token punctuation">.</span><span class="token function">json<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">)</span>
      <span class="token punctuation">.</span><span class="token function">then<span class="token punctuation">(</span></span><span class="token punctuation">(</span>responseData<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
          dataSource<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>dataSource<span class="token punctuation">.</span><span class="token function">cloneWithRows<span class="token punctuation">(</span></span>responseData<span class="token punctuation">.</span>movies<span class="token punctuation">)</span><span class="token punctuation">,</span>
          loaded<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span>
      <span class="token punctuation">.</span><span class="token function">done<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>loaded<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">renderLoadingView<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;ListView
        dataSource<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>dataSource<span class="token punctuation">}</span>
        renderRow<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>renderMovie<span class="token punctuation">}</span>
        style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>listView<span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">renderLoadingView<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          Loading movies<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">renderMovie<span class="token punctuation">(</span></span>movie<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>container<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Image
          source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> movie<span class="token punctuation">.</span>posters<span class="token punctuation">.</span>thumbnail<span class="token punctuation">}</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>thumbnail<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>rightContainer<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>title<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span>movie<span class="token punctuation">.</span>title<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>year<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span>movie<span class="token punctuation">.</span>year<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  container<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#F5FCFF'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  rightContainer<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  title<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">8</span><span class="token punctuation">,</span>
    textAlign<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  year<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    textAlign<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  thumbnail<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> <span class="token number">53</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">81</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  listView<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    paddingTop<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#F5FCFF'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

AppRegistry<span class="token punctuation">.</span><span class="token function">registerComponent<span class="token punctuation">(</span></span><span class="token string">'SampleAppMovies'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> SampleAppMovies<span class="token punctuation">)</span><span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/sample-application-f8.html#content">Next →</a></div><div class="survey"><div class="survey-image"></div><p>We are planning improvements to the React Native documentation. Your responses to this short survey will go a long way in helping us provide valuable content. Thank you!</p><center><a class="button" href="https://www.facebook.com/survey?oid=681969738611332">Take Survey</a></center></div>