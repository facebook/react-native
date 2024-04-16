# encoding: UTF-8

module TZInfo
  module Format2
    # Instances of {Format2::CountryIndexDefiner} are yielded to the format 2
    # version of `TZInfo::Data::Indexes::Countries` by {CountryIndexDefinition}
    # to allow countries and their time zones to be specified.
    #
    # @private
    class CountryIndexDefiner #:nodoc:
      # @return [Hash<String, CountryInfo>] a `Hash` of all the countries that
      #     have been defined in the index keyed by their codes.
      attr_reader :countries

      # Initializes a new {CountryIndexDefiner}.
      #
      # @param identifier_deduper [StringDeduper] a {StringDeduper} instance to
      #   use when deduping time zone identifiers.
      # @param description_deduper [StringDeduper] a {StringDeduper} instance to
      #   use when deduping time zone descriptions.
      def initialize(identifier_deduper, description_deduper)
        @identifier_deduper = identifier_deduper
        @description_deduper = description_deduper
        @shared_timezones = {}
        @countries = {}
      end

      # Defines a time zone shared by many countries with an reference for
      # subsequent use in country definitions. The latitude and longitude are
      # given as the numerator and denominator of a `Rational`.
      #
      # @param reference [Symbol] a unique reference for the time zone.
      # @param identifier [String] the time zone identifier.
      # @param latitude_numerator [Integer] the numerator of the latitude.
      # @param latitude_denominator [Integer] the denominator of the latitude.
      # @param longitude_numerator [Integer] the numerator of the longitude.
      # @param longitude_denominator [Integer] the denominator of the longitude.
      # @param description [String] an optional description for the time zone.
      def timezone(reference, identifier, latitude_numerator, latitude_denominator,
                    longitude_numerator, longitude_denominator, description = nil)
        # Dedupe non-frozen literals from format 1 on all Ruby versions and
        # format 2 on Ruby < 2.3 (without frozen_string_literal support).
        @shared_timezones[reference] = CountryTimezone.new(@identifier_deduper.dedupe(identifier),
          Rational(latitude_numerator, latitude_denominator),
          Rational(longitude_numerator, longitude_denominator), description && @description_deduper.dedupe(description))
      end

      # Defines a country.
      #
      # @param code [String] The ISO 3166-1 alpha-2 code of the country.
      # @param name [String] Then name of the country.
      # @yield [definer] yields (optional) to obtain the time zones for the
      #   country.
      # @yieldparam definer [CountryDefiner] a {CountryDefiner}
      #   instance that should be used to specify the time zones of the country.
      def country(code, name)
        timezones = if block_given?
          definer = CountryDefiner.new(@shared_timezones, @identifier_deduper, @description_deduper)
          yield definer
          definer.timezones
        else
          []
        end
        @countries[code.freeze] = DataSources::CountryInfo.new(code, name, timezones)
      end
    end
  end
end
