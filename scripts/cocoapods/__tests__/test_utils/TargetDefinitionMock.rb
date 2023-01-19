# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class TargetDefinitionMock
    attr_reader :build_type

    def initialize(build_type)
        @build_type = build_type
    end
end
