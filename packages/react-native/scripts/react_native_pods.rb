# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'
require 'open3'
require 'pathname'
require_relative './react_native_pods_utils/script_phases.rb'
require_relative './cocoapods/jsengine.rb'
require_relative './cocoapods/flipper.rb'
require_relative './cocoapods/fabric.rb'
require_relative './cocoapods/codegen.rb'
require_relative './cocoapods/codegen_utils.rb'
require_relative './cocoapods/utils.rb'
require_relative './cocoapods/new_architecture.rb'
require_relative './cocoapods/local_podspec_patch.rb'
require_relative './cocoapods/helpers.rb'

$CODEGEN_OUTPUT_DIR = 'build/generated/ios'
$CODEGEN_COMPONENT_DIR = 'react/renderer/components'
$CODEGEN_MODULE_DIR = '.'
$FOLLY_VERSION = '2021.07.22.00'

$START_TIME = Time.now.to_i

# `@react-native-community/cli-platform-ios/native_modules` defines
# use_native_modules. We use node to resolve its path to allow for
# different packager and workspace setups. This is reliant on
# `@react-native-community/cli-platform-ios` being a direct dependency
# of `react-native`.
require Pod::Executable.execute_command('node', ['-p',
  'require.resolve(
    "@react-native-community/cli-platform-ios/native_modules.rb",
    {paths: [process.argv[1]]},
  )', __dir__]).strip


# This function returns the min supported OS versions supported by React Native
# By using this function, you won't have to manually change your Podfile
# when we change the minimum version supported by the framework.
def min_ios_version_supported
  return Helpers::Constants.min_ios_version_supported
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
# - production: whether the dependencies must be installed to target a Debug or a Release build.
# - hermes_enabled: whether Hermes should be enabled or not.
# - flipper_configuration: The configuration to use for flipper.
# - app_path: path to the React Native app. Required by the New Architecture.
# - config_file_dir: directory of the `package.json` file, required by the New Architecture.
# - ios_folder: the folder where the iOS code base lives. For a template app, it is `ios`, the default. For RNTester, it is `.`.
def use_react_native! (
  path: "../node_modules/react-native",
  fabric_enabled: false,
  new_arch_enabled: ENV['RCT_NEW_ARCH_ENABLED'] == '1',
  production: ENV['PRODUCTION'] == '1',
  hermes_enabled: ENV['USE_HERMES'] && ENV['USE_HERMES'] == '0' ? false : true,
  flipper_configuration: FlipperConfiguration.disabled,
  app_path: '..',
  config_file_dir: '',
  ios_folder: 'ios'
)

  # Set the app_path as env variable so the podspecs can access it.
  ENV['APP_PATH'] = app_path
  ENV['REACT_NATIVE_PATH'] = path

  # Current target definition is provided by Cocoapods and it refers to the target
  # that has invoked the `use_react_native!` function.
  ReactNativePodsUtils.detect_use_frameworks(current_target_definition)

  CodegenUtils.clean_up_build_folder(path, app_path, ios_folder, $CODEGEN_OUTPUT_DIR)

  # We are relying on this flag also in third parties libraries to proper install dependencies.
  # Better to rely and enable this environment flag if the new architecture is turned on using flags.
  ENV['RCT_NEW_ARCH_ENABLED'] = new_arch_enabled ? "1" : "0"
  fabric_enabled = fabric_enabled || new_arch_enabled
  ENV['RCT_FABRIC_ENABLED'] = fabric_enabled ? "1" : "0"
  ENV['USE_HERMES'] = hermes_enabled ? "1" : "0"

  prefix = path

  ReactNativePodsUtils.warn_if_not_on_arm64()

  # The Pods which should be included in all projects
  pod 'FBLazyVector', :path => "#{prefix}/Libraries/FBLazyVector"
  pod 'FBReactNativeSpec', :path => "#{prefix}/React/FBReactNativeSpec" if !new_arch_enabled
  pod 'RCTRequired', :path => "#{prefix}/Libraries/RCTRequired"
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

  if hermes_enabled
    setup_hermes!(:react_native_path => prefix, :fabric_enabled => fabric_enabled)
  else
    setup_jsc!(:react_native_path => prefix, :fabric_enabled => fabric_enabled)
  end

  pod 'React-jsiexecutor', :path => "#{prefix}/ReactCommon/jsiexecutor"
  pod 'React-jsinspector', :path => "#{prefix}/ReactCommon/jsinspector"

  pod 'React-callinvoker', :path => "#{prefix}/ReactCommon/callinvoker"
  pod 'React-runtimeexecutor', :path => "#{prefix}/ReactCommon/runtimeexecutor"
  pod 'React-runtimescheduler', :path => "#{prefix}/ReactCommon/react/renderer/runtimescheduler"
  pod 'React-perflogger', :path => "#{prefix}/ReactCommon/reactperflogger"
  pod 'React-logger', :path => "#{prefix}/ReactCommon/logger"
  pod 'ReactCommon/turbomodule/core', :path => "#{prefix}/ReactCommon", :modular_headers => true
  pod 'React-NativeModulesApple', :path => "#{prefix}/ReactCommon/react/nativemodule/core/platform/ios", :modular_headers => true
  pod 'Yoga', :path => "#{prefix}/ReactCommon/yoga", :modular_headers => true

  pod 'DoubleConversion', :podspec => "#{prefix}/third-party-podspecs/DoubleConversion.podspec"
  pod 'glog', :podspec => "#{prefix}/third-party-podspecs/glog.podspec"
  pod 'boost', :podspec => "#{prefix}/third-party-podspecs/boost.podspec"
  pod 'RCT-Folly', :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec", :modular_headers => true

  run_codegen!(
    app_path,
    config_file_dir,
    :new_arch_enabled => new_arch_enabled,
    :disable_codegen => ENV['DISABLE_CODEGEN'] == '1',
    :react_native_path => prefix,
    :fabric_enabled => fabric_enabled,
    :hermes_enabled => hermes_enabled,
    :codegen_output_dir => $CODEGEN_OUTPUT_DIR,
    :package_json_file => File.join(__dir__, "..", "package.json"),
    :folly_version => $FOLLY_VERSION
  )

  pod 'React-Codegen', :path => $CODEGEN_OUTPUT_DIR, :modular_headers => true

  if fabric_enabled
    checkAndGenerateEmptyThirdPartyProvider!(prefix, new_arch_enabled)
    setup_fabric!(:react_native_path => prefix, new_arch_enabled: new_arch_enabled)
  else
    relative_installation_root = Pod::Config.instance.installation_root.relative_path_from(Pathname.pwd)
    build_codegen!(prefix, relative_installation_root)
  end

  # CocoaPods `configurations` option ensures that the target is copied only for the specified configurations,
  # but those dependencies are still built.
  # Flipper doesn't currently compile for release https://github.com/facebook/react-native/issues/33764
  # Setting the production flag to true when build for production make sure that we don't install Flipper in the app in the first place.
  if flipper_configuration.flipper_enabled && !production
    install_flipper_dependencies(prefix)
    use_flipper_pods(flipper_configuration.versions, :configurations => flipper_configuration.configurations)
  end

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

# This function can be used by library developer to prepare their modules for the New Architecture.
# It passes the Folly Flags to the module, it configures the search path and installs some New Architecture specific dependencies.
#
# Parameters:
# - spec: The spec that has to be configured with the New Architecture code
# - new_arch_enabled: Whether the module should install dependencies for the new architecture
def install_modules_dependencies(spec, new_arch_enabled: ENV['RCT_NEW_ARCH_ENABLED'] == "1")
  NewArchitectureHelper.install_modules_dependencies(spec, new_arch_enabled, $FOLLY_VERSION)
end

# It returns the default flags.
def get_default_flags()
  return ReactNativePodsUtils.get_default_flags()
end

# It installs the flipper dependencies into the project.
#
# Parameters
# - versions: a dictionary of Flipper Library -> Versions that can be used to customize which version of Flipper to install.
# - configurations: an array of configuration where to install the dependencies.
def use_flipper!(versions = {}, configurations: ['Debug'])
  Pod::UI.warn "use_flipper is deprecated, use the flipper_configuration option in the use_react_native function"
  use_flipper_pods(versions, :configurations => configurations)
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
  mac_catalyst_enabled: false
)
  ReactNativePodsUtils.turn_off_resource_bundle_react_core(installer)

  ReactNativePodsUtils.apply_mac_catalyst_patches(installer) if mac_catalyst_enabled

  if ReactNativePodsUtils.has_pod(installer, 'Flipper')
    flipper_post_install(installer)
  end

  fabric_enabled = ReactNativePodsUtils.has_pod(installer, 'React-Fabric')

  ReactNativePodsUtils.exclude_i386_architecture_while_using_hermes(installer)
  ReactNativePodsUtils.fix_library_search_paths(installer)
  ReactNativePodsUtils.update_search_paths(installer)
  ReactNativePodsUtils.set_node_modules_user_settings(installer, react_native_path)
  ReactNativePodsUtils.apply_flags_for_fabric(installer, fabric_enabled: fabric_enabled)
  ReactNativePodsUtils.apply_xcode_15_patch(installer)
  ReactNativePodsUtils.updateIphoneOSDeploymentTarget(installer)

  NewArchitectureHelper.set_clang_cxx_language_standard_if_needed(installer)
  is_new_arch_enabled = ENV['RCT_NEW_ARCH_ENABLED'] == "1"
  NewArchitectureHelper.modify_flags_for_new_architecture(installer, is_new_arch_enabled)


  Pod::UI.puts "Pod install took #{Time.now.to_i - $START_TIME} [s] to run".green
end

# === LEGACY METHOD ===
# We need to keep this while we continue to support the old architecture.
# =====================
def use_react_native_codegen!(spec, options={})
  return if ENV['RCT_NEW_ARCH_ENABLED'] == "1"
  # TODO: Once the new codegen approach is ready for use, we should output a warning here to let folks know to migrate.

  # The prefix to react-native
  react_native_path = options[:react_native_path] ||= ".."

  # Library name (e.g. FBReactNativeSpec)
  library_name = options[:library_name] ||= "#{spec.name.gsub('_','-').split('-').collect(&:capitalize).join}Spec"
  Pod::UI.puts "[Codegen] Found #{library_name}"

  relative_installation_root = Pod::Config.instance.installation_root.relative_path_from(Pathname.pwd)
  output_dir = options[:output_dir] ||= $CODEGEN_OUTPUT_DIR
  output_dir_module = "#{output_dir}/#{$CODEGEN_MODULE_DIR}"
  output_dir_component = "#{output_dir}/#{$CODEGEN_COMPONENT_DIR}"

  codegen_config = {
    "modules" => {
      :js_srcs_pattern => "Native*.js",
      :generated_dir => "#{relative_installation_root}/#{output_dir_module}/#{library_name}",
      :generated_files => [
        "#{library_name}.h",
        "#{library_name}-generated.mm"
      ]
    },
    "components" => {
      :js_srcs_pattern => "*NativeComponent.js",
      :generated_dir => "#{relative_installation_root}/#{output_dir_component}/#{library_name}",
      :generated_files => [
        "ComponentDescriptors.h",
        "EventEmitters.cpp",
        "EventEmitters.h",
        "Props.cpp",
        "Props.h",
        "States.cpp",
        "States.h",
        "RCTComponentViewHelpers.h",
        "ShadowNodes.cpp",
        "ShadowNodes.h"
      ]
    }
  }

  # The path to JavaScript files
  js_srcs_dir = options[:js_srcs_dir] ||= "./"
  library_type = options[:library_type]

  if library_type
    if !codegen_config[library_type]
      raise "[Codegen] invalid library_type: #{library_type}. Check your podspec to make sure it's set to 'modules' or 'components'. Removing the option will generate files for both"
    end
    js_srcs_pattern = codegen_config[library_type][:js_srcs_pattern]
  end

  if library_type
    generated_dirs = [ codegen_config[library_type][:generated_dir] ]
    generated_files = codegen_config[library_type][:generated_files].map { |filename| "#{codegen_config[library_type][:generated_dir]}/#{filename}" }
  else
    generated_dirs = [ codegen_config["modules"][:generated_dir], codegen_config["components"][:generated_dir] ]
    generated_files = codegen_config["modules"][:generated_files].map { |filename| "#{codegen_config["modules"][:generated_dir]}/#{filename}" }
    generated_files = generated_files.concat(codegen_config["components"][:generated_files].map { |filename| "#{codegen_config["components"][:generated_dir]}/#{filename}" })
  end

  if js_srcs_pattern
    file_list = `find #{js_srcs_dir} -type f -name #{js_srcs_pattern}`.split("\n").sort
    input_files = file_list.map { |filename| "${PODS_TARGET_SRCROOT}/#{filename}" }
  else
    input_files = [ js_srcs_dir ]
  end

  # Prepare filesystem by creating empty files that will be picked up as references by CocoaPods.
  prepare_command = "mkdir -p #{generated_dirs.join(" ")} && touch -a #{generated_files.join(" ")}"
  system(prepare_command) # Always run prepare_command when a podspec uses the codegen, as CocoaPods may skip invoking this command in certain scenarios. Replace with pre_integrate_hook after updating to CocoaPods 1.11
  spec.prepare_command = prepare_command

  env_files = ["$PODS_ROOT/../.xcode.env.local", "$PODS_ROOT/../.xcode.env"]

  spec.script_phase = {
    :name => 'Generate Specs',
    :input_files => input_files + env_files, # This also needs to be relative to Xcode
    :output_files => ["${DERIVED_FILE_DIR}/codegen-#{library_name}.log"].concat(generated_files.map { |filename| "${PODS_TARGET_SRCROOT}/#{filename}"} ),
    # The final generated files will be created when this script is invoked at Xcode build time.
    :script => get_script_phases_no_codegen_discovery(
      react_native_path: react_native_path,
      codegen_output_dir: output_dir,
      codegen_module_dir: output_dir_module,
      codegen_component_dir: output_dir_component,
      library_name: library_name,
      library_type: library_type,
      js_srcs_pattern: js_srcs_pattern,
      js_srcs_dir: js_srcs_dir,
      file_list: file_list
    ),
    :execution_position => :before_compile,
    :show_env_vars_in_log => true
  }
end

# This provides a post_install workaround for build issues related Xcode 12.5 and Apple Silicon (M1) machines.
# Call this in the app's main Podfile's post_install hook.
# See https://github.com/facebook/react-native/issues/31480#issuecomment-902912841 for more context.
# Actual fix was authored by https://github.com/mikehardy.
# New app template will call this for now until the underlying issue is resolved.
def __apply_Xcode_12_5_M1_post_install_workaround(installer)
  # Flipper podspecs are still targeting an older iOS deployment target, and may cause an error like:
  #   "error: thread-local storage is not supported for the current target"
  # The most reliable known workaround is to bump iOS deployment target to match react-native (iOS 11 now).
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      # ensure IPHONEOS_DEPLOYMENT_TARGET is at least 11.0
      deployment_target = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f
      should_upgrade = deployment_target < 11.0 && deployment_target != 0.0
      if should_upgrade
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '11.0'
      end
    end
  end

  # But... doing so caused another issue in Flipper:
  #   "Time.h:52:17: error: typedef redefinition with different types"
  # We need to make a patch to RCT-Folly - remove the `__IPHONE_OS_VERSION_MIN_REQUIRED` check.
  # See https://github.com/facebook/flipper/issues/834 for more details.
  time_header = "#{Pod::Config.instance.installation_root.to_s}/Pods/RCT-Folly/folly/portability/Time.h"
  `sed -i -e  $'s/ && (__IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_10_0)//' '#{time_header}'`
end
