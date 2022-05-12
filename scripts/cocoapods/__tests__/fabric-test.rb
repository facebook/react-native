# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../fabric.rb"
require_relative "./test_utils/podSpy.rb"
require_relative "./test_utils/PodMock.rb"
require_relative "./test_utils/PathnameMock.rb"
require_relative "./test_utils/FileMock.rb"
require_relative "./test_utils/DirMock.rb"
require_relative "./test_utils/systemUtils.rb"

class FabricTests < Test::Unit::TestCase
    :third_party_provider_header
    :third_party_provider_implementation
    :base_path
    :prefix

    def setup
        File.is_testing!
        Dir.is_testing!
        Pod::Config.reset()

        @prefix = "../.."
        @third_party_provider_header = "RCTThirdPartyFabricComponentsProvider.h"
        @third_party_provider_implementation = "RCTThirdPartyFabricComponentsProvider.cpp"
        @base_path = "~/app/ios"
        Pathname.pwd!(@base_path)
        Pod::Config.instance.installation_root.relative_path_from = @base_path
    end

    def teardown
        system_reset_commands()
        podSpy_cleanUp()
        Pod::UI.reset()
        Pod::Executable.reset()
        Pathname.reset()
        File.reset()
        Dir.reset()
    end

    # ============================================== #
    # Test - setup_fabric #
    # ============================================== #
    def testSetupFabric_whenFileAlreadyExists_doNothing()

        # Arrange
        File.mocked_existing_files([
            @base_path + "/build/" + @third_party_provider_header,
            @base_path + "/build/" + @third_party_provider_implementation,
        ])

        # Act
        setup_fabric!(@prefix, false, 'build')

        # Assert
        assert_equal(Pathname.pwd_invocation_count, 1)
        assert_equal(Pod::Config.instance.installation_root.relative_path_from_invocation_count, 1)
        assert_equal(File.exist_invocation_count, 2)
        assert_equal(Dir.exist_invocation_count, 0)
        assert_equal(Pod::UI.collected_messages, [])
        assert_equal($collected_commands, [])
        assert_equal(File.open_files.length, 0)
        assert_equal(Pod::Executable.executed_commands.length, 0)
        check_installed_pods(@prefix)
    end

    def testSetupFabric_whenHeaderMissingAndCodegenMissing_raiseError()

        # Arrange
        File.mocked_existing_files([
            @base_path + "/build/" + @third_party_provider_implementation,
        ])

        # Act
        assert_raise {
            setup_fabric!(@prefix, false, 'build')
        }

        # Assert
        assert_equal(Pathname.pwd_invocation_count, 1)
        assert_equal(Pod::Config.instance.installation_root.relative_path_from_invocation_count, 1)
        assert_equal(File.exist_invocation_count, 1)
        assert_equal(Dir.exist_invocation_count, 2)
        assert_equal(Pod::UI.collected_messages, [])
        assert_equal($collected_commands, [])
        assert_equal(File.open_files.length, 0)
        assert_equal(Pod::Executable.executed_commands.length, 0)
        assert_equal($podInvocationCount, 0)
    end

    def testSetupFabric_whenImplementationMissingAndCodegenrepoExists_dontBuildCodegen()

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
        setup_fabric!(@prefix, false, 'build')

        # Assert
        assert_equal(Pathname.pwd_invocation_count, 1)
        assert_equal(Pod::Config.instance.installation_root.relative_path_from_invocation_count, 1)
        assert_equal(File.exist_invocation_count, 3)
        assert_equal(Dir.exist_invocation_count, 2)
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
        check_installed_pods(@prefix)
    end

    def testSetupFabric_whenBothMissing_buildCodegen()
        # Arrange
        codegen_cli_path = @base_path + "/" + @prefix + "/../react-native-codegen"
        Dir.mocked_existing_dirs([
            codegen_cli_path,
        ])
        # Act
        setup_fabric!(@prefix, false, 'build')

        # Assert
        assert_equal(Pathname.pwd_invocation_count, 1)
        assert_equal(Pod::Config.instance.installation_root.relative_path_from_invocation_count, 1)
        assert_equal(File.exist_invocation_count, 2)
        assert_equal(Dir.exist_invocation_count, 3)
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
                "--schemaListPath", @base_path + "/build/tmpSchemaList.txt",
                "--outputDir", @base_path + "/build"
            ]
        })
        check_installed_pods(@prefix)
    end

    def check_installed_pods(prefix)
        assert_equal($podInvocationCount, 6)

        check_pod("React-Fabric", :path => "#{prefix}/ReactCommon")
        check_pod("React-rncore", :path => "#{prefix}/ReactCommon")
        check_pod("React-graphics", :path => "#{prefix}/ReactCommon/react/renderer/graphics")
        check_pod("React-jsi/Fabric", :path => "#{prefix}/ReactCommon/jsi")
        check_pod("React-RCTFabric", :path => "#{prefix}/React", :modular_headers => true)
        check_pod("RCT-Folly/Fabric", :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec")
    end

    def check_pod(name, path: nil, modular_headers: nil, podspec: nil)
        params = $podInvocation[name]
        expected_params = {}

        if path != nil then expected_params[:path] = path end
        if modular_headers != nil then expected_params[:modular_headers] = modular_headers end
        if podspec != nil then expected_params[:podspec] = podspec end

        assert_equal(params, expected_params)
    end
end
