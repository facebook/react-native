# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../hermes.rb"
require_relative "./test_utils/podSpy.rb"
require_relative "./test_utils/PodMock.rb"
require_relative "./test_utils/Open3Mock.rb"

class HermesTests < Test::Unit::TestCase

    :prefix

    def setup
        @prefix = "../.."
    end

    def teardown
        Open3.reset()
        Pod::Config.reset()
        Pod::UI.reset()
        podSpy_cleanUp()
    end

    def test_installHermesIfEnabled_whenHermesIsDisabled_doesNothing
        # Arrange

        # Act
        install_hermes_if_enabled(false, @prefix)

        # Assert
        assert_equal($podInvocationCount, 0)
        assert_equal($podInvocation, {})
        assert_equal(Pod::UI.collected_infoes, [])
        assert_equal(Open3.collected_commands, [])
        assert_equal(Open3.collected_dirs, [])
    end

    def test_installHermesIfEnabled_whenHermesIsEnabledAndHermesScriptFails_abort
        # Arrange
        Pod::Config.instance.installation_root.set_installation_root("Pods/")
        Open3.set_returned_status(1)
        Open3.set_returned_text("This test\nshould fail")

        # Act
        assert_raises {
            install_hermes_if_enabled(true, @prefix)
        }

        # Assert
        assert_equal(Open3.collected_commands, ["node scripts/hermes/prepare-hermes-for-build"])
        assert_equal(Open3.collected_dirs, ["Pods/../.."])
        assert_equal(Pod::UI.collected_infoes, ["This test", "should fail"])
        assert_equal($podInvocationCount, 0)
        assert_equal($podInvocation, {})
    end

    def test_installHermesIfEnabled_whenHermesIsEnabledAndHermesScriptSucceeds_installsPods
        # Arrange
        Pod::Config.instance.installation_root.set_installation_root("Pods/")
        Open3.set_returned_status(0)
        Open3.set_returned_text("This is\nthe text\nreturned by\nprepare-hermes-for-build")

        # Act
        install_hermes_if_enabled(true, @prefix)

        # Assert
        assert_equal(Open3.collected_commands, ["node scripts/hermes/prepare-hermes-for-build"])
        assert_equal(Open3.collected_dirs, ["Pods/../.."])
        assert_equal(Pod::UI.collected_infoes, [
            "This is",
            "the text",
            "returned by",
            "prepare-hermes-for-build",
        ])
        assert_equal($podInvocationCount, 3)
        assert_equal($podInvocation["React-hermes"][:path], "../../ReactCommon/hermes")
        assert_equal($podInvocation["libevent"][:version], "~> 2.1.12")
        assert_equal($podInvocation["hermes-engine"][:podspec], "../../sdks/hermes/hermes-engine.podspec")
    end


end
