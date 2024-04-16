# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  module Format1
    # Instances of {Format1::TimezoneDefiner} are yielded to TZInfo::Data
    # format 1 modules by {TimezoneDefinition} to allow the offsets and
    # transitions of the time zone to be specified.
    #
    # @private
    class TimezoneDefiner < Format2::TimezoneDefiner #:nodoc:
      undef_method :subsequent_rules

      # Defines an offset.
      #
      # @param id [Symbol] an arbitrary value used identify the offset in
      #   subsequent calls to transition. It must be unique.
      # @param utc_offset [Integer] the base offset from UTC of the zone in
      #   seconds. This does not include daylight savings time.
      # @param std_offset [Integer] the daylight savings offset from the base
      #   offset in seconds. Typically either 0 or 3600.
      # @param abbreviation [Symbol] an abbreviation for the offset, for
      #   example, `:EST` or `:EDT`.
      # @raise [ArgumentError] if another offset has already been defined with
      #   the given id.
      def offset(id, utc_offset, std_offset, abbreviation)
        super(id, utc_offset, std_offset, abbreviation.to_s)
      end

      # Defines a transition to a given offset.
      #
      # Transitions must be defined in increasing time order.
      #
      # @param year [Integer] the UTC year in which the transition occurs. Used
      #   in earlier versions of TZInfo, but now ignored.
      # @param month [Integer] the UTC month in which the transition occurs.
      #   Used in earlier versions of TZInfo, but now ignored.
      # @param offset_id [Symbol] references the id of a previously defined
      #   offset (see #offset).
      # @param timestamp_value [Integer] the time the transition occurs as an
      #   Integer number of seconds since 1970-01-01 00:00:00 UTC ignoring leap
      #   seconds (i.e. each day is treated as if it were 86,400 seconds long).
      # @param datetime_numerator [Integer] the time of the transition as the
      #   numerator of the `Rational` returned by `DateTime#ajd`. Used in
      #   earlier versions of TZInfo, but now ignored.
      # @param datetime_denominator [Integer] the time of the transition as the
      #   denominator of the `Rational` returned by `DateTime#ajd`. Used in
      #   earlier versions of TZInfo, but now ignored.
      # @raise [ArgumentError] if `offset_id` does not reference a defined
      #   offset.
      # @raise [ArgumentError] if `timestamp_value` is not greater than the
      #   `timestamp_value` of the previously defined transition.
      # @raise [ArgumentError] if `datetime_numerator` is specified, but
      #   `datetime_denominator` is not. In older versions of TZInfo, it was
      #   possible to define a transition with the `DateTime` numerator as the
      #   4th parameter and the denominator as the 5th parameter. This style of
      #   definition is not used in released versions of TZInfo::Data.
      def transition(year, month, offset_id, timestamp_value, datetime_numerator = nil, datetime_denominator = nil)
        raise ArgumentError, 'DateTime-only transitions are not supported' if datetime_numerator && !datetime_denominator
        super(offset_id, timestamp_value)
      end
    end
  end
end
