# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class AutolinkingUtils

    def self.nested_path_exists?(object, *path)
        path.reduce(object) do |obj, method|
            return false unless obj.respond_to?(method)
            obj.public_send(method)
        end
        return true
    end

    def self.is_platform_supported?(current_target_definition, spec)
        platform = current_target_definition.platform
        if !platform
            # Historically we've supported platforms that aren't specifically excluded.
            return true
        end
        return spec.supported_on_platform?(platform.name)
    end

end
