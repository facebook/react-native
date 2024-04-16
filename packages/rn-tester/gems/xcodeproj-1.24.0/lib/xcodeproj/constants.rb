module Xcodeproj
  # This modules groups all the constants known to Xcodeproj.
  #
  module Constants
    # @return [String] The last known iOS SDK (stable).
    #
    LAST_KNOWN_IOS_SDK = '14.0'

    # @return [String] The last known OS X SDK (stable).
    #
    LAST_KNOWN_OSX_SDK = '10.15'

    # @return [String] The last known tvOS SDK (stable).
    #
    LAST_KNOWN_TVOS_SDK = '14.0'

    # @return [String] The last known visionOS SDK (unstable).
    #
    LAST_KNOWN_VISIONOS_SDK = '1.0'

    # @return [String] The last known watchOS SDK (stable).
    #
    LAST_KNOWN_WATCHOS_SDK = '7.0'

    # @return [String] The last known archive version to Xcodeproj.
    #
    LAST_KNOWN_ARCHIVE_VERSION = 1

    # @return [String] The last known Swift version (stable).
    #
    LAST_KNOWN_SWIFT_VERSION = '5.0'

    # @return [String] The default object version for Xcodeproj.
    #
    DEFAULT_OBJECT_VERSION = 46

    # @return [String] The last known object version to Xcodeproj.
    #
    LAST_KNOWN_OBJECT_VERSION = 60

    # @return [String] The last known Xcode version to Xcodeproj.
    #
    LAST_UPGRADE_CHECK = '1500'

    # @return [String] The last known Xcode version to Xcodeproj.
    #
    LAST_SWIFT_UPGRADE_CHECK = '1500'

    # @return [String] The version of `.xcscheme` files supported by Xcodeproj
    #
    XCSCHEME_FORMAT_VERSION = '1.3'

    # @return [Hash] The all the known ISAs grouped by superclass.
    #
    KNOWN_ISAS = {
      'AbstractObject' => %w(
        PBXBuildFile
        AbstractBuildPhase
        PBXBuildRule
        XCBuildConfiguration
        XCConfigurationList
        PBXContainerItemProxy
        PBXFileReference
        PBXGroup
        PBXProject
        PBXTargetDependency
        PBXReferenceProxy
        AbstractTarget
      ),

      'AbstractBuildPhase' => %w(
        PBXCopyFilesBuildPhase
        PBXResourcesBuildPhase
        PBXSourcesBuildPhase
        PBXFrameworksBuildPhase
        PBXHeadersBuildPhase
        PBXShellScriptBuildPhase
      ),

      'AbstractTarget' => %w(
        PBXNativeTarget
        PBXAggregateTarget
        PBXLegacyTarget
      ),

      'PBXGroup' => %w(
        XCVersionGroup
        PBXVariantGroup
      ),
    }.freeze

    # @return [Hash] The known file types corresponding to each extension.
    #
    FILE_TYPES_BY_EXTENSION = {
      'a'            => 'archive.ar',
      'apns'         => 'text',
      'app'          => 'wrapper.application',
      'appex'        => 'wrapper.app-extension',
      'bundle'       => 'wrapper.plug-in',
      'cpp'          => 'sourcecode.cpp.cpp',
      'dylib'        => 'compiled.mach-o.dylib',
      'entitlements' => 'text.plist.entitlements',
      'framework'    => 'wrapper.framework',
      'gif'          => 'image.gif',
      'gpx'          => 'text.xml',
      'h'            => 'sourcecode.c.h',
      'hpp'          => 'sourcecode.cpp.h',
      'm'            => 'sourcecode.c.objc',
      'markdown'     => 'text',
      'mdimporter'   => 'wrapper.cfbundle',
      'modulemap'    => 'sourcecode.module',
      'mov'          => 'video.quicktime',
      'mp3'          => 'audio.mp3',
      'octest'       => 'wrapper.cfbundle',
      'pch'          => 'sourcecode.c.h',
      'plist'        => 'text.plist.xml',
      'png'          => 'image.png',
      'sh'           => 'text.script.sh',
      'sks'          => 'file.sks',
      'storyboard'   => 'file.storyboard',
      'strings'      => 'text.plist.strings',
      'swift'        => 'sourcecode.swift',
      'xcassets'     => 'folder.assetcatalog',
      'xcconfig'     => 'text.xcconfig',
      'xcdatamodel'  => 'wrapper.xcdatamodel',
      'xcodeproj'    => 'wrapper.pb-project',
      'xctest'       => 'wrapper.cfbundle',
      'xib'          => 'file.xib',
      'zip'          => 'archive.zip',
    }.freeze

    # @return [Hash] The compatibility version string for different object versions.
    #
    COMPATIBILITY_VERSION_BY_OBJECT_VERSION = {
      60 => 'Xcode 15.0',
      56 => 'Xcode 14.0',
      55 => 'Xcode 13.0',
      54 => 'Xcode 12.0',
      53 => 'Xcode 11.4',
      52 => 'Xcode 11.0',
      51 => 'Xcode 10.0',
      50 => 'Xcode 9.3',
      48 => 'Xcode 8.0',
      47 => 'Xcode 6.3',
      46 => 'Xcode 3.2',
      45 => 'Xcode 3.1',
    }.freeze

    # @return [Hash] The uniform type identifier of various product types.
    #
    PRODUCT_TYPE_UTI = {
      :application                           => 'com.apple.product-type.application',
      :application_on_demand_install_capable => 'com.apple.product-type.application.on-demand-install-capable',
      :framework                             => 'com.apple.product-type.framework',
      :dynamic_library                       => 'com.apple.product-type.library.dynamic',
      :static_library                        => 'com.apple.product-type.library.static',
      :bundle                                => 'com.apple.product-type.bundle',
      :octest_bundle                         => 'com.apple.product-type.bundle',
      :unit_test_bundle                      => 'com.apple.product-type.bundle.unit-test',
      :ui_test_bundle                        => 'com.apple.product-type.bundle.ui-testing',
      :app_extension                         => 'com.apple.product-type.app-extension',
      :command_line_tool                     => 'com.apple.product-type.tool',
      :watch_app                             => 'com.apple.product-type.application.watchapp',
      :watch2_app                            => 'com.apple.product-type.application.watchapp2',
      :watch2_app_container                  => 'com.apple.product-type.application.watchapp2-container',
      :watch_extension                       => 'com.apple.product-type.watchkit-extension',
      :watch2_extension                      => 'com.apple.product-type.watchkit2-extension',
      :tv_extension                          => 'com.apple.product-type.tv-app-extension',
      :messages_application                  => 'com.apple.product-type.application.messages',
      :messages_extension                    => 'com.apple.product-type.app-extension.messages',
      :sticker_pack                          => 'com.apple.product-type.app-extension.messages-sticker-pack',
      :xpc_service                           => 'com.apple.product-type.xpc-service',
    }.freeze

    # @return [Hash] The extensions or the various product UTIs.
    #
    PRODUCT_UTI_EXTENSIONS = {
      :application                           => 'app',
      :application_on_demand_install_capable => 'app',
      :framework                             => 'framework',
      :dynamic_library                       => 'dylib',
      :static_library                        => 'a',
      :bundle                                => 'bundle',
      :octest_bundle                         => 'octest',
      :unit_test_bundle                      => 'xctest',
      :ui_test_bundle                        => 'xctest',
      :app_extension                         => 'appex',
      :messages_application                  => 'app',
      :messages_extension                    => 'appex',
      :sticker_pack                          => 'appex',
      :watch2_extension                      => 'appex',
      :watch2_app                            => 'app',
      :watch2_app_container                  => 'app',
    }.freeze

    # @return [Hash] The common build settings grouped by platform, and build
    #         configuration name.
    #
    COMMON_BUILD_SETTINGS = {
      :all => {
        # empty?
        # come from the project settings
      }.freeze,
      [:debug] => {
        # empty?
        # come from the project settings
      }.freeze,
      [:release] => {
        # empty?
        # come from the project settings
      }.freeze,
      [:ios] => {
        'SDKROOT'                           => 'iphoneos',
      }.freeze,
      [:osx] => {
        'SDKROOT'                           => 'macosx',
      }.freeze,
      [:tvos] => {
        'SDKROOT'                           => 'appletvos',
      }.freeze,
      [:visionos] => {
        'SDKROOT'                           => 'xros',
      }.freeze,
      [:watchos] => {
        'SDKROOT'                           => 'watchos',
      }.freeze,
      [:debug, :osx] => {
        # Empty?
      }.freeze,
      [:release, :osx] => {
        # Empty?
      }.freeze,
      [:debug, :ios] => {
        # Empty?
      }.freeze,
      [:release, :ios] => {
        'VALIDATE_PRODUCT' => 'YES',
      }.freeze,
      [:debug, :tvos] => {
        # Empty?
      }.freeze,
      [:release, :tvos] => {
        'VALIDATE_PRODUCT' => 'YES',
      }.freeze,
      [:debug, :watchos] => {
        # Empty?
      }.freeze,
      [:release, :watchos] => {
        'VALIDATE_PRODUCT' => 'YES',
      }.freeze,
      [:swift] => {
        # Empty?
        # The swift version, like deployment target, is set in
        # ProjectHelper#common_build_settings
      }.freeze,
      [:debug, :application, :swift] => {
        # Empty?
      }.freeze,
      [:debug, :swift] => {
        # Swift optimization settings are provided by the project settings
      }.freeze,
      [:release, :swift] => {
        # Swift optimization settings are provided by the project settings
      }.freeze,
      [:debug, :static_library, :swift] => {
      }.freeze,
      [:framework] => {
        'CURRENT_PROJECT_VERSION'           => '1',
        'DEFINES_MODULE'                    => 'YES',
        'DYLIB_COMPATIBILITY_VERSION'       => '1',
        'DYLIB_CURRENT_VERSION'             => '1',
        'DYLIB_INSTALL_NAME_BASE'           => '@rpath',
        'INSTALL_PATH'                      => '$(LOCAL_LIBRARY_DIR)/Frameworks',
        'PRODUCT_NAME'                      => '$(TARGET_NAME:c99extidentifier)',
        'SKIP_INSTALL'                      => 'YES',
        'VERSION_INFO_PREFIX'               => '',
        'VERSIONING_SYSTEM'                 => 'apple-generic',
      }.freeze,
      [:ios, :framework] => {
        'LD_RUNPATH_SEARCH_PATHS'           => '$(inherited) @executable_path/Frameworks @loader_path/Frameworks',
        'TARGETED_DEVICE_FAMILY'            => '1,2',
      }.freeze,
      [:osx, :framework] => {
        'COMBINE_HIDPI_IMAGES'              => 'YES',
        'LD_RUNPATH_SEARCH_PATHS'           => '$(inherited) @executable_path/../Frameworks @loader_path/Frameworks',
      }.freeze,
      [:watchos, :framework] => {
        'APPLICATION_EXTENSION_API_ONLY'    => 'YES',
        'LD_RUNPATH_SEARCH_PATHS'           => '$(inherited) @executable_path/Frameworks @loader_path/Frameworks',
        'TARGETED_DEVICE_FAMILY'            => '4',
      }.freeze,
      [:tvos, :framework] => {
        'LD_RUNPATH_SEARCH_PATHS'           => '$(inherited) @executable_path/Frameworks @loader_path/Frameworks',
        'TARGETED_DEVICE_FAMILY'            => '3',
      }.freeze,
      [:framework, :swift] => {
        'DEFINES_MODULE'                    => 'YES',
      }.freeze,
      [:osx, :static_library] => {
        'EXECUTABLE_PREFIX'                 => 'lib',
        'SKIP_INSTALL'                      => 'YES',
      }.freeze,
      [:ios, :static_library] => {
        'OTHER_LDFLAGS'                     => '-ObjC',
        'SKIP_INSTALL'                      => 'YES',
        'TARGETED_DEVICE_FAMILY'            => '1,2',
      }.freeze,
      [:watchos, :static_library] => {
        'OTHER_LDFLAGS'                     => '-ObjC',
        'SKIP_INSTALL'                      => 'YES',
        'TARGETED_DEVICE_FAMILY'            => '4',
      }.freeze,
      [:tvos, :static_library] => {
        'OTHER_LDFLAGS'                     => '-ObjC',
        'SKIP_INSTALL'                      => 'YES',
        'TARGETED_DEVICE_FAMILY'            => '3',
      }.freeze,
      [:osx, :dynamic_library] => {
        'DYLIB_COMPATIBILITY_VERSION'       => '1',
        'DYLIB_CURRENT_VERSION'             => '1',
        'EXECUTABLE_PREFIX'                 => 'lib',
        'SKIP_INSTALL'                      => 'YES',
      }.freeze,
      [:application] => {
        'ASSETCATALOG_COMPILER_APPICON_NAME' => 'AppIcon',
        'ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME'  => 'AccentColor',
      }.freeze,
      [:ios, :application] => {
        'LD_RUNPATH_SEARCH_PATHS'           => '$(inherited) @executable_path/Frameworks',
        'TARGETED_DEVICE_FAMILY'            => '1,2',
      }.freeze,
      [:osx, :application] => {
        'COMBINE_HIDPI_IMAGES'              => 'YES',
        'LD_RUNPATH_SEARCH_PATHS'           => '$(inherited) @executable_path/../Frameworks',
      }.freeze,
      [:watchos, :application] => {
        'SKIP_INSTALL'                      => 'YES',
        'TARGETED_DEVICE_FAMILY'            => '4',
      }.freeze,
      [:tvos, :application] => {
        'ASSETCATALOG_COMPILER_APPICON_NAME' => 'App Icon & Top Shelf Image',
        'LD_RUNPATH_SEARCH_PATHS'           => '$(inherited) @executable_path/Frameworks',
        'TARGETED_DEVICE_FAMILY'            => '3',
      }.freeze,
      [:tvos, :application, :swift] => {
        'ENABLE_PREVIEWS'                                 => 'YES',
      }.freeze,
      [:watchos, :application, :swift] => {
        'ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES' => 'YES',
      }.freeze,
      [:bundle] => {
        'WRAPPER_EXTENSION'                 => 'bundle',
        'SKIP_INSTALL'                      => 'YES',
      }.freeze,
      [:ios, :bundle] => {
        'SDKROOT'                           => 'iphoneos',
      }.freeze,
      [:osx, :bundle] => {
        'COMBINE_HIDPI_IMAGES'              => 'YES',
        'INSTALL_PATH'                      => '$(LOCAL_LIBRARY_DIR)/Bundles',
        'SDKROOT'                           => 'macosx',
      }.freeze,
    }.freeze

    # @return [Hash] The default build settings for a new project.
    #
    PROJECT_DEFAULT_BUILD_SETTINGS = {
      :all => {
        'ALWAYS_SEARCH_USER_PATHS'                => 'NO',
        'CLANG_ANALYZER_NONNULL'                  => 'YES',
        'CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION' => 'YES_AGGRESSIVE',
        'CLANG_CXX_LANGUAGE_STANDARD'             => 'gnu++14',
        'CLANG_CXX_LIBRARY'                       => 'libc++',
        'CLANG_ENABLE_MODULES'                    => 'YES',
        'CLANG_ENABLE_OBJC_ARC'                   => 'YES',
        'CLANG_ENABLE_OBJC_WEAK'                  => 'YES',
        'CLANG_WARN__DUPLICATE_METHOD_MATCH'      => 'YES',
        'CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING'  => 'YES',
        'CLANG_WARN_BOOL_CONVERSION'              => 'YES',
        'CLANG_WARN_COMMA'                        => 'YES',
        'CLANG_WARN_CONSTANT_CONVERSION'          => 'YES',
        'CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS' => 'YES',
        'CLANG_WARN_DIRECT_OBJC_ISA_USAGE'        => 'YES_ERROR',
        'CLANG_WARN_DOCUMENTATION_COMMENTS'       => 'YES',
        'CLANG_WARN_EMPTY_BODY'                   => 'YES',
        'CLANG_WARN_ENUM_CONVERSION'              => 'YES',
        'CLANG_WARN_INFINITE_RECURSION'           => 'YES',
        'CLANG_WARN_INT_CONVERSION'               => 'YES',
        'CLANG_WARN_NON_LITERAL_NULL_CONVERSION'  => 'YES',
        'CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF'    => 'YES',
        'CLANG_WARN_OBJC_LITERAL_CONVERSION'      => 'YES',
        'CLANG_WARN_OBJC_ROOT_CLASS'              => 'YES_ERROR',
        'CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER' => 'YES',
        'CLANG_WARN_RANGE_LOOP_ANALYSIS'          => 'YES',
        'CLANG_WARN_STRICT_PROTOTYPES'            => 'YES',
        'CLANG_WARN_SUSPICIOUS_MOVE'              => 'YES',
        'CLANG_WARN_UNGUARDED_AVAILABILITY'       => 'YES_AGGRESSIVE',
        'CLANG_WARN_UNREACHABLE_CODE'             => 'YES',
        'COPY_PHASE_STRIP'                        => 'NO',
        'ENABLE_STRICT_OBJC_MSGSEND'              => 'YES',
        'GCC_C_LANGUAGE_STANDARD'                 => 'gnu11',
        'GCC_NO_COMMON_BLOCKS'                    => 'YES',
        'GCC_WARN_64_TO_32_BIT_CONVERSION'        => 'YES',
        'GCC_WARN_ABOUT_RETURN_TYPE'              => 'YES_ERROR',
        'GCC_WARN_UNDECLARED_SELECTOR'            => 'YES',
        'GCC_WARN_UNINITIALIZED_AUTOS'            => 'YES_AGGRESSIVE',
        'GCC_WARN_UNUSED_FUNCTION'                => 'YES',
        'GCC_WARN_UNUSED_VARIABLE'                => 'YES',
        'MTL_FAST_MATH'                           => 'YES',
        'PRODUCT_NAME'                            => '$(TARGET_NAME)',
        'SWIFT_VERSION'                           => '5.0',
      },
      :release => {
        'DEBUG_INFORMATION_FORMAT'           => 'dwarf-with-dsym',
        'ENABLE_NS_ASSERTIONS'               => 'NO',
        'MTL_ENABLE_DEBUG_INFO'              => 'NO',
        'SWIFT_COMPILATION_MODE'             => 'wholemodule',
        'SWIFT_OPTIMIZATION_LEVEL'           => '-O',
      }.freeze,
      :debug => {
        'DEBUG_INFORMATION_FORMAT'            => 'dwarf',
        'ENABLE_TESTABILITY'                  => 'YES',
        'GCC_DYNAMIC_NO_PIC'                  => 'NO',
        'GCC_OPTIMIZATION_LEVEL'              => '0',
        'GCC_PREPROCESSOR_DEFINITIONS'        => ['DEBUG=1', '$(inherited)'],
        'MTL_ENABLE_DEBUG_INFO'               => 'INCLUDE_SOURCE',
        'ONLY_ACTIVE_ARCH'                    => 'YES',
        'SWIFT_ACTIVE_COMPILATION_CONDITIONS' => 'DEBUG',
        'SWIFT_OPTIMIZATION_LEVEL'            => '-Onone',
      }.freeze,
    }.freeze

    # @return [Hash] The corresponding numeric value of each copy build phase
    #         destination.
    #
    COPY_FILES_BUILD_PHASE_DESTINATIONS = {
      :absolute_path      =>  '0',
      :products_directory => '16',
      :wrapper            =>  '1',
      :resources          =>  '7', # default
      :executables        =>  '6',
      :java_resources     => '15',
      :frameworks         => '10',
      :shared_frameworks  => '11',
      :shared_support     => '12',
      :plug_ins           => '13',
    }.freeze

    # @return [Hash] The corresponding numeric value of each proxy type for
    #         PBXContainerItemProxy.
    PROXY_TYPES = {
      :native_target => '1',
      :reference     => '2',
    }.freeze

    # @return [Array] The extensions which are associated with header files.
    #
    HEADER_FILES_EXTENSIONS = %w(.h .hh .hpp .ipp .tpp .hxx .def .inl .inc).freeze

    # @return [Array] The keywords Xcode use to identify a build setting can
    #                 inherit values from a previous precedence level
    INHERITED_KEYWORDS = %w(
      $(inherited)
      ${inherited}
    ).freeze

    # @return [Hash] Possible types for a scheme's 'ExecutionAction' node
    #
    EXECUTION_ACTION_TYPE = {
      :shell_script  => 'Xcode.IDEStandardExecutionActionsCore.ExecutionActionType.ShellScriptAction',
      :send_email    => 'Xcode.IDEStandardExecutionActionsCore.ExecutionActionType.SendEmailAction',
    }.freeze
  end
end
