# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  # {TimezonePeriod} represents a period of time for a time zone where the same
  # offset from UTC applies. It provides access to the observed offset, time
  # zone abbreviation, start time and end time.
  #
  # The period of time can be unbounded at the start, end, or both the start
  # and end.
  #
  # @abstract Time zone period data will returned as an instance of one of the
  #  subclasses of {TimezonePeriod}.
  class TimezonePeriod
    # @return [TimezoneOffset] the offset that applies in the period of time.
    attr_reader :offset

    # Initializes a {TimezonePeriod}.
    #
    # @param offset [TimezoneOffset] the offset that is observed for the period
    #   of time.
    # @raise [ArgumentError] if `offset` is `nil`.
    def initialize(offset)
      raise ArgumentError, 'offset must be specified' unless offset
      @offset = offset
    end

    # @return [TimezoneTransition] the transition that defines the start of this
    #   {TimezonePeriod} (`nil` if the start is unbounded).
    def start_transition
      raise_not_implemented(:start_transition)
    end

    # @return [TimezoneTransition] the transition that defines the end of this
    #   {TimezonePeriod} (`nil` if the end is unbounded).
    def end_transition
      raise_not_implemented(:end_transition)
    end

    # Returns the base offset from UTC in seconds (`observed_utc_offset -
    # std_offset`). This does not include any adjustment made for daylight
    # savings time and will typically remain constant throughout the year.
    #
    # To obtain the currently observed offset from UTC, including the effect of
    # daylight savings time, use {observed_utc_offset} instead.
    #
    # If you require accurate {base_utc_offset} values, you should install the
    # tzinfo-data gem and set {DataSources::RubyDataSource} as the {DataSource}.
    # When using {DataSources::ZoneinfoDataSource}, the value of
    # {base_utc_offset} has to be derived from changes to the observed UTC
    # offset and DST status since it is not included in zoneinfo files.
    #
    # @return [Integer] the base offset from UTC in seconds.
    def base_utc_offset
      @offset.base_utc_offset
    end
    alias utc_offset base_utc_offset

    # Returns the offset from the time zone's standard time in seconds
    # (`observed_utc_offset - base_utc_offset`). Zero when daylight savings time
    # is not in effect. Non-zero (usually 3600 = 1 hour) if daylight savings is
    # being observed.
    #
    # If you require accurate {std_offset} values, you should install the
    # tzinfo-data gem and set {DataSources::RubyDataSource} as the {DataSource}.
    # When using {DataSources::ZoneinfoDataSource}, the value of {std_offset}
    # has to be derived from changes to the observed UTC offset and DST status
    # since it is not included in zoneinfo files.
    #
    # @return [Integer] the offset from the time zone's standard time in
    #   seconds.
    def std_offset
      @offset.std_offset
    end

    # The abbreviation that identifies this offset. For example GMT
    # (Greenwich Mean Time) or BST (British Summer Time) for Europe/London.
    #
    # @return [String] the abbreviation that identifies this offset.
    def abbreviation
      @offset.abbreviation
    end
    alias abbr abbreviation
    alias zone_identifier abbreviation

    # Returns the observed offset from UTC in seconds (`base_utc_offset +
    # std_offset`). This includes adjustments made for daylight savings time.
    #
    # @return [Integer] the observed offset from UTC in seconds.
    def observed_utc_offset
      @offset.observed_utc_offset
    end
    alias utc_total_offset observed_utc_offset

    # Determines if daylight savings is in effect (i.e. if {std_offset} is
    # non-zero).
    #
    # @return [Boolean] `true` if {std_offset} is non-zero, otherwise `false`.
    def dst?
      @offset.dst?
    end

    # Returns the UTC start time of the period or `nil` if the start of the
    # period is unbounded.
    #
    # The result is returned as a {Timestamp}. To obtain the start time as a
    # `Time` or `DateTime`, call either {Timestamp#to_time to_time} or
    # {Timestamp#to_datetime to_datetime} on the result.
    #
    # @return [Timestamp] the UTC start time of the period or `nil` if the start
    #   of the period is unbounded.
    def starts_at
      timestamp(start_transition)
    end

    # Returns the UTC end time of the period or `nil` if the end of the period
    # is unbounded.
    #
    # The result is returned as a {Timestamp}. To obtain the end time as a
    # `Time` or `DateTime`, call either {Timestamp#to_time to_time} or
    # {Timestamp#to_datetime to_datetime} on the result.
    #
    # @return [Timestamp] the UTC end time of the period or `nil` if the end of
    #   the period is unbounded.
    def ends_at
      timestamp(end_transition)
    end

    # Returns the local start time of the period or `nil` if the start of the
    # period is unbounded.
    #
    # The result is returned as a {TimestampWithOffset}. To obtain the start
    # time as a `Time` or `DateTime`, call either {TimestampWithOffset#to_time
    # to_time} or {TimestampWithOffset#to_datetime to_datetime} on the result.
    #
    # @return [TimestampWithOffset] the local start time of the period or `nil`
    #   if the start of the period is unbounded.
    def local_starts_at
      timestamp_with_offset(start_transition)
    end

    # Returns the local end time of the period or `nil` if the end of the period
    # is unbounded.
    #
    # The result is returned as a {TimestampWithOffset}. To obtain the end time
    # as a `Time` or `DateTime`, call either {TimestampWithOffset#to_time
    # to_time} or {TimestampWithOffset#to_datetime to_datetime} on the result.
    #
    # @return [TimestampWithOffset] the local end time of the period or `nil` if
    #   the end of the period is unbounded.
    def local_ends_at
      timestamp_with_offset(end_transition)
    end

    private

    # Raises a {NotImplementedError} to indicate that subclasses should override
    # a method.
    #
    # @raise [NotImplementedError] always.
    def raise_not_implemented(method_name)
      raise NotImplementedError, "Subclasses must override #{method_name}"
    end

    # @param  transition [TimezoneTransition] a transition or `nil`.
    # @return [Timestamp] the {Timestamp} representing when a transition occurs,
    #   or `nil` if `transition` is `nil`.
    def timestamp(transition)
      transition ? transition.at : nil
    end

    # @param transition [TimezoneTransition] a transition or `nil`.
    # @return [TimestampWithOffset] a {Timestamp} representing when a transition
    #   occurs with offset set to {#offset}, or `nil` if `transition` is `nil`.
    def timestamp_with_offset(transition)
      transition ? TimestampWithOffset.set_timezone_offset(transition.at, offset) : nil
    end
  end
end
