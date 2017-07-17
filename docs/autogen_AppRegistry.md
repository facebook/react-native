---
id: appregistry
title: AppRegistry
sidebar: api
category: APIs
permalink: docs/appregistry.html
---
<div><div><span><div class="banner-crna-ejected">
  <h3>Project with Native Code Required</h3>
  <p>
    This API only works in projects made with <code>react-native init</code>
    or in those made with Create React Native App which have since ejected. For
    more information about ejecting, please see
    the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on
    the Create React Native App repository.
  </p>
</div>

</span><p><code>AppRegistry</code> is the JS entry point to running all React Native apps.  App
root components should register themselves with
<code>AppRegistry.registerComponent</code>, then the native system can load the bundle
for the app and then actually run the app when it's ready by invoking
<code>AppRegistry.runApplication</code>.</p><p>To "stop" an application when a view should be destroyed, call
<code>AppRegistry.unmountApplicationComponentAtRootTag</code> with the tag that was
passed into <code>runApplication</code>. These should always be used as a pair.</p><p><code>AppRegistry</code> should be <code>require</code>d early in the <code>require</code> sequence to make
sure the JS execution environment is setup before other modules are
<code>require</code>d.</p></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/appregistry.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="setwrappercomponentprovider"></a><span class="methodType">static </span>setWrapperComponentProvider<span class="methodType">(provider)</span> <a class="hash-link" href="docs/appregistry.html#setwrappercomponentprovider">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="registerconfig"></a><span class="methodType">static </span>registerConfig<span class="methodType">(config)</span> <a class="hash-link" href="docs/appregistry.html#registerconfig">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="registercomponent"></a><span class="methodType">static </span>registerComponent<span class="methodType">(appKey, componentProvider, section?)</span> <a class="hash-link" href="docs/appregistry.html#registercomponent">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="registerrunnable"></a><span class="methodType">static </span>registerRunnable<span class="methodType">(appKey, run)</span> <a class="hash-link" href="docs/appregistry.html#registerrunnable">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="registersection"></a><span class="methodType">static </span>registerSection<span class="methodType">(appKey, component)</span> <a class="hash-link" href="docs/appregistry.html#registersection">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="getappkeys"></a><span class="methodType">static </span>getAppKeys<span class="methodType">()</span> <a class="hash-link" href="docs/appregistry.html#getappkeys">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="getsectionkeys"></a><span class="methodType">static </span>getSectionKeys<span class="methodType">()</span> <a class="hash-link" href="docs/appregistry.html#getsectionkeys">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="getsections"></a><span class="methodType">static </span>getSections<span class="methodType">()</span> <a class="hash-link" href="docs/appregistry.html#getsections">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="getrunnable"></a><span class="methodType">static </span>getRunnable<span class="methodType">(appKey)</span> <a class="hash-link" href="docs/appregistry.html#getrunnable">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="getregistry"></a><span class="methodType">static </span>getRegistry<span class="methodType">()</span> <a class="hash-link" href="docs/appregistry.html#getregistry">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="setcomponentproviderinstrumentationhook"></a><span class="methodType">static </span>setComponentProviderInstrumentationHook<span class="methodType">(hook)</span> <a class="hash-link" href="docs/appregistry.html#setcomponentproviderinstrumentationhook">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="runapplication"></a><span class="methodType">static </span>runApplication<span class="methodType">(appKey, appParameters)</span> <a class="hash-link" href="docs/appregistry.html#runapplication">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="unmountapplicationcomponentatroottag"></a><span class="methodType">static </span>unmountApplicationComponentAtRootTag<span class="methodType">(rootTag)</span> <a class="hash-link" href="docs/appregistry.html#unmountapplicationcomponentatroottag">#</a></h4></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="registerheadlesstask"></a><span class="methodType">static </span>registerHeadlessTask<span class="methodType">(taskKey, task)</span> <a class="hash-link" href="docs/appregistry.html#registerheadlesstask">#</a></h4><div><p>Register a headless task. A headless task is a bit of code that runs without a UI.
@param taskKey the key associated with this task
@param task    a promise returning function that takes some data passed from the native side as
               the only argument; when the promise is resolved or rejected the native side is
               notified of this event and it may decide to destroy the JS context.</p></div></div><div class="prop"><h4 class="methodTitle"><a class="anchor" name="startheadlesstask"></a><span class="methodType">static </span>startHeadlessTask<span class="methodType">(taskId, taskKey, data)</span> <a class="hash-link" href="docs/appregistry.html#startheadlesstask">#</a></h4><div><p>Only called from native code. Starts a headless task.</p><p>@param taskId the native id for this task instance to keep track of its execution
@param taskKey the key for the task to start
@param data the data to pass to the task</p></div></div></div></span></div>