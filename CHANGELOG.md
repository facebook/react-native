# Changelog

## v0.81.0-rc.0

### Breaking

- **APIs:** All `react-native/Libraries/BugReporting` APIs have been removed ([9d4d8dcb02](https://github.com/facebook/react-native/commit/9d4d8dcb0264273cc1522ed6e9de47cdb05606f4) by [@huntie](https://github.com/huntie))
- **APIs:** Add public JS API breaking change detection under `yarn diff-api-snapshot` script. ([6b40f35032](https://github.com/facebook/react-native/commit/6b40f35032462de8a9bad0e9f186916562475a40) by [@coado](https://github.com/coado))
- **APIs:** Community CLI users: user-defined `resolver.resolveRequest` and `serializer.getModulesRunBeforeMainModule` Metro config now takes precedence over CLI defaults ([fe2bcbf4ba](https://github.com/facebook/react-native/commit/fe2bcbf4ba7ce983fac0cd09727c165517b6337f) by [@robhogan](https://github.com/robhogan))
- **Error Handling:** Improve messaging and add error stack trace for uncaught throws. ([5ba0e1f97a](https://github.com/facebook/react-native/commit/5ba0e1f97ad40f84d83efaa9cfdbaf9ad22a18e8) by [@vzaidman](https://github.com/vzaidman))
- **Flow:** The `react-native` package no longer ships with the `flow` directory ([38acb4c074](https://github.com/facebook/react-native/commit/38acb4c0746e48ebb10729360788e26454736d1b) by [@huntie](https://github.com/huntie))
- **Node:** Minimum Node version is now bumped to Node.js 22.14.0 ([df39eadc03](https://github.com/facebook/react-native/commit/df39eadc03edcd23fab47712d24818d2d0c75d16) by [@huntie](https://github.com/huntie))
- **View:** `View` no longer sets any default accessibility props, which should not result in visible changes in behaviour but may affect snapshot tests. ([039a333df5](https://github.com/facebook/react-native/commit/039a333df57e20133af3ec77e995ec8fe4dc7f5c) by [@javache](https://github.com/javache))
- **View:** Upgrade `View` component to React 19. ([eedd60b9e6](https://github.com/facebook/react-native/commit/eedd60b9e6b595801d05c2fa223124fb8a895c3c) by [@EvanBacon](https://github.com/EvanBacon))

#### Android specific

- **APIs:** Cleanup and internalize `FpsDebugFrameCallback` ([cf6569bc18](https://github.com/facebook/react-native/commit/cf6569bc18082253fa84feecdfaa7a28413bc993) by [@cortinico](https://github.com/cortinico))
- **CMake:** Correctly propagate `RN_SERIALIZABLE_STATE` to 3rd party `CMake` targets. Users with custom `CMake` and C++ code should update to use `target_compile_reactnative_options` inside their `CMakeLists.txt` files.([c059ae1b77](https://github.com/facebook/react-native/commit/c059ae1b77b073e6990dc2a5d81979de679c2b01) by [@cortinico](https://github.com/cortinico))
- **FabricUIManager:** Remove `FabricUIManager.measure` overload which accepts attachment positions ([2ba86caf18](https://github.com/facebook/react-native/commit/2ba86caf18d86f6902f987ec9a0aa94bf67c1b4e) by [@NickGerleman](https://github.com/NickGerleman))
- **Kotlin:** Migrate `ViewManagerInterfaces` to kotlin. Some types in code generated ViewManagerInterfaces might differ. e.g. this will start enforcing nullability in parameters of viewManagerInterface methods (e.g. String commands parameters are not nullable, view params are not nullable in any method, etc) ([76ff1aa5c6](https://github.com/facebook/react-native/commit/76ff1aa5c6d30935ec33708d3a13ac7e5a82f551) by [@mdvacca](https://github.com/mdvacca))
- **Kotlin:** Migrate `com.facebook.react.ReactDelegate` to Kotlin. Some users implementing this class in Kotlin could have breakages. ([50ea5b4380](https://github.com/facebook/react-native/commit/50ea5b43806a9047bace81267c97d5dd73e0e74d) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Convert to Kotlin and internalize `MountingManager` ([f33fdca876](https://github.com/facebook/react-native/commit/f33fdca87679d5cc628a2e9dccada728cbb0335b) by [@cortinico](https://github.com/cortinico))
- **textAlignVertical:** Move `textAlignVertical` to paragraph attributes instead of text attributes ([55fd8b26f8](https://github.com/facebook/react-native/commit/55fd8b26f8791848dd886bd7fb5110b401038234) by [@joevilches](https://github.com/joevilches))
- **TextLayoutManager:** Make Java Side `TextLayoutManager` Internal ([e82a677c79](https://github.com/facebook/react-native/commit/e82a677c7966209b05fe55209fcb26c067427393) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- **RCTDisplayLink:** Migrate `RCTDisplayLink`'s API from `RCTModuleData` ([70eeb9f541](https://github.com/facebook/react-native/commit/70eeb9f54194cc807017bec8c71080972c5c4e65) by [@RSNara](https://github.com/RSNara))
- **SynchronouslyUpdateViewOnUIThread:** `SynchronouslyUpdateViewOnUIThread` now accepts `folly::dynamic` instead of `NSDictionary`. Use https://github.com/facebook/react-native/blob/main/packages/react-native/ReactCommon/react/utils/platform/ios/react/utils/FollyConvert.h#L14 for conversion. ([82279bd981](https://github.com/facebook/react-native/commit/82279bd9811c406d21496d03a1572b98946c50b6) by [@sammy-SC](https://github.com/sammy-SC))
- **Xcode:** Bump min Xcode to 16.1 ([c27a8804a6](https://github.com/facebook/react-native/commit/c27a8804a6fdaea2d4bef4a4c689bfe2c343daaa) by [@NickGerleman](https://github.com/NickGerleman))

### Added

- **APIs:** Expose `unstable_TextAncestorContext` API ([962a7dda44](https://github.com/facebook/react-native/commit/962a7dda440863e7888fd2cc01c065c8762857e6) by [@huntie](https://github.com/huntie))
- **APIs:** Expose additional `*AnimationConfig` types on the `Animated` namespace ([11a1ad7a98](https://github.com/facebook/react-native/commit/11a1ad7a98a71cd1189550a8ae5666e5a2ed8d57) by [@huntie](https://github.com/huntie))
- **APIs:** `InterpolationConfig` is now exposed on the `Animated` namespace ([b01a5f91fe](https://github.com/facebook/react-native/commit/b01a5f91fedc19495e8a9d6ce079feb5898e7b87) by [@huntie](https://github.com/huntie))
- **APIs:** Expose `ScrollViewImperativeMethods` and `ScrollViewScrollToOptions` types to public API ([f184b591cf](https://github.com/facebook/react-native/commit/f184b591cfb49ed372efb0bdd55a145230112f45) by Antonio Pires)
- **APIs:** Add `--validate` flag to `build-types` script for JS API snapshot validation. ([f529fd6ba5](https://github.com/facebook/react-native/commit/f529fd6ba590101a3dfa710a92befb81994ed2dd) by [@coado](https://github.com/coado))
- **Bridging:** Added support for bridging `Class` methods return types ([e403b510d0](https://github.com/facebook/react-native/commit/e403b510d0de74ac7e62defeb1e80eff84b956e2) by [@hoxyq](https://github.com/hoxyq))
- **Error Handling:** Improve error messages when enum members are missing ([12ced22f70](https://github.com/facebook/react-native/commit/12ced22f70438064bf815c2413cbd12a80dbf0a7) by Yannick Loriot)
- **Fantom:** Add `Fantom.getFabricUpdateProps` for reading fabric update props scheduled via `UIManager::updateShadowTree` ([cc442eb8c8](https://github.com/facebook/react-native/commit/cc442eb8c85d516701f840046d73683a7cd51424) by [@zeyap](https://github.com/zeyap))
- **Flow:** Add support for Flow opaque types in codegen for native modules ([a15fc102e6](https://github.com/facebook/react-native/commit/a15fc102e63eb3b37852ca45fe4c65e894ecef7d) by [@rubennorte](https://github.com/rubennorte))
- **HMR:** Process HMR `registerBundle` calls from the same origin only ([a9007ea586](https://github.com/facebook/react-native/commit/a9007ea586f6e87db47c6305be3232d760abfd57) by [@jbroma](https://github.com/jbroma))
- **IntersectionObserver:** `IntersectionObserver` support for `root` with fixes for viewport offsets ([c5b6716311](https://github.com/facebook/react-native/commit/c5b67163117e13c99a9c57816f0ff36efc80ccf5) by [@lunaleaps](https://github.com/lunaleaps))
- **ReactNativeFeatureFlags:** Allow Custom ReactNativeFeatureFlags for Shell 2.0 ([bbc1e121c7](https://github.com/facebook/react-native/commit/bbc1e121c71d14803d29a931f642bf8ea6ee2023) by Maddie Lord)
- **ScrollView:** Added more Pending Decleration for `ScrollView` ([a6908ad1a5](https://github.com/facebook/react-native/commit/a6908ad1a5d998505b2bb6ba3e39910fee17329a) by [@riteshshukla04](https://github.com/riteshshukla04))
- **ShadowNode:** Added `cloneMultiple` to `ShadowNode` class. ([1161fb4fcd](https://github.com/facebook/react-native/commit/1161fb4fcd6a0cac3a691de1f37cc7f9d6a861a5) by [@bartlomiejbloniarz](https://github.com/bartlomiejbloniarz))
- **Typescript:** Add `pressRetentionOffset` prop to be recognised by typescript in `Text.d.ts` ([d94f4d8c9d](https://github.com/facebook/react-native/commit/d94f4d8c9deef78c0345a7fd3de74424f864c080) by [@iamAbhi-916](https://github.com/iamAbhi-916))
- **URLSearchParams:** Added size property to `URLSearchParams` implementation ([9b1a8ffac4](https://github.com/facebook/react-native/commit/9b1a8ffac4368b9304939359917c7cfd0a9501bf) by [@louix](https://github.com/louix))

#### Android specific

- **BaseViewManager:** Adds support for `onFocus` / `onBlur` event dispatching logic to all native views that implement `BaseViewManager` ([e960a28af7](https://github.com/facebook/react-native/commit/e960a28af7f4541dcf67d3c7148b2d32a39e1b04) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Edge To Edge:** Add Android edge-to-edge opt-in support ([09ef774ff6](https://github.com/facebook/react-native/commit/09ef774ff6dac10a00a8b35670f9b3941d810dfb) by [@zoontek](https://github.com/zoontek))
- **RNGP:** `RNGP`- Add support for `exclusiveEnterpriseRepository` to specify an internal Maven mirror. ([6cb8dc37c7](https://github.com/facebook/react-native/commit/6cb8dc37c74995cba3f9f0a845919f305de53c3d) by [@cortinico](https://github.com/cortinico))
- **RNTester:** Added explicit build tool version to `RNTester` `build.gradle` to avoid automatic installation of Android SDK Build Tools. ([35dba09724](https://github.com/facebook/react-native/commit/35dba097243ff2d21466f860ec9831e1ff2a97ac) by [@mojavad](https://github.com/mojavad))
- **ScrollView:** Allow `fadingEdgeLength` to be set independently on the start and end of the `ScrollView` ([a21a4b87c3](https://github.com/facebook/react-native/commit/a21a4b87c337f3f2d998a30841430f587c066580) by Mark Verlingieri)
- **View:** Support for `onFocus` and `onBlur` function calls in `View` components ([af0a76cf5f](https://github.com/facebook/react-native/commit/af0a76cf5fdb8107294dff2c9aa0dbc36c7d5443) by [@Abbondanzo](https://github.com/Abbondanzo))

#### iOS specific

- **borderWidth:** Add support for different `borderWidth`s ([70962ef3ed](https://github.com/facebook/react-native/commit/70962ef3ed06a76a96cb2e72c374dc028628c829) by [@a-klotz-p8](https://github.com/a-klotz-p8))
- **Modal:** Allow to interactively swipe down `Modal`s. ([28986a7599](https://github.com/facebook/react-native/commit/28986a7599952a77b8b8e433f72ca837afde310e) by [@okwasniewski](https://github.com/okwasniewski))
- **Package.swift:** Added missing search path to `Package.swift` ([592b09781b](https://github.com/facebook/react-native/commit/592b09781bb94fe6dc00ba49c7a86649980fed5d) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Add more logging around `computeNightlyTarballURL` in ios pre-build ([1a6887bd70](https://github.com/facebook/react-native/commit/1a6887bd70cdefb8fbc421467de841ece74d5c6b) by [@cortinico](https://github.com/cortinico))
- **Prebuild:** Added backwards compatible use of prebuild through cocoapods ([d8e00f0bb1](https://github.com/facebook/react-native/commit/d8e00f0bb1940fc9cc7e5cbb68b26c2d05824486) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Ship the `React-Core-prebuilt.podspec` in `package.json` ([46b562b9b3](https://github.com/facebook/react-native/commit/46b562b9b3bf4c0b8c5af25ab84a43509979c4a7) by [@cipolleschi](https://github.com/cipolleschi))
- **Prebuild:** Added support for using prebuilt `RNCore` with Cocoapods ([90654e4ba2](https://github.com/facebook/react-native/commit/90654e4ba2f3cc2f6b0d8f08769ce58b4e5d1b51) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Add `React-Core-prebuild.podspec` to integrate React native core prebuilds using Cocoapods ([1a86ee17fb](https://github.com/facebook/react-native/commit/1a86ee17fb80cfa1b8bcff30f4f3d5cdb193900d) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Added building `XCFframework` from the prebuild script ([55534f518a](https://github.com/facebook/react-native/commit/55534f518aab53bcdc3fe12d987ab7ef6e620c77) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Added building swift package from the prebuild script ([3c01b1b6f0](https://github.com/facebook/react-native/commit/3c01b1b6f04d285c97bb182131135903b0c1cdd5) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Added downloading of hermes artifacts when pre-building for iOS. ([41d2b5de0a](https://github.com/facebook/react-native/commit/41d2b5de0af21c72227ef030dcddf208e2eb221a) by [@chrfalch](https://github.com/chrfalch))
- **runtime:** Added `HERMES_ENABLE_DEBUGGER` to debug configuration for the `reactRuntime` target. ([560ac23001](https://github.com/facebook/react-native/commit/560ac23001b02f19d4c6ca4ea493c17060cfaf5f) by [@chrfalch](https://github.com/chrfalch))

### Changed

- **Animated:** Animated now always flattens `props.style`, which fixes an error that results from `props.style` objects in which `AnimatedNode` instances are shadowed (i.e. flattened to not exist in the resulting `props.style` object). ([da520848c9](https://github.com/facebook/react-native/commit/da520848c931f356d013623c412af11dce7ff114) by [@yungsters](https://github.com/yungsters))
- **Animated:** Creates a feature flag that changes `Animated` to no longer produce invalid `props.style` if every `AnimatedNode` instance is shadowed via style flattening. ([5c8c5388fc](https://github.com/facebook/react-native/commit/5c8c5388fc53ef2430b0bb6bbbc628479819e23d) by [@yungsters](https://github.com/yungsters))
- **Animated:** Enabled a feature flag that optimizes `Animated` to reduce memory usage. ([2a13d20085](https://github.com/facebook/react-native/commit/2a13d200850e4f161a29b252a0ccedc158e53937) by [@yungsters](https://github.com/yungsters))
- **Error handling:** Errors will no longer have the "js engine" suffix. ([a293925280](https://github.com/facebook/react-native/commit/a2939252803d5cd4b68340da08820174c30a53e6) by [@yungsters](https://github.com/yungsters))
- **Fibers:** Reduces memory usage, by improving memory management of parent alternate fibers. (Previously, a parent fiber might retain memory associated with shadow nodes from a previous commit.) ([0411c43b3a](https://github.com/facebook/react-native/commit/0411c43b3a239384c778baad22c7b4c501008449) by [@yungsters](https://github.com/yungsters))
- **infoLog:** Removed `infoLog` from `react-native` package ([8a0cfec815](https://github.com/facebook/react-native/commit/8a0cfec81584e966c9e6ea0f5e438022e0129bcd) by [@coado](https://github.com/coado))
- **IntersectionObserver:** Fixed `IntersectionObserver#observe` to avoid retaining memory for unmounted child nodes of observed views. ([d945c5863a](https://github.com/facebook/react-native/commit/d945c5863a5ed7b755e577bc25d681bfcc1c401b) by [@yungsters](https://github.com/yungsters))
- **Jest:** Improved default mocking for Jest unit tests. ([1fd9508ecc](https://github.com/facebook/react-native/commit/1fd9508ecc499df89b086e0c46035f43f6f78ad9) by [@yungsters](https://github.com/yungsters))
- **LegacyArchitecture:** Raise loglevel for assertion of `LegacyArchitecture` classes ([38a4b62211](https://github.com/facebook/react-native/commit/38a4b6221164d36eb4ac95c9f3bc7f7e7235e383) by [@mdvacca](https://github.com/mdvacca))
- **LegacyArchitecture:** Raise logLevel of `LegacyArchitecture` classes when minimizing of legacy architecture is enabled ([0d1cde7f36](https://github.com/facebook/react-native/commit/0d1cde7f36e9de72c997fc812bba023694c2a369) by [@mdvacca](https://github.com/mdvacca))
- **Metro:** Bump Metro to `^0.82.5` ([083644647e](https://github.com/facebook/react-native/commit/083644647eff502f484b3ba24f9d361d5df56546) by [@robhogan](https://github.com/robhogan))
- **React DevTools:** Bumped React DevTools to `6.1.5` ([c302902b1d](https://github.com/facebook/react-native/commit/c302902b1db7e8f8ac5b61472c095dc0755d6d1c) by [@hoxyq](https://github.com/hoxyq))
- **RuntimeExecutor:** `RuntimeExecutor`:  Remove noexcept from sync ui thread utils ([7ef278af50](https://github.com/facebook/react-native/commit/7ef278af505deba6b8a47876c6824f9a7fefa427) by [@RSNara](https://github.com/RSNara))
- **Typescript:** Bump `types/react` to `19.1` ([3ae9328571](https://github.com/facebook/react-native/commit/3ae932857174e9c39cd5d9c53922f849aa1401b1) by [@gabrieldonadel](https://github.com/gabrieldonadel))

#### Android specific

- **APIs:** Deprecate `DefaultNewArchitectureEntryPoint.load(Boolean, Boolean, Boolean)` ([efdf73983c](https://github.com/facebook/react-native/commit/efdf73983cef1f371511b6e1efa5e01835ebcabb) by [@cortinico](https://github.com/cortinico))
- **APIs:** Make `com.facebook.react.views.common.ContextUtils` internal ([d1ef8f1fa3](https://github.com/facebook/react-native/commit/d1ef8f1fa36cbfc34d05c409abf693e4e1cac3de) by [@cortinico](https://github.com/cortinico))
- **deps:** Bump `AGP` to `8.11.0` ([04858ecbab](https://github.com/facebook/react-native/commit/04858ecbab808ddca80e20e76f1359619bb5e865) by [@cortinico](https://github.com/cortinico))
- **deps:** Bump `Gradle` to `8.14.2` ([e20bb56f3b](https://github.com/facebook/react-native/commit/e20bb56f3b4db0d3e69154b95b952b1fe8e29959) by [@cortinico](https://github.com/cortinico))
- **JS FPS:** Hide JS FPS on performance overlay as not accurate ([feec8d0148](https://github.com/facebook/react-native/commit/feec8d014877b2177f1c7dded7eb9664f53ee471) by [@cortinico](https://github.com/cortinico))
- Updated targetSdk to 36 in Android. ([477d8df312](https://github.com/facebook/react-native/commit/477d8df3126b325b8cc9b410f1eaeb56b727d4d9) by [@kikoso](https://github.com/kikoso))
- **Kotlin:** Convert `UIManagerModuleConstantsHelper` to Kotlin ([45fd7feb9f](https://github.com/facebook/react-native/commit/45fd7feb9f083e5c8afc916732aed9795d344e09) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Migrate `ThemedReactContext` to Kotlin ([78c9671c24](https://github.com/facebook/react-native/commit/78c9671c241a86bedb17862e549842b7e36d77ea) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Convert `ReactViewGroup` to Kotlin ([48395d346b](https://github.com/facebook/react-native/commit/48395d346bc89f63d38889e58508304df0088e4f) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Migrate `com.facebook.react.LazyReactPackage` to Kotlin. ([b4ae5c1de1](https://github.com/facebook/react-native/commit/b4ae5c1de1003c343d43c3be1b59ee2b800b9258) by [@Xintre](https://github.com/Xintre))
- **Kotlin:** Apply Collections Kotlin DSL helpers in `ReactAndroid` package ([b2ffd34a39](https://github.com/facebook/react-native/commit/b2ffd34a392de2bddba5ee13248796ccc2db6039) by [@l2hyunwoo](https://github.com/l2hyunwoo))

#### iOS specific

- **Accessibility:** Only generate recursive accessibility label for accessible elements ([7e2f17ffe2](https://github.com/facebook/react-native/commit/7e2f17ffe229e09288deba9061221835300ec153) by [@janicduplessis](https://github.com/janicduplessis))
- **GC:** Hermes GC is now triggered in response to iOS memory pressure warning. ([12b2b56102](https://github.com/facebook/react-native/commit/12b2b5610263cb145d1ade8eaf06d8a6e015b10e) by [@yungsters](https://github.com/yungsters))
- **Gradients:** Optimised Radial Gradients. ([f238b74658](https://github.com/facebook/react-native/commit/f238b74658fd155366d4909872ab06781403f31d) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **Gradients:** Optimised Linear Gradients. ([2f3b104224](https://github.com/facebook/react-native/commit/2f3b1042249411e84f9a1d5bb1191461cd2dc5ee) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **Prebuild:** Simplified logging in prebuild scripts ([1477cc0dbd](https://github.com/facebook/react-native/commit/1477cc0dbdee4b50fee4b1b98346812868148aa5) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Fail fast when pod install if using prebuild and frameworks are not present in the disk. ([60c01b4715](https://github.com/facebook/react-native/commit/60c01b4715053bccbeca2673ff1be1fca60bce9b) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Update `ReactCodegen` to support Core prebuilds ([152cb538f6](https://github.com/facebook/react-native/commit/152cb538f69cd07422526802defe3f3617302098) by [@chrfalch](https://github.com/chrfalch))

### Deprecated

- **hasTVPreferredFocus:** Deprecate `hasTVPreferredFocus` ([cfb6c968dd](https://github.com/facebook/react-native/commit/cfb6c968ddce56138553a9d2e0cc8dfc666eb943) by [@Abbondanzo](https://github.com/Abbondanzo))
- **SafeAreaView:** Deprecate `SafeAreaView` due to its iOS-only support and incompatibility with Android 15 edge-to-edge behavior; recommend using `react-native-safe-area-context` instead. ([73133a31d5](https://github.com/facebook/react-native/commit/73133a31d5a47e71edd4e6b798184df8045e2234) by [@kikoso](https://github.com/kikoso))
- **ShadowNode:** `ShadowNode::Shared` is now deprecated. Use `std::shared_ptr<const ShadowNode>` instead. ([0e175ce5b6](https://github.com/facebook/react-native/commit/0e175ce5b6c80a21237f5cd0f20c9876fa975935) by [@sammy-SC](https://github.com/sammy-SC))
- **ShadowNode:** Deprecate type aliases `ShadowNode::Unshared` and `ShadowNode::Weak` in favour of `std::shared_ptr<ShadowNode>` and `std::weak_ptr<ShadowNode>` ([12fb101e30](https://github.com/facebook/react-native/commit/12fb101e306778b6e5399b23f822cc0874a5c386) by [@sammy-SC](https://github.com/sammy-SC))

#### iOS specific

- **RCTFollyConvert:** `RCTFollyConvert.h` is deprecated please use `/ReactCommon/react/utils/platform/ios/react/utils/FollyConvert.h` instead ([685a60e6b4](https://github.com/facebook/react-native/commit/685a60e6b44018531abf47f98fd38d9c75f6aca6) by [@sammy-SC](https://github.com/sammy-SC))

### Removed

- **Yoga:** Remove `YogaLayoutableShadowNode::cleanLayout()` and Fix `ParagraphShadowNode` Font Size Invalidation Logic ([7979c7ce06](https://github.com/facebook/react-native/commit/7979c7ce0664bf019e17781e95a74baf95ec89f1) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- **APIs:** Internalize `NetworkingModule`'s `UriHandler`, `RequestBodyHandler`, and `ResponseHandler` APIs ([987e3f8c00](https://github.com/facebook/react-native/commit/987e3f8c0031affe89218675061eca3a4620e0cd) by [@huntie](https://github.com/huntie))
- **DeveloperSettings:** Remove deprecated `isStartSamplingProfilerOnInit` from `DeveloperSettings` ([ccb9edc717](https://github.com/facebook/react-native/commit/ccb9edc7179ec1b568038408118971c2ee4c1b27) by [@cortinico](https://github.com/cortinico))
- **JSC:** Remove 1st party JSC support ([8174d02811](https://github.com/facebook/react-native/commit/8174d028116f00b6e89968d368b719ec8b7f6ff6) by [@cortinico](https://github.com/cortinico))
- **JSEngineResolutionAlgorithm:** Remove and cleanup `JSEngineResolutionAlgorithm` ([0954c1db45](https://github.com/facebook/react-native/commit/0954c1db45511d1a640deb8d921d26457bb3777c) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- **JSC:** Remove code from jsc folder from React Native ([331fab0683](https://github.com/facebook/react-native/commit/331fab068355a3ba78776fbdf7e75ff4af3b740f) by [@cipolleschi](https://github.com/cipolleschi))
- **JSC:** Remove the option to use JSC from core ([a6ea626255](https://github.com/facebook/react-native/commit/a6ea6262555e7a25e27934f33099e95cb45c8077) by [@cipolleschi](https://github.com/cipolleschi))
- **Turbo Modules** Disable Turbo Modules fix for #51103 (dictionary stripped out when value is null) until more testing can be done. ([ca5f4d1721](https://github.com/facebook/react-native/commit/ca5f4d1721878ccd81ddcb9267f30160c6d17dd4) by [@javache](https://github.com/javache))

### Fixed

- **APIs:** Renamed argument names in the `onContentSizeChange` callback's type definition ([0386b9bd51](https://github.com/facebook/react-native/commit/0386b9bd5144b785af51c96ea6bada5c55127e98) by [@pchalupa](https://github.com/pchalupa))
- **BindingsInstallerHolder:** Fixed deprecation message for `BindingsInstallerHolder` ([4a8fda83e3](https://github.com/facebook/react-native/commit/4a8fda83e3d0f8aa0e5ac0c427c30fd9170ad375) by [@tomekzaw](https://github.com/tomekzaw))
- **C++:** Add `default:` case to avoid warnings/errors for targets that compile with `-Wswitch-enum` and `-Wswitch-default` enabled ([22b8b53c77](https://github.com/facebook/react-native/commit/22b8b53c77cb2fe87aa54be92d1758a603b7dd35) by [@NSProgrammer](https://github.com/NSProgrammer))
- **C++:** Add `default:` case to avoid warnings/errors for targets that compile with `-Wswitch-enum` and `-Wswitch-default` enabled ([9079b53c6f](https://github.com/facebook/react-native/commit/9079b53c6fa4ec9494f22390a89d1d42b77108a8) by [@NSProgrammer](https://github.com/NSProgrammer))
- **C++:** Fix clang tidy for react-native ([3e49d17f58](https://github.com/facebook/react-native/commit/3e49d17f58b9b7cc051925f43b709b020745312c) by [@RSNara](https://github.com/RSNara))
- **Color APIs:** Fix the serialization of the alpha channel in the `rgba()` color string format. ([1cc12ce7fd](https://github.com/facebook/react-native/commit/1cc12ce7fd5c8c766872906b4175122558d369a0) by [@piaskowyk](https://github.com/piaskowyk))
- **Color APIs:** Fix incorrect flattening / non-rendering of views with `backgroundColor` set to `rgba(255, 255, 255, 127/256)` ([b1e8729f4d](https://github.com/facebook/react-native/commit/b1e8729f4dfcb065978887b94a9e0ca65cdcfa77) by [@rubennorte](https://github.com/rubennorte))
- **Fantom:** Support viewport offsets for Fantom root and fix `getBoundingClientRect` to respect viewport offsets ([b5c62f52d1](https://github.com/facebook/react-native/commit/b5c62f52d185d6427425e25e6f18d0d86acaebf0) by [@lunaleaps](https://github.com/lunaleaps))
- **IntersectionObserver:** Fix potential leak inside `IntersectionObserver` ([a55f430daa](https://github.com/facebook/react-native/commit/a55f430daa4c9168272482125998da849840f9dd) by [@RSNara](https://github.com/RSNara))
- **LogBox:** Remove LogBox patch, de-duplicating errors ([e0797d0e03](https://github.com/facebook/react-native/commit/e0797d0e03bde6cd3321ff76556c5e2f0454ec63) by [@rickhanlonii](https://github.com/rickhanlonii))
- **ScrollView:** Expose `ScrollView.getNativeScrollRef` on the type definition to allow accessing the underlying `HostInstance`. ([4b91b63094](https://github.com/facebook/react-native/commit/4b91b630945b3d0f82656791d089451066aad538) by [@zbauman3](https://github.com/zbauman3))
- **Typescript:** Add `ImageSource` type to TypeScript ([42ca46b95c](https://github.com/facebook/react-native/commit/42ca46b95cf9938de00b76dc61948a4ae7116e2b) by [@okwasniewski](https://github.com/okwasniewski))
- **Typescript:** Devtools TS Types ([8f189fce03](https://github.com/facebook/react-native/commit/8f189fce03db367abdceca6ad57ae28b613fdd7d) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- **Yoga:** Fix possible invalid measurements with width or height is zero pixels ([5cc4d0a086](https://github.com/facebook/react-native/commit/5cc4d0a086d450e0f9d8ab6194013348f9de1f58) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- **BaseViewManager:** Remove focus change listener when dropping/recycling view instances ([94cbf206d6](https://github.com/facebook/react-native/commit/94cbf206d607477257c65039d97565a79e94c7dd) by [@Abbondanzo](https://github.com/Abbondanzo))
- **BoringLayout:** Include fallback line spacing in `BoringLayout` ([2fe6c1a947](https://github.com/facebook/react-native/commit/2fe6c1a94758223a5342fdfa90163971eb588e6a) by [@NickGerleman](https://github.com/NickGerleman))
- **Bridgeless:** Adding `shouldForwardToReactInstance` check in `ReactDelegate` for Bridgeless ([0f7bf66bba](https://github.com/facebook/react-native/commit/0f7bf66bba8498c89384e96ad9219cdad0107b0c) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **Codegen:** Fix combining schema in Codegen process to exclude platforms correctly ([6104ccdc6e](https://github.com/facebook/react-native/commit/6104ccdc6ef89c2d4da25e60dcc55d73038e023f) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **Edge To Edge:** Fix `Dimensions` `window` values on Android < 15 when edge-to-edge is enabled ([85d10ed904](https://github.com/facebook/react-native/commit/85d10ed90401a13de1f74aeddd773736195da285) by [@zoontek](https://github.com/zoontek))
- **FBReactNativeSpec:** Extract out `FBReactNativeSpec`'s core components including Unimplemented from auto-generated registry ([b417b0c2d5](https://github.com/facebook/react-native/commit/b417b0c2d56dc37f824c0e77e98d1014d21cd8f8) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **Gradle:** Fix Gradle v8.0 builds by using .set() for Property ([777397667c](https://github.com/facebook/react-native/commit/777397667c2625aab3fc907b9ef4bd564963d8bb) by [@meghancampbel9](https://github.com/meghancampbel9))
- **ImageFetcher:** Change `free` to `delete` to call destructor of `ImageFetcher` and release `contextContainer`. ([90da666691](https://github.com/facebook/react-native/commit/90da666691745ab9bf3930dc3347d8e51683099f) by [@WoLewicki](https://github.com/WoLewicki))
- **Modal:** Fix `Modal` first frame being rendered on top-left corner ([b950fa2afb](https://github.com/facebook/react-native/commit/b950fa2afb20e2213ff6c733cb1c2465b90406ef) by [@cortinico](https://github.com/cortinico))
- **onTextLayout:** Fix `onTextLayout` metrics not incorporating `ReactTextViewManagerCallback` ([a6a2884d63](https://github.com/facebook/react-native/commit/a6a2884d63717a42ac2bafd2054991ce8b32a2e9) by [@NickGerleman](https://github.com/NickGerleman))
- **Text:** Fix more text rounding bugs ([1fe3ff86c3](https://github.com/facebook/react-native/commit/1fe3ff86c364fad023ad1e426f26608699314339) by [@NickGerleman](https://github.com/NickGerleman))
- **Text:** Fix `TextLayoutManager` `MeasureMode` Regression ([99119a2104](https://github.com/facebook/react-native/commit/99119a210487af18983145fd374ff7ebc88931f3) by [@NickGerleman](https://github.com/NickGerleman))
- **TextInput:** Fix bug where focus would jump to top text input upon clearing a separate text input. ([79c47987b7](https://github.com/facebook/react-native/commit/79c47987b74ab044574fc542fd4b13a9f11aa491) by [@joevilches](https://github.com/joevilches))

#### iOS specific

- **Gradient**: Gradient interpolation for transparent colors ([097d482446](https://github.com/facebook/react-native/commit/097d482446b7a03ca0f8c7e0254f4d770e05c79c) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **Prebuild:** Fixed wrong path in prebuild hermes check ([be11f2ee77](https://github.com/facebook/react-native/commit/be11f2ee77fd793efe0a1aa225897a1924163925) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Fixed resolving build type when downloading hermes artifacts ([9371e20192](https://github.com/facebook/react-native/commit/9371e201927fd105e797bf06e43943dd21e04381) by [@chrfalch](https://github.com/chrfalch))
- **Package.swift:** Add missing `React-RCTSettings` to `Package.swift` ([e40c1d265a](https://github.com/facebook/react-native/commit/e40c1d265a2045730dcf751eed4ebf32e099f0c7) by [@chrfalch](https://github.com/chrfalch))
- **Package.swift:** Fixed defines in `Package.swift` ([e2f6ce4ddf](https://github.com/facebook/react-native/commit/e2f6ce4ddfbea5814fc5d8632df14daeae3636d1) by [@chrfalch](https://github.com/chrfalch))
- **RCTImage:** Allow for consuming `RCTImage` in Swift codebase by enabling "Defines Module" option ([1d80586730](https://github.com/facebook/react-native/commit/1d8058673085580f402ec3a320fce810db7ad2ef) by [@kkafar](https://github.com/kkafar))
- **RCTImageComponentView:** Fix `RCTImageComponentView` image loading after source props change with no layout invalidation ([cd5d74518b](https://github.com/facebook/react-native/commit/cd5d74518becb3355519373211d2f54ff7dbd208) by Nick Lefever)
- **RCTScreenSize:** Make `RCTScreenSize` take horizontal orientation into account ([50ce8c77a7](https://github.com/facebook/react-native/commit/50ce8c77a74f2f2574030db04dc88c6092e68ba8) by [@okwasniewski](https://github.com/okwasniewski))
- **TextInput:** Fixed blank space at the bottom of multiline `TextInput` on iOS ([2da4a6059a](https://github.com/facebook/react-native/commit/2da4a6059a82430fa7c1c078f0dcd38f0d3fe3cb) by [@tomekzaw](https://github.com/tomekzaw))
- **Turbo Modules:** Turbo Modules- Fixes dictionary stripped out when value is `null` ([4a4fd1cb8b](https://github.com/facebook/react-native/commit/4a4fd1cb8bb06eee185a3b2463caec4d2b7e9235) by [@zhongwuzw](https://github.com/zhongwuzw))

## v0.80.1

### Added

- **Flow:** Publish top-level Flow types for `react-native` ([fbbd20dd63](https://github.com/facebook/react-native/commit/fbbd20dd632acd72d2abe861dd4a0e6e98437cf2) by [@buschco](https://github.com/buschco))
- **Flow:** Fix typo when publishing Flow types for `react-native` ([50667eceb1](https://github.com/facebook/react-native/commit/50667eceb1be4771375d6a3cc2f4e42d4d8aad3a) by [@aswinandro](https://github.com/aswinandro))

### Fixed

- **jest:** Fix missing RefreshControlMock source in Jest preset ([6044e01460](https://github.com/facebook/react-native/commit/6044e01460a065845d4178f0fdc54a601ce4c07e) by [@huntie](https://github.com/huntie))

#### Android specific

- **runtime:** Fix crash on ReactInstance due to null returned for getViewManagerNames ([f6b7bd93d8](https://github.com/facebook/react-native/commit/f6b7bd93d8d0d2095669144c8de438cf64d8e73f) by [@cortinico](https://github.com/cortinico))
- **TurboModules:** Emitting event from turbo module crashes on 32bit android ([36ddf853c3](https://github.com/facebook/react-native/commit/36ddf853c381966645789bc814fc2f6bb4d74cd2) by [@vladimirivanoviliev](https://github.com/vladimirivanoviliev))

## v0.80.0

### Breaking

- **APIs:** Subpath imports to the internal react-native/virtualized-lists package are not allowed. ([be8393c41b](https://github.com/facebook/react-native/commit/be8393c41b3d613385a2ee4632438030e80d6b2d) by [@iwoplaza](https://github.com/iwoplaza))
- **APIs:** The `react-native` package now defines package.json `"exports"`. ([319ba0afd2](https://github.com/facebook/react-native/commit/319ba0afd2f694bc70a20250f0b8c79a06a36dc6) by [@huntie](https://github.com/huntie))
- **C++:** Dispatch `folly::dynamic` events with r-value instead of l-value ([12e5df844b](https://github.com/facebook/react-native/commit/12e5df844bf60c19a825e5c5738d765a8562945c) by [@rozele](https://github.com/rozele))
- **C++:** Introduce beforeload callback arg into `ReactInstance::loadScript` ([061174c150](https://github.com/facebook/react-native/commit/061174c150ad05e0ea3fad3cdddb44df9710c337) by [@RSNara](https://github.com/RSNara))
- **deps:** Updated `eslint-config-react-native` to depend on `eslint-plugin-react-hooks` v5.2.0 from v4.6.0. This includes a breaking change in which ESLint will no longer recognize component names that start with 1 or more underscores followed by a capital letter. (https://github.com/facebook/react/pull/25162) ([4de592756b](https://github.com/facebook/react-native/commit/4de592756bb39d4fc99698c96d2f69dea46d82e1) by [@yungsters](https://github.com/yungsters))
- **NewAppScreen:** The `NewAppScreen` component is redesigned and moved to the `react-native/new-app-screen` package ([3cf0102007](https://github.com/facebook/react-native/commit/3cf01020071c76f40499878674cc7aaf5dbe168a) by [@huntie](https://github.com/huntie))

#### Android specific

- **APIs:** Deleting `ChoreographerCompat`, Use `Choreographer.FrameCallback` instead ([f8b2956437](https://github.com/facebook/react-native/commit/f8b2956437c23dd63463becc704b569bd8fcb19e) by [@mdvacca](https://github.com/mdvacca))
- **APIs:** Deleting deprecated `StandardCharsets` ([40b38d0a44](https://github.com/facebook/react-native/commit/40b38d0a44c7c83d36e34c9689ec3a2ac5d85b6b) by [@mdvacca](https://github.com/mdvacca))
- **APIs:**: Make `DeviceInfoModule` internal ([f02607badb](https://github.com/facebook/react-native/commit/f02607badb5641ab235f41be8005ce62d2bd63d4) by [@mateoguzmana](https://github.com/mateoguzmana))
- **APIs:**: Make `ModuleDataCleaner` internal ([6fa1864d52](https://github.com/facebook/react-native/commit/6fa1864d52fc47c37aeb5e0f99d972dee92f6ede) by [@mateoguzmana](https://github.com/mateoguzmana))
- **DevX:** Removed `loadSplitBundleFromServer` from `DevSupportManager` interface ([86cd31eb6b](https://github.com/facebook/react-native/commit/86cd31eb6bb72de0791a62b39b64a155c791f034) by [@javache](https://github.com/javache))
- **Kotlin:** Convert `ColorPropConverter` to Kotlin ([57768bfbcd](https://github.com/facebook/react-native/commit/57768bfbcd84100e244bff4910d46643559c015d) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Kotlin:** Convert `DevSupportManagerBase` to Kotlin. If you're subclassing this class, you will have to adjust some of the parameters as types have changed during the migration. ([9da485b54c](https://github.com/facebook/react-native/commit/9da485b54c2deec324775f59cb36080baee9d4c9) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Convert `NetworkModule` to Kotlin, mark methods as final ([8726e26348](https://github.com/facebook/react-native/commit/8726e263486d07d71e0cd80eba5a4c52705fdb14) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Kotlin:** Convert `ReactEditText` to Kotlin. If you're subclassing this type you'll need to adjust your signatures. ([cac27d15be](https://github.com/facebook/react-native/commit/cac27d15bef39e1a4bf7e3279e85a7bae4ee3a9c) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Convert `ReactInstanceDevHelper` to Kotlin. Some users implementing this class in Kotlin could have breakages. As this is a devtools/frameworks API we're not marking this as breaking. ([09492075e8](https://github.com/facebook/react-native/commit/09492075e827f96d9ce9a5d689ac7d0a44380a33) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Convert `ReactTextInputManager` to Kotlin ([ab47834eb1](https://github.com/facebook/react-native/commit/ab47834eb1910b4da1c594843cf1ab5dc02d23c1) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- **APIs:** Delete `BridgeModuleBatchDidComplete` config helpers ([cbad8aafa5](https://github.com/facebook/react-native/commit/cbad8aafa541546c82e8079f6ef1a54ce8df83b3) by [@philIip](https://github.com/philIip))
- **NativeModules:** Cleanup queue configs for some native modules ([5b5cf0e199](https://github.com/facebook/react-native/commit/5b5cf0e1995b11336ed029a7afc8eba1f02ac9d1) by [@philIip](https://github.com/philIip))

### Added

- **Accessibility:** Add accessibilityOrder to iOS and Android ([8cf4d5b531](https://github.com/facebook/react-native/commit/8cf4d5b531647375b202130bd2d3b8b2f6dce8e3) by [@jorge-cab](https://github.com/jorge-cab))
- **Codegen:** Codegen utility functions and types are now exported from the root package ([c7aa3f3fe7](https://github.com/facebook/react-native/commit/c7aa3f3fe722731fa7383385bce541eac860feca) by [@j-piasecki](https://github.com/j-piasecki))
- **Events:** Add `UIManager::add/RemoveEventListener` ([b0f2083d9d](https://github.com/facebook/react-native/commit/b0f2083d9d881c8b0629fa455f6eb0c963e7e531) by [@zeyap](https://github.com/zeyap))
- **Events:** EventEmitter `addListener` and `removeListener` APIs ([ff4537c15e](https://github.com/facebook/react-native/commit/ff4537c15ecef319ff3dfc87613e4696d280c643) by [@rozele](https://github.com/rozele))
- **Image:** Support headers [crossOrigin and referralPolicy] in Image without src and srcSet and only remote source.uri ([49ea9d80b8](https://github.com/facebook/react-native/commit/49ea9d80b883b50d242908bb47881b2680302291) by [@anupriya13](https://github.com/anupriya13))
- **JS:** Add `compact` option to `react-native/babel-preset` to allow disabling whitespace removal ([86911003dc](https://github.com/facebook/react-native/commit/86911003dc396afd3e2016b7435d56c2269c33ff) by [@jnields](https://github.com/jnields))
- **JS:** Added `no-deep-imports` rule to `eslint-plugin-react-native`. ([87809d9326](https://github.com/facebook/react-native/commit/87809d9326f7463e30bbf78edca0ef2a2fa139d9) by [@coado](https://github.com/coado))
- **Networking:** Implementation for `URLSearchParams` ([af1f1e4fe5](https://github.com/facebook/react-native/commit/af1f1e4fe5cb6514d2e806fe0ad5b505e86c0f4b) by Ritesh Shukla)
- **Networking:** URL accessors for unimplemented Methods ([3dac90006f](https://github.com/facebook/react-native/commit/3dac90006fe046fd7b1fcedd93955cc88eaaed6f) by [@riteshshukla04](https://github.com/riteshshukla04))
- **NewArch:** Add warning when the app runs with the legacy architecture ([706b6e878d](https://github.com/facebook/react-native/commit/706b6e878d7d503ed870d6635ae1f963a34e8ccd) by [@cipolleschi](https://github.com/cipolleschi))
- **Pressable:** Expose `onPressMove` as base prop for `Pressable` ([6df938c72e](https://github.com/facebook/react-native/commit/6df938c72eb9b71ad626462127164fbb6cd4947c) by Regina Tuk)
- **ScrollView:** Add `showsVerticalScrollIndicator` in ScrollViewProps.cpp `SetProp` ([bc90c839aa](https://github.com/facebook/react-native/commit/bc90c839aa8efb6f721a9b72a7b8248a0da3a219) by [@anupriya13](https://github.com/anupriya13))
- **StyleSheet:** Added slash of alpha support using rgb() ([7441127040](https://github.com/facebook/react-native/commit/7441127040f6da52f04b3bccc37894e51d09c6b2) by [@zhongwuzw](https://github.com/zhongwuzw))
- **StyleSheet:** Adds JS changes for radial gradient ([1b45dc8033](https://github.com/facebook/react-native/commit/1b45dc8033e1064b2485c8b855a05634e2c1163f) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **StyleSheet:** CSS Added hwb(H W B / A) notation ([692b05e77d](https://github.com/facebook/react-native/commit/692b05e77d42c9b3ef6dfcbb31f6a11ba0f1e5a3) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Testing:** Added a custom Jest resolver to opt out from handling `"exports"` in tests ([ee9bd851ac](https://github.com/facebook/react-native/commit/ee9bd851acfc38150f434d676602865ba8cec591) by [@j-piasecki](https://github.com/j-piasecki))
- **Text:** Support `minimumFontScale` in `paragraphAttributes` ([f53d066d26](https://github.com/facebook/react-native/commit/f53d066d26352e6abfdf2f727ea06425ea163039) by [@anupriya13](https://github.com/anupriya13))
- **TurboModules:** Create `TurboModuleWithJSIBindings` interface ([1acd45950b](https://github.com/facebook/react-native/commit/1acd45950bb85560e2578fa6feaa9e5666c1b65e) by [@zeyap](https://github.com/zeyap))
- **TypeScript:** Added type definitions for Colors object in LaunchScreen module to enhance code readability and type safety. ([c2864c160d](https://github.com/facebook/react-native/commit/c2864c160dac3253dc20c598865884f8b4c67163) by [@qnnp-me](https://github.com/qnnp-me))
- **TypeScript:** Configure the "react-native-strict-api" opt in for our next-gen TypeScript API ([6ea24f7bb9](https://github.com/facebook/react-native/commit/6ea24f7bb90829f0806210252dfce50ecee5666d) by [@huntie](https://github.com/huntie))
- **runtime:** Allow setting `SurfaceStartedCallback` on `UIManager` ([c5e9ef53ae](https://github.com/facebook/react-native/commit/c5e9ef53ae9bfe6ea06ddee54228ada0305e4df7) by [@zeyap](https://github.com/zeyap))
- **runtime:** Move rncxx scheduler to oss ([744a0f8385](https://github.com/facebook/react-native/commit/744a0f8385c0dacfbd25446d08cb6e1640a5a2f9) by [@zeyap](https://github.com/zeyap))

#### Android specific

- **Accessibility:** Expose Android's `screenReaderFocusable` prop ([4ce093154d](https://github.com/facebook/react-native/commit/4ce093154d8fe130fca1f8da57067a666171db7f) by [@jorge-cab](https://github.com/jorge-cab))
- **Animated:** Create `UIManagerNativeAnimatedDelegate` to potentially drive per frame NativeAnimated update ([8d6098a645](https://github.com/facebook/react-native/commit/8d6098a645745fa964bac475ff14598d0cdfd11a) by [@zeyap](https://github.com/zeyap))
- **APIs:** Collections DSL functions for Kotlin(`buildReadableMap`, `buildReadableArray`) ([78dbbaafdd](https://github.com/facebook/react-native/commit/78dbbaafdd4a732f6cbb1525816b38a51adcf1cf) by [@l2hyunwoo](https://github.com/l2hyunwoo))
- **C++:** Allow invoking `synchronouslyUpdateViewOnUIThread` from c++ via `UIManager` ([4912958812](https://github.com/facebook/react-native/commit/49129588123fe05c828fae036b9521f4ba6fe84c) by [@zeyap](https://github.com/zeyap))
- **infra:** Generate `keep.xml` to prevent resource shrinking ([864833fca9](https://github.com/facebook/react-native/commit/864833fca9334ba0b986243fce790e89ff64d932) by [@jakex7](https://github.com/jakex7))
- **NewArch:** Add a `legacyWarningsEnabled` property to enable Legacy Warnings on NewArch ([7ca2811750](https://github.com/facebook/react-native/commit/7ca28117507688864af0561a0350d46666410291) by [@cortinico](https://github.com/cortinico))
- **NewArch:** Warn Legacy Arch users if they use a Component with a ShadowNode with `YogaMeasureFunction.measure()` function. That Component will stop working on NewArch. ([9345c88a61](https://github.com/facebook/react-native/commit/9345c88a619f36537e25cf28b79d2c01cd40f780) by [@cortinico](https://github.com/cortinico))
- **StyleSheet:** Adds android changes for radial gradient ([a2409941c2](https://github.com/facebook/react-native/commit/a2409941c20f63d0339e2f2b1c9a2e942d29ca2e) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **TextInput:** Add new prop for filtering drag and drop targeting to text inputs ([d10dd7130c](https://github.com/facebook/react-native/commit/d10dd7130ccc61c3f183f96edb8fec1279ec8a9a) by [@Abbondanzo](https://github.com/Abbondanzo))

#### iOS specific

- **Accessibility:** Expose iOS's `accessibilityRespondsToUserInteraction` as a prop ([fd8a3456ca](https://github.com/facebook/react-native/commit/fd8a3456cac72634cc149904e157e07257dbf364) by [@jorge-cab](https://github.com/jorge-cab))
- **AppDelegate:** Allow eager initialization of `RCTRootViewFactory` ([ddbb5fda09](https://github.com/facebook/react-native/commit/ddbb5fda09ff3daaa69e195d2d872bc88480e707) by [@mdjastrzebski](https://github.com/mdjastrzebski))
- **AppDelegate:** On `RCTReactNativeFactory` add `initWithDelegate` overload with argument to specify release level for an application ([df282a0538](https://github.com/facebook/react-native/commit/df282a0538224258a48ef77ebf9b9d2ed77ed5d5) by [@jorge-cab](https://github.com/jorge-cab))
- **AppDelegate:** Useful error message about setting dependency provider ([e1464c0975](https://github.com/facebook/react-native/commit/e1464c097550bb9251513ba64547f4c5afdc838d) by [@okwasniewski](https://github.com/okwasniewski))
- **Codegen:** Introduce module/component annotations inside package.json ([76436d35c7](https://github.com/facebook/react-native/commit/76436d35c73772f161071066b98b640bf68094ea) by [@RSNara](https://github.com/RSNara))
- **InteropLayer:** Enabled `useFabricInterop` by default in OSS ([21c858ce3e](https://github.com/facebook/react-native/commit/21c858ce3ef55a9812c8e53d3a1b40836564dd6c) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **NewArch:** Add flag to enable or disable legacy warning. ([ce7a602edf](https://github.com/facebook/react-native/commit/ce7a602edfe1e7121b4e7b05b80e338304dcf579) by [@cipolleschi](https://github.com/cipolleschi))
- **NewArch:** Add warnings when a legacy module is used in the Interop Layer. ([7b500b8522](https://github.com/facebook/react-native/commit/7b500b8522792b26b0afe8c33dedd460c6d99227) by [@cipolleschi](https://github.com/cipolleschi))
- **NewArch:** Add warnings when components are loaded using the interop layer. ([8acc53da57](https://github.com/facebook/react-native/commit/8acc53da57d3295cf76ae61e183e7c42973928f4) by [@cipolleschi](https://github.com/cipolleschi))
- **NewArch:** Automate setting the RCTNewArchEnabled flag ([3b3d502ccf](https://github.com/facebook/react-native/commit/3b3d502ccfc163ecb8531fb465032e831980b8af) by [@cipolleschi](https://github.com/cipolleschi))
- **NewArch:** Show warnings in the New Architecture when modules are loaded using RCT_EXPORT_MODULE ([4d40882172](https://github.com/facebook/react-native/commit/4d40882172a303cdb0f8ff96e0884749f4ebc840) by [@cipolleschi](https://github.com/cipolleschi))
- **StyleSheet:** Radial gradient ([d7533dce1c](https://github.com/facebook/react-native/commit/d7533dce1cdb4c0bc70deeab68f53752d13becf2) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **TextInput:** Add new prop for filtering drag and drop targeting to text inputs ([93f12eb71d](https://github.com/facebook/react-native/commit/93f12eb71d20feb0d7b96758df6c53b0277032f5) by [@Abbondanzo](https://github.com/Abbondanzo))
- **TurboModules:** Introduce unstableRequiresMainQueueSetup api to modules ([636665c1c2](https://github.com/facebook/react-native/commit/636665c1c20d1ba51f16eea18664e3cd35308518) by [@RSNara](https://github.com/RSNara))

### Changed

- **Animated:** Animated components' `ref` will now only reattach when receiving new props if the new props contain different `AnimatedValue` or `AnimatedEvent` instances. (Previously, Animated components' `ref` would always reattach when receiving new props.) ([eeab47e61a](https://github.com/facebook/react-native/commit/eeab47e61a32b5fe33352a58ad7b8ac0a652ba6b) by [@yungsters](https://github.com/yungsters))
- **Animated:** When an `Animated` component is unmounted, any completion callbacks will now be called in a microtask instead of during the commit phase. ([da1bf8d1d1](https://github.com/facebook/react-native/commit/da1bf8d1d1b83b8cee76e94987d94d9ffba6db51) by [@yungsters](https://github.com/yungsters))
- **APIs:** InteractionManager is deprecated and will be removed in a future release. Its behavior has been changed to be the same as `setImmediate`, and callers should migrate away from it. ([a8a4ab10d0](https://github.com/facebook/react-native/commit/a8a4ab10d0ee6004524f0e694e9d5a41836ad5c4) by [@yungsters](https://github.com/yungsters))
- **Codegen:** Changed `react-native-codegen` to support types under `CodegenTypes` namespace ([5349b7c7b5](https://github.com/facebook/react-native/commit/5349b7c7b586a86adcfa6f123aa138efac5811ce) by [@j-piasecki](https://github.com/j-piasecki))
- **deps:** Bump minimum Metro from 0.81.0 to ^0.81.3 || ^0.82.0 ([6606a1da84](https://github.com/facebook/react-native/commit/6606a1da8434a8d59d898a56e277f4130442d2ad) by [@robhogan](https://github.com/robhogan))
- **deps:** Bump React to 19.1 ([0e11e6a28b](https://github.com/facebook/react-native/commit/0e11e6a28bf3a12e30b5c6a7e93f3a5653888375) by [@cipolleschi](https://github.com/cipolleschi))
- **deps:** Replace hsr_core dependency for react profiling with hz_tracing dependency ([0f55ef7754](https://github.com/facebook/react-native/commit/0f55ef7754109c68a0bd10d958d8c81ead5e42e2) by [@metaadrianstone](https://github.com/metaadrianstone))
- **deps:** Update debugger-frontend from bc635fa...343405b ([647af1c4ca](https://github.com/facebook/react-native/commit/647af1c4ca219515ab00b442370b61346ba1edb1) by [@huntie](https://github.com/huntie))
- **deps:** Update Metro to ^0.82.0 ([0ad192003e](https://github.com/facebook/react-native/commit/0ad192003ef786c7dd1322762690d63730f17582) by [@robhogan](https://github.com/robhogan))
- **Flow:** Changed Flow for the React Native monorepo, so that `React` no longer has to be in scope when using JSX. ([1bb7446993](https://github.com/facebook/react-native/commit/1bb7446993e5151b92367f33f5bed3f5783f471a) by [@yungsters](https://github.com/yungsters))
- **Hermes:** Configured Hermes Parser for Metro to target React 19, resulting in Component Syntax no longer producing `forwardRef` calls. ([f2518d4374](https://github.com/facebook/react-native/commit/f2518d43746fbf712b8cb0ca920f134005c1faec) by [@yungsters](https://github.com/yungsters))
- **Hermes:** Configured Hermes Parser for ReactNative to target React 19, resulting in Component Syntax no longer producing `forwardRef` calls. ([68cad5d2d3](https://github.com/facebook/react-native/commit/68cad5d2d3c3b364a86767b0dfe4f92086223a7c) by [@yungsters](https://github.com/yungsters))
- **JS:** `eslint-config-react-native` now respects rules disabled by `eslint-config-prettier`. ([6346689c3d](https://github.com/facebook/react-native/commit/6346689c3d0420c1d6b85ca8db1e4f3fa115c5e9) by [@yungsters](https://github.com/yungsters))
- **JS:** Replaced `let` with `const` where applicable for better code standards and micro-optimization. ([38fefb2771](https://github.com/facebook/react-native/commit/38fefb2771d7ff65568fa989f2ca4a5bf44e58ec) by [@sanjaiyan-dev](https://github.com/sanjaiyan-dev))
- **TypeScript:** Re-expose `src/*` subpaths when not using the Strict TypeScript API ([1a46b203b8](https://github.com/facebook/react-native/commit/1a46b203b83d7cbe44185cd7e437e77b850e1af5) by [@huntie](https://github.com/huntie))
- **TypeScript:** Replace deprecated `React.ElementRef` usages to `React.ComponentRef` ([12147e3bee](https://github.com/facebook/react-native/commit/12147e3bee782a73c1560593912ad706d2262b0c) by [@mateoguzmana](https://github.com/mateoguzmana))

#### Android specific

- **API:** Make mHybridData in `CxxReactPackage` protected ([0c58ccf501](https://github.com/facebook/react-native/commit/0c58ccf501c1478242c28122bdc87bcd7389e56b) by [@zeyap](https://github.com/zeyap))
- **APIs:** Make ReactRawTextManager internal. We verified no popular libraries are impacted by this change ([788213f91a](https://github.com/facebook/react-native/commit/788213f91accd38be90b53bca218cd6cd050daeb) by [@cortinico](https://github.com/cortinico))
- **Blob:** Creating of Blobs from large files now works. File size can now be upto available (free) heap size. ([81e47af764](https://github.com/facebook/react-native/commit/81e47af7648c489e29982221552086db4a807b8d) by [@giantslogik](https://github.com/giantslogik))
- **C++:** Enable `INTERPROCEDURAL_OPTIMIZATION` for `libappmodules.so` in OSS ([2da062f9d1](https://github.com/facebook/react-native/commit/2da062f9d19196c338191cbc85c2e893a82f4107) by [@cortinico](https://github.com/cortinico))
- **C++:** Enable `INTERPROCEDURAL_OPTIMIZATION` for React Native ([f107c28d2f](https://github.com/facebook/react-native/commit/f107c28d2fe03bd10eada503aecf23fa966be9c5) by [@cortinico](https://github.com/cortinico))
- **deps:** AGP to 8.9.2 ([e4bf88a076](https://github.com/facebook/react-native/commit/e4bf88a0765c765e27236199d8138233c4590047) by [@cortinico](https://github.com/cortinico))
- **deps:** Gradle to 8.14 ([0e963aaa54](https://github.com/facebook/react-native/commit/0e963aaa54a0324b20795069bdf112e801ca2f62) by [@cortinico](https://github.com/cortinico))
- **deps:** Gradle to 8.14.1 ([827a6851d0](https://github.com/facebook/react-native/commit/827a6851d0a61c048fec7a73ca3b293ef90ad2ae) by [@cortinico](https://github.com/cortinico))
- **deps:** Kotlin to 2.1.20 ([a3d38d5722](https://github.com/facebook/react-native/commit/a3d38d57223dafac0c23c044bd78af020538591c) by [@cortinico](https://github.com/cortinico))
- **DevX:** Automatically use Metro bundler IP address when installing apps on Android ([d816ba0a70](https://github.com/facebook/react-native/commit/d816ba0a7005f413bc45510d34223f632e752c27) by [@hrastnik](https://github.com/hrastnik))
- **DevX:** Leading slash supplied to `DevServerHelper.downloadBundleResourceFromUrlSync` will now be trimmed and emit a warning. ([cf67427406](https://github.com/facebook/react-native/commit/cf67427406426efc9e03b279577056e8692a764b) by [@yungsters](https://github.com/yungsters))
- **Kotlin:** `ReactActivity` has been migrated to Kotlin. ([403feb9bc2](https://github.com/facebook/react-native/commit/403feb9bc25226120daf1daa1ec401b263b7e833) by [@rshest](https://github.com/rshest))
- **Kotlin:** Migrate `BlobProvider` to Kotlin ([5d1febf7de](https://github.com/facebook/react-native/commit/5d1febf7def124ef84e2224923d2b26fcdb81236) by [@JatinDream11](https://github.com/JatinDream11))
- **Kotlin:** Migrate `DevSupportManagerFactory` to Kotlin - We couldn't find any implementation of this class in OSS. Some Kotlin implementers might have to change the method signatures. However this interface is not supposed to be extended in OSS. ([0bd0635be6](https://github.com/facebook/react-native/commit/0bd0635be6b9102a02e62d2be430b1dba218cd36) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Migrate `DynamicFromArray` to Kotlin ([74e8c78268](https://github.com/facebook/react-native/commit/74e8c7826864c166efc735b6d419f9005452942d) by [@BogiKay](https://github.com/BogiKay))
- **Kotlin:** Migrate `DynamicFromMap.java` to Kotlin ([86a7388355](https://github.com/facebook/react-native/commit/86a738835555e3377f27ddee0e0083cae8c4804f) by [@artus9033](https://github.com/artus9033))
- **Kotlin:** Migrate `DynamicFromObject` to Kotlin ([867858df65](https://github.com/facebook/react-native/commit/867858df655445efca1bbfe3ddca55a30a11c7e5) by [@yasir6jan](https://github.com/yasir6jan))
- **Kotlin:** Migrate `FileReaderModule` to Kotlin ([07a1fb8e6b](https://github.com/facebook/react-native/commit/07a1fb8e6b3ef8f5ab2b53bd2c5ffff15467f7ea) by [@devanshsaini11](https://github.com/devanshsaini11))
- **Kotlin:** Migrate `FrescoBasedReactTextInlineImageShadowNode` to Kotlin ([30030c5a76](https://github.com/facebook/react-native/commit/30030c5a763280681782e27f26df1d451ff7f93c) by [@nitinshukla413](https://github.com/nitinshukla413))
- **Kotlin:** Migrate `Inspector` to Kotlin ([93efaeb241](https://github.com/facebook/react-native/commit/93efaeb241fcf037b22a92b127d5ffd9fe8bde0c) by [@Vin-Xi](https://github.com/Vin-Xi))
- **Kotlin:** Migrate `JavaModuleWrapper` to Kotlin ([79d3eea0b7](https://github.com/facebook/react-native/commit/79d3eea0b72fc50dab44135d502be2fb39128520) by drrefactor)
- **Kotlin:** Migrate `JSBundleLoader` to Kotlin ([de165a2cfd](https://github.com/facebook/react-native/commit/de165a2cfdb9967ae99237d8c9519cc2dd232855) by [@yogeshpaliyal](https://github.com/yogeshpaliyal))
- **Kotlin:** Migrate `NativeAnimatedModule` to kotlin ([de9b4f3642](https://github.com/facebook/react-native/commit/de9b4f36425cb4df6642e29528da33880623844b) by [@zeyap](https://github.com/zeyap))
- **Kotlin:** Migrate `NativeAnimatedNodesManager` to kotlin ([bfb274c244](https://github.com/facebook/react-native/commit/bfb274c244a9744b6f8cfc9c6b95cc7edca83ef1) by [@zeyap](https://github.com/zeyap))
- **Kotlin:** Migrate `ReactClippingViewGroupHelper` to Kotlin ([2834825b8b](https://github.com/facebook/react-native/commit/2834825b8ba01119b4ae3a01ec641defaea1a1f2) by priyanka.raghuvanshi)
- **Kotlin:** Migrate `ReactEditTextInputConnectionWrapper` to Kotlin ([5c9883b018](https://github.com/facebook/react-native/commit/5c9883b01865f4cb880bf525de69f4ab5aaed008) by [@Q1w1N](https://github.com/Q1w1N))
- **Kotlin:** Migrate `ReactLifecycleStateManager` to Kotlin ([800b12406f](https://github.com/facebook/react-native/commit/800b12406f8ea777bef93e98685aacfda0560d5b) by [@rohitverma-d11](https://github.com/rohitverma-d11))
- **Kotlin:** Migrate `ReactStylesDiffMap` to Kotlin ([a0f016ecad](https://github.com/facebook/react-native/commit/a0f016ecad4d577300e95de41be4e297b9c02c4f) by [@poonamjain96](https://github.com/poonamjain96))
- **Kotlin:** Migrate `UiThreadUtil` to Kotlin ([1033584c20](https://github.com/facebook/react-native/commit/1033584c203f41821d5802f56d66cae005ea9b77) by [@riteshshukla04](https://github.com/riteshshukla04))
- **Kotlin:** Migrate `ViewGroupManager` to kotlin ([761b15888d](https://github.com/facebook/react-native/commit/761b15888df3b0f47b84a2e29a330165bc7a9492) by [@riteshshukla04](https://github.com/riteshshukla04))
- **Kotlin:** Refactor class `FrescoBasedTextInlineImageSpan` from Java to Kotlin. ([cb51d25ba8](https://github.com/facebook/react-native/commit/cb51d25ba8bd6c4675efd58311891a40d83b4108) by [@gouravkhunger](https://github.com/gouravkhunger))
- **Layout:** Prevent currently focused child from getting clipped when `removeClippedSubviews` is enabled ([81405b450c](https://github.com/facebook/react-native/commit/81405b450c77ec66687db9ab62dcba9d6b869d4a) by [@jorge-cab](https://github.com/jorge-cab))
- **runtime:** Do not crash when parent view state can't be found ([ade41c851b](https://github.com/facebook/react-native/commit/ade41c851b2081278d37fd74bd4b9701ccdfbf15) by [@javache](https://github.com/javache))
- **StyleSheet:** Change to use new Background and new Border drawables by default ([132a871b46](https://github.com/facebook/react-native/commit/132a871b465eb6509be0e3d9ae61d032b415f535) by [@jorge-cab](https://github.com/jorge-cab))
- **Text:** Incorporate maxLines and ellipsization into text layout ([b1367eeb81](https://github.com/facebook/react-native/commit/b1367eeb81078605a39959c49568b00fae7ea8e1) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- **CocoaPods:** Enable `DEFINES_MODULE` in `React-jsc.podspec` ([473e42bbc3](https://github.com/facebook/react-native/commit/473e42bbc383fb01981bdfc7085ab923f0c786c0) by [@krozniata](https://github.com/krozniata))
- **Image:** Update `RCTImageLoader.mm` to cast `loadHandler` to `RCTImageLoaderLoggable` before calling `shouldEnablePerfLogging` ([2562440385](https://github.com/facebook/react-native/commit/2562440385a4e2747df8f3bfb734a5c86976f514) by Aaron Coplan)
- **ScrollView:** Overwrite betterHitTest in `RCTScrollViewComponentView` instead of changing layout metrics of the container view ([850760ab61](https://github.com/facebook/react-native/commit/850760ab6112d1f38a5a9014282ae5186ab814d6) by [@j-piasecki](https://github.com/j-piasecki))
- **Text:** Replace a workaround for measuring multiline text with `maximumNumberOfLines` on iOS with a proper solution ([77cdaa8733](https://github.com/facebook/react-native/commit/77cdaa8733db7a7de25b8b0aef87a11f91be9efd) by [@j-piasecki](https://github.com/j-piasecki))

### Deprecated

- **Events:** Deprecate `*EventData` types on `Image`, `Switch`, `TextInput` components. These can be substituted for `*Event`, e.g. `NativeSyntheticEvent<ImageLoadEventData>` becomes `ImageLoadEvent`. ([701859b397](https://github.com/facebook/react-native/commit/701859b397eddc0686fcdfe43e0244888168dc12) by [@huntie](https://github.com/huntie))

#### Android specific

- **APIs:** Correctly deprecate `ReactContextBaseJavaModule.getCurrentActivity()` method ([1408c69fd8](https://github.com/facebook/react-native/commit/1408c69fd8c5327bd3390fce8ed41e20299a5bfa) by [@cortinico](https://github.com/cortinico))
- **APIs:** Deprecate `UIManagerType.DEFAULT`, replaced by `UIManagerType.LEGACY` ([a8668319ad](https://github.com/facebook/react-native/commit/a8668319ad203cb3dc78f725f5544da6048d5b4e) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- **Image:** Deprecate `loadImageForURL` in favor of new signature which uses completionHandlerWithMetadata ([43c9a609de](https://github.com/facebook/react-native/commit/43c9a609deb1b769c51751d61904a5d80f0bd05a) by Aaron Coplan)
- **NewArch:** Deprecate the `RCT_NEW_ARCH_ENABLED` and the `RCTSetNewArchEnabled` ([6dd721b258](https://github.com/facebook/react-native/commit/6dd721b258ba775de945d9df25f8a9eca4c509b1) by [@cipolleschi](https://github.com/cipolleschi))

### Removed

#### Android specific

- **APIs:** `TouchesHelper` is no longer part of the public API ([2196597e2b](https://github.com/facebook/react-native/commit/2196597e2b602acdaecdfe04a6fb9046cb042f85) by [@javache](https://github.com/javache))
- **APIs:** Deprecated `ResourceDrawableIdHelper.instance` ([8de401c625](https://github.com/facebook/react-native/commit/8de401c62520fc0ef83e820b62e15714dc793b45) by [@javache](https://github.com/javache))
- **APIs:** Remove `FabricSoLoader` from public API ([902f82656e](https://github.com/facebook/react-native/commit/902f82656edc6c092e074759a47dc46aad53a63e) by [@javache](https://github.com/javache))
- **APIs:**: Make `StateWrapperImpl` Internal ([9f941c50c9](https://github.com/facebook/react-native/commit/9f941c50c970e35ac6fcfa11848d1f7f5a0a9323) by [@NickGerleman](https://github.com/NickGerleman))
- **Events:** Removed `(un)registerEventEmitter` from `EventDispatcher` interface ([d1c0f57073](https://github.com/facebook/react-native/commit/d1c0f57073a083b787af6c78d662506c760acf4e) by [@javache](https://github.com/javache))
- **Events:** Removed deprecated `EventBeatManager(ReactApplicationContext)` constructor ([c97af95a7f](https://github.com/facebook/react-native/commit/c97af95a7ffe2267f6d13f68c607fefac12d639b) by [@javache](https://github.com/javache))

#### iOS specific

- **APIs:** Delete `RCTComputeScreenScale` ([094876367f](https://github.com/facebook/react-native/commit/094876367f2821edce16331f5a30f9edb303dbe9) by [@RSNara](https://github.com/RSNara))
- **APIs:** Remove `RCTFloorPixelValue` ([dc97df10a2](https://github.com/facebook/react-native/commit/dc97df10a2f243855b3c5c9135d01cbc0c543d87) by [@RSNara](https://github.com/RSNara))

### Fixed

- **Alert:** Add missing type variation `{login: string, password: string}` to **AlertType** type definition to properly support `login-password` prompt callbacks ([c6a075bcc7](https://github.com/facebook/react-native/commit/c6a075bcc72b984da787a94d30d38426a68cef80) by [@assynu](https://github.com/assynu))
- **C++:** Add explicit `folly/dynamic.h` include where it is actually used ([0b1d0e84ee](https://github.com/facebook/react-native/commit/0b1d0e84eed1714e4d5dbf67a01f8c25fd5445d8) by [@mzlee](https://github.com/mzlee))
- **Codegen:** Do not generate Apple specific files for Android ([e83ece0d17](https://github.com/facebook/react-native/commit/e83ece0d17217c18a9b3dea53f261b9e0a45621a) by [@cipolleschi](https://github.com/cipolleschi))
- **Codegen:** Fixed codegen breaking when a subset of `modulesConformingToProtocol` fields was specified or when the value was string ([e4ef685dd7](https://github.com/facebook/react-native/commit/e4ef685dd75f09f22b0122e83fc94bc9d2df8a97) by [@j-piasecki](https://github.com/j-piasecki))
- **CompatCheck:** Allow union changes when the new element is in the middle of the union ([69ccbc3943](https://github.com/facebook/react-native/commit/69ccbc39438d599308b8d98c0dcf72d3bae1bf41) by [@elicwhite](https://github.com/elicwhite))
- **DevSupport:** Made `DevServerHelper` and its method open so that they can be overridden. ([2a0c1e6a9e](https://github.com/facebook/react-native/commit/2a0c1e6a9e98c19101dc89b9adba4a990cd6902c) by [@chrfalch](https://github.com/chrfalch))
- **Kotlin:** Made function `removeView` open in Kotlin class ([9d11dcd3b0](https://github.com/facebook/react-native/commit/9d11dcd3b06641dc8780043067d6d4fbfcac71d1) by [@chrfalch](https://github.com/chrfalch))
- **NewAppScreen:** Fix Networking URL in New app screen ([89e6c72fd4](https://github.com/facebook/react-native/commit/89e6c72fd4ba6c0610e892069ee5b96092dfc192) by [@riteshshukla04](https://github.com/riteshshukla04))
- **PullToRefresh:** Fixed crash in RCTPullToRefreshViewComponentView#updateProps ([fab7fa88e3](https://github.com/facebook/react-native/commit/fab7fa88e3bd3c84a0ffe0c027e14185b037120d) by [@javache](https://github.com/javache))
- **Runtime:** Align timer IDs and timer function argument error handling with web standards. ([480a4642e5](https://github.com/facebook/react-native/commit/480a4642e5a644becf1c477d3d239f9b57efff3a) by [@kitten](https://github.com/kitten))
- **StyleSheet:** Outline now takes into account outline-offset to calculate its border-radius, same as web. ([b47bfcef5f](https://github.com/facebook/react-native/commit/b47bfcef5f85ed1b4d713bec9be76efd1b485d3d) by [@jorge-cab](https://github.com/jorge-cab))
- **StyleSheet:** Wrong `borderBottomEndRadius` on RTL ([68d6ada448](https://github.com/facebook/react-native/commit/68d6ada44893701b6006a6b1753131c7e880a30a) by [@riteshshukla04](https://github.com/riteshshukla04))
- **Switch:** Fixed switches correctly reverting to controlled state ([aa8c072870](https://github.com/facebook/react-native/commit/aa8c072870f6f9740e567a0f455c0e500ff1400c) by [@javache](https://github.com/javache))
- **Text:** Fix New Arch handling of inline views when text truncated ([99f962627f](https://github.com/facebook/react-native/commit/99f962627f1b88b8a48c2b64b1887652f784b624) by [@NickGerleman](https://github.com/NickGerleman))
- **Text:** Fixed text not updating correctly after changing font scale in settings ([c008604e0a](https://github.com/facebook/react-native/commit/c008604e0a05460b440fcfaded70498594465916) by [@j-piasecki](https://github.com/j-piasecki))
- **TurboModules:** Throw ParsingException when ReactModule doesn't conform to TurboModule invariants ([c5132f485f](https://github.com/facebook/react-native/commit/c5132f485f6c5af51c6e8133eb5f029a389762dc) by [@GijsWeterings](https://github.com/GijsWeterings))
- **TypeScript:** Fix TS docs for `contentInsetAdjustmentBehavior` ([24ba7dfe6f](https://github.com/facebook/react-native/commit/24ba7dfe6feaacef76718491b8cb260d05afab9b) by [@steinalex](https://github.com/steinalex))
- **TypeScript:** Fix generated types in react-native/virtualized-lists being used without opt-in ([c9f2055097](https://github.com/facebook/react-native/commit/c9f20550972db2f94c5970948239312046a66a4e) by [@j-piasecki](https://github.com/j-piasecki))
- **TypeScript:** Fixed the generated type definitions for `Animated.FlatList` and `Animated.SectionList` to correctly infer item types. ([9be5ac1010](https://github.com/facebook/react-native/commit/9be5ac101051dd8121a48af1a29a60b7ba0b753e) by [@j-piasecki](https://github.com/j-piasecki))
- **TypeScript:** Reference `global.d.ts` using `path` so they can be resolved by TSC ([6399caef63](https://github.com/facebook/react-native/commit/6399caef635b6aadc4c98ec37c9f007f81fa1f79) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- **VirtualizeSectionList:** Fix VirtualizeSectionList generic arguments ([44b0f5560b](https://github.com/facebook/react-native/commit/44b0f5560b285dfd8e28e6056e9434d76734f3fd)) by [@coado](https://github.com/coado)
- **VirtualizedList:** Skip cloning `Fragments` in `ListEmptyComponent` to avoid onLayout warning ([2b0189b964](https://github.com/facebook/react-native/commit/2b0189b9649b58dc93ac79ad2bf709fd7bc8f117) by [@mateoguzmana](https://github.com/mateoguzmana))

#### Android specific

- **Accessibility:** `Settings.Global.TRANSITION_ANIMATION_SCALE` accepts comma as decimal separator ([8b11970adb](https://github.com/facebook/react-native/commit/8b11970adb7d09bc9a4be78cfaee04cb7e084177) by [@vzaidman](https://github.com/vzaidman))
- **Animated:** Ensure latest offset value is synced to native ([3e3094c3dd](https://github.com/facebook/react-native/commit/3e3094c3dd57a83e167ffd163093c41f4cf6d8c5) by Martin Booth)
- **Animated:** Fix `BatchExecutionOpCodes.OP_CODE_SET_ANIMATED_NODE_OFFSET` mapping to call setAnimatedNodeOffset (rather than setAnimatedNodeValue) ([9efcdc091c](https://github.com/facebook/react-native/commit/9efcdc091c81c6ae6118ed78791096ca07fe0140) by Martin Booth)
- **Animated:** Fixes memory leak - Close a view leak due to lossy onAnimationEnd callback ([313d7d79d4](https://github.com/facebook/react-native/commit/313d7d79d4257efcce5f3a555e335a74ce56df53) by [@knappam](https://github.com/knappam))
- **Animated:** Sync offset and value from native -> js in separate fields ([2efe8094c0](https://github.com/facebook/react-native/commit/2efe8094c0d4251213b5305ddaba11aaf76bfd56) by Martin Booth)
- **Codegen:** Fix `RNCodegen.js` for generating ComponentDescriptors.cpp ([d8b0e050c4](https://github.com/facebook/react-native/commit/d8b0e050c47ee7078ccc26bbabb4cf37d3ac9a37) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **Events:** Fixed crash when event is emitted after instance is shutdown ([6dd5a838c3](https://github.com/facebook/react-native/commit/6dd5a838c340aabc1ad385ccfc5cc3b478d5fda3) by [@javache](https://github.com/javache))
- **Events:** Removed deprecated EventDispatcher#receiveTouches ([7056d20984](https://github.com/facebook/react-native/commit/7056d20984dab1d0c965684acc2d7a2b13c66fac) by [@javache](https://github.com/javache))
- **FlatList:** Fix crash with nested FlatLists and fix edge case with nested views ([9526406fc2](https://github.com/facebook/react-native/commit/9526406fc24ed0df10c63c54869814a26d69ece0) by [@jorge-cab](https://github.com/jorge-cab))
- **FlatList:** Fix keyboard navigation on lists with `removeClippedSubviews` enabled ([c068c599c6](https://github.com/facebook/react-native/commit/c068c599c641491e735caf79e4e60a0fb3c04f83) by [@jorge-cab](https://github.com/jorge-cab))
- **FlatList:** Fix keyboard navigation on lists with `removeClippedSubviews` enabled ([fc9f2fe0ea](https://github.com/facebook/react-native/commit/fc9f2fe0ea20d6e73be8fdf4eb47affaddea6427) by [@jorge-cab](https://github.com/jorge-cab))
- **infra:** Fix crash when passing null initialProps ([ee85957fd6](https://github.com/facebook/react-native/commit/ee85957fd68669d8887d0e03b96f91b807bc99ac) by [@javache](https://github.com/javache))
- **Kotlin:** Made `Arguments.java` nullsafe ([c8f01ffc3e](https://github.com/facebook/react-native/commit/c8f01ffc3ea2271e166ea6b8fecf53aa950b4c42) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `BaseJavaModule.java` nullsafe ([77ea9fd1f8](https://github.com/facebook/react-native/commit/77ea9fd1f844f6b6fe6eba2ed1ac61dd8317b3e4) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `BlobModule.java` nullsafe ([c80ac8fcf2](https://github.com/facebook/react-native/commit/c80ac8fcf224d3f815b5182d2fb7164865cd6913) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `BlobProvider.java` nullsafe ([020db409a2](https://github.com/facebook/react-native/commit/020db409a2c05a99748523db2f3df08051bcc3af) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `BundleDownloader.java` nullsafe ([61d4b04159](https://github.com/facebook/react-native/commit/61d4b041593bd94a318fc71f8691711ff9d15af5) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `CxxInspectorPackagerConnection.java` nullsafe ([fd23a08a3a](https://github.com/facebook/react-native/commit/fd23a08a3a34cbfb4ff8d7215acde323cb4c943a) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `DebugOverlayController.java` nullsafe ([e9e4c2adaf](https://github.com/facebook/react-native/commit/e9e4c2adaf0cf9e20734bfc54685b228d45b5d66) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `DevServerHelper.java` nullsafe ([311cef3c0d](https://github.com/facebook/react-native/commit/311cef3c0df8f112e4bfae4663ba9dd04e465d5e) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `DevSupportManagerBase.java` nullsafe ([adbcaef1e1](https://github.com/facebook/react-native/commit/adbcaef1e1632eff29570cce878b65594096a694) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `DialogModule.java` nullsafe ([4e7d09ceff](https://github.com/facebook/react-native/commit/4e7d09ceff35757ffe29368701806d91c7c75fd1) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `DynamicFromArray.java` nullsafe ([3665046c14](https://github.com/facebook/react-native/commit/3665046c140ecebb12f4f136fe3ca5386f20bffb) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `DynamicFromMap.java` nullsafe ([dcb2dbb2c3](https://github.com/facebook/react-native/commit/dcb2dbb2c383c27f3e5ba83adcd40f2e77e0009c) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `DynamicFromObject.java` nullsafe ([a0e3490ff5](https://github.com/facebook/react-native/commit/a0e3490ff5ca9f1db6fadff1e4e1bfa666fc3a50) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `FabricUIManager.java` nullsafe ([97ddd17e5e](https://github.com/facebook/react-native/commit/97ddd17e5eaf38ac4138d96520cbdeeb9da98555) by [@javache](https://github.com/javache))
- **Kotlin:** Made `FabricUIManager.java` nullsafe ([ea2fbd453f](https://github.com/facebook/react-native/commit/ea2fbd453f319279d91f6770c14d11165223b68d) by [@javache](https://github.com/javache))
- **Kotlin:** Made `FileReaderModule.java` nullsafe ([8f5aaf13b2](https://github.com/facebook/react-native/commit/8f5aaf13b2f67f84d8e189b175d9a830a5ab446c) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `Inspector.java` as nullsafe ([8d72e5eeb9](https://github.com/facebook/react-native/commit/8d72e5eeb91911551b8fd7764e2b0d37d1d920aa) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `JavaScriptModuleRegistry.java` as nullsafe ([bf911e1f92](https://github.com/facebook/react-native/commit/bf911e1f92438d27e20a0fe2bb4bec1a0d3c2838) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `JSBundleLoader.java` as nullsafe ([9d21f97ebe](https://github.com/facebook/react-native/commit/9d21f97ebeabe1f89e105280cb95fd5a5c6b2a56) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `JSDebuggerWebsocketClient.java` nullsafe ([3289569747](https://github.com/facebook/react-native/commit/3289569747f59aa3bf997758ccd2cd4d3451c8fa) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `JSONArguments.java` as nullsafe ([12b22dc57c](https://github.com/facebook/react-native/commit/12b22dc57cffe4669ea04ef751704aa56fe63d36) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `JsonWriterHelper.java` nullsafe ([30da6ca84a](https://github.com/facebook/react-native/commit/30da6ca84a704d38c03a62da43597ce769a8bf3a) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `JSPointerDispatcher.java` nullsafe ([c025bf6c72](https://github.com/facebook/react-native/commit/c025bf6c72c4d17247e11acc121f04710411b303) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ModuleHolder.java` nullsafe ([d97aba5cd7](https://github.com/facebook/react-native/commit/d97aba5cd72a7b42a279a1ef4e8eb450d9f68cd5) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ModuleSpec.java` as nullsafe ([1e4d016950](https://github.com/facebook/react-native/commit/1e4d01695000fba0605c7e4be04d825a570820f3) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `MountingManager.java` nullsafe ([7aaf0cb3f1](https://github.com/facebook/react-native/commit/7aaf0cb3f1428bfd78b4a399b2ef235eee40f3c0) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `MountItemDispatcher.java` nullsafe ([e957bdb8fa](https://github.com/facebook/react-native/commit/e957bdb8fa8940ab405405098df1878037dd1314) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `MultipartStreamReader.java` nullsafe ([b40b1e679e](https://github.com/facebook/react-native/commit/b40b1e679e3a2622b5aeff940106888c41ffbdd9) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `NativeModule.java` as nullsafe ([005c11ea0a](https://github.com/facebook/react-native/commit/005c11ea0a1fafb62c3fbdea6c84a73789ea10b6) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `NativeModuleRegistry.java` nullsafe ([8aaccef2ee](https://github.com/facebook/react-native/commit/8aaccef2ee2d67756ce54f5819f0c3d8eab1fbf6) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `NetworkingModule.java` nullsafe ([9b30cdd008](https://github.com/facebook/react-native/commit/9b30cdd00881f52c6437d00048670041f5758b5d) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `PromiseImpl.java` nullsafe ([4c8ea858a5](https://github.com/facebook/react-native/commit/4c8ea858a53a68af688c5a5755f4104c674fee0e) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactApplicationContext.java` as nullsafe ([f86de9724b](https://github.com/facebook/react-native/commit/f86de9724b71b2e1fef6bd2d3447eccbbe7c1f1f) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactBAseTeextShadowNode.java` nullsafe ([dbb5a23cad](https://github.com/facebook/react-native/commit/dbb5a23cadd5cfa0c0ad4dafaa17ee4992662b05) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactContextBaseJavaModule.java` as nullsafe ([27179a7cf2](https://github.com/facebook/react-native/commit/27179a7cf27463a87111454ba17e117f5898aae7) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactHostImpl.java` nullsafe ([568ba647cf](https://github.com/facebook/react-native/commit/568ba647cfbeaa676a84366a981a1cad65297893) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactMarker.java` as nullsafe ([911c11f129](https://github.com/facebook/react-native/commit/911c11f1298c03cecf5777b052aa0139bf66adfc) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactTextAnchorViewManager.java` nullsafe ([e04b5b3ecf](https://github.com/facebook/react-native/commit/e04b5b3ecf2d692d9a0f95db298ecb2a67a61eef) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactTextShadowNode.java` nullsafe ([3857aa8baf](https://github.com/facebook/react-native/commit/3857aa8bafb0e440a7a6590641b6c71284fa44d4) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactTextView.java` nullsafe ([021491bf51](https://github.com/facebook/react-native/commit/021491bf51c7cc086aa5800e5548863bb14ad723) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactTextViewManager.java` nullsafe ([1929ebd00e](https://github.com/facebook/react-native/commit/1929ebd00ee6a0429ea30c4ee940e57dd443f43b) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReconnectingWebSocket.java` nullsafe ([ff6601bfb7](https://github.com/facebook/react-native/commit/ff6601bfb78600e3ded170d4ee214a43175d0fc5) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `StackTraceHelper.java` nullsafe ([14de1c1cba](https://github.com/facebook/react-native/commit/14de1c1cba7f49ff66c15eb80e422cbddf2c476d) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `Task.java` nullsafe ([eba9ebe0a9](https://github.com/facebook/react-native/commit/eba9ebe0a9145adb718b0ef522ad490b67593bac) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `TextAttributeProps.java` nullsafe ([623dcc3902](https://github.com/facebook/react-native/commit/623dcc39025bf4d3e82d590637831e380f412397) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ThemedReactContext.java` nullsafe ([552338ce9f](https://github.com/facebook/react-native/commit/552338ce9ffb32500fb30c227953d5e426fc3f7f) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `TouchTargetHelper.java` nullsafe ([02fc3bd58c](https://github.com/facebook/react-native/commit/02fc3bd58c3da3e09150180fd9f8b04192b45bfd) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `TurboModuleInteropUtils.java` nullsafe ([90184d20e1](https://github.com/facebook/react-native/commit/90184d20e1e5c128c532bd4a1f15bb3074bcd83a) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `TurboModuleManager.java` nullsafe ([419b68f38a](https://github.com/facebook/react-native/commit/419b68f38aa31d1d7d2de939a47516143adaafdf) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ViewManagerRegistry.java` nullsafe ([af516266db](https://github.com/facebook/react-native/commit/af516266dbfbf72fb9954864931951bac702f4c8) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Layout:** Restored the possibility to extend `LayoutAnimationController` ([bca7c5a553](https://github.com/facebook/react-native/commit/bca7c5a55301398beaa6ca35c96ae7ad5426c297) by [@tomekzaw](https://github.com/tomekzaw))
- **Linking:** Ensure Linking.sendIntent promises resolve or reject ([6609ba98e5](https://github.com/facebook/react-native/commit/6609ba98e5f738cb8746c7ccfda1072cfa05f986) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Networking:** Fix fetch of content scheme uris failing on Android. ([87c54a7eba](https://github.com/facebook/react-native/commit/87c54a7ebab5530de4cec359440d2c5945244e07) by [@giantslogik](https://github.com/giantslogik))
- **PointerEvents:** Prevent onPointerLeave from dispatching during button presses ([833ab6fe1b](https://github.com/facebook/react-native/commit/833ab6fe1b252244bf7d8a2f158fa13470c27e76) by [@Abbondanzo](https://github.com/Abbondanzo))
- **ScrollView:** Fix occasional syncronization issue in ScrollView when rendering dynamic content with content offset ([8f209acb3f](https://github.com/facebook/react-native/commit/8f209acb3f7338448b0b7a26224fc4b2cfb722db) by [@fabriziocucci](https://github.com/fabriziocucci))
- **StyleSheet:** Fix incorrect clip to padding box on new Background and Border drawables ([989b3f61a0](https://github.com/facebook/react-native/commit/989b3f61a070c68f30d36036925f54cb081da49e) by [@jorge-cab](https://github.com/jorge-cab))
- **StyleSheet:** Fix inset shadow edge cases ([0929697a6d](https://github.com/facebook/react-native/commit/0929697a6df9ab5a3654c0077bb95427eae77b4c) by [@joevilches](https://github.com/joevilches))
- **StyleSheet:** Fix translucent borders on Android overlapping bug ([57779cebf0](https://github.com/facebook/react-native/commit/57779cebf066ee420fa861df8269e875ab1d21f4) by [@jorge-cab](https://github.com/jorge-cab))
- **Text:** Assume full container width when ellipsizing line ([e565c662d7](https://github.com/facebook/react-native/commit/e565c662d7550b143930bf2e646a749bcaea026a) by [@NickGerleman](https://github.com/NickGerleman))
- **Text:** Correctly Pass `SurfaceID` to `TextLayoutManager` ([6f0a0a5c2c](https://github.com/facebook/react-native/commit/6f0a0a5c2c7d678646be5af9a3c4ccf1ba9c9804) by [@NickGerleman](https://github.com/NickGerleman))
- **Text:** Double selection with dataDetectorType and links ([70aced5eb1](https://github.com/facebook/react-native/commit/70aced5eb17c48e6b7201377e6068cf6558c7460) by [@joevilches](https://github.com/joevilches))
- **Text:** Fix `selectable` prop not working correctly on initial render (old-arch) ([5ed486cc8f](https://github.com/facebook/react-native/commit/5ed486cc8fb4aeef12c92a04619cc668427eee75) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Text:** Fix keyboard navigation on lists with `removeClippedSubviews` enabled ([bbff754db3](https://github.com/facebook/react-native/commit/bbff754db370a2d69926048e384ccaa6ff97c230) by [@jorge-cab](https://github.com/jorge-cab))
- **TextInput:** Can now focus `TextInput` with keyboard ([e00028f6bb](https://github.com/facebook/react-native/commit/e00028f6bb6c19de861f9a25f377295755f3671b) by [@joevilches](https://github.com/joevilches))
- **TextInput:** Fix broken focus behavior for TextInput in older Android versions (< 9) ([fb62355555](https://github.com/facebook/react-native/commit/fb623555552075793086acdd1ddd0c1e3fba72c4)) by [@joevilches](https://github.com/joevilches)
- **TextInput:** Fix Non-uniform border colors on TextInput ([42251ec0ed](https://github.com/facebook/react-native/commit/42251ec0eddaf42d0a89caeb75a92ef34c517a95) by [@NickGerleman](https://github.com/NickGerleman))
- **TurboModules:** Fix crash when TurboModule event emitters are used on arm32 ([6e701ce080](https://github.com/facebook/react-native/commit/6e701ce080122f5b60633e3475651a0d2d9fe54a) by [@javache](https://github.com/javache))

#### iOS specific

- **Accessibility:** RCTDeviceInfo: fix crash due to failure to get AccessibilityManager ([ac23323da1](https://github.com/facebook/react-native/commit/ac23323da1bda2ce271797aa58dd74ffb0a5992f) by Adam Ernst)
- **Animated:** Fix Recycling of Animated Images ([1a9adfba16](https://github.com/facebook/react-native/commit/1a9adfba162151a3e8c2e7a5248e6b17e2eef195) by [@NickGerleman](https://github.com/NickGerleman))
- **API:** Remove deprecated ATOMIC_VAR_INIT macro in RCTProfile.m ([21bf7cf6cf](https://github.com/facebook/react-native/commit/21bf7cf6cf043de323c40edc001add4cd21256ce) by [@rmaz](https://github.com/rmaz))
- **C++:** Avoid build failure on Catalyst (`x86_64`) ([0f534293af](https://github.com/facebook/react-native/commit/0f534293afe9981e463dae97f7ccb4c7abf0589c) by [@cipolleschi](https://github.com/cipolleschi))
- **CocoaPods:** Corrected the path from `"$(PODS_ROOT)/fas_float/include"` to `"$(PODS_ROOT)/fast_float/include"` in the `HEADER_SEARCH_PATHS` configuration. ([01881017d3](https://github.com/facebook/react-native/commit/01881017d3d446355945779547215408309e6a36) by [@DorianMazur](https://github.com/DorianMazur))
- **CocoaPods:** Put back the `folly_compiler_flag` function to make libraries install pods ([3b17cdb643](https://github.com/facebook/react-native/commit/3b17cdb6435dcb975685672be0d29d2f73bf368f) by [@cipolleschi](https://github.com/cipolleschi))
- **Codegen:** Fix codegen crawling all library code with `componentProvider` defined in config ([65aa819811](https://github.com/facebook/react-native/commit/65aa8198116e1d23175358f75c9b23774d3522b4) by [@kkafar](https://github.com/kkafar))
- **Codegen:** Fix codegen extracting `.class` from complex component classes ([f2b19608cc](https://github.com/facebook/react-native/commit/f2b19608cca36c118786b4e3d22bf2468fced86d) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- **Codegen:** Generate `ReactCodegen.podspec` only for apps. ([18a7c8d57c](https://github.com/facebook/react-native/commit/18a7c8d57c5843267756fd9d2137964370dc5780) by [@cipolleschi](https://github.com/cipolleschi))
- **Codegen:** Skip codegen for selectively disabled libraries in react-native.config.js ([7681036537](https://github.com/facebook/react-native/commit/7681036537d8759673881843a9a8f6f5a1ae93e0) by [@aattola](https://github.com/aattola))
- **Codegen:** Skip codegen for selectively disabled libraries in react-native.config.js ([be8595b18a](https://github.com/facebook/react-native/commit/be8595b18a46635bf679d8e7473f2960c33530fa) by [@ismarbesic](https://github.com/ismarbesic))
- **Image:** Fix animated images missing from offscreen render ([d1a090b0af](https://github.com/facebook/react-native/commit/d1a090b0afe94ed5d5f55cf0b6f0ecc044ac332e) by [@NickGerleman](https://github.com/NickGerleman))
- **Image:** Fixed accessible prop no-opts on Image components ([e3f7c8f456](https://github.com/facebook/react-native/commit/e3f7c8f45617d682c5934d4eeee8a7ada4689ce5) by [@jorge-cab](https://github.com/jorge-cab))
- **infra:** Avoid race condition crash in `RCTDataRequestHandler` invalidate ([44810f7498](https://github.com/facebook/react-native/commit/44810f749841b8340cc06fecbf861c6390751c29) by [@zhongwuzw](https://github.com/zhongwuzw))
- **infra:** Check .pnpm folder when looking for third-party components. ([91d034533e](https://github.com/facebook/react-native/commit/91d034533e9f52232b351bb88b2ae7b48704e68f) by [@kirill3333](https://github.com/kirill3333))
- **infra:** Fix bug: unstable_hasComponent(*) = true for unregistered components for n > 1th call. ([f4d99d6a23](https://github.com/facebook/react-native/commit/f4d99d6a23a08c2ef2c2fff78dc966961608683b) by [@RSNara](https://github.com/RSNara))
- **infra:** Fix bug: unstable_hasComponent(*) = true for unregistered components for n > 1th call. ([fa9d082747](https://github.com/facebook/react-native/commit/fa9d082747cf286a112b869e763afff6df6ec9d4) by [@RSNara](https://github.com/RSNara))
- **infra:** Ignore `build/` and `DerivedData/` directories when reading `.plist` files. ([c783128f6e](https://github.com/facebook/react-native/commit/c783128f6e8541bb0b13c4f5c634e790ca854c23) by [@tjzel](https://github.com/tjzel))
- **infra:** Properly check for debug schemes when building hermes from source ([bef5cc1007](https://github.com/facebook/react-native/commit/bef5cc100771c3b8bc5dffa565b7c24fef3eb34d) by [@WoLewicki](https://github.com/WoLewicki))
- **InteropLayer:** Fixed adding child views to a native view using the interop layer ([d53a60dd23](https://github.com/facebook/react-native/commit/d53a60dd23c5df8afca058a867c50df8b61f62e2) by [@chrfalch](https://github.com/chrfalch))
- **LogBox:** Fix disappearing redbox on initial load of an invalid bundle. ([4cc9db1cd5](https://github.com/facebook/react-native/commit/4cc9db1cd501b019e90bb540ce836e2a2c2bf2ff) by [@aleqsio](https://github.com/aleqsio))
- **ScrollView:** Fixed touch events not being dispatched to ScrollView's children when they overflow the content container ([6ecd9a43f1](https://github.com/facebook/react-native/commit/6ecd9a43f16e76771e2f970972bcd067aa570cf7) by [@j-piasecki](https://github.com/j-piasecki))
- **StyleSheet:** Box shadows on iOS are faster ([52173ab701](https://github.com/facebook/react-native/commit/52173ab701094dcc84399cdf8a8769f5242de27d) by [@joevilches](https://github.com/joevilches))
- **Swift:** Make fmt and SocketRocket Swift friendly ([3f41fe2948](https://github.com/facebook/react-native/commit/3f41fe29488bbcf4fba620b18cace90de737c197) by [@cipolleschi](https://github.com/cipolleschi))
- **Switch:** Fix "on" and "off" announcements on `Switch` ([db6e000023](https://github.com/facebook/react-native/commit/db6e0000234530979594abf81c6bd0521b561068) by [@joevilches](https://github.com/joevilches))
- **Text:** `ParagraphState` is correctly deallocated when recycling Text ([a5a71f115f](https://github.com/facebook/react-native/commit/a5a71f115ff9fb8156968451f11874a3c3096a4f) by [@javache](https://github.com/javache))
- **Text:** Allow links that encorporate entire <Text> to be keyboard accessible ([83fae860df](https://github.com/facebook/react-native/commit/83fae860df8d1ac2d89b3cddf8c595b2cc88a74f) by [@joevilches](https://github.com/joevilches))
- **Text:** Correctly announce "link" on nested text if its the entire text element ([bffb414291](https://github.com/facebook/react-native/commit/bffb414291cfbd3d6e3e51448dd68b7bddddf658) by [@joevilches](https://github.com/joevilches))
- **Text:** Selection range not respected when changing text or selection when selection is forced ([d32ea66e6a](https://github.com/facebook/react-native/commit/d32ea66e6a945dd84092532401b265b12d482668) by Olivier Bouillet)
- **TextInput:** Fix TextInput `onContentSizeChange` event being dispatched only once on iOS on the new architecture ([5fd5188172](https://github.com/facebook/react-native/commit/5fd51881727b2d86f87abf04db032940ac0ec8c4) by [@j-piasecki](https://github.com/j-piasecki))

## v0.79.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0795)

## v0.79.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0794)

## v0.79.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0793)

## v0.79.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0792)

## v0.79.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0791)

## v0.79.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0790)

## v0.78.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0783)

## v0.78.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0782)

## v0.78.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0781)

## v0.78.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0780)

## v0.77.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0772)

## v0.77.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0771)

## v0.77.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0770)

## v0.76.9

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0769)

## v0.76.8

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0768)

## v0.76.7

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0767)

## v0.76.6

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0766)

## v0.76.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0765)

## v0.76.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0764)

## v0.76.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0763)

## v0.76.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0762)

## v0.76.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0761)

## v0.76.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0760)

## v0.75.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0755)

## v0.75.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0754)

## v0.75.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0753)

## v0.75.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0752)

## v0.75.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0751)

## v0.75.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0750)

## v0.74.7

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0747)

## v0.74.6

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0746)

## v0.74.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0745)

## v0.74.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0744)

## v0.74.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0743)

## v0.74.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0742)

## v0.74.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0741)

## v0.74.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0740)

## v0.73.11

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07311)

## v0.73.10

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07310)

## v0.73.9

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0739)

## v0.73.8

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0738)

## v0.73.7

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0737)

## v0.73.6

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0736)

## v0.73.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0735)

## v0.73.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0734)

## v0.73.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0733)

## v0.73.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0732)

## v0.73.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0731)

## v0.73.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0730)

## v0.72.17

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07217)

## v0.72.16

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07216)

## v0.72.15

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07215)

## v0.72.14

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07214)

## v0.72.13

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07213)

## v0.72.12

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07212)

## v0.72.11

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07211)

## v0.72.10

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07210)

## v0.72.9

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0729)

## v0.72.8

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0728)

## v0.72.7

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0727)

## v0.72.6

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0726)

## v0.72.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0725)

## v0.72.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0724)

## v0.72.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0723)

## v0.72.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0722)

## v0.72.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0721)

## v0.72.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0720)

## v0.71.19

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07119)

## v0.71.18

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07118)

## v0.71.17

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07117)

## v0.71.16

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07116)

## v0.71.15

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07115)

## v0.71.14

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07114)

## v0.71.13

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07113)

## v0.71.12

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07112)

## v0.71.11

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07111)

## v0.71.10

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07110)

## v0.71.9

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0719)

## v0.71.8

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0718)

## v0.71.7

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0717)

## v0.71.6

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0716)

## v0.71.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0715)

## v0.71.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0714)

## v0.71.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0713)

## v0.71.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0712)

## v0.71.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0711)

## v0.71.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0710)

## v0.70.15

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07015)

## v0.70.14

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07014)

## v0.70.13

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07013)

## v0.70.12

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07012)

## v0.70.11

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07011)

## v0.70.10

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v07010)

## v0.70.9

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0709)

## v0.70.8

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0708)

## v0.70.7

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0707)

## v0.70.6

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0706)

## v0.70.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0705)

## v0.70.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0704)

## v0.70.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0703)

## v0.70.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0702)

## v0.70.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0701)

## v0.70.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x#v0700)

## v0.69.12

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v06912)

## v0.69.11

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v06911)

## v0.69.10

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v06910)

## v0.69.9

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0699)

## v0.69.8

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0698)

## v0.69.7

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0697)

## v0.69.6

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0696)

## v0.69.5

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0695)

## v0.69.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0694)

## v0.69.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0693)

## v0.69.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0692)

## v0.69.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0691)

## v0.69.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0690)

## v0.68.7

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0687)

## v0.68.6

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0686)

## v0.68.5

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0685)

## v0.68.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0684)

## v0.68.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0683)

## v0.68.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0682)

## v0.68.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0681)

## v0.68.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0680)

## v0.67.5

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0675)

## v0.67.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0674)

## v0.67.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0673)

## v0.67.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0672)

## v0.67.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0671)

## v0.67.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0670)

## v0.66.5

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0665)

## v0.66.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0664)

## v0.66.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0663)

## v0.66.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0662)

## v0.66.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0661)

## v0.66.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0660)

## v0.65.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0653)

## v0.65.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0652)

## v0.65.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0651)

## v0.65.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0650)

## v0.64.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0644)

## v0.64.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0643)

## v0.64.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0642)

## v0.64.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0641)

## v0.64.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0640)

## v0.63.5

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0635)

## v0.63.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0634)

## v0.63.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0633)

## v0.63.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0632)

## v0.63.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0631)

## v0.63.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0630)

## v0.62.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0623)

## v0.62.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0622)

## v0.62.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0621)

## v0.62.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0620)

## v0.61.5

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0615)

## v0.61.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0614)

## v0.61.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0613)

## v0.61.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0612)

## v0.61.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0611)

## v0.61.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0610)

## v0.60.6

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0606)

## v0.60.5

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0605)

## v0.60.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0604)

## v0.60.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0603)

## v0.60.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0602)

## v0.60.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0601)

## v0.60.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x#v0600)

## v0.59.10

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v05910)

## v0.59.9

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0599)

## v0.59.8

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0598)

## v0.59.5

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0595)

## v0.59.4

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0594)

## v0.59.3

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0593)

## v0.59.2

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0592)

## v0.59.1

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0591)

## v0.59.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0590)

## v0.58.6

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0586)

## v0.58.5

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0585)

## v0.58.4

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0584)

## v0.58.3

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0583)

## v0.58.2

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0582)

## v0.58.1

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0581)

## v0.58.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0580)

## v0.57.8

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0578)

## v0.57.7

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0577)

## v0.57.6

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0576)

## v0.57.5

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0575)

## v0.57.4

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0574)

## v0.57.3

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0573)

## v0.57.2

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0572)

## v0.57.1

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0571)

## v0.57.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0570)

## v0.56.1

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0561)

## v0.56.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0560)

## v0.55.4

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0554)

## v0.55.3

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0553)

## v0.55.2

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0552)

## v0.55.1

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0551)

## v0.55.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0550)

## v0.54.4

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0544)

## v0.54.3

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0543)

## v0.54.2

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0542)

## v0.54.1

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0541)

## v0.54.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0540)

## v0.53.3

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0533)

## v0.53.2

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0532)

## v0.53.1

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0531)

## v0.53.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0530)

## v0.52.3

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0523)

## v0.52.2

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0522)

## v0.52.1

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0521)

## v0.52.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0520)

## v0.51.1

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0511)

## v0.51.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0510)

## v0.50.4

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0504)

## v0.50.3

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0503)

## v0.50.2

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0502)

## v0.50.1

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0501)

## v0.50.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x#v0500)
