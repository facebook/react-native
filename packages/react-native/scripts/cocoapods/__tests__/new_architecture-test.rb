# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../helpers.rb"
require_relative "../new_architecture.rb"
require_relative "./test_utils/InstallerMock.rb"
require_relative "./test_utils/PodMock.rb"
require_relative "./test_utils/SpecMock.rb"
require_relative "./test_utils/FileMock.rb"

def get_folly_config()
    return Helpers::Constants.folly_config
end

## Monkey patching to reset properly static props of the Helper.
class NewArchitectureHelper
    def self.reset
        @@NewArchWarningEmitted = false
    end
end

class NewArchitectureTests < Test::Unit::TestCase
    def teardown
        Pod::UI.reset()
        FileMock.reset()
        ENV["RCT_NEW_ARCH_ENABLED"] = nil
        NewArchitectureHelper.reset()
    end

    # ============================= #
    # Test - Set Clang Cxx Lang Std #
    # ============================= #

    def test_setClangCxxLanguageStandardIfNeeded_whenReactCoreIsPresent
        installer = prepare_mocked_installer_with_react_core
        NewArchitectureHelper.set_clang_cxx_language_standard_if_needed(installer)

        assert_equal(installer.aggregate_targets[0].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++20")
        assert_equal(installer.aggregate_targets[1].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++20")
        assert_equal(installer.pods_project.targets[1].received_resolved_build_setting_parameters, [ReceivedCommonResolvedBuildSettings.new("CLANG_CXX_LANGUAGE_STANDARD", true)])
        assert_equal(Pod::UI.collected_messages, ["Setting CLANG_CXX_LANGUAGE_STANDARD to c++20 on /test/path.xcproj", "Setting CLANG_CXX_LANGUAGE_STANDARD to c++20 on /test/path2.xcproj"])
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

        assert_equal(installer.aggregate_targets[0].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++20")
        assert_equal(installer.aggregate_targets[1].user_project.build_configurations[0].build_settings["CLANG_CXX_LANGUAGE_STANDARD"], "c++20")
        assert_equal(installer.pods_project.targets[1].received_resolved_build_setting_parameters, [ReceivedCommonResolvedBuildSettings.new("CLANG_CXX_LANGUAGE_STANDARD", true)])
        assert_equal(Pod::UI.collected_messages, ["Setting CLANG_CXX_LANGUAGE_STANDARD to c++20 on /test/path.xcproj", "Setting CLANG_CXX_LANGUAGE_STANDARD to c++20 on /test/path2.xcproj"])
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
        assert_equal(first_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -Wno-comma -Wno-shorten-64-to-32")
        assert_equal(first_xcconfig.save_as_invocation, ["a/path/First.xcconfig"])
        assert_equal(second_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -Wno-comma -Wno-shorten-64-to-32")
        assert_equal(second_xcconfig.save_as_invocation, ["a/path/Second.xcconfig"])
        assert_equal(react_core_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -Wno-comma -Wno-shorten-64-to-32")
        assert_equal(react_core_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -Wno-comma -Wno-shorten-64-to-32")
        assert_equal(yoga_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
        assert_equal(yoga_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
    end

    def test_modifyFlagsForNewArch_whenOnNewArchAndIsRelease_updateFlags
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
        folly_config = Helpers::Constants.folly_config
        folly_compiler_flags = folly_config[:compiler_flags]

        assert_equal(first_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DRCT_NEW_ARCH_ENABLED=1 "+ folly_compiler_flags)
        assert_nil(first_xcconfig.attributes["OTHER_CFLAGS"])
        assert_equal(first_xcconfig.save_as_invocation, ["a/path/First.xcconfig"])
        assert_equal(second_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DRCT_NEW_ARCH_ENABLED=1 "+ folly_compiler_flags)
        assert_nil(second_xcconfig.attributes["OTHER_CFLAGS"])
        assert_equal(second_xcconfig.save_as_invocation, ["a/path/Second.xcconfig"])
        assert_equal(react_core_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DRCT_NEW_ARCH_ENABLED=1 "+ folly_compiler_flags)
        assert_nil(react_core_debug_config.build_settings["OTHER_CFLAGS"])
        assert_equal(react_core_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DRCT_NEW_ARCH_ENABLED=1 "+ folly_compiler_flags)
        assert_nil(react_core_release_config.build_settings["OTHER_CFLAGS"])
        assert_equal(yoga_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
        assert_nil(yoga_debug_config.build_settings["OTHER_CFLAGS"])
        assert_equal(yoga_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"], "$(inherited)")
        assert_nil(yoga_release_config.build_settings["OTHER_CFLAGS"])
    end

    # =================================== #
    # Test - install Modules Dependencies #
    # =================================== #
    def test_installModulesDependencies_whenNewArchEnabledAndNewArchAndNoSearchPathsNorCompilerFlagsArePresent_itInstallDependencies
        #  Arrange
        spec = SpecMock.new

        # Act
        NewArchitectureHelper.install_modules_dependencies(spec, true, '2024.01.01.00')

        # Assert
        folly_config = Helpers::Constants.folly_config
        folly_compiler_flags = folly_config[:compiler_flags]

        assert_equal(spec.compiler_flags, "-DRCT_NEW_ARCH_ENABLED=1 #{NewArchitectureHelper.folly_compiler_flags}")
        assert_equal(spec.pod_target_xcconfig["HEADER_SEARCH_PATHS"], "\"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/Headers/Private/Yoga\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/fmt/include\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers/react/renderer/components/view/platform/cxx\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-FabricImage/React_FabricImage.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers/react/nativemodule/core\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-NativeModulesApple/React_NativeModulesApple.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric/RCTFabric.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-utils/React_utils.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-featureflags/React_featureflags.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-debug/React_debug.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-ImageManager/React_ImageManager.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-rendererdebug/React_rendererdebug.framework/Headers\"")
        assert_equal(spec.pod_target_xcconfig["CLANG_CXX_LANGUAGE_STANDARD"], "c++20")
        assert_equal(spec.pod_target_xcconfig["OTHER_CPLUSPLUSFLAGS"], "$(inherited) -DRCT_NEW_ARCH_ENABLED=1 "+ folly_compiler_flags)
        assert_equal(
            spec.dependencies,
            [
                { :dependency_name => "React-Core" },
                { :dependency_name => "RCT-Folly", "version"=>"2024.01.01.00" },
                { :dependency_name => "glog" },
                { :dependency_name => "React-RCTFabric" },
                { :dependency_name => "ReactCodegen" },
                { :dependency_name => "RCTRequired" },
                { :dependency_name => "RCTTypeSafety" },
                { :dependency_name => "ReactCommon/turbomodule/bridging" },
                { :dependency_name => "ReactCommon/turbomodule/core" },
                { :dependency_name => "React-NativeModulesApple" },
                { :dependency_name => "Yoga" },
                { :dependency_name => "React-Fabric" },
                { :dependency_name => "React-graphics" },
                { :dependency_name => "React-utils" },
                { :dependency_name => "React-featureflags" },
                { :dependency_name => "React-debug" },
                { :dependency_name => "React-ImageManager" },
                { :dependency_name => "React-rendererdebug" },
                { :dependency_name => "DoubleConversion" },
                { :dependency_name => "hermes-engine" }
        ])
    end

    def test_installModulesDependencies_whenNewArchDisabledAndSearchPathsAndCompilerFlagsArePresent_itInstallDependenciesAndPreserveOtherSettings
        #  Arrange
        spec = SpecMock.new
        spec.compiler_flags = ''
        other_flags = "\"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/boost\" \"${PODS_CONFIGURATION_BUILD_DIR}/ReactCodegen/ReactCodegen.framework/Headers\""
        spec.pod_target_xcconfig = {
            "HEADER_SEARCH_PATHS" => other_flags
        }

        # Act
        NewArchitectureHelper.install_modules_dependencies(spec, false, '2024.01.01.00')

        # Assert
        assert_equal(Helpers::Constants.folly_config[:compiler_flags], "#{NewArchitectureHelper.folly_compiler_flags}")
        assert_equal(spec.pod_target_xcconfig["HEADER_SEARCH_PATHS"], "#{other_flags} \"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/Headers/Private/Yoga\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/fmt/include\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers/react/renderer/components/view/platform/cxx\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-FabricImage/React_FabricImage.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers/react/nativemodule/core\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-NativeModulesApple/React_NativeModulesApple.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric/RCTFabric.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-utils/React_utils.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-featureflags/React_featureflags.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-debug/React_debug.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-ImageManager/React_ImageManager.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-rendererdebug/React_rendererdebug.framework/Headers\"")
        assert_equal(spec.pod_target_xcconfig["CLANG_CXX_LANGUAGE_STANDARD"], "c++20")
        assert_equal(
            spec.dependencies,
            [
                { :dependency_name => "React-Core" },
                { :dependency_name => "RCT-Folly", "version"=>"2024.01.01.00" },
                { :dependency_name => "glog" },
                { :dependency_name => "React-RCTFabric" },
                { :dependency_name => "ReactCodegen" },
                { :dependency_name => "RCTRequired" },
                { :dependency_name => "RCTTypeSafety" },
                { :dependency_name => "ReactCommon/turbomodule/bridging" },
                { :dependency_name => "ReactCommon/turbomodule/core" },
                { :dependency_name => "React-NativeModulesApple" },
                { :dependency_name => "Yoga" },
                { :dependency_name => "React-Fabric" },
                { :dependency_name => "React-graphics" },
                { :dependency_name => "React-utils" },
                { :dependency_name => "React-featureflags" },
                { :dependency_name => "React-debug" },
                { :dependency_name => "React-ImageManager" },
                { :dependency_name => "React-rendererdebug" },
                { :dependency_name => "DoubleConversion" },
                { :dependency_name => "hermes-engine" }
            ]
        )
    end

    # =============================== #
    # Test - Compute New Arch Enabled #
    # =============================== #

    def test_computeNewArchEnabled_whenOnMainAndFlagTrueAndEnvVarNil_returnTrueWithNoWarning
        version = '1000.0.0'
        new_arch_enabled = true
        ENV['RCT_NEW_ARCH_ENABLED'] = nil
        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
        assert_equal([], Pod::UI.collected_warns)
    end

    def test_computeNewArchEnabled_whenOnMainAndFlagTrueAndEnvVar1_returnTrueWithNoWarning
        version = '1000.0.0'
        new_arch_enabled = true
        ENV['RCT_NEW_ARCH_ENABLED'] = "1"
        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
        assert_equal([], Pod::UI.collected_warns)
    end

    def test_computeNewArchEnabled_whenOnMainAndFlagFalseAndEnvVarNil_returnFalseWithNoWarning
        version = '1000.0.0'
        new_arch_enabled = false
        ENV['RCT_NEW_ARCH_ENABLED'] = nil

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("0", isEnabled)
        assert_equal([], Pod::UI.collected_warns)
    end

    def test_computeNewArchEnabled_whenOnMainAndFlagFalseAndEnvVar0_returnFalseWithNoWarning
        version = '1000.0.0'
        new_arch_enabled = false
        ENV['RCT_NEW_ARCH_ENABLED'] = "0"

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("0", isEnabled)
        assert_equal([], Pod::UI.collected_warns)
    end

    def test_computeNewArchEnabled_whenOnStableAndFlagTrueAndEnvNil_returnTrueWithNoWarning
        version = '0.73.0'
        new_arch_enabled = true
        ENV['RCT_NEW_ARCH_ENABLED'] = nil

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
        assert_equal([], Pod::UI.collected_warns)
    end

    def test_computeNewArchEnabled_whenOnStableAndFlagTrueAndEnv1_returnTrueWithNoWarning
        version = '0.73.0'
        new_arch_enabled = true
        ENV['RCT_NEW_ARCH_ENABLED'] = "1"

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
        assert_equal([], Pod::UI.collected_warns)
    end

    def test_computeNewArchEnabled_whenOnStableAndFlagFalseAndEnvNil_returnFalseWithNoWarning
        version = '0.73.0'
        new_arch_enabled = false
        ENV['RCT_NEW_ARCH_ENABLED'] = nil

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("0", isEnabled)
        assert_equal([], Pod::UI.collected_warns)
    end

    def test_computeNewArchEnabled_whenOnStableAndFlagFalseAndEnv0_returnFalseWithNoWarning
        version = '0.73.0'
        new_arch_enabled = false
        ENV['RCT_NEW_ARCH_ENABLED'] = "0"

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("0", isEnabled)
        assert_equal([], Pod::UI.collected_warns)
    end

    def test_computeNewArchEnabled_whenOn100AndFlagTrueAndEnvNil_returnTrueWithNoWarning
        version = '0.0.0-prealpha.0'
        new_arch_enabled = true
        ENV['RCT_NEW_ARCH_ENABLED'] = nil

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
        assert_equal([], Pod::UI.collected_warns)
    end

    def test_computeNewArchEnabled_whenOn100AndFlagTrueAndEnv1_returnTrueWithWarning
        version = '0.0.0-prealpha.0'
        new_arch_enabled = true
        ENV['RCT_NEW_ARCH_ENABLED'] = "1"

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
        assert_equal(["[New Architecture] Starting from version 1.0.0-prealpha the value of the " \
            "RCT_NEW_ARCH_ENABLED flag is ignored and the New Architecture is enabled by default."], Pod::UI.collected_warns)
    end


    def test_computeNewArchEnabled_whenOn100PrealphaWithDotsAndFlagFalseAndEnv0_returnTrueWithWarning
        version = '0.0.0-prealpha.0'
        new_arch_enabled = false
        ENV['RCT_NEW_ARCH_ENABLED'] = "0"

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
        assert_equal(["[New Architecture] Starting from version 1.0.0-prealpha the value of the " \
            "RCT_NEW_ARCH_ENABLED flag is ignored and the New Architecture is enabled by default."], Pod::UI.collected_warns)
    end

    def test_computeNewArchEnabled_whenOn100PrealphaWithDashAndFlagFalse_returnTrue
        version = '0.0.0-prealpha-0'
        new_arch_enabled = false

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
    end

    def test_computeNewArchEnabled_whenOn100PrealphaOnlyWordsAndFlagFalse_returnTrue
        version = '0.0.0-prealpha0'
        new_arch_enabled = false

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("1", isEnabled)
    end

    def test_computeNewArchEnabled_whenOnGreaterThan100AndFlagFalse_returnTrue
        version = '3.2.1'
        new_arch_enabled = false

        isEnabled = NewArchitectureHelper.compute_new_arch_enabled(new_arch_enabled, version)

        assert_equal("0", isEnabled)
        assert_equal([], Pod::UI.collected_warns);
    end

    # =================================== #
    # Test - Extract React Native Version #
    # =================================== #
    def test_extractReactNativeVersion_whenFileDoesNotExists_raiseError()
        react_native_path = './node_modules/react-native/'

        exception = assert_raise(RuntimeError) do
            NewArchitectureHelper.extract_react_native_version(react_native_path, :file_manager => FileMock)
        end

        assert_equal("Couldn't find the React Native package.json file at ./node_modules/react-native/package.json", exception.message)
    end

    def test_extractReactNativeVersion_whenFileExists_returnTheRightVersion()
        react_native_path = "./node_modules/react-native/"
        full_path = File.join(react_native_path, "package.json")
        json = "{\"version\": \"1.0.0-prealpha.0\"}"
        FileMock.mocked_existing_files([full_path])
        FileMock.files_to_read({
            full_path => json
        })

        version = NewArchitectureHelper.extract_react_native_version(react_native_path, :file_manager => FileMock)

        assert_equal("1.0.0-prealpha.0", version)
    end

    # =============================== #
    # Test - New Architecture Enabled #
    # =============================== #
    def test_newArchEnabled_whenRCTNewArchEnabledIsSetTo1_returnTrue
        ENV["RCT_NEW_ARCH_ENABLED"] = "1"
        is_enabled = NewArchitectureHelper.new_arch_enabled
        assert_true(is_enabled)
    end

    def test_newArchEnabled_whenRCTNewArchEnabledIsSetTo0_returnFalse
        ENV["RCT_NEW_ARCH_ENABLED"] = "0"
        is_enabled = NewArchitectureHelper.new_arch_enabled
        assert_false(is_enabled)
    end

    def test_newArchEnabled_whenRCTNewArchEnabledIsNotSet_returnTrue
        ENV["RCT_NEW_ARCH_ENABLED"] = nil
        is_enabled = NewArchitectureHelper.new_arch_enabled
        assert_true(is_enabled)
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
                        BuildConfigurationMock.new("Debug", { "CLANG_CXX_LANGUAGE_STANDARD" => "c++20" }),
                        BuildConfigurationMock.new("Release", { "CLANG_CXX_LANGUAGE_STANDARD" => "c++20" }),
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
                        BuildConfigurationMock.new("Debug", { "CLANG_CXX_LANGUAGE_STANDARD" => "c++20" }),
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
    target = TargetMock.new(name, configs)
    return TargetInstallationResultMock.new(target, target)
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
        :pod_target_installation_results => pod_target_installation_results_map
    )
end
