# State of Hermes as of Jan 2020

## RN iOS/macOS Hermes integration work that has been done

### On the Hermes side

The work we need to do is aimed at OSS-specific build/packaging infrastructure:

- Regarding building; as static versions of Hermes would be too large to distribute [mainly because of LLVM], their cmake build setup needs to be able to generate a dynamic library. On top of this, because we want the work to be re-used for RN iOS, we can&#39;t use plain dyld files, but have to generate framework bundles. This work is mostly contained to a single build manifest, e.g. [here](https://github.com/facebook/hermes/blob/010a962bfc6c6810d257f0f29e0570daf834f8dd/API/hermes/CMakeLists.txt#L111-L142) and [here](https://github.com/facebook/hermes/blob/010a962bfc6c6810d257f0f29e0570daf834f8dd/API/hermes/CMakeLists.txt#L155-L182).
- Regarding packaging; these [macOS](https://github.com/facebook/hermes/blob/010a962bfc6c6810d257f0f29e0570daf834f8dd/utils/build-mac-framework.sh) and [iOS](https://github.com/facebook/hermes/blob/010a962bfc6c6810d257f0f29e0570daf834f8dd/utils/build-ios-framework.sh) scripts leverage [this shared](https://github.com/facebook/hermes/blob/010a962bfc6c6810d257f0f29e0570daf834f8dd/utils/build-apple-framework.sh) script to build the framework for every required architecture and then finally create a fat binary that contains all of the arch slices in a single framework bundle.

**NOTE:** Currently the universal frameworks are still being built the classic way, which means that there now is ambiguity if an ARM64 arch slice in the binary is meant for iOS devices with a ARM64 CPU or for the Simulator on Macs with ARM64 CPUs. This should be updated ASAP by creating a [XCFramework](https://help.apple.com/xcode/mac/11.4/#/dev544efab96) instead, which is Apple&#39;s new bundle type that is meant to tackle this issue by building separate universal frameworks for each platform.

- Their CI will trigger this and make the artefacts available from the [build-apple-runtime](https://app.circleci.com/pipelines/github/facebook/hermes/1739/workflows/567dd6a7-0b77-4965-a5e6-3362552620ae/jobs/12948/artifacts) task, which they end up pushing to their [GitHub releases page](https://github.com/facebook/hermes/releases/tag/v0.7.2) and making available through CocoaPods by pushing [their podspec](https://github.com/facebook/hermes/blob/010a962bfc6c6810d257f0f29e0570daf834f8dd/hermes-engine.podspec) to the central CocoaPods repository.

### On the RN side

I&#39;ll refer to upstream&#39;s iOS examples here, as that work was done _after_ the RN macOS work and thus reflects the latest way of doing things, some of which will need to be synced downstream in RN macOS (e.g. we ended up ditching npm distribution of hermes-engine).

- There is a [separate podspec](https://github.com/facebook/react-native/blob/7186c4de4fc76e87fa1386f2839f178dd220a02b/ReactCommon/hermes/React-hermes.podspec) for the RN sources that contain the Hermes engine integration and inspector integration code and which depends on [the hermes-engine pod](https://github.com/facebook/react-native/blob/7186c4de4fc76e87fa1386f2839f178dd220a02b/ReactCommon/hermes/React-hermes.podspec#L52).
- At the time of writing, this podspec is [**not** enabled by default](https://github.com/facebook/react-native/blob/7186c4de4fc76e87fa1386f2839f178dd220a02b/template/ios/Podfile#L11-L12), but this is subject to change in the future. When enabled by the user, it activates [the hermes pod](https://github.com/facebook/react-native/blob/7186c4de4fc76e87fa1386f2839f178dd220a02b/scripts/react_native_pods.rb#L65) and [the pod needed for the inspector integration](https://github.com/facebook/react-native/blob/7186c4de4fc76e87fa1386f2839f178dd220a02b/scripts/react_native_pods.rb#L67).

**NOTE:** Currently there also seems to be [a direct dependency on the hermes-engine pod](https://github.com/facebook/react-native/blob/7186c4de4fc76e87fa1386f2839f178dd220a02b/scripts/react_native_pods.rb#L66), but that shouldn&#39;t be necessary as it&#39;s a transitive dependency of the aforementioned React-hermes.podspec.

- Finally, now that the hermes-engine has been activated and its sources are made available to the ReactCore pod, [this CPP conditional](https://github.com/facebook/react-native/blob/7186c4de4fc76e87fa1386f2839f178dd220a02b/React/CxxBridge/RCTCxxBridge.mm#L42-L48) detects its availability and sets a CPP macro used to [enable the correct engine integration](https://github.com/facebook/react-native/blob/7186c4de4fc76e87fa1386f2839f178dd220a02b/React/CxxBridge/RCTCxxBridge.mm#L440-L442) further down in the file.
- From there on the JS engine integration of RN should be agnostic of what engine is being used.

## Work left to do

There is the aspiration to enable Hermes by default in RN v0.65.0. However, before that can happen there are a number of APIs needed to be supported first that are relied on in the existing JavaScriptCore context. Most of those have already been implemented upstream, but we are tasked with. Anandraj Govindan has already largely [implemented this for Android](https://github.com/facebook/hermes/commits?author=mganandraj), but work for macOS/iOS has yet to start.

The Android implementation, and much of Apple&#39;s i18n support, is powered by the [ICU library](http://site.icu-project.org/home). However, on the Apple platforms this library is an implementation detail of CoreFoundation/Foundation. iOS does [provide some headers](https://developer.apple.com/library/archive/documentation/StringsTextFonts/Conceptual/TextAndWebiPhoneOS/LowerLevelText-HandlingTechnologies/LowerLevelText-HandlingTechnologies.html#//apple_ref/doc/uid/TP40009542-CH15-SW12) for regex purposes and all of the headers used by Apple can be found [here](https://opensource.apple.com/source/ICU/), but using these would definitely lead to AppStore rejection. Bundling our own copy of ICU, while ideal from an existing knowledge perspective, would likely be too large of a dependency to take on. As such, the APIs should probably be implemented using CoreFoundation/Foundation APIs.
