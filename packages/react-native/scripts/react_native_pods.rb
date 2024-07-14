# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'
require 'open3'
require 'pathname'
require_relative './react_native_pods_utils/script_phases.rb'
require_relative './cocoapods/jsengine.rb'
require_relative './cocoapods/fabric.rb'
require_relative './cocoapods/codegen.rb'
require_relative './cocoapods/codegen_utils.rb'
require_relative './cocoapods/utils.rb'
require_relative './cocoapods/new_architecture.rb'
require_relative './cocoapods/local_podspec_patch.rb'
require_relative './cocoapods/runtime.rb'
require_relative './cocoapods/helpers.rb'
require_relative './cocoapods/privacy_manifest_utils.rb'
require_relative './cocoapods/spm.rb'
# Importing to expose use_native_modules!
require_relative './cocoapods/autolinking.rb'

$CODEGEN_OUTPUT_DIR = 'build/generated/ios'
$CODEGEN_COMPONENT_DIR = 'react/renderer/components'
$CODEGEN_MODULE_DIR = '.'

$START_TIME = Time.now.to_i

def min_ios_version_supported
  return Helpers::Constants.min_ios_version_supported
end

# This function returns the min supported OS versions supported by React Native
# By using this function, you won't have to manually change your Podfile
# when we change the minimum version supported by the framework.
def min_supported_versions
  return  { :ios => min_ios_version_supported }
end

# This function prepares the project for React Native, before processing
# all the target exposed by the framework.
def prepare_react_native_project!
  # Temporary solution to suppress duplicated GUID error.
  # Can be removed once we move to generate files outside pod install.
  install! 'cocoapods', :deterministic_uuids => false

  ReactNativePodsUtils.create_xcode_env_if_missing
end

# Function that setup all the react native dependencies
# 
# Parameters
# - path: path to react_native installation.
# - fabric_enabled: whether fabric should be enabled or not.
# - new_arch_enabled: whether the new architecture should be enabled or not.
# - :production [DEPRECATED] whether the dependencies must be installed to target a Debug or a Release build.
# - hermes_enabled: whether Hermes should be enabled or not.
# - app_path: path to the React Native app. Required by the New Architecture.
# - config_file_dir: directory of the `package.json` file, required by the New Architecture.
def use_react_native! (
  path: "../node_modules/react-native",
  fabric_enabled: false,
  new_arch_enabled: NewArchitectureHelper.new_arch_enabled,
  production: false, # deprecated
  hermes_enabled: ENV['USE_HERMES'] && ENV['USE_HERMES'] == '0' ? false : true,
  app_path: '..',
  config_file_dir: '',
  privacy_file_aggregation_enabled: true
)

  # Set the app_path as env variable so the podspecs can access it.
  ENV['APP_PATH'] = app_path
  ENV['REACT_NATIVE_PATH'] = path

  ReactNativePodsUtils.check_minimum_required_xcode()

  # Current target definition is provided by Cocoapods and it refers to the target
  # that has invoked the `use_react_native!` function.
  ReactNativePodsUtils.detect_use_frameworks(current_target_definition)

  CodegenUtils.clean_up_build_folder(path, $CODEGEN_OUTPUT_DIR)

  # We are relying on this flag also in third parties libraries to proper install dependencies.
  # Better to rely and enable this environment flag if the new architecture is turned on using flags.
  relative_path_from_current = Pod::Config.instance.installation_root.relative_path_from(Pathname.pwd)
  react_native_version = NewArchitectureHelper.extract_react_native_version(File.join(relative_path_from_current, path))
  ENV['RCT_NEW_ARCH_ENABLED'] = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, react_native_version)
  fabric_enabled = fabric_enabled || NewArchitectureHelper.new_arch_enabled

  ENV['RCT_FABRIC_ENABLED'] = fabric_enabled ? "1" : "0"
  ENV['USE_HERMES'] = hermes_enabled ? "1" : "0"
  ENV['RCT_AGGREGATE_PRIVACY_FILES'] = privacy_file_aggregation_enabled ? "1" : "0"

  prefix = path

  ReactNativePodsUtils.warn_if_not_on_arm64()

  build_codegen!(prefix, relative_path_from_current)

  # The Pods which should be included in all projects
  pod 'FBLazyVector', :path => "#{prefix}/Libraries/FBLazyVector"
  pod 'RCTRequired', :path => "#{prefix}/Libraries/Required"
  pod 'RCTTypeSafety', :path => "#{prefix}/Libraries/TypeSafety", :modular_headers => true
  pod 'React', :path => "#{prefix}/"
  pod 'React-Core', :path => "#{prefix}/"
  pod 'React-CoreModules', :path => "#{prefix}/React/CoreModules"
  pod 'React-RCTAppDelegate', :path => "#{prefix}/Libraries/AppDelegate"
  pod 'React-RCTActionSheet', :path => "#{prefix}/Libraries/ActionSheetIOS"
  pod 'React-RCTAnimation', :path => "#{prefix}/Libraries/NativeAnimation"
  pod 'React-RCTBlob', :path => "#{prefix}/Libraries/Blob"
  pod 'React-RCTImage', :path => "#{prefix}/Libraries/Image"
  pod 'React-RCTLinking', :path => "#{prefix}/Libraries/LinkingIOS"
  pod 'React-RCTNetwork', :path => "#{prefix}/Libraries/Network"
  pod 'React-RCTSettings', :path => "#{prefix}/Libraries/Settings"
  pod 'React-RCTText', :path => "#{prefix}/Libraries/Text"
  pod 'React-RCTVibration', :path => "#{prefix}/Libraries/Vibration"
  pod 'React-Core/RCTWebSocket', :path => "#{prefix}/"
  pod 'React-rncore', :path => "#{prefix}/ReactCommon"
  pod 'React-cxxreact', :path => "#{prefix}/ReactCommon/cxxreact"
  pod 'React-debug', :path => "#{prefix}/ReactCommon/react/debug"
  pod 'React-utils', :path => "#{prefix}/ReactCommon/react/utils"
  pod 'React-featureflags', :path => "#{prefix}/ReactCommon/react/featureflags"
  pod 'React-featureflagsnativemodule', :path => "#{prefix}/ReactCommon/react/nativemodule/featureflags"
  pod 'React-microtasksnativemodule', :path => "#{prefix}/ReactCommon/react/nativemodule/microtasks"
  pod 'React-idlecallbacksnativemodule', :path => "#{prefix}/ReactCommon/react/nativemodule/idlecallbacks"
  pod 'React-domnativemodule', :path => "#{prefix}/ReactCommon/react/nativemodule/dom"
  pod 'React-defaultsnativemodule', :path => "#{prefix}/ReactCommon/react/nativemodule/defaults"
  pod 'React-Mapbuffer', :path => "#{prefix}/ReactCommon"
  pod 'React-jserrorhandler', :path => "#{prefix}/ReactCommon/jserrorhandler"
  pod 'React-nativeconfig', :path => "#{prefix}/ReactCommon"
  pod 'RCTDeprecation', :path => "#{prefix}/ReactApple/Libraries/RCTFoundation/RCTDeprecation"

  if hermes_enabled
    setup_hermes!(:react_native_path => prefix)
  else
    setup_jsc!(:react_native_path => prefix, :fabric_enabled => fabric_enabled)
  end

  pod 'React-jsiexecutor', :path => "#{prefix}/ReactCommon/jsiexecutor"
  pod 'React-jsinspector', :path => "#{prefix}/ReactCommon/jsinspector-modern"

  pod 'React-callinvoker', :path => "#{prefix}/ReactCommon/callinvoker"
  pod 'React-performancetimeline', :path => "#{prefix}/ReactCommon/react/performance/timeline"
  pod 'React-runtimeexecutor', :path => "#{prefix}/ReactCommon/runtimeexecutor"
  pod 'React-runtimescheduler', :path => "#{prefix}/ReactCommon/react/renderer/runtimescheduler"
  pod 'React-rendererdebug', :path => "#{prefix}/ReactCommon/react/renderer/debug"
  pod 'React-rendererconsistency', :path => "#{prefix}/ReactCommon/react/renderer/consistency"
  pod 'React-perflogger', :path => "#{prefix}/ReactCommon/reactperflogger"
  pod 'React-logger', :path => "#{prefix}/ReactCommon/logger"
  pod 'ReactCommon/turbomodule/core', :path => "#{prefix}/ReactCommon", :modular_headers => true
  pod 'React-NativeModulesApple', :path => "#{prefix}/ReactCommon/react/nativemodule/core/platform/ios", :modular_headers => true
  pod 'Yoga', :path => "#{prefix}/ReactCommon/yoga", :modular_headers => true

  pod 'DoubleConversion', :podspec => "#{prefix}/third-party-podspecs/DoubleConversion.podspec"
  pod 'glog', :podspec => "#{prefix}/third-party-podspecs/glog.podspec"
  pod 'boost', :podspec => "#{prefix}/third-party-podspecs/boost.podspec"
  pod 'fmt', :podspec => "#{prefix}/third-party-podspecs/fmt.podspec"
  pod 'RCT-Folly', :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec", :modular_headers => true

  folly_config = get_folly_config()
  run_codegen!(
    app_path,
    config_file_dir,
    :new_arch_enabled => NewArchitectureHelper.new_arch_enabled,
    :disable_codegen => ENV['DISABLE_CODEGEN'] == '1',
    :react_native_path => prefix,
    :fabric_enabled => fabric_enabled,
    :hermes_enabled => hermes_enabled,
    :codegen_output_dir => $CODEGEN_OUTPUT_DIR,
    :package_json_file => File.join(__dir__, "..", "package.json"),
    :folly_version => folly_config[:version]
  )

  pod 'ReactCodegen', :path => $CODEGEN_OUTPUT_DIR, :modular_headers => true

  # Always need fabric to access the RCTSurfacePresenterBridgeAdapter which allow to enable the RuntimeScheduler
  # If the New Arch is turned off, we will use the Old Renderer, though.
  # RNTester always installed Fabric, this change is required to make the template work.
  setup_fabric!(:react_native_path => prefix)
  setup_bridgeless!(:react_native_path => prefix, :use_hermes => hermes_enabled)

  pods_to_update = LocalPodspecPatch.pods_to_update(:react_native_path => prefix)
  if !pods_to_update.empty?
    if Pod::Lockfile.public_instance_methods.include?(:detect_changes_with_podfile)
      Pod::Lockfile.prepend(LocalPodspecPatch)
    else
      Pod::UI.warn "Automatically updating #{pods_to_update.join(", ")} has failed, please run `pod update #{pods_to_update.join(" ")} --no-repo-update` manually to fix the issue."
    end
  end
end

# Getter to retrieve the folly flags in case contributors need to apply them manually.
#
# Returns: the folly compiler flags
def folly_flags()
  return NewArchitectureHelper.folly_compiler_flags
end

# Add a dependency to a spec, making sure that the HEADER_SERACH_PATHS are set properly.
# This function automate the requirement to specify the HEADER_SEARCH_PATHS which was error prone
# and hard to pull out properly to begin with.
# Secondly, it prepares the podspec to work also with other platforms, because this function is
# able to generate search paths that are compatible with macOS and other platform if specified by
# the $RN_PLATFORMS variable.
# To generate Header Search Paths for multiple platforms, define in your Podfile or Ruby infra a
# $RN_PLATFORMS static variable with the list of supported platforms, for example:
# `$RN_PLATFORMS = ["iOS", "macOS"]`
#
# Parameters:
# - spec: the spec that needs to be modified
# - pod_name: the name of the dependency we had to add to the spec
# - additional_framework_paths: additional sub paths we had to add to the HEADER_SEARCH_PATH
# - framework_name: the name of the framework in case it is different from the pod_name
# - version: the version of the pod_name the spec needs to depend on
# - base_dir: Base directory from where we need to start looking. Defaults to PODS_CONFIGURATION_BUILD_DIR
def add_dependency(spec, pod_name, subspec: nil, additional_framework_paths: [], framework_name: nil, version: nil, base_dir: "PODS_CONFIGURATION_BUILD_DIR")
  fixed_framework_name = framework_name != nil ? framework_name : pod_name.gsub("-", "_") # frameworks can't have "-" in their name
  ReactNativePodsUtils.add_dependency(spec, pod_name, base_dir, fixed_framework_name, :additional_paths => additional_framework_paths, :version => version)
end

# This function generates an array of HEADER_SEARCH_PATH that can be added to the HEADER_SEARCH_PATH property when use_frameworks! is enabled
#
# Parameters:
# - pod_name: the name of the dependency we had to add to the spec
# - additional_framework_paths: additional sub paths we had to add to the HEADER_SEARCH_PATH
# - framework_name: the name of the framework in case it is different from the pod_name
# - base_dir: Base directory from where we need to start looking. Defaults to PODS_CONFIGURATION_BUILD_DIR
# - include_base_folder: whether the array must include the base import path or only the additional_framework_paths
def create_header_search_path_for_frameworks(pod_name, additional_framework_paths: [], framework_name: nil, base_dir: "PODS_CONFIGURATION_BUILD_DIR", include_base_folder: true)
  fixed_framework_name = framework_name != nil ? framework_name : pod_name.gsub("-", "_")
  return ReactNativePodsUtils.create_header_search_path_for_frameworks(base_dir, pod_name, fixed_framework_name, additional_framework_paths, include_base_folder)
end

# This function can be used by library developer to prepare their modules for the New Architecture.
# It passes the Folly Flags to the module, it configures the search path and installs some New Architecture specific dependencies.
#
# Parameters:
# - spec: The spec that has to be configured with the New Architecture code
# - new_arch_enabled: Whether the module should install dependencies for the new architecture
def install_modules_dependencies(spec, new_arch_enabled: NewArchitectureHelper.new_arch_enabled)
  folly_config = get_folly_config()
  NewArchitectureHelper.install_modules_dependencies(spec, new_arch_enabled, folly_config[:version])
end


# This function can be used by library developer to declare a SwiftPackageManager dependency.
#
# Parameters:
# - spec: The spec the Swift Package Manager dependency has to be added to
# - url: The URL of the Swift Package Manager dependency
# - requirement: The version requirement of the Swift Package Manager dependency (eg. ` {kind: 'upToNextMajorVersion', minimumVersion: '5.9.1'},`)
# - products: The product/target of the Swift Package Manager dependency (eg. AlamofireDynamic)
def spm_dependency(spec, url:, requirement:, products:)
  SPM.dependency(spec, url: url, requirement: requirement, products: products)
end

# It returns the default flags.
# deprecated.
def get_default_flags()
  warn 'get_default_flags is deprecated. Please remove the keys from the `use_react_native!` function'
  warn 'if you are using the default already and pass the value you need in case you don\'t want the default'
  return ReactNativePodsUtils.get_default_flags()
end

# This method returns an hash with the folly version and the folli compiler flags
# that can be used to configure libraries.
# In this way, we can update those values in react native, and all the libraries will benefit
# from it.
# @return an hash with the `:version` and `:compiler_flags` fields.
def get_folly_config()
  return Helpers::Constants.folly_config
end

def rct_cxx_language_standard()
  return Helpers::Constants.cxx_language_standard
end

# Function that executes after React Native has been installed to configure some flags and build settings.
#
# Parameters
# - installer: the Cocoapod object that allows to customize the project.
# - react_native_path: path to React Native.
# - mac_catalyst_enabled: whether we are running the Pod on a Mac Catalyst project or not.
# - enable_hermes_profiler: whether the hermes profiler should be turned on in Release mode
def react_native_post_install(
  installer,
  react_native_path = "../node_modules/react-native",
  mac_catalyst_enabled: false,
  ccache_enabled: ENV['USE_CCACHE'] == '1'
)
  ReactNativePodsUtils.turn_off_resource_bundle_react_core(installer)

  ReactNativePodsUtils.apply_mac_catalyst_patches(installer) if mac_catalyst_enabled

  fabric_enabled = ENV['RCT_FABRIC_ENABLED'] == '1'
  hermes_enabled = ENV['USE_HERMES'] == '1'
  privacy_file_aggregation_enabled = ENV['RCT_AGGREGATE_PRIVACY_FILES'] == '1'

  if hermes_enabled
    ReactNativePodsUtils.set_gcc_preprocessor_definition_for_React_hermes(installer)
  end

  ReactNativePodsUtils.fix_library_search_paths(installer)
  ReactNativePodsUtils.update_search_paths(installer)
  ReactNativePodsUtils.set_build_setting(installer, build_setting: "USE_HERMES", value: hermes_enabled)
  ReactNativePodsUtils.set_build_setting(installer, build_setting: "REACT_NATIVE_PATH", value: File.join("${PODS_ROOT}", "..", react_native_path))
  ReactNativePodsUtils.set_build_setting(installer, build_setting: "SWIFT_ACTIVE_COMPILATION_CONDITIONS", value: ['$(inherited)', 'DEBUG'], config_name: "Debug")

  ReactNativePodsUtils.set_ccache_compiler_and_linker_build_settings(installer, react_native_path, ccache_enabled)
  if Environment.new().ruby_platform().include?('darwin')
    ReactNativePodsUtils.apply_xcode_15_patch(installer)
  end
  ReactNativePodsUtils.updateOSDeploymentTarget(installer)
  ReactNativePodsUtils.set_dynamic_frameworks_flags(installer)
  ReactNativePodsUtils.add_ndebug_flag_to_pods_in_release(installer)
  SPM.apply_on_post_install(installer)

  if privacy_file_aggregation_enabled
    PrivacyManifestUtils.add_aggregated_privacy_manifest(installer)
  else
    PrivacyManifestUtils.add_privacy_manifest_if_needed(installer)
  end

  NewArchitectureHelper.set_clang_cxx_language_standard_if_needed(installer)
  NewArchitectureHelper.modify_flags_for_new_architecture(installer, NewArchitectureHelper.new_arch_enabled)


  Pod::UI.puts "Pod install took #{Time.now.to_i - $START_TIME} [s] to run".green
end
