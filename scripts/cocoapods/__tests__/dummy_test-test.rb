# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"

class DummyTest < Test::Unit::TestCase
    def test_add
        assert_equal(5, 2+3)
    end
end
