# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../jsengine.rb"
require_relative "./test_utils/podSpy.rb"
require_relative "./test_utils/PodMock.rb"
require_relative "./test_utils/Open3Mock.rb"

class JSEngineTests < Test::Unit::TestCase

    :react_native_path

    def setup
        File.enable_testing_mode!
        @react_native_path = "../.."
        podSpy_cleanUp()

    end

    def teardown
        ENV['HERMES_ENGINE_TARBALL_PATH'] = nil
        Open3.reset()
        Pod::Config.reset()
        Pod::UI.reset()
        podSpy_cleanUp()
        ENV['USE_HERMES'] = '1'
        ENV['CI'] = nil
        File.reset()
    end

    # =============== #
    # TEST - setupJsc #
    # =============== #
    def test_setupJsc_installsPods
        # Arrange
        fabric_enabled = false

        # Act
        setup_jsc!(:react_native_path => @react_native_path, :fabric_enabled => fabric_enabled)

        # Assert
        assert_equal($podInvocationCount, 2)
        assert_equal($podInvocation["React-jsi"][:path], "../../ReactCommon/jsi")
        assert_equal($podInvocation["React-jsc"][:path], "../../ReactCommon/jsc")
    end

    def test_setupJsc_installsPods_installsFabricSubspecWhenFabricEnabled
        # Arrange
        fabric_enabled = true

        # Act
        setup_jsc!(:react_native_path => @react_native_path, :fabric_enabled => fabric_enabled)

        # Assert
        assert_equal($podInvocationCount, 3)
        assert_equal($podInvocation["React-jsi"][:path], "../../ReactCommon/jsi")
        assert_equal($podInvocation["React-jsc"][:path], "../../ReactCommon/jsc")
        assert_equal($podInvocation["React-jsc/Fabric"][:path], "../../ReactCommon/jsc")
    end

    # ================== #
    # TEST - setupHermes #
    # ================== #
    def test_setupHermes_whenHermesScriptFails_abort
        # Arrange
        fabric_enabled = false
        Pod::Config.instance.installation_root.set_installation_root("Pods/")
        Open3.set_returned_status(1)
        Open3.set_returned_text("This test\nshould fail")

        # Act
        assert_raises {
            setup_hermes!(:react_native_path => @react_native_path, :fabric_enabled => fabric_enabled)
        }

        # Assert
        assert_equal(Open3.collected_commands, ["node scripts/hermes/prepare-hermes-for-build"])
        assert_equal(Open3.collected_dirs, ["Pods/../.."])
        assert_equal(Pod::UI.collected_infoes, ["This test", "should fail"])
        assert_equal($podInvocationCount, 0)
        assert_equal($podInvocation, {})
    end

    def test_setupHermes_whenHermesScriptSucceeds_installsPods
        # Arrange
        fabric_enabled = false
        Pod::Config.instance.installation_root.set_installation_root("Pods/")
        Open3.set_returned_status(0)
        Open3.set_returned_text("This is\nthe text\nreturned by\nprepare-hermes-for-build")

        # Act
        setup_hermes!(:react_native_path => @react_native_path, :fabric_enabled => fabric_enabled)

        # Assert
        assert_equal(Open3.collected_commands, ["node scripts/hermes/prepare-hermes-for-build"])
        assert_equal(Open3.collected_dirs, ["Pods/../.."])
        assert_equal(Pod::UI.collected_infoes, [
            "This is",
            "the text",
            "returned by",
            "prepare-hermes-for-build",
        ])
        assert_equal($podInvocationCount, 4)
        assert_equal($podInvocation["React-jsi"][:path], "../../ReactCommon/jsi")
        assert_equal($podInvocation["React-hermes"][:path], "../../ReactCommon/hermes")
        assert_equal($podInvocation["libevent"][:version], "~> 2.1.12")
        assert_equal($podInvocation["hermes-engine"][:podspec], "../../sdks/hermes/hermes-engine.podspec")
    end

    def test_setupHermes_installsPods_installsFabricSubspecWhenFabricEnabled
        # Arrange
        fabric_enabled = true

        # Act
        setup_hermes!(:react_native_path => @react_native_path, :fabric_enabled => fabric_enabled)

        # Assert
        assert_equal($podInvocationCount, 4)
        assert_equal($podInvocation["React-jsi"][:path], "../../ReactCommon/jsi")
        assert_equal($podInvocation["hermes-engine"][:podspec], "../../sdks/hermes/hermes-engine.podspec")
        assert_equal($podInvocation["React-hermes"][:path], "../../ReactCommon/hermes")
        assert_equal($podInvocation["libevent"][:version], "~> 2.1.12")
    end

end
