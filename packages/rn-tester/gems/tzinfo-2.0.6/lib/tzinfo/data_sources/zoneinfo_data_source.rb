# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  module DataSources
    # An {InvalidZoneinfoDirectory} exception is raised if {ZoneinfoDataSource}
    # is initialized with a specific zoneinfo path that is not a valid zoneinfo
    # directory. A valid zoneinfo directory is one that contains time zone
    # files, a country code index file named iso3166.tab and a time zone index
    # file named zone1970.tab or zone.tab.
    class InvalidZoneinfoDirectory < StandardError
    end

    # A {ZoneinfoDirectoryNotFound} exception is raised if no valid zoneinfo
    # directory could be found when checking the paths listed in
    # {ZoneinfoDataSource.search_path}. A valid zoneinfo directory is one that
    # contains time zone files, a country code index file named iso3166.tab and
    # a time zone index file named zone1970.tab or zone.tab.
    class ZoneinfoDirectoryNotFound < StandardError
    end

    # A DataSource implementation that loads data from a 'zoneinfo' directory
    # containing compiled "TZif" version 3 (or earlier) files in addition to
    # iso3166.tab and zone1970.tab or zone.tab index files.
    #
    # To have TZInfo load the system zoneinfo files, call
    # {TZInfo::DataSource.set} as follows:
    #
    #     TZInfo::DataSource.set(:zoneinfo)
    #
    # To load zoneinfo files from a particular directory, pass the directory to
    # {TZInfo::DataSource.set}:
    #
    #     TZInfo::DataSource.set(:zoneinfo, directory)
    #
    # To load zoneinfo files from a particular directory, but load the
    # iso3166.tab index file from a separate location, pass the directory and
    # path to the iso3166.tab file to {TZInfo::DataSource.set}:
    #
    #     TZInfo::DataSource.set(:zoneinfo, directory, iso3166_path)
    #
    # Please note that versions of the 'zic' tool (used to build zoneinfo files)
    # that were released prior to February 2006 created zoneinfo files that used
    # 32-bit integers for transition timestamps. Later versions of zic produce
    # zoneinfo files that use 64-bit integers. If you have 32-bit zoneinfo files
    # on your system, then any queries falling outside of the range 1901-12-13
    # 20:45:52 to 2038-01-19 03:14:07 may be inaccurate.
    #
    # Most modern platforms include 64-bit zoneinfo files. However, Mac OS X (up
    # to at least 10.8.4) still uses 32-bit zoneinfo files.
    #
    # To check whether your zoneinfo files contain 32-bit or 64-bit transition
    # data, you can run the following code (substituting the identifier of the
    # zone you want to test for `zone_identifier`):
    #
    #     TZInfo::DataSource.set(:zoneinfo)
    #     dir = TZInfo::DataSource.get.zoneinfo_dir
    #     File.open(File.join(dir, zone_identifier), 'r') {|f| f.read(5) }
    #
    # If the last line returns `"TZif\\x00"`, then you have a 32-bit zoneinfo
    # file. If it returns `"TZif2"` or `"TZif3"` then you have a 64-bit zoneinfo
    # file.
    #
    # It is also worth noting that as of the 2017c release of the IANA Time Zone
    # Database, 64-bit zoneinfo files only include future transitions up to
    # 2038-01-19 03:14:07. Any queries falling after this time may be
    # inaccurate.
    class ZoneinfoDataSource < DataSource
      # The default value of {ZoneinfoDataSource.search_path}.
      DEFAULT_SEARCH_PATH = ['/usr/share/zoneinfo', '/usr/share/lib/zoneinfo', '/etc/zoneinfo'].freeze
      private_constant :DEFAULT_SEARCH_PATH

      # The default value of {ZoneinfoDataSource.alternate_iso3166_tab_search_path}.
      DEFAULT_ALTERNATE_ISO3166_TAB_SEARCH_PATH = ['/usr/share/misc/iso3166.tab', '/usr/share/misc/iso3166'].freeze
      private_constant :DEFAULT_ALTERNATE_ISO3166_TAB_SEARCH_PATH

      # Files and directories in the top level zoneinfo directory that will be
      # excluded from the list of available time zones:
      #
      #   - +VERSION is included on Mac OS X.
      #   - leapseconds is a list of leap seconds.
      #   - localtime is the current local timezone (may be a link).
      #   - posix, posixrules and right are directories containing other
      #     versions of the zoneinfo files.
      #   - SECURITY is included in the Arch Linux tzdata package.
      #   - src is a directory containing the tzdata source included on Solaris.
      #   - timeconfig is a symlink included on Slackware.
      EXCLUDED_FILENAMES = [
        '+VERSION',
        'leapseconds',
        'localtime',
        'posix',
        'posixrules',
        'right',
        'SECURITY',
        'src',
        'timeconfig'
      ].freeze
      private_constant :EXCLUDED_FILENAMES

      # Paths to be checked to find the system zoneinfo directory.
      #
      # @private
      @@search_path = DEFAULT_SEARCH_PATH.dup

      # Paths to possible alternate iso3166.tab files (used to locate the
      # system-wide iso3166.tab files on FreeBSD and OpenBSD).
      #
      # @private
      @@alternate_iso3166_tab_search_path = DEFAULT_ALTERNATE_ISO3166_TAB_SEARCH_PATH.dup

      class << self
        # An `Array` of directories that will be checked to find the system
        # zoneinfo directory.
        #
        # Directories are checked in the order they appear in the `Array`.
        #
        # The default value is `['/usr/share/zoneinfo',
        # '/usr/share/lib/zoneinfo', '/etc/zoneinfo']`.
        #
        # @return [Array<String>] an `Array` of directories to check in order to
        #   find the system zoneinfo directory.
        def search_path
          @@search_path
        end

        # Sets the directories to be checked when locating the system zoneinfo
        # directory.
        #
        # Can be set to an `Array` of directories or a `String` containing
        # directories separated with `File::PATH_SEPARATOR`.
        #
        # Directories are checked in the order they appear in the `Array` or
        # `String`.
        #
        # Set to `nil` to revert to the default paths.
        #
        # @param search_path [Object] either `nil` or a list of directories to
        #   check as either an `Array` of `String` or a `File::PATH_SEPARATOR`
        #   separated `String`.
        def search_path=(search_path)
          @@search_path = process_search_path(search_path, DEFAULT_SEARCH_PATH)
        end

        # An `Array` of paths that will be checked to find an alternate
        # iso3166.tab file if one was not included in the zoneinfo directory
        # (for example, on FreeBSD and OpenBSD systems).
        #
        # Paths are checked in the order they appear in the `Array`.
        #
        # The default value is `['/usr/share/misc/iso3166.tab',
        # '/usr/share/misc/iso3166']`.
        #
        # @return [Array<String>] an `Array` of paths to check in order to
        #   locate an iso3166.tab file.
        def alternate_iso3166_tab_search_path
          @@alternate_iso3166_tab_search_path
        end

        # Sets the paths to check to locate an alternate iso3166.tab file if one
        # was not included in the zoneinfo directory.
        #
        # Can be set to an `Array` of paths or a `String` containing paths
        # separated with `File::PATH_SEPARATOR`.
        #
        # Paths are checked in the order they appear in the array.
        #
        # Set to `nil` to revert to the default paths.
        #
        # @param alternate_iso3166_tab_search_path [Object] either `nil` or a
        #   list of paths to check as either an `Array` of `String` or a
        #   `File::PATH_SEPARATOR` separated `String`.
        def alternate_iso3166_tab_search_path=(alternate_iso3166_tab_search_path)
          @@alternate_iso3166_tab_search_path = process_search_path(alternate_iso3166_tab_search_path, DEFAULT_ALTERNATE_ISO3166_TAB_SEARCH_PATH)
        end

        private

        # Processes a path for use as the {search_path} or
        # {alternate_iso3166_tab_search_path}.
        #
        # @param path [Object] either `nil` or a list of paths to check as
        #   either an `Array` of `String` or a `File::PATH_SEPARATOR` separated
        #   `String`.
        # @param default [Array<String>] the default value.
        # @return [Array<String>] the processed path.
        def process_search_path(path, default)
          if path
            if path.kind_of?(String)
              path.split(File::PATH_SEPARATOR)
            else
              path.collect(&:to_s)
            end
          else
            default.dup
          end
        end
      end

      # @return [String] the zoneinfo directory being used.
      attr_reader :zoneinfo_dir

      # (see DataSource#country_codes)
      attr_reader :country_codes

      # Initializes a new {ZoneinfoDataSource}.
      #
      # If `zoneinfo_dir` is specified, it will be checked and used as the
      # source of zoneinfo files.
      #
      # The directory must contain a file named iso3166.tab and a file named
      # either zone1970.tab or zone.tab. These may either be included in the
      # root of the directory or in a 'tab' sub-directory and named country.tab
      # and zone_sun.tab respectively (as is the case on Solaris).
      #
      # Additionally, the path to iso3166.tab can be overridden using the
      # `alternate_iso3166_tab_path` parameter.
      #
      # If `zoneinfo_dir` is not specified or `nil`, the paths referenced in
      # {search_path} are searched in order to find a valid zoneinfo directory
      # (one that contains zone1970.tab or zone.tab and iso3166.tab files as
      # above).
      #
      # The paths referenced in {alternate_iso3166_tab_search_path} are also
      # searched to find an iso3166.tab file if one of the searched zoneinfo
      # directories doesn't contain an iso3166.tab file.
      #
      # @param zoneinfo_dir [String] an optional path to a directory to use as
      #   the source of zoneinfo files.
      # @param alternate_iso3166_tab_path [String] an optional path to the
      #   iso3166.tab file.
      # @raise [InvalidZoneinfoDirectory] if the iso3166.tab and zone1970.tab or
      #   zone.tab files cannot be found using the `zoneinfo_dir` and
      #   `alternate_iso3166_tab_path` parameters.
      # @raise [ZoneinfoDirectoryNotFound] if no valid directory can be found
      #   by searching.
      def initialize(zoneinfo_dir = nil, alternate_iso3166_tab_path = nil)
        super()

        if zoneinfo_dir
          iso3166_tab_path, zone_tab_path = validate_zoneinfo_dir(zoneinfo_dir, alternate_iso3166_tab_path)

          unless iso3166_tab_path && zone_tab_path
            raise InvalidZoneinfoDirectory, "#{zoneinfo_dir} is not a directory or doesn't contain a iso3166.tab file and a zone1970.tab or zone.tab file."
          end

          @zoneinfo_dir = zoneinfo_dir
        else
          @zoneinfo_dir, iso3166_tab_path, zone_tab_path = find_zoneinfo_dir

          unless @zoneinfo_dir && iso3166_tab_path && zone_tab_path
            raise ZoneinfoDirectoryNotFound, "None of the paths included in #{self.class.name}.search_path are valid zoneinfo directories."
          end
        end

        @zoneinfo_dir = File.expand_path(@zoneinfo_dir).freeze
        @timezone_identifiers = load_timezone_identifiers.freeze
        @countries = load_countries(iso3166_tab_path, zone_tab_path).freeze
        @country_codes = @countries.keys.sort!.freeze

        string_deduper = ConcurrentStringDeduper.new
        posix_tz_parser = PosixTimeZoneParser.new(string_deduper)
        @zoneinfo_reader = ZoneinfoReader.new(posix_tz_parser, string_deduper)
      end

      # Returns a frozen `Array` of all the available time zone identifiers. The
      # identifiers are sorted according to `String#<=>`.
      #
      # @return [Array<String>] a frozen `Array` of all the available time zone
      #   identifiers.
      def data_timezone_identifiers
        @timezone_identifiers
      end

      # Returns an empty `Array`. There is no information about linked/aliased
      # time zones in the zoneinfo files. When using {ZoneinfoDataSource}, every
      # time zone will be returned as a {DataTimezone}.
      #
      # @return [Array<String>] an empty `Array`.
      def linked_timezone_identifiers
        [].freeze
      end

      # (see DataSource#to_s)
      def to_s
        "Zoneinfo DataSource: #{@zoneinfo_dir}"
      end

      # (see DataSource#inspect)
      def inspect
        "#<#{self.class}: #{@zoneinfo_dir}>"
      end

      protected

      # Returns a {TimezoneInfo} instance for the given time zone identifier.
      # The result will either be a {ConstantOffsetDataTimezoneInfo} or a
      # {TransitionsDataTimezoneInfo}.
      #
      # @param identifier [String] A time zone identifier.
      # @return [TimezoneInfo] a {TimezoneInfo} instance for the given time zone
      #   identifier.
      # @raise [InvalidTimezoneIdentifier] if the time zone is not found, the
      #   identifier is invalid, the zoneinfo file cannot be opened or the
      #   zoneinfo file is not valid.
      def load_timezone_info(identifier)
        valid_identifier = validate_timezone_identifier(identifier)
        path = File.join(@zoneinfo_dir, valid_identifier)

        zoneinfo = begin
          @zoneinfo_reader.read(path)
        rescue Errno::EACCES, InvalidZoneinfoFile => e
          raise InvalidTimezoneIdentifier, "#{e.message.encode(Encoding::UTF_8)} (loading #{valid_identifier})"
        rescue Errno::EISDIR, Errno::ENAMETOOLONG, Errno::ENOENT, Errno::ENOTDIR
          raise InvalidTimezoneIdentifier, "Invalid identifier: #{valid_identifier}"
        end

        if zoneinfo.kind_of?(TimezoneOffset)
          ConstantOffsetDataTimezoneInfo.new(valid_identifier, zoneinfo)
        else
          TransitionsDataTimezoneInfo.new(valid_identifier, zoneinfo)
        end
      end

      # (see DataSource#load_country_info)
      def load_country_info(code)
        lookup_country_info(@countries, code)
      end

      private

      # Validates a zoneinfo directory and returns the paths to the iso3166.tab
      # and zone1970.tab or zone.tab files if valid. If the directory is not
      # valid, returns `nil`.
      #
      # The path to the iso3166.tab file may be overridden by passing in a path.
      # This is treated as either absolute or relative to the current working
      # directory.
      #
      # @param path [String] the path to a possible zoneinfo directory.
      # @param iso3166_tab_path [String] an optional path to an external
      #   iso3166.tab file.
      # @return [Array<String>] an `Array` containing the iso3166.tab and
      #   zone.tab paths if the directory is valid, otherwise `nil`.
      def validate_zoneinfo_dir(path, iso3166_tab_path = nil)
        if File.directory?(path)
          if iso3166_tab_path
            return nil unless File.file?(iso3166_tab_path)
          else
            iso3166_tab_path = resolve_tab_path(path, ['iso3166.tab'], 'country.tab')
            return nil unless iso3166_tab_path
          end

          zone_tab_path = resolve_tab_path(path, ['zone1970.tab', 'zone.tab'], 'zone_sun.tab')
          return nil unless zone_tab_path

          [iso3166_tab_path, zone_tab_path]
        else
          nil
        end
      end

      # Attempts to resolve the path to a tab file given its standard names and
      # tab sub-directory name (as used on Solaris).
      #
      # @param zoneinfo_path [String] the path to a zoneinfo directory.
      # @param standard_names [Array<String>] the standard names for the tab
      #   file.
      # @param tab_name [String] the alternate name for the tab file to check in
      #   the tab sub-directory.
      # @return [String] the path to the tab file.
      def resolve_tab_path(zoneinfo_path, standard_names, tab_name)
        standard_names.each do |standard_name|
          path = File.join(zoneinfo_path, standard_name)
          return path if File.file?(path)
        end

        path = File.join(zoneinfo_path, 'tab', tab_name)
        return path if File.file?(path)

        nil
      end

      # Finds a zoneinfo directory using {search_path} and
      # {alternate_iso3166_tab_search_path}.
      #
      # @return [Array<String>] an `Array` containing the iso3166.tab and
      #   zone.tab paths if a zoneinfo directory was found, otherwise `nil`.
      def find_zoneinfo_dir
        alternate_iso3166_tab_path = self.class.alternate_iso3166_tab_search_path.detect do |path|
          File.file?(path)
        end

        self.class.search_path.each do |path|
          # Try without the alternate_iso3166_tab_path first.
          iso3166_tab_path, zone_tab_path = validate_zoneinfo_dir(path)
          return path, iso3166_tab_path, zone_tab_path if iso3166_tab_path && zone_tab_path

          if alternate_iso3166_tab_path
            iso3166_tab_path, zone_tab_path = validate_zoneinfo_dir(path, alternate_iso3166_tab_path)
            return path, iso3166_tab_path, zone_tab_path if iso3166_tab_path && zone_tab_path
          end
        end

        # Not found.
        nil
      end

      # Scans @zoneinfo_dir and returns an `Array` of available time zone
      # identifiers. The result is sorted according to `String#<=>`.
      #
      # @return [Array<String>] an `Array` containing all the time zone
      #   identifiers found.
      def load_timezone_identifiers
        index = []

        enum_timezones([], EXCLUDED_FILENAMES) do |identifier|
          index << identifier.join('/').freeze
        end

        index.sort!
      end

      # Recursively enumerate a directory of time zones.
      #
      # @param dir [Array<String>] the directory to enumerate as an `Array` of
      #   path components.
      # @param exclude [Array<String>] file names to exclude when scanning
      #   `dir`.
      # @yield [path] the path of each time zone file found is passed to
      #   the block.
      # @yieldparam path [Array<String>] the path of a time zone file as an
      #   `Array` of path components.
      def enum_timezones(dir, exclude = [], &block)
        Dir.foreach(File.join(@zoneinfo_dir, *dir)) do |entry|
          begin
            entry.encode!(Encoding::UTF_8)
          rescue EncodingError
            next
          end

          unless entry =~ /\./ || exclude.include?(entry)
            RubyCoreSupport.untaint(entry)
            path = dir + [entry]
            full_path = File.join(@zoneinfo_dir, *path)

            if File.directory?(full_path)
              enum_timezones(path, [], &block)
            elsif File.file?(full_path)
              yield path
            end
          end
        end
      end

      # Uses the iso3166.tab and zone1970.tab or zone.tab files to return a Hash
      # mapping country codes to CountryInfo instances.
      #
      # @param iso3166_tab_path [String] the path to the iso3166.tab file.
      # @param zone_tab_path [String] the path to the zone.tab file.
      # @return [Hash<String, CountryInfo>] a mapping from ISO 3166-1 alpha-2
      #   country codes to {CountryInfo} instances.
      def load_countries(iso3166_tab_path, zone_tab_path)

        # Handle standard 3 to 4 column zone.tab files as well as the 4 to 5
        # column format used by Solaris.
        #
        # On Solaris, an extra column before the comment gives an optional
        # linked/alternate timezone identifier (or '-' if not set).
        #
        # Additionally, there is a section at the end of the file for timezones
        # covering regions. These are given lower-case "country" codes. The timezone
        # identifier column refers to a continent instead of an identifier. These
        # lines will be ignored by TZInfo.
        #
        # Since the last column is optional in both formats, testing for the
        # Solaris format is done in two passes. The first pass identifies if there
        # are any lines using 5 columns.


        # The first column is allowed to be a comma separated list of country
        # codes, as used in zone1970.tab (introduced in tzdata 2014f).
        #
        # The first country code in the comma-separated list is the country that
        # contains the city the zone identifier is based on. The first country
        # code on each line is considered to be primary with the others
        # secondary.
        #
        # The zones for each country are ordered primary first, then secondary.
        # Within the primary and secondary groups, the zones are ordered by their
        # order in the file.

        file_is_5_column = false
        zone_tab = []

        file = File.read(zone_tab_path, external_encoding: Encoding::UTF_8, internal_encoding: Encoding::UTF_8)
        file.each_line do |line|
          line.chomp!

          if line =~ /\A([A-Z]{2}(?:,[A-Z]{2})*)\t(?:([+\-])(\d{2})(\d{2})([+\-])(\d{3})(\d{2})|([+\-])(\d{2})(\d{2})(\d{2})([+\-])(\d{3})(\d{2})(\d{2}))\t([^\t]+)(?:\t([^\t]+))?(?:\t([^\t]+))?\z/
            codes = $1

            if $2
              latitude = dms_to_rational($2, $3, $4)
              longitude = dms_to_rational($5, $6, $7)
            else
              latitude = dms_to_rational($8, $9, $10, $11)
              longitude = dms_to_rational($12, $13, $14, $15)
            end

            zone_identifier = $16
            column4 = $17
            column5 = $18

            file_is_5_column = true if column5

            zone_tab << [codes.split(','.freeze), zone_identifier, latitude, longitude, column4, column5]
          end
        end

        string_deduper = StringDeduper.new
        primary_zones = {}
        secondary_zones = {}

        zone_tab.each do |codes, zone_identifier, latitude, longitude, column4, column5|
          description = file_is_5_column ? column5 : column4
          description = string_deduper.dedupe(description) if description

          # Lookup the identifier in the timezone index, so that the same
          # String instance can be used (saving memory).
          begin
            zone_identifier = validate_timezone_identifier(zone_identifier)
          rescue InvalidTimezoneIdentifier
            # zone_identifier is not valid, dedupe and allow anyway.
            zone_identifier = string_deduper.dedupe(zone_identifier)
          end

          country_timezone = CountryTimezone.new(zone_identifier, latitude, longitude, description)

          # codes will always have at least one element

          (primary_zones[codes.first.freeze] ||= []) << country_timezone

          codes[1..-1].each do |code|
            (secondary_zones[code.freeze] ||= []) << country_timezone
          end
        end

        countries = {}

        file = File.read(iso3166_tab_path, external_encoding: Encoding::UTF_8, internal_encoding: Encoding::UTF_8)
        file.each_line do |line|
          line.chomp!

          # Handle both the two column alpha-2 and name format used in the tz
          # database as well as the 4 column alpha-2, alpha-3, numeric-3 and
          # name format used by FreeBSD and OpenBSD.

          if line =~ /\A([A-Z]{2})(?:\t[A-Z]{3}\t[0-9]{3})?\t(.+)\z/
            code = $1
            name = $2
            zones = (primary_zones[code] || []) + (secondary_zones[code] || [])

            countries[code] = CountryInfo.new(code, name, zones)
          end
        end

        countries
      end

      # Converts degrees, minutes and seconds to a Rational.
      #
      # @param sign [String] `'-'` or `'+'`.
      # @param degrees [String] the number of degrees.
      # @param minutes [String] the number of minutes.
      # @param seconds [String] the number of seconds (optional).
      # @return [Rational] the result of converting from degrees, minutes and
      #   seconds to a `Rational`.
      def dms_to_rational(sign, degrees, minutes, seconds = nil)
        degrees = degrees.to_i
        minutes = minutes.to_i
        sign = sign == '-'.freeze ? -1 : 1

        if seconds
          Rational(sign * (degrees * 3600 + minutes * 60 + seconds.to_i), 3600)
        else
          Rational(sign * (degrees * 60 + minutes), 60)
        end
      end
    end
  end
end
