# These are the headers copied by the React.xcodeproj's 'Copy Headers' build phase.
# Changes in React.xcodeproj 'Copy Headers' phase must be manually updated here as well.
set(REACT_SRC_HEADERS
  Base/RCTAssert.h
  Base/RCTBridge+Cxx.h
  Base/RCTBridge+Private.h
  Base/RCTBridge.h
  Base/RCTBridgeDelegate.h
  Base/RCTBridgeMethod.h
  Base/RCTBridgeModule.h
  Base/RCTBundleURLProvider.h
  Base/RCTConvert.h
  Base/RCTDefines.h
  Base/RCTDisplayLink.h
  Base/RCTErrorCustomizer.h
  Base/RCTErrorInfo.h
  Base/RCTEventDispatcher.h
  Base/RCTFrameUpdate.h
  Base/RCTImageSource.h
  Base/RCTInvalidating.h
  Base/RCTJavaScriptExecutor.h
  Base/RCTJavaScriptLoader.h
  Base/RCTJSStackFrame.h
  Base/RCTKeyCommands.h
  Base/RCTLog.h
  Base/RCTModuleData.h
  Base/RCTModuleMethod.h
  Base/RCTMultipartDataTask.h
  Base/RCTMultipartStreamReader.h
  Base/RCTNullability.h
  Base/RCTParserUtils.h
  Base/RCTPerformanceLogger.h
  Base/RCTPlatform.h
  Base/RCTPlatformDisplayLink.h
  Base/RCTRootView.h
  Base/RCTRootViewDelegate.h
  Base/RCTTouchEvent.h
  Base/RCTTouchHandler.h
  Base/RCTUIKit.h
  Base/RCTURLRequestDelegate.h
  Base/RCTURLRequestHandler.h
  Base/RCTUtils.h
  Base/RCTVersion.h
  Base/Surface/RCTSurface.h
  Base/Surface/RCTSurfaceDelegate.h
  Base/Surface/RCTSurfaceRootShadowView.h
  Base/Surface/RCTSurfaceRootShadowViewDelegate.h
  Base/Surface/RCTSurfaceRootView.h
  Base/Surface/RCTSurfaceStage.h
  Base/Surface/RCTSurfaceView.h
  Base/Surface/SurfaceHostingView/RCTSurfaceHostingView.h
  Base/Surface/SurfaceHostingView/RCTSurfaceSizeMeasureMode.h
  DevSupport/RCTDevLoadingView.h
  DevSupport/RCTDevMenu.h
  DevSupport/RCTPackagerClient.h
  ../Libraries/Image/RCTImageLoader.h
  ../Libraries/Image/RCTImageStoreManager.h
  ../Libraries/Image/RCTResizeMode.h
  ../Libraries/LinkingIOS/RCTLinkingManager.h
  ../Libraries/Network/RCTNetworking.h
  ../Libraries/Network/RCTNetworkTask.h
  ../Libraries/PushNotificationIOS/RCTPushNotificationManager.h
  ../Libraries/WebSocket/RCTWebSocketModule.h
  Modules/RCTAccessibilityManager.h
  Modules/RCTAlertManager.h
  Modules/RCTAppState.h
  Modules/RCTAsyncLocalStorage.h
  Modules/RCTClipboard.h
  Modules/RCTDevSettings.h
  Modules/RCTEventEmitter.h
  Modules/RCTExceptionsManager.h
  Modules/RCTI18nManager.h
  Modules/RCTI18nUtil.h
  Modules/RCTKeyboardObserver.h
  Modules/RCTLayoutAnimation.h
  Modules/RCTLayoutAnimationGroup.h
  Modules/RCTRedBox.h
  Modules/RCTSourceCode.h
  Modules/RCTStatusBarManager.h
  Modules/RCTTiming.h
  Modules/RCTUIManager.h
  Modules/RCTUIManagerObserverCoordinator.h
  Modules/RCTUIManagerUtils.h
  Profiler/RCTFPSGraph.h
  Profiler/RCTMacros.h
  Profiler/RCTProfile.h
  Views/RCTActivityIndicatorView.h
  Views/RCTActivityIndicatorViewManager.h
  Views/RCTAnimationType.h
  Views/RCTAutoInsetsProtocol.h
  Views/RCTBorderDrawing.h
  Views/RCTBorderStyle.h
  Views/RCTComponent.h
  Views/RCTComponentData.h
  Views/RCTConvert+CoreLocation.h
  Views/RCTFont.h
  Views/RCTLayout.h
  Views/RCTModalHostView.h
  Views/RCTModalHostViewController.h
  Views/RCTModalHostViewManager.h
  Views/RCTPicker.h
  Views/RCTPickerManager.h
  Views/RCTPointerEvents.h
  Views/RCTProgressViewManager.h
  Views/RCTRefreshControl.h
  Views/RCTRefreshControlManager.h
  Views/RCTRootShadowView.h
  Views/RCTSegmentedControl.h
  Views/RCTSegmentedControlManager.h
  Views/RCTShadowView+Layout.h
  Views/RCTShadowView.h
  Views/RCTSlider.h
  Views/RCTSliderManager.h
  Views/RCTSwitch.h
  Views/RCTSwitchManager.h
  Views/RCTTabBar.h
  Views/RCTTabBarItem.h
  Views/RCTTabBarItemManager.h
  Views/RCTTabBarManager.h
  Views/RCTTextDecorationLineType.h
  Views/RCTView.h
  Views/RCTViewManager.h
  Views/RCTWebView.h
  Views/RCTWebViewManager.h
  Views/RCTWrapperViewController.h
  Views/ScrollView/RCTScrollableProtocol.h
  Views/ScrollView/RCTScrollContentView.h
  Views/ScrollView/RCTScrollView.h
  Views/ScrollView/RCTScrollViewManager.h
  Views/UIView+React.h
  )

set(REACT_INCLUDE
  ${CMAKE_BINARY_DIR}/include/React/
  )

# RegEx that converts REACT_SRC_HEADERS into REACT_TRG_HEADERS by transforming "path/file.h" to "${REACT_INCLUDE}/file.h"
string(REGEX REPLACE
  "([^;\/]+\/)*([^;\/\.]+)\.([^;\/\.]+)"
  "\$\{REACT_INCLUDE\}\/\\2.\\3"
  REACT_TRG_HEADERS
  "${REACT_SRC_HEADERS}"
  )

add_custom_command(OUTPUT ${REACT_TRG_HEADERS}
  COMMAND mkdir -p ${REACT_INCLUDE}
  COMMAND cp ${REACT_SRC_HEADERS} ${REACT_INCLUDE}
  WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
  COMMENT "Copying React public headers"
  )

add_custom_target(React_headers DEPENDS ${REACT_TRG_HEADERS})

add_library(React INTERFACE)

target_include_directories(React INTERFACE "${CMAKE_BINARY_DIR}/include")

add_dependencies(React React_headers)
