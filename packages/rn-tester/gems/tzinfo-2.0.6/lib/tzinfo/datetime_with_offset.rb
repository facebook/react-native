# encoding: UTF-8
# frozen_string_literal: true

require 'date'

module TZInfo
  # A subclass of `DateTime` used to represent local times. {DateTimeWithOffset}
  # holds a reference to the related {TimezoneOffset} and overrides various
  # methods to return results appropriate for the {TimezoneOffset}. Certain
  # operations will clear the associated {TimezoneOffset} (if the
  # {TimezoneOffset} would not necessarily be valid for the result). Once the
  # {TimezoneOffset} has been cleared, {DateTimeWithOffset} behaves identically
  # to `DateTime`.
  #
  # Arithmetic performed on {DateTimeWithOffset} instances is _not_ time
  # zone-aware. Regardless of whether transitions in the time zone are crossed,
  # results of arithmetic operations will always maintain the same offset from
  # UTC (`offset`). The associated {TimezoneOffset} will aways be cleared.
  class DateTimeWithOffset < DateTime
    include WithOffset

    # @return [TimezoneOffset] the {TimezoneOffset} associated with this
    #   instance.
    attr_reader :timezone_offset

    # Sets the associated {TimezoneOffset}.
    #
    # @param timezone_offset [TimezoneOffset] a {TimezoneOffset} valid at the
    #   time and for the offset of this {DateTimeWithOffset}.
    # @return [DateTimeWithOffset] `self`.
    # @raise [ArgumentError] if `timezone_offset` is `nil`.
    # @raise [ArgumentError] if `timezone_offset.observed_utc_offset` does not
    #   equal `self.offset * 86400`.
    def set_timezone_offset(timezone_offset)
      raise ArgumentError, 'timezone_offset must be specified' unless timezone_offset
      raise ArgumentError, 'timezone_offset.observed_utc_offset does not match self.utc_offset' if offset * 86400 != timezone_offset.observed_utc_offset
      @timezone_offset = timezone_offset
      self
    end

    # An overridden version of `DateTime#to_time` that, if there is an
    # associated {TimezoneOffset}, returns a {DateTimeWithOffset} with that
    # offset.
    #
    # @return [Time] if there is an associated {TimezoneOffset}, a
    #   {TimeWithOffset} representation of this {DateTimeWithOffset}, otherwise
    #   a `Time` representation.
    def to_time
      if_timezone_offset(super) do |o,t|
        # Ruby 2.4.0 changed the behaviour of to_time so that it preserves the
        # offset instead of converting to the system local timezone.
        #
        # When self has an associated TimezonePeriod, this implementation will
        # preserve the offset on all versions of Ruby.
        TimeWithOffset.at(t.to_i, t.subsec * 1_000_000).set_timezone_offset(o)
      end
    end

    # An overridden version of `DateTime#downto` that clears the associated
    # {TimezoneOffset} of the returned or yielded instances.
    def downto(min)
      if block_given?
        super {|dt| yield dt.clear_timezone_offset }
      else
        enum = super
        enum.each {|dt| dt.clear_timezone_offset }
        enum
      end
    end

    # An overridden version of `DateTime#england` that preserves the associated
    # {TimezoneOffset}.
    #
    # @return [DateTime]
    def england
      # super doesn't call #new_start on MRI, so each method has to be
      # individually overridden.
      if_timezone_offset(super) {|o,dt| dt.set_timezone_offset(o) }
    end

    # An overridden version of `DateTime#gregorian` that preserves the
    # associated {TimezoneOffset}.
    #
    # @return [DateTime]
    def gregorian
      # super doesn't call #new_start on MRI, so each method has to be
      # individually overridden.
      if_timezone_offset(super) {|o,dt| dt.set_timezone_offset(o) }
    end

    # An overridden version of `DateTime#italy` that preserves the associated
    # {TimezoneOffset}.
    #
    # @return [DateTime]
    def italy
      # super doesn't call #new_start on MRI, so each method has to be
      # individually overridden.
      if_timezone_offset(super) {|o,dt| dt.set_timezone_offset(o) }
    end

    # An overridden version of `DateTime#julian` that preserves the associated
    # {TimezoneOffset}.
    #
    # @return [DateTime]
    def julian
      # super doesn't call #new_start on MRI, so each method has to be
      # individually overridden.
      if_timezone_offset(super) {|o,dt| dt.set_timezone_offset(o) }
    end

    # An overridden version of `DateTime#new_start` that preserves the
    # associated {TimezoneOffset}.
    #
    # @return [DateTime]
    def new_start(start = Date::ITALY)
      if_timezone_offset(super) {|o,dt| dt.set_timezone_offset(o) }
    end

    # An overridden version of `DateTime#step` that clears the associated
    # {TimezoneOffset} of the returned or yielded instances.
    def step(limit, step = 1)
      if block_given?
        super {|dt| yield dt.clear_timezone_offset }
      else
        enum = super
        enum.each {|dt| dt.clear_timezone_offset }
        enum
      end
    end

    # An overridden version of `DateTime#upto` that clears the associated
    # {TimezoneOffset} of the returned or yielded instances.
    def upto(max)
      if block_given?
        super {|dt| yield dt.clear_timezone_offset }
      else
        enum = super
        enum.each {|dt| dt.clear_timezone_offset }
        enum
      end
    end

    protected

    # Clears the associated {TimezoneOffset}.
    #
    # @return [DateTimeWithOffset] `self`.
    def clear_timezone_offset
      @timezone_offset = nil
      self
    end
  end
end
