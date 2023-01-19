# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../codegen.rb"
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
        @third_party_provider_implementation = "RCTThirdPartyFabricComponentsProvider.cpp"
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

    # ============================================== #
    # Test - setup_fabric #
    # ============================================== #
    def testCheckAndGenerateEmptyThirdPartyProvider_whenFileAlreadyExists_doNothing()

        # Arrange
        FileMock.mocked_existing_files([
            @base_path + "/build/" + @third_party_provider_header,
            @base_path + "/build/" + @third_party_provider_implementation,
        ])

        # Act
        checkAndGenerateEmptyThirdPartyProvider!(@prefix, false, 'build', dir_manager: DirMock, file_manager: FileMock)

        # Assert
        assert_equal(Pathname.pwd_invocation_count, 1)
        assert_equal(Pod::Config.instance.installation_root.relative_path_from_invocation_count, 1)
        assert_equal(FileMock.exist_invocation_params, [
            @base_path + "/build/" + @third_party_provider_header,
            @base_path + "/build/" + @third_party_provider_implementation,
        ])
        assert_equal(DirMock.exist_invocation_params, [])
        assert_equal(Pod::UI.collected_messages, [])
        assert_equal($collected_commands, [])
        assert_equal(FileMock.open_files.length, 0)
        assert_equal(Pod::Executable.executed_commands.length, 0)
    end

    def testCheckAndGenerateEmptyThirdPartyProvider_whenHeaderMissingAndCodegenMissing_raiseError()

        # Arrange
        FileMock.mocked_existing_files([
            @base_path + "/build/" + @third_party_provider_implementation,
        ])

        # Act
        assert_raise {
            checkAndGenerateEmptyThirdPartyProvider!(@prefix, false, 'build', dir_manager: DirMock, file_manager: FileMock)
        }

        # Assert
        assert_equal(Pathname.pwd_invocation_count, 1)
        assert_equal(Pod::Config.instance.installation_root.relative_path_from_invocation_count, 1)
        assert_equal(FileMock.exist_invocation_params, [
            @base_path + "/build/" + @third_party_provider_header
        ])
        assert_equal(DirMock.exist_invocation_params, [
            @base_path + "/"+ @prefix + "/packages/react-native-codegen",
            @base_path + "/"+ @prefix + "/../@react-native/codegen",
        ])
        assert_equal(Pod::UI.collected_messages, [])
        assert_equal($collected_commands, [])
        assert_equal(FileMock.open_files.length, 0)
        assert_equal(Pod::Executable.executed_commands.length, 0)
    end

    def testCheckAndGenerateEmptyThirdPartyProvider_whenImplementationMissingAndCodegenrepoExists_dontBuildCodegen()

        # Arrange
        FileMock.mocked_existing_files([
            @base_path + "/build/" + @third_party_provider_header,
            @base_path + "/build/tmpSchemaList.txt"
        ])

        DirMock.mocked_existing_dirs([
            @base_path + "/"+ @prefix + "/packages/react-native-codegen",
            @base_path + "/"+ @prefix + "/packages/react-native-codegen/lib"
        ])

        # Act
        checkAndGenerateEmptyThirdPartyProvider!(@prefix, false, 'build', dir_manager: DirMock, file_manager: FileMock)

        # Assert
        assert_equal(Pathname.pwd_invocation_count, 1)
        assert_equal(Pod::Config.instance.installation_root.relative_path_from_invocation_count, 1)
        assert_equal(FileMock.exist_invocation_params, [
            @base_path + "/build/" + @third_party_provider_header,
            @base_path + "/build/" + @third_party_provider_implementation,
            @base_path + "/build/tmpSchemaList.txt",
        ])
        assert_equal(DirMock.exist_invocation_params, [
            @base_path + "/"+ @prefix + "/packages/react-native-codegen",
            @base_path + "/"+ @prefix + "/packages/react-native-codegen/lib",
        ])
        assert_equal(Pod::UI.collected_messages, ["[Codegen] generating an empty RCTThirdPartyFabricComponentsProvider"])
        assert_equal($collected_commands, [])
        assert_equal(FileMock.open_invocation_count, 1)
        assert_equal(FileMock.open_files_with_mode[@base_path + "/build/tmpSchemaList.txt"], 'w')
        assert_equal(FileMock.open_files[0].collected_write, ["[]"])
        assert_equal(FileMock.open_files[0].fsync_invocation_count, 1)
        assert_equal(Pod::Executable.executed_commands[0], {
            "command" => "node",
            "arguments" => [
                @base_path + "/" + @prefix + "/scripts/generate-provider-cli.js",
                "--platform", 'ios',
                "--schemaListPath", @base_path + "/build/tmpSchemaList.txt",
                "--outputDir", @base_path + "/build"
            ]
        })
        assert_equal(FileMock.delete_invocation_count, 1)
        assert_equal(FileMock.deleted_files, [@base_path + "/build/tmpSchemaList.txt"])
    end

    def testCheckAndGenerateEmptyThirdPartyProvider_whenBothMissing_buildCodegen()
        # Arrange
        codegen_cli_path = @base_path + "/" + @prefix + "/../@react-native/codegen"
        DirMock.mocked_existing_dirs([
            codegen_cli_path,
        ])
        # Act
        checkAndGenerateEmptyThirdPartyProvider!(@prefix, false, 'build', dir_manager: DirMock, file_manager: FileMock)

        # Assert
        assert_equal(Pathname.pwd_invocation_count, 1)
        assert_equal(Pod::Config.instance.installation_root.relative_path_from_invocation_count, 1)
        assert_equal(FileMock.exist_invocation_params, [
            @base_path + "/build/" + @third_party_provider_header,
            @base_path + "/build/" + @tmp_schema_list_file
        ])
        assert_equal(DirMock.exist_invocation_params, [
            @base_path + "/" + @prefix + "/packages/react-native-codegen",
            codegen_cli_path,
            codegen_cli_path + "/lib",
        ])
        assert_equal(Pod::UI.collected_messages, [
            "[Codegen] building #{codegen_cli_path}.",
            "[Codegen] generating an empty RCTThirdPartyFabricComponentsProvider"
        ])
        assert_equal($collected_commands, ["~/app/ios/../../../@react-native/codegen/scripts/oss/build.sh"])
        assert_equal(FileMock.open_files[0].collected_write, ["[]"])
        assert_equal(FileMock.open_files[0].fsync_invocation_count, 1)
        assert_equal(Pod::Executable.executed_commands[0], {
            "command" => "node",
            "arguments" => [
                @base_path + "/" + @prefix + "/scripts/generate-provider-cli.js",
                "--platform", 'ios',
                "--schemaListPath", @base_path + "/build/" + @tmp_schema_list_file,
                "--outputDir", @base_path + "/build"
            ]
        })
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
            :folly_version=>"2021.07.22.00",
            :react_native_path=>"../node_modules/react-native"
        }])
        assert_equal(codegen_utils_mock.get_react_codegen_spec_params, [])
        assert_equal(codegen_utils_mock.generate_react_codegen_spec_params, [])
    end

    def testRunCodegen_whenNewArchDisabled_runsCodegen
        # Arrange
        app_path = "~/app"
        config_file = ""
        package_json_file = "~/app/package.json"
        codegen_specs = { "name" => "React-Codegen" }
        codegen_utils_mock = CodegenUtilsMock.new(:react_codegen_spec => codegen_specs)

        # Act
        run_codegen!(
            app_path,
            config_file,
            :new_arch_enabled => false,
            :fabric_enabled => true,
            :package_json_file => package_json_file,
            :codegen_utils => codegen_utils_mock)

        # Assert
        assert_equal(codegen_utils_mock.use_react_native_codegen_discovery_params, [])
        assert_equal(codegen_utils_mock.get_react_codegen_spec_params, [{
            :fabric_enabled => true,
            :folly_version=>"2021.07.22.00",
            :package_json_file => "~/app/package.json",
            :script_phases => nil
        }])
        assert_equal(codegen_utils_mock.generate_react_codegen_spec_params, [{
            :codegen_output_dir=>"build/generated/ios",
            :react_codegen_spec=>{"name"=>"React-Codegen"}
        }])

    end
end
