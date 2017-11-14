---
id: intentandroid

title: intentandroid
---
<a id="content"></a><h1>IntentAndroid</h1><div><div><p><code>IntentAndroid</code> gives you a general interface to handle external links.</p><h3><a class="anchor" name="basic-usage"></a>Basic Usage <a class="hash-link" href="#basic-usage">#</a></h3><h4><a class="anchor" name="handling-deep-links"></a>Handling deep links <a class="hash-link" href="#handling-deep-links">#</a></h4><p>If your app was launched from an external url registered to your app you can
access and handle it from any component you want with</p><div class="prism language-javascript"><span class="token function">componentDidMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">var</span> url <span class="token operator">=</span> IntentAndroid<span class="token punctuation">.</span><span class="token function">getInitialURL<span class="token punctuation">(</span></span>url <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>url<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Initial url is: '</span> <span class="token operator">+</span> url<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><p>NOTE: For instructions on how to add support for deep linking,
refer <a href="http://developer.android.com/training/app-indexing/deep-linking.html#adding-filters" target="_blank">Enabling Deep Links for App Content - Add Intent Filters for Your Deep Links</a>.</p><h4><a class="anchor" name="opening-external-links"></a>Opening external links <a class="hash-link" href="#opening-external-links">#</a></h4><p>To start the corresponding activity for a link (web URL, email, contact etc.), call</p><div class="prism language-javascript">IntentAndroid<span class="token punctuation">.</span><span class="token function">openURL<span class="token punctuation">(</span></span>url<span class="token punctuation">)</span></div><p>If you want to check if any installed app can handle a given URL beforehand you can call</p><div class="prism language-javascript">IntentAndroid<span class="token punctuation">.</span><span class="token function">canOpenURL<span class="token punctuation">(</span></span>url<span class="token punctuation">,</span> <span class="token punctuation">(</span>supported<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
  <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>supported<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Can\'t handle url: '</span> <span class="token operator">+</span> url<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
    IntentAndroid<span class="token punctuation">.</span><span class="token function">openURL<span class="token punctuation">(</span></span>url<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="openurl"></a><span class="propType">static </span>openURL<span class="propType">(url: string)</span> <a class="hash-link" href="#openurl">#</a></h4><div><p>Starts a corresponding external activity for the given URL.</p><p>For example, if the URL is "<a href="https://www.facebook.com">https://www.facebook.com</a>", the system browser will be opened,
or the "choose application" dialog will be shown.</p><p>You can use other URLs, like a location (e.g. "geo:37.484847,-122.148386"), a contact,
or any other URL that can be opened with {@code Intent.ACTION_VIEW}.</p><p>NOTE: This method will fail if the system doesn't know how to open the specified URL.
If you're passing in a non-http(s) URL, it's best to check {@code canOpenURL} first.</p><p>NOTE: For web URLs, the protocol ("http://", "https://") must be set accordingly!</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="canopenurl"></a><span class="propType">static </span>canOpenURL<span class="propType">(url: string, callback: Function)</span> <a class="hash-link" href="#canopenurl">#</a></h4><div><p>Determine whether or not an installed app can handle a given URL.</p><p>You can use other URLs, like a location (e.g. "geo:37.484847,-122.148386"), a contact,
or any other URL that can be opened with {@code Intent.ACTION_VIEW}.</p><p>NOTE: For web URLs, the protocol ("http://", "https://") must be set accordingly!</p><p>@param URL the URL to open</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="getinitialurl"></a><span class="propType">static </span>getInitialURL<span class="propType">(callback: Function)</span> <a class="hash-link" href="#getinitialurl">#</a></h4><div><p>If the app launch was triggered by an app link with {@code Intent.ACTION_VIEW},
it will give the link url, otherwise it will give <code>null</code></p><p>Refer <a href="http://developer.android.com/training/app-indexing/deep-linking.html#handling-intents">http://developer.android.com/training/app-indexing/deep-linking.html#handling-intents</a></p></div></div></div></span></div><div><h3><a class="anchor" name="examples"></a><a class="edit-github" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/IntentAndroidExample.android.js">Edit on GitHub</a>Examples <a class="hash-link" href="#examples">#</a></h3><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  IntentAndroid<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableNativeFeedback<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>
<span class="token keyword">var</span> UIExplorerBlock <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./UIExplorerBlock'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> OpenURLButton <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>

  propTypes<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    url<span class="token punctuation">:</span> React<span class="token punctuation">.</span>PropTypes<span class="token punctuation">.</span>string<span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  handleClick<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    IntentAndroid<span class="token punctuation">.</span><span class="token function">canOpenURL<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>url<span class="token punctuation">,</span> <span class="token punctuation">(</span>supported<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">if</span> <span class="token punctuation">(</span>supported<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        IntentAndroid<span class="token punctuation">.</span><span class="token function">openURL<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>url<span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
        console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Don\'t know how to open URI: '</span> <span class="token operator">+</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>url<span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;TouchableNativeFeedback
        onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>handleClick<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>text<span class="token punctuation">}</span><span class="token operator">&gt;</span>Open <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>url<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>TouchableNativeFeedback<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> IntentAndroidExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>

  statics<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'IntentAndroid'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Shows how to use Android Intents to open URLs.'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Open external URLs"</span><span class="token operator">&gt;</span>
        &lt;OpenURLButton url<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">'https://www.facebook.com'</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;OpenURLButton url<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">'http://www.facebook.com'</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;OpenURLButton url<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">'http://facebook.com'</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;OpenURLButton url<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">'geo:37.484847,-122.148386'</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  container<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'white'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
    paddingTop<span class="token punctuation">:</span> <span class="token number">30</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  button<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    padding<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#3B5998'</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  text<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    color<span class="token punctuation">:</span> <span class="token string">'white'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

module<span class="token punctuation">.</span>exports <span class="token operator">=</span> IntentAndroidExample<span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="interactionmanager.html#content">Next →</a></div>