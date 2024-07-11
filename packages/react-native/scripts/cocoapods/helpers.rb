# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Helper object to wrap the invocation of sysctl
# This makes it easier to mock the behaviour in tests
class SysctlChecker
    def call_sysctl_arm64
        return `/usr/sbin/sysctl -n hw.optional.arm64 2>&1`.to_i
    end
end

# Helper class that is used to easily send commands to Xcodebuild
# And that can be subclassed for testing purposes.
class Xcodebuild
    def self.version
        `xcodebuild -version`
    end
end

# Helper object to wrap system properties like RUBY_PLATFORM
# This makes it easier to mock the behaviour in tests
class Environment
    def ruby_platform
        return RUBY_PLATFORM
    end
end

class Finder
    def self.find_codegen_file(path)
        js_files = '-name "Native*.js" -or -name "*NativeComponent.js"'
        ts_files = '-name "Native*.ts" -or -name "*NativeComponent.ts"'
        return `find #{path} -type f \\( #{js_files} -or #{ts_files} \\)`.split("\n").sort()
    end
end

module Helpers
    class Constants
        def self.min_ios_version_supported
            return '13.4'
        end

        def self.min_xcode_version_supported
            return '14.3'
        end

        def self.folly_config
            return {
                :version => '2024.01.01.00',
                :compiler_flags => '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -Wno-comma -Wno-shorten-64-to-32'
            }
        end

        def self.cxx_language_standard
            return "c++20"
        end
    end
end
