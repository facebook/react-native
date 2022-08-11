# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class Finder
    @@captured_paths = []
    @@files_for_paths = {}


    def self.find_codegen_file(path)
        @@captured_paths.push(path)
        return @@files_for_paths[path]
    end

    def self.set_files_for_paths(files_for_paths)
        @@files_for_paths = files_for_paths
    end

    def self.captured_paths
        return @@captured_paths
    end

    def self.reset()
        @@captured_paths = []
        @@files_for_paths = {}
    end
end
