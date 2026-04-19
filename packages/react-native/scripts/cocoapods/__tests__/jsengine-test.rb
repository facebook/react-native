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
        @react_native_path = "../.."
        podSpy_cleanUp()

    end

    def teardown
        ENV['HERMES_ENGINE_TARBALL_PATH'] = nil
        ENV['USE_THIRD_PARTY_JSC'] = nil
        Open3.reset()
        Pod::Config.reset()
        Pod::UI.reset()
        podSpy_cleanUp()
        ENV['CI'] = nil
    end

    # ================== #
    # TEST - setupHermes #
    # ================== #
    def test_setupHermes_installsPods
        # Act
        setup_hermes!(:react_native_path => @react_native_path)

        # Assert
        assert_equal(2, $podInvocationCount)
        hermes_engine_pod_invocation = $podInvocation["hermes-engine"]
        assert_equal("../../sdks/hermes-engine/hermes-engine.podspec", hermes_engine_pod_invocation[:podspec])
        assert_equal("", hermes_engine_pod_invocation[:tag])
        assert_equal("../../ReactCommon/hermes", $podInvocation["React-hermes"][:path])
    end

end
