# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class Dir

    @@is_testing = false
    @@exist_invocation_params = []
    @@mocked_existing_dirs = []

    # Monkey patched exists? method.
    # It is used also by the test runner, so it can't start monkey patched
    # To use this, invoke the `is_testing` method before starting your test.
    # Remember to invoke `reset` after the test.
    def self.exist?(path)
        if !@@is_testing
            return exists?(path)
        end

        @@exist_invocation_params.push(path)
        return @@mocked_existing_dirs.include?(path)
    end

    # Getter for the `exist_invocation_params` to check that the exist method
    # is invoked with the right parameters
    def self.exist_invocation_params()
        return @@exist_invocation_params
    end

    # Set the list of dirs the test must return as existing
    def self.mocked_existing_dirs(dirs)
        @@mocked_existing_dirs = dirs
    end

    # Turn on the mocking features of the File mock
    def self.enable_testing_mode!()
        @@is_testing = true
    end

    # Resets all the settings for the File mock
    def self.reset()
        @@mocked_existing_dirs = []
        @@is_testing = false
        @@exist_invocation_params = []
    end
end
