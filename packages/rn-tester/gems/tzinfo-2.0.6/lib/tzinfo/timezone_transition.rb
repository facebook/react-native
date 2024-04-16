# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  # Represents a transition from one observed UTC offset ({TimezoneOffset} to
  # another for a time zone.
  class TimezoneTransition
    # @return [TimezoneOffset] the offset this transition changes to.
    attr_reader :offset

    # @return [TimezoneOffset] the offset this transition changes from.
    attr_reader :previous_offset

    # When this transition occurs as an `Integer` number of seconds since
    # 1970-01-01 00:00:00 UTC ignoring leap seconds (i.e. each day is treated as
    # if it were 86,400 seconds long). Equivalent to the result of calling the
    # {Timestamp#value value} method on the {Timestamp} returned by {at}.
    #
    # @return [Integer] when this transition occurs as a number of seconds since
    #   1970-01-01 00:00:00 UTC ignoring leap seconds.
    attr_reader :timestamp_value

    # Initializes a new {TimezoneTransition}.
    #
    # {TimezoneTransition} instances should not normally be constructed
    # manually.
    #
    # @param offset [TimezoneOffset] the offset the transition changes to.
    # @param previous_offset [TimezoneOffset] the offset the transition changes
    #   from.
    # @param timestamp_value [Integer] when the transition occurs as a
    #   number of seconds since 1970-01-01 00:00:00 UTC ignoring leap seconds
    #   (i.e. each day is treated as if it were 86,400 seconds long).
    def initialize(offset, previous_offset, timestamp_value)
      @offset = offset
      @previous_offset = previous_offset
      @timestamp_value = timestamp_value
    end

    # Returns a {Timestamp} instance representing the UTC time when this
    # transition occurs.
    #
    # To obtain the result as a `Time` or `DateTime`, call either
    # {Timestamp#to_time to_time} or {Timestamp#to_datetime to_datetime} on the
    # {Timestamp} instance that is returned.
    #
    # @return [Timestamp] the UTC time when this transition occurs.
    def at
      Timestamp.utc(@timestamp_value)
    end

    # Returns a {TimestampWithOffset} instance representing the local time when
    # this transition causes the previous observance to end (calculated from
    # {at} using {previous_offset}).
    #
    # To obtain the result as a `Time` or `DateTime`, call either
    # {TimestampWithOffset#to_time to_time} or {TimestampWithOffset#to_datetime
    # to_datetime} on the {TimestampWithOffset} instance that is returned.
    #
    # @return [TimestampWithOffset] the local time when this transition causes
    #   the previous observance to end.
    def local_end_at
      TimestampWithOffset.new(@timestamp_value, 0, @previous_offset.observed_utc_offset).set_timezone_offset(@previous_offset)
    end

    # Returns a {TimestampWithOffset} instance representing the local time when
    # this transition causes the next observance to start (calculated from {at}
    # using {offset}).
    #
    # To obtain the result as a `Time` or `DateTime`, call either
    # {TimestampWithOffset#to_time to_time} or {TimestampWithOffset#to_datetime
    # to_datetime} on the {TimestampWithOffset} instance that is returned.
    #
    # @return [TimestampWithOffset] the local time when this transition causes
    #   the next observance to start.
    def local_start_at
      TimestampWithOffset.new(@timestamp_value, 0, @offset.observed_utc_offset).set_timezone_offset(@offset)
    end

    # Determines if this {TimezoneTransition} is equal to another instance.
    #
    # @param tti [Object] the instance to test for equality.
    # @return [Boolean] `true` if `tti` is a {TimezoneTransition} with the same
    #   {offset}, {previous_offset} and {timestamp_value} as this
    #   {TimezoneTransition}, otherwise `false`.
    def ==(tti)
      tti.kind_of?(TimezoneTransition) &&
        offset == tti.offset && previous_offset == tti.previous_offset && timestamp_value == tti.timestamp_value
    end
    alias eql? ==

    # @return [Integer] a hash based on {offset}, {previous_offset} and
    #   {timestamp_value}.
    def hash
      [@offset, @previous_offset, @timestamp_value].hash
    end
  end
end
