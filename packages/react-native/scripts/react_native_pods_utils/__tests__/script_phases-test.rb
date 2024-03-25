# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require_relative "../script_phases"
require_relative "./script_phases.snap"
require "test/unit"

class TestScriptPhases < Test::Unit::TestCase

    def test_get_script_phases_with_codegen_discovery_with_config_file_dir
      result = get_script_phases_with_codegen_discovery(
        react_native_path: '../..',
        relative_app_root: '',
        relative_config_file_dir: 'node_modules',
        fabric_enabled: true)
      assert_equal(snap_get_script_phases_with_codegen_discovery_with_config_file_dir, result)
    end

    def test_get_script_phases_with_codegen_discovery_without_config_file_dir
      result = get_script_phases_with_codegen_discovery(
        react_native_path: '../..',
        relative_app_root: '',
        relative_config_file_dir: '',
        fabric_enabled: true)
      assert_equal(snap_get_script_phases_with_codegen_discovery_without_config_file_dir, result)
    end

    def test_get_script_phases_no_codegen_discovery()
        result = get_script_phases_no_codegen_discovery(
            react_native_path: '../../..',
            codegen_output_dir: 'build/generated/ios',
            codegen_module_dir: '.',
            codegen_component_dir: 'react/renderer/components',
            library_name: 'ScreenshotmanagerSpec',
            library_type: 'modules',
            js_srcs_pattern: 'Native*.js',
            js_srcs_dir: './',
            file_list: '[".//NativeScreenshotManager.js"]'
          )
        assert_equal(snap_get_script_phases_no_codegen_discovery, result)
    end

  end
