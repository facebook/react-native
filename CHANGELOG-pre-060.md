# Changelog (pre 0.60)

This file contains all changelogs for releases in the pre-0.60 range. Please check out the other `CHANGELOG-*.md` files for newer versions.

## v0.59.10

This is likely the last patch release for version 59 of React Native for the foreseeable future: it contains an important Android side update for the JavaScript Core, to prevent a great number of crashes mostly related to Samsung devices - thanks to [@Kudo](https://github.com/Kudo) for his work on fixing this via [557989a86f](https://github.com/facebook/react-native/commit/557989a86f8730113393ed229927d607a478e524)!

Thanks everyone who participated in the [discussion](https://github.com/react-native-community/releases/issues/127).

## v0.59.9

This is a patch fix release addressing a couple ScrollView regressions, and "future-proof" RN 59 from crashes caused by upgrading Gradle (now can support up to 5.4.1 & 3.4.0 for the plugin) and Xcode 11 Beta 1. You can upgrade to this version without upgrading your tooling.

Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/124) for cherry-picking commits. You can participate to the conversation for the next patch release in the dedicated [issue](https://github.com/react-native-community/react-native-releases/issues/127).

### Changed

- If `isInteraction` is not specified in the config, it would always default to `true` which would block interactions like VirtualizedList updates. This is generally not what you want with useNativeDriver since the animation won't be interrupted by JS. If something does end up interfering with an animation and causes frame drops, `isInteraction` can be set manually. ([8f186b84ae](https://github.com/facebook/react-native/commit/8f186b84aeeb2613bf6ae08f20a8547d40179007) by [@sahrens](https://github.com/sahrens))

- Update detox to match master ([c6a5c09e2b](https://github.com/facebook/react-native/commit/c6a5c09e2b330891242af5c0b3ed7875f32c189e) by [@kelset](https://github.com/kelset))

#### Android specific

- Bump Gradle to 5.4.1 & Android Gradle plugin to 3.4.0 ([b4017a9923](https://github.com/facebook/react-native/commit/b4017a9923b09fed4b693a8e4cfadd30ce34c88d), [d9f5a9dc16](https://github.com/facebook/react-native/commit/d9f5a9dc16f68cecc995bf8ba64fb726e397fadf), [30348f7899](https://github.com/facebook/react-native/commit/30348f789946dc99f5ccd02c85c8decbdb9ac29b), [6976a93126](https://github.com/facebook/react-native/commit/6976a931266126f249458a099bfaf509f9d81a05) by [@dulmandakh](https://github.com/dulmandakh))

### Fixed

- Fixes wrong time unit of scroll event throttle ([1148c03f6f](https://github.com/facebook/react-native/commit/1148c03f6f51329710e23fba99a6916fff3ba42c) by [@zhongwuzw](https://github.com/zhongwuzw))

#### Android specific

- Fix indexed RAM bundle ([d8fa1206c3](https://github.com/facebook/react-native/commit/d8fa1206c3fecd494b0f6abb63c66488e6ced5e0) by [@dratwas](https://github.com/dratwas))

#### iOS specific

- Fix Xcode 11 Beta 1 builds ([46c7ada535](https://github.com/facebook/react-native/commit/46c7ada535f8d87f325ccbd96c24993dd522165d) by [@ericlewis](https://github.com/ericlewis))

## v0.59.8

This is a patch fix release addressing regressions, crashes, and a few developer-experience pain points (in particular, check the `KeyboardAvoidingView` change). Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/118) for cherry-picking commits.

### Fixed

- Fix regexp on `hasteImpl` ([bcd1e2](https://github.com/facebook/react-native/commit/28e0de070d2dae9a486ab5915b6fd76723bd84ef) by [@CaptainNic](https://github.com/CaptainNic))
- Fix sparse array handling in `EventEmitter#listeners()` ([f68dc8](https://github.com/facebook/react-native/commit/f68dc8) by [@ide](https://github.com/ide))
- Fix **VirtualizedList** to call `_updateViewableItems` immediately ([08141e](https://github.com/facebook/react-native/commit/efe6a0f0b56191907e8f13be2aee28fe1dcdf555) by [@sahrens](https://github.com/sahrens))
- Fix prop overrides of **TouchableWithoutFeedback** ([0c4206](https://github.com/facebook/react-native/commit/68825f9ca5a6c8c70390e8499d9663c5be475639) by [@aleclarson](https://github.com/aleclarson))
- Fix resolve relative size rendering error in inspector ([4884ab](https://github.com/facebook/react-native/commit/972ee2edbd4e1c4201da1606bf5a4c5add9f0083) by [@gandreadis](https://github.com/gandreadis))
- Fix **VirtualizedSectionList** by making sure to check array bounds ([54f91d](https://github.com/facebook/react-native/commit/929908f28728c217ab4a16c8596e0957295f4d67) by [@vonovak](https://github.com/vonovak))
- Update `_scrollAnimatedValue` offset of **ScrollView** ([e0d1b3](https://github.com/facebook/react-native/commit/58c956768af75047b2acdca429a28945a6a8b8c0) by [@miyabi](https://github.com/miyabi))
- Fix infinite `setState` in **VirtualizedList** ([c40a93](https://github.com/facebook/react-native/commit/88787b5e7a7f6dd9c3b258b9dfb60b93ca5a5cea) by [@sahrens](https://github.com/sahrens))

#### iOS specific

- Fix incorrect opacity behavior for **Text** component ([f71357](https://github.com/facebook/react-native/commit/d99e657e3909ff14cd623d1df7d3d13056fdd851) by [@shergin](https://github.com/shergin))
- Fix **Text** shadow displays when `text Offset` is `{0,0}` ([17a81b](https://github.com/facebook/react-native/commit/9b63b50ad562c8567336898c7511a9a5198a4d6b) by [@Woodpav](https://github.com/Woodpav))
- Add convert compatible of **NSString** for bridge message data ([c37e9c](https://github.com/facebook/react-native/commit/ffa3b0d4d601fe6788319a7cfd4185b8e4bf462f) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fix nullability warnings in **RCTExceptionsManager** ([2b7d79](https://github.com/facebook/react-native/commit/31850df116fdd1595dddcd7b37a21568e679ffa7) by [@jtreanor](https://github.com/jtreanor))
- Fix app to reconnect with metro after the bundler is closed and reopened ([c28676](https://github.com/facebook/react-native/commit/62bac80f90cf5a4ab216488b4ede441f0e3f86ba) by [@rickhanlonii](https://github.com/rickhanlonii))
- Fix throttle below 16ms on **ScrollView** ([39776a](https://github.com/facebook/react-native/commit/c87de765f6a9ebf656c188fa2115a1ba01b7939c) by [@sahrens](https://github.com/sahrens))

#### Android specific

- Fix JS errors during bundle load were reported as `UnknownCppException` ([84e263](https://github.com/facebook/react-native/commit/6f6696fa63dc5f7029cb121c7e0ee98f8d271602))
- Add logic to catch `MissingWebViewPackageException` ([379874](https://github.com/facebook/react-native/commit/954f715b25d3c47c35b5a23ae23770a93bc58cee) by [@thorbenprimke](https://github.com/thorbenprimke))
- Revert "[improve RTL](https://github.com/facebook/react-native/commit/b3c74967ca6b20d7bda84c690ae3a99dfe255843)" ([f3801d](https://github.com/facebook/react-native/commit/8d3e16831a93079fc5a855a7b0f8b4be508c6942) by [@thorbenprimke](https://github.com/thorbenprimke))

### Added

- Add listener for non-value animated node ([4a82dc](https://github.com/facebook/react-native/commit/68a5ceef312c7e3ac74d616b960c1cfde46a109d) by [@osdnk](https://github.com/osdnk))
- Set **ScrollView** throttle by default ([74d740](https://github.com/facebook/react-native/commit/b8c8562ffb424831cc34a18aeb25e5fec0954dd0) by [@sahrens](https://github.com/sahrens))

### Changed

- Make **KeyboardAvoidingView** with `behavior="height"` resize on keyboard close ([7140a7](https://github.com/facebook/react-native/commit/3711ea69375ea420800bac97914aa0d24fc9b1a6) by [@WaldoJeffers](https://github.com/WaldoJeffers))
- Update network inspector to have smarter scroll stickiness ([57dc37](https://github.com/facebook/react-native/commit/c06473ab464e07edbb4715f58cd13674273bb29b) by [@AlanFoster](https://github.com/AlanFoster))

## v0.59.7

This patch release was unpublished.

## v0.59.6

This patch release was unpublished.

## v0.59.5

This is a patch fix release addressing regressions, crashes, and a few developer-experience pain points. Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/113) for cherry-picking commits.

### Fixed

- Remove wrapper around **ListEmptyComponent** ([54af5b](https://github.com/facebook/react-native/commit/46276444508581bac7b9f27edd56ec0c8ec450bc) by [@AntoineDoubovetzky](https://github.com/AntoineDoubovetzky))

#### Android specific

- Enforced thread safety on UIImplementation methods that mutate the shadowNodeRegistry ([f5a318](https://github.com/facebook/react-native/commit/f5a31801a03b61df3d7bc2fc86df7bad272082e2) by [@SudoPlz](https://github.com/sunnylqm))
- Fixed a `NoSuchKeyException` when parsing JS stack frames without line numbers ([d7bd6c](https://github.com/facebook/react-native/commit/c953e0b4319da0976ece877c09b648a55bc57d9f) by [@Salakar](https://github.com/Salakar))
- Fixed `mostRecentEventCount` is not updated ([b8aac0](https://github.com/facebook/react-native/commit/60c0a60c508346f7639d32fde0376fabded9f3f0) by [@jainkuniya](https://github.com/jainkuniya))

#### iOS specific

- Pass back correct dimensions for application window in Dimensions module ([72b4cc](https://github.com/facebook/react-native/commit/33b55ccccad56e0b97af294749d728b67b03e658) by [@rdonnelly](https://github.com/rdonnelly))
- Fixed warning: "RCTImagePickerManager requires main queue setup" ([effb02](https://github.com/facebook/react-native/commit/6508b88cfdccdb2da6bfde05faac4647436ce4e7) by [@scarlac](https://github.com/scarlac))

## v0.59.4

This is a patch fix release addressing regressions, crashes, and a few developer-experience pain points. Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/100) for cherry-picking commits.

### Changed

- Make Jest transform @react-native-community packages by default ([7e23c7c565](https://github.com/facebook/react-native/commit/7e23c7c5654818fa076eeb627b709d39130f57f6) by [@thymikee](https://github.com/thymikee))

#### iOS specific

- Add `scrollToOverflowEnabled` prop to **ScrollView** ([6f4239b37c](https://github.com/facebook/react-native/commit/6f4239b37c3059d6cb1fdaf2dcd3b6c962dde471) by [@mysport12](https://github.com/mysport12))

### Fixed

- Fix **Touchable** long-press ([59e50237bf](https://github.com/facebook/react-native/commit/59e50237bff9521d2b78d7576abf4e23d844ac1b) by [@Kida007](https://github.com/Kida007))

#### Android specific

- Fix a crash when setting `underlineColorAndroid` in **TextInput** ([556aa93ed7](https://github.com/facebook/react-native/commit/556aa93ed72d9dc0f18a1c6d7dec3d9c182fee85) by [@sunnylqm](https://github.com/sunnylqm))

#### iOS specific

- Fix universal links not working in iOS 12 / Xcode 10 ([56679ed359](https://github.com/facebook/react-native/commit/56679ed359834c2177c8837d744cc7bf2ceb6b0a) by [@IljaDaderko](https://github.com/IljaDaderko))
- Fix triangle views ([7a6fe0cda0](https://github.com/facebook/react-native/commit/7a6fe0cda0a1089c1c82fdd5f7f2db940f70feae) by [@zhongwuzw](https://github.com/zhongwuzw))

## v0.59.3

This is a patch fix release addressing regressions, crashes, and a few developer-experience pain points. Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/100) for cherry-picking commits.

### Changed

#### Android specific

- Improve RTL support ([b3c74967ca](https://github.com/facebook/react-native/commit/b3c74967ca6b20d7bda84c690ae3a99dfe255843) by [@dulmandakh](https://github.com/dulmandakh))

### Fixed

- Fix **VirtualizedList**, **SectionList** and **FlatList** behavior on rendering list headers with inverted prop and zero items ([c13f5d48cf](https://github.com/facebook/react-native/commit/c13f5d48cfe3e7c0f6c6d0b745b50a089d6993ef) by [@michalchudziak](https://github.com/michalchudziak))
- Fix **VirtualizedList** debug mode crash ([02e8e531dd](https://github.com/facebook/react-native/commit/02e8e531ddfd86e9abf7ef47fbf30445afeb37cf))
- Fix running Metro on Windows ([43d3313788](https://github.com/facebook/react-native/commit/43d3313788a5f0a36abdbfadc000b06b2188fc06) and [9db347fabc](https://github.com/facebook/react-native/commit/9db347fabca19c66f669faf4054c81cc3624be03) by [@aliazizi](https://github.com/aliazizi) and [@nazreinkaram](https://github.com/nazreinkaram))

#### Android specific

- Fix IllegalStateException when invalid URL or headers are passed ([aad4dbbbfe](https://github.com/facebook/react-native/commit/aad4dbbbfe937d1924e5359556979ab067198a58) by [@dryganets](https://github.com/dryganets))
- Fix IllegalStateException when tapping next on Android Keyboard ([b943db418f](https://github.com/facebook/react-native/commit/b943db418f4f0b9d0865642aaca3e1a2f1529663) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- Show Perf Monitor after reloading JS ([15619c22e5](https://github.com/facebook/react-native/commit/15619c22e57f73dfbed7bbe5fd6d9b3d2a8c9225) by [@usrbowe](https://github.com/usrbowe))
- Fix **TextInput**'s `maxLength` when inserting characters at begin ([17415938c7](https://github.com/facebook/react-native/commit/17415938c7180a95811db949122b8ad24a442866) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fix runtime crash in Xcode 10.2 when using `RCT_EXTERN_MODULE` for swift classes ([ff66600224](https://github.com/facebook/react-native/commit/ff66600224e78fec5d0e902f8a035b78ed31a961))

## v0.59.2

This is a patch fix release addressing regressions, crashes, and a few developer-experience pain points. Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/100) for cherry-picking commits.

### Fixed

#### Android specific

- Crash on pre-26 Android devices when setting **TextInput** content type ([d4aa1e7a52](https://github.com/facebook/react-native/commit/d4aa1e7a52b51fa5d7fc9ded132b7b50170f2190) by [@hramos](https://github.com/hramos))
- Crash when scroll to index 0 in a **SectionList** ([8fa116cc0e](https://github.com/facebook/react-native/commit/8fa116cc0e1cadbb6cf0734cfde0e0b8060f6b59) by [@danilobuerger](https://github.com/danilobuerger))
- **Switch**'s `trackColor` being reset when toggled ([7652e31d8c](https://github.com/facebook/react-native/commit/7652e31d8c233c1c831f6597c8a2f7ce3d9c0b6e) and [d6ee448e15](https://github.com/facebook/react-native/commit/d6ee448e15a25a7485482a4702aadb2e396445c7) by [@dulmandakh](https://github.com/dulmandakh) and [@ejanzer](https://github.com/ejanzer))

#### iOS specific

- **ScrollView** offset out of content size ([9c1c5a7455](https://github.com/facebook/react-native/commit/9c1c5a7455d90ec837a9a6141c096de70b798e43) by [@zhongwuzw](https://github.com/zhongwuzw))
- **RefreshControl** state's race condition ([95d399bc82](https://github.com/facebook/react-native/commit/95d399bc825c5471e08b83eff4b1b1b510e384a0) by [@rostislav-simonik](https://github.com/rostislav-simonik))
- Start Metro packager from project root ([fe3aebf87b](https://github.com/facebook/react-native/commit/fe3aebf87b4123f8b16cdfcb9e2e774e6e0bf0b6) by [@MatthieuLemoine](https://github.com/MatthieuLemoine))
- **TextInput**s that are single-line reverting to default text ([e38be82dfa](https://github.com/facebook/react-native/commit/e38be82dfa8b49385b990629318f027de26500cf) by [@PeteTheHeat](https://github.com/PeteTheHeat))

### Changed

#### Android specific

- Add TLS 1.3 support to all Android versions using Conscrypt; to use this, you must add `implementation('org.conscrypt:conscrypt-android:2.0.0')` to `build.gradle` ([75af15ede4](https://github.com/facebook/react-native/commit/75af15ede44135110e40de75a649d5b15430c590) by [@dulmandakh](https://github.com/dulmandakh))
- Turn off Metro JS Deltas by default for Android ([845189c17d](https://github.com/facebook/react-native/commit/845189c17de621cc5aa373503220c1c12f649c3c) by [@PeteTheHeat](https://github.com/PeteTheHeat))

## v0.59.1

This is a small patch release that addresses two critical issues from the 0.59.0 release.

### Fixed

#### Android specific

- Template build gradle error on x86_64 ([4b996da470](https://github.com/facebook/react-native/commit/4b996da470b43f97fd0426b54bda739d7717fb28) by [@grabbou](https://github.com/grabbou))

#### iOS specific

- Build error warning of **Text** module ([d834197746](https://github.com/facebook/react-native/commit/d834197746371b203bd7d7aaabdc2bc581acc867) by [@zhongwuzw](https://github.com/zhongwuzw))

## v0.59.0

Welcome to release 0.59 of React Native! For highlights of this release, please view the dedicated [blog post](https://reactnative.dev/blog/2019/03/12/releasing-react-native-059). Thanks to those who gave feedback during the [release candidate phase](https://github.com/react-native-community/react-native-releases/issues/79). If you're interested in helping evaluate our next release (0.60), subscribe to the dedicated issue [here](https://github.com/react-native-community/react-native-releases/issues/99).

### Added

- Add a Metro configuration to the template with inline require/import options; read more about it [in the blog post](https://reactnative.dev/blog/2019/03/12/releasing-react-native-059) ([ae11993d0f](https://github.com/facebook/react-native/commit/ae11993d0f6c6de661867b5d032d844e91c83c6f) by [@cpojer](https://github.com/cpojer))

#### Android specific

- **Text** and **TextInput** now has prop [maxFontSizeMultiplier](https://reactnative.dev/docs/text#maxfontsizemultiplier) ([4936d284df](https://github.com/facebook/react-native/commit/4936d284df36071047ce776d9e2486c0371f7b97) by [@rigdern](https://github.com/rigdern))
- **TextInput** now has prop [autoComplete](https://reactnative.dev/docs/textinput#autocomplete) prop ([f15145639d](https://github.com/facebook/react-native/commit/f15145639dab1e8d7a1c79a127b7d45c91d025a8))
- **CameraRoll**'s `getPhotos` now supports `assetType: "All"` to let users pick from video and photos simultaneously ([54534e79d7](https://github.com/facebook/react-native/commit/54534e79d724ff57572efc43f65100067f35d4c1) by [@kesha-antonov](https://github.com/kesha-antonov))
- **Text** and **TextInput** now support `textAlign:justify` for android O+ (api level >=26) ([d2153fc58d](https://github.com/facebook/react-native/commit/d2153fc58d825006076a3fce12e0f7eb84479132) by [sunnylqm](https://github.com/sunnylqm))

#### iOS specific

- **TextInput** now has prop `rejectResponderTermination` to enable TextInputs inside Swipeables to function properly ([11df0eae5f](https://github.com/facebook/react-native/commit/11df0eae5ff8f530bfaf56aaf2209ff48f3ed9ac) by [@cmcewen](https://github.com/cmcewen))
- **ActionSheetIOS** has a new prop `destructiveButtonIndexes` for an `Array<number>` of destructive indexes ([67e7f16944](https://github.com/facebook/react-native/commit/67e7f16944530aa0d1a4d375b0de5efd5c432865) by [@sdg9](https://github.com/sdg9))
- Add `isEventFromThisApp` to `KeyboardEvent` notifications to disambiguate keyboard events when apps are running side-by-side ([05f35c296d](https://github.com/facebook/react-native/commit/05f35c296d91d946acf4edd94106fbdd0dd69a29) by [@nossbigg](https://github.com/nossbigg))
- Allow changing the project path in `react-native-xcode.sh` using env var `PROJECT_ROOT` ([9ccde378b6](https://github.com/facebook/react-native/commit/9ccde378b6e6379df61f9d968be6346ca6be7ead) by [@janicduplessis](https://github.com/janicduplessis))

### Changed

- `React` is now at `v16.8.3` ([ccefc700d0](https://github.com/facebook/react-native/commit/ccefc700d0120539eba73747d1d6b65effb0645d) and ([2af13b4477](https://github.com/facebook/react-native/commit/2af13b4477342d3498ab302ceb5297fcbc17e097) by [@cpojer](https://github.com/cpojer) and [@hramos](https://github.com/hramos))
- `Flow` dependency is now at `v0.92.0` ([5ee738659b](https://github.com/facebook/react-native/commit/5ee738659b4ac7b0e73b9dba09a63091d4571ed9) by [@pakoito](https://github.com/pakoito))
- `@react-native-community/cli` dependency is at `v1.2.1` ([a252aee2ea](https://github.com/facebook/react-native/commit/a252aee2eabd9eeffb279b9fcf1827093ef4039c) and [5e1504b0fc](https://github.com/facebook/react-native/commit/5e1504b0fca99cad3bfe2339ac0e7862b2315f9c) by [@grabbou](https://github.com/grabbou))
- Enhance Flow types definitions for **ViewPropTypes** ([7ff9456f2e](https://github.com/facebook/react-native/commit/7ff9456f2e5fd72286f5be52598988707eaef69c) by [@danibonilha](https://github.com/danibonilha))

#### Android specific

- Clarify error message to direct people to `react-native start` rather than `react-native bundle` ([46aaa02274](https://github.com/facebook/react-native/commit/46aaa02274a51ebe2aaa9fca2422dcebf9323475) by [@sunnylqm](https://github.com/sunnylqm))
- **BREAKING** - removed `OkHttpClientProvider.replaceOkHttpClient` method; please use `OkHttpClientProvider.setOkHttpClientFactory` from 0.54+ ([7cbdd7b6ac](https://github.com/facebook/react-native/commit/7cbdd7b6ac7db2192f7d0193d22326041517a63e) by [@cdlewis](https://github.com/cdlewis))
- **BREAKING** - remove `ViewHelper`, use `ViewCompat` instead; this may also require changing the `android:theme` to be from `Theme.AppCompat`; read more about it [in the blog post](https://reactnative.dev/blog/2019/03/12/releasing-react-native-059) ([c493cfe708](https://github.com/facebook/react-native/commit/c493cfe7083a6b97b6ec9eb9cb59cf1fdec45458) by [@dulmandakh](https://github.com/dulmandakh))
- Add nullable annotations to `ReadableMap`, `WritableMap`, `ReadableArray`, `Writable`, `ReactPackage`, and native module interfaces; this may impact Kotlin usage ([b640b6faf7](https://github.com/facebook/react-native/commit/b640b6faf77f7af955e64bd03ae630ce2fb09627), [c93cbdf1b2](https://github.com/facebook/react-native/commit/c93cbdf1b272cfd60124d9ddb4c52b58ca59d319), [7b33d6b0b9](https://github.com/facebook/react-native/commit/7b33d6b0b96578a548e9a7f973eb59ac9236697b), and [84f40da990](https://github.com/facebook/react-native/commit/84f40da990dfd21eb1c21e20f2be0f8b2c5a78e4) by [@dulmandakh](https://github.com/dulmandakh))
- `Soloader` is now at `v0.6.0` ([07d1075f37](https://github.com/facebook/react-native/commit/07d1075f372bb864ddc62b9c8f613b03becfa568) by [@dulmandakh](https://github.com/dulmandakh))
- Android Support Library is now at `v28.0.0` ([5bbed43854](https://github.com/facebook/react-native/commit/5bbed43854957a37c4b51f49f30669665a72e7f7) by [@dulmandakh](https://github.com/dulmandakh))
- `targetSdkVersion` is now at `v28` ([57f444bd8a](https://github.com/facebook/react-native/commit/57f444bd8a175038c367fa1b7d93e2e8ba9de7ed) by [@dulmandakh](https://github.com/dulmandakh))
- Android Plugin is now at `v3.3.1` ([da5b5d2fa1](https://github.com/facebook/react-native/commit/da5b5d2fa134aa09dda4a620be9fa4d3d419201f) by [@dulmandakh](https://github.com/dulmandakh))
- Enable Java 8 support ([38eb2a70af](https://github.com/facebook/react-native/commit/38eb2a70afa87c49c1e62754f5ae3cd26e7f59c3) by [@dulmandakh](https://github.com/dulmandakh))
- Suppress misleading missing permission warnings ([d53dbb0dfb](https://github.com/facebook/react-native/commit/d53dbb0dfb99bdee5cd7eeaaa6f4ae51dcca00c5) by [@dulmandakh](https://github.com/dulmandakh))
- Add back `buildToolsVersion` to build.gradle ([cf52ab561d](https://github.com/facebook/react-native/commit/cf52ab561d9fa0e4d14de7a8f3324cbc2b25bf92) by [@dulmandakh](https://github.com/dulmandakh))
- **TimePickerAndroid** has better Flow types definitions ([2ed1bb2e01](https://github.com/facebook/react-native/commit/2ed1bb2e01ab7360d9bf13e4f9e13cb9c9c9d32e) by [@yushimatenjin](https://github.com/yushimatenjin))
- `ReactActivity`, `ReactSlider`, `ReactTextView`, and `ReactPicker` extends `AppCompatActivity`; updates to `TimePickerDialogModule` and `DatePickerDialogModule` as well ([dda2b82a0a](https://github.com/facebook/react-native/commit/dda2b82a0a49da52b43b50db5a2bda50a216c09b), [3b9604feda](https://github.com/facebook/react-native/commit/3b9604feda8f9e8fe3dd884912ec7d9be67d7f1d), [ba0c3ffd5b](https://github.com/facebook/react-native/commit/ba0c3ffd5b46963a8bb27b40eb396965535cd927), [833429dd63](https://github.com/facebook/react-native/commit/833429dd633b33fff71224a7ce663b60681a7f81), [adc1410572](https://github.com/facebook/react-native/commit/adc14105727f708c990b7a744a0ea270ff0fba13), [c6c5a173bc](https://github.com/facebook/react-native/commit/c6c5a173bce3d8c847931d26eddb295956285438), and [be361d0fc1](https://github.com/facebook/react-native/commit/be361d0fc1930b1679c4226e15c1a5b416b94105) by [@dulmandakh](https://github.com/dulmandakh))
- Fix lint error/warnings that cause older Android crashes ([d2fc19f4aa](https://github.com/facebook/react-native/commit/d2fc19f4aa94888b7c3d3f4a5fb621bf96a1aff9) by [@dulmandakh](https://github.com/dulmandakh))
- The error message on getting Android drawable folder suffix now gives more information ([a159a33c02](https://github.com/facebook/react-native/commit/a159a33c02e0c0d7aa245adfd540a066ec065362) by [@BrunoVillanova](https://github.com/BrunoVillanova))
- `SYSTEM_ALERT_WINDOW` permissions available only in debug builds ([84a2fb0a4a](https://github.com/facebook/react-native/commit/84a2fb0a4a67cd9dc37cf4e5bab814f25181cfb7) by [@dulmandakh](https://github.com/dulmandakh))
- Add talkback navigation support for links and header ([b9d3743cda](https://github.com/facebook/react-native/commit/b9d3743cda95d1f475dbec8f6d72935941519deb) by [@yangweigbh](https://github.com/yangweigbh))
- **FlatList** has `removeClippedSubviews` default to `true` on Android ([1a499f43b2](https://github.com/facebook/react-native/commit/1a499f43b2d03cc27dd6c25c8f13a767862afba1) by [@fred2028](https://github.com/fred2028))

#### iOS specific

- Moved iOS build cache directory from `~/.rncache` to `~/Library/Caches/com.facebook.ReactNativeBuild` ([1024dc251e](https://github.com/facebook/react-native/commit/1024dc251e1f4777052b7c41807ea314672bb13a) by [@sryze](https://github.com/sryze))
- Keyboard API Event flow types have been improved ([7ee13cc84c](https://github.com/facebook/react-native/commit/7ee13cc84c342244d3aa9e485de0e759482287ea) by [@nossbigg](https://github.com/nossbigg))
- Expose **AsyncLocalStorage** get/set methods to native code ([7b8235a95a](https://github.com/facebook/react-native/commit/7b8235a95ad9519e9735cc1555a8d3aa5bb7c0ee) by [@ejmartin504](https://github.com/ejmartin504))
- Clear RCTBridge **launchOptions** when bridge is reloaded ([19d04a312b](https://github.com/facebook/react-native/commit/19d04a312bf4221cd26beff6d0da6dd296a28cd0) by [@venik](https://github.com/venik))

### Deprecated

The following deprecations are part of our Lean Core initiative; read more about it [in the blog post](https://reactnative.dev/blog/2019/03/12/releasing-react-native-059).

- Deprecated [MaskedViewIOS](https://reactnative.dev/docs/maskedviewios) as it has now been moved to [react-native-community/masked-view](https://github.com/react-native-community/react-native-masked-view) ([4ac65f5413](https://github.com/facebook/react-native/commit/4ac65f5413ee59f7546b88a2eae2c4ce6fa8826b) by [@FonDorn](https://github.com/FonDorn))
- Deprecated [ViewPagerAndroid](https://reactnative.dev/docs/viewpagerandroid) as it has now been moved to [react-native-community/viewpager](https://github.com/react-native-community/react-native-viewpager) ([77300ca91c](https://github.com/facebook/react-native/commit/77300ca91c17d371f6ba04230b8c2e8f5cd99ab8) by [@ferrannp](https://github.com/ferrannp))
- Deprecated [AsyncStorage](https://reactnative.dev/docs/asyncstorage) as it has now been moved to [react-native-community/asyncstorage](https://github.com/react-native-community/react-native-async-storage) ([ffe37487b2](https://github.com/facebook/react-native/commit/ffe37487b228b77a3697c32767e91f1dd68041d8) by [@Krizzu](https://github.com/Krizzu))
- Deprecated [Slider](https://reactnative.dev/docs/slider) as it has now been moved to [react-native-community/slider](https://github.com/react-native-community/react-native-slider) ([bf888a7582](https://github.com/facebook/react-native/commit/bf888a7582763a593d8b36874d242653fc0a9575) by [@michalchudziak](https://github.com/michalchudziak))
- Deprecated [NetInfo](https://reactnative.dev/docs/netinfo) as it has now been moved to [react-native-community/netinfo](https://github.com/react-native-community/react-native-netinfo) ([d9c0dfe353](https://github.com/facebook/react-native/commit/d9c0dfe353eceb91efcec774bab0f65b6792e4fa) by [@matt-oakes](https://github.com/matt-oakes))
- Deprecated [ImageStore](https://reactnative.dev/docs/imagestore) and directed users to `expo-file-system` and `react-native-fs` ([62599fa8ff](https://github.com/facebook/react-native/commit/62599fa8ff7f308259fe178fa37b7bcf3c1a408c) by [@EvanBacon](https://github.com/EvanBacon))

#### iOS specific

- Replace deprecated `stringByReplacingPercentEscapesUsingEncoding:` with `stringByAddingPercentEncodingWithAllowedCharacters:` ([61ca119650](https://github.com/facebook/react-native/commit/61ca11965046f75e7500e5152c5f2b60df2a2cd5) by [@pvinis](https://github.com/pvinis))

### Removed

- `react-native-git-upgrade` is now officially dead; use `react-native upgrade` instead (which uses [rn-diff-purge](https://github.com/react-native-community/rn-diff-purge) under the covers) ([a6bdacb257](https://github.com/facebook/react-native/commit/a6bdacb2575dcc3be2acec95d8a6db6e2db909c4) by [@cpojer](https://github.com/cpojer))

#### iOS specific

- Remove the previously deprecated **TabBarIOS** ([02697291ff](https://github.com/facebook/react-native/commit/02697291ff41ddfac5b85d886e9cafa0261c8b98) by [@axe-fb](https://github.com/axe-fb))
- **AlertIOS** is now replaced with **Alert** ([e2bd7db732](https://github.com/facebook/react-native/commit/e2bd7db732602b2c477fe040f2946bd8293df297) by [@wellmonge](https://github.com/wellmonge))

### Fixed

- **KeyboardAvoidingView** now shows the correct height after the keyboard is toggled ([745484c892](https://github.com/facebook/react-native/commit/745484c892e40cfe15ded128f5a589edb28d8f6b) by [@shauns](https://github.com/shauns))
- Adds fixes for react-native-windows UWP ([dfcbf9729f](https://github.com/facebook/react-native/commit/dfcbf9729fab64c4bd8c00e1d092ec4e9bae717f) by [@rozele](https://github.com/rozele))
- The `Map` and `Set` polyfills no longer reject non-extensible object keys; also fix hash collision scenario ([90850cace9](https://github.com/facebook/react-native/commit/90850cace9991ed0a02605586ea5c32ce099de65) by [@benjamn](https://github.com/benjamn))
- Corrected StyleSheet's transformation perspective to match iOS's behavior, regardless of screen density ([4c10f9321c](https://github.com/facebook/react-native/commit/4c10f9321c9d01dbcac4808e7e6674cba12f3aa5) by [@syaau](https://github.com/syaau))
- Fix `yarn test` in new projects ([5218932b13](https://github.com/facebook/react-native/commit/5218932b13ad0649ff2a57aaf1ec682fe278c47d) by [@Esemesek](https://github.com/Esemesek))
- Fix issue with `getInspectorDataForViewTag` that caused red screen when toggling inspector ([46f3285a3f](https://github.com/facebook/react-native/commit/46f3285a3f240f9325a548e677a1927402d76bd7) by [@TranLuongTuanAnh](https://github.com/TranLuongTuanAnh))
- Fix `displayName` for `Image`; this will make tests no longer mistake it as `Component` ([4989123f8c](https://github.com/facebook/react-native/commit/4989123f8cab37c95b020e23b9a925746a3f3677) by [@linnett](https://github.com/linnett))
- Fix regression of **VirtualizedList** jumpy header ([e4fd9babe0](https://github.com/facebook/react-native/commit/e4fd9babe03d82fcf39ba6a46376f746a8a3e960) by [@danilobuerger](https://github.com/danilobuerger))
- Set `wait_for_recheck=true` to work around crash in Flow ([ffc9908bef](https://github.com/facebook/react-native/commit/ffc9908bef535ba1392c370ca4e9e4e528c3c4c5) by [@gabelevi](https://github.com/gabelevi))
- Fix flow typing of **Text** ([10c8352141](https://github.com/facebook/react-native/commit/10c835214160cc5a5726c8dd9f0d42a0275d198b) by [@sahrens](https://github.com/sahrens))
- Fix `jest` and `jest-junit` to be only development dependencies ([c7b57f1986](https://github.com/facebook/react-native/commit/c7b57f19869f31474c8ee17f7a1ac1551bab1b6e) by [@vovkasm](https://github.com/vovkasm))
- Fix layout issue with **SwipeableQuickActionButton** ([ad52f52624](https://github.com/facebook/react-native/commit/ad52f526247af6eebadd2ea436b86ff7eb874f27) by [@varungupta85](https://github.com/varungupta85))

#### Android specific

- Fix textTransform when used with other text styles on Android (#22670) ([3a33e75183](https://github.com/facebook/react-native/commit/3a33e75183bf196d61b46e662b4c3f84a5f570bd) by [@janicduplessis](https://github.com/janicduplessis))
- Fix warnings related to updating to gradle 4.10.1 or higher ([5be50d4820](https://github.com/facebook/react-native/commit/5be50d482082917351b46ee2e339e56e7e34e111) by [@misaku](https://github.com/misaku))
- Fix issue with use of Android API 28 by adding security config for metro access ([5747094532](https://github.com/facebook/react-native/commit/5747094532bace3fe6b1ebdf55235e53189baa71), [19492b730b](https://github.com/facebook/react-native/commit/19492b730b6779486f83d5ddbaeeb870cb3d5e9c), [3b0b7ce8c3](https://github.com/facebook/react-native/commit/3b0b7ce8c3c3679610c14ca72beb1a9dcf84d930), and [84572c4051](https://github.com/facebook/react-native/commit/84572c4051f11f68ddf0928d2c3df5850ae15491) by [@Salakar](https://github.com/Salakar) and [@dulmandakh](https://github.com/dulmandakh))
- Fix Inverted Horizontal **ScrollView** ([32cb9ec49c](https://github.com/facebook/react-native/commit/32cb9ec49c801fcebe61486149134ab542d9364b) by [@dmainas](https://github.com/dmainas))
- Fix crash on **CheckBox** on older Android versions ([58437cd10a](https://github.com/facebook/react-native/commit/58437cd10a667bbcbc16781df855fd7c3d73bf49) by [@vonovak](https://github.com/vonovak))
- Fix undefined error description in **Image** `onError` callback ([7795a672d3](https://github.com/facebook/react-native/commit/7795a672d3a24a5b50df6ad6d30555d856b557cc) by [@Jyrno42](https://github.com/Jyrno42))
- Fix Android crash on animating with `useNativeDriver` ([e405e84fc3](https://github.com/facebook/react-native/commit/e405e84fc35923888442df748757787698040010) by [@scisci](https://github.com/scisci))
- Fix dev settings menu not appearing for certain codebases due to namespace conflicts ([9968d0c203](https://github.com/facebook/react-native/commit/9968d0c2030c1065979db34cc9a244bd52b7b2a5) by [@khaled-cliqz](https://github.com/khaled-cliqz))
- Fix exception occurring while fading a **TextView** ([f83281e2ce](https://github.com/facebook/react-native/commit/f83281e2ce2aece44b1207844d8a5149d5d2e78d) by [@mdvacca](https://github.com/mdvacca))
- Fix **StatusBar** overwriting previously set `SystemUiVisibility` flags ([8afa0378cd](https://github.com/facebook/react-native/commit/8afa0378cd09b8fa6c30d759539fc9a680e8cae2) by [@rogerkerse](https://github.com/rogerkerse))
- Prevent `fetch()` POST requests from appending `charset=utf-8` to `Content-Type` header ([4a807761a4](https://github.com/facebook/react-native/commit/4a807761a4aca9e551ff2cee8ca18a2450fb11ca) and [0d5aebbd9a](https://github.com/facebook/react-native/commit/0d5aebbd9ac92a90ec7ab1426ed92dd22ae8c736) by [@nhunzaker](https://github.com/nhunzaker))
- Fix issue with **Location** that led to exceptions in two cases ([f32dc63546](https://github.com/facebook/react-native/commit/f32dc635467a2e93371f0cf2e40b07a712349288) by [@mikelambert](https://github.com/mikelambert))

#### iOS specific

- Fix **TextInput** mistakenly capitalizing I's after emojiis ([f307ac7c5e](https://github.com/facebook/react-native/commit/f307ac7c5e3adb9b4c0f8b2e4b8cdc2f980c7733) by [@dchersey](https://github.com/dchersey))
- Fix **TextView**'s `setAttributedText` for CJK languages on single-line text fields ([e38be82dfa](https://github.com/facebook/react-native/commit/e38be82dfa8b49385b990629318f027de26500cf) by [@mandrigin](https://github.com/mandrigin))
- Fix RCTImageLoader multi thread crash ([5ed31ce524](https://github.com/facebook/react-native/commit/5ed31ce5240a7392afdc522120edef182e0014ed))
- Fix removing keys of large values from **AsyncStorage** ([27b4d21564](https://github.com/facebook/react-native/commit/27b4d215641f9397ef415cbb2acfc1275e6110ac) by [@esprehn](https://github.com/esprehn))
- Fix overscroll behavior on virtualized lists; behavior is now consistent ([4d5f85ed42](https://github.com/facebook/react-native/commit/4d5f85ed426cfb43dc5e63f915e416a47d76b965))
- Fix **Alert** to not block input focus and blur ([e4364faa3c](https://github.com/facebook/react-native/commit/e4364faa3cab150b82272819fc92086fb4da297e) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fix broken JSIexecutor search path ([2aa2401766](https://github.com/facebook/react-native/commit/2aa24017667721ba17a859ca4e13d43e52d86bc5) by [@amccarri](https://github.com/amccarri))
- Fix potential linker issues when using Xcode project ([9f72e6a5d0](https://github.com/facebook/react-native/commit/9f72e6a5d02d84fe8ed545e0c0904199b9cb3c7a) by [@tyrone-sudeium](https://github.com/tyrone-sudeium))
- Fix crash when `scrollEnabled` used in singleline textinput ([9ff43abe65](https://github.com/facebook/react-native/commit/9ff43abe653ac5af0e591b369228f0809caad204) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fix crash in gif image usage ([d0cd3cae13](https://github.com/facebook/react-native/commit/d0cd3cae13a1b1fff8a2e378b5228d3cdccd695f) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fix **geolocation** to not constantly reset accuracy to default of 100 meters ([bbcb97a29a](https://github.com/facebook/react-native/commit/bbcb97a29adc2a3a05728b47d28e28fa78d84df2) by [@omnikron](https://github.com/omnikron))
- Fix iOS build issue related to missing `DoubleConversion` and `glog` to `cxxreact`, `jsi` and `jsiexecutor` subspecs in `React.podspec` file ([00392ac46b](https://github.com/facebook/react-native/commit/00392ac46b6319dcff2b6df2e5f7bb4ee094612f) by [@alexruperez](https://github.com/alexruperez))
- Fix "'folly/folly-config.h' file not found" build error when using React via CocoaPods ([5560a47c1d](https://github.com/facebook/react-native/commit/5560a47c1dbc7daab1e4f4aac0667080fdea836a) by [@Salakar](https://github.com/Salakar))
- Fix image cache to follow [MDN strategy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#Freshness) ([fb8ba3fe95](https://github.com/facebook/react-native/commit/fb8ba3fe959fd2a0c4ef0025fd84f6deffd9d03b) and [fb8ba3fe95](https://github.com/facebook/react-native/commit/fb8ba3fe959fd2a0c4ef0025fd84f6deffd9d03b) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fix crash due to IllegalArgumentException when creating CookieManage ([cda8171af3](https://github.com/facebook/react-native/commit/cda8171af30815edfa331e07d1bbf605f0926303) by [@mdvacca](https://github.com/mdvacca))
- Fix cursor placement after toggling `secureTextEntry` cursor spacing ([8ce3c1b43e](https://github.com/facebook/react-native/commit/8ce3c1b43edd47191c8e5ee8432c58f6e93dfca7) by [@ericlewis](https://github.com/facebook/react-native/commits?author=ericlewis))

## v0.58.6

This release is fairly small, as we approach stable status for [0.59](https://github.com/react-native-community/react-native-releases/issues/79).

Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/95) for cherry-picking commits - you can participate in the decision process for the next patch release [here](https://github.com/react-native-community/react-native-releases/issues/97).

### Fixed

#### Android specific

- Fix Inverted Horizontal ScrollView on Android (#23233) ([32cb9ec49c](https://github.com/facebook/react-native/commit/32cb9ec49c801fcebe61486149134ab542d9364b) by [@dmainas](https://github.com/dmainas))

#### iOS specific

- Map TextInput textContentType strings to Objective-C constants (#22611) ([a89fe4165c](https://github.com/facebook/react-native/commit/a89fe4165c2a331a9d88636d89a5a48151ab8660) by [@levibuzolic](https://github.com/levibuzolic))
- Don't reconnect inspector if connection refused (#22625) ([d9489c4e9c](https://github.com/facebook/react-native/commit/d9489c4e9c646b79025f07635b840e9974be8cd5) by [@msand](https://github.com/msand))

## v0.58.5

This release resolves a few bugs and includes a few improvements, listed below.

Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/86) for cherry-picking commits - you can participate in the decision process for the next patch release [here](https://github.com/react-native-community/react-native-releases/issues/95).

### Removed

- Remove fallback cache ([9d60c20cb3](https://github.com/facebook/react-native/commit/9d60c20cb35074e92a90b803d3d6f420f6671635) by [@grabbou](https://github.com/grabbou))

### Fixed

- Fixes capitalized I's when emojis are present after the text being edited. (#21951) ([f307ac7c5e](https://github.com/facebook/react-native/commit/f307ac7c5e3adb9b4c0f8b2e4b8cdc2f980c7733) by [@dchersey](https://github.com/dchersey))
- Fix broken jsiexecutor search path. (#23274) ([2aa2401766](https://github.com/facebook/react-native/commit/2aa24017667721ba17a859ca4e13d43e52d86bc5) by [@amccarri](https://github.com/amccarri))
- Fix duplicate symbols linker error in xcodeproj (#23284) ([9f72e6a5d0](https://github.com/facebook/react-native/commit/9f72e6a5d02d84fe8ed545e0c0904199b9cb3c7a) by [@tyrone-sudeium](https://github.com/tyrone-sudeium))
- apply Network Security Config file (fixes #22375) (part 2 of #23105) (#23135) ([84572c4051](https://github.com/facebook/react-native/commit/84572c4051f11f68ddf0928d2c3df5850ae15491) by [@Salakar](https://github.com/Salakar))
- Fix crash for web socket in some race conditions (#22439) ([dd209bb789](https://github.com/facebook/react-native/commit/dd209bb7891ed5f05b96a9922c7b0e39bf3ac9e9) by [@zhongwuzw](https://github.com/zhongwuzw))

#### iOS specific

- Don't attempt to load RCTDevLoadingView lazily ([a9dd828c68](https://github.com/facebook/react-native/commit/a9dd828c68338dbf0e55ffa1838bf8ff574f317d) by [@fkgozali](https://github.com/fkgozali))

### Security

#### Android specific

- improve Android Network Security config (#23429) ([5747094532](https://github.com/facebook/react-native/commit/5747094532bace3fe6b1ebdf55235e53189baa71) by [@dulmandakh](https://github.com/dulmandakh))

## v0.58.4

This release resolves a few bugs and includes a few improvements, listed below.

Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/81) for cherry-picking commits - you can participate in the decision process for the next patch release [here](https://github.com/react-native-community/react-native-releases/issues/86).

### Added

#### Android specific

- Add error description to Image onError callback ([7795a672d3](https://github.com/facebook/react-native/commit/7795a672d3a24a5b50df6ad6d30555d856b557cc) by [@Jyrno42](https://github.com/Jyrno42))

### Changed

#### Android specific

- bump soloader to `0.6.0` ([07d1075f37](https://github.com/facebook/react-native/commit/07d1075f372bb864ddc62b9c8f613b03becfa568) by [@dulmandakh](https://github.com/dulmandakh))

### Removed

- Remove jest and jest-junit from runtime dependencies (#23276) ([c7b57f1986](https://github.com/facebook/react-native/commit/c7b57f19869f31474c8ee17f7a1ac1551bab1b6e) by [@vovkasm](https://github.com/vovkasm))

### Fixed

#### Android specific

- Fixes Android crash on animated style with string rotation ([e405e84fc3](https://github.com/facebook/react-native/commit/e405e84fc35923888442df748757787698040010) by [@scisci](https://github.com/scisci))

#### iOS specific

- fix incorrect type which makes animated gifs not loop forever on device (#22987) ([728a35fcf2](https://github.com/facebook/react-native/commit/728a35fcf2a2b0d695a4d7083b266eda486b1392) by [@chrisnojima](https://github.com/chrisnojima))
- Fixes for running the simulator ([9a8c9596eb](https://github.com/facebook/react-native/commit/9a8c9596ebe41e27d37ba18d6bf09f1c931c1ff2) by [@osunnarvik](https://github.com/osunnarvik)), ([98bcfe00fb](https://github.com/facebook/react-native/commit/98bcfe00fbca066d6914a2680c3647b678caccc5) by [@cpojer](https://github.com/cpojer)) and ([8bddcb6cb0](https://github.com/facebook/react-native/commit/8bddcb6cb0914373a0aeb927f12a6d48ffc5bb84) by [@cpojer](https://github.com/cpojer))

## v0.58.3

This release resolves a regression in **StatusBar** using [these fixes](https://github.com/facebook/react-native/compare/v0.58.2...v0.58.3).

Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/81) for cherry-picking commits - you can participate in the decision process for the next patch release [here](https://github.com/react-native-community/react-native-releases/issues/81).

## v0.58.2

This release fixes an issue caused by a wrongly reverted merge commit, that caused a short timeframe of commits to not actually be in the original 0.58.0. Those commits have been added to the 0.58 changelog below, as many are intertwined with the original work.

Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/81) for cherry-picking commits - you can participate in the decision process for the next patch release [here](https://github.com/react-native-community/react-native-releases/issues/81).

## v0.58.1

There were some regressions with developer tools that prevented `react-native run-ios` from working properly in 0.58.0; this patch fix addresses that.

Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/81) for cherry-picking commits - you can participate to the decision process for the next patch release [here](https://github.com/react-native-community/react-native-releases/issues/81).

## v0.58.0

Welcome to first stable release of React Native of 2019!
There are a number of significant changes in this version, and we'd like to especially draw your attention to them:

- [Modernizing](https://github.com/facebook/react-native/issues/21581) and [strengthening flow types](https://github.com/facebook/react-native/issues/22100) for core components
- Breaking changes to `ScrollView`, `CameraRollView`, and `SwipeableRow` that make it no longer bound to the component instance in certain methods
- Support for mutual TLS in WebKit
- Asset serving from directories besides `/assets`
- Numerous crash fixes and resolutions for unexpected behavior

Aside from those:

- if you are an iOS developer, you'll need to manually link `JavaScriptCore.framework` when upgrading; this can be done via Xcode, and following the steps shown [here](https://camo.githubusercontent.com/c09cd42747364b498efa7c82fcb73978ba076eae/687474703a2f2f646f63732e6f6e656d6f62696c6573646b2e616f6c2e636f6d2f696f732d61642d73646b2f616464696e672d6672616d65776f726b732e706e67).

- Android developers, please note that Android's target SDK 27 is supported. Work is still underway to land target SDK 28 support, and it will come soon.

Thanks to those who gave feedback during the [release candidate phase](https://github.com/react-native-community/react-native-releases/issues/41). If you're interested in helping evaluate our next release (0.59), subscribe to the dedicated issue [here](https://github.com/react-native-community/react-native-releases/issues/79).

### Added

- Add support for `publicPath` to enable serving static assets from different locations ([0b314960aa](https://github.com/facebook/react-native/commit/0b314960aa34c71fc731bac9c1f2b48f3223c5cb) by [@gdborton](https://github.com/gdborton))
- Add **TouchableBounce** now has a simple `bounce()` function that can be used to trigger a bounce without callbacks ([7fe3f90156](https://github.com/facebook/react-native/commit/7fe3f90156e879fe53665efb5a90ba3a711475fa))

#### Android specific

- Bundler server host can now be set using Android System Properties, making for easier debugging across multiple apps or app installs `adb shell setprop metro.host` ([e02a154787](https://github.com/facebook/react-native/commit/e02a154787274be1da3632cb1412554cbd53928b) by [@stepanhruda](https://github.com/stepanhruda))
- Native Modules can now reject a promise with an additional `WritableMap` arg for extra properties (`userInfo`). See the interface defined in [`Promise.java`](https://github.com/facebook/react-native/blob/60b3942/ReactAndroid/src/main/java/com/facebook/react/bridge/Promise.java) for available methods. This is accessible in JavaScript as `Error.userInfo`. This is to match iOS's existing `Error.userInfo` behavior. See PR for examples. (#20940 by @Salakar)
- Native Modules now expose a `nativeStackAndroid` property to promises rejected with an Exception/Throwable - making native error stacks available inside Javascript: `Error.nativeStackAndroid`. This is to match iOS's existing `Error.nativeStackIOS` support. See PR for examples. (#20940 by @Salakar)

#### iOS specific

- Add `moduleForName: lazilyLoadIfNecessary` to **RCTBridge.h** to lookup modules by name and force load them, plus various improvements to LazyLoading ([d7a0c44590](https://github.com/facebook/react-native/commit/d7a0c44590bcf3fb9d055aeae3391d5bcd7e21be), [6534718a18](https://github.com/facebook/react-native/commit/6534718a1898aa472e255d2aa9a0a6cae305619a), [d7865ebde8](https://github.com/facebook/react-native/commit/d7865ebde879983b355d6f6e64232e4bd264081d), [04ea9762e2](https://github.com/facebook/react-native/commit/04ea9762e2013dcebf9f8a51d8974fa799e41cd5), [1f394fa673](https://github.com/facebook/react-native/commit/1f394fa673a876753fdc9ac2cb86a4d4a58cd8cd), [80f92adf1f](https://github.com/facebook/react-native/commit/80f92adf1f35e74ee6db0b2f445cc851463059cf), and [81b74ec1ed](https://github.com/facebook/react-native/commit/81b74ec1ed3792c0b406c30b0a1c01219a2d6243) by [@dshahidehpour](https://github.com/dshahidehpour), [@fkgozali](https://github.com/fkgozali), and [@mmmulani](https://github.com/mmmulani))
- Add ability for **WebView** to `setClientAuthenticationCredential` when `useWebKit={true}` for mutual TLS authentication ([8911353c47](https://github.com/facebook/react-native/commit/8911353c47af018f78c1cff59dfab05b975e39ed) and [8911353c47](https://github.com/facebook/react-native/commit/8911353c47af018f78c1cff59dfab05b975e39ed) by [@mjhu](https://github.com/mjhu))

### Changed

- Major improvements to Flow types for Core Components ([499c195eba](https://github.com/facebook/react-native/commit/499c195ebab0f276e3a58baf1e6172c1ba046a9e), [fbc5a4f5e6](https://github.com/facebook/react-native/commit/fbc5a4f5e65e024c10ad43d84f2b2353c9e92461), [f9050e0908](https://github.com/facebook/react-native/commit/f9050e09084cf3700bfc1954f97adf0f60cd8d88), [6476151717](https://github.com/facebook/react-native/commit/6476151717f44d3a90679f0f5293bed62a4f420e), [c03fc4087f](https://github.com/facebook/react-native/commit/c03fc4087ff9ac3ccbd1ab2261a1af329b354d99), [69213eea95](https://github.com/facebook/react-native/commit/69213eea9512c81ed998d240a6f5a3be05346b48), [136dfc8312](https://github.com/facebook/react-native/commit/136dfc831230e5418db02d1202e60d23a95c17b6), [3c0211b61a](https://github.com/facebook/react-native/commit/3c0211b61a1e723c3aaeba42c61b60bc724a3729), [c127000a7d](https://github.com/facebook/react-native/commit/c127000a7d2bb54599c9d80503528c3e8d75fddc), [636e146c4a](https://github.com/facebook/react-native/commit/636e146c4a27990547c81c2d36411d36b2c8e788), [c3dea894bd](https://github.com/facebook/react-native/commit/c3dea894bdb07d0b7ec18ab0388626d0340e6b69), [35a65cd704](https://github.com/facebook/react-native/commit/35a65cd704f2da67cd759c4d91251f8d4964b251), [79274979b7](https://github.com/facebook/react-native/commit/79274979b775e89d5f54a557a34062f873134199), [45c51835d6](https://github.com/facebook/react-native/commit/45c51835d69e111b67b4fcf1af39a13f7df1ee48), [a97d104b44](https://github.com/facebook/react-native/commit/a97d104b44daa068fa3848cc6c3225356f9dc318), [fb4825a2c6](https://github.com/facebook/react-native/commit/fb4825a2c65fba3aa905f7defb7d0c125fff644d), [84c5416617](https://github.com/facebook/react-native/commit/84c541661729dd20ab260c7468e48abbbe82affb), [3649a503cf](https://github.com/facebook/react-native/commit/3649a503cf52feac0386b4a10aab5ef6c4ec5ca0) by [@mottox2](https://github.com/mottox2), [@saitoxu](https://github.com/saitoxu), [@RSNara](https://github.com/RSNara), [@watanabeyu](https://github.com/watanabeyu), [@Tnarita0000](https://github.com/Tnarita0000), [@exced](https://github.com/exced), [@nd-02110114](https://github.com/nd-02110114), [@flowkraD](https://github.com/flowkraD))
- Many public components were converted to ES6 classes ([ScrollView](https://github.com/facebook/react-native/commit/010e3302b8101287f231254086f3a8788a5a2c3e) by [@thymikee](https://github.com/thymikee), [CameraRollView](https://github.com/facebook/react-native/pull/21619), [SwipeableRow](https://github.com/facebook/react-native/pull/21876/files) and [ProgressBarAndroid](https://github.com/facebook/react-native/pull/21874) by [@exceed](https://github.com/exceed), [ProgressViewIOS](https://github.com/facebook/react-native/pull/21588) by [@empyrical](https://github.com/empyrical), [SegmentedControlIOS](https://github.com/facebook/react-native/pull/21888/files), [ToolbarAndroid](https://github.com/facebook/react-native/pull/21893/files) by [@nd-02110114](https://github.com/nd-02110114)
- Flow dependency is now at `v0.85.0` ([adc8a33fcf](https://github.com/facebook/react-native/commit/adc8a33fcfeb8fc163f48ae4a4bc5aaac98bcb0d) by [@samwgoldman](https://github.com/samwgoldman))
- metro dependency is now at `v0.49.1` ([f867db366a](https://github.com/facebook/react-native/commit/f867db366aa4f0ead5a20c0d3154ca58be43fc20), [88882951e1](https://github.com/facebook/react-native/commit/88882951e1607b0af6f1772ef13135e037f9c4e3), [31bb551e75](https://github.com/facebook/react-native/commit/31bb551e75bda155b4821381e5497dc423326e3c), [de60e8643a](https://github.com/facebook/react-native/commit/de60e8643ac4e13a7f92175351268dd3c3e768db), and [de60e8643a](https://github.com/facebook/react-native/commit/de60e8643ac4e13a7f92175351268dd3c3e768db) by [@alexkirsz](https://github.com/alexkirsz) and [@rafeca](https://github.com/rafeca))
- jest dependency is now at `v24.0.0-alpha.6` ([1b4fd64325](https://github.com/facebook/react-native/commit/1b4fd643256817d29163b37101da612867a225a1), [66aba09251](https://github.com/facebook/react-native/commit/66aba092514abd2b278a4fb66c30abffbdd5d5ff), and [06c13b3e06](https://github.com/facebook/react-native/commit/06c13b3e066636b414f5dc19c919dcb138763c71) by [@rafeca](https://github.com/rafeca) and [@rubennorte](https://github.com/rubennorte))
- fbjs-scripts dependency is now at `v1.0.0` (#21880) ([cdbf719307](https://github.com/facebook/react-native/commit/cdbf719307f41e94a62307ec22463bb562d1c8de) by [@jmheik](https://github.com/jmheik))
- folly dependency is now at `v2018.10.22.00` ([a316dc6ec3](https://github.com/facebook/react-native/commit/a316dc6ec34655981c0f226186f4fb668e4a01e2), [287934dba9](https://github.com/facebook/react-native/commit/287934dba943cd954164bde8b06f9ba85940b45f), and [a70625abd7](https://github.com/facebook/react-native/commit/a70625abd7bf4fba3dafb8a969a73854b7ddcd42) by [@Kudo](https://github.com/Kudo) and [@radko93](https://github.com/radko93))
- React is set to `16.6.3` now via sync for revisions 4773fdf...6bf5e85 ([0cb59b5c23](https://github.com/facebook/react-native/commit/0cb59b5c23b76771a30f59cdcedaa3c95c4dd280) and [073ad6a036](https://github.com/facebook/react-native/commit/073ad6a0367c3156e03680c0ab0648feed2bf89c) by [@yungsters](https://github.com/yungsters))
- Clearer error messages when hot reloading ([c787866d64](https://github.com/facebook/react-native/commit/c787866d644be4c8d30bb17c237a50fdd6e1a82d) by [@alexkirsz](https://github.com/alexkirsz))
- Allow CxxModules to implement functions which take two callbacks ([8826d8b233](https://github.com/facebook/react-native/commit/8826d8b233c1e3325a575d5012b713c4786e6062) by [@acoates-ms](https://github.com/acoates-ms))

#### Breaking Changes 💥

- Public methods of components converted to ES6 classes are no longer bound to their component instance. For `ScrollView`, the affected methods are `setNativeProps`, `getScrollResponder`, `getScrollableNode`, `getInnerViewNode`, `scrollTo`, `scrollToEnd`, `scrollWithoutAnimationTo`, and `flashScrollIndicators`. For `CameraRollView`, the affected methods are: `rendererChanged`. For `SwipeableRow`, the affected methods are: `close`. Therefore, it is no longer safe to pass these method by reference as callbacks to functions. Auto-binding methods to component instances was a behaviour of `createReactClass` that we decided to not preserve when switching over to ES6 classes. (you can refer to [this example](https://github.com/react-native-community/react-native-releases/issues/81#issuecomment-459252692))
- Native Modules in Android now require `@ReactModule` annotations to access `.getNativeModule` method on the `ReactContext`. This is how your updated Native Module should look like:

  ```diff
  // CustomModule.java

  // ...
  +  import com.facebook.react.module.annotations.ReactModule;

  +  @ReactModule(name="CustomBridge")
  public class CustomModule extends ReactContextBaseJavaModule {
    // ...

    @Override
    public String getName() {
        return "CustomBridge";
    }

    // ...
  }
  ```

#### Android specific

- Optimize `PlatformConstants.ServerHost`, `PlatformConstants.isTesting`, and `PlatformConstants.androidID` for performance ([2bf0d54f15](https://github.com/facebook/react-native/commit/2bf0d54f155c28244fa60230871b3eed60a20c6d), [339d9d3afb](https://github.com/facebook/react-native/commit/339d9d3afba45bb28073db59e365caea37258891), and [9f9390ddfc](https://github.com/facebook/react-native/commit/9f9390ddfccab706ff2d346fdbd408c1cfc1c312) by [@stepanhruda](https://github.com/stepanhruda), [@fkgozali](https://github.com/fkgozali), and [@axe-fb](https://github.com/axe-fb))

#### iOS specific

- Suppress yellow box about missing export for native modules ([5431607c6d](https://github.com/facebook/react-native/commit/5431607c6d4983e0adccf0192dd4dc4f5dc85443) by [@fkgozali](https://github.com/fkgozali))

### Removed

- Remove `UIManager.measureViewsInRect()` ([d6236796b2](https://github.com/facebook/react-native/commit/d6236796b285e6ad19c53c5308a0ad9c10792a05) by [@shergin](https://github.com/shergin))

### Fixed

- Fix potential UI thread stalling scenario from Yoga JNI bindings ([2a8f6c3028](https://github.com/facebook/react-native/commit/2a8f6c3028feec7fc9a01cbdfad45955c4771bf8) by [@davidaurelio](https://github.com/davidaurelio))
- Fix crash happening due to race condition around bridge cxx module registry ([188cbb04ad](https://github.com/facebook/react-native/commit/188cbb04ad264aea32ae235b85b61e626b767b83), [188cbb04ad](https://github.com/facebook/react-native/commit/188cbb04ad264aea32ae235b85b61e626b767b83), and [188cbb04ad](https://github.com/facebook/react-native/commit/188cbb04ad264aea32ae235b85b61e626b767b83) by [@PeteTheHeat](https://github.com/PeteTheHeat))
- Fix **View** and **Text**'s displayName; show the specific name rather than generic "Component" ([7a914fcef4](https://github.com/facebook/react-native/commit/7a914fcef4ae035221e1f984c104ba20430d6fad) by [@rajivshah3](https://github.com/rajivshah3))
- Fix `react-native init --help` so that it doesn't return `undefined` ([58732a88b6](https://github.com/facebook/react-native/commit/58732a88b629b40b2d223a76fac46ecee5ae7295) by [@ignacioola](https://github.com/ignacioola))
- Fix `react-native --sourceExts` ([ce860803a4](https://github.com/facebook/react-native/commit/ce860803a4341c4121a0bb504dc669349ac0db35) by [@elyalvarado](https://github.com/elyalvarado))
- Fix accidental showing of **Modal** when `visible` prop is undefined or null ([cc13a7367b](https://github.com/facebook/react-native/commit/cc13a7367b08bd766749ddbfaacc25ade1f33a8f) by [@MateusAndrade](https://github.com/MateusAndrade))
- Fix crash during **VirtualizedList** pagination ([5803772017](https://github.com/facebook/react-native/commit/580377201793314ca643250c1bd7cf1c47d49920))
- Fix scenario where removing a module with remote debugging and Delta bundles may cause incorrect stack traces ([bea57d871f](https://github.com/facebook/react-native/commit/bea57d871f6b5bed76d1625b3e3f483695bd13e9) by [@alexkirsz](https://github.com/alexkirsz))
- Fix regression in **StyleSheet** `setStyleAttributePreprocessor` ([04085337bc](https://github.com/facebook/react-native/commit/04085337bc47392922c7911b95b8fdaea98800e8) by [@brentvatne](https://github.com/brentvatne))
- Fix React Native AsyncMode and DevTools ([aacb06c594](https://github.com/facebook/react-native/commit/aacb06c594dcd4581918035f713a69cf73bf125b) by [@bvaughn](https://github.com/bvaughn))

#### Android specific

- Fix crash when removing root nodes ([b649fa96a0](https://github.com/facebook/react-native/commit/b649fa96a088a9e8ccbf3f979ebfa4a5e28a066f) by [@ayc1](https://github.com/ayc1))
- Fix various **ReactInstanceManager** deadlocks and race conditions ([df7e8c64ff](https://github.com/facebook/react-native/commit/df7e8c64ff8f5ff739fba2ba5ed6b0610567235e), [df7e8c64ff](https://github.com/facebook/react-native/commit/df7e8c64ff8f5ff739fba2ba5ed6b0610567235e), and [be282b5287](https://github.com/facebook/react-native/commit/be282b5287f7eecf8a3fd14b06ab36454dbba5fe) by [@ayc1](https://github.com/ayc1))
- Fix IllegalArgumentException when dismissing ReactModalHostView and DialogManager ([e57ad4ee37](https://github.com/facebook/react-native/commit/e57ad4ee37b02cd4c9e10a97d7a1d2b799204d7d) and [38e01a20c3](https://github.com/facebook/react-native/commit/38e01a20c343e60d5f8cd92fb26454e9940565df) by [@mdvacca](https://github.com/mdvacca))
- Fix incorrect merged asset path with flavor for Android Gradle Plugin 3.2 ([e90319e9fa](https://github.com/facebook/react-native/commit/e90319e9fa18661144ad29faf36efba3750edb32) by [@yatatsu](https://github.com/yatatsu))
- Fix HTTP connection ontimeout callback ([a508134724](https://github.com/facebook/react-native/commit/a50813472450f51d2ef24b40be99a22beefec33c))
- Fix websocket properly closing when remote server initiates close ([2e465bca15](https://github.com/facebook/react-native/commit/2e465bca158ae9cfa89448e2a3bb8cc009397ac8) by [@syaau](https://github.com/syaau))
- Fix compatibility issue for Android 16 device ([5939d078a0](https://github.com/facebook/react-native/commit/5939d078a01edc9f83fce102317540ffbcac17c1), [f22473e9e9](https://github.com/facebook/react-native/commit/f22473e9e9f73605cd27c5e38298bd793478c84d), and [f22473e9e9](https://github.com/facebook/react-native/commit/f22473e9e9f73605cd27c5e38298bd793478c84d) by [@gengjiawen](https://github.com/gengjiawen))
- Fix issue where `Image.resizeMode` isn't respected while source is loading, resulting in unexpected padding ([673ef39561](https://github.com/facebook/react-native/commit/673ef39561ce6640e447fa40299c263961e4f178) by [@dulmandakh](https://github.com/dulmandakh))
- Fix Android 28's inverted **ScrollView** so that momentum is in the proper direction ([b971c5beb8](https://github.com/facebook/react-native/commit/b971c5beb8c7f90543ea037194790142f4f57c80) by [@mandrigin](https://github.com/mandrigin))
- Fix HTTP connection timeout callback to be appropriately called ([a508134724](https://github.com/facebook/react-native/commit/a50813472450f51d2ef24b40be99a22beefec33c))
- Fix compatibility issue with Android 16 device ([5939d078a0](https://github.com/facebook/react-native/commit/5939d078a01edc9f83fce102317540ffbcac17c1) by [@gengjiawen](https://github.com/gengjiawen))
- Fix crash when releasing RN views and removing root nodes([83405ff316](https://github.com/facebook/react-native/commit/83405ff3167eaba6fa59ca52c54943221a05ee09) and [b649fa96a0](https://github.com/facebook/react-native/commit/b649fa96a088a9e8ccbf3f979ebfa4a5e28a066f) by [@ayc1](https://github.com/ayc1))
- Close websocket properly when remote server initiates close ([2e465bca15](https://github.com/facebook/react-native/commit/2e465bca158ae9cfa89448e2a3bb8cc009397ac8) by [@syaau](https://github.com/syaau))
- Workaround a wrong fling direction for inverted ScrollViews on Android P ([b971c5beb8](https://github.com/facebook/react-native/commit/b971c5beb8c7f90543ea037194790142f4f57c80) by [@mandrigin](https://github.com/mandrigin))
- Fix **Image** to respect `resizeMode` for `defaultSource` images rather than showing padding while loading ([673ef39561](https://github.com/facebook/react-native/commit/673ef39561ce6640e447fa40299c263961e4f178) by [@dulmandakh](https://github.com/dulmandakh))

#### iOS specific

- Fix case where content of inline views didn't get relaid out ([798517a267](https://github.com/facebook/react-native/commit/798517a267841675956cb52a1c0ae493a913962a) by [@rigdern](https://github.com/rigdern))
- Fix issue with **ImagePickerIOS**'s inconsistent image when using the front-facing camera ([4aeea4d2dc](https://github.com/facebook/react-native/commit/4aeea4d2dc14cf02dc3766043e2938bf367c6170))
- Fix race condition and crash around shutdown of the JSC for iOS 11 and earlier ([bf2500e38e](https://github.com/facebook/react-native/commit/bf2500e38ec06d2de501c5a3737e396fe43d1fae) by [@mhorowitz](https://github.com/mhorowitz))
- Fix crash in **NetInfo**'s \_firstTimeReachability ([eebc8e230a](https://github.com/facebook/react-native/commit/eebc8e230a9f72c3dde34a5cfd59bbffba55e53d) by [@mmmulani](https://github.com/mmmulani))
- Fix case where inline view is visible even though it should have been truncated ([70826dbafc](https://github.com/facebook/react-native/commit/70826dbafcb00c08e0038c5066e33848141be77b) by [@rigdern](https://github.com/rigdern))
- Fix crash with **ScrollView** related to content offsets ([585f7b916d](https://github.com/facebook/react-native/commit/585f7b916d63b7b4d22a7347334765ffcd7945e9) by [@shergin](https://github.com/shergin))
- Fix an issue where **CameraRoll** wasn't showing the front-facing camera consistently during capture and preview ([4aeea4d2dc](https://github.com/facebook/react-native/commit/4aeea4d2dc14cf02dc3766043e2938bf367c6170))
- Fix case where inline view is visible even though it should have been truncated ([70826dbafc](https://github.com/facebook/react-native/commit/70826dbafcb00c08e0038c5066e33848141be77b) by [@rigdern](https://github.com/rigdern))

### Known issues

It is possible that you'll face an AAPT error regarding missing resources, [here](https://github.com/infinitered/ignite-andross/issues/244) is an example of this error, in this case, you should try to update the build tools versions to `buildToolsVersion = "28.0.2"` in your android/build.gradle file. If you maintain a react-native library which uses native code you should avoid using hardcoded versions of the build tools and use the packaged version numbers, here is an example you can [follow](https://github.com/react-native-community/react-native-linear-gradient/blob/master/android/build.gradle)

## v0.57.8

**NOTE WELL**: when you upgrade to this version you **NEED** to upgrade `react` and `react-test-renderer` to version `"16.6.3"`.

Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/71) for cherry-picking commits - you can participate to the decision process for the next release [here](https://github.com/react-native-community/react-native-releases/issues/75).

### Added

- Fix: Add displayName to ActivityIndicator (#22417) ([53da585832](https://github.com/facebook/react-native/commit/53da5858326bbddd2df112f86b2c1e935adc3882))

### Changed

- Switch: Improve Accessibility ([0c8db08f51](https://github.com/facebook/react-native/commit/0c8db08f519fdf5162dff1d9a18b58885c4c7d2f) by [@yungsters](https://github.com/yungsters))
- React sync for revisions 3ff2c7c...6bf5e85 ([073ad6a036](https://github.com/facebook/react-native/commit/073ad6a0367c3156e03680c0ab0648feed2bf89c) by [@yungsters](https://github.com/yungsters))

#### iOS specific

- Extend reason message for `RCTFatalException` (#22532) ([2831d9ef61](https://github.com/facebook/react-native/commit/2831d9ef614280d08699f3134eeaeda84c30234e) by [@zackzachariah](https://github.com/zackzachariah))

### Removed

- Remove trailing slash from origin header if no port is specified (#22290) ([cbe7d41f3f](https://github.com/facebook/react-native/commit/cbe7d41f3f509aaa8b8b0819b0d8ad4996fd7296))

### Fixed

- Fix text alpha bug ([fd78eee11b](https://github.com/facebook/react-native/commit/fd78eee11b71799aa7fa57bbd70d59c6c642c3b3) by [@necolas](https://github.com/necolas))
- fix possible NPE in StatusBarModule ([0f3be77b7d](https://github.com/facebook/react-native/commit/0f3be77b7d4177c8f94d775bf8ef2a2b68f1e828) by [@mdvacca](https://github.com/mdvacca))
- Fixes animated gifs incorrectly looping/not stopping on last frame (#21999) ([de759b949e](https://github.com/facebook/react-native/commit/de759b949e4aa4904fd60a2fcbb874a3c857b50c) by [@staufman](https://github.com/staufman))
- Fix ListEmptyComponent is rendered upside down when using inverted flag. (#21496) ([198eb02697](https://github.com/facebook/react-native/commit/198eb0269781803cc16254916b0477916afbcb0e) by [@hyochans](https://github.com/hyochans))
- Fix bug in comparison logic of object property (#22348) ([c3b3eb7f73](https://github.com/facebook/react-native/commit/c3b3eb7f73b0fb4035d4b2478bf9827caf746372) by [@vreality64](https://github.com/vreality64))
- Fix dispatch of OnLayout event for first render ([844e11967d](https://github.com/facebook/react-native/commit/844e11967d9292bd5cfe423d0fd57e34388f2337) by [@mdvacca](https://github.com/mdvacca))
- KeyboardAvoidingView: Duration cannot be less then 10ms (#21858) ([87b6533937](https://github.com/facebook/react-native/commit/87b65339379362f9db77ae3f5c9fa8934da34b25))
- default hitSlop values to 0 (#22281) ([f6d3a61677](https://github.com/facebook/react-native/commit/f6d3a6167730cc9253b796b859d8f1f33f821687) by [@Taylor123](https://github.com/Taylor123))

#### iOS specific

- Fixed for supporting mediaPlaybackRequiresUserAction under iOS 10. (#22208) ([c45d290b07](https://github.com/facebook/react-native/commit/c45d290b079f95466ad4054acf7b93c66cabc429) by [@ifsnow](https://github.com/ifsnow))
- Use main.jsbundle in iOS template for production build (#22531) ([a2ef5b85d8](https://github.com/facebook/react-native/commit/a2ef5b85d8c46cefd5873bf5fc6dddabf1d51d13) by [@radeno](https://github.com/radeno))
- Use relative path for SCRIPTDIR (#22598) ([0314fca63a](https://github.com/facebook/react-native/commit/0314fca63a035c95864e5b198e1fbd9a5ee1d2a7) by [@sunnylqm](https://github.com/sunnylqm))
- Fix UIScrollView crash ([585f7b916d](https://github.com/facebook/react-native/commit/585f7b916d63b7b4d22a7347334765ffcd7945e9) by [@shergin](https://github.com/shergin))
- Avoid using `-[UITextView setAttributedString:]` while user is typing (#19809) ([f77aa4eb45](https://github.com/facebook/react-native/commit/f77aa4eb459b9dcb7f0b558ad3f04e0c507955e9))

### Security

- Bump ws package to 1.1.5 due to vulnerability issues (#21769) ([96ce6f9538](https://github.com/facebook/react-native/commit/96ce6f9538ed3559ffea6040a47b1d6a30546ab9) by [@prog1dev](https://github.com/prog1dev))

## v0.57.7

**NOTE WELL**: when you upgrade to this version you **NEED** to upgrade `react` and `react-test-renderer` to version `"16.6.1"`.

This patch release fixes version 0.57.6 about losing focus in `TextInput` because of [ada7089066](https://github.com/facebook/react-native/commit/ada70890663503b65b42bb5f6f98d3df412ecdc4).

Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/64) for cherry-picking commits.

## v0.57.6

**INFO NOTE**: It's highly recommended that you skip this version and upgrade to 0.57.7.

**NOTE WELL**: when you upgrade to this version you **NEED** to upgrade `react` and `react-test-renderer` to version `"16.6.1"`.
This patch release fixes a number of crashes, resolves build issues (both for iOS and Android). Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/64) for cherry-picking commits.

### Added

#### iOS specific

- Add iOS 12 textContentType options (#21079) ([644fc57fad](https://github.com/facebook/react-native/commit/644fc57fad4b163e96c3b3d6ec441c7b566d2d43) by [@ultramiraculous](https://github.com/ultramiraculous))

### Removed

- Remove useless additional blur call (#22156) ([ada7089066](https://github.com/facebook/react-native/commit/ada70890663503b65b42bb5f6f98d3df412ecdc4))

### Fixed

- Improving Modal `visible` prop check to handle undefined and null (#22072) ([cc13a7367b](https://github.com/facebook/react-native/commit/cc13a7367b08bd766749ddbfaacc25ade1f33a8f) by [@MateusAndrade](https://github.com/MateusAndrade))
- Fix crash in nativeInjectHMRUpdate (#22412) ([0b4fd621e3](https://github.com/facebook/react-native/commit/0b4fd621e3ab511510d6852af67183a3581d1aad) by [@vovkasm](https://github.com/vovkasm))
- Fix IllegalArgumentException when dismissing ReactModalHostView ([e57ad4ee37](https://github.com/facebook/react-native/commit/e57ad4ee37b02cd4c9e10a97d7a1d2b799204d7d) by [@mdvacca](https://github.com/mdvacca))
- Fix regression in StyleSheet.setStyleAttributePreprocessor (#22262) ([04085337bc](https://github.com/facebook/react-native/commit/04085337bc47392922c7911b95b8fdaea98800e8) by [@brentvatne](https://github.com/brentvatne))
- Fix React Native AsyncMode and DevTools ([f41383fb6d](https://github.com/facebook/react-native/commit/f41383fb6d6d0858e1b09dda79a74632d7932d07) by [@bvaughn](https://github.com/bvaughn))
- CxxReact: Silence 'unused lambda capture' warnings in open-source (#22240) ([0c0540965a](https://github.com/facebook/react-native/commit/0c0540965ad9e3cdd9af16f606e141eca8ab2193) by [@empyrical](https://github.com/empyrical))

#### Android specific

- Fixed HTTP connection timeout on Android (#22164) ([a508134724](https://github.com/facebook/react-native/commit/a50813472450f51d2ef24b40be99a22beefec33c))
- resizeMode applies to Image.defaultSource (#22216) ([673ef39561](https://github.com/facebook/react-native/commit/673ef39561ce6640e447fa40299c263961e4f178) by [@dulmandakh](https://github.com/dulmandakh))
- Android: Close websocket properly when remote server initiates close (#22248) ([2e465bca15](https://github.com/facebook/react-native/commit/2e465bca158ae9cfa89448e2a3bb8cc009397ac8) by [@syaau](https://github.com/syaau))
- Workaround a wrong fling direction for inverted ScrollViews on Android P (#21117) ([b971c5beb8](https://github.com/facebook/react-native/commit/b971c5beb8c7f90543ea037194790142f4f57c80) by [@mandrigin](https://github.com/mandrigin))
- Fix crash when releasing RN views ([83405ff316](https://github.com/facebook/react-native/commit/83405ff3167eaba6fa59ca52c54943221a05ee09) by [@ayc1](https://github.com/ayc1))

#### iOS specific

- iOS: Support inline view truncation (#21456) ([70826dbafc](https://github.com/facebook/react-native/commit/70826dbafcb00c08e0038c5066e33848141be77b) by [@rigdern](https://github.com/rigdern))
- NetInfo: try to solve crash with releasing \_firstTimeReachability ([eebc8e230a](https://github.com/facebook/react-native/commit/eebc8e230a9f72c3dde34a5cfd59bbffba55e53d) by [@mmmulani](https://github.com/mmmulani))
- Generate ip.txt before SKIP_BUNDLING check (#20554) ([9c1ea45d38](https://github.com/facebook/react-native/commit/9c1ea45d38a6ec731894443debe8879fa3876ab7) by [@keatongreve](https://github.com/keatongreve))
- Revert [Performance improvement for loading cached images on iOS ] ([7eeb305933](https://github.com/facebook/react-native/commit/7eeb305933fca695c5a15d675bb10569c3385109) by [@kelset](https://github.com/kelset))
- Fix inability to remove 'Disabled' state from AccessibilityStates ([5eaa2d29c0](https://github.com/facebook/react-native/commit/5eaa2d29c0c4c633a40f7241408737c754edea84))

## v0.57.5

**NOTE WELL**: when you upgrade to this version you **NEED** to upgrade `react` and `react-test-renderer` to version `"16.6.1"`.

This patch release fixes a number of crashes, resolves build issues (both for iOS and Android), and brings React to v16.6.1. Thanks everyone who contributed code or participated in the [discussion](https://github.com/react-native-community/react-native-releases/issues/54) for cherry-picking commits.

### Changed

- React is now at v16.6.1 ([8325e09e5c](https://github.com/facebook/react-native/commit/8325e09e5cd8538fded1b5a1b4fff1854e17eb22) and [76c99f20e3](https://github.com/facebook/react-native/commit/76c99f20e39ef1b5fa93487bc8c82e7c6aede5dd) by [@yungsters](https://github.com/yungsters))

#### iOS specific

- Performance improvement for loading cached images ([54f7eb3424](https://github.com/facebook/react-native/commit/54f7eb34243715a1d4bc821ccbadeec12486d22c) and [3a98318c91](https://github.com/facebook/react-native/commit/3a98318c91283a1bba35c0bca93b975d4a550330) by [@esamelson](https://github.com/esamelson) and others)

### Fixed

- Fix crash in **VirtualizedList** during pagination ([5803772017](https://github.com/facebook/react-native/commit/580377201793314ca643250c1bd7cf1c47d49920))
- Fix polyfilling of **regeneratorRuntime** to avoid setting it to undefined in some situations ([2a7e02edf6](https://github.com/facebook/react-native/commit/2a7e02edf64c20410b2f95f35e313279545b40db) by [@rafeca](https://github.com/rafeca))
- Fix **View**, **Text**, and **ActivityIndicator**'s `displayName` ([7a914fcef4](https://github.com/facebook/react-native/commit/7a914fcef4ae035221e1f984c104ba20430d6fad) and [53da585832](https://github.com/facebook/react-native/commit/53da5858326bbddd2df112f86b2c1e935adc3882) by [@rajivshah3](https://github.com/rajivshah3) and others)
- Fix crash that happens when a component throws an exception that contains a null message ([6debfdf6d6](https://github.com/facebook/react-native/commit/6debfdf6d6172cec2d87fd1e780c3b347d41dc1d) by [@mdvacca](https://github.com/mdvacca))

#### Android specific

- Fix incorrect merged asset path with flavor for Android Gradle Plugin 3.2 ([e90319e9fa](https://github.com/facebook/react-native/commit/e90319e9fa18661144ad29faf36efba3750edb32) by [@yatatsu](https://github.com/yatatsu))
- Fix crash in **ReadableNativeArray.getType** when size of ReadableNativeArray's length > 512 ([09c78fe968](https://github.com/facebook/react-native/commit/09c78fe968e1bb71108c4058e76ebf70178e5a8b) by [@dryganets](https://github.com/dryganets))

#### iOS specific

- Fix crash in rapid use of **NetInfo.getCurrentConnectivity** ([67afaefa78](https://github.com/facebook/react-native/commit/67afaefa78c314b38249a7e2758e0af38c18f34a) by [@mmmulani](https://github.com/mmmulani))
- Fix Xcode 10 errors relating to third-party ([277c19c93e](https://github.com/facebook/react-native/commit/277c19c93eacf3e3ce63f71236fd399214d6e6d0) by [@mmccartney](https://github.com/mmccartney))
- Fix build errors when path to `$NODE_BINARY` contains spaces ([7d4e94edcc](https://github.com/facebook/react-native/commit/7d4e94edccfc2f642fcbd1d6aa00756f02e3a525) by [@sundbry](https://github.com/sundbry))
- Fix case where content of inline views didn't get relaid out ([798517a267](https://github.com/facebook/react-native/commit/798517a267841675956cb52a1c0ae493a913962a) by [@rigdern](https://github.com/rigdern))
- Fix **InputAccessoryView**'s safe area when not attached to a **TextInput** ([2191eecf54](https://github.com/facebook/react-native/commit/2191eecf54b5c4bf278dfaf23fec46d44ac9a1f0) by [@janicduplessis](https://github.com/janicduplessis))

## v0.57.4

**NOTE WELL**: when you upgrade to this version you **NEED** to upgrade `react` and `react-test-renderer` to version `"16.6.0-alpha.8af6728"` (next version, 0.57.5, will update to `16.6.0`, and it will come soon). Also, please check the _Known issues_ section below, especially if you are using Xcode 10.

Thanks to everyone that contributed to the [discussion](https://github.com/react-native-community/react-native-releases/issues/48) for cherry-picking the commits that landed in this release, and the developers who submitted those commits!

### Added: new features

#### Android specific additions

- Android textTransform style support ([22cf5dc566](https://github.com/facebook/react-native/commit/22cf5dc5660f19b16de3592ccae4c42cc16ace69) by Stephen Cook)

### Changes: existing functionality that is now different

- Add deprecation notice to SwipeableListView ([99471f87b9](https://github.com/facebook/react-native/commit/99471f87b944b26bbdaa0fb0881db91c1118b741) by [@TheSavior](https://github.com/TheSavior))

#### Android specific changes

- Consolidate native dependencies versions ([ba608a2db7](https://github.com/facebook/react-native/commit/ba608a2db786a8e983a6e30b31662fac254286c0) by [@dulmandakh](https://github.com/dulmandakh))
- bump okhttp3 to 3.11 ([10fc548809](https://github.com/facebook/react-native/commit/10fc548809cc08db209ae6696b723341925137d1) by [@dulmandakh](https://github.com/dulmandakh))
- Android: Send `<Text>` metrics in onTextLayout events ([737f93705c](https://github.com/facebook/react-native/commit/737f93705ca8b5d3fdd207f870cf27adcf1e885b) by [@mmmulani](https://github.com/mmmulani))
- Use TextLegend example in Android as well ([335927db44](https://github.com/facebook/react-native/commit/335927db44fe47e20db4503a1ab5fcf8d62144a8) by [@mmmulani](https://github.com/mmmulani))

#### iOS specific changes

- Bump xcode@1.0.0 ([b9514995a2](https://github.com/facebook/react-native/commit/b9514995a26b4c3f6d555257740457dd4d6cfeae) by [@peat-psuwit](https://github.com/peat-psuwit))
- Text: send metrics after rendering (iOS) ([737f93705c](https://github.com/facebook/react-native/commit/737f93705ca8b5d3fdd207f870cf27adcf1e885b) by [@mmmulani](https://github.com/mmmulani))
- Allow specifying iOS version for run-ios with simulator option ([0fab27cbac](https://github.com/facebook/react-native/commit/0fab27cbaca57b90119ab36104af4d0b3052ae30) by [@elyalvarado](https://github.com/elyalvarado))
- Relax the requirement that lazy module cannot be initialized on the main thread ([dbc864c9cd](https://github.com/facebook/react-native/commit/dbc864c9cd95f9df268d85a642742e84e2360db4) by [@spredolac](https://github.com/spredolac))

### Fixed: bugs that have been resolved

- Fix crashes on invalid regex ([298f14da12](https://github.com/facebook/react-native/commit/298f14da1210460b3e25c6002e8d1aa5f7b4e0ef) by [@RSNara](https://github.com/RSNara))
- Fix pull to refresh refresh component clipping on Android ([8a3a0ad2d0](https://github.com/facebook/react-native/commit/8a3a0ad2d0f894a3d8c1e403a9336dab17c2dde8) by Andy Huang)
- ListView requestAnimationFrame leak ([70b5eb3aa2](https://github.com/facebook/react-native/commit/70b5eb3aa27822fa11571c3d8d3628ecf03268ab) by [@exced](https://github.com/exced))

#### Android specific fixes

- reverted [Update bad method](https://github.com/facebook/react-native/commit/1592a8d42411d1f91c8ceb738c0533c1cee73f71)
- Fix accessibility role crash ([1f96ff62cf](https://github.com/facebook/react-native/commit/1f96ff62cf786f93c91e6625bf2b819077902251) by Haseeb Saeed)
- Fix accessibilityRole value lookup ([1f96ff62cf](https://github.com/facebook/react-native/commit/1f96ff62cf786f93c91e6625bf2b819077902251) by [@ayc1](https://github.com/ayc1))
- Fix DynamicFromMap object pool synchronization ([b0d68c0bb9](https://github.com/facebook/react-native/commit/b0d68c0bb971a44dfdf7722682933f1e96e1cd45) by [@haitaoli](https://github.com/haitaoli))
- Back out "[react-native][pr] Rounded corner rendering fixed on Android N." ([bb407fa1ec](https://github.com/facebook/react-native/commit/bb407fa1ec0bd0367373961fdc0e840150840068) by Jonathan Lee)
- Fix onTextLayout metrics on Android when using alignText ([1c240ae898](https://github.com/facebook/react-native/commit/1c240ae898e26534b8d9a09a334dec02e96faa05) by [@mmmulani](https://github.com/mmmulani))
- Cleaning up imports in ViewGroupManager ([082a869dae](https://github.com/facebook/react-native/commit/082a869daef3cf602a088d0418c185279052b8c3) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific fixes

- Fix issue when inserting text at 0 when maxLength is set ([17415938c7](https://github.com/facebook/react-native/commit/17415938c7180a95811db949122b8ad24a442866) by [@ejanzer](https://github.com/ejanzer))

### Known issues

There are a few issues that don't have a finalized solution (as it happens for 0.x projects). In particular:

- when using Xcode 10 and `react-native init`, your build may fail due to third-party build steps ([#20774](https://github.com/facebook/react-native/issues/20774)). There is a [commit](https://github.com/facebook/react-native/commit/b44c5ae92eb08125d466cf151cb804dabfbbc690) we are planning to cherry pick in a future release that should help - in the meantime, you should be able to run these commands from the project folder to fix the issue (you should need to do it only once per project):

  ```bash
  cd node_modules/react-native
  scripts/ios-install-third-party.sh
  cd third-party/glog-0.3.5/
  ../../scripts/ios-configure-glog.sh
  ```

- React `16.6.0` works for the most part, aside from the Context API (check [this issue](https://github.com/facebook/react-native/issues/21975)) - and if you are eager to test the new React Hooks you will have to be patient, as they are not production ready and `16.7.alpha` is **not** yet [supported](https://github.com/facebook/react-native/issues/21967) by React Native.

## v0.57.3

**NOTE WELL**: when you upgrade to this version you **NEED** to upgrade `react` and `react-test-renderer` to version `"16.6.0-alpha.8af6728"`. Also, please check the _Known issues_ section below, especially if you are using Xcode 10.

Thanks to everyone that contributed to the [discussion](https://github.com/react-native-community/react-native-releases/issues/46) for cherry-picking the commits that landed in this release, and the developers who submitted those commits!

### Added: new features

- Expose enableBabelRuntime config param externally ([89a358f347](https://github.com/facebook/react-native/commit/89a358f34786198c8a9a2d379588efd57b6a0eec) by [@rafeca](https://github.com/rafeca))

#### Android specific additions

- Add test for InterpolatorType ([b7526b2095](https://github.com/facebook/react-native/commit/b7526b2095e4a5c8641e8264786d1622d6390029) by [@ejanzer](https://github.com/ejanzer))

### Changes: existing functionality that is now different

- React sync for revisions ade5e69...d836010 ([fa6035bda6](https://github.com/facebook/react-native/commit/7142e9b1c5f95e82ceb04798b166318385004147) by [@yungsters](https://github.com/yungsters))
- React: Bump Canary Version ([8258b6a280](https://github.com/facebook/react-native/commit/8258b6a2801121bebb25272bfcc5d3da1fb5ae39) by [@yungsters](https://github.com/yungsters))
- FBJS: Upgrade to ^1.0.0 ([ee034596fe](https://github.com/facebook/react-native/commit/ee034596fecfb47ff9e6e1fc30cefb0e970e7d80) by [@yungsters](https://github.com/yungsters))
- Bump metro@0.48.1 ([bf47589b8b](https://github.com/facebook/react-native/commit/bf47589b8be145750e954d09684370463a616779) by [@rafeca](https://github.com/rafeca))
- Update to Detox 9 ([15c05988e9](https://github.com/facebook/react-native/commit/15c05988e980118151bdf41ed82ebb8c8e30a0f3) by [@kelset](https://github.com/kelset))
- Add Deprecation Warning to ListView ([e90f5fa263](https://github.com/facebook/react-native/commit/e90f5fa2630f8a89e15fa57c70ada83e75a20642) by [@TheSavior](https://github.com/TheSavior))
- Deprecate legacyImplementation of FlatList ([3aa8f09b44](https://github.com/facebook/react-native/commit/3aa8f09b4437eab8b91429b7325f8a6173ffa49a) by [@TheSavior](https://github.com/TheSavior))

#### Android specific changes

- bump Android NDK to r17c ([436cf154bb](https://github.com/facebook/react-native/commit/436cf154bb9cf4fc0bcafd7115d33544ce36b759) by [@dulmandakh](https://github.com/dulmandakh))
- Resolve protocol http, https when not in lowercase ([d00bdb9bb8](https://github.com/facebook/react-native/commit/d00bdb9bb8b9b11bce900689c7e28cebd2eb0807) by [@hyunjongL](https://github.com/hyunjongL))
- Normalize scheme for URL on Android ([4b6f02ea75](https://github.com/facebook/react-native/commit/4b6f02ea758a9ab5853a29ebfc054eaa98e6dc53) by [@radeno](https://github.com/radeno))

#### iOS specific changes

- Bump up the buffer size and show a warning if the trace might be truncated ([1fc8a46570](https://github.com/facebook/react-native/commit/1fc8a46570561a32657ffccb0f5a12c6f4d6a3dd) by [@alexeylang](https://github.com/alexeylang))

### Fixed: bugs that have been resolved

- Fix deprecation warning message in Switch ([997f382adc](https://github.com/facebook/react-native/commit/997f382adcc7f82fccd97ac671d13e86aef7171e) by [@radko93](https://github.com/radko93))

#### Android specific fixes

- Fix default accessibility delegate ([fa6035bda6](https://github.com/facebook/react-native/commit/fa6035bda6c606868977179534cb941f26fbdb92) by [@ayc1](https://github.com/ayc1))
- Fix accessibility role/label ([fa6035bda6](https://github.com/facebook/react-native/commit/fa6035bda6c606868977179534cb941f26fbdb92) by [@ayc1](https://github.com/ayc1))
- When converting arguments JS->Java, handle integers correctly ([bb9b9a8b9d](https://github.com/facebook/react-native/commit/bb9b9a8b9d5868c7ab5034117b785943496f6405) by [@mhorowitz](https://github.com/mhorowitz))
- Fix CameraRoll.getPhotos() crash on Android if device has a problematic video asset ([4768bea0cf](https://github.com/facebook/react-native/commit/4768bea0cf288cf9c8097fc498b896610728c645) by [@naxel](https://github.com/naxel))
- Android ScrollView fix for snapToInterval not snapping to end ([6eeff75849](https://github.com/facebook/react-native/commit/6eeff75849c9b8bf91592c1b7906b4dab8fba518) by [@olegbl](https://github.com/olegbl))
- Fix for InterpolatorType crash ([01a1004808](https://github.com/facebook/react-native/commit/01a1004808928e29a6d6c698b3b18312fed17a02) by [@ejanzer](https://github.com/ejanzer))
- Update bad method ([1592a8d424](https://github.com/facebook/react-native/commit/1592a8d42411d1f91c8ceb738c0533c1cee73f71) by [@grabbou](https://github.com/grabbou))

#### iOS specific fixes

- Dealloc first time RCTNetInfo reachability callback ([e7e63fd409](https://github.com/facebook/react-native/commit/e7e63fd4092a81beec482fc48d05f1a048801037) by [@mmmulani](https://github.com/mmmulani))
- iOS: fix the baseline issue when displaying a mixture of different-language characters ([c1561ab441](https://github.com/facebook/react-native/commit/c1561ab4411854bef96b5d268d38002a013d6d3e) by [@BingBingL](https://github.com/BingBingL))
- Fix artifacting on RN-drawn borders with asymmetric radii ([9e6522374b](https://github.com/facebook/react-native/commit/9e6522374bc605bb1a92ff02842878ace35e9f3d) by [@jamesreggio](https://github.com/jamesreggio))
- check isAvailable key on simulator object ([1031872784](https://github.com/facebook/react-native/commit/1031872784e9373082797e5bf5c815816af2105b) by [@antonychan](https://github.com/antonychan))
- ios-simulator: change default iphone version ([6d09df5b72](https://github.com/facebook/react-native/commit/6d09df5b726ac951417b87a49bc345ebc9142951) by Vitor Capretz)

### Known issues

There are a few issues that don't have a finalized solution. In particular, when using Xcode 10 and `react-native init`, your build may fail due to third-party build steps ([#20774](https://github.com/facebook/react-native/issues/20774)). There is an open pull request which we are testing and hope to land soon ([#21458](https://github.com/facebook/react-native/pull/21458)). In the meantime, you can find a workaround here: [https://github.com/facebook/react-native/issues/20774](https://github.com/facebook/react-native/issues/20774).

## v0.57.2

Thanks to everyone that contributed to the [discussion](https://github.com/react-native-community/react-native-releases/issues/45) for cherry-picking the commits that landed in this release, and the developers who submitted those commits!

### Added: new features

#### Android specific additions

- Android subpixel text ([65e4e674fc](https://github.com/facebook/react-native/commit/65e4e674fca7127fd7800ae011cab449561f475b) by [@kevinresol](https://github.com/kevinresol))

### Changes: existing functionality that is now different

- ReactScrollView should account for `overflow: scroll` ([201f2f189f](https://github.com/facebook/react-native/commit/201f2f189f2c41092397e5457eda83b0764ee4cd) by [@mcolotto](https://github.com/mcolotto))
- bump metro 0.47.0 ([4750f52b34](https://github.com/facebook/react-native/commit/4750f52b34f524cae8ca08fcacec063c0725e4de) by [@rafeca](https://github.com/rafeca))
- Use babel runtime instead of relying on global babelHelpers and regenerator ([36033bd0ed](https://github.com/facebook/react-native/commit/36033bd0edecd20fe2ae5edd56408bcc134378e7) by [@janicduplessis](https://github.com/janicduplessis))
- React: Upgrade to react-devtools@^3.4.0 ([25119f95c8](https://github.com/facebook/react-native/commit/25119f95c81039761dd505c216c1e499003c6294) by [@yungsters](https://github.com/yungsters))
- Change new Date() to Date.now() to save on date allocations ([bbb2d9a5b3](https://github.com/facebook/react-native/commit/bbb2d9a5b358bc0c150fe6ff74c45594c987e949) by [@dulinriley](https://github.com/dulinriley))
- Make config object read-only ([2c1057062e](https://github.com/facebook/react-native/commit/2c1057062e81f8b43d3f942a35371fb3db841bed) by [@rafeca](https://github.com/rafeca))
- Cleanup the transformer flow types ([28dedfb6d6](https://github.com/facebook/react-native/commit/28dedfb6d61e64a50d78aa06ee4f744665a54c2a) by [@rafeca](https://github.com/rafeca))
- bump metro 0.47.1 ([12ab08a5aa](https://github.com/facebook/react-native/commit/12ab08a5aab3e14c9b2fb35454b16708b8ce093d) by [@rafeca](https://github.com/rafeca))

#### Android specific changes

- Android ScrollView support for `overflow: visible` ([4af4da9089](https://github.com/facebook/react-native/commit/4af4da9089e20aa84bc5660bfb37763556442a4e) by [@olegbl](https://github.com/olegbl))
- Expose a getter for overflow setting in ReactViewGroup ([02ad56f541](https://github.com/facebook/react-native/commit/02ad56f5419675572d684c3cc8a28644f29afffa) by [@kmagiera](https://github.com/kmagiera))
- Add workaround for Android Gradle Plugin 3.2 change to asset dir ([ff084a4e80](https://github.com/facebook/react-native/commit/ff084a4e8071adb4ff6198b32aa8a7e8e29cca1c) by [@edilaic](https://github.com/edilaic))

### Fixed: bugs that have been resolved

- Fix HEAD request failing with `Invalid response for blob` ([7e9c3f77cc](https://github.com/facebook/react-native/commit/7e9c3f77cce881dbb47af266993da5a2b6e98b5b) by [@anthonyhumphreys](https://github.com/anthonyhumphreys))
- Check if child view != null before dropping ([af181fb192](https://github.com/facebook/react-native/commit/af181fb192c83e1dd0575c24e38d8814bbf187d6) by [@chrusart](https://github.com/chrusart))

#### Android specific fixes

- Fix event handlers for DPad arrows on Android TV ([4d71b1525d](https://github.com/facebook/react-native/commit/4d71b1525d357a61a1740d6de5c1b97b6527f986) by [@krzysztofciombor](https://github.com/krzysztofciombor))
- Rounded corner rendering fixed on Android N ([748cf82c97](https://github.com/facebook/react-native/commit/748cf82c974d6cf5d5df64b6e6013211c870530c) by [@dryganets](https://github.com/dryganets))
- Android: fix cookies lost on Android 5.0 and above ([ea53727e16](https://github.com/facebook/react-native/commit/ea53727e16223d412fcbba49df79cc68b39f5d93) by chenwenyu)
- allow zero offset when shadow radius is nonzero ([97f0e43710](https://github.com/facebook/react-native/commit/97f0e43710a990c30e14d66bf67c7d612377d3f2) by Timothy Kukulski)
- Android ScrollView fix for pagingEnabled ([e0170a9445](https://github.com/facebook/react-native/commit/e0170a944501bb487e899b92363bf5aa64b29299) by [@olegbl](https://github.com/olegbl))

### Removed: features that have been removed; these are breaking

- Remove global babelHelpers and regenerator ([458d56c0a1](https://github.com/facebook/react-native/commit/458d56c0a1ac73c088660830a8bf2db65de7d9a2) by [@janicduplessis](https://github.com/janicduplessis))
- Remove overflow hidden killswitch ([59aada873e](https://github.com/facebook/react-native/commit/59aada873e13bf0b1f5e3a10cfe9a5a45c28f9fb) by [@ayc1](https://github.com/ayc1))
- Remove absolute path parameter from transformers ([2e0d5c87e9](https://github.com/facebook/react-native/commit/2e0d5c87e93bb970ef1c8864ca44b47b36d6ae2e) by [@rafeca](https://github.com/rafeca))

## v0.57.1

We are trying, for 0.57, to approach it as a version with a longer "support", while waiting for some features to land that will allow for [0.58 to be cut](https://github.com/react-native-community/react-native-releases/issues/41).

Thanks to everyone that contributed to the [discussion](https://github.com/react-native-community/react-native-releases/issues/34) for cherry-picking the commits that landed in this release, and the developers who submitted those commits!

### Added: new features

- Expose AllowFileAccess property in WebView ([0c576ef84a](https://github.com/facebook/react-native/commit/0c576ef84a1c7f79b228f205cc687ab1b945bda1) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific additions

- Expose scrollEnabled as iOS prop for TextInput ([b9c28c236b](https://github.com/facebook/react-native/commit/b9c28c236bc971a5fbc51a3bda09c3980d547b96) by Chun Chen)

### Changes: existing functionality that is now different

- Give RNPM the ability to look for plugins in `@Scoped` modules ([4b106be477](https://github.com/facebook/react-native/commit/4b106be47765dd391f7a4cc6cf0e705ae977b90a) by [empyrical](https://github.com/empyrical))
- Upgrade babel-eslint to 9.0.0 ([44dc283bcd](https://github.com/facebook/react-native/commit/44dc283bcd0a75826d9be86cdc727e32d5697ef2) by [@rafeca](https://github.com/rafeca))
- bump metro 0.45.6 ([7bac0565e8](https://github.com/facebook/react-native/commit/7bac0565e82981d4a6e2b500d376ba9fa8aba721) by [@rafeca](https://github.com/rafeca))

#### iOS specific changes

- Making RCTIsIPhoneX() return true for the R and Max models ([5e7c3ca005](https://github.com/facebook/react-native/commit/5e7c3ca0057f6084d692e30ae4db863fb20968ff) by [@shergin](https://github.com/shergin))
- Way to register RCT_MODULE in Plugin2.0 instead of +load ([5c160e5ded](https://github.com/facebook/react-native/commit/5c160e5dedae713c686d88d4b9d4308b596e68a7) by Jeff Thomas)
- Update RCTLinkingManager.h to explicitly state the 'nullability' of parameters ([2271d1f912](https://github.com/facebook/react-native/commit/2271d1f912435eba7da2414ea4665ba8e56c7ad7) by Warren Knox)

### Fixed: bugs that have been resolved

- Pass the maxWorkers config param correctly to Metro ([7a69f1aa27](https://github.com/facebook/react-native/commit/7a69f1aa272a9b71755033a80f6f4aa5e9dcbaf6) by [@rafeca](https://github.com/rafeca))
- Fix ignored --projectRoot/watchFolders arguments (([9fca769e76](https://github.com/facebook/react-native/commit/9fca769e7666df696299b422c140d6509e726ec6) by [@oblador](https://github.com/oblador))
- Debug only code were leaking into release builds on iOS. (([d1ff0b0cc5](https://github.com/facebook/react-native/commit/d1ff0b0cc51c31cae89689b2ad2f4b35f29531d8) by [@dryganets](https://github.com/dryganets))

#### iOS specific fixes

- Fix RCTNetInfo first time connection status ([e7e63fd409](https://github.com/facebook/react-native/commit/e7e63fd4092a81beec482fc48d05f1a048801037) by [@karanjthakkar](https://github.com/karanjthakkar))

### Removed: features that have been removed; these are breaking

#### iOS specific removals

- Removing development team from Xcode project ([8103c431c8](https://github.com/facebook/react-native/commit/8103c431c897c02d47cfad1e71bb2e6ddaabbdc0) by [@hramos](https://github.com/hramos))

## v0.57.0

Welcome to the 0.57 release of React Native! This release addresses a number of issues and has some exciting improvements. We again skipped a monthly release, focused on quality by extending the release candidate phase, and let some upstream packages reach stable for inclusion.

This release includes [599 commits by 73 different contributors](https://github.com/facebook/react-native/compare/0.56-stable...0.57-stable)! In response to feedback, we've prepared a changelog that contains only user-impacting changes. Please share your input and let us know how we can make this even more useful, and as always [let us know](https://github.com/react-native-community/react-native-releases/issues/34) if you have any feedback on this process.

### Highlights

#### New features

- Accessibility APIs now support accessibility hints, inverted colors, and easier usage of defining the element's role and states; read more at [@ziqichen6's excellent blog post](https://reactnative.dev/blog/2018/08/13/react-native-accessibility-updates)
- On iOS, `WKWebView` can now be used within the `WebView` component; read more at [@rsnara's awesome blog post](https://reactnative.dev/blog/2018/08/27/wkwebview)
- Better support for out-of-tree platforms. For details, please refer to [the discussion](https://github.com/react-native-community/discussions-and-proposals/issues/21) that the community used to get this up and running (there will be a new page in the docs dedicated to it too) - huge props to @empyrical for working on this!

#### Tooling updates

- Android tooling has been updated to match newer configuration requirements (SDK 27, gradle 4.4, and support library 27); building with Android plugin 3.2 doesn't work due to the gradle scripts, so **please** stay on Android Studio 3.1 for now
- Support Babel 7 stable landed! Be sure to read [here](https://blogs.msdn.microsoft.com/typescript/2018/08/27/typescript-and-babel-7/) about using TypeScript and check out the [Babel 7 migration guide](https://babeljs.io/docs/en/next/v7-migration) for help migrating.
- Metro has been upgraded (with Babel 7 and better transformer support), and in the next major release we plan on having two new features (ram bundles and inline requires) optional for you all to use - you can read how it will happen [here](https://github.com/react-native-community/discussions-and-proposals/blob/master/core-meetings/2018-09-metro-meeting.md); moreover, if you have a custom packager config, we recommend you read also the "updating to this version" section.
- Flow, React, and related packages have also been updated; this includes [working support](https://github.com/facebook/react-native/commit/5491c3f942430982ce9cb6140ed1733879ed3d1d) for the [React Profiler](https://react.dev/blog/2018/09/10/introducing-the-react-profiler.html).

#### The Slimmening is happening

As mentioned a few times in the past, the core team is reviewing the repository to trim it to the base React Native features in order to make the whole ecosystem more maintainable (by using a _divide-et-impera_ approach, the community will move faster and enable pull requests to be reviewed and merged quicker). This change requires extracting some components into their own separate repos and removing old, unused code ([details here](https://github.com/react-native-community/discussions-and-proposals/issues/6)).

0.57 is **not** directly affected by any changes, but we want you to know that:

- `WebView` will be moved to its own repo at [react-native-community/react-native-webview](https://github.com/react-native-community/react-native-webview). There is already a base implementation there. Help us out by giving that a try, and expect that `WebView` will be deprecated soon
- `NavigatorIOS` will be **fully** removed from the main codebase starting 0.58.0 (via [this commit](https://github.com/facebook/react-native/commit/0df92afc1caf96100013935d50bdde359b688658)); it is now deprecated

### Updating to this version

1. Upgrade the version of React Native in the `package.json` from `0.56.0` to `0.57.0`, and the React version to `16.5`
2. Change the babel-preset dependency from `"babel-preset-react-native": "^5",` to `"metro-react-native-babel-preset": "^0.45.0",`, then change the `.babelrc` configuration to:

   ```JSON
     {
       "presets": ["module:metro-react-native-babel-preset"]
     }
   ```

3. Ensure that you have all the babel dependencies to version `^7.0.0` (you may also need to add `"babel-core": "7.0.0-bridge.0"` as a yarn resolution to ensure retro-compatibility). The Babel team has released a tool, [babel-upgrade](https://github.com/babel/babel-upgrade), that should help you in this migration.
4. Upgrading android gradle version to 4.4
   1. In your project's `android/gradle/wrapper/gradle-wrapper.properties` file, change the `distributionUrl` to `https\://services.gradle.org/distributions/gradle-4.4-all.zip`
   2. In `android/build.gradle` file add `google()` right above `jcenter()` in both `buildscript` and `allprojects` repositories. Then change Android build tools to version 3.1.4 `classpath 'com.android.tools.build:gradle:3.1.4'`
   3. In `android/app/build.gradle` file update all your `compile` statements to be `implementation`, e.g. `implementation 'com.facebook.fresco:animated-gif:1.10.0'`
   4. Do note that when running your app from within Android Studio, you may encounter `Missing Byte Code` errors. This is due to [a known issue](https://issuetracker.google.com/issues/72811718) with version 3.1.x of the android tools plugin. You'll need to disable Instant Run to get past this error.
5. If you have a custom packager configuration via `rn-cli.config.js`, you probably need to update it to work with the updated Metro configuration structure (for full detail refer to Metro's [documentation](https://facebook.github.io/metro/docs/en/configuration)); here are some commonly encountered changes to `rn-cli.config.js`:

   ```diff
   -const blacklist = require('metro/src/blacklist')
   +const blacklist = require('metro-config/src/defaults/blacklist')

   // ...

   module.exports = {
   +  watchFolders: alternateRoots,
   +  resolver: {
   +    blacklistRE: blacklist
   +  },
   +  transformer: {
   +    babelTransformerPath: require.resolve('./scripts/transformer.js'),
   +  },
   -  getProjectRoots() {
   -    return [
   -      path.resolve(__dirname),
   -    ].concat(alternateRoots)
   -  },
   -  getBlacklistRE() {
   -    return blacklist;
   -  },
   -  transformModulePath: require.resolve('./scripts/transformer.js'),
   }
   ```

6. Run `yarn` to ensure that all the new dependencies have been installed

### Added: new features

- Add .nvmrc and ensure node version required is compatible with ESLint 5 ([30b9d81087](https://github.com/facebook/react-native/commit/30b9d81087cb86f5fb272d00bfee63a0632009f5) by [@slorber](https://github.com/slorber))
- Major improvements to accessibility features ([48b3d1322b](https://github.com/facebook/react-native/commit/48b3d1322b884f62eb5aeb36136bcd76c502e42d), [b5b704dc19](https://github.com/facebook/react-native/commit/b5b704dc19b80a1909d66adcd617220a98c7aace), [c36e8b3307](https://github.com/facebook/react-native/commit/c36e8b3307295690cddf74e3a41ca0ac11ac4c6b), [40f6998b67](https://github.com/facebook/react-native/commit/40f6998b6766e8aa3c038a1416e5c62cbafca109), [c1d0ccde0f](https://github.com/facebook/react-native/commit/c1d0ccde0f6f8615fce077ef7ee0867a14ca0fb7), [5eaa2d29c0](https://github.com/facebook/react-native/commit/5eaa2d29c0c4c633a40f7241408737c754edea84), [10b603fdd3](https://github.com/facebook/react-native/commit/10b603fdd34919f72304720c25d1420668a6213a), [d9eeae91a0](https://github.com/facebook/react-native/commit/d9eeae91a08123c3a458704869acd6f637fc4c53), [3cfa7ae698](https://github.com/facebook/react-native/commit/3cfa7ae69847cc3b687930346016b248f2427864), [5acb7211bb](https://github.com/facebook/react-native/commit/5acb7211bb211e0ef48334630ddccbb3f0ffa2da), [5741f77156](https://github.com/facebook/react-native/commit/5741f771562962110e105114a2c65def4baa805b), [d0b86ecb4f](https://github.com/facebook/react-native/commit/d0b86ecb4f33d6b10a99062f050a4d659db4ddfc), [e739143809](https://github.com/facebook/react-native/commit/e7391438093cd5dd5033204cdce62e66509e66e1), [c27b495a89](https://github.com/facebook/react-native/commit/c27b495a89e71ff13959eb4c34605a527514fa1e), [5aa040dfb7](https://github.com/facebook/react-native/commit/5aa040dfb780c09a6efa5d3072232dea775d432f), [03036f79f7](https://github.com/facebook/react-native/commit/03036f79f7b062ae11015b33cca3dd7e4e67dda6), [3bedc78a35](https://github.com/facebook/react-native/commit/3bedc78a35b9efc259299744f4134ac0e880d1ea), [ca01290d8e](https://github.com/facebook/react-native/commit/ca01290d8e8fe73494f317ed9f81d339e65fdea0), [121e2e5ca6](https://github.com/facebook/react-native/commit/121e2e5ca6cdb17051c6d8072072f7f480ac2015), [1bc52267f5](https://github.com/facebook/react-native/commit/1bc52267f504eb02c8744c380fa2de878b0ab79f), [48b3d1322b](https://github.com/facebook/react-native/commit/48b3d1322b884f62eb5aeb36136bcd76c502e42d), [ef3d8b23c3](https://github.com/facebook/react-native/commit/ef3d8b23c35246d4e088d532c41723e06b688f1b), [ef3d8b23c3](https://github.com/facebook/react-native/commit/ef3d8b23c35246d4e088d532c41723e06b688f1b), [50e400128e](https://github.com/facebook/react-native/commit/50e400128eba554af5de4ca267430524e3eff107), and [f39d0923c7](https://github.com/facebook/react-native/commit/f39d0923c78686118a5d268c0e659d2608d28df0) by [@ziqichen6](https://github.com/ziqichen6))
- Add `YogaNodeProperties` implementation based on `ByteBuffer` ([0c97e75dfe](https://github.com/facebook/react-native/commit/0c97e75dfeec831abb6cb39889309d8299cdce9f) and [23657ccf5b](https://github.com/facebook/react-native/commit/23657ccf5bcab6c511903660b3c617c3b8248f20) by [@davidaurelio](https://github.com/davidaurelio))
- Add `FlatList` and `SectionList` to Animated exports ([daa7c78055](https://github.com/facebook/react-native/commit/daa7c78055857cd2d9ea650de0c4b0f72d3f2acf) by [@yunyu](https://github.com/yunyu))
- Adding new styling props to `FlatList`/`VirtualizedList` for `ListHeaderComponent` and `ListFooterComponent` ([a2675ced4e](https://github.com/facebook/react-native/commit/a2675ced4efe0df7745bf38908efa41d4d7a9841))
- Added more info to Module Registry systraces ([c7fdd2701f](https://github.com/facebook/react-native/commit/c7fdd2701f7edc1a771a04c890da4d742dca6ffb) by [@axe-fb](https://github.com/axe-fb))
- Added support for out-of-tree platform plugins via a new `haste` field in `package.json`; read more in the [docs entry](https://reactnative.dev/docs/out-of-tree-platforms) ([03476a225e](https://github.com/facebook/react-native/commit/03476a225e012a0285650780430d64fc79674f0f) by [@empyrical](https://github.com/empyrical))
- Added `snapToOffsets` to `ScrollView` and made a number of fixes to `snapToInterval` as well ([fd744dd56c](https://github.com/facebook/react-native/commit/fd744dd56ca183933a67e8398e1d20da14a31aab) by [@olegbl](https://github.com/olegbl))

#### Android specific additions

- Allow registering custom packager command handlers ([b3ef1c3a56](https://github.com/facebook/react-native/commit/b3ef1c3a5645793ef42d25bb16ef023a743a1f9f) by [@fkgozali](https://github.com/fkgozali))
- Implement `AccessibilityInfo.setAccessibilityFocus` for Android ([be715ec705](https://github.com/facebook/react-native/commit/be715ec7053a77fa6c9087990a493d17c1155de2) by [@draperunner](https://github.com/draperunner))
- Add Support for `overflow` style property ([b81c8b51fc](https://github.com/facebook/react-native/commit/b81c8b51fc6fe3c2dece72e3fe500e175613c5d4) and [bbdc12eda7](https://github.com/facebook/react-native/commit/bbdc12eda7dec135799b7f4c41fe678180970dd2)by [@yungsters](https://github.com/yungsters))

#### iOS specific additions

- `WebView` can now use `WKWebView` internally if you pass `useWebKit={true}` ([7062e5bdb5](https://github.com/facebook/react-native/commit/7062e5bdb5582bb21d1ef890965f08cc20d292b7), [1442c265da](https://github.com/facebook/react-native/commit/1442c265da36601114ce184cd5bc322f45dc1b44), [3703927e7e](https://github.com/facebook/react-native/commit/3703927e7e12ffc8922644ea251cd6f7a384570c), [7a6dd9807c](https://github.com/facebook/react-native/commit/7a6dd9807cda45c2d60641864f2d6c8d401e8ae3), [e5f95aba9b](https://github.com/facebook/react-native/commit/e5f95aba9b23376de498456282ad17113ef44cd9), [1741fe9571](https://github.com/facebook/react-native/commit/1741fe95710556f30dc2442aaaae23e31dad4cc0), [90e85a4adc](https://github.com/facebook/react-native/commit/90e85a4adc749666f81034119f281ac54840e7df), [0022354525](https://github.com/facebook/react-native/commit/0022354525eae0a368704da65c9d0f85f33ba5fb), [03b57d9db6](https://github.com/facebook/react-native/commit/03b57d9db6509fa3e715f23c8270caf6ca091acd), [1584108805](https://github.com/facebook/react-native/commit/1584108805ca6c8eff7a77e15c8553028665b53f), [a997c0ac16](https://github.com/facebook/react-native/commit/a997c0ac16d8863333d057269a8b5e28994b84eb), [4ca949b46e](https://github.com/facebook/react-native/commit/4ca949b46ec8fd72b5305daa06fac3ef58a8fa5f), [721763020a](https://github.com/facebook/react-native/commit/721763020a4a7b4b3cad1a9c074ec2e51a8d840b), [1af17f1648](https://github.com/facebook/react-native/commit/1af17f164828b6d6fa0450af46baf945745363e7), [215fa14efc](https://github.com/facebook/react-native/commit/215fa14efc2a817c7e038075163491c8d21526fd), [bacfd92976](https://github.com/facebook/react-native/commit/bacfd9297657569006bab2b1f024ad1f289b1b27), [95801f1eda](https://github.com/facebook/react-native/commit/95801f1eda2d723d9b87760d88fa9f1a1bb33ab1), [b18fddadfe](https://github.com/facebook/react-native/commit/b18fddadfeae5512690a0a059a4fa80c864f43a3), [28b058c341](https://github.com/facebook/react-native/commit/28b058c341690bd35e1d59885762ec29614a3d45), and [78fcf7c559](https://github.com/facebook/react-native/commit/78fcf7c5598ce7f5d0d62110eb34fe5a4b962e71) by [@rsnara](https://github.com/rsnara))
- Add `accessibilityHint` for iOS ([253b29dbd8](https://github.com/facebook/react-native/commit/253b29dbd8ddb11824866e423c00a4a68bb856f3) by [@draperunner](https://github.com/draperunner))

### Changes: existing functionality that is now different

- _[BREAKING]_ In the CLI, `unbundle` is now `ram-bundle` ([ebf5aeab28](https://github.com/facebook/react-native/commit/ebf5aeab280f2ebc439ec39d25c48fdf1980cf73) by [@jeanlauliac](https://github.com/jeanlauliac))
- Bump minimum Node version to 8.3 (#20236) ([e64e13fce3](https://github.com/facebook/react-native/commit/e64e13fce394332ce609f0def35fa573f30138e9) by [@hramos](https://github.com/hramos))
- Updated React ([70913a4623](https://github.com/facebook/react-native/commit/70913a4623c53db8a0db578eec30cad8671f8319), [b7bb25fe4c](https://github.com/facebook/react-native/commit/b7bb25fe4c1bfbedb5b8c75725721cf901dc54b0), and [672528ffde](https://github.com/facebook/react-native/commit/672528ffde3b467ccdfd6b1ce0352f150b20c922) by [@acdlite](https://github.com/acdlite), [@hramos](https://github.com/hramos), and [@yungsters](https://github.com/yungsters))
- Upgrade Flow to v0.76.0 ([eac34e3021](https://github.com/facebook/react-native/commit/eac34e30215d88b5fe9056f9678275b894032636) by [@gabelevi](https://github.com/gabelevi))
- Upgrade jest to 23.4.1 ([51cf9eb3e8](https://github.com/facebook/react-native/commit/51cf9eb3e823a13304570b352b81734f069c18c3) by [@rafeca](https://github.com/rafeca))
- Upgrade babel-eslint to v9.0.0-beta.2 with better support for Flow ([abf1188de2](https://github.com/facebook/react-native/commit/abf1188de225e4b7d36ecbad316af92ca29c85c2) by [@rubennorte](https://github.com/rubennorte))
- Upgrade ESLint to 5.1.0 ([0f2f0cad41](https://github.com/facebook/react-native/commit/0f2f0cad41f632d1dbb0c676d5edea5db62eb01c) by [@rubennorte](https://github.com/rubennorte))
- Upgrade Babel to v7.0.0 ([b9d1c832b0](https://github.com/facebook/react-native/commit/b9d1c832b0bb7161bcec48d655e878af609b8350), [724c7498b6](https://github.com/facebook/react-native/commit/724c7498b6f10f6fd03eb217160508001fb1c5b3) by Peter van der Zee, and [bf8e1b4ffa](https://github.com/facebook/react-native/commit/bf8e1b4ffab4958587efdf3ce97e4ebdd887a20c) by [@rubennorte](https://github.com/rubennorte) and [@rafeca](https://github.com/rafeca))
- Metro is now at v0.45.0 ([169d6839bb](https://github.com/facebook/react-native/commit/169d6839bb32d0149036ab1641d13318c0eb6f9d), [bda84a32d0](https://github.com/facebook/react-native/commit/bda84a32d08d6de3849d6afac4cbbf309837b676), [877212e18c](https://github.com/facebook/react-native/commit/877212e18c86905feda9faa1b2508c0c39396227), [169812f9ce](https://github.com/facebook/react-native/commit/169812f9ce60317dd7320384007879be16278678), [cfeb60c19b](https://github.com/facebook/react-native/commit/cfeb60c19bd23e683f1809f6535439c81e8ed166) by [@CompuIves](https://github.com/CompuIves) and [@rafeca](https://github.com/rafeca))
- Hide pre-bundled notification when not on dev mode ([edf71005b5](https://github.com/facebook/react-native/commit/edf71005b5a4d7cfb09eae14f5765d30b9c5704e) by [@yancouto](https://github.com/yancouto))
- Refined `StyleSheet.compose` Flow Type ([50a481d23a](https://github.com/facebook/react-native/commit/50a481d23ae72a434849d2c85007e411b0c2bb1f) by [@yungsters](https://github.com/yungsters))
- Catch JS bundle load failure and prevent calls to JS after that ([201ba8c69d](https://github.com/facebook/react-native/commit/201ba8c69d2defc284a04acadcd13df001028ada) by [@fkgozali](https://github.com/fkgozali))
- Use new Metro configuration in react-native cli ([a32620dc3b](https://github.com/facebook/react-native/commit/a32620dc3b7a0ebd53feeaf7794051705d80f49e) and [aaf797ad67](https://github.com/facebook/react-native/commit/aaf797ad67b965f64450b199c554c65ad8dad351) by [@CompuIves](https://github.com/CompuIves))
- Whitelist `react-native-dom` in haste/cli config defaults ([c4bcca6685](https://github.com/facebook/react-native/commit/c4bcca66853cd231486de61f11cbcec42427b7b2) by [@vincentriemer](https://github.com/vincentriemer))
- In the CLI, don't override `metro.config.js` settings ([c5297c75cb](https://github.com/facebook/react-native/commit/c5297c75cb6da58a241c8f91b0d2fefbc5835a46) by [@rozele](https://github.com/rozele))

#### Breaking Changes

- Public methods of Image (`blur`, `focus`, `measure`, `measureInWindow`, `measureLayout`, `setNativeProps`) are no longer bound to the image component instance. Therefore, it is unsafe to pass these methods by reference (i.e: as callbacks) to functions. So, things like `setTimeout(this._imgRef.focus, 1000)` will no longer work. Please instead do: `setTimout(() => this._imgRef.focus(), 1000)`.

#### Android specific changes

- `Image` source without a uri now returns null ([28c7ccf785](https://github.com/facebook/react-native/commit/28c7ccf785132458fce32c234ce777a6fe475c93) by [@himabindugadupudi](https://github.com/himabindugadupudi))
- `targetSdkVersion` is 26 ([bfb68c09ee](https://github.com/facebook/react-native/commit/bfb68c09ee88c6e1d91d3b54c01746f9a98c7c6c) by [@dulmandakh](https://github.com/dulmandakh))
- Upgrade NDK to r17b ([6117a6c720](https://github.com/facebook/react-native/commit/6117a6c7205c969f93d39ba02e0583881572d5fa) by [@dulmandakh](https://github.com/dulmandakh))
- Upgrade NDK toolchain to 4.9 ([ccdd450b12](https://github.com/facebook/react-native/commit/ccdd450b1284b73bee80a9709c864816cbfc1108) by [@dulmandakh](https://github.com/dulmandakh))
- Upgrade Android Support Library to version 27.1.1 and set compileSdkVersion to 27; buildToolsVersion comes along for the ride, too ([874cca1ac2](https://github.com/facebook/react-native/commit/874cca1ac258ec224bade999722d7a34c307def0) and [044b399e65](https://github.com/facebook/react-native/commit/044b399e6590d84065a9b186750f77bc9d851aac) by [@dulmandakh](https://github.com/dulmandakh))
- Upgrade Android gradle plugin to 3.1.4, Gradle wrapper to 4.4 ([6e356895e7](https://github.com/facebook/react-native/commit/6e356895e79fb92640295a14483af1a430732247) and [33d20da41b](https://github.com/facebook/react-native/commit/33d20da41b814a2fb9ba02cbab8b61a819cad95b) by [@gengjiawen](https://github.com/gengjiawen) and [@dulmandakh](https://github.com/dulmandakh))
- Upgrade to soloader 0.5.1 ([b6f2aad9c0](https://github.com/facebook/react-native/commit/b6f2aad9c0119d11e52978ff3fa9c6f269f04a14) by [@gengjiawen](https://github.com/gengjiawen))
- Upgrade mockito to 2.19.1 ([3ea803a814](https://github.com/facebook/react-native/commit/3ea803a814f43edb3ec256dd85d778c652ca99d1) by [@dulmandakh](https://github.com/dulmandakh))
- Upgrade glog to 0.3.5 ([b5fca80605](https://github.com/facebook/react-native/commit/b5fca806059e628edb504cb1bacf62e89ee6f102) by [@dulmandakh](https://github.com/dulmandakh))

### Fixed: bugs that have been resolved

- Fixed builds on Windows machines ([3ac86c366c](https://github.com/facebook/react-native/commit/3ac86c366c91f8d62f0128057019b94a783b4249) by [@rafeca](https://github.com/rafeca))
- Fixed building tvOS ([1f1ddd0261](https://github.com/facebook/react-native/commit/1f1ddd0261762bdeff3e747250400b208b18839b))
- Fixed `TextInputState`'s `currentlyFocusedField()` ([b4b594cec1](https://github.com/facebook/react-native/commit/b4b594cec1d91c38faac11a90a787ae692e35296) by [@janicduplessis](https://github.com/janicduplessis))
- `<VirtualizedList>` fix for jumpy content when `initialScrollIndex` specified ([e0c73633cf](https://github.com/facebook/react-native/commit/e0c73633cfc0a62df9d39991b0df65fa5875609a) by [@rbrosboel](https://github.com/rbrosboel))
- Fix local-cli assetRegistryPath and middlewares ([f05943de0a](https://github.com/facebook/react-native/commit/f05943de0abfc16da41163c6b91a04ecc8de8e67) by [@janicduplessis](https://github.com/janicduplessis))
- Fix issue with when all are `flexGrow` and `flexShrink` set to 0 except for one ([90a408ea6f](https://github.com/facebook/react-native/commit/90a408ea6ff7833e33b4058f490073e04460d00b) by [@priteshrnandgaonkar](https://github.com/priteshrnandgaonkar))
- Fix react-native CLI's debugger UI path and metro host/port arg usage ([5067540487](https://github.com/facebook/react-native/commit/50675404873c1ffac0deedc51fe745168051148b) by [@Kureev](https://github.com/Kureev))
- Hotfix to include `react-native-windows` in hasteImpl accepted paths ([54942746d4](https://github.com/facebook/react-native/commit/54942746d4037e1153e14fcfc95e4edc772d296a) by [@rubennorte](https://github.com/rubennorte))
- Fix some classes of incorrect Flow errors for `Animated` ([db2159d0b3](https://github.com/facebook/react-native/commit/db2159d0b3fd57556383eff68d32d32246dd9081) by [@yunyu](https://github.com/yunyu))
- Fixed a typo in DockerTests.md ([c1831d50cf](https://github.com/facebook/react-native/commit/c1831d50cfd35b7a7393e50bc71d8389b36021ce) by [@kant](https://github.com/kant))
- Fix invalid use of destructuring in jest preprocessor ([9d5bd50737](https://github.com/facebook/react-native/commit/9d5bd507372c7b63e59a94383c3e3091d96409de) by [@umairda](https://github.com/umairda))
- Fixed a CLI crash when using old versions of node ([e61176d650](https://github.com/facebook/react-native/commit/e61176d650e2b5fe51dd6cd4c429ff47a1a9b1dc) by [@keksipurkki](https://github.com/keksipurkki))

#### Android specific fixes

- Fix issue with AsyncStorage not behaving properly on Android 7+ ([1b09bd7fba](https://github.com/facebook/react-native/commit/1b09bd7fba92431d63d2cecb83565491e91db396))
- Fixed extreme `<TextInput>` slowness ([5017b86b52](https://github.com/facebook/react-native/commit/5017b86b525e3ef6023f0f8a88e6fd1cf98024e0) by [@gnprice](https://github.com/gnprice))
- Fixed `<TextInput>` placeholder not being completely visible ([84022321c4](https://github.com/facebook/react-native/commit/84022321c437e597660ecd8a773e51bdf8855f4e) and [86f24ccf71](https://github.com/facebook/react-native/commit/86f24ccf71f4c41904838c8c7e13268c300fd745) by [@jainkuniya](https://github.com/jainkuniya))
- Fix Horizontal `<ScrollView>`'s scroll position during layout changes with RTL content ([de573277bf](https://github.com/facebook/react-native/commit/de573277bf64703aefdeb52db2c2524b2c241bab))
- Fix Horizontal `<ScrollView>` overflow issue ([d5465a9a0a](https://github.com/facebook/react-native/commit/d5465a9a0a840f7e759bb8fb6679b01017eb3d05))
- Fixing crash on SDK 15 on ReactTextInputLocalData ([1bb2bead8b](https://github.com/facebook/react-native/commit/1bb2bead8bef850037c8b72209cd72a442572821))
- Fix Drawing Rect for ReactScrollView ([6a16bec882](https://github.com/facebook/react-native/commit/6a16bec882cba809bdf9027367b76f6543b6617d) by [@yungsters](https://github.com/yungsters))
- Fixed NoSuchKeyException Thrown From ReadableNativeMap bysafely unwrapping ReadableMap by defaulting to 0 if key not present ([1a6666a116](https://github.com/facebook/react-native/commit/1a6666a116fd8b9e8637956de2b41a1c315dd470) by [@Bhavik-P](https://github.com/Bhavik-P))
- Fixed runAndroid to enable the use of a package on port <> 8081 for Windows ([3cd0737fe2](https://github.com/facebook/react-native/commit/3cd0737fe2dce9df29822854bfbfaf2f22346c69) by [@ihenshaw](https://github.com/ihenshaw))
- Don't crash on upload retry when trying to fetch on a varying quality network ([79fe925f1d](https://github.com/facebook/react-native/commit/79fe925f1daa053d5a5d92a228e5c7beff565ab4) by [@dryganets](https://github.com/dryganets))

#### iOS specific fixes

- Fix `TextInput.clear()` and `TextInput.setNativeProps({text: ''})` to work ([2307ea60d0](https://github.com/facebook/react-native/commit/2307ea60d03edd234511bfe32474c453f30c1693) by [@magicien](https://github.com/magicien))
- Correct fishhook import in RCTReconnectingWebSocket ([75a0273de2](https://github.com/facebook/react-native/commit/75a0273de21948b0b959263100f09111f738ec35))
- Change in RCTImagePickerManager to handle crashes if height/width is nil ([82af7c989b](https://github.com/facebook/react-native/commit/82af7c989be42a516f438f162d21f699be297e79) by [@abhi06276](https://github.com/abhi06276))
- Fix controlled `<TextInput>` on iOS when inputting in Chinese/Japanese ([892212bad2](https://github.com/facebook/react-native/commit/892212bad2daadd373f4be241e4cd9889b0a1005) by [@mmmulani](https://github.com/mmmulani))
- Fixed `<ScrollView>` bug encountered with brownfield apps ([fab5fffbb3](https://github.com/facebook/react-native/commit/fab5fffbb3eb8668c9202dec5e770330d49880b0) by [@PeteTheHeat](https://github.com/PeteTheHeat))
- Fixed missing selection indicator lines on `<PickerIOS>` ([e592d6f8c7](https://github.com/facebook/react-native/commit/e592d6f8c7b0409ab6f0a2dbf6ebe3cea28c3e79) by [@VSchlattinger](https://github.com/VSchlattinger))
- Fix crash in RCTImagePicker on iOS ([934c50fbe0](https://github.com/facebook/react-native/commit/934c50fbe07e49391ba27c3469f99bec65e48d39) by [@mmmulani](https://github.com/mmmulani))
- Fix `undefined_arch` error received when building in Xcode 10 beta ([e131fffb37](https://github.com/facebook/react-native/commit/e131fffb37a545363daf11735a0243165b57f63f) by [@futuun](https://github.com/futuun))
- Add support for connecting to the Packager when running the iOS app on device when using custom Debug configuration ([079bf3f206](https://github.com/facebook/react-native/commit/079bf3f2067cb268b60e75cd9e1bc51a9c85359c))
- Fixed RCTAnimation import for integrating with cocoapods ([eef8d47a37](https://github.com/facebook/react-native/commit/eef8d47a37211bf7d4978db75df1fedd9cacbde8) by [@LukeDurrant](https://github.com/LukeDurrant))

### Removed: features that have been removed; these are breaking

- _[BREAKING]_ Removed `ScrollView.propTypes`; use flow or typescript for verifying correct prop usage instead ([5b6ff01764](https://github.com/facebook/react-native/commit/5b6ff01764502c88848867c7e04cab969da384a2) by [@sahrens](https://github.com/sahrens))

#### Android specific removals

- `ReactInstancePackage` is now deprecated; use `@link ReactPackage` or `@link LazyReactPackage` ([b938cd524a](https://github.com/facebook/react-native/commit/b938cd524a20c239a5d67e4a1150cd19e00e45ba) by [@axe-fb](https://github.com/axe-fb))

## v0.56.0

Welcome to the June 2018 release of React Native!
Over 60 contributors made [821 commits](https://github.com/facebook/react-native/compare/0.55-stable...0.56-stable) since March - and we are extremely grateful to every single one of you.

As you'll see in a second, this new version has some important **breaking changes** that required a lot of extra efforts to bring to a stable 0.56. This was the main reason behind skipping April and May from the monthly release cycle, but looking forward we are planning on going back to do a rollout every month.

### Highlights

#### React Native now uses **Babel 7**

When upgrading to 0.56, make sure to bump your `babel-preset-react-native` `package.json` dependency to `5.0.2` or newer (but still as _fixed_ value).

React Native library authors will need to update their libraries to make use of the updated Babel preset as Babel 7 is **not** backwards compatible.

If you have issues upgrading to Babel 7, please double check the [related documentation](https://new.babeljs.io/docs/en/next/v7-migration.html#versioning-dependencies-blog-2017-12-27-nearing-the-70-releasehtml-peer-dependencies-integrations), in particular the sections related to _Package Renames_ and _Scoped Packages_.

The [`babel-bridge`](https://github.com/babel/babel-bridge) library may be used if you need to use libraries that have not yet upgraded to Babel 7. You may also enforce the Babel 7 dependency via tools like [yarn resolutions](https://yarnpkg.com/lang/en/docs/selective-version-resolutions/). Overall, you need to ensure all the `@babel/*` deps are fixed at version `7.0.0-beta.47`.

#### **Node 8** is now the minimum required version

Trailing commas are now allowed.

#### **iOS 9** is now the minimum required version

Any device that can run iOS 8, can upgrade to iOS 9. Developers who support iOS 8 in their apps may continue doing so as this is a Xcode-level setting (`IPHONEOS_DEPLOYMENT_TARGET`).

#### **Xcode 9** is now the minimum required version

We recommend using Xcode 9.4 as that is what we use to run our tests.

#### **Android** projects are now compiled using the _Android 26 SDK_

The target API level is left unchanged in this release.

Starting August 2018, new apps submitted to the Play Store will need to target API 26 as a minimum. You can now opt your project in to use API 26 (or newer) as the target. Please let us know about any issues, as we'd like to finalize support for Android API 26 by the time `0.57.0` is released.

#### `WebView` will only load http(s) URLs by default

Geolocation is disabled by default.

#### Consistently Throw for `<Text><View /></Text>`

Removes a pitfall that people may run into when releasing an app for Android if the bulk of the testing has been performed on iOS only. Nesting a `<View>` within a `<Text>` component (e.g. `<Text><View /></Text>`) is unsupported on Android, but using this pattern on iOS has not thrown errors in the past. With this release, nesting a `<View>` inside a `<Text>` will now throw an error on iOS in order to reduce the parity gap between the platforms.

#### Flow improvements, migrating away from PropTypes

Added Flow types for several components.

We're migrating away from PropTypes and runtime checks and instead relying on **Flow**. You'll notice many improvements related to Flow in this release.

- Fix project settings warnings on newer Xcode versions, remove unnecessary console logging.
- Modernized `YellowBox`.
  Sort warnings by recency, group warnings by format string, present stack traces, show status of loading source maps, support inspecting each occurrence of a warning, and bug fixes.
- Prettier files!
- Lots of bug fixes.

#### State of React Native

Heads-up: the Facebook internal team is [currently working on a rewrite of some core architecture pieces](https://reactnative.dev/blog/2018/06/14/state-of-react-native-2018). This is a **work in progress** and we do not expect it to be ready for use in open source quite yet, but we felt the need to let you know what those commits mentioning Fabric are about.

---

### Added: new features

- Update `babelHelpers` with Babel 7 support ([fbd1beaf66](https://github.com/facebook/react-native/commit/fbd1beaf666be9c09a380784f8c0cd34ba083a6b))
- `FlatList` is now Strict Mode compliant ([a90d0e3614](https://github.com/facebook/react-native/commit/a90d0e3614c467c33cf85bcbe65be71903d5aecc))
- Enable `?.` optional chaining operator plugins ([aa6f394c42](https://github.com/facebook/react-native/commit/aa6f394c4236e5a4998c3be8ed61ec1bab950775))
- Support `flexWrap: 'wrap-reverse'` ([d69e55060f](https://github.com/facebook/react-native/commit/d69e55060fd76d91eccc45905d250a9fce4b2c49))
- Add prop type `accessibilityTraits` to `Text` ([654435d1ed](https://github.com/facebook/react-native/commit/654435d1ed9e584e65fff601e1fa50591e042664))
- Add devDependencies support for templates ([c4ab03a18e](https://github.com/facebook/react-native/commit/c4ab03a18e75e6ed55444b5d86f3ceee435b9a78))
- Add support for springDamping in `SpringInterpolator` ([1dde989919](https://github.com/facebook/react-native/commit/1dde989919d2c272ca7fcaa5c4b2d9ee02c490a0))

#### Android specific additions

- Add support for build.gradle with CRLF for use with `react-native link` ([843cfc3b20](https://github.com/facebook/react-native/commit/843cfc3b202433aad9a236b1b623da7c45e1ac15))
- add decimal pad to android ([75e49a0637](https://github.com/facebook/react-native/commit/75e49a0637eaa3bd3bb7e445648f084a42d9c8af))
- Add a way to dismiss PopupMenu elements ([353c070be9](https://github.com/facebook/react-native/commit/353c070be9e9a5528d2098db4df3f0dc02d758a9))
- Implement `Image.defaultSource` ([b0fa3228a7](https://github.com/facebook/react-native/commit/b0fa3228a77d89d6736da6fcae5dd32f74f3052c))
- Support Image resizeMode=repeat ([0459e4ffaa](https://github.com/facebook/react-native/commit/0459e4ffaadb161598ce1a5b14c08d49a9257c9c))
- Yoga: Add back deprecated `getParent` methods for non-breaking API change ([c3c5c3cbce](https://github.com/facebook/react-native/commit/c3c5c3cbce24a31f73ae6339e377ee76ca6401ad))

#### iOS specific additions

- Run tests using Xcode 9.4 and iOS 11.4 ([c55bcd6ea7](https://github.com/facebook/react-native/commit/c55bcd6ea729cdf57fc14a5478b7c2e3f6b2a94d))
- Add support for Homebrew-installed Node ([0964135a17](https://github.com/facebook/react-native/commit/0964135a178b459e06b44a49a4ecb0dd6c5bec9b))
- Add textTransform style support ([8621d4b797](https://github.com/facebook/react-native/commit/8621d4b79731e13a0c6e397abd93c193c6219000))
- Add docs for Swift usage to `RCTBridgeModule.h` ([ca898f4367](https://github.com/facebook/react-native/commit/ca898f4367083e0943603521a41c48dec403e6c9))

---

### Changes: existing functionality that is now different

- Upgrade React Native to Babel 7 ([f8d6b97140](https://github.com/facebook/react-native/commit/f8d6b97140cffe8d18b2558f94570c8d1b410d5c))
- New projects created using `react-native init` will use Babel 7 ([e315ec9891](https://github.com/facebook/react-native/commit/e315ec9891eb0bcb51afb0e797dbd49aa8f9ac71))
- Restrict `WebView` to only http(s) URLs: ([634e7e11e3](https://github.com/facebook/react-native/commit/634e7e11e3ad39e0b13bf20cc7722c0cfd3c3e28), [23f8f7aecb](https://github.com/facebook/react-native/commit/23f8f7aecb1f21f4f5e44fb9e4a7456ea97935c9))
- Node 8 is now the minimum required version ([c1e6f27823](https://github.com/facebook/react-native/commit/c1e6f278237e84c8ed26d3d2eb45035f250e2d40))
- Upgrade React to v16.4.1, sync React Renderer to revision ae14317 ([c749d951ad](https://github.com/facebook/react-native/commit/c749d951ada829c6f6fb76f35e68142e61054433))
- Update new project template's Flow config to fix `Cannot resolve module X` isse due to removal of `@providesModule` ([843a433e87](https://github.com/facebook/react-native/commit/843a433e87b0ccaa64ab70d07e22bffbabad8045))
- Upgrade Flow to v0.75 ([3bed272a62](https://github.com/facebook/react-native/commit/3bed272a620ac806a6142327013265ea8138641a), [bc2f12c68c](https://github.com/facebook/react-native/commit/bc2f12c68cf8cfdf8c060354e84392fd9a3645d8), [6264b6932a](https://github.com/facebook/react-native/commit/6264b6932a08e1cefd83c4536ff7839d91938730))
- Upgrade Flow definitions ([f8b4850425](https://github.com/facebook/react-native/commit/f8b4850425f115c8a23dead7ec0716b61663aed6))
- Upgrade Prettier to v1.13.6 ([29fb2a8e90](https://github.com/facebook/react-native/commit/29fb2a8e90fa3811f9485d4b89d9dbcfffea93a6), [bc2f12c68c](https://github.com/facebook/react-native/commit/bc2f12c68cf8cfdf8c060354e84392fd9a3645d8))
- Upgrade Jest to v23.2.0 ([536c937269](https://github.com/facebook/react-native/commit/536c9372692712b12317e657fc3e4263ecc70164), [bc2f12c68c](https://github.com/facebook/react-native/commit/bc2f12c68cf8cfdf8c060354e84392fd9a3645d8))
- Upgrade Metro to v0.38 ([d081f83a04](https://github.com/facebook/react-native/commit/d081f83a0487ffbc7d19f8edc7532611b359dfc6))
- Modernized `YellowBox` ([d0219a0301](https://github.com/facebook/react-native/commit/d0219a0301e59e8b0ef75dbd786318d4b4619f4c))
- Disallow requiring from invariant/warning ([521fb6d041](https://github.com/facebook/react-native/commit/521fb6d041167ec8a8d0e98ac606db1f27f0c5c8))
- Remove native prop type validation ([8dc3ba0444](https://github.com/facebook/react-native/commit/8dc3ba0444c94d9bbb66295b5af885bff9b9cd34))
- Add `$FlowFixMe` to invalid prop accesses where Flow wasn't complaining before ([f19ee28e7d](https://github.com/facebook/react-native/commit/f19ee28e7d896aaacf26c6f850230019bdef0d3d))
- Create Flow props for `Image` ([8bac869f5d](https://github.com/facebook/react-native/commit/8bac869f5d1f2ef42e707d0ec817afc6ac98b3b2))
- Flow type for `SegmentedControlIOS` ([113f009698](https://github.com/facebook/react-native/commit/113f009698dbd8f1b4c1048d77ff1eb373021083))
- Flow type for `ProgressViewIOS` ([c87701ba05](https://github.com/facebook/react-native/commit/c87701ba05a8524756e87c089eb92c8f3c81823e))
- Flow type for `PickerIOS` ([1c66cdc7e8](https://github.com/facebook/react-native/commit/1c66cdc7e8ce8190dfbef76629601497446b2b0a))
- Flow type for `Switch` ([06052a2330](https://github.com/facebook/react-native/commit/06052a2330fc9c1dd0d56c6bbe5a17703f80c6b9))
- Flow type for `Slider` ([cbe045a95f](https://github.com/facebook/react-native/commit/cbe045a95f1ca53d99ae521742a93299a53d6136))
- Flow type for `RefreshControl` ([891dfc3da4](https://github.com/facebook/react-native/commit/891dfc3da4b5825097aedf73ff04e8982c00aeff))
- Flow type for `ListView` ([4b1ecb6204](https://github.com/facebook/react-native/commit/4b1ecb62045fbb78764d1f51030f2253be705c5c))
- Flow type for `TextInput` ([c8bcda8150](https://github.com/facebook/react-native/commit/c8bcda8150278fde07331ca6958976b2b3395688))
- Flow type for `TouchableBounce` ([8454a36b0b](https://github.com/facebook/react-native/commit/8454a36b0bc54cb1e267bc264657cc693607da71))
- Flow type for `TouchableOpacity` ([44743c07ad](https://github.com/facebook/react-native/commit/44743c07ad672e39668f92a801578906ec92996a))
- Flow type for `TouchableHighlight` ([f0c18dc820](https://github.com/facebook/react-native/commit/f0c18dc820537892dcc33d5aebbf4f52cf299b95))
- Flow type for `TouchableWithoutFeedback` ([0b79d1faa2](https://github.com/facebook/react-native/commit/0b79d1faa21eb3c29aeeba08ee0fb2ed62e6cc54))
- Flow type for `ScrollView` ([b127662279](https://github.com/facebook/react-native/commit/b1276622791d5dbe4199bb075f473908c3e62b31))
- Flow type for `DatePickerIOS` ([97e572ea6d](https://github.com/facebook/react-native/commit/97e572ea6d7b1fd829ca20f5d5c8ff970d88e68b))
- Flow type for `KeyboardAvoidingView` ([188b118b60](https://github.com/facebook/react-native/commit/188b118b6075be1614c553596b85d430767f2dbc))
- Flow type for `ActivityIndicator` ([0b71d1ddb0](https://github.com/facebook/react-native/commit/0b71d1ddb03c036ed118574c105b0af505da19fc))
- Remove `$FlowFixMe` in `TouchableBounce` ([ffda017850](https://github.com/facebook/react-native/commit/ffda0178509ed92396f15db37a41d3d668ade4e6))
- Remove `$FlowFixMe` in `ScrollView` ([af6e2eb02d](https://github.com/facebook/react-native/commit/af6e2eb02d3651f869b5436e68e61ef3ab3405a0))
- Remove `$FlowFixMe` in `ListView` ([af6e2eb02d](https://github.com/facebook/react-native/commit/af6e2eb02d3651f869b5436e68e61ef3ab3405a0))
- Remove `$FlowFixMe` in `Text` ([6042592cf4](https://github.com/facebook/react-native/commit/6042592cf46787f089e76b661376705380607207))
- Remove `$FlowFixMe` in `RTLExample` ([206ef54aa4](https://github.com/facebook/react-native/commit/206ef54aa415e3e2bb0d48111104dfc372b97e0f))
- Remove `$FlowFixMe` in `AppContainer` ([a956551af7](https://github.com/facebook/react-native/commit/a956551af73cf785ee4345e92e71fd5b17c5644e))
- Remove `$FlowFixMe` in `Slider` ([1615f9d161](https://github.com/facebook/react-native/commit/1615f9d16149c7082ce0e1485aa04a6f2108f7ba))
- `StyleSheet`: Support animated values for border dimensions ([3e3b10f404](https://github.com/facebook/react-native/commit/3e3b10f4044ada7b523d363afb614720468c217f))
- Update `react-devtools-core` and `plist` to include security fixes reported by `npm audit` ([3a1d949906](https://github.com/facebook/react-native/commit/3a1d949906acb0c3b44d125d54d0c99305bbbb56))
- Update `Switch` to ES6 Class ([970caa4552](https://github.com/facebook/react-native/commit/970caa4552d4ba87c1a954391535ff42b00832e7))
- Update `Slider` to ES6 Class ([5259450c14](https://github.com/facebook/react-native/commit/5259450c143f71c65e157d6b7d3f0e1655eb7aa1))
- Update `ActivityIndicator` to ES6 Class ([edd7acbb1e](https://github.com/facebook/react-native/commit/edd7acbb1e6fe185600a19cc1cbb38feb16c85ad))
- Update `RefreshControl` to ES6 Class ([a35a238317](https://github.com/facebook/react-native/commit/a35a23831789030e17f766f72d307ae315be107d))
- Update `KeyboardAvoidingView` to ES6 Class ([c017dcb0f2](https://github.com/facebook/react-native/commit/c017dcb0f2903b49b2f21cc150226aeb7f5026ee))
- Update `DatePickerIOS` to ES6 Class ([f8c8231706](https://github.com/facebook/react-native/commit/f8c8231706492b588331354d45b833aa21434e13))
- Update `Text` to ES6 Class ([ab92c00245](https://github.com/facebook/react-native/commit/ab92c00245c0ce717819ddb0ab8b9204d4c13c34))
- Replace `context.isInAParentText` w/ `React.createContext` ([e1339bc183](https://github.com/facebook/react-native/commit/e1339bc18303ca5394cd0c9dc97cededb2261581))
- Cleanup `Text` implementation ([06c05e744d](https://github.com/facebook/react-native/commit/06c05e744d8af9582bde348210f254d76dae48b9))
- Switch `Text` to `React.forwardRef` ([e708010d18](https://github.com/facebook/react-native/commit/e708010d18f938e2d6b6424cfc9485d8e5dd2800))
- Switch `View` to `React.forwardRef` ([3e534b9aab](https://github.com/facebook/react-native/commit/3e534b9aab5156adac67762877b2457408fe8934))
- Update uses of `genMockFunction` and `genMockFn` to `fn` in tests ([390ded871c](https://github.com/facebook/react-native/commit/390ded871cb905d149e9c1f4a082e67a7ec7addb))
- Make `ViewProps` exact ([65c336f38f](https://github.com/facebook/react-native/commit/65c336f38f4afd43c8b5f81745abf38bd9b8ddbf))
- Spread `TVViewProps` into `ViewProps` instead of intersection ([bc658d3c44](https://github.com/facebook/react-native/commit/bc658d3c4405676643d952a126295dbc7fc26217))
- Allow trailing commas ([1e2de71290](https://github.com/facebook/react-native/commit/1e2de712907e5fe0d17648f0ff5c81d4384ca85b))
- Use `let`/`const` ([8f5ebe5952](https://github.com/facebook/react-native/commit/8f5ebe5952d0675b463137103a82f3fb0c26ae0d))
- Refactor `MockNativeMethods` in Jest ([5d4c542c58](https://github.com/facebook/react-native/commit/5d4c542c58d84bbe05f76bf01d9efdd9d438572c))
- Use app name from `app.json` after ejecting ([57774a4a98](https://github.com/facebook/react-native/commit/57774a4a981e2f12cfe9b029447e34f203221b18))
- Suggest `git apply --reject` for failed upgrades ([4fbd244b9a](https://github.com/facebook/react-native/commit/4fbd244b9a6b62e0efe1b4b5a7ec3de468f020f6))
- Moved `TouchHistoryMath` from React to React Native ([06085d3836](https://github.com/facebook/react-native/commit/06085d38366373f3135074dc14e2c9871ca4fe29))
- Refactor `RCTInputAccessoryView` ([c136c54ff0](https://github.com/facebook/react-native/commit/c136c54ff0211e2bf149fab600cd6e295f9d19dd))
- Don't wrap `ListEmptyComponent` in an extra view ([db061ea8c7](https://github.com/facebook/react-native/commit/db061ea8c7b78d7e9df4a450c9e7a24d9b2382b4))
- Move `Text` PropTypes to its own file ([cd8128b2ec](https://github.com/facebook/react-native/commit/cd8128b2eccf6898cdf798a1e1be1f7a5762a0d4))
- Mock `ReactNative.NativeComponent` native methods in Jest ([3e9a371ace](https://github.com/facebook/react-native/commit/3e9a371ace5f25b2eb7a0d30177251f8a0c10ed9))
- Tightening types for `View` and `VirtualizedList` ([5035af80ec](https://github.com/facebook/react-native/commit/5035af80ecddb44e2a8444780f25f336b760bf32))
- Make values optional in `ViewPropTypes` ([f1316cab6c](https://github.com/facebook/react-native/commit/f1316cab6c351852ef1da9939d4c8f0244fb8a6f))
- propTypes are optional for native components ([dbdf43b428](https://github.com/facebook/react-native/commit/dbdf43b428da19a9eba012753904bcf33339ea9a))
- Rename `Style` to `DangerouslyImpreciseStyle` ([4895c645ea](https://github.com/facebook/react-native/commit/4895c645ea17ff939811f3d5ec6218cd4e31c5fb))
- _[BREAKING]_ `requireNativeComponent`'s signature has been simplified to only take extraOptions ([820673e707](https://github.com/facebook/react-native/commit/820673e7076b5906ba50e09e40fb9a32cf500c1b), [b549e364e0](https://github.com/facebook/react-native/commit/b549e364e0025e0e1b4005f04a9de2d767006da1), [28d37781c6](https://github.com/facebook/react-native/commit/28d37781c6589574de1113bd12077f6d54053ffb), [1c90a2b47b](https://github.com/facebook/react-native/commit/1c90a2b47b420a4b6aa16a55a344cc08f0eacbe3), and [1ab7d49c2d](https://github.com/facebook/react-native/commit/1ab7d49c2df5673dd214eb8a9b7fd3defb0ff857) by [@yungsters](https://github.com/yungsters))

#### Breaking Changes

- Public methods of Text (`blur`, `focus`, `measure`, `measureInWindow`, `measureLayout`, `setNativeProps`) are no longer bound to the text component instance. It is therefore unsafe to pass these methods by reference (i.e: as callbacks) to functions. So, things like `setTimeout(this._txtRef.focus, 1000)` will no longer work. Please instead do: `setTimeout(() => this._txtRef.focus(), 1000)`.

### iOS specific changes

- _[BREAKING]_ WebViews now can only use https; do not use it for `file://` ([634e7e11e3](https://github.com/facebook/react-native/commit/634e7e11e3ad39e0b13bf20cc7722c0cfd3c3e28) by [@mmmulani](https://github.com/mmmulani))
- iOS 9 is now the minimum required version ([f50df4f5ec](https://github.com/facebook/react-native/commit/f50df4f5eca4b4324ff18a49dcf8be3694482b51))
- Update podspecs to target iOS 9 ([092103e752](https://github.com/facebook/react-native/commit/092103e7525e58e04346e0a1a16a67ca4f31c2e9))
- Xcode 9.4 is now used to run tests ([c55bcd6ea7](https://github.com/facebook/react-native/commit/c55bcd6ea729cdf57fc14a5478b7c2e3f6b2a94d))
- Prevent console logging on iOS 11.3+ within WebSocket ([8125be942b](https://github.com/facebook/react-native/commit/8125be942bd5fd8fe851bad04ae6b9bcb0af4727))
- Expose `RCTFont` size overrides ([6611fefef7](https://github.com/facebook/react-native/commit/6611fefef7559c4cd3d1824235d263bff210d5e2))

### Android specific changes

- Projects are now compiled using Android SDK 26 ([065c5b6590](https://github.com/facebook/react-native/commit/065c5b6590de18281a8c592a04240751c655c03c))
- Use Google Maven repo in new Android projects ([6d56a234e3](https://github.com/facebook/react-native/commit/6d56a234e3cf5984335ff2713236260fac977f5f))
- Upgrade Buck to v2018.03.26.01 ([1324e7b558](https://github.com/facebook/react-native/commit/1324e7b5580db815471172cf6dd140124bd2f11a))
- Upgrade gradle-plugin to 2.3.3, gradle to 3.5.1, gradle-download-task to 3.4.3 ([699e5eebe8](https://github.com/facebook/react-native/commit/699e5eebe807d1ced660d2d2f39b5679d26925da))
- Bump NDK APP_PLATFORM to android-16 ([b5dc45420a](https://github.com/facebook/react-native/commit/b5dc45420a0d3aa54d2d2075d7f14ff1835df78a))
- Bump glog to 0.3.5 (added libc++ support) ([b5fca80605](https://github.com/facebook/react-native/commit/b5fca806059e628edb504cb1bacf62e89ee6f102))
- `ReactFragmentActivity` deprecated as it's not necessary when targeting API level 14 and above ([77a02c0d83](https://github.com/facebook/react-native/commit/77a02c0d83dbfcd9a5397cf63e1ab2e6c94cfdde))
- Touchables now play a sound on press ([722f88ca90](https://github.com/facebook/react-native/commit/722f88ca9058c5d902c416b826a7a7ab347326b8))
- Default `underlineColorAndroid` to transparent ([a3a98eb1c7](https://github.com/facebook/react-native/commit/a3a98eb1c7fa0054a236d45421393874ce8ce558))
- Disable `WebView` geolocation by default ([23d61b35fb](https://github.com/facebook/react-native/commit/23d61b35fb6fdbfb84f77b6d99ff155a0ff868e6))
- Ensure cookies with illegal characters are not sent to okhttp ([04028bf216](https://github.com/facebook/react-native/commit/04028bf2169b01f79bd86ecd6b0d8aa5f99599f1))
- Update app icons to match recent Android releases ([94393f8652](https://github.com/facebook/react-native/commit/94393f8652c414806fc861c214ad36e9ac1b6114))
- Better error messages for `ReadableNativeMap` ([30d06b4286](https://github.com/facebook/react-native/commit/30d06b42862fc5e8704e109db652d62f86f8eabc))
- Update Fresco to v1.9.0, okhttp3 to v3.10.0 ([6b07602915](https://github.com/facebook/react-native/commit/6b07602915157f54c39adbf0f9746ac056ad2d13))
- Add tint color to inline icons ([e8e2a6e410](https://github.com/facebook/react-native/commit/e8e2a6e4102c1ba0ee3d068769e47fa61c160524))
- Fix antialiasing rounded background ([e4f88c66e3](https://github.com/facebook/react-native/commit/e4f88c66e300505d3c86329dacd84d84e8109837))
- `react-native link` will now replace '/' by '\_' when linking projects. If you previously linked scoped packages, they will get linked again. ([dbd47592a1](https://github.com/facebook/react-native/commit/dbd47592a18ed09ee6e94c79bed16d63be625af6))
- New project template now uses project-wide properties ([0a3055d98a](https://github.com/facebook/react-native/commit/0a3055d98a36e49746144e883edc7e20afec4fcb))

---

### Fixed: bugs that have been resolved

- `VirtualizedList` now accounts for `ListHeaderComponent` length when calculating offset ([604bcfa4a8](https://github.com/facebook/react-native/commit/604bcfa4a83396c402ba8beaa13f40d05d6e9f5c))
- Prevent showing a hidden status bar when opening modals ([076b1cea35](https://github.com/facebook/react-native/commit/076b1cea3563cae30e11d63cc100ceaed9082692))
- Fix crash when reloading while Perf Monitor is enabled ([4fcd9970bd](https://github.com/facebook/react-native/commit/4fcd9970bd2dfb24890bc87e9c82e16dab71ec09))
- Fixed concurrency issue in remote debugger ([578b0b2a51](https://github.com/facebook/react-native/commit/578b0b2a51fc0c2aba5d27cdd5335396d5351463))
- Fix `Modal` + `FlatList` scrolling ([45b0907f61](https://github.com/facebook/react-native/commit/45b0907f619f455825f459838615a5a7cc59a204))
- Fix bug in `RCTNetworking` where not all tasks/handlers were being cleared during invalidation ([b805172034](https://github.com/facebook/react-native/commit/b8051720344f3716e964eaf7cfdd2a91dc703602))
- Fix keyboard handling with `keyboardShouldPersistTaps: never` ([ffe6c110f7](https://github.com/facebook/react-native/commit/ffe6c110f7ce33460fe0399ccbda16a6adbe90ca))
- Fix Responder Logic in `Text` ([e2ce22b823](https://github.com/facebook/react-native/commit/e2ce22b823661a7dcf6b70a825921a2910383bd1))
- Fix `VirtualizedSectionList` lint warnings ([26a1eba1ce](https://github.com/facebook/react-native/commit/26a1eba1cef853b0dab7aad5731699c06d36b781))
- Fix `VirtualizedSectionList:ItemWithSeparators` ([488a4c7e1c](https://github.com/facebook/react-native/commit/488a4c7e1c86ac5900ff9194106511fbf5a8e3cb))
- Fix `TextInput`'s initial layout measurements ([c6b4f9f2ce](https://github.com/facebook/react-native/commit/c6b4f9f2ce59bc757d9e211f46294faa03df55c6))
- Fix `requireNativeComponent` check ([1c90a2b47b](https://github.com/facebook/react-native/commit/1c90a2b47b420a4b6aa16a55a344cc08f0eacbe3))
- Fix `TextInput` autocapitalization bug ([ff70ecf868](https://github.com/facebook/react-native/commit/ff70ecf868cf12fc66b45dc1496391d0a1e9011f))
- Add missing events to `ViewPropTypes` ([41a940392c](https://github.com/facebook/react-native/commit/41a940392cea497bc5eb627b24083d0211d1eb89))
- Add missing Jest mock in `StatusBarManager` ([4a2c560768](https://github.com/facebook/react-native/commit/4a2c560768abb2d8407900fdb2fbe4971ae00a1c))
- Add Flow declaration for Metro module ([1853e15190](https://github.com/facebook/react-native/commit/1853e1519030caaeeb7f31017d98823aa5696daf))
- Fix type for `ReactNative.NativeComponent` (1/2) ([de11ba2a5e](https://github.com/facebook/react-native/commit/de11ba2a5ee90929dbc67d914de59bdd2ebc29ca))
- Fix type for `ReactNative.NativeComponent` (2/2) ([752863629d](https://github.com/facebook/react-native/commit/752863629d63bca6d96a101bfeccc4e7ad3e953e))
- Move Image PropTypes to new file ([67656991b3](https://github.com/facebook/react-native/commit/67656991b32075e8b4a99c6409b0a131206c6941))
- Tests: Fix JUnit report location when running Jest ([85fc98d437](https://github.com/facebook/react-native/commit/85fc98d437c08cdec883a73161e120478737ba72))
- Tests: Fix ReactImagePropertyTest SoLoader failures (#19607) ([a52d84d7e1](https://github.com/facebook/react-native/commit/a52d84d7e1cdb287f2877c4d85f2e9866c248d43))
- Tests: Fix jest snapshot testing on Windows ([216bce3163](https://github.com/facebook/react-native/commit/216bce31632480ce70cc03b1b2a57ec12440afd7))
- Fixes "Cannot resolve module" errors in new `react-native init` projects ([843a433e87](https://github.com/facebook/react-native/commit/843a433e87b0ccaa64ab70d07e22bffbabad8045))
- Haste hotfix for `react-native-windows` ([54942746d4](https://github.com/facebook/react-native/commit/54942746d4037e1153e14fcfc95e4edc772d296a))

#### iOS specific fixes

- Fix undefined_arch error in Xcode 10 beta - e131fff
- Make `react-native run-ios` command play nicely with multiple Xcode versions ([a130239257](https://github.com/facebook/react-native/commit/a1302392577789faab79dad0cb39b147464e0e42))
- Correct fishhook import ([75a0273de2](https://github.com/facebook/react-native/commit/75a0273de21948b0b959263100f09111f738ec35))
- Fix bug where a Backspace event was emitted when entering characters after clearing a text in `TextInput` by an empty string ([1ffb2b63be](https://github.com/facebook/react-native/commit/1ffb2b63be4c4af331fece0b4286e5c92b1e575d))
- Expose `InputAccessoryView` so it can be imported ([80fc415cf1](https://github.com/facebook/react-native/commit/80fc415cf179ffe26d020bc8d6e4451352da94fd))
- Fix `InputAccessoryView` safe area conformance ([490f22ae72](https://github.com/facebook/react-native/commit/490f22ae72ba43fa9364ce0f6c238744c07ac830))
- Fix use of C++ syntax in header file ([bfcfe7961d](https://github.com/facebook/react-native/commit/bfcfe7961db0970e2575eafe2f3c9c668bd8940d))
- Fix install step when running `run-ios` ([0934c1778f](https://github.com/facebook/react-native/commit/0934c1778f0e3c0b691e1a3ca2df1d486eb905dd))
- Fix `run-ios` not turning on Simulator ([9736ddc061](https://github.com/facebook/react-native/commit/9736ddc061e9c4291df8a3185c7f9d6f73e435c7))
- Use correct library reference for Fishhook. This fixes the build for the new Xcode build system, on both Xcode 9 and Xcode 10 ([a8b74576da](https://github.com/facebook/react-native/commit/a8b74576da6f1a42fde4e39f97e88c8f45a3a51d))
- Add missing `onChange` event definition to `DatePickerIOS` ([3b53091869](https://github.com/facebook/react-native/commit/3b53091869b673ea33a4af34242e2227ca944768))
- Fix crash during Archive phase on Xcode 9.3 ([344c205070](https://github.com/facebook/react-native/commit/344c205070d5ad670c97984dd86ec9ac13c73f81))
- `RNTesterPods`: Add missing folly include ([128c9343c4](https://github.com/facebook/react-native/commit/128c9343c464f3e7898d6e245f135f8bdf6caa6a))
- `RNTesterPods`: folly::Optional's `has_value()` to `hasValue()` until folly is upgraded ([128c9343c4](https://github.com/facebook/react-native/commit/128c9343c464f3e7898d6e245f135f8bdf6caa6a))
- `RNTesterPods`: Fix import for `RCTTestAttributes.h` ([128c9343c4](https://github.com/facebook/react-native/commit/128c9343c464f3e7898d6e245f135f8bdf6caa6a))
- `RNTesterPods`: Fix `conversions.h` to use namespaced includes ([128c9343c4](https://github.com/facebook/react-native/commit/128c9343c464f3e7898d6e245f135f8bdf6caa6a))
- Fix or mark enum conversions surfaced by `-Wenum-conversion` ([b8f30db0ae](https://github.com/facebook/react-native/commit/b8f30db0ae21d5f96547702abbf50aefa93b1094))
- Fix CocoaPods integration without DevSupport subspec ([c09d509c2b](https://github.com/facebook/react-native/commit/c09d509c2b8a5a02701829e1f0ace8081ce64277))
- Update Yoga to handle being in a Xcode framework project ([cf036dbc7a](https://github.com/facebook/react-native/commit/cf036dbc7af16a8453c115372694dc51e8086fcf))
- Fix Blob memory leak ([122b3791ed](https://github.com/facebook/react-native/commit/122b3791ede095345f44666691aa9ce5aa7f725a))
- Avoid double reload event when reloading JS ([7b9b1559a7](https://github.com/facebook/react-native/commit/7b9b1559a7f6719c3c9ad8e894fcdd99ed109afe))
- Suppress spurious warning about RCTCxxModule ([569061dd83](https://github.com/facebook/react-native/commit/569061dd8384a86cd27719b8b068360d8379f4c3))

#### Android specific fixes

- Fix extreme `TextInput` slowness on Android ([5017b86b52](https://github.com/facebook/react-native/commit/5017b86b525e3ef6023f0f8a88e6fd1cf98024e0))
- Correct draw path dimensions while doing even border, fixes blurred borders ([c5ca26a0e5](https://github.com/facebook/react-native/commit/c5ca26a0e5c0660196300ee34d6007c63879611f))
- Don't pass additional arguments to `requireNativeComponent` in `.android.js` files ([a51e8b19cc](https://github.com/facebook/react-native/commit/a51e8b19cc4dc36dee42ac95278b883c06b2e40f))
- Prevent `RefreshControl` from getting stuck when a parent is scrolled horizontally ([33ffa79a51](https://github.com/facebook/react-native/commit/33ffa79a51d4db9ba69148861f2da304646175cd))
- Prevent crash due to unsupported ellipsize mode ([85e33aaf90](https://github.com/facebook/react-native/commit/85e33aaf908996e99220bff4a2bdbbdf7c0d12b0))
- Fix okhttp3 response handling in `DevServerHelper` ([56d48bd9ec](https://github.com/facebook/react-native/commit/56d48bd9ecd2d0f08625259121312531064a09f2))
- Fix `ReactInstanceManager` unmountApplication to support `ReactRootView` recycling ([4a9b2a7302](https://github.com/facebook/react-native/commit/4a9b2a73021fb547febe1fa193c3effb7ff8da4e))
- Fix `NullPointerException` when emitting event using `UIManagerModule` ([291c01f4ff](https://github.com/facebook/react-native/commit/291c01f4ffe614760852e36b05d78b42cb4271df))
- Fix link to Android build guide ([57e7556b8d](https://github.com/facebook/react-native/commit/57e7556b8db61e5fcc3ccea56c1b163b82a091a6))
- Fix Android open source test failures ([3e0ebc7663](https://github.com/facebook/react-native/commit/3e0ebc76632238f21c60caa92c7a2b5ee8102b71))
- Fix view indices with LayoutAnimation ([05b75b9ebf](https://github.com/facebook/react-native/commit/05b75b9ebfa3ce6d67b2a3aee446ff0cd515311b))
- Fix originalNode memory leak ([8102e35271](https://github.com/facebook/react-native/commit/8102e35271ab68e0525a9c60d86a855bbeef9c1a))
- Fix `ScrollView` with a `TextInput` ([2f1421dec7](https://github.com/facebook/react-native/commit/2f1421dec7cd3a35779caceac108e872033c7d72))
- Disable onKeyPRess logic when handler not defined ([41975f75d9](https://github.com/facebook/react-native/commit/41975f75d96ef4b606b4618461bf24d5db063b77))
- fix permission requests on pre-M android ([4e1abdd74d](https://github.com/facebook/react-native/commit/4e1abdd74dc4127a86d62e7750d01d39bb781c08))

---

### Removed: features that have been removed; these are breaking

- Deprecate `focusTextInput` and `blurTextInput` ([ce3b7b8204](https://github.com/facebook/react-native/commit/ce3b7b8204dad0fd62a76a0ce66472eca4b25bc8))
- _[BREAKING]_ `ImageResizeMode` on `Image` is no longer exposed; check your usage of `resizeMode`; the same resize modes exist, but pass them as strings instead ([870775ee73](https://github.com/facebook/react-native/commit/870775ee738e9405c6545500f9a637df9b513a02) by [@TheSavior](https://github.com/TheSavior))

#### Android specific removals

- Remove native extensions ([7c5845a5a2](https://github.com/facebook/react-native/commit/7c5845a5a26592598c9380df078766a680a23f06))
- Remove Fresco ProGuard rules ([07df36557c](https://github.com/facebook/react-native/commit/07df36557c8cbbaee5e870460162aa725a606ff4))

#### iOS specific removals

- Disallow nesting of `<View>` within `<Text>` (e.g. `<Text><View /></Text>`) ([6a1b41643a](https://github.com/facebook/react-native/commit/6a1b41643a5f5035c61a96263220d11d3462e8f2)
- Removed deprecated `UIActionSheetDelegate` methods ([5863b564f8](https://github.com/facebook/react-native/commit/5863b564f84b9fe97b256f8cde0f7f2e1db9b641))

---

### Known issues

During the RC testing of this version, a few issues that have been opened don't have yet a finalized solution ( [19827](https://github.com/facebook/react-native/issues/19827), [19763](https://github.com/facebook/react-native/issues/19763), [19859](https://github.com/facebook/react-native/issues/19859), [19955](https://github.com/facebook/react-native/issues/19955) ). We are aware of them and we hope that by releasing 0.56.0 the surface of developers interacting to find solutions to them will allow for faster resolution and an even better 0.56.1 release. So please check the already opened issues before submitting new ones.

If you are using Windows to develop React Native apps, we suggest you keep an eye on [this issue in particular](https://github.com/facebook/react-native/issues/19953) since there have been many reports of issues related to Win 10 and RN 0.56.

## v0.55.0

Welcome to the March 2018 release of React Native ! Over 81 contributors made 247 commits since February. Thanks for another exciting release.

Here are a few highlights:

- React Native is now using the MIT license
- Android TV device support

[![RNAndroidTVDemo](http://img.youtube.com/vi/EzIQErHhY20/0.jpg)](http://www.youtube.com/watch?v=EzIQErHhY20)

- Animated tracking with native driver - check out the [silky smooth framerate](https://t.co/dE1KST1i3g)
- Lots of Flow improvements
- Bugfixes

### Added: new features

- Added support for animated tracking to native driver. Now you can use `useNativeDriver` flag with animations that track other `Animated.Values` ([b48f7e5605](https://github.com/facebook/react-native/commit/b48f7e560545d53db7c906ced51a91c4cce6ee94) by [@kmagiera](https://github.com/kmagiera))
- There's a new UTFSequence module in the library for common Unicode sequences (Emoji!) ([54870e0c6c](https://github.com/facebook/react-native/commit/54870e0c6ca8611fed775e5ba12a0d6d9b1cdbd7) and [4761d5a83e](https://github.com/facebook/react-native/commit/4761d5a83e707e0ed651f02a9e02fc5d66b1869a) by [@sahrens](https://github.com/sahrens))
- Added `contextMenuHidden` property for **TextInput** ([2dd2529b3a](https://github.com/facebook/react-native/commit/2dd2529b3ab3ace39136a6e24c09f80ae421a17e) by [@amhinson](https://github.com/amhinson))
- Add `testOnly_pressed` to **TouchableHighlight** for snapshot tests ([3756d41de1](https://github.com/facebook/react-native/commit/3756d41de1feb167482f01b26f9a5f2563ef8bff) by [@sahrens](https://github.com/sahrens))

#### Android specific additions

- Added support for Android TV devices ([b7bb2e5745](https://github.com/facebook/react-native/commit/b7bb2e5745f2bdbfeeccef8d97d469730942e01c) by [@krzysztofciombor](https://github.com/krzysztofciombor))
- Implemented style `letterSpacing` for **Text** and **TextInput** ([5898817fc1](https://github.com/facebook/react-native/commit/5898817fc1a66bd317d65ce96520159df2f96045) by [@motiz88](https://github.com/motiz88))
- Bundle download progress is now shown [d06e143420](https://github.com/facebook/react-native/commit/d06e143420462344ea6fc21c0446db972f747404) by [@janicduplessis](https://github.com/janicduplessis))
- **AndroidInfoModule** now also returns Android ID ([216c8ec04b](https://github.com/facebook/react-native/commit/216c8ec04b22704f722ecaac4718157af4434a0c) by [@L33tcodex0r](https://github.com/L33tcodex0r))

#### iOS specific additions

- Introducing **InputAccessoryView**, "a component which enables customization of the keyboard input accessory view" ([38197c8230](https://github.com/facebook/react-native/commit/38197c8230657d567170cdaf8ff4bbb4aee732b8), [84ef7bc372](https://github.com/facebook/react-native/commit/84ef7bc372ad870127b3e1fb8c13399fe09ecd4d), and [6d9fe455dc](https://github.com/facebook/react-native/commit/6d9fe455dc815cdce86c00f81c71c9ca0c724964) by [@PeteTheHeat](https://github.com/PeteTheHeat))
- `base-line` metric exposure for **Text** and **TextInput** ([51b3529f6c](https://github.com/facebook/react-native/commit/51b3529f6c2ca354800c0cf6ecb8eb3115eaa36e), [0dbe18375e](https://github.com/facebook/react-native/commit/0dbe18375ebb712be8bebd3b6592170f90f8b7bc), and [7630a614e4](https://github.com/facebook/react-native/commit/7630a614e4bd56c1a3ac728e1dfafd114340f2b7) by [@shergin](https://github.com/shergin))
- **DatePickerIOS** now has `initialDate` prop ([446ce49e9b](https://github.com/facebook/react-native/commit/446ce49e9b097d2a5e95b0f17aa23756733c27ec))
- Expose version via `RCTVersion.h`'s `RCTGetReactNativeVersion()` ([30469ed001](https://github.com/facebook/react-native/commit/30469ed00170a74743d2ba5aadce61aae742715c) by [@LeoNatan](https://github.com/LeoNatan))
- Allow running multiple simulators simultaneously with `react-native run-ios --simulator ...` ([2ad34075f1](https://github.com/facebook/react-native/commit/2ad34075f1d048bebb08ef30799ac0d081073150) by [@koenpunt](https://github.com/koenpunt))
- Introduced **RCTSurfaceHostingProxyRootView** for migration to **RCTSurfaceHostingView** ([34b8876ac6](https://github.com/facebook/react-native/commit/34b8876ac6510398e03a03c94f4ffb9aaa7519d3) by [@fkgozali](https://github.com/fkgozali))
- New UIManager API allowing intercept/delay mounting process ([402ae2f01f](https://github.com/facebook/react-native/commit/402ae2f01fd91051be5b717b0578e18b863854af) and [b90c1cf6c3](https://github.com/facebook/react-native/commit/b90c1cf6c30454859579278be18ac650c66f516b) by [@shergin](https://github.com/shergin))

### Changes: existing functionality that is now different

- React Native has now adopted the MIT license ([1490ab12ef](https://github.com/facebook/react-native/commit/1490ab12ef156bf3201882eeabfcac18a1210352) and [26684cf3ad](https://github.com/facebook/react-native/commit/26684cf3adf4094eb6c405d345a75bf8c7c0bf88) by [@sophiebits](https://github.com/sophiebits))
- The HelloWorld template now exclude `*.jsbundle` files from Git ([21231084db](https://github.com/facebook/react-native/commit/21231084dbccc8abe7823d4444a7e772c08e3e72) by [@aneophyte](https://github.com/aneophyte))
- `react-native-git-upgrade` now shows files merged with conflicts in red ([e53a8f7097](https://github.com/facebook/react-native/commit/e53a8f7097965f38d87eade1407661bc63adc68e) by [@alvinthen](https://github.com/alvinthen))
- `ResolvedAssetSource` type to have all read-only members ([4d0ee37293](https://github.com/facebook/react-native/commit/4d0ee37293b5e21fc3c7a8c6edd72c9ff899df7d) by [@sahrens](https://github.com/sahrens))
- Flow types improvements ([b6c7e551a9](https://github.com/facebook/react-native/commit/b6c7e551a91c406884cbbe8ee37c0038a1b7f0be), [b98bf1e097](https://github.com/facebook/react-native/commit/b98bf1e09739860d82e37225f1635bba3bc817b3), [80c18395e2](https://github.com/facebook/react-native/commit/80c18395e24760cd12b69592a10037f071255437), [70a3ececc3](https://github.com/facebook/react-native/commit/70a3ececc368a8d0fe4b57b13ac956ad99a637c7), [f7343576fc](https://github.com/facebook/react-native/commit/f7343576fc2ca941b03145d9e97208bcbc8c345b), [a817c64043](https://github.com/facebook/react-native/commit/a817c6404338b7b15aaeac5693ae3635a0a3dde0), [3fd82d3c89](https://github.com/facebook/react-native/commit/3fd82d3c89f2d7e5103b024b54250f2ded970d88), [cd8128b2ec](https://github.com/facebook/react-native/commit/cd8128b2eccf6898cdf798a1e1be1f7a5762a0d4), [5035af80ec](https://github.com/facebook/react-native/commit/5035af80ecddb44e2a8444780f25f336b760bf32), [26734a8473](https://github.com/facebook/react-native/commit/26734a8473ac2f5715f2b7a016f0cc8a15c6f073), [321ba067a8](https://github.com/facebook/react-native/commit/321ba067a8323c80262e51c94a931199d5ff5cd7), [b6b80f6a70](https://github.com/facebook/react-native/commit/b6b80f6a70c6d790c52b58453fefc2cea6cd06fe), [f1316cab6c](https://github.com/facebook/react-native/commit/f1316cab6c351852ef1da9939d4c8f0244fb8a6f), [2520c645f8](https://github.com/facebook/react-native/commit/2520c645f863c299e8dccb844bac3dc6a9d553e0), [214da52fe7](https://github.com/facebook/react-native/commit/214da52fe76c1688d0c1a402b3e6c4d0fc19d882), [dbdf43b428](https://github.com/facebook/react-native/commit/dbdf43b428da19a9eba012753904bcf33339ea9a), [49396aa78d](https://github.com/facebook/react-native/commit/49396aa78d218625c1933fa864acd70853faa9f9), [4895c645ea](https://github.com/facebook/react-native/commit/4895c645ea17ff939811f3d5ec6218cd4e31c5fb), [a3c07c95ef](https://github.com/facebook/react-native/commit/a3c07c95effd891c2bd5f3257efe5b24d85862be), [49ffc9fada](https://github.com/facebook/react-native/commit/49ffc9fada4266c3ba9751c5e8e4c475174c7e6c), and [c129457d3a](https://github.com/facebook/react-native/commit/c129457d3a6622d7c28e8b27829ffc2b0a03c5eb) by [@TheSavior](https://github.com/TheSavior), [@yungsters](https://github.com/yungsters), and [@alex288ms](https://github.com/alex288ms))
- Better enable cross-platform support of WebSocket.js ([b9be28915c](https://github.com/facebook/react-native/commit/b9be28915cf323eb36f1d7c77821cdf994954074) by [@rozele](https://github.com/rozele))
- Better error handling in the CLI around making directories ([d2817f48a1](https://github.com/facebook/react-native/commit/d2817f48a1146b469d544ee78015251551d358c3) by [@BridgeAR](https://github.com/BridgeAR))
- Verify that the component passed to createAnimatedComponent is not functional ([10b642a7af](https://github.com/facebook/react-native/commit/10b642a7af097bd508dab7b5d4723ccb4339d35f) by [@janicduplessis](https://github.com/janicduplessis))
- Don't truncate in the middle of an emoji ([9c8c597000](https://github.com/facebook/react-native/commit/9c8c5970002d048e8b18088f7c63b39431def50b) by [@Vince0613](https://github.com/Vince0613))
- Loosen Platform check to allow better code sharing for out-of-tree platforms ([84affbd6a3](https://github.com/facebook/react-native/commit/84affbd6a371dd865a3550b1fde1ebabee921341))
- In CLI, fix issue with `isInstalled` check for Android and references to unregister ([ec884890b1](https://github.com/facebook/react-native/commit/ec884890b1f40da42e84202e082b4cef2506bbfc) by [@rozele](https://github.com/rozele))

#### iOS specific changes

- tvOS `onPress` magnification animation now works via the `tvParallaxProperties` prop object taking `pressMagnification`, `pressDuration`, and `pressDelay` ([6c353fd7e9](https://github.com/facebook/react-native/commit/6c353fd7e9fd324717951ad62754d817537d7339) by [@JulienKode](https://github.com/JulienKode))

### Fixed: bugs that have been resolved

- In **TouchableOpacity**, trigger animation on `opacity` upon change in `disabled` prop ([9366ce416f](https://github.com/facebook/react-native/commit/9366ce416fbf015e4795987d39a65199b1b335c2) by [@maxkomarychev](https://github.com/maxkomarychev))
- Fixed an issue encountered when using `react-native-vector-icons` ([a759a44358](https://github.com/facebook/react-native/commit/a759a44358711180b37cf4ad25f28af47e3de298) and [54dc11a5fb](https://github.com/facebook/react-native/commit/54dc11a5fbafaccc9c0a781f1151225909717597) by [@jeanlauliac](https://github.com/jeanlauliac) and [@t4deu](https://github.com/t4deu)))
- Add missing mock for Jest for `removeEventListener` method ([59c7b2cfac](https://github.com/facebook/react-native/commit/59c7b2cfac534a79ff2461af5fd2034b280812a3) by [@MoOx](https://github.com/MoOx))
- Fix main size calculation from the aspect ratio ([f751c3460e](https://github.com/facebook/react-native/commit/f751c3460e5dc48c1f1a2d72a56173285899de21))
- Fix crash in Subscribable due to uglify-es ([b57a78c3de](https://github.com/facebook/react-native/commit/b57a78c3def50eda11e57542be0e5233a62d173b) by [@iMagdy](https://github.com/iMagdy))
- Update `node-notifier` dependency to fix memory leak ([860fcd458a](https://github.com/facebook/react-native/commit/860fcd458a1873ebcf977be01670be5912ae7104) by [@rickhanlonii](https://github.com/rickhanlonii))
- Fix issues with pollParams and link ([ca8ce83cc3](https://github.com/facebook/react-native/commit/ca8ce83cc3c38751604afce5a3e2f0473d9cba91) by [@grabbou](https://github.com/grabbou))

#### iOS specific fixes

- DevLoadingView now supports the iPhone X screen shape ([47b36d3ff0](https://github.com/facebook/react-native/commit/47b36d3ff0dbb99fd3fc98f6e981a38084dd4d2c) by [@mrtnrst](https://github.com/mrtnrst))
- Added bounds check to prevent ScrollView from scrolling to an offset which is out of bounds of the ScrollView ([16c9e5b715](https://github.com/facebook/react-native/commit/16c9e5b71500135a631480035af6cd2de3dafdc9) by [@siddhantsoni](https://github.com/siddhantsoni))
- **NetInfo** `isConnected` works again ([dbafc29e60](https://github.com/facebook/react-native/commit/dbafc29e60aba1d5b24c2b0d321834c40e0b9bca) by [@alburdette619](https://github.com/alburdette619))
- In **AlertIOS**, fix duplicate var name declaration ([6893a26bfb](https://github.com/facebook/react-native/commit/6893a26bfb06a2d8ad9d23a572f4d9143305d905))
- Permit `react-native run-ios --device [id]` by passing port when running on device ([f8fee0a631](https://github.com/facebook/react-native/commit/f8fee0a631d77313d7cb5e65a3dd04a5a8ba3d03) by [@jozan](https://github.com/jozan))
- Fixed issue with `run-ios` where `Entry, ":CFBundleIdentifier", Does Not Exist` was being received ([5447ca6707](https://github.com/facebook/react-native/commit/5447ca67076a110e2b0df03b014f53d1df4646ab) by [@blackneck](https://github.com/blackneck))
- Fixed problem in Text measurement on iOS ([a534672e13](https://github.com/facebook/react-native/commit/a534672e132136e7bbd17c94a7f4e67149bcc67a) by [@shergin](https://github.com/shergin))
- Fix crash when reloading in tvOS ([3a3d884df2](https://github.com/facebook/react-native/commit/3a3d884df253dbc1c02ffef33e99c4a91ea8751b) by [@dlowder-salesforce](https://github.com/dlowder-salesforce))
- Fixed a bug with positioning of nested views inside **Text** ([7d20de412b](https://github.com/facebook/react-native/commit/7d20de412b37a35951e615d98509573dc1a24bcb) by [@shergin](https://github.com/shergin))
- Fix blob response parsing for empty body ([f5207ba9c7](https://github.com/facebook/react-native/commit/f5207ba9c764f33ef83fa897f6014d67193be0e2) by [@janicduplessis](https://github.com/janicduplessis))
- Fix tvOS react-native init release build ([3002c4eb98](https://github.com/facebook/react-native/commit/3002c4eb981d439f0ea304556d8dbd4ffd62a80b) by [@dlowder-salesforce](https://github.com/dlowder-salesforce)
- Fix RedBox from bridge reload due is not re-registering its root view ([2e51fa5f5d](https://github.com/facebook/react-native/commit/2e51fa5f5d4f229329ae457ab1a77ba5bcea0448) by [@fkgozali](https://github.com/fkgozali))

#### Android specific fixes

- Fix: incorrect line-height calculation ([74e54cbcc4](https://github.com/facebook/react-native/commit/74e54cbcc408a8bbdd70f47cc8728d30cdc0d299) by [@strindhaug](https://github.com/strindhaug))
- Fix crashes with TextInput introduced in 0.53 ([b60a727adb](https://github.com/facebook/react-native/commit/b60a727adbcfa785e3d1b13bf069b766216e60f8) by [@joshyhargreaves](https://github.com/joshyhargreaves))
- Update ReactAndroid build script to support gradle 2.3.0 ([d8bb990abc](https://github.com/facebook/react-native/commit/d8bb990abc226e778e2f32c2de3c6661c0aa64e5))
- Allow "unexpected URL" exception to be caught on Android when using fetch ([da84eba318](https://github.com/facebook/react-native/commit/da84eba318ae69fea28f40418178bdeb35c4a99b) by [@jcurtis](https://github.com/jcurtis))
- Fix `onLayout` prop for **TextInput** ([8a073c1d8b](https://github.com/facebook/react-native/commit/8a073c1d8b89305a9a2561a7c33740919730f408) by [@rozele](https://github.com/rozele))
- Fix ViewPager when using native navigation ([a1295e1707](https://github.com/facebook/react-native/commit/a1295e1707a856b9cd5c3129320d386aa9166310) by [@ruiaraujo](https://github.com/ruiaraujo))
- Fix localization crash in **DevSettingsActivity** ([427e464bb9](https://github.com/facebook/react-native/commit/427e464bb95e4e0ecc7455e71b5d477014618200) by [@ayc1](https://github.com/ayc1))
- Fix pinch crash in touch-responsive views ([67c3ad4e6a](https://github.com/facebook/react-native/commit/67c3ad4e6a1847cbac43115b01f72cc5c8932a61) by [@tobycox](https://github.com/tobycox))
- Fix IllegalStateException thrown in looped timing native animation ([ef9d1fba23](https://github.com/facebook/react-native/commit/ef9d1fba237c08a158c8f32e823f229921e7c052) by [@kmagiera](https://github.com/kmagiera))
- Workaround android-only js module resolution issue ([c20e0f94fe](https://github.com/facebook/react-native/commit/c20e0f94feb42a71633212114b42c62494fd4ff0) by [@fkgozali](https://github.com/fkgozali))
- Fix ReadableNativeMap.toHashMap() for nested maps and arrays ([15fa2250fd](https://github.com/facebook/react-native/commit/15fa2250fdd0865ce1d0c6ac13b817e7b2c7757a) by [@esamelson](https://github.com/esamelson))
- Fix Android Sanity Buck version check ([e0573225d5](https://github.com/facebook/react-native/commit/e0573225d5fe28e5ad61690eda3060289bdbf3a4) by [@hramos](https://github.com/hramos))
- Fixes the connection to Firestore by following whatwg.org's XMLHttpRequest send() method ([d52569c4a1](https://github.com/facebook/react-native/commit/d52569c4a1b6bd19792e4bda23e3a8c3ac4ad8df) by [@samsafay](https://github.com/samsafay))
- `invertStickyHeaders` can now be set from **SectionList** or **FlatList** ([dd479a9377](https://github.com/facebook/react-native/commit/dd479a93772c3a52561fc32ee84b25ce822a30fa) by [@dannycochran](https://github.com/dannycochran))

### Removed: features that have been removed; these are breaking

- Removed various types ([b58e377961](https://github.com/facebook/react-native/commit/b58e377961ddd278bfa36df0e15953f976875de6), [ee26d9bcb0](https://github.com/facebook/react-native/commit/ee26d9bcb0719246efa51af404aa7805404675cc), [d89517d60a](https://github.com/facebook/react-native/commit/d89517d60a8a6cabc9013b603fa3f63a1face6a2), [852084ad45](https://github.com/facebook/react-native/commit/852084ad454565bb856e85f09e098f1a4a0771a6) by [@TheSavior](https://github.com/TheSavior))
- Deleted `Systrace.swizzleJSON()` ([3e141cb6c9](https://github.com/facebook/react-native/commit/3e141cb6c957143e998bf2926b8fe1aabccbce2d) by [@yungsters](https://github.com/yungsters))

#### Android specific removals

- `ReactInstanceManager#registerAdditionalPackages` has been removed; Create UIManager interface and extract common classes in uimanager/common ([6b45fb2cb1](https://github.com/facebook/react-native/commit/6b45fb2cb1ca44fa7375bc7696bf90a68a85df3c) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific removals

- Remove callFunctionSync experimental APIs ([19a4a7d3cb](https://github.com/facebook/react-native/commit/19a4a7d3cb6d00780ccbbbd7b0062896f64ab24d) by [@danzimm](https://github.com/danzimm))

## v0.54.0

Welcome to the February 2018 release of React Native! This release includes work done by the React Native team and the community in January, and there are some big changes here after the holidays. Thanks for 270 commits from 87 contributors, you all are great! Here are a few highlights from the release:

- Long awaited **Blob** changes: upload, download, fetch locally, and more
- Sticky headers now work on inverted Lists
- Update to the newest React, which deprecated some lifecycle methods and added new ones – expect Yellowbox until React Native is updated
- `Space-evenly` is now there (sorry for the confusion with 0.52's release notes)
- A lot of under-the-covers work on Yoga, iOS's **Text** and **TextInput**, and a ton of other areas
- Multiple crash fixes

The changelog is arranged by the customary added, removed, changed, and fixed plus internal; the changes are also organized by platform.

### Added

- ✨ **Blob**s now can be: made from Strings, loaded by File using a FileReader API, uploaded and downloaded via `XMLHttpRequest#fetch`, and fetched on files to a local blob consistently ([be56a3efee](https://github.com/facebook/react-native/commit/be56a3efeefefa6dca816ca5149a3dabfa5164e2) and [854c2330eb](https://github.com/facebook/react-native/commit/854c2330ebe748eb0508bb788685232b6cff0022) by [@satya164](https://github.com/satya164) and [@fkgozali](https://github.com/fkgozali))
- Dynamic node_module dependencies are now supported ([b5e19adc02](https://github.com/facebook/react-native/commit/b5e19adc02a3293cd3fdbe54cc45adc78f94d325) by [@jeanlauliac](https://github.com/jeanlauliac))
- Support sticky headers for inverted Lists with `invertStickyHeaders` ([ecaca80d42](https://github.com/facebook/react-native/commit/ecaca80d42b686e4cf91aa4bb0c8fce69eba18bb) by [@janicduplessis](https://github.com/janicduplessis))
- `space-evenly` is now supported (sorry for the confusion with 0.52 notes) ([b1cdb7d553](https://github.com/facebook/react-native/commit/b1cdb7d553146160f99319f9dbe4083b18db60e4) by [@gedeagas](https://github.com/gedeagas))
- Platform plugins can participate in RNConfig, `link`, and `unlink` – keep an eye on [react-native-window's use of it](https://github.com/Microsoft/react-native-windows/pull/1601)! ([a40bfa730e](https://github.com/facebook/react-native/commit/a40bfa730e05c68da49e6f217ae0f161dcc7ba98) by [@rozele](https://github.com/rozele))
- Add `minify` flag to react-native bundle command ([3f969cb1db](https://github.com/facebook/react-native/commit/3f969cb1db3a39dd8a4fd622abbb7e4270a84216) by [@tomduncalf](https://github.com/tomduncalf))

#### VR Specific Additions

- Added **ScrollView** support ([6fa039dab0](https://github.com/facebook/react-native/commit/6fa039dab0b9f738a3cb464aeca378c6210a5747) by [@MartinSherburn](https://github.com/MartinSherburn))

#### Android Specific Additions

- Bundle download progress is now shown like iOS ([d06e143420](https://github.com/facebook/react-native/commit/d06e143420462344ea6fc21c0446db972f747404) by [@janicduplessis](https://github.com/janicduplessis))
- Add back ability to customise OkHttp client ([22efd95be1](https://github.com/facebook/react-native/commit/22efd95be1f0b236eeaaa8a8e6d01e89771c9543) by [@cdlewis](https://github.com/cdlewis))

#### iOS specific additions

- **ScrollView** now supports smooth bi-directional content loading and takes new prop `maintainVisibleContentPosition` ([cae7179c94](https://github.com/facebook/react-native/commit/cae7179c9459f12b1cb5e1a1d998a9dc45f927dc) and [65184ec6b0](https://github.com/facebook/react-native/commit/65184ec6b0ef2d136c0db239d65e0624efac8a2d) by [@sahrens](https://github.com/sahrens))
- Allow substituting a default font handler ([a9c684a0ff](https://github.com/facebook/react-native/commit/a9c684a0ff45852087310d5218062acfdab673f7) by [@mmmulani](https://github.com/mmmulani))
- Add `accessibilityElementsHidden` prop ([31288161e1](https://github.com/facebook/react-native/commit/31288161e188723456fdb336c494f3c8a3f5b0a8) by [@aputinski](https://github.com/aputinski))
- Add EXTRA_PACKAGER_ARGS extensibility point on `scripts/react-native-xcode.sh` (PR rev [0d4ff1b7ea](https://github.com/facebook/react-native/commit/0d4ff1b7ea768cceca0405c665e322c0d6b5ba20) by [@brunolemos](https://github.com/brunolemos) with landing assists [b8c86b8dec](https://github.com/facebook/react-native/commit/b8c86b8deced01027b609959576ffcf5d2d0f520) and [0d4ff1b7ea](https://github.com/facebook/react-native/commit/0d4ff1b7ea768cceca0405c665e322c0d6b5ba20))

### Removed

- Remove internal `utf8` utility - use the **utf8** package now instead ([431670f908](https://github.com/facebook/react-native/commit/431670f90860936c24260d36fc73e0c5fbf4e02a) by [@mathiasbynens](https://github.com/mathiasbynens))

#### iOS specific removals

- Removed outdated assertion in RCTShadowView related to breaking change in Yoga ([e3ff3cf6cb](https://github.com/facebook/react-native/commit/e3ff3cf6cbc137e315eff6ac8aed43954b3668eb) by [@shergin](https://github.com/shergin))

#### Android specific removals

- Fix an issue when swapping to and from the `visible-password` or `phone-pad` keyboard types. ([164f6b6afd](https://github.com/facebook/react-native/commit/164f6b6afd7e0050d63134fcdc65ec6969ab03a0) by [@BrandonWilliamsCS](https://github.com/BrandonWilliamsCS))
- Remove redundant config in AndroidManifest.xml ([d7a9ca2893](https://github.com/facebook/react-native/commit/d7a9ca2893fb240c25d1cd1e0778f6b93b1e3ded) by [@gengjiawen](https://github.com/gengjiawen))

#### iOS specific removals

- Delete RCTBatchedBridge ([816d417189](https://github.com/facebook/react-native/commit/816d41718998868f276d83b0c21e17d11ad392a2) by [@mhorowitz](https://github.com/mhorowitz))

### Changed

- Docs clarifications ([7abffc3f8c](https://github.com/facebook/react-native/commit/7abffc3f8ce69fab5bbb4147f9b8bcb85a7d2c38) by [@IgorGanapolsky](https://github.com/IgorGanapolsky))

#### iOS Specific Changes

- ⚡️ **Text** and **TextInput** have been re-implemented from the ground up for performance, flexibility, and reduced technical debt ([2716f53220](https://github.com/facebook/react-native/commit/2716f53220f947c690d5f627286aad51313256a0), [74963eb945](https://github.com/facebook/react-native/commit/74963eb945438a6fd269b5764a6cb251c86deda8), [d7fa81f181](https://github.com/facebook/react-native/commit/d7fa81f18110f0dc0f310a5c066d9a30020ca830), [74963eb945](https://github.com/facebook/react-native/commit/74963eb945438a6fd269b5764a6cb251c86deda8), [6c4ef287ad](https://github.com/facebook/react-native/commit/6c4ef287ad95eb14475a9f512487e5d05949309a), [ebc98840e9](https://github.com/facebook/react-native/commit/ebc98840e93c336e8c9e4a93c78e6ca03591f0ec), [d7fa81f181](https://github.com/facebook/react-native/commit/d7fa81f18110f0dc0f310a5c066d9a30020ca830), [7d1ec7a3dc](https://github.com/facebook/react-native/commit/7d1ec7a3dc66654b13a8e9cb3ddf912e92506f55), [52648326e6](https://github.com/facebook/react-native/commit/52648326e6ac4470eeffc0a56d91bc487bc1eae4), [6bb8617f3a](https://github.com/facebook/react-native/commit/6bb8617f3a2f3f80f89eb00595a621aec35aca83), [5dbb3c586c](https://github.com/facebook/react-native/commit/5dbb3c586c9e8483aa7e6f1edd35ffb12bd4305d), [7e7d00aebe](https://github.com/facebook/react-native/commit/7e7d00aebefd2416f948066c65c739581c6e3f54), [46fd864348](https://github.com/facebook/react-native/commit/46fd8643485b21147c780d22ee8cf751b2dc8750), [9dfa2e7f3c](https://github.com/facebook/react-native/commit/9dfa2e7f3cfa5009f6c54382e90681d99a9c3cb8), [8a882fe6d6](https://github.com/facebook/react-native/commit/8a882fe6d6bb35776551eb8b0cd6892f41cab492), and [0f9fc4b295](https://github.com/facebook/react-native/commit/0f9fc4b2953d52fa1754e786dc5c74bfecbeaaca) by [@shergin](https://github.com/shergin) and [@hovox](https://github.com/hovox))
- **Image**'s `resizeMode="center"` is now documented and has an example present ([be7037fd8e](https://github.com/facebook/react-native/commit/be7037fd8e1c4b92646caf7a70b9d6d28ef2c30a) by [@motiz88](https://github.com/motiz88))
- Geolocation API no longer timeouts when `skipPermissionRequests: true` ([5c17db8352](https://github.com/facebook/react-native/commit/5c17db8352abfd94f094deb9b550284ec17f1fcd) by [@ngandhy](https://github.com/ngandhy))
- Rounding pixels is now done with an algorithm from Yoga rather than React Native, reducing debt and improving performance ([ceb1d1ca5b](https://github.com/facebook/react-native/commit/ceb1d1ca5bc7c04b9d9ad16dcd9583f05b0ef498) and [114c258045](https://github.com/facebook/react-native/commit/114c258045ccca3a4433de206c7983b42d14c03b) by [@shergin](https://github.com/shergin))

#### Android specific changes

- Numerous refactors around bundle handling and the `DevServerHelper` ([644123aa6f](https://github.com/facebook/react-native/commit/644123aa6fc6132125f56b485e5ab3b16f28f666), [e756251413](https://github.com/facebook/react-native/commit/e7562514130f614a9f138c0b855bfe4516150add), [6e44356c9b](https://github.com/facebook/react-native/commit/6e44356c9bb364195280aafc69aae48cdcb2ab84), [1019bda930](https://github.com/facebook/react-native/commit/1019bda930fa4c26fc0006efa023ee2c586705c6), [06d8f96a64](https://github.com/facebook/react-native/commit/06d8f96a64f00a003e34b0c1e93033893173ccc8), [f88c9d6382](https://github.com/facebook/react-native/commit/f88c9d63828e975a9792969e27accd851ead3e86), and [108f9664bf](https://github.com/facebook/react-native/commit/108f9664bffd1a4e0a7b2c2da3dc3810f1b29de2) by [@davidaurelio](https://github.com/davidaurelio))

### Fixed

- Fix JS debugger issues related to CORS ([29f8354c19](https://github.com/facebook/react-native/commit/29f8354c1946a6325e9020b9ef5ee4ccdf0fa51f) by [@njbmartin](https://github.com/njbmartin))
- Keep the `.gitignore`d files during the `react-native-git-upgrade` process ([7492860ffb](https://github.com/facebook/react-native/commit/7492860ffb3a010ff2273abf45c7414c098bdc37) by [@ncuillery](https://github.com/ncuillery))
- Fix re-render case on SwipeableRow ([a580a44b0d](https://github.com/facebook/react-native/commit/a580a44b0d51ca7f33a4394b0a22d1c7d2234190))
- Fix display of syntax error messages when HMR is enabled ([2b80cdf1bb](https://github.com/facebook/react-native/commit/2b80cdf1bba3b756915117139474440c203cbd8d) by [@ide](https://github.com/ide))
- Add fixtures to metro blacklist in order to let build succeed ([54dc11a5fb](https://github.com/facebook/react-native/commit/54dc11a5fbafaccc9c0a781f1151225909717597) by [@t4deu](https://github.com/t4deu))

#### Android specific fixes

- Don't crash when using decimal `Animated.modulo` values with `useNativeDriver: true` ([6c38972327](https://github.com/facebook/react-native/commit/6c389723274712bc52d6642cc6c1907b5523726d) by [@motiz88](https://github.com/motiz88))
- Don't crash when receiving unknown websocket IDs ([1a790f8703](https://github.com/facebook/react-native/commit/1a790f8703d44c2322000dbf40a55678ca8a436a) by [@sunweiyang](https://github.com/sunweiyang))
- Dont crash when `NativeModules.UIManager.showPopupMenu` method calls error callback ([0c18ec5b9c](https://github.com/facebook/react-native/commit/0c18ec5b9c64613dbdcd4be9f80e470e9532483d) by [@dryganets](https://github.com/dryganets))
- Maintain cursor position when **TextInput**'s `secureTextEntry` changes ([09b43e479e](https://github.com/facebook/react-native/commit/09b43e479e97dfe31910503190b5d081c78e4ea2) by [@jainkuniya](https://github.com/jainkuniya))
- Race condition fix in Dialogs module ([d5e3f081c6](https://github.com/facebook/react-native/commit/d5e3f081c6b41697533775d378969fcf554c7290) by [@dryganets](https://github.com/dryganets))
- Fix NPE in Android Switch during measure ([7b1915e74d](https://github.com/facebook/react-native/commit/7b1915e74daa82d0a94e90ff266e9271bc43f4d8) by [@4ndroidev](https://github.com/4ndroidev))
- Fix initialScrollIndex ([ef596dec49](https://github.com/facebook/react-native/commit/ef596dec49975dd4f8860ad8adcd29dd23e04c14) by [@olegbl](https://github.com/olegbl))
- Fix redbox style ([f363dfe766](https://github.com/facebook/react-native/commit/f363dfe766244c8fc10eab3d2c4acdd8fc4b576b) by [@ayc1](https://github.com/ayc1))
- Fix crash due to mishandling of UTF-8 in progressive download. ([9024f56bda](https://github.com/facebook/react-native/commit/9024f56bda4186fbade7bbd1e61f8e0252585c02) by [@dryganets](https://github.com/dryganets))
- Fix crash because ClassCastException fix: getText() returns CharSequence not Spanned ([46cc4907e3](https://github.com/facebook/react-native/commit/46cc4907e3e49f5c7b1ac0a1088866f2958f43a1) by [@dryganets](https://github.com/dryganets))
- Fix and re-enable "view flattening" optimizations ([877f1cde2e](https://github.com/facebook/react-native/commit/877f1cde2ebe8f304d6fd0855fc4a874d1d5ee27) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific fixes

- Fix Crash when **CameraRoll** is getting assets from iCloud and no filename is provided ([2ae24361c5](https://github.com/facebook/react-native/commit/2ae24361c5e0fc4aed9a321123bba8ca416a35ff) by [@pentarex](https://github.com/pentarex))
- Fix Xcode Archive task failing if project path contains whitespace ([8aa568e867](https://github.com/facebook/react-native/commit/8aa568e867bbbe7e23ded3651f23581ff2753323) by [@jevakallio](https://github.com/jevakallio))
- `react-native link` has been fixed to correctly link iOS and tvOS targets ([a63fd378a4](https://github.com/facebook/react-native/commit/a63fd378a47173cc9f750e9980f18dc12dd7ea51) by [@dlowder-salesforce](https://github.com/dlowder-salesforce))
- `GLog` fix on case sensitive APFS macOS ([2fef1bafc8](https://github.com/facebook/react-native/commit/2fef1bafc8bee33432486212caf4fef5c659dd37) by [@hovox](https://github.com/hovox))
- Fixed issue where you cannot launch tvOS app on Apple TV simulator ([afd988f85a](https://github.com/facebook/react-native/commit/afd988f85a8cf0980b5844cb88c1803e41502d03))

### Internal work

- A **massive** amount of Yoga optimizations, cleanups, refactors, and test fixes ([62d01006a1](https://github.com/facebook/react-native/commit/62d01006a125517c8991fa93979aaec6ccc18823), [1475fc4856](https://github.com/facebook/react-native/commit/1475fc4856d366f8ec2027374971ed5aefcdeafa), [9daa17458a](https://github.com/facebook/react-native/commit/9daa17458a5f4ab8ead4d7c29de331f08b1a4a46), [d4517ddb9f](https://github.com/facebook/react-native/commit/d4517ddb9f2ad6d6175cbe6a8be2b819e4aa2c29), [ca91f0e3ac](https://github.com/facebook/react-native/commit/ca91f0e3ac55cb1e7a0fa2399d594a47de80a100), [34b7ec82b5](https://github.com/facebook/react-native/commit/34b7ec82b5d22efbdaa8b74b930d3c4da87414ec), [fda861a889](https://github.com/facebook/react-native/commit/fda861a88914a008b94c12078c9e579a99929643), [9f7cedbe14](https://github.com/facebook/react-native/commit/9f7cedbe14321d24b7aee1ba969b3d23d5c9d204), [ac1c8c265e](https://github.com/facebook/react-native/commit/ac1c8c265e6030c52434f99e882639c67c8c175d), [fcf2c7cf61](https://github.com/facebook/react-native/commit/fcf2c7cf61ca454f10d398d57b78b5b29ed05ae2), [2b27f1aa19](https://github.com/facebook/react-native/commit/2b27f1aa1964eba749876100be1f3ac4c085fa8f), [210ae5b95a](https://github.com/facebook/react-native/commit/210ae5b95a9c94194e95a21fdb93f88ddfdc5ce2), [82088580ab](https://github.com/facebook/react-native/commit/82088580ab17417a51386722f98b83d6cad0a6a0), [7f94bff89a](https://github.com/facebook/react-native/commit/7f94bff89a09547e76b50ae4c96ec59de73a153a), [bd7bf94af9](https://github.com/facebook/react-native/commit/bd7bf94af9ddfc9221ac3f6f62821b7e53e9b0ea), [2fe65b032e](https://github.com/facebook/react-native/commit/2fe65b032e9ec3faf3cef31290372b9face2d3f1), [9658d9f82b](https://github.com/facebook/react-native/commit/9658d9f82ba536c2f39937d61b3954e3dcc6a54e), [ee5c91c031](https://github.com/facebook/react-native/commit/ee5c91c0317b0defbb8da21f7e6d8d3ac8967381), [64d530ba07](https://github.com/facebook/react-native/commit/64d530ba0785af21555d48ddc9e7d561af37db4c), [400a29e151](https://github.com/facebook/react-native/commit/400a29e15134f5264cc55b239bd2a18a107911dd), [f75e21f1ca](https://github.com/facebook/react-native/commit/f75e21f1caf9117ae3eda31c23e286116ebf586c), [528bbacf6b](https://github.com/facebook/react-native/commit/528bbacf6b8a5a62faf4db5bfc8dfe063f0b82a3), [be8e7c6e65](https://github.com/facebook/react-native/commit/be8e7c6e65724d4915862098238506172dbe9657), [d0f7d4d107](https://github.com/facebook/react-native/commit/d0f7d4d107a90fdfbf795d842f4bd4a81290ec62), [4b4959a21c](https://github.com/facebook/react-native/commit/4b4959a21cb1e9e356eab51bfba0f16b76e8ec7f), [fdef3784f0](https://github.com/facebook/react-native/commit/fdef3784f00e8c3233a30aa2e35aaaadaa867489), [831a1bb4b1](https://github.com/facebook/react-native/commit/831a1bb4b1cc201b53685874a9dbdd6c3c1615ad), [2a22d998f8](https://github.com/facebook/react-native/commit/2a22d998f8a7f896db6c0708ba92ed9c9082ee7c), [9f57dedc17](https://github.com/facebook/react-native/commit/9f57dedc1712733ce4a490121138a97917fd3a52), and [ff2658c3de](https://github.com/facebook/react-native/commit/ff2658c3de111ef745d9582c6863ab0d6c90f960) by [@priteshrnandgaonkar](https://github.com/priteshrnandgaonkar), [@passy](https://github.com/passy), [@ryu2](https://github.com/ryu2), and others)
- 🚧 Lifecycle methods were renamed to be consistent with [React RFC6](https://github.com/reactjs/rfcs/blob/master/text/0006-static-lifecycle-methods.md) – note that there are Yellowbox warnings right now because of this, it's work-in-progress ([6f007e8957](https://github.com/facebook/react-native/commit/6f007e8957c9bf5652b0184cba65f385050a8236) by [@bvaughn](https://github.com/bvaughn))
- Some autogenerated mystery string files were added ([c7846c4bfb](https://github.com/facebook/react-native/commit/c7846c4bfb5b944714d95382210f83c83da1ac52), [bb6fceac27](https://github.com/facebook/react-native/commit/bb6fceac274422102b347ec7aedb36efd9b701cd), [8bd00a2361](https://github.com/facebook/react-native/commit/8bd00a2361bb39f1bda58a260b7ffd278a05d79d), [faa9519021](https://github.com/facebook/react-native/commit/faa951902161201846f20a4dc55950e8f96cb0ff), [f49f7932d5](https://github.com/facebook/react-native/commit/f49f7932d581fe1f9569fb460196801528cfb591))
- Improvements to the cli's implementation ([1673c570f9](https://github.com/facebook/react-native/commit/1673c570f984d86e88a3b6b44eb78f4848eb0515), [752427b7b8](https://github.com/facebook/react-native/commit/752427b7b8221bbb8304a158b2dad12b26afd7a5), and [619a8c9f29](https://github.com/facebook/react-native/commit/619a8c9f298356db68f8cd7e5d25e5bcf48bab05) by [@arcanis](https://github.com/arcanis), [@voideanvalue](https://github.com/voideanvalue), and [@rozele](https://github.com/rozele))
- Measure touch events from nearest "root view" ([a70fdac5bd](https://github.com/facebook/react-native/commit/a70fdac5bdd4500b4ca3074dac26d414bd931fb9) by [@mmmulani](https://github.com/mmmulani))
- Allow to attach the HMR server to an external http server ([8c6b816caa](https://github.com/facebook/react-native/commit/8c6b816caa908845471460f453f9d761bfba3f3d) by [@rafeca](https://github.com/rafeca))
- Split folly/Memory out from headers-only targets in Buck ([b8e79a7e8b](https://github.com/facebook/react-native/commit/b8e79a7e8be1f3db1482a849352fda6e23c1c78a) by [@mzlee](https://github.com/mzlee))
- Code cleanup of **ReactHorizontalScrollView** in Android ([71ec85f24c](https://github.com/facebook/react-native/commit/71ec85f24c3a1007a9e1f036a140cce43b38019f) by [@mdvacca](https://github.com/mdvacca))
- Always create a debugger websocket connection when in iOS dev builds ([fa334ce464](https://github.com/facebook/react-native/commit/fa334ce464da39625f4e4fbfee259e9dcea31abc) by [@bnham](https://github.com/bnham))
- Make the React Native HMR client extend from the generic metro HMR client ([9a19867798](https://github.com/facebook/react-native/commit/9a198677989930971912b98487ec68d162636411) by [@rafeca](https://github.com/rafeca))
- Removed use of xip.io ([40a8434bde](https://github.com/facebook/react-native/commit/40a8434bde855ecae42408ec1240622152432de7) by [@jvranish](https://github.com/jvranish))
- Fix Buck dependencies ([cec2e80fc2](https://github.com/facebook/react-native/commit/cec2e80fc251e4ea45ce1e446323716a3792390d), [4f6c157250](https://github.com/facebook/react-native/commit/4f6c157250676f07619af2a935bddd8301b50caa) by [@swolchok](https://github.com/swolchok))
- Fix permissions on test script ([42c410ac84](https://github.com/facebook/react-native/commit/42c410ac84619a3d12a4619e59a0a526a3ebdca9) by [@mzlee](https://github.com/mzlee))
- Better handling exception in loadScript() ([3fbf7856d9](https://github.com/facebook/react-native/commit/3fbf7856d9acb0909357d6b315388471a6b5a69c))
- Fix ESLint upgrade "parsing error" ([9d214967d2](https://github.com/facebook/react-native/commit/9d214967d2c8184ce26addec150e392e3b519fcd) by [@zertosh](https://github.com/zertosh))
- Fixing 🤡 in RCTSurfaceRootShadowView ([5fba82deff](https://github.com/facebook/react-native/commit/5fba82deffde731176e3e118193c212f5d2c2bca) by [@shergin](https://github.com/shergin))
- Handle invalidation error in RCTObjcExecutor ([493f3e8da5](https://github.com/facebook/react-native/commit/493f3e8da5a112e1b33bfb3e9f51e7a2bd7edc7a) by [@fromcelticpark](https://github.com/fromcelticpark))
- Check for nullptr when accessing isInspectable method ([70d23e82ad](https://github.com/facebook/react-native/commit/70d23e82ad21a4cfde1ce7c3b1c00fe7c7d5adbd) by [@fromcelticpark](https://github.com/fromcelticpark))
- Introduce new Fabric API in RNAndroid ([2d35bde101](https://github.com/facebook/react-native/commit/2d35bde10130167018791c1b2fe4fece27cefddc) by [@mdvacca](https://github.com/mdvacca))
- Fixing Prepack model for latest global.nativeExtensions changes. ([01a58d182a](https://github.com/facebook/react-native/commit/01a58d182abd19c9e089ec38b08ffd4b45e2076c) by [@NTillmann](https://github.com/NTillmann))
- General code cleanup: unused code and configurations ([e233646d09](https://github.com/facebook/react-native/commit/e233646d095a272091b07c29fa87b206831ad6e3) and [e7010348d8](https://github.com/facebook/react-native/commit/e7010348d8b2f703fcc057c2914bd45ca6238f98) by [@bvaughn](https://github.com/bvaughn) and others)
- Add support for finding multiple views with NativeIds using a single listener to Android ([f5efc460ad](https://github.com/facebook/react-native/commit/f5efc460ad30cc60a62edd540c3b0f45c67bcda3) by [@axe-fb](https://github.com/axe-fb))
- Add CountingOutputStream ([a5e135aed6](https://github.com/facebook/react-native/commit/a5e135aed6941772c663adffd67729f7a5026d08) by [@hramos](https://github.com/hramos))
- Changes from Prettier ([b815eb59be](https://github.com/facebook/react-native/commit/b815eb59bef7bed9825027adc676b8d09db463c6), [e758cb7f39](https://github.com/facebook/react-native/commit/e758cb7f397b37b5621a4e0afcabc1c74443bc06), [bf9cabb03c](https://github.com/facebook/react-native/commit/bf9cabb03c7245930c270a19816545eae1b9007d), and [a5af841d25](https://github.com/facebook/react-native/commit/a5af841d259b6b29d95a9fb346a0ffce9c6efbfe) by [@shergin](https://github.com/shergin))
- Typos in code ([8ffc16c6e7](https://github.com/facebook/react-native/commit/8ffc16c6e7d25dd434ca3fc7f9ffd6d5917f7bcd) by [@ss18](https://github.com/ss18))
- Support for inherited events in view managers ([2afe7d4765](https://github.com/facebook/react-native/commit/2afe7d4765ffc0d0c71d233211edd1d21972040e) by [@shergin](https://github.com/shergin))
- Flow types changes ([3fc33bb54f](https://github.com/facebook/react-native/commit/3fc33bb54fc5dcf7ef696fe245addc320f85a269), [e485cde187](https://github.com/facebook/react-native/commit/e485cde187e4cd92bc821e58047b149a789dd713), [83ed9d170b](https://github.com/facebook/react-native/commit/83ed9d170b8fd750a345fc608ec69db2fe3ca9b2), [52ffa5d13e](https://github.com/facebook/react-native/commit/52ffa5d13ef6fe2752bc8f838dc1c2dfe651bb64), [d37cdd97ae](https://github.com/facebook/react-native/commit/d37cdd97aee4c1bac864cb28b686f2d1a128128e), [6e7fb01c02](https://github.com/facebook/react-native/commit/6e7fb01c02f3e91777c8292389c09a15d24cf800), [d99ba70c49](https://github.com/facebook/react-native/commit/d99ba70c492d3cd15ef6aded3f8712976d251f88), [bcfbdf4fbe](https://github.com/facebook/react-native/commit/bcfbdf4fbec1a05da151a2255f44a87b651965d6), and [a1c479fb3b](https://github.com/facebook/react-native/commit/a1c479fb3be674511131b46f856bc9b197a38cda) by [@alexeylang](https://github.com/alexeylang), [@sahrens](https://github.com/sahrens), [@yungsters](https://github.com/yungsters), and [@zjj010104](https://github.com/zjj010104))
- Give IInspector a virtual destructor for correct InspectorImpl destruction ([2a3c37f424](https://github.com/facebook/react-native/commit/2a3c37f424a4d1b9f4c5a2960a1cbe3517eac007) by [@toulouse](https://github.com/toulouse))
- Migrated `SourceCode` and `DeviceInfoModule` out of Native Modules ([47fe52380a](https://github.com/facebook/react-native/commit/47fe52380a232a1c364e21f71e2644a5a3348366) and [429fcc8cab](https://github.com/facebook/react-native/commit/429fcc8cab3ca877275d7deb1040fdff17a414c7))
- Jest config change as part of bringing back support for the `assetPlugin` option in Metro ([af6450c660](https://github.com/facebook/react-native/commit/af6450c660d3055d9c5c70d200471541a1ce7e12) by [@ide](https://github.com/ide))
- Nested virtualized lists should receive recordInteration events ([ae2d5b1e68](https://github.com/facebook/react-native/commit/ae2d5b1e68a2207c27ef2f1b533f86c86d6d849b))
- Upgrade connect dependency ([709ede799c](https://github.com/facebook/react-native/commit/709ede799cc9820acadaf22aa84f0fe6dd2be319) by [@rafeca](https://github.com/rafeca))
- xplat/js: asyncRequire: redirect async modules to control modules ([5e11b8870a](https://github.com/facebook/react-native/commit/5e11b8870aa855a56cfafa6575aed5e33b272065) by [@jeanlauliac](https://github.com/jeanlauliac))
- More progress towards split bundle support ([1a1a956831](https://github.com/facebook/react-native/commit/1a1a956831aec93a4fe2c6e2f63f558271fb466b) and [9e34cbda9d](https://github.com/facebook/react-native/commit/9e34cbda9de8f7350cfb02c884fbef2da18e0e3a) by [@fromcelticpark](https://github.com/fromcelticpark))
- Implement bundle sync status ([88980f2ef7](https://github.com/facebook/react-native/commit/88980f2ef7331aa630ff19e54427cdc3b7510869))
- Various improvements to RCTSurface and RCTShadowView ([7d9e902d72](https://github.com/facebook/react-native/commit/7d9e902d72e240f54ea01225cc3272698ff70014), [06ebaf2205](https://github.com/facebook/react-native/commit/06ebaf2205f979b6e6595ec7985447a07d25c4d4), [6882132421](https://github.com/facebook/react-native/commit/688213242130536c5d4db8b9aa17dc418372aadf), and [193a2bd4cd](https://github.com/facebook/react-native/commit/193a2bd4cdffbbc79b69c067b31420663dc9b03a) by [@shergin](https://github.com/shergin))
- Progress towards experimental ReactFabric and FabricUIManager ([b1e5c01483](https://github.com/facebook/react-native/commit/b1e5c01483a69b181c75d242231077cb2f96e846), [fa0ac92b2c](https://github.com/facebook/react-native/commit/fa0ac92b2c9cfc302314ff18325a96354bb1f432), [94dac23583](https://github.com/facebook/react-native/commit/94dac23583dc6b693475769c196c4b51954e74f1) by [@fkgozali](https://github.com/fkgozali))
- (almost) kill fbjsc ([702b7e877e](https://github.com/facebook/react-native/commit/702b7e877e09afede0dcdc7f8c680be63e942153) by [@michalgr](https://github.com/michalgr))
- Refactored bridge ReadableNativeMap and ReadableNativeArray to add centralized accesses ([7891805d22](https://github.com/facebook/react-native/commit/7891805d22e3fdc821961ff0ccc5c450c3d625c8), [28be33ac34](https://github.com/facebook/react-native/commit/28be33ac34d9214ffd452f88a4d19468683a6a0d), and [5649aed6d3](https://github.com/facebook/react-native/commit/5649aed6d3223ec49c42416f242249eb0c4fd890))
- Removed unused core from Image.android.js ([ce3146a6f3](https://github.com/facebook/react-native/commit/ce3146a6f3162141c7dc06d2c91ec291d3756a92) by [@shergin](https://github.com/shergin))
- Capture StackOverflowExceptions triggered when drawing a ReactViewGroup or ReactRootView and log more debugging information for it ([1aac962378](https://github.com/facebook/react-native/commit/1aac9623789e3d2a428b51ae699d4c340b3afb99) and [4d3519cc6a](https://github.com/facebook/react-native/commit/4d3519cc6af5bb33c6f21d9392b82379780d79dc) by [@mdvacca](https://github.com/mdvacca))
- `babel-preset-react-native`: only require plugins once ([df6c48cf36](https://github.com/facebook/react-native/commit/df6c48cf36d39a75a6196462d661ce75c6aef104) by [@davidaurelio](https://github.com/davidaurelio))
- Report module id as string and as double, in case of invalid values are passed to nativeRequire ([8f358a2088](https://github.com/facebook/react-native/commit/8f358a20881b61cf3256fa1e404b86d5f104932d) by [@fromcelticpark](https://github.com/fromcelticpark))
- More work moving build configurations to Skylark ([d3db764f38](https://github.com/facebook/react-native/commit/d3db764f383fc588a87e0d1e4267b310d6188bc8), [869866cc5c](https://github.com/facebook/react-native/commit/869866cc5c639d8c0257c776368381987a7f7159), [a8c95d2417](https://github.com/facebook/react-native/commit/a8c95d241757fefaa06ff49193975f7c103a6418), and [79a63d040f](https://github.com/facebook/react-native/commit/79a63d040f1346a0e320104fb35da405502aae19) by [@mzlee](https://github.com/mzlee), [@ttsugriy](https://github.com/ttsugriy), and others)
- `[RCTShadowView isHidden]` was removed ([c19bc79688](https://github.com/facebook/react-native/commit/c19bc7968855e85758df9e1a47dc2a52e69668ed) by [@shergin](https://github.com/shergin))
- Remove unused `packagerInstance` option and rename it to `server` ([bbbc18c4ee](https://github.com/facebook/react-native/commit/bbbc18c4ee9b13a5aeca10edcb29694db3f15769))
- The blog has moved to [react-native-website](https://github.com/facebook/react-native-website/tree/master/website/blog) ([e16d67340e](https://github.com/facebook/react-native/commit/e16d67340e0ad1724afeee78f9d820177abbd8b6) by [@hramos](https://github.com/hramos))
- Remove SoLoaderShim, use SoLoader ([fc6dd78935](https://github.com/facebook/react-native/commit/fc6dd78935a41106aa6a44058c1abb7d0ba0fa24) by [@foghina](https://github.com/foghina))
- Removed broken link for 'Getting Help' in the README ([b3a306a667](https://github.com/facebook/react-native/commit/b3a306a66709a0ab0ff29151a38eaa3f8f845c1f) by [@rickydam](https://github.com/rickydam))
- Changed to use boost-for-react-native cocoapod, which speeds up `pod install` a ton; this was in 0.53 originally but had to be re-added ([d40db3a715](https://github.com/facebook/react-native/commit/d40db3a715afaf1cde4a5e231e96e46b2808bbef) by [@CFKevinRef](https://github.com/CFKevinRef))
- Remove fbobjc's RN copy ([af0c863570](https://github.com/facebook/react-native/commit/af0c8635709b8014c68ce88ebb1e9e94ec56768a))
- Measure time to create **ReactInstanceManager** ([6224ef5301](https://github.com/facebook/react-native/commit/6224ef5301d67266b28c77e5e46816f319122f38) by [@alexeylang](https://github.com/alexeylang))
- Upgrade create-react-class to v15.6.3 ([74f386633d](https://github.com/facebook/react-native/commit/74f386633d5e123b2ea73b4773d0ee7d83832fb5) by [@bvaughn](https://github.com/bvaughn))
- Upgrade react-devtools to v3.1.0 ([8235a49a33](https://github.com/facebook/react-native/commit/8235a49a33cc8e84cd4ba1cc15bc09eed6712b4c) by [@bvaughn](https://github.com/bvaughn))
- Upgrade flow to v0.65.0 ([7aba456b04](https://github.com/facebook/react-native/commit/7aba456b04ff6a4e4721bcf1064f22a8a87f90c7) and [298f3bb69a](https://github.com/facebook/react-native/commit/298f3bb69abecdcd83adb64e043a2974bd52b1ab) by [@avikchaudhuri](https://github.com/avikchaudhuri) and [@mroch](https://github.com/mroch))
- Upgrade Jest to v22.2.1 ([46f4d3e1bc](https://github.com/facebook/react-native/commit/46f4d3e1bc9340009c53f366ebd98600c485c993) and [24e521c063](https://github.com/facebook/react-native/commit/24e521c063035e470587bb279976a955ff03717a) by [@mjesun](https://github.com/mjesun))
- Upgrade ESLint to v4.17.0 (plus update related deps) ([bba19e846e](https://github.com/facebook/react-native/commit/bba19e846e377241826475906f642264409a3990) by [@zertosh](https://github.com/zertosh))
- Upgrade React to v16.3.0-alpha.1 ([03d7b2aa0e](https://github.com/facebook/react-native/commit/03d7b2aa0e7f239c78b6fe3a96c0ddf3de00a58b) and [5e80d95e03](https://github.com/facebook/react-native/commit/5e80d95e034259af8c41b50756a623756cc81a77) by [@grabbou](https://github.com/grabbou) and [@hramos](https://github.com/hramos))
- Synced React and ReactFabric render ([c7ed03a95c](https://github.com/facebook/react-native/commit/c7ed03a95c8c372c7631c11e0778cf9753afdabc), [13829751b1](https://github.com/facebook/react-native/commit/13829751b11330f8e1400c5c70c59c49ac2f091f), and [d676746f14](https://github.com/facebook/react-native/commit/d676746f14fb6d714d2576871655b13c005480e7) by [@bvaughn](https://github.com/bvaughn))
- Upgrade metro to v0.26.0 ([9e6f3b8aff](https://github.com/facebook/react-native/commit/9e6f3b8aff7572f5e9008a2641c70846da0817bb), [ce50f25d22](https://github.com/facebook/react-native/commit/ce50f25d22d56f24bdb7d80a3f9a279863d5dc2a), [e9b83e608e](https://github.com/facebook/react-native/commit/e9b83e608e8487ef8fcbfc956a52bfa7ee1d727f), [2fe7483c36](https://github.com/facebook/react-native/commit/2fe7483c36b10146f737f0a84799c2eb01aaba79), [0f96ebd93b](https://github.com/facebook/react-native/commit/0f96ebd93b634ec3fb0e6036a4960bb4af167e7b), [0de470ec19](https://github.com/facebook/react-native/commit/0de470ec19f2b9f3f4f3ab3dd4322c0f0ece2868), [e8893a021f](https://github.com/facebook/react-native/commit/e8893a021f60ffeea27443998b1716e9a1963d64), and [b1d8af48ae](https://github.com/facebook/react-native/commit/b1d8af48ae251f57bdcd55f89d8fc62aa9eca872) by [@rafeca](https://github.com/rafeca) and [@grabbou](https://github.com/grabbou))
- Add Context to Redbox report api ([e3c27f585a](https://github.com/facebook/react-native/commit/e3c27f585aaeb685e86250f45fc790c06932af0d) by [@ayc1](https://github.com/ayc1))
- GitHub bot commands have been disabled in the short term ([b973fe45bd](https://github.com/facebook/react-native/commit/b973fe45bdbc84e12fd0a3afbd6fdd327bcb9d02) by [@hramos](https://github.com/hramos))
- Various CI configuration changes ([17bd6c8e84](https://github.com/facebook/react-native/commit/17bd6c8e84d9f5d42767a6f42a9a2cf812aa778b), [51b6749c07](https://github.com/facebook/react-native/commit/51b6749c075bb87a340096a0dc06cd6cf9a19907), [a2f3ba864e](https://github.com/facebook/react-native/commit/a2f3ba864ed17ca32e71f15724a8ebf2b1e640c1), [2ef9b7f2da](https://github.com/facebook/react-native/commit/2ef9b7f2da5b875ac1a4fee0ade3cc16ad96772a), [40b17926bb](https://github.com/facebook/react-native/commit/40b17926bb2c724f1580b2eb0c30a37f5d48030a), [613afbab7f](https://github.com/facebook/react-native/commit/613afbab7f30748ba767b055f23d0d294562805f), [da8bec9f8b](https://github.com/facebook/react-native/commit/da8bec9f8b62b46e58e0e98413aa915ece05b71b), [fa11faecb6](https://github.com/facebook/react-native/commit/fa11faecb69f385a5c0aba60f4039612e46b87f3), [f50af7f8a4](https://github.com/facebook/react-native/commit/f50af7f8a48e9cae2cb512962870d5692da5aaf2), [9227ba73ab](https://github.com/facebook/react-native/commit/9227ba73ab8c2b8b8ce4086b5f4667a8a55cdcfa), [365a4d4b43](https://github.com/facebook/react-native/commit/365a4d4b4315d4ca7a0e1236012b763d7e5bb1fd), [b58d848d9c](https://github.com/facebook/react-native/commit/b58d848d9cf78d755fe38392e26826ed481175cd), [c8e98bbaf5](https://github.com/facebook/react-native/commit/c8e98bbaf58b7a7f866e831982355b78dfa43b9d), [f5975a97ad](https://github.com/facebook/react-native/commit/f5975a97adcf3ae9c2988d7e267947a84ab60cee), and [605a6e4031](https://github.com/facebook/react-native/commit/605a6e4031fc9b63edbb9120ffacf7b045dc9db8) by [@hramos](https://github.com/hramos), [@grabbou](https://github.com/grabbou), and [@dryganets](https://github.com/dryganets))
- Restore copyright header ([4f883bd0bc](https://github.com/facebook/react-native/commit/4f883bd0bcdc015e2cf70bcc29bbe05fd5b8a40b) by [@hramos](https://github.com/hramos))
- Trim docs that are already present in the open source docs site ([28d60b68ad](https://github.com/facebook/react-native/commit/28d60b68ad7bc5b7ebda6b720981feacd3bde337) by [@hramos](https://github.com/hramos))
- Fix obsolete instructions about editing docs ([2f46712074](https://github.com/facebook/react-native/commit/2f46712074d187f5456723499e6885bf0941cfbc) by [@ExplodingCabbage](https://github.com/ExplodingCabbage))
- Fix links to beginner friendly issues ([c355a34de1](https://github.com/facebook/react-native/commit/c355a34de107befd26bc495272b91c11957f3fd0) by [@hotchemi](https://github.com/hotchemi))
- Typos in comments and log messages ([d2c569795c](https://github.com/facebook/react-native/commit/d2c569795ca07b6b7c0227cfc6d0b3bf5dd23b99) by [@ss18](https://github.com/ss18))
- Don't run the Danger CI tool through Flow ([1ea3065feb](https://github.com/facebook/react-native/commit/1ea3065feb265bef738bd53e835567d595266725) by [@hramos](https://github.com/hramos))
- Namespace custom ESLint rules through eslint-plugin-lint ([488b6825c5](https://github.com/facebook/react-native/commit/488b6825c5fb4ec68a8b7315559c4d34e012de12) by [@zertosh](https://github.com/zertosh))

- ... and now we're at 0.54 🎉 ([67e67ec83c](https://github.com/facebook/react-native/commit/67e67ec83ce83d4a1a38bc29dd52bf5c28723752), [21dd3dd296](https://github.com/facebook/react-native/commit/21dd3dd296989f4de2d4e9b1ba0df88ea2d32413), [49e35bd939](https://github.com/facebook/react-native/commit/49e35bd9399716a2734e824bab14faf1683cdfdd), [829f675b8b](https://github.com/facebook/react-native/commit/829f675b8b4abae696151e404552af515a2da1ce), and [294d95a236](https://github.com/facebook/react-native/commit/294d95a23687b2e3155fe4ae1bc5e4a649e6b014) by [@grabbou](https://github.com/grabbou) and [@hramos](https://github.com/hramos))

## v0.53.0

Welcome to the January 2018 release of React Native. The CLI now supports `--port` for both platforms, a few components were made to support consistent props across both platforms, and various fixes were made. There was a lot of under-the-cover work done with more test improvements and dependency updates. 118 commits were made by 43 contributors 🎉.

### Added

- ✨ **Keyboard** events now include `easing` and `duration` ([4d33080f0f](https://github.com/facebook/react-native/commit/4d33080f0fa7b2eb7b0e9ff7bbd50c222f461786) by [@sahrens](https://github.com/sahrens))

#### iOS exclusive additions

- `react-native run-ios` now supports the `--port` argument for metro ([33d710e8c5](https://github.com/facebook/react-native/commit/33d710e8c58ef1dc69816a59ac1cf390894e7cb9))

#### Android exclusive additions

- On Android, **ScrollView** now takes `snapToInterval` like iOS ([ddd65f1ba9](https://github.com/facebook/react-native/commit/ddd65f1ba9cca945313d116c1dcf75f3a0556099) and [b2848a54b0](https://github.com/facebook/react-native/commit/b2848a54b05470b3e258c935dd33b8c11a31b3c3) )
- On Android, **TextInput** now takes `onKeyPress` like iOS ([c9ff0bc212](https://github.com/facebook/react-native/commit/c9ff0bc212b680232f7379fba7b9332927075c3c) by [@joshyhargreaves](https://github.com/joshyhargreaves))

### Changed

- ⬆️ Metro to v0.24.2 ([2e008bc464](https://github.com/facebook/react-native/commit/2e008bc464f94df013794d3da6e9d4e4722151a0) and [0b5e8b4852](https://github.com/facebook/react-native/commit/0b5e8b485229957086d416c307f07c75a4139ffa) by [@rafeca](https://github.com/rafeca))
- ⬆️ Flow to v0.63 ([6b95c4fb14](https://github.com/facebook/react-native/commit/6b95c4fb142a7015b2afca50cc19eec0b8913d8c) by [@gabelevi](https://github.com/gabelevi))
- ⬆️ Danger to v2.0 ([b750e3b21b](https://github.com/facebook/react-native/commit/b750e3b21bc5c135773e8de53c5663bdf6266951) by [@hramos](https://github.com/hramos))
- ⬆️ Jest to v22.0.0 ([4803419dc8](https://github.com/facebook/react-native/commit/4803419dc8406b6892f20cdfb448a01c16ad4338) by [@mjesun](https://github.com/mjesun))
- 💄 Bundler is now called Metro Bundler in the terminal ([654d7595fe](https://github.com/facebook/react-native/commit/654d7595fe5766667c015307129e75d8986482e1) by [@edcs](https://github.com/edcs))
- 📝 Update getting started url on Android CLI ([6661633390](https://github.com/facebook/react-native/commit/6661633390276f707faa60509b2805a83929e747))
- 🐳 Dockerfile uses newest Android SDK, Buck, and new Docker tags have been pushed ([4fbfbe6bb0](https://github.com/facebook/react-native/commit/4fbfbe6bb0e0eaaf12ec713888bf2c6a347f0f96) and [c547f783c4](https://github.com/facebook/react-native/commit/c547f783c440019a4a87ba55b668b3af5ff8fc91) by [@hramos](https://github.com/hramos))
- 📝 Update repo docs to use HTTPS ([33a2e533b7](https://github.com/facebook/react-native/commit/33a2e533b76d35c1b9fb32e926f7c2c27cb616e9) by [@him2him2](https://github.com/him2him2))
- 🎨 Make **ScrollResponder** follow code style ([45e6fcdba0](https://github.com/facebook/react-native/commit/45e6fcdba089900555faa63fe8e37b4bd4a7700a) by [@TheSavior](https://github.com/TheSavior))
- **VirtualizedList** now requires a windowSize greater than 0 ([3559e42c55](https://github.com/facebook/react-native/commit/3559e42c55366bacd9bb5178ecab64f95e9a8ea7))
- react-devtools works with emulator and real devices now without needing to tweak the devServer value ([fa574c6092](https://github.com/facebook/react-native/commit/fa574c60920588e29d7b642e547e240ac8655e66) by [@jhen0409](https://github.com/jhen0409))
- 📝 Clarify use of Flow props types in react-native-cli's template project ([9b147a53d1](https://github.com/facebook/react-native/commit/9b147a53d1ab1e14d7ef5b436f1e140a28a5d6a3) by [@hramos](https://github.com/hramos))
- 📝 Add docs for `isInspectable` ([59c7967627](https://github.com/facebook/react-native/commit/59c79676277abaaaf61388309429c77164c3de4b) by [@bnham](https://github.com/bnham))
- ✅ More Flow improvements (**Text**, **SectionList**, and others) ([f71f4e7906](https://github.com/facebook/react-native/commit/f71f4e7906648766e1a5b630abbad8935daef955), [632f1202ab](https://github.com/facebook/react-native/commit/632f1202ab3f9dd300a53f096bc15325e0d8f6c1), and [a8391bde7d](https://github.com/facebook/react-native/commit/a8391bde7d757d01521a6d12170fb9090c17a6a0) by [@yungsters](https://github.com/yungsters), [@samwgoldman](https://github.com/samwgoldman), and others)
- Various code cleanup to satisfy linting errors and standards ([b0319f3293](https://github.com/facebook/react-native/commit/b0319f3293b553c105b813dd12bff7d55940e60b), [dd4611721d](https://github.com/facebook/react-native/commit/dd4611721d0ad49ceaf4514df1b47cf2753b9ae6), and [7f58189605](https://github.com/facebook/react-native/commit/7f5818960596a2a18b7d427fd23d46396c05bee5) by [@ayc1](https://github.com/ayc1), [@grabbou](https://github.com/grabbou), and [@ide](https://github.com/ide))

#### iOS exclusive changes

- 🔥⚡️ iOS UI Manager cleanup and optimizations ([0ec1017660](https://github.com/facebook/react-native/commit/0ec1017660602d6b3ae84b4d7a444cbd49ba0d53), [0ae4c47daa](https://github.com/facebook/react-native/commit/0ae4c47daa6280d2931d8bbf89612b2f1cb106d4), [2679f3efb6](https://github.com/facebook/react-native/commit/2679f3efb69bc7b0db1840b4ea59ebe791a54dd2),and [d9e5b313bb](https://github.com/facebook/react-native/commit/d9e5b313bb63a1ec0d402a96539c6df29bc72c42) by [@shergin](https://github.com/shergin))
- If the inspector tries to handle a wrapped event but there is no connection, log a warning rather than a Redbox ([30da2622e2](https://github.com/facebook/react-native/commit/30da2622e222c338421508ce6e5663155fc874ef) by [@bnham](https://github.com/bnham))
- Various under-the-covers changes around the bridge, RCTShadowView, RCTSurface, and a few others ([c3139d798a](https://github.com/facebook/react-native/commit/c3139d798af633bb81bf0da6df05b3c0beb0ced4), [2789ba016b](https://github.com/facebook/react-native/commit/2789ba016bfddace1407473769e933795333cfab), [b8e60a3ca3](https://github.com/facebook/react-native/commit/b8e60a3ca3314d79e9c38ee8c7995df81a27624c), [099b28006b](https://github.com/facebook/react-native/commit/099b28006b59abb11eae1f27424566b280860b0d), [b263560c73](https://github.com/facebook/react-native/commit/b263560c73af5559fdc3bba411f16c588abbffef), [19a9c5e41d](https://github.com/facebook/react-native/commit/19a9c5e41da0aa6ee28a54772edcb92daa498561), [d3b41e0da3](https://github.com/facebook/react-native/commit/d3b41e0da37c08ab0637d9f70d612e50b6f5e63c), [b2a251948f](https://github.com/facebook/react-native/commit/b2a251948f3309d2b1d0d533fb2fa74d2f8a10b8), [870bc4807a](https://github.com/facebook/react-native/commit/870bc4807a8c3f90498cf4c2ed3c030cb7b43ef9), [176a578238](https://github.com/facebook/react-native/commit/176a578238566ad857c0911e127669f1ee82107d), [c491b22233](https://github.com/facebook/react-native/commit/c491b2223313676bd4900de7a8c70a10051fa9f0), [c75612219e](https://github.com/facebook/react-native/commit/c75612219ef0c99d1ddca0aadf354f20de27608c), and[c01a171ed8](https://github.com/facebook/react-native/commit/c01a171ed881fb91a972ed475011f85697a29341) by [@shergin](https://github.com/shergin))
- Changed to use _boost-for-react-native_ cocoapod, which speeds up `pod install` a ton ([d40db3a715](https://github.com/facebook/react-native/commit/d40db3a715afaf1cde4a5e231e96e46b2808bbef) by [@CFKevinRef](https://github.com/CFKevinRef))

#### Android exclusive changes

- Include scroll momentum info when there are scroll events from Android ([c49d249fd7](https://github.com/facebook/react-native/commit/c49d249fd7c274f02e6018892992bcd273d6a465) by [@wwalser](https://github.com/wwalser))
- Yoga's mkfile for Android now uses wildcard instead of manual file addition ([d89901fa60](https://github.com/facebook/react-native/commit/d89901fa6002802dc9d744bfe3e5e712d6a411a1) by [@priteshrnandgaonkar](https://github.com/priteshrnandgaonkar))

### Removed

- **TextInput** no longer has the `autoGrow` prop, since this is platform-default behavior now ([dabb78b127](https://github.com/facebook/react-native/commit/dabb78b1278d922e18b2a84059460689da12578b) by [@shergin](https://github.com/shergin))

#### iOS exclusive removals

- Updates to the bridge in order to enable future rendering optimizations ([d2dc451407](https://github.com/facebook/react-native/commit/d2dc4514077ae868f85d45ccdcc7c69df7b7648b) by [@shergin](https://github.com/shergin))

### Fixed

- Do not set `minify=true` when calculating the list of dependencies for the CLI ([4a1bb8fe8d](https://github.com/facebook/react-native/commit/4a1bb8fe8dfd36ea207c0683d683bb8b22a282a5) by [@rafeca](https://github.com/rafeca))
- 👷 Update CODEOWNERS now that the docs are in a separate repository ([85ff264445](https://github.com/facebook/react-native/commit/85ff264445aa4b9cf0b91aaca5764bb56caba997) by [@hramos](https://github.com/hramos))
- Fixed a broken link in react-native-git-upgrade's readme ([bbedf2da9a](https://github.com/facebook/react-native/commit/bbedf2da9a3a091eeb687d43029f7d2450cf2612) by [@Taym95](https://github.com/Taym95))
- 🤡 Do not use Node 8.x specific Stream.final for FS mocks ([4216cdef13](https://github.com/facebook/react-native/commit/4216cdef13c9ed47b9c746b39a0ddfdaf846d495) by [@hramos](https://github.com/hramos))
- Fix virtualized cell keys for list headers and footers ([a010a0cebd](https://github.com/facebook/react-native/commit/a010a0cebd4afc0d88336c2c265a5d9dbb19918f))
- Fix warnings of casting and null pointer handling in Yoga ([a8d4666651](https://github.com/facebook/react-native/commit/a8d46666518944a178e85c179da8047234c2d8fb) by [@priteshrnandgaonkar](https://github.com/priteshrnandgaonkar))
- Fix broken buck failures on master ([4e767013ed](https://github.com/facebook/react-native/commit/4e767013ed73fb89f69f2e59626d6dcf3bb77684) by [@hramos](https://github.com/hramos))
- **RefreshControl** appears correctly when expected on initial render of a **FlatList** again ([ed5872e2cc](https://github.com/facebook/react-native/commit/ed5872e2cca955ee407e87e37e13c7fed182199a) by [@vonovak](https://github.com/vonovak))
- Fixed JS debugger CORS issue ([29f8354c19](https://github.com/facebook/react-native/commit/29f8354c1946a6325e9020b9ef5ee4ccdf0fa51f) by [@njbmartin](https://github.com/njbmartin))

#### Android exclusive fixes

- Fix position of dev loading view on Android API < 20 ([7ff6657985](https://github.com/facebook/react-native/commit/7ff6657985a09bd2572615d16403fba3af709859) by [@kmagiera](https://github.com/kmagiera))
- Fix Modal not disappearing when navigating from inside a Modal to another activity ([e5c2a66897](https://github.com/facebook/react-native/commit/e5c2a66897b9c562c549e63adcf70783ea34c418)

#### iOS exclusive fixes

- Fix regression introduced where layout wouldn't occur in some situations ([46be5bf71c](https://github.com/facebook/react-native/commit/46be5bf71c78d33cda5cb496c475dcfb8e229346) by [@shergin](https://github.com/shergin))
- Fixed double initial prop applying for newly created views ([0ec1017660](https://github.com/facebook/react-native/commit/0ec1017660602d6b3ae84b4d7a444cbd49ba0d53) by [@shergin](https://github.com/shergin))
- tvOS build now works again ([3bd89867d6](https://github.com/facebook/react-native/commit/3bd89867d6f23547f07b9b3a569d5a62971004f6) by [@dlowder-salesforce](https://github.com/dlowder-salesforce))

### Other

Below is a list of the remaining, low-level changes that made it into this release of React Native.

- Remove "prepareReact" call from the bridge ([80f9e1f7de](https://github.com/facebook/react-native/commit/80f9e1f7de407ea417cecb04b3ba20b05696b478) and [56a42e57d0](https://github.com/facebook/react-native/commit/56a42e57d05ff609e8fce35dcb5e9db7938db801) by [@fromcelticpark](https://github.com/fromcelticpark))
- Add explicit componentControllerClass to CKComponent for RCTSurface ([ab972708a8](https://github.com/facebook/react-native/commit/ab972708a8dcc9b37c19843f2fe134928a7c7a3f))
- Changes to RCTShadowView to increase RCTSurface performance ([f96f9c5fd6](https://github.com/facebook/react-native/commit/f96f9c5fd692000f561e87cba68642ef7daf43e7) by [@shergin](https://github.com/shergin))
- Designated methods to control dirty propagation ([af226ef949](https://github.com/facebook/react-native/commit/af226ef949f3a21ef68a6e6b9fbd4cc06fa05152) by [@shergin](https://github.com/shergin))
- Add missing tvOS header ([49cbca7464](https://github.com/facebook/react-native/commit/49cbca7464e27c34105122459ae29cc3b1247513) by [@grabbou](https://github.com/grabbou))
- On Android, seperate logic to initialize JS from starting the app ([4996b9aeb4](https://github.com/facebook/react-native/commit/4996b9aeb4127892b7579b45927dec14833b8b4d) by [@axe-fb](https://github.com/axe-fb))
- ♻️ JS linting was cleaned up: removed unused libs, strengthened the rules, removed unneeded rules, prevent disabled tests, and more ([2815ada238](https://github.com/facebook/react-native/commit/2815ada23872fc28dc8dd5a9833962cb73f452eb), [183c316f4c](https://github.com/facebook/react-native/commit/183c316f4c869804b88cffe40614c84ac0a472d0), [9c67e749d8](https://github.com/facebook/react-native/commit/9c67e749d8f63cf14ece201ec19eee4676f96a85), [79902f99b8](https://github.com/facebook/react-native/commit/79902f99b81f538042b38a857182c2e5adbfd006), [9a36872f0c](https://github.com/facebook/react-native/commit/9a36872f0c7ba03a92fabf65e4d659d6861ea786), [67a3c42d1a](https://github.com/facebook/react-native/commit/67a3c42d1a29b6fa1375f7445d1c9b4429939bae), [b826596700](https://github.com/facebook/react-native/commit/b82659670041d0e472f68c0a14b3ef5b962db09b), [a1a0a69546](https://github.com/facebook/react-native/commit/a1a0a6954635141ce6c167816b67674aa5c31062), and [11a495cb32](https://github.com/facebook/react-native/commit/11a495cb3235ebbc2ad890e92ec612fd5316bffb) by [@TheSavior](https://github.com/TheSavior))
- 👷 Separate JS lint and flow checks from tests ([5ea5683d01](https://github.com/facebook/react-native/commit/5ea5683d01487b49c814fca6e11a818b9a777239) by [@hramos](https://github.com/hramos))
- 👷 Fix Buck in build config to enable CI ([796122d8f3](https://github.com/facebook/react-native/commit/796122d8f3b825c0bf0c138c662f3477f8bab123), [7c3a61f3b6](https://github.com/facebook/react-native/commit/7c3a61f3b610e219fd798eccd330deb9a2471253), [82b123e744](https://github.com/facebook/react-native/commit/82b123e744b87cc59c96b4e82af9ed03981b4f42) by [@grabbou](https://github.com/grabbou))
- ♻️ Various refactoring within the YGNode implementation ([28968e2c0b](https://github.com/facebook/react-native/commit/28968e2c0ba23db9af12b47681f165d29d0f132d), [0a9e652bdd](https://github.com/facebook/react-native/commit/0a9e652bdd031d53d712e2e9610fb608bfa54ff1), [6627d7723c](https://github.com/facebook/react-native/commit/6627d7723c2df244ccc8a462bd98499cc11da2e2), and [d85da86dc7](https://github.com/facebook/react-native/commit/d85da86dc7c7833e71099c6a621547bc3cec8d4f), [a163f70f87](https://github.com/facebook/react-native/commit/a163f70f875dff4428eebd989bfaf28dda6551bf) by [@priteshrnandgaonkar](https://github.com/priteshrnandgaonkar))
- Fix ReactLegacy and delete RCTViewControllerProtocol ([a0ff8c7706](https://github.com/facebook/react-native/commit/a0ff8c7706fc37bdce78c9ec51da320f78d16a24) by [@javache](https://github.com/javache))
- Define internal FB macro for OSS builds; remove some unused definitions ([077c3ab349](https://github.com/facebook/react-native/commit/077c3ab34952f4b442abdd7a47ab54ca4bd0ba2e) and ([a6a66c5b39](https://github.com/facebook/react-native/commit/a6a66c5b3943443e4016f32407e4a4f8d707e387) by [@ttsugriy](https://github.com/ttsugriy))
- RNTester: Relax Bridge Release Check ([e3c6f38773](https://github.com/facebook/react-native/commit/e3c6f38773d0b578794726033d4fabbfa48d1c7b) by [@yungsters](https://github.com/yungsters))
- Remove embeddedBundleURL from the asset resolver ([489b98bf10](https://github.com/facebook/react-native/commit/489b98bf1006818ba985e93478a088c0e1e1aae7))
- Do not set FB_ASSERTION_ENABLED ([4cdbb77c33](https://github.com/facebook/react-native/commit/4cdbb77c3363e120877ff66f39cdcf51d668df7d) by [@priteshrnandgaonkar](https://github.com/priteshrnandgaonkar))
- JSBigString to MAP_PRIVATE not MAP_SHARED ([f9f40cd3e4](https://github.com/facebook/react-native/commit/f9f40cd3e486314cd75bda8722147f2f0f5b8fe1))
- Fixed black ARTSurfaceView ([5c8481e836](https://github.com/facebook/react-native/commit/5c8481e83646b9cae482a803c878fb007f370035) by [@shergin](https://github.com/shergin))
- Kill orphaned marker end in JSCExecutor ([6ad1f0957a](https://github.com/facebook/react-native/commit/6ad1f0957a020cb57b177ab015c17aa883e1f0ad) by [@michalgr](https://github.com/michalgr))
- Make YGNode as c++ struct with properties exposed through accessors ([f1055bcac8](https://github.com/facebook/react-native/commit/f1055bcac8b580c40f9646687e7a950fb6864c74) by [@priteshrnandgaonkar](https://github.com/priteshrnandgaonkar))
- 🔖 ...and now we're at 0.53.0-rc.0 🎁 ([0b996577e3](https://github.com/facebook/react-native/commit/0b996577e321d439aa6ede4c7400ea76efb7816a) by [@grabbou](https://github.com/grabbou))

## v0.52.0

> This changelog has been prepared by Ryan Turner (@turnrye) - thank you for
> your time and making such a detailed changelog 🔥🔥

This release had a lot of work around the bundler and packager, a ton of
bugfixes, and updates to many of React Native's dependencies. Lots of
under-the-hood work was done as well to improve the layout engine. Happy new
year!

> If you would like to help us with the next release changelog, please contact
> @grabbou

### Added

- Prettier has a config and an npm script; try it out with `npm run prettier`
  ([164591218f](https://github.com/facebook/react-native/commit/164591218f5fab7d386e057e0d51b9c1fe30b0a9) by
  [@janicduplessis](https://github.com/janicduplessis))
- **Debug JS in Nuclide** is now an option in the dev menu 🐜
  ([7c7108a1e8](https://github.com/facebook/react-native/commit/7c7108a1e8e9354d8aeb2f0ff712561d8aa19408) and
  [de424cc291](https://github.com/facebook/react-native/commit/de424cc291523a8f4e3d33059b725d5b85f31611))
- Introducing **PlatformOS** – it looks a lot like **Platform**, but with a
  simplified API
  ([5ee27ff755](https://github.com/facebook/react-native/commit/5ee27ff7552a5707a6e6bdb3f23e7378f978a2f7) by
  [@brishin](https://github.com/brishin))
- New experimental _RCTSurface_: measure and layout a UI in a thread-safe and
  synchronous manner
  ([be6976d6fa](https://github.com/facebook/react-native/commit/be6976d6faa333311405bd6184300bbd8da6cbca),
  [7df58e23a3](https://github.com/facebook/react-native/commit/7df58e23a3a265b0df0edc753cc79a153fec90d8),
  [e75bd87a76](https://github.com/facebook/react-native/commit/e75bd87a76726a9b075061ef76156705b3c1e872),
  [aa83b5a0ca](https://github.com/facebook/react-native/commit/aa83b5a0ca30736b2800833bcc6149dcbe8436fa),
  [081f7d14ad](https://github.com/facebook/react-native/commit/081f7d14aded077a7627404e5e2d48163a5707ad),
  [da17b237e1](https://github.com/facebook/react-native/commit/da17b237e15e20adf20d6b917349d6389efb17fd),
  [e9e0cd7ab8](https://github.com/facebook/react-native/commit/e9e0cd7ab86c98bcd3201e306e96532685d8de1d),
  [43b2509320](https://github.com/facebook/react-native/commit/43b25093202472c5af07d4f393d831e4d1484b07),
  [ba6075120a](https://github.com/facebook/react-native/commit/ba6075120af9c0086b449aafa7420913fa58f746),
  [d71d28f094](https://github.com/facebook/react-native/commit/d71d28f09495a1e2802db169e2d0cd1ec5bd5973),
  [4d37cf0fbc](https://github.com/facebook/react-native/commit/4d37cf0fbcc529ad75eb4a04a185036a887e42c2), and
  [d021dd25da](https://github.com/facebook/react-native/commit/d021dd25da92d84c62c9a77049bb798e3b891447) by
  [@maicki](https://github.com/maicki) and
  [@shergin](https://github.com/shergin))
- Experimental **SwipeableRow**'s datasource now has a `getLastRowID` method
  ([d79e245d19](https://github.com/facebook/react-native/commit/d79e245d19f7f246322bc657b407198b15cb1b98))
- [React Native monthly
  #5](https://reactnative.dev/blog/2017/11/06/react-native-monthly-5.html)
  was added ([3c5a55ddc2](https://github.com/facebook/react-native/commit/3c5a55ddc21197cfa013dc6222e398138759b5d3)
  by [@tenodi](https://github.com/tenodi))

#### iOS Specific

- **DatePickerIOS** now takes **locale** 🌍
  ([fd9c3618fc](https://github.com/facebook/react-native/commit/fd9c3618fcd3dc80f9abf3da779627704c7350e4) by
  [@RobertPaul01](https://github.com/RobertPaul01))
- **CameraRoll** can now **deletePhotos** 📸
  ([554e873f58](https://github.com/facebook/react-native/commit/554e873f585ea05ce1e9fe4ff71173c47b3c259c) by
  [@fxfactorial](https://github.com/fxfactorial))
- There's now an API to specify a different directory for iOS image assets
  ([8f9b291224](https://github.com/facebook/react-native/commit/8f9b291224d1ca57a5f90200ec4687abb4706f4b))
- Support for [custom accessibility
  actions](https://developer.apple.com/documentation/uikit/uiaccessibilitycustomaction)
  on iOS ([36ad813899](https://github.com/facebook/react-native/commit/36ad8138997c195b8728906ceb51bd31338b6a24) by
  [@ericdavmsft](https://github.com/ericdavmsft))

### Deprecated

- Ignore YellowBox warnings with `YellowBox.ignoreWarnings([...])` rather than
  `console.ignoredYellowBox = [...]`
  ([26038f50bb](https://github.com/facebook/react-native/commit/26038f50bb003eec3770e2b66d428fbb739f1ce2) by
  [@wli](https://github.com/wli))

### Changed

- Metro-bundler is now metro, and it's v0.24.1; there were some performance
  increases at the cost of a few breaking changes; improved tests of the bundler
  too ([0bbd9f042a](https://github.com/facebook/react-native/commit/0bbd9f042a8ad7c7be094bd7636ca767c6f7b231),
  [a2fd3fcef8](https://github.com/facebook/react-native/commit/a2fd3fcef84e916b36ef7753dff69b7c1b307890),
  [503b4521a6](https://github.com/facebook/react-native/commit/503b4521a6ce6bb2282631df616440fa71416d25),
  [654fed46f4](https://github.com/facebook/react-native/commit/654fed46f49b5002096ff55c2e8523af48b22c24),
  [0091496891](https://github.com/facebook/react-native/commit/009149689119e180415f8138b2827366768fc1d3),
  [aba148f733](https://github.com/facebook/react-native/commit/aba148f733e85a88d4be07b3b8ca37c43cf6a51e),
  [3d5dc872a4](https://github.com/facebook/react-native/commit/3d5dc872a4eefa1557554b3b338227959d166370),
  [48019a0c2a](https://github.com/facebook/react-native/commit/48019a0c2a9a45d51a4faab1d5bef52949f4b5c5),
  [ecec4319c4](https://github.com/facebook/react-native/commit/ecec4319c4fda9bebc90216d5340442b2a5725df),
  [f4d627c8fa](https://github.com/facebook/react-native/commit/f4d627c8faeb034eac8053fd253f17e42b85f2f2),
  [f871d25eb4](https://github.com/facebook/react-native/commit/f871d25eb48dca224bb3796aa9cb5d714292662f),
  [a7b231a327](https://github.com/facebook/react-native/commit/a7b231a3278e4fc2d7e4269ce106f22712f2e5a8),
  [830b431453](https://github.com/facebook/react-native/commit/830b43145381e6e322569450affddba73f7dc2d1),
  [29dafa1a86](https://github.com/facebook/react-native/commit/29dafa1a8644f7a537499074df334bab8da4ad00),
  [7a5d5a4035](https://github.com/facebook/react-native/commit/7a5d5a40357bedfb24a01ff1160481656fda9554),
  [4cd685a1e0](https://github.com/facebook/react-native/commit/4cd685a1e0a2ae07df02702dbf4702e407773df5),
  [d326c86051](https://github.com/facebook/react-native/commit/d326c860519c5165c6e86fb4f3ce378ed055157c),
  [231c7a0304](https://github.com/facebook/react-native/commit/231c7a03043b9fb3c4bf81251ad099bab0ba05c2),
  [7d969a05de](https://github.com/facebook/react-native/commit/7d969a05de6a45543bc31a3b982828865bc57cdb),
  [ae517307e7](https://github.com/facebook/react-native/commit/ae517307e76d977f813e5b880f3b7f42a20f461d),
  [f587f8d51d](https://github.com/facebook/react-native/commit/f587f8d51dc57e6b9eb66edfbe58ee520a6cc568),
  [fbf0aed3ac](https://github.com/facebook/react-native/commit/fbf0aed3acc056b5fd069af75fcae14246439a48),
  [e9393f694d](https://github.com/facebook/react-native/commit/e9393f694d8f0d0190a3576fd65a65f747f8cce2), and
  [968c88d141](https://github.com/facebook/react-native/commit/968c88d1410eac5b793345bacce6052f518fda8f) by
  [@cpojer](https://github.com/cpojer), [@hramos](https://github.com/hramos),
  [@jeanlauliac](https://github.com/jeanlauliac), and
  [@rafeca](https://github.com/rafeca)
  )
- React is now v16.2.0, and it took react-test-renderer along with it; [now with
  more
  fragments!](https://react.dev/blog/2017/11/28/react-v16.2.0-fragment-support.html)
  🎉 ([c7f37074ac](https://github.com/facebook/react-native/commit/c7f37074ac89f7e568ca26a6bad3bdb02812c39f) and
  [cd938d731c](https://github.com/facebook/react-native/commit/cd938d731c7531a683c050cd829a543d145e3dc1) by
  [@bvaughn](https://github.com/bvaughn))
- Jest is now v21.3.0-beta.13
  ([16bbd908e7](https://github.com/facebook/react-native/commit/16bbd908e72577e7d109397916323a0eeffce8d4) and
  [ec2ea58e57](https://github.com/facebook/react-native/commit/ec2ea58e57872bfa077d9c9a5e1e8b253c6b37b3) by
  [@mjesun](https://github.com/mjesun))
- Flow is now v0.61.0, and there were a ton of Flow fixes/coverage improvements
  made ([914ae93336](https://github.com/facebook/react-native/commit/914ae9333678df4888e3c72898991c8430625cce),
  [eb0d6470e5](https://github.com/facebook/react-native/commit/eb0d6470e54663538610a70ab0bae9847eb33673),
  [c8e72bb8b8](https://github.com/facebook/react-native/commit/c8e72bb8b8317bcdcb4fe2ff85978c7db70f4461),
  [2d4bedba0f](https://github.com/facebook/react-native/commit/2d4bedba0f6a8f2cfe597a1044822eb635d5e243),
  [e0202e459f](https://github.com/facebook/react-native/commit/e0202e459fd0181db551d0025ef562d7998186b0),
  [2be3ae1ff2](https://github.com/facebook/react-native/commit/2be3ae1ff2441c0ee3f2b9255c23dc49ada852fe),
  [22a1419900](https://github.com/facebook/react-native/commit/22a14199000ea994f24f6fe387ea26647af3c128),
  [6ae0b344e5](https://github.com/facebook/react-native/commit/6ae0b344e5c221657287d1fc1511be520a6f6e58),
  [76a2ca4c9c](https://github.com/facebook/react-native/commit/76a2ca4c9c09c9bdf922154c28040138a44ae672),
  [3259353fce](https://github.com/facebook/react-native/commit/3259353fcec0dd9ea66de750a694c226f99f483d),
  [e6c1fb7212](https://github.com/facebook/react-native/commit/e6c1fb72128fb13436028c2df9cdccf6ccfccb67),
  [61d046be3c](https://github.com/facebook/react-native/commit/61d046be3c9b00f6a4d4f492d558a961a6d4210f),
  [820cfa1f3b](https://github.com/facebook/react-native/commit/820cfa1f3b79406e47cb873773cadafefe0effb1),
  [240039c6f2](https://github.com/facebook/react-native/commit/240039c6f2d8db700ebc15404b0acc2a49068249),
  [343c5a97a0](https://github.com/facebook/react-native/commit/343c5a97a013669745cf3938728539001d3076e6),
  [5f8d8e90c2](https://github.com/facebook/react-native/commit/5f8d8e90c2c43127b8a5d2fc5d18f16185c7a67e), and
  [da047966e4](https://github.com/facebook/react-native/commit/da047966e4c2064a48e02ff74830c99808d8194b) by
  [@Ashoat](https://github.com/Ashoat),
  [@calebmer](https://github.com/calebmer),
  [@cdlewis](https://github.com/cdlewis),
  [@deecewan](https://github.com/deecewan),
  [@grabbou](https://github.com/grabbou),
  [@jamesisaac](https://github.com/jamesisaac),
  [@mroch](https://github.com/mroch), [@nmn](https://github.com/nmn),
  [@nmote](https://github.com/nmote), [@sahrens](https://github.com/sahrens),
  [@samwgoldman](https://github.com/samwgoldman),
  [@TheSavior](https://github.com/TheSavior), and others)
- react-devtools-core is now v3.0.0
  ([a7d46ea970](https://github.com/facebook/react-native/commit/a7d46ea97012bdcc644e3397bbf60bd3cb37e9eb) by
  [@rsnara](https://github.com/rsnara))
- Split out docs to [their own
  repo](https://github.com/facebook/react-native-website/tree/master/docs) (and
  a few formatting fixes along the journey) 👋
  ([2d86618e7e](https://github.com/facebook/react-native/commit/2d86618e7ef477cdfc2ed510c7bc05d41dbfe972),
  [64d80b13db](https://github.com/facebook/react-native/commit/64d80b13db3dd28bb5d93cbedf511ae8f91e2127),
  [3362da421c](https://github.com/facebook/react-native/commit/3362da421ce919fc6f4f1bda29b59e2e3bfe02de),
  [75123c614b](https://github.com/facebook/react-native/commit/75123c614bb5a61c383cdc247230b3a76c76e14d), and
  [79e24ede40](https://github.com/facebook/react-native/commit/79e24ede40b2508aaa77b8ff3876d3dbf4cfe6d8) by
  [@hramos](https://github.com/hramos)).
- **TouchableHighlight** now has a default delayPressOut value of 100; it was
  also refactored a bit for style
  ([9a31fa5fd6](https://github.com/facebook/react-native/commit/9a31fa5fd62fa101b2a76c69b56248d7f5ba9876) by
  [@sahrens](https://github.com/sahrens))
- When in a dev build, more robustly validate arguments for native methods
  ([ea2e2c54cb](https://github.com/facebook/react-native/commit/ea2e2c54cb4d1a99b41aaa98eaf51696d34770dd) by
  [@mhorowitz](https://github.com/mhorowitz))
- On integration tests, report _all_ errors
  ([3bcb912786](https://github.com/facebook/react-native/commit/3bcb9127866ef60b3697553e98a3ae279d02290a) by
  [@sahrens](https://github.com/sahrens))
- Yoga has less technical debt, thanks to replacing _YGNodeList_ with vectors
  ([b08a912f11](https://github.com/facebook/react-native/commit/b08a912f11c729f3fe76700c6614f9e6165ae1a1) by
  [@priteshrnandgaonkar](https://github.com/priteshrnandgaonkar))
- Yoga is now cpp, compiled as _c++1y_
  ([d7ab9496bc](https://github.com/facebook/react-native/commit/d7ab9496bc95f7b720fd6db1ed503af1c461e84d) by
  [@priteshrnandgaonkar](https://github.com/priteshrnandgaonkar))
- Bundle segments are handled better and used more
  ([681278947e](https://github.com/facebook/react-native/commit/681278947eb4039a1d7a65f1edfeef25ae055a4f),
  [a47431ed74](https://github.com/facebook/react-native/commit/a47431ed74f0b7b2a03ca48e84f2243d08ef3bdd),
  [963c61d4d5](https://github.com/facebook/react-native/commit/963c61d4d546c94b689281ca1f5105ad050e10ff),
  [b9f21dc2be](https://github.com/facebook/react-native/commit/b9f21dc2be14cd51543e6b2d1e63a861e5f433d1),
  [f1258181ee](https://github.com/facebook/react-native/commit/f1258181eec84f73651d2fabd0d23764b8990ff8), and
  [1988ba1d79](https://github.com/facebook/react-native/commit/1988ba1d7967dca04376e7e631e8910e5e79a6a7) by
  [@fromcelticpark](https://github.com/fromcelticpark) and
  [@jeanlauliac](https://github.com/jeanlauliac))
- _packager-worker-for-buck_ has better tests
  ([7fd5aa84a1](https://github.com/facebook/react-native/commit/7fd5aa84a1ef1744d01e7e877183b1f004216d00) by
  [@jeanlauliac](https://github.com/jeanlauliac))
- _RCTUIManager_ has less technical debt
  ([46be5bf71c](https://github.com/facebook/react-native/commit/46be5bf71c78d33cda5cb496c475dcfb8e229346),
  [60dc9bed00](https://github.com/facebook/react-native/commit/60dc9bed00cc13652752bf84f83c920ce66d5e39), and
  [21714fe197](https://github.com/facebook/react-native/commit/21714fe1979ccbd62d665f383625f4ece8cf888e) by
  [@shergin](https://github.com/shergin))
- Numerous bridge changes, especially around URL resolution
  ([e7bd0f056b](https://github.com/facebook/react-native/commit/e7bd0f056bf4edca1f0529d6eed03bbaaaca586a),
  [260e6d2355](https://github.com/facebook/react-native/commit/260e6d23554a8e7f1743263894c9ca9a0cfbf01e),
  [4894ac430d](https://github.com/facebook/react-native/commit/4894ac430d6df1118ce48f644fd8cf5bfce6344f),
  [b983de9c54](https://github.com/facebook/react-native/commit/b983de9c5460e24c95a9a67f02695cd1c5f31bc5),
  [b0193b098c](https://github.com/facebook/react-native/commit/b0193b098cdbd915bba90e1ab0b695ba44346f44),
  [ae5ef653cb](https://github.com/facebook/react-native/commit/ae5ef653cbc4c03fe5edb5d4b0002e38cbb6f458), and
  [1d6ce2311f](https://github.com/facebook/react-native/commit/1d6ce2311f6a51821b33c5473414d70c8bd34425) by
  [@fromcelticpark](https://github.com/fromcelticpark) and others)
- Various cleanup and refactoring
  ([053776338e](https://github.com/facebook/react-native/commit/053776338ea44c31f3671cb4502853da0c88e55a),
  [0984f29a32](https://github.com/facebook/react-native/commit/0984f29a320ce7e40e8bc2a6c78b080908fa1384),
  [6c70975689](https://github.com/facebook/react-native/commit/6c70975689d0f0839e6c2db9a9a25c3023f5be7b),
  [d950dc6a21](https://github.com/facebook/react-native/commit/d950dc6a21c5cc1e736993b2ecc16abae086389e),
  [70c359000a](https://github.com/facebook/react-native/commit/70c359000a2df091c3939f4c19db6024af992d43),
  [cfa2bbf2f6](https://github.com/facebook/react-native/commit/cfa2bbf2f692d0bc5600d7e369a9a91272930ca6), and
  [850efa8650](https://github.com/facebook/react-native/commit/850efa86508b19d800ff8cbdc725402c006db1a2) by
  [@bnham](https://github.com/bnham),
  [@priteshrnandgaonkar](https://github.com/priteshrnandgaonkar), and others)
- Jest preprocessing now uses the AST from metro
  ([2ae255a6ea](https://github.com/facebook/react-native/commit/2ae255a6eaf820992bdf19799bb4403f3bbdcd5b) and
  [d5b59517c2](https://github.com/facebook/react-native/commit/d5b59517c274874d7ce21e5c26d28b42ae389723) by
  [@rafeca](https://github.com/rafeca))
- `renderApplication()` now supports async initial render
  ([1b22d49ae8](https://github.com/facebook/react-native/commit/1b22d49ae8945680dee4fd01e3fbb78b1e443e01) by
  [@bvaughn](https://github.com/bvaughn))
- Welcome [@lwinkyawmyat](https://github.com/lwinkyawmyat) to the React Native
  GitHub Issue Task Force
  ([4ebe76d559](https://github.com/facebook/react-native/commit/4ebe76d5598621160ffcf3ea8bc87c3ad1c1a2f8) by
  [@lwinkyawmyat](https://github.com/lwinkyawmyat))

#### Android exclusive changes

- Native components on Android register lazily rather than via ViewManager
  ([1b71e03932](https://github.com/facebook/react-native/commit/1b71e03932f44e212b297b2c1e02100b6de74b93))
- Android debug overlays (like **RedBox**, dev menu, loading) are no longer are
  system overlays; they're now part of the _currentActivity_
  ([d19afc73f5](https://github.com/facebook/react-native/commit/d19afc73f5048f81656d0b4424232ce6d69a6368) by
  [@kmagiera](https://github.com/kmagiera))

#### iOS exclusive changes

- Improve iOS's _accessibilityLabel_ performance by up to 20% 📈
  ([19b0a65c5e](https://github.com/facebook/react-native/commit/19b0a65c5ecc4f41fea98a1e752785d6dbb6ea05) by
  [@chendo](https://github.com/chendo))

### Fixed

- Fix `backgroundColor` on **TouchableHighlight**
  ([5a1171ebfa](https://github.com/facebook/react-native/commit/5a1171ebfaaedd9c7d5f1bfcf306049c3671a733) by
  [@sahrens](https://github.com/sahrens))
- Various corrections in messages, comments, and docblocks
  ([58c3bc4901](https://github.com/facebook/react-native/commit/58c3bc490143b8d7831a00289e2565f49f5389ef),
  [354e1cb508](https://github.com/facebook/react-native/commit/354e1cb5088a43fd4116504a34a65ca53c4de71b),
  [58edf024a1](https://github.com/facebook/react-native/commit/58edf024a1ed3a71ef04f124546ee97496b6502f),
  [b9e7006cc6](https://github.com/facebook/react-native/commit/b9e7006cc6dc2b0801ea0c776ba00cdea2204151),
  [d2f0abdf4e](https://github.com/facebook/react-native/commit/d2f0abdf4ea94fbb3e2a5c7fb53ff5d1cf6abede),
  [94cd9f5591](https://github.com/facebook/react-native/commit/94cd9f55915973355cdb63276b71f90df10281db),
  [8547b7e111](https://github.com/facebook/react-native/commit/8547b7e11163d545b7b99d4bdd063ef71129d62c),
  [44c16499fd](https://github.com/facebook/react-native/commit/44c16499fdc4665298f6c88b9ffee626fa1fc969),
  [c91d87213e](https://github.com/facebook/react-native/commit/c91d87213e6862019b9ef7df7c38551bd6d659fd),
  [85503a0612](https://github.com/facebook/react-native/commit/85503a0612b0c74b4d204e8748e9ed7010d838e4), and
  [5b83dbe25a](https://github.com/facebook/react-native/commit/5b83dbe25af151d183009006b1fe323b2658d025) by
  [@behrends](https://github.com/behrends),
  [@bvaughn](https://github.com/bvaughn),
  [@charpeni](https://github.com/charpeni),
  [@dsandmark](https://github.com/dsandmark),
  [@gusgard](https://github.com/gusgard),
  [@nkabrown](https://github.com/nkabrown),
  [@petterh](https://github.com/petterh), [@solon](https://github.com/solon),
  [@swashcap](https://github.com/swashcap), and others)
- Various dev doc and project doc fixes for correctness and completeness
  ([92c0980540](https://github.com/facebook/react-native/commit/92c0980540dde0053bad05fae6414cf8275a71b1),
  [3c9092acf3](https://github.com/facebook/react-native/commit/3c9092acf39ecdb7c137a3cb0d4282694e95cbf5),
  [e906525e84](https://github.com/facebook/react-native/commit/e906525e84f69a98de4d06ed1ec4c43d8589e350),
  [60828566a7](https://github.com/facebook/react-native/commit/60828566a759dc579dbae1d76a8426e1e479166e),
  [c49b97c4ef](https://github.com/facebook/react-native/commit/c49b97c4ef65a6351af437ef28033cb31ea0446f),
  [45ed142596](https://github.com/facebook/react-native/commit/45ed14259677cff4cbd133e705ec4f0ec84bc216),
  [cb6ec7c321](https://github.com/facebook/react-native/commit/cb6ec7c32141ef5bdde837d7f9d71b7adb83b751),
  [9ec9567390](https://github.com/facebook/react-native/commit/9ec95673909beac7798f589e0e9821b4225f8fa9),
  [e5a4ea97d9](https://github.com/facebook/react-native/commit/e5a4ea97d9e1b13509a3f36d0b469a6a88a90dc4),
  [c544c0d2dc](https://github.com/facebook/react-native/commit/c544c0d2dca1d0e9f0b2a5565e03676ad71a36f5),
  [33d5e5bd5a](https://github.com/facebook/react-native/commit/33d5e5bd5a5365ab712a2b9d33f33cbec305e128),
  [95dac8db60](https://github.com/facebook/react-native/commit/95dac8db601ba48fe03da52e1adbdef0cac23546),
  [6e1db1f1ee](https://github.com/facebook/react-native/commit/6e1db1f1ee263c3a8b68c3e1584e79ae86d5be86),
  [e11d496e9d](https://github.com/facebook/react-native/commit/e11d496e9d907abb5bf58a8300c5a8f85aa03bbb),
  [6da897945f](https://github.com/facebook/react-native/commit/6da897945f823728dbc82dd9f01c672354b1e76d),
  [0ff576081b](https://github.com/facebook/react-native/commit/0ff576081b156ea26c4e7886f7266f3e4d8e3d5e),
  [1ee64ccb8a](https://github.com/facebook/react-native/commit/1ee64ccb8a257210be3a74fb9b0adc83f2a8bb2b),
  [3aa38564f7](https://github.com/facebook/react-native/commit/3aa38564f7b91c8588c8484140bc4221d50d55e0),
  [6b26971a56](https://github.com/facebook/react-native/commit/6b26971a56fdd919d11cc338893d0b7a3f7a45ba), and
  [de3976a486](https://github.com/facebook/react-native/commit/de3976a48655a248a2417fcf2d3a511be02e1996) by
  [@adrianomelo](https://github.com/adrianomelo),
  [@blargity](https://github.com/blargity),
  [@charpeni](https://github.com/charpeni),
  [@garlic-rice-with-butter](https://github.com/garlic-rice-with-butter),
  [@gwmccull](https://github.com/gwmccull),
  [@harikrishnanp](https://github.com/harikrishnanp),
  [@hramos](https://github.com/hramos),
  [@johnthewilson](https://github.com/johnthewilson),
  [@jsdario](https://github.com/jsdario), [@kelset](https://github.com/kelset),
  [@patrickkempff](https://github.com/patrickkempff),
  [@ryanml](https://github.com/ryanml),
  [@tiagomoraismorgado88](https://github.com/tiagomoraismorgado88),
  [@timwangdev](https://github.com/timwangdev), and others)
- Stop `RCTRefreshControl` from jumping around
  ([2e1707d0e6](https://github.com/facebook/react-native/commit/2e1707d0e600a30057511390dd87c18c00f19a59) by
  [@sophiebits](https://github.com/sophiebits))
- Fix a race condition in the animation module
  ([515eb0e801](https://github.com/facebook/react-native/commit/515eb0e8012a7a8f085a8e410c6c694011fd8c1d) by
  [@mhorowitz](https://github.com/mhorowitz))
- Fix Windows local-cli's to not wrongfully identify as globally installed
  ([ca106043fc](https://github.com/facebook/react-native/commit/ca106043fc655a1c51332aedf9b001a512269550) by
  [@sballew](https://github.com/sballew))
- Fix Jest mocks for **NetInfo**, **Dimensions**, and **ScrollView** modules
  ([7fb3a9229d](https://github.com/facebook/react-native/commit/7fb3a9229df52bd45076470d059f245a8147cd2a),
  [11a2a35c63](https://github.com/facebook/react-native/commit/11a2a35c63ae68de46482f5cd25271f8b0fb5ad4), and
  [0c8a3e4f79](https://github.com/facebook/react-native/commit/0c8a3e4f797563c99e988ec2f42ec2a618a8b196) by
  [@alvaromb](https://github.com/alvaromb),
  [@timwangdev](https://github.com/timwangdev), and
  [@uk-ar](https://github.com/uk-ar))
- packager-worker-for-buck: `transformCommand`: add missing test
  ([73a01be9bc](https://github.com/facebook/react-native/commit/73a01be9bcd9059f3172987fd30d8b6dc0125759) by
  [@jeanlauliac](https://github.com/jeanlauliac))
- Fixed issue where CLI wasn't following the config value for postMinifyProcess
  when its running with `dev=false`
  ([6d92046c56](https://github.com/facebook/react-native/commit/6d92046c56794a6a62bc07598545a23a7b53cdc0) by
  [@rafeca](https://github.com/rafeca))
- Fix asset resolver url handling
  ([28d5d6baf1](https://github.com/facebook/react-native/commit/28d5d6baf1e6ac52e8672a653f56c3898e4e11d2) by
  [@fkgozali](https://github.com/fkgozali))
- Fix crash when destroying catalyst
  ([f1015664e9](https://github.com/facebook/react-native/commit/f1015664e92f02c33417a591a2438db7c0cd3811))
- You can now `justifyContent` while you're `minWidth`ing and `marginLeft`ing;
  before the justification wasn't honored
  ([f5becebc07](https://github.com/facebook/react-native/commit/f5becebc0710d5bb875bb9c0a2d3809a00f62605) by
  [@woehrl01](https://github.com/woehrl01))
- `marginLeft: auto` and `alignItem: stretch` now play nicely together; before
  the width and height ended up incorrect
  ([5f99b1a55f](https://github.com/facebook/react-native/commit/5f99b1a55f4002c105a7005cabf720aad422b628) by
  [@woehrl01](https://github.com/woehrl01))
- Fix assertion preventing YGNodeLayoutGet\* with YGEdgeEnd
  ([a383b8ca05](https://github.com/facebook/react-native/commit/a383b8ca0545ba3704a51a78972107119f5683c0) by
  [@justjake](https://github.com/justjake))
- Fix shrinking in non-strech alignments
  ([1d62848535](https://github.com/facebook/react-native/commit/1d6284853514be4da2b68d45732386eb81cc4253) by
  [@woehrl01](https://github.com/woehrl01))
- Correctly calculate min/max percentage constraints
  ([4fdaf2de98](https://github.com/facebook/react-native/commit/4fdaf2de989c039a62681cc1f7a8407ec32b593e) by
  [@woehrl01](https://github.com/woehrl01))
- When running `react-native-git-upgrade`, don't execute git's hooks
  ([0182086350](https://github.com/facebook/react-native/commit/018208635069311c1a7c7776c6f359f7ded45362) by
  [@adrienthiery](https://github.com/adrienthiery))
- When running `react-native-git-upgrade` and failing with a signal, return that
  to the terminal
  ([b9a5862f67](https://github.com/facebook/react-native/commit/b9a5862f670f52d48f1d3789c3f08ec139368da4) by
  [@mateusz-](https://github.com/mateusz-))
- In **KeyboardAvoidingView**, don't mistakenly try to layout when a hardware
  keyboard changes
  ([ad4450ac13](https://github.com/facebook/react-native/commit/ad4450ac1364710f052a927ceda7ae353440f682) by
  [@koenpunt](https://github.com/koenpunt))
- Don't endlessly collect websockets when not connected to the packager (dev
  memory leak)
  ([1e1e491246](https://github.com/facebook/react-native/commit/1e1e49124678f447d980bb22891d25db60fa83b3) by
  [@mmmulani](https://github.com/mmmulani))
- Fixed a bug in the sample project random `selection` prop that made it
  not-so-random
  ([766f020e68](https://github.com/facebook/react-native/commit/766f020e68abfc121ea6a9f92e0640368d69dae7) by
  [@rozele](https://github.com/rozele))

#### Android exclusive fixes

- Explicitly `#define isnan __builtin_isnan` for Android _clang-5_ to mimic
  **gcc**'s default behavior
  ([f8fe6b0c70](https://github.com/facebook/react-native/commit/f8fe6b0c70d1b7b626d05d9675c16b2f89339e8c))
- Correctly update **NetInfo** on Android even if connection types change while
  the app is in the background
  ([e6f542d620](https://github.com/facebook/react-native/commit/e6f542d62037e9830c0ae5749a32874c44cf2334) by
  [@berickson1](https://github.com/berickson1))
- Direction-aware borders now work with Android APIs >= 17
  ([7170543e80](https://github.com/facebook/react-native/commit/7170543e8012250b7643a960b54cce7fd6d3a1e9) by
  [@rsnara](https://github.com/rsnara))
- Don't throw _BadTokenException_ and _IllegalArgmentException_ when showing or
  dismissing Modal on Android
  ([e57a43b97a](https://github.com/facebook/react-native/commit/e57a43b97ad24dc5b993753a45aa575b2a757b4f))
- Fix Android crash when blurRadius is between 0 and 1
  ([dc01eff72d](https://github.com/facebook/react-native/commit/dc01eff72d23e1dd3f7ecf30859992ee3bf7c664) by
  [@jamesreggio](https://github.com/jamesreggio))
- Fix `borderRadius` with Android API level < 18
  ([5aa1fb3ff3](https://github.com/facebook/react-native/commit/5aa1fb3ff326a429e33a443576da866f2a63c20c) and
  [ca7fe72c31](https://github.com/facebook/react-native/commit/ca7fe72c31fd7c7cbe4734118019f5808235560e) by
  [@rsnara](https://github.com/rsnara))
- Make Android `lineHeight` behavior match iOS's 📏
  ([3f1b021506](https://github.com/facebook/react-native/commit/3f1b0215060e4c27c286359cc90f3b2189956c4e))
- Fixed autoscroll to cursor on Android **TextInput**
  ([0bef872f3f](https://github.com/facebook/react-native/commit/0bef872f3fc8b1cd78c574d03eacc886bef4e239) by
  [@shergin](https://github.com/shergin))
- Fix logging unpacking time on Android when it happens concurrently with eager
  unpacking ([028b64bcd3](https://github.com/facebook/react-native/commit/028b64bcd36c1c8dd76c0de95eeff80cf660aa23)
  by [@alexeylang](https://github.com/alexeylang))
- Prevent an Android crash when **TextInput** has `selectionColor` defined but
  there is no drawable cursor
  ([1e18d907bf](https://github.com/facebook/react-native/commit/1e18d907bfb8cc5f4f2e1a1ede0dd98aec40ab11) by
  [@gpeal](https://github.com/gpeal))

#### iOS exclusive fixes

- Don't have Xcode warnings for _YGDefaultLog_ in newly created projects
  ([72e762d4bc](https://github.com/facebook/react-native/commit/72e762d4bca8d00cc2c73c390a654ae6143731bd) by
  [@woehrl01](https://github.com/woehrl01))
- iOS _RCTEventEmitter_ uses a `double` for count, not _NSInteger_
  ([eaa84997ce](https://github.com/facebook/react-native/commit/eaa84997cedc8dc4d46308e2217d2b094a51ed02))
- Fix `isNuclideDebuggingAvailable` on iOS
  ([59c3e33f63](https://github.com/facebook/react-native/commit/59c3e33f637d11e33204e8a912e98459ffad7fab))
- iOS ScrollView is now rendered correctly with RefreshControl
  ([75d62bf0a8](https://github.com/facebook/react-native/commit/75d62bf0a802b91a979d03ef497e84c3179e7767) by
  [@vonovak](https://github.com/vonovak))
- Fix a crash when keyboard is visible and bridge reload happens on iOS
  ([d9c658566a](https://github.com/facebook/react-native/commit/d9c658566a14ce8767d87435264997aa18dd08e4) by
  [@fromcelticpark](https://github.com/fromcelticpark))
- **RedBox** now appears beneath the status bar on iOS
  ([33cefc1760](https://github.com/facebook/react-native/commit/33cefc176096e03a4b3c3130a70abfabe9d40f38) by
  [@adamjernst](https://github.com/adamjernst))
- Fractional border widths on iOS are now the right size, honoring insets
  ([15179f1798](https://github.com/facebook/react-native/commit/15179f1798b277c1836441fcf7f3b7f0bd5a4636) by
  [@Nikita2k](https://github.com/Nikita2k))
- Implement `requiresMainQueueSetup` in _RCTTVNavigationEventEmitter_ to satisfy
  Xcode warning
  ([ee3532b5c2](https://github.com/facebook/react-native/commit/ee3532b5c266d5ee7fb12920cb611a41b1daf750) by
  [@charpeni](https://github.com/charpeni))
- Support the iPhone X in the sample project's header
  ([ad4b124aa1](https://github.com/facebook/react-native/commit/ad4b124aa117483b4a0ec9dfa145b8e9a17f06c6) by
  [@vincentriemer](https://github.com/vincentriemer))
- `testID` works on **TabBarItem** on iOS
  ([e19d9dec9b](https://github.com/facebook/react-native/commit/e19d9dec9b3b257b5db3dc77ed8b95b93570f1e3))
- On iOS, don't error on the first live-reload of large codebases because of too
  little wait time
  ([b6f1a6085f](https://github.com/facebook/react-native/commit/b6f1a6085f7470c16ae8850e7da8f4f9ae5c23ee) by
  [@lelandrichardson](https://github.com/lelandrichardson))
- Prevent iOS crash on receiving bad unicode in _XMLHTTPRequest_
  ([1c04ceeb4b](https://github.com/facebook/react-native/commit/1c04ceeb4ba954eee7ab34fc5b6c660d9772d9f6) by
  [@cdlewis](https://github.com/cdlewis))
- Define `pod_target_xcconfig` for PrivateDatabase
  ([38b96cd7bb](https://github.com/facebook/react-native/commit/38b96cd7bb391f64066a6c91daa4173db1f33445) by
  [@ide](https://github.com/ide))
- Fixed podspec include/excludes around tvOS
  ([ba1d7e92e4](https://github.com/facebook/react-native/commit/ba1d7e92e4f251b90a96be192214b5015cf6244e) by
  [@yygene](https://github.com/yygene))
- Don't spam the logs for iOS when receiving `ECONNREFUSED` on connecting to
  packager ([b1701ccaef](https://github.com/facebook/react-native/commit/b1701ccaefa0c8cbb6d820b2ad07e0d911027d7c)
  and [ff3dc2ed19](https://github.com/facebook/react-native/commit/ff3dc2ed19cdd4137ae8092599b16c09d4e2c711) by
  [@adamjernst](https://github.com/adamjernst))
- Don't crash Systrace when debugging JS remotely on iOS
  ([e8eec24706](https://github.com/facebook/react-native/commit/e8eec24706e792314ee574bbf7f7c0066c4f3a7a) by
  [@alexeylang](https://github.com/alexeylang))

### Removed

- Removing `reactBridgeDidFinishTransaction` from _RCTScrollView_
  ([a255204e3e](https://github.com/facebook/react-native/commit/a255204e3e7fddefd2d7b0de224101768757ca7a) by
  [@shergin](https://github.com/shergin))
- Removing inherited background color optimization from _RCTText_ to reduce code
  complexity – please give feedback if you find performance differences!
  ([8c8944c10f](https://github.com/facebook/react-native/commit/8c8944c10fb7dc30ea99657225f25ea438cf6e14) by
  [@shergin](https://github.com/shergin))

### Other

Below is a list of the remaining, low-level changes that made it into this
release of React Native.

- Foundational work for a new justifyContent value **space-evenly**
  ([1050e0b476](https://github.com/facebook/react-native/commit/1050e0b47611602b758f73d99f51a1dd5ceabade) by
  [@woehrl01](https://github.com/woehrl01))
- Add Systrace-based telemetry to Hermes GC
  ([05e862d48d](https://github.com/facebook/react-native/commit/05e862d48d363a8af765b2f0283569419dbd2e5c))
- Unify Systrace native hook argument passing
  ([52e3ae9063](https://github.com/facebook/react-native/commit/52e3ae9063705bac53bad99ffe23976c29c8f1b2) by
  [@amnn](https://github.com/amnn))
- Use different symbols for SystraceSection depending on `WITH_FBYSTRACE`
  ([03956c4ecf](https://github.com/facebook/react-native/commit/03956c4ecfda381396336f725ea1c12d913df17d))
- Don't set global.performance to undefined if it was initialized already
  ([dfebcb70a5](https://github.com/facebook/react-native/commit/dfebcb70a5c948db94d1cd580bbcaa0aaa702349) by
  [@alexeylang](https://github.com/alexeylang))
- Autofixes for migrating to Buck's source-only ABI feature
  ([801cbdb047](https://github.com/facebook/react-native/commit/801cbdb04788403cee022dec688136540da36fc5) by
  [@jkeljo](https://github.com/jkeljo))
- Add remote API to uninstall the global error handler in RN
  ([1d16923063](https://github.com/facebook/react-native/commit/1d16923063940606dda89de94a83cbdf5f98e1f1))
- Add _RCTLibraryPathForURL_ in _RCTUtil_
  ([2fecbf6171](https://github.com/facebook/react-native/commit/2fecbf61711f610124fc2453a79120932024f613))
- Fix sections that come from React Fiber
  ([1f40c95076](https://github.com/facebook/react-native/commit/1f40c95076297258a4194fd9c1b5af7002187c99) by
  [@alexeylang](https://github.com/alexeylang))
- Fix boolean conversion in sync RN method calls.
  ([dd888d3346](https://github.com/facebook/react-native/commit/dd888d3346ef9477eae2cd2d29cef867467cb503))
- Fix `embeddedBundleURL` update situation
  ([d1fc8ef3a3](https://github.com/facebook/react-native/commit/d1fc8ef3a3cb3590b9cff4d1b3cc5d440b52ec8c))
- Remove `android_react_native_perf.use_separate_ui_bg_thread` experiment.
  ([4f886a29a1](https://github.com/facebook/react-native/commit/4f886a29a1234c967deae2354bbc5092e0e6595e))
- ScrollView related files were moved to dedicated folder
  ([098a63a1ce](https://github.com/facebook/react-native/commit/098a63a1cee1196a2f3eb5135eeb8fe59e7e8272) by
  [@shergin](https://github.com/shergin))
- move page registration logic in to jsinspector
  ([bef7967f9a](https://github.com/facebook/react-native/commit/bef7967f9a485dc136d2cb32f552b2199ae3e2b8) by
  [@bnham](https://github.com/bnham))
- Type global hooks as function pointers
  ([eca51eb46a](https://github.com/facebook/react-native/commit/eca51eb46a47112c8933d0a3b932f59008cadc78) by
  [@johnislarry](https://github.com/johnislarry))
- `std::string` to `const char*`
  ([b952365ba6](https://github.com/facebook/react-native/commit/b952365ba6bd86f0e80a24aedec1f447cb3ec566) by
  [@johnislarry](https://github.com/johnislarry))
- Allow extending props supported by native animations
  ([71751e9cc7](https://github.com/facebook/react-native/commit/71751e9cc7c67306ca038c5b254e6e81fe0aff1b) by
  [@andrewimm](https://github.com/andrewimm))
- Meyers singleton jsc error extractor
  ([434f432d5d](https://github.com/facebook/react-native/commit/434f432d5d5ea2756c1adac8b1c36e82e60a2b13) by
  [@johnislarry](https://github.com/johnislarry))
- Do not overwrite the same text in **TextInput**
  ([29f3f55298](https://github.com/facebook/react-native/commit/29f3f5529827579101f0d8bd6afe72f1cb0caeca))
- Renaming _uiManagerWillFlushUIBlocks_ -> _uiManagerWillPerformMounting_
  ([0a8721c340](https://github.com/facebook/react-native/commit/0a8721c340480a972bb597cacdbddd9eb2015716) by
  [@shergin](https://github.com/shergin))
- Skylarkify flags macros.
  ([ed2bfcb35a](https://github.com/facebook/react-native/commit/ed2bfcb35a2756eb700882ab8e21b6b273efa80a) by
  [@ttsugriy](https://github.com/ttsugriy))
- Skylarkify `config_utils_defs` macros.
  ([88f6f69152](https://github.com/facebook/react-native/commit/88f6f69152e4b68609f28e80ee70705969529af8) by
  [@ttsugriy](https://github.com/ttsugriy))
- Round size geometry for Button and RichText components.
  ([4034febb7e](https://github.com/facebook/react-native/commit/4034febb7ef9d9daa894a75b038226af74026163) by
  [@iaroslav-pavlov](https://github.com/iaroslav-pavlov)
- Temporarily patched Map/Set non-extensible check into RN dev renderer
  ([a99f0d6100](https://github.com/facebook/react-native/commit/a99f0d6100c9779f5f6df6008af54c06113355f6) by
  [@bvaughn](https://github.com/bvaughn))
- Run buildifier over all BUCK files
  ([d674d48a7b](https://github.com/facebook/react-native/commit/d674d48a7b9b71169af59ceb886529371c26a2e5) by
  [@zertosh](https://github.com/zertosh))
- Pass `scriptURL` to _RCTTestRunner_
  ([266ab7a006](https://github.com/facebook/react-native/commit/266ab7a0061c11c4da7ccde9e0d461c0d7331563))
- Make _RCTNativeModule::invokeInner_ explicitely return `folly::none` in case
  of error ([0ac5a5230c](https://github.com/facebook/react-native/commit/0ac5a5230c4b5dd44db6a8dd7bb7752aff64d71c)
  by [@fromcelticpark](https://github.com/fromcelticpark))
- Make _RCTPackagerConnection_ a singleton
  ([9180d4eb82](https://github.com/facebook/react-native/commit/9180d4eb82fb70a0fd396b15660c2ac6770183c9) by
  [@adamjernst](https://github.com/adamjernst))
- Register split segment paths with _RAMBundleRegistry_
  ([cff0d8e0e5](https://github.com/facebook/react-native/commit/cff0d8e0e599d1ab21b36779b41fbb26512874aa) by
  [@fromcelticpark](https://github.com/fromcelticpark))
- check if listener is still in the set before calling `onHostResume`
  ([ad89ea7b50](https://github.com/facebook/react-native/commit/ad89ea7b5046c2cf9ca1cba88c387eb1db8dc042))
- export _SeparatorsObj_ type for re-use in **ListItem**s etc.
  ([c6fe101cdc](https://github.com/facebook/react-native/commit/c6fe101cdcc0b8d640a86108d8a76f7292b5f799) by
  [@sahrens](https://github.com/sahrens))
- Do not mark node as dirty if, new and old values are undefined
  ([41da6e3128](https://github.com/facebook/react-native/commit/41da6e31284d46bb1dd2053c3c3100c075ace019) by
  [@woehrl01](https://github.com/woehrl01))
- Remove _RAMBundleRegistry_ subclasses
  ([6ecae73fe5](https://github.com/facebook/react-native/commit/6ecae73fe5915863c27ac7e407f5b151fd0c5fc3) by
  [@fromcelticpark](https://github.com/fromcelticpark))
- Fix `minimumViewTime` in _ViewabilityHelper_
  ([d19d137cc1](https://github.com/facebook/react-native/commit/d19d137cc18f10957b5ac64ac727d15fde57f018))

[0.56]: https://github.com/facebook/react-native/compare/0.55-stable...0.56-stable
[0.55]: https://github.com/facebook/react-native/compare/0.54-stable...0.55-stable
[0.54]: https://github.com/facebook/react-native/compare/0.53-stable...0.54-stable
[0.53]: https://github.com/facebook/react-native/compare/0.52-stable...0.53-stable
[0.52.0]: https://github.com/facebook/react-native/compare/0.51-stable...0.52-stable
