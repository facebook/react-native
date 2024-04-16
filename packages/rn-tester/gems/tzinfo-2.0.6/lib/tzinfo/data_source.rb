# encoding: UTF-8
# frozen_string_literal: true

require 'concurrent'
require 'thread'

module TZInfo
  # {InvalidDataSource} is raised if the selected {DataSource} doesn't implement
  # one of the required methods.
  class InvalidDataSource < StandardError
  end

  # {DataSourceNotFound} is raised if no data source could be found (i.e. if
  # `'tzinfo/data'` cannot be found on the load path and no valid zoneinfo
  # directory can be found on the system).
  class DataSourceNotFound < StandardError
  end

  # TZInfo can be used with different data sources for time zone and country
  # data. Each source of data is implemented as a subclass of {DataSource}.
  #
  # To choose a data source and override the default selection, use the
  # {DataSource.set} method.
  #
  # @abstract To create a custom data source, create a subclass of {DataSource}
  #   and implement the {load_timezone_info}, {data_timezone_identifiers},
  #   {linked_timezone_identifiers}, {load_country_info} and {country_codes}
  #   methods.
  class DataSource
    # The currently selected data source.
    #
    # @private
    @@instance = nil

    # A `Mutex` used to ensure the default data source is only created once.
    #
    # @private
    @@default_mutex = Mutex.new

    class << self
      # @return [DataSource] the currently selected source of data.
      def get
        # If a DataSource hasn't been manually set when the first request is
        # made to obtain a DataSource, then a default data source is created.
        #
        # This is done at the first request rather than when TZInfo is loaded to
        # avoid unnecessary attempts to find a suitable DataSource.
        #
        # A `Mutex` is used to ensure that only a single default instance is
        # created (this avoiding the possibility of retaining two copies of the
        # same data in memory).

        unless @@instance
          @@default_mutex.synchronize do
            set(create_default_data_source) unless @@instance
          end
        end

        @@instance
      end

      # Sets the currently selected data source for time zone and country data.
      #
      # This should usually be set to one of the two standard data source types:
      #
      # * `:ruby` - read data from the Ruby modules included in the TZInfo::Data
      #   library (tzinfo-data gem).
      # * `:zoneinfo` - read data from the zoneinfo files included with most
      #   Unix-like operating systems (e.g. in /usr/share/zoneinfo).
      #
      # To set TZInfo to use one of the standard data source types, call
      # `TZInfo::DataSource.set`` in one of the following ways:
      #
      #     TZInfo::DataSource.set(:ruby)
      #     TZInfo::DataSource.set(:zoneinfo)
      #     TZInfo::DataSource.set(:zoneinfo, zoneinfo_dir)
      #     TZInfo::DataSource.set(:zoneinfo, zoneinfo_dir, iso3166_tab_file)
      #
      # `DataSource.set(:zoneinfo)` will automatically search for the zoneinfo
      # directory by checking the paths specified in
      # {DataSources::ZoneinfoDataSource.search_path}.
      # {DataSources::ZoneinfoDirectoryNotFound} will be raised if no valid
      # zoneinfo directory could be found.
      #
      # `DataSource.set(:zoneinfo, zoneinfo_dir)` uses the specified
      # `zoneinfo_dir` directory as the data source. If the directory is not a
      # valid zoneinfo directory, a {DataSources::InvalidZoneinfoDirectory}
      # exception will be raised.
      #
      # `DataSource.set(:zoneinfo, zoneinfo_dir, iso3166_tab_file)` uses the
      # specified `zoneinfo_dir` directory as the data source, but loads the
      # `iso3166.tab` file from the path given by `iso3166_tab_file`. If the
      # directory is not a valid zoneinfo directory, a
      # {DataSources::InvalidZoneinfoDirectory} exception will be raised.
      #
      # Custom data sources can be created by subclassing TZInfo::DataSource and
      # implementing the following methods:
      #
      # * {load_timezone_info}
      # * {data_timezone_identifiers}
      # * {linked_timezone_identifiers}
      # * {load_country_info}
      # * {country_codes}
      #
      # To have TZInfo use the custom data source, call {DataSource.set},
      # passing an instance of the custom data source implementation as follows:
      #
      #     TZInfo::DataSource.set(CustomDataSource.new)
      #
      # Calling {DataSource.set} will only affect instances of {Timezone} and
      # {Country} obtained with {Timezone.get} and {Country.get} subsequent to
      # the {DataSource.set} call. Existing {Timezone} and {Country} instances
      # will be unaffected.
      #
      # If {DataSource.set} is not called, TZInfo will by default attempt to use
      # TZInfo::Data as the data source. If TZInfo::Data is not available (i.e.
      # if `require 'tzinfo/data'` fails), then TZInfo will search for a
      # zoneinfo directory instead (using the search path specified by
      # {DataSources::ZoneinfoDataSource.search_path}).
      #
      # @param data_source_or_type [Object] either `:ruby`, `:zoneinfo` or an
      #   instance of a {DataSource}.
      # @param args [Array<Object>] when `data_source_or_type` is a symbol,
      #   optional arguments to use when initializing the data source.
      # @raise [ArgumentError] if `data_source_or_type` is not `:ruby`,
      #   `:zoneinfo` or an instance of {DataSource}.
      def set(data_source_or_type, *args)
        if data_source_or_type.kind_of?(DataSource)
          @@instance = data_source_or_type
        elsif data_source_or_type == :ruby
          @@instance = DataSources::RubyDataSource.new
        elsif data_source_or_type == :zoneinfo
          @@instance = DataSources::ZoneinfoDataSource.new(*args)
        else
          raise ArgumentError, 'data_source_or_type must be a DataSource instance or a data source type (:ruby or :zoneinfo)'
        end
      end

      private

      # Creates a {DataSource} instance for use as the default. Used if no
      # preference has been specified manually.
      #
      # @return [DataSource] the newly created default {DataSource} instance.
      def create_default_data_source
        has_tzinfo_data = false

        begin
          require 'tzinfo/data'
          has_tzinfo_data = true
        rescue LoadError
        end

        return DataSources::RubyDataSource.new if has_tzinfo_data

        begin
          return DataSources::ZoneinfoDataSource.new
        rescue DataSources::ZoneinfoDirectoryNotFound
          raise DataSourceNotFound, "No source of timezone data could be found.\nPlease refer to https://tzinfo.github.io/datasourcenotfound for help resolving this error."
        end
      end
    end

    # Initializes a new {DataSource} instance. Typically only called via
    # subclasses of {DataSource}.
    def initialize
      @timezones = Concurrent::Map.new
    end

    # Returns a {DataSources::TimezoneInfo} instance for the given identifier.
    # The result will derive from either {DataSources::DataTimezoneInfo} for
    # time zones that define their own data or {DataSources::LinkedTimezoneInfo}
    # for links or aliases to other time zones.
    #
    # {get_timezone_info} calls {load_timezone_info} to create the
    # {DataSources::TimezoneInfo} instance. The returned instance is cached and
    # returned in subsequent calls to {get_timezone_info} for the identifier.
    #
    # @param identifier [String] A time zone identifier.
    # @return [DataSources::TimezoneInfo] a {DataSources::TimezoneInfo} instance
    #   for a given identifier.
    # @raise [InvalidTimezoneIdentifier] if the time zone is not found or the
    #   identifier is invalid.
    def get_timezone_info(identifier)
      result = @timezones[identifier]

      unless result
        # Thread-safety: It is possible that multiple equivalent TimezoneInfo
        # instances could be created here in concurrently executing threads. The
        # consequences of this are that the data may be loaded more than once
        # (depending on the data source). The performance benefit of ensuring
        # that only a single instance is created is unlikely to be worth the
        # overhead of only allowing one TimezoneInfo to be loaded at a time.

        result = load_timezone_info(identifier)
        @timezones[result.identifier] = result
      end

      result
    end

    # @return [Array<String>] a frozen `Array`` of all the available time zone
    #   identifiers. The identifiers are sorted according to `String#<=>`.
    def timezone_identifiers
      # Thread-safety: It is possible that the value of @timezone_identifiers
      # may be calculated multiple times in concurrently executing threads. It
      # is not worth the overhead of locking to ensure that
      # @timezone_identifiers is only calculated once.
      @timezone_identifiers ||= build_timezone_identifiers
    end

    # Returns a frozen `Array` of all the available time zone identifiers for
    # data time zones (i.e. those that actually contain definitions). The
    # identifiers are sorted according to `String#<=>`.
    #
    # @return [Array<String>] a frozen `Array` of all the available time zone
    #   identifiers for data time zones.
    def data_timezone_identifiers
      raise_invalid_data_source('data_timezone_identifiers')
    end

    # Returns a frozen `Array` of all the available time zone identifiers that
    # are links to other time zones. The identifiers are sorted according to
    # `String#<=>`.
    #
    # @return [Array<String>] a frozen `Array` of all the available time zone
    #   identifiers that are links to other time zones.
    def linked_timezone_identifiers
      raise_invalid_data_source('linked_timezone_identifiers')
    end

    # @param code [String] an ISO 3166-1 alpha-2 country code.
    # @return [DataSources::CountryInfo] a {DataSources::CountryInfo} instance
    #   for the given ISO 3166-1 alpha-2 country code.
    # @raise [InvalidCountryCode] if the country could not be found or the code
    #   is invalid.
    def get_country_info(code)
      load_country_info(code)
    end

    # Returns a frozen `Array` of all the available ISO 3166-1 alpha-2 country
    # codes. The identifiers are sorted according to `String#<=>`.
    #
    # @return [Array<String>] a frozen `Array` of all the available ISO 3166-1
    #   alpha-2 country codes.
    def country_codes
      raise_invalid_data_source('country_codes')
    end

    # Loads all timezone and country data into memory.
    #
    # This may be desirable in production environments to improve copy-on-write
    # performance and to avoid flushing the constant cache every time a new
    # timezone or country is loaded from {DataSources::RubyDataSource}.
    def eager_load!
      timezone_identifiers.each {|identifier| load_timezone_info(identifier) }
      country_codes.each {|code| load_country_info(code) }
      nil
    end

    # @return [String] a description of the {DataSource}.
    def to_s
      "Default DataSource"
    end

    # @return [String] the internal object state as a programmer-readable
    #   `String`.
    def inspect
      "#<#{self.class}>"
    end

    protected

    # Returns a {DataSources::TimezoneInfo} instance for the given time zone
    # identifier. The result should derive from either
    # {DataSources::DataTimezoneInfo} for time zones that define their own data
    # or {DataSources::LinkedTimezoneInfo} for links to or aliases for other
    # time zones.
    #
    # @param identifier [String] A time zone identifier.
    # @return [DataSources::TimezoneInfo] a {DataSources::TimezoneInfo} instance
    #   for the given time zone identifier.
    # @raise [InvalidTimezoneIdentifier] if the time zone is not found or the
    #   identifier is invalid.
    def load_timezone_info(identifier)
      raise_invalid_data_source('load_timezone_info')
    end

    # @param code [String] an ISO 3166-1 alpha-2 country code.
    # @return [DataSources::CountryInfo] a {DataSources::CountryInfo} instance
    #   for the given ISO 3166-1 alpha-2 country code.
    # @raise [InvalidCountryCode] if the country could not be found or the code
    #   is invalid.
    def load_country_info(code)
      raise_invalid_data_source('load_country_info')
    end

    # @return [Encoding] the `Encoding` used by the `String` instances returned
    #   by {data_timezone_identifiers} and {linked_timezone_identifiers}.
    def timezone_identifier_encoding
      Encoding::UTF_8
    end

    # Checks that the given identifier is a valid time zone identifier (can be
    # found in the {timezone_identifiers} `Array`). If the identifier is valid,
    # the `String` instance representing that identifier from
    # `timezone_identifiers` is returned. Otherwise an
    # {InvalidTimezoneIdentifier} exception is raised.
    #
    # @param identifier [String] a time zone identifier to be validated.
    # @return [String] the `String` instance equivalent to `identifier` from
    #   {timezone_identifiers}.
    # @raise [InvalidTimezoneIdentifier] if `identifier` was not found in
    #   {timezone_identifiers}.
    def validate_timezone_identifier(identifier)
      raise InvalidTimezoneIdentifier, "Invalid identifier: #{identifier.nil? ? 'nil' : identifier}" unless identifier.kind_of?(String)

      valid_identifier = try_with_encoding(identifier, timezone_identifier_encoding) {|id| find_timezone_identifier(id) }
      return valid_identifier if valid_identifier

      raise InvalidTimezoneIdentifier, "Invalid identifier: #{identifier.encode(Encoding::UTF_8)}"
    end

    # Looks up a given code in the given hash of code to
    # {DataSources::CountryInfo} mappings. If the code is found the
    # {DataSources::CountryInfo} is returned. Otherwise an {InvalidCountryCode}
    # exception is raised.
    #
    # @param hash [String, DataSources::CountryInfo] a mapping from ISO 3166-1
    #   alpha-2 country codes to {DataSources::CountryInfo} instances.
    # @param code [String] a country code to lookup.
    # @param encoding [Encoding] the encoding used for the country codes in
    #   `hash`.
    # @return [DataSources::CountryInfo] the {DataSources::CountryInfo} instance
    #   corresponding to `code`.
    # @raise [InvalidCountryCode] if `code` was not found in `hash`.
    def lookup_country_info(hash, code, encoding = Encoding::UTF_8)
      raise InvalidCountryCode, "Invalid country code: #{code.nil? ? 'nil' : code}" unless code.kind_of?(String)

      info = try_with_encoding(code, encoding) {|c| hash[c] }
      return info if info

      raise InvalidCountryCode, "Invalid country code: #{code.encode(Encoding::UTF_8)}"
    end

    private

    # Raises {InvalidDataSource} to indicate that a method has not been
    # overridden by a particular data source implementation.
    #
    # @raise [InvalidDataSource] always.
    def raise_invalid_data_source(method_name)
      raise InvalidDataSource, "#{method_name} not defined"
    end

    # Combines {data_timezone_identifiers} and {linked_timezone_identifiers}
    # to create an `Array` containing all valid time zone identifiers. If
    # {linked_timezone_identifiers} is empty, the {data_timezone_identifiers}
    # instance is returned.
    #
    # The returned `Array` is frozen. The identifiers are sorted according to
    # `String#<=>`.
    #
    # @return [Array<String>] an `Array` containing all valid time zone
    #   identifiers.
    def build_timezone_identifiers
      data = data_timezone_identifiers
      linked = linked_timezone_identifiers
      linked.empty? ? data : (data + linked).sort!.freeze
    end

    if [].respond_to?(:bsearch)
      # If the given `identifier` is contained within the {timezone_identifiers}
      # `Array`, the `String` instance representing that identifier from
      # {timezone_identifiers} is returned. Otherwise, `nil` is returned.
      #
      # @param identifier [String] A time zone identifier to search for.
      # @return [String] the `String` instance representing `identifier` from
      #   {timezone_identifiers} if found, or `nil` if not found.
      #
      # :nocov_no_array_bsearch:
      def find_timezone_identifier(identifier)

        result = timezone_identifiers.bsearch {|i| i >= identifier }
        result == identifier ? result : nil
      end
      # :nocov_no_array_bsearch:
    else
      # If the given `identifier` is contained within the {timezone_identifiers}
      # `Array`, the `String` instance representing that identifier from
      # {timezone_identifiers} is returned. Otherwise, `nil` is returned.
      #
      # @param identifier [String] A time zone identifier to search for.
      # @return [String] the `String` instance representing `identifier` from
      #   {timezone_identifiers} if found, or `nil` if not found.
      #
      # :nocov_array_bsearch:
      def find_timezone_identifier(identifier)
        identifiers = timezone_identifiers
        low = 0
        high = identifiers.length

        while low < high do
          mid = (low + high).div(2)
          mid_identifier = identifiers[mid]
          cmp = mid_identifier <=> identifier

          return mid_identifier if cmp == 0

          if cmp > 0
            high = mid
          else
            low = mid + 1
          end
        end

        nil
      end
      # :nocov_array_bsearch:
    end

    # Tries an operation using `string` directly. If the operation fails, the
    # string is copied and encoded with `encoding` and the operation is tried
    # again.
    #
    # @param string [String] The `String` to perform the operation on.
    # @param encoding [Encoding] The `Encoding` to use if the initial attempt
    #   fails.
    # @yield [s] the caller will be yielded to once or twice to attempt the
    #   operation.
    # @yieldparam s [String] either `string` or an encoded copy of `string`.
    # @yieldreturn [Object] The result of the operation. Must be truthy if
    #   successful.
    # @return [Object] the result of the operation or `nil` if the first attempt
    # fails and `string` is already encoded with `encoding`.
    def try_with_encoding(string, encoding)
      result = yield string
      return result if result

      unless encoding == string.encoding
        string = string.encode(encoding)
        yield string
      end
    end
  end
end
