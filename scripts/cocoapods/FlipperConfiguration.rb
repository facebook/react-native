# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Helper class to configure flipper
class FlipperConfiguration
    attr_reader :flipper_enabled
    attr_reader :configurations
    attr_reader :versions

    def initialize(flipper_enabled, configurations, versions)
        @flipper_enabled = flipper_enabled
        @configurations = configurations
        @versions = versions
    end

    def self.enabled(configurations = ["Debug"], versions = {})
        FlipperConfiguration.new(true, configurations, versions)
    end

    def self.disabled
        FlipperConfiguration.new(false, [], {})
    end

    def == (other)
        return @flipper_enabled == other.flipper_enabled &&
            @configurations == other.configurations &&
            @versions == other.versions
    end
  end
