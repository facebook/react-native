
# Android Deforking Plan

  

This summarizes the plan and and the action items for deforking react-native for consumption in Office applications on Android platform. We'll cover all the code forks that existed as of the start of RN v0.60 merge, and will talk about the complete tasks as well to ensure that the information on the deforking strategy applied (whether the code is abandoned, or pushed back to facebook, or moved to higher layer) will be persisted in case we hit a regression in future or need to revisit the work later for some reason. 

In order to systematically analyze the forks/diffs between our repository and the open source react-native repository, we created patch files representing all the differences, grouped the hunks and categorized them based on their function. This patching system also allows us to incrementally reduce the divergences while making sure that we make it very hard to introduce new differences.

Our target is to avoid this patching step in future and enable consuming open source built react native binaries. But, as of react native version 0.62, we have to apply some patches to the source code before building the react native binaries for consumption in Office.  But all the current patches are in the native code (Java/C++) and none of them affects the user behavior in any way.  In other words, we haven't yet applied our functional patches around Focus, Scrolling, Accessibility etc. as we expect the open source behavior to have caught up with our expectation as of v62 (And also our patches may not work as before over v62 as our code conflicts with alternate implementations of Focus/Accessiblity in v62). We want to work on any gaps directly in the open source repository.

For the remaining set of patches that we still apply over v62, we have a clear plan to avoid them in future. In short, the current set of patches can be removed once,
1. We move to TurboModules and remove the last CxxModule from our codebase
2. Use Hermes instead of V8 on Android
3. Office applications updates the host activity to FragmentActivity
4. Some external scripting can replace some patches in the gradle scripts

## Engineering system adaptation

  

These are the set of patches to adapt to the various idiosyncrasies of Office build environment.

  

**Code changes to get react-native source code built inside Office source tree**

  

For various reason, ABI safety being the most prominant one that i remember, we used to copy the react-native source code into Office source tree and build it in place along with the other office sources. This required us to make changes in the source code to adapt to the various toolchain settings (warning level for e.g.) across platforms. And add build definition files inside the react-native tree for nmake build driver.

*Deforking Status*

  

Now that we stopped the source code cloning and are building react-native outside the Office build environment with the identical toolchain settings as the open source repository, we could remove all such diff. We did most of this cleanup as part of the v60 merge.

  

*fb62merge* branch is clean

  

**Security**

  

Security audit tools in Office build environment flagged vulnarabilities around the usage of "vsprintf" in react native and depedency libraries such as Folly and glog. We had patched the react-native and the third party library sources to use the safer version of "vsprintf" instead.

  

*Deforking Status*

  

As part of v60 merge, we had extracted all these security changes out of the react native repo as patch files applied at the build time into PR and publish pipelines. But, the patched third party sources (Folly, glong, double-conversion) remained checked-in to our fork. Essentially, we are locked on an old version of these libraries.

  

Note: The usages of "vsprintf" in react-native tree are not strictly in react-native codebase, but is in dependant facebook libraries such as fbjni, ygjni etc.

  

It is not clear whether these security fixes are necessary as we no longer build the code inside the office build environment.

Based on my limited study so far, the "vsprintf" API is considered to be safe if used with a litaral format string, which is the case for a couple of usages in react-native. But some usages in glog, and folly uses dynamic format strings, but they mostly originated from literal strings in the embedding application.

  

As of now, In *fb62merge* branch, we are not applying these patches. We are downloading third party libraries just like the open source repository does.

**Adaptation to different/older SDK/NDK versions, STL etc.**

Office engineering system tends to stay on different/older SDK/NDK versions, STL etc. compared to open source react-native repository.

  

*Deforking Status*

We cleaned up more of the relics from the older NDKS and gnustl as of v60 merge.

  

*fb62merge* branch is clean

  

**Office engineering system consumes Nuget pacakges, offline gradle builds.**

  

Office engineering system can't directly consume npm packages. Hence, we do prepare a nuget packages in the fork which requires us to checkin nuget definitions into the source tree.

Gradle builds in office build environmet does offline builds which forced us to pre-download all the external depenencies and package them as nuget. This depedendency nuget generation step is manual which resulted in this package not staying current. This had resulted in these third party libraries stay on very old versions in Office.

  

*Deforking Status*

As of v60 merge, we had extracted all the nuget definitions into patch files.

As part of v60 merge, we had refreshed all the third party dependencies to the latest.

  

This [task](https://github.com/microsoft/react-native/projects/1#card-37490708) is created for standardizing the dependency nuget creation

  

** Office application package (APK) layout **

  

## Performance

Office had set a strict requirement for latency and memory footprint before shipping the first react native feature (Live Persona Card) in Office apps. We had resoreted to a bunch of changes to achieve the required performance characteristics.

  

**Build time Annotation processing native modules**

React native enumerates the shape of all Java authored native modules with the help of the developer annotations and reflection APIs. This enumeration was found to add hunderds of milliseconds into the boot latency of react-native instances. Hence, we added the build time enumeration of the native module shapes and generation and inclusion of temporary classes into the application package.

  

*Deforking Status*

  

As of v60 merge, we had extracted all the annotation processing into patch files.

  

As of now, we are not applying these patches to *fb62merge* as

1. The code is partially broken. It requies some work to make it as effective as it was.

2. This will become unnecessary once all the native modules are converted to Turbomodules.

  

**V8**

We switched to V8 engine from JSC to take advantage of the inbuilt bytecode caching and global object snapshots. We achieved significant gains in boot latency as a result.

  

*Deforking Status*

At the start of v60 merge, we were still sitting on the older V8Executor implementations without the JSI interface based bridge. As part of v60 merge, we switched over to the JSI based bridge using our JSI implementation over V8. Even though the code is mostly shared with Windows, we are still making a copy. And all the V8 integration code changes are in patch files.

  

Currently, in *fb62merge* branch, we are applying the V8 integration patches. We are currently consuming a very old version of V8 (v6.9) and has some sever bugs currently not affecting the currently shipped features, but will be an issue in future. I'm trying to upgrade the V8 to newer version but the newer V8 binaries are significantly bigger which may be a blocker as the Android Office applications are under a tight budge on the APK size. Hence, I'll soon look into enabling Hermes in Office applications on Android.

  

**Bytecode Caching**

We had made various experiments with JSC and V8 on caching compiled Javascript artefacts to improve the boot latency on subsequent launches, which resulted in various configuration options on caching being plumbed all the way through the stack.

  

*Deforking Status*

We had cleaned up a few of the changes in v60 merge, and with v62 merge we are mostly clean.

  

**Delay loading**

On Android platform, the loading of SO files were found to be slow. Hence, we wanted to avoid loading react native, which had a bunch of SO files, on Office application boot. This requires us to make react native SO files delay loadable. It was a relatively straightforward change in the initial days, when the react native "Instance" class had virtual methods, as they could be dispatched through the vtables. But, later, the instance class became non-virtual, which forced us to explicitly find the methods in "Instance" using method signatures. But, the older merges kept some of the methods as virtual.

  

*Deforking Status*

We had moved the changes to patch fiels as part of v60 merge.

Currently, we have removed all these patches in the *fb62merge* merge.

  

**Systrace**

  
  

## Cross platform & ReactNativeHost/Reka adaptation

  

**CxxModules**

Cross platform features in office were built using CxxModules or Reka, which uses CxxModules as transport. In order to make cross platform CxxModules work on Android, we had to make some changes to the react native core code,

1. A factory method to create new CxxModules

2. Split bridge creation into two stages, native module registry creation and the rest of the bridge initialization, which gives us a chance to register CxxModules before the Javascript is evaluated.

  

*Deforking Status*

We had moved the changes to patch fiels as part of v60 merge.

The patches are rebased and applied over *fb62merge* branch.

  

This is a change which we want to propose for upstreaming.

  

**Call JS methods from C++ code**

Reka required calling Javascript methods from C++ code. In order to enable this, we had to make react native "Instance" available to Reka/ReactNativeHost. This required us to expose an API through the JNI bridge to return the raw pointer to the react native "Instance".

  

*Deforking Status*

We had moved the changes to patch fiels as part of v60 merge.

The patches are rebased and applied over *fb62merge* branch.

  

This is a change which we want to propose for upstreaming.

  

## React Native gap fill-ins

  

**OfficeAcitivity not AppCompatActivity/FragmentActivity**

Office applications are built over platform "Activity" class, and not the AppCompatActivity in the Android support library which is what the some of the modules in react native assumes, such as the DialogModule, Date/Time Picker etc.

  

In order to make DialogModule work, we had to apply some patches.

  

*Deforking Status*

We had moved the changes to patch fiels as part of v60 merge.

The patches are rebased and applied over *fb62merge* branch.

  

We are working with the IDC team to update the base activity in Office applications to AppCompatActivity. We will be able to abandon these patches once that is done.

  

**Hardware keyboaring**

Hardware keyboarding was one big gap in react native arsenal. Specifically, the features such as commenting required not only the edit text to attain keyboard focus, and we had patched react native to enable every types of views to take focus.

  

*Deforking Status*

We had moved the changes to patch fiels as part of v60 merge.

  

As of v62.2, Many of the hardware keyboarding issues are expected to be fixed in react native by contributions from community and Microsoft teams (LPC). Hence, i haven't applied the patches in the *fb62merge* branch yet. We plan to test the features for any gaps in hardware keyboarding scenatios and work to get them fixed in the opensource repository.

  

**Focus & Scroll**

Hardware keyboarding experience in the scrollviews had many gaps, especially around automatic scrolling. We fixed them by making native focus management take over which fixed some of the issues

  

*Deforking Status*

We had moved the changes to patch fiels as part of v60 merge.

  

As of v62.2, Many of the hardware keyboarding issues are expected to be fixed in react native by contributions from community and Microsoft teams (LPC). Hence, i haven't applied the patches in the *fb62merge* branch yet. We plan to test the features for any gaps in hardware keyboarding scenatios and work to get them fixed in the opensource repository.

  

**Accessibility**

Accesibility (Specifically, Talkback,) was a big gap that we had to fix before shipping features.

  

*Deforking Status*

We had moved the changes to patch fiels as part of v60 merge.

  

As of v62.2, react native is expected to have caught up on Accessiblity. Hence, i haven't applied the patches in the *fb62merge* branch yet. We plan to test the features for any gaps in hardware keyboarding scenatios and work to get them fixed in the opensource repository.

  

**Typeface**

We had code to add custom typefaces to react native text controls.

  

*Deforking Status*

We had moved the changes to patch fiels as part of v60 merge.

We had applied the patches to *fb62merge* branch.

  

IDC team is working on using Roboto font across office appliations, instead of Segoe. We will try to get rid of this patch if possible.

  

## Experiments

There were some experimental changes still lingering around.   

**Minimal instance for UI-less features**
There was an attemp to be able to create non-UI react native instances for features such as Augmentation loop in Office. 

*Deforking Status*

We had moved the changes to patch fiels as part of v60 merge.
We haven't applied these patches to *fb62merge* branch.

**Synchronously create instance**

There was an attempt to be able to create non-UI light react native instances synchronously created on Stack for features such as Augmentation loop in Office. 

*Deforking Status*

We had moved the changes to patch fiels as part of v60 merge.
We haven't applied these patches to *fb62merge* branch.

**Some experiments on layouts**

We attempted to fix some of the layout issues early in the react-native days.

*Deforking Status*

We cleaned all these at the start of v60 merge.