# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  # A subclass of {Timestamp} used to represent local times.
  # {TimestampWithOffset} holds a reference to the related {TimezoneOffset} and
  # overrides various methods to return results appropriate for the
  # {TimezoneOffset}. Certain operations will clear the associated
  # {TimezoneOffset} (if the {TimezoneOffset} would not necessarily be valid for
  # the result). Once the {TimezoneOffset} has been cleared,
  # {TimestampWithOffset} behaves identically to {Timestamp}.
  class TimestampWithOffset < Timestamp
    include WithOffset

    # @return [TimezoneOffset] the {TimezoneOffset} associated with this
    #   instance.
    attr_reader :timezone_offset

    # Creates a new {TimestampWithOffset} from a given {Timestamp} and
    # {TimezoneOffset}.
    #
    # @param timestamp [Timestamp] a {Timestamp}.
    # @param timezone_offset [TimezoneOffset] a {TimezoneOffset} valid at the
    # time of `timestamp`.
    # @return [TimestampWithOffset] a {TimestampWithOffset} that has the same
    #   {value value} and {sub_second sub_second} as the `timestamp` parameter,
    #   a {utc_offset utc_offset} equal to the
    #   {TimezoneOffset#observed_utc_offset observed_utc_offset} of the
    #   `timezone_offset` parameter and {timezone_offset timezone_offset} set to
    #   the `timezone_offset` parameter.
    # @raise [ArgumentError] if `timestamp` or `timezone_offset` is `nil`.
    def self.set_timezone_offset(timestamp, timezone_offset)
      raise ArgumentError, 'timestamp must be specified' unless timestamp
      raise ArgumentError, 'timezone_offset must be specified' unless timezone_offset
      new!(timestamp.value, timestamp.sub_second, timezone_offset.observed_utc_offset).set_timezone_offset(timezone_offset)
    end

    # Sets the associated {TimezoneOffset} of this {TimestampWithOffset}.
    #
    # @param timezone_offset [TimezoneOffset] a {TimezoneOffset} valid at the time
    #   and for the offset of this {TimestampWithOffset}.
    # @return [TimestampWithOffset] `self`.
    # @raise [ArgumentError] if `timezone_offset` is `nil`.
    # @raise [ArgumentError] if {utc? self.utc?} is `true`.
    # @raise [ArgumentError] if `timezone_offset.observed_utc_offset` does not equal
    #   `self.utc_offset`.
    def set_timezone_offset(timezone_offset)
      raise ArgumentError, 'timezone_offset must be specified' unless timezone_offset
      raise ArgumentError, 'timezone_offset.observed_utc_offset does not match self.utc_offset' if utc? || utc_offset != timezone_offset.observed_utc_offset
      @timezone_offset = timezone_offset
      self
    end

    # An overridden version of {Timestamp#to_time} that, if there is an
    # associated {TimezoneOffset}, returns a {TimeWithOffset} with that offset.
    #
    # @return [Time] if there is an associated {TimezoneOffset}, a
    #   {TimeWithOffset} representation of this {TimestampWithOffset}, otherwise
    #   a `Time` representation.
    def to_time
      to = timezone_offset
      if to
        new_time(TimeWithOffset).set_timezone_offset(to)
      else
        super
      end
    end

    # An overridden version of {Timestamp#to_datetime}, if there is an
    # associated {TimezoneOffset}, returns a {DateTimeWithOffset} with that
    # offset.
    #
    # @return [DateTime] if there is an associated {TimezoneOffset}, a
    #   {DateTimeWithOffset} representation of this {TimestampWithOffset},
    #   otherwise a `DateTime` representation.
    def to_datetime
      to = timezone_offset
      if to
        new_datetime(DateTimeWithOffset).set_timezone_offset(to)
      else
        super
      end
    end
  end
end
