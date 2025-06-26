/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const fs = require('fs');
const glob = require('glob');
const path = require('path');

const regex =
  /podspec_sources\s*\(\s*((?:\[[^\]]*\]|"[^"]*"|'[^']*'|[^,])+)\s*,\s*((?:\[[^\]]*\]|"[^"]*"|'[^']*'|[^)])+)\s*\)/gs;

function getHeaderFilesFromPodspecs(
  rootFolder /*:string*/,
) /*: { [key: string]: string[] }*/ {
  // Find podspec files
  const podSpecFiles = glob.sync('**/*.podspec', {
    cwd: rootFolder,
    absolute: true,
  });

  const headers /*: { [key: string]: string[] }*/ = {};

  podSpecFiles.forEach(podspec => {
    const content = fs.readFileSync(podspec, 'utf8');
    // Find all podspec_sources calls
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match) {
        let globPatterns /*: string[] */;
        let arg2 = match[2]?.trim().replace(/['"]/g, '');
        if (!arg2) {
          // Skip
          return;
        }
        // Check if arg2 is an array (e.g., ['a', 'b'])
        if (arg2.startsWith('[') && arg2.endsWith(']')) {
          // Remove the brackets and split by comma
          globPatterns = arg2
            .slice(1, -1)
            .split(',')
            .map(item => item.trim());
        } else {
          globPatterns = [arg2];
        }

        // Do the glob!
        const p = path.resolve(process.cwd(), path.dirname(podspec));
        const results = globPatterns
          .map(g => {
            return glob.sync(g.replace('{h}', 'h'), {
              cwd: p,
              absolute: true,
            });
          })
          .flat();

        if (!headers[podspec]) {
          headers[podspec] = results;
        } else {
          headers[podspec].push(...results);
        }
      }
    }
  });

  return headers;
}

function includeHeaderFileInUmbrellaFile(
  headerFilePath /*: string */,
) /*: boolean */ {
  // Check if there is a cpp or mm file with the same name
  // const fileName = path.basename(headerFilePath, path.extname(headerFilePath));
  // const dirName = path.dirname(headerFilePath);

  // const checkFileExists = (extension /*: string */) /*: boolean */ => {
  //   const cppFilePath = path.join(dirName, fileName + extension);
  //   if (fs.existsSync(cppFilePath)) {
  //     const fileStat = fs.statSync(cppFilePath);
  //     return fileStat.isFile();
  //   }
  //   return false;
  // };
  // if (checkFileExists('.cpp') || checkFileExists('.mm')) {
  //   // If there is a cpp or mm file with the same name, we assume it is a C++ header file
  //   return true;
  // }
  // Check if the file contains c++ code
  // const fileContent = fs.readFileSync(headerFilePath, 'utf8');
  // return cppHeaderRegex.test(fileContent);
  return HEADERFILE_WHITE_LIST.includes(path.basename(headerFilePath));
}

// These are the headers that are included in umbrella files
const HEADERFILE_WHITE_LIST = [
  'RCTArchConfiguratorProtocol.h',
  'RCTJSRuntimeConfiguratorProtocol.h',
  'RCTDependencyProvider.h',
  'RCTUIConfiguratorProtocol.h',
  'RCTAppDelegate.h',
  'RCTAppSetupUtils.h',
  'RCTDefaultReactNativeFactoryDelegate.h',
  'RCTReactNativeFactory.h',
  'RCTRootViewFactory.h',
  'CoreModulesPlugins.h',
  'RCTAccessibilityManager+Internal.h',
  'RCTAccessibilityManager.h',
  'RCTActionSheetManager.h',
  'RCTAlertController.h',
  'RCTAlertManager.h',
  'RCTAppearance.h',
  'RCTAppState.h',
  'RCTClipboard.h',
  'RCTDeviceInfo.h',
  'RCTDevLoadingView.h',
  'RCTDevMenu.h',
  'RCTDevSettings.h',
  'RCTDevToolsRuntimeSettingsModule.h',
  'RCTEventDispatcher.h',
  'RCTExceptionsManager.h',
  'RCTFPSGraph.h',
  'RCTI18nManager.h',
  'RCTKeyboardObserver.h',
  'RCTLogBox.h',
  'RCTLogBoxView.h',
  'RCTPlatform.h',
  'RCTRedBox.h',
  'RCTSourceCode.h',
  'RCTStatusBarManager.h',
  'RCTTiming.h',
  'RCTWebSocketModule.h',
  'RCTAssert.h',
  'RCTBridge+Inspector.h',
  'RCTBridge+Private.h',
  'RCTBridge.h',
  'RCTBridgeConstants.h',
  'RCTBridgeDelegate.h',
  'RCTBridgeMethod.h',
  'RCTBridgeModule.h',
  'RCTBridgeModuleDecorator.h',
  'RCTBridgeProxy+Cxx.h',
  'RCTBridgeProxy.h',
  'RCTBundleManager.h',
  'RCTBundleURLProvider.h',
  'RCTCallInvoker.h',
  'RCTCallInvokerModule.h',
  'RCTComponentEvent.h',
  'RCTConstants.h',
  'RCTConvert.h',
  'RCTCxxConvert.h',
  'RCTDefines.h',
  'RCTDisplayLink.h',
  'RCTErrorCustomizer.h',
  'RCTErrorInfo.h',
  'RCTEventDispatcherProtocol.h',
  'RCTFrameUpdate.h',
  'RCTImageSource.h',
  'RCTInitializing.h',
  'RCTInvalidating.h',
  'RCTJavaScriptExecutor.h',
  'RCTJavaScriptLoader.h',
  'RCTJSStackFrame.h',
  'RCTJSThread.h',
  'RCTKeyCommands.h',
  'RCTLog.h',
  'RCTManagedPointer.h',
  'RCTMockDef.h',
  'RCTModuleData.h',
  'RCTModuleMethod.h',
  'RCTMultipartDataTask.h',
  'RCTMultipartStreamReader.h',
  'RCTNullability.h',
  'RCTParserUtils.h',
  'RCTPerformanceLogger.h',
  'RCTPerformanceLoggerLabels.h',
  'RCTPLTag.h',
  'RCTRedBoxSetEnabled.h',
  'RCTReloadCommand.h',
  'RCTRootContentView.h',
  'RCTRootView.h',
  'RCTRootViewDelegate.h',
  'RCTRootViewInternal.h',
  'RCTTouchEvent.h',
  'RCTTouchHandler.h',
  'RCTTurboModuleRegistry.h',
  'RCTURLRequestDelegate.h',
  'RCTURLRequestHandler.h',
  'RCTUtils.h',
  'RCTUtilsUIOverride.h',
  'RCTVersion.h',
  'RCTSurface.h',
  'RCTSurfaceDelegate.h',
  'RCTSurfaceProtocol.h',
  'RCTSurfaceRootShadowView.h',
  'RCTSurfaceRootShadowViewDelegate.h',
  'RCTSurfaceRootView.h',
  'RCTSurfaceStage.h',
  'RCTSurfaceView+Internal.h',
  'RCTSurfaceView.h',
  'RCTSurfaceHostingProxyRootView.h',
  'RCTSurfaceHostingView.h',
  'RCTSurfaceSizeMeasureMode.h',
  'FBXXHashUtils.h',
  'RCTLocalizedString.h',
  'RCTEventEmitter.h',
  'RCTI18nUtil.h',
  'RCTLayoutAnimation.h',
  'RCTLayoutAnimationGroup.h',
  'RCTRedBoxExtraDataViewController.h',
  'RCTSurfacePresenterStub.h',
  'RCTUIManager.h',
  'RCTUIManagerObserverCoordinator.h',
  'RCTUIManagerUtils.h',
  'RCTMacros.h',
  'RCTProfile.h',
  'RCTActivityIndicatorView.h',
  'RCTActivityIndicatorViewManager.h',
  'RCTAnimationType.h',
  'RCTAutoInsetsProtocol.h',
  'RCTBorderCurve.h',
  'RCTBorderDrawing.h',
  'RCTBorderStyle.h',
  'RCTComponent.h',
  'RCTComponentData.h',
  'RCTConvert+CoreLocation.h',
  'RCTConvert+Transform.h',
  'RCTCursor.h',
  'RCTDebuggingOverlay.h',
  'RCTDebuggingOverlayManager.h',
  'RCTFont.h',
  'RCTLayout.h',
  'RCTModalHostView.h',
  'RCTModalHostViewController.h',
  'RCTModalHostViewManager.h',
  'RCTModalManager.h',
  'RCTPointerEvents.h',
  'RCTRootShadowView.h',
  'RCTShadowView+Internal.h',
  'RCTShadowView+Layout.h',
  'RCTShadowView.h',
  'RCTSwitch.h',
  'RCTSwitchManager.h',
  'RCTTextDecorationLineType.h',
  'RCTView.h',
  'RCTViewManager.h',
  'RCTViewUtils.h',
  'RCTWrapperViewController.h',
  'RCTRefreshableProtocol.h',
  'RCTRefreshControl.h',
  'RCTRefreshControlManager.h',
  'RCTSafeAreaShadowView.h',
  'RCTSafeAreaView.h',
  'RCTSafeAreaViewLocalData.h',
  'RCTSafeAreaViewManager.h',
  'RCTScrollableProtocol.h',
  'RCTScrollContentShadowView.h',
  'RCTScrollContentView.h',
  'RCTScrollContentViewManager.h',
  'RCTScrollEvent.h',
  'RCTScrollView.h',
  'RCTScrollViewManager.h',
  'UIView+Private.h',
  'UIView+React.h',
  'RCTDevLoadingViewProtocol.h',
  'RCTDevLoadingViewSetEnabled.h',
  'RCTInspectorDevServerHelper.h',
  'RCTInspectorNetworkHelper.h',
  'RCTInspectorUtils.h',
  'RCTPackagerClient.h',
  'RCTPackagerConnection.h',
  'RCTPausedInDebuggerOverlayController.h',
  'RCTInspector.h',
  'RCTInspectorPackagerConnection.h',
  'RCTAnimationDriver.h',
  'RCTDecayAnimation.h',
  'RCTEventAnimation.h',
  'RCTFrameAnimation.h',
  'RCTSpringAnimation.h',
  'RCTAdditionAnimatedNode.h',
  'RCTAnimatedNode.h',
  'RCTColorAnimatedNode.h',
  'RCTDiffClampAnimatedNode.h',
  'RCTDivisionAnimatedNode.h',
  'RCTInterpolationAnimatedNode.h',
  'RCTModuloAnimatedNode.h',
  'RCTMultiplicationAnimatedNode.h',
  'RCTObjectAnimatedNode.h',
  'RCTPropsAnimatedNode.h',
  'RCTStyleAnimatedNode.h',
  'RCTSubtractionAnimatedNode.h',
  'RCTTrackingAnimatedNode.h',
  'RCTTransformAnimatedNode.h',
  'RCTValueAnimatedNode.h',
  'RCTAnimationPlugins.h',
  'RCTAnimationUtils.h',
  'RCTNativeAnimatedModule.h',
  'RCTNativeAnimatedNodesManager.h',
  'RCTNativeAnimatedTurboModule.h',
  'RCTBlobManager.h',
  'RCTFileReaderModule.h',
  'RCTAnimatedImage.h',
  'RCTBundleAssetImageLoader.h',
  'RCTDisplayWeakRefreshable.h',
  'RCTGIFImageDecoder.h',
  'RCTImageBlurUtils.h',
  'RCTImageCache.h',
  'RCTImageDataDecoder.h',
  'RCTImageEditingManager.h',
  'RCTImageLoader.h',
  'RCTImageLoaderLoggable.h',
  'RCTImageLoaderProtocol.h',
  'RCTImageLoaderWithAttributionProtocol.h',
  'RCTImagePlugins.h',
  'RCTImageShadowView.h',
  'RCTImageStoreManager.h',
  'RCTImageURLLoader.h',
  'RCTImageURLLoaderWithAttribution.h',
  'RCTImageUtils.h',
  'RCTImageView.h',
  'RCTImageViewManager.h',
  'RCTLocalAssetImageLoader.h',
  'RCTResizeMode.h',
  'RCTUIImageViewAnimated.h',
  'RCTLinkingManager.h',
  'RCTLinkingPlugins.h',
  'RCTDataRequestHandler.h',
  'RCTFileRequestHandler.h',
  'RCTHTTPRequestHandler.h',
  'RCTInspectorNetworkReporter.h',
  'RCTNetworking.h',
  'RCTNetworkPlugins.h',
  'RCTNetworkTask.h',
  'RCTPushNotificationManager.h',
  'RCTPushNotificationPlugins.h',
  'RCTSettingsManager.h',
  'RCTSettingsPlugins.h',
  'RCTBaseTextShadowView.h',
  'RCTBaseTextViewManager.h',
  'RCTRawTextShadowView.h',
  'RCTRawTextViewManager.h',
  'RCTConvert+Text.h',
  'RCTTextAttributes.h',
  'RCTTextTransform.h',
  'NSTextStorage+FontScaling.h',
  'RCTDynamicTypeRamp.h',
  'RCTTextShadowView.h',
  'RCTTextView.h',
  'RCTTextViewManager.h',
  'RCTMultilineTextInputView.h',
  'RCTMultilineTextInputViewManager.h',
  'RCTUITextView.h',
  'RCTBackedTextInputDelegate.h',
  'RCTBackedTextInputDelegateAdapter.h',
  'RCTBackedTextInputViewProtocol.h',
  'RCTBaseTextInputShadowView.h',
  'RCTBaseTextInputView.h',
  'RCTBaseTextInputViewManager.h',
  'RCTInputAccessoryShadowView.h',
  'RCTInputAccessoryView.h',
  'RCTInputAccessoryViewContent.h',
  'RCTInputAccessoryViewManager.h',
  'RCTTextSelection.h',
  'RCTSinglelineTextInputView.h',
  'RCTSinglelineTextInputViewManager.h',
  'RCTUITextField.h',
  'RCTVirtualTextShadowView.h',
  'RCTVirtualTextView.h',
  'RCTVirtualTextViewManager.h',
  'RCTVibration.h',
  'RCTVibrationPlugins.h',
  'RCTReconnectingWebSocket.h',
];

module.exports = {
  getHeaderFilesFromPodspecs,
  includeHeaderFileInUmbrellaFile,
};
