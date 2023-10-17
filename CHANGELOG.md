# Changelog

This file contains all changelogs for latest releases, from 0.70.0 onward. Please check out the other `CHANGELOG-*.md` files for previous versions.

## v0.73.0-rc.0 / v0.73.0-rc.1

### Breaking

- Bump minimum Node JS version to 18 ([2eb25cbdbe](https://github.com/facebook/react-native/commit/2eb25cbdbe8d1ce720ffdf5f5d855e1cbf14142b))
- Require C++ 20 when including renderer headers ([3b5bea01d0](https://github.com/facebook/react-native/commit/3b5bea01d02ac93efeed237e474a8fe905272b24) by [@NickGerleman](https://github.com/NickGerleman))
- Remove included `flow-typed/` directory from the `react-native` package ([4540668c15](https://github.com/facebook/react-native/commit/4540668c1598075f7ae46449bcbcbb70f69fcd8a) by [@huntie](https://github.com/huntie))
- per-node `pointScaleFactor` ([dce7242ab6](https://github.com/facebook/react-native/commit/dce7242ab6855e7a546e6d25482311d995a4a63b) by [@NickGerleman](https://github.com/NickGerleman))
- Remove "UseLegacyStretchBehaviour" functions ([c35ff13a58](https://github.com/facebook/react-native/commit/c35ff13a58431dee4198bc55575312558cc39bf1) by [@NickGerleman](https://github.com/NickGerleman))
- Remove `YGConfigGetInstanceCount` ([858173280f](https://github.com/facebook/react-native/commit/858173280f515c81e2d9e76d0e0b81212ea61233) by [@NickGerleman](https://github.com/NickGerleman))
- Remove `interpolateProps` functionality from `ComponentDescriptor` to fix circular dependency between `react/renderer/core` and `react/renderer/components/view` ([bae63d492f](https://github.com/facebook/react-native/commit/bae63d492fa8254547453229f28332f08e8b881c))
- Migrate from native `CallInvoker` to `NativeMethodCallInvoker` ([b70f186b53](https://github.com/facebook/react-native/commit/b70f186b53c1d43ce5af681ba0be47dd9e61bcb5) by [@RSNara](https://github.com/RSNara))
- Change how we set cmake policy ([2b932c3820](https://github.com/facebook/react-native/commit/2b932c3820cfabef1590f6fcf8b95f65d9c21eb8) by [@NickGerleman](https://github.com/NickGerleman))
- Add `YGErrata` integration within C ABI ([0fd0f56f20](https://github.com/facebook/react-native/commit/0fd0f56f205dafed9a1960392a446f43255f29dc) by [@NickGerleman](https://github.com/NickGerleman))
- Set `runtimeConfig` provider for the `Template` ([2de964cfd2](https://github.com/facebook/react-native/commit/2de964cfd229e56eeae8b6e0a7a516ff3a1498ac) by [@dmytrorykun](https://github.com/dmytrorykun))

#### Android specific

- Fix: `role="searchbox"` should assign `"SearchField"` trait on iOS ([2749fbca9a](https://github.com/facebook/react-native/commit/2749fbca9a18fdff6c3e3dd3b3c5b8086cef9cc5) by [@mdjastrzebski](https://github.com/mdjastrzebski))
- Renamed FabricMountItem.* files to MountItem.* to better match the name of the struct. ([49f1237526](https://github.com/facebook/react-native/commit/49f1237526f80e3aa09833cc13c6bb9f8ea9187c))
- Deleting `warnOnLegacyNativeModuleSystemUse` ([9859fbc2ec](https://github.com/facebook/react-native/commit/9859fbc2ec9f50eba3672322a85ba7fd9fc11145) by [@philIip](https://github.com/philIip))
- Do not enable `excludeYogaFromRawProps` feature flag, if you need to pass layout props to Java view managers when using new architecture ([88e19c0ce6](https://github.com/facebook/react-native/commit/88e19c0ce68e933d274c45f9c3f79afc11ad5b0a) by [@zeyap](https://github.com/zeyap))
- Default to ignoring cached Metro bundle when offline ([2d6106055b](https://github.com/facebook/react-native/commit/2d6106055b629b18296d076c4f1287d8a5ba6ab8) by [@motiz88](https://github.com/motiz88))
- W3CPointerEvents: change click event from direct to bubbling ([61eb9b4453](https://github.com/facebook/react-native/commit/61eb9b4453c96d3dc662319c9c9f322bf04d1d44))
- Fix `ReactTextView` `setPadding` applying logic error ([d8ced6f895](https://github.com/facebook/react-native/commit/d8ced6f8953cd896471983714e722caf50783960) by [@jcdhlzq](https://github.com/jcdhlzq))
- Add `view` getter on `RCTRootView` / `RCTFabricSurfaceHostingProxyRootView ([33e0521788](https://github.com/facebook/react-native/commit/33e0521788484eaba20beeeaabba2496854583a7) by [@zoontek](https://github.com/zoontek))

#### iOS specific

- Metro will no longer be started when running builds via Xcode ([dc6845739e](https://github.com/facebook/react-native/commit/dc6845739e29ea8cf63583d530f67c2498286a3e) by [@huntie](https://github.com/huntie))
- `RCTTurboModuleRegistry` is unavailable in `RCTRootView` and `RCTSurfaceHostingProxyRootView` ([268d9edad6](https://github.com/facebook/react-native/commit/268d9edad69a22710711be055100680817b28791) by [@philIip](https://github.com/philIip))
- `HasBridge` is removed from `RCTRootView` and `RCTSurfaceHostingProxyRootView` ([57b86f7a87](https://github.com/facebook/react-native/commit/57b86f7a87b7bed09124cc513d5069b4c0069a4f) by [@philIip](https://github.com/philIip))
- Remove `sizeMeasureMode` argument from `RCTSurfaceHostingProxyRootView` constructor ([0d83c1a668](https://github.com/facebook/react-native/commit/0d83c1a6685222f97cd0c715270ca67192f89361) by [@philIip](https://github.com/philIip))
- Deleting `RCTFabricSurfaceHostingProxyRootView` ([676676c954](https://github.com/facebook/react-native/commit/676676c95428ca92007160bf420eccc62ba41ea4) by [@philIip](https://github.com/philIip))
- Delete RCT_EXPORT_PRE_REGISTERED_MODULE ([8cd5b2a57d](https://github.com/facebook/react-native/commit/8cd5b2a57d5b6af2ef1c6b1d673e328353ea776b) by [@philIip](https://github.com/philIip))
- Replace `RCTLocalAssetImageLoader` with `RCTBundleAssetImageLoader` ([b675667a47](https://github.com/facebook/react-native/commit/b675667a47f651e85d66e12daaeeec00371d1b23) by [@hellohublot](https://github.com/hellohublot))
- Add `React-FabricImage` pod. ([44af6ca03c](https://github.com/facebook/react-native/commit/44af6ca03cdb9e8c4c2cd67a2e097025bc21e17f) by [@cipolleschi](https://github.com/cipolleschi))
- Make `getModuleInstanceFromClass` required ([5a7799eead](https://github.com/facebook/react-native/commit/5a7799eead0eb26f1f42d097d89af757eb6539d1) by [@philIip](https://github.com/philIip))
- Make `getModuleClassFromName` required ([fbf196dd05](https://github.com/facebook/react-native/commit/fbf196dd05f367c841fa53b1c0ae7fcee9ca1721) by [@philIip](https://github.com/philIip))
- Remove `openURL` method from `RCTInspectorDevServerHelper` ([3ef7de848d](https://github.com/facebook/react-native/commit/3ef7de848d6d4d95fe1ce4e4cf80bbfceeabb746) by [@huntie](https://github.com/huntie))

### Added

- Enable animating skew in transforms with native driver ([645b643f68](https://github.com/facebook/react-native/commit/645b643f681f5260ae0505cf91cfb8f6ecdb33c0), [4934cdb403](https://github.com/facebook/react-native/commit/4934cdb40385c6417e87cf9d3ee985c06d207136) by [@genkikondo](https://github.com/genkikondo))
- Support customization of underlying Touch event representation in out-of-tree platforms ([4884322781](https://github.com/facebook/react-native/commit/4884322781d92e019e78d89e5693b9ec029aaa7a))
- Support customization of underlying Color representation in out-of-tree platforms ([2b688f6031](https://github.com/facebook/react-native/commit/2b688f603159c2cc9ba821f3efe8a07504400285))
- Support lazy bundling in development ([799b0f4be8](https://github.com/facebook/react-native/commit/799b0f4be80a6c4b6bfc1d8bb3b887af4b1b7081) by [@motiz88](https://github.com/motiz88))
- Fixup hack for flex line size calculation ([598b7ed690](https://github.com/facebook/react-native/commit/598b7ed690d908c408adea970d26382c834f5ead) by [@NickGerleman](https://github.com/NickGerleman))
- Added a third parameter "contentType" to method `slice` of class `Blob`. ([e35ca71bca](https://github.com/facebook/react-native/commit/e35ca71bca6231138eadbc281177a8ff7948c071) by [@trashcoder](https://github.com/trashcoder))
- Added plugins for private methods and properties to `@react-native/babel-preset`. ([db4a253c1e](https://github.com/facebook/react-native/commit/db4a253c1e8bad29df83cb649cef4132701930f0) by [@yungsters](https://github.com/yungsters))
- Add `react-native/typescript-config` ([cae52f6cf8](https://github.com/facebook/react-native/commit/cae52f6cf878ef7ea2fc31a6197154873059a496) by [@NickGerleman](https://github.com/NickGerleman))
- Better TypeScript support for `package.json` exports field ([1b0e8b1de4](https://github.com/facebook/react-native/commit/1b0e8b1de470bd5501d78defce6ad6fe4b2ade4b) by [@NickGerleman](https://github.com/NickGerleman))
- Add the new media permission to typescript ([630cf3b21c](https://github.com/facebook/react-native/commit/630cf3b21cbd26154e4bed64871408439ddb8d97))
- Added `contentType` parameter to Blob declaration ([ff40138c76](https://github.com/facebook/react-native/commit/ff40138c76a9a6028a8c063c95f9c6762bb47e9a) by [@trashcoder](https://github.com/trashcoder))
- Remove `testID` from `TextStyle` types ([3273d38d3b](https://github.com/facebook/react-native/commit/3273d38d3bbcb0aa0a01cd6c5b959785db2a79dc) by [@tobua](https://github.com/tobua))
- Log a warning if `npx react-native` uses old cached version ([bfca23a25d](https://github.com/facebook/react-native/commit/bfca23a25d098d1b5c599c1611fafa1d17edebec) by [@blakef](https://github.com/blakef))
- Recognize dictionary type in codegen ([4fd8f405be](https://github.com/facebook/react-native/commit/4fd8f405beaefdf897ee8e511542fca3d6d71728) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Generate events with arrays ([b422375782](https://github.com/facebook/react-native/commit/b422375782441c5836390579d0030be94a395f0c) by [@cipolleschi](https://github.com/cipolleschi))
- Add generic support for Arrays in Events parsing ([6168701887](https://github.com/facebook/react-native/commit/6168701887ca48ae790bc2fc4058f7e65d32fc89) by [@cipolleschi](https://github.com/cipolleschi))
- Remove config variant copy ctor from `YGNode` ([72fb75d4d4](https://github.com/facebook/react-native/commit/72fb75d4d48d3dbe4a339b2503b796716af6e5b5) by [@NickGerleman](https://github.com/NickGerleman))
- Define Flag operators for `YGPrintOptions` ([fe6f70b913](https://github.com/facebook/react-native/commit/fe6f70b9139d97cff24dac6a60b724848e65a5d1) by [@NickGerleman](https://github.com/NickGerleman))
- Add YGErrata Enum ([c7dcb42b8a](https://github.com/facebook/react-native/commit/c7dcb42b8acbf02bd95090bf17fe45437c52a5ab) by [@NickGerleman](https://github.com/NickGerleman))
- Cleanup YGNode for explicit per-node config ([0e5d54a8ee](https://github.com/facebook/react-native/commit/0e5d54a8ee8f43cf39c3ee9b47acdcb933a762ab) by [@NickGerleman](https://github.com/NickGerleman))
- Added customizeStack hook to Metro's `/symbolicate` endpoint to allow custom frame skipping logic on a stack level. ([03e78010ae](https://github.com/facebook/react-native/commit/03e78010aef3984287c34902df46268bbe9723e9) by [@GijsWeterings](https://github.com/GijsWeterings))
- Enable TurboModule interop in Bridgeless mode ([aa1ad5496c](https://github.com/facebook/react-native/commit/aa1ad5496cdc0323de6e2b083a7e3e1826ef8289) by [@RSNara](https://github.com/RSNara))
- Native view config interop layer enabled in bridgeless mode. ([4fbe05577b](https://github.com/facebook/react-native/commit/4fbe05577b7fd0dd1633fa422c33548ba97d4e8c) by [@dmytrorykun](https://github.com/dmytrorykun))

#### Android specific

- Add `performance.reactNativeStartupTiming.initializeRuntimeStart` and `performance.reactNativeStartupTiming.initializeRuntimeEnd` API ([50638714f5](https://github.com/facebook/react-native/commit/50638714f5cbf110300aa2a3ecd63a3a25a9ac00), [10e8b3538f](https://github.com/facebook/react-native/commit/10e8b3538f65d54ebe28afea4b0f1cfd4a8233a0))
- Transform origin ([9e68599daf](https://github.com/facebook/react-native/commit/9e68599daf844b06bd010c43cbabf3dc593bb114) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- Websocket Module setCustomClientBuilder ([0cdb9e6a52](https://github.com/facebook/react-native/commit/0cdb9e6a52f69ebee635d5bfaa34a52f6059dd47) by [@MO-Lewis](https://github.com/MO-Lewis))
- Remove JNI Binding usage of layoutContext ([733c9289a1](https://github.com/facebook/react-native/commit/733c9289a15afe2c39a6bde56a472fe879a855f8) by [@NickGerleman](https://github.com/NickGerleman))
- Added testing shadow helpers for robolectric ([4890d50edd](https://github.com/facebook/react-native/commit/4890d50eddbd9035e567134ac9b7d8570bae60f1) by [@philIip](https://github.com/philIip))

#### iOS specific

- Added support for iOS 17+ text content types ([216865cdb7](https://github.com/facebook/react-native/commit/216865cdb7cfbb9280a40cb1f3065a8961869cba) by [@robwalkerco](https://github.com/robwalkerco))
- Add support for building with Xcode 15 ([10d55888cc](https://github.com/facebook/react-native/commit/10d55888cce0b625c4b05a19ed609154893d17d0) by [@AlexanderEggers](https://github.com/AlexanderEggers))
- Fixed cursor height on multiline text input ([987c6fd298](https://github.com/facebook/react-native/commit/987c6fd29868e18d9c881837a795d5d12588ca4e), [e1885853ac](https://github.com/facebook/react-native/commit/e1885853ac46f4e84af9e4a50203d50b773f1a27) by [@soumyajit4419](https://github.com/soumyajit4419))
- Added support for `transform-origin` on old arch ([5f40f0800e](https://github.com/facebook/react-native/commit/5f40f0800e64b4380d7897b2e8b9ff561d84b97c) by [@jacobp100](https://github.com/jacobp100))
- Now it is possible to build Hermes from local source directory. Just set REACT_NATIVE_OVERRIDE_HERMES_DIR to the path to that directory. ([45f7e117ad](https://github.com/facebook/react-native/commit/45f7e117ad0df4f6be1344588ac932a21cd192e2) by [@dmytrorykun](https://github.com/dmytrorykun))
- Add all fontVariant values for font-variant-ligatures ([f0893cf72f](https://github.com/facebook/react-native/commit/f0893cf72ff0dfbd61b1fc28526420c6c20557d3) by [@finnp](https://github.com/finnp))
- Support bridgeless with JSC and frameworks ([3965158a2d](https://github.com/facebook/react-native/commit/3965158a2d37c96c82f5c03e8beaeb7356c1d0f7))
- Add pods for bridgeless ([b06c2d7050](https://github.com/facebook/react-native/commit/b06c2d7050e91491b653444d749cef3da6e86a75))
- Added override method with default implementation ([abc6e1cbf4](https://github.com/facebook/react-native/commit/abc6e1cbf4cf9775205b0246404b0059a5838fba) by [@Gregoirevda](https://github.com/Gregoirevda))
- Add `smartInsertDelete` prop to `TextInput` component ([6b62f12ce9](https://github.com/facebook/react-native/commit/6b62f12ce957a6eea47f4abc1ead23f64d883ce8) by [@fabioh8010](https://github.com/fabioh8010))
- Add explicit dependencies for 3rd parties libraries ([c027f0a41f](https://github.com/facebook/react-native/commit/c027f0a41fd53a457a425d84e2c1e0ab6b862173) by [@cipolleschi](https://github.com/cipolleschi))
- Added conversion helper for UIInterfaceOrientationMask to RCTConvert ([2ab750f7bb](https://github.com/facebook/react-native/commit/2ab750f7bbcfcc81714054cabb574442f33298bf))

### Changed

- Use new Hermes CDP handler implementation for debugging ([3e7a873f2d](https://github.com/facebook/react-native/commit/3e7a873f2d1c5170a7f4c88064897e74a149c5d5) by [@huntie](https://github.com/huntie))
- Add 'j' to debug key trigger from CLI ([321f7dbcad](https://github.com/facebook/react-native/commit/321f7dbcadb78dede9048500ab8abe86af863061) by [@huntie](https://github.com/huntie))
- Relax FlatList.onViewableItemsChanged validation ([5cfa125b97](https://github.com/facebook/react-native/commit/5cfa125b979c7ce76884a81dd3baaddcf4a560fd))
- Don't use setState for disabled KeyboardAvoidingView to avoid re-renders ([783150f37b](https://github.com/facebook/react-native/commit/783150f37be790f44e5a368982a200c7c08a866f) by [@adamgrzybowski](https://github.com/adamgrzybowski))
- Add mock removeEventListener and currentState method for `AppState` ([1bda78f2fa](https://github.com/facebook/react-native/commit/1bda78f2fa64210cdfb1d84f0ce0d56be446e3e8) by [@w3cay](https://github.com/w3cay))
- Default condition set for experimental Package Exports is now ['require', 'import', 'react-native'] ([808b3c9716](https://github.com/facebook/react-native/commit/808b3c9716e6d96b9e7308e46802de48ddc626d0) by [@huntie](https://github.com/huntie))
- Remove default 50ms Scroll Event Throttling in VirtualizedList ([3eccc53629](https://github.com/facebook/react-native/commit/3eccc536292aa344f8d796e9325ab2aaeacfa24e) by [@NickGerleman](https://github.com/NickGerleman))
- Sync AnimatedValue JS node value when animation completes ([51cea49be7](https://github.com/facebook/react-native/commit/51cea49be73250f5b346db9882a2da522cd508d8) by [@genkikondo](https://github.com/genkikondo))
- Return animated values to JS for natively driven animations ([4b54c0b1fa](https://github.com/facebook/react-native/commit/4b54c0b1faf8233986bf9232e1a18a1c5067ad3a) by [@genkikondo](https://github.com/genkikondo))
- Fixed `source` in `Image` type ([83885f1d69](https://github.com/facebook/react-native/commit/83885f1d693fdb7d3ce369cc67bcd39a9755f987) by [@BrodaNoel](https://github.com/BrodaNoel))
- Address errors in viewability thresholds on Virtualized list by Math.floor the top and bottom dimensions of a cell item when determining viewability. ([824c1c6d07](https://github.com/facebook/react-native/commit/824c1c6d073ba53aab350bc617169ba04e568b19) by [@lunaleaps](https://github.com/lunaleaps))
- Change `_onLayout` to update bottom height when frame height is changed ([5059ddc5ce](https://github.com/facebook/react-native/commit/5059ddc5ce623234820f231e5f4d75ea9ddf5a5b) by [@lyqandy](https://github.com/lyqandy))
- Renaming bridgeless to runtime ([1547b81ec1](https://github.com/facebook/react-native/commit/1547b81ec18f4d66991831d06ce456472456bed5))
- Upgraded Metro to 0.79.1 ([982f6f99d4](https://github.com/facebook/react-native/commit/982f6f99d43b21b3a81d3388591934d6f83afa63))
- Bump Jest version in the new project template from `^29.2.1` to `^29.6.3` ([3c323382fe](https://github.com/facebook/react-native/commit/3c323382fe9ef05832fc44c6e87642de55965a4b) by [@robhogan](https://github.com/robhogan))
- ReactImagePropertyList.java => ReactImagePropertyList.kt ([cb60e5c67b](https://github.com/facebook/react-native/commit/cb60e5c67b409da1b22e856446183bc7c82d828b) by [@bufgix](https://github.com/bufgix))
- `BaseViewManagerTest.java` => `BaseViewManagerTest.kt` ([3660b7cf73](https://github.com/facebook/react-native/commit/3660b7cf73a322750fb9cc9aa124da0f5e739c80) by [@retyui](https://github.com/retyui))
- React-native/babel-plugin-codegen to react-native/babel-preset ([1c3b3a09b6](https://github.com/facebook/react-native/commit/1c3b3a09b60efc55456ecfe4b79b8cc73d30f739) by [@dmytrorykun](https://github.com/dmytrorykun))
- Replace `JSX.Element` with `React.JSX.Element` in `App.tsx` template ([1383a59ed2](https://github.com/facebook/react-native/commit/1383a59ed265531092de68ceb50dbf449070d7c0) by [@retyui](https://github.com/retyui))
- Move react-native-babel-transformer and react-native-babel-preset from Metro to React Native repo. ([d380bb8473](https://github.com/facebook/react-native/commit/d380bb8473f1c03ca277074e952f03649d767766) by [@dmytrorykun](https://github.com/dmytrorykun))
- Stricter TS check for transform style ([e414713e4c](https://github.com/facebook/react-native/commit/e414713e4c6d19a4f4aaa0193f540636dd936eb0) by [@vonovak](https://github.com/vonovak))
- Bump Flipper to 0.204.0 ([d9c8cd3b40](https://github.com/facebook/react-native/commit/d9c8cd3b4051ecb9230a44289f9cf026b954ecdb) by [@szymonrybczak](https://github.com/szymonrybczak))
- Remove YGExperimentalFeatureFixAbsoluteTrailingColumnMargin ([3f6412b934](https://github.com/facebook/react-native/commit/3f6412b934250ef2c0fe2d573ea10f77b0e5eaa3) by [@NickGerleman](https://github.com/NickGerleman))
- Pressable: prevent click bubbling in Pressable ([a449291323](https://github.com/facebook/react-native/commit/a44929132397181a11ec02e77e60b2bb0bb6add6))
- Dirty nodes when dynamically setting config ([bde38d543e](https://github.com/facebook/react-native/commit/bde38d543e82d75b155ad60421674fb3549ef175) by [@NickGerleman](https://github.com/NickGerleman))
- Jest globals are now defined using `Object.defineProperties` instead of object property assignment ([cf631ad59f](https://github.com/facebook/react-native/commit/cf631ad59f39bbace1a7c2311a4f66f9494ed0da) by [@yungsters](https://github.com/yungsters))
- Support mixed props for events in codegen ([b68f53d44f](https://github.com/facebook/react-native/commit/b68f53d44f78c5627905246d8737fe46229f85aa) by [@genkikondo](https://github.com/genkikondo))
- React-native-codegen: Buck-only: renamed src_prefix kwarg ([9193c4f50c](https://github.com/facebook/react-native/commit/9193c4f50c471193979bab589996d97bab489db4) by [@fkgozali](https://github.com/fkgozali))

#### Android specific

- Convert the app template to Kotlin ([c1c22ebacc](https://github.com/facebook/react-native/commit/c1c22ebacc4097ce56f19385161ebb23ee1624b3) by [@cortinico](https://github.com/cortinico))
- Upgrade target sdk version to 34 ([a6b0984893](https://github.com/facebook/react-native/commit/a6b0984893a6d1d9da5c4f69edcb3aed6407730e))
- Bump NDK to 25 ([28deaa3a71](https://github.com/facebook/react-native/commit/28deaa3a71085dc877da7f68dcec78c63bd9192a) by [@szymonrybczak](https://github.com/szymonrybczak))
- Remove Flipper actions in Dev Menu, add new Open Debugger action ([3bc402f612](https://github.com/facebook/react-native/commit/3bc402f612571fbfb70c309dcb2faaf67a524cfc) by [@huntie](https://github.com/huntie))
- Add `scrollEventThrottle` prop support for android ([777934ec3a](https://github.com/facebook/react-native/commit/777934ec3ad05486602e73169cd4f2e7523cc93f))
- Don't display the PopupWindow when current activity is in a bad state ([cee5dceac7](https://github.com/facebook/react-native/commit/cee5dceac7285fbae76139ebd58784009e2da2fb))
- React trees will be unmounted when the application is reloaded ([e133100721](https://github.com/facebook/react-native/commit/e133100721939108b0f28dfa9f60ac627c804018) by [@javache](https://github.com/javache))
- Fix crash "lateinit property initialProps has not been initialized" ([188eceec98](https://github.com/facebook/react-native/commit/188eceec98a6e6892c66fb81214ee5f646ce97a9))
- Deprecating createNativeModules method from ReactPackage interface recommending using getModule instead in the new architecture of React Native ([33181ef8af](https://github.com/facebook/react-native/commit/33181ef8afd621252c7cbf181b15fc162fc294a2) by [@mdvacca](https://github.com/mdvacca))
- Introducing getModule method into ReactPackage interface, defaulting to null. This method will be used in the Stable API of React Native ([da8616ec69](https://github.com/facebook/react-native/commit/da8616ec69a12a90b973fea1d8345c7517408a73) by [@mdvacca](https://github.com/mdvacca))
- Update Java tests to Kotlin for the referenced file ([3dbb759506](https://github.com/facebook/react-native/commit/3dbb7595060b1454fbd8ec80cb851fe6af8f41da) by [@stewartsum](https://github.com/stewartsum))
- Deprecate JSCJavaScriptExecutorFactory and JSCJavaScriptExecutor, use com.facebook.react.jscexecutor instead ([0cac88fa65](https://github.com/facebook/react-native/commit/0cac88fa65fd33dd6164ed2d6c4fbcdfa47f9e82) by [@mdvacca](https://github.com/mdvacca))
- Throw ReactNoCrashSoftException when handle memeory pressure to avoid crash ([fa9ea8326e](https://github.com/facebook/react-native/commit/fa9ea8326e693b258e303aee6f59b049dcecea31))
- Throw Error in dispatchViewManagerCommand when non-numeric tag is passed for easier debugging ([0519c11acd](https://github.com/facebook/react-native/commit/0519c11acd0c347db378bbc9238c7dabfd38f6fa) by [@hsource](https://github.com/hsource))
- Moved ReactFontManager to a common package ([7341f9abdc](https://github.com/facebook/react-native/commit/7341f9abdcfbf5cf4dd5f8cda49151b28ae246bf) by [@fkgozali](https://github.com/fkgozali))
- Throw Error in dispatchViewManagerCommand when non-numeric tag is passed for easier debugging ([ff1972daba](https://github.com/facebook/react-native/commit/ff1972dabafbbfc18203464b452e0d5b796cdcf6) by [@hsource](https://github.com/hsource))
- Fresco to 3.0.0 ([823839bcc1](https://github.com/facebook/react-native/commit/823839bcc13526a5a37a0d316f90a39f6bf283bd) by [@cortinico](https://github.com/cortinico))
- Avoid duplicate destroy on same thread ([43f7781c87](https://github.com/facebook/react-native/commit/43f7781c87c3540f2ad09147ea3fb63765b72f01))
- Use new `getCanonicalName` and `getMessage` methods exposed by `fbjni` ([6c729acd12](https://github.com/facebook/react-native/commit/6c729acd12933d79aae3ef05dbdecfa0feb96bf4) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- Changed the scope of `setJSEngineResolutionAlgorithm` to public from private. Brownfield apps should be able to setup the JSResolutionAlgorithm before hand. ([cb376dd0d8](https://github.com/facebook/react-native/commit/cb376dd0d80fce9284c96fc5c03503a5c159fe86) by [@SparshaSaha](https://github.com/SparshaSaha))
- Java to 17 and AGP to 8.0.2 ([9f7dddf1ac](https://github.com/facebook/react-native/commit/9f7dddf1ac34a54f27c97d2e451e7cb724cd0094) by [@cortinico](https://github.com/cortinico))
- Use reference Yoga CMake Build ([6764adafe4](https://github.com/facebook/react-native/commit/6764adafe4c702b3d514179e4e6cfa0534f44de2) by [@NickGerleman](https://github.com/NickGerleman))
- Enable Template with Bridgeless ([8b2f324a9b](https://github.com/facebook/react-native/commit/8b2f324a9b915f504b237cad1281735b22684444))
- Kotlin to 1.8.0 and JDK Toolchain to 11 ([74987b6fca](https://github.com/facebook/react-native/commit/74987b6fca4aa31e15f83d871138f4edf258c082) by [@cortinico](https://github.com/cortinico))
- Deprecate APIs that are deprecate only on JavaDoc ([1be65baf29](https://github.com/facebook/react-native/commit/1be65baf29967ec062f049d57d579694af816c1c) by [@cortinico](https://github.com/cortinico))
- Gradle to 8.1 ([74f256b6f0](https://github.com/facebook/react-native/commit/74f256b6f019877c2854541845e11e024c16dd44) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Remove Flipper actions in Dev Menu, add new Open Debugger action ([5bfc507655](https://github.com/facebook/react-native/commit/5bfc5076557c92211bb58f8ac8fc008e87b14228) by [@huntie](https://github.com/huntie))
- Moved the min iOS version to 13.4 ([610b14e4f3](https://github.com/facebook/react-native/commit/610b14e4f3f606cd4c49518b9a42e3290fd52aeb) by [@cipolleschi](https://github.com/cipolleschi))
- TurboModules are now exposed to JS as the prototype of a plain JS object, so methods can be cached ([20dba39dab](https://github.com/facebook/react-native/commit/20dba39dab4ef85eb28659a89b19750cec3193a4) by [@javache](https://github.com/javache))
- Restored `cancelable` option in `Pressability` configuration to not block native responder, and instead introduced a new optional `blockNativeResponder` boolean option to accomplish the same thing. ([30e2345b26](https://github.com/facebook/react-native/commit/30e2345b263233a4ebac6a4839885c8bc337bdfd) by [@yungsters](https://github.com/yungsters))
- Scroll `ScrollView` text fields into view with `automaticallyAdjustsScrollIndicatorInsets` ([9ca16605e0](https://github.com/facebook/react-native/commit/9ca16605e0eb7b30996f10109aa9080088078995) by [@adamaveray](https://github.com/adamaveray))
- Remove Xcode 15 `_LIBCPP_ENABLE_CXX17_REMOVED_UNARY_BINARY_FUNCTION` workaround for boost ([b9f0bdd12d](https://github.com/facebook/react-native/commit/b9f0bdd12d9d7eeb5a6cc13a4e9793fc6031a94b) by [@Kudo](https://github.com/Kudo))
- Updated comment in RCTBundleURLProvider.h to instance correct jsBundleURLForBundleRoot:fallbackExtension method. ([d208dc422c](https://github.com/facebook/react-native/commit/d208dc422c9239d126e0da674451c5898d57319d) by [@JulioCVaz](https://github.com/JulioCVaz))
- Set the new arch flag based on the React Native version. ([a8d268593a](https://github.com/facebook/react-native/commit/a8d268593ae811fcc0ef10749aab84abfb8ec89e) by [@cipolleschi](https://github.com/cipolleschi))
- Add RCTPlatformName to RCTConstants.h ([046ae12a6d](https://github.com/facebook/react-native/commit/046ae12a6db9e7404131b28f44e2cf842551e3f3) by [@Saadnajmi](https://github.com/Saadnajmi))
- Use the runtime scheduler in the old Architecture ([2692f206a6](https://github.com/facebook/react-native/commit/2692f206a6ff16f65d47f70774908db816cee989) by [@cipolleschi](https://github.com/cipolleschi))
- Set DEFINES_MODULE xcconfig in React-RCTAppDelegate to generate a module map for this pod ([7c79e3107f](https://github.com/facebook/react-native/commit/7c79e3107fe735d4afa41c29ab9a3453cab38d11) by [@tsapeta](https://github.com/tsapeta))
- Move .m to .mm to make obj-c and C++ headers compatible ([42d67452eb](https://github.com/facebook/react-native/commit/42d67452eb9a507651078882d00df44dd6720049))
- Remove deprecated uses of UIActivityIndicatorViewStyle ([62e9faefd5](https://github.com/facebook/react-native/commit/62e9faefd5f12f5fe6dc88a076ddf7cafda75ee5) by [@Saadnajmi](https://github.com/Saadnajmi))
- Fix setRuntimeConfigProvider called multiple times error ([637ffb175d](https://github.com/facebook/react-native/commit/637ffb175db17af0582d503e9f510c4fe35c115b))
- Set initial AppState status to "inactive" instead of "unknown" ([54a5ff9745](https://github.com/facebook/react-native/commit/54a5ff9745ca8713b8d3a83dc37792ea71597b53) by [@louiszawadzki](https://github.com/louiszawadzki))
- Return animated values to JS for natively driven animations ([b0485bed09](https://github.com/facebook/react-native/commit/b0485bed0945061becace5af924fa60b17ab295f) by [@genkikondo](https://github.com/genkikondo))
- Disabled bitcode for Hermes prebuilts ([de6bfec82a](https://github.com/facebook/react-native/commit/de6bfec82a1cb4b387bfe8a87b1f597f39572764) by [@cipolleschi](https://github.com/cipolleschi))
- Make RNTester use RCTAppDelegate ([680cbe757b](https://github.com/facebook/react-native/commit/680cbe757b250fd9a05862040c080f063b2197a7) by [@cipolleschi](https://github.com/cipolleschi))
- Changed AppDelegate template to avoid retaining TurboModuleManager. ([ec1ab73674](https://github.com/facebook/react-native/commit/ec1ab736744bb3a511ce38cace8891b01436ae75) by [@javache](https://github.com/javache))
- Migrate RNTester to Bridgeless ([d3c28d28a9](https://github.com/facebook/react-native/commit/d3c28d28a9b5324310f0d86c284d3d8ffd63615b))
- Re-organise BridgelessApple files to keep proper header file include structure ([736dd5a3c0](https://github.com/facebook/react-native/commit/736dd5a3c0c074db25551db080e8f0a925f37bd8))

### Deprecated

- Deprecate YGConfigSetUseLegacyStretchBehaviour ([7f300cd755](https://github.com/facebook/react-native/commit/7f300cd75539ba153ce3ee4758a9b1ea1f00a247) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- Deprecate hasConstants from ReactModule annotation ([ccfd4c080c](https://github.com/facebook/react-native/commit/ccfd4c080ccaf9b030dbd6f3f5a3242b457db8be) by [@philIip](https://github.com/philIip))
- ReactModuleInfo constructor with getConstants arg is deprecated ([9f52378cc1](https://github.com/facebook/react-native/commit/9f52378cc1061c7c9dae6aee5147bb54f0aa24aa) by [@philIip](https://github.com/philIip))
- HasConstants in ReactModuleInfo is marked as deprecated ([196d9f9520](https://github.com/facebook/react-native/commit/196d9f9520be90190618c0f459719ffa08ab9673) by [@philIip](https://github.com/philIip))
- Deprecating EventBeatManager constructor that receives a Context as a parameter. ([363224ea62](https://github.com/facebook/react-native/commit/363224ea626a3ddc51500a16d337da1df2d09633) by [@mdvacca](https://github.com/mdvacca))
- Deprecate and mark for removal com.facebook.react.common.StandardCharsets, please use java.nio.charset.StandardCharsets instead ([c0b4883058](https://github.com/facebook/react-native/commit/c0b488305860fabd3d737674d614e4f466ace0ed) by [@mdvacca](https://github.com/mdvacca))
-  ([a4fe9b2b6d](https://github.com/facebook/react-native/commit/a4fe9b2b6da84ebfa5b90883dc4787e95e98405f) by [@philIip](https://github.com/philIip))
- Deprecate TurboModuleManager.getLegacyCxxModule ([7a08fbb088](https://github.com/facebook/react-native/commit/7a08fbb0882779330b2135962842ddc92166be5c) by [@RSNara](https://github.com/RSNara))
- Deprecate TurboModuleRegistry.getModule(), getModules(), hasModule(), ([3af66bf7fb](https://github.com/facebook/react-native/commit/3af66bf7fbd88d77fe27770bcb829768bf949b9c) by [@RSNara](https://github.com/RSNara))

#### iOS specific

- Deprecate `get_default_flags` in Ruby scripts ([f60b9f695e](https://github.com/facebook/react-native/commit/f60b9f695e1c08714735b78366267127b29ab705) by [@cipolleschi](https://github.com/cipolleschi))
- Use -[RCTTurboModuleManager installJSBindings:] instead of -[RCTTurboModuleManager installJSBindingWithRuntimeExecutor:] ([7fb9e4f46c](https://github.com/facebook/react-native/commit/7fb9e4f46c3131f74a9672afc6cc426a61adde0c) by [@javache](https://github.com/javache))

### Removed

- Remove remote debugging from the dev menu ([28e1ca9873](https://github.com/facebook/react-native/commit/28e1ca98737014a9a1735789b3fb817255ffdfdf) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Remove experimental support for loading bytecode from Metro ([6abc097bf3](https://github.com/facebook/react-native/commit/6abc097bf32ade1438fcf6c33bf6cc8c192249f8) by [@motiz88](https://github.com/motiz88))
- Remove internal DevSplitBundleLoader native module ([6dcdb93ec0](https://github.com/facebook/react-native/commit/6dcdb93ec0c581f08b4f4a4ea1816571f15cc2ca) by [@motiz88](https://github.com/motiz88))

#### Android specific

- Remove unused `canLoadFile` function from HermesExecutor.java ([1b7e26cccb](https://github.com/facebook/react-native/commit/1b7e26cccb3460b3525ab5066313f5dd2254ac30) by [@cortinico](https://github.com/cortinico))
- Polish DevServerHelper (remove unused Interfaces) ([7dcaf00835](https://github.com/facebook/react-native/commit/7dcaf008352d53feeb9ced493adb10d72f9e04c1) by [@cortinico](https://github.com/cortinico))
- DevServerHelper should not depend on internal ctor parameter ([da358d0ec7](https://github.com/facebook/react-native/commit/da358d0ec7a492edb804b9cdce70e7516ee518ae) by [@cortinico](https://github.com/cortinico))
- Deprecate Java YogaConfig.setUseLegacyStretchBehaviour() ([f635341461](https://github.com/facebook/react-native/commit/f6353414613f89ce309547c43fab6c3ca5315266) by [@NickGerleman](https://github.com/NickGerleman))
- Remove TurboModuleManagerDelegate.getLegacyCxxModule ([6f10110555](https://github.com/facebook/react-native/commit/6f10110555694ec659a87f41b65ca12ee044d908) by [@RSNara](https://github.com/RSNara))
- Remove TurboModuleManager.getNativeModule,getNativeModules,hasNativeModule ([ac2a4d8e6c](https://github.com/facebook/react-native/commit/ac2a4d8e6cee233686e497e29518f0f11a89a4d7) by [@RSNara](https://github.com/RSNara))
- Delete hasConstants() method from BaseJavaModule ([bbc3657ff4](https://github.com/facebook/react-native/commit/bbc3657ff4efd0218e02ad9a3c73725a7f8a366c) by [@mdvacca](https://github.com/mdvacca))
- Deleted obsolete native methods DevServerHelper.symbolicateStackTrace and DevServerHelper.openStackFrameCall ([ad46bc6d77](https://github.com/facebook/react-native/commit/ad46bc6d775330ed55c5b945c8b3cf7145ad5a61) by [@GijsWeterings](https://github.com/GijsWeterings))
- Reduce visibility of DevInternalSettings class ([1a9e444b61](https://github.com/facebook/react-native/commit/1a9e444b61630066604a974d3c0527a4ad7707e5) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Remove redundant ifdefs for ArrayBuffer backwards compatibility ([fb30fcaa2f](https://github.com/facebook/react-native/commit/fb30fcaa2f526cc1f7c2d4189ec9c57f9cf9b3c5) by [@Saadnajmi](https://github.com/Saadnajmi))
- Remove RCTSurfaceHostingComponent and RCTSurfaceBackedComponent, needed only for ComponentKit integration. ([b8d60a834f](https://github.com/facebook/react-native/commit/b8d60a834f25cfde8a8580a32afc752b52d10a8d) by [@constantine-fry](https://github.com/constantine-fry))
- Remove PRODUCTION flag from iOS build logic ([daa99fe5e7](https://github.com/facebook/react-native/commit/daa99fe5e7d3b4fc634513ae8b3d954c7b40eaa4) by [@cipolleschi](https://github.com/cipolleschi))
- Delete bridge.loadAndExecuteSplitBundleURL ([e2d512a1ee](https://github.com/facebook/react-native/commit/e2d512a1eef9950d3475c95dee8d2474a5723d74) by [@RSNara](https://github.com/RSNara))
- delete RCTJSScriptLoaderModule ([438f6cf591](https://github.com/facebook/react-native/commit/438f6cf5915786e611ebea3bfc9b96c3106c2aa9) by [@philIip](https://github.com/philIip))
- Remove Xcode 12.5 post install workaround ([0ab8b40fd6](https://github.com/facebook/react-native/commit/0ab8b40fd64ad86b4598293faa0b77e71fc9d349) by [@Saadnajmi](https://github.com/Saadnajmi))

### Fixed

- Fix virtualization logic with horizontal RTL lists ([8b39bfadbb](https://github.com/facebook/react-native/commit/8b39bfadbb6206168db9601b86734a583ac11461) by [@NickGerleman](https://github.com/NickGerleman))
- Fix a potential bug in `EventEmitter` when used with certain Babel configurations that incorrectly polyfill the spread operator for iterables. ([8b768f144a](https://github.com/facebook/react-native/commit/8b768f144a3cad25d84a4e70b880e5aa1d5ff872) by [@yungsters](https://github.com/yungsters))
- Remove need for platform overrides in SafeAreaView.js ([80f531f9f4](https://github.com/facebook/react-native/commit/80f531f9f4c5eb43af6b4e7979cf6b7b3af12992) by [@christophpurrer](https://github.com/christophpurrer))
- Hide Babel helpers and other core files from LogBox stack traces by default ([af73a75c21](https://github.com/facebook/react-native/commit/af73a75c215577847666dac49a3360a967f0dc46) by [@motiz88](https://github.com/motiz88))
- Mitigate flickering on color animations ([5f8bbf2bd2](https://github.com/facebook/react-native/commit/5f8bbf2bd27ccff2c83be8d9dedc7005854fecaa) by [@genkikondo](https://github.com/genkikondo))
- Resolves Animated.Value.interpolate results in NaN when output is in radians ([ae0d714bbd](https://github.com/facebook/react-native/commit/ae0d714bbdd2eb9d114c17c3945b2f678f60b65a) by [@javache](https://github.com/javache))
- Fix invariant violation when using viewability callbacks with horizontal RTL FlatList on Paper ([a2fb46ec0d](https://github.com/facebook/react-native/commit/a2fb46ec0d157a4f9d5e4eb0f4c885aaf60c4325) by [@NickGerleman](https://github.com/NickGerleman))
- Fix invariant violation when `maintainVisibleContentPosition` adjustment moves window before list start ([c168a4f88b](https://github.com/facebook/react-native/commit/c168a4f88bc51e441e704694eed498ce67c9c353) by [@NickGerleman](https://github.com/NickGerleman))
- Fix backfaceVisibility after transform changes ([242c835c42](https://github.com/facebook/react-native/commit/242c835c422287aa91723cf2ad902ea232f17d15) by [@javache](https://github.com/javache))
- Add missing type for TextInput.readOnly in Typescript ([deb81853f5](https://github.com/facebook/react-native/commit/deb81853f5618df2ee5fda7096777ac629babb7a) by [@antliann](https://github.com/antliann))
- Do not render mocked <Modal /> when `visible=false` ([468a13635a](https://github.com/facebook/react-native/commit/468a13635a592621562b10b395ec73f0f4d28093) by [@mdjastrzebski](https://github.com/mdjastrzebski))
- Fix a type issue of NativeEventEmitter ([d4d323cbc2](https://github.com/facebook/react-native/commit/d4d323cbc2469d54bbd684c478953df5bc815421))
- Add support to archive Schemes names with backspaces ([a384e076e0](https://github.com/facebook/react-native/commit/a384e076e0f446610ab5c0ad2300fd94c27489f3) by [@yardenPhy](https://github.com/yardenPhy))
- Updated TypeScript definitions to include userSelect style support. Refer to commit [2e4d8b6c145](https://github.com/facebook/react-native/commit/2e4d8b6c145ed36b600a0481d7f65157a78abbeb) for the specific changes. ([30ab7a45ec](https://github.com/facebook/react-native/commit/30ab7a45eceaa851e8af239f9b64bf7eec424952) by [@MjMoshiri](https://github.com/MjMoshiri))
- Use right edge of ScrollView viewport for `scrollMetrics.offset` in RTL ([0e69050612](https://github.com/facebook/react-native/commit/0e690506124de44ea6e98012aad817aac9de7f9b) by [@NickGerleman](https://github.com/NickGerleman))
- AnimatedColor flickering on Android ([ec97646fe4](https://github.com/facebook/react-native/commit/ec97646fe4a6d8cf002c3670e0444371e67edf9f))
- Fixup contentLength invalidation logic ([ace0a80dea](https://github.com/facebook/react-native/commit/ace0a80dead59d552ed16872de05cd9e977fc6b2) by [@NickGerleman](https://github.com/NickGerleman))
- Right align scrollToIndex in RTL ([5596f1c25b](https://github.com/facebook/react-native/commit/5596f1c25b31cbe38357264c3e31e5a60fa22380) by [@NickGerleman](https://github.com/NickGerleman))
- Cache ScrollView content length before calling `scrollToIndex` ([33d6da01ea](https://github.com/facebook/react-native/commit/33d6da01ea15022485d8e65beae49a779130921a) by [@NickGerleman](https://github.com/NickGerleman))
- Update `event-target-shim` import to support Metro resolving `mjs` modules before `js`. ([e37e53086a](https://github.com/facebook/react-native/commit/e37e53086af5c0569830efa607fc42c2b9593be1) by [@EvanBacon](https://github.com/EvanBacon))
- Avoids re-renders during text selection on desktop platforms by limiting native-only `isHighlighted` prop to iOS ([3d2fd4bf22](https://github.com/facebook/react-native/commit/3d2fd4bf228c64b1f46dc4737cf5c8eb50392eb0))
- Fixed missing property `signal` for the `Request` interface ([823b1f467b](https://github.com/facebook/react-native/commit/823b1f467b42b6d8b68a2f4af292c2663f192cd2) by [@ljbc1994](https://github.com/ljbc1994))
- Remove need for platform overrides to Settings ([3c15b68d56](https://github.com/facebook/react-native/commit/3c15b68d565ac6f5bae782dac3a3fa5ca66f821d) by [@christophpurrer](https://github.com/christophpurrer))
- Remove need for each platform to implement ToastAndroid as UnimplementedView ([800ea60393](https://github.com/facebook/react-native/commit/800ea60393cc810ef4b36ed102694deda04162c9) by [@christophpurrer](https://github.com/christophpurrer))
- Remove need for each platform to implement DrawerLayoutAndroid as UnimplementedView ([151f3900de](https://github.com/facebook/react-native/commit/151f3900de092199fd18cf89aea470a41827bb06) by [@christophpurrer](https://github.com/christophpurrer))
- Remove need for each platform to implement ProgressBarAndroid as UnimplementedView ([c02fcca187](https://github.com/facebook/react-native/commit/c02fcca187e8136dd320ba7c6bbab7268f1267ca) by [@christophpurrer](https://github.com/christophpurrer))
- Correct the NativeSyntheticEvent type ([fedad15a69](https://github.com/facebook/react-native/commit/fedad15a693c9715fe258f0a0a41e131374700bb) by [@mmmulani](https://github.com/mmmulani))
-  ([4aa53d241d](https://github.com/facebook/react-native/commit/4aa53d241d79f0e0c6e82c4c8ea8c73d48934a14) by [@IslamRustamov](https://github.com/IslamRustamov))
- Fixed missing File declaration in Typescript global.d.ts ([9c0441b8a1](https://github.com/facebook/react-native/commit/9c0441b8a100bbc4e47c8ba725b30ea979bb61e8) by [@trashcoder](https://github.com/trashcoder))
- Android does't crash when using remote debugger ([0fe5ffd568](https://github.com/facebook/react-native/commit/0fe5ffd568b46104625479e1f9afa1b18cdf71b6) by [@javache](https://github.com/javache))
- Fix timestamps and grouped display of console messages within in a `console.group` ([48791bcd98](https://github.com/facebook/react-native/commit/48791bcd9873b4db10435077c0560907fdb263b2))
- When animating using native driver, trigger rerender on animation completion in order to update Pressability responder regions ([c870a529fe](https://github.com/facebook/react-native/commit/c870a529fe78ea1cc780f6b7c6f1b0940f4eb8df) by [@genkikondo](https://github.com/genkikondo))
- Specify float value in ParagraphLayoutManager ([efc5f73f27](https://github.com/facebook/react-native/commit/efc5f73f27de1cc63c7182811293a87de4436359) by [@TatianaKapos](https://github.com/TatianaKapos))
- When animating using native driver, trigger rerender on animation completion in order to update Pressability responder regions ([03f70bf995](https://github.com/facebook/react-native/commit/03f70bf995379f08a77abcf96bb0e31ff75ca8c3) by [@genkikondo](https://github.com/genkikondo))
- Fixed computation of layout via `ref.measureRelative` and `ref.measureInWindow` for nodes with scale/rotate transforms in their parents. ([64416d9503](https://github.com/facebook/react-native/commit/64416d9503f9c17ab5ceec2a1506a97a2049f879) by [@rubennorte](https://github.com/rubennorte))
- Remove duplicated code that resulted after a merge conflict. ([8dcaa4cc3b](https://github.com/facebook/react-native/commit/8dcaa4cc3b8d2f72337a0652b5058769b68d1eb8) by [@cipolleschi](https://github.com/cipolleschi))
- Fix[devtools]: fixed duplicated backend activation with multiple renderers ([ada6c51943](https://github.com/facebook/react-native/commit/ada6c51943925ca161bf3f4f2dd1f453d5fdc543) by [@hoxyq](https://github.com/hoxyq))
- Change FlatList `viewabilityConfig` prop type `any` to `ViewabilityConfig` ([5dfa38a20e](https://github.com/facebook/react-native/commit/5dfa38a20e72f6fe560577ec499ff2fee5943b73) by [@jeongshin](https://github.com/jeongshin))
- Refactor: `substr()` is deprecated, using `slice()` instead across RN codebase ([8a49754cda](https://github.com/facebook/react-native/commit/8a49754cdaf259a9300eb254e0e5da0c7ce3b125) by [@Pranav-yadav](https://github.com/Pranav-yadav))
- Fix VirtualizedList with `maintainVisibleContentPosition` ([69b22c9799](https://github.com/facebook/react-native/commit/69b22c9799108c05ddc9875d162060826c6e46e2) by [@janicduplessis](https://github.com/janicduplessis))
- Make sure initialScrollToIndex is bigger than 0 when adjusting cells ([eb30a80c81](https://github.com/facebook/react-native/commit/eb30a80c81bd385f9902548b14df2a3c17e2dd5c) by [@okwasniewski](https://github.com/okwasniewski))
- Comment out unreferenced formal parameter ([3c0ad81fef](https://github.com/facebook/react-native/commit/3c0ad81fef96d23a7240b708346c7f015f37aea9) by [@TatianaKapos](https://github.com/TatianaKapos))
- Resolved property name conflicts in event-emitter codegen ([3759a26214](https://github.com/facebook/react-native/commit/3759a262146390798a4aa0cd97b96f47a33d8c08) by [@javache](https://github.com/javache))
- Issue with TurboModule C++ codegen with optional return types ([dd6d57eea1](https://github.com/facebook/react-native/commit/dd6d57eea107f1b89ff89cc439dcbe73093e5d17) by [@javache](https://github.com/javache))
- Issue with TurboModule C++ codegen with optional args ([0a8164d993](https://github.com/facebook/react-native/commit/0a8164d99352bb95462edb63283ce4a342cf2f07) by [@javache](https://github.com/javache))
- Fix podspecs building with C++ 14 ([5ea0b449e2](https://github.com/facebook/react-native/commit/5ea0b449e246257feddcd7ca6cf6c551e9c5ab76) by [@NickGerleman](https://github.com/NickGerleman))
- URLs parsed by RCTConvert should be encoded respecting RFC 3986, 1738/1808 ([9841bd8185](https://github.com/facebook/react-native/commit/9841bd81852d59608fe3566b17831d6d42eb7dcf) by [@philIip](https://github.com/philIip))
- Enhance/fix error reporting in reload and destroy ([f437224042](https://github.com/facebook/react-native/commit/f4372240429658b4050090b1f3a384cb6d440fe4) by [@RSNara](https://github.com/RSNara))
- Create FeatureFlag to gate Stable API for Turbo Module ([49197411d8](https://github.com/facebook/react-native/commit/49197411d886eb7673ca4cb5918a9ea2d7bb95d6) by [@mdvacca](https://github.com/mdvacca))
- Do not render React DevTools overlays unless they are connected ([39016889d0](https://github.com/facebook/react-native/commit/39016889d09f1766e218e52d2e141e960a35b38a) by [@hoxyq](https://github.com/hoxyq))
- Fix nullable-to-nonnull-conversion warnings ([2856bef721](https://github.com/facebook/react-native/commit/2856bef72119af4d46535facae61d9efed24e5ee) by [@caodoan](https://github.com/caodoan))
- Clear bundler banner messages after a certain delay during development. ([6eeb81a86e](https://github.com/facebook/react-native/commit/6eeb81a86e0cf4f050bb6bae5b09dedf8b251a15) by [@jacdebug](https://github.com/jacdebug))
- Correctly invalidate NSTextStorage when non layout related props change ([247da6ef7f](https://github.com/facebook/react-native/commit/247da6ef7fd0ae335ffc208218532becd596f855) by [@sammy-SC](https://github.com/sammy-SC))
- Ensure systrace events are always stopped ([97b6829b83](https://github.com/facebook/react-native/commit/97b6829b830d26da62ca014ae83b22b40b7c5379) by [@javache](https://github.com/javache))
- SafeAreaView shouldn't dirty layout on clone by default ([ecf1b84795](https://github.com/facebook/react-native/commit/ecf1b8479515759284e72a6f8680201795273fdf) by [@javache](https://github.com/javache))
- Terminate instead of throwing if TurboModule callback double-called ([dfd445cbc6](https://github.com/facebook/react-native/commit/dfd445cbc69c8bc6c5d1d3d7948472a0a3ae4927) by [@NickGerleman](https://github.com/NickGerleman))
- Reduce dynamic SchedulerFeatureFlags ([2a58b06863](https://github.com/facebook/react-native/commit/2a58b06863b320403cbbbeb9909e25db9c2aaa4e) by [@kassens](https://github.com/kassens))
- Enable -Wextra in C++ builds ([99674b360a](https://github.com/facebook/react-native/commit/99674b360a8b1a24545af9c56c9f55b2ec121ff6) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- Fix Text cut off issues when adjusting text size and font weight in system settings. ([babbc3e43c](https://github.com/facebook/react-native/commit/babbc3e43cf0a855186a91d3c6b615a1cd940d94))
- Set the accessibility role to `NONE` when a `null` string is passed to `fromValue` ([0f48e86fed](https://github.com/facebook/react-native/commit/0f48e86fedc5269f6fa5112d40282b747eacc0de) by [@cipolleschi](https://github.com/cipolleschi))
- Fix default shadow radius in TextAttributeProps ([05fd10d12f](https://github.com/facebook/react-native/commit/05fd10d12f1822d38ea6aafc3e0435d9640ca307) by [@NickGerleman](https://github.com/NickGerleman))
- UI freezing when using minimumFontScale ([79e8474b14](https://github.com/facebook/react-native/commit/79e8474b14e118daa0f6e525d6546892a09a09a3) by [@g4rb4g3](https://github.com/g4rb4g3))
- Fixed ScrollView momentum not stopping when calling scrollToEnd programmatically ([2f86aafdfd](https://github.com/facebook/react-native/commit/2f86aafdfd42764b25d2e9bd68a05644965b89d7) by [@Almouro](https://github.com/Almouro))
- Fixed an issue where calling `Accessibility.setAccessibilityFocus` on an unmounted component would crash ([5323221d14](https://github.com/facebook/react-native/commit/5323221d1442d1573bc65daff618478cb6f056f0) by [@Abbondanzo](https://github.com/Abbondanzo))
- Localize Talkback strings ([a7e5c96a3d](https://github.com/facebook/react-native/commit/a7e5c96a3d11671ed45b5d4f02334e8cc988ce9e) by [@NickGerleman](https://github.com/NickGerleman))
- Fix border clip check ([7d1f7f3f5f](https://github.com/facebook/react-native/commit/7d1f7f3f5fbc9e659757f17fae98fa8778ffdbb6) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Improve threading in enableFabricPendingEventQueue experiment ([318b4c0d4b](https://github.com/facebook/react-native/commit/318b4c0d4b63e0d85b0c6648d4118880524157fc) by [@javache](https://github.com/javache))
- Change `connectTimeout` to `callTimeout` in OKHttp client ([e00f2445d2](https://github.com/facebook/react-native/commit/e00f2445d223f512aa3a19b82d6eef207f6b14b3) by [@troZee](https://github.com/troZee))
- Fix a race with FpsView on using FpsDebugFrameCallback. ([a63b443e62](https://github.com/facebook/react-native/commit/a63b443e62aac6ad0c6745fb01a38cc49b88778d))
- Fix crash in CompositeTurboModuleManagerDelegate ([e716459d66](https://github.com/facebook/react-native/commit/e716459d66dade54e96f1dba11e4d3d179cf678c) by [@christophpurrer](https://github.com/christophpurrer))
- Fix race condition with ReactMarker calls to its native module ([6ab062dfec](https://github.com/facebook/react-native/commit/6ab062dfec990ec4915b2ca4514fbddff9bbd9a3))
- Generalize RTL Scroll Correction Logic ([30c7e9dfa4](https://github.com/facebook/react-native/commit/30c7e9dfa41348e96e946384c76f038ccd859896) by [@NickGerleman](https://github.com/NickGerleman))
- Fix letters duplication when using autoCapitalize ([ab3c00de2c](https://github.com/facebook/react-native/commit/ab3c00de2ca1cff959c724c09f7f61c3706b2904) by [@fknives](https://github.com/fknives))
- Fix ScrollView's onMomentumScrollEnd being called multiple times on Android ([06668fcbac](https://github.com/facebook/react-native/commit/06668fcbacd750771f1d53cce829dc55e86f3f3c) by [@AntoineDoubovetzky](https://github.com/AntoineDoubovetzky))
- ANR when having an inverted `FlatList` on android API 33+ ([90186cd9b7](https://github.com/facebook/react-native/commit/90186cd9b71bc6ffb593448c9bb5a3df66b3a0c6) by [@hannojg](https://github.com/hannojg))
- Surfaces in the new architecture no longer leak views once stopped ([c16e993bb8](https://github.com/facebook/react-native/commit/c16e993bb8417da9a4ff9e082a77a21688d75bac) by [@javache](https://github.com/javache))
- Support Android Transitions during Fragment navigation ([187f16ddc6](https://github.com/facebook/react-native/commit/187f16ddc66493c3046ceffed69e21c646dfa7b1) by [@grahammendick](https://github.com/grahammendick))
- Foreground ripple crashed on api < 23 ([ca65d97d60](https://github.com/facebook/react-native/commit/ca65d97d603f0308c18bbee835b7cf6d5f76e232) by [@vonovak](https://github.com/vonovak))
- Exclude trailing whitespace from newline character on measuring text line width ([2674d9bf7c](https://github.com/facebook/react-native/commit/2674d9bf7c8b9d668d1a4fe072346b0534bb0f1d) by [@bernhardoj](https://github.com/bernhardoj))
- W3CPointerEvents: include screen coordinates in pointer events ([3460ff5d04](https://github.com/facebook/react-native/commit/3460ff5d0492bb70806afec9c3c0b5edc00a7908))
- W3CPointerEvents: include modifier key properties in Android pointer events ([2bd4429365](https://github.com/facebook/react-native/commit/2bd4429365c37e9ce70b12ff3f8d9a3c10af2a4b))
- W3CPointerEvents: fix NPE due to null targetView ([96fd107d61](https://github.com/facebook/react-native/commit/96fd107d61da9b195928a2a6cfdc39fc095767b4))
- W3CPointerEvents: fix a case where cancel can cause NPE ([79ae710cc5](https://github.com/facebook/react-native/commit/79ae710cc54b5872ad4a41e67e3cd9b73b20ff5b))
- W3CPointerEvents: properly update hit path during native gestures ([396cdac629](https://github.com/facebook/react-native/commit/396cdac629594955ad37806464e41607fb59db48))
- Fixing line truncation issue in Text containing /n when numberOfLines = {1} ([0af806e96c](https://github.com/facebook/react-native/commit/0af806e96c20c826f5a4bd55a3f73f512d6bb5af))
- Fix ellipsis being cut on certain font sizes ([6d24ee13a4](https://github.com/facebook/react-native/commit/6d24ee13a47a58ff1b19c5a51f39f52c9a4a8a28) by [@BeeMargarida](https://github.com/BeeMargarida))
- Fix links hidden via ellipsis crashing screen readers ([d54f486fe6](https://github.com/facebook/react-native/commit/d54f486fe66d01450d3c7a04fb0a025319a3014c) by [@dhleong](https://github.com/dhleong))
- Fixed inconsistent styling for text nodes with many children ([dcb4eb050a](https://github.com/facebook/react-native/commit/dcb4eb050a900b21737b649dad3037b25d51fe5f) by [@cubuspl42](https://github.com/cubuspl42))
- Fix copy / paste menu and simplify controlled text selection on Android ([d4f6cf1d80](https://github.com/facebook/react-native/commit/d4f6cf1d80b6ee725b81d9fdccc263d193178249) by [@janicduplessis](https://github.com/janicduplessis))
- When applications reload, the previous react root will be correctly closed ([3a7555fb18](https://github.com/facebook/react-native/commit/3a7555fb18b47f64986e411e43a3cd48154a50e3) by [@javache](https://github.com/javache))
- ViewManagers now receive an invalidate callback ([c5e7cd4ad9](https://github.com/facebook/react-native/commit/c5e7cd4ad96f468e9c5e2966e5fa5d599daa3e00) by [@javache](https://github.com/javache))
- Fixed nightly builds of Android no longer building due to a recent version format change ([cceef57be1](https://github.com/facebook/react-native/commit/cceef57be1fca661c10955ecec088ce1ef7aab91) by [@tido64](https://github.com/tido64))
- Fix unreadable dev menu header on dark theme apps ([88e3130218](https://github.com/facebook/react-native/commit/88e313021808b50f378ea6ddf2a9909d82ed5f57) by [@cortinico](https://github.com/cortinico))
- Modify ViewManager.receiveCommand to call into delegate ([585057d746](https://github.com/facebook/react-native/commit/585057d7468b5ae8844fa8210df7ad1f8e0ae1e8) by [@genkikondo](https://github.com/genkikondo))
- Fix crash when Android requests permission with activity that does not implement `PermissionAwareActivity` ([cff4bc8eea](https://github.com/facebook/react-native/commit/cff4bc8eead129738a7040f579a18e3819d28bfd) by [@yungsters](https://github.com/yungsters))
- Fix issue downloading request body via remote URL ([4b39f44a61](https://github.com/facebook/react-native/commit/4b39f44a612e8f358b7f51cdb97b4d602207a754) by [@daisy1754](https://github.com/daisy1754))

#### iOS specific

- Fix TextInput vertical alignment issue when using lineHeight prop on iOS (Paper - old arch) ([35a1648d0c](https://github.com/facebook/react-native/commit/35a1648d0c93ef2db1de6b8dbe7fc1d997c24039) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Announce checkbox and radio button roles on VoiceOver ([12f4a19306](https://github.com/facebook/react-native/commit/12f4a19306b9d4f77c1b5493159de99f897b1862) by [@carmenvkrol](https://github.com/carmenvkrol))
- Localize Voiceover strings in Paper ([0e99b19257](https://github.com/facebook/react-native/commit/0e99b192577d1ac5c73fdc55902fea1d79d247b7) by [@NickGerleman](https://github.com/NickGerleman))
- Re-enable direct debugging with JSC on iOS 16.4+ ([5cf8f43ab1](https://github.com/facebook/react-native/commit/5cf8f43ab182781ea82e88077df425c3efbfc21f) by [@Saadnajmi](https://github.com/Saadnajmi))
- Fixed window.requestIdleCallback not firing on iOS ([72abed2c96](https://github.com/facebook/react-native/commit/72abed2c96d65769567e2b7e492764c1a58e6e81) by [@matt-oakes](https://github.com/matt-oakes))
- Adapt iOS16+ dictation judge condition ([e8b4bb0684](https://github.com/facebook/react-native/commit/e8b4bb0684eed2acdb4648205893ee372f7ac1c7) by [@hellohublot](https://github.com/hellohublot))
- Dimensions could be reported incorrectly when resizing iPad or macOS apps ([61861d21ff](https://github.com/facebook/react-native/commit/61861d21ff71a9451019e0f98e0c0414cf12c153) by [@jpdriver](https://github.com/jpdriver))
- Include `accessibilityValue` prop values in `accessibilityValue` ([0c25f19d39](https://github.com/facebook/react-native/commit/0c25f19d3944e866fcbb6a09da6a55878f739742) by [@carmenvkrol](https://github.com/carmenvkrol))
- Don't send the `RCTUserInterfaceStyleDidChangeNotification` when the app is in the background. ([6118aff69d](https://github.com/facebook/react-native/commit/6118aff69d69dce557b1c9d217c538f5670afed1) by [@alanjhughes](https://github.com/alanjhughes))
- Rotation transforms are no longer clipped when zIndex is applied ([850349b1d2](https://github.com/facebook/react-native/commit/850349b1d274f0cc2595eee2f6bb361a958bb2e2) by [@javache](https://github.com/javache))
- Fix the default trait collection to always return the value of the window ([94fea182d6](https://github.com/facebook/react-native/commit/94fea182d6cf19e96a8a87760017bd69ad0a9e0c) by [@alanjhughes](https://github.com/alanjhughes))
- Fix Alert userInterfaceStyle having no effect ([0e150d071e](https://github.com/facebook/react-native/commit/0e150d071e66368e134566697f0f9d99c64d35c4) by [@zhongwuzw](https://github.com/zhongwuzw))
- Properly escape URLs ([5e983d51d8](https://github.com/facebook/react-native/commit/5e983d51d8bc2abded5659a77808542c6dc1377a) by [@cipolleschi](https://github.com/cipolleschi))
- Handle doulbe `#` and partially escaped urls ([2b4e1f5ece](https://github.com/facebook/react-native/commit/2b4e1f5ece7d160935b19d4862af8706a44cee59) by [@cipolleschi](https://github.com/cipolleschi))
- RNTester's PROJECT_ROOT points to `packages/rn-tester` ([cd30bc3888](https://github.com/facebook/react-native/commit/cd30bc3888bac500e9ecc7e9be051d0bc3659c2f) by [@dmytrorykun](https://github.com/dmytrorykun))
- Fix inverted `contentOffset` in scroll events in RTL ([4f8a8ce316](https://github.com/facebook/react-native/commit/4f8a8ce316494db99b19f6c8db6b0c1e7b6500d9) by [@NickGerleman](https://github.com/NickGerleman))
- Fix bad comparison in RCTScrollViewComponentView RTL ([65b7680720](https://github.com/facebook/react-native/commit/65b7680720435c0d864df9c121c151b60bee08ad) by [@NickGerleman](https://github.com/NickGerleman))
- Use `addEntriesFromDictionary` properly in RCTBaseTextInputView. ([e6dd22c628](https://github.com/facebook/react-native/commit/e6dd22c628c3bf1b16bb319694a0dddcedb0dd7a) by [@cipolleschi](https://github.com/cipolleschi))
- Change the top of perf monitor component. ([5ba8de05b5](https://github.com/facebook/react-native/commit/5ba8de05b5e6c170b84b44979e7bbc576442eafb) by [@zerosrat](https://github.com/zerosrat))
- Only modify EXCLUDED_ARCHS when needed for Hermes ([ee1cd13db6](https://github.com/facebook/react-native/commit/ee1cd13db6ba7d0eae315c296bac5ba2a58cdde3) by [@jpdriver](https://github.com/jpdriver))
- Fix `use_react_native` to support custom react native absolute paths ([835f62c189](https://github.com/facebook/react-native/commit/835f62c189a76cf05a444f35d0215f51e1e155d8) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- UIApplicationDidReceiveMemoryWarningNotification has not been obeyed on iOS since RN 0.69 ([8f072b438a](https://github.com/facebook/react-native/commit/8f072b438a81293da026f0284dac8ddc7be35382) by [@liamjones](https://github.com/liamjones))
- Debug builds from cli disable idle to stop application going into background ([41d5f4bce2](https://github.com/facebook/react-native/commit/41d5f4bce2850d3a81c0c02961c0768026dd353e) by [@blakef](https://github.com/blakef))
- Fix RCTImageBlurUtils.m Greyscale Crash ([d6c4f2786c](https://github.com/facebook/react-native/commit/d6c4f2786c1dd8285dbabb7fe872a7d1bddcbe14) by [@OskarEichler](https://github.com/OskarEichler))
- Logbox footer buttons respect safe area ([6d6b1fdc75](https://github.com/facebook/react-native/commit/6d6b1fdc75d870fa73abc6ee9bf0099f3f15e658) by [@philipheinser](https://github.com/philipheinser))

## v0.72.6

### Fixed

- Fix a potential bug in `EventEmitter` when used with certain Babel configurations that incorrectly polyfill the spread operator for iterables ([9b3bd63723](https://github.com/facebook/react-native/commit/9b3bd637231e5e9e7d8b729c71842f3b7a2da373) by [@yungsters](https://github.com/yungsters))

#### iOS specific

- Set the max version of Active support to 7.0.8 ([785f91b67a](https://github.com/facebook/react-native/commit/785f91b67a5d97e4e54d341279c878483a3d9a11) by [@cipolleschi](https://github.com/cipolleschi))

## v0.72.5

### Changed
- Bump CLI to 11.3.7 ([6f02d55deb](https://github.com/facebook/react-native/commit/6f02d55debe818dcb1db753f2ca4cc0b804d0df5) by [@huntie](https://github.com/huntie))
- Bump @react-native/codegen to 0.72.7 ([4da991407d](https://github.com/facebook/react-native/commit/4da991407da2791f22ded368ad04457b03be5ee3) by [@Titozzz](https://github.com/Titozzz))

### Fixed
#### Android specific

- Fix building Android on Windows. ([054ab62be0](https://github.com/facebook/react-native/commit/054ab62be0db5d14f02f5aeb4c696f037ea68794) by [@alespergl](https://github.com/alespergl))
- A bug fix for Android builds with new arch on Windows host. ([a323249e0a](https://github.com/facebook/react-native/commit/a323249e0a0f9c2fb75ee05d7da62a34f3c56be0) by [@birdofpreyru](https://github.com/birdofpreyru))
- Fix null crash when using maintainVisibleContentPosition on Android ([1a1a79871b](https://github.com/facebook/react-native/commit/1a1a79871b2d040764537433b431bc3b416904e3) by [@janicduplessis](https://github.com/janicduplessis))

#### iOS specific

- XCode 15 fixes ([21763e85e3](https://github.com/facebook/react-native/commit/21763e85e39e17a19a1cf7a9026ef74517464749), [0dbd621c59](https://github.com/facebook/react-native/commit/0dbd621c598e3ba7a203ec41bb70ce395ad1d62c) & [8a5b2d6735](https://github.com/facebook/react-native/commit/8a5b2d673502037731ee6bc40fc64cdd22139011))
- Fix timer background state when App is launched from background ([a4ea737ae1](https://github.com/facebook/react-native/commit/a4ea737ae1773e7fd49969ae20b962bdd7481b37) by [@zhongwuzw](https://github.com/zhongwuzw))
- Guard `JSGlobalContextSetInspectable` behind a compile time check for Xcode 14.3+ ([3eeee11d7a](https://github.com/facebook/react-native/commit/3eeee11d7ac4075d0917233d3be4a9469f802d35) by [@Saadnajmi](https://github.com/Saadnajmi))
- Re-enable direct debugging with JSC on iOS 16.4+ ([8b1bf058c4](https://github.com/facebook/react-native/commit/8b1bf058c4bcbf4e5ca45b0056217266a1ed870c) by [@huntie](https://github.com/huntie))

## v0.72.4

### Added

#### Android specific

- Native part of fixing ANR when having an inverted FlatList on android API 33+ ([6d206a3f54](https://github.com/facebook/react-native/commit/6d206a3f54725f7f53692222293a9d1e58b11ca4) by [@hannojg](https://github.com/hannojg))
- For targeting SDK 34 - Added RECEIVER_EXPORTED/RECEIVER_NOT_EXPORTED flag support in DevSupportManagerBase ([177d97d8ea](https://github.com/facebook/react-native/commit/177d97d8ea962bdd4dad8fcf0efb04a307f25000) by [@apuruni](https://github.com/apuruni))

### Changed

- Bump cli and metro ([40ea8ffcc7](https://github.com/facebook/react-native/commit/40ea8ffcc7ba3ed0969405e9a48b75d188487d92) by [@lunaleaps](https://github.com/lunaleaps))
- Hermes bump for hermes-2023-08-07-RNv0.72.4-813b2def12bc9df026 ([e9ea926ba3](https://github.com/facebook/react-native/commit/e9ea926ba3462a8d771cfcc5663c0d6fb50e2172) by Luna Wei)
- Bump CLI to 11.3.6 ([a3cfdf0a08](https://github.com/facebook/react-native/commit/a3cfdf0a08237a63736b9d576641a4ab3cf720ba) by [@szymonrybczak](https://github.com/szymonrybczak))

### Fixed

- Allow string `transform` style in TypeScript ([2558c3d4f5](https://github.com/facebook/react-native/commit/2558c3d4f56776699602b116aff8c22b8bfa176a) by [@NickGerleman](https://github.com/NickGerleman))
- Fix missing Platform in VirtualizedList ([7aa8cd55be](https://github.com/facebook/react-native/commit/7aa8cd55be97a0f26fe01aa9f50d774ac52114aa) by Luna Wei)
- Mount react devtools overlay only when devtools are attached ([03187b68e5](https://github.com/facebook/react-native/commit/03187b68e589c94dc10ed4f763b54923b7487f23) by [@hoxyq](https://github.com/hoxyq))

#### Android specific

- Remove option to paste rich text from Android EditText context menu ([b1ceea456d](https://github.com/facebook/react-native/commit/b1ceea456d1cdc00c723582d00e5ae585f066b55) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fixed ScrollView not responding to Keyboard events when nested inside a KeyboardAvoidingView ([c616148a05](https://github.com/facebook/react-native/commit/c616148a05c00728b80d2fd9dcbd6f15d08a2dfa) by [@andreacassani](https://github.com/andreacassani))
- ANR when having an inverted FlatList on android API 33+ ([3dd816c6b7](https://github.com/facebook/react-native/commit/3dd816c6b7bcd9cc4c21199f0b645755fb97f50f) by [@hannojg](https://github.com/hannojg))

## v0.72.3

### Fixed

#### iOS specific

- Revert "Fix pod install for swift libs using new arch (#38121)" to fix [build error with Xcode lower than Xcode 14.3](https://github.com/facebook/react-native/issues/38294) ([8f41f25](https://github.com/facebook/react-native/commit/8f41f25c214f995073e90b786c805eb45ff7dee5) by [@kelset](https://github.com/kelset))

## v0.72.2

### Changed

- Remove deprecated stub types `@types/metro-config` from template ([63f78ea8de](https://github.com/facebook/react-native/commit/63f78ea8de68688005e7f48c6849bdf9f95e26ff) by [@kelset](https://github.com/kelset))
- Bump CLI to 11.3.5 and Metro do 0.76.7 ([ba5fa9c394](https://github.com/facebook/react-native/commit/ba5fa9c394e7cd127e3ee543e0716c37912b0b40) by [@kelset](https://github.com/kelset))
- Bump `@react-native/metro-config` to `0.72.9` ([21daa6e790](https://github.com/facebook/react-native/commit/21daa6e79030574ce41665ea13c39316eac8c305), [f37386176](https://github.com/facebook/react-native/commit/f37386176cb081e7b38fad8b5442099598bf1968)  by [@kelset](https://github.com/kelset))

#### Android specific

- Remove okhttp3 internal util usage ([3e3032636d](https://github.com/facebook/react-native/commit/3e3032636dc90a21a499492dcb88f819bcf4f003) by [@adrianha](https://github.com/adrianha))

#### iOS specific

- Update logic to add and remove views in the view registry for the interop layer. ([8d2eec367d](https://github.com/facebook/react-native/commit/8d2eec367dd6fbd60792ca1bde12b875a8261fa6) by [@cipolleschi](https://github.com/cipolleschi))
- Disable NSTextStorage caching in OSS ([5bda54c1f1](https://github.com/facebook/react-native/commit/5bda54c1f183fbc51dc7264b0ab94d5bbcc3f172) by [@sammy-SC](https://github.com/sammy-SC))

### Fixed

- `global.performance` in undefined when starting metro from Expo CLI ([0ccbd65581](https://github.com/facebook/react-native/commit/0ccbd65581304faa286b452f75058b6292a6240f) by [@Kudo](https://github.com/Kudo))
- Re-enabled debugging for debug builds ([41477c898c](https://github.com/facebook/react-native/commit/41477c898cf5726eae9edbb1596366a6eea2b01e) by Matt Blagden)
- Add global hook to assert that base Metro config is called ([29f2602ff9](https://github.com/facebook/react-native/commit/29f2602ff9c3c9a9999c54a6004c99d6fd15ebc3) by [@huntie](https://github.com/huntie))

#### Android specific

- Do not create RuntimeExecutor on non-JSI executors (#38125) ([d73b61c7c7](https://github.com/facebook/react-native/commit/d73b61c7c7dae23630b51b00048eafe5fcb47bd3) by [@lunaleaps](https://github.com/lunaleaps))
- Prevent crash on OnePlus/Oppo devices in runAnimationStep ([a46a7cd1](https://github.com/facebook/react-native/commit/a46a7cd1f613d6eaea1d1cd07751f17cdc07c21b) by [@hsource](https://github.com/hsource))

#### iOS specific

- Fix build error when there are multiple EXTRA_COMPILER_ARGS ([28f4ebab8a](https://github.com/facebook/react-native/commit/28f4ebab8ab4b0f337699e6a135e2aa983866f42) by [@fergusean](https://github.com/fergusean))
- Build failure with pnpm and use_frameworks! due to incorrect header paths ([58adc5e4b9](https://github.com/facebook/react-native/commit/58adc5e4b9ab74b67b4af04d1e72c387af848ea7) by evelant)
- Fix onChangeText not firing when clearing the value of TextInput with multiline=true on iOS ([0c9c57a9f7](https://github.com/facebook/react-native/commit/0c9c57a9f73294414d92428c5d2472dc1e1e5e96) by [@kkoudev](https://github.com/kkoudev))
- Fix pod install for libraries using Swift code when the new architecture is enabled ([a4a0655496](https://github.com/facebook/react-native/commit/a4a065549677c61eb91bf587032976ed48c75821) by [@louiszawadzki](https://github.com/louiszawadzki))

## v0.72.1

### Added

#### iOS specific

- Add warning to help users migrate away from the interop layer. ([a702d0515f](https://github.com/facebook/react-native/commit/a702d0515f9005714da52cda7f6851e06b4103da) by [@cipolleschi](https://github.com/cipolleschi))
- Allow to lookup for ViewManager without the RCT prefix in the Interop Layer ([a28881a3d7](https://github.com/facebook/react-native/commit/a28881a3d79e732670157638aa5207c88c79718c) by [@cipolleschi](https://github.com/cipolleschi))

### Changed

- `react-native/metro-config` now includes all base config values from `metro-config` ([bbcedd385b](https://github.com/facebook/react-native/commit/bbcedd385bf7fe374955378d2c2a065318f740cb) by [@huntie](https://github.com/huntie))
- Bump CLI to 11.3.3 ([da84901f78](https://github.com/facebook/react-native/commit/da84901f78bdfc8c84ed71996c01f585d8b96367) by [@kelset](https://github.com/kelset))
- Bumped `@react-native/metro-config` to `0.72.7`, `@react-native/gradle-plugin` to `0.72.11`, `@react-native/virtualized-lists` to `0.72.6` ([95db9f98f2](https://github.com/facebook/react-native/commit/95db9f98f2673d9015f6786db2df4e5f16dc74fc) by [@kelset](https://github.com/kelset))

### Fixed

- `react-native/virtualized-lists` does not need `react-test-renderer` at runtime ([7a2a3278d0](https://github.com/facebook/react-native/commit/7a2a3278d08b13dbde7a6e967474c20d6a5c76a5) by [@tido64](https://github.com/tido64))

#### Android specific

- Exclude trailing whitespace from newline character on measuring text line width ([83d7a48a46](https://github.com/facebook/react-native/commit/83d7a48a46c00b99c52a8ac5897c013924e10152) by [@bernhardoj](https://github.com/bernhardoj))
- Set kotlin.jvm.target.validation.mode=warning on user projects ([10beefbbfa](https://github.com/facebook/react-native/commit/10beefbbfadcbe6e40314564e409bf592a16e571) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Bump SocketRocket to 6.1.0 ([8ce471e2fa](https://github.com/facebook/react-native/commit/8ce471e2fa802cc50ff2d6ab346627cb5f6d79b4) by [@cipolleschi](https://github.com/cipolleschi))
- fix `pod install --project-directory=ios` failing ([0b96bdcf32](https://github.com/facebook/react-native/commit/0b96bdcf326944b13e447f71739dee3c25c7b59a) by [@tido64](https://github.com/tido64))

## v0.72.0

### Breaking

- Bump version of Node used to 18 ([f75b92a](https://github.com/facebook/react-native/commit/f75b92a12b829d74f202aded7d4c8f4e1d23e402) by [@leotm](https://github.com/leotm)), and minimum Node JS version to 16 ([afc91de79a](https://github.com/facebook/react-native/commit/afc91de79a8804696f05219214e0e67235d34d77) by [@robhogan](https://github.com/robhogan))
- Constrain data type in `getItemLayout` callback ([febf6b7f33](https://github.com/facebook/react-native/commit/febf6b7f33fdb4904669f99d795eba4c0f95d7bf) by [@NickGerleman](https://github.com/NickGerleman))
- Fix react-native/eslint-config linting of jsx files ([59ee573527](https://github.com/facebook/react-native/commit/59ee57352738f030b41589a450209e51e44bbb06) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- Generates RNCore components inside the ReactCommon folder and create a new pod for platform-specific ImageManager classes ([5d175c6775](https://github.com/facebook/react-native/commit/5d175c6775d0c630fb53b41df4e2a08f15bd94a4) by [@cipolleschi](https://github.com/cipolleschi))
- Moved the RCTAppSetupUtils to the AppDelegate library to break a dependency cycle ([36a64dc2bd](https://github.com/facebook/react-native/commit/36a64dc2bd9de52841a52c549f35b944020bdb53) by [@cipolleschi](https://github.com/cipolleschi))
- Split the `ReactCommon/react/nativemodule/core/platform/ios` and `ReactCommon/react/nativemodule/samples` in two separate pods to break circular dependencies. ([21d530208f](https://github.com/facebook/react-native/commit/21d530208f57feda87dce9f93f471bbf57635477) by [@cipolleschi](https://github.com/cipolleschi))

### Added

- Improve handling of invalid DimensionValue usage ([02e29abead](https://github.com/facebook/react-native/commit/02e29abeada3d78dd7d90d1d89049cd1517afb55) by [@NickGerleman](https://github.com/NickGerleman))
- Add new JS performance API to support getting RN app startup timings ([c1023c73b0](https://github.com/facebook/react-native/commit/c1023c73b010245f2e8182b75cc3bccd112d5e2e))
- Add performance memory API with native memory Info ([70fb2dce45](https://github.com/facebook/react-native/commit/70fb2dce4557da1195289a24638b1e4d2c2edbf7))
- Added Web-compatible `DOMRect` and `DOMRectReadOnly` classes to the global scope. ([673c7617bc](https://github.com/facebook/react-native/commit/673c7617bcf90a892a0afc2c0d9cf9c0493fdf27) by [@rubennorte](https://github.com/rubennorte))
- Add onStartReached and onStartReachedThreshold to VirtualizedList ([7683713264](https://github.com/facebook/react-native/commit/76837132649d740e1ec2c3c78f0085b444a4367c) by [@janicduplessis](https://github.com/janicduplessis))
- Added `setColorScheme` to `Appearance` module ([c18566ffdb](https://github.com/facebook/react-native/commit/c18566ffdb44103a3e24cd8017d0ae6a69c68e40), ([0a4dcb0309](https://github.com/facebook/react-native/commit/0a4dcb0309fdc8f4529ed7599c4170341b42c9b1) by [@birkir](https://github.com/birkir))
- Add logical border block color properties ([597a1ff60b](https://github.com/facebook/react-native/commit/597a1ff60b3e1844b4794fb4acd40fa073f2e93b) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add logical border-radius implementation ([4ae4984094](https://github.com/facebook/react-native/commit/4ae4984094e4846bc2bc0e3374ab5d934ee6bc5f) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added CSS logical properties. ([3681df2878](https://github.com/facebook/react-native/commit/3681df287835f5467a2ad5afe950eae16b95fd8b) by [@necolas](https://github.com/necolas))
- Concurrent rendering safe implementation of Animated ([5cdf3cf726](https://github.com/facebook/react-native/commit/5cdf3cf72613a2068884151efb08fd4c17fec5fd), ([5e863fc42c](https://github.com/facebook/react-native/commit/5e863fc42c8a2b27f4a785766eb643de9a243b2d) by [@sammy-SC](https://github.com/sammy-SC))
- Create explicit error message for TypeScript functions used as props in Codegen components, redirecting devs to the supported function types `BubblingEventHandler` and `DirectEventHandler`. ([dc2cbed07c](https://github.com/facebook/react-native/commit/dc2cbed07c82b5b80e66f5c6a1bd6244f4972ede) by [@gtomitsuka](https://github.com/gtomitsuka))
- Generate enum types that would be allowed to be used as well as string/number in c++ turbo modules generators ([ceb1d0dea6](https://github.com/facebook/react-native/commit/ceb1d0dea694739f357d86296b94f5834e5ee7f7) by [@vzaidman](https://github.com/vzaidman))
- Add enum example to Android/iOS rn-tester TurboModule ([7c82a3fa11](https://github.com/facebook/react-native/commit/7c82a3fa110a618c7bd59555a3ae94304ab25b1f) by [@christophpurrer](https://github.com/christophpurrer))
- Allow the use of "Partial<T>" in Turbo Module specs. ([97e707d897](https://github.com/facebook/react-native/commit/97e707d897e63715023dc68bb059f4aa5332fc78) by [@vzaidman](https://github.com/vzaidman))
- Added newline to UTFSequence ([9cf35bfcc4](https://github.com/facebook/react-native/commit/9cf35bfcc47c928392ac524cd9e3fd30a1130fbb))
- Added "coverage" folder generated from `jest --coverage` to .gitignore ([7324c22ff9](https://github.com/facebook/react-native/commit/7324c22ff91c572b4022a1d22c6c7751a73ad76a) by [@Adnan-Bacic](https://github.com/Adnan-Bacic))
- Add support for getting/setting reload-and-profile-related settings in iOS + Android ([96d6680e00](https://github.com/facebook/react-native/commit/96d6680e00c28575d6ebf95d5f55487d69fda51f))
- For supporting Dev Loading View across platforms, adding the DevLoadingViewController without an activity/context. ([662b51fad2](https://github.com/facebook/react-native/commit/662b51fad2fb4c267da519c9122ab4d12dcfdaae))
- Pass DevTools Settings Manager to connectToDevTools ([a9bed8e75d](https://github.com/facebook/react-native/commit/a9bed8e75d9b9613c5fcb69436a2d3af763f456d))
- React-native-code-gen Add Union Type support for Java/ObjC TurboModules ([2eccd59d7c](https://github.com/facebook/react-native/commit/2eccd59d7c735df3c29fc7ca342555890eb7055b) by [@christophpurrer](https://github.com/christophpurrer))
- Making Dev Loading View cross platform by abstracting out the activity/context logic from the controller in a polymorph class. ([1a4fa92b25](https://github.com/facebook/react-native/commit/1a4fa92b253aeb70162322e9d4135fb34901dcf1))
- Added CSS logical properties by mapping layout props. ([cf3747957a](https://github.com/facebook/react-native/commit/cf3747957ab210e31504109bb6b3e34e773a5b9a) by [@mayank-96](https://github.com/mayank-96))
- Add, but don't use, DevTools Settings Manager. ([6152763398](https://github.com/facebook/react-native/commit/6152763398efe60521fc86fcf992b6a84361df12))

#### Android specific

- Adding pager, scrollview, viewgroup, webview, drawer accessibility roles ([55c0df43b9](https://github.com/facebook/react-native/commit/55c0df43b9859853e41b6e2ef271b78b783538f0) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Add TYPE_VIEW_HOVER_ENTER to AccessibilityNodeInfo sendAccessibilityEvent ([a0adf57e50](https://github.com/facebook/react-native/commit/a0adf57e509dbb9074b2fa14339c5add140f5332) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Add maintainVisibleContentPosition support on Android ([c19548728c](https://github.com/facebook/react-native/commit/c19548728c9be3ecc91e6fefb35bc14929109d60) by [@janicduplessis](https://github.com/janicduplessis))
- For supporting Dev Loading View across multiple platforms, changing the Loading View of Android to rely on the native implementation instead of Toast while keeping backwards comptability. ([9f6b532bdb](https://github.com/facebook/react-native/commit/9f6b532bdb7e60eddec62b7a0b89141e4c8df127))
- For supporting Dev Loading View across multiple platforms, adding native implementation for showMessage() & hide() of Dev Loading Module ([4923a0997b](https://github.com/facebook/react-native/commit/4923a0997b1a8c827b11ec15e45e6ce00f398d99))
- For supporting Dev Loading View across multiple platforms, altering the javascript implementation of Loading view of android to also rely on native implementation as iOS instead of Toast, thereby unifying both platforms ([068a20842d](https://github.com/facebook/react-native/commit/068a20842d349318db2236676415e96be2a663f9))
- Added possibility to mark Fresco image pipeline as already initialized ([605a52fe3e](https://github.com/facebook/react-native/commit/605a52fe3ec099b652fc222947d1ddffa41cfd7f) by [@oprisnik](https://github.com/oprisnik))
- Support generating `getName` in react-native-codegen for Java TurboModules ([90538909f9](https://github.com/facebook/react-native/commit/90538909f988a8be9475cf12471269b70dbc179e) by [@javache](https://github.com/javache))
- Override default Talkback automatic content grouping and generate a custom contentDescription ([759056b499](https://github.com/facebook/react-native/commit/759056b49975c30cd561826e1499ebdf7aa8674d) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Enable AnimatedInterpolation to interpolate arbitrary color types. ([e7dbfb2dbd](https://github.com/facebook/react-native/commit/e7dbfb2dbd98059ddd6e982e2e43c1e7df91a4cc) by [@javache](https://github.com/javache))
- Added getter for line height in CustomLineHeightSpan ([2d2f9da80b](https://github.com/facebook/react-native/commit/2d2f9da80b86505dace0ee8ffbadde151067cb8f))
- Add POST_NOTIFICATIONS permission to AndroidManifest of RNTester ([c84cc4b46c](https://github.com/facebook/react-native/commit/c84cc4b46c8dfbb62c3b95fc26aa59f0105f0438) by [@makovkastar](https://github.com/makovkastar))

#### iOS specific

- Added examples of direct manipulation ([a44d8a0f8a](https://github.com/facebook/react-native/commit/a44d8a0f8a9b6533b50ac6318fa5993bd41d444b) by [@cipolleschi](https://github.com/cipolleschi))
- Support workspace and isolated setups with `pod install` ([0eff8d66c9](https://github.com/facebook/react-native/commit/0eff8d66c9acfad91c9e6a37b321034358ee4719) by [@robhogan](https://github.com/robhogan))
- Add example in the Interop Layer to use constants ([a5866ca3aa](https://github.com/facebook/react-native/commit/a5866ca3aad53802e8010295a205e956e8e26120) by [@cipolleschi](https://github.com/cipolleschi))
- Add example in the Interop Layer to use events ([c005830958](https://github.com/facebook/react-native/commit/c005830958921a030fd46b6968b778509d3bcb45) by [@cipolleschi](https://github.com/cipolleschi))
- Add invoking dev menu on iOS by pressing `d` in terminal. ([f72f8daeaf](https://github.com/facebook/react-native/commit/f72f8daeaf20ae53e778143aecbb96303852aeb0) by [@szymonrybczak](https://github.com/szymonrybczak))
- Add comments for specifying the path to React Native ([3876368f0c](https://github.com/facebook/react-native/commit/3876368f0c5e5dcbafee9a71da80a4a7226096a0) by [@sottar](https://github.com/sottar))
- Add explicit support for M2 iPad Apple Pencil hovering in the Pointer Events implementation ([0c150b2289](https://github.com/facebook/react-native/commit/0c150b2289818267c940b6e726ec2f7725659817) by [@vincentriemer](https://github.com/vincentriemer))
- Add message with instructions about what to do if the cleanup of the build folder fails. ([1b7127bb05](https://github.com/facebook/react-native/commit/1b7127bb052096509de60ee5eb098d669c616f32))
- Enable AnimatedInterpolation to interpolate arbitrary color types. ([56b10a8351](https://github.com/facebook/react-native/commit/56b10a83511ee509c36eb91f53da58d5eda643d5) by [@javache](https://github.com/javache))
- Allow for custom project dir in react-native-xcode script ([436da18fce](https://github.com/facebook/react-native/commit/436da18fce99af6361bae5719cfce0ed4539a3f7) by [@itxch](https://github.com/itxch))
- Enable AnimatedInterpolation to interpolate arbitrary color types. ([6003e70e84](https://github.com/facebook/react-native/commit/6003e70e84c369d7dc2c6bea50ea41f0bac79595) by [@javache](https://github.com/javache))

### Changed

- Default condition set for experimental Package Exports is now `['require', 'react-native']` ([308838c0ff](https://github.com/facebook/react-native/commit/308838c0ff3cdc4c7817afe349eddfab80c0c76c) by [@huntie](https://github.com/huntie))
- Run commit hooks before layout calculation ([8d0b5af1fc](https://github.com/facebook/react-native/commit/8d0b5af1fc13928c024663f10b0257e816bd6696) by [@tomekzaw](https://github.com/tomekzaw))
- Support mixed props for components in codegen ([0ae5e50e37](https://github.com/facebook/react-native/commit/0ae5e50e3753f03712e796dc28a36083bde87dc1) by [@genkikondo](https://github.com/genkikondo))
- Switch from `types/jest` to `jest/globals` for new react-native projects ([9af3c9654a](https://github.com/facebook/react-native/commit/9af3c9654ae8e2cb10d49770dd3438aec038fcef) by [@UNIDY2002](https://github.com/UNIDY2002))
- Move virtualized lists to react-native/virtualized-lists package ([2e3dbe9c2f](https://github.com/facebook/react-native/commit/2e3dbe9c2fbff52448e2d5a7c1e4c96b1016cf25) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add minimum necessary .d.ts files to react-native-codegen ([ac5aec3f5c](https://github.com/facebook/react-native/commit/ac5aec3f5caa732f4565328447ffa9da7ede8dec), ([be3845adec](https://github.com/facebook/react-native/commit/be3845adec324e4b3ae6efd8f85d3569f1cb60b8) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Change PerformanceApiExample to use ModulePathing ([6a395cb2d7](https://github.com/facebook/react-native/commit/6a395cb2d722761825c9f24468b6d036e3e0f52c) by [@TatianaKapos](https://github.com/TatianaKapos))
- Re-organize the parameters of TurboModuleBinding::install() ([cbdbb47467](https://github.com/facebook/react-native/commit/cbdbb474675bb6fbd5857873234d825c52ca16b3))
- `EventEmitter#addListener` now throws if the 2nd argument is not a function. ([2780ba38ff](https://github.com/facebook/react-native/commit/2780ba38ff23f4c5e717b8fd8a733b649701f00c) by [@yungsters](https://github.com/yungsters))
- When a ScrollView's `ref` or `innnerViewRef` changes, the old ref will now be invoked with `null` and the new ref with the active instance. (Previously, changing `ref` or `innerViewRef` on a `ScrollView` would be treated as though the ref had not changed at all.) ([7cf4cf3afb](https://github.com/facebook/react-native/commit/7cf4cf3afbea4463427944fbed30768a796db724) by [@yungsters](https://github.com/yungsters))
- Turbo Module supports intersection type for TypeScript ([bbed15d4ae](https://github.com/facebook/react-native/commit/bbed15d4ae6df23bab2f0730562396ef61f0bc59) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Find node binary when using asdf as the node version manager with custom `$ASDF_DIR` ([f6a4e4f20f](https://github.com/facebook/react-native/commit/f6a4e4f20f0d3b5fe2aad171cded9aba06d3c8f8) by [@MuhmdRaouf](https://github.com/MuhmdRaouf))
- Turbo module codegen support interface with inheritance in module ([bf34810c5c](https://github.com/facebook/react-native/commit/bf34810c5c188cd1c42e2ac0c52d08790209bc1e) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Use number literals in TypeScript types for `FileReader` and `XMLHttpRequest` states ([8568b93733](https://github.com/facebook/react-native/commit/8568b937335b152c2836e7790c1db75e93365787) by [@eps1lon](https://github.com/eps1lon))
- Moved jest config from package.json to dedicated jest.config.js file ([473eb1dd87](https://github.com/facebook/react-native/commit/473eb1dd870a4f62c4ebcba27e12bde1e99e3d07) by [@Adnan-Bacic](https://github.com/Adnan-Bacic))
- Removed iOS flag from `scrollEventThrottle` docs ([8ea1cba06a](https://github.com/facebook/react-native/commit/8ea1cba06a78fba023e5a441ad5c4755d0d504ac) by [@robwalkerco](https://github.com/robwalkerco))
- Renamed App-test.tsx to App.test.tsx to unify naming convention with create-react-app ([3c03aef151](https://github.com/facebook/react-native/commit/3c03aef1511844262f38149ad261e26703f55ead) by [@Adnan-Bacic](https://github.com/Adnan-Bacic))
- Turbo module codegen support interface like alias in module ([8befb740d6](https://github.com/facebook/react-native/commit/8befb740d6cd3de6ead067ac01b70c37d4b5b1bc) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Append RCTRedBoxGetEnabled() in RCTExceptionsManager.mm ([2217ea4136](https://github.com/facebook/react-native/commit/2217ea4136e96185c46947b5afe0a24574b3f23a) by [@nxdm](https://github.com/nxdm))
- ActivityIndicator and remove .flow ([9c57a7f209](https://github.com/facebook/react-native/commit/9c57a7f20925765da69590256ca8755b71735cdb) by [@lunaleaps](https://github.com/lunaleaps))
- Mark methods on JSI references as const. ([03b17d9af7](https://github.com/facebook/react-native/commit/03b17d9af7e4e3ad3f9ec078b76d0ffa33a3290e) by [@neildhar](https://github.com/neildhar))
- Fix codegen output for object with indexer ([f07490b1f1](https://github.com/facebook/react-native/commit/f07490b1f1b492b75cfa06df00f6e89b404a1ee8) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Fix codegen to add `T` of `Promise<T>` in CodegenSchema.js ([8a38e03e0f](https://github.com/facebook/react-native/commit/8a38e03e0f25528063d24a429c1d650363a0eee7) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Renamed react-native/polyfills -> react-native/js-polyfills and align with other packages versions (0.72.0) as a part of migration to monorepo ([71399d0891](https://github.com/facebook/react-native/commit/71399d089187c3e2e58b3cbf31977368d0f216fa) by [@hoxyq](https://github.com/hoxyq))
- Rename normalize-color to normalize-colors as part of https://github.com/react-native-community/discussions-and-proposals/pull/480 ([dc3355920d](https://github.com/facebook/react-native/commit/dc3355920d7f6f4ef887e0ff01153e23e660b5ea) by [@Titozzz](https://github.com/Titozzz))
- Renamed react-native-codegen package to react-native/codegen and updated references ([b7a85b59b5](https://github.com/facebook/react-native/commit/b7a85b59b5798add4e9dbfb5f5f2fc62756e30b5) by [@shivenmian](https://github.com/shivenmian))
- Rename assets to assets-registry ([3c5a8290ae](https://github.com/facebook/react-native/commit/3c5a8290ae1645672ee585feaf6ff38df1e30b34) by [@fortmarek](https://github.com/fortmarek))
- Rename polyfills to js-polyfills as part of https://github.com/react-native-community/discussions-and-proposals/pull/480 ([ca1ae5c44f](https://github.com/facebook/react-native/commit/ca1ae5c44ffa0b1a149e69e47b7f51cb6a914734) by [@Titozzz](https://github.com/Titozzz))
- Rename react-native-gradle-plugin to react-native/gradle-plugin ([6f11b10a88](https://github.com/facebook/react-native/commit/6f11b10a88235ad7de1a5777e5cdf7a582a231b7) by [@hoxyq](https://github.com/hoxyq))
- Renamed `react-native-community/eslint-plugin` to `react-native/eslint-plugin` v0.72.0 to align with other packages ([5aead70e80](https://github.com/facebook/react-native/commit/5aead70e8026e6567cb79e585ab2c6cf6e396892) by [@afoxman](https://github.com/afoxman))
- Untrack Test Reports generated by test libraries (reporters E.g. `jest-junit`) ([0ba1127c15](https://github.com/facebook/react-native/commit/0ba1127c15182564ac25b41b55433ed8f9512a9c) by [@Pranav-yadav](https://github.com/Pranav-yadav))
- Add `TSMethodSignature` to react-native-codegen ([ae1d54bc5a](https://github.com/facebook/react-native/commit/ae1d54bc5ac5ecdf5f7e17b709c53872c606277e) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Any `ref` set on `TextInput` will now be updated less frequently (when the underlying `ref` has not changed). ([666f56bff3](https://github.com/facebook/react-native/commit/666f56bff318549b62ae5f68f0a046ef8d81c545) by [@yungsters](https://github.com/yungsters))
- Add intersection types in react-native-codegen for TypeScript ([813fd04118](https://github.com/facebook/react-native/commit/813fd04118c30054cc7c30e231cd9d4002423d32) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Update TextInput inputMode to map "none" to showSoftInputOnFocus ([b6869be1ac](https://github.com/facebook/react-native/commit/b6869be1ac0bedcb846722160f29fb4591ae5013) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- LogBox now makes URL links tappable. ([d9ade19b71](https://github.com/facebook/react-native/commit/d9ade19b711fae03838581ff2564185d5b7a24cb) by [@sammy-SC](https://github.com/sammy-SC))
- Upgrade to deprecated-react-native-prop-types@4.1.0 ([f84256a924](https://github.com/facebook/react-native/commit/f84256a924ef8aee8ac5773dbf569ee627472101) by [@yungsters](https://github.com/yungsters))
- Flipper to 0.182.0 ([8fae37eaea](https://github.com/facebook/react-native/commit/8fae37eaeab0c75c0be2885ce9198131e4d74c92) by [@cortinico](https://github.com/cortinico))
- Bump metro to 0.76.5 and CLI to 11.3.1 ([7c5dc1d9bc](https://github.com/facebook/react-native/commit/7c5dc1d9bc57c9b07ecabaff53b5ed79c9dd586f))
- Bump tsconfig/react-native to 3.0.0 ([5c4649af27](https://github.com/facebook/react-native/commit/5c4649af279d40c83b181f2a35b7cf58a50eac2a) by [@NickGerleman](https://github.com/NickGerleman))
- Brew overwrites system Python 3. ([ed8a3e08e2](https://github.com/facebook/react-native/commit/ed8a3e08e2f227a37730b697b0e4e2c7d63e27ff) by [@blakef](https://github.com/blakef))
- Change the way types for New Architecture/experimental APIs are exposed. ([f9bf14d09d](https://github.com/facebook/react-native/commit/f9bf14d09d70fb89f7425c6c7f99aec96cbb2bf8) by [@lunaleaps](https://github.com/lunaleaps))
- Backporting babel bumps to 0.72 ([97986561f6](https://github.com/facebook/react-native/commit/97986561f60d7cf17eed3e264743198429b54a8b) by [@hoxyq](https://github.com/hoxyq))

#### Android specific

- Migrate packages to not eager initialize view managers ([d7eb3bfcb3](https://github.com/facebook/react-native/commit/d7eb3bfcb3df43d787af34cbd16730b2a12b6714))
- Do not explicitely depend on androidx.swiperefreshlayout:swiperefreshlayout ([179d5ab8ee](https://github.com/facebook/react-native/commit/179d5ab8eeb4393737049655876f5853b07f2560) by [@cortinico](https://github.com/cortinico))
- Remove the enableSeparateBuildPerCPUArchitecture from the template entirely ([dadf74fb68](https://github.com/facebook/react-native/commit/dadf74fb68980f4cba3d23e3802ee431a0713cca) by [@cortinico](https://github.com/cortinico))
- Convert Bridge-only calls to overridable functions ([1058bb8096](https://github.com/facebook/react-native/commit/1058bb809602a5223fa0adba74e7cab4df766685))
- Use ThemedReactContext explicitly to reduce confusion ([9f78517d64](https://github.com/facebook/react-native/commit/9f78517d6401f3a7ece453825a059a13b73f6140))
- Add notes to `aria-labelledby` from Text props ([72d3da19ce](https://github.com/facebook/react-native/commit/72d3da19cecca6a1bc8119f963311e1126e4c04b) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add POST_NOTIFICATION runtime permission to RNTester ([63a4539e4d](https://github.com/facebook/react-native/commit/63a4539e4d36ac90137eea6cdde0154ca06878c0) by [@makovkastar](https://github.com/makovkastar))
- Removing code for Android API level < 21 ([22ba1e45c5](https://github.com/facebook/react-native/commit/22ba1e45c52edcc345552339c238c1f5ef6dfc65) by [@mdvacca](https://github.com/mdvacca))
- Align creation of FabricUIManager with bridge ([6d45e49dc7](https://github.com/facebook/react-native/commit/6d45e49dc783d0af3a39be2df5e8495541d65e5f))
- For supporting Dev Loading View across multiple platforms, changed the Loading View of Android to rely on the native implementation instead of Toast. Getting rid of the JS changes relying on Toast for Dev Loading View now that the native module is released. ([208f559505](https://github.com/facebook/react-native/commit/208f5595055426305a9f23e92546b2ad09a8a52c))
- Remove unnecessary repositories{} block from top level build.gradle ([51a48d2e2c](https://github.com/facebook/react-native/commit/51a48d2e2c64a18012692b063368e369cd8ff797) by [@cortinico](https://github.com/cortinico))
- Include the inspector in all build modes, and only turn it off/on at runtime. ([8284303ec8](https://github.com/facebook/react-native/commit/8284303ec8d670a421745b3f580f184afa892592))
- Bump Soloader to 0.10.5 ([92a705b0e0](https://github.com/facebook/react-native/commit/92a705b0e0654429068d9de130f2216373124bbb) by [@simpleton](https://github.com/simpleton))
- Bump AGP to 7.4.x ([4c5eb8dd2a](https://github.com/facebook/react-native/commit/4c5eb8dd2a8cfb78783ab9cc3ac5a1c3f7937b63), ([5647d79dc9](https://github.com/facebook/react-native/commit/5647d79dc97ab2787a9575cb1621725d865b9814) by [@cortinico](https://github.com/cortinico))
- Bump Gradle to 8.x ([81dd3afe0b](https://github.com/facebook/react-native/commit/81dd3afe0bb88fbfa5b11d6f4c95f8684c9e1b47), ([10a8f186eb](https://github.com/facebook/react-native/commit/10a8f186eb41441ebad0c91be4f88deb4f9c6366) by [@cortinico](https://github.com/cortinico))
- Kotlin to 1.7.22 for Gradle ([270584ac79](https://github.com/facebook/react-native/commit/270584ac79ebb5b8e256bf7422615a5311e0c080) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Fixed URL to New Arch info ([6714b99289](https://github.com/facebook/react-native/commit/6714b99289d68b2f1efdb38d9977da725778e949) by [@frankcalise](https://github.com/frankcalise))
- Prefer `Content-Location` header in bundle response as JS source URL ([671ea383fe](https://github.com/facebook/react-native/commit/671ea383fe45dd9834a0c0481360de050df7f0c9) by [@robhogan](https://github.com/robhogan))
- Add support to enable the Hermes Sampling Profiler ([dce9d8d5de](https://github.com/facebook/react-native/commit/dce9d8d5de381fe53760ddda0d6cbbdfb5be00e4) by [@cipolleschi](https://github.com/cipolleschi))
- Enable layout animations on iOS in OSS ([0a30aa3612](https://github.com/facebook/react-native/commit/0a30aa361224639dbec0bbf33351673b67d31e75) by [@sammy-SC](https://github.com/sammy-SC))
- Update how the `react-native.config.js` is consumed to add elements in the interop layer. ([a055e07c3e](https://github.com/facebook/react-native/commit/a055e07c3ecd82dad6b2f9d9cc0088bce689d07e) by [@cipolleschi](https://github.com/cipolleschi))
- Use contents of sdks/.hermesversion to let cocoapods recognize Hermes updates. ([9f496e2be5](https://github.com/facebook/react-native/commit/9f496e2be5cfa55cd993c94f3a9210955bea085c) by [@dmytrorykun](https://github.com/dmytrorykun))
- Rename "Debug Menu" title to "Dev Menu" ([6971540c90](https://github.com/facebook/react-native/commit/6971540c90ae9e56bcc65e0c33c1ffb3db0a1e06) by [@huntie](https://github.com/huntie))
- Give precedence to `textContentType` property for backwards compat as mentioned in https://github.com/facebook/react-native/issues/36229#issuecomment-1470468374 ([c0abff11b6](https://github.com/facebook/react-native/commit/c0abff11b66d9ec3a8e1d09333a3fb6c05678bed) by [@lunaleaps](https://github.com/lunaleaps))
- Use SocketRocket for web socket library ([9ee0e1c78e](https://github.com/facebook/react-native/commit/9ee0e1c78e422a83de01d045657c10454f66980a))
- Pull out CGContext early in UIImage+Diff ([7f2dd1d49c](https://github.com/facebook/react-native/commit/7f2dd1d49cc3c0bf5e24fdb37f6457151c1f06c4) by [@Saadnajmi](https://github.com/Saadnajmi))
- Remove assumptions on super's description ([a5bc6f0574](https://github.com/facebook/react-native/commit/a5bc6f0574b6eff52b65d5324749d89de01b63a5) by [@Saadnajmi](https://github.com/Saadnajmi))
- Automatically update Search Path on pods ([ad686b0ce1](https://github.com/facebook/react-native/commit/ad686b0ce1ce69e8414e0c385ce0c7b4277f7a2f) by [@cipolleschi](https://github.com/cipolleschi))
- Install the -DNDEBUG flag on Release configurations, without requiring PRODUCTION=1 flag ([93fdcbaed0](https://github.com/facebook/react-native/commit/93fdcbaed0f69b268e1ae708a52df9463aae2d53) by [@cipolleschi](https://github.com/cipolleschi))
- Create a new compile time flag to enable remote sample profiling. ([de28f9b8ea](https://github.com/facebook/react-native/commit/de28f9b8ea2c4c2e3584da76145b9d6ce0e68b02))
- Bumbed version of Cocoapods to support Ruby 3.2.0 ([0f56cee8e1](https://github.com/facebook/react-native/commit/0f56cee8e1fca9575e83f439274b83e01bdd98e2) by [@cipolleschi](https://github.com/cipolleschi))
- Automatically install the RuntimeScheduler ([3e88fd01ce](https://github.com/facebook/react-native/commit/3e88fd01cecfa9c627506c8ab0081d1e4865862a) by [@cipolleschi](https://github.com/cipolleschi))
- Generate RCTFabric framework's headers in the React folder ([e7becb06c1](https://github.com/facebook/react-native/commit/e7becb06c16718a38570ba3a06d5059276be4b23) by [@cipolleschi](https://github.com/cipolleschi))
- Properly install dependencies with `use_frameworks!` ([6d34952420](https://github.com/facebook/react-native/commit/6d349524201e150029202134910de445328072e8) by [@cipolleschi](https://github.com/cipolleschi))
- Moved the files from `.../textlayoutmanager/platform/ios` to `.../textlayoutmanager/platform/ios/react/renderer/textlayoutmanager` ([0e09d6f8a6](https://github.com/facebook/react-native/commit/0e09d6f8a665357f0dc642067eceb8f51ae24b76) by [@cipolleschi](https://github.com/cipolleschi))
- Moved the files from `.../imagemanager/platform/ios` to `.../imagemanager/platform/ios/react/renderer/imagemanager` ([931a4c5e23](https://github.com/facebook/react-native/commit/931a4c5e239a006ecc81becf3252d23d44c969ef) by [@cipolleschi](https://github.com/cipolleschi))
- Moved the files from `.../textinput/iostextinput` to `.../textinput/iostextinput/react/renderer/components/iostextinput` ([5588e0fe0b](https://github.com/facebook/react-native/commit/5588e0fe0b78bfcbc32b6880e9c985853aea5653) by [@cipolleschi](https://github.com/cipolleschi))
- Moved the files from `.../nativemodule/xxx/platform/ios` to `.../nativemodule/xxx/platform/ios/ReactCommon` ([d1e500c3b1](https://github.com/facebook/react-native/commit/d1e500c3b19182897ccfb8abfe87e3f32dcacd3e) by [@cipolleschi](https://github.com/cipolleschi))
- Moved the files from `.../platform/ios` to `.../platform/ios/react/renderer/graphics` ([b5e4fea86e](https://github.com/facebook/react-native/commit/b5e4fea86ef9df1ed0edb438f918dfc8330f649c) by [@cipolleschi](https://github.com/cipolleschi))
- Build hermesc in Xcode run script phase. ([a5c77115ae](https://github.com/facebook/react-native/commit/a5c77115ae94b46823dc788add516493ee8e82cb) by [@dmytrorykun](https://github.com/dmytrorykun))
- Do not add "Copy Hermes Framework" script phase to hermes-engine target. ([af6c9e2183](https://github.com/facebook/react-native/commit/af6c9e218305c70e479c75e5ce1a8d633b1e2947) by [@dmytrorykun](https://github.com/dmytrorykun))
- Refactor RCTEventEmitter initialization ([25a00520d8](https://github.com/facebook/react-native/commit/25a00520d80b8b456b1eccfb106b75929f2f3bc2) by [@cipolleschi](https://github.com/cipolleschi))

### Deprecated

#### iOS specific

- Deprecate the `ReactCommon/react/renderer/graphics/conversions.h` in favor of `ReactCommon/react/core/graphicsConversions.h` ([d72697ca95](https://github.com/facebook/react-native/commit/d72697ca95820ebc7594b11bb5a6effeb84f2d90) by [@cipolleschi](https://github.com/cipolleschi))

### Removed

- Remove inline props from experimental ([8c4694f708](https://github.com/facebook/react-native/commit/8c4694f708fec310fc13193cc7fda40d971ed847))
- Refactor(react-native-github): internalized Slider JS files ([05968d16e1](https://github.com/facebook/react-native/commit/05968d16e1c4714a7ebfb08fff60ec7d5c914de1) by [@hoxyq](https://github.com/hoxyq))
- Remove `.node_version` from app template. ([a80578afc4](https://github.com/facebook/react-native/commit/a80578afc456c352edb52fc9b7e19899553a359a) by [@robhogan](https://github.com/robhogan))
- Clean up unnecessary lambda function for preallocate after D40403682 ([0569f6500e](https://github.com/facebook/react-native/commit/0569f6500e1ba9dbf021c8d693d5ac31af5dd586))
- Remove unused type imports 1/1 ([58a6cf840a](https://github.com/facebook/react-native/commit/58a6cf840afc9522b6cd9f3b15d119ddba7dab31) by [@alunyov](https://github.com/alunyov))
- Remove force_static from ReactCommon/react/renderer/core ([e088f81375](https://github.com/facebook/react-native/commit/e088f81375aa0216625bc38c964f50af6c4107b7) by [@javache](https://github.com/javache))

#### Android specific

- Deprecate LazyReactPackage.getReactModuleInfoProviderViaReflection() ([11570e71a2](https://github.com/facebook/react-native/commit/11570e71a2747602ff485552094b413375b19a96))
- UIManager.preInitializeViewManagers ([848ac0c3be](https://github.com/facebook/react-native/commit/848ac0c3bea5f38c002d316dbfb54c2d740bedfe) by [@javache](https://github.com/javache))
- Removed android sources of Slider module ([4c40014d43](https://github.com/facebook/react-native/commit/4c40014d43abe88b17db75aca9de9cca349ecbcc) by [@hoxyq](https://github.com/hoxyq))
- Remove the react.gradle file as it's unused ([d4a9bdc40e](https://github.com/facebook/react-native/commit/d4a9bdc40e06bdda9565cc43ea5af5a13ff6f1cf) by [@cortinico](https://github.com/cortinico))
- Remove .mk prebuilt file and .mk file generation from codegen ([7933dd78da](https://github.com/facebook/react-native/commit/7933dd78daed84581f3013c0a8e0130b6fdf81f9) by [@cortinico](https://github.com/cortinico))
- Remove deprecated POST_NOTIFICATION from `PermissionsAndroid` ([deb6b380b2](https://github.com/facebook/react-native/commit/deb6b380b251564163939fbf04cf62e07c9820bb) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Removed unused RCTWeakProxy helper ([2fbefff178](https://github.com/facebook/react-native/commit/2fbefff178b11a61089bd41296c918fa1b8857b9) by [@javache](https://github.com/javache))
- Removed Slider module ([465e937533](https://github.com/facebook/react-native/commit/465e9375338c8a3baab963c1f699c1c67af01029) by [@hoxyq](https://github.com/hoxyq))
- Removed DatePickerIOS module ([0ff7b7fac2](https://github.com/facebook/react-native/commit/0ff7b7fac2750f149592e41bb8825dcc65dea71d) by [@hoxyq](https://github.com/hoxyq))
- Removed iOS sources of Slider module ([fee9510b2d](https://github.com/facebook/react-native/commit/fee9510b2d8ff73be632dbe6f07003f001104836) by [@hoxyq](https://github.com/hoxyq))
- Removed native iOS sources of ProgressViewIOS ([1453ef1a88](https://github.com/facebook/react-native/commit/1453ef1a8836ead03f66792bd36bfcde333434c0) by [@hoxyq](https://github.com/hoxyq))
- Remove conformance to RCTComponentViewFactoryComponentProvider which does not exists in 0.72 ([ee177cab75](https://github.com/facebook/react-native/commit/ee177cab7583fa305d43c66342fb9b3693a4769a))

### Fixed

- Improved support for AnimatedInterpolation of color props. ([b589123a3d](https://github.com/facebook/react-native/commit/b589123a3dc0c6190137fbd2e6c18f24b98642f1) by [@javache](https://github.com/javache))
- Improved handling of native colors in Animated.Colors ([dccb57fb50](https://github.com/facebook/react-native/commit/dccb57fb50874e31dd0d3f6e39666e4a5b9a079d) by [@javache](https://github.com/javache))
- Patch AnimatedStyle to avoid discarding the initial style info ([c06323f463](https://github.com/facebook/react-native/commit/c06323f46334ee720cc46d48405ce584de16163d) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Gracefully handle out-of-bounds initialScrollIndex ([aab9df3710](https://github.com/facebook/react-native/commit/aab9df37102b6b8661a9e22ee8ae63166c8c632e) by [@NickGerleman](https://github.com/NickGerleman))
- Fix VirtualizedList onViewableItemsChanged won't trigger if first item in data is null ([011ea3306f](https://github.com/facebook/react-native/commit/011ea3306f02479b8003f519f7fc568a743b2019) by [@gauravroy1995](https://github.com/gauravroy1995))
- Fix VirtualizedList `onViewableItemsChanged` won't trigger if first item in data evaluate to false ([1f0c2c2895](https://github.com/facebook/react-native/commit/1f0c2c289506aa0a5e1fc0e77e1fe48351e2050d) by [@samchan0221](https://github.com/samchan0221))
- Calculate VirtualizedList render mask for focused cell during batched state updates ([cab865be79](https://github.com/facebook/react-native/commit/cab865be797b724d2fda5441e0ef23559180f722) by [@NickGerleman](https://github.com/NickGerleman))
- Bail on realizing region around last focused cell if we don't know where it is ([776fe7a292](https://github.com/facebook/react-native/commit/776fe7a29271d1b4678a0913315487724d201449) by [@NickGerleman](https://github.com/NickGerleman))
- Avoid VirtualizedList viewability updates during state updates ([62a0640e4a](https://github.com/facebook/react-native/commit/62a0640e4a8297177e857530e46010e83315e70a) by [@NickGerleman](https://github.com/NickGerleman))
- Add `lineBreakStrategyIOS` prop type for Text and TextInput ([0c5c07fc9b](https://github.com/facebook/react-native/commit/0c5c07fc9bf2ca13aece3dd9fa35d6c822f1fd84) by [@jeongshin](https://github.com/jeongshin))
- Fix negative value rounding issue for nodes across an axis ([37171ec78f](https://github.com/facebook/react-native/commit/37171ec78f377fbae89ce43010f9cf69c1e60fbc))
- Reduce use of assertions when parsing accessibility props passed from JS ([a064de151f](https://github.com/facebook/react-native/commit/a064de151f8314abacbd0f17127597266644fd78) by [@motiz88](https://github.com/motiz88))
- Fixes crash when using togglebutton accessibilityRole with Text ([dcc5dbe562](https://github.com/facebook/react-native/commit/dcc5dbe562cedd3bb9e954736c18780830e5f719) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fixes an issue with the EventEmitter type definition file ([4acef8e4a4](https://github.com/facebook/react-native/commit/4acef8e4a4d1ec51eeea751c7ee6aa36d8b7f457) by [@helenaford](https://github.com/helenaford))
- Fix animated components ref type inferred `any` ([419b41f06d](https://github.com/facebook/react-native/commit/419b41f06dfd7c75d9734ce2d61b511f11097c63) by [@jeongshin](https://github.com/jeongshin))
- Allow out-of-range initialScrollIndex after first scroll ([d595fbcc5a](https://github.com/facebook/react-native/commit/d595fbcc5a1a6c4a9fd9f20b6cabe1093ea346a6) by [@NickGerleman](https://github.com/NickGerleman))
- Delete refs to unmounted CellRenderers ([c376e78224](https://github.com/facebook/react-native/commit/c376e782247766d2c1f92cadf3ce1ab368933d25) by [@NickGerleman](https://github.com/NickGerleman))
- Enforce compatibility with `exactOptionalPropertyTypes` ([7858a2147f](https://github.com/facebook/react-native/commit/7858a2147fde9f754034577932cb5b22983f658f) by [@NickGerleman](https://github.com/NickGerleman))
- Fix touch handling so that hitSlop can extend beyond parent view bounds. ([96659f8e83](https://github.com/facebook/react-native/commit/96659f8e83e68f6330aaa59e3d5fb0953c67f1d1) by [@genkikondo](https://github.com/genkikondo))
- Export EmitterSubscription TypeScript Type ([eb83356cee](https://github.com/facebook/react-native/commit/eb83356ceee1ff3bca3073d7c4050981f2c01a4c) by [@NickGerleman](https://github.com/NickGerleman))
- Fix: remove gap if its last element in line (fix flex gap extra spacing when children determine parents main axis size) ([d867ec0abb](https://github.com/facebook/react-native/commit/d867ec0abb6cf6da6e2be44d28bbf9fc38319298) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- Fixes JSDoc in Clipboard setString ([0ecb4e64f0](https://github.com/facebook/react-native/commit/0ecb4e64f0006a0dd2fb64cb64f97ed01c638781) by [@mikemikhaylov](https://github.com/mikemikhaylov))
- Fix typing for TS AnimatableStringValue ([eb2f86a46a](https://github.com/facebook/react-native/commit/eb2f86a46a89765de3bd32541d3e7043fe236108) by [@rshest](https://github.com/rshest))
- Fix types + documentation for CellRendererComponent ([2d41e6642e](https://github.com/facebook/react-native/commit/2d41e6642eaee636f90d5737ecdcddf2d89cfa2a) by [@NickGerleman](https://github.com/NickGerleman))
- Fixed error during native DAG creation when there are multiple AnimatedValue props ([c72c592ecd](https://github.com/facebook/react-native/commit/c72c592ecd9d31ec1661958d4e5f77f8dfb37cac) by [@genkikondo](https://github.com/genkikondo))
- Fix YogaLayoutableShadowNode handling of non-layoutable children ([024a8dc8ff](https://github.com/facebook/react-native/commit/024a8dc8ffd694426912c6abb0852e5d5f6c90c8) by [@NickGerleman](https://github.com/NickGerleman))
- Fix type definition for `unstable_batchedUpdates` ([71157f6ba6](https://github.com/facebook/react-native/commit/71157f6ba604a57b9fa79bc0401b89dc0b01145b) by [@k-yle](https://github.com/k-yle))
- Add missing SectionList types for Animated SectionList ([ed39d639ea](https://github.com/facebook/react-native/commit/ed39d639ea196181732186df735f5e58543ace32) by [@jeongshin](https://github.com/jeongshin))
- Add objectFit to the ImageStyle interface located in the StyleSheetTypes.d.ts file ([32d03c250c](https://github.com/facebook/react-native/commit/32d03c250c52e1d6e87c6eb0e2b87add4b56f031) by [@alvessteve](https://github.com/alvessteve))
- Add src, srcSet, referrerPolicy, tintColor to Image.d.ts declaration file ([74cb6073f3](https://github.com/facebook/react-native/commit/74cb6073f3ae926de712d883d08eb19ed2339788) by [@alvessteve](https://github.com/alvessteve))
- Fix missing `height`, `width`, `crossOrigin` props on Typescript Image.d.ts file ([bcf493f346](https://github.com/facebook/react-native/commit/bcf493f346e320d683ced471750bb8d8e3b1a5ae) by [@alvessteve](https://github.com/alvessteve))
- Fixed typo in the initialNumToRenderOrDefault description's comment ([ba7f9b40a6](https://github.com/facebook/react-native/commit/ba7f9b40a65c0dbf59341ba61adc8ef736d0239e) by [@ellouzeskandercs](https://github.com/ellouzeskandercs))
- Fixed string key calculation in constexpr from Performance C++ native module. ([6faddc3870](https://github.com/facebook/react-native/commit/6faddc3870b9dad0ed6d178492e92b03e8c00a8c))
- Fix computation of relative layout to return empty layout for nodes with display: none and children. ([6018c19991](https://github.com/facebook/react-native/commit/6018c199917403c5f9f5159697dbc61903b9642d) by [@rubennorte](https://github.com/rubennorte))
- Fix edge case when layout animation caused delete and create mutations in the same batch ([d9f2491a71](https://github.com/facebook/react-native/commit/d9f2491a713d872f2f3c8447dbf789fb17b94524))
- Fix edge case when delete is queued with conflict layout animation ([cf9c7d51ef](https://github.com/facebook/react-native/commit/cf9c7d51efd99b65527f9b9d2fef0334b972a461))
- VirtualizedList scrollToEnd with no data ([98009ad94b](https://github.com/facebook/react-native/commit/98009ad94b92320307f2721ee39dbeb9152c0a58) by [@Andarius](https://github.com/Andarius))
- Fixed a typo in interface.js ([7fedd7577a](https://github.com/facebook/react-native/commit/7fedd7577a249b1dd4f51b5b4a03858fd09cb7ef) by [@rj1](https://github.com/rj1))
- Add `borderCurve` and `pointerEvents` to `ViewStyle` ([a0800ffc7a](https://github.com/facebook/react-native/commit/a0800ffc7a676555aa9e769fc8fd6d3162de0ea6) by [@eps1lon](https://github.com/eps1lon))
- Fix whitespace and newline at EOF in template ([efe5f62f91](https://github.com/facebook/react-native/commit/efe5f62f91754ce8101fde24d6a984a5b56186c6) by [@friederbluemle](https://github.com/friederbluemle))
- Jest mocked requestAnimationFrame callbacks now receive a timestamp parameter ([b44fe4deee](https://github.com/facebook/react-native/commit/b44fe4deee505382698a98d2573691303b0159c3) by [@kmagiera](https://github.com/kmagiera))
- Removes duplicate DoubleTypeAnnotation label ([1bab3e24b8](https://github.com/facebook/react-native/commit/1bab3e24b887259e29626835e6bb944d105dff59) by [@mikemikhaylov](https://github.com/mikemikhaylov))
- Filter out Hermes internal bytecode frames (Promise implementation) from error stack traces ([4c911a2dec](https://github.com/facebook/react-native/commit/4c911a2deceb59fc07735205ae3a4622b4334f88) by [@motiz88](https://github.com/motiz88))
- Add missing AccessibilityInfo Types to TS Typings ([76a14454d7](https://github.com/facebook/react-native/commit/76a14454d7f1f2b2ba8f5a79c2f640fafb42de6d) by [@NickGerleman](https://github.com/NickGerleman))
- Fix Errors with TypeScript Tests ([c4862a2322](https://github.com/facebook/react-native/commit/c4862a2322e3401eece360bc6b2ed97c26764121) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing VirtualizedList Imperative Types ([621969b8d8](https://github.com/facebook/react-native/commit/621969b8d85d10f4f9b66be7d5deae58651dc6aa) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing types for AppRegistry ([8d6e2f86f5](https://github.com/facebook/react-native/commit/8d6e2f86f5685264ee5fe7a1f7c24d6d9e40bbaa) by [@NickGerleman](https://github.com/NickGerleman))
- Add type for RootTagContext ([4e5421fd9a](https://github.com/facebook/react-native/commit/4e5421fd9a5eb110e27e40b3ab283f973d38408b) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing types to PushNotificationIOS ([079312895b](https://github.com/facebook/react-native/commit/079312895b3bdc6b934ca51a377cf44419306e8d) by [@NickGerleman](https://github.com/NickGerleman))
- Fix types for deprecated scrollTo fields ([0d091318ed](https://github.com/facebook/react-native/commit/0d091318ed047c9f6cfe32d70b47fd5c4092c923) by [@NickGerleman](https://github.com/NickGerleman))
- Fix Vibration.vibrate() allowing null params ([2c2cb09c00](https://github.com/facebook/react-native/commit/2c2cb09c00b4eac98f59a4fcb874b6fbfdc839ff) by [@NickGerleman](https://github.com/NickGerleman))
- Mark scrollToEnd animated as optional ([e1af6302fc](https://github.com/facebook/react-native/commit/e1af6302fc189948ed0e123a39e0b08cd253fc27) by [@NickGerleman](https://github.com/NickGerleman))
- Fix type for `StyleSheet.compose()` ([1752fdc0f5](https://github.com/facebook/react-native/commit/1752fdc0f573be4348e4e6e7e31bc53b00aa00c6) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing type for AnimatedValue.resetAnimation() and AnimatedValue.animate() ([25a25ea234](https://github.com/facebook/react-native/commit/25a25ea234fc60c7a0b99e9c70253f77a69edc60) by [@NickGerleman](https://github.com/NickGerleman))
- Fixed a backwards compatibility issue with AnimatedInterpolation ([9b280ad1c5](https://github.com/facebook/react-native/commit/9b280ad1c5995f4d5bd5220dee778df3cd65db3f) by [@motiz88](https://github.com/motiz88))
- Explicitly set parser for jsx in ESLint config ([cdb88a2427](https://github.com/facebook/react-native/commit/cdb88a24273262a64f0706169557dc02d8592568) by [@NickGerleman](https://github.com/NickGerleman))
- Move flex gap props to the correct type ([ff984ac9b5](https://github.com/facebook/react-native/commit/ff984ac9b55c9c1af50d5785863f5f36f92b62d2) by [@NickGerleman](https://github.com/NickGerleman))
- Remove constexpr from RectangleEdges.h ([879d303fc7](https://github.com/facebook/react-native/commit/879d303fc7084972d9a04c2aff27ea518b6449c6) by [@TatianaKapos](https://github.com/TatianaKapos))
- Move certain list prop TS types from SectionList, FlatList to VirtualizedList([6c33fd1c48](https://github.com/facebook/react-native/commit/6c33fd1c4889a5d3dfb7f914c2518c3daa8a5337) by [@aliakbarazizi](https://github.com/aliakbarazizi))
- Limit diagnostics width output by `hermesc` ([260bcf7f1b](https://github.com/facebook/react-native/commit/260bcf7f1bf78022872eb2f40f33fb552a414809) by [@tido64](https://github.com/tido64))
- Fix autoComplete type for TextInput ([94356e14ec](https://github.com/facebook/react-native/commit/94356e14ec0562a1fd5a208d93021f102ba9565e) by [@iRoachie](https://github.com/iRoachie))
- Fix performance issues in Hermes when Debug ([60a452b485](https://github.com/facebook/react-native/commit/60a452b4853dc5651c465867344904dd6fc86703))
- Fix hermesc for linux ([32327cc177](https://github.com/facebook/react-native/commit/32327cc17779659bc441580d44784a60a74ede32) by [@cipolleschi](https://github.com/cipolleschi))

#### Android specific

- Read GROUP name in gradle-plugin dependency code ([615d9aefc4](https://github.com/facebook/react-native/commit/615d9aefc4274ed7a193c0410ed7f86e90ad1bff) by [@douglowder](https://github.com/douglowder))
- Fix letters duplication when using autoCapitalize https://github.com/facebook/react-native/issues/29070" ([cbe934bcff](https://github.com/facebook/react-native/commit/cbe934bcff0bdbd26f669fd9ace4fc818ca39e98) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Reset accessibility value when it gets a null value ([aacf28778e](https://github.com/facebook/react-native/commit/aacf28778eadfcae2ca33f66697620f7222d804c))
- Fix check of "reduce motion" setting on android ([790df10fa9](https://github.com/facebook/react-native/commit/790df10fa9bac18a60bd52178cc222f5e368a44b) by [@baranga](https://github.com/baranga))
- Fixed text measurement issue related to hyphenation frequency ([01e7ff5513](https://github.com/facebook/react-native/commit/01e7ff5513e2f5ca6f03bb8ac1b9a1a31612cc9a) by [@javache](https://github.com/javache))
- Fix layout width calculation in onTextLayout ([ccbbcaab9c](https://github.com/facebook/react-native/commit/ccbbcaab9cf3e6148e72f94fe63f77ce5f92416c) by [@reepush](https://github.com/reepush))
- Fix a bug that returns a random number from callback argument `timeRemaining` of `idleCallbacks` registered by `requestIdleCallbacks`. ([d9ab5e81cf](https://github.com/facebook/react-native/commit/d9ab5e81cf6a030438b36e0c27d45f20317c316e) by [@mir597](https://github.com/mir597))
- Fix android emulator detection for packager host ([64ff077a66](https://github.com/facebook/react-native/commit/64ff077a6640f9eaed695287469735cb03478927) by [@deecewan](https://github.com/deecewan))
- Invalid prop values no longer trigger Java exceptions in the legacy renderer ([e328fc2e24](https://github.com/facebook/react-native/commit/e328fc2e2429c7917e33125feafd26ad4699ee00) by [@motiz88](https://github.com/motiz88))
- Fixed crash occurring in certain native views when handling keyboard events. ([f7e35d4ef7](https://github.com/facebook/react-native/commit/f7e35d4ef7d68d06fba1439c0aa6d9ed05b58a7f) by [@aleqsio](https://github.com/aleqsio))
- Fixed ScrollView momentum not stopping when calling scrollTo programmatically ([681b35daab](https://github.com/facebook/react-native/commit/681b35daab2d0443278fe18c364b0e72c8c85673) by [@tomekzaw](https://github.com/tomekzaw))
- Fix memory leak in Android ([bc766ec7f8](https://github.com/facebook/react-native/commit/bc766ec7f8b18ddc0ff72a2fff5783eeeff24857))
- Address New Architecture performance regressions by properly setting NDEBUG ([8486e191a1](https://github.com/facebook/react-native/commit/8486e191a170d9eae4d1d628a7539dc9e3d13ea4) by [@cortinico](https://github.com/cortinico))
- LoadingView of Android to use the Toast till the native implementation is functional ([8ccb861231](https://github.com/facebook/react-native/commit/8ccb861231a7cd620ad3cab8fc52088360082f22))
- Linking.getInitialUrl should not wait for InteractionManager ([3921f05f59](https://github.com/facebook/react-native/commit/3921f05f594691285e79a379897ed698e081a705) by [@javache](https://github.com/javache))
- Using AccessibilityNodeInfo#addAction to announce Expandable/Collapsible State ([082a033fbb](https://github.com/facebook/react-native/commit/082a033fbbe7d7094af78bafc3b2048194a02bd5) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Corrected Nullable annotations for parameters and return values in TurboModules codegen ([6db3995175](https://github.com/facebook/react-native/commit/6db39951755cef82f06e23a5464cf1caf53c7966) by [@javache](https://github.com/javache))
- Fix measurement of uncontrolled TextInput after edit ([8a0fe30591](https://github.com/facebook/react-native/commit/8a0fe30591e21b90a3481c1ef3eeadd4b592f3ed) by [@NickGerleman](https://github.com/NickGerleman))
- Mimimize EditText Spans 9/9: Remove `addSpansForMeasurement()` ([92b8981499](https://github.com/facebook/react-native/commit/92b898149956a301a44f99019f5c7500335c5553) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize EditText Spans 8/N: CustomStyleSpan ([b384bb613b](https://github.com/facebook/react-native/commit/b384bb613bf533aebf3271ba335c61946fcd3303) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize EditText Spans 6/N: letterSpacing ([5791cf1f7b](https://github.com/facebook/react-native/commit/5791cf1f7b43aed1d98cad7bcc272d97ab659111) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 5/N: Strikethrough and Underline ([0869ea29db](https://github.com/facebook/react-native/commit/0869ea29db6a4ca20b9043d592a2233ae1a0e7a2) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 4/N: ReactForegroundColorSpan ([8c9c8ba5ad](https://github.com/facebook/react-native/commit/8c9c8ba5adb59f7f891a5307a0bce7200dd3ac7d) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 3/N: ReactBackgroundColorSpan ([cc0ba57ea4](https://github.com/facebook/react-native/commit/cc0ba57ea42d876155b2fd7d9ee78604ff8aa57a) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 1/N: Fix precedence ([1743dd7ab4](https://github.com/facebook/react-native/commit/1743dd7ab40998c4d3491e3b2c56c531daf5dc47) by [@NickGerleman](https://github.com/NickGerleman))
- Fix the setup to allow the build-from-source on host projects ([fec5658a32](https://github.com/facebook/react-native/commit/fec5658a321a3c0d5da34efaa59fe8d05575f674) by [@cortinico](https://github.com/cortinico))
- Fix a crash new app template when `createRootView` is invoked with null bundle ([990971186f](https://github.com/facebook/react-native/commit/990971186fccf1e14c8715cb35ab82ad8e43f99c) by [@cortinico](https://github.com/cortinico))
- Resolved bug with Text components in New Architecture losing text alignment state. ([31a8e92cad](https://github.com/facebook/react-native/commit/31a8e92caddcdbef9fe74de53e7f412a7e998591) by [@javache](https://github.com/javache))
- Fix border rendering issue when bottom borders has no width ([1d51032278](https://github.com/facebook/react-native/commit/1d5103227851ab92de889d5e7e910393b5d8743a) by [@BeeMargarida](https://github.com/BeeMargarida))
- Fix possible `ConcurrentModificationException` in `UIManagerModuleConstantsHelper::createConstants` ([805b88c7a4](https://github.com/facebook/react-native/commit/805b88c7a41084ec7b82d18807b585e267b69352) by [@j-piasecki](https://github.com/j-piasecki))
- Fixed incorrect logging of `isCatalystInstanceAlive` in exception handler ([daeee2a661](https://github.com/facebook/react-native/commit/daeee2a6619db59391de3b7c6e08db0dbe2331aa) by [@jonnycaley](https://github.com/jonnycaley))
- Make sure the Native RuntimeScheduler is initialized on Old Arch ([133ccdcc67](https://github.com/facebook/react-native/commit/133ccdcc67a7d19ffa5130949893c2792e3ad9fb) by [@cortinico](https://github.com/cortinico))
- RNGP dependency substitutions for fork with different Maven group ([012e4bd654](https://github.com/facebook/react-native/commit/012e4bd654f1eee2b00a066ba50a7f9c44cc305b) by [@douglowder](https://github.com/douglowder))
- Make sure the -DANDROID compilation flag is always included ([3a321ae2bb](https://github.com/facebook/react-native/commit/3a321ae2bb623a8f5c7f064d82ca8ca9df3ebff4) by [@cortinico](https://github.com/cortinico))
- Remove license header from android/app/build.gradle ([5e847c4309](https://github.com/facebook/react-native/commit/5e847c43097dc93ad2c6a5cdf542041b10f00634) by [@cortinico](https://github.com/cortinico))
- Make sure Java Toolchain and source/target level is applied to all projects ([52d2065910](https://github.com/facebook/react-native/commit/52d20659105abe2b065148b33c441941104f4d30) by [@cortinico](https://github.com/cortinico))
- Fix copy / paste menu and simplify controlled text selection on Android ([dfc64d5bcc](https://github.com/facebook/react-native/commit/dfc64d5bcc50c25bab40ba853af9f7b0c1c46d7a) by [@janicduplessis](https://github.com/janicduplessis))
- Fixed random styling for text nodes with many children  ([73f4a788f1](https://github.com/facebook/react-native/commit/73f4a788f18aed2277f6711f689b75ab8ce13b1b) by [@cubuspl42](https://github.com/cubuspl42))
- Fix Android border clip check ([2d15f50912](https://github.com/facebook/react-native/commit/2d15f50912927b5214473b53cce7043fa128d6b3) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Revert "fix: border width top/bottom not matching the border radius" ([0817eaa301](https://github.com/facebook/react-native/commit/0817eaa3012abc0104ffa0d41b844e1c2db1dcc2) by [@gabrieldonadel](https://github.com/gabrieldonadel))

#### iOS specific

- Fix Flipper by moving podfile modification of preprocessor def `FB_SONARKIT_ENABLED` from React-Core to React-RCTAppDelegate where it is now used. ([34d5212f5c](https://github.com/facebook/react-native/commit/34d5212f5ca468ec28a2a82097c0f7cf8722739d))
- Invalid prop values no longer trigger redbox in the legacy renderer ([cb28a2c46e](https://github.com/facebook/react-native/commit/cb28a2c46e1c65fbe71a69ee0b0e0bb4b2e20a35) by [@motiz88](https://github.com/motiz88))
- Fix issue where keyboard does not open when `TextInput` `showSoftInputOnFocus` changes from `false` to `true` ([7425c24cbe](https://github.com/facebook/react-native/commit/7425c24cbe66ec743794b6ffc4cc1a653e821dde) by [@christianwen](https://github.com/christianwen))
- Fix ScrollView `automaticallyAdjustKeyboardInsets` not resetting when Prefer Cross-Fade Transitions is enabled and keyboard hides ([b8f1bb50f7](https://github.com/facebook/react-native/commit/b8f1bb50f7734cbccb19808aae6f86a92fa8eea5) by [@grgmo](https://github.com/grgmo))
- Unrecognized fontFamily values no longer trigger a redbox ([d6e9891577](https://github.com/facebook/react-native/commit/d6e9891577c81503407adaa85db8f5bf97557db0) by [@motiz88](https://github.com/motiz88))
- Do not send extra onChangeText even wnen instantianting multiline TextView ([a804c0f22b](https://github.com/facebook/react-native/commit/a804c0f22b4b11b3d9632dc59a6da14f6c4325e3) by [@dmytrorykun](https://github.com/dmytrorykun))
- Support 120 FPS or more in `RCTFPSGraph` ([987dd6a358](https://github.com/facebook/react-native/commit/987dd6a35842acde9d540fc42dfe4a2f34fd2ddf) by [@mrousavy](https://github.com/mrousavy))
- Fix duplicate [RCTConvert UIUserInterfaceStyle:] ([d8b4737ca6](https://github.com/facebook/react-native/commit/d8b4737ca67591737e277cc43b7e352bd113dc7f) by [@NickGerleman](https://github.com/NickGerleman))
- Blob data is no longer prematurely deallocated when using blob.slice ([36cc71ab36](https://github.com/facebook/react-native/commit/36cc71ab36aac5e5a78f2fbae44583d1df9c3cef) by [@awinograd](https://github.com/awinograd))
- Unbreak cocoapods build ([419025df22](https://github.com/facebook/react-native/commit/419025df226dfad6a2be57c8d5515f103b96917b) by [@javache](https://github.com/javache))
- Don't download hermes nightly tarball if it exists ([d2dd79f3c5](https://github.com/facebook/react-native/commit/d2dd79f3c5bd5684a10d40670e2351e4252020b3) by [@janicduplessis](https://github.com/janicduplessis))
- Fix nullability warnings ([346b028227](https://github.com/facebook/react-native/commit/346b02822710152292eca25a711e9eeca68ab941) by [@tido64](https://github.com/tido64))
- Use NSCAssert() in react_native_assert instead of C assert() ([c5bc3f1373](https://github.com/facebook/react-native/commit/c5bc3f1373d223d4068f762c597bdc45261fb6c5) by [@NickGerleman](https://github.com/NickGerleman))
- Honour background color customisation in RCTAppDelegate ([5d6f21d744](https://github.com/facebook/react-native/commit/5d6f21d744d3a910eb82489404f0fe5dd1020d98) by [@cipolleschi](https://github.com/cipolleschi))
- Turn on NDEBUG when pods are installed for production. ([421df9ffd5](https://github.com/facebook/react-native/commit/421df9ffd58092b1a2dec455a048edb6db1739de) by [@cipolleschi](https://github.com/cipolleschi))
- Fix a crash when reloading JS bundle ([60f381a8b9](https://github.com/facebook/react-native/commit/60f381a8b9094e7dfaf01bea1b745d576cc458f6) by [@sammy-SC](https://github.com/sammy-SC))
- Fix missing node error message not printed correctly when deprecated `find-node-for-xcode.sh` is used. ([0d82b402aa](https://github.com/facebook/react-native/commit/0d82b402aa546aa773e91921989fb8389aee81dc) by [@uloco](https://github.com/uloco))
- Build codegen package while using old architecture ([90327d9fba](https://github.com/facebook/react-native/commit/90327d9fba9417577a14f293103ec84dbba5300a) by [@Saadnajmi](https://github.com/Saadnajmi))
- Fix cocoapods warning about merging user_target_xcconfig ([2bfb53c2fb](https://github.com/facebook/react-native/commit/2bfb53c2fba366d3476892f2384265aac212fbeb) by [@yhkaplan](https://github.com/yhkaplan))
- `-[RCTUITextField textView:shouldChangeTextInRange:replacementString:]` no longer crashes when we pass in a `nil` replacement string ([d5e6d9cecd](https://github.com/facebook/react-native/commit/d5e6d9cecd1a8b02d47c4dfaffc550167b093b32) by [@Saadnajmi](https://github.com/Saadnajmi))
- Remove UIKit import from RCTDevLoadingView.h ([e7dcad2ba1](https://github.com/facebook/react-native/commit/e7dcad2ba14d8188cce0ff976187fe045ee7f9a4) by [@christophpurrer](https://github.com/christophpurrer))
- Pod install with --project-directory ([efd39eea6f](https://github.com/facebook/react-native/commit/efd39eea6f553638b2430cbf0c3eed519995a940) by [@dcangulo](https://github.com/dcangulo))
- Fixed Mac Catalyst availability checks ([70d9b56d71](https://github.com/facebook/react-native/commit/70d9b56d717a13450d3e18ccb62bcfcb71cf4008) by [@Saadnajmi](https://github.com/Saadnajmi))
- Fix path issue to properly run the codegen cleanup step ([e71b094b24](https://github.com/facebook/react-native/commit/e71b094b24ea5f135308b1e66c86216d9d693403) by [@cipolleschi](https://github.com/cipolleschi))
- Make sure to add the New Arch flag to libraries ([ef11e15ca3](https://github.com/facebook/react-native/commit/ef11e15ca357be56afcf36969979442a235f7aa9) by [@cipolleschi](https://github.com/cipolleschi))
- Fix dataContentType may be [NSNull null] issue ([c0834b884b](https://github.com/facebook/react-native/commit/c0834b884bcaf2fd97a47bcb0320369b0b4469d2) by [@malacca](https://github.com/malacca))
- Properly support static libraries and static frameworks ([be895c870c](https://github.com/facebook/react-native/commit/be895c870c897705e65513574c459e85c38d5f7d))
- Use the right logic to decide when we have to build from source ([67d02640ba](https://github.com/facebook/react-native/commit/67d02640ba2465e4533ac050cb5baa9b34f58f0b))
- Fix application of _progressViewOffset in RCTRefreshControl to not occur by default (when value is unset) ([0062b10b56](https://github.com/facebook/react-native/commit/0062b10b56985c4556011fbbb8d43f0a038d359e) by [@objectivecosta](https://github.com/objectivecosta))
- Unexpected useEffects flushing semantics ([7211ef1962](https://github.com/facebook/react-native/commit/7211ef19624304b6a4d5219a8e0a2c67651b8b33) by [@sammy-SC](https://github.com/sammy-SC))
- Add support for building with Xcode 15 ([8ed2cfded5](https://github.com/facebook/react-native/commit/8ed2cfded51d47731686c1060915bee7dd63647e) by [@AlexanderEggers](https://github.com/AlexanderEggers))

### Security

- Update and Fixed Prototype Pollution in JSON5 via Parse Method ([4ac4a5c27d](https://github.com/facebook/react-native/commit/4ac4a5c27dc5705a42ed7f607e2333d363c0a6c5) by [@imhunterand](https://github.com/imhunterand))

#### iOS specific

- Enable Address and Undefined Behavior Sanitizers on RNTester ([65e61f3c88](https://github.com/facebook/react-native/commit/65e61f3c88388d4a2ed88bcc9a2cb5ba63fd8afa) by [@Saadnajmi](https://github.com/Saadnajmi))

## v0.71.14

### Fixed

#### iOS specific

- Set the max version of Active support to 7.0.8 ([ce39931bc2](https://github.com/facebook/react-native/commit/ce39931bc2b02f13cbc5751ba4d4a6dbc07bc91a) by [@cipolleschi](https://github.com/cipolleschi))
- Xcode 15 patch ([287482e57f](https://github.com/facebook/react-native/commit/287482e57ffd221227e6fffb6852113d330260a1) by [@fortmarek](https://github.com/fortmarek))

## v0.71.13

### Added

#### Android specific

- For targeting SDK 34 - Added RECEIVER_EXPORTED/RECEIVER_NOT_EXPORTED flag support in DevSupportManagerBase ([177d97d8ea](https://github.com/facebook/react-native/commit/177d97d8ea962bdd4dad8fcf0efb04a307f25000) by [@apuruni](https://github.com/apuruni))

#### iOS specific

- Added support to inline the source map via RCTBundleURLProvider
 ([f7219ec02d](https://github.com/facebook/react-native/commit/f7219ec02d71d2f0f6c71af4d5c3d4850a898fd8) by [@Saadnajmi](https://github.com/Saadnajmi))

### Fixed

- Fix: mount devtools overlay only if react devtools are connected ([b3c7a5d4cc](https://github.com/facebook/react-native/commit/b3c7a5d4cc12be0fd9ec561daca35edabb896201) by [@hoxyq](https://github.com/hoxyq))

#### iOS specific

- Fix onChangeText not firing when clearing the value of TextInput with multiline=true on iOS ([0c9c57a9f7](https://github.com/facebook/react-native/commit/0c9c57a9f73294414d92428c5d2472dc1e1e5e96) by [@kkoudev](https://github.com/kkoudev))

## v0.71.12

### Fixed

- Prevent LogBox from crashing on very long messages ([cd56347dca](https://github.com/facebook/react-native/commit/cd56347dca4e948f5038643bcd804c41f037727a) by [@motiz88](https://github.com/motiz88))

#### Android specific

- Added CSS logical properties by mapping layout props ([2b06a75631](https://github.com/facebook/react-native/commit/2b06a75631c6d9f1fdc13bc8a5567f264d2c9b9a) by [@NickGerleman](https://github.com/NickGerleman) and [@AlexanderEggers](https://github.com/AlexanderEggers)) to fix view flattening on Android.

#### iOS specific

- fix `pod install --project-directory=ios` failing ([fc1abe1d69](https://github.com/facebook/react-native/commit/fc1abe1d69530e95bc39b439d7d883f620b86fb9) by [@tido64](https://github.com/tido64))

## v0.71.11

### Changed

- Bump CLI to 10.2.4 and Metro to 0.73.10 ([69804c70cb](https://github.com/facebook/react-native/commit/69804c70cb5c1afba934e55d7c4d694450c918f0) by [@kelset](https://github.com/kelset))

#### iOS specific

- Prefer `Content-Location` header in bundle response as JS source URL ([671ea383fe](https://github.com/facebook/react-native/commit/671ea383fe45dd9834a0c0481360de050df7f0c9) by [@robhogan](https://github.com/robhogan))

### Fixed

#### Android specific

- Fixed crash occurring in certain native views when handling keyboard events. ([f7e35d4ef7](https://github.com/facebook/react-native/commit/f7e35d4ef7d68d06fba1439c0aa6d9ed05b58a7f) by [@aleqsio](https://github.com/aleqsio))
- Prevent crash on OnePlus/Oppo devices in runAnimationStep ([f2c05142](https://github.com/facebook/react-native/commit/f2c05142259563b892e593b5a018bdbb6a0cf177) by [@hsource](https://github.com/hsource))
- Revert "fix: border width top/bottom not matching the border radius" to fix border styling issues ([fd8a19d](https://github.com/facebook/react-native/commit/fd8a19d5e2bc00f29b3cd992d24790084cc34cbd) by [@kelset](https://github.com/kelset))

#### iOS specific

- Make 0.71 compatible with Xcode 15 (thanks to @AlexanderEggers for the commit in main) ([5bd1a4256e](https://github.com/facebook/react-native/commit/5bd1a4256e0f55bada2b3c277e1dc8aba67a57ce) by [@kelset](https://github.com/kelset))

## v0.71.10

### Fixed

#### Android specific

- Bump RNGP to 0.71.19 ([3be3a7d1a2](https://github.com/facebook/react-native/commit/3be3a7d1a2840a045892ddd8e5f2263028e15127) by [@kelset](https://github.com/kelset))
  - contains: RNGP dependency substitutions for fork with different Maven group ([012e4bd654](https://github.com/facebook/react-native/commit/012e4bd654f1eee2b00a066ba50a7f9c44cc305b) by [@douglowder](https://github.com/douglowder))

## v0.71.9

### Fixed

- VirtualizedList scrollToEnd with no data ([98009ad94b](https://github.com/facebook/react-native/commit/98009ad94b92320307f2721ee39dbeb9152c0a58) by [@Andarius](https://github.com/Andarius))
- Allow string `transform` style in TypeScript ([2558c3d4f5](https://github.com/facebook/react-native/commit/2558c3d4f56776699602b116aff8c22b8bfa176a) by [@NickGerleman](https://github.com/NickGerleman))
- Fix autoComplete type for TextInput ([94356e14ec](https://github.com/facebook/react-native/commit/94356e14ec0562a1fd5a208d93021f102ba9565e) by [@iRoachie](https://github.com/iRoachie))

## v0.71.8

### Fixed

#### Android specific

- Read GROUP name in gradle-plugin dependency code ([615d9aefc4](https://github.com/facebook/react-native/commit/615d9aefc4274ed7a193c0410ed7f86e90ad1bff) by [@douglowder](https://github.com/douglowder))
- Bump RNGP to 0.71.18 ([4bf4c470fe](https://github.com/facebook/react-native/commit/4bf4c470fe4996af02f45c9a9d77c6a790a95362) by [@kelset](https://github.com/kelset))

#### iOS specific

- Do not send extra onChangeText even wnen instantianting multiline TextView ([a804c0f22b](https://github.com/facebook/react-native/commit/a804c0f22b4b11b3d9632dc59a6da14f6c4325e3) by [@dmytrorykun](https://github.com/dmytrorykun))

## v0.71.7

### Fixed

#### iOS specific

- Address Hermes performance regression ([9be2959](https://github.com/facebook/react-native/commit/9be29593c8bac64178d441e46c6f7b31e591360e) by [@dmytrorykun](https://github.com/dmytrorykun))

#### Android specific

- Resolved bug with Text components in new arch losing text alignment state. ([31a8e92cad](https://github.com/facebook/react-native/commit/31a8e92caddcdbef9fe74de53e7f412a7e998591) by [@javache](https://github.com/javache))
- Mimimize EditText Spans 9/9: Remove `addSpansForMeasurement()` ([92b8981499](https://github.com/facebook/react-native/commit/92b898149956a301a44f99019f5c7500335c5553) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize EditText Spans 8/N: CustomStyleSpan ([b384bb613b](https://github.com/facebook/react-native/commit/b384bb613bf533aebf3271ba335c61946fcd3303) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize EditText Spans 6/N: letterSpacing ([5791cf1f7b](https://github.com/facebook/react-native/commit/5791cf1f7b43aed1d98cad7bcc272d97ab659111) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 5/N: Strikethrough and Underline ([0869ea29db](https://github.com/facebook/react-native/commit/0869ea29db6a4ca20b9043d592a2233ae1a0e7a2) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 4/N: ReactForegroundColorSpan ([8c9c8ba5ad](https://github.com/facebook/react-native/commit/8c9c8ba5adb59f7f891a5307a0bce7200dd3ac7d) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 3/N: ReactBackgroundColorSpan ([cc0ba57ea4](https://github.com/facebook/react-native/commit/cc0ba57ea42d876155b2fd7d9ee78604ff8aa57a) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 1/N: Fix precedence ([1743dd7ab4](https://github.com/facebook/react-native/commit/1743dd7ab40998c4d3491e3b2c56c531daf5dc47) by [@NickGerleman](https://github.com/NickGerleman))
- Fix measurement of uncontrolled TextInput after edit ([8a0fe30591](https://github.com/facebook/react-native/commit/8a0fe30591e21b90a3481c1ef3eeadd4b592f3ed) by [@NickGerleman](https://github.com/NickGerleman))

## v0.71.6

### Fixed

#### iOS specific

- Fix React Codegen podspec to build on Xcode 14.3 ([0010c3807d](https://github.com/facebook/react-native/commit/0010c3807d7e47d7d518667dbfac62f7c0da1ac1) by [@kelset](https://github.com/kelset))

## v0.71.5

### Changed

- Bump CLI to 10.2.2 and Metro to 0.73.9 ([4c3bc24893](https://github.com/facebook/react-native/commit/4c3bc24893b2dc7495a2e65ee8f1c6408cc31ad5) by [@kelset](https://github.com/kelset)), contains:
  - CLI fix: correctly list ios devices and simulators ([relevant PR](https://github.com/react-native-community/cli/pull/1863))
  - Metro fix: fix watching contents of new directories in NodeWatcher ([ab86982](https://github.com/facebook/metro/commit/ab86982fad83da457d949f01a301c589fabcb12e) by [@robhogan](https://github.com/robhogan))

#### Android specific

- Bump RNGP to 0.71.17 ([bf490d379f](https://github.com/facebook/react-native/commit/bf490d379f8727aa18ded97f0f86465a00e3bef0) by [@kelset](https://github.com/kelset)), contains:
  - Fix patch for codegen for 0.71 ([ec3681143e](https://github.com/facebook/react-native/commit/ec3681143e041a19cdee36d9f1ce63d7d0663091) by [@kelset](https://github.com/kelset))

#### iOS specific

- Remove ruby-version from 0.71 ([1d22e29146](https://github.com/facebook/react-native/commit/1d22e291462ac452f2bb6b1b6af11986944ec54a) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

#### Android specific

- Fix race condition in ReadableNativeMap ([9aac13d](https://github.com/facebook/react-native/commit/9aac13d4dc95925b57f03e7964fc7add6834e518) by [@rshest](https://github.com/rshest))

#### iOS specific

- Give precedence to `textContentType` property for backwards compat as mentioned in https://github.com/facebook/react-native/issues/36229#issuecomment-1470468374 ([c0abff11b6](https://github.com/facebook/react-native/commit/c0abff11b66d9ec3a8e1d09333a3fb6c05678bed) by [@lunaleaps](https://github.com/lunaleaps))
- Blob data is no longer prematurely deallocated when using blob.slice ([36cc71ab36](https://github.com/facebook/react-native/commit/36cc71ab36aac5e5a78f2fbae44583d1df9c3cef) by [@awinograd](https://github.com/awinograd))

## v0.71.4

### Changed

- Make FlatList permissive of ArrayLike data ([c03de97fb4](https://github.com/facebook/react-native/commit/c03de97fb44f0aecbec8f930bd99fe26f37f9648) by [@NickGerleman](https://github.com/NickGerleman))
- Bumping RNGP to `^0.71.16` ([3df4a79c3d](https://github.com/facebook/react-native/commit/3df4a79c3d8e788ffb113fde801836251eed4c03) by [@kelset](https://github.com/kelset))
- Update CLI to 10.2.0, Metro to 0.73.8 ([20a6fbd373](https://github.com/facebook/react-native/commit/20a6fbd37312ff4e6bb11f6f43b9abc2f559e1fb) by [@robhogan](https://github.com/robhogan)) - contains:
  - fix: Source maps may have invalid entries when using Terser minification. ((`metro/#928`)[https://github.com/facebook/metro/pull/928])
  - fix: Mitigate potential source map mismatches with concurrent transformations due to terser#1341. ((`metro/#929`)[https://github.com/facebook/metro/pull/929])
- Bump Hermes Version ([291cc0af10](https://github.com/facebook/react-native/commit/291cc0af100fe2aa6201f04ebd6c8c889a018d45)) - contains:
  - use ConsecutiveStringStorage to dedup serialized literals ([62d58e](https://github.com/facebook/hermes/commit/62d58e5d6747da8b8ee9e18eb8d0f57469acf201))
  - Remove register stack size override in hermes.cpp ([6146eb](https://github.com/facebook/hermes/commit/6146eb39e9eb8e712169697eac75001c2aeab40d))
  - fix: specify currency in locale identifier when formatting currency plural ([21f15c](https://github.com/facebook/hermes/commit/21f15c537a49a39bdf1b5440cde0b7312497431d))
  - Increase default max stack size ([ee2588](https://github.com/facebook/hermes/commit/ee25883ea34374f687883a641c8101ac0d292fc6))
  - Refactor HBC test helper ([31fdcf](https://github.com/facebook/hermes/commit/31fdcf738940875c9bacf251e149006cf515d763))

#### Android specific

- Expose `rrc_root` via prefab. ([3418f65d88](https://github.com/facebook/react-native/commit/3418f65d88fa8be3473f757e932ecba1bbfce783) by [@tomekzaw](https://github.com/tomekzaw))

### Fixed

- Fix touchable hitSlop type ([23607aea68](https://github.com/facebook/react-native/commit/23607aea688c950fe0cf424b280a2339636130fe) by [@bigcupcoffee](https://github.com/bigcupcoffee))
- Fix TouchableOpacity componentDidUpdate causing an excessive number of pending callbacks ([8b1f6e09c1](https://github.com/facebook/react-native/commit/8b1f6e09c1b11e07096156d8d01aaff649745fbc) by [@gabrieldonadel](https://github.com/gabrieldonadel))

#### Android specific

- ENTRY_FILE should resolve relative paths from root ([6dde1dc7cb](https://github.com/facebook/react-native/commit/6dde1dc7cb487271567aaa9c7e093bb76c0689ad) by [@cortinico](https://github.com/cortinico))
- Better Monorepo support for New Architecture ([0487108461](https://github.com/facebook/react-native/commit/0487108461010154cf959bb0bf6ba9e82fdcc4d1) by [@cortinico](https://github.com/cortinico))

## v0.71.3

### Changed

- Bump package versions ([4b84888a90](https://github.com/facebook/react-native/commit/4b84888a90c9436a8a62cc8507176f1b946b9b93) by [@cipolleschi](https://github.com/cipolleschi)), ([60f0a71060](https://github.com/facebook/react-native/commit/60f0a71060078759b526f65926763274811977f9) by [@cipolleschi](https://github.com/cipolleschi)), ([a3f205a27b](https://github.com/facebook/react-native/commit/a3f205a27b75d4e76354dbcb3203653e1f93f3ee) by [@cipolleschi](https://github.com/cipolleschi)):
  - `react-native-codegen` to `0.71.5`
  - `react-native-gradle-plugin` to `0.71.15`

### Fixed

- (codegen) Add missing C++ include for prop conversion of complex array type ([92fc32aa](https://github.com/facebook/react-native/commit/92fc32aa053ac8401ad8c9f55dcfa1e48ae8fc1d) by [@rshest](https://github.com/rshest))

#### Android specific

- Fixed jscexecutor crash on Android which is caused from NDK incompatibility ([a232decbb1](https://github.com/facebook/react-native/commit/a232decbb1252ade0247a352f887ca4d97ee273c) by [@Kudo](https://github.com/Kudo))
- Used relative paths for gradle commands ([bb02ccf13f](https://github.com/facebook/react-native/commit/bb02ccf13f76f46b8572e2a85d578fd8d4fd9467) by [@shivenmian](https://github.com/shivenmian))

#### iOS specific

- fix `pod install --project-directory=...` ([ad1ddc241a](https://github.com/facebook/react-native/commit/ad1ddc241af723a3f5da2058709f9684e51fb5ce) by [@tido64](https://github.com/tido64))

## v0.71.2

### Added

- Added AlertOptions argument to the type definition for Alert.prompt to bring it into parity with the js code. ([305ca337c0](https://github.com/facebook/react-native/commit/305ca337c0471c61cb74216bd93ae3f1a232a89f) by [@paulmand3l](https://github.com/paulmand3l))
- Added missing `accessibilityLabelledBy` TypeScript type ([e162b07982](https://github.com/facebook/react-native/commit/e162b07982cf9481038de71f5dd7bd9b45387f0a) by [@DimitarNestorov](https://github.com/DimitarNestorov))
- Added missing `accessibilityLanguage` TypeScript type ([71c4f57baf](https://github.com/facebook/react-native/commit/71c4f57baf6683ea4304e15c040d6b6c3b3d2b73) by [@DimitarNestorov](https://github.com/DimitarNestorov))

### Changed

- Bump `react-native-gradle-plugin` to `^0.71.14` in core, `@react-native-community/eslint-config` to `^3.2.0` in starting template ([785bc8d97b](https://github.com/facebook/react-native/commit/785bc8d97b824a2af86ffe46f321471f4952764c) by [@kelset](https://github.com/kelset))

### Fixed

- Add `TextInput`'s `inputMode` TypeScript types ([fac7859863](https://github.com/facebook/react-native/commit/fac7859863c7130740aacc95d0e62417bd8f789e) by [@eps1lon](https://github.com/eps1lon))
- Fix crash by conditional value of aspectRatio style value ([a8166bd75b](https://github.com/facebook/react-native/commit/a8166bd75b221f967a859d5cc25b3394c4d35301) by [@mym0404](https://github.com/mym0404))
- Fix TurboModuleRegistry TS type ([c289442848](https://github.com/facebook/react-native/commit/c28944284894a3188b97e3d8bb5b489755852160) by [@janicduplessis](https://github.com/janicduplessis))
- Fix invariant violation when nesting VirtualizedList inside ListEmptyComponent ([1fef376812](https://github.com/facebook/react-native/commit/1fef37681298c828a07febcd0d975a32f6bc4403) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- [RNGP] Properly set the `jsRootDir` default value ([c0004092f9](https://github.com/facebook/react-native/commit/c0004092f935ad892d4a1acf38fb184f1140bfd2) by [@cortinico](https://github.com/cortinico))
- Do not use WindowInsetsCompat for Keyboard Events ([32f54877ff](https://github.com/facebook/react-native/commit/32f54877ff788240d24528d208c704ee78e4e761) by [@NickGerleman](https://github.com/NickGerleman))
- Mitigation for Samsung TextInput Hangs ([4650ef3](https://github.com/facebook/react-native/commit/4650ef36e3d63df6e6a31f00fcf323c53daff2d6) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- Add Back dynamic framework support for the Old Architecture with Hermes ([b3040ec624](https://github.com/facebook/react-native/commit/b3040ec6244da6ea274654abfd84516de4f5bf52) by [@cipolleschi](https://github.com/cipolleschi))
- Add Back dynamic framework support for the old architecture ([da270d038c](https://github.com/facebook/react-native/commit/da270d038c271d6b82de568621b49e38739372c6) by [@cipolleschi](https://github.com/cipolleschi))

## v0.71.1

### Added

#### Android specific

- Add `jsinspector` to the prefab target ([a80cf96fc8](https://github.com/facebook/react-native/commit/a80cf96fc8821dcc07987c9b91dff0c839c8769c) by [@Kudo](https://github.com/Kudo))

#### iOS specific

- Add `initialProps` property to `RCTAppDelegate` ([b314e6f147](https://github.com/facebook/react-native/commit/b314e6f147fdfcd71e7ba3b17338bb44356df98e) by [@jblarriviere](https://github.com/jblarriviere))

### Changed

- Bump CLI to 10.1.3 ([b868970037](https://github.com/facebook/react-native/commit/b868970037f7fb510b23ac65d378ff1ba28e9af6) by [@kelset](https://github.com/kelset))
- Bump RNGP to 0.71.13 ([416463c406](https://github.com/facebook/react-native/commit/416463c4068a3cdb5ed1e01f7e17f22d68c1b9ed) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

- Fix(cli,metro,babel): bump cli and metro and babel to fix Windows+Metro issue ([df7c92ff4c](https://github.com/facebook/react-native/commit/df7c92ff4c095f5f6b3424de7287f5cb124d91d3) by [@kelset](https://github.com/kelset))

#### Android specific

- Fix ReactRootView crash when root view window insets are null ([4cdc2c48e8](https://github.com/facebook/react-native/commit/4cdc2c48e826f5bb762085fc38954ed09df6ef12) by [@enahum](https://github.com/enahum))
- Fix for resources not correctly bundlded on release appbundles ([60b9d8c2b9](https://github.com/facebook/react-native/commit/60b9d8c2b9800135fdace5f58d94bebde2849510) by [@cortinico](https://github.com/cortinico))
- RNGP - Honor the --active-arch-only when configuring the NDK ([470f79b617](https://github.com/facebook/react-native/commit/470f79b61734e085978b03507eda6ed026936b7b) by [@cortinico](https://github.com/cortinico))
- Fixed typo in template build.gradle ([38e35df47c](https://github.com/facebook/react-native/commit/38e35df47c59e425fdac34d1f91540b8b8ca2908) by [@Titozzz](https://github.com/Titozzz))


#### iOS specific

- Exclude `react-native-flipper` when `NO_FLIPPER=1` to prevent iOS build fail ([f47b5b8b5d](https://github.com/facebook/react-native/commit/f47b5b8b5def41aeb6d5b672928cc57e20fba49d) by [@retyui](https://github.com/retyui))
- Fix RCTAlertController not showing when using SceneDelegate on iOS 13.0+. ([0c53420a7a](https://github.com/facebook/react-native/commit/0c53420a7af306d629350e1244e8e2ccae08a312))
- Handle Null Exception to Validate input in RCTAlertController and in RCTDevLoadingView ([79e603c5ab](https://github.com/facebook/react-native/commit/79e603c5ab5972859153a6ece80cd91ff0a04fc5) by [@admirsaheta](https://github.com/admirsaheta))
- Fixed the potential race condition when dismissing and presentating modal ([e948c79bda](https://github.com/facebook/react-native/commit/e948c79bda7f000427d56dac6fe5c70555db5701) by [@wood1986](https://github.com/wood1986))
- Fix build errors when inheriting RCTAppDelegate in Swift modules ([5eb25d2186](https://github.com/facebook/react-native/commit/5eb25d2186fd94128ec2ae74fec02429da969e63) by [@Kudo](https://github.com/Kudo))
- OnSelectionChange() is fired before onChange() on multiline TextInput ([64475aeb3b](https://github.com/facebook/react-native/commit/64475aeb3b1b0e37bdad2c2d5abb2116b2141c06) by [@s77rt](https://github.com/s77rt))
- Build: remove deprecated File.exists() method from Hermes podspec. ([38e5fa6a96](https://github.com/facebook/react-native/commit/38e5fa6a9604ab42fef442e7a51ebfe185df90bb) by [@kelset](https://github.com/kelset))

## v0.71.0

Read the [announcement blogpost here](https://reactnative.dev/blog/2023/01/12/version-071).

⚠️ *Git Bash users on Windows might experience "Unable to resolve" red boxes, because of an issue with Metro (silently fails without discovering any files). It will be fixed in 0.71.1 next week, in the meantime you can set `resolver.useWatchman: false` in `metro.config.js`.*

### Breaking Changes

- **Changes to Console Logging:** `LogBox.ignoreLog` no longer filters console logs. This means you will start seeing logs in the console that you have silenced in LogBox. See [this comment](https://github.com/facebook/react-native/pull/34476#issuecomment-1240667794) for more details.
- **Removed AsyncStorage and MaskedViewIOS**: These components have been deprecated since version [0.59](https://github.com/facebook/react-native/blob/main/CHANGELOG.md#deprecated-8), so it’s time we remove them entirely. For alternatives, please check [React Native Directory](https://reactnative.directory/) for community packages that cover those use cases.
- **JSCRuntime moved to react-jsc:** react-jsi is now split into react-jsc and react-jsi. If you use JSCRuntime, you will need to add react-jsc as a dependency ([facebook/react-native@6b129d8](https://github.com/facebook/react-native/commit/6b129d81ed8cab301775d2a04971e255df9290de)).

### Added

- Add flex yoga bindings of `gap`, `column-gap` and `row-gap` ([9f3a3e13cc](https://github.com/facebook/react-native/commit/9f3a3e13cc7e083dc0151b6037fc483dbfeaeabc) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- Add back deprecated PropTypes ([b966d29724](https://github.com/facebook/react-native/commit/b966d297245a4c1e2c744cfe571396cfa7e5ffd3) by [@rickhanlonii](https://github.com/rickhanlonii))
- Make the `prepare_package_for_release` fail if there is already a git tag with that version ([850f855eb6](https://github.com/facebook/react-native/commit/850f855eb67edfbf777b4bf89f8b6e8e884b853e) by [@cipolleschi](https://github.com/cipolleschi))
- Add a C++ only TurboModule example (for Android/iOS/macOS/Windows) ([d07575b1c6](https://github.com/facebook/react-native/commit/d07575b1c63c214f74fd72b329892c7cfde5df69) by [@christophpurrer](https://github.com/christophpurrer))
- Enable platform-specific Codegen Specs ([ab7b4d4cd8](https://github.com/facebook/react-native/commit/ab7b4d4cd89cf6a7cb76d2b6a60163919cc3c689) by [@cipolleschi](https://github.com/cipolleschi))
- Add "option" to available role values ([e3e635ef84](https://github.com/facebook/react-native/commit/e3e635ef84156a5283d378858f7c8deb44464fea) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added support `Promise.any` ([475310dbba](https://github.com/facebook/react-native/commit/475310dbbaec8048411edefc6cdddab330df7966) by [@retyui](https://github.com/retyui))
- Log Abnormal Closes to Metro Websocket ([3982a2c6bd](https://github.com/facebook/react-native/commit/3982a2c6bd116a6dcc6ee6889e4a246b710b70a7) by [@NickGerleman](https://github.com/NickGerleman))
- `BlobModule` to `RCTCoreModulesClassProvider` ([279cfec55f](https://github.com/facebook/react-native/commit/279cfec55fdf404fdb9198edbb37d3adfdfb3bf1) by [@andrestone](https://github.com/andrestone))
- Added `mixed` value for `aria-checked`. ([7a19af7fb6](https://github.com/facebook/react-native/commit/7a19af7fb6b3b62fbbd632c6569a4270c604fb86) by [@ankit-tailor](https://github.com/ankit-tailor))
- Concurrent rendering safe implementation of ScrollViewStickyHeader ([925e81ab86](https://github.com/facebook/react-native/commit/925e81ab86c9807b66d405d914e857b978b194fd) by [@sammy-SC](https://github.com/sammy-SC))
- Add DevToolsSettingsManager ([0fac9817df](https://github.com/facebook/react-native/commit/0fac9817df403e31d8256befe52409c948614706) by [@rbalicki2](https://github.com/rbalicki2))
- Add enum example to Android/iOS rn-tester TurboModule ([02e4fcd825](https://github.com/facebook/react-native/commit/02e4fcd825fecc78ce2c93a1e3a9ba2b232c573b) by [@christophpurrer](https://github.com/christophpurrer))
- React-native-codegen: add Enum Type support for iOS/Android TurboModules ([745f3ee8c5](https://github.com/facebook/react-native/commit/745f3ee8c571560406629bc7af3cf4914ef1b211) by [@christophpurrer](https://github.com/christophpurrer))
- Parser interface to divide parser logic. ([5940d25cc1](https://github.com/facebook/react-native/commit/5940d25cc184241ed77aca85c62f4ee071210d9b) by [@cipolleschi](https://github.com/cipolleschi))
- Add role prop to Text component ([20718e6b8c](https://github.com/facebook/react-native/commit/20718e6b8ce4f5c3a8393067d5e8eb0da910751c) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Introduce `useAnimatedValue` hook to make it easier working with `Animated.Value`s in function components. ([e22217fe8b](https://github.com/facebook/react-native/commit/e22217fe8b9455e32695f88ca835e11442b0a937) by [@fabriziocucci](https://github.com/fabriziocucci))
- Highlight elements on hover while mouse down for React DevTools element inspection. ([94429fb037](https://github.com/facebook/react-native/commit/94429fb037322652b6796ac2c40cef451795205e))
- Implement method bindings for gap/row-gap/column-gap ([803a2978e5](https://github.com/facebook/react-native/commit/803a2978e5c0a33c6bb57b402a67218571382fbb) by [@NickGerleman](https://github.com/NickGerleman))
- Implement gap/row-gap/column-gap (within the C ABI) ([1373a7057b](https://github.com/facebook/react-native/commit/1373a7057b9d66830868832a9684ad80ae5d9d45) by [@NickGerleman](https://github.com/NickGerleman) and [@jacobp100](https://github.com/jacobp100))
- Add destructuredArrayIgnorePattern to eslint config ([0c5ef573fe](https://github.com/facebook/react-native/commit/0c5ef573fed31698ff8906675ddfc12a35829723) by [@fwcd](https://github.com/fwcd))
- Add aria-modal prop to basic component ([f353119113](https://github.com/facebook/react-native/commit/f353119113d6fc85491765ba1e90ac83cb00fd61) by [@dakshbhardwaj](https://github.com/dakshbhardwaj))
- Add support for ImageSource and ImageRequest in the State. ([d7c41361dd](https://github.com/facebook/react-native/commit/d7c41361dd87930044473434aba6e63b63811bdb) by [@cipolleschi](https://github.com/cipolleschi))
- Generate custom Native State ([7490ad4a21](https://github.com/facebook/react-native/commit/7490ad4a213aa75bfff205b57733cc71c79ca62c) by [@cipolleschi](https://github.com/cipolleschi))
- Add support for platform-specific specs ([7680bdeb4f](https://github.com/facebook/react-native/commit/7680bdeb4f96a8092393372a59c77a9d7b729cae) by [@cipolleschi](https://github.com/cipolleschi))
- Added suppression for warnings about unused parameters in 'publish<Type E>()' func ([c1363984f1](https://github.com/facebook/react-native/commit/c1363984f1a418cb1be59d927895a69be7b9ed1e) by [@inobelar](https://github.com/inobelar))
- Export YGInteropSetLogger method ([d9a5c66baa](https://github.com/facebook/react-native/commit/d9a5c66baac824923f373d52017067738654277a) by [@KimDaeWook](https://github.com/KimDaeWook))
- Add instructions about how to add tests in the OSS ([75b688fba8](https://github.com/facebook/react-native/commit/75b688fba8335598c19b9333459b6939dcf0a32c) by [@cipolleschi](https://github.com/cipolleschi))
- Add YGGutter Enum ([87e7912b95](https://github.com/facebook/react-native/commit/87e7912b9580ea8c9229cd77c36cb1d653972722) by [@NickGerleman](https://github.com/NickGerleman))
- Add string support for aspectRatio ([14c91cdf59](https://github.com/facebook/react-native/commit/14c91cdf59949959dd2e39af4fed5bee01c3cba1) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add alt prop to Image component ([71fda5e0c2](https://github.com/facebook/react-native/commit/71fda5e0c2093380d08761c945f1e3029af6697f) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Include `this.state.bottom` when calculating new keyboard height to fix android keyboard switching ([f85e2ecc40](https://github.com/facebook/react-native/commit/f85e2ecc4079a99b59f706254c5671f186b9c6f6) by [@pfulop](https://github.com/pfulop))
- Implement custom Native State parsing in TypeScript ([bbb2fb212d](https://github.com/facebook/react-native/commit/bbb2fb212d112b9b96b9b47df5bc22074f24f7da) by [@cipolleschi](https://github.com/cipolleschi))
- Implement custom Native State parsing in Flow ([925b15351f](https://github.com/facebook/react-native/commit/925b15351f4a1c8a4e305b36fe7ab56e68a657bb) by [@cipolleschi](https://github.com/cipolleschi))
- Add string support to the transform property ([34db2d4e93](https://github.com/facebook/react-native/commit/34db2d4e939cab4c37e5a8e6ec95800cce227c98) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add `types` folder to house TypeScript types. ([6b2a511cbb](https://github.com/facebook/react-native/commit/6b2a511cbb1f244133624e37e7b3215d8fed33af))
- Add additional Systrace support ([9cb716ff76](https://github.com/facebook/react-native/commit/9cb716ff76e45583999b040be8a99b00f0e022e1) by [@christophpurrer](https://github.com/christophpurrer))
- Add space-separated string support for fontVariant ([09d420707f](https://github.com/facebook/react-native/commit/09d420707f586710bb0f00981aca989b00f8761a) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add aria-modal  prop to basic component ([095f19a681](https://github.com/facebook/react-native/commit/095f19a681e22bd5f9438758112cc9628499b631) by [@dakshbhardwaj](https://github.com/dakshbhardwaj))
- Added support for number values in fontWeight. ([f1c1f8116b](https://github.com/facebook/react-native/commit/f1c1f8116ba1cfa9d10c5b8c30b98b796047b9c2) by [@ankit-tailor](https://github.com/ankit-tailor))
- Add `aria-label` prop to `Button`, `View`, `Pressable` component ([720cdbc658](https://github.com/facebook/react-native/commit/720cdbc658aa0b513d106526eb81d749fa957c99) by [@Viraj-10](https://github.com/Viraj-10))
- Add `aria-valuemax`, `aria-valuemin`, `aria-valuenow`, `aria-valuetext` as alias prop to `TouchableOpacity`, `View`, `Pressable` `TouchableHighlight` `TouchableBounce` `TouchableWithoutFeedback` `TouchableOpacity` components ([e8739e962d](https://github.com/facebook/react-native/commit/e8739e962de3398bc7e42675b1d87ab35993f705) by [@dakshbhardwaj](https://github.com/dakshbhardwaj))
- Add support for objectFit style of Image. ([b2452ab216](https://github.com/facebook/react-native/commit/b2452ab216e28e004dc625dd8e1ad32351a79be9) by [@gedeagas](https://github.com/gedeagas))
- Added aria-live alias for accessibilityLiveRegion. ([7ea54a4087](https://github.com/facebook/react-native/commit/7ea54a408734ccde9ee01a12942bf5722e9cf7c1) by [@mayank-96](https://github.com/mayank-96))
- Add aria-disabled, aria-busy, aria-checked, aria-expanded and aria-selected prop to core components ([98d84e571d](https://github.com/facebook/react-native/commit/98d84e571df64b00e1ed3484923a1d8169dcfda1) by [@ankit-tailor](https://github.com/ankit-tailor))
- Add support for `userSelect` style ([fc42d5bbb9](https://github.com/facebook/react-native/commit/fc42d5bbb9906c37c2f62d26c46f6e3191cccd01) by [@dakshbhardwaj](https://github.com/dakshbhardwaj))
- Added a check to if `scrollEnabled` is not false, if so then fire the `VirtualizedList` error ([62f83a9fad](https://github.com/facebook/react-native/commit/62f83a9fad027ef0ed808f7e34973bb01cdf10e9))
- Add proper support for fractional scrollIndex in VirtualizedList ([f44dfef923](https://github.com/facebook/react-native/commit/f44dfef923b887308300cee9ae5a55269414c45a) by [@NickGerleman](https://github.com/NickGerleman))
- Add expanded support for CSS Colors ([ac1fe3b7eb](https://github.com/facebook/react-native/commit/ac1fe3b7eb8e16f5feddeeac846ff70080dc119e) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add aria-hidden prop to Pressable, View and Touchables components ([ebdb23c6e0](https://github.com/facebook/react-native/commit/ebdb23c6e060897112b060c25172135d50c78cd3) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added role alias for accessibilityRole. ([a50e6fb341](https://github.com/facebook/react-native/commit/a50e6fb341eacd955071e4a7c6d734e7d3c94cd7) by [@madhav23bansal](https://github.com/madhav23bansal))
- Added pointerEvents style equivalent to pointerEvents prop ([5c109b37a4](https://github.com/facebook/react-native/commit/5c109b37a42d16b35d8ddf2371d42d47f4d49fb2) by [@cyrus25](https://github.com/cyrus25))
- Added an overlay similar to Inspector.js that allows directly selecting elements on RN from React DevTools ([c52df02f84](https://github.com/facebook/react-native/commit/c52df02f84f123a524259eac554f4d2407f1904c) by [@tyao1](https://github.com/tyao1))
- Add tintColor prop to Image component ([7a6f0e44b2](https://github.com/facebook/react-native/commit/7a6f0e44b26b7a6eddb25d5e05948a1992a1629e) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Make babel-plugin-codegen work for TypeScript Spec files ([df0b6900ec](https://github.com/facebook/react-native/commit/df0b6900eca873417c867483b719e8e892a4b75d) by [@RSNara](https://github.com/RSNara))
- Add inputMode prop to TextInput component ([9fac88574e](https://github.com/facebook/react-native/commit/9fac88574e2f8c2f46b7f081273845f833fe1b75) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- React-native-codegen: Add Enum Type support for C++ TurboModules ([b444f0e44e](https://github.com/facebook/react-native/commit/b444f0e44e0d8670139acea5f14c2de32c5e2ddc) by [@christophpurrer](https://github.com/christophpurrer))
- Add enterKeyHint prop to TextInput component ([8c882b4f3d](https://github.com/facebook/react-native/commit/8c882b4f3d361be715c8ec2793c545c687711b5e) by [@dakshbhardwaj](https://github.com/dakshbhardwaj))
- React-native-codegen: Add Union Type support for C++ TurboModules ([355feafff6](https://github.com/facebook/react-native/commit/355feafff6129129533c939e707fadb5fc747c08) by [@christophpurrer](https://github.com/christophpurrer))
- Add readOnly prop to TextInput component ([de75a7a22e](https://github.com/facebook/react-native/commit/de75a7a22eebbe6b7106377bdd697a2d779b91b0) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added ability to construct ArrayBuffers from existing memory buffers. ([3bae268782](https://github.com/facebook/react-native/commit/3bae268782c318b7f8bd6442682d3d683696eedf) by [@neildhar](https://github.com/neildhar))
- Add ability to store and retrieve a list of MapBuffer ([fc065151ce](https://github.com/facebook/react-native/commit/fc065151ce3b2aa53d9f9b78a950d1c3dbce3c75) by [@sshic](https://github.com/sshic))
- SyncCallback/AsyncCallback/AsyncPromise bridging types in C++ now allow wrapping JSI types. ([610bb7f688](https://github.com/facebook/react-native/commit/610bb7f68844df150503623297304dbb67984bfe) by [@nlutsenko](https://github.com/nlutsenko))
- Add types for onFocusCapture/onBlurCapture ([aabb5df7ec](https://github.com/facebook/react-native/commit/aabb5df7ec884b7e08b8b8bef658727653406fd9) by [@NickGerleman](https://github.com/NickGerleman))
- Add `returnKeyAction` prop to `TextInput` component and remove usages of `blurOnSubmit` in native code and convert `blurOnSubmit` to `returnKeyAction` in the JavaScript conversion layer ([1e3cb91707](https://github.com/facebook/react-native/commit/1e3cb9170794afa03a3b4b15f75b711dace7a774))
- Re-add support for using Yoga without exceptions ([793ebf6812](https://github.com/facebook/react-native/commit/793ebf6812f41ad9b07fe04d43a8509a55ebe45e) by [@Yannic](https://github.com/Yannic))

#### Android specific

- Added Flavor Support to React Native Gradle Plugin (RNGP) ([8ad86c70b6](https://github.com/facebook/react-native/commit/8ad86c70b6341f2e8bd40f5ba86f1a0d451008b0) by [@cortinico](https://github.com/cortinico))
- Add ComponentWithState in Android ([b24f60f729](https://github.com/facebook/react-native/commit/b24f60f729bb3d4804f123eb38ed512f2bfc8cf9) by [@cipolleschi](https://github.com/cipolleschi))
- Add support for verticalAlign style ([32b6f319ba](https://github.com/facebook/react-native/commit/32b6f319bafbd6bc2fdab458d38f2d83b0514ad2) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add tabIndex prop to View component ([621f4cf3b1](https://github.com/facebook/react-native/commit/621f4cf3b12979b62d2e1d49d63eaf85e0707026) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add rows prop to TextInput component ([49c9ccd3f8](https://github.com/facebook/react-native/commit/49c9ccd3f8150c5478b502cd5ee158f44750a549) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Stop special-casing Android 11+ from large form-factor `keyboardShouldPersistTaps` behavior ([ef77a4218d](https://github.com/facebook/react-native/commit/ef77a4218db5bafd45ac844cd06e33e229ea534a) by [@NickGerleman](https://github.com/NickGerleman))
- Provide defaults for TurboModuleManagerDelegate and JSIModulePackage ([9a2eb9089f](https://github.com/facebook/react-native/commit/9a2eb9089f0854502b4b03cf4f74426c23b3f4e8) by [@cortinico](https://github.com/cortinico))
- Expose UI_MODE_TYPE_VR_HEADSET in PlatformConstants ([77c256ca91](https://github.com/facebook/react-native/commit/77c256ca9115b8fd23a0e3fa43e12033cac3d634) by [@NickGerleman](https://github.com/NickGerleman))
- Expose `globalEvalWithSourceUrl` in production builds. ([333583bfbe](https://github.com/facebook/react-native/commit/333583bfbe7e3fbf6a6ebd0645019313ade86bea) by [@EvanBacon](https://github.com/EvanBacon))
- Accessibility announcement for list and grid in FlatList ([463af23753](https://github.com/facebook/react-native/commit/463af237539b98289c88e5b491c85cbf53bcaf0c) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Improve OSS systrace ([ccbfdd7167](https://github.com/facebook/react-native/commit/ccbfdd71670a958916c15e8e8e3c5fb94becbe22) by [@janicduplessis](https://github.com/janicduplessis))
- Un-deprecate DisplayMetrics.getWindowDisplayMetrics() method ([4cbd263173](https://github.com/facebook/react-native/commit/4cbd263173b992c0a0dc7c640e39794f39ce1b34) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- Bring back JSIDynamic and JSI ([3d7b53d456](https://github.com/facebook/react-native/commit/3d7b53d456f909029d4d470342419c191565b3e1) by [@cipolleschi](https://github.com/cipolleschi))
- Add Dynamic Type support for iOS (Paper and Fabric) ([11c8bf3137](https://github.com/facebook/react-native/commit/11c8bf313717a8c46165d48caba5e70b9f160d05))
- Add support for parsing files w/ `:` in filename ([714b22bb43](https://github.com/facebook/react-native/commit/714b22bb431a7384a6e06141d5b3f367de2f75cd) by [@shwanton](https://github.com/shwanton))
- Download Hermes from Maven while for -stables ([44e8462a03](https://github.com/facebook/react-native/commit/44e8462a036b8217344f56310719b13d4a551973) by [@cipolleschi](https://github.com/cipolleschi))
- `anchor` option support for `Share` ([aeab38357f](https://github.com/facebook/react-native/commit/aeab38357ffdb0ca266da00748ae2651ca812a1a) by [@zhumingcheng697](https://github.com/zhumingcheng697))
- Line break strategy for Text and TextInput components ([048194849b](https://github.com/facebook/react-native/commit/048194849bda980eecf7bb006ca4e71e2d60ff4c) by [@bang9](https://github.com/bang9))
- Add more extension points for RCTAppDelegate ([dd607a8f2d](https://github.com/facebook/react-native/commit/dd607a8f2d337c01ebe0ff114263fe95b4498364) by [@cipolleschi](https://github.com/cipolleschi))
- Introduce sample component which work with the native state. ([1a9cceb20b](https://github.com/facebook/react-native/commit/1a9cceb20b25416eeb90b68c85daa6608cf5deef) by [@cipolleschi](https://github.com/cipolleschi))
- Add new APIs to `react_native_pods.rb` to simplify app migration ([34fafb2b88](https://github.com/facebook/react-native/commit/34fafb2b881751cdd998d7d5ef486d536607c9ce) by [@cipolleschi](https://github.com/cipolleschi))
- Test iOS template with both architectures and configurations ([4352459781](https://github.com/facebook/react-native/commit/435245978122d34a78014600562517c3bf96f92e) by [@cipolleschi](https://github.com/cipolleschi))
- Add new fontVariant values: stylistic-one(ss01) -> stylistic-twenty(ss20) ([163636db75](https://github.com/facebook/react-native/commit/163636db752b9a5544de54b256e264d3877bb6f7))
- Added the RCTAppDelegate library ([7cc2d1a249](https://github.com/facebook/react-native/commit/7cc2d1a24983d00282fcc694986faad88991845e) by [@cipolleschi](https://github.com/cipolleschi))
- Support setting an Alert button as "preferred", to emphasize it without needing to set it as a "cancel" button. ([000bbe8013](https://github.com/facebook/react-native/commit/000bbe8013ec72d20f969c5c3a1f655b3f20c6ba) by [@robbie-c](https://github.com/robbie-c))
- Added `borderCurve` style prop for smooth border radius (squircle effect) ([8993ffc82e](https://github.com/facebook/react-native/commit/8993ffc82e8d4010d82dcb1d69c33a609bb2771a) by [@eric-edouard](https://github.com/eric-edouard))
- Automatically detect when use frameworks is used ([f7b35c0d43](https://github.com/facebook/react-native/commit/f7b35c0d434a5e98228311722926819ffe80c4b6) by [@cipolleschi](https://github.com/cipolleschi))
- Add compiler flag for the new Arch when enabled. ([5b32348add](https://github.com/facebook/react-native/commit/5b32348add5dbb8e348c4e37d12e7ce01496d87e) by [@cipolleschi](https://github.com/cipolleschi))
- Improve Codegen Cleanup ([aaa795b](https://github.com/facebook/react-native/commit/aaa795bcaec5265a9b0404333934d1115d148db8) by [@cipolleschi](https://github.com/cipolleschi))

### Changed

- Bump CLI to 10.0.0 and Metro to 0.73.5 ([e1bca8f98c](https://github.com/facebook/react-native/commit/e1bca8f98c9d2f86cbd0de61e45728c59d548ba3) by [@thymikee](https://github.com/thymikee))
- Upgrade to `deprecated-react-native-prop-types` 3.0.1: [changelog](https://github.com/facebook/react-native-deprecated-modules/blob/main/deprecated-react-native-prop-types/CHANGELOG.md) ([3e91415696](https://github.com/facebook/react-native/commit/3e91415696a77e5106cc9cd58077632fdf534b37) by [@yungsters](https://github.com/yungsters))
- Upgrade Jest in React Native to ^29.2.1 ([45db65be7e](https://github.com/facebook/react-native/commit/45db65be7e8745a731093f43030965afa7581751) by [@robhogan](https://github.com/robhogan)), ([8f337538ae](https://github.com/facebook/react-native/commit/8f337538ae86b43f524044db3a7363c12e93d7d9) by [@kelset](https://github.com/kelset))
- Bump `@react-native/normalize-color` to 2.1.0, `@react-native-community/eslint-plugin` to 1.3.0, `@react-native/babel-plugin-codegen` to 0.71.1, `@react-native-community/eslint-config` to 3.2.0 and `@react-native-community/eslint-plugin-specs` to 1.3.0, ([8183aac0b1](https://github.com/facebook/react-native/commit/8183aac0b1f55db8fd5d45d4fc6a8e596e3db32b))
- Upgraded react-devtools-core dependency to 4.26.1 ([48263b8daf](https://github.com/facebook/react-native/commit/48263b8daf02fdea6eafa95e7fa80f161474fa54))
- Bump `react-native-codegen` to `^0.71.3` and `react-native-gradle-plugin` to `0.71.12"` ([a7792da695](https://github.com/facebook/react-native/commit/a7792da695f77be8d46b5e84ab697631b884db91) by [@cipolleschi](https://github.com/cipolleschi))
- Bump Hermes for 0.71 version ([4e5fc68672](https://github.com/facebook/react-native/commit/4e5fc68672b469f7a3548822d6fca0b7b3f2d51e) by [@kelset](https://github.com/kelset))
- Simplify Template ESLint Configuration ([68d6214a18](https://github.com/facebook/react-native/commit/68d6214a18b4d8272abddc2303b6b407b0defd7b) by [@NickGerleman](https://github.com/NickGerleman))
- Use `'react-native'` export conditions in Jest environment ([0376aa4856](https://github.com/facebook/react-native/commit/0376aa4856fb5141e89994873e4d80a1f597e0cb) by [@SimenB](https://github.com/SimenB))
- Move JSCRuntime into a separate pod/prefab ([f3bf4d02ab](https://github.com/facebook/react-native/commit/f3bf4d02abf8d22bada8bfcee7ccfbd3bb524750) by [@cipolleschi](https://github.com/cipolleschi))
- Improve version checks ([f12b12c999](https://github.com/facebook/react-native/commit/f12b12c999fb36e66bcef242f7cf1f0751afedcd) by [@cipolleschi](https://github.com/cipolleschi))
- Read `.ruby-version` file in `Gemfile` ([cb7f1b1f0b](https://github.com/facebook/react-native/commit/cb7f1b1f0b9d50ae8a923043d0ed77b2171bf59f) by [@dcangulo](https://github.com/dcangulo))
- Remove React Native version from Hermes tarball name ([e36c492ace](https://github.com/facebook/react-native/commit/e36c492ace5d3171dd64186b5f2024fbae37df36) by [@cipolleschi](https://github.com/cipolleschi))
- RNTester: Migrate Dimensions to hooks ([745e26288c](https://github.com/facebook/react-native/commit/745e26288c656237b0f86f6cfc55643eeb0817ca) by [@Marcoo09](https://github.com/Marcoo09))
- Do not filter errors/warnings from console ([fa2842d113](https://github.com/facebook/react-native/commit/fa2842d113f04c8d33d2f71f43d4232e470b77ac) by [@rickhanlonii](https://github.com/rickhanlonii))
- RNTester: Migrate ActivityIndicator to hooks ([c868d5b26c](https://github.com/facebook/react-native/commit/c868d5b26c5d680603d3f653de9277124c1b539b) by [@Marcoo09](https://github.com/Marcoo09))
- Refactor codegen: Dispatch props and events from a central place. ([affcfa7bde](https://github.com/facebook/react-native/commit/affcfa7bde9740c34cc025741d1e63423183e500) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Add "EarlyJsError: " as prefix of early js error's message ([be6f65660f](https://github.com/facebook/react-native/commit/be6f65660f9c5b56795079b00f6d7eecade5a22f))
- Move Jest config to use a custom react-native Jest env ([cb2dcd327c](https://github.com/facebook/react-native/commit/cb2dcd327c62edae58bb8571273add4c286fd2a8) by [@kelset](https://github.com/kelset))
- Add Metro health check files to the template's `.gitignore` ([19715cf4fb](https://github.com/facebook/react-native/commit/19715cf4fb11640d07b973a3eb0e918ee27691ac) by [@motiz88](https://github.com/motiz88))
- Ship VirtualizedList_EXPERIMENTAL ([971599317b](https://github.com/facebook/react-native/commit/971599317b7bdf1152157206f9503a23ac8c4162) by [@NickGerleman](https://github.com/NickGerleman))
- Typescript: update incorrect `SwitchChangeEvent` type ([5dd2f2e4b7](https://github.com/facebook/react-native/commit/5dd2f2e4b7669397f8bfa9b3845afee7e4e47626) by [@retyui](https://github.com/retyui))
- Make `yarn` and `yarn jest react-native-codegen` works on Windows with git ([c4f9556f7e](https://github.com/facebook/react-native/commit/c4f9556f7e98454e2061ca7e121099ebbbddd4c9) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Refactor in turbo module TypeScript codegen: process `(T)`, `T|U`, `T|undefined` and related stuff in a central place ([00b795642a](https://github.com/facebook/react-native/commit/00b795642a6562fb52d6df12e367b84674994623) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Move and rename `hermes-inspector-msggen` to `react-native/hermes-inspector-msggen` ([530dae8a45](https://github.com/facebook/react-native/commit/530dae8a45a600ef67d01e76edd68824c4e610dd) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Fix interface support in turbo module TypeScript codegen (component only) ([8dc6bec719](https://github.com/facebook/react-native/commit/8dc6bec719eefcb289bb0306c8686afd34835938) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Place TS Declarations Alongside Source Files ([8cdc9e7f04](https://github.com/facebook/react-native/commit/8cdc9e7f04e2dd3026d15dcd5765952bfb2c5c08) by [@NickGerleman](https://github.com/NickGerleman))
- Handle (T) and undefined properly in turbo module component codegen ([205cc9bc3b](https://github.com/facebook/react-native/commit/205cc9bc3b56d21a6ee21a97c1d171d22b6c79c3) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Update `Clipboard` mock path ([2aba3522ab](https://github.com/facebook/react-native/commit/2aba3522ab7dfe113ec26131b747f7f6f0486194) by [@adrianha](https://github.com/adrianha))
- Fix ImageLoader.getSize jest mock ([7be829f2c9](https://github.com/facebook/react-native/commit/7be829f2c9756f8973401644579dd2910b5d3209) by [@elliottkember](https://github.com/elliottkember))
- Correct execution context ID in Debugger.scriptParsed event. ([545366aea3](https://github.com/facebook/react-native/commit/545366aea30c3db6cb28c77ce85208e9973cc1fb) by [@aeulitz](https://github.com/aeulitz))
- Don't polyfill Promise in Jest setup ([f1fdc8b9b6](https://github.com/facebook/react-native/commit/f1fdc8b9b636e010ae5d5e737fc81a8da8f536d4) by [@robhogan](https://github.com/robhogan))
- Codegen: support TypeScript type `(T)` for turbo module codegen (module only) ([624bdc7ec6](https://github.com/facebook/react-native/commit/624bdc7ec63fc10915236653185bb1a705c8460f) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Unify TextInput autoComplete and textContentType props ([73abcba40f](https://github.com/facebook/react-native/commit/73abcba40f305634efaafea8969cdfeb4982df0e) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added `crossOrigin`, `referrerPolicy`, `width`, `height` and `srcSet` props to Image Component. ([47a05bc26a](https://github.com/facebook/react-native/commit/47a05bc26ab76add640183c1d9d8cbba39d7d0d2) by [@dhruvtailor7](https://github.com/dhruvtailor7))
- Copied and refactored the current devtools highlighting code from Inspector into its own module and add to the top level `AppContainer`. The effect is that the highlight stills shows without Inspector opened. ([a63204800a](https://github.com/facebook/react-native/commit/a63204800a1aa23eb050b8f276be70f75057d1da) by [@tyao1](https://github.com/tyao1))
- Minor change to PropTypes error message. ([7783f88d71](https://github.com/facebook/react-native/commit/7783f88d7160e9474164545309590c7f95f7f17f) by [@yungsters](https://github.com/yungsters))
- Set back the `DANGER_GITHUB_API_TOKEN`. ([9344c7aa5a](https://github.com/facebook/react-native/commit/9344c7aa5a7845b250834c4c6a7d8d733be2d143) by [@cipolleschi](https://github.com/cipolleschi))
- Run ESLint in CI ([1bba59023d](https://github.com/facebook/react-native/commit/1bba59023d4976cb349bb58e66ae5b5b5a5288ed) by [@cipolleschi](https://github.com/cipolleschi))
- `eslint-plugin-specs` package has prepack hook that changes `PACKAGE_USAGE` variable of `react-native-modules.js` to `true`. ([ee9c1a5260](https://github.com/facebook/react-native/commit/ee9c1a5260b6a50c952c415c39c9af45ba49f01e) by [@dmytrorykun](https://github.com/dmytrorykun))
- Attach the `.hermes-cache-key-file` to the workspace to avoid race conditions for new PR landing on Hermes and changing the head commit between the time Hermes is built and the time it has to be consumed. ([ccdf9ac985](https://github.com/facebook/react-native/commit/ccdf9ac9853601a81ff21f8f42f5bd866dd4de75) by [@cipolleschi](https://github.com/cipolleschi))
- Build hermes when in CI and not when there is a tarball ([4b51207735](https://github.com/facebook/react-native/commit/4b512077354eb4702ce144e9958d7513c1607275) by [@cipolleschi](https://github.com/cipolleschi))
- Make sure we can build Hermes from source when PR are opened agains -stable ([361d939afd](https://github.com/facebook/react-native/commit/361d939afd0b43b2e9e6ea0d4c619482e91e82e3) by [@cipolleschi](https://github.com/cipolleschi))
- Update ktfmt component on FBS:master ([47548c1149](https://github.com/facebook/react-native/commit/47548c114993433ba03f32398876c1e11aeac0d3) by [@cgrushko](https://github.com/cgrushko))
- Add explicit React useState annotations in xplat/js ([ff14ff3d92](https://github.com/facebook/react-native/commit/ff14ff3d92b2c32f851ee8d25d8e8ea6dfe2ec9e) by [@pieterv](https://github.com/pieterv))
- Improve sample app ([03cb5aca3f](https://github.com/facebook/react-native/commit/03cb5aca3f5b8594287608265d4bde7104f07b87) by [@pieterv](https://github.com/pieterv))
- Mirror fbcode directory structure for container targets ([10ea6fb9a3](https://github.com/facebook/react-native/commit/10ea6fb9a3f408bc23881235427427c3b9e97149))
- Update ktfmt component on FBS:master ([0538f45e45](https://github.com/facebook/react-native/commit/0538f45e45acf494fdafda0757c090a60e730746) by [@cgrushko](https://github.com/cgrushko))
- Rewrite CompactValue to avoid undefined behavior from the use of a union for type-punning ([e7a8d21df5](https://github.com/facebook/react-native/commit/e7a8d21df563e48e1812caace7fbe1f7cbc1c015) by [@htpiv](https://github.com/htpiv))

#### Android specific

- Bump AGP to 7.3.1 ([1f42ff0815](https://github.com/facebook/react-native/commit/1f42ff0815dbf9436904c4a5b1e6975854654172) by [@cortinico](https://github.com/cortinico))
- Bump Android compile and target SDK to 33 ([394486eec5](https://github.com/facebook/react-native/commit/394486eec584a37920dad447a6c1d0ae24d225fc) by [@makovkastar](https://github.com/makovkastar))
- Bump Soloader to 0.10.4 ([1237952d07](https://github.com/facebook/react-native/commit/1237952d070bfe28ff2c94cd9bf8ea19e6cdd395) by [@simpleton](https://github.com/simpleton))
- Rename `POST_NOTIFICATION` to `POST_NOTIFICATIONS` ([910a750fbc](https://github.com/facebook/react-native/commit/910a750fbce42808350312dee1f5671e5d3e05b1) by [@dcangulo](https://github.com/dcangulo))
- Void the Maven coordinates for react-native and hermes-engine ([55b1670aa6](https://github.com/facebook/react-native/commit/55b1670aa6c34f31491ffeba05997f131aae31e7) by [@cortinico](https://github.com/cortinico))
- Provide easy registration of C++ TurboModules in rn-tester Android ([9cb02613e6](https://github.com/facebook/react-native/commit/9cb02613e6c2dfa7847b2f6356d91efe9a4a02f1) by [@christophpurrer](https://github.com/christophpurrer))
- Add feature flag enableAtomicRegisterSegment ([f207cfddf3](https://github.com/facebook/react-native/commit/f207cfddf37c01b5ff2c2f53b4d44a4cc7ad2484))
- Update the template to load the correct JS engine at runtime ([2097278d2a](https://github.com/facebook/react-native/commit/2097278d2a91218274cb661ebf37cc8dbb78bf25) by [@cortinico](https://github.com/cortinico))
- Do not import/use the deprecated ReactFlipperPlugin ([07252b81f6](https://github.com/facebook/react-native/commit/07252b81f6d13729dc08ac1444bad6581d852ddd) by [@cortinico](https://github.com/cortinico))
- Update the template to use RNGP ([c96c76eb91](https://github.com/facebook/react-native/commit/c96c76eb9107ea92ff6dc2dcec114f3bd57102bd) by [@cortinico](https://github.com/cortinico))
- Let RNGP set buildConfigFields for New Architecture and Hermes ([7d2f48c97d](https://github.com/facebook/react-native/commit/7d2f48c97d0dce602fc7fa06546060f4aa3aef17) by [@cortinico](https://github.com/cortinico))
- Hide the C++/Cmake configuration from user space inside the framework ([c9e6a6056d](https://github.com/facebook/react-native/commit/c9e6a6056d9ee24c70826e598ba7219da25ae10d) by [@cortinico](https://github.com/cortinico))
- Encapsulate the prefab configuration for consumers ([b39e77b3d7](https://github.com/facebook/react-native/commit/b39e77b3d725d7fa88abfb0a50780677d7ef7050) by [@cortinico](https://github.com/cortinico))
- Cleanup the Android template after prefab support ([0b4417b43f](https://github.com/facebook/react-native/commit/0b4417b43f66e3de91e9d54099440be14d97434b) by [@cortinico](https://github.com/cortinico))
- Simplify Accessibility Heading role implementation. ([353b1b0f8b](https://github.com/facebook/react-native/commit/353b1b0f8b1ca67efb553738f601552bd9ed897f) by [@blavalla](https://github.com/blavalla))
- Update the OnLoad.cpp to use the facebook::react namespace ([aba82a503d](https://github.com/facebook/react-native/commit/aba82a503d39e7a341630aabdcf02762e392dbea) by [@cortinico](https://github.com/cortinico))
- Remove internal buck rule arg for robolectric tests ([59dc7f1b20](https://github.com/facebook/react-native/commit/59dc7f1b2094063debd4d14957b48fd6ed0e9511))
- Further simplify the New App Template by don't requiring the dynamic library name ([59ae0487ce](https://github.com/facebook/react-native/commit/59ae0487ce05333ba5df6d2244f7eca7ecf82625) by [@cortinico](https://github.com/cortinico))
- Update the template to Reduce the amount of C++ code in user space for New Architecture ([b0aba1b6fa](https://github.com/facebook/react-native/commit/b0aba1b6fa7c3b0d43548371d8b9707d6a7da3b6) by [@cortinico](https://github.com/cortinico))
- Reduce the amount of C++ code in user space for New Architecture ([e89bd4a375](https://github.com/facebook/react-native/commit/e89bd4a3751f71e9d2ede49ae91d3bb9221a7c60) by [@cortinico](https://github.com/cortinico))
- Move setRootViewTag to earlier when RootView is created ([4d642a2250](https://github.com/facebook/react-native/commit/4d642a2250251d90d4afec8e81bf19848217c3f6) by [@sshic](https://github.com/sshic))
- Replace Folly with MapBuffer for passing js error data ([e874e5facb](https://github.com/facebook/react-native/commit/e874e5facb60ff7057c0c95ca53948540ddb7137) by [@sshic](https://github.com/sshic))
- Simplify the template for New Architecture using the .defaults package ([33bd2f6eae](https://github.com/facebook/react-native/commit/33bd2f6eaed3c583f5df852535a8789f8caadbaa) by [@cortinico](https://github.com/cortinico))
- Enable -Wpedantic in OSS Android Targets ([06b55a3d04](https://github.com/facebook/react-native/commit/06b55a3d044a9fbbcd97df6e6531cad98dd34ca1) by [@NickGerleman](https://github.com/NickGerleman))
- Do not load Flipper via reflection ([9214da1238](https://github.com/facebook/react-native/commit/9214da12385fd88264ca5de3e5fdc78559ec3080) by [@cortinico](https://github.com/cortinico))
- Collapse catch blocks in template ([a379879adf](https://github.com/facebook/react-native/commit/a379879adf99800d22da8bc10c3a22f06cb02e20) by [@danilobuerger](https://github.com/danilobuerger))
- Bump git checkout cache key (fourth time) ([41a80f2ee2](https://github.com/facebook/react-native/commit/41a80f2ee20f6e2e7d754d6cd3d47d4cd558c49a) by [@kelset](https://github.com/kelset))
- Replace Toast with Log.w on ReactImageView when null URL specified ([30411ae1a4](https://github.com/facebook/react-native/commit/30411ae1a42e46d0e5a2da494a39ed2767ba8808))
- Views with overflow: hidden and borderRadius: >0 now render anti-aliased borders. ([7708cdccef](https://github.com/facebook/react-native/commit/7708cdcceff9a268ae19c196c2b8baeadf4d9d83))
- Expose react_render_animations via prefab. ([98ad3996c8](https://github.com/facebook/react-native/commit/98ad3996c8b144bf80e1d3f9e6a79ee11e5a2142) by [@cortinico](https://github.com/cortinico))
- Remove unnecessary repositories{} block from top level build.gradle ([f65dfa86ab](https://github.com/facebook/react-native/commit/f65dfa86abcba829c0d65c11ef5c98f1033e2905) by [@cortinico](https://github.com/cortinico))
- Fix prefab prefix for fabricjni ([621d901e10](https://github.com/facebook/react-native/commit/621d901e105d6160a297f8e371889ba2fb631ce2) by [@cortinico](https://github.com/cortinico))
- De-bump AGP to 7.3.1 and do not use addGeneratedSourceDirectory ([caa79b7c01](https://github.com/facebook/react-native/commit/caa79b7c017accd91c0e852bd701ef3f21ac0e6d) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Fix imports in React Bridging for Old Arch and frameworks ([c5de1eb1ba](https://github.com/facebook/react-native/commit/c5de1eb1bac0a4e653688d86654be131984d0e2f) by [@cipolleschi](https://github.com/cipolleschi))
- Abort pod install if bad HERMES_ENGINE_TARBALL_PATH is set. ([27e7295ca7](https://github.com/facebook/react-native/commit/27e7295ca76111c00bcf83327b0a151f21c23743))
- Hermes is integrated into Xcode build. ([6b8e13f53c](https://github.com/facebook/react-native/commit/6b8e13f53c5fc9c5e794bb7491648e4b25ad5811))
- Display a RedBox with the JS stack (instead of native stack) when an unhandled JS exceptions occurs ([ff398e4e26](https://github.com/facebook/react-native/commit/ff398e4e2632ece8a6f22d744e96e489ca3b9d92) by [@p-sun](https://github.com/p-sun))
- Resolve JSI ODR violation, make hermes-engine the JSI provider when Hermes is enabled ([a68c418082](https://github.com/facebook/react-native/commit/a68c4180822e13ae6eecf86601864d1e9f2825a9) by [@hramos](https://github.com/hramos))
- The JSC Runtime is now provided by the React-jsc Pod instead of React-jsi. Libraries that declared a dependency on React-jsi in order to specifically create a JSC runtime (`makeJSCRuntime()`) will need to add React-jsc to their dependencies. ([6b129d81ed](https://github.com/facebook/react-native/commit/6b129d81ed8cab301775d2a04971e255df9290de) by [@hramos](https://github.com/hramos))
- Moved JSIDynamic out of React-jsi and into React-jsidynamic ([0db5178688](https://github.com/facebook/react-native/commit/0db5178688d838689ece5cc246e4ec1ec7f2e607) by [@hramos](https://github.com/hramos))
- Do not load Hermes inspector in release builds ([2a21d5a28e](https://github.com/facebook/react-native/commit/2a21d5a28ea0ee0a1a332ce26b50b7fd61ac89a7) by [@hramos](https://github.com/hramos))
- Remove debugger from Hermes when building for release ([2fc44ac8e1](https://github.com/facebook/react-native/commit/2fc44ac8e144b7d93e1ccc95163dd33c94d2a197) by [@hramos](https://github.com/hramos))
- Use debug Hermes builds by default ([ce4aa93173](https://github.com/facebook/react-native/commit/ce4aa9317370cbbf4e8c80c0a8db3db5a80ef70b) by [@hramos](https://github.com/hramos))
- Add function to simplify podspecs ([82e9c6ad61](https://github.com/facebook/react-native/commit/82e9c6ad611f1fb816de056ff031716f8cb24b4e) by [@cipolleschi](https://github.com/cipolleschi))
- Enable pedantic warnings in C++ podspecs ([545c82b490](https://github.com/facebook/react-native/commit/545c82b490f1389056cf2f945a547a22b1274f60) by [@NickGerleman](https://github.com/NickGerleman))
- Cleanup codegen build folder before installing the pods ([0e316ec671](https://github.com/facebook/react-native/commit/0e316ec671617f5e7c1985b4b05cd0d45bcea403) by [@cipolleschi](https://github.com/cipolleschi))
- Properly support both libraries and use_frameworks ([c6fa633597](https://github.com/facebook/react-native/commit/c6fa6335971459158efc8bf094822547a4333235) by [@cipolleschi](https://github.com/cipolleschi))
- Add link group label to talkios deps ([b33961d7a0](https://github.com/facebook/react-native/commit/b33961d7a0fbf5783513a81b217ec1a90700d817))
- Add link group label to fbios deps ([065db683a2](https://github.com/facebook/react-native/commit/065db683a20b273ea3656dead29845327637669a))
- Use an SDKRoot based Foundation framework ([ee4ce2df2f](https://github.com/facebook/react-native/commit/ee4ce2df2f57b07e523bfb4d4728543d73b5a009) by [@chatura-atapattu](https://github.com/chatura-atapattu))

### Removed

- remove AsyncStorage from JS ([20eeb1bfe3](https://github.com/facebook/react-native/commit/20eeb1bfe30eacf26abd185b6fa062b708deaf8a) by [@hoxyq](https://github.com/hoxyq))
- Remove VirtualizedList `listKey` prop ([010da67bef](https://github.com/facebook/react-native/commit/010da67bef0c22418d0d41b7c2eae664672a4a27) by [@NickGerleman](https://github.com/NickGerleman))
- Remove MaskedViewIOS ([a67360b0f3](https://github.com/facebook/react-native/commit/a67360b0f3aec0e679be32715b02467429002c31) by [@sokolnickim](https://github.com/sokolnickim))
- Back out parsing and generation of Custom Native State from Codegen ([62da9b8ce2](https://github.com/facebook/react-native/commit/62da9b8ce2097c9037ee2c766c9d4cb64eae2930) by [@cipolleschi](https://github.com/cipolleschi))
- Back out components with native state in RNTester ([aace6626c1](https://github.com/facebook/react-native/commit/aace6626c10916c022c9960ac61d54b780edd230) by [@cipolleschi](https://github.com/cipolleschi))
- `react-native/eslint-plugin` no longer provides the `error-subclass-name` rule. ([4f83498462](https://github.com/facebook/react-native/commit/4f83498462133b4c5b9e89836c52482ef7098427) by [@yungsters](https://github.com/yungsters))
- `react-native/eslint-plugin` no longer provides the `no-haste-imports` rule. ([1ec69b1823](https://github.com/facebook/react-native/commit/1ec69b1823c3fd0cc2a9209032e4e3e8e8166030) by [@yungsters](https://github.com/yungsters))
- Remove listKey from TS typings ([773615bc9d](https://github.com/facebook/react-native/commit/773615bc9d8e43b569513a3233259caa965a4c0b) by [@NickGerleman](https://github.com/NickGerleman))
- Remove usages of listKey ([bc5cb7cd79](https://github.com/facebook/react-native/commit/bc5cb7cd7933da707c02ff0dd993c607ba7d40b3) by [@NickGerleman](https://github.com/NickGerleman))
- Remove unneed/obsolete job ([8e3b62019e](https://github.com/facebook/react-native/commit/8e3b62019ee412399ece0fbda91e58bb395f7e98) by [@kelset](https://github.com/kelset))
- Remove flexlayout from react-native ([bf05df1723](https://github.com/facebook/react-native/commit/bf05df17230e1063ff29d5ae5d86feac85e122b3) by [@NickGerleman](https://github.com/NickGerleman))
- Remove remaining TV_OS fragments ([089684ee56](https://github.com/facebook/react-native/commit/089684ee5604a6a2a15a4fc03fe63c73a5de9fd0) by [@christophpurrer](https://github.com/christophpurrer))

#### Android specific

- Removed `AsyncStorage` module ([5738fe6426](https://github.com/facebook/react-native/commit/5738fe642601237e16417105d6727f777e73aae3) by [@hoxyq](https://github.com/hoxyq))
- Deprecate react.gradle ([af6aafff90](https://github.com/facebook/react-native/commit/af6aafff90c4d40abfe160c4cfc8e1ae8fa0d956) by [@cortinico](https://github.com/cortinico))
- Removed deprecated UIImplementationProvider ([e7d7563195](https://github.com/facebook/react-native/commit/e7d75631959f1ce3f50a44f13056eacaf82378ff) by [@javache](https://github.com/javache))
- Cleanup Buck usages from New App Template ([32fc551c55](https://github.com/facebook/react-native/commit/32fc551c55a203bc4a511c12ae362632acb3b286) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Removed `AsyncStorage` module ([4de2aaba50](https://github.com/facebook/react-native/commit/4de2aaba502b49f8360ee5622d6ee8a6d9a93a32) by [@hoxyq](https://github.com/hoxyq))
- Remove `HERMES_BUILD_FROM_SOURCE` flag ([138af74e3f](https://github.com/facebook/react-native/commit/138af74e3f2aa429eedc8881c8feb6d4a7b5c253) by [@cipolleschi](https://github.com/cipolleschi))
- Removed `ImagePickerIOS` module native sources ([d03a29ce5f](https://github.com/facebook/react-native/commit/d03a29ce5f7a40b4b0d172b7f2eb957143684818) by [@hoxyq](https://github.com/hoxyq))

### Fixed

- Fix TS Type for measureLayout optional parameter ([5928144302](https://github.com/facebook/react-native/commit/59281443021e271c9112d60a2c2276fe10a67e37) by [@NickGerleman](https://github.com/NickGerleman))
- Allow GNU coreutils to be used to build projects ([f5e5274e6a](https://github.com/facebook/react-native/commit/f5e5274e6ad1330ad8d005f08d6f1ec678ea9ffe) by [@shreeve](https://github.com/shreeve))
- Reference App.tsx vs App.js in text of new typescript template ([81e441ae8a](https://github.com/facebook/react-native/commit/81e441ae8a7daed79d8804c72e1991b29f670411) by [@mikehardy](https://github.com/mikehardy))
- Fix incorrect height when gap causes main axis to overflow and cross-axis is stretched ([1aa157b196](https://github.com/facebook/react-native/commit/1aa157b196b85d81e2e2115815c073fe8c0730c4) by [@NickGerleman](https://github.com/NickGerleman))
- Codegen for C++ TurboModules of optional method arguments was incorrect ([e81c98c842](https://github.com/facebook/react-native/commit/e81c98c842380d8b72c1dc8d4a6e64f760e2a58c) by [@javache](https://github.com/javache))
- Fix incorrect height when gap causes main axis to overflow and cross-axis is stretched ([1aa157b196](https://github.com/facebook/react-native/commit/1aa157b196b85d81e2e2115815c073fe8c0730c4) by [@NickGerleman](https://github.com/NickGerleman))
- Fixup TS Organization ([5d26ceaa23](https://github.com/facebook/react-native/commit/5d26ceaa236684c7bd6d0d9001ff2c8908d88c29) by [@NickGerleman](https://github.com/NickGerleman))
- Fixed typo syncronization -> synchronization ([ad5e3f6b9a](https://github.com/facebook/react-native/commit/ad5e3f6b9ae870cbfcef2874511915c5dc309ce8) by [@pruthvip](https://github.com/pruthvip))
- react-native-codegen : Add Map / indexed object support for TypeScript parser ([87c356d56c](https://github.com/facebook/react-native/commit/87c356d56c73c3289da3d5911288909720b11994) by [@christophpurrer](https://github.com/christophpurrer))
- Add wanted dependencies to remove yarn warnings ([cd25fb3240](https://github.com/facebook/react-native/commit/cd25fb324018ed97a42e1d7ec8d923c09eef4f63) by [@kelset](https://github.com/kelset))
- Fixed crash when converting JS symbol to folly::dynamic ([428feb2f76](https://github.com/facebook/react-native/commit/428feb2f76c55d6ae5914b019095cd835aa514b0) by [@kassens](https://github.com/kassens))
- Error reporting for module errors ([af0e6cdae5](https://github.com/facebook/react-native/commit/af0e6cdae5762346a013a60e9b3f095204292550) by [@rickhanlonii](https://github.com/rickhanlonii))
- Support properly sending BigInts and Symbols over the Chrome DevTools Protocol. ([7208d15dce](https://github.com/facebook/react-native/commit/7208d15dce552289e530ed470d66c05a65a7239a))
- Fixed React DevTools element highlighting throwing redbox errors ([c64f25ac85](https://github.com/facebook/react-native/commit/c64f25ac85d32186c0400b8aa27785280cdf2799))
- Fix require cycle warning in VirtualizedList ([49cb7f28c8](https://github.com/facebook/react-native/commit/49cb7f28c8dee19c2f3f20aaf21bbf91e85fa5e6) by [@motiz88](https://github.com/motiz88))
- Pressability for text with only `onPressIn` / `onPressOut` props ([f1f7824203](https://github.com/facebook/react-native/commit/f1f78242039438241a905eb43b37c57b73e03335))
- Load react-native.config.js from correct path during codegen ([74fda10702](https://github.com/facebook/react-native/commit/74fda1070266df13e1b58680a670dde3acf9d205) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- Remove usage of the codegen spec filtering until we publish a new version of the codegen. ([ae3dd54fae](https://github.com/facebook/react-native/commit/ae3dd54faee02746b65eeafe36f40f1653b9049b) by [@cipolleschi](https://github.com/cipolleschi))
- Fix nightly build issues ([93c3effc72](https://github.com/facebook/react-native/commit/93c3effc7284cfd5e64a9280e1a56ee7e86127d1) by [@Kudo](https://github.com/Kudo))
- Properly parse negative values ([f3c98c5fa2](https://github.com/facebook/react-native/commit/f3c98c5fa273dbdb17c32cd1193a3f078ef942b4) by [@cipolleschi](https://github.com/cipolleschi))
- Fixup Yoga Enum Generator ([5f9689a0d0](https://github.com/facebook/react-native/commit/5f9689a0d041d2ca81cd2e8e407d97db330b2c95) by [@NickGerleman](https://github.com/NickGerleman))
- Fix remaining NDK comment for new architecture ([fb1f53f7dc](https://github.com/facebook/react-native/commit/fb1f53f7dc09428d2133de8060e63d8194853608) by [@ken0nek](https://github.com/ken0nek))
- Fixed missing Pressable hover props in typescript definition ([6ba5fa946d](https://github.com/facebook/react-native/commit/6ba5fa946d5076995f28f3f5060aa5cabd62619b) by [@Saadnajmi](https://github.com/Saadnajmi))
- Remove Android.mk from internal Gradle task ([d0df6afe76](https://github.com/facebook/react-native/commit/d0df6afe7646032c77643ebd25fa69c507c9ef92) by [@Sunbreak](https://github.com/Sunbreak))
- In RN devtools, call that method, and then set component state to not inspecting. ([bfb36c2163](https://github.com/facebook/react-native/commit/bfb36c21633526fc46f637783b1ff26f2ade1c56) by [@tyao1](https://github.com/tyao1))
- Enable the `react-native-codegen` tests in the OSS. ([00458c9410](https://github.com/facebook/react-native/commit/00458c94109776251678efbec10052702a41c335) by [@cipolleschi](https://github.com/cipolleschi))
- Make style pointerEvents take priority over pointerEvents prop. FIxes requested changes in https://github.com/facebook/react-native/issues/34586 ([a789ead545](https://github.com/facebook/react-native/commit/a789ead5459b772a1ae9b17fce6565d4717554f8) by [@cyrus25](https://github.com/cyrus25))
- Change Wrapper of `InspectorPanel` from `View` to `SafeAreaView` ([afad68f1a8](https://github.com/facebook/react-native/commit/afad68f1a83995eaa42a8f1c7c636ccef8914797) by [@raykle](https://github.com/raykle))
- Typo in AssetSourceResolver ([a45eeea17a](https://github.com/facebook/react-native/commit/a45eeea17a330ccac391b5f0fc1a6f74b6b9e8ee) by [@dhruvtailor7](https://github.com/dhruvtailor7))
- Run ExceptionsManager unit tests in both __DEV__ and prod mode ([a154207371](https://github.com/facebook/react-native/commit/a154207371e0498c93476d98f830ca8b15be8276) by [@GijsWeterings](https://github.com/GijsWeterings))
- Avoid keypress event when text is pasted on macOS ([477663cba8](https://github.com/facebook/react-native/commit/477663cba8c353d950a9a928844929903d55933a) by [@christophpurrer](https://github.com/christophpurrer))
- Flipper now supports custom Xcode build configuration names ([1bc9ddbce3](https://github.com/facebook/react-native/commit/1bc9ddbce393be9466cb87124d3e34a19abb8e5d) by [@scarlac](https://github.com/scarlac))
- Make clang-format work in M1 (Apple Silicon) ([377aa7a30f](https://github.com/facebook/react-native/commit/377aa7a30f5ca1f128fd9222b317ff543e9b0e4a) by [@christophpurrer](https://github.com/christophpurrer))
- Using SOURCEMAP_FILE during xcode build phase with Hermes enabled ([a98da32229](https://github.com/facebook/react-native/commit/a98da322293e2db777bcc599b5abb10f750a7816) by [@kidroca](https://github.com/kidroca))
- Remove compiler-specific syntax. ([33dbb6c40c](https://github.com/facebook/react-native/commit/33dbb6c40ccf44e4b4c879270b6286e2829d057b) by [@chiaramooney](https://github.com/chiaramooney))
- Fix reload hang after debugger break and continue ([60e7eb4d53](https://github.com/facebook/react-native/commit/60e7eb4d534298cb9888d5ab0c8b6a6b041dc299) by [@aeulitz](https://github.com/aeulitz))
- Fix FlatList not calling render items for nullish values when numColumns > 1 ([cc19cdcdbe](https://github.com/facebook/react-native/commit/cc19cdcdbe927368ae1cf4c62a52edd838413252) by [@AntoineDoubovetzky](https://github.com/AntoineDoubovetzky))
- Fix macro errors for Windows. ([fc26dbfce0](https://github.com/facebook/react-native/commit/fc26dbfce0ed16edf1efcfebc01dd4ca584eb902) by [@chiaramooney](https://github.com/chiaramooney))
- Adding grid role to ViewAccessibility to fix flow errors. ([5ddb9977e6](https://github.com/facebook/react-native/commit/5ddb9977e662a1b41dd7203605ca8480432fc06a) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fix: use REACT_NATIVE_CI instead of CI envvar ([ed16fdbbb8](https://github.com/facebook/react-native/commit/ed16fdbbb8f9f5943d4bb9d9a0f40caf89904d33) by [@dmytrorykun](https://github.com/dmytrorykun))
- Bypass tag check in dry run ([ba1a9defbb](https://github.com/facebook/react-native/commit/ba1a9defbbc3261dca43ba20bde41dc6613aa4cf) by [@cipolleschi](https://github.com/cipolleschi))
- Fix removal of version from Hermes tarball, part 2 ([6107793fda](https://github.com/facebook/react-native/commit/6107793fda11a85297b3a3e2b8f259930d6c0f41) by [@kelset](https://github.com/kelset))
- Fix removal of version from Hermes tarball ([e809e4b1ec](https://github.com/facebook/react-native/commit/e809e4b1ecafc942463becfd6a5d62e5132f8f94) by [@kelset](https://github.com/kelset))
- Better fix for param ([32931b19b1](https://github.com/facebook/react-native/commit/32931b19b1f83081dd9e1085ff0add922630f81b) by [@kelset](https://github.com/kelset))
- Fix publish npm post strict ([0f72abfc03](https://github.com/facebook/react-native/commit/0f72abfc03532ca3919554cbbecc8a31d76c231b) by [@kelset](https://github.com/kelset))
- Fix some issues exposed when making function statics sealed ([662115077a](https://github.com/facebook/react-native/commit/662115077a9d7dab260ec93d89c7ca02145a47f8) by [@gkz](https://github.com/gkz))
- Fix measure inner dimensions ([11f47432ff](https://github.com/facebook/react-native/commit/11f47432ff10d0cfe81883f942256c469ac34140) by [@kinarobin](https://github.com/kinarobin))
- Annotate empty objects in xplat ([abb21dd908](https://github.com/facebook/react-native/commit/abb21dd908729fa69daf2fa63366e488009b63bd) by [@SamChou19815](https://github.com/SamChou19815))
- Fix comment typo 'layed out' to 'laid out' ([108c876206](https://github.com/facebook/react-native/commit/108c8762060c9d52e295a1e0f9cdeb6c6a44b53e) by [@lwyj123](https://github.com/lwyj123))
- Fix missing dll exports ([619d115822](https://github.com/facebook/react-native/commit/619d115822bce7b0f6fa194c133d895dc77e717e) by [@justjavac](https://github.com/justjavac))
- Fix FillRateHelper Accessing -1 Frame ([052617611d](https://github.com/facebook/react-native/commit/052617611d68042b0c228955ed5de10a07da203a) by [@NickGerleman](https://github.com/NickGerleman))
- Attempt fix #2 for `cellsAroundViewport` reaching out of bounds ([0ef770587f](https://github.com/facebook/react-native/commit/0ef770587f78389ea4c56f5ace4389d07281947c) by [@NickGerleman](https://github.com/NickGerleman))
- Attempt fix for `cellsAroundViewport` reaching out of bounds ([7aa203beda](https://github.com/facebook/react-native/commit/7aa203beda3cd358703c2fa535ed045771761612) by [@NickGerleman](https://github.com/NickGerleman))
- Reland D38460202 and fix tests ([c4ddaa8fdb](https://github.com/facebook/react-native/commit/c4ddaa8fdba54dd0a7e8587859a7c30ef0d6ce6c) by [@sshic](https://github.com/sshic))
- Add missing class annotations and lock xplat/js ([0ccbe5f704](https://github.com/facebook/react-native/commit/0ccbe5f70463b5259ae1adcb65deeb89204b1948) by [@pieterv](https://github.com/pieterv))
- Add missing class annotations xplat/js [suppressions] ([2e649006f1](https://github.com/facebook/react-native/commit/2e649006f1a78539f5504bce79cbd51816679e13) by [@pieterv](https://github.com/pieterv))
- Add missing class annotations xplat/js ([ee3d3c248d](https://github.com/facebook/react-native/commit/ee3d3c248df4e8be3a331ead5f6eea75c1cf237a) by [@pieterv](https://github.com/pieterv))
- Apply lint updates from buildifier in xplat ([a70354df12](https://github.com/facebook/react-native/commit/a70354df12ef71aec08583cca4f1fed5fb77d874) by [@chatura-atapattu](https://github.com/chatura-atapattu))
- fix: remove gap if its last element in line (fix flex gap extra spacing when children determine parents main axis size)([](https://github.com/facebook/react-native/commit/a0ee98dfeec1a75e649a935b733c70ae2cc1628d) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- Add missing AccessibilityInfo Types to TS Typings ([dc1b20d495](https://github.com/facebook/react-native/commit/dc1b20d49514ec5962a6c165a99d9406a66ba67d) by [@NickGerleman](https://github.com/NickGerleman))
- Fix Errors with TypeScript Tests ([ed08edd966](https://github.com/facebook/react-native/commit/ed08edd966aa17764436042b8202704144d61861) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing VirtualizedList Imperative Types ([de1136359c](https://github.com/facebook/react-native/commit/de1136359cf78fa3f2593388924893c36c526650) by [@NickGerleman](https://github.com/NickGerleman))
- Fix virtual list type ([1bd3831cc5](https://github.com/facebook/react-native/commit/1bd3831cc56bb77ada47c4a71fd6cd69fd731938) by [@aliakbarazizi](https://github.com/aliakbarazizi))
- Add missing types for AppRegistry ([213c26c23d](https://github.com/facebook/react-native/commit/213c26c23d91ee994d86f0f9e0e886f4e8a1837e) by [@NickGerleman](https://github.com/NickGerleman))
- Add type for RootTagContext ([fd28032be6](https://github.com/facebook/react-native/commit/fd28032be621ce50e9c8785b35f853b51c44df9d) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing types to PushNotificationIOS ([f04f067aae](https://github.com/facebook/react-native/commit/f04f067aae8c07faa8dce19500eeb7f2dcca99ad) by [@NickGerleman](https://github.com/NickGerleman))
- Fix missing animation type (CircleCI Break) ([696f4b5c39](https://github.com/facebook/react-native/commit/696f4b5c39d67bf62d4eae6cfd497293f2c1bd08) by [@NickGerleman](https://github.com/NickGerleman))
- Fix types for deprecated scrollTo fields ([f9ab91c3ab](https://github.com/facebook/react-native/commit/f9ab91c3abe9baef520255e580005b24be282991) by [@NickGerleman](https://github.com/NickGerleman))
- Fix Vibration.vibrate() allowing null params ([9b7618856f](https://github.com/facebook/react-native/commit/9b7618856f6e1fd423f302cdfab7121f913caf7f) by [@NickGerleman](https://github.com/NickGerleman))
- Mark scrollToEnd animated as optional ([8770b2724a](https://github.com/facebook/react-native/commit/8770b2724ae9783b649824249fa252ec7900471d) by [@NickGerleman](https://github.com/NickGerleman))
- Fix type for StyleSheet.compose() ([754524ea9d](https://github.com/facebook/react-native/commit/754524ea9d2f4b5f8c3eb9e05b2fd25a3e0c3418) by [@NickGerleman](https://github.com/NickGerleman))
- Remove testID from TS ViewStyle ([172f23a2ee](https://github.com/facebook/react-native/commit/172f23a2ee167c322bd84e9d43d3f39fed51116b) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing type for AnimatedValue.resetAnimation() and AnimatedValue.animate() ([1b5066c21d](https://github.com/facebook/react-native/commit/1b5066c21dde90f31753d6d84bce3d8817071451) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- `findPackageJsonFile` should return `null` if `package.json` does not exist ([913ebd207c](https://github.com/facebook/react-native/commit/913ebd207c2e7bc1182eab0bd8d82e7d9d7ee567) by [@tido64](https://github.com/tido64))
- Fix crash on initialize modal ([15656342a8](https://github.com/facebook/react-native/commit/15656342a8401eb599090da7962928dd48d7d890) by [@alpha0010](https://github.com/alpha0010))
- Fix Android autolinking failing because of not expanded variable ([4c1d5ad9c6](https://github.com/facebook/react-native/commit/4c1d5ad9c67b8d0184d27e4e7f6e1cd5b7f8e8b9) by [@kkafar](https://github.com/kkafar))
- On instance destroy, websockets are correctly closed ([b5ea5a2c4d](https://github.com/facebook/react-native/commit/b5ea5a2c4d053cc0962305a7b4f834c28f6d8ddf) by [@javache](https://github.com/javache))
- Sets the namespace via Gradle and not via AndroidManifest ([cec9a34f6c](https://github.com/facebook/react-native/commit/cec9a34f6cd2a82bba76e15761da6b588bc3f574) by [@cortinico](https://github.com/cortinico))
- RNGP - Do the .so cleanup using pickFirst and exclude ([2ff08e8bd8](https://github.com/facebook/react-native/commit/2ff08e8bd8b1303f1ef6f3052031c3a216565053) by [@cortinico](https://github.com/cortinico))
- Fixed an issue on Android API 31+ where modals would turn status bar icons white by default ([5c5220a46d](https://github.com/facebook/react-native/commit/5c5220a46d05fa070e9f5f990bd741efa2b09309) by [@Abbondanzo](https://github.com/Abbondanzo))
- TextInputs may not get focused when switching inputs in a ScrollView ([370bbd705b](https://github.com/facebook/react-native/commit/370bbd705b21947f1c334e158816c812825546d4) by [@javache](https://github.com/javache))
- Fix react.gradle's detectCliPath's for finding the path from Node ([121184bb8f](https://github.com/facebook/react-native/commit/121184bb8f02e884f378a6712950162a8eb15695) by [@liamjones](https://github.com/liamjones))
- Fix crash on release versions after AGP 7.3 bump ([6125f1f866](https://github.com/facebook/react-native/commit/6125f1f866da129dbdc01f5b9e4fac27fa77ed8a) by [@cortinico](https://github.com/cortinico))
- Gracefully handle crash if no WebView provider is found on the device ([3f3394a566](https://github.com/facebook/react-native/commit/3f3394a5668d515e3476933aec67f07794c6e765) by [@rachitmishra](https://github.com/rachitmishra))
- Text with onPress or onLongPress handler is not accessible with TalkBack ([f3847eeec2](https://github.com/facebook/react-native/commit/f3847eeec2679450fcb4fe52e351b9a9c3b0d2a6) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Align android image style / source logic with ios ([6bdcb49966](https://github.com/facebook/react-native/commit/6bdcb49966882bcf696d42066e289783c003dcfc) by [@danilobuerger](https://github.com/danilobuerger))
- Emit the right bubbling event for ReactSliderEvent ([b7e7e7ff1e](https://github.com/facebook/react-native/commit/b7e7e7ff1e74b45709def1f6753fb6421c57a448))
- Typo in build.gradle ([ed21a3e20f](https://github.com/facebook/react-native/commit/ed21a3e20fcbba131792f469fe004f8cf97a4018) by [@jeremybarbet](https://github.com/jeremybarbet))
- Border width top/bottom not matching the border radius ([cd6a91343e](https://github.com/facebook/react-native/commit/cd6a91343ee24af83c7437b3f2449b41e97760e9) by [@hurali97](https://github.com/hurali97))
- Re-implement accessibilityHint on Android to use AccessibililltyNodeInfo#setToolTipText instead of contentDescription ([0b70b38547](https://github.com/facebook/react-native/commit/0b70b38547685b6b978cacedf3ff36723d79a594) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Removed unused variable `NODE_MODULES_DIR` from `build.gradle` in app template ([50b1270298](https://github.com/facebook/react-native/commit/50b12702987c7f6550d4272ce7c94262ec47b6c3) by [@tomekzaw](https://github.com/tomekzaw))
- AccessibilityLabelledBy use DynamicFromObject to parse String to Dynamic ([9f4358142e](https://github.com/facebook/react-native/commit/9f4358142ea7d8f110bbb09dbe3896f5859d56b3) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Bug with view transforms when view recycling is enabled ([e0be14a310](https://github.com/facebook/react-native/commit/e0be14a310009f085e6f5abb52528a528bc923f3) by [@javache](https://github.com/javache))
- Use WindowInsetsCompat for Keyboard Events ([1e48274223](https://github.com/facebook/react-native/commit/1e48274223ee647ac4fc2c21822b5240f3c47e4c) by [@NickGerleman](https://github.com/NickGerleman))
- Adding importantForAccessibility for Text, Button, ImageBackground ([62021eb8d1](https://github.com/facebook/react-native/commit/62021eb8d1721af3a44da1b83c8a6cb59d9d6244) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fix regression when setting shadow node properties. ([a142a78473](https://github.com/facebook/react-native/commit/a142a784733bc7e37042a7e4d3cdbeff99aa1fa7) by [@rshest](https://github.com/rshest))
- Fix occasionally incorrect ScrollView fling behavior ([c7c263dda8](https://github.com/facebook/react-native/commit/c7c263dda8324ec8192ef6389f491a243a100a58) by [@dhleong](https://github.com/dhleong))
- Migrate `needsCustomLayoutForChildren` check to the new architecture ([e24ce708ab](https://github.com/facebook/react-native/commit/e24ce708abffee8ec4521ba8162ea8964eb4429f) by [@grahammendick](https://github.com/grahammendick))
- Remove extra indexOf call in BackHandler.removeEventListener ([14c207d9e1](https://github.com/facebook/react-native/commit/14c207d9e1ffbfa8eeb3b2c6d2a6e334168a4d73) by [@vitalii-tb](https://github.com/vitalii-tb))
- Fix such that when the scrollviews call `onChildStartedNativeGesture`, they appropriately call `onChildEndedNativeGesture` to unlock the native gesture such that `JSTouchDispatcher` or `JSPointerDispatcher` will continue to emit events. ([143a0f74b8](https://github.com/facebook/react-native/commit/143a0f74b86bf2593dd29ce3c85d73d703d7a9f5))
- Fix `AttributedString` comparison logic for TextInput state updates ([089c9a5c9c](https://github.com/facebook/react-native/commit/089c9a5c9c9a60b6bbff6dda0c9eefa9d501a092) by [@NickGerleman](https://github.com/NickGerleman))
- Invoke closeAndReleaseSonatypeStagingRepository in the publish gradle invocation ([e4f23f4783](https://github.com/facebook/react-native/commit/e4f23f4783968e40924ab0f3500018dc79c2d366) by [@cortinico](https://github.com/cortinico))
- Do not eat taps/clicks in ScrollView when soft-keyboard is detached from viewport ([fd1e82a10f](https://github.com/facebook/react-native/commit/fd1e82a10f80c76bd37e7eef65c0dc2220c6bb8d) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing class annotations xplat/js ([c687dd3a77](https://github.com/facebook/react-native/commit/c687dd3a77e28b7318514e5ab318be302f0e7643) by [@pieterv](https://github.com/pieterv))

#### iOS specific

- Don't use the internal `native_modules.rb` script yet, as it hides a hard-coded path ([4df793f75b](https://github.com/facebook/react-native/commit/4df793f75bb178ffd0217ff745de1e1c10b14098) by [@tido64](https://github.com/tido64))
- Exclude redirector to `LongLivedObject.h` from ReactCommon podspec ([dd0bf83481](https://github.com/facebook/react-native/commit/dd0bf834818bcd330b0837b6ada9b848a595e4fe) by [@cipolleschi](https://github.com/cipolleschi))
- Fix incorrect codegen CLI paths in monorepo projects ([4a4cceef25](https://github.com/facebook/react-native/commit/4a4cceef2570c2a68ae91db0648aaaf08cf6c426) by [@byCedric](https://github.com/byCedric))
- Remove hermesc build dir for non-Hermes build. ([c05e6c47df](https://github.com/facebook/react-native/commit/c05e6c47df95f36f0afa94a7aa6725a34bee4095))
- Remove `Copy Hermes Framework` script phase for non-Hermes build. ([7f60bcceac](https://github.com/facebook/react-native/commit/7f60bcceac736aee99e4a8deaadcad30e94f43bc))
- Make sure that the React-Codegen.podspec does not enforce specific versions of its dependencies. ([bc074a300d](https://github.com/facebook/react-native/commit/bc074a300dc8a1d26a11965520dafd8f3e190e01) by [@cipolleschi](https://github.com/cipolleschi))
- Various fixes for Hermes build-from-source behaviour. ([5dd0f7327b](https://github.com/facebook/react-native/commit/5dd0f7327bf6ef1e2d559e6f65769dab3c84fb19))
- Correctly set -DCMAKE_BUILD_TYPE for Hermes on iOS ([c63133202b](https://github.com/facebook/react-native/commit/c63133202b015adc6cd94e77069586a619aca4a8) by [@cortinico](https://github.com/cortinico))
- Https://github.com/facebook/react-native/pull/35047 reverted. ([bbd432e999](https://github.com/facebook/react-native/commit/bbd432e9994eb3b3114d429913bb8ce1a4f6e877))
- Make sure that libraries created with `install_modules_dependencies` has the right C++ version. ([40ad31eacf](https://github.com/facebook/react-native/commit/40ad31eacf29e83ba91031b714c4de1f4d22e469) by [@cipolleschi](https://github.com/cipolleschi))
- Make ManagedObjectWrapper compile on macOS ([76c7ccaa60](https://github.com/facebook/react-native/commit/76c7ccaa60c4e820757c5d8cd8ccc80a2cb5f4a0) by [@christophpurrer](https://github.com/christophpurrer))
- Map `accessibilityRole: grid` to `UIAccessibilityTraitNone` ([f3d9f2ea23](https://github.com/facebook/react-native/commit/f3d9f2ea233304870bd4ab67d9682af6eb0ae16f) by [@NickGerleman](https://github.com/NickGerleman))
- Remove unused #import <UIKit/UIGestureRecognizerSubclass.h> import which breaks macOS ([84737e0069](https://github.com/facebook/react-native/commit/84737e0069f820bdb4b210e979d5faa2ec85ed3e) by [@christophpurrer](https://github.com/christophpurrer))
- Fix Text.allowFontScaling prop in the new architecture ([e9b89b5ff2](https://github.com/facebook/react-native/commit/e9b89b5ff2b0085128bec2879d761352747d6714) by [@sammy-SC](https://github.com/sammy-SC))
- Make the nightly work with the  proper Hermes tarball ([1546666a6d](https://github.com/facebook/react-native/commit/1546666a6d713ef756b2f11de9581e3b2bbe08dc) by [@cipolleschi](https://github.com/cipolleschi))
- Add MARKETING_VERSION to template project ([33e140fd05](https://github.com/facebook/react-native/commit/33e140fd059c1eca3d07ebb76a9be36cf9189b74) by [@kelset](https://github.com/kelset))
- Automatically following version on xcode. ([dcd21143bc](https://github.com/facebook/react-native/commit/dcd21143bc735ff15add4d4b4ba26e3c30ff0dc9) by [@erfinbadrian](https://github.com/erfinbadrian))
- Fix race condition in RCTLoggingTests integration tests ([540ae39487](https://github.com/facebook/react-native/commit/540ae394871148f803bea0697a41763478262bb9))
- Add missing react/renderer/mapbuffer module to podspec ([00458637da](https://github.com/facebook/react-native/commit/00458637da8473bd58e10c7e5a06be1d7ca8559d))
- RedBox title font by using a monospace font on iOS +13. ([5933b6a3ba](https://github.com/facebook/react-native/commit/5933b6a3baaaf7071eafc7c1bde13106407759fd) by [@EvanBacon](https://github.com/EvanBacon))
- Update usage of UIApplication.sharedApplication in RCTKeyCommands ([5e79fa8441](https://github.com/facebook/react-native/commit/5e79fa84412111cf8b8ea4828d82f83672c9dc9f) by [@evoactivity](https://github.com/evoactivity))
- Change hermes logic in build scripts for Apple to use the correct files ([cc13b0273f](https://github.com/facebook/react-native/commit/cc13b0273fc533a38c06fddd5e6b74f77319afa6) by [@kelset](https://github.com/kelset))
- Fix error in the Codegen template for ThirdPartyFabricComponentsProvider ([2f6b2127d9](https://github.com/facebook/react-native/commit/2f6b2127d933094f864523749d13cfbb140b5b63) by [@gispada](https://github.com/gispada))
- `HERMES_ENABLED` check fixed in react-native-xcode.sh ([8745a148b6](https://github.com/facebook/react-native/commit/8745a148b6d8358702b5300d73f4686c3aedb413) by [@nvojnovic](https://github.com/nvojnovic))
- Make sure to turn on the `RCT_NEW_ACRH_ENABLED` flag ([f31134af7d](https://github.com/facebook/react-native/commit/f31134af7d7fbd39a09e120907bffcb8bd40108f) by [@cipolleschi](https://github.com/cipolleschi))
- Fix `Alert` not showing in an app using `UIScene` ([153aedce41](https://github.com/facebook/react-native/commit/153aedce413ef73f5e026abdfcf1346a37cec219) by [@tido64](https://github.com/tido64))
- Image Component will not update correctly when passing in new url ([5c211f2bce](https://github.com/facebook/react-native/commit/5c211f2bce6665468628bc0aa3a8174a474450af) by [@matpaul](https://github.com/matpaul))
- Fixed Time.h:52:17: error when a folder in the file path has a space ([9e169da3ae](https://github.com/facebook/react-native/commit/9e169da3ae44854e0cbfe6d95739a669290105c8) by [@gaberogan](https://github.com/gaberogan))
- Fix: RCTAlertController's UserInterfaceStyle to follow root window ([18542b6ef5](https://github.com/facebook/react-native/commit/18542b6ef5ae12f6b4b8e1ebb66ab85a2db0bd5c) by [@vonovak](https://github.com/vonovak))
- CI broken due to Hermes Commit ([ff7f5a332f](https://github.com/facebook/react-native/commit/ff7f5a332f62e7b13a52d71fabc573224f812816) by [@cipolleschi](https://github.com/cipolleschi))
- Typo in AppDelegate.mm ([0a59c284a9](https://github.com/facebook/react-native/commit/0a59c284a91acb04053bcf2f2e6c47f7f53ddbfe) by [@jeremybarbet](https://github.com/jeremybarbet))
- When source maps are enabled, clean up temporary files from the build directory. Reduces bundle size by at least 1MB. ([e0a71fc7b5](https://github.com/facebook/react-native/commit/e0a71fc7b5cb8c264000147099be5b2575931193) by [@dmytrorykun](https://github.com/dmytrorykun))
- USE_HERMES envvar check fixed in react-native-xcode.sh. Now source maps are generated by default. ([03de19745e](https://github.com/facebook/react-native/commit/03de19745eec9a0d4d1075bac48639ecf1d41352) by [@dmytrorykun](https://github.com/dmytrorykun))
- Fix keyboard accessory button not triggering onSubmitEditing ([98d74d6eb9](https://github.com/facebook/react-native/commit/98d74d6eb98c602a3c76adf54cc45767fb58b555))
- Possible fix for convertIdToFollyDynamic crash in RCTBaseTextInputView and RCTEventDispatcher ([8b174a57c8](https://github.com/facebook/react-native/commit/8b174a57c8e732bbfe7c69e7a5f66f48cb300539) by [@christophpurrer](https://github.com/christophpurrer))
- Fix exception thrown by [RCTTextView description] on macOS ([7db6c080f5](https://github.com/facebook/react-native/commit/7db6c080f5992df76b10930908c2373634cd1911) by [@christophpurrer](https://github.com/christophpurrer))
- Allow preferred Alert button regardless of the style ([653a19a8cd](https://github.com/facebook/react-native/commit/653a19a8cde60e7ab337559492c17d3aa0a860f6) by [@danilobuerger](https://github.com/danilobuerger))
- Fix `contentInsetAdjustmentBehavior` set to `automatic` on `ScrollView` in the new architecture ([27fe6f1079](https://github.com/facebook/react-native/commit/27fe6f10796ecd47314279b1ae7cdfe29c16d1f0) by [@grahammendick](https://github.com/grahammendick))
- Use readlink instead of realpath in packager.sh ([698b14789c](https://github.com/facebook/react-native/commit/698b14789cb0777961fe5f1d4363387f9f185b1b) by [@dminkovsky](https://github.com/dminkovsky))
- Fix cocoapods cli native_modules require for pnpm node_modules ([af3dfbaa47](https://github.com/facebook/react-native/commit/af3dfbaa47f4d58f3f3f892a5debd8d54113c2c3) by [@danilobuerger](https://github.com/danilobuerger))
- Use the right logic for build from source ([49c0267b66](https://github.com/facebook/react-native/commit/49c0267b6695199651e5eb3cc3bb10647fb5e37e) by [@cipolleschi](https://github.com/cipolleschi))
- Remove the hermes engine cache in the clean script ([9979e38c70](https://github.com/facebook/react-native/commit/9979e38c7093ba78db5d5b4b11456c78592ea8c5) by [@kelset](https://github.com/kelset))
- Make sure to export a single version for hermes artifacts and wipe Podfile.lock while in release ([41bf725ada](https://github.com/facebook/react-native/commit/41bf725ada85ed4752006e2c2dcf43037e5c53e4) by [@cipolleschi](https://github.com/cipolleschi))
- Let React Native decide the Hermes version to use in the Codegen ([becb47ccb6](https://github.com/facebook/react-native/commit/becb47ccb6a6ed77e81b5488561ef6d683933ffe) by [@cipolleschi](https://github.com/cipolleschi))
- Fix copy-hermes-xcode.sh ([fc1dbb8f0b](https://github.com/facebook/react-native/commit/fc1dbb8f0be19d83653566e9b4340785350c7aba) by [@dmytrorykun](https://github.com/dmytrorykun))
- Merge pull request #35188 from dmytrorykun/export-D40979350 ([151498a122](https://github.com/facebook/react-native/commit/151498a1224dde415c839833cbce36c94ed3410b) by [@cipolleschi](https://github.com/cipolleschi))
- Center text if line height isn't 0 ([70cc27c901](https://github.com/facebook/react-native/commit/70cc27c901aeb447910e30ac3ceac85990d3c16d) by [@sammy-SC](https://github.com/sammy-SC))
- Fix cleanup not working on template app ([ce3eefe12c](https://github.com/facebook/react-native/commit/ce3eefe12c89378773c83cb3311e8997fd35e2b8) by [@cipolleschi](https://github.com/cipolleschi))

### Security

- Bump terser minor version to mitigate CVE-2022-25858 ([743f9ff63b](https://github.com/facebook/react-native/commit/743f9ff63bf1e3825a1788978a9f6bad8ebddc0d) by [@GijsWeterings](https://github.com/GijsWeterings))

## v0.70.13

### Fixed

- Fix: bumped CLI to address broken backward compatibility ([549ff6380a](https://github.com/facebook/react-native/commit/549ff6380aa1cf85b86545a22fcb4a850995c8e3) by [@Titozzz](https://github.com/Titozzz))

## v0.70.12

### Fixed

#### iOS specific

- Prefer `Content-Location` header in bundle response as JS source URL ([671ea383fe](https://github.com/facebook/react-native/commit/671ea383fe45dd9834a0c0481360de050df7f0c9) by [@robhogan](https://github.com/robhogan))

## v0.70.11

### Changed

- Bump CLI to 9.3.3 and Metro do 0.72.4 ([2a9d71dc34](https://github.com/facebook/react-native/commit/2a9d71dc341992dce40038dcccefc3abfc745fe8) by [@kelset](https://github.com/kelset)) to address https://github.com/facebook/react-native/issues/36794

## v0.70.10

### Fixed

#### Android specific

- Prevent crash on OnePlus/Oppo devices in runAnimationStep ([c05d822f7d](https://github.com/facebook/react-native/commit/c05d822f7daa92e8af2ec2cd97a9897425624cc2) by [@hsource](https://github.com/hsource))

#### iOS specific

- USE_HERMES envvar check fixed in react-native-xcode.sh. ([61106ac680](https://github.com/facebook/react-native/commit/61106ac6805cddef97e16e473b155abdad701797)) by [@kidroca](https://github.com/kidroca))
- USE_HERMES envvar check fixed in react-native-xcode.sh. Now source maps are generated by default. ([8ad63714](https://github.com/facebook/react-native/commit/8ad63714ed3070aa9fdf95b702d89ef8fb423d9d)) by [@dmytrorykun](https://github.com/dmytrorykun))
- USE_HERMES envvar check fixed in react-native-xcode.sh. ([4108b3](https://github.com/facebook/react-native/commit/4108b374385f1ede69e82ca0f8ca6d6585aee8c4)) by [@dmytrorykun](https://github.com/dmytrorykun))
- When source maps are enabled, clean up temporary files from the build directory. Reduces bundle size by at least 1MB. ([bad3949](https://github.com/facebook/react-native/commit/bad39493b976b425fdf72cd8cf1543a375d612ab)) by [@dmytrorykun](https://github.com/dmytrorykun))
- Make 0.70 compatible with Xcode 15 (thanks to @AlexanderEggers for the commit in main) ([c5e549e694](https://github.com/facebook/react-native/commit/c5e549e694607cd576be8fcb5ed909fec2ed6dce))

## v0.70.9

### Changed

- Update Hermes to `hermes-2023-04-13-RNv0.70.8-c9b539bf3d7bfa4143ff1a5751886c7b2dd728a2` ([7b1441730b](https://github.com/facebook/react-native/commit/7b1441730b5b1c9d9c548dec80d597bed7d71759)), contains:
  - Remove register stack size override in hermes.cpp ([03f2df](https://github.com/facebook/hermes/commit/03f2dffc1d0ef8b2360a6790ad425ce4013e4de3))
  - Increase default max stack size ([1b759f4](https://github.com/facebook/hermes/commit/1b759f40bd2f6bb72b2a353f0d9856fcbdbb981c))

### Fixed

#### Android specific

- Resolved bug with Text components in new arch losing text alignment state. ([31a8e92cad](https://github.com/facebook/react-native/commit/31a8e92caddcdbef9fe74de53e7f412a7e998591) by [@javache](https://github.com/javache))
- Mimimize EditText Spans 9/9: Remove `addSpansForMeasurement()` ([92b8981499](https://github.com/facebook/react-native/commit/92b898149956a301a44f99019f5c7500335c5553) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize EditText Spans 8/N: CustomStyleSpan ([b384bb613b](https://github.com/facebook/react-native/commit/b384bb613bf533aebf3271ba335c61946fcd3303) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize EditText Spans 6/N: letterSpacing ([5791cf1f7b](https://github.com/facebook/react-native/commit/5791cf1f7b43aed1d98cad7bcc272d97ab659111) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 5/N: Strikethrough and Underline ([0869ea29db](https://github.com/facebook/react-native/commit/0869ea29db6a4ca20b9043d592a2233ae1a0e7a2) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 4/N: ReactForegroundColorSpan ([8c9c8ba5ad](https://github.com/facebook/react-native/commit/8c9c8ba5adb59f7f891a5307a0bce7200dd3ac7d) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 3/N: ReactBackgroundColorSpan ([cc0ba57ea4](https://github.com/facebook/react-native/commit/cc0ba57ea42d876155b2fd7d9ee78604ff8aa57a) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 1/N: Fix precedence ([1743dd7ab4](https://github.com/facebook/react-native/commit/1743dd7ab40998c4d3491e3b2c56c531daf5dc47) by [@NickGerleman](https://github.com/NickGerleman))
- Fix measurement of uncontrolled TextInput after edit ([8a0fe30591](https://github.com/facebook/react-native/commit/8a0fe30591e21b90a3481c1ef3eeadd4b592f3ed) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- Address Hermes performance regression ([1df92c6](https://github.com/facebook/react-native/commit/1df92c6948e08d42367843597fdd94dfae8b42a8) by [@kelset](https://github.com/kelset))

## v0.70.8

### Changed

#### iOS specific

- Relax Ruby requirements ([e3a5fbe72f](https://github.com/facebook/react-native/commit/e3a5fbe72f966b27b967192317d7072db52d1c8c) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

#### iOS specific

- Fix React Codegen podspec to build on Xcode 14.3 ([34f3794f18](https://github.com/facebook/react-native/commit/34f3794f18c3b6462f3fce4b8e272c65801a35f6) by [@cipolleschi](https://github.com/cipolleschi))
- Blob data is no longer prematurely deallocated when using blob.slice ([36cc71ab36](https://github.com/facebook/react-native/commit/36cc71ab36aac5e5a78f2fbae44583d1df9c3cef) by [@awinograd](https://github.com/awinograd))

## v0.70.7

### Fixed

#### Android specific

- Mitigation for Samsung TextInput Hangs ([be69c8b5a7](https://github.com/facebook/react-native/commit/be69c8b5a77ae60cced1b2af64e48b90d9955be5) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS Specific

- Fix the potential race condition when dismissing and presenting modal ([279fb52e03](https://github.com/facebook/react-native/commit/279fb52e033daba60393e400e1ee585e7d067090) by [@wood1986](https://github.com/wood1986))

### Added

#### Android Specific

- Add `POST_NOTIFICATIONS` and deprecate `POST_NOTIFICATION` ([b5280bbc93](https://github.com/facebook/react-native/commit/b5280bbc93218bd15e2166b8689c1689200bb92c) by [@dcangulo](https://github.com/dcangulo))

## v0.70.6

### Fixed

- Fixed regression: @jest/create-cache-key-function dependency was inadvertedly bumped to 29.x. We are bringing it back to 27.0.1. ([fb0e88beb9](https://github.com/facebook/react-native/commit/fb0e88beb9dc443abed3886e459e7a7715738adc) by [@kelset](https://github.com/kelset))

### Changed

- Bump version of Promise from 8.0.3 to 8.3.0, enabling `Promise.allSettled` and `Promise.any` ([475310dbba](https://github.com/facebook/react-native/commit/475310dbbaec8048411edefc6cdddab330df7966) by [@retyui](https://github.com/retyui))
- Bump CLI to 9.3.2 ([9bcc5e0373](https://github.com/facebook/react-native/commit/9bcc5e037391b45315dac3cb5f566e290cbf48cb) by [@kelset](https://github.com/kelset))

#### iOS specific

- Cleanup codegen build folder before installing the pods ([0e316ec671](https://github.com/facebook/react-native/commit/0e316ec671617f5e7c1985b4b05cd0d45bcea403) by [@cipolleschi](https://github.com/cipolleschi))

## v0.70.5

### Fixed

- Force dependencies resolution to minor series for 0.70 ([59407a4d34](https://github.com/facebook/react-native/commit/59407a4d3442dddb7f4c29049bf56bbc345f950f) by [@cortinico](https://github.com/cortinico))

## v0.70.4

### Changed

- Bump CLI to 9.2.1 ([a24c8946e0](https://github.com/facebook/react-native/commit/a24c8946e065ca89048e574abd7c2dc0434a350b) by [@kelset](https://github.com/kelset))
- Bump react-native-codegen to 0.70.6 ([866021b58c](https://github.com/facebook/react-native/commit/866021b58c28a1f1c394294ddc4ed69d4ecef10a) by [@dmytrorykun](https://github.com/dmytrorykun))

### Fixed

- Load react-native.config.js from correct path during codegen ([74fda10702](https://github.com/facebook/react-native/commit/74fda1070266df13e1b58680a670dde3acf9d205) by [@krystofwoldrich](https://github.com/krystofwoldrich))

#### iOS specific

- Fix error in the Codegen template for ThirdPartyFabricComponentsProvider ([2f6b2127d9](https://github.com/facebook/react-native/commit/2f6b2127d933094f864523749d13cfbb140b5b63) by [@gispada](https://github.com/gispada))
- Center text if line height isn't 0 ([70cc27c901](https://github.com/facebook/react-native/commit/70cc27c901aeb447910e30ac3ceac85990d3c16d) by [@sammy-SC](https://github.com/sammy-SC))

## v0.70.3

### Fixed

- Stop styles from being reset when detaching Animated.Values in old renderer ([2f58e52006](https://github.com/facebook/react-native/commit/2f58e520061a31ab90f7bbeef59e2bf723605106) by [@javache](https://github.com/javache))
- Revert "Fix TextInput dropping text when used as uncontrolled component with `defaultValue`" to fix TextInputs not being settable to undefined programmatically ([e2645a5](https://github.com/facebook/react-native/commit/e2645a59f6211116d2069967443502910c167d6f)) by Garrett Forbes Monroe

#### Android specific

- Use NMake generator for Hermes build on Windows ([9d08d55bbe](https://github.com/facebook/react-native/commit/9d08d55bbef4e79a8843deef90bef828f7b9a6ef) by [@mganandraj](https://github.com/mganandraj))
- Fixing failure building RN codegen CLI on Windows ([85c0c0f21f](https://github.com/facebook/react-native/commit/85c0c0f21fdb52543e603687a3c42dc40dff572b) by [@mganandraj](https://github.com/mganandraj))

#### iOS specific

- Add xcode 14 workaround (turn off signing resource bundles) for `React-Core` ([967de03f30](https://github.com/facebook/react-native/commit/967de03f304404ac8817936da37ca39514a09e33) by [@kelset](https://github.com/kelset))

## v0.70.2

### Added

#### iOS specific

- Add support for "Prefer Cross-Fade Transitions" into AccessibilityInfo ([be7c50fefd](https://github.com/facebook/react-native/commit/be7c50fefd7f13201fb538ded93d91b374341173) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### Changed

- Bump CLI to 9.1.3 and Metro to 0.72.3 ([f164556037](https://github.com/facebook/react-native/commit/f1645560376b734a87f0eba1fef69f6cba312cc1) by [@kelset](https://github.com/kelset))

### Fixed

- Inform ScrollView of Keyboard Events Before Mount ([26d148029c](https://github.com/facebook/react-native/commit/26d148029c7fde117f33b0d6c8b34286c45a0ef2) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- Fix port as -1 if dev server without specifying port on Android ([3d7e1380b4](https://github.com/facebook/react-native/commit/3d7e1380b4e609f5340ee80c19d566b17e620427) by [@Kudo](https://github.com/Kudo))

## v0.70.1

### Added

- Add more debugging settings for *HermesExecutorFactory* ([32d12e89f8](https://github.com/facebook/react-native/commit/32d12e89f864a106433c8e54c10691d7876333ee) by [@Kudo](https://github.com/Kudo))
- Support TypeScript array types for turbo module (component only) ([33d1291e1a](https://github.com/facebook/react-native/commit/33d1291e1a96497a4f994e9d622248a745ee1ea6) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))

### Changed

- Accept TypeScript type `T | null | undefined` as a maybe type of T in turbo module. ([9ecd203eec](https://github.com/facebook/react-native/commit/9ecd203eec97e7d21d10311d950c9f8f30c7a4b1) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Bump react-native-gradle-plugin to 0.70.3 ([e33633644c](https://github.com/facebook/react-native/commit/e33633644c70ea39af6e450fcf31d9458051fd5f) by [@dmytrorykun](https://github.com/dmytrorykun))
- Bump react-native-codegen to 0.70.5 ([6a8c38eef2](https://github.com/facebook/react-native/commit/6a8c38eef272e79e52a35941afa9c3fe9e8fc191) by [@dmytrorykun](https://github.com/dmytrorykun))
- Hermes version bump for 0.70.1 ([5132211228](https://github.com/facebook/react-native/commit/5132211228a5b9e36d58c1f7e2c99ccaabe1ba3d) by [@dmytrorykun](https://github.com/dmytrorykun))

### Fixed

- Fix hermes profiler ([81564c1a3d](https://github.com/facebook/react-native/commit/81564c1a3dae4222858de2a9a34089097f665e82) by [@janicduplessis](https://github.com/janicduplessis))

#### Android specific

- Support PlatformColor in borderColor ([2d5db284b0](https://github.com/facebook/react-native/commit/2d5db284b061aec33af671b25065632e20217f62) by [@danilobuerger](https://github.com/danilobuerger))
- Avoid crash in ForwardingCookieHandler if webview is disabled ([5451cd48bd](https://github.com/facebook/react-native/commit/5451cd48bd0166ba70d516e3a11c6786bc22171a) by [@Pajn](https://github.com/Pajn))
- Correctly resolve classes with FindClass(..) ([361b310bcc](https://github.com/facebook/react-native/commit/361b310bcc8dddbff42cf63495649291c894d661) by [@evancharlton](https://github.com/evancharlton))

#### iOS specific

- Fix KeyboardAvoidingView height when "Prefer Cross-Fade Transitions" is enabled ([4b9382c250](https://github.com/facebook/react-native/commit/4b9382c250261aab89b271618f8b68083ba01785) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Fix React module build error with swift integration on new architecture mode ([3afef3c167](https://github.com/facebook/react-native/commit/3afef3c16702cefa5115b059a08741fba255b2db) by [@Kudo](https://github.com/Kudo))
- Fix ios pod install error ([0cae4959b7](https://github.com/facebook/react-native/commit/0cae4959b750ea051dcd04e4c9374e02b1de6e7a) by [@Romick2005](https://github.com/Romick2005))

## 0.70.0

### Breaking

- Remove jest/preprocessor from the react-native package ([0301cb285b](https://github.com/facebook/react-native/commit/0301cb285b2e85b48a397fe58d565196654d9754) by [@motiz88](https://github.com/motiz88))
- Remove nonstandard Promise.prototype.done ([018d5cf985](https://github.com/facebook/react-native/commit/018d5cf985497273dd700b56168cf1cf64f498d5) by [@motiz88](https://github.com/motiz88))

### Added

- Support TypeScript array types for turbo module (module only) ([f0c4c291e1](https://github.com/facebook/react-native/commit/f0c4c291e12a8e76f91d3841d65291f0f1f16714) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Added files for `avn`, `nodenv`, and other managers that set the node.js version in reactive native project including testing ([933fbb1b2b](https://github.com/facebook/react-native/commit/933fbb1b2b4d2b7c802bf1f2be4c47e5b442a850) by [@ramonmedel](https://github.com/ramonmedel))
- Support BigInt in Hermes ([11bae63bb1](https://github.com/facebook/react-native/commit/11bae63bb1f833802ec6ce01342ebdd1d61e9252) by [@jpporto](https://github.com/jpporto))
- The old Hermes instrumented stats migrated to the new one ([c37f719567](https://github.com/facebook/react-native/commit/c37f7195675df67d23c3c008ec5ab5fd7b8d0394) by [@jpporto](https://github.com/jpporto))
- Modified **getDefaultJSExecutorFactory** method ([87cfd386cb](https://github.com/facebook/react-native/commit/87cfd386cb2e02bfa440c94706d9d0274f83070c) by [@KunalFarmah98](https://github.com/KunalFarmah98))
- `EventEmitter#emit` now freezes the set of listeners before iterating over them, meaning listeners that are added or removed will not affect that iteration. ([e5c5dcd9e2](https://github.com/facebook/react-native/commit/e5c5dcd9e26e9443f59864d9763b049e0bda98e7) by [@yungsters](https://github.com/yungsters))
- Added File and Blob globals to eslint community config ([d881c87231](https://github.com/facebook/react-native/commit/d881c872314e55e17b198a41c86528d79092d222) by [@shamilovtim](https://github.com/shamilovtim))
- C++ TurboModule methods can now use mixed types ([3c569f546c](https://github.com/facebook/react-native/commit/3c569f546ca78b23fbcb9773a1273dd9710f8c60) by [@appden](https://github.com/appden))
- Add useNativeDriver as a param for setValue for Animated ([73191edb72](https://github.com/facebook/react-native/commit/73191edb7255b1ba5e9a0955a25c14250186a676) by [@genkikondo](https://github.com/genkikondo))
- Add `Animated.Numeric` Flow type ([9eb7629ac6](https://github.com/facebook/react-native/commit/9eb7629ac66abc23b91b81d420891d68bbd4f578) by [@motiz88](https://github.com/motiz88))
- Add LTI annotations to function params ([c940eb0c49](https://github.com/facebook/react-native/commit/c940eb0c49518b82a3999dcac3027aa70018c763), [e7a4dbcefc](https://github.com/facebook/react-native/commit/e7a4dbcefc9e393c41f4a796d522211bc1e60b6f), [d96744e277](https://github.com/facebook/react-native/commit/d96744e27711c4fa4dfad1b5a796283a232e60af) by [@pieterv](https://github.com/pieterv))

#### Android specific

- Accessibility announcement for list and grid in FlatList ([2d5882132f](https://github.com/facebook/react-native/commit/2d5882132fb2c533fe9bbba83576b8fac4aca727), [105a2397b6](https://github.com/facebook/react-native/commit/105a2397b6b187a9669ba1c028508a7bb9664009) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Add READ_VOICEMAIL and WRITE_VOICEMAIL permissions to PermisionsAndroid library. ([8a2be3e143](https://github.com/facebook/react-native/commit/8a2be3e1438dd145ccb5374d6ef60811047d23aa) by [@zolbooo](https://github.com/zolbooo))
- Add POST_NOTIFICATIONS, NEARBY_WIFI_DEVICES permission ([0a854c7c8b](https://github.com/facebook/react-native/commit/0a854c7c8b7ffc382c43fa460651a4b4de34c3c7) by [@vincent-paing](https://github.com/vincent-paing))
- Extend the React Native Gradle plugin to accept a config from package.json ([5f3c5aa529](https://github.com/facebook/react-native/commit/5f3c5aa529ed75414eb339c3d8fd2c9628534621) by [@cortinico](https://github.com/cortinico))
- Ability to pass a Typeface object to ReactFontManager in addition to a font resource ID ([e2dd2e2a6e](https://github.com/facebook/react-native/commit/e2dd2e2a6ed17b366a3e2ec0942ea1d82a404c5d) by [@thurn](https://github.com/thurn))
- Option to enable lazyViewManager support with `ViewManagerOnDemandReactPackage` ([d4b59cd9d0](https://github.com/facebook/react-native/commit/d4b59cd9d02a8c4eda3ac4bf89cfe8161847adf0) by [@javache](https://github.com/javache))
- Support for dataUri in form data ([c663c0ec9d](https://github.com/facebook/react-native/commit/c663c0ec9deee7281f819f222bb29ad79e99f3b8) by [@hetanthakkar1](https://github.com/hetanthakkar1))
- Add android-only prop documentation at the TextInput js level. ([f2e23215ca](https://github.com/facebook/react-native/commit/f2e23215ca14c3c630aa931cdd114187589ac0fb))
- Update template to gitignore `android/app/.cxx` ([542d43df9d](https://github.com/facebook/react-native/commit/542d43df9d84a88f742c273391f2596546b4c804) by [@leotm](https://github.com/leotm))

#### iOS specific

- Add Mac Catalyst compatibility (can be enabled in Podfile) ([2fb6a3393d](https://github.com/facebook/react-native/commit/2fb6a3393d545a93518d1b2906bd9453458660a0) by [@Arkkeeper](https://github.com/Arkkeeper))
- Enabled Hermes Intl ([3fa3aeba93](https://github.com/facebook/react-native/commit/3fa3aeba93f226b97e324f3643b98382947e5985) by [@neildhar](https://github.com/neildhar))
- HTTP Response headers added to the error object passed to JS code. ([9eb2826f9b](https://github.com/facebook/react-native/commit/9eb2826f9beac5b7476f33e68803ca5a024867db))
- Add userInterfaceStyle to Alert to override user interface style for iOS 13+ ([47bd78f64f](https://github.com/facebook/react-native/commit/47bd78f64f334b770edc7fabd4b9cceb07a7a503) by [@luoxuhai](https://github.com/luoxuhai))
- Add function to cleanup codegen folders ([71692889b0](https://github.com/facebook/react-native/commit/71692889b0d89b033c07ef87ee3dbf6d62d79235) by [@cipolleschi](https://github.com/cipolleschi))
- Cocoapods function to add the `CLANG_CXX_LANGUAGE_STANDARD` to all the targets if needed ([ca8174e15f](https://github.com/facebook/react-native/commit/ca8174e15f77cbeecb7ff7a5a583abb668817777) by [@f-meloni](https://github.com/f-meloni))
- Support codegen from a single folder ([05aaba9514](https://github.com/facebook/react-native/commit/05aaba95145df0b7f541e391a9f64ba3402cac35) by [@cipolleschi](https://github.com/cipolleschi))
- Run script phases tests in CI ([c171a6e157](https://github.com/facebook/react-native/commit/c171a6e1572f64b2ab9b26d431c07581d4ae832b) by [@cipolleschi](https://github.com/cipolleschi))

### Changed

- Bump React Native Codegen to 0.70.0 ([a22ceecc84](https://github.com/facebook/react-native/commit/a22ceecc849fc62c926643f4d121cf1e4575c693) by [@dmytrorykun](https://github.com/dmytrorykun), [2a274c1a08](https://github.com/facebook/react-native/commit/2a274c1a082c3291d2df1a4b960bf654e217a4dd) by [@cortinico](https://github.com/cortinico), [ce4246a05c](https://github.com/facebook/react-native/commit/ce4246a05c96cd6fe805499960b105267ac044bb) by [@dmytrorykun](https://github.com/dmytrorykun))
- Upgrade RN CLI to v9.0.0, Metro to 0.72.1 ([0c2fe96998](https://github.com/facebook/react-native/commit/0c2fe969984fff0676f99fe034b3e49d38ed7db6) by [@thymikee](https://github.com/thymikee), [7e580b97bf](https://github.com/facebook/react-native/commit/7e580b97bf63436978d053926e04adeb9ae6f75f) by [@kelset](https://github.com/kelset), [c504d038c4](https://github.com/facebook/react-native/commit/c504d038c470f7a13fb345f57261172c7c85248c) by [@thymikee](https://github.com/thymikee), [f1d624823f](https://github.com/facebook/react-native/commit/f1d624823fe23eb3d30de00cf78beb71dc1b8413) by [@kelset](https://github.com/kelset), [2b49ac6f8b](https://github.com/facebook/react-native/commit/2b49ac6f8b04953be4cd5bf0b1325986b117763c) by [@thymikee](https://github.com/thymikee))
- Doc: fix minimum iOS version in requirements section ([ec3c8f4380](https://github.com/facebook/react-native/commit/ec3c8f43800a027a0a717367360421089e7293fd) by [@Simon-TechForm](https://github.com/Simon-TechForm))
- Remove "Early" in Js error reporting pipeline ([0646551d76](https://github.com/facebook/react-native/commit/0646551d7690cd54847eb468f8e43d71ebebdda9) by [@sshic](https://github.com/sshic))
- Update @react-native/eslint-plugin-specs to 0.70.0 ([d07fae9b23](https://github.com/facebook/react-native/commit/d07fae9b23c258a60045b666167efd5259b962ce), [afd76f69c7](https://github.com/facebook/react-native/commit/afd76f69c7d2408654ba67ac2ed4d612abfbe0ce) by [@dmytrorykun](https://github.com/dmytrorykun), [ea8d8e2f49](https://github.com/facebook/react-native/commit/ea8d8e2f49ea3ce15faeab500b661a1cacacf8a8) by [@cortinico](https://github.com/cortinico))
- Do not depend on hermes-engine NPM package anymore ([78cd689f9a](https://github.com/facebook/react-native/commit/78cd689f9a634b152ea09ed6cb4fa858ee26e653) by [@cortinico](https://github.com/cortinico))
- Add ability to pass `ItemSeparatorComponent` as React Element ([5854b11bf9](https://github.com/facebook/react-native/commit/5854b11bf9d42bab9dbe62b9152a3d3a94e42c13) by [@retyui](https://github.com/retyui))
- Hermes version bump. ([0b4b7774e2](https://github.com/facebook/react-native/commit/0b4b7774e2d71259962ed36b7acb5c3989c3be9c) by [@dmytrorykun](https://github.com/dmytrorykun), [8c682ddd59](https://github.com/facebook/react-native/commit/8c682ddd599b75a547975104cb6f90eec8753daf) by [@dmytrorykun](https://github.com/dmytrorykun), [eb6767813a](https://github.com/facebook/react-native/commit/eb6767813a0efe04a9e79955b8f6ee909a4a76bf) by [@cortinico](https://github.com/cortinico))
- Codemod `{...null}` to `{}` in xplat/js ([f392ba6725](https://github.com/facebook/react-native/commit/f392ba67254e95126974fafabf3e4ef0300e24e8) by [@gkz](https://github.com/gkz))
- Fix TextInput dropping text when used as uncontrolled component with `defaultValue` ([51f49ca998](https://github.com/facebook/react-native/commit/51f49ca9982f24de08f5a5654a5210e547bb5b86))
- Suppress errors ahead of launch ([67e12a19cb](https://github.com/facebook/react-native/commit/67e12a19cb236fbe0809fbbc9e516b37a5848a6a) by [@gkz](https://github.com/gkz))
- Suppress missing 'this' annotations ([6c563a507f](https://github.com/facebook/react-native/commit/6c563a507fd8c41e04a1e62e2ba87993c6eb1e2f) by [@pieterv](https://github.com/pieterv))
- Suppress missing annotations ([66c6a75650](https://github.com/facebook/react-native/commit/66c6a75650f91d61e7e87a8e661d87101e26cf9c) by [@pieterv](https://github.com/pieterv))
- Use RuntimeConfig instead of VM Experiment Flag to set up the micro task queue. ([753038cf34](https://github.com/facebook/react-native/commit/753038cf345a45d95ab9b9343447f524e1b36840) by [@fbmal7](https://github.com/fbmal7))
- Update direct Metro dependencies to 0.72.0 ([05dcebc211](https://github.com/facebook/react-native/commit/05dcebc21175a78c6533a8856aed644c45276169) by [@kelset](https://github.com/kelset), [64788cc9fe](https://github.com/facebook/react-native/commit/64788cc9fe42fbedc3e3b1c9c516a079cfa71cd1) by [@huntie](https://github.com/huntie), [bdeb4e0655](https://github.com/facebook/react-native/commit/bdeb4e065532dfb1bb4c9c1e87e8a869a737e48a) by [@jacdebug](https://github.com/jacdebug), [894f652639](https://github.com/facebook/react-native/commit/894f6526399098d825ef32c02eb201cd8ba41873) by [@robhogan](https://github.com/robhogan), [08ebc1cfd8](https://github.com/facebook/react-native/commit/08ebc1cfd88a629389c43abf23b40a2bdf1b1579) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- ECOSYSTEM.md: update Partner entries ([5471afeebf](https://github.com/facebook/react-native/commit/5471afeebf59853ce31df1ade6a4591414b6aa2f) by [@Simek](https://github.com/Simek))
- Move ScrollView's contentOffset to common props ([7c581f3d30](https://github.com/facebook/react-native/commit/7c581f3d3007954413d68daf2e868ce93e120615) by [@genkikondo](https://github.com/genkikondo))
- Upgrade react-native-gradle-plugin to 0.70.2 ([1518f838b7](https://github.com/facebook/react-native/commit/1518f838b70951882f7b414c90407d3eb584cab4), [2176173dcc](https://github.com/facebook/react-native/commit/2176173dcc029ab21bfcdfe5c9e150581db47409) by [@dmytrorykun](https://github.com/dmytrorykun))
- Update a few metro deps as follow up from the commit from main ([7c7ba1babd](https://github.com/facebook/react-native/commit/7c7ba1babd41b6b60f0dc9f48c34d00235d2fef5) by [@kelset](https://github.com/kelset))

#### Android specific

- Bump Android Gradle Plugin to 7.2.1 ([53c8fc9488](https://github.com/facebook/react-native/commit/53c8fc94882893dd8c337fd29543ae11fd467267) by [@leotm](https://github.com/leotm), [c274456e5b](https://github.com/facebook/react-native/commit/c274456e5b635825560852baa5787e96640800d8) by [@dulmandakh](https://github.com/dulmandakh))
- Rename NativeModuleCallExceptionHandler to JSExceptionHandler for broader usage ([b6f7689d70](https://github.com/facebook/react-native/commit/b6f7689d701d0409c23ab364356aeb95710c20fa) by [@sshic](https://github.com/sshic))
- Simplify the Android.mk file in the App Template ([7fb0bb40d2](https://github.com/facebook/react-native/commit/7fb0bb40d2206c734a1feb6b555c22d6d5f2436e) by [@cortinico](https://github.com/cortinico))
- Make Hermes the default engine on Android ([a7db8df207](https://github.com/facebook/react-native/commit/a7db8df2076f68ae9451ce1c77d7eb09d8cfeb14) by [@cortinico](https://github.com/cortinico))
- Revamp touch event dispatching methods ([089ff4555a](https://github.com/facebook/react-native/commit/089ff4555af27eec4561b1627298702b4ecee482) by [@sshic](https://github.com/sshic))
- Demonstrating Dark Mode correctly in the `StatusBar` for the starter template App. ([763dc52387](https://github.com/facebook/react-native/commit/763dc5238721a21847b6d6670b5fa268e3bf2ed4) by [@mrbrentkelly](https://github.com/mrbrentkelly))
- Bump Gradle to 7.5.0 ([5c8186623a](https://github.com/facebook/react-native/commit/5c8186623ae15388949cfc4143edae86863a447b) by [@leotm](https://github.com/leotm), [99e7373dd2](https://github.com/facebook/react-native/commit/99e7373dd2f20184153377109e0e8e48b5bf46f7) by [@dulmandakh](https://github.com/dulmandakh))
- Generalized the return type of ViewManagerOnDemandReactPackage.getViewManagerNames ([51e029ec3c](https://github.com/facebook/react-native/commit/51e029ec3ce42ae8df3d367d8f553ec2148eeafc) by [@javache](https://github.com/javache))
- Don't assert on current activity when call startActivityForResult ([bf6884dc90](https://github.com/facebook/react-native/commit/bf6884dc903154ae32daa50ce7983a9f014be781) by [@sshic](https://github.com/sshic))
- Adapt template to new architecture autolinking on Android ([9ad7cbc3eb](https://github.com/facebook/react-native/commit/9ad7cbc3eb365190e0bfe290e1025553a807b298) by [@thymikee](https://github.com/thymikee))
- Replaced reactnativeutilsjni with reactnativejni in the build process to reduce size ([54a4fcbfdc](https://github.com/facebook/react-native/commit/54a4fcbfdcc8111b3010b2c31ed3c1d48632ce4c) by [@SparshaSaha](https://github.com/SparshaSaha))
- Bump Soloader to 0.10.4 ([b9adf2db20](https://github.com/facebook/react-native/commit/b9adf2db20bf9e1436fa58182d886fd9461df9af) by [@mikehardy](https://github.com/mikehardy))
- Update the new app template to use CMake instead of Android.mk ([dfd7f70eff](https://github.com/facebook/react-native/commit/dfd7f70effeacfeb06d9c2d4762a279a079ee004) by [@cortinico](https://github.com/cortinico))
- Refactored usage of kotlin plugin ([be35c6dafb](https://github.com/facebook/react-native/commit/be35c6dafbdb46d2ec165460d4bb12f34de6e878) by [@hurali97](https://github.com/hurali97))
- Bump Gradle to 7.5.1 ([7a911e0730](https://github.com/facebook/react-native/commit/7a911e073094b533cb5a7ce76932c02f83f4fe5d) by [@AlexanderEggers](https://github.com/AlexanderEggers))
- Fix error of release builds with Hermes enabled for Windows users ([7fcdb9d9d8](https://github.com/facebook/react-native/commit/7fcdb9d9d8f964d24a5ec3d423c67f49b7650ed8) by [@JoseLion](https://github.com/JoseLion))

#### iOS specific

- Move and test Hermes setup from react_native_pods script into a dedicated file ([468b86bd37](https://github.com/facebook/react-native/commit/468b86bd3710b1d43a492c94fb314cc472f03b86) by [@cipolleschi](https://github.com/cipolleschi))
- Use the correct operator to decide whether Hermes is enabled or not. ([61488449b9](https://github.com/facebook/react-native/commit/61488449b996da5881e4711e0813e9c90b6e57a1) by [@cipolleschi](https://github.com/cipolleschi))
- Hermes is now the default engine on iOS. This setting is controlled via `flags[:hermes_enabled]` in the Podfile. ([1115bc77db](https://github.com/facebook/react-native/commit/1115bc77db1090042effc021837f70b28694fa09) by [@hramos](https://github.com/hramos))
- Move LocalPodspecPatch to dedicated file ([8fe2b591c7](https://github.com/facebook/react-native/commit/8fe2b591c7e073d629e95cd7b67aa1dfa96ece38) by [@cipolleschi](https://github.com/cipolleschi))
- Move the `modify_flags_for_new_architecture` method to separate ruby file ([71da21243c](https://github.com/facebook/react-native/commit/71da21243c85283445c6cefa64d1ace13823ab69) by [@cipolleschi](https://github.com/cipolleschi))
- Refactoring part of the react_native_pods.rb script ([4f732ba9ee](https://github.com/facebook/react-native/commit/4f732ba9ee2a1e162729c97d5c12ea771b3a424a), [7a2704455f](https://github.com/facebook/react-native/commit/7a2704455f3edf203d2ecc8135fabf2667f718d8) by [@cipolleschi](https://github.com/cipolleschi))
- When Hermes is enabled, it will use the same copy of JSI as React Native ([340612a200](https://github.com/facebook/react-native/commit/340612a200505ca829bae1f9bce800d3673dac04) by [@hramos](https://github.com/hramos))
- Move `use_flipper` logic inside `use_react_native` and simplify the Flipper dependencies logic ([0bd5239553](https://github.com/facebook/react-native/commit/0bd523955385a3b1e622077b7ee4ea0df3c5c158) by [@f-meloni](https://github.com/f-meloni))
- Export `flipper.rb` script file ([e07a7eb16b](https://github.com/facebook/react-native/commit/e07a7eb16b97e1222e23f935a3d4bb3dac848ef2) by [@cipolleschi](https://github.com/cipolleschi))
- Use `outputDir` as base directory for the codegen and remove the possibility to customize the intermediate path. The generated code requires specific paths in the `#include` directive. ([e4d0153a67](https://github.com/facebook/react-native/commit/e4d0153a675fbdd8718f433b2e9f8bfdccec4b2f) by [@cipolleschi](https://github.com/cipolleschi))
- Refactor part of the codegen scripts and add tests. ([0465c3fd10](https://github.com/facebook/react-native/commit/0465c3fd102525b005826f3c68923d7e9851d6b8), [305a054865](https://github.com/facebook/react-native/commit/305a0548652a405d9f638fb2c054781951dfc996) by [@cipolleschi](https://github.com/cipolleschi))
- CodeGen now supports the `"all"` library type. ([6718500eaa](https://github.com/facebook/react-native/commit/6718500eaaeb92b8a74320dcee961ac96f6f12fa) by [@cipolleschi](https://github.com/cipolleschi))
- Fix the test_ios_unit test ([fdbe4719e2](https://github.com/facebook/react-native/commit/fdbe4719e2e2b599e86d42c49d42c4da97ef431a) by [@cipolleschi](https://github.com/cipolleschi))
- Update Podfile to allow `PRODUCTION=1 pod install` ([77752fc403](https://github.com/facebook/react-native/commit/77752fc4037e66d5b0a5851bae79c4d3285ed334) by [@leotm](https://github.com/leotm))
- Destruct use_reactnative parameters and ad ddocumentation ([79a37e5a88](https://github.com/facebook/react-native/commit/79a37e5a88e179090ade7145a453a46719c87b3f) by [@cipolleschi](https://github.com/cipolleschi))
- Move codegen in separate files ([7d069b2583](https://github.com/facebook/react-native/commit/7d069b25835ad20654a46ebb1e09631d826598e0) by [@cipolleschi](https://github.com/cipolleschi))
- Silence warning due to react-native internal details. ([a4599225f5](https://github.com/facebook/react-native/commit/a4599225f5a6a2d6801dd80b7728c1bbe5b2ec3a) by [@cipolleschi](https://github.com/cipolleschi))

### Removed

- Remove previously deprecated Transform style-attribute props ([7cfd77debd](https://github.com/facebook/react-native/commit/7cfd77debd36f867f5ddfdb9cc44fbe6137aaeba) by [@Zachinquarantine](https://github.com/Zachinquarantine))
- Remove deprecated `isTVOS` constant. ([6075d64acf](https://github.com/facebook/react-native/commit/6075d64acf6f8d74e18ef6568c9438f73fe56d44) by [@Zachinquarantine](https://github.com/Zachinquarantine))
- The diffs renames the required variable which was causing conflicts in names with Apple core SDK's ([086c13dd5f](https://github.com/facebook/react-native/commit/086c13dd5fba3f77acbc70c9bdedc9299118b526) by [@arinjay](https://github.com/arinjay))
- Removed `EventEmitter.prototype.removeSubscription` method. ([870755fa7e](https://github.com/facebook/react-native/commit/870755fa7e7011ac46d269d5fb66d2a1d1543442) by [@yungsters](https://github.com/yungsters))
- Remove deprecated removeListener methods ([2596b2f695](https://github.com/facebook/react-native/commit/2596b2f6954362d2cd34a1be870810ab90cbb916) by [@matinzd](https://github.com/matinzd))
- Remove APPLETVOS variants from BUCk targets. ([cf2e27c388](https://github.com/facebook/react-native/commit/cf2e27c3888ded6f851ba267597ef13f1d0cfd8c) by [@d16r](https://github.com/d16r))

#### iOS specific

- Remove `emulateUnlessSupported` ([c73e021a4b](https://github.com/facebook/react-native/commit/c73e021a4b11bbae3a7868670d140fe3d5dac6ae) by [@ken0nek](https://github.com/ken0nek))
- Remove USE_CODEGEN_DISCOVERY flag ([2e720c3610](https://github.com/facebook/react-native/commit/2e720c361001d996ed35d8bfbf4dc67c31fb895d) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

- Throw JSINativeException from asHostObject ([ef6ab3f5ca](https://github.com/facebook/react-native/commit/ef6ab3f5cad968d7b2c9127d834429b0f4e1b2cf) by [@neildhar](https://github.com/neildhar))
- Use new Babel parser instead of deprecated one ([97291bfa31](https://github.com/facebook/react-native/commit/97291bfa3157ac171a2754e19a52d006040961fb) by [@Kerumen](https://github.com/Kerumen))
- Fixed a crash on deserialization of props when using 'px'/'em' units. ([70788313fe](https://github.com/facebook/react-native/commit/70788313fedd40fe2e6d1cf15980ce3cca5adaac) by [@nlutsenko](https://github.com/nlutsenko))
- Fix nullability lost on readonly types in TurboModule specs ([c006722e6c](https://github.com/facebook/react-native/commit/c006722e6cdbe02711cb50ea7a739e0d4d81c7e7) by [@appden](https://github.com/appden))
- Make tests pass for windows ([9596bf045d](https://github.com/facebook/react-native/commit/9596bf045d527e27608ac4b7b2990a4e6846fdeb) by [@cipolleschi](https://github.com/cipolleschi))
- Handle possible null exception on ReactEditText with AppCompat 1.4.0 ([24a1f5c66c](https://github.com/facebook/react-native/commit/24a1f5c66c8633f9b41eef45df3297ffc1d2b606) by [@mikemasam](https://github.com/mikemasam))
- Fixed the disappearance of items when scrolling after zooming VirtualizedList. ([13a72e0ccc](https://github.com/facebook/react-native/commit/13a72e0ccceb2db6aeacd03b4f429d200392c17b) by [@islandryu](https://github.com/islandryu))
- Improved Flow type inference in Animated `.interpolate()` ([7b86fa2b79](https://github.com/facebook/react-native/commit/7b86fa2b795647f5c89e04e4c3ee4b83bc27ef77) by [@motiz88](https://github.com/motiz88))
- Add Jest mock for Vibration module ([79529a1c77](https://github.com/facebook/react-native/commit/79529a1c77e7e1b174fdbe8103a2199c9ac924ff) by [@hduprat](https://github.com/hduprat))
- Allow ReactInstrumentationTest to use custom JSIModules ([eb2a83b0be](https://github.com/facebook/react-native/commit/eb2a83b0be4658654fc6ca6f4671e45f1898798d) by [@christophpurrer](https://github.com/christophpurrer))
- Working around Long paths limitation on Windows ([883a93871c](https://github.com/facebook/react-native/commit/883a93871cb1fbca4434600a322f63afbba333da) by [@mganandraj](https://github.com/mganandraj))
- Fix eslint-plugin-specs prepack npm lifecycle hook now that we use npm 8 ([8441c4a6f7](https://github.com/facebook/react-native/commit/8441c4a6f7bfeda73f89f076fe7d8d1132e4b9be) by [@kelset](https://github.com/kelset))
- Codegen should ignore `.d.ts` files ([0f0d52067c](https://github.com/facebook/react-native/commit/0f0d52067cb89fdb39a99021f0745282ce087fc2) by [@tido64](https://github.com/tido64))
- Avoid full copy of large folly::dynamic objects in JSIExecutor#defaultTimeoutInvoker ([521011d4cc](https://github.com/facebook/react-native/commit/521011d4cc713dfce97dc8872fd0f5171e587b5d) by [@christophpurrer](https://github.com/christophpurrer))

#### Android specific

- Fixed HorizontalScrollView API scrollToEnd causing NPE in side-effects. ([e5ba6ab7b4](https://github.com/facebook/react-native/commit/e5ba6ab7b482c380e35765b898e522e9d4e1d3b0) by [@ryancat](https://github.com/ryancat))
- Fix InputAccessoryView crash on Android ([afa5df1764](https://github.com/facebook/react-native/commit/afa5df1764324f2574d102abeae7199d4b02d183) by [@hduprat](https://github.com/hduprat))
- Bring back non-rootview touch handling based on reactTag ([8b837268b4](https://github.com/facebook/react-native/commit/8b837268b49fd4e72a05f955c20702c457a68fab) by [@fkgozali](https://github.com/fkgozali))
- Make Text not focusable by default ([8ced165e53](https://github.com/facebook/react-native/commit/8ced165e53135d9d33cfdc55a9d4660f8eb5b3c5) by [@kacieb](https://github.com/kacieb))
- Revert [PR 33924](https://github.com/facebook/react-native/pull/33924) because of issues with TextInputs with numeric keyboard types not respecting the secureTextEntry prop ([edb27e3aa1](https://github.com/facebook/react-native/commit/edb27e3aa1210ef33d55c1840065457c31b19cb0) by [@charlesbdudley](https://github.com/charlesbdudley))
- Fix edge case when we enqueue a pending event to views on stopped surface ([ea7c9f2ad9](https://github.com/facebook/react-native/commit/ea7c9f2ad9a78b16234306932edc1d78b783ac27) by [@ryancat](https://github.com/ryancat))
- Fix a bug where the keyboard, once set as email, won't change back to default. ([ec307e0167](https://github.com/facebook/react-native/commit/ec307e0167deca7f17640cd3c5a60f6be5f47b62) by [@larkox](https://github.com/larkox))
- NPE in `ReactEditText.setInputType` when React Native is used with some versions of a AppCompat 1.4.x. (and possibly others) ([92ebb298e2](https://github.com/facebook/react-native/commit/92ebb298e2e5ad640754e09ce3a37d3de1d28f58))
- Fix NPE on `ReactEditText` due to null mFabricViewStateManager ([ba6bf5a3ce](https://github.com/facebook/react-native/commit/ba6bf5a3ce7039a7e407a6632ee41aa3d504f833) by [@cortinico](https://github.com/cortinico))
- Scroll views would still receive scroll events when nested in a view with `pointer-events: "none"` ([fced96bf52](https://github.com/facebook/react-native/commit/fced96bf5202e8b89b804ccc1004abacc9f91660) by [@javache](https://github.com/javache))
- Fixed an edge case that event dispatching is failed after pre-allocation of a view and before the view is mounted. ([a093fe5f2f](https://github.com/facebook/react-native/commit/a093fe5f2fae4e9996b0cbffdfccdce8e58e8cf1) by [@ryancat](https://github.com/ryancat))
- Avoid crash by handling missing views in dispatchViewManagerCommand ([ee1a191cb1](https://github.com/facebook/react-native/commit/ee1a191cb1c10085722d57fc276734f83e86a4f3) by [@hsource](https://github.com/hsource))
- Pass react build dir to cmake ([6ab7a99518](https://github.com/facebook/react-native/commit/6ab7a99518f8ba0d53e62e35d230ebec78e50217) by [@janicduplessis](https://github.com/janicduplessis))
- Fix missing space in ReactPropertyException message ([24560b6718](https://github.com/facebook/react-native/commit/24560b67184da00e05491af38289865c4b934ee8) by [@markv](https://github.com/markv))
- Fix import path breakage ([2e1e62f2bf](https://github.com/facebook/react-native/commit/2e1e62f2bf043ea0bf9926e1f5786ca54a22005e) by [@aniketmathur](https://github.com/aniketmathur))
- When `onEndReachedThreshold` is set to 0 `onEndReached` function on `VirtualizedList` properly fires once the user scrolls to the bottom of the list. ([b869680c11](https://github.com/facebook/react-native/commit/b869680c1196a6549154a4b9cb7ffa10eab1989c))
- Fix rendering of transparent borders in RN Android ([a9659ce86d](https://github.com/facebook/react-native/commit/a9659ce86d94dd34768b067763740a5c41917e42) by [@mdvacca](https://github.com/mdvacca))
- Exception with `Cannot load WebView` message will initialising WebView (along with existing checks) ([9e0d8696cc](https://github.com/facebook/react-native/commit/9e0d8696cc68436a0d309cafde252c55fc337be4) by [@rachitmishra](https://github.com/rachitmishra))
- Fix accessibilityState overwriting view's disabled state on Android ([f35d18caa3](https://github.com/facebook/react-native/commit/f35d18caa302351319840ec85337182f4f148e5e) by [@okwasniewski](https://github.com/okwasniewski))
- Make sure *.ts files are considered for task avoidance in the Gradle Plugin ([1a9fb6cb68](https://github.com/facebook/react-native/commit/1a9fb6cb682aa5ff83462e1e2869eb99f3b873fd) by [@cortinico](https://github.com/cortinico))
- Fix missing import on New Architecture build script in template ([a22f30d2ce](https://github.com/facebook/react-native/commit/a22f30d2ce866cb1488b26bb18eee0620a0ac259) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Use `NODE_BINARY` from `.xcode.env` when running packager from Xcode ([ff785dbcf5](https://github.com/facebook/react-native/commit/ff785dbcf5c464a4d850fa738e977702efd8abd3) by [@elsurudo](https://github.com/elsurudo))
- Bug with error message formatting when bundle is missing ([f501979f3d](https://github.com/facebook/react-native/commit/f501979f3d1e5c053eed16967a3d3385eab8e15f) by [@BenLorantfy](https://github.com/BenLorantfy))
- Fix the race condition when calling readAsDataURL after new Blob(blobs) ([bd12e41188](https://github.com/facebook/react-native/commit/bd12e41188c8d85c0acbd713f10f0bd34ea0edca) by [@wood1986](https://github.com/wood1986))
- Fix the way the orientation events are published, to avoid false publish on orientation change when app changes state to inactive ([7d42106d4c](https://github.com/facebook/react-native/commit/7d42106d4ce20c644bda4d928fb0abc163580cee) by [@lbaldy](https://github.com/lbaldy))
- Fix sed error when installing `glog` ([4a7e4b9ca6](https://github.com/facebook/react-native/commit/4a7e4b9ca6ef4fb52611b6c3cb788f624d1f81a4) by [@alphashuro](https://github.com/alphashuro))
- Don't validate ENTRY_FILE in react-native-xcode.sh ([780fe80fca](https://github.com/facebook/react-native/commit/780fe80fcaf213d84d9d087132af933bd02d1349) by [@janicduplessis](https://github.com/janicduplessis))
- `_scrollViewComponentView` is set to `RCTPullToRefreshViewComponentView's` superview ([4e4b9e2111](https://github.com/facebook/react-native/commit/4e4b9e2111faaf5652ae1f5b885730b378f3de98) by [@dmytrorykun](https://github.com/dmytrorykun))
- Use `GCC_PREPROCESSOR_DEFINITIONS` to set `FB_SONARKIT_ENABLED` ([77e6bff629](https://github.com/facebook/react-native/commit/77e6bff629312f20cdacb1e798cd2464ac50db9e) by [@janicduplessis](https://github.com/janicduplessis))
- Fix Hermes not being properly downloaded during pod install ([d5e0659fcc](https://github.com/facebook/react-native/commit/d5e0659fccf2767beb7aae55461e9690ba335c81) by [@cortinico](https://github.com/cortinico))
- Typo in the documation for the `automaticallyAdjustKeyboardInsets` prop ([927b43d47c](https://github.com/facebook/react-native/commit/927b43d47c2cd42538265cb06154b12cb0be6816) by [@jeremybarbet](https://github.com/jeremybarbet))
- Deprecate iOS/tvOS SDK 11.0 support now that 12.4+ is required ([f56d701e56](https://github.com/facebook/react-native/commit/f56d701e567af0c252a2e297bf81cd4add59378a) by [@leotm](https://github.com/leotm))
- Fix blank spaces that don't recover as you scroll when in an RTL locale and e.nativeEvent.zoomScale is -1. ([bc7b5c3011](https://github.com/facebook/react-native/commit/bc7b5c3011460935614a47a03cd077cd1059de72), [2f491bfa9f](https://github.com/facebook/react-native/commit/2f491bfa9f86c3db2e459e331f39bc3cf12e7239))
- Fixed paddingTop not being applied when using padding and paddingVertical in multiline textinput ([2fb107c9a6](https://github.com/facebook/react-native/commit/2fb107c9a63aacd2c880ad6abedaad67ffb6022b) by [@hetanthakkar1](https://github.com/hetanthakkar1))
- Fixed the ability to pass the port to use for Metro when running `react-native run-ios --port <port>`. ([7dc0b5153e](https://github.com/facebook/react-native/commit/7dc0b5153e4eb91c333238a58fe8c75a47cb5f81) by [@lindboe](https://github.com/lindboe))
- Fix missing imports ([c78babac39](https://github.com/facebook/react-native/commit/c78babac39b7c64e03e137d8fddd91e783303426))
- Fix React-bridging headers import not found ([c4b51e8d76](https://github.com/facebook/react-native/commit/c4b51e8d7679c3c20b843072581acd23a931fc83) by [@Kudo](https://github.com/Kudo))
- Fix Hermes executor not available when `use_frameworks` is enabled ([88b7b640a7](https://github.com/facebook/react-native/commit/88b7b640a74bafd918b8b1cd5d58e1f5ddfb730a) by [@Kudo](https://github.com/Kudo))

### Security

- Add GitHub token permissions for workflows ([3da3d82320](https://github.com/facebook/react-native/commit/3da3d82320bd035c6bd361a82ea12a70dba4e851) by [@varunsh-coder](https://github.com/varunsh-coder))
- Bump RCT-Folly to 2021-07-22 ([68f3a42fc7](https://github.com/facebook/react-native/commit/68f3a42fc7380051714253f43b42175de361f8bd) by [@luissantana](https://github.com/luissantana))
