# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require_relative './DirMock.rb'

module FileUtils
    class FileUtilsStorage
        @@RMRF_INVOCATION_COUNT = 0
        @@RMRF_PATHS = []

        def self.rmrf_invocation_count
            return @@RMRF_INVOCATION_COUNT
        end

        def self.increase_rmrfi_invocation_count
            @@RMRF_INVOCATION_COUNT += 1
        end

        def self.rmrf_paths
            return @@RMRF_PATHS
        end

        def self.push_rmrf_path(path)
            @@RMRF_PATHS.push(path)
        end

        def self.reset
            @@RMRF_INVOCATION_COUNT = 0
            @@RMRF_PATHS = []
        end
    end

    def self.rm_rf(path)
        FileUtilsStorage.push_rmrf_path(path)
        FileUtilsStorage.increase_rmrfi_invocation_count
        DirMock.remove_mocked_paths(path)
    end
end
