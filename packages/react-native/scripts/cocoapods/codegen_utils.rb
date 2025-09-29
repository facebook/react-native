# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'
require_relative './utils.rb'
require_relative './helpers.rb'
require_relative './codegen_script_phase_extractor.rb'

class CodegenUtils

    def initialize()
    end

    @@REACT_CODEGEN_DISCOVERY_DONE = false

    def self.set_react_codegen_discovery_done(value)
        @@REACT_CODEGEN_DISCOVERY_DONE = value
    end

    def self.react_codegen_discovery_done
        @@REACT_CODEGEN_DISCOVERY_DONE
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
      folly_version: Helpers::Constants.folly_config[:version],
      codegen_utils: CodegenUtils.new(),
      file_manager: File,
      logger: CodegenUtils::UI
      )
      return if codegen_disabled

      if CodegenUtils.react_codegen_discovery_done()
        logger.puts("Skipping use_react_native_codegen_discovery.")
        return
      end

      if !app_path
        logger.warn("Error: app_path is required for use_react_native_codegen_discovery.")
        logger.warn("If you are calling use_react_native_codegen_discovery! in your Podfile, please remove the call and pass `app_path` and/or `config_file_dir` to `use_react_native!`.")
        abort
      end

      relative_installation_root = Pod::Config.instance.installation_root.relative_path_from(Pathname.pwd)

      out = Pod::Executable.execute_command(
        'node',
        [
          "#{relative_installation_root}/#{react_native_path}/scripts/generate-codegen-artifacts.js",
          "-p", "#{app_path}",
          "-o", Pod::Config.instance.installation_root,
          "-t", "ios",
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

    def self.clean_up_build_folder(rn_path, codegen_dir, dir_manager: Dir, file_manager: File)
      if ENV["RCT_SKIP_CODEGEN"] == "1"
        return
      end

      return if CodegenUtils.cleanup_done()
      CodegenUtils.set_cleanup_done(true)

      ios_folder = Pod::Config.instance.installation_root.relative_path_from(Pathname.pwd)
      codegen_path = file_manager.join(ios_folder, codegen_dir)
      return if !dir_manager.exist?(codegen_path)

      FileUtils.rm_rf("#{codegen_path}")
      base_provider_path = file_manager.join(rn_path, 'React', 'Fabric', 'RCTThirdPartyFabricComponentsProvider')
      FileUtils.rm_rf("#{base_provider_path}.h")
      FileUtils.rm_rf("#{base_provider_path}.mm")
      CodegenUtils.assert_codegen_folder_is_empty(codegen_path, dir_manager: dir_manager)
    end

    # Need to split this function from the previous one to be able to test it properly.
    def self.assert_codegen_folder_is_empty(codegen_path, dir_manager: Dir)
      # double check that the files have actually been deleted.
      # Emit an error message if not.
      if dir_manager.exist?(codegen_path) && dir_manager.glob("#{codegen_path}/*").length() != 0
        Pod::UI.warn "Unable to remove the content of #{codegen_path} folder. Please run rm -rf #{codegen_path} and try again."
        abort
      end
    end

    class UI
      # ANSI escape codes for colors and formatting
      CYAN = "\e[36m"
      YELLOW = "\e[33m"
      BOLD = "\e[1m"
      RESET = "\e[0m"

      class << self
        def puts(text, info: false)
          prefix = "#{CYAN}#{BOLD}[Codegen]#{RESET}"
          message = info ? "#{YELLOW}#{text}#{RESET}" : text
          Pod::UI.puts "#{prefix} #{message}"
        end

        def warn(text)
          puts(text, info: true)
        end
      end
    end
end
