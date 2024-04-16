# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  # A subclass of `Time` used to represent local times. {TimeWithOffset} holds a
  # reference to the related {TimezoneOffset} and overrides various methods to
  # return results appropriate for the {TimezoneOffset}. Certain operations will
  # clear the associated {TimezoneOffset} (if the {TimezoneOffset} would not
  # necessarily be valid for the result). Once the {TimezoneOffset} has been
  # cleared, {TimeWithOffset} behaves identically to `Time`.
  #
  # Arithmetic performed on {TimeWithOffset} instances is _not_ time zone-aware.
  # Regardless of whether transitions in the time zone are crossed, results of
  # arithmetic operations will always maintain the same offset from UTC
  # (`utc_offset`). The associated {TimezoneOffset} will aways be cleared.
  class TimeWithOffset < Time
    include WithOffset

    # @return [TimezoneOffset] the {TimezoneOffset} associated with this
    #   instance.
    attr_reader :timezone_offset

    # Marks this {TimeWithOffset} as a local time with the UTC offset of a given
    # {TimezoneOffset} and sets the associated {TimezoneOffset}.
    #
    # @param timezone_offset [TimezoneOffset] the {TimezoneOffset} to use to set
    #   the offset of this {TimeWithOffset}.
    # @return [TimeWithOffset] `self`.
    # @raise [ArgumentError] if `timezone_offset` is `nil`.
    def set_timezone_offset(timezone_offset)
      raise ArgumentError, 'timezone_offset must be specified' unless timezone_offset
      localtime(timezone_offset.observed_utc_offset)
      @timezone_offset = timezone_offset
      self
    end

    # An overridden version of `Time#dst?` that, if there is an associated
    # {TimezoneOffset}, returns the result of calling {TimezoneOffset#dst? dst?}
    # on that offset.
    #
    # @return [Boolean] `true` if daylight savings time is being observed,
    #   otherwise `false`.
    def dst?
      to = timezone_offset
      to ? to.dst? : super
    end
    alias isdst dst?

    # An overridden version of `Time#getlocal` that clears the associated
    # {TimezoneOffset} if the base implementation of `getlocal` returns a
    # {TimeWithOffset}.
    #
    # @return [Time] a representation of the {TimeWithOffset} using either the
    #   local time zone or the given offset.
    def getlocal(*args)
      # JRuby < 9.3 returns a Time in all cases.
      # JRuby >= 9.3 returns a Time when called with no arguments and a
      # TimeWithOffset with a timezone_offset assigned when called with an
      # offset argument.
      result = super
      result.clear_timezone_offset if result.kind_of?(TimeWithOffset)
      result
    end

    # An overridden version of `Time#gmtime` that clears the associated
    # {TimezoneOffset}.
    #
    # @return [TimeWithOffset] `self`.
    def gmtime
      super
      @timezone_offset = nil
      self
    end

    # An overridden version of `Time#localtime` that clears the associated
    # {TimezoneOffset}.
    #
    # @return [TimeWithOffset] `self`.
    def localtime(*args)
      super
      @timezone_offset = nil
      self
    end

    # An overridden version of `Time#round` that, if there is an associated
    # {TimezoneOffset}, returns a {TimeWithOffset} preserving that offset.
    #
    # @return [Time] the rounded time.
    def round(ndigits = 0)
      if_timezone_offset(super) {|o,t| self.class.at(t.to_i, t.subsec * 1_000_000).set_timezone_offset(o) }
    end

    # An overridden version of `Time#to_a`. The `isdst` (index 8) and `zone`
    # (index 9) elements of the array are set according to the associated
    # {TimezoneOffset}.
    #
    # @return [Array] an `Array` representation of the {TimeWithOffset}.
    def to_a
      if_timezone_offset(super) do |o,a|
        a[8] = o.dst?
        a[9] = o.abbreviation
        a
      end
    end

    # An overridden version of `Time#utc` that clears the associated
    # {TimezoneOffset}.
    #
    # @return [TimeWithOffset] `self`.
    def utc
      super
      @timezone_offset = nil
      self
    end

    # An overridden version of `Time#zone` that, if there is an associated
    # {TimezoneOffset}, returns the {TimezoneOffset#abbreviation abbreviation}
    # of that offset.
    #
    # @return [String] the {TimezoneOffset#abbreviation abbreviation} of the
    #   associated {TimezoneOffset}, or the result from `Time#zone` if there is
    #   no such offset.
    def zone
      to = timezone_offset
      to ? to.abbreviation : super
    end

    # An overridden version of `Time#to_datetime` that, if there is an
    # associated {TimezoneOffset}, returns a {DateTimeWithOffset} with that
    # offset.
    #
    # @return [DateTime] if there is an associated {TimezoneOffset}, a
    #   {DateTimeWithOffset} representation of this {TimeWithOffset}, otherwise
    #   a `Time` representation.
    def to_datetime
      if_timezone_offset(super) do |o,dt|
        offset = dt.offset
        result = DateTimeWithOffset.jd(dt.jd + dt.day_fraction - offset)
        result = result.new_offset(offset) unless offset == 0
        result.set_timezone_offset(o)
      end
    end

    protected

    # Clears the associated {TimezoneOffset}.
    #
    # @return [TimeWithOffset] `self`.
    def clear_timezone_offset
      @timezone_offset = nil
      self
    end
  end
end
