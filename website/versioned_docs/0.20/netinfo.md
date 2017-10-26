---
id: netinfo
title: netinfo
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="netinfo"></a>NetInfo <a class="hash-link" href="#netinfo">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Network/NetInfo.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>NetInfo exposes info about online/offline status</p><div class="prism language-javascript">NetInfo<span class="token punctuation">.</span><span class="token function">fetch<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">done<span class="token punctuation">(</span></span><span class="token punctuation">(</span>reach<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
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
<span class="token punctuation">)</span><span class="token punctuation">;</span></div><h3><a class="anchor" name="ios"></a>IOS <a class="hash-link" href="#ios">#</a></h3><p>Asynchronously determine if the device is online and on a cellular network.</p><ul><li><code>none</code> - device is offline</li><li><code>wifi</code> - device is online and connected via wifi, or is the iOS simulator</li><li><code>cell</code> - device is connected via Edge, 3G, WiMax, or LTE</li><li><code>unknown</code> - error case and the network status is unknown</li></ul><h3><a class="anchor" name="android"></a>Android <a class="hash-link" href="#android">#</a></h3><p>To request network info, you need to add the following line to your
app's <code>AndroidManifest.xml</code>:</p><p><code>&lt;uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" /&gt;</code>
Asynchronously determine if the device is connected and details about that connection.</p><p>Android Connectivity Types.</p><ul><li><code>NONE</code> - device is offline</li><li><code>BLUETOOTH</code> - The Bluetooth data connection.</li><li><code>DUMMY</code> -  Dummy data connection.</li><li><code>ETHERNET</code> - The Ethernet data connection.</li><li><code>MOBILE</code> - The Mobile data connection.</li><li><code>MOBILE_DUN</code> - A DUN-specific Mobile data connection.</li><li><code>MOBILE_HIPRI</code> - A High Priority Mobile data connection.</li><li><code>MOBILE_MMS</code> - An MMS-specific Mobile data connection.</li><li><code>MOBILE_SUPL</code> -  A SUPL-specific Mobile data connection.</li><li><code>VPN</code> -  A virtual network using one or more native bearers. Requires API Level 21</li><li><code>WIFI</code> - The WIFI data connection.</li><li><code>WIMAX</code> -  The WiMAX data connection.</li><li><code>UNKNOWN</code> - Unknown data connection.</li></ul><p>The rest ConnectivityStates are hidden by the Android API, but can be used if necessary.</p><h3><a class="anchor" name="isconnectionexpensive"></a>isConnectionExpensive <a class="hash-link" href="#isconnectionexpensive">#</a></h3><p>Available on Android. Detect if the current active connection is metered or not. A network is
classified as metered when the user is sensitive to heavy data usage on that connection due to
monetary costs, data limitations or battery/performance issues.</p><div class="prism language-javascript">NetInfo<span class="token punctuation">.</span><span class="token function">isConnectionExpensive<span class="token punctuation">(</span></span><span class="token punctuation">(</span>isConnectionExpensive<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Connection is '</span> <span class="token operator">+</span> <span class="token punctuation">(</span>isConnectionExpensive <span class="token operator">?</span> <span class="token string">'Expensive'</span> <span class="token punctuation">:</span> <span class="token string">'Not Expensive'</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><h3><a class="anchor" name="isconnected"></a>isConnected <a class="hash-link" href="#isconnected">#</a></h3><p>Available on all platforms. Asynchronously fetch a boolean to determine
internet connectivity.</p><div class="prism language-javascript">NetInfo<span class="token punctuation">.</span>isConnected<span class="token punctuation">.</span><span class="token function">fetch<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">done<span class="token punctuation">(</span></span><span class="token punctuation">(</span>isConnected<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
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
<span class="token punctuation">)</span><span class="token punctuation">;</span></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="addeventlistener"></a><span class="propType">static </span>addEventListener<span class="propType">(eventName: ChangeEventName, handler: Function)</span> <a class="hash-link" href="#addeventlistener">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="removeeventlistener"></a><span class="propType">static </span>removeEventListener<span class="propType">(eventName: ChangeEventName, handler: Function)</span> <a class="hash-link" href="#removeeventlistener">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="fetch"></a><span class="propType">static </span>fetch<span class="propType">()</span> <a class="hash-link" href="#fetch">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="isconnectionexpensive"></a><span class="propType">static </span>isConnectionExpensive<span class="propType">(callback: (metered: ?boolean, error?: string) =&gt; void)</span> <a class="hash-link" href="#isconnectionexpensive">#</a></h4></div></div></span><span><h3><a class="anchor" name="properties"></a>Properties <a class="hash-link" href="#properties">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="isconnected"></a>isConnected<span class="propType">: ObjectExpression</span> <a class="hash-link" href="#isconnected">#</a></h4></div></div></span></div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/NetInfoExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

const React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
const <span class="token punctuation">{</span>
  NetInfo<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  TouchableWithoutFeedback<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>

const ConnectionInfoSubscription <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      connectionInfoHistory<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  componentDidMount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    NetInfo<span class="token punctuation">.</span><span class="token function">addEventListener<span class="token punctuation">(</span></span>
        <span class="token string">'change'</span><span class="token punctuation">,</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>_handleConnectionInfoChange
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  componentWillUnmount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    NetInfo<span class="token punctuation">.</span><span class="token function">removeEventListener<span class="token punctuation">(</span></span>
        <span class="token string">'change'</span><span class="token punctuation">,</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>_handleConnectionInfoChange
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  _handleConnectionInfoChange<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>connectionInfo<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    const connectionInfoHistory <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>connectionInfoHistory<span class="token punctuation">.</span><span class="token function">slice<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    connectionInfoHistory<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span>connectionInfo<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      connectionInfoHistory<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span>JSON<span class="token punctuation">.</span><span class="token function">stringify<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>connectionInfoHistory<span class="token punctuation">)</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

const ConnectionInfoCurrent <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      connectionInfo<span class="token punctuation">:</span> <span class="token keyword">null</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  componentDidMount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    NetInfo<span class="token punctuation">.</span><span class="token function">addEventListener<span class="token punctuation">(</span></span>
        <span class="token string">'change'</span><span class="token punctuation">,</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>_handleConnectionInfoChange
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
    NetInfo<span class="token punctuation">.</span><span class="token function">fetch<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">done<span class="token punctuation">(</span></span>
        <span class="token punctuation">(</span>connectionInfo<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>connectionInfo<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  componentWillUnmount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    NetInfo<span class="token punctuation">.</span><span class="token function">removeEventListener<span class="token punctuation">(</span></span>
        <span class="token string">'change'</span><span class="token punctuation">,</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>_handleConnectionInfoChange
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  _handleConnectionInfoChange<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>connectionInfo<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      connectionInfo<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>connectionInfo<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

const IsConnected <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      isConnected<span class="token punctuation">:</span> <span class="token keyword">null</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  componentDidMount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    NetInfo<span class="token punctuation">.</span>isConnected<span class="token punctuation">.</span><span class="token function">addEventListener<span class="token punctuation">(</span></span>
        <span class="token string">'change'</span><span class="token punctuation">,</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>_handleConnectivityChange
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
    NetInfo<span class="token punctuation">.</span>isConnected<span class="token punctuation">.</span><span class="token function">fetch<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">done<span class="token punctuation">(</span></span>
        <span class="token punctuation">(</span>isConnected<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>isConnected<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  componentWillUnmount<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    NetInfo<span class="token punctuation">.</span>isConnected<span class="token punctuation">.</span><span class="token function">removeEventListener<span class="token punctuation">(</span></span>
        <span class="token string">'change'</span><span class="token punctuation">,</span>
        <span class="token keyword">this</span><span class="token punctuation">.</span>_handleConnectivityChange
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  _handleConnectivityChange<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>isConnected<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      isConnected<span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>isConnected <span class="token operator">?</span> <span class="token string">'Online'</span> <span class="token punctuation">:</span> <span class="token string">'Offline'</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

const IsConnectionExpensive <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      isConnectionExpensive<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token keyword">null</span> <span class="token punctuation">:</span> <span class="token operator">?</span>boolean<span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token function">_checkIfExpensive<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    NetInfo<span class="token punctuation">.</span><span class="token function">isConnectionExpensive<span class="token punctuation">(</span></span>
        <span class="token punctuation">(</span>isConnectionExpensive<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>isConnectionExpensive<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
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
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'NetInfo'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Monitor network status'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'NetInfo.isConnected'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Asynchronously load and observe connectivity'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;IsConnected <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'NetInfo.update'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Asynchronously load and observe connectionInfo'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;ConnectionInfoCurrent <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'NetInfo.updateHistory'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Observed updates to connectionInfo'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;ConnectionInfoSubscription <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    platform<span class="token punctuation">:</span> <span class="token string">'android'</span><span class="token punctuation">,</span>
    title<span class="token punctuation">:</span> <span class="token string">'NetInfo.isConnectionExpensive (Android)'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Asynchronously check isConnectionExpensive'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;IsConnectionExpensive <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/panresponder.html#content">Next →</a></div>