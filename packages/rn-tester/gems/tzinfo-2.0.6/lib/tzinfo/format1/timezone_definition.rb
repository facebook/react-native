# encoding: UTF-8

module TZInfo
  module Format1
    # {Format1::TimezoneDefinition} is included into format 1 time zone
    # definition modules and provides the methods for defining time zones.
    #
    # @private
    module TimezoneDefinition #:nodoc:
      # Adds class methods to the includee.
      #
      # @param base [Module] the includee.
      def self.append_features(base)
        super
        base.extend(Format2::TimezoneDefinition::ClassMethods)
        base.extend(ClassMethods)
      end

      # Class methods for inclusion.
      #
      # @private
      module ClassMethods #:nodoc:
        private

        # @return the class to be instantiated and yielded by
        # {Format2::TimezoneDefinition::ClassMethods#timezone}.
        def timezone_definer_class
          TimezoneDefiner
        end
      end
    end
  end

  # Alias used by TZInfo::Data format1 releases.
  #
  # @private
  TimezoneDefinition = Format1::TimezoneDefinition #:nodoc:
  private_constant :TimezoneDefinition
end
