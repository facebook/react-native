# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

module Pod
    class Config
        @@instance = Config.new()

        attr_reader :installation_root

        def initialize()
            @installation_root = InstallationRootMock.new()
        end

        def self.instance()
            return @@instance
        end

        def self.reset()
            @@instance = Config.new()
        end
    end

    class InstallationRootMock

        attr_accessor :relative_path_from
        attr_accessor :installation_root

        attr_reader :relative_path_from_invocation_count
        attr_reader :installation_root_invocation_count

        def initialize()
            @relative_path_from = ""
            @installation_root = ""
            @relative_path_from_invocation_count = 0
            @installation_root_invocation_count = 0
        end

        def relative_path_from(path)
            @relative_path_from_invocation_count += 1
            return @relative_path_from
        end

        def installation_root(root)
            @installation_root_invocation_count += 1
            return @installation_root
        end

        def set_installation_root(root)
            @installation_root = root
        end

        def join(path)
            return @installation_root + path
        end

    end

    class UI

        @@collected_infoes = []
        @@collected_messages = []
        @@collected_warns = []

        def self.puts(message)
            @@collected_messages.push(message)
        end

        def self.warn(warn)
            @@collected_warns.push(warn)
        end

        def self.info(info)
            @@collected_infoes.push(info)
        end

        def self.collected_messages()
            return @@collected_messages
        end

        def self.collected_warns()
            return @@collected_warns
        end

        def self.collected_infoes()
            return @@collected_infoes
        end

        def self.reset()
            @@collected_messages = []
            @@collected_warns = []
            @@collected_infoes = []
        end
    end

    class Executable
        @@executed_commands = []

        def self.execute_command(command, arguments)
            @@executed_commands.push({
                "command" => command,
                "arguments" => arguments
            })
        end

        def self.executed_commands
            return @@executed_commands
        end

        def self.reset()
            @@executed_commands = []
        end
    end

    class Specification
        @@specs_from_file = {}

        def self.specs_from_file(specs)
            @@specs_from_file = specs
        end

        def self.from_file(path)
            return @@specs_from_file[path]
        end

        def reset()
            @@specs_from_file = {}
        end
    end

    class PodSpecMock
        attr_reader :version

        def initialize(version: "0.0.1")
            @version = version
        end
    end

    class Lockfile
        def initialize()
        end
    end
end
