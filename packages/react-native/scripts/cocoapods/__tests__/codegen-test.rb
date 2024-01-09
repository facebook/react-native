# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../codegen.rb"
require_relative "../helpers.rb"
require_relative "./test_utils/PodMock.rb"
require_relative "./test_utils/PathnameMock.rb"
require_relative "./test_utils/FileMock.rb"
require_relative "./test_utils/DirMock.rb"
require_relative "./test_utils/systemUtils.rb"
require_relative "./test_utils/CodegenUtilsMock.rb"

class CodegenTests < Test::Unit::TestCase
    :third_party_provider_header
    :third_party_provider_implementation
    :base_path
    :prefix
    :tmp_schema_list_file

    def setup
        Pod::Config.reset()

        @prefix = "../.."
        @third_party_provider_header = "RCTThirdPartyFabricComponentsProvider.h"
        @third_party_provider_implementation = "RCTThirdPartyFabricComponentsProvider.mm"
        @base_path = "~/app/ios"
        @tmp_schema_list_file = "tmpSchemaList.txt"
        Pathname.pwd!(@base_path)
        Pod::Config.instance.installation_root.relative_path_from = @base_path
    end

    def teardown
        system_reset_commands()
        Pod::UI.reset()
        Pod::Executable.reset()
        Pathname.reset()
        FileMock.reset()
        DirMock.reset()
    end

    # ================= #
    # Test - RunCodegen #
    # ================= #
    def testRunCodegen_whenNewArchEnabled_runsCodegen
        # Arrange
        app_path = "~/app"
        config_file = ""
        codegen_utils_mock = CodegenUtilsMock.new()

        # Act
        run_codegen!(app_path, config_file, :new_arch_enabled => true, :codegen_utils => codegen_utils_mock)

        # Assert
        assert_equal(codegen_utils_mock.use_react_native_codegen_discovery_params, [{
            :app_path=>"~/app",
            :codegen_disabled=>false,
            :codegen_output_dir=>"build/generated/ios",
            :config_file_dir=>"",
            :fabric_enabled=>false,
            :folly_version=>Helpers::Constants.folly_config()[:version],
            :react_native_path=>"../node_modules/react-native"
        }])
        assert_equal(codegen_utils_mock.get_react_codegen_spec_params, [])
        assert_equal(codegen_utils_mock.generate_react_codegen_spec_params, [])
    end
end
