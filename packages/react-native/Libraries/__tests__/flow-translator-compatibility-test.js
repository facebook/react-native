/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

const translate = require('flow-api-translator');
const {promises: fs} = require('fs');
const glob = require('glob');
const path = require('path');

const PACKAGE_ROOT = path.resolve(__dirname, '../../');
const JS_FILES_PATTERN = '{Libraries,src/private}/**/*.{js,flow}';
const IGNORE_PATTERNS = [
  '**/__{tests,mocks,fixtures,flowtests}__/**',
  '**/*.android.js',
  '**/*.ios.js',
  '**/*.fb.js',
  '**/*.macos.js',
  '**/*.windows.js',
  'Libraries/Renderer/implementations/**',
  'Libraries/Renderer/shims/**',
];

const sourceFiles = [
  'index.js',
  ...glob.sync(JS_FILES_PATTERN, {
    cwd: PACKAGE_ROOT,
    ignore: IGNORE_PATTERNS,
    nodir: true,
  }),
];

describe('readiness for Flow -> TypeScript API translation', () => {
  test('should output compatibility snapshot', async () => {
    const result = Object.fromEntries(sourceFiles.map(file => [file, false]));

    await Promise.all(
      sourceFiles.map(async file => {
        const source = await fs.readFile(
          path.join(PACKAGE_ROOT, file),
          'utf-8',
        );

        try {
          await translate.translateFlowToTSDef(source);
          result[file] = true;
        } catch (e) {}
      }),
    );

    // Incompatible files ❌
    expect(sourceFiles.filter(file => !result[file])).toMatchInlineSnapshot(`
        Array [
          "index.js",
          "Libraries/ActionSheetIOS/ActionSheetIOS.js",
          "Libraries/Alert/Alert.js",
          "Libraries/Alert/RCTAlertManager.js.flow",
          "Libraries/AppState/AppState.js",
          "Libraries/BatchedBridge/BatchedBridge.js",
          "Libraries/BatchedBridge/MessageQueue.js",
          "Libraries/BatchedBridge/NativeModules.js",
          "Libraries/Blob/Blob.js",
          "Libraries/Blob/BlobManager.js",
          "Libraries/Blob/BlobRegistry.js",
          "Libraries/Blob/File.js",
          "Libraries/Blob/FileReader.js",
          "Libraries/Blob/URLSearchParams.js",
          "Libraries/BugReporting/BugReporting.js",
          "Libraries/BugReporting/dumpReactTree.js",
          "Libraries/BugReporting/getReactData.js",
          "Libraries/Components/AccessibilityInfo/legacySendAccessibilityEvent.js.flow",
          "Libraries/Components/Clipboard/Clipboard.js",
          "Libraries/Components/DrawerAndroid/DrawerLayoutAndroid.js",
          "Libraries/Components/Keyboard/Keyboard.js",
          "Libraries/Components/Keyboard/KeyboardAvoidingView.js",
          "Libraries/Components/ProgressBarAndroid/ProgressBarAndroid.js",
          "Libraries/Components/RefreshControl/RefreshControl.js",
          "Libraries/Components/ScrollView/processDecelerationRate.js",
          "Libraries/Components/ScrollView/ScrollView.js",
          "Libraries/Components/Sound/SoundManager.js",
          "Libraries/Components/StaticRenderer.js",
          "Libraries/Components/StatusBar/StatusBar.js",
          "Libraries/Components/TextInput/RCTTextInputViewConfig.js",
          "Libraries/Components/TextInput/TextInput.js",
          "Libraries/Components/TextInput/TextInputState.js",
          "Libraries/Components/ToastAndroid/ToastAndroid.js",
          "Libraries/Components/Touchable/BoundingDimensions.js",
          "Libraries/Components/Touchable/PooledClass.js",
          "Libraries/Components/Touchable/Position.js",
          "Libraries/Components/Touchable/TouchableBounce.js",
          "Libraries/Components/Touchable/TouchableHighlight.js",
          "Libraries/Components/Touchable/TouchableNativeFeedback.js",
          "Libraries/Components/Touchable/TouchableOpacity.js",
          "Libraries/Components/Touchable/TouchableWithoutFeedback.js",
          "Libraries/Components/UnimplementedViews/UnimplementedView.js",
          "Libraries/Components/View/ReactNativeStyleAttributes.js",
          "Libraries/Components/View/ReactNativeViewAttributes.js",
          "Libraries/Components/View/View.js",
          "Libraries/Core/Devtools/getDevServer.js",
          "Libraries/Core/Devtools/loadBundleFromServer.js",
          "Libraries/Core/Devtools/openFileInEditor.js",
          "Libraries/Core/Devtools/openURLInBrowser.js",
          "Libraries/Core/Devtools/parseErrorStack.js",
          "Libraries/Core/Devtools/parseHermesStack.js",
          "Libraries/Core/Devtools/symbolicateStackTrace.js",
          "Libraries/Core/ExceptionsManager.js",
          "Libraries/Core/ReactNativeVersion.js",
          "Libraries/Core/ReactNativeVersionCheck.js",
          "Libraries/Core/Timers/immediateShim.js",
          "Libraries/Core/Timers/JSTimers.js",
          "Libraries/EventEmitter/RCTEventEmitter.js",
          "Libraries/EventEmitter/RCTNativeAppEventEmitter.js",
          "Libraries/HeapCapture/HeapCapture.js",
          "Libraries/Image/AssetRegistry.js",
          "Libraries/Image/AssetSourceResolver.js",
          "Libraries/Image/Image.js.flow",
          "Libraries/Image/ImageBackground.js",
          "Libraries/Image/nativeImageSource.js",
          "Libraries/Image/RelativeImageStub.js",
          "Libraries/Image/resolveAssetSource.js",
          "Libraries/Inspector/BorderBox.js",
          "Libraries/Inspector/BoxInspector.js",
          "Libraries/Inspector/ElementBox.js",
          "Libraries/Inspector/ElementProperties.js",
          "Libraries/Inspector/getInspectorDataForViewAtPoint.js",
          "Libraries/Inspector/Inspector.js",
          "Libraries/Inspector/InspectorOverlay.js",
          "Libraries/Inspector/InspectorPanel.js",
          "Libraries/Inspector/NetworkOverlay.js",
          "Libraries/Inspector/PerformanceOverlay.js",
          "Libraries/Inspector/resolveBoxStyle.js",
          "Libraries/Inspector/StyleInspector.js",
          "Libraries/Interaction/FrameRateLogger.js",
          "Libraries/Interaction/InteractionManager.js",
          "Libraries/Interaction/JSEventLoopWatchdog.js",
          "Libraries/Interaction/TaskQueue.js",
          "Libraries/Interaction/TouchHistoryMath.js",
          "Libraries/JSInspector/InspectorAgent.js",
          "Libraries/JSInspector/JSInspector.js",
          "Libraries/JSInspector/NetworkAgent.js",
          "Libraries/LayoutAnimation/LayoutAnimation.js",
          "Libraries/Linking/Linking.js",
          "Libraries/Lists/FillRateHelper.js",
          "Libraries/Lists/FlatList.js",
          "Libraries/Lists/SectionList.js",
          "Libraries/Lists/ViewabilityHelper.js",
          "Libraries/Lists/VirtualizedList.js",
          "Libraries/Lists/VirtualizedListContext.js",
          "Libraries/Lists/VirtualizedSectionList.js",
          "Libraries/Lists/VirtualizeUtils.js",
          "Libraries/LogBox/LogBoxInspectorContainer.js",
          "Libraries/Modal/Modal.js",
          "Libraries/Network/convertRequestBody.js",
          "Libraries/Network/fetch.js",
          "Libraries/Network/FormData.js",
          "Libraries/Network/XHRInterceptor.js",
          "Libraries/Network/XMLHttpRequest.js",
          "Libraries/Performance/SamplingProfiler.js",
          "Libraries/PermissionsAndroid/PermissionsAndroid.js",
          "Libraries/Promise.js",
          "Libraries/PushNotificationIOS/PushNotificationIOS.js",
          "Libraries/ReactNative/AppContainer.js",
          "Libraries/ReactNative/AppRegistry.js",
          "Libraries/ReactNative/BridgelessUIManager.js",
          "Libraries/ReactNative/getNativeComponentAttributes.js",
          "Libraries/ReactNative/I18nManager.js",
          "Libraries/ReactNative/PaperUIManager.js",
          "Libraries/ReactNative/ReactNativeFeatureFlags.js",
          "Libraries/ReactNative/ReactNativeRuntimeDiagnostics.js",
          "Libraries/ReactNative/UIManager.js",
          "Libraries/ReactNative/UIManagerProperties.js",
          "Libraries/ReactPrivate/ReactNativePrivateInterface.js",
          "Libraries/Settings/Settings.js",
          "Libraries/Share/Share.js",
          "Libraries/StyleSheet/flattenStyle.js",
          "Libraries/StyleSheet/normalizeColor.js",
          "Libraries/StyleSheet/processAspectRatio.js",
          "Libraries/StyleSheet/processColorArray.js",
          "Libraries/StyleSheet/processFontVariant.js",
          "Libraries/StyleSheet/processTransform.js",
          "Libraries/StyleSheet/setNormalizedColorAlpha.js",
          "Libraries/StyleSheet/StyleSheet.js",
          "Libraries/Text/Text.js",
          "Libraries/Text/TextAncestor.js",
          "Libraries/Utilities/BackHandler.js.flow",
          "Libraries/Utilities/binaryToBase64.js",
          "Libraries/Utilities/deepFreezeAndThrowOnMutationInDev.js",
          "Libraries/Utilities/defineLazyObjectProperty.js",
          "Libraries/Utilities/DeviceInfo.js",
          "Libraries/Utilities/DevLoadingView.js",
          "Libraries/Utilities/DevSettings.js",
          "Libraries/Utilities/differ/deepDiffer.js",
          "Libraries/Utilities/differ/insetsDiffer.js",
          "Libraries/Utilities/differ/matricesDiffer.js",
          "Libraries/Utilities/differ/pointsDiffer.js",
          "Libraries/Utilities/differ/sizesDiffer.js",
          "Libraries/Utilities/dismissKeyboard.js",
          "Libraries/Utilities/FeatureDetection.js",
          "Libraries/Utilities/GlobalPerformanceLogger.js",
          "Libraries/Utilities/HMRClient.js",
          "Libraries/Utilities/HMRClientProdShim.js",
          "Libraries/Utilities/infoLog.js",
          "Libraries/Utilities/logError.js",
          "Libraries/Utilities/mapWithSeparator.js",
          "Libraries/Utilities/Platform.js.flow",
          "Libraries/Utilities/PolyfillFunctions.js",
          "Libraries/Utilities/RCTLog.js",
          "Libraries/Utilities/SceneTracker.js",
          "Libraries/Utilities/warnOnce.js",
          "Libraries/vendor/core/ErrorUtils.js",
          "Libraries/Vibration/Vibration.js",
          "Libraries/WebSocket/WebSocket.js",
          "Libraries/WebSocket/WebSocketEvent.js",
          "Libraries/WebSocket/WebSocketInterceptor.js",
          "Libraries/YellowBox/YellowBoxDeprecated.js",
          "src/private/debugging/ReactDevToolsSettingsManager.js.flow",
          "src/private/devmenu/DevMenu.js",
          "src/private/webapis/dom/oldstylecollections/DOMRectList.js",
          "src/private/webapis/dom/oldstylecollections/HTMLCollection.js",
          "src/private/webapis/dom/oldstylecollections/NodeList.js",
        ]
      `);
  }, 5000);
});
