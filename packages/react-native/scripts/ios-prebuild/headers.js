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

const REACT_CORE_UMBRELLA_HEADER = `
#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "React/CoreModulesPlugins.h"
#import "React/RCTAccessibilityManager+Internal.h"
#import "React/RCTAccessibilityManager.h"
#import "React/RCTActionSheetManager.h"
#import "React/RCTAlertController.h"
#import "React/RCTAlertManager.h"
#import "React/RCTAppearance.h"
#import "React/RCTAppState.h"
#import "React/RCTClipboard.h"
#import "React/RCTDeviceInfo.h"
#import "React/RCTDevLoadingView.h"
#import "React/RCTDevMenu.h"
#import "React/RCTDevSettings.h"
#import "React/RCTDevToolsRuntimeSettingsModule.h"
#import "React/RCTEventDispatcher.h"
#import "React/RCTExceptionsManager.h"
#import "React/RCTFPSGraph.h"
#import "React/RCTI18nManager.h"
#import "React/RCTKeyboardObserver.h"
#import "React/RCTLogBox.h"
#import "React/RCTLogBoxView.h"
#import "React/RCTPlatform.h"
#import "React/RCTRedBox.h"
#import "React/RCTSourceCode.h"
#import "React/RCTStatusBarManager.h"
#import "React/RCTTiming.h"
#import "React/RCTWebSocketModule.h"
#import "React/RCTAssert.h"
#import "React/RCTBridge+Inspector.h"
#import "React/RCTBridge+Private.h"
#import "React/RCTBridge.h"
#import "React/RCTBridgeConstants.h"
#import "React/RCTBridgeDelegate.h"
#import "React/RCTBridgeMethod.h"
#import "React/RCTBridgeModule.h"
#import "React/RCTBridgeModuleDecorator.h"
#import "React/RCTBridgeProxy+Cxx.h"
#import "React/RCTBridgeProxy.h"
#import "React/RCTBundleManager.h"
#import "React/RCTBundleURLProvider.h"
#import "React/RCTCallInvoker.h"
#import "React/RCTCallInvokerModule.h"
#import "React/RCTComponentEvent.h"
#import "React/RCTConstants.h"
#import "React/RCTConvert.h"
#import "React/RCTCxxConvert.h"
#import "React/RCTDefines.h"
#import "React/RCTDisplayLink.h"
#import "React/RCTErrorCustomizer.h"
#import "React/RCTErrorInfo.h"
#import "React/RCTEventDispatcherProtocol.h"
#import "React/RCTFrameUpdate.h"
#import "React/RCTImageSource.h"
#import "React/RCTInitializing.h"
#import "React/RCTInvalidating.h"
#import "React/RCTJavaScriptExecutor.h"
#import "React/RCTJavaScriptLoader.h"
#import "React/RCTJSStackFrame.h"
#import "React/RCTJSThread.h"
#import "React/RCTKeyCommands.h"
#import "React/RCTLog.h"
#import "React/RCTManagedPointer.h"
#import "React/RCTMockDef.h"
#import "React/RCTModuleData.h"
#import "React/RCTModuleMethod.h"
#import "React/RCTMultipartDataTask.h"
#import "React/RCTMultipartStreamReader.h"
#import "React/RCTNullability.h"
#import "React/RCTParserUtils.h"
#import "React/RCTPerformanceLogger.h"
#import "React/RCTPerformanceLoggerLabels.h"
#import "React/RCTPLTag.h"
#import "React/RCTRedBoxSetEnabled.h"
#import "React/RCTReloadCommand.h"
#import "React/RCTRootContentView.h"
#import "React/RCTRootView.h"
#import "React/RCTRootViewDelegate.h"
#import "React/RCTRootViewInternal.h"
#import "React/RCTTouchEvent.h"
#import "React/RCTTouchHandler.h"
#import "React/RCTTurboModuleRegistry.h"
#import "React/RCTURLRequestDelegate.h"
#import "React/RCTURLRequestHandler.h"
#import "React/RCTUtils.h"
#import "React/RCTUtilsUIOverride.h"
#import "React/RCTVersion.h"
#import "React/RCTSurface.h"
#import "React/RCTSurfaceDelegate.h"
#import "React/RCTSurfaceProtocol.h"
#import "React/RCTSurfaceRootShadowView.h"
#import "React/RCTSurfaceRootShadowViewDelegate.h"
#import "React/RCTSurfaceRootView.h"
#import "React/RCTSurfaceStage.h"
#import "React/RCTSurfaceView+Internal.h"
#import "React/RCTSurfaceView.h"
#import "React/RCTSurfaceHostingProxyRootView.h"
#import "React/RCTSurfaceHostingView.h"
#import "React/RCTSurfaceSizeMeasureMode.h"
#import "React/FBXXHashUtils.h"
#import "React/RCTLocalizedString.h"
#import "React/RCTEventEmitter.h"
#import "React/RCTI18nUtil.h"
#import "React/RCTLayoutAnimation.h"
#import "React/RCTLayoutAnimationGroup.h"
#import "React/RCTRedBoxExtraDataViewController.h"
#import "React/RCTSurfacePresenterStub.h"
#import "React/RCTUIManager.h"
#import "React/RCTUIManagerObserverCoordinator.h"
#import "React/RCTUIManagerUtils.h"
#import "React/RCTMacros.h"
#import "React/RCTProfile.h"
#import "React/RCTActivityIndicatorView.h"
#import "React/RCTActivityIndicatorViewManager.h"
#import "React/RCTAnimationType.h"
#import "React/RCTAutoInsetsProtocol.h"
#import "React/RCTBorderCurve.h"
#import "React/RCTBorderDrawing.h"
#import "React/RCTBorderStyle.h"
#import "React/RCTComponent.h"
#import "React/RCTComponentData.h"
#import "React/RCTConvert+CoreLocation.h"
#import "React/RCTConvert+Transform.h"
#import "React/RCTCursor.h"
#import "React/RCTDebuggingOverlay.h"
#import "React/RCTDebuggingOverlayManager.h"
#import "React/RCTFont.h"
#import "React/RCTLayout.h"
#import "React/RCTModalHostView.h"
#import "React/RCTModalHostViewController.h"
#import "React/RCTModalHostViewManager.h"
#import "React/RCTModalManager.h"
#import "React/RCTPointerEvents.h"
#import "React/RCTRootShadowView.h"
#import "React/RCTShadowView+Internal.h"
#import "React/RCTShadowView+Layout.h"
#import "React/RCTShadowView.h"
#import "React/RCTSwitch.h"
#import "React/RCTSwitchManager.h"
#import "React/RCTTextDecorationLineType.h"
#import "React/RCTView.h"
#import "React/RCTViewManager.h"
#import "React/RCTViewUtils.h"
#import "React/RCTWrapperViewController.h"
#import "React/RCTRefreshableProtocol.h"
#import "React/RCTRefreshControl.h"
#import "React/RCTRefreshControlManager.h"
#import "React/RCTSafeAreaShadowView.h"
#import "React/RCTSafeAreaView.h"
#import "React/RCTSafeAreaViewLocalData.h"
#import "React/RCTSafeAreaViewManager.h"
#import "React/RCTScrollableProtocol.h"
#import "React/RCTScrollContentShadowView.h"
#import "React/RCTScrollContentView.h"
#import "React/RCTScrollContentViewManager.h"
#import "React/RCTScrollEvent.h"
#import "React/RCTScrollView.h"
#import "React/RCTScrollViewManager.h"
#import "React/UIView+Private.h"
#import "React/UIView+React.h"
#import "React/RCTDevLoadingViewProtocol.h"
#import "React/RCTDevLoadingViewSetEnabled.h"
#import "React/RCTInspectorDevServerHelper.h"
#import "React/RCTInspectorNetworkHelper.h"
#import "React/RCTInspectorUtils.h"
#import "React/RCTPackagerClient.h"
#import "React/RCTPackagerConnection.h"
#import "React/RCTPausedInDebuggerOverlayController.h"
#import "React/RCTInspector.h"
#import "React/RCTInspectorPackagerConnection.h"
#import "React/RCTAnimationDriver.h"
#import "React/RCTDecayAnimation.h"
#import "React/RCTEventAnimation.h"
#import "React/RCTFrameAnimation.h"
#import "React/RCTSpringAnimation.h"
#import "React/RCTAdditionAnimatedNode.h"
#import "React/RCTAnimatedNode.h"
#import "React/RCTColorAnimatedNode.h"
#import "React/RCTDiffClampAnimatedNode.h"
#import "React/RCTDivisionAnimatedNode.h"
#import "React/RCTInterpolationAnimatedNode.h"
#import "React/RCTModuloAnimatedNode.h"
#import "React/RCTMultiplicationAnimatedNode.h"
#import "React/RCTObjectAnimatedNode.h"
#import "React/RCTPropsAnimatedNode.h"
#import "React/RCTStyleAnimatedNode.h"
#import "React/RCTSubtractionAnimatedNode.h"
#import "React/RCTTrackingAnimatedNode.h"
#import "React/RCTTransformAnimatedNode.h"
#import "React/RCTValueAnimatedNode.h"
#import "React/RCTAnimationPlugins.h"
#import "React/RCTAnimationUtils.h"
#import "React/RCTNativeAnimatedModule.h"
#import "React/RCTNativeAnimatedNodesManager.h"
#import "React/RCTNativeAnimatedTurboModule.h"
#import "React/RCTBlobManager.h"
#import "React/RCTFileReaderModule.h"
#import "React/RCTAnimatedImage.h"
#import "React/RCTBundleAssetImageLoader.h"
#import "React/RCTDisplayWeakRefreshable.h"
#import "React/RCTGIFImageDecoder.h"
#import "React/RCTImageBlurUtils.h"
#import "React/RCTImageCache.h"
#import "React/RCTImageDataDecoder.h"
#import "React/RCTImageEditingManager.h"
#import "React/RCTImageLoader.h"
#import "React/RCTImageLoaderLoggable.h"
#import "React/RCTImageLoaderProtocol.h"
#import "React/RCTImageLoaderWithAttributionProtocol.h"
#import "React/RCTImagePlugins.h"
#import "React/RCTImageShadowView.h"
#import "React/RCTImageStoreManager.h"
#import "React/RCTImageURLLoader.h"
#import "React/RCTImageURLLoaderWithAttribution.h"
#import "React/RCTImageUtils.h"
#import "React/RCTImageView.h"
#import "React/RCTImageViewManager.h"
#import "React/RCTLocalAssetImageLoader.h"
#import "React/RCTResizeMode.h"
#import "React/RCTUIImageViewAnimated.h"
#import "React/RCTLinkingManager.h"
#import "React/RCTLinkingPlugins.h"
#import "React/RCTDataRequestHandler.h"
#import "React/RCTFileRequestHandler.h"
#import "React/RCTHTTPRequestHandler.h"
#import "React/RCTInspectorNetworkReporter.h"
#import "React/RCTNetworking.h"
#import "React/RCTNetworkPlugins.h"
#import "React/RCTNetworkTask.h"
#import "React/RCTPushNotificationManager.h"
#import "React/RCTPushNotificationPlugins.h"
#import "React/RCTSettingsManager.h"
#import "React/RCTSettingsPlugins.h"
#import "React/RCTBaseTextShadowView.h"
#import "React/RCTBaseTextViewManager.h"
#import "React/RCTRawTextShadowView.h"
#import "React/RCTRawTextViewManager.h"
#import "React/RCTConvert+Text.h"
#import "React/RCTTextAttributes.h"
#import "React/RCTTextTransform.h"
#import "React/NSTextStorage+FontScaling.h"
#import "React/RCTDynamicTypeRamp.h"
#import "React/RCTTextShadowView.h"
#import "React/RCTTextView.h"
#import "React/RCTTextViewManager.h"
#import "React/RCTMultilineTextInputView.h"
#import "React/RCTMultilineTextInputViewManager.h"
#import "React/RCTUITextView.h"
#import "React/RCTBackedTextInputDelegate.h"
#import "React/RCTBackedTextInputDelegateAdapter.h"
#import "React/RCTBackedTextInputViewProtocol.h"
#import "React/RCTBaseTextInputShadowView.h"
#import "React/RCTBaseTextInputView.h"
#import "React/RCTBaseTextInputViewManager.h"
#import "React/RCTInputAccessoryShadowView.h"
#import "React/RCTInputAccessoryView.h"
#import "React/RCTInputAccessoryViewContent.h"
#import "React/RCTInputAccessoryViewManager.h"
#import "React/RCTTextSelection.h"
#import "React/RCTSinglelineTextInputView.h"
#import "React/RCTSinglelineTextInputViewManager.h"
#import "React/RCTUITextField.h"
#import "React/RCTVirtualTextShadowView.h"
#import "React/RCTVirtualTextView.h"
#import "React/RCTVirtualTextViewManager.h"
#import "React/RCTVibration.h"
#import "React/RCTVibrationPlugins.h"
#import "React/RCTReconnectingWebSocket.h"

FOUNDATION_EXPORT double ReactVersionNumber;
FOUNDATION_EXPORT const unsigned char ReactVersionString[];

        `;
const RCT_APP_DELEGATE_UMBRELLA_HEADER = `
#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "RCTAppDelegate.h"
#import "RCTAppSetupUtils.h"
#import "RCTArchConfiguratorProtocol.h"
#import "RCTDefaultReactNativeFactoryDelegate.h"
#import "RCTDependencyProvider.h"
#import "RCTJSRuntimeConfiguratorProtocol.h"
#import "RCTReactNativeFactory.h"
#import "RCTRootViewFactory.h"
#import "RCTUIConfiguratorProtocol.h"

FOUNDATION_EXPORT double React_RCTAppDelegateVersionNumber;
FOUNDATION_EXPORT const unsigned char React_RCTAppDelegateVersionString[];

`;

const RN_MODULEMAP = `
framework module React {
  umbrella header "React_Core/React_Core-umbrella.h"
  export *
  module * { export * }
}


framework module React_RCTAppDelegate {
    umbrella header "React_RCTAppDelegate/React_RCTAppDelegate-umbrella.h"
    export *
    module * { export * }
}

`;

module.exports = {
  getHeaderFilesFromPodspecs,
  RN_MODULEMAP,
  RCT_APP_DELEGATE_UMBRELLA_HEADER,
  REACT_CORE_UMBRELLA_HEADER,
};
