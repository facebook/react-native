# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


# This file replicate the structure of the Installer used Cocoapods in the post_install step.
#
# To use it, add `require_relative path/to/InstallerMock.rb` into your test file
#
# ## Initialization
# You can create a new mock with the `InstallerMock.new` statement. In this case, you will
# create an empty mock.
#
# It's possible to create complex with the initializer. To create an Installer with a pod, for example, we can
# use the following code:
#
# ```ruby
# installer = Installer.new(
#   PodsProjectMock.new([
#     TargetMock.new(
#       "MyPod",
#       [
#         BuildConfigurationMock.new("Debug"),
#       ]
#     )
#   )
# )
# ```
#
# ## Assert
# All the properties of these objects are accessible in read mode.
# To access the target's list, for example, you can use the following line:
#
# ```ruby
# targets = installer.pods_project.targets
# ```

class InstallerMock
    attr_reader :pods_project
    attr_reader :aggregate_targets

    def initialize(pods_project = PodsProjectMock.new, aggregate_targets = [AggregatedProjectMock.new])
        @pods_project = pods_project
        @aggregate_targets = aggregate_targets
    end

    def target_with_name(name)
        return @pods_project.targets
            .select { |target| target.name == name }
            .first
    end
end

class PodsProjectMock
    attr_reader :targets

    def initialize(targets = [])
        @targets = targets
    end
end

class AggregatedProjectMock
    attr_reader :user_project

    def initialize(user_project = UserProjectMock.new)
        @user_project = user_project
    end
end

class UserProjectMock
    attr_reader :path
    attr_reader :build_configurations

    def initialize(path = "/test/path.xcproj", build_configurations = [])
        @path = path
        @build_configurations = build_configurations
    end

    def save()
    end
end

ReceivedCommonResolvedBuildSettings = Struct.new(:key, :resolve_against_xcconfig)

class TargetMock
    attr_reader :name
    attr_reader :build_configurations

    attr_reader :received_common_resolved_build_setting_parameters

    def initialize(name, build_configurations = [])
        @name = name
        @build_configurations = build_configurations
        @received_common_resolved_build_setting_parameters = []
    end

    def common_resolved_build_setting(key, resolve_against_xcconfig: false)
        received_common_resolved_build_setting_parameters.append(ReceivedCommonResolvedBuildSettings.new(key, resolve_against_xcconfig))

        return build_configurations[0].build_settings[key]
    end
end

class BuildConfigurationMock
    attr_reader :name
    attr_reader :build_settings

    def initialize(name, build_settings = {})
        @name = name
        @build_settings = build_settings
    end
end
