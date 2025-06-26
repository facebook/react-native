/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/*:: import type {BuildFlavor} from './types'; */

const {getHeaderFilesFromPodspecs} = require('./headers');
const {createFolderIfNotExists, createLogger} = require('./utils');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const frameworkLog = createLogger('XCFramework');

function buildXCFrameworks(
  rootFolder /*: string */,
  buildFolder /*: string */,
  frameworkFolders /*: Array<string> */,
  buildType /*: BuildFlavor */,
  identity /*: ?string */,
) {
  const outputPath = path.join(
    buildFolder,
    'output',
    'xcframeworks',
    buildType,
    'React.xcframework',
  );
  // Delete all target platform folders (everything but the Headers and Modules folders)
  try {
    fs.rmSync(outputPath, {recursive: true, force: true});
  } catch (error) {
    frameworkLog(
      `Error deleting folder: ${outputPath}. Check if the folder exists.`,
      'error',
    );
    return;
  }

  // Build the XCFrameworks by using each framework folder as input
  const frameworks = frameworkFolders
    .map(frameworkFolder => {
      return `-framework "${frameworkFolder}"`;
    })
    .join(' ');

  const buildCommand = `xcodebuild -create-xcframework ${frameworks} -output ${outputPath} -allow-internal-distribution`;

  frameworkLog(buildCommand);
  try {
    execSync(buildCommand, {
      cwd: rootFolder,
      stdio: 'inherit',
    });
  } catch (error) {
    frameworkLog(
      `Error building XCFramework: ${error.message}. Check if the build was successful.`,
      'error',
    );
    return;
  }

  // Use the header files from podspecs
  const podSpecsWithHeaderFiles = getHeaderFilesFromPodspecs(rootFolder);

  // Delete header files to the output path
  const outputHeadersPath = path.join(outputPath, 'Headers');

  // Store umbrella headers keyed on podspec names
  const umbrellaHeaders /*: {[key: string]: string} */ = {};
  const copiedHeaderFilesWithPodspecNames /*: {[key: string]: string[]} */ = {};

  // Enumerate podspecs and copy headers, create umbrella headers and module map file
  Object.keys(podSpecsWithHeaderFiles).forEach(podspec => {
    const headerFiles = podSpecsWithHeaderFiles[podspec];
    if (headerFiles.length > 0) {
      // Get podspec name without directory and extension and make sure it is a valid identifier
      // by replacing any non-alphanumeric characters with an underscore.
      const podSpecName = path
        .basename(podspec, '.podspec')
        .replace(/[^a-zA-Z0-9_]/g, '_');

      // Create a folder for the podspec in the output headers path
      const podSpecFolder = path.join(outputHeadersPath, podSpecName);
      createFolderIfNotExists(podSpecFolder);

      // Copy each header file to the podspec folder
      copiedHeaderFilesWithPodspecNames[podSpecName] = headerFiles.map(
        headerFile => {
          // Header files shall be flattened into the podSpecFoldder:
          const targetFile = path.join(
            podSpecFolder,
            path.basename(headerFile),
          );
          fs.copyFileSync(headerFile, targetFile);
          return targetFile;
        },
      );
      // Create umbrella header file for the podspec
      const umbrellaHeaderFilename = path.join(
        podSpecFolder,
        podSpecName + '-umbrella.h',
      );

      // const didCreateUmbrellaFile = createUmbrellaHeaderFile(
      //   podSpecName,
      //   umbrellaHeaderFilename,
      //   copiedHeaderFilesWithPodspecNames[podSpecName],
      // );

      // // Store the umbrella header filename in the umbrellaHeaders object
      // if (didCreateUmbrellaFile) {
      //   umbrellaHeaders[podSpecName] = umbrellaHeaderFilename;
      // }

      if (
        podSpecName === 'React_Core' ||
        podSpecName === 'React_RCTAppDelegate'
      ) {
        if (podSpecName === 'React_Core') {
          fs.writeFileSync(umbrellaHeaderFilename, REACT_CORE_UMBRELLA_HEADER);
        } else {
          fs.writeFileSync(
            umbrellaHeaderFilename,
            RCT_APP_DELEGATE_UMBRELLA_HEADER,
          );
        }

        // Store the umbrella header filename in the umbrellaHeaders object
        umbrellaHeaders[podSpecName] = umbrellaHeaderFilename;
      }
    }
  });

  // Create the module map file using the header files in podSpecsWithHeaderFiles
  const moduleMapFile = createModuleMapFile(outputPath, umbrellaHeaders);
  if (!moduleMapFile) {
    frameworkLog(
      'Failed to create module map file. The XCFramework may not work correctly. Stopping.',
      'error',
    );
    return;
  }

  linkArchFolders(
    outputPath,
    moduleMapFile,
    umbrellaHeaders,
    copiedHeaderFilesWithPodspecNames,
  );

  // Copy Symbols to symbols folder
  const symbolPaths = frameworkFolders.map(framework =>
    path.join(framework, `..`, `..`, `React.framework.dSYM`),
  );

  frameworkLog('Copying symbols to symbols folder...');
  const symbolOutput = path.join(outputPath, '..', 'Symbols');
  symbolPaths.forEach(symbol => {
    const destination = extractDestinationFromPath(symbol);
    const outputFolder = path.join(symbolOutput, destination);
    fs.mkdirSync(outputFolder, {recursive: true});
    execSync(`cp -r ${symbol} ${outputFolder}`);
  });

  if (identity) {
    signXCFramework(identity, outputPath);
  }
}

function linkArchFolders(
  outputPath /*:string*/,
  moduleMapFile /*:string*/,
  umbrellaHeaderFiles /*:{[key: string]: string}*/,
  outputHeaderFiles /*: {[key: string]: string[]} */,
) {
  frameworkLog('Linking modules and headers to platform folders...');

  // Enumerate all platform folders in the output path
  const platformFolders = fs
    .readdirSync(outputPath)
    .map(folder => path.join(outputPath, folder))
    .filter(folder => {
      return (
        fs.statSync(folder).isDirectory() &&
        !folder.endsWith('Headers') &&
        !folder.endsWith('Modules')
      );
    });

  platformFolders.forEach(platformFolder => {
    // Link the Modules folder into the platform folder
    const targetModulesFolder = path.join(
      platformFolder,
      'React.Framework',
      'Modules',
    );
    createFolderIfNotExists(targetModulesFolder);

    try {
      fs.linkSync(
        moduleMapFile,
        path.join(targetModulesFolder, path.basename(moduleMapFile)),
      );
    } catch (error) {
      frameworkLog(
        `Error copying module map file: ${error.message}. Check if the file exists at ${moduleMapFile}.`,
        'error',
      );
    }
    // Copy headers folder into the platform folder
    const targetHeadersFolder = path.join(
      platformFolder,
      'React.Framework',
      'Headers',
    );

    // Link umbreall / header files into the platform folder
    Object.keys(umbrellaHeaderFiles).forEach(podSpecName => {
      const umbrellaHeaderFile = umbrellaHeaderFiles[podSpecName];

      // Create the target folder for the umbrella header file
      const targetPodSpecFolder = path.join(targetHeadersFolder, podSpecName);
      createFolderIfNotExists(targetPodSpecFolder);
      // Link the umbrella header file to the target folder
      try {
        fs.linkSync(
          umbrellaHeaderFile,
          path.join(targetPodSpecFolder, path.basename(umbrellaHeaderFile)),
        );
      } catch (error) {
        frameworkLog(
          `Error linking umbrella header file: ${error.message}. Check if the file exists.`,
          'error',
        );
      }
    });

    Object.keys(outputHeaderFiles).forEach(podSpecName => {
      outputHeaderFiles[podSpecName].forEach(headerFile => {
        // Create the target folder for the umbrella header file
        const targetPodSpecFolder = path.join(targetHeadersFolder, podSpecName);
        createFolderIfNotExists(targetPodSpecFolder);
        // Link the header file to the target folder - here we might have a few files with the same name
        // since we're flattening the imports. Yoga has two files - these can be ignored.
        const targetHeaderFile = path.join(
          targetPodSpecFolder,
          path.basename(headerFile),
        );
        if (!fs.existsSync(targetHeaderFile)) {
          try {
            fs.linkSync(headerFile, targetHeaderFile);
          } catch (error) {
            frameworkLog(
              `Error linking header file: ${error.message}. Check if the file exists.`,
              'error',
            );
          }
        }
      });
    });
  });
}

function createModuleMapFile(
  outputPath /*: string */,
  umbrellaHeaders /*: {[key: string]: string} */,
) {
  // Create/get the module map folder
  const moduleMapFolder = path.join(outputPath, 'Modules');
  createFolderIfNotExists(moduleMapFolder);

  // Create the module map file
  const moduleMapFile = path.join(moduleMapFolder, 'module.modulemap');

  frameworkLog('Creating module map file: ' + moduleMapFile);

  try {
    fs.writeFileSync(moduleMapFile, RN_MODULEMAP);
    return moduleMapFile;
  } catch (error) {
    frameworkLog(
      `Error creating module map file: ${error.message}. Check if the file exists.`,
      'error',
    );
    return null;
  }
}

function extractDestinationFromPath(symbolPath /*: string */) /*: string */ {
  if (symbolPath.includes('iphoneos')) {
    return 'iphoneos';
  }

  if (symbolPath.includes('iphonesimulator')) {
    return 'iphonesimulator';
  }

  if (symbolPath.includes('maccatalyst')) {
    return 'catalyst';
  }

  throw new Error(
    `Impossible to extract destination from ${symbolPath}. Valid destinations are iphoneos, iphonesimulator and catalyst.`,
  );
}

function signXCFramework(
  identity /*: string */,
  xcframeworkPath /*: string */,
) {
  frameworkLog('Signing XCFramework...');
  const command = `codesign --timestamp --sign "${identity}" ${xcframeworkPath}`;
  execSync(command, {stdio: 'inherit'});
}

module.exports = {
  buildXCFrameworks,
};

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
