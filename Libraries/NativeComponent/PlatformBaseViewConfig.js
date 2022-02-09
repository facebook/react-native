/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import {Platform} from 'react-native';
import type {PartialViewConfig} from '../Renderer/shims/ReactNativeTypes';
import ReactNativeStyleAttributes from '../Components/View/ReactNativeStyleAttributes';
import {
  DynamicallyInjectedByGestureHandler,
  ConditionallyIgnoredEventHandlers,
} from './ViewConfigIgnore';

type PartialViewConfigWithoutName = $Rest<
  PartialViewConfig,
  {uiViewClassName: string},
>;

const PlatformBaseViewConfig: PartialViewConfigWithoutName =
  Platform.OS === 'android'
    ? /**
       * On Android, Props are derived from a ViewManager and its ShadowNode.
       *
       * Where did we find these base platform props from?
       * - Nearly all component ViewManagers descend from BaseViewManager.
       * - BaseViewManagers' ShadowNodes descend from LayoutShadowNode.
       *
       * So, these ViewConfigs are generated from LayoutShadowNode and BaseViewManager.
       */
      {
        directEventTypes: {
          topAccessibilityAction: {
            registrationName: 'onAccessibilityAction',
          },
          topPointerEnter: {
            registrationName: 'pointerenter',
          },
          topPointerLeave: {
            registrationName: 'pointerleave',
          },
          topPointerMove: {
            registrationName: 'pointermove',
          },
          onGestureHandlerEvent: DynamicallyInjectedByGestureHandler({
            registrationName: 'onGestureHandlerEvent',
          }),
          onGestureHandlerStateChange: DynamicallyInjectedByGestureHandler({
            registrationName: 'onGestureHandlerStateChange',
          }),

          // Direct events from UIManagerModuleConstants.java
          topContentSizeChange: {
            registrationName: 'onContentSizeChange',
          },
          topScrollBeginDrag: {
            registrationName: 'onScrollBeginDrag',
          },
          topMessage: {
            registrationName: 'onMessage',
          },
          topSelectionChange: {
            registrationName: 'onSelectionChange',
          },
          topLoadingFinish: {
            registrationName: 'onLoadingFinish',
          },
          topMomentumScrollEnd: {
            registrationName: 'onMomentumScrollEnd',
          },
          topClick: {
            registrationName: 'onClick',
          },
          topLoadingStart: {
            registrationName: 'onLoadingStart',
          },
          topLoadingError: {
            registrationName: 'onLoadingError',
          },
          topMomentumScrollBegin: {
            registrationName: 'onMomentumScrollBegin',
          },
          topScrollEndDrag: {
            registrationName: 'onScrollEndDrag',
          },
          topScroll: {
            registrationName: 'onScroll',
          },
          topLayout: {
            registrationName: 'onLayout',
          },
        },
        bubblingEventTypes: {
          // Bubbling events from UIManagerModuleConstants.java
          topChange: {
            phasedRegistrationNames: {
              captured: 'onChangeCapture',
              bubbled: 'onChange',
            },
          },
          topSelect: {
            phasedRegistrationNames: {
              captured: 'onSelectCapture',
              bubbled: 'onSelect',
            },
          },
          topTouchEnd: {
            phasedRegistrationNames: {
              captured: 'onTouchEndCapture',
              bubbled: 'onTouchEnd',
            },
          },
          topTouchCancel: {
            phasedRegistrationNames: {
              captured: 'onTouchCancelCapture',
              bubbled: 'onTouchCancel',
            },
          },
          topTouchStart: {
            phasedRegistrationNames: {
              captured: 'onTouchStartCapture',
              bubbled: 'onTouchStart',
            },
          },
          topTouchMove: {
            phasedRegistrationNames: {
              captured: 'onTouchMoveCapture',
              bubbled: 'onTouchMove',
            },
          },
        },
        validAttributes: {
          // @ReactProps from BaseViewManager
          backgroundColor: {process: require('../StyleSheet/processColor')},
          transform: true,
          opacity: true,
          elevation: true,
          shadowColor: {process: require('../StyleSheet/processColor')},
          zIndex: true,
          renderToHardwareTextureAndroid: true,
          testID: true,
          nativeID: true,
          accessibilityLabelledBy: true,
          accessibilityLabel: true,
          accessibilityHint: true,
          accessibilityLanguage: true,
          accessibilityRole: true,
          accessibilityState: true,
          accessibilityActions: true,
          accessibilityValue: true,
          importantForAccessibility: true,
          rotation: true,
          scaleX: true,
          scaleY: true,
          translateX: true,
          translateY: true,
          accessibilityLiveRegion: true,

          // @ReactProps from LayoutShadowNode
          width: true,
          minWidth: true,
          collapsable: true,
          maxWidth: true,
          height: true,
          minHeight: true,
          maxHeight: true,
          flex: true,
          flexGrow: true,
          flexShrink: true,
          flexBasis: true,
          aspectRatio: true,
          flexDirection: true,
          flexWrap: true,
          alignSelf: true,
          alignItems: true,
          alignContent: true,
          justifyContent: true,
          overflow: true,
          display: true,

          margin: true,
          marginVertical: true,
          marginHorizontal: true,
          marginStart: true,
          marginEnd: true,
          marginTop: true,
          marginBottom: true,
          marginLeft: true,
          marginRight: true,

          padding: true,
          paddingVertical: true,
          paddingHorizontal: true,
          paddingStart: true,
          paddingEnd: true,
          paddingTop: true,
          paddingBottom: true,
          paddingLeft: true,
          paddingRight: true,

          borderWidth: true,
          borderStartWidth: true,
          borderEndWidth: true,
          borderTopWidth: true,
          borderBottomWidth: true,
          borderLeftWidth: true,
          borderRightWidth: true,

          start: true,
          end: true,
          left: true,
          right: true,
          top: true,
          bottom: true,

          position: true,
          onLayout: true,

          pointerenter: true,
          pointerleave: true,
          pointermove: true,

          style: ReactNativeStyleAttributes,
        },
      }
    : /**
       * On iOS, ViewManagers define all of a component's props.
       * All ViewManagers extend RCTViewManager, and RCTViewManager declares
       * these props.
       */
      {
        bubblingEventTypes: {
          // Generic Events
          topPress: {
            phasedRegistrationNames: {
              bubbled: 'onPress',
              captured: 'onPressCapture',
            },
          },
          topChange: {
            phasedRegistrationNames: {
              bubbled: 'onChange',
              captured: 'onChangeCapture',
            },
          },
          topFocus: {
            phasedRegistrationNames: {
              bubbled: 'onFocus',
              captured: 'onFocusCapture',
            },
          },
          topBlur: {
            phasedRegistrationNames: {
              bubbled: 'onBlur',
              captured: 'onBlurCapture',
            },
          },
          topSubmitEditing: {
            phasedRegistrationNames: {
              bubbled: 'onSubmitEditing',
              captured: 'onSubmitEditingCapture',
            },
          },
          topEndEditing: {
            phasedRegistrationNames: {
              bubbled: 'onEndEditing',
              captured: 'onEndEditingCapture',
            },
          },
          topKeyPress: {
            phasedRegistrationNames: {
              bubbled: 'onKeyPress',
              captured: 'onKeyPressCapture',
            },
          },

          // Touch Events
          topTouchStart: {
            phasedRegistrationNames: {
              bubbled: 'onTouchStart',
              captured: 'onTouchStartCapture',
            },
          },
          topTouchMove: {
            phasedRegistrationNames: {
              bubbled: 'onTouchMove',
              captured: 'onTouchMoveCapture',
            },
          },
          topTouchCancel: {
            phasedRegistrationNames: {
              bubbled: 'onTouchCancel',
              captured: 'onTouchCancelCapture',
            },
          },
          topTouchEnd: {
            phasedRegistrationNames: {
              bubbled: 'onTouchEnd',
              captured: 'onTouchEndCapture',
            },
          },
        },
        directEventTypes: {
          topAccessibilityAction: {
            registrationName: 'onAccessibilityAction',
          },
          topAccessibilityTap: {
            registrationName: 'onAccessibilityTap',
          },
          topMagicTap: {
            registrationName: 'onMagicTap',
          },
          topAccessibilityEscape: {
            registrationName: 'onAccessibilityEscape',
          },
          topLayout: {
            registrationName: 'onLayout',
          },
          onGestureHandlerEvent: DynamicallyInjectedByGestureHandler({
            registrationName: 'onGestureHandlerEvent',
          }),
          onGestureHandlerStateChange: DynamicallyInjectedByGestureHandler({
            registrationName: 'onGestureHandlerStateChange',
          }),
        },
        validAttributes: {
          // View Props
          accessible: true,
          accessibilityActions: true,
          accessibilityLabel: true,
          accessibilityHint: true,
          accessibilityLanguage: true,
          accessibilityValue: true,
          accessibilityViewIsModal: true,
          accessibilityElementsHidden: true,
          accessibilityIgnoresInvertColors: true,
          testID: true,
          backgroundColor: {process: require('../StyleSheet/processColor')},
          backfaceVisibility: true,
          opacity: true,
          shadowColor: {process: require('../StyleSheet/processColor')},
          shadowOffset: {diff: require('../Utilities/differ/sizesDiffer')},
          shadowOpacity: true,
          shadowRadius: true,
          needsOffscreenAlphaCompositing: true,
          overflow: true,
          shouldRasterizeIOS: true,
          transform: {diff: require('../Utilities/differ/matricesDiffer')},
          accessibilityRole: true,
          accessibilityState: true,
          nativeID: true,
          pointerEvents: true,
          removeClippedSubviews: true,
          borderRadius: true,
          borderColor: {process: require('../StyleSheet/processColor')},
          borderWidth: true,
          borderStyle: true,
          hitSlop: {diff: require('../Utilities/differ/insetsDiffer')},
          collapsable: true,

          borderTopWidth: true,
          borderTopColor: {process: require('../StyleSheet/processColor')},
          borderRightWidth: true,
          borderRightColor: {process: require('../StyleSheet/processColor')},
          borderBottomWidth: true,
          borderBottomColor: {process: require('../StyleSheet/processColor')},
          borderLeftWidth: true,
          borderLeftColor: {process: require('../StyleSheet/processColor')},
          borderStartWidth: true,
          borderStartColor: {process: require('../StyleSheet/processColor')},
          borderEndWidth: true,
          borderEndColor: {process: require('../StyleSheet/processColor')},

          borderTopLeftRadius: true,
          borderTopRightRadius: true,
          borderTopStartRadius: true,
          borderTopEndRadius: true,
          borderBottomLeftRadius: true,
          borderBottomRightRadius: true,
          borderBottomStartRadius: true,
          borderBottomEndRadius: true,
          display: true,
          zIndex: true,

          // ShadowView properties
          top: true,
          right: true,
          start: true,
          end: true,
          bottom: true,
          left: true,

          width: true,
          height: true,

          minWidth: true,
          maxWidth: true,
          minHeight: true,
          maxHeight: true,

          // Also declared as ViewProps
          // borderTopWidth: true,
          // borderRightWidth: true,
          // borderBottomWidth: true,
          // borderLeftWidth: true,
          // borderStartWidth: true,
          // borderEndWidth: true,
          // borderWidth: true,

          marginTop: true,
          marginRight: true,
          marginBottom: true,
          marginLeft: true,
          marginStart: true,
          marginEnd: true,
          marginVertical: true,
          marginHorizontal: true,
          margin: true,

          paddingTop: true,
          paddingRight: true,
          paddingBottom: true,
          paddingLeft: true,
          paddingStart: true,
          paddingEnd: true,
          paddingVertical: true,
          paddingHorizontal: true,
          padding: true,

          flex: true,
          flexGrow: true,
          flexShrink: true,
          flexBasis: true,
          flexDirection: true,
          flexWrap: true,
          justifyContent: true,
          alignItems: true,
          alignSelf: true,
          alignContent: true,
          position: true,
          aspectRatio: true,

          // Also declared as ViewProps
          // overflow: true,
          // display: true,

          direction: true,

          style: ReactNativeStyleAttributes,

          ...ConditionallyIgnoredEventHandlers({
            onLayout: true,
            onMagicTap: true,
            onAccessibilityAction: true,
            onAccessibilityEscape: true,
            onAccessibilityTap: true,
          }),
        },
      };

export default PlatformBaseViewConfig;
