module Xcodeproj
  # Helper class which returns information from xcodebuild.
  #
  class XcodebuildHelper
    def initialize
      @needs_to_parse_sdks = true
    end

    # @return [String] The version of the last iOS sdk.
    #
    def last_ios_sdk
      parse_sdks_if_needed
      versions_by_sdk[:ios].sort.last
    end

    # @return [String] The version of the last OS X sdk.
    #
    def last_osx_sdk
      parse_sdks_if_needed
      versions_by_sdk[:osx].sort.last
    end

    # @return [String] The version of the last tvOS sdk.
    #
    def last_tvos_sdk
      parse_sdks_if_needed
      versions_by_sdk[:tvos].sort.last
    end

    # @return [String] The version of the last visionOS sdk.
    #
    def last_visionos_sdk
      parse_sdks_if_needed
      versions_by_sdk[:visionos].sort.last
    end

    # @return [String] The version of the last watchOS sdk.
    #
    def last_watchos_sdk
      parse_sdks_if_needed
      versions_by_sdk[:watchos].sort.last
    end

    private

    # !@group Private Helpers

    #-------------------------------------------------------------------------#

    # @return [Hash] The versions of the sdks grouped by name (`:ios`, or `:osx`).
    #
    attr_accessor :versions_by_sdk

    # @return [void] Parses the SDKs returned by xcodebuild and stores the
    #         information in the `needs_to_parse_sdks` hash.
    #
    def parse_sdks_if_needed
      if @needs_to_parse_sdks
        @versions_by_sdk = {}
        @versions_by_sdk[:osx] = []
        @versions_by_sdk[:ios] = []
        @versions_by_sdk[:tvos] = []
        @versions_by_sdk[:visionos] = []
        @versions_by_sdk[:watchos] = []
        if xcodebuild_available?
          sdks = parse_sdks_information(xcodebuild_sdks)
          sdks.each do |(name, version)|
            case
            when name == 'macosx' then @versions_by_sdk[:osx] << version
            when name == 'iphoneos' then @versions_by_sdk[:ios] << version
            when name == 'appletvos' then @versions_by_sdk[:tvos] << version
            when name == 'xros' then @versions_by_sdk[:visionos] << version
            when name == 'watchos' then @versions_by_sdk[:watchos] << version
            end
          end
        end
      end
    end

    # @return [Bool] Whether xcodebuild is available.
    #
    def xcodebuild_available?
      if @xcodebuild_available.nil?
        `which xcodebuild 2>/dev/null`
        @xcodebuild_available = $?.exitstatus.zero?
      end
      @xcodebuild_available
    end

    # @return [Array<Array<String>>] An array of tuples where the first element
    #         is the name of the SDK and the second is the version.
    #
    def parse_sdks_information(output)
      output.scan(/-sdk (macosx|iphoneos|watchos|appletvos|xros)(.+\w)/)
    end

    # @return [String] The sdk information reported by xcodebuild.
    #
    def xcodebuild_sdks
      `xcodebuild -showsdks 2>/dev/null`
    end

    #-------------------------------------------------------------------------#

    # @!group Singleton

    # @return [XcodebuildHelper] the current xcodebuild instance creating one
    #         if needed, which caches the information from the xcodebuild
    #         command line tool.
    #
    def self.instance
      @instance ||= new
    end

    #-------------------------------------------------------------------------#
  end
end
