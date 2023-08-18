# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

module LocalPodspecPatch
    def self.mock_local_podspecs(pods)
        @@local_podspecs = pods
    end

    def reset()
        @@local_podspecs = []
    end
end
