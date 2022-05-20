# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../flipper.rb"
require_relative "./test_utils/podSpy.rb"
require_relative "./test_utils/InstallerMock.rb"

class FlipperTests < Test::Unit::TestCase
    def setup
        podSpy_cleanUp()
    end

    # =========================== #
    # TEST - Install Dependencies #
    # =========================== #
    def test_installFlipperDependencies_installDependencies
        # Act
        install_flipper_dependencies('../..')

        # Assert
        assert_equal($podInvocationCount, 1)
        assert_equal($podInvocation['React-Core/DevSupport'][:path], "../../" )
    end

    # ======================= #
    # TEST - Use Flipper Pods #
    # ======================= #

    def test_UseFlipperPods_WithDefaultValues_InstallsPods
        # Act
        use_flipper_pods()

        # Assert
        check_all_flipper_pods($flipper_default_versions)
        # the number of times the `pod` function has been invoked to install a dependency
        assert_equal($podInvocationCount, 22)
    end

    # ================= #
    # Test Post Install #
    # ================= #

    def test_postInstall_updatesThePodCorrectly
        # Arrange
        installer = prepare_mocked_installer

        # Act
        flipper_post_install(installer)

        # Assert
        yoga_target = installer.target_with_name("YogaKit")
        yoga_target.build_configurations.each do |config|
            assert_equal(config.build_settings['SWIFT_VERSION'], '4.1')
        end

        reactCore_target = installer.target_with_name("React-Core")
        reactCore_target.build_configurations.each do |config|
            if config.name == 'Debug' then
                assert_equal(config.build_settings['OTHER_CFLAGS'], "$(inherited) -DFB_SONARKIT_ENABLED=1")
            else
                assert_true(config.build_settings.empty?)
            end
        end
    end

    # ======= #
    # HELPERS #
    # ======= #

    def check_all_flipper_pods(versions)
        check_flipper_pod('Flipper', versions['Flipper'])
        check_flipper_pod('FlipperKit', versions['Flipper'])
        check_flipper_pod('FlipperKit/FlipperKitLayoutPlugin', versions['Flipper'])
        check_flipper_pod('FlipperKit/SKIOSNetworkPlugin', versions['Flipper'])
        check_flipper_pod('FlipperKit/FlipperKitUserDefaultsPlugin', versions['Flipper'])
        check_flipper_pod('FlipperKit/FlipperKitReactPlugin', versions['Flipper'])
        check_flipper_pod('FlipperKit/Core', versions['Flipper'])
        check_flipper_pod('FlipperKit/CppBridge', versions['Flipper'])
        check_flipper_pod('FlipperKit/FBCxxFollyDynamicConvert', versions['Flipper'])
        check_flipper_pod('FlipperKit/FBDefines', versions['Flipper'])
        check_flipper_pod('FlipperKit/FKPortForwarding', versions['Flipper'])
        check_flipper_pod('FlipperKit/FlipperKitHighlightOverlay', versions['Flipper'])
        check_flipper_pod('FlipperKit/FlipperKitLayoutTextSearchable', versions['Flipper'])
        check_flipper_pod('FlipperKit/FlipperKitNetworkPlugin', versions['Flipper'])
        check_flipper_pod('Flipper-Boost-iOSX', versions['Flipper-Boost-iOSX'])
        check_flipper_pod('Flipper-DoubleConversion', versions['Flipper-DoubleConversion'])
        check_flipper_pod('Flipper-Fmt', versions['Flipper-Fmt'])
        check_flipper_pod('Flipper-Folly', versions['Flipper-Folly'])
        check_flipper_pod('Flipper-Glog', versions['Flipper-Glog'])
        check_flipper_pod('Flipper-PeerTalk', versions['Flipper-PeerTalk'])
        check_flipper_pod('Flipper-RSocket', versions['Flipper-RSocket'])
        check_flipper_pod('OpenSSL-Universal', versions['OpenSSL-Universal'])
    end

    def check_flipper_pod(name, expectedVersion)
        params = $podInvocation[name]
        assert_equal(params[:version], expectedVersion)
    end

    def prepare_mocked_installer
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
                            BuildConfigurationMock.new("Debug"),
                            BuildConfigurationMock.new("Release"),
                        ]
                    )
                ]
            )
        )
    end

end
