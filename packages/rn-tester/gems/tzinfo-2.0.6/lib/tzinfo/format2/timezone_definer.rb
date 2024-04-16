# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  module Format2
    # Instances of {TimezoneDefiner} are yielded to TZInfo::Data modules by
    # {TimezoneDefinition} to allow the offsets and transitions of the time zone
    # to be specified.
    #
    # @private
    class TimezoneDefiner #:nodoc:
      # @return [Array<TimezoneTransition>] the defined transitions of the time
      #   zone.
      attr_reader :transitions

      # Initializes a new TimezoneDefiner.
      #
      # @param string_deduper [StringDeduper] a {StringDeduper} instance to use
      #   when deduping abbreviations.
      def initialize(string_deduper)
        @string_deduper = string_deduper
        @offsets = {}
        @transitions = []
      end

      # Returns the first offset to be defined or `nil` if no offsets have been
      #  defined. The first offset is observed before the time of the first
      #  transition.
      #
      # @return [TimezoneOffset] the first offset to be defined or `nil` if no
      #   offsets have been defined.
      def first_offset
        first = @offsets.first
        first && first.last
      end

      # Defines an offset.
      #
      # @param id [Symbol] an arbitrary value used identify the offset in
      #   subsequent calls to transition. It must be unique.
      # @param base_utc_offset [Integer] the base offset from UTC of the zone in
      #   seconds. This does not include daylight savings time.
      # @param std_offset [Integer] the daylight savings offset from the base
      #   offset in seconds. Typically either 0 or 3600.
      # @param abbreviation [String] an abbreviation for the offset, for
      #   example, EST or EDT.
      # @raise [ArgumentError] if another offset has already been defined with
      #   the given id.
      def offset(id, base_utc_offset, std_offset, abbreviation)
        raise ArgumentError, 'An offset has already been defined with the given id' if @offsets.has_key?(id)

        # Dedupe non-frozen literals from format 1 on all Ruby versions and
        # format 2 on Ruby < 2.3 (without frozen_string_literal support).
        abbreviation = @string_deduper.dedupe(abbreviation)

        offset = TimezoneOffset.new(base_utc_offset, std_offset, abbreviation)
        @offsets[id] = offset
        @previous_offset ||= offset
      end

      # Defines a transition to a given offset.
      #
      # Transitions must be defined in increasing time order.
      #
      # @param offset_id [Symbol] references the id of a previously defined
      #   offset.
      # @param timestamp_value [Integer] the time the transition occurs as a
      #   number of seconds since 1970-01-01 00:00:00 UTC ignoring leap seconds
      #   (i.e. each day is treated as if it were 86,400 seconds long).
      # @raise [ArgumentError] if `offset_id` does not reference a defined
      #   offset.
      # @raise [ArgumentError] if `timestamp_value` is not greater than the
      #   `timestamp_value` of the previously defined transition.
      def transition(offset_id, timestamp_value)
        offset = @offsets[offset_id]
        raise ArgumentError, 'offset_id has not been defined' unless offset
        raise ArgumentError, 'timestamp is not greater than the timestamp of the previously defined transition' if !@transitions.empty? && @transitions.last.timestamp_value >= timestamp_value
        @transitions << TimezoneTransition.new(offset, @previous_offset, timestamp_value)
        @previous_offset = offset
      end

      # Defines the rules that will be used for handling instants after the last
      # transition.
      #
      # This method is currently just a placeholder for forward compatibility
      # that accepts and ignores any arguments passed.
      #
      # Support for subsequent rules will be added in a future version of TZInfo
      # and the rules will be included in format 2 releases of TZInfo::Data.
      def subsequent_rules(*args)
      end
    end
  end
end
