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
        # Arrange
        configurations = ['Debug']

        # Act
        use_flipper_pods()

        # Assert
        check_all_flipper_pods($flipper_default_versions, configurations)
        # the number of times the `pod` function has been invoked to install a dependency
        assert_equal($podInvocationCount, 21)
    end

    def test_UseFlipperPods_WithCustomValues_InstallsPods
        # Arrange
        versions = {
            "Flipper" => "1.0.0",
            "Flipper-Boost-iOSX" => "1.1.0",
            "Flipper-DoubleConversion" => "1.1.1",
            "Flipper-Fmt" => "1.2.1",
            "Flipper-Folly" => "2.1.1",
            "Flipper-Glog" => "0.1.2",
            "Flipper-PeerTalk" => "0.0.1",
            "OpenSSL-Universal" => "2.2.2200",
        }
        configurations = ['Debug', 'CI']

        # Act
        use_flipper_pods(versions, :configurations => configurations)

        # Assert
        check_all_flipper_pods(versions, configurations)
        # the number of times the `pod` function has been invoked to install a dependency
        assert_equal($podInvocationCount, 21)
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

        reactCore_target = installer.target_with_name("React-RCTAppDelegate")
        reactCore_target.build_configurations.each do |config|
            if config.name == 'Debug' || config.name == 'CustomConfig' then
                assert_equal(config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'], ['$(inherited)', 'FB_SONARKIT_ENABLED=1'])
            else
                assert_true(config.build_settings.empty?)
            end
        end
    end

    # ======= #
    # HELPERS #
    # ======= #

    def check_all_flipper_pods(versions, configurations)
        check_flipper_pod('Flipper', versions['Flipper'], configurations)
        check_flipper_pod('FlipperKit', versions['Flipper'], configurations)
        check_flipper_pod('FlipperKit/FlipperKitLayoutPlugin', versions['Flipper'], configurations)
        check_flipper_pod('FlipperKit/SKIOSNetworkPlugin', versions['Flipper'], configurations)
        check_flipper_pod('FlipperKit/FlipperKitUserDefaultsPlugin', versions['Flipper'], configurations)
        check_flipper_pod('FlipperKit/FlipperKitReactPlugin', versions['Flipper'], configurations)
        check_flipper_pod('FlipperKit/Core', versions['Flipper'], configurations)
        check_flipper_pod('FlipperKit/CppBridge', versions['Flipper'], configurations)
        check_flipper_pod('FlipperKit/FBCxxFollyDynamicConvert', versions['Flipper'], configurations)
        check_flipper_pod('FlipperKit/FBDefines', versions['Flipper'], configurations)
        check_flipper_pod('FlipperKit/FKPortForwarding', versions['Flipper'], configurations)
        check_flipper_pod('FlipperKit/FlipperKitHighlightOverlay', versions['Flipper'], configurations)
        check_flipper_pod('FlipperKit/FlipperKitLayoutTextSearchable', versions['Flipper'], configurations)
        check_flipper_pod('FlipperKit/FlipperKitNetworkPlugin', versions['Flipper'], configurations)
        check_flipper_pod('Flipper-Boost-iOSX', versions['Flipper-Boost-iOSX'], configurations)
        check_flipper_pod('Flipper-DoubleConversion', versions['Flipper-DoubleConversion'], configurations)
        check_flipper_pod('Flipper-Fmt', versions['Flipper-Fmt'], configurations)
        check_flipper_pod('Flipper-Folly', versions['Flipper-Folly'], configurations)
        check_flipper_pod('Flipper-Glog', versions['Flipper-Glog'], configurations)
        check_flipper_pod('Flipper-PeerTalk', versions['Flipper-PeerTalk'], configurations)
        check_flipper_pod('OpenSSL-Universal', versions['OpenSSL-Universal'], configurations)
    end

    def check_flipper_pod(name, expectedVersion, expectedConfigurations)
        params = $podInvocation[name]
        assert_equal(params[:version], expectedVersion)
        assert_equal(params[:configurations], expectedConfigurations)
    end

    def prepare_mocked_installer
        return InstallerMock.new(
            PodsProjectMock.new([
                    TargetMock.new(
                        "YogaKit",
                        [
                            BuildConfigurationMock.new("Debug", is_debug: true),
                            BuildConfigurationMock.new("Release", is_debug: false),
                            BuildConfigurationMock.new("CustomConfig", is_debug: true),
                        ]
                    ),
                    TargetMock.new(
                        "React-Core",
                        [
                            BuildConfigurationMock.new("Debug", is_debug: true),
                            BuildConfigurationMock.new("Release", is_debug: false),
                            BuildConfigurationMock.new("CustomConfig", is_debug: true),
                        ]
                    ),
                    TargetMock.new(
                        "React-RCTAppDelegate",
                        [
                            BuildConfigurationMock.new("Debug", is_debug: true),
                            BuildConfigurationMock.new("Release", is_debug: false),
                            BuildConfigurationMock.new("CustomConfig", is_debug: true),
                        ]
                    )
                ]
            )
        )
    end

end
