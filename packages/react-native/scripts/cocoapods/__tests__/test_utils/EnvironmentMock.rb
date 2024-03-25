# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Mock object for the Environment
class Environment
    @@RUBY_PLATFORM = "arm64-darwin21"

    def ruby_platform
        return @@RUBY_PLATFORM
    end

    def self.set_ruby_platform(newPlatform)
        @@RUBY_PLATFORM = newPlatform
    end

    def self.reset()
        @@RUBY_PLATFORM = "arm64-darwin21"
    end
end
