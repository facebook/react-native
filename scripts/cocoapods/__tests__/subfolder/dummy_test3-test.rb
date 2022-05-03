# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"

class DummyTest3 < Test::Unit::TestCase
    def test_mul
        assert_equal(12, 3*4)
    end
end
