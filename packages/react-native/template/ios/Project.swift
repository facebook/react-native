import ProjectDescription

let reactNativeXCodeScript =
"""
set -e
WITH_ENVIRONMENT=\"../node_modules/react-native/scripts/xcode/with-environment.sh\"
REACT_NATIVE_XCODE=\"../node_modules/react-native/scripts/react-native-xcode.sh\"
/bin/sh -c \"$WITH_ENVIRONMENT $REACT_NATIVE_XCODE\"
"""

let startPackagerScript =
"""
export RCT_METRO_PORT=\"${RCT_METRO_PORT:=8081}\"
echo \"export RCT_METRO_PORT=${RCT_METRO_PORT}\" > \"${SRCROOT}/../node_modules/react-native/scripts/.packager.env\"
if [ -z \"${RCT_NO_LAUNCH_PACKAGER+xxx}\" ] ; then
  if nc -w 5 -z localhost ${RCT_METRO_PORT} ; then
    if ! curl -s \"http://localhost:${RCT_METRO_PORT}/status\" | grep -q \"packager-status:running\" ; then
      echo \"Port ${RCT_METRO_PORT} already in use, packager is either not running or not running correctly\"
      exit 2
    fi
  else
    open \"$SRCROOT/../node_modules/react-native/scripts/launchPackager.command\" || echo \"Can't start packager automatically\"
  fi
fi
"""

let project = Project(
  name: "HelloWorld",
  organizationName: "org.reactjs.native.example",
  targets: [
    Target(
      name: "HelloWorld",
      platform: .iOS,
      product: .app,
      bundleId: "org.reactjs.native.example.HelloWorld",
      deploymentTarget: .iOS(targetVersion: "13.4", devices: .iphone),
      infoPlist: "HelloWorld/Info.plist",
      sources: ["HelloWorld/*.m", "HelloWorld/*.mm"],
      resources: [
        "HelloWorld/Images.xcassets",
        "HelloWorld/LaunchScreen.storyboard"],
      headers: .headers(
        public: ["HelloWorld/**"]
      ),
      scripts: [
        .post(
          script: reactNativeXCodeScript,
          name: "Bundle React Native code and images",
          inputPaths: [
            "$(SRCROOT)/.xcode.env.local",
            "$(SRCROOT)/.xcode.env"
          ],
          shellPath: "/bin/sh"
        ),
        .post(
          script: startPackagerScript,
          name: "Start Packager",
          shellPath: "/bin/sh"
        )
      ],
      settings: .settings(
        base: [
          "GCC_C_LANGUAGE_STANDARD" : "gnu99",
          "SWIFT_VERSION": "5",
          "LD_RUNPATH_SEARCH_PATHS" : [
            "$(inherited)",
            "/usr/lib/swift"
          ],
          "LIBRARY_SEARCH_PATHS" : [
            "$(inherited)",
            "$(SDKROOT)/usr/lib/swift",
            "$(TOOLCHAIN_DIR)/usr/lib/swift/$(PLATFORM_NAME)"
          ],
          "OTHER_CPLUSPLUSFLAGS": [
            "$(inherited)",
            "$(OTHER_CFLAGS)",
            "-DFOLLY_NO_CONFIG",
            "-DFOLLY_MOBILE=1",
            "-DFOLLY_USE_LIBCPP=1"
          ],
          "OTHER_LD_FLAGS": [
            "$(inherited)",
              "-ObjC",
              "-lc++",
          ],
          "CLANG_ENABLE_MODULES": "YES",
          "CURRENT_PROJECT_VERSION": "1",
          "MARKETING_VERSION": "1.0",
          "VERSIONING_SYSTEM": "apple-generic"
        ],
        configurations: [
          .debug(name: "Debug", settings: [
            "ENABLE_BITCODE": "NO",
            "GCC_SYMBOLS_PRIVATE_EXTERN": "NO",
            "SDKROOT": "iphoneos"
          ]),
          .release(name: "Release", settings: [
            "COPY_PHASE_STRIP": "YES"
          ])
        ],
        defaultSettings: .none
      )

    ),
    Target(
      name: "HelloWorldTests",
      platform: .iOS,
      product: .unitTests,
      bundleId: "org.reactjs.native.example.HelloWorldTests",
      infoPlist: "HelloWorldTests/Info.plist",
      sources: ["HelloWorldTests/*.m"],
      dependencies: [
        .target(name: "HelloWorld")
      ]
    ),
  ]
)
