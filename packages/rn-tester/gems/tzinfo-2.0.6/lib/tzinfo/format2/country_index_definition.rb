# encoding: UTF-8

module TZInfo
  module Format2
    # The format 2 country index file includes
    # {Format2::CountryIndexDefinition}, which provides a
    # {CountryIndexDefinition::ClassMethods#country_index country_index} method
    # used to define the country index.
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
        base.instance_eval { @countries = {}.freeze }
      end

      # Class methods for inclusion.
      #
      # @private
      module ClassMethods #:nodoc:
        # @return [Hash<String, DataSources::CountryInfo>] a frozen `Hash`
        #   of all the countries that have been defined in the index keyed by
        #   their codes.
        attr_reader :countries

        private

        # Defines the index.
        #
        # @yield [definer] yields to allow the index to be defined.
        # @yieldparam definer [CountryIndexDefiner] a {CountryIndexDefiner}
        #   instance that should be used to define the index.
        def country_index
          definer = CountryIndexDefiner.new(StringDeduper.global, StringDeduper.new)
          yield definer
          @countries = definer.countries.freeze
        end
      end
    end
  end
end
