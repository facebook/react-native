# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'
require 'open3'
require 'pathname'
require_relative './react_native_pods_utils/script_phases.rb'
require_relative './cocoapods/hermes.rb'
require_relative './cocoapods/flipper.rb'
require_relative './cocoapods/fabric.rb'
require_relative './cocoapods/codegen.rb'
require_relative './cocoapods/utils.rb'
require_relative './cocoapods/new_architecture.rb'
require_relative './cocoapods/local_podspec_patch.rb'

$CODEGEN_OUTPUT_DIR = 'build/generated/ios'
$CODEGEN_COMPONENT_DIR = 'react/renderer/components'
$CODEGEN_MODULE_DIR = '.'
$REACT_CODEGEN_PODSPEC_GENERATED = false
$REACT_CODEGEN_DISCOVERY_DONE = false

$START_TIME = Time.now.to_i

def use_react_native! (options={})
  # The prefix to react-native
  prefix = options[:path] ||= "../node_modules/react-native"

  # Include Fabric dependencies
  fabric_enabled = options[:fabric_enabled] ||= false

  # New arch enabled
  new_arch_enabled = ENV['RCT_NEW_ARCH_ENABLED'] == '1'

  # Include DevSupport dependency
  production = options[:production] ||= false

  # Include Hermes dependencies
  hermes_enabled = options[:hermes_enabled] != nil ? options[:hermes_enabled] : true

  flipper_configuration = options[:flipper_configuration] ||= FlipperConfiguration.disabled

  ReactNativePodsUtils.warn_if_not_on_arm64()

  # The Pods which should be included in all projects
  pod 'FBLazyVector', :path => "#{prefix}/Libraries/FBLazyVector"
  pod 'FBReactNativeSpec', :path => "#{prefix}/React/FBReactNativeSpec"
  pod 'RCTRequired', :path => "#{prefix}/Libraries/RCTRequired"
  pod 'RCTTypeSafety', :path => "#{prefix}/Libraries/TypeSafety", :modular_headers => true
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

  pod 'React-bridging', :path => "#{prefix}/ReactCommon"
  pod 'React-cxxreact', :path => "#{prefix}/ReactCommon/cxxreact"
  pod 'React-jsi', :path => "#{prefix}/ReactCommon/jsi"
  pod 'React-jsiexecutor', :path => "#{prefix}/ReactCommon/jsiexecutor"
  pod 'React-jsinspector', :path => "#{prefix}/ReactCommon/jsinspector"
  pod 'React-callinvoker', :path => "#{prefix}/ReactCommon/callinvoker"
  pod 'React-runtimeexecutor', :path => "#{prefix}/ReactCommon/runtimeexecutor"
  pod 'React-perflogger', :path => "#{prefix}/ReactCommon/reactperflogger"
  pod 'React-logger', :path => "#{prefix}/ReactCommon/logger"
  pod 'ReactCommon/turbomodule/core', :path => "#{prefix}/ReactCommon", :modular_headers => true
  pod 'Yoga', :path => "#{prefix}/ReactCommon/yoga", :modular_headers => true

  pod 'DoubleConversion', :podspec => "#{prefix}/third-party-podspecs/DoubleConversion.podspec"
  pod 'glog', :podspec => "#{prefix}/third-party-podspecs/glog.podspec"
  pod 'boost', :podspec => "#{prefix}/third-party-podspecs/boost.podspec"
  pod 'RCT-Folly', :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec", :modular_headers => true

  if new_arch_enabled
    app_path = options[:app_path]
    config_file_dir = options[:config_file_dir]
    use_react_native_codegen_discovery!({
      react_native_path: prefix,
      app_path: app_path,
      fabric_enabled: fabric_enabled,
      config_file_dir: config_file_dir,
    })
  else
    # Generate a podspec file for generated files.
    # This gets generated in use_react_native_codegen_discovery when codegen discovery is enabled.
    react_codegen_spec = get_react_codegen_spec(fabric_enabled: fabric_enabled)
    generate_react_codegen_podspec!(react_codegen_spec)
  end

  pod 'React-Codegen', :path => $CODEGEN_OUTPUT_DIR, :modular_headers => true

  if fabric_enabled
    checkAndGenerateEmptyThirdPartyProvider!(prefix, new_arch_enabled, $CODEGEN_OUTPUT_DIR)
    setup_fabric!(prefix)
  end

  install_hermes_if_enabled(hermes_enabled, prefix)

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

def get_default_flags()
  return ReactNativePodsUtils.get_default_flags()
end

def use_flipper!(versions = {}, configurations: ['Debug'])
  Pod::UI.warn "use_flipper is deprecated, use the flipper_configuration option in the use_react_native function"
  use_flipper_pods(versions, :configurations => configurations)
end

def react_native_post_install(installer, react_native_path = "../node_modules/react-native", mac_catalyst_enabled: false)
  ReactNativePodsUtils.apply_mac_catalyst_patches(installer) if mac_catalyst_enabled

  if ReactNativePodsUtils.has_pod(installer, 'Flipper')
    flipper_post_install(installer)
  end

  ReactNativePodsUtils.exclude_i386_architecture_while_using_hermes(installer)
  ReactNativePodsUtils.fix_library_search_paths(installer)
  ReactNativePodsUtils.set_node_modules_user_settings(installer, react_native_path)

  NewArchitectureHelper.set_clang_cxx_language_standard_if_needed(installer)
  is_new_arch_enabled = ENV['RCT_NEW_ARCH_ENABLED'] == '1'
  NewArchitectureHelper.modify_flags_for_new_architecture(installer, is_new_arch_enabled)

  Pod::UI.puts "Pod install took #{Time.now.to_i - $START_TIME} [s] to run".green
end

def get_react_codegen_spec(options={})
  fabric_enabled = options[:fabric_enabled] ||= false
  script_phases = options[:script_phases] ||= nil

  package = JSON.parse(File.read(File.join(__dir__, "..", "package.json")))
  version = package['version']

  source = { :git => 'https://github.com/facebook/react-native.git' }
  if version == '1000.0.0'
    # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
    source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
  else
    source[:tag] = "v#{version}"
  end

  folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
  folly_version = '2021.07.22.00'
  boost_version = '1.76.0'
  boost_compiler_flags = '-Wno-documentation'

  spec = {
    'name' => "React-Codegen",
    'version' => version,
    'summary' => 'Temp pod for generated files for React Native',
    'homepage' => 'https://facebook.com/',
    'license' => 'Unlicense',
    'authors' => 'Facebook',
    'compiler_flags'  => "#{folly_compiler_flags} #{boost_compiler_flags} -Wno-nullability-completeness -std=c++17",
    'source' => { :git => '' },
    'header_mappings_dir' => './',
    'platforms' => {
      'ios' => '11.0',
    },
    'source_files' => "**/*.{h,mm,cpp}",
    'pod_target_xcconfig' => { "HEADER_SEARCH_PATHS" =>
      [
        "\"$(PODS_ROOT)/boost\"",
        "\"$(PODS_ROOT)/RCT-Folly\"",
        "\"${PODS_ROOT}/Headers/Public/React-Codegen/react/renderer/components\"",
        "\"$(PODS_ROOT)/Headers/Private/React-Fabric\"",
        "\"$(PODS_ROOT)/Headers/Private/React-RCTFabric\"",
      ].join(' ')
    },
    'dependencies': {
      "FBReactNativeSpec":  [version],
      "React-jsiexecutor":  [version],
      "RCT-Folly": [folly_version],
      "RCTRequired": [version],
      "RCTTypeSafety": [version],
      "React-Core": [version],
      "React-jsi": [version],
      "ReactCommon/turbomodule/core": [version]
    }
  }

  if fabric_enabled
    spec[:'dependencies'].merge!({
      'React-graphics': [version],
      'React-rncore':  [version],
    });
  end

  if script_phases
    Pod::UI.puts "[Codegen] Adding script_phases to React-Codegen."
    spec[:'script_phases'] = script_phases
  end

  return spec
end

def get_codegen_config_from_file(config_path, config_key)
  empty = {'libraries' => []}
  if !File.exist?(config_path)
    return empty
  end

  config = JSON.parse(File.read(config_path))
  return config[config_key] ? config[config_key] : empty
end

def get_react_codegen_script_phases(options={})
  app_path = options[:app_path] ||= ''
  if !app_path
    Pod::UI.warn '[Codegen] error: app_path is requried to use codegen discovery.'
    exit 1
  end

  # We need to convert paths to relative path from installation_root for the script phase for CI.
  relative_app_root = Pathname.new(app_path).realpath().relative_path_from(Pod::Config.instance.installation_root)

  config_file_dir = options[:config_file_dir] ||= ''
  relative_config_file_dir = ''
  if config_file_dir != ''
    relative_config_file_dir = Pathname.new(config_file_dir).relative_path_from(Pod::Config.instance.installation_root)
  end

  fabric_enabled = options[:fabric_enabled] ||= false

  # react_native_path should be relative already.
  react_native_path = options[:react_native_path] ||= "../node_modules/react-native"

  # Generate input files for in-app libaraies which will be used to check if the script needs to be run.
  # TODO: Ideally, we generate the input_files list from generate-artifacts.js and read the result here.
  #       Or, generate this podspec in generate-artifacts.js as well.
  config_key = options[:config_key] ||= 'codegenConfig'
  app_package_path = File.join(app_path, 'package.json')
  app_codegen_config = get_codegen_config_from_file(app_package_path, config_key)
  file_list = []
  if app_codegen_config['libraries'] then
    Pod::UI.warn '[Deprecated] You are using the old `libraries` array to list all your codegen.\nThis method will be removed in the future.\nUpdate your `package.json` with a single object.'
    app_codegen_config['libraries'].each do |library|
      library_dir = File.join(app_path, library['jsSrcsDir'])
      file_list.concat (`find #{library_dir} -type f \\( -name "Native*.js" -or -name "*NativeComponent.js" \\)`.split("\n").sort)
    end
  elsif app_codegen_config['jsSrcsDir'] then
    codegen_dir = File.join(app_path, app_codegen_config['jsSrcsDir'])
    file_list.concat (`find #{codegen_dir} -type f \\( -name "Native*.js" -or -name "*NativeComponent.js" \\)`.split("\n").sort)
  else
    Pod::UI.warn '[Error] Codegen not properly configured. Please add the `codegenConf` entry to your `package.json`'
    exit 1
  end

  input_files = file_list.map { |filename| "${PODS_ROOT}/../#{Pathname.new(filename).realpath().relative_path_from(Pod::Config.instance.installation_root)}" }

  # Add a script phase to trigger generate artifact.
  # Some code is duplicated so that it's easier to delete the old way and switch over to this once it's stabilized.
  return {
    'name': 'Generate Specs',
    'execution_position': :before_compile,
    'input_files' => input_files,
    'show_env_vars_in_log': true,
    'output_files': ["${DERIVED_FILE_DIR}/react-codegen.log"],
    'script': get_script_phases_with_codegen_discovery(
      react_native_path: react_native_path,
      relative_app_root: relative_app_root,
      relative_config_file_dir: relative_config_file_dir,
      fabric_enabled: fabric_enabled
    ),
  }

end

def set_react_codegen_podspec_generated(value)
  $REACT_CODEGEN_PODSPEC_GENERATED = value
end

def has_react_codegen_podspec_generated()
  return $REACT_CODEGEN_PODSPEC_GENERATED
end

def generate_react_codegen_podspec!(spec)
  # This podspec file should only be create once in the session/pod install.
  # This happens when multiple targets are calling use_react_native!.
  if has_react_codegen_podspec_generated()
    Pod::UI.puts "[Codegen] Skipping React-Codegen podspec generation."
    return
  end
  relative_installation_root = Pod::Config.instance.installation_root.relative_path_from(Pathname.pwd)
  output_dir = "#{relative_installation_root}/#{$CODEGEN_OUTPUT_DIR}"
  Pod::Executable.execute_command("mkdir", ["-p", output_dir]);

  podspec_path = File.join(output_dir, 'React-Codegen.podspec.json')
  Pod::UI.puts "[Codegen] Generating #{podspec_path}"

  File.open(podspec_path, 'w') do |f|
    f.write(spec.to_json)
    f.fsync
  end

  set_react_codegen_podspec_generated(true)

  return {
    "spec" => spec,
    "path" => $CODEGEN_OUTPUT_DIR,  # Path needs to be relative to `Podfile`
  }
end


def use_react_native_codegen_discovery!(options={})
  return if ENV['DISABLE_CODEGEN'] == '1'

  if $REACT_CODEGEN_DISCOVERY_DONE
    Pod::UI.puts "[Codegen] Skipping use_react_native_codegen_discovery."
    return
  end

  Pod::UI.warn '[Codegen] warn: using experimental new codegen integration'
  react_native_path = options[:react_native_path] ||= "../node_modules/react-native"
  app_path = options[:app_path]
  fabric_enabled = options[:fabric_enabled] ||= false
  config_file_dir = options[:config_file_dir] ||= ''
  relative_installation_root = Pod::Config.instance.installation_root.relative_path_from(Pathname.pwd)

  if !app_path
    Pod::UI.warn '[Codegen] Error: app_path is required for use_react_native_codegen_discovery.'
    Pod::UI.warn '[Codegen] If you are calling use_react_native_codegen_discovery! in your Podfile, please remove the call and pass `app_path` and/or `config_file_dir` to `use_react_native!`.'
    exit 1
  end

  # Generate React-Codegen podspec here to add the script phases.
  script_phases = get_react_codegen_script_phases(options)
  react_codegen_spec = get_react_codegen_spec(fabric_enabled: fabric_enabled, script_phases: script_phases)
  generate_react_codegen_podspec!(react_codegen_spec)

  out = Pod::Executable.execute_command(
    'node',
    [
      "#{relative_installation_root}/#{react_native_path}/scripts/generate-artifacts.js",
      "-p", "#{app_path}",
      "-o", Pod::Config.instance.installation_root,
      "-e", "#{fabric_enabled}",
      "-c", "#{config_file_dir}",
    ])
  Pod::UI.puts out;

  $REACT_CODEGEN_DISCOVERY_DONE = true
end

def use_react_native_codegen!(spec, options={})
  return if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
  # TODO: Once the new codegen approach is ready for use, we should output a warning here to let folks know to migrate.

  # The prefix to react-native
  react_native_path = options[:react_native_path] ||= "../.."

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
      codegen_output_dir: $CODEGEN_OUTPUT_DIR,
      codegen_module_dir: $CODEGEN_MODULE_DIR,
      codegen_component_dir: $CODEGEN_COMPONENT_DIR,
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
  `sed -i -e  $'s/ && (__IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_10_0)//' #{time_header}`
end
