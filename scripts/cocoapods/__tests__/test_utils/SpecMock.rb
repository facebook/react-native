# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class SpecMock

    attr_accessor :compiler_flags
    attr_accessor :pod_target_xcconfig
    attr_reader :dependencies

    def initialize
        @compiler_flags = ""
        @pod_target_xcconfig = Hash.new
        @dependencies = []
    end

    def dependency(dependency_name)
        @dependencies.push(dependency_name)
    end

    def to_hash
        return {
            "compiler_flags" => @compiler_flags,
            "pod_target_xcconfig" => @pod_target_xcconfig,
        }
    end
end
