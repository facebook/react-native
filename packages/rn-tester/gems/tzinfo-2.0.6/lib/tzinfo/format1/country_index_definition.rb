# encoding: UTF-8

module TZInfo
  module Format1
    # The format 1 TZInfo::Data country index file includes
    # {Format1::CountryIndexDefinition}, which provides a
    # {CountryIndexDefinition::ClassMethods#country country} method used to
    # define each country in the index.
    #
    # @private
    module CountryIndexDefinition #:nodoc:
      # Adds class methods to the includee and initializes class instance
      # variables.
      #
      # @param base [Module] the includee.
      def self.append_features(base)
        super
        base.extend(ClassMethods)
        base.instance_eval { @countries = {} }
      end

      # Class methods for inclusion.
      #
      # @private
      module ClassMethods #:nodoc:
        # @return [Hash<String, DataSources::CountryInfo>] a frozen `Hash`
        #   of all the countries that have been defined in the index keyed by
        #   their codes.
        def countries
          @description_deduper = nil
          @countries.freeze
        end

        private

        # Defines a country with an ISO 3166-1 alpha-2 country code and name.
        #
        # @param code [String] the ISO 3166-1 alpha-2 country code.
        # @param name [String] the name of the country.
        # @yield [definer] (optional) to obtain the time zones for the country.
        # @yieldparam definer [CountryDefiner] a {CountryDefiner} instance.
        def country(code, name)
          @description_deduper ||= StringDeduper.new

          zones = if block_given?
            definer = CountryDefiner.new(StringDeduper.global, @description_deduper)
            yield definer
            definer.timezones
          else
            []
          end

          @countries[code.freeze] = DataSources::CountryInfo.new(code, name, zones)
        end
      end
    end
  end

  # Alias used by TZInfo::Data format1 releases.
  #
  # @private
  CountryIndexDefinition = Format1::CountryIndexDefinition #:nodoc:
  private_constant :CountryIndexDefinition
end
