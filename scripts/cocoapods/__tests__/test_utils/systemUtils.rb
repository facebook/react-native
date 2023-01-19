# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

$collected_commands = []

def system(command)
    $collected_commands.push(command)
end

def system_reset_commands()
    $collected_commands = []
end
