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
  pod 'ReactCommon/turbomodule/core', :path => "#{prefix}/ReactCommon"
  pod 'Yoga', :path => "#{prefix}/ReactCommon/yoga", :modular_headers => true

  pod 'DoubleConversion', :podspec => "#{prefix}/third-party-podspecs/DoubleConversion.podspec"
  pod 'glog', :podspec => "#{prefix}/third-party-podspecs/glog.podspec"
  pod 'RCT-Folly', :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec"

  if fabric_enabled
    pod 'React-Fabric', :path => "#{prefix}/ReactCommon"
    pod 'React-graphics', :path => "#{prefix}/ReactCommon/react/renderer/graphics"
    pod 'React-jsi/Fabric', :path => "#{prefix}/ReactCommon/jsi"
    pod 'React-RCTFabric', :path => "#{prefix}/React"
    pod 'RCT-Folly/Fabric', :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec"
  end

  if hermes_enabled
    pod 'React-Core/Hermes', :path => "#{prefix}/"
    pod 'hermes-engine', '~> 0.7.2'
    pod 'libevent', '~> 2.1.12'
  end
end

def use_flipper!(versions = {}, configurations: ['Debug'])
  versions['Flipper'] ||= '~> 0.75.1'
  versions['Flipper-DoubleConversion'] ||= '1.1.7'
  versions['Flipper-Folly'] ||= '~> 2.5.3'
  versions['Flipper-Glog'] ||= '0.3.6'
  versions['Flipper-PeerTalk'] ||= '~> 0.0.4'
  versions['Flipper-RSocket'] ||= '~> 1.3'
  pod 'FlipperKit', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitLayoutPlugin', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/SKIOSNetworkPlugin', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitUserDefaultsPlugin', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitReactPlugin', versions['Flipper'], :configurations => configurations
  # List all transitive dependencies for FlipperKit pods
  # to avoid them being linked in Release builds
  pod 'Flipper', versions['Flipper'], :configurations => configurations
  pod 'Flipper-DoubleConversion', versions['Flipper-DoubleConversion'], :configurations => configurations
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

  arm_value = `/usr/sbin/sysctl -n hw.optional.arm64 2>&1`.to_i

  # Hermes does not support `i386` architecture
  excluded_archs_default = has_pod(installer, 'hermes-engine') ? "i386" : ""

  projects.each do |project|
    project.build_configurations.each do |config|
      if arm_value == 1 then
        config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"] = excluded_archs_default
      else
        config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"] = "arm64 " + excluded_archs_default
      end
    end

    project.save()
  end
end

def react_native_post_install(installer)
  pods_prefix = File.dirname(installer.pods_project.path)

  if has_pod(installer, 'Flipper')
    flipper_post_install(installer)
  end

  ## Fix for RTC-Folly on iOS 14.5 - makes Hermes work again
  find_and_replace(
    "#{pods_prefix}/RCT-Folly/folly/synchronization/DistributedMutex-inl.h",
    'atomic_notify_one(state)',
    'folly::atomic_notify_one(state)'
  )

  find_and_replace(
    "#{pods_prefix}Pods/RCT-Folly/folly/synchronization/DistributedMutex-inl.h",
    'atomic_wait_until(&state, previous | data, deadline)',
    'folly::atomic_wait_until(&state, previous | data, deadline)'
  )

  ## Exclude `i386` from valid architectures when building with Hermes on iOS
  exclude_architectures(installer)
end

def use_react_native_codegen!(spec, options={})
  return if ENV['DISABLE_CODEGEN'] == '1'

  # The path to react-native
  prefix = options[:path] ||= "${PODS_TARGET_SRCROOT}/../.."

  # The path to JavaScript files
  js_srcs = options[:js_srcs_dir] ||= "#{prefix}/Libraries"

  # Library name (e.g. FBReactNativeSpec)
  modules_library_name = spec.name
  modules_output_dir = "React/#{modules_library_name}/#{modules_library_name}"

  # Run the codegen as part of the Xcode build pipeline.
  env_vars = "SRCS_DIR=#{js_srcs}"
  env_vars += " MODULES_OUTPUT_DIR=#{prefix}/#{modules_output_dir}"
  env_vars += " MODULES_LIBRARY_NAME=#{modules_library_name}"

  generated_dirs = [ modules_output_dir ]
  generated_filenames = [ "#{modules_library_name}.h", "#{modules_library_name}-generated.mm" ]
  generated_files = generated_filenames.map { |filename| "#{modules_output_dir}/#{filename}" }

  if ENV['USE_FABRIC'] == '1'
    # We use a different library name for components, as well as an additional set of files.
    # Eventually, we want these to be part of the same library as #{modules_library_name} above.
    components_output_dir = "ReactCommon/react/renderer/components/rncore/"
    generated_dirs.push components_output_dir
    env_vars += " COMPONENTS_OUTPUT_DIR=#{prefix}/#{components_output_dir}"
    components_generated_filenames = [
      "ComponentDescriptors.h",
      "EventEmitters.cpp",
      "EventEmitters.h",
      "Props.cpp",
      "Props.h",
      "RCTComponentViewHelpers.h",
      "ShadowNodes.cpp",
      "ShadowNodes.h"
    ]
    generated_files = generated_files.concat(components_generated_filenames.map { |filename| "#{components_output_dir}/#{filename}" })
  end

  spec.script_phase = {
    :name => 'Generate Specs',
    :input_files => [js_srcs],
    :output_files => ["${DERIVED_FILE_DIR}/codegen-#{modules_library_name}.log"].concat(generated_files.map { |filename| "#{prefix}/#{filename}"} ),
    :script => "set -o pipefail\n\nbash -l -c '#{env_vars} ${PODS_TARGET_SRCROOT}/../../scripts/generate-specs.sh' 2>&1 | tee \"${SCRIPT_OUTPUT_FILE_0}\"",
    :execution_position => :before_compile,
    :show_env_vars_in_log => true
  }
  spec.prepare_command = "mkdir -p #{generated_dirs.reduce("") { |str, dir| "#{str} ../../#{dir}" }} && touch #{generated_files.reduce("") { |str, filename| "#{str} ../../#{filename}" }}"
end

# Local method for the Xcode 12.5 fix
def find_and_replace(dir, findstr, replacestr)
  Dir[dir].each do |name|
    text = File.read(name)
    replace = text.gsub(findstr, replacestr)
    replaced = text.index(replacestr)
    next if !replaced.nil? || text == replace

    puts "Patching #{name}"
    File.open(name, 'w') { |file| file.puts replace }
    $stdout.flush
  end
  Dir["#{dir}*/"].each(&method(:find_and_replace))
end