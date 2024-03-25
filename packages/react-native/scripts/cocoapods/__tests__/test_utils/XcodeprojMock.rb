# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

module Xcodeproj
    class Plist
        @@path_to_file_mapping = Hash.new
        def self.read_from_path(path)
            return @@path_to_file_mapping[path]
        end

        def self.write_to_path(hash, path)
            @@path_to_file_mapping[path] = hash
        end

        def self.reset()
            @@path_to_file_mapping.clear
        end
  end
end
