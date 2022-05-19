# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../new_architecture.rb"
require_relative "./test_utils/InstallerMock.rb"
require_relative "./test_utils/PodMock.rb"

class NewArchitectureTests < Test::Unit::TestCase
    def setup
        File.enable_testing_mode!
    end

    def teardown
        Pod::UI.reset()
    end


    def test_setClangCxxLanguageStandardIfNeeded_whenReactCoreIsPresent
        installer = prepare_mocked_installer_with_react_core
        set_clang_cxx_language_standard_if_needed(installer)

        assert_equal(installer.aggregate_targets[0].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++17")
        assert_equal(installer.aggregate_targets[1].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++17")
        assert_equal(installer.pods_project.targets[1].received_resolved_build_setting_parameters, [ReceivedCommonResolvedBuildSettings.new("CLANG_CXX_LANGUAGE_STANDARD", true)])
        assert_equal(Pod::UI.collected_messages, ["Setting CLANG_CXX_LANGUAGE_STANDARD to c++17 on /test/path.xcproj"])
    end

    def test_setClangCxxLanguageStandardIfNeeded_whenReactCoreIsNotPresent
        installer = prepare_mocked_installer_without_react_core
        set_clang_cxx_language_standard_if_needed(installer)

        assert_equal(installer.aggregate_targets[0].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], nil)
        assert_equal(installer.aggregate_targets[1].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], nil)
        assert_equal(installer.pods_project.targets[0].received_resolved_build_setting_parameters, [])
        assert_equal(Pod::UI.collected_messages, [])
    end

    def test_setClangCxxLanguageStandardIfNeeded_whenThereAreDifferentValuesForLanguageStandard_takesTheFirstValue
        installer = prepare_mocked_installer_with_react_core_and_different_language_standards
        set_clang_cxx_language_standard_if_needed(installer)

        assert_equal(installer.aggregate_targets[0].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++17")
        assert_equal(installer.aggregate_targets[1].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++17")
        assert_equal(installer.pods_project.targets[1].received_resolved_build_setting_parameters, [ReceivedCommonResolvedBuildSettings.new("CLANG_CXX_LANGUAGE_STANDARD", true)])
        assert_equal(Pod::UI.collected_messages, ["Setting CLANG_CXX_LANGUAGE_STANDARD to c++17 on /test/path.xcproj"])
    end
end

def prepare_mocked_installer_with_react_core
    return InstallerMock.new(
        PodsProjectMock.new([
                TargetMock.new(
                    "YogaKit",
                    [
                        BuildConfigurationMock.new("Debug"),
                        BuildConfigurationMock.new("Release"),
                    ]
                ),
                TargetMock.new(
                    "React-Core",
                    [
                        BuildConfigurationMock.new("Debug", { "CLANG_CXX_LANGUAGE_STANDARD" => "c++17" }),
                        BuildConfigurationMock.new("Release", { "CLANG_CXX_LANGUAGE_STANDARD" => "c++17" }),
                    ]
                )
            ]
        ),
        [
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path2.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
        ]
    )
end

def prepare_mocked_installer_with_react_core_and_different_language_standards
    return InstallerMock.new(
        PodsProjectMock.new([
                TargetMock.new(
                    "YogaKit",
                    [
                        BuildConfigurationMock.new("Debug"),
                        BuildConfigurationMock.new("Release"),
                    ]
                ),
                TargetMock.new(
                    "React-Core",
                    [
                        BuildConfigurationMock.new("Debug", { "CLANG_CXX_LANGUAGE_STANDARD" => "c++17" }),
                        BuildConfigurationMock.new("Release", { "CLANG_CXX_LANGUAGE_STANDARD" => "new" }),
                    ]
                )
            ]
        ),
        [
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path2.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
        ]
    )
end

def prepare_mocked_installer_without_react_core
    return InstallerMock.new(
        PodsProjectMock.new([
                TargetMock.new(
                    "YogaKit",
                    [
                        BuildConfigurationMock.new("Debug"),
                        BuildConfigurationMock.new("Release"),
                    ]
                )
            ]
        ),
        [
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
            AggregatedProjectMock.new(
                UserProjectMock.new("/test/path2.xcproj", [BuildConfigurationMock.new("Debug")])
            ),
        ]
    )
end
