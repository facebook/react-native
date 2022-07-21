# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'
require 'open3'
require 'pathname'
require_relative './cocoapods/FlipperConfiguration.rb'
require_relative './react_native_pods_utils/script_phases.rb'

$CODEGEN_OUTPUT_DIR = 'build/generated/ios'
$CODEGEN_COMPONENT_DIR = 'react/renderer/components'
$CODEGEN_MODULE_DIR = '.'
$REACT_CODEGEN_PODSPEC_GENERATED = false
$REACT_CODEGEN_DISCOVERY_DONE = false
DEFAULT_OTHER_CPLUSPLUSFLAGS = '$(inherited)'
NEW_ARCH_OTHER_CPLUSPLUSFLAGS = '$(inherited) -DRCT_NEW_ARCH_ENABLED=1 -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1'

def use_react_native! (options={})
  # The prefix to react-native
  prefix = options[:path] ||= "../node_modules/react-native"

  # Include Fabric dependencies
  fabric_enabled = options[:fabric_enabled] ||= false

  # Include DevSupport dependency
  production = options[:production] ||= false

  # Include Hermes dependencies
  hermes_enabled = options[:hermes_enabled] ||= false

  # Extract Flipper configuration
  flipper_configuration = options[:flipper_configuration] ||= FlipperConfiguration.disabled

  # Codegen Discovery is required when enabling new architecture.
  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    Pod::UI.puts 'Setting USE_CODEGEN_DISCOVERY=1'
    ENV['USE_CODEGEN_DISCOVERY'] = '1'
  end

  if `/usr/sbin/sysctl -n hw.optional.arm64 2>&1`.to_i == 1 && !RUBY_PLATFORM.include?('arm64')
    Pod::UI.warn 'Do not use "pod install" from inside Rosetta2 (x86_64 emulation on arm64).'
    Pod::UI.warn ' - Emulated x86_64 is slower than native arm64'
    Pod::UI.warn ' - May result in mixed architectures in rubygems (eg: ffi_c.bundle files may be x86_64 with an arm64 interpreter)'
    Pod::UI.warn 'Run "env /usr/bin/arch -arm64 /bin/bash --login" then try again.'
  end

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

  # CocoaPods `configurations` option ensures that the target is copied only for the specified configurations,
  # but those dependencies are still built.
  # Flipper doesn't currently compile for release https://github.com/facebook/react-native/issues/33764
  # Setting the production flag to true when build for production make sure that we don't install Flipper in the app in the first place.
  if flipper_configuration.flipper_enabled && !production
    pod 'React-Core/DevSupport', :path => "#{prefix}/"
    use_flipper!(flipper_configuration.versions, :configurations => flipper_configuration.configurations)
  end

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

  if ENV['USE_CODEGEN_DISCOVERY'] == '1'
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
    checkAndGenerateEmptyThirdPartyProvider!(prefix)
    pod 'React-Fabric', :path => "#{prefix}/ReactCommon"
    pod 'React-rncore', :path => "#{prefix}/ReactCommon"
    pod 'React-graphics', :path => "#{prefix}/ReactCommon/react/renderer/graphics"
    pod 'React-jsi/Fabric', :path => "#{prefix}/ReactCommon/jsi"
    pod 'React-RCTFabric', :path => "#{prefix}/React", :modular_headers => true
    pod 'RCT-Folly/Fabric', :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec"
  end

  if hermes_enabled
    prepare_hermes = 'node scripts/hermes/prepare-hermes-for-build'
    react_native_dir = Pod::Config.instance.installation_root.join(prefix)
    prep_output, prep_status = Open3.capture2e(prepare_hermes, :chdir => react_native_dir)
    prep_output.split("\n").each { |line| Pod::UI.info line }
    abort unless prep_status == 0

    pod 'React-hermes', :path => "#{prefix}/ReactCommon/hermes"
    pod 'hermes-engine', :podspec => "#{prefix}/sdks/hermes/hermes-engine.podspec"
    pod 'libevent', '~> 2.1.12'
  end

  pods_to_update = LocalPodspecPatch.pods_to_update(options)
  if !pods_to_update.empty?
    if Pod::Lockfile.public_instance_methods.include?(:detect_changes_with_podfile)
      Pod::Lockfile.prepend(LocalPodspecPatch)
    else
      Pod::UI.warn "Automatically updating #{pods_to_update.join(", ")} has failed, please run `pod update #{pods_to_update.join(" ")} --no-repo-update` manually to fix the issue."
    end
  end
end

def get_default_flags()
  flags = {
    :fabric_enabled => false,
    :hermes_enabled => false,
  }

  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    flags[:fabric_enabled] = true
    flags[:hermes_enabled] = true
  end

  return flags
end

def use_flipper!(versions = {}, configurations: ['Debug'])
  versions['Flipper'] ||= '0.125.0'
  versions['Flipper-Boost-iOSX'] ||= '1.76.0.1.11'
  versions['Flipper-DoubleConversion'] ||= '3.2.0.1'
  versions['Flipper-Fmt'] ||= '7.1.7'
  versions['Flipper-Folly'] ||= '2.6.10'
  versions['Flipper-Glog'] ||= '0.5.0.5'
  versions['Flipper-PeerTalk'] ||= '0.0.4'
  versions['Flipper-RSocket'] ||= '1.4.3'
  versions['OpenSSL-Universal'] ||= '1.1.1100'
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

    # Enable flipper for React-Core Debug configuration
    if target.name == 'React-Core'
      target.build_configurations.each do |config|
        if config.name == 'Debug'
          config.build_settings['OTHER_CFLAGS'] = "$(inherited) -DFB_SONARKIT_ENABLED=1"
        end
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

def fix_react_bridging_header_search_paths(installer)
  installer.target_installation_results.pod_target_installation_results
    .each do |pod_name, target_installation_result|
      target_installation_result.native_target.build_configurations.each do |config|
        # For third party modules who have React-bridging dependency to search correct headers
        config.build_settings['HEADER_SEARCH_PATHS'] ||= '$(inherited) '
        config.build_settings['HEADER_SEARCH_PATHS'] << '"$(PODS_ROOT)/Headers/Private/React-bridging/react/bridging" '
        config.build_settings['HEADER_SEARCH_PATHS'] << '"$(PODS_CONFIGURATION_BUILD_DIR)/React-bridging/react_bridging.framework/Headers" '
      end
  end
end

def set_node_modules_user_settings(installer, react_native_path)
  puts "Setting REACT_NATIVE build settings"
  projects = installer.aggregate_targets
    .map{ |t| t.user_project }
    .uniq{ |p| p.path }
    .push(installer.pods_project)

  projects.each do |project|
    project.build_configurations.each do |config|
      config.build_settings["REACT_NATIVE_PATH"] = File.join("${PODS_ROOT}", "..", react_native_path)
    end

    project.save()
  end
end

def react_native_post_install(installer, react_native_path = "../node_modules/react-native")
  if has_pod(installer, 'Flipper')
    flipper_post_install(installer)
  end

  exclude_architectures(installer)
  fix_library_search_paths(installer)
  fix_react_bridging_header_search_paths(installer)

  cpp_flags = DEFAULT_OTHER_CPLUSPLUSFLAGS
  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    cpp_flags = NEW_ARCH_OTHER_CPLUSPLUSFLAGS
  end
  modify_flags_for_new_architecture(installer, cpp_flags)

  set_node_modules_user_settings(installer, react_native_path)
end

def modify_flags_for_new_architecture(installer, cpp_flags)
  # Add RCT_NEW_ARCH_ENABLED to Target pods xcconfig
  installer.aggregate_targets.each do |aggregate_target|
      aggregate_target.xcconfigs.each do |config_name, config_file|
          config_file.attributes['OTHER_CPLUSPLUSFLAGS'] = cpp_flags
          xcconfig_path = aggregate_target.xcconfig_path(config_name)
          Pod::UI.puts xcconfig_path
          config_file.save_as(xcconfig_path)
      end
  end

  # Add RCT_NEW_ARCH_ENABLED to generated pod target projects
  installer.target_installation_results.pod_target_installation_results
    .each do |pod_name, target_installation_result|
    if pod_name == 'React-Core'
      target_installation_result.native_target.build_configurations.each do |config|
        config.build_settings['OTHER_CPLUSPLUSFLAGS'] = cpp_flags
      end
    end
  end
end

def build_codegen!(react_native_path)
  relative_installation_root = Pod::Config.instance.installation_root.relative_path_from(Pathname.pwd)
  codegen_repo_path = "#{relative_installation_root}/#{react_native_path}/packages/react-native-codegen";
  codegen_npm_path = "#{relative_installation_root}/#{react_native_path}/../react-native-codegen";
  codegen_cli_path = ""
  if Dir.exist?(codegen_repo_path)
    codegen_cli_path = codegen_repo_path
  elsif Dir.exist?(codegen_npm_path)
    codegen_cli_path = codegen_npm_path
  else
    raise "[codegen] Couldn't not find react-native-codegen."
  end

  if !Dir.exist?("#{codegen_cli_path}/lib")
    Pod::UI.puts "[Codegen] building #{codegen_cli_path}."
    system("#{codegen_cli_path}/scripts/oss/build.sh")
  end
end

# This is a temporary supporting function until we enable use_react_native_codegen_discovery by default.
def checkAndGenerateEmptyThirdPartyProvider!(react_native_path)
  return if ENV['USE_CODEGEN_DISCOVERY'] == '1'

  relative_installation_root = Pod::Config.instance.installation_root.relative_path_from(Pathname.pwd)
  output_dir = "#{relative_installation_root}/#{$CODEGEN_OUTPUT_DIR}"

  provider_h_path = "#{output_dir}/RCTThirdPartyFabricComponentsProvider.h"
  provider_cpp_path ="#{output_dir}/RCTThirdPartyFabricComponentsProvider.cpp"

  if(!File.exist?(provider_h_path) || !File.exist?(provider_cpp_path))
    # build codegen
    build_codegen!(react_native_path)

    # Just use a temp empty schema list.
    temp_schema_list_path = "#{output_dir}/tmpSchemaList.txt"
    File.open(temp_schema_list_path, 'w') do |f|
      f.write('[]')
      f.fsync
    end

    Pod::UI.puts '[Codegen] generating an empty RCTThirdPartyFabricComponentsProvider'
    Pod::Executable.execute_command(
      'node',
      [
        "#{relative_installation_root}/#{react_native_path}/scripts/generate-provider-cli.js",
        "--platform", 'ios',
        "--schemaListPath", temp_schema_list_path,
        "--outputDir", "#{output_dir}"
      ])
    File.delete(temp_schema_list_path) if File.exist?(temp_schema_list_path)
  end
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
  folly_version = '2021.06.28.00-v2'
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
  app_codegen_config['libraries'].each do |library|
    library_dir = File.join(app_path, library['jsSrcsDir'])
    file_list.concat (`find #{library_dir} -type f \\( -name "Native*.js" -or -name "*NativeComponent.js" \\)`.split("\n").sort)
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
  return if ENV['USE_CODEGEN_DISCOVERY'] == '1'
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

# Monkeypatch of `Pod::Lockfile` to ensure automatic update of dependencies integrated with a local podspec when their version changed.
# This is necessary because local podspec dependencies must be otherwise manually updated.
module LocalPodspecPatch
  # Returns local podspecs whose versions differ from the one in the `react-native` package.
  def self.pods_to_update(react_native_options)
    prefix = react_native_options[:path] ||= "../node_modules/react-native"
    @@local_podspecs = Dir.glob("#{prefix}/third-party-podspecs/*").map { |file| File.basename(file, ".podspec") }
    @@local_podspecs = @@local_podspecs.select do |podspec_name|
      # Read local podspec to determine the cached version
      local_podspec_path = File.join(
        Dir.pwd, "Pods/Local Podspecs/#{podspec_name}.podspec.json"
      )

      # Local podspec cannot be outdated if it does not exist, yet
      next unless File.file?(local_podspec_path)

      local_podspec = File.read(local_podspec_path)
      local_podspec_json = JSON.parse(local_podspec)
      local_version = local_podspec_json["version"]

      # Read the version from a podspec from the `react-native` package
      podspec_path = "#{prefix}/third-party-podspecs/#{podspec_name}.podspec"
      current_podspec = Pod::Specification.from_file(podspec_path)

      current_version = current_podspec.version.to_s
      current_version != local_version
    end
    @@local_podspecs
  end

  # Patched `detect_changes_with_podfile` method
  def detect_changes_with_podfile(podfile)
    changes = super(podfile)
    @@local_podspecs.each do |local_podspec|
      next unless changes[:unchanged].include?(local_podspec)

      changes[:unchanged].delete(local_podspec)
      changes[:changed] << local_podspec
    end
    changes
  end
end
