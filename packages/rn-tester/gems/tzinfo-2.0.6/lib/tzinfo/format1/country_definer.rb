# encoding: UTF-8

module TZInfo
  module Format1
    # Instances of {Format1::CountryDefiner} are yielded to the format 1 version
    # of `TZInfo::Data::Indexes::Countries` by {CountryIndexDefinition} to allow
    # the zones of a country to be specified.
    #
    # @private
    class CountryDefiner < Format2::CountryDefiner #:nodoc:
      # Initializes a new {CountryDefiner}.
      def initialize(identifier_deduper, description_deduper)
        super(nil, identifier_deduper, description_deduper)
      end
    end
  end
end
