# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'
require_relative './helpers.rb'
require_relative './codegen_script_phase_extractor.rb'

class CodegenUtils

    def initialize()
    end

    @@REACT_CODEGEN_PODSPEC_GENERATED = false

    def self.set_react_codegen_podspec_generated(value)
        @@REACT_CODEGEN_PODSPEC_GENERATED = value
    end

    def self.react_codegen_podspec_generated
        @@REACT_CODEGEN_PODSPEC_GENERATED
    end

    @@REACT_CODEGEN_DISCOVERY_DONE = false

    def self.set_react_codegen_discovery_done(value)
        @@REACT_CODEGEN_DISCOVERY_DONE = value
    end

    def self.react_codegen_discovery_done
        @@REACT_CODEGEN_DISCOVERY_DONE
    end

    # It takes some cocoapods specs and writes them into a file
    #
    # Parameters
    # - spec: the cocoapod specs
    # - codegen_output_dir: the output directory for the codegen
    # - file_manager: a class that implements the `File` interface. Defaults to `File`, the Dependency can be injected for testing purposes.
    def generate_react_codegen_podspec!(spec, codegen_output_dir, file_manager: File)
        # This podspec file should only be create once in the session/pod install.
        # This happens when multiple targets are calling use_react_native!.
        if @@REACT_CODEGEN_PODSPEC_GENERATED
          Pod::UI.puts "[Codegen] Skipping React-Codegen podspec generation."
          return
        end

        relative_installation_root = Pod::Config.instance.installation_root.relative_path_from(Pathname.pwd)
        output_dir = "#{relative_installation_root}/#{codegen_output_dir}"
        Pod::Executable.execute_command("mkdir", ["-p", output_dir]);

        podspec_path = file_manager.join(output_dir, 'React-Codegen.podspec.json')
        Pod::UI.puts "[Codegen] Generating #{podspec_path}"

        file_manager.open(podspec_path, 'w') do |f|
          f.write(spec.to_json)
          f.fsync
        end

        @@REACT_CODEGEN_PODSPEC_GENERATED = true
    end

    # It generates the podspec object that represents the `React-Codegen.podspec` file
    #
    # Parameters
    # - package_json_file: the path to the `package.json`, required to extract the proper React Native version
    # - fabric_enabled: whether fabric is enabled or not.
    # - hermes_enabled: whether hermes is enabled or not.
    # - script_phases: whether we want to add some build script phases or not.
    # - file_manager: a class that implements the `File` interface. Defaults to `File`, the Dependency can be injected for testing purposes.
    def get_react_codegen_spec(package_json_file, folly_version: '2021.07.22.00', fabric_enabled: false, hermes_enabled: true, script_phases: nil, file_manager: File)
        package = JSON.parse(file_manager.read(package_json_file))
        version = package['version']
        new_arch_disabled = ENV['RCT_NEW_ARCH_ENABLED'] != "1"
        use_frameworks = ENV['USE_FRAMEWORKS'] != nil
        folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'
        boost_compiler_flags = '-Wno-documentation'

        header_search_paths = [
          "\"$(PODS_ROOT)/boost\"",
          "\"$(PODS_ROOT)/RCT-Folly\"",
          "\"${PODS_ROOT}/Headers/Public/React-Codegen/react/renderer/components\"",
          "\"$(PODS_ROOT)/Headers/Private/React-Fabric\"",
          "\"$(PODS_ROOT)/Headers/Private/React-RCTFabric\"",
        ]
        framework_search_paths = []

        if use_frameworks
          header_search_paths.concat([
            "\"$(PODS_ROOT)/DoubleConversion\"",
            "\"$(PODS_TARGET_SRCROOT)\"",
            "\"$(PODS_CONFIGURATION_BUILD_DIR)/React-Fabric/React_Fabric.framework/Headers\"",
            "\"$(PODS_CONFIGURATION_BUILD_DIR)/React-graphics/React_graphics.framework/Headers\"",
            "\"$(PODS_CONFIGURATION_BUILD_DIR)/React-graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios\"",
            "\"$(PODS_CONFIGURATION_BUILD_DIR)/ReactCommon/ReactCommon.framework/Headers\"",
            "\"$(PODS_CONFIGURATION_BUILD_DIR)/ReactCommon/ReactCommon.framework/Headers/react/nativemodule/core\"",
            "\"$(PODS_CONFIGURATION_BUILD_DIR)/React-NativeModulesApple/React_NativeModulesApple.framework/Headers\"",
            "\"$(PODS_CONFIGURATION_BUILD_DIR)/React-RCTFabric/RCTFabric.framework/Headers\"",
            "\"$(PODS_CONFIGURATION_BUILD_DIR)/React-debug/React_debug.framework/Headers\"",
            "\"$(PODS_CONFIGURATION_BUILD_DIR)/React-utils/React_utils.framework/Headers\"",
          ])
        end

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
            'ios' => min_ios_version_supported,
          },
          'source_files' => "**/*.{h,mm,cpp}",
          'pod_target_xcconfig' => {
            "HEADER_SEARCH_PATHS" => header_search_paths.join(' '),
            "FRAMEWORK_SEARCH_PATHS" => framework_search_paths
          },
          'dependencies': {
            "React-jsiexecutor": [],
            "RCT-Folly": [],
            "RCTRequired": [],
            "RCTTypeSafety": [],
            "React-Core": [],
            "React-jsi": [],
            "ReactCommon/turbomodule/bridging": [],
            "ReactCommon/turbomodule/core": [],
            "React-NativeModulesApple": [],
            "glog": [],
            "DoubleConversion": [],
          }
        }

        if fabric_enabled
          spec[:'dependencies'].merge!({
            'React-graphics': [],
            'React-Fabric': [],
            'React-debug': [],
            'React-utils': [],
          });
        end

        if hermes_enabled
          spec[:'dependencies'].merge!({
            'hermes-engine': [],
          });
        else
          spec[:'dependencies'].merge!({
            'React-jsc': [],
          });
        end

        if new_arch_disabled
          spec[:dependencies].merge!({
            'React-rncore': [],
            'FBReactNativeSpec': [],
          })
        end

        if script_phases
          Pod::UI.puts "[Codegen] Adding script_phases to React-Codegen."
          spec[:'script_phases'] = script_phases
        end

        return spec
    end

    # It extracts the codegen config from the configuration file
    #
    # Parameters
    # - config_path: a path to the configuration file
    # - config_key: the codegen configuration key
    # - file_manager: a class that implements the `File` interface. Defaults to `File`, the Dependency can be injected for testing purposes.
    #
    # Returns: the list of dependencies as extracted from the package.json
    def get_codegen_config_from_file(config_path, config_key, file_manager: File)
      empty = {}
      if !file_manager.exist?(config_path)
        return empty
      end

      config = JSON.parse(file_manager.read(config_path))
      return config[config_key] ? config[config_key] : empty
    end

    # It creates a list of JS files that contains the JS specifications that Codegen needs to use to generate the code
    #
    # Parameters
    # - app_codegen_config: an object that contains the configurations
    # - app_path: path to the app
    # - file_manager: a class that implements the `File` interface. Defaults to `File`, the Dependency can be injected for testing purposes.
    #
    # Returns: the list of files that needs to be used by Codegen
    def get_list_of_js_specs(app_codegen_config, app_path, file_manager: File)
      file_list = []

      if app_codegen_config['libraries'] then
        Pod::UI.warn '[Deprecated] You are using the old `libraries` array to list all your codegen.\nThis method will be removed in the future.\nUpdate your `package.json` with a single object.'
        app_codegen_config['libraries'].each do |library|
          library_dir = file_manager.join(app_path, library['jsSrcsDir'])
          file_list.concat(Finder.find_codegen_file(library_dir))
        end
      elsif app_codegen_config['jsSrcsDir'] then
        codegen_dir = file_manager.join(app_path, app_codegen_config['jsSrcsDir'])
        file_list.concat (Finder.find_codegen_file(codegen_dir))
      end

      input_files = file_list.map { |filename| "${PODS_ROOT}/../#{Pathname.new(filename).realpath().relative_path_from(Pod::Config.instance.installation_root)}" }

      return input_files
    end

    # It generates the build script phase for the codegen
    #
    # Parameters
    # - app_path: the path to the app
    # - fabric_enabled: whether fabric is enabled or not
    # - config_file_dir: the directory of the config file
    # - react_native_path: the path to React Native
    # - config_key: the configuration key to use in the package.json for the Codegen
    # - codegen_utils: an object which exposes utilities functions for the codegen
    # - script_phase_extractor: an object that is able to extract the Xcode Script Phases for React Native
    # - file_manager: a class that implements the `File` interface. Defaults to `File`, the Dependency can be injected for testing purposes.
    #
    # Return: an object containing the script phase
    def get_react_codegen_script_phases(
      app_path,
      fabric_enabled: false,
      hermes_enabled: false,
      config_file_dir: '',
      react_native_path: "../node_modules/react-native",
      config_key: 'codegenConfig',
      codegen_utils: CodegenUtils.new(),
      script_phase_extractor: CodegenScriptPhaseExtractor.new(),
      file_manager: File
      )
      if !app_path
        Pod::UI.warn '[Codegen] error: app_path is required to use codegen discovery.'
        abort
      end

      # We need to convert paths to relative path from installation_root for the script phase for CI.
      relative_app_root = Pathname.new(app_path).realpath().relative_path_from(Pod::Config.instance.installation_root)

      relative_config_file_dir = ''
      if config_file_dir != ''
        relative_config_file_dir = Pathname.new(config_file_dir).relative_path_from(Pod::Config.instance.installation_root)
      end

      # Generate input files for in-app libaraies which will be used to check if the script needs to be run.
      # TODO: Ideally, we generate the input_files list from generate-codegen-artifacts.js and read the result here.
      #       Or, generate this podspec in generate-codegen-artifacts.js as well.
      app_package_path = file_manager.join(app_path, 'package.json')
      app_codegen_config = codegen_utils.get_codegen_config_from_file(app_package_path, config_key)
      input_files = codegen_utils.get_list_of_js_specs(app_codegen_config, app_path)

      # Add a script phase to trigger generate artifact.
      # Some code is duplicated so that it's easier to delete the old way and switch over to this once it's stabilized.
      return {
        'name': 'Generate Specs',
        'execution_position': :before_compile,
        'input_files' => input_files,
        'show_env_vars_in_log': true,
        'output_files': ["${DERIVED_FILE_DIR}/react-codegen.log"],
        'script': script_phase_extractor.extract_script_phase(
          react_native_path: react_native_path,
          relative_app_root: relative_app_root,
          relative_config_file_dir: relative_config_file_dir,
          fabric_enabled: fabric_enabled
        ),
      }
    end

    def use_react_native_codegen_discovery!(
      codegen_disabled,
      app_path,
      react_native_path: "../node_modules/react-native",
      fabric_enabled: false,
      hermes_enabled: true,
      config_file_dir: '',
      codegen_output_dir: 'build/generated/ios',
      config_key: 'codegenConfig',
      folly_version: '2021.07.22.00',
      codegen_utils: CodegenUtils.new(),
      file_manager: File
      )
      return if codegen_disabled

      if CodegenUtils.react_codegen_discovery_done()
        Pod::UI.puts "[Codegen] Skipping use_react_native_codegen_discovery."
        return
      end

      if !app_path
        Pod::UI.warn '[Codegen] Error: app_path is required for use_react_native_codegen_discovery.'
        Pod::UI.warn '[Codegen] If you are calling use_react_native_codegen_discovery! in your Podfile, please remove the call and pass `app_path` and/or `config_file_dir` to `use_react_native!`.'
        abort
      end

      Pod::UI.warn '[Codegen] warn: using experimental new codegen integration'
      relative_installation_root = Pod::Config.instance.installation_root.relative_path_from(Pathname.pwd)

      # Generate React-Codegen podspec here to add the script phases.
      script_phases = codegen_utils.get_react_codegen_script_phases(
        app_path,
        :fabric_enabled => fabric_enabled,
        :config_file_dir => config_file_dir,
        :react_native_path => react_native_path,
        :config_key => config_key
      )
      react_codegen_spec = codegen_utils.get_react_codegen_spec(
        file_manager.join(relative_installation_root, react_native_path, "package.json"),
        :folly_version => folly_version,
        :fabric_enabled => fabric_enabled,
        :hermes_enabled => hermes_enabled,
        :script_phases => script_phases
      )
      codegen_utils.generate_react_codegen_podspec!(react_codegen_spec, codegen_output_dir)

      out = Pod::Executable.execute_command(
        'node',
        [
          "#{relative_installation_root}/#{react_native_path}/scripts/generate-codegen-artifacts.js",
          "-p", "#{app_path}",
          "-o", Pod::Config.instance.installation_root,
          "-e", "#{fabric_enabled}",
          "-c", "#{config_file_dir}",
        ])
      Pod::UI.puts out;

      CodegenUtils.set_react_codegen_discovery_done(true)
    end

    @@CLEANUP_DONE = false

    def self.set_cleanup_done(newValue)
      @@CLEANUP_DONE = newValue
    end

    def self.cleanup_done
      return @@CLEANUP_DONE
    end

    def self.clean_up_build_folder(rn_path, app_path, ios_folder, codegen_dir, dir_manager: Dir, file_manager: File)
      return if CodegenUtils.cleanup_done()
      CodegenUtils.set_cleanup_done(true)

      codegen_path = file_manager.join(app_path, ios_folder, codegen_dir)
      return if !dir_manager.exist?(codegen_path)

      FileUtils.rm_rf(dir_manager.glob("#{codegen_path}/*"))
      base_provider_path = file_manager.join(rn_path, 'React', 'Fabric', 'RCTThirdPartyFabricComponentsProvider')
      FileUtils.rm_rf("#{base_provider_path}.h")
      FileUtils.rm_rf("#{base_provider_path}.mm")
      CodegenUtils.assert_codegen_folder_is_empty(app_path, ios_folder, codegen_dir, dir_manager: dir_manager, file_manager: file_manager)
    end

    # Need to split this function from the previous one to be able to test it properly.
    def self.assert_codegen_folder_is_empty(app_path, ios_folder, codegen_dir, dir_manager: Dir, file_manager: File)
      # double check that the files have actually been deleted.
      # Emit an error message if not.
      codegen_path = file_manager.join(app_path, ios_folder, codegen_dir)
      if dir_manager.exist?(codegen_path) && dir_manager.glob("#{codegen_path}/*").length() != 0
        Pod::UI.warn "Unable to remove the content of #{codegen_path} folder. Please run rm -rf #{codegen_path} and try again."
        abort
      end
    end
end
