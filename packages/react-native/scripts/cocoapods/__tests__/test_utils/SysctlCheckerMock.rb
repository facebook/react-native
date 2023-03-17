# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Mock object for SysctlChecker
class SysctlChecker
    @@call_sysctl_arm64_return_value = 1

    def call_sysctl_arm64
        return @@call_sysctl_arm64_return_value
    end

    def self.set_call_sysctl_arm64_return_value(newValue)
        @@call_sysctl_arm64_return_value = newValue
    end

    def self.reset()
        @@call_sysctl_arm64_return_value = 1
    end
end
