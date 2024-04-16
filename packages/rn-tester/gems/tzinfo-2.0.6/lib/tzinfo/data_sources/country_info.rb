# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  module DataSources
    # Represents a country and references to its time zones as returned by a
    # {DataSource}.
    class CountryInfo
      # @return [String] the ISO 3166-1 alpha-2 country code.
      attr_reader :code

      # @return [String] the name of the country.
      attr_reader :name

      # @return [Array<CountryTimezone>] the time zones observed in the country.
      attr_reader :zones

      # Initializes a new {CountryInfo}. The passed in `code`, `name` and
      # `zones` instances will be frozen.
      #
      # @param code [String] an ISO 3166-1 alpha-2 country code.
      # @param name [String] the name of the country.
      # @param zones [Array<CountryTimezone>] the time zones observed in the
      #   country.
      # @raise [ArgumentError] if `code`, `name` or `zones` is `nil`.
      def initialize(code, name, zones)
        raise ArgumentError, 'code must be specified' unless code
        raise ArgumentError, 'name must be specified' unless name
        raise ArgumentError, 'zones must be specified' unless zones
        @code = code.freeze
        @name = name.freeze
        @zones = zones.freeze
      end

      # @return [String] the internal object state as a programmer-readable
      #   `String`.
      def inspect
        "#<#{self.class}: #@code>"
      end
    end
  end
end
