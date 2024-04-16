# encoding: UTF-8

module TZInfo
  module Format2
    # Instances of {TimezoneIndexDefiner} are yielded by
    # {TimezoneIndexDefinition} to allow the time zone index to be defined.
    #
    # @private
    class TimezoneIndexDefiner #:nodoc:
      # @return [Array<String>] the identifiers of all data time zones.
      attr_reader :data_timezones

      # @return [Array<String>] the identifiers of all linked time zones.
      attr_reader :linked_timezones

      # Initializes a new TimezoneDefiner.
      #
      # @param string_deduper [StringDeduper] a {StringDeduper} instance to use
      #   when deduping identifiers.
      def initialize(string_deduper)
        @string_deduper = string_deduper
        @data_timezones = []
        @linked_timezones = []
      end

      # Adds a data time zone to the index.
      #
      # @param identifier [String] the time zone identifier.
      def data_timezone(identifier)
        # Dedupe non-frozen literals from format 1 on all Ruby versions and
        # format 2 on Ruby < 2.3 (without frozen_string_literal support).
        @data_timezones << @string_deduper.dedupe(identifier)
      end

      # Adds a linked time zone to the index.
      #
      # @param identifier [String] the time zone identifier.
      def linked_timezone(identifier)
        # Dedupe non-frozen literals from format 1 on all Ruby versions and
        # format 2 on Ruby < 2.3 (without frozen_string_literal support).
        @linked_timezones << @string_deduper.dedupe(identifier)
      end
    end
  end
end
