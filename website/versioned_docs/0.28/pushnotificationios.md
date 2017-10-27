---
id: version-0.28-pushnotificationios
title: pushnotificationios
original_id: pushnotificationios
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="pushnotificationios"></a>PushNotificationIOS <a class="hash-link" href="docs/pushnotificationios.html#pushnotificationios">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.28-stable/Libraries/PushNotificationIOS/PushNotificationIOS.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>Handle push notifications for your app, including permission handling and
icon badge number.</p><p>To get up and running, <a href="https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/AppDistributionGuide/AddingCapabilities/AddingCapabilities.html#//apple_ref/doc/uid/TP40012582-CH26-SW6" target="_blank">configure your notifications with Apple</a>
and your server-side system. To get an idea, <a href="https://parse.com/tutorials/ios-push-notifications" target="_blank">this is the Parse guide</a>.</p><p><a href="docs/linking-libraries-ios.html#manual-linking" target="_blank">Manually link</a> the PushNotificationIOS library</p><ul><li>Be sure to add the following to your <code>Header Search Paths</code>:
<code>$(SRCROOT)/../node_modules/react-native/Libraries/PushNotificationIOS</code></li><li>Set the search to <code>recursive</code></li></ul><p>Finally, to enable support for <code>notification</code> and <code>register</code> events you need to augment your AppDelegate.</p><p>At the top of your <code>AppDelegate.m</code>:</p><p>  <code>#import "RCTPushNotificationManager.h"</code></p><p>And then in your AppDelegate implementation add the following:</p><div class="prism language-javascript">  <span class="token comment" spellcheck="true"> // Required to register for notifications
</span>   <span class="token operator">-</span> <span class="token punctuation">(</span>void<span class="token punctuation">)</span>application<span class="token punctuation">:</span><span class="token punctuation">(</span>UIApplication <span class="token operator">*</span><span class="token punctuation">)</span>application didRegisterUserNotificationSettings<span class="token punctuation">:</span><span class="token punctuation">(</span>UIUserNotificationSettings <span class="token operator">*</span><span class="token punctuation">)</span>notificationSettings
   <span class="token punctuation">{</span>
    <span class="token punctuation">[</span>RCTPushNotificationManager didRegisterUserNotificationSettings<span class="token punctuation">:</span>notificationSettings<span class="token punctuation">]</span><span class="token punctuation">;</span>
   <span class="token punctuation">}</span>
  <span class="token comment" spellcheck="true"> // Required for the register event.
</span>   <span class="token operator">-</span> <span class="token punctuation">(</span>void<span class="token punctuation">)</span>application<span class="token punctuation">:</span><span class="token punctuation">(</span>UIApplication <span class="token operator">*</span><span class="token punctuation">)</span>application didRegisterForRemoteNotificationsWithDeviceToken<span class="token punctuation">:</span><span class="token punctuation">(</span>NSData <span class="token operator">*</span><span class="token punctuation">)</span>deviceToken
   <span class="token punctuation">{</span>
    <span class="token punctuation">[</span>RCTPushNotificationManager didRegisterForRemoteNotificationsWithDeviceToken<span class="token punctuation">:</span>deviceToken<span class="token punctuation">]</span><span class="token punctuation">;</span>
   <span class="token punctuation">}</span>
  <span class="token comment" spellcheck="true"> // Required for the notification event.
</span>   <span class="token operator">-</span> <span class="token punctuation">(</span>void<span class="token punctuation">)</span>application<span class="token punctuation">:</span><span class="token punctuation">(</span>UIApplication <span class="token operator">*</span><span class="token punctuation">)</span>application didReceiveRemoteNotification<span class="token punctuation">:</span><span class="token punctuation">(</span>NSDictionary <span class="token operator">*</span><span class="token punctuation">)</span>notification
   <span class="token punctuation">{</span>
    <span class="token punctuation">[</span>RCTPushNotificationManager didReceiveRemoteNotification<span class="token punctuation">:</span>notification<span class="token punctuation">]</span><span class="token punctuation">;</span>
   <span class="token punctuation">}</span>
  <span class="token comment" spellcheck="true"> // Required for the localNotification event.
</span>   <span class="token operator">-</span> <span class="token punctuation">(</span>void<span class="token punctuation">)</span>application<span class="token punctuation">:</span><span class="token punctuation">(</span>UIApplication <span class="token operator">*</span><span class="token punctuation">)</span>application didReceiveLocalNotification<span class="token punctuation">:</span><span class="token punctuation">(</span>UILocalNotification <span class="token operator">*</span><span class="token punctuation">)</span>notification
   <span class="token punctuation">{</span>
    <span class="token punctuation">[</span>RCTPushNotificationManager didReceiveLocalNotification<span class="token punctuation">:</span>notification<span class="token punctuation">]</span><span class="token punctuation">;</span>
   <span class="token punctuation">}</span></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/pushnotificationios.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="presentlocalnotification"></a><span class="propType">static </span>presentLocalNotification<span class="propType">(details)</span> <a class="hash-link" href="docs/pushnotificationios.html#presentlocalnotification">#</a></h4><div><p>Schedules the localNotification for immediate presentation.</p><p>details is an object containing:</p><ul><li><code>alertBody</code> : The message displayed in the notification alert.</li><li><code>alertAction</code> : The "action" displayed beneath an actionable notification. Defaults to "view";</li><li><code>soundName</code> : The sound played when the notification is fired (optional).</li><li><code>category</code>  : The category of this notification, required for actionable notifications (optional).</li><li><code>userInfo</code>  : An optional object containing additional notification data.</li><li><code>applicationIconBadgeNumber</code> (optional) : The number to display as the app’s icon badge. The default value of this property is 0, which means that no badge is displayed.</li></ul></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="schedulelocalnotification"></a><span class="propType">static </span>scheduleLocalNotification<span class="propType">(details)</span> <a class="hash-link" href="docs/pushnotificationios.html#schedulelocalnotification">#</a></h4><div><p>Schedules the localNotification for future presentation.</p><p>details is an object containing:</p><ul><li><code>fireDate</code> : The date and time when the system should deliver the notification.</li><li><code>alertBody</code> : The message displayed in the notification alert.</li><li><code>alertAction</code> : The "action" displayed beneath an actionable notification. Defaults to "view";</li><li><code>soundName</code> : The sound played when the notification is fired (optional).</li><li><code>category</code>  : The category of this notification, required for actionable notifications (optional).</li><li><code>userInfo</code> : An optional object containing additional notification data.</li><li><code>applicationIconBadgeNumber</code> (optional) : The number to display as the app’s icon badge. Setting the number to 0 removes the icon badge.</li></ul></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="cancelalllocalnotifications"></a><span class="propType">static </span>cancelAllLocalNotifications<span class="propType">()</span> <a class="hash-link" href="docs/pushnotificationios.html#cancelalllocalnotifications">#</a></h4><div><p>Cancels all scheduled localNotifications</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="setapplicationiconbadgenumber"></a><span class="propType">static </span>setApplicationIconBadgeNumber<span class="propType">(number)</span> <a class="hash-link" href="docs/pushnotificationios.html#setapplicationiconbadgenumber">#</a></h4><div><p>Sets the badge number for the app icon on the home screen</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="getapplicationiconbadgenumber"></a><span class="propType">static </span>getApplicationIconBadgeNumber<span class="propType">(callback)</span> <a class="hash-link" href="docs/pushnotificationios.html#getapplicationiconbadgenumber">#</a></h4><div><p>Gets the current badge number for the app icon on the home screen</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="cancellocalnotifications"></a><span class="propType">static </span>cancelLocalNotifications<span class="propType">(userInfo)</span> <a class="hash-link" href="docs/pushnotificationios.html#cancellocalnotifications">#</a></h4><div><p>Cancel local notifications.</p><p>Optionally restricts the set of canceled notifications to those
notifications whose <code>userInfo</code> fields match the corresponding fields
in the <code>userInfo</code> argument.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="addeventlistener"></a><span class="propType">static </span>addEventListener<span class="propType">(type, handler)</span> <a class="hash-link" href="docs/pushnotificationios.html#addeventlistener">#</a></h4><div><p>Attaches a listener to remote or local notification events while the app is running
in the foreground or the background.</p><p>Valid events are:</p><ul><li><code>notification</code> : Fired when a remote notification is received. The
handler will be invoked with an instance of <code>PushNotificationIOS</code>.</li><li><code>localNotification</code> : Fired when a local notification is received. The
handler will be invoked with an instance of <code>PushNotificationIOS</code>.</li><li><code>register</code>: Fired when the user registers for remote notifications. The
handler will be invoked with a hex string representing the deviceToken.</li></ul></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="removeeventlistener"></a><span class="propType">static </span>removeEventListener<span class="propType">(type, handler)</span> <a class="hash-link" href="docs/pushnotificationios.html#removeeventlistener">#</a></h4><div><p>Removes the event listener. Do this in <code>componentWillUnmount</code> to prevent
memory leaks</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="requestpermissions"></a><span class="propType">static </span>requestPermissions<span class="propType">(permissions?)</span> <a class="hash-link" href="docs/pushnotificationios.html#requestpermissions">#</a></h4><div><p>Requests notification permissions from iOS, prompting the user's
dialog box. By default, it will request all notification permissions, but
a subset of these can be requested by passing a map of requested
permissions.
The following permissions are supported:</p><ul><li><code>alert</code></li><li><code>badge</code></li><li><code>sound</code></li></ul><p>If a map is provided to the method, only the permissions with truthy values
will be requested.</p><p>This method returns a promise that will resolve when the user accepts,
rejects, or if the permissions were previously rejected. The promise
resolves to the current state of the permission.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="abandonpermissions"></a><span class="propType">static </span>abandonPermissions<span class="propType">()</span> <a class="hash-link" href="docs/pushnotificationios.html#abandonpermissions">#</a></h4><div><p>Unregister for all remote notifications received via Apple Push Notification service.</p><p>You should call this method in rare circumstances only, such as when a new version of
the app removes support for all types of remote notifications. Users can temporarily
prevent apps from receiving remote notifications through the Notifications section of
the Settings app. Apps unregistered through this method can always re-register.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="checkpermissions"></a><span class="propType">static </span>checkPermissions<span class="propType">(callback)</span> <a class="hash-link" href="docs/pushnotificationios.html#checkpermissions">#</a></h4><div><p>See what push permissions are currently enabled. <code>callback</code> will be
invoked with a <code>permissions</code> object:</p><ul><li><code>alert</code> :boolean</li><li><code>badge</code> :boolean</li><li><code>sound</code> :boolean</li></ul></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="popinitialnotification"></a><span class="propType">static </span>popInitialNotification<span class="propType">()</span> <a class="hash-link" href="docs/pushnotificationios.html#popinitialnotification">#</a></h4><div><p>DEPRECATED: An initial notification will be available if the app was
cold-launched from a notification.</p><p>The first caller of <code>popInitialNotification</code> will get the initial
notification object, or <code>null</code>. Subsequent invocations will return null.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="getinitialnotification"></a><span class="propType">static </span>getInitialNotification<span class="propType">()</span> <a class="hash-link" href="docs/pushnotificationios.html#getinitialnotification">#</a></h4><div><p>If the app launch was triggered by a push notification,
it will give the notification object, otherwise it will give <code>null</code></p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="constructor"></a>constructor<span class="propType">(nativeNotif)</span> <a class="hash-link" href="docs/pushnotificationios.html#constructor">#</a></h4><div><p>You will never need to instantiate <code>PushNotificationIOS</code> yourself.
Listening to the <code>notification</code> event and invoking
<code>popInitialNotification</code> is sufficient</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="getmessage"></a>getMessage<span class="propType">()</span> <a class="hash-link" href="docs/pushnotificationios.html#getmessage">#</a></h4><div><p>An alias for <code>getAlert</code> to get the notification's main message string</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="getsound"></a>getSound<span class="propType">()</span> <a class="hash-link" href="docs/pushnotificationios.html#getsound">#</a></h4><div><p>Gets the sound string from the <code>aps</code> object</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="getalert"></a>getAlert<span class="propType">()</span> <a class="hash-link" href="docs/pushnotificationios.html#getalert">#</a></h4><div><p>Gets the notification's main message from the <code>aps</code> object</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="getbadgecount"></a>getBadgeCount<span class="propType">()</span> <a class="hash-link" href="docs/pushnotificationios.html#getbadgecount">#</a></h4><div><p>Gets the badge count number from the <code>aps</code> object</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="getdata"></a>getData<span class="propType">()</span> <a class="hash-link" href="docs/pushnotificationios.html#getdata">#</a></h4><div><p>Gets the data object on the notif</p></div></div></div></span></div><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/pushnotificationios.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.28-stable/Examples/UIExplorer/PushNotificationIOSExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  AlertIOS<span class="token punctuation">,</span>
  PushNotificationIOS<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

<span class="token keyword">var</span> Button <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;TouchableHighlight
        underlayColor<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">'white'</span><span class="token punctuation">}</span>
        style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span>
        onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>onPress<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>buttonLabel<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>label<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

class <span class="token class-name">NotificationExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">componentWillMount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // Add listener for push notifications
</span>    PushNotificationIOS<span class="token punctuation">.</span><span class="token function">addEventListener<span class="token punctuation">(</span></span><span class="token string">'notification'</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_onNotification<span class="token punctuation">)</span><span class="token punctuation">;</span>
   <span class="token comment" spellcheck="true"> // Add listener for local notifications
</span>    PushNotificationIOS<span class="token punctuation">.</span><span class="token function">addEventListener<span class="token punctuation">(</span></span><span class="token string">'localNotification'</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_onLocalNotification<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">componentWillUnmount<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // Remove listener for push notifications
</span>    PushNotificationIOS<span class="token punctuation">.</span><span class="token function">removeEventListener<span class="token punctuation">(</span></span><span class="token string">'notification'</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_onNotification<span class="token punctuation">)</span><span class="token punctuation">;</span>
   <span class="token comment" spellcheck="true"> // Remove listener for local notifications
</span>    PushNotificationIOS<span class="token punctuation">.</span><span class="token function">removeEventListener<span class="token punctuation">(</span></span><span class="token string">'localNotification'</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>_onLocalNotification<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Button
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_sendNotification<span class="token punctuation">}</span>
          label<span class="token operator">=</span><span class="token string">"Send fake notification"</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>

        &lt;Button
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_sendLocalNotification<span class="token punctuation">}</span>
          label<span class="token operator">=</span><span class="token string">"Send fake local notification"</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">_sendNotification<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'RCTDeviceEventEmitter'</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">emit<span class="token punctuation">(</span></span><span class="token string">'remoteNotificationReceived'</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
      aps<span class="token punctuation">:</span> <span class="token punctuation">{</span>
        alert<span class="token punctuation">:</span> <span class="token string">'Sample notification'</span><span class="token punctuation">,</span>
        badge<span class="token punctuation">:</span> <span class="token string">'+1'</span><span class="token punctuation">,</span>
        sound<span class="token punctuation">:</span> <span class="token string">'default'</span><span class="token punctuation">,</span>
        category<span class="token punctuation">:</span> <span class="token string">'REACT_NATIVE'</span>
      <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">_sendLocalNotification<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'RCTDeviceEventEmitter'</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">emit<span class="token punctuation">(</span></span><span class="token string">'localNotificationReceived'</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
      aps<span class="token punctuation">:</span> <span class="token punctuation">{</span>
        alert<span class="token punctuation">:</span> <span class="token string">'Sample local notification'</span><span class="token punctuation">,</span>
        badge<span class="token punctuation">:</span> <span class="token string">'+1'</span><span class="token punctuation">,</span>
        sound<span class="token punctuation">:</span> <span class="token string">'default'</span><span class="token punctuation">,</span>
        category<span class="token punctuation">:</span> <span class="token string">'REACT_NATIVE'</span>
      <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">_onNotification<span class="token punctuation">(</span></span>notification<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    AlertIOS<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
      <span class="token string">'Push Notification Received'</span><span class="token punctuation">,</span>
      <span class="token string">'Alert message: '</span> <span class="token operator">+</span> notification<span class="token punctuation">.</span><span class="token function">getMessage<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">,</span>
      <span class="token punctuation">[</span><span class="token punctuation">{</span>
        text<span class="token punctuation">:</span> <span class="token string">'Dismiss'</span><span class="token punctuation">,</span>
        onPress<span class="token punctuation">:</span> <span class="token keyword">null</span><span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">]</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">_onLocalNotification<span class="token punctuation">(</span></span>notification<span class="token punctuation">)</span><span class="token punctuation">{</span>
    AlertIOS<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
      <span class="token string">'Local Notification Received'</span><span class="token punctuation">,</span>
      <span class="token string">'Alert message: '</span> <span class="token operator">+</span> notification<span class="token punctuation">.</span><span class="token function">getMessage<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">,</span>
      <span class="token punctuation">[</span><span class="token punctuation">{</span>
        text<span class="token punctuation">:</span> <span class="token string">'Dismiss'</span><span class="token punctuation">,</span>
        onPress<span class="token punctuation">:</span> <span class="token keyword">null</span><span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">]</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">NotificationPermissionExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state<span class="token punctuation">:</span> any<span class="token punctuation">;</span>

  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>permissions<span class="token punctuation">:</span> <span class="token keyword">null</span><span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Button
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>_showPermissions<span class="token punctuation">.</span><span class="token function">bind<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          label<span class="token operator">=</span><span class="token string">"Show enabled permissions"</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          <span class="token punctuation">{</span>JSON<span class="token punctuation">.</span><span class="token function">stringify<span class="token punctuation">(</span></span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>permissions<span class="token punctuation">)</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">_showPermissions<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    PushNotificationIOS<span class="token punctuation">.</span><span class="token function">checkPermissions<span class="token punctuation">(</span></span><span class="token punctuation">(</span>permissions<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>permissions<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  button<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    padding<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    justifyContent<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  buttonLabel<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    color<span class="token punctuation">:</span> <span class="token string">'blue'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'PushNotificationIOS'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Apple PushNotification and badge value'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
<span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Badge Number'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    PushNotificationIOS<span class="token punctuation">.</span><span class="token function">requestPermissions<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Button
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> PushNotificationIOS<span class="token punctuation">.</span><span class="token function">setApplicationIconBadgeNumber<span class="token punctuation">(</span></span><span class="token number">42</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          label<span class="token operator">=</span><span class="token string">"Set app's icon badge to 42"</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;Button
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> PushNotificationIOS<span class="token punctuation">.</span><span class="token function">setApplicationIconBadgeNumber<span class="token punctuation">(</span></span><span class="token number">0</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          label<span class="token operator">=</span><span class="token string">"Clear app's icon badge"</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Push Notifications'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;NotificationExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Notifications Permissions'</span><span class="token punctuation">,</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;NotificationPermissionExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">;</span></div></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/statusbarios.html#content">Next →</a></div>