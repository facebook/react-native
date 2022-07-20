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

    def initialize(pods_project = PodsProjectMock.new)
        @pods_project = pods_project
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

class TargetMock
    attr_reader :name
    attr_reader :build_configurations

    def initialize(name, build_configurations = [])
        @name = name
        @build_configurations = build_configurations
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
