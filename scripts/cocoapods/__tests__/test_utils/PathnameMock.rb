# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class Pathname
    @@pwd = ""
    @@pwd_invocation_count = 0

    def self.pwd!(pwd)
        @@pwd = pwd
    end

    def self.pwd()
        @@pwd_invocation_count += 1
        return @@pwd
    end

    def self.pwd_invocation_count
        return @@pwd_invocation_count
    end


    def self.reset()
        @@pwd = ""
        @@pwd_invocation_count = 0
    end
end
