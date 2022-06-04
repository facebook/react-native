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
        attr_reader :relative_path_from_invocation_count

        def initialize()
            @relative_path_from = ""
            @relative_path_from_invocation_count = 0
        end

        def relative_path_from(path)
            @relative_path_from_invocation_count += 1
            return @relative_path_from
        end
    end

    class UI

        @@collected_messages = []

        def self.puts(message)
            @@collected_messages.push(message)
        end

        def self.collected_messages()
            return @@collected_messages
        end

        def self.reset()
            @@collected_messages = []
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
end
