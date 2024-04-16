# encoding: UTF-8

module TZInfo
  module Format1
    # The format 1 TZInfo::Data time zone index file includes
    # {Format1::TimezoneIndexDefinition}, which provides methods used to define
    # time zones in the index.
    #
    # @private
    module TimezoneIndexDefinition #:nodoc:
      # Adds class methods to the includee and initializes class instance
      # variables.
      #
      # @param base [Module] the includee.
      def self.append_features(base)
        super
        base.extend(ClassMethods)
        base.instance_eval do
          @timezones = []
          @data_timezones = []
          @linked_timezones = []
        end
      end

      # Class methods for inclusion.
      #
      # @private
      module ClassMethods #:nodoc:
        # @return [Array<String>] a frozen `Array` containing the identifiers of
        #   all data time zones. Identifiers are sorted according to
        #   `String#<=>`.
        def data_timezones
          unless @data_timezones.frozen?
            @data_timezones = @data_timezones.sort.freeze
          end
          @data_timezones
        end

        # @return [Array<String>] a frozen `Array` containing the identifiers of
        #   all linked time zones. Identifiers are sorted according to
        #   `String#<=>`.
        def linked_timezones
          unless @linked_timezones.frozen?
            @linked_timezones = @linked_timezones.sort.freeze
          end
          @linked_timezones
        end

        private

        # Adds a data time zone to the index.
        #
        # @param identifier [String] the time zone identifier.
        def timezone(identifier)
          identifier = StringDeduper.global.dedupe(identifier)
          @timezones << identifier
          @data_timezones << identifier
        end

        # Adds a linked time zone to the index.
        #
        # @param identifier [String] the time zone identifier.
        def linked_timezone(identifier)
          identifier = StringDeduper.global.dedupe(identifier)
          @timezones << identifier
          @linked_timezones << identifier
        end
      end
    end
  end

  # Alias used by TZInfo::Data format 1 releases.
  #
  # @private
  TimezoneIndexDefinition = Format1::TimezoneIndexDefinition #:nodoc:
  private_constant :TimezoneIndexDefinition
end
