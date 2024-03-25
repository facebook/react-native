# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class XcodebuildMock < Xcodebuild
    @@version = ""
    @@version_invocation_count = 0

    def self.set_version=(v)
      @@version = v
    end

    def self.version
        @@version_invocation_count += 1
        @@version
    end

    def self.version_invocation_count
        @@version_invocation_count
    end

    def self.reset()
        @@version_invocation_count = 0
    end
end
