# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

def use_react_native! (options={})
  # The prefix to react-native
  prefix = options[:path] ||= "../node_modules/react-native"

  # Include Fabric dependencies
  fabric_enabled = options[:fabric_enabled] ||= false

  # Include DevSupport dependency
  production = options[:production] ||= false

  # Include Hermes dependencies
  hermes_enabled = options[:hermes_enabled] ||= false

  if `/usr/sbin/sysctl -n hw.optional.arm64 2>&1`.to_i == 1 && !RUBY_PLATFORM.start_with?('arm64')
    Pod::UI.warn 'Do not use "pod install" from inside Rosetta2 (x86_64 emulation on arm64).'
    Pod::UI.warn ' - Emulated x86_64 is slower than native arm64'
    Pod::UI.warn ' - May result in mixed architectures in rubygems (eg: ffi_c.bundle files may be x86_64 with an arm64 interpreter)'
    Pod::UI.warn 'Run "env /usr/bin/arch -arm64 /bin/bash --login" then try again.'
  end

  # The Pods which should be included in all projects
  pod 'FBLazyVector', :path => "#{prefix}/Libraries/FBLazyVector"
  pod 'FBReactNativeSpec', :path => "#{prefix}/React/FBReactNativeSpec"
  pod 'RCTRequired', :path => "#{prefix}/Libraries/RCTRequired"
  pod 'RCTTypeSafety', :path => "#{prefix}/Libraries/TypeSafety"
  pod 'React', :path => "#{prefix}/"
  pod 'React-Core', :path => "#{prefix}/"
  pod 'React-CoreModules', :path => "#{prefix}/React/CoreModules"
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

  unless production
    pod 'React-Core/DevSupport', :path => "#{prefix}/"
  end

  pod 'React-cxxreact', :path => "#{prefix}/ReactCommon/cxxreact"
  pod 'React-jsi', :path => "#{prefix}/ReactCommon/jsi"
  pod 'React-jsiexecutor', :path => "#{prefix}/ReactCommon/jsiexecutor"
  pod 'React-jsinspector', :path => "#{prefix}/ReactCommon/jsinspector"
  pod 'React-callinvoker', :path => "#{prefix}/ReactCommon/callinvoker"
  pod 'React-runtimeexecutor', :path => "#{prefix}/ReactCommon/runtimeexecutor"
  pod 'React-perflogger', :path => "#{prefix}/ReactCommon/reactperflogger"
  pod 'React-logger', :path => "#{prefix}/ReactCommon/logger"
  pod 'ReactCommon/turbomodule/core', :path => "#{prefix}/ReactCommon"
  pod 'Yoga', :path => "#{prefix}/ReactCommon/yoga", :modular_headers => true

  pod 'DoubleConversion', :podspec => "#{prefix}/third-party-podspecs/DoubleConversion.podspec"
  pod 'glog', :podspec => "#{prefix}/third-party-podspecs/glog.podspec"
  pod 'boost', :podspec => "#{prefix}/third-party-podspecs/boost.podspec"
  pod 'RCT-Folly', :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec"

  if fabric_enabled
    pod 'React-Fabric', :path => "#{prefix}/ReactCommon"
    pod 'React-graphics', :path => "#{prefix}/ReactCommon/react/renderer/graphics"
    pod 'React-jsi/Fabric', :path => "#{prefix}/ReactCommon/jsi"
    pod 'React-RCTFabric', :path => "#{prefix}/React"
    pod 'RCT-Folly/Fabric', :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec"
  end

  if hermes_enabled
    pod 'React-hermes', :path => "#{prefix}/ReactCommon/hermes"
    pod 'hermes-engine', '~> 0.9.0'
    pod 'libevent', '~> 2.1.12'
  end
end

def use_flipper!(versions = {}, configurations: ['Debug'])
  versions['Flipper'] ||= '0.99.0'
  versions['Flipper-Boost-iOSX'] ||= '1.76.0.1.11'
  versions['Flipper-DoubleConversion'] ||= '3.1.7'
  versions['Flipper-Fmt'] ||= '7.1.7'
  versions['Flipper-Folly'] ||= '2.6.7'
  versions['Flipper-Glog'] ||= '0.3.6'
  versions['Flipper-PeerTalk'] ||= '0.0.4'
  versions['Flipper-RSocket'] ||= '1.4.3'
  versions['OpenSSL-Universal'] ||= '1.1.180'
  pod 'FlipperKit', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitLayoutPlugin', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/SKIOSNetworkPlugin', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitUserDefaultsPlugin', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitReactPlugin', versions['Flipper'], :configurations => configurations
  # List all transitive dependencies for FlipperKit pods
  # to avoid them being linked in Release builds
  pod 'Flipper', versions['Flipper'], :configurations => configurations
  pod 'Flipper-Boost-iOSX', versions['Flipper-Boost-iOSX'], :configurations => configurations
  pod 'Flipper-DoubleConversion', versions['Flipper-DoubleConversion'], :configurations => configurations
  pod 'Flipper-Fmt', versions['Flipper-Fmt'], :configurations => configurations
  pod 'Flipper-Folly', versions['Flipper-Folly'], :configurations => configurations
  pod 'Flipper-Glog', versions['Flipper-Glog'], :configurations => configurations
  pod 'Flipper-PeerTalk', versions['Flipper-PeerTalk'], :configurations => configurations
  pod 'Flipper-RSocket', versions['Flipper-RSocket'], :configurations => configurations
  pod 'FlipperKit/Core', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/CppBridge', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FBCxxFollyDynamicConvert', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FBDefines', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FKPortForwarding', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitHighlightOverlay', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitLayoutTextSearchable', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitNetworkPlugin', versions['Flipper'], :configurations => configurations
  pod 'OpenSSL-Universal', versions['OpenSSL-Universal'], :configurations => configurations
end

def has_pod(installer, name)
  installer.pods_project.pod_group(name) != nil
end

# Post Install processing for Flipper
def flipper_post_install(installer)
  installer.pods_project.targets.each do |target|
    if target.name == 'YogaKit'
      target.build_configurations.each do |config|
        config.build_settings['SWIFT_VERSION'] = '4.1'
      end
    end
  end
end

def exclude_architectures(installer)
  projects = installer.aggregate_targets
    .map{ |t| t.user_project }
    .uniq{ |p| p.path }
    .push(installer.pods_project)

  # Hermes does not support `i386` architecture
  excluded_archs_default = has_pod(installer, 'hermes-engine') ? "i386" : ""

  projects.each do |project|
    project.build_configurations.each do |config|
      config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"] = excluded_archs_default
    end

    project.save()
  end
end

def fix_library_search_paths(installer)
  def fix_config(config)
    lib_search_paths = config.build_settings["LIBRARY_SEARCH_PATHS"]
    if lib_search_paths
      if lib_search_paths.include?("$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)") || lib_search_paths.include?("\"$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)\"")
        # $(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME) causes problem with Xcode 12.5 + arm64 (Apple M1)
        # since the libraries there are only built for x86_64 and i386.
        lib_search_paths.delete("$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)")
        lib_search_paths.delete("\"$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)\"")
        if !(lib_search_paths.include?("$(SDKROOT)/usr/lib/swift") || lib_search_paths.include?("\"$(SDKROOT)/usr/lib/swift\""))
          # however, $(SDKROOT)/usr/lib/swift is required, at least if user is not running CocoaPods 1.11
          lib_search_paths.insert(0, "$(SDKROOT)/usr/lib/swift")
        end
      end
    end
  end

  projects = installer.aggregate_targets
    .map{ |t| t.user_project }
    .uniq{ |p| p.path }
    .push(installer.pods_project)

  projects.each do |project|
    project.build_configurations.each do |config|
      fix_config(config)
    end
    project.native_targets.each do |target|
      target.build_configurations.each do |config|
        fix_config(config)
      end
    end
    project.save()
  end
end

def react_native_post_install(installer)
  if has_pod(installer, 'Flipper')
    flipper_post_install(installer)
  end

  exclude_architectures(installer)
  fix_library_search_paths(installer)
end

def use_react_native_codegen!(spec, options={})
  return if ENV['DISABLE_CODEGEN'] == '1'

  # The prefix to react-native
  prefix = options[:react_native_path] ||= "../.."

  # Library name (e.g. FBReactNativeSpec)
  library_name = options[:library_name] ||= "#{spec.name.gsub('_','-').split('-').collect(&:capitalize).join}Spec"

  # Output dir, relative to podspec that invoked this method
  output_dir = options[:output_dir] ||= "#{library_name}"
  components_output_dir = "#{output_dir}/react/renderer/components/#{library_name}"

  codegen_config = {
    "modules" => {
      :js_srcs_pattern => "Native*.js",
      :generated_dir => output_dir,
      :generated_files => [
        "#{library_name}.h",
        "#{library_name}-generated.mm"
      ]
    },
    "components" => {
      :js_srcs_pattern => "*NativeComponent.js",
      :generated_dir => components_output_dir,
      :generated_files => [
        "ComponentDescriptors.h",
        "EventEmitters.cpp",
        "EventEmitters.h",
        "Props.cpp",
        "Props.h",
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

  spec.script_phase = {
    :name => 'Generate Specs',
    :input_files => input_files, # This also needs to be relative to Xcode
    :output_files => ["${DERIVED_FILE_DIR}/codegen-#{library_name}.log"].concat(generated_files.map { |filename| " ${PODS_TARGET_SRCROOT}/#{filename}"} ),
    # The final generated files will be created when this script is invoked at Xcode build time.
    :script => %{set -o pipefail
set -e

RN_DIR=$(cd "$\{PODS_TARGET_SRCROOT\}/#{prefix}" && pwd)

GENERATED_SRCS_DIR="$\{DERIVED_FILE_DIR\}/generated/source/codegen"
GENERATED_SCHEMA_FILE="$GENERATED_SRCS_DIR/schema.json"
TEMP_OUTPUT_DIR="$GENERATED_SRCS_DIR/out"

LIBRARY_NAME="#{library_name}"
OUTPUT_DIR="$\{PODS_TARGET_SRCROOT\}/#{output_dir}"

CODEGEN_REPO_PATH="$RN_DIR/packages/react-native-codegen"
CODEGEN_NPM_PATH="$RN_DIR/../react-native-codegen"
CODEGEN_CLI_PATH=""

# Determine path to react-native-codegen
if [ -d "$CODEGEN_REPO_PATH" ]; then
  CODEGEN_CLI_PATH=$(cd "$CODEGEN_REPO_PATH" && pwd)
elif [ -d "$CODEGEN_NPM_PATH" ]; then
  CODEGEN_CLI_PATH=$(cd "$CODEGEN_NPM_PATH" && pwd)
else
  echo "error: Could not determine react-native-codegen location. Try running 'yarn install' or 'npm install' in your project root." >> "${SCRIPT_OUTPUT_FILE_0}" 2>&1
  exit 1
fi

find_node () {
  source "$RN_DIR/scripts/find-node.sh"

  NODE_BINARY="${NODE_BINARY:-$(command -v node || true)}"
  if [ -z "$NODE_BINARY" ]; then
    echo "error: Could not find node. Make sure it is in bash PATH or set the NODE_BINARY environment variable." >> "${SCRIPT_OUTPUT_FILE_0}" 2>&1
    exit 1
  fi
}

setup_dirs () {
  set +e
  rm -rf "$GENERATED_SRCS_DIR"
  set -e

  mkdir -p "$GENERATED_SRCS_DIR" "$TEMP_OUTPUT_DIR"

  # Clear output files
  > "${SCRIPT_OUTPUT_FILE_0}"
}

describe () {
  printf "\\n\\n>>>>> %s\\n\\n\\n" "$1" >> "${SCRIPT_OUTPUT_FILE_0}" 2>&1
}

buildCodegenCLI () {
  if [ ! -d "$CODEGEN_CLI_PATH/lib" ]; then
    describe "Building react-native-codegen package"
    bash "$CODEGEN_CLI_PATH/scripts/oss/build.sh"
  fi
}

generateCodegenSchemaFromJavaScript () {
  describe "Generating codegen schema from JavaScript"

  SRCS_PATTERN="#{js_srcs_pattern}"
  SRCS_DIR="#{js_srcs_dir}"
  if [ $SRCS_PATTERN ]; then
    JS_SRCS=$(find "$\{PODS_TARGET_SRCROOT\}"/$SRCS_DIR -type f -name "$SRCS_PATTERN" -print0 | xargs -0)
    echo "#{file_list}" >> "${SCRIPT_OUTPUT_FILE_0}" 2>&1
  else
    JS_SRCS="$\{PODS_TARGET_SRCROOT\}/$SRCS_DIR"
    echo "#{js_srcs_dir}" >> "${SCRIPT_OUTPUT_FILE_0}" 2>&1
  fi

  "$NODE_BINARY" "$CODEGEN_CLI_PATH/lib/cli/combine/combine-js-to-schema-cli.js" "$GENERATED_SCHEMA_FILE" $JS_SRCS
}

generateCodegenArtifactsFromSchema () {
  describe "Generating codegen artifacts from schema"
  pushd "$RN_DIR" >/dev/null || exit 1
    "$NODE_BINARY" "scripts/generate-specs-cli.js" ios "$GENERATED_SCHEMA_FILE" "$TEMP_OUTPUT_DIR" "$LIBRARY_NAME"
  popd >/dev/null || exit 1
}

moveOutputs () {
  mkdir -p "$OUTPUT_DIR"

  # Copy all output to output_dir
  cp -R "$TEMP_OUTPUT_DIR/" "$OUTPUT_DIR" || exit 1
  echo "$LIBRARY_NAME output has been written to $OUTPUT_DIR:" >> "${SCRIPT_OUTPUT_FILE_0}" 2>&1
  ls -1 "$OUTPUT_DIR" >> "${SCRIPT_OUTPUT_FILE_0}" 2>&1
}

main () {
  setup_dirs
  find_node
  buildCodegenCLI
  generateCodegenSchemaFromJavaScript
  generateCodegenArtifactsFromSchema
  moveOutputs
}

main "$@"
echo 'Done.' >> "${SCRIPT_OUTPUT_FILE_0}" 2>&1
    },
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
  `sed -i -e  $'s/ && (__IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_10_0)//' Pods/RCT-Folly/folly/portability/Time.h`
end
