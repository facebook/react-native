# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class Open3
    @@collected_commands = []
    @@collected_dirs = []

    @@returned_text = ""
    @@returned_status = 0

    def self.capture2e(command, chdir: ".")
        @@collected_commands.push(command)
        @@collected_dirs.push(chdir)

        return [*@@returned_text, @@returned_status]
    end

    def self.collected_commands
        return @@collected_commands
    end

    def self.collected_dirs
        return @@collected_dirs
    end

    def self.set_returned_text(text)
        @@returned_text = text
    end

    def self.set_returned_status(status)
        @@returned_status = status
    end

    def self.reset()
        @@collected_commands = []
        @@collected_dirs = []

        @@returned_text = ""
        @@returned_status = 0
    end
end
