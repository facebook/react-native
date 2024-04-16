module Pod
  # The Version class stores information about the version of a
  # {Specification}.
  #
  # It is based on the RubyGems class adapted to support head information.
  #
  # ### From RubyGems:
  #
  # The Version class processes string versions into comparable
  # values. A version string should normally be a series of numbers
  # separated by periods. Each part (digits separated by periods) is
  # considered its own number, and these are used for sorting. So for
  # instance, 3.10 sorts higher than 3.2 because ten is greater than
  # two.
  #
  # If any part contains letters (currently only a-z are supported) then
  # that version is considered prerelease. Versions with a prerelease
  # part in the Nth part sort less than versions with N-1
  # parts. Prerelease parts are sorted alphabetically using the normal
  # Ruby string sorting rules. If a prerelease part contains both
  # letters and numbers, it will be broken into multiple parts to
  # provide expected sort behavior (1.0.a10 becomes 1.0.a.10, and is
  # greater than 1.0.a9).
  #
  # Prereleases sort between real releases (newest to oldest):
  #
  # 1. 1.0
  # 2. 1.0.b1
  # 3. 1.0.a.2
  # 4. 0.9
  #
  class Version < Pod::Vendor::Gem::Version
    # Override the constants defined by the superclass to add:
    # - Semantic Versioning prerelease support (with a dash). E.g.: 1.0.0-alpha1
    # - Semantic Versioning metadata support (with a +) E.g: 1.0.0+96ef7ed
    #
    # For more info, see: http://semver.org
    #
    METADATA_PATTERN = '(\+[0-9a-zA-Z\-\.]+)'
    VERSION_PATTERN = "[0-9]+(\\.[0-9a-zA-Z\\-]+)*#{METADATA_PATTERN}?"
    ANCHORED_VERSION_PATTERN = /\A\s*(#{VERSION_PATTERN})*\s*\z/

    # @param  [String,Version] version
    #         A string representing a version, or another version.
    #
    def initialize(version)
      raise ArgumentError, "Malformed version number string #{version}" unless
        self.class.correct?(version)

      @version = version.to_s.strip
    end

    # An instance that represents version 0.
    #
    ZERO = new('0')

    # @return [String] a string representation suitable for debugging.
    #
    def inspect
      "<#{self.class} version=#{version}>"
    end

    # @return [Boolean] indicates whether or not the version is a prerelease.
    #
    # @note   Prerelease Pods can contain a hyphen and/or a letter (conforms to
    #         Semantic Versioning instead of RubyGems).
    #
    #         For more info, see: http://semver.org
    #
    def prerelease?
      return @prerelease if defined?(@prerelease)
      comparable_version = @version.sub(/#{METADATA_PATTERN}$/, '')
      @prerelease = comparable_version =~ /[a-zA-Z\-]/
    end

    # @return [Boolean] Whether a string representation is correct.
    #
    def self.correct?(version)
      version.to_s =~ ANCHORED_VERSION_PATTERN
    end

    #-------------------------------------------------------------------------#

    # @!group Semantic Versioning

    SEMVER_PATTERN = "[0-9]+(\\.[0-9]+(\\.[0-9]+(-[0-9A-Za-z\\-\\.]+)?#{METADATA_PATTERN}?)?)?"
    ANCHORED_SEMANTIC_VERSION_PATTERN = /\A\s*(#{SEMVER_PATTERN})*\s*\z/

    # @return [Boolean] Whether the version conforms to the Semantic Versioning
    #         specification (2.0.0-rc.1).
    #
    # @note   This comparison is lenient.
    #
    # @note   It doesn't support build identifiers.
    #
    def semantic?
      version.to_s =~ ANCHORED_SEMANTIC_VERSION_PATTERN
    end

    # @return [Fixnum] The semver major identifier.
    #
    def major
      numeric_segments[0].to_i
    end

    # @return [Fixnum] The semver minor identifier.
    #
    def minor
      numeric_segments[1].to_i
    end

    # @return [Fixnum] The semver patch identifier.
    #
    def patch
      numeric_segments[2].to_i
    end

    # Compares the versions for sorting.
    #
    # @param  [Version] other
    #         The other version to compare.
    #
    # @return [Fixnum] -1, 0, or +1 depending on whether the receiver is less
    #         than, equal to, or greater than other.
    #
    # @note   Attempts to compare something that's not a {Version} return nil
    #
    def <=>(other)
      comparison = compare_segments(other)
      comparison == 0 ? version <=> other.version : comparison
    end

    # @private
    #
    # Compares the versions for equality.
    #
    # @param  [Version] other
    #         The other version to compare.
    #
    # @return [Boolean] whether the receiver is equal to other.
    #
    # @note   Attempts to compare something that's not a {Version} return nil
    #
    def ==(other)
      compare_segments(other) == 0
    end

    # @private
    #
    # Compares the versions for equality.
    #
    # @param  [Version] other
    #         The other version to compare.
    #
    # @return [Boolean] whether the receiver is greater than or equal to other.
    #
    # @note   Attempts to compare something that's not a {Version} return nil
    #
    def >=(other)
      comparison = compare_segments(other)
      comparison >= 0
    end

    # @private
    #
    # Compares the versions for equality.
    #
    # @param  [Version] other
    #         The other version to compare.
    #
    # @return [Boolean] whether the receiver is less than or equal to other.
    #
    # @note   Attempts to compare something that's not a {Version} return nil
    #
    def <=(other)
      comparison = compare_segments(other)
      comparison <= 0
    end

    protected

    # This overrides the Gem::Version implementation of `_segments` to drop the
    # metadata from comparisons as per http://semver.org/#spec-item-10
    #
    def _segments
      # segments is lazy so it can pick up version values that come from
      # old marshaled versions, which don't go through marshal_load.
      # since this version object is cached in @@all, its @segments should be frozen

      @segments ||= @version.sub(/#{METADATA_PATTERN}$/, '').scan(/[0-9]+|[a-z]+/i).map do |s|
        /^\d+$/ =~ s ? s.to_i : s
      end.freeze
    end

    def numeric_segments
      @numeric_segments ||= segments.take_while { |s| s.is_a?(Numeric) }.reverse_each.drop_while { |s| s == 0 }.reverse
    end

    def prerelease_segments
      @prerelease_segments ||= segments.drop_while { |s| s.is_a?(Numeric) }
    end

    def compare_segments(other)
      return unless other.is_a?(Pod::Version)
      return 0 if @version == other.version

      compare = proc do |segments, other_segments, is_pre_release|
        limit = [segments.size, other_segments.size].max

        0.upto(limit) do |i|
          lhs = segments[i]
          rhs = other_segments[i]

          next if lhs == rhs
          # If it's pre-release and the first segment, then
          # this is a special case because a segment missing
          # means that one is not a pre-release version
          if is_pre_release && i == 0
            return 1 if lhs.nil?
            return -1 if rhs.nil?
          else
            return -1 if lhs.nil?
            return  1 if rhs.nil?
          end

          if comparison = lhs <=> rhs
            return comparison
          end
        end
      end

      compare[numeric_segments, other.numeric_segments, false]
      compare[prerelease_segments, other.prerelease_segments, true]
      0
    end

    #-------------------------------------------------------------------------#
  end
end
