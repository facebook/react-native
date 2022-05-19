# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "cocoapods"

def set_clang_cxx_language_standard_if_needed(installer)
    language_standard = nil

    installer.pods_project.targets.each do |target|
        if target.name == 'React-Core'
            language_standard = target.common_resolved_build_setting("CLANG_CXX_LANGUAGE_STANDARD", resolve_against_xcconfig: true)
        end
    end

    unless language_standard.nil?
        projects = installer.aggregate_targets
            .map{ |t| t.user_project }
            .uniq{ |p| p.path }

        projects.each do |project|
            Pod::UI.puts("Setting CLANG_CXX_LANGUAGE_STANDARD to #{ language_standard } on #{ project.path }")

            project.build_configurations.each do |config|
                config.build_settings["CLANG_CXX_LANGUAGE_STANDARD"] = language_standard
            end

            project.save()
        end
    end
end
