# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../new_architecture.rb"
require_relative "./test_utils/InstallerMock.rb"
require_relative "./test_utils/PodMock.rb"

class NewArchitectureTests < Test::Unit::TestCase
    def teardown
        Pod::UI.reset()
    end

    # ============================= #
    # Test - Set Clang Cxx Lang Std #
    # ============================= #

    def test_setClangCxxLanguageStandardIfNeeded_whenReactCoreIsPresent
        installer = prepare_mocked_installer_with_react_core
        NewArchitectureHelper.set_clang_cxx_language_standard_if_needed(installer)

        assert_equal(installer.aggregate_targets[0].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++17")
        assert_equal(installer.aggregate_targets[1].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++17")
        assert_equal(installer.pods_project.targets[1].received_resolved_build_setting_parameters, [ReceivedCommonResolvedBuildSettings.new("CLANG_CXX_LANGUAGE_STANDARD", true)])
        assert_equal(Pod::UI.collected_messages, ["Setting CLANG_CXX_LANGUAGE_STANDARD to c++17 on /test/path.xcproj", "Setting CLANG_CXX_LANGUAGE_STANDARD to c++17 on /test/path2.xcproj"])
    end

    def test_setClangCxxLanguageStandardIfNeeded_whenReactCoreIsNotPresent
        installer = prepare_mocked_installer_without_react_core
        NewArchitectureHelper.set_clang_cxx_language_standard_if_needed(installer)

        assert_equal(installer.aggregate_targets[0].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], nil)
        assert_equal(installer.aggregate_targets[1].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], nil)
        assert_equal(installer.pods_project.targets[0].received_resolved_build_setting_parameters, [])
        assert_equal(Pod::UI.collected_messages, [])
    end

    def test_setClangCxxLanguageStandardIfNeeded_whenThereAreDifferentValuesForLanguageStandard_takesTheFirstValue
        installer = prepare_mocked_installer_with_react_core_and_different_language_standards
        NewArchitectureHelper.set_clang_cxx_language_standard_if_needed(installer)

        assert_equal(installer.aggregate_targets[0].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++17")
        assert_equal(installer.aggregate_targets[1].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++17")
        assert_equal(installer.pods_project.targets[1].received_resolved_build_setting_parameters, [ReceivedCommonResolvedBuildSettings.new("CLANG_CXX_LANGUAGE_STANDARD", true)])
        assert_equal(Pod::UI.collected_messages, ["Setting CLANG_CXX_LANGUAGE_STANDARD to c++17 on /test/path.xcproj", "Setting CLANG_CXX_LANGUAGE_STANDARD to c++17 on /test/path2.xcproj"])
    end

    # =================== #
    # Test - Modify Flags #
    # =================== #
    def test_modifyFlagsForNewArch_whenOnOldArch_doNothing
        # Arrange
        first_xcconfig = prepare_xcconfig("First")
        second_xcconfig = prepare_xcconfig("Second")
        react_core_debug_config = prepare_CXX_Flags_build_configuration("Debug")
        react_core_release_config = prepare_CXX_Flags_build_configuration("Release")
        yoga_debug_config = prepare_CXX_Flags_build_configuration("Debug")
        yoga_release_config = prepare_CXX_Flags_build_configuration("Release")

        installer = prepare_installer_for_cpp_flags(
            [ first_xcconfig, second_xcconfig ],
            {
                "React-Core" => [ react_core_debug_config, react_core_release_config ],
                "Yoga" => [ yoga_debug_config, yoga_release_config ],
            }
        )
        # Act
        NewArchitectureHelper.modify_flags_for_new_architecture(installer, false)

        # Assert
        assert_equal(first_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
        assert_equal(first_xcconfig.save_as_invocation, [])
        assert_equal(second_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
        assert_equal(second_xcconfig.save_as_invocation, [])
        assert_equal(react_core_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
        assert_equal(react_core_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
        assert_equal(yoga_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
        assert_equal(yoga_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
    end

    def test_modifyFlagsForNewArch_whenOnNewArch_updateFlags
        # Arrange
        first_xcconfig = prepare_xcconfig("First")
        second_xcconfig = prepare_xcconfig("Second")
        react_core_debug_config = prepare_CXX_Flags_build_configuration("Debug")
        react_core_release_config = prepare_CXX_Flags_build_configuration("Release")
        yoga_debug_config = prepare_CXX_Flags_build_configuration("Debug")
        yoga_release_config = prepare_CXX_Flags_build_configuration("Release")

        installer = prepare_installer_for_cpp_flags(
            [ first_xcconfig, second_xcconfig ],
            {
                "React-Core" => [ react_core_debug_config, react_core_release_config ],
                "Yoga" => [ yoga_debug_config, yoga_release_config ],
            }
        )
        # Act
        NewArchitectureHelper.modify_flags_for_new_architecture(installer, true)

        # Assert
        assert_equal(first_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DRCT_NEW_ARCH_ENABLED=1 -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1")
        assert_equal(first_xcconfig.save_as_invocation, ["a/path/First.xcconfig"])
        assert_equal(second_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DRCT_NEW_ARCH_ENABLED=1 -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1")
        assert_equal(second_xcconfig.save_as_invocation, ["a/path/Second.xcconfig"])
        assert_equal(react_core_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DRCT_NEW_ARCH_ENABLED=1 -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1")
        assert_equal(react_core_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DRCT_NEW_ARCH_ENABLED=1 -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1")
        assert_equal(yoga_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
        assert_equal(yoga_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
    end
end

# ================ #
# Test - Utilities #
# ================ #
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

def prepare_xcconfig(name)
    return XCConfigMock.new(name, :attributes => {"OTHER_CPLUSPLUSFLAGS" => "$(inherited)"})
end

def prepare_CXX_Flags_build_configuration(name)
    return BuildConfigurationMock.new(name, {
        "OTHER_CPLUSPLUSFLAGS" => "$(inherited)"
    })
end

def prepare_pod_target_installation_results_mock(name, configs)
    return PodTargetInstallationResultsMock.new(
        :name => name,
        :native_target => TargetMock.new(name, configs)
    )
end

def prepare_installer_for_cpp_flags(xcconfigs, build_configs)
    xcconfigs_map = {}
    xcconfigs.each do |config|
        xcconfigs_map[config.name.to_s] = config
    end

    pod_target_installation_results_map = {}
    build_configs.each do |name, build_configs|
        pod_target_installation_results_map[name.to_s] = prepare_pod_target_installation_results_mock(
            name.to_s, build_configs
        )
    end

    return InstallerMock.new(
        PodsProjectMock.new,
        [
            AggregatedProjectMock.new(:xcconfigs => xcconfigs_map, :base_path => "a/path/")
        ],
        :target_installation_results => TargetInstallationResultsMock.new(
            :pod_target_installation_results => pod_target_installation_results_map
        )
    )
end
