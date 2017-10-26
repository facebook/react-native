---
id: netinfo
title: netinfo
---
<a id="content"></a><h1><a class="anchor" name="netinfo"></a>NetInfo <a class="hash-link" href="docs/netinfo.html#netinfo">#</a></h1><div><div><p>NetInfo exposes info about online/offline status</p><div class="prism language-javascript">NetInfo<span class="token punctuation">.</span><span class="token function">getConnectionInfo</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">then</span><span class="token punctuation">(</span><span class="token punctuation">(</span>connectionInfo<span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Initial, type: '</span> <span class="token operator">+</span> connectionInfo<span class="token punctuation">.</span>type <span class="token operator">+</span> <span class="token string">', effectiveType: '</span> <span class="token operator">+</span> connectionInfo<span class="token punctuation">.</span>effectiveType<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">function</span> <span class="token function">handleFirstConnectivityChange</span><span class="token punctuation">(</span>connectionInfo<span class="token punctuation">)</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'First change, type: '</span> <span class="token operator">+</span> connectionInfo<span class="token punctuation">.</span>type <span class="token operator">+</span> <span class="token string">', effectiveType: '</span> <span class="token operator">+</span> connectionInfo<span class="token punctuation">.</span>effectiveType<span class="token punctuation">)</span><span class="token punctuation">;</span>
  NetInfo<span class="token punctuation">.</span><span class="token function">removeEventListener</span><span class="token punctuation">(</span>
    <span class="token string">'connectionChange'</span><span class="token punctuation">,</span>
    handleFirstConnectivityChange
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
NetInfo<span class="token punctuation">.</span><span class="token function">addEventListener</span><span class="token punctuation">(</span>
  <span class="token string">'connectionChange'</span><span class="token punctuation">,</span>
  handleFirstConnectivityChange
<span class="token punctuation">)</span><span class="token punctuation">;</span></div><h3><a class="anchor" name="connectiontype-enum"></a>ConnectionType enum <a class="hash-link" href="docs/netinfo.html#connectiontype-enum">#</a></h3><p><code>ConnectionType</code> describes the type of connection the device is using to communicate with the network.</p><p>Cross platform values for <code>ConnectionType</code>:
- <code>none</code> - device is offline
- <code>wifi</code> - device is online and connected via wifi, or is the iOS simulator
- <code>cellular</code> - device is connected via Edge, 3G, WiMax, or LTE
- <code>unknown</code> - error case and the network status is unknown</p><p>Android-only values for <code>ConnectionType</code>:
- <code>bluetooth</code> - device is connected via Bluetooth
- <code>ethernet</code> - device is connected via Ethernet
- <code>wimax</code> - device is connected via WiMAX</p><h3><a class="anchor" name="effectiveconnectiontype-enum"></a>EffectiveConnectionType enum <a class="hash-link" href="docs/netinfo.html#effectiveconnectiontype-enum">#</a></h3><p>Cross platform values for <code>EffectiveConnectionType</code>:
- <code>2g</code>
- <code>3g</code>
- <code>4g</code>
- <code>unknown</code></p><h3><a class="anchor" name="android"></a>Android <a class="hash-link" href="docs/netinfo.html#android">#</a></h3><p>To request network info, you need to add the following line to your
app's <code>AndroidManifest.xml</code>:</p><p><code>&lt;uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" /&gt;</code></p><h3><a class="anchor" name="isconnectionexpensive"></a>isConnectionExpensive <a class="hash-link" href="docs/netinfo.html#isconnectionexpensive">#</a></h3><p>Available on Android. Detect if the current active connection is metered or not. A network is
classified as metered when the user is sensitive to heavy data usage on that connection due to
monetary costs, data limitations or battery/performance issues.</p><div class="prism language-javascript">NetInfo<span class="token punctuation">.</span><span class="token function">isConnectionExpensive</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token punctuation">.</span><span class="token function">then</span><span class="token punctuation">(</span>isConnectionExpensive <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Connection is '</span> <span class="token operator">+</span> <span class="token punctuation">(</span>isConnectionExpensive <span class="token operator">?</span> <span class="token string">'Expensive'</span> <span class="token punctuation">:</span> <span class="token string">'Not Expensive'</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span>
<span class="token punctuation">.</span><span class="token keyword">catch</span><span class="token punctuation">(</span>error <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">error</span><span class="token punctuation">(</span>error<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><h3><a class="anchor" name="isconnected"></a>isConnected <a class="hash-link" href="docs/netinfo.html#isconnected">#</a></h3><p>Available on all platforms. Asynchronously fetch a boolean to determine
internet connectivity.</p><div class="prism language-javascript">NetInfo<span class="token punctuation">.</span>isConnected<span class="token punctuation">.</span><span class="token function">fetch</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">then</span><span class="token punctuation">(</span>isConnected <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'First, is '</span> <span class="token operator">+</span> <span class="token punctuation">(</span>isConnected <span class="token operator">?</span> <span class="token string">'online'</span> <span class="token punctuation">:</span> <span class="token string">'offline'</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">function</span> <span class="token function">handleFirstConnectivityChange</span><span class="token punctuation">(</span>isConnected<span class="token punctuation">)</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Then, is '</span> <span class="token operator">+</span> <span class="token punctuation">(</span>isConnected <span class="token operator">?</span> <span class="token string">'online'</span> <span class="token punctuation">:</span> <span class="token string">'offline'</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  NetInfo<span class="token punctuation">.</span>isConnected<span class="token punctuation">.</span><span class="token function">removeEventListener</span><span class="token punctuation">(</span>
    <span class="token string">'change'</span><span class="token punctuation">,</span>
    handleFirstConnectivityChange
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
NetInfo<span class="token punctuation">.</span>isConnected<span class="token punctuation">.</span><span class="token function">addEventListener</span><span class="token punctuation">(</span>
  <span class="token string">'change'</span><span class="token punctuation">,</span>
  handleFirstConnectivityChange
<span class="token punctuation">)</span><span class="token punctuation">;</span></div><h3><a class="anchor" name="connectivity-types-deprecated"></a>Connectivity Types (deprecated) <a class="hash-link" href="docs/netinfo.html#connectivity-types-deprecated">#</a></h3><p>The following connectivity types are deprecated. They're used by the deprecated APIs <code>fetch</code> and the <code>change</code> event.</p><p>iOS connectivity types (deprecated):
- <code>none</code> - device is offline
- <code>wifi</code> - device is online and connected via wifi, or is the iOS simulator
- <code>cell</code> - device is connected via Edge, 3G, WiMax, or LTE
- <code>unknown</code> - error case and the network status is unknown</p><p>Android connectivity types (deprecated).
- <code>NONE</code> - device is offline
- <code>BLUETOOTH</code> - The Bluetooth data connection.
- <code>DUMMY</code> -  Dummy data connection.
- <code>ETHERNET</code> - The Ethernet data connection.
- <code>MOBILE</code> - The Mobile data connection.
- <code>MOBILE_DUN</code> - A DUN-specific Mobile data connection.
- <code>MOBILE_HIPRI</code> - A High Priority Mobile data connection.
- <code>MOBILE_MMS</code> - An MMS-specific Mobile data connection.
- <code>MOBILE_SUPL</code> -  A SUPL-specific Mobile data connection.
- <code>VPN</code> -  A virtual network using one or more native bearers. Requires API Level 21
- <code>WIFI</code> - The WIFI data connection.
- <code>WIMAX</code> -  The WiMAX data connection.
- <code>UNKNOWN</code> - Unknown data connection.</p><p>The rest of the connectivity types are hidden by the Android API, but can be used if necessary.</p></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/netinfo.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="addeventlistener"></a><span class="methodType">static </span>addEventListener<span class="methodType">(eventName, handler)</span> <a class="hash-link" href="docs/netinfo.html#addeventlistener">#</a></h4><div><p>Adds an event handler. Supported events:</p><ul><li><code>connectionChange</code>: Fires when the network status changes. The argument to the event
handler is an object with keys:<ul><li><code>type</code>: A <code>ConnectionType</code> (listed above)</li><li><code>effectiveType</code>: An <code>EffectiveConnectionType</code> (listed above)</li></ul></li><li><code>change</code>: This event is deprecated. Listen to <code>connectionChange</code> instead. Fires when
the network status changes. The argument to the event handler is one of the deprecated
connectivity types listed above.</li></ul></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="removeeventlistener"></a><span class="methodType">static </span>removeEventListener<span class="methodType">(eventName, handler)</span> <a class="hash-link" href="docs/netinfo.html#removeeventlistener">#</a></h4><div><p>Removes the listener for network status changes.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="fetch"></a><span class="methodType">static </span>fetch<span class="methodType">()</span> <a class="hash-link" href="docs/netinfo.html#fetch">#</a></h4><div><p>This function is deprecated. Use <code>getConnectionInfo</code> instead. Returns a promise that
resolves with one of the deprecated connectivity types listed above.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="getconnectioninfo"></a><span class="methodType">static </span>getConnectionInfo<span class="methodType">()</span> <a class="hash-link" href="docs/netinfo.html#getconnectioninfo">#</a></h4><div><p>Returns a promise that resolves to an object with <code>type</code> and <code>effectiveType</code> keys
whose values are a <code>ConnectionType</code> and an <code>EffectiveConnectionType</code>, (described above),
respectively.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="isconnectionexpensive"></a><span class="methodType">static </span>isConnectionExpensive<span class="methodType">()</span> <a class="hash-link" href="docs/netinfo.html#isconnectionexpensive">#</a></h4></div></div></span><span><h3><a class="anchor" name="properties"></a>Properties <a class="hash-link" href="docs/netinfo.html#properties">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="isconnected"></a>isConnected<span class="propType">: ObjectExpression</span> <a class="hash-link" href="docs/netinfo.html#isconnected">#</a></h4><div><p>An object with the same methods as above but the listener receives a
boolean which represents the internet connectivity.
Use this if you are only interested with whether the device has internet
connectivity.</p></div></div></div></span></div><p class="edit-page-block"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Network/NetInfo.js">Improve this page</a> by sending a pull request!</p><div class="docs-prevnext"><a class="docs-prev" href="docs/linking.html#content">← Prev</a><a class="docs-next" href="docs/panresponder.html#content">Next →</a></div>