# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"

class DummyTest4 < Test::Unit::TestCase
    def test_div
        assert_equal(5, 10/2)
    end
end
