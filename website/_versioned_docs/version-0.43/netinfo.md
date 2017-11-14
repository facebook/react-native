---
id: version-0.43-netinfo
original_id: netinfo
title: netinfo
---
<a id="content"></a><h1><a class="anchor" name="netinfo"></a>NetInfo <a class="hash-link" href="docs/netinfo.html#netinfo">#</a></h1><div><div><p>NetInfo exposes info about online/offline status</p><div class="prism language-javascript">NetInfo<span class="token punctuation">.</span><span class="token function">fetch<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">done<span class="token punctuation">(</span></span><span class="token punctuation">(</span>reach<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Initial: '</span> <span class="token operator">+</span> reach<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">function</span> <span class="token function">handleFirstConnectivityChange<span class="token punctuation">(</span></span>reach<span class="token punctuation">)</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'First change: '</span> <span class="token operator">+</span> reach<span class="token punctuation">)</span><span class="token punctuation">;</span>
  NetInfo<span class="token punctuation">.</span><span class="token function">removeEventListener<span class="token punctuation">(</span></span>
    <span class="token string">'change'</span><span class="token punctuation">,</span>
    handleFirstConnectivityChange
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
NetInfo<span class="token punctuation">.</span><span class="token function">addEventListener<span class="token punctuation">(</span></span>
  <span class="token string">'change'</span><span class="token punctuation">,</span>
  handleFirstConnectivityChange
<span class="token punctuation">)</span><span class="token punctuation">;</span></div><h3><a class="anchor" name="ios"></a>IOS <a class="hash-link" href="docs/netinfo.html#ios">#</a></h3><p>Asynchronously determine if the device is online and on a cellular network.</p><ul><li><code>none</code> - device is offline</li><li><code>wifi</code> - device is online and connected via wifi, or is the iOS simulator</li><li><code>cell</code> - device is connected via Edge, 3G, WiMax, or LTE</li><li><code>unknown</code> - error case and the network status is unknown</li></ul><h3><a class="anchor" name="android"></a>Android <a class="hash-link" href="docs/netinfo.html#android">#</a></h3><p>To request network info, you need to add the following line to your
app's <code>AndroidManifest.xml</code>:</p><p><code>&lt;uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" /&gt;</code>
Asynchronously determine if the device is connected and details about that connection.</p><p>Android Connectivity Types.</p><ul><li><code>NONE</code> - device is offline</li><li><code>BLUETOOTH</code> - The Bluetooth data connection.</li><li><code>DUMMY</code> -  Dummy data connection.</li><li><code>ETHERNET</code> - The Ethernet data connection.</li><li><code>MOBILE</code> - The Mobile data connection.</li><li><code>MOBILE_DUN</code> - A DUN-specific Mobile data connection.</li><li><code>MOBILE_HIPRI</code> - A High Priority Mobile data connection.</li><li><code>MOBILE_MMS</code> - An MMS-specific Mobile data connection.</li><li><code>MOBILE_SUPL</code> -  A SUPL-specific Mobile data connection.</li><li><code>VPN</code> -  A virtual network using one or more native bearers. Requires API Level 21</li><li><code>WIFI</code> - The WIFI data connection.</li><li><code>WIMAX</code> -  The WiMAX data connection.</li><li><code>UNKNOWN</code> - Unknown data connection.</li></ul><p>The rest ConnectivityStates are hidden by the Android API, but can be used if necessary.</p><h3><a class="anchor" name="isconnectionexpensive"></a>isConnectionExpensive <a class="hash-link" href="docs/netinfo.html#isconnectionexpensive">#</a></h3><p>Available on Android. Detect if the current active connection is metered or not. A network is
classified as metered when the user is sensitive to heavy data usage on that connection due to
monetary costs, data limitations or battery/performance issues.</p><div class="prism language-javascript">NetInfo<span class="token punctuation">.</span><span class="token function">isConnectionExpensive<span class="token punctuation">(</span></span><span class="token punctuation">)</span>
<span class="token punctuation">.</span><span class="token function">then<span class="token punctuation">(</span></span>isConnectionExpensive <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Connection is '</span> <span class="token operator">+</span> <span class="token punctuation">(</span>isConnectionExpensive <span class="token operator">?</span> <span class="token string">'Expensive'</span> <span class="token punctuation">:</span> <span class="token string">'Not Expensive'</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span>
<span class="token punctuation">.</span><span class="token keyword">catch</span><span class="token punctuation">(</span>error <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">error<span class="token punctuation">(</span></span>error<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><h3><a class="anchor" name="isconnected"></a>isConnected <a class="hash-link" href="docs/netinfo.html#isconnected">#</a></h3><p>Available on all platforms. Asynchronously fetch a boolean to determine
internet connectivity.</p><div class="prism language-javascript">NetInfo<span class="token punctuation">.</span>isConnected<span class="token punctuation">.</span><span class="token function">fetch<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">then<span class="token punctuation">(</span></span>isConnected <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'First, is '</span> <span class="token operator">+</span> <span class="token punctuation">(</span>isConnected <span class="token operator">?</span> <span class="token string">'online'</span> <span class="token punctuation">:</span> <span class="token string">'offline'</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">function</span> <span class="token function">handleFirstConnectivityChange<span class="token punctuation">(</span></span>isConnected<span class="token punctuation">)</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Then, is '</span> <span class="token operator">+</span> <span class="token punctuation">(</span>isConnected <span class="token operator">?</span> <span class="token string">'online'</span> <span class="token punctuation">:</span> <span class="token string">'offline'</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  NetInfo<span class="token punctuation">.</span>isConnected<span class="token punctuation">.</span><span class="token function">removeEventListener<span class="token punctuation">(</span></span>
    <span class="token string">'change'</span><span class="token punctuation">,</span>
    handleFirstConnectivityChange
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
NetInfo<span class="token punctuation">.</span>isConnected<span class="token punctuation">.</span><span class="token function">addEventListener<span class="token punctuation">(</span></span>
  <span class="token string">'change'</span><span class="token punctuation">,</span>
  handleFirstConnectivityChange
<span class="token punctuation">)</span><span class="token punctuation">;</span></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/netinfo.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="addeventlistener"></a><span class="methodType">static </span>addEventListener<span class="methodType">(eventName, handler)</span> <a class="hash-link" href="docs/netinfo.html#addeventlistener">#</a></h4><div><p>Invokes the listener whenever network status changes.
The listener receives one of the connectivity types listed above.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="removeeventlistener"></a><span class="methodType">static </span>removeEventListener<span class="methodType">(eventName, handler)</span> <a class="hash-link" href="docs/netinfo.html#removeeventlistener">#</a></h4><div><p>Removes the listener for network status changes.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="fetch"></a><span class="methodType">static </span>fetch<span class="methodType">()</span> <a class="hash-link" href="docs/netinfo.html#fetch">#</a></h4><div><p>Returns a promise that resolves with one of the connectivity types listed
above.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="isconnectionexpensive"></a><span class="methodType">static </span>isConnectionExpensive<span class="methodType">()</span> <a class="hash-link" href="docs/netinfo.html#isconnectionexpensive">#</a></h4></div></div></span><span><h3><a class="anchor" name="properties"></a>Properties <a class="hash-link" href="docs/netinfo.html#properties">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="isconnected"></a>isConnected<span class="propType">: [object Object]</span> <a class="hash-link" href="docs/netinfo.html#isconnected">#</a></h4><div><p>An object with the same methods as above but the listener receives a
boolean which represents the internet connectivity.
Use this if you are only interested with whether the device has internet
connectivity.</p></div></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Network/NetInfo.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/netinfo.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/NetInfoExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

const React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const <span class="token punctuation">{</span>
  NetInfo<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  TouchableWithoutFeedback<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

class <span class="token class-name">ConnectionInfoSubscription</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    connectionInfoHistory<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">componentDidMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    NetInfo<span class="token punctuation">.</span><span class="token function">addEventListener<span class="token punctuation">(</span></span>
        <span class="token string">'change'</span><span class="token punctuation">,</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>_handleConnectionInfoChange
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">componentWillUnmount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    NetInfo<span class="token punctuation">.</span><span class="token function">removeEventListener<span class="token punctuation">(</span></span>
        <span class="token string">'change'</span><span class="token punctuation">,</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>_handleConnectionInfoChange
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  _handleConnectionInfoChange <span class="token operator">=</span> <span class="token punctuation">(</span>connectionInfo<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    const connectionInfoHistory <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>connectionInfoHistory<span class="token punctuation">.</span><span class="token function">slice<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    connectionInfoHistory<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span>connectionInfo<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      connectionInfoHistory<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span>JSON<span class="token punctuation">.</span><span class="token function">stringify<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>connectionInfoHistory<span class="token punctuation">)</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">ConnectionInfoCurrent</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    connectionInfo<span class="token punctuation">:</span> <span class="token keyword">null</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">componentDidMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    NetInfo<span class="token punctuation">.</span><span class="token function">addEventListener<span class="token punctuation">(</span></span>
        <span class="token string">'change'</span><span class="token punctuation">,</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>_handleConnectionInfoChange
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
    NetInfo<span class="token punctuation">.</span><span class="token function">fetch<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">done<span class="token punctuation">(</span></span>
        <span class="token punctuation">(</span>connectionInfo<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>connectionInfo<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">componentWillUnmount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    NetInfo<span class="token punctuation">.</span><span class="token function">removeEventListener<span class="token punctuation">(</span></span>
        <span class="token string">'change'</span><span class="token punctuation">,</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>_handleConnectionInfoChange
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  _handleConnectionInfoChange <span class="token operator">=</span> <span class="token punctuation">(</span>connectionInfo<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      connectionInfo<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>connectionInfo<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">IsConnected</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    isConnected<span class="token punctuation">:</span> <span class="token keyword">null</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">componentDidMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    NetInfo<span class="token punctuation">.</span>isConnected<span class="token punctuation">.</span><span class="token function">addEventListener<span class="token punctuation">(</span></span>
        <span class="token string">'change'</span><span class="token punctuation">,</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>_handleConnectivityChange
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
    NetInfo<span class="token punctuation">.</span>isConnected<span class="token punctuation">.</span><span class="token function">fetch<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">done<span class="token punctuation">(</span></span>
        <span class="token punctuation">(</span>isConnected<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>isConnected<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">componentWillUnmount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    NetInfo<span class="token punctuation">.</span>isConnected<span class="token punctuation">.</span><span class="token function">removeEventListener<span class="token punctuation">(</span></span>
        <span class="token string">'change'</span><span class="token punctuation">,</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>_handleConnectivityChange
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  _handleConnectivityChange <span class="token operator">=</span> <span class="token punctuation">(</span>isConnected<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      isConnected<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>isConnected <span class="token operator">?</span> <span class="token string">'Online'</span> <span class="token punctuation">:</span> <span class="token string">'Offline'</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">IsConnectionExpensive</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    isConnectionExpensive<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token keyword">null</span> <span class="token punctuation">:</span> <span class="token operator">?</span>boolean<span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  _checkIfExpensive <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    NetInfo<span class="token punctuation">.</span><span class="token function">isConnectionExpensive<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">then<span class="token punctuation">(</span></span>
        isConnectionExpensive <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>isConnectionExpensive<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TouchableWithoutFeedback onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_checkIfExpensive<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View<span class="token operator">&gt;</span>
              &lt;Text<span class="token operator">&gt;</span>Click to see <span class="token keyword">if</span> connection is expensive<span class="token punctuation">:</span>
                <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>isConnectionExpensive <span class="token operator">===</span> <span class="token boolean">true</span> <span class="token operator">?</span> <span class="token string">'Expensive'</span> <span class="token punctuation">:</span>
                <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>isConnectionExpensive <span class="token operator">===</span> <span class="token boolean">false</span> <span class="token operator">?</span> <span class="token string">'Not expensive'</span>
                <span class="token punctuation">:</span> <span class="token string">'Unknown'</span><span class="token punctuation">}</span>
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TouchableWithoutFeedback<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'NetInfo'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Monitor network status'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'NetInfo.isConnected'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Asynchronously load and observe connectivity'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;IsConnected <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'NetInfo.update'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Asynchronously load and observe connectionInfo'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;ConnectionInfoCurrent <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'NetInfo.updateHistory'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Observed updates to connectionInfo'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;ConnectionInfoSubscription <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    platform<span class="token punctuation">:</span> <span class="token string">'android'</span><span class="token punctuation">,</span>
    title<span class="token punctuation">:</span> <span class="token string">'NetInfo.isConnectionExpensive (Android)'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Asynchronously check isConnectionExpensive'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;IsConnectionExpensive <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22NetInfo%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/nativemethodsmixin.html#content">← Prev</a><a class="docs-next" href="docs/panresponder.html#content">Next →</a></div>