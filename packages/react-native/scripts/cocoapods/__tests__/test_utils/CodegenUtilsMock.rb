# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class CodegenUtilsMock
    @js_spec_list
    @codegen_config

    @react_codegen_script_phases
    @react_codegen_spec

    attr_reader :get_codegen_config_from_file_params
    attr_reader :get_list_of_js_specs_params
    attr_reader :get_react_codegen_script_phases_params
    attr_reader :get_react_codegen_spec_params
    attr_reader :generate_react_codegen_spec_params
    attr_reader :use_react_native_codegen_discovery_params

    def initialize(js_spec_list: [], codegen_config: {}, react_codegen_script_phases: "", react_codegen_spec: {})
        @js_spec_list = js_spec_list
        @codegen_config = codegen_config
        @get_codegen_config_from_file_params = []
        @get_list_of_js_specs_params = []

        @react_codegen_script_phases = react_codegen_script_phases
        @react_codegen_spec = react_codegen_spec
        @get_react_codegen_script_phases_params = []
        @get_react_codegen_spec_params = []
        @generate_react_codegen_spec_params = []
        @use_react_native_codegen_discovery_params = []
    end

    def get_codegen_config_from_file(config_path, config_key)
        @get_codegen_config_from_file_params.push({
            "config_path" => config_path,
            "config_key" => config_key
        })
        return @codegen_config
    end

    def get_list_of_js_specs(app_codegen_config, app_path)
        @get_list_of_js_specs_params.push({
            "app_codegen_config" => app_codegen_config,
            "app_path" => app_path
        })
        return @js_spec_list
    end

    def get_react_codegen_script_phases(
        app_path,
        fabric_enabled: false,
        config_file_dir: '',
        react_native_path: "../node_modules/react-native",
        config_key: 'codegenConfig',
        codegen_utils: CodegenUtils.new(),
        script_phase_extractor: CodegenScriptPhaseExtractor.new()
    )
        @get_react_codegen_script_phases_params.push({
            app_path: app_path,
            fabric_enabled: fabric_enabled,
            config_file_dir: config_file_dir,
            react_native_path: react_native_path,
            config_key: config_key
        })
        return @react_codegen_script_phases
    end

    def get_react_codegen_spec(package_json_file, folly_version: '2021.07.22.00', fabric_enabled: false, hermes_enabled: true, script_phases: nil)
        @get_react_codegen_spec_params.push({
            package_json_file: package_json_file,
            folly_version: folly_version,
            fabric_enabled: fabric_enabled,
            script_phases: script_phases
        })
        return @react_codegen_spec
    end

    def generate_react_codegen_podspec!(react_codegen_spec, codegen_output_dir)
        @generate_react_codegen_spec_params.push({
            react_codegen_spec: react_codegen_spec,
            codegen_output_dir: codegen_output_dir
        })
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
        folly_version: "2021.07.22.00",
        codegen_utils: CodegenUtilsMock.new()
    )
        @use_react_native_codegen_discovery_params.push({
            codegen_disabled: codegen_disabled,
            app_path: app_path,
            react_native_path: react_native_path,
            fabric_enabled: fabric_enabled,
            config_file_dir: config_file_dir,
            codegen_output_dir: codegen_output_dir,
            folly_version: folly_version
        })
    end
end
