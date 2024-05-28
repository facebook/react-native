# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../utils.rb"
require_relative "./test_utils/PodMock.rb"
require_relative "./test_utils/InstallerMock.rb"
require_relative "./test_utils/EnvironmentMock.rb"
require_relative "./test_utils/SysctlCheckerMock.rb"
require_relative "./test_utils/FileMock.rb"
require_relative "./test_utils/systemUtils.rb"
require_relative "./test_utils/PathnameMock.rb"
require_relative "./test_utils/TargetDefinitionMock.rb"
require_relative "./test_utils/XcodeprojMock.rb"
require_relative "./test_utils/XcodebuildMock.rb"
require_relative "./test_utils/SpecMock.rb"
require_relative "./test_utils/InstallerMock.rb"

class UtilsTests < Test::Unit::TestCase
    def setup
        @base_path = "~/app/ios"
        Pathname.pwd!(@base_path)
    end

    def teardown
        FileMock.reset()
        Pod::UI.reset()
        Pathname.reset()
        Pod::Config.reset()
        SysctlChecker.reset()
        Environment.reset()
        Xcodeproj::Plist.reset()
        XcodebuildMock.reset()
        ENV['RCT_NEW_ARCH_ENABLED'] = '0'
        ENV['USE_HERMES'] = '1'
        ENV['USE_FRAMEWORKS'] = nil
        system_reset_commands
        $RN_PLATFORMS = nil
    end

    # ======================= #
    # TEST - warnIfNotOnArm64 #
    # ======================= #

    def test_warnIfNotOnArm64_whenSysctlReturnsNot1_printsNothing
        # Arrange
        SysctlChecker.set_call_sysctl_arm64_return_value(23)
        Environment.set_ruby_platform("something")

        # Act
        ReactNativePodsUtils.warn_if_not_on_arm64()

        # Assert
        assert_equal(Pod::UI.collected_messages, [])
        assert_equal(Pod::UI.collected_warns, [])

    end

    def test_warnIfNotOnArm64_whenSysctlReturns1AndRubyIncludeArm64_printsNothing
        # Arrange
        SysctlChecker.set_call_sysctl_arm64_return_value(1)
        Environment.set_ruby_platform("arm64-darwin21")

        # Act
        ReactNativePodsUtils.warn_if_not_on_arm64()

        # Assert
        assert_equal(Pod::UI.collected_messages, [])
        assert_equal(Pod::UI.collected_warns, [])
    end

    def test_warnIfNotOnArm64_whenSysctlReturns1AndRubyNotIncludeArm64_warns
        # Arrange
        SysctlChecker.set_call_sysctl_arm64_return_value(1)
        Environment.set_ruby_platform("something else")

        # Act
        ReactNativePodsUtils.warn_if_not_on_arm64()

        # Assert
        assert_equal(Pod::UI.collected_messages, [])
        assert_equal(Pod::UI.collected_warns, [
            'Do not use "pod install" from inside Rosetta2 (x86_64 emulation on arm64).',
            ' - Emulated x86_64 is slower than native arm64',
            ' - May result in mixed architectures in rubygems (eg: ffi_c.bundle files may be x86_64 with an arm64 interpreter)',
            'Run "env /usr/bin/arch -arm64 /bin/bash --login" then try again.',
        ])
    end

    # ====================== #
    # TEST - getDefaultFlags #
    # ====================== #
    def test_getDefaultFlag_whenOldArchitecture()
        # Arrange
        ENV['RCT_NEW_ARCH_ENABLED'] = '0'

        # Act
        flags = ReactNativePodsUtils.get_default_flags()

        # Assert
        assert_equal(flags, {
            :fabric_enabled => false,
            :hermes_enabled => true,
        })
    end

    def test_getDefaultFlag_whenOldArchitectureButHermesDisabled()
        # Arrange
        ENV['RCT_NEW_ARCH_ENABLED'] = '0'
        ENV['USE_HERMES'] = '0'

        # Act
        flags = ReactNativePodsUtils.get_default_flags()

        # Assert
        assert_equal(flags, {
            :fabric_enabled => false,
            :hermes_enabled => false,
        })
    end

    def test_getDefaultFlag_whenNewArchitecture()
        # Arrange
        ENV['RCT_NEW_ARCH_ENABLED'] = '1'

        # Act
        flags = ReactNativePodsUtils.get_default_flags()

        # Assert
        assert_equal(flags, {
            :fabric_enabled => true,
            :hermes_enabled => true,
        })
    end

    def test_getDefaultFlag_whenNewArchitectureButHermesDisabled()
        # Arrange
        ENV['RCT_NEW_ARCH_ENABLED'] = '1'
        ENV['USE_HERMES'] = '0'

        # Act
        flags = ReactNativePodsUtils.get_default_flags()

        # Assert
        assert_equal(flags, {
            :fabric_enabled => true,
            :hermes_enabled => false,
        })
    end

    # ============== #
    # TEST - has_pod #
    # ============== #
    def test_hasPod_whenInstallerDoesNotHavePod_returnFalse
        # Arrange
        installer = InstallerMock.new(PodsProjectMock.new([], {"other_pod" => {}}))

        # Act
        result = ReactNativePodsUtils.has_pod(installer, "some_pod")

        # Assert
        assert_equal(result, false)

    end

    def test_hasPod_whenInstallerHasPod_returnTrue
        # Arrange
        installer = InstallerMock.new(PodsProjectMock.new([], {"some_pod" => {}}))

        # Act
        result = ReactNativePodsUtils.has_pod(installer, "some_pod")

        # Assert
        assert_equal(result, true)
    end

    # ======================================================== #
    # Test -  Set GCC Preprocessor Definition for React-hermes #
    # ======================================================== #

    def test_SetGCCPreprocessorDefinitionForHermes_itSetsThePreprocessorForDebug
        # Arrange
        react_hermes_name = "React-hermes"
        react_core_name = "React-Core"
        hermes_engine_name = "hermes-engine"
        react_hermes_debug_config = BuildConfigurationMock.new("Debug")
        react_hermes_release_config = BuildConfigurationMock.new("Release")
        react_core_debug_config = BuildConfigurationMock.new("Debug")
        react_core_release_config = BuildConfigurationMock.new("Release")
        hermes_engine_debug_config = BuildConfigurationMock.new("Debug")
        hermes_engine_release_config = BuildConfigurationMock.new("Release")
        react_hermes_target = TargetMock.new(react_hermes_name, [react_hermes_debug_config, react_hermes_release_config])
        react_core_target = TargetMock.new(react_core_name, [react_core_debug_config, react_core_release_config])
        hermes_engine_target = TargetMock.new(hermes_engine_name, [hermes_engine_debug_config, hermes_engine_release_config])

        installer = InstallerMock.new(
          :pod_target_installation_results => {
            react_hermes_name => TargetInstallationResultMock.new(react_hermes_target, react_hermes_target),
            react_core_name => TargetInstallationResultMock.new(react_core_target, react_core_target),
            hermes_engine_name => TargetInstallationResultMock.new(hermes_engine_target, hermes_engine_target),
          }
        )

        # Act
        ReactNativePodsUtils.set_gcc_preprocessor_definition_for_React_hermes(installer)

        # Assert
        build_setting = "GCC_PREPROCESSOR_DEFINITIONS"
        expected_value = "$(inherited) HERMES_ENABLE_DEBUGGER=1"
        assert_equal(expected_value, react_hermes_debug_config.build_settings[build_setting])
        assert_nil(react_hermes_release_config.build_settings[build_setting])
        assert_nil(react_core_debug_config.build_settings[build_setting])
        assert_nil(react_core_release_config.build_settings[build_setting])
        assert_equal(expected_value, hermes_engine_debug_config.build_settings[build_setting])
        assert_nil(hermes_engine_release_config.build_settings[build_setting])
    end

    # ================= #
    # Test - Fix Config #
    # ================= #

    def test_fixLibrarySearchPath_whenThereIsNoSearchPaths_doNothing
        # Arrange
        buildConfig = BuildConfigurationMock.new("Debug")

        # Act
        ReactNativePodsUtils.fix_library_search_path(buildConfig)

        # Assert
        assert_nil(buildConfig.build_settings["LIBRARY_SEARCH_PATHS"])
    end

    def test_fixLibrarySearchPath_whenThereAreSearchPathsAndSwiftUnescaped_removesSwift5_5
        # Arrange
        buildConfig = BuildConfigurationMock.new("Debug", {"LIBRARY_SEARCH_PATHS" => [
            "$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)",
            "\"$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)\"",
            "$(SDKROOT)/usr/lib/swift"
        ]})

        # Act
        ReactNativePodsUtils.fix_library_search_path(buildConfig)

        # Assert
        assert_equal(buildConfig.build_settings["LIBRARY_SEARCH_PATHS"], ["$(SDKROOT)/usr/lib/swift"])
    end

    def test_fixLibrarySearchPath_whenThereAreSearchPathsAndSwiftEscaped_removesSwift5_5
        # Arrange
        buildConfig = BuildConfigurationMock.new("Debug", {"LIBRARY_SEARCH_PATHS" => [
            "$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)",
            "\"$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)\"",
            "another/path",
            "\"$(SDKROOT)/usr/lib/swift\""
        ]})

        # Act
        ReactNativePodsUtils.fix_library_search_path(buildConfig)

        # Assert
        assert_equal(buildConfig.build_settings["LIBRARY_SEARCH_PATHS"], ["another/path", "\"$(SDKROOT)/usr/lib/swift\""])
    end

    def test_fixLibrarySearchPath_whenThereAreSearchPathsAndNoSwift_removesSwift5_5AndAddsSwiftAsFirst
        # Arrange
        buildConfig = BuildConfigurationMock.new("Debug", {"LIBRARY_SEARCH_PATHS" => [
            "another/path"
        ]})

        # Act
        ReactNativePodsUtils.fix_library_search_path(buildConfig)

        # Assert
        assert_equal(buildConfig.build_settings["LIBRARY_SEARCH_PATHS"], ["$(SDKROOT)/usr/lib/swift", "another/path"])
    end

    # ============================== #
    # Test - Fix Library Search Path #
    # ============================== #

    def test_fixLibrarySearchPaths_correctlySetsTheSearchPathsForAllProjects
        first_target = prepare_target("FirstTarget")
        second_target = prepare_target("SecondTarget")
        third_target = prepare_target("ThirdTarget")
        user_project_mock = UserProjectMock.new("/a/path", [
                prepare_config("Debug"),
                prepare_config("Release"),
            ],
            :native_targets => [
                first_target,
                second_target
            ]
        )
        pods_projects_mock = PodsProjectMock.new([], {"hermes-engine" => {}}, :native_targets => [
            third_target
        ])
        installer = InstallerMock.new(pods_projects_mock, [
            AggregatedProjectMock.new(user_project_mock)
        ])

        # Act
        ReactNativePodsUtils.fix_library_search_paths(installer)

        # Assert
        user_project_mock.build_configurations.each do |config|
            assert_equal(config.build_settings["LIBRARY_SEARCH_PATHS"], [
                "$(SDKROOT)/usr/lib/swift", "another/path"
            ])
        end

        user_project_mock.native_targets.each do |target|
            target.build_configurations.each do |config|
                assert_equal(config.build_settings["LIBRARY_SEARCH_PATHS"], [
                    "$(SDKROOT)/usr/lib/swift", "another/path"
                ])
            end
        end

        pods_projects_mock.native_targets.each do |target|
            target.build_configurations.each do |config|
                assert_equal(config.build_settings["LIBRARY_SEARCH_PATHS"], [
                    "$(SDKROOT)/usr/lib/swift", "another/path"
                ])
            end
        end

        assert_equal(user_project_mock.save_invocation_count, 1)
        assert_equal(pods_projects_mock.save_invocation_count, 1)
    end

    # ===================================== #
    # Test - Apply Xcode14 React-Core patch #
    # ===================================== #

    def test_turnOffResourceBundleReactCore_correctlyAppliesPatch
        # Arrange
        react_core_target = TargetMock.new('React-Core')
        react_core_target_native_target = react_core_target
        react_core_debug_config = prepare_Code_Signing_build_configuration("Debug", "YES")
        react_core_release_config = prepare_Code_Signing_build_configuration("Release", "YES")

        hermes_engine_target = TargetMock.new('hermes-engine')
        hermes_engine_target_native_target = hermes_engine_target
        hermes_engine_debug_config = prepare_Code_Signing_build_configuration("Debug", "NO")
        hermes_engine_release_config = prepare_Code_Signing_build_configuration("Release", "NO")

        assets_target = TargetMock.new('assets')
        assets_target_native_target = assets_target
        assets_debug_config = prepare_Code_Signing_build_configuration("Debug", "YES")
        assets_release_config = prepare_Code_Signing_build_configuration("Release", "YES")

        installer = InstallerMock.new(pod_target_installation_results: {
            'React-Core':
                TargetInstallationResultMock.new(
                    react_core_target,
                    react_core_target_native_target,
                    [TargetMock.new('React-Core',[react_core_debug_config, react_core_release_config])]
                ),
            'hermes-engine':
                TargetInstallationResultMock.new(
                    hermes_engine_target,
                    hermes_engine_target_native_target,
                    [TargetMock.new('hermes-engine',[hermes_engine_debug_config, hermes_engine_release_config])]
                ),
            'assets':
                TargetInstallationResultMock.new(
                    assets_target,
                    assets_target_native_target,
                    [TargetMock.new('assets',[assets_debug_config, assets_release_config])]
                ),
        })

        # Act
        ReactNativePodsUtils.turn_off_resource_bundle_react_core(installer)

        # Assert
        # these must have changed
        assert_equal(react_core_debug_config.build_settings["CODE_SIGNING_ALLOWED"], "NO")
        assert_equal(react_core_release_config.build_settings["CODE_SIGNING_ALLOWED"], "NO")
        # these needs to stay the same
        assert_equal(hermes_engine_debug_config.build_settings["CODE_SIGNING_ALLOWED"], "NO")
        assert_equal(hermes_engine_release_config.build_settings["CODE_SIGNING_ALLOWED"], "NO")
        assert_equal(assets_debug_config.build_settings["CODE_SIGNING_ALLOWED"], "YES")
        assert_equal(assets_release_config.build_settings["CODE_SIGNING_ALLOWED"], "YES")
    end

    # ================================= #
    # Test - Apply Mac Catalyst Patches #
    # ================================= #

    def test_applyMacCatalystPatches_correctlyAppliesNecessaryPatches
        first_target = prepare_target("FirstTarget")
        second_target = prepare_target("SecondTarget")
        third_target = prepare_target("ThirdTarget", "com.apple.product-type.bundle")
        user_project_mock = UserProjectMock.new("/a/path", [
                prepare_config("Debug"),
                prepare_config("Release"),
            ],
            :native_targets => [
                first_target,
                second_target
            ]
        )
        pods_projects_mock = PodsProjectMock.new([third_target], {"hermes-engine" => {}}, :native_targets => [])
        installer = InstallerMock.new(pods_projects_mock, [
            AggregatedProjectMock.new(user_project_mock)
        ])

        # Act
        ReactNativePodsUtils.apply_mac_catalyst_patches(installer)

        # Assert
        first_target.build_configurations.each do |config|
          assert_nil(config.build_settings["CODE_SIGN_IDENTITY[sdk=macosx*]"])
        end

        second_target.build_configurations.each do |config|
          assert_nil(config.build_settings["CODE_SIGN_IDENTITY[sdk=macosx*]"])
        end

        third_target.build_configurations.each do |config|
          assert_equal(config.build_settings["CODE_SIGN_IDENTITY[sdk=macosx*]"], "-")
        end

        user_project_mock.native_targets.each do |target|
            target.build_configurations.each do |config|
                assert_equal(config.build_settings["DEAD_CODE_STRIPPING"], "YES")
                assert_equal(config.build_settings["PRESERVE_DEAD_CODE_INITS_AND_TERMS"], "YES")
                assert_equal(config.build_settings["LIBRARY_SEARCH_PATHS"], ["$(SDKROOT)/usr/lib/swift", "$(SDKROOT)/System/iOSSupport/usr/lib/swift", "$(inherited)"])
            end
        end

        assert_equal(user_project_mock.save_invocation_count, 1)
    end

    # ================================= #
    # Test - Apply Xcode 15 Patch       #
    # ================================= #
    def test_applyXcode15Patch_whenXcodebuild14_correctlyAppliesNecessaryPatch
        # Arrange
        XcodebuildMock.set_version = "Xcode 14.3"
        first_target = prepare_target("FirstTarget")
        second_target = prepare_target("SecondTarget")
        third_target = TargetMock.new("ThirdTarget", [
            BuildConfigurationMock.new("Debug", {
              "GCC_PREPROCESSOR_DEFINITIONS" => '$(inherited) "SomeFlag=1" '
            }),
            BuildConfigurationMock.new("Release", {
              "GCC_PREPROCESSOR_DEFINITIONS" => '$(inherited) "SomeFlag=1" '
            }),
        ], nil)

        user_project_mock = UserProjectMock.new("/a/path", [
                prepare_config("Debug"),
                prepare_config("Release"),
            ],
            :native_targets => [
                first_target,
                second_target
            ]
        )
        pods_projects_mock = PodsProjectMock.new([], {"hermes-engine" => {}}, :native_targets => [
            third_target
        ])
        installer = InstallerMock.new(pods_projects_mock, [
            AggregatedProjectMock.new(user_project_mock)
        ])

        # Act
        user_project_mock.build_configurations.each do |config|
            assert_nil(config.build_settings["OTHER_LDFLAGS"])
        end

        ReactNativePodsUtils.apply_xcode_15_patch(installer, :xcodebuild_manager => XcodebuildMock)

        # Assert
        user_project_mock.build_configurations.each do |config|
            assert_equal("$(inherited) ", config.build_settings["OTHER_LDFLAGS"])
        end

        # User project and Pods project
        assert_equal(2, XcodebuildMock.version_invocation_count)
    end

    def test_applyXcode15Patch_whenXcodebuild15_1_does_not_apply_patch
        # Arrange
        XcodebuildMock.set_version = "Xcode 15.1"
        first_target = prepare_target("FirstTarget")
        second_target = prepare_target("SecondTarget")
        third_target = TargetMock.new("ThirdTarget", [
            BuildConfigurationMock.new("Debug", {
              "GCC_PREPROCESSOR_DEFINITIONS" => '$(inherited) "SomeFlag=1" '
            }),
            BuildConfigurationMock.new("Release", {
              "GCC_PREPROCESSOR_DEFINITIONS" => '$(inherited) "SomeFlag=1" '
            }),
        ], nil)

        user_project_mock = UserProjectMock.new("/a/path", [
                prepare_config("Debug"),
                prepare_config("Release"),
            ],
            :native_targets => [
                first_target,
                second_target
            ]
        )
        pods_projects_mock = PodsProjectMock.new([], {"hermes-engine" => {}}, :native_targets => [
            third_target
        ])
        installer = InstallerMock.new(pods_projects_mock, [
            AggregatedProjectMock.new(user_project_mock)
        ])

        # Act
        user_project_mock.build_configurations.each do |config|
            assert_nil(config.build_settings["OTHER_LDFLAGS"])
        end

        ReactNativePodsUtils.apply_xcode_15_patch(installer, :xcodebuild_manager => XcodebuildMock)

        # Assert
        user_project_mock.build_configurations.each do |config|
            assert_equal("$(inherited) ", config.build_settings["OTHER_LDFLAGS"])
        end

        # User project and Pods project
        assert_equal(2, XcodebuildMock.version_invocation_count)
    end

    def test_applyXcode15Patch_whenXcodebuild15_correctlyAppliesNecessaryPatch
        # Arrange
        XcodebuildMock.set_version = "Xcode 15.0"
        first_target = prepare_target("FirstTarget")
        second_target = prepare_target("SecondTarget")
        third_target = TargetMock.new("ThirdTarget", [
            BuildConfigurationMock.new("Debug", {
              "GCC_PREPROCESSOR_DEFINITIONS" => '$(inherited) "SomeFlag=1" '
            }),
            BuildConfigurationMock.new("Release", {
              "GCC_PREPROCESSOR_DEFINITIONS" => '$(inherited) "SomeFlag=1" '
            }),
        ], nil)

        user_project_mock = UserProjectMock.new("/a/path", [
                prepare_config("Debug"),
                prepare_config("Release"),
            ],
            :native_targets => [
                first_target,
                second_target
            ]
        )
        pods_projects_mock = PodsProjectMock.new([], {"hermes-engine" => {}}, :native_targets => [
            third_target
        ])
        installer = InstallerMock.new(pods_projects_mock, [
            AggregatedProjectMock.new(user_project_mock)
        ])

        # Act
        user_project_mock.build_configurations.each do |config|
            assert_nil(config.build_settings["OTHER_LDFLAGS"])
        end

        ReactNativePodsUtils.apply_xcode_15_patch(installer, :xcodebuild_manager => XcodebuildMock)

        # Assert
        user_project_mock.build_configurations.each do |config|
            assert_equal("$(inherited) -Wl -ld_classic", config.build_settings["OTHER_LDFLAGS"])
        end

        # User project and Pods project
        assert_equal(2, XcodebuildMock.version_invocation_count)
    end

    def test_applyXcode15Patch_whenXcodebuild14ButProjectHasSettings_correctlyRemovesNecessaryPatch
        # Arrange
        XcodebuildMock.set_version = "Xcode 14.3"
        first_target = prepare_target("FirstTarget")
        second_target = prepare_target("SecondTarget")
        third_target = TargetMock.new("ThirdTarget", [
            BuildConfigurationMock.new("Debug", {
              "GCC_PREPROCESSOR_DEFINITIONS" => '$(inherited) "SomeFlag=1" '
            }),
            BuildConfigurationMock.new("Release", {
              "GCC_PREPROCESSOR_DEFINITIONS" => '$(inherited) "SomeFlag=1" '
            }),
        ], nil)

        debug_config = prepare_config("Debug", {"OTHER_LDFLAGS" => "$(inherited) -Wl -ld_classic "})
        release_config = prepare_config("Release", {"OTHER_LDFLAGS" => "$(inherited) -Wl -ld_classic "})

        user_project_mock = UserProjectMock.new("/a/path", [
                debug_config,
                release_config,
            ],
            :native_targets => [
                first_target,
                second_target
            ]
        )
        pods_projects_mock = PodsProjectMock.new([debug_config.clone, release_config.clone], {"hermes-engine" => {}}, :native_targets => [
            third_target
        ])
        installer = InstallerMock.new(pods_projects_mock, [
            AggregatedProjectMock.new(user_project_mock)
        ])

        # Act
        user_project_mock.build_configurations.each do |config|
            assert_equal("$(inherited) -Wl -ld_classic ", config.build_settings["OTHER_LDFLAGS"])
        end

        ReactNativePodsUtils.apply_xcode_15_patch(installer, :xcodebuild_manager => XcodebuildMock)

        # Assert
        user_project_mock.build_configurations.each do |config|
            assert_equal("$(inherited)", config.build_settings["OTHER_LDFLAGS"])
        end

        # User project and Pods project
        assert_equal(2, XcodebuildMock.version_invocation_count)
    end

    # ==================================== #
    # Test - Set USE_HERMES Build Setting #
    # ==================================== #

    def test_setUseHermesBuildSetting_addTheUserSetting
        # Arrange
        react_native_path = "react_native/node_modules"
        user_project_mock = prepare_empty_user_project_mock()
        pods_projects_mock = PodsProjectMock.new([], {"hermes-engine" => {}})
        installer = InstallerMock.new(pods_projects_mock, [
            AggregatedProjectMock.new(user_project_mock)
        ])

        # Act
        ReactNativePodsUtils.set_use_hermes_build_setting(installer, false)

        # Assert
        user_project_mock.build_configurations.each do |config|
            assert_equal(config.build_settings["USE_HERMES"], false)
        end

        assert_equal(user_project_mock.save_invocation_count, 1)
        assert_equal(pods_projects_mock.save_invocation_count, 1)
        assert_equal(Pod::UI.collected_messages, ["Setting USE_HERMES build settings"])
    end

    # ==================================== #
    # Test - Set Node_Modules User Setting #
    # ==================================== #

    def test_setNodeModulesUserSettings_addTheUserSetting
        # Arrange
        react_native_path = "react_native/node_modules"
        user_project_mock = prepare_empty_user_project_mock()
        pods_projects_mock = PodsProjectMock.new([], {"hermes-engine" => {}})
        installer = InstallerMock.new(pods_projects_mock, [
            AggregatedProjectMock.new(user_project_mock)
        ])

        # Act
        ReactNativePodsUtils.set_node_modules_user_settings(installer, react_native_path)

        # Assert
        user_project_mock.build_configurations.each do |config|
            assert_equal(config.build_settings["REACT_NATIVE_PATH"], "${PODS_ROOT}/../#{react_native_path}")
        end

        assert_equal(user_project_mock.save_invocation_count, 1)
        assert_equal(pods_projects_mock.save_invocation_count, 1)
        assert_equal(Pod::UI.collected_messages, ["Setting REACT_NATIVE build settings"])
    end

    # =================================== #
    # Test - Prepare React Native Project #
    # =================================== #
    def test_createXcodeEnvIfMissing_whenTheyArePresent_doNothing
        # Arrange
        FileMock.mocked_existing_files("/.xcode.env")
        FileMock.mocked_existing_files("/.xcode.env.local")
        # Act
        ReactNativePodsUtils.create_xcode_env_if_missing(file_manager: FileMock)
        # Assert
        assert_equal(FileMock.exist_invocation_params, ["/.xcode.env", "/.xcode.env.local"])
        assert_equal($collected_commands, [])
    end

    def test_createXcodeEnvIfMissing_whenTheyAreNotPresent_createsThem
        # Arrange

        # Act
        ReactNativePodsUtils.create_xcode_env_if_missing(file_manager: FileMock)
        # Assert
        assert_equal(FileMock.exist_invocation_params, ["/.xcode.env", "/.xcode.env.local"])
        assert_equal($collected_commands[0], "echo 'export NODE_BINARY=$(command -v node)' > /.xcode.env")

        assert_true($collected_commands[1].start_with? "echo 'export NODE_BINARY=")
        assert_true($collected_commands[1].end_with? "' > /.xcode.env.local")
    end

    # ============================ #
    # Test - Detect Use Frameworks #
    # ============================ #
    def test_detectUseFrameworks_whenEnvAlreadySet_DoesNothing
        # Arrange
        ENV['USE_FRAMEWORKS'] = 'static'
        target_definition = TargetDefinitionMock.new('something')

        # Act
        ReactNativePodsUtils.detect_use_frameworks(target_definition)

        # Assert
        assert_equal(Pod::UI.collected_messages, [])
    end

    def test_detectUseFrameworks_whenEnvNotSetAndNotUsed_setEnvVarToNil
        # Arrange
        target_definition = TargetDefinitionMock.new('static library')

        # Act
        ReactNativePodsUtils.detect_use_frameworks(target_definition)

        # Assert
        assert_equal(Pod::UI.collected_messages, ["Framework build type is static library"])
        assert_nil(ENV['USE_FRAMEWORKS'])
    end

    def test_detectUseFrameworks_whenEnvNotSetAndStaticFrameworks_setEnvVarToStatic
        # Arrange
        target_definition = TargetDefinitionMock.new('static framework')

        # Act
        ReactNativePodsUtils.detect_use_frameworks(target_definition)

        # Assert
        assert_equal(Pod::UI.collected_messages, ["Framework build type is static framework"])
        assert_equal(ENV['USE_FRAMEWORKS'], 'static')
    end

    def test_detectUseFrameworks_whenEnvNotSetAndDynamicFrameworks_setEnvVarToDynamic
        # Arrange
        target_definition = TargetDefinitionMock.new('dynamic framework')

        # Act
        ReactNativePodsUtils.detect_use_frameworks(target_definition)

        # Assert
        assert_equal(Pod::UI.collected_messages, ["Framework build type is dynamic framework"])
        assert_equal(ENV['USE_FRAMEWORKS'], 'dynamic')
    end

    # ============================ #
    # Test - Update Search Paths   #
    # ============================ #
    def test_updateSearchPaths_whenUseFrameworks_addsSearchPaths
        # Arrange
        ENV['USE_FRAMEWORKS'] = 'static'
        first_target = prepare_target("FirstTarget")
        second_target = prepare_target("SecondTarget", nil, [
            DependencyMock.new("RCT-Folly"),
            DependencyMock.new("ReactCodegen"),
            DependencyMock.new("ReactCommon"),
            DependencyMock.new("React-RCTFabric"),
            DependencyMock.new("React-ImageManager"),
        ])
        third_target = prepare_target("ThirdTarget", "com.apple.product-type.bundle")
        user_project_mock = UserProjectMock.new("/a/path", [
                prepare_config("Debug"),
                prepare_config("Release"),
            ],
            :native_targets => [
                first_target,
                second_target
            ]
        )
        pods_projects_mock = PodsProjectMock.new([third_target], {"hermes-engine" => {}})
        installer = InstallerMock.new(pods_projects_mock, [
            AggregatedProjectMock.new(user_project_mock)
        ])

        # Act
        ReactNativePodsUtils.update_search_paths(installer)

        # Assert
        user_project_mock.build_configurations.each do |config|
            received_search_path = config.build_settings["HEADER_SEARCH_PATHS"]
            expected_search_path = "$(inherited) ${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers ${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers/react/nativemodule/core ${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon-Samples/ReactCommon_Samples.framework/Headers ${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon-Samples/ReactCommon_Samples.framework/Headers/platform/ios ${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers/react/renderer/components/view/platform/cxx ${PODS_CONFIGURATION_BUILD_DIR}/React-NativeModulesApple/React_NativeModulesApple.framework/Headers ${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers ${PODS_CONFIGURATION_BUILD_DIR}/React-graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios"
            assert_equal(expected_search_path, received_search_path)
        end

        installer.target_installation_results.pod_target_installation_results.each do |pod_name, target_installation_result|
            if pod_name == "SecondTarget"
                target_installation_result.native_target.build_configurations.each do |config|
                    received_search_path = config.build_settings["HEADER_SEARCH_PATHS"]
                    expected_Search_path = "$(inherited) \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/fmt/include\" \"$(PODS_ROOT)/boost\" \"${PODS_CONFIGURATION_BUILD_DIR}/ReactCodegen/ReactCodegen.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon/ReactCommon.framework/Headers/react/nativemodule/core\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric/RCTFabric.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers/react/renderer/components/view/platform/cxx\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-FabricImage/React_FabricImage.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Graphics/React_graphics.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Graphics/React_graphics.framework/Headers/react/renderer/graphics/platform/ios\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers/react/renderer/imagemanager/platform/ios\""
                    assert_equal(received_search_path, expected_Search_path)
                end
            else
                target_installation_result.native_target.build_configurations.each do |config|
                    assert_nil(config.build_settings["HEADER_SEARCH_PATHS"])
                end
            end
        end
    end

    def test_updateSearchPaths_whenNotUseFrameworks_addsSearchPaths
        # Arrange
        first_target = prepare_target("FirstTarget")
        second_target = prepare_target("SecondTarget")
        third_target = prepare_target("ThirdTarget", "com.apple.product-type.bundle")
        user_project_mock = UserProjectMock.new("/a/path", [
                prepare_config("Debug"),
                prepare_config("Release"),
            ],
            :native_targets => [
                first_target,
                second_target
            ]
        )
        pods_projects_mock = PodsProjectMock.new([third_target], {"hermes-engine" => {}})
        installer = InstallerMock.new(pods_projects_mock, [
            AggregatedProjectMock.new(user_project_mock)
        ])

        # Act
        ReactNativePodsUtils.update_search_paths(installer)

        # Assert
        user_project_mock.build_configurations.each do |config|
            assert_nil(config.build_settings["HEADER_SEARCH_PATHS"])
        end
    end

    # =============================================== #
    # Test - Create Header Search Path For Frameworks #
    # =============================================== #
    def test_creatHeaderSearchPathForFrameworks_whenNoPlatformsAndNoExtraPath_createsPlainSearchPath
        result = ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-RCTFabric", "RCTFabric", [])

        assert_equal(result, [
            "${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric/RCTFabric.framework/Headers"
        ])
    end

    def test_creatHeaderSearchPathForFrameworks_whenNoPlatformsAndExtraPath_createsPlainSearchPath
        result = ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-Fabric", "React_Fabric", ["react/renderer/components/view/platform/cxx"])

        assert_equal(result, [
            "${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers",
            "${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers/react/renderer/components/view/platform/cxx",
        ])
    end

    def test_creatHeaderSearchPathForFrameworks_whenEmptyPlatformsAndExtraPath_createsPlainSearchPath
        $RN_PLATFORMS = []

        result = ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-Fabric", "React_Fabric", ["react/renderer/components/view/platform/cxx"])

        assert_equal(result, [
            "${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers",
            "${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers/react/renderer/components/view/platform/cxx",
        ])
    end

    def test_creatHeaderSearchPathForFrameworks_whenOnlyOnePlatformsAndExtraPath_createsPlainSearchPath
        $RN_PLATFORMS = ['iOS']

        result = ReactNativePodsUtils.create_header_search_path_for_frameworks("PODS_CONFIGURATION_BUILD_DIR", "React-Fabric", "React_Fabric", ["react/renderer/components/view/platform/cxx"])

        assert_equal(result, [
            "${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers",
            "${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers/react/renderer/components/view/platform/cxx",
        ])
    end

    def test_creatHeaderSearchPathForFrameworks_whenMultiplePlatformsAndExtraPath_createsPlainSearchPath
        $RN_PLATFORMS = ["iOS", "macOS"]

        result = ReactNativePodsUtils.create_header_search_path_for_frameworks(
            "PODS_CONFIGURATION_BUILD_DIR",
            "React-Fabric",
            "React_Fabric",
            [
                "react/renderer/components/view/platform/cxx",
                "react/renderer/components/view/platform/ios"
            ]
        )

        assert_equal(result, [
            "${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric-iOS/React_Fabric.framework/Headers",
            "${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric-iOS/React_Fabric.framework/Headers/react/renderer/components/view/platform/cxx",
            "${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric-iOS/React_Fabric.framework/Headers/react/renderer/components/view/platform/ios",
            "${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric-macOS/React_Fabric.framework/Headers",
            "${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric-macOS/React_Fabric.framework/Headers/react/renderer/components/view/platform/cxx",
            "${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric-macOS/React_Fabric.framework/Headers/react/renderer/components/view/platform/ios",
        ])
    end

    # ===================== #
    # TEST - Add Dependency #
    # ===================== #
    def test_addDependency_whenNoHeaderSearchPathAndNoVersion_addsThem
        spec = SpecMock.new

        ReactNativePodsUtils.add_dependency(spec, "React-Fabric", "PODS_CONFIGURATION_BUILD_DIR", "React_Fabric")

        assert_equal(spec.dependencies, [{:dependency_name => "React-Fabric"}])
        assert_equal(spec.to_hash["pod_target_xcconfig"], {"HEADER_SEARCH_PATHS" =>  "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\""})
    end

    def test_addDependency_whenNoHeaderSearchPathAndVersion_addsThem
        spec = SpecMock.new

        ReactNativePodsUtils.add_dependency(spec, "React-Fabric", "PODS_CONFIGURATION_BUILD_DIR", "React_Fabric", :additional_paths => [], :version => '1000.0.0')

        assert_equal(spec.dependencies, [{:dependency_name => "React-Fabric", "version" => '1000.0.0'}])
        assert_equal(spec.to_hash["pod_target_xcconfig"], {"HEADER_SEARCH_PATHS" =>  "\"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\""})
    end

    def test_addDependency_whenHeaderSearchPathAndVersion_addsThemMaintainingTheSearchPaths
        spec = SpecMock.new
        spec.pod_target_xcconfig["HEADER_SEARCH_PATHS"] = "\"$(PODS_ROOT)/RCT-Folly\""

        ReactNativePodsUtils.add_dependency(spec, "React-Fabric", "PODS_CONFIGURATION_BUILD_DIR", "React_Fabric", :additional_paths => [], :version => '1000.0.0')

        assert_equal(spec.dependencies, [{:dependency_name => "React-Fabric", "version" => '1000.0.0'}])
        assert_equal(spec.to_hash["pod_target_xcconfig"], {"HEADER_SEARCH_PATHS" =>  "\"$(PODS_ROOT)/RCT-Folly\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\""})
    end

    def test_addDependencies_whenHeaderSearchPathAndVersion_addsThemMaintainingTheSearchPaths
        spec = SpecMock.new
        spec.pod_target_xcconfig["HEADER_SEARCH_PATHS"] = "\"$(PODS_ROOT)/RCT-Folly\""

        ReactNativePodsUtils.add_dependency(spec, "React-Fabric", "PODS_CONFIGURATION_BUILD_DIR", "React_Fabric", :additional_paths => [], :version => '1000.0.0')
        ReactNativePodsUtils.add_dependency(spec, "React-RCTFabric", "PODS_CONFIGURATION_BUILD_DIR", "RCTFabric", :additional_paths => [])

        assert_equal(spec.dependencies, [{:dependency_name => "React-Fabric", "version" => '1000.0.0'}, {:dependency_name => "React-RCTFabric" }])
        assert_equal(spec.to_hash["pod_target_xcconfig"], {
            "HEADER_SEARCH_PATHS" =>  "\"$(PODS_ROOT)/RCT-Folly\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric/RCTFabric.framework/Headers\""})
    end

    def test_addDependencies_whenHeaderSearchPathAndVersionWithAdditionalPaths_addsThemMaintainingTheSearchPaths
        spec = SpecMock.new
        spec.pod_target_xcconfig["HEADER_SEARCH_PATHS"] = "\"$(PODS_ROOT)/RCT-Folly\""

        ReactNativePodsUtils.add_dependency(spec, "React-Fabric", "PODS_CONFIGURATION_BUILD_DIR", "React_Fabric", :additional_paths => [], :version => '1000.0.0')
        ReactNativePodsUtils.add_dependency(spec, "React-RCTFabric", "PODS_CONFIGURATION_BUILD_DIR", "RCTFabric", :additional_paths => ["react/renderer/components/view/platform/ios"])

        assert_equal(spec.dependencies, [{:dependency_name => "React-Fabric", "version" => '1000.0.0'}, {:dependency_name => "React-RCTFabric" }])
        assert_equal(spec.to_hash["pod_target_xcconfig"], {
            "HEADER_SEARCH_PATHS" =>  "\"$(PODS_ROOT)/RCT-Folly\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric/React_Fabric.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric/RCTFabric.framework/Headers\" \"${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric/RCTFabric.framework/Headers/react/renderer/components/view/platform/ios\""})
    end

    def test_addDependencies_whenHeaderSearchPathAndVersionWithAdditionalPathsAndPlatforms_addsThemMaintainingTheSearchPaths
        spec = SpecMock.new
        spec.pod_target_xcconfig["HEADER_SEARCH_PATHS"] = "\"$(PODS_ROOT)/RCT-Folly\""
        $RN_PLATFORMS = ['iOS', 'macOS']

        ReactNativePodsUtils.add_dependency(spec, "React-Fabric", "PODS_CONFIGURATION_BUILD_DIR", "React_Fabric", :additional_paths => [], :version => '1000.0.0')
        ReactNativePodsUtils.add_dependency(spec, "React-RCTFabric", "PODS_CONFIGURATION_BUILD_DIR", "RCTFabric", :additional_paths => ["react/renderer/components/view/platform/ios"])

        expected_search_paths = [
            "$(PODS_ROOT)/RCT-Folly",
            "${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric-iOS/React_Fabric.framework/Headers",
            "${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric-iOS/RCTFabric.framework/Headers",
            "${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric-iOS/RCTFabric.framework/Headers/react/renderer/components/view/platform/ios",
            "${PODS_CONFIGURATION_BUILD_DIR}/React-Fabric-macOS/React_Fabric.framework/Headers",
            "${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric-macOS/RCTFabric.framework/Headers",
            "${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric-macOS/RCTFabric.framework/Headers/react/renderer/components/view/platform/ios"
        ]
        .map { |sp| return "\"#{sp}\"" }
        .join(" ")

        assert_equal(spec.dependencies, [{:dependency_name => "React-Fabric", "version" => '1000.0.0'}, {:dependency_name => "React-RCTFabric" }])
        assert_equal(spec.to_hash["pod_target_xcconfig"], {
            "HEADER_SEARCH_PATHS" => expected_search_paths})
    end

    def test_addDependencies_whenSubspecsAndHeaderSearchPathAndVersionWithAdditionalPathsAndPlatforms_addsThemMaintainingTheSearchPaths
        spec = SpecMock.new
        spec.pod_target_xcconfig["HEADER_SEARCH_PATHS"] = "\"$(PODS_ROOT)/RCT-Folly\""
        $RN_PLATFORMS = ['iOS', 'macOS']

        ReactNativePodsUtils.add_dependency(spec, "ReactCommon", "PODS_CONFIGURATION_BUILD_DIR", "ReactCommon", :additional_paths => ["react/nativemodule/core"], :subspec_dependency => 'turbomodule/core')

        expected_search_paths = [
            "$(PODS_ROOT)/RCT-Folly",
            "${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon-iOS/ReactCommon.framework/Headers",
            "${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon-iOS/ReactCommon.framework/Headers/react/nativemodule/core",
            "${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon-macOS/ReactCommon.framework/Headers",
            "${PODS_CONFIGURATION_BUILD_DIR}/ReactCommon-macOS/ReactCommon.framework/Headers/react/nativemodule/core",
        ]
        .map { |sp| return "\"#{sp}\"" }
        .join(" ")

        assert_equal(spec.dependencies, [{:dependency_name => "ReactCommon/turbomodule/core"}])
        assert_equal(spec.to_hash["pod_target_xcconfig"], {
            "HEADER_SEARCH_PATHS" => expected_search_paths})
    end

    def test_add_flag_to_map_with_inheritance_whenUsedWithBuildConfigBuildSettings
        # Arrange
        empty_config = BuildConfigurationMock.new("EmptyConfig")
        initialized_config = BuildConfigurationMock.new("InitializedConfig", {
            "OTHER_CPLUSPLUSFLAGS" => "INIT_FLAG"
        })
        twiceProcessed_config = BuildConfigurationMock.new("TwiceProcessedConfig");
        test_flag = " -DTEST_FLAG=1"

        # Act
        ReactNativePodsUtils.add_flag_to_map_with_inheritance(empty_config.build_settings, "OTHER_CPLUSPLUSFLAGS", test_flag)
        ReactNativePodsUtils.add_flag_to_map_with_inheritance(initialized_config.build_settings, "OTHER_CPLUSPLUSFLAGS", test_flag)
        ReactNativePodsUtils.add_flag_to_map_with_inheritance(twiceProcessed_config.build_settings, "OTHER_CPLUSPLUSFLAGS", test_flag)
        ReactNativePodsUtils.add_flag_to_map_with_inheritance(twiceProcessed_config.build_settings, "OTHER_CPLUSPLUSFLAGS", test_flag)

        # Assert
        assert_equal("$(inherited)" + test_flag, empty_config.build_settings["OTHER_CPLUSPLUSFLAGS"])
        assert_equal("$(inherited) INIT_FLAG" + test_flag, initialized_config.build_settings["OTHER_CPLUSPLUSFLAGS"])
        assert_equal("$(inherited)" + test_flag, twiceProcessed_config.build_settings["OTHER_CPLUSPLUSFLAGS"])
    end

    def test_add_flag_to_map_with_inheritance_whenUsedWithXCConfigAttributes
        # Arrange
        empty_xcconfig = XCConfigMock.new("EmptyConfig")
        initialized_xcconfig = XCConfigMock.new("InitializedConfig", attributes: {
            "OTHER_CPLUSPLUSFLAGS" => "INIT_FLAG"
        })
        twiceProcessed_xcconfig = XCConfigMock.new("TwiceProcessedConfig");
        test_flag = " -DTEST_FLAG=1"

        # Act
        ReactNativePodsUtils.add_flag_to_map_with_inheritance(empty_xcconfig.attributes, "OTHER_CPLUSPLUSFLAGS", test_flag)
        ReactNativePodsUtils.add_flag_to_map_with_inheritance(initialized_xcconfig.attributes, "OTHER_CPLUSPLUSFLAGS", test_flag)
        ReactNativePodsUtils.add_flag_to_map_with_inheritance(twiceProcessed_xcconfig.attributes, "OTHER_CPLUSPLUSFLAGS", test_flag)
        ReactNativePodsUtils.add_flag_to_map_with_inheritance(twiceProcessed_xcconfig.attributes, "OTHER_CPLUSPLUSFLAGS", test_flag)

        # Assert
        assert_equal("$(inherited)" + test_flag, empty_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"])
        assert_equal("$(inherited) INIT_FLAG" + test_flag, initialized_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"])
        assert_equal("$(inherited)" + test_flag, twiceProcessed_xcconfig.attributes["OTHER_CPLUSPLUSFLAGS"])
    end

    def test_add_ndebug_flag_to_pods_in_release
        # Arrange
        xcconfig = XCConfigMock.new("Config")
        default_debug_config = BuildConfigurationMock.new("Debug")
        default_release_config = BuildConfigurationMock.new("Release")
        custom_debug_config1 = BuildConfigurationMock.new("CustomDebug")
        custom_debug_config2 = BuildConfigurationMock.new("Custom")
        custom_release_config1 = BuildConfigurationMock.new("CustomRelease")
        custom_release_config2 = BuildConfigurationMock.new("Production")

        installer = prepare_installer_for_cpp_flags(
            [ xcconfig ],
            {
                "Default" => [ default_debug_config, default_release_config ],
                "Custom1" => [ custom_debug_config1, custom_release_config1 ],
                "Custom2" => [ custom_debug_config2, custom_release_config2 ]
            }
        )
        # Act
        ReactNativePodsUtils.add_ndebug_flag_to_pods_in_release(installer)

        # Assert
        assert_equal(nil, default_debug_config.build_settings["OTHER_CPLUSPLUSFLAGS"])
        assert_equal("$(inherited) -DNDEBUG", default_release_config.build_settings["OTHER_CPLUSPLUSFLAGS"])
        assert_equal(nil, custom_debug_config1.build_settings["OTHER_CPLUSPLUSFLAGS"])
        assert_equal("$(inherited) -DNDEBUG", custom_release_config1.build_settings["OTHER_CPLUSPLUSFLAGS"])
        assert_equal(nil, custom_debug_config2.build_settings["OTHER_CPLUSPLUSFLAGS"])
        assert_equal("$(inherited) -DNDEBUG", custom_release_config2.build_settings["OTHER_CPLUSPLUSFLAGS"])
    end
end

# ===== #
# UTILS #
# ===== #

def prepare_empty_user_project_mock
    return UserProjectMock.new("/a/path", [
        BuildConfigurationMock.new("Debug"),
        BuildConfigurationMock.new("Release"),
    ])
end

def prepare_user_project_mock_with_plists
    return UserProjectMock.new(:files => [
        PBXFileRefMock.new("Info.plist"),
        PBXFileRefMock.new("Extension-Info.plist"),
    ])
end

def prepare_config(config_name, extra_config = {})
    config = {"LIBRARY_SEARCH_PATHS" => [
        "$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)",
        "\"$(TOOLCHAIN_DIR)/usr/lib/swift-5.0/$(PLATFORM_NAME)\"",
        "another/path",
    ]}.merge(extra_config)

    return BuildConfigurationMock.new(config_name, config)
end

def prepare_target(name, product_type = nil, dependencies = [])
  return TargetMock.new(name, [
      prepare_config("Debug"),
      prepare_config("Release")
  ], product_type, dependencies)
end

def prepare_Code_Signing_build_configuration(name, param)
    return BuildConfigurationMock.new(name, {
        "CODE_SIGNING_ALLOWED" => param
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
