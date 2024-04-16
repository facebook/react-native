# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  module Format2
    # Instances of {Format2::CountryDefiner} are yielded to the format 2 version
    # of `TZInfo::Data::Indexes::Countries` by {CountryIndexDefiner} to allow
    # the zones of a country to be specified.
    #
    # @private
    class CountryDefiner #:nodoc:
      # @return [Array<CountryTimezone>] the time zones observed in the country.
      attr_reader :timezones

      # Initializes a new {CountryDefiner}.
      #
      # @param shared_timezones [Hash<Symbol, CountryTimezone>] a `Hash`
      #   containing time zones shared by more than one country, keyed by a
      #   unique reference.
      # @param identifier_deduper [StringDeduper] a {StringDeduper} instance to
      #   use when deduping time zone identifiers.
      # @param description_deduper [StringDeduper] a {StringDeduper} instance to
      #   use when deduping time zone descriptions.
      def initialize(shared_timezones, identifier_deduper, description_deduper)
        @shared_timezones = shared_timezones
        @identifier_deduper = identifier_deduper
        @description_deduper = description_deduper
        @timezones = []
      end

      # @overload timezone(reference)
      #   Defines a time zone of a country as a reference to a pre-defined
      #   shared time zone.
      #   @param reference [Symbol] a reference for a pre-defined shared time
      #     zone.
      # @overload timezone(identifier, latitude_numerator, latitude_denominator, longitude_numerator, longitude_denominator, description)
      #   Defines a (non-shared) time zone of a country. The latitude and
      #   longitude are given as the numerator and denominator of a `Rational`.
      #   @param identifier [String] the time zone identifier.
      #   @param latitude_numerator [Integer] the numerator of the latitude.
      #   @param latitude_denominator [Integer] the denominator of the latitude.
      #   @param longitude_numerator [Integer] the numerator of the longitude.
      #   @param longitude_denominator [Integer] the denominator of the
      #     longitude.
      #   @param description [String] an optional description for the time zone.
      def timezone(identifier_or_reference, latitude_numerator = nil,
                  latitude_denominator = nil, longitude_numerator = nil,
                  longitude_denominator = nil, description = nil)
        if latitude_numerator
          unless latitude_denominator && longitude_numerator && longitude_denominator
            raise ArgumentError, 'Either just a reference should be supplied, or the identifier, latitude and longitude must all be specified'
          end

          # Dedupe non-frozen literals from format 1 on all Ruby versions and
          # format 2 on Ruby < 2.3 (without frozen_string_literal support).

          @timezones << CountryTimezone.new(@identifier_deduper.dedupe(identifier_or_reference),
            Rational(latitude_numerator, latitude_denominator),
            Rational(longitude_numerator, longitude_denominator), description && @description_deduper.dedupe(description))
        else
          shared_timezone = @shared_timezones[identifier_or_reference]
          raise ArgumentError, "Unknown shared timezone: #{identifier_or_reference}" unless shared_timezone
          @timezones << shared_timezone
        end
      end
    end
  end
end
