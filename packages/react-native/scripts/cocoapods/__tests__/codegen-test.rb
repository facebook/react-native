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

class CodegenTests < Test::Unit::TestCase
    :third_party_provider_header
    :third_party_provider_implementation
    :base_path
    :prefix
    :tmp_schema_list_file

    def setup
        File.enable_testing_mode!
        Dir.enable_testing_mode!
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
        File.reset()
        Dir.reset()
    end

    # ============================================== #
    # Test - setup_fabric #
    # ============================================== #
    def testCheckAndGenerateEmptyThirdPartyProvider_whenFileAlreadyExists_doNothing()

        # Arrange
        File.mocked_existing_files([
            @base_path + "/build/" + @third_party_provider_header,
            @base_path + "/build/" + @third_party_provider_implementation,
        ])

        # Act
        checkAndGenerateEmptyThirdPartyProvider!(@prefix, false, 'build')

        # Assert
        assert_equal(Pathname.pwd_invocation_count, 1)
        assert_equal(Pod::Config.instance.installation_root.relative_path_from_invocation_count, 1)
        assert_equal(File.exist_invocation_params, [
            @base_path + "/build/" + @third_party_provider_header,
            @base_path + "/build/" + @third_party_provider_implementation,
        ])
        assert_equal(Dir.exist_invocation_params, [])
        assert_equal(Pod::UI.collected_messages, [])
        assert_equal($collected_commands, [])
        assert_equal(File.open_files.length, 0)
        assert_equal(Pod::Executable.executed_commands.length, 0)
    end

    def testCheckAndGenerateEmptyThirdPartyProvider_whenHeaderMissingAndCodegenMissing_raiseError()

        # Arrange
        File.mocked_existing_files([
            @base_path + "/build/" + @third_party_provider_implementation,
        ])

        # Act
        assert_raise {
            checkAndGenerateEmptyThirdPartyProvider!(@prefix, false, 'build')
        }

        # Assert
        assert_equal(Pathname.pwd_invocation_count, 1)
        assert_equal(Pod::Config.instance.installation_root.relative_path_from_invocation_count, 1)
        assert_equal(File.exist_invocation_params, [
            @base_path + "/build/" + @third_party_provider_header
        ])
        assert_equal(Dir.exist_invocation_params, [
            @base_path + "/"+ @prefix + "/packages/react-native-codegen",
            @base_path + "/"+ @prefix + "/../react-native-codegen",
        ])
        assert_equal(Pod::UI.collected_messages, [])
        assert_equal($collected_commands, [])
        assert_equal(File.open_files.length, 0)
        assert_equal(Pod::Executable.executed_commands.length, 0)
    end

    def testCheckAndGenerateEmptyThirdPartyProvider_whenImplementationMissingAndCodegenrepoExists_dontBuildCodegen()

        # Arrange
        File.mocked_existing_files([
            @base_path + "/build/" + @third_party_provider_header,
            @base_path + "/build/tmpSchemaList.txt"
        ])

        Dir.mocked_existing_dirs([
            @base_path + "/"+ @prefix + "/packages/react-native-codegen",
            @base_path + "/"+ @prefix + "/packages/react-native-codegen/lib"
        ])

        # Act
        checkAndGenerateEmptyThirdPartyProvider!(@prefix, false, 'build')

        # Assert
        assert_equal(Pathname.pwd_invocation_count, 1)
        assert_equal(Pod::Config.instance.installation_root.relative_path_from_invocation_count, 1)
        assert_equal(File.exist_invocation_params, [
            @base_path + "/build/" + @third_party_provider_header,
            @base_path + "/build/" + @third_party_provider_implementation,
            @base_path + "/build/tmpSchemaList.txt",
        ])
        assert_equal(Dir.exist_invocation_params, [
            @base_path + "/"+ @prefix + "/packages/react-native-codegen",
            @base_path + "/"+ @prefix + "/packages/react-native-codegen/lib",
        ])
        assert_equal(Pod::UI.collected_messages, ["[Codegen] generating an empty RCTThirdPartyFabricComponentsProvider"])
        assert_equal($collected_commands, [])
        assert_equal(File.open_invocation_count, 1)
        assert_equal(File.open_files_with_mode[@base_path + "/build/tmpSchemaList.txt"], 'w')
        assert_equal(File.open_files[0].collected_write, ["[]"])
        assert_equal(File.open_files[0].fsync_invocation_count, 1)
        assert_equal(Pod::Executable.executed_commands[0], {
            "command" => "node",
            "arguments" => [
                @base_path + "/" + @prefix + "/scripts/generate-provider-cli.js",
                "--platform", 'ios',
                "--schemaListPath", @base_path + "/build/tmpSchemaList.txt",
                "--outputDir", @base_path + "/build"
            ]
        })
        assert_equal(File.delete_invocation_count, 1)
        assert_equal(File.deleted_files, [@base_path + "/build/tmpSchemaList.txt"])
    end

    def testCheckAndGenerateEmptyThirdPartyProvider_whenBothMissing_buildCodegen()
        # Arrange
        codegen_cli_path = @base_path + "/" + @prefix + "/../react-native-codegen"
        Dir.mocked_existing_dirs([
            codegen_cli_path,
        ])
        # Act
        checkAndGenerateEmptyThirdPartyProvider!(@prefix, false, 'build')

        # Assert
        assert_equal(Pathname.pwd_invocation_count, 1)
        assert_equal(Pod::Config.instance.installation_root.relative_path_from_invocation_count, 1)
        assert_equal(File.exist_invocation_params, [
            @base_path + "/build/" + @third_party_provider_header,
            @base_path + "/build/" + @tmp_schema_list_file
        ])
        assert_equal(Dir.exist_invocation_params, [
            @base_path + "/" + @prefix + "/packages/react-native-codegen",
            codegen_cli_path,
            codegen_cli_path + "/lib",
        ])
        assert_equal(Pod::UI.collected_messages, [
            "[Codegen] building #{codegen_cli_path}.",
            "[Codegen] generating an empty RCTThirdPartyFabricComponentsProvider"
        ])
        assert_equal($collected_commands, ["~/app/ios/../../../react-native-codegen/scripts/oss/build.sh"])
        assert_equal(File.open_files[0].collected_write, ["[]"])
        assert_equal(File.open_files[0].fsync_invocation_count, 1)
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
end
