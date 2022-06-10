# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../utils.rb"
require_relative "../flipper.rb"
require_relative "./test_utils/PodMock.rb"
require_relative "./test_utils/InstallerMock.rb"
require_relative "./test_utils/EnvironmentMock.rb"
require_relative "./test_utils/SysctlCheckerMock.rb"

class UtilsTests < Test::Unit::TestCase
    def teardown
        Pod::UI.reset()
        SysctlChecker.reset()
        Environment.reset()
        ENV['RCT_NEW_ARCH_ENABLED'] = '0'
        ENV['USE_HERMES'] = '0'
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
        ENV['USE_HERMES'] = '0'
        # Act
        flags = ReactNativePodsUtils.get_default_flags()

        # Assert
        assert_equal(flags, {
            :fabric_enabled => false,
            :hermes_enabled => false,
            :flipper_configuration => FlipperConfiguration.disabled
        })
    end

    def test_getDefaultFlag_whenOldArchitectureButHermesEnabled()
        # Arrange
        ENV['RCT_NEW_ARCH_ENABLED'] = '0'
        ENV['USE_HERMES'] = '1'

        # Act
        flags = ReactNativePodsUtils.get_default_flags()

        # Assert
        assert_equal(flags, {
            :fabric_enabled => false,
            :hermes_enabled => true,
            :flipper_configuration => FlipperConfiguration.disabled
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
            :flipper_configuration => FlipperConfiguration.disabled
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

    # ============================ #
    # Test - Exclude Architectures #
    # ============================ #
    def test_excludeArchitectures_whenHermesEngineIsNotIncluded_excludeNothing
        # Arrange
        user_project_mock = UserProjectMock.new("a/path", [
            BuildConfigurationMock.new("Debug"),
            BuildConfigurationMock.new("Release"),
        ])
        installer = InstallerMock.new(PodsProjectMock.new(), [
            AggregatedProjectMock.new(user_project_mock)
        ])

        # Act
        ReactNativePodsUtils.exclude_i386_architecture_while_using_hermes(installer)

        # Assert
        user_project_mock.build_configurations.each do |config|
            assert_equal(config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"], "")
        end

    end

    def test_excludeArchitectures_whenHermesEngineIsIncluded_excludeI386
        # Arrange
        user_project_mock = UserProjectMock.new("a/path", [
            BuildConfigurationMock.new("Debug"),
            BuildConfigurationMock.new("Release"),
        ])
        installer = InstallerMock.new(PodsProjectMock.new([], {"hermes-engine" => {}}), [
            AggregatedProjectMock.new(user_project_mock)
        ])

        # Act
        ReactNativePodsUtils.exclude_i386_architecture_while_using_hermes(installer)

        # Assert
        user_project_mock.build_configurations.each do |config|
            assert_equal(config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"], "i386")
        end
    end

end
