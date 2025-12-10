/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/*::
export type PodSpecConfiguration = $ReadOnly<{
  name: string,
  headerPatterns: Array<string>,
  headerDir?: string,
  excludePatterns?: Array<string>,
  subSpecs?: $ReadOnlyArray<PodSpecConfiguration>,
  preservePaths?: Array<string>,
}>;
*/

// Remember that our GLOB library doesn't like {h} in its patterns, so we use **/*.h instead of **/*.{h}
const PodSpecConfigurations /*: {[key: string]: PodSpecConfiguration} */ = {
  'Libraries/ActionSheetIOS/React-RCTActionSheet.podspec': {
    name: 'React-RCTActionSheet',
    headerPatterns: [],
    headerDir: 'RCTActionSheet',
  },

  'Libraries/AppDelegate/React-RCTAppDelegate.podspec': {
    name: 'React-RCTAppDelegate',
    headerPatterns: ['**/*.h'],
    headerDir: '',
  },

  'Libraries/Blob/React-RCTBlob.podspec': {
    name: 'React-RCTBlob',
    headerPatterns: ['**/*.h'],
    headerDir: 'RCTBlob',
  },

  'Libraries/FBLazyVector/FBLazyVector.podspec': {
    name: 'FBLazyVector',
    headerPatterns: ['**/*.h'],
    headerDir: 'FBLazyVector',
  },

  'Libraries/Image/React-RCTImage.podspec': {
    name: 'React-RCTImage',
    headerPatterns: ['**/*.h'],
    headerDir: 'RCTImage',
  },

  'Libraries/LinkingIOS/React-RCTLinking.podspec': {
    name: 'React-RCTLinking',
    headerPatterns: [],
    headerDir: 'RCTLinking',
  },

  'Libraries/NativeAnimation/React-RCTAnimation.podspec': {
    name: 'React-RCTAnimation',
    headerPatterns: ['**/*.h'],
    headerDir: 'RCTAnimation',
  },

  'Libraries/Network/React-RCTNetwork.podspec': {
    name: 'React-RCTNetwork',
    headerPatterns: [],
    headerDir: 'RCTNetwork',
  },

  'Libraries/PushNotificationIOS/React-RCTPushNotification.podspec': {
    name: '',
    headerPatterns: [],
    headerDir: '',
  },

  'Libraries/Required/RCTRequired.podspec': {
    name: 'RCTRequired',
    headerPatterns: ['*.h'],
    headerDir: 'RCTRequired',
  },

  'Libraries/Settings/React-RCTSettings.podspec': {
    name: 'React-RCTSettings',
    headerPatterns: ['*.h'],
    headerDir: 'RCTSettings',
  },

  'Libraries/Text/React-RCTText.podspec': {
    name: 'React-RCTText',
    headerPatterns: ['**/*.h'],
    headerDir: 'RCTText',
  },

  'Libraries/TypeSafety/RCTTypeSafety.podspec': {
    name: 'RCTTypeSafety',
    headerPatterns: ['**/*.h'],
    headerDir: 'RCTTypeSafety',
  },

  'Libraries/Vibration/React-RCTVibration.podspec': {
    name: 'React-RCTVibration',
    headerPatterns: ['**/*.h'],
    headerDir: 'RCTVibration',
  },

  'React.podspec': {name: '', headerPatterns: [], headerDir: ''},

  'React/CoreModules/React-CoreModules.podspec': {
    name: 'React-CoreModules',
    headerPatterns: ['**/*.h'],
    headerDir: 'CoreModules',
    excludePatterns: ['PlatformStubs/**/*'], // TODO: Only for iOS!
  },

  'React/React-RCTFabric.podspec': {
    name: 'React-RCTFabric',
    headerPatterns: ['Fabric/**/*.h'],
    headerDir: 'React',
    excludePatterns: ['**/tests/*', '**/android/*'],
  },

  'React/React-RCTFBReactNativeSpec.podspec': {
    name: 'React-RCTFBReactNativeSpec',
    headerPatterns: ['FBReactNativeSpec/**/*.h'],
    headerDir: 'FBReactNativeSpec',
    excludePatterns: ['FBReactNativeSpec/react/renderer/components/**'],
    subSpecs: [
      {
        name: 'components',
        headerPatterns: [
          'FBReactNativeSpec/react/renderer/components/FBReactNativeSpec/**/*.h',
        ],
        headerDir: 'react/renderer/components/FBReactNativeSpec',
      },
    ],
  },

  'React/Runtime/React-RCTRuntime.podspec': {
    name: 'React-RCTRuntime',
    headerPatterns: ['*.h'],
    headerDir: 'React',
  },

  'ReactApple/Libraries/RCTFoundation/RCTDeprecation/RCTDeprecation.podspec': {
    name: 'RCTDeprecation',
    headerPatterns: ['Exported/*.h'],
    headerDir: '',
  },

  'ReactApple/RCTSwiftUI/RCTSwiftUI.podspec': {
    name: 'RCTSwiftUI',
    headerPatterns: ['*.h'],
    headerDir: 'RCTSwiftUI',
  },

  'ReactApple/RCTSwiftUIWrapper/RCTSwiftUIWrapper.podspec': {
    name: 'RCTSwiftUIWrapper',
    headerPatterns: ['*.h'],
    headerDir: 'RCTSwiftUIWrapper',
  },

  'ReactCommon/callinvoker/React-callinvoker.podspec': {
    name: 'React-callinvoker',
    headerPatterns: ['**/*.h'],
    headerDir: 'ReactCommon',
  },

  'ReactCommon/cxxreact/React-cxxreact.podspec': {
    name: 'React-cxxreact',
    headerPatterns: ['*.h'],
    headerDir: 'cxxreact',
  },

  'ReactCommon/hermes/executor/React-jsitracing.podspec': {
    name: 'React-jsitracing',
    headerPatterns: ['JSITracing.h'],
  },

  'ReactCommon/hermes/React-hermes.podspec': {
    name: 'React-hermes',
    headerPatterns: [
      'executor/*.h',
      'inspector-modern/chrome/*.h',
      'executor/HermesExecutorFactory.h',
    ],
    headerDir: 'reacthermes',
  },

  'ReactCommon/jserrorhandler/React-jserrorhandler.podspec': {
    name: 'React-jserrorhandler',
    headerPatterns: ['JsErrorHandler.h', 'StackTraceParser.h'],
    headerDir: 'jserrorhandler',
  },

  'ReactCommon/jsi/React-jsi.podspec': {
    name: 'React-jsi',
    headerPatterns: ['**/*.h'],
    headerDir: 'jsi',
    excludePatterns: ['**/test/*'],
  },

  'ReactCommon/jsiexecutor/React-jsiexecutor.podspec': {
    name: 'React-jsiexecutor',
    headerPatterns: ['jsireact/*.h'],
    headerDir: 'jsireact',
  },

  'ReactCommon/jsinspector-modern/cdp/React-jsinspectorcdp.podspec': {
    name: 'React-jsinspectorcdp',
    headerPatterns: ['*.h'],
    headerDir: 'jsinspector-modern/cdp',
  },

  'ReactCommon/jsinspector-modern/network/React-jsinspectornetwork.podspec': {
    name: 'React-jsinspectornetwork',
    headerPatterns: ['*.h'],
    headerDir: 'jsinspector-modern/network',
  },

  'ReactCommon/jsinspector-modern/React-jsinspector.podspec': {
    name: 'React-jsinspector',
    headerPatterns: ['*.h'],
    headerDir: 'jsinspector-modern',
  },

  'ReactCommon/jsinspector-modern/tracing/React-jsinspectortracing.podspec': {
    name: 'React-jsinspectortracing',
    headerPatterns: ['*.h'],
    headerDir: 'jsinspector-modern/tracing',
  },

  'ReactCommon/jsitooling/React-jsitooling.podspec': {
    name: 'React-jsitooling',
    headerPatterns: ['react/runtime/*.h'],
    headerDir: 'react/runtime',
  },

  'ReactCommon/logger/React-logger.podspec': {
    name: 'React-logger',
    headerPatterns: ['*.h'],
    headerDir: 'logger',
  },

  'ReactCommon/oscompat/React-oscompat.podspec': {
    name: 'React-oscompat',
    headerPatterns: ['*.h'],
    headerDir: 'oscompat',
  },

  'ReactCommon/React-Fabric.podspec': {
    name: 'React-Fabric',
    headerPatterns: [],
    headerDir: '',
    subSpecs: [
      {
        name: 'animated',
        headerPatterns: ['react/renderer/animated/**/*.h'],
        excludePatterns: ['react/renderer/animated/tests'],
        headerDir: 'react/renderer/animated',
      },

      {
        name: 'animations',
        headerPatterns: ['react/renderer/animations/**/*.h'],
        excludePatterns: ['react/renderer/animations/tests'],
        headerDir: 'react/renderer/animations',
      },

      {
        name: 'animationbackend',
        headerPatterns: ['react/renderer/animationbackend/**/*.h'],
        headerDir: 'react/renderer/animationbackend',
      },

      {
        name: 'attributedstring',
        headerPatterns: ['react/renderer/attributedstring/**/*.h'],
        excludePatterns: ['react/renderer/attributedstring/tests'],
        headerDir: 'react/renderer/attributedstring',
      },

      {
        name: 'bridging',
        headerPatterns: ['react/renderer/bridging/**/*.h'],
        excludePatterns: ['react/renderer/bridging/tests'],
        headerDir: 'react/renderer/bridging',
      },

      {
        name: 'core',
        headerPatterns: ['react/renderer/core/**/*.h'],
        excludePatterns: ['react/renderer/core/tests'],
        headerDir: 'react/renderer/core',
      },

      {
        name: 'componentregistry',
        headerPatterns: ['react/renderer/componentregistry/*.h'],
        headerDir: 'react/renderer/componentregistry',
      },

      {
        name: 'componentregistrynative',
        headerPatterns: ['react/renderer/componentregistry/native/**/*.h'],
        headerDir: 'react/renderer/componentregistry/native',
      },

      {
        name: 'components',
        headerPatterns: [],
        headerDir: '',
        subSpecs: [
          {
            name: 'root',
            headerPatterns: ['react/renderer/components/root/**/*.h'],
            excludePatterns: ['react/renderer/components/root/tests'],
            headerDir: 'react/renderer/components/root',
          },
          {
            name: 'view',
            headerPatterns: [
              'react/renderer/components/view/*.h',
              'react/renderer/components/view/platform/cxx/**/*.h',
            ],
            headerDir: 'react/renderer/components/view',
          },

          {
            name: 'scrollview',
            headerPatterns: ['react/renderer/components/scrollview/**/*.h'],
            headerDir: 'react/renderer/components/scrollview',
            excludePatterns: [
              'react/renderer/components/scrollview/tests',
              'react/renderer/components/scrollview/platform/android',
            ],
          },

          {
            name: 'legacyviewmanagerinterop',
            headerPatterns: [
              'react/renderer/components/legacyviewmanagerinterop/**/*.h',
            ],
            excludePatterns: [
              'react/renderer/components/legacyviewmanagerinterop/tests',
            ],
            headerDir: 'react/renderer/components/legacyviewmanagerinterop',
          },
        ],
      },

      {
        name: 'dom',
        headerPatterns: ['react/renderer/dom/**/*.h'],
        excludePatterns: ['react/renderer/dom/tests'],
        headerDir: 'react/renderer/dom',
      },

      {
        name: 'scheduler',
        headerPatterns: ['react/renderer/scheduler/**/*.h'],
        headerDir: 'react/renderer/scheduler',
      },

      {
        name: 'imagemanager',
        headerPatterns: ['react/renderer/imagemanager/*.h'],
        headerDir: 'react/renderer/imagemanager',
      },

      {
        name: 'mounting',
        headerPatterns: ['react/renderer/mounting/**/*.h'],
        excludePatterns: ['react/renderer/mounting/tests'],
        headerDir: 'react/renderer/mounting',
      },

      {
        name: 'observers',
        headerPatterns: [],
        subSpecs: [
          {
            name: 'events',
            headerPatterns: ['react/renderer/observers/events/**/*.h'],
            excludePatterns: ['react/renderer/observers/events/tests'],
            headerDir: 'react/renderer/observers/events',
          },
        ],
      },

      {
        name: 'templateprocessor',
        headerPatterns: ['react/renderer/templateprocessor/**/*.h'],
        excludePatterns: ['react/renderer/templateprocessor/tests'],
        headerDir: 'react/renderer/templateprocessor',
      },

      {
        name: 'telemetry',
        headerPatterns: ['react/renderer/telemetry/**/*.h'],
        excludePatterns: ['react/renderer/telemetry/tests'],
        headerDir: 'react/renderer/telemetry',
      },

      {
        name: 'consistency',
        headerPatterns: ['react/renderer/consistency/**/*.h'],
        headerDir: 'react/renderer/consistency',
      },

      {
        name: 'uimanager',
        subSpecs: [
          {
            name: 'consistency',
            headerPatterns: ['react/renderer/uimanager/consistency/*.h'],
            headerDir: 'react/renderer/uimanager/consistency',
          },
        ],

        headerPatterns: ['react/renderer/uimanager/*.h'],
        headerDir: 'react/renderer/uimanager',
      },

      {
        name: 'leakchecker',
        headerPatterns: ['react/renderer/leakchecker/**/*.h'],
        excludePatterns: ['react/renderer/leakchecker/tests'],
        headerDir: 'react/renderer/leakchecker',
      },
    ],
  },

  'ReactCommon/React-FabricComponents.podspec': {
    name: 'React-FabricComponents',
    headerPatterns: [],
    headerDir: '',
    subSpecs: [
      {
        name: 'components',
        headerPatterns: [],
        headerDir: '',
        subSpecs: [
          {
            name: 'inputaccessory',
            headerPatterns: ['react/renderer/components/inputaccessory/**/*.h'],
            excludePatterns: ['react/renderer/components/inputaccessory/tests'],
            headerDir: 'react/renderer/components/inputaccessory',
          },

          {
            name: 'modal',
            headerPatterns: ['react/renderer/components/modal/*.h'],
            excludePatterns: ['react/renderer/components/modal/tests'],
            headerDir: 'react/renderer/components/modal',
          },

          {
            name: 'safeareaview',
            headerPatterns: ['react/renderer/components/safeareaview/**/*.h'],
            excludePatterns: ['react/renderer/components/safeareaview/tests'],
            headerDir: 'react/renderer/components/safeareaview',
          },

          {
            name: 'scrollview',
            headerPatterns: [
              'react/renderer/components/scrollview/*.h',
              'react/renderer/components/scrollview/platform/cxx/**/*.h',
            ],
            excludePatterns: ['react/renderer/components/scrollview/tests'],
            headerDir: 'react/renderer/components/scrollview',
          },

          {
            name: 'text',
            headerPatterns: [
              'react/renderer/components/text/*.h',
              'react/renderer/components/text/platform/cxx/**/*.h',
            ],
            headerDir: 'react/renderer/components/text',
          },

          {
            name: 'iostextinput',
            headerPatterns: [
              'react/renderer/components/textinput/*.h',
              'react/renderer/components/textinput/platform/ios/**/*.h',
            ],
            headerDir: 'react/renderer/components/iostextinput',
          },

          {
            name: 'switch',
            headerPatterns: [
              'react/renderer/components/switch/iosswitch/**/*.h',
            ],
            excludePatterns: [
              'react/renderer/components/switch/iosswitch/**/MacOS*.{m,mm,cpp,h}',
            ],
            headerDir: 'react/renderer/components/switch/',
          },

          {
            name: 'textinput',
            headerPatterns: ['react/renderer/components/textinput/**/*.h'],
            headerDir: 'react/renderer/components/textinput',
          },

          {
            name: 'unimplementedview',
            headerPatterns: [
              'react/renderer/components/unimplementedview/**/*.h',
            ],
            excludePatterns: [
              'react/renderer/components/unimplementedview/tests',
            ],
            headerDir: 'react/renderer/components/unimplementedview',
          },

          {
            name: 'virtualview',
            headerPatterns: [
              'react/renderer/components/virtualview/**/*.{m,mm,cpp,h}',
            ],
            excludePatterns: ['react/renderer/components/virtualview/tests'],
            headerDir: 'react/renderer/components/virtualview',
          },

          {
            name: 'virtualviewexperimental',
            headerPatterns: [
              'react/renderer/components/virtualviewexperimental/**/*.h',
            ],
            excludePatterns: [
              'react/renderer/components/virtualviewexperimental/tests',
            ],
            headerDir: 'react/renderer/components/virtualviewexperimental',
          },

          {
            name: 'rncore',
            headerPatterns: ['react/renderer/components/rncore/**/*.h'],
            headerDir: 'react/renderer/components/rncore',
          },
        ],
      },
      {
        name: 'textlayoutmanager',

        headerPatterns: [
          'react/renderer/textlayoutmanager/platform/ios/**/*.h',
          'react/renderer/textlayoutmanager/*.h',
        ],
        excludePatterns: [
          'react/renderer/textlayoutmanager/tests',
          'react/renderer/textlayoutmanager/platform/android',
          'react/renderer/textlayoutmanager/platform/cxx',
        ],
        headerDir: 'react/renderer/textlayoutmanager',
      },
    ],
  },

  'ReactCommon/React-FabricImage.podspec': {
    name: 'React-FabricImage',
    headerPatterns: ['react/renderer/components/image/**/*.h'],
    excludePatterns: ['react/renderer/components/image/tests'],
    headerDir: 'react/renderer/components/image',
  },

  'ReactCommon/React-Mapbuffer.podspec': {
    name: 'React-Mapbuffer',
    headerPatterns: ['react/renderer/mapbuffer/*.h'],
    headerDir: 'react/renderer/mapbuffer',
  },

  'ReactCommon/react/debug/React-debug.podspec': {
    name: 'React-debug',
    headerPatterns: ['**/*.h'],
    headerDir: 'react/debug',
  },

  'ReactCommon/react/featureflags/React-featureflags.podspec': {
    name: 'React-featureflags',
    headerPatterns: ['**/*.h'],
    headerDir: 'react/featureflags',
  },

  'ReactCommon/react/nativemodule/core/platform/ios/React-NativeModulesApple.podspec':
    {
      name: 'React-NativeModulesApple',
      headerPatterns: ['ReactCommon/**/*.h'],
      headerDir: 'ReactCommon',
    },

  'ReactCommon/react/nativemodule/defaults/React-defaultsnativemodule.podspec':
    {
      name: 'React-defaultsnativemodule',
      headerPatterns: ['*.h'],
      headerDir: 'react/nativemodule/defaults',
    },

  'ReactCommon/react/nativemodule/dom/React-domnativemodule.podspec': {
    name: 'React-domnativemodule',
    headerPatterns: ['*.h'],
    headerDir: 'react/nativemodule/dom',
  },

  'ReactCommon/react/nativemodule/featureflags/React-featureflagsnativemodule.podspec':
    {
      name: 'React-featureflagsnativemodule',
      headerPatterns: ['*.h'],
      headerDir: 'react/nativemodule/featureflags',
    },

  'ReactCommon/react/nativemodule/idlecallbacks/React-idlecallbacksnativemodule.podspec':
    {
      name: 'React-idlecallbacksnativemodule',
      headerPatterns: ['*.h'],
      headerDir: 'react/nativemodule/idlecallbacks',
    },

  'ReactCommon/react/nativemodule/microtasks/React-microtasksnativemodule.podspec':
    {
      name: 'React-microtasksnativemodule',
      headerPatterns: ['*.h'],
      headerDir: 'react/nativemodule/microtasks',
    },
  // We don't need to include samples in our header file structure.
  //   'ReactCommon/react/nativemodule/samples/ReactCommon-Samples.podspec':
  //     {
  //       name: 'ReactCommon-Samples',
  //       headerPatterns: ['**/*.h'],
  //       headerDir: 'react/nativemodule/samples',
  //     },

  'ReactCommon/react/nativemodule/webperformance/React-webperformancenativemodule.podspec':
    {
      name: 'React-webperformancenativemodule',
      headerPatterns: ['*.h'],
      headerDir: 'react/nativemodule/webperformance',
    },

  'ReactCommon/react/networking/React-networking.podspec': {
    name: 'React-networking',
    headerPatterns: ['*.h'],
    headerDir: 'react/networking',
  },

  'ReactCommon/react/performance/cdpmetrics/React-performancecdpmetrics.podspec':
    {
      name: 'React-performancecdpmetrics',
      headerPatterns: ['*.h'],
      headerDir: 'react/performance/cdpmetrics',
    },

  'ReactCommon/react/performance/timeline/React-performancetimeline.podspec': {
    name: 'React-performancetimeline',
    headerPatterns: ['*.h'],
    headerDir: 'react/performance/timeline',
  },

  'ReactCommon/react/renderer/consistency/React-rendererconsistency.podspec': {
    name: 'React-rendererconsistency',
    headerPatterns: ['*.h'],
    headerDir: 'react/renderer/consistency',
  },

  'ReactCommon/react/renderer/css/React-renderercss.podspec': {
    name: 'React-renderercss',
    headerPatterns: ['*.h'],
    headerDir: 'react/renderer/css',
  },

  'ReactCommon/react/renderer/debug/React-rendererdebug.podspec': {
    name: 'React-rendererdebug',
    headerPatterns: ['*.h'],
    headerDir: 'react/renderer/debug',
  },

  'ReactCommon/react/renderer/graphics/React-graphics.podspec': {
    name: 'React-graphics',
    headerPatterns: ['*.h', 'platform/ios/**/*.h'],
    headerDir: 'react/renderer/graphics',
  },

  'ReactCommon/react/renderer/imagemanager/platform/ios/React-ImageManager.podspec':
    {
      name: 'React-ImageManager',
      headerPatterns: ['**/*.h'],
      headerDir: 'react/renderer/imagemanager',
    },

  'ReactCommon/react/renderer/runtimescheduler/React-runtimescheduler.podspec':
    {
      name: 'React-runtimescheduler',
      headerPatterns: ['*.h'],
      headerDir: 'react/renderer/runtimescheduler',
    },

  'ReactCommon/react/runtime/platform/ios/React-RuntimeApple.podspec': {
    name: 'React-RuntimeApple',
    headerPatterns: ['ReactCommon/*.h'],
    headerDir: 'ReactCommon',
    excludePatterns: ['ReactCommon/RCTJscInstance.h'],
  },

  'ReactCommon/react/runtime/React-RuntimeCore.podspec': {
    name: 'React-RuntimeCore',
    headerPatterns: ['*.h', 'nativeviewconfig/*.h'],
    headerDir: 'react/runtime',
  },

  'ReactCommon/react/runtime/React-RuntimeHermes.podspec': {
    name: 'React-RuntimeHermes',
    headerPatterns: ['hermes/*.h'],
    headerDir: 'react/runtime/hermes',
  },

  'ReactCommon/react/timing/React-timing.podspec': {
    name: 'React-timing',
    headerPatterns: ['**/*.h'],
    headerDir: 'react/timing',
  },

  'ReactCommon/react/utils/React-utils.podspec': {
    name: 'React-utils',
    headerPatterns: ['*.h', 'platform/ios/**/*.h'],
    headerDir: 'react/utils',
    excludePatterns: ['tests'],
  },

  'ReactCommon/ReactCommon.podspec': {
    name: 'ReactCommon',
    headerPatterns: [],
    headerDir: 'ReactCommon',
    subSpecs: [
      {
        name: 'turbomodule',
        headerPatterns: [],
        subSpecs: [
          {
            name: 'bridging',
            headerPatterns: ['react/bridging/**/*.h'],
            headerDir: 'react/bridging',
            excludePatterns: ['react/bridging/tests/**/*'],
          },
          {
            name: 'core',
            headerPatterns: ['react/nativemodule/core/ReactCommon/**/*.h'],
          },
        ],
      },
    ],
  },

  'ReactCommon/reactperflogger/React-perflogger.podspec': {
    name: 'React-perflogger',
    headerPatterns: ['reactperflogger/*.h', 'fusebox/*.h'],
    headerDir: 'reactperflogger',
  },

  'ReactCommon/runtimeexecutor/React-runtimeexecutor.podspec': {
    name: 'React-runtimeexecutor',
    headerPatterns: ['ReactCommon/*.h', 'platform/ios/**/*.h'],
    headerDir: 'ReactCommon',
  },

  'ReactCommon/yoga/Yoga.podspec': {
    name: 'Yoga',
    headerPatterns: ['yoga/**/*.h'],
    headerDir: 'yoga',
    preservePaths: ['yoga/**/*.h'],
  },
  // These should be distributed through the Hermes xcframework.
  //   'sdks/hermes/hermes-engine.podspec':
  //     {
  //       name: 'hermes-engine',
  //       headerPatterns: [],
  //       headerDir: '',
  //       preservePaths: ['**/*.*'],
  //       subSpecs: [
  //         {
  //           name: 'Hermes',
  //           headerPatterns: ['destroot/include/hermes/*.h'],
  //           headerDir: 'hermes',
  //         },

  //         {
  //           name: 'cdp',
  //           headerPatterns: ['destroot/include/hermes/cdp/*.h'],
  //           headerDir: 'hermes/cdp',
  //         },

  //         {
  //           name: 'inspector',
  //           headerPatterns: ['destroot/include/hermes/inspector/*.h'],
  //           headerDir: 'hermes/inspector',
  //         },

  //         {
  //           name: 'inspector_chrome',
  //           headerPatterns: ['destroot/include/hermes/inspector/chrome/*.h'],
  //           headerDir: 'hermes/inspector/chrome',
  //         },

  //         {
  //           name: 'jsi',
  //           headerPatterns: ['destroot/include/jsi/*.h'],
  //           headerDir: 'jsi',
  //         },

  //         {
  //           name: 'Public',
  //           headerPatterns: ['public/hermes/Public/*.h'],
  //           headerDir: 'hermes/Public',
  //         },
  //       ],
  //     },

  'React-Core.podspec': {
    name: 'React-Core',
    headerPatterns: [],
    headerDir: 'React',
    subSpecs: [
      {
        name: 'Default',
        headerPatterns: ['React/**/*.h'],
        excludePatterns: [
          'React/CoreModules/**/*',
          'React/DevSupport/**/*',
          'React/Fabric/**/*',
          'React/FBReactNativeSpec/**/*',
          'React/Tests/**/*',
          'React/Inspector/**/*',
          'React/Runtime/**/*',
          'React/CxxBridge/JSCExecutorFactory.h',
        ],
      },
      {
        name: 'DevSupport',
        headerPatterns: ['React/DevSupport/*.h', 'React/Inspector/*.h'],
      },
      {name: 'RCTWebSocket', headerPatterns: ['Libraries/WebSocket/*.h']},
      {
        name: 'CoreModulesHeaders',
        headerPatterns: ['React/CoreModules/**/*.h'],
      },
      {
        name: 'RCTActionSheetHeaders',
        headerPatterns: ['Libraries/ActionSheetIOS/*.h'],
      },
      {
        name: 'RCTAnimationHeaders',
        headerPatterns: ['Libraries/NativeAnimation/{Drivers/*,Nodes/*,*}.h'],
      },
      {
        name: 'RCTBlobHeaders',
        headerPatterns: [
          'Libraries/Blob/{RCTBlobManager,RCTFileReaderModule}.h',
        ],
      },
      {name: 'RCTImageHeaders', headerPatterns: ['Libraries/Image/*.h']},
      {
        name: 'RCTLinkingHeaders',
        headerPatterns: ['Libraries/LinkingIOS/*.h'],
      },
      {name: 'RCTNetworkHeaders', headerPatterns: ['Libraries/Network/*.h']},
      {
        name: 'RCTPushNotificationHeaders',
        headerPatterns: ['Libraries/PushNotificationIOS/*.h'],
      },
      {
        name: 'RCTSettingsHeaders',
        headerPatterns: ['Libraries/Settings/*.h'],
      },
      {name: 'RCTTextHeaders', headerPatterns: ['Libraries/Text/**/*.h']},
      {
        name: 'RCTVibrationHeaders',
        headerPatterns: ['Libraries/Vibration/*.h'],
      },
    ],
  },
};

module.exports = PodSpecConfigurations;
