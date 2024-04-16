# encoding: UTF-8
# frozen_string_literal: true

module TZInfo
  module DataSources
    # An {InvalidZoneinfoFile} exception is raised if an attempt is made to load
    # an invalid zoneinfo file.
    class InvalidZoneinfoFile < StandardError
    end

    # Reads compiled zoneinfo TZif (\0, 2 or 3) files.
    class ZoneinfoReader #:nodoc:
      # The year to generate transitions up to.
      #
      # @private
      GENERATE_UP_TO = Time.now.utc.year + 100
      private_constant :GENERATE_UP_TO

      # Initializes a new {ZoneinfoReader}.
      #
      # @param posix_tz_parser [PosixTimeZoneParser] a {PosixTimeZoneParser}
      #   instance to use to parse POSIX-style TZ strings.
      # @param string_deduper [StringDeduper] a {StringDeduper} instance to use
      #   to dedupe abbreviations.
      def initialize(posix_tz_parser, string_deduper)
        @posix_tz_parser = posix_tz_parser
        @string_deduper = string_deduper
      end

      # Reads a zoneinfo structure from the given path. Returns either a
      # {TimezoneOffset} that is constantly observed or an `Array`
      # {TimezoneTransition}s.
      #
      # @param file_path [String] the path of a zoneinfo file.
      # @return [Object] either a {TimezoneOffset} or an `Array` of
      #   {TimezoneTransition}s.
      # @raise [SecurityError] if safe mode is enabled and `file_path` is
      #   tainted.
      # @raise [InvalidZoneinfoFile] if `file_path`` does not refer to a valid
      #   zoneinfo file.
      def read(file_path)
        File.open(file_path, 'rb') { |file| parse(file) }
      end

      private

      # Translates an unsigned 32-bit integer (as returned by unpack) to signed
      # 32-bit.
      #
      # @param long [Integer] an unsigned 32-bit integer.
      # @return [Integer] {long} translated to signed 32-bit.
      def make_signed_int32(long)
        long >= 0x80000000 ? long - 0x100000000 : long
      end

      # Translates a pair of unsigned 32-bit integers (as returned by unpack,
      # most significant first) to a signed 64-bit integer.
      #
      # @param high [Integer] the most significant 32-bits.
      # @param low [Integer] the least significant 32-bits.
      # @return [Integer] {high} and {low} combined and translated to signed
      #   64-bit.
      def make_signed_int64(high, low)
        unsigned = (high << 32) | low
        unsigned >= 0x8000000000000000 ? unsigned - 0x10000000000000000 : unsigned
      end

      # Reads the given number of bytes from the given file and checks that the
      # correct number of bytes could be read.
      #
      # @param file [IO] the file to read from.
      # @param bytes [Integer] the number of bytes to read.
      # @return [String] the bytes that were read.
      # @raise [InvalidZoneinfoFile] if the number of bytes available didn't
      #   match the number requested.
      def check_read(file, bytes)
        result = file.read(bytes)

        unless result && result.length == bytes
          raise InvalidZoneinfoFile, "Expected #{bytes} bytes reading '#{file.path}', but got #{result ? result.length : 0} bytes"
        end

        result
      end

      # Zoneinfo files don't include the offset from standard time (std_offset)
      # for DST periods. Derive the base offset (base_utc_offset) where DST is
      # observed from either the previous or next non-DST period.
      #
      # @param transitions [Array<Hash>] an `Array` of transition hashes.
      # @param offsets [Array<Hash>] an `Array` of offset hashes.
      # @return [Integer] the index of the offset to be used prior to the first
      #   transition.
      def derive_offsets(transitions, offsets)
        # The first non-DST offset (if there is one) is the offset observed
        # before the first transition. Fall back to the first DST offset if
        # there are no non-DST offsets.
        first_non_dst_offset_index = offsets.index {|o| !o[:is_dst] }
        first_offset_index = first_non_dst_offset_index || 0
        return first_offset_index if transitions.empty?

        # Determine the base_utc_offset of the next non-dst offset at each transition.
        base_utc_offset_from_next = nil

        transitions.reverse_each do |transition|
          offset = offsets[transition[:offset]]
          if offset[:is_dst]
            transition[:base_utc_offset_from_next] = base_utc_offset_from_next if base_utc_offset_from_next
          else
            base_utc_offset_from_next = offset[:observed_utc_offset]
          end
        end

        base_utc_offset_from_previous = first_non_dst_offset_index ? offsets[first_non_dst_offset_index][:observed_utc_offset] : nil
        defined_offsets = {}

        transitions.each do |transition|
          offset_index = transition[:offset]
          offset = offsets[offset_index]
          observed_utc_offset = offset[:observed_utc_offset]

          if offset[:is_dst]
            base_utc_offset_from_next = transition[:base_utc_offset_from_next]

            difference_to_previous = (observed_utc_offset - (base_utc_offset_from_previous || observed_utc_offset)).abs
            difference_to_next = (observed_utc_offset - (base_utc_offset_from_next || observed_utc_offset)).abs

            base_utc_offset = if difference_to_previous == 3600
              base_utc_offset_from_previous
            elsif difference_to_next == 3600
              base_utc_offset_from_next
            elsif difference_to_previous > 0 && difference_to_next > 0
              difference_to_previous < difference_to_next ? base_utc_offset_from_previous : base_utc_offset_from_next
            elsif difference_to_previous > 0
              base_utc_offset_from_previous
            elsif difference_to_next > 0
              base_utc_offset_from_next
            else
              # No difference, assume a 1 hour offset from standard time.
              observed_utc_offset - 3600
            end

            if !offset[:base_utc_offset]
              offset[:base_utc_offset] = base_utc_offset
              defined_offsets[offset] = offset_index
            elsif offset[:base_utc_offset] != base_utc_offset
              # An earlier transition has already derived a different
              # base_utc_offset. Define a new offset or reuse an existing identically
              # defined offset.
              new_offset = offset.dup
              new_offset[:base_utc_offset] = base_utc_offset

              offset_index = defined_offsets[new_offset]

              unless offset_index
                offsets << new_offset
                offset_index = offsets.length - 1
                defined_offsets[new_offset] = offset_index
              end

              transition[:offset] = offset_index
            end
          else
            base_utc_offset_from_previous = observed_utc_offset
          end
        end

        first_offset_index
      end

      # Determines if the offset from a transition matches the offset from a
      # rule. This is a looser match than equality, not requiring that the
      # base_utc_offset and std_offset both match (which have to be derived for
      # transitions, but are known for rules.
      #
      # @param offset [TimezoneOffset] an offset from a transition.
      # @param rule_offset [TimezoneOffset] an offset from a rule.
      # @return [Boolean] whether the offsets match.
      def offset_matches_rule?(offset, rule_offset)
        offset.observed_utc_offset == rule_offset.observed_utc_offset &&
          offset.dst? == rule_offset.dst? &&
          offset.abbreviation == rule_offset.abbreviation
      end

      # Apply the rules from the TZ string when there were no defined
      # transitions. Checks for a matching offset. Returns the rules-based
      # constant offset or generates transitions from 1970 until 100 years into
      # the future (at the time of loading zoneinfo_reader.rb).
      #
      # @param file [IO] the file being processed.
      # @param first_offset [TimezoneOffset] the first offset included in the
      #   file that would normally apply without the rules.
      # @param rules [Object] a {TimezoneOffset} specifying a constant offset or
      #   {AnnualRules} instance specfying transitions.
      # @return [Object] either a {TimezoneOffset} or an `Array` of
      #   {TimezoneTransition}s.
      # @raise [InvalidZoneinfoFile] if the first offset does not match the
      #   rules.
      def apply_rules_without_transitions(file, first_offset, rules)
        if rules.kind_of?(TimezoneOffset)
          unless offset_matches_rule?(first_offset, rules)
            raise InvalidZoneinfoFile, "Constant offset POSIX-style TZ string does not match constant offset in file '#{file.path}'."
          end
          rules
        else
          transitions = 1970.upto(GENERATE_UP_TO).flat_map {|y| rules.transitions(y) }
          first_transition = transitions[0]

          unless offset_matches_rule?(first_offset, first_transition.previous_offset)
            # Not transitioning from the designated first offset.

            if offset_matches_rule?(first_offset, first_transition.offset)
              # Skip an unnecessary transition to the first offset.
              transitions.shift
            else
              # The initial offset doesn't match the ongoing rules. Replace the
              # previous offset of the first transition.
              transitions[0] = TimezoneTransition.new(first_transition.offset, first_offset, first_transition.timestamp_value)
            end
          end

          transitions
        end
      end

      # Finds an offset that is equivalent to the one specified in the given
      # `Array`. Matching is performed with {TimezoneOffset#==}.
      #
      # @param offsets [Array<TimezoneOffset>] an `Array` to search.
      # @param offset [TimezoneOffset] the offset to search for.
      # @return [TimezoneOffset] the matching offset from `offsets` or `nil`
      #   if not found.
      def find_existing_offset(offsets, offset)
        offsets.find {|o| o == offset }
      end

      # Returns a new AnnualRules instance with standard and daylight savings
      # offsets replaced with equivalents from an array. This reduces the memory
      # requirement for loaded time zones by reusing offsets for rule-generated
      # transitions.
      #
      # @param offsets [Array<TimezoneOffset>] an `Array` to search for
      #   equivalent offsets.
      # @param annual_rules [AnnualRules] the {AnnualRules} instance to check.
      # @return [AnnualRules] either a new {AnnualRules} instance with either
      #   the {AnnualRules#std_offset std_offset} or {AnnualRules#dst_offset
      #   dst_offset} replaced, or the original instance if no equivalent for
      #   either {AnnualRules#std_offset std_offset} or {AnnualRules#dst_offset
      #   dst_offset} could be found.
      def replace_with_existing_offsets(offsets, annual_rules)
        existing_std_offset = find_existing_offset(offsets, annual_rules.std_offset)
        existing_dst_offset = find_existing_offset(offsets, annual_rules.dst_offset)
        if existing_std_offset || existing_dst_offset
          AnnualRules.new(existing_std_offset || annual_rules.std_offset, existing_dst_offset || annual_rules.dst_offset,
            annual_rules.dst_start_rule, annual_rules.dst_end_rule)
        else
          annual_rules
        end
      end

      # Validates the offset indicated to be observed by the rules before the
      # first generated transition against the offset of the last defined
      # transition.
      #
      # Fix the last defined transition if it differ on just base/std offsets
      # (which are derived). Raise an error if the observed UTC offset or
      # abbreviations differ.
      #
      # @param file [IO] the file being processed.
      # @param last_defined [TimezoneTransition] the last defined transition in
      #   the file.
      # @param first_rule_offset [TimezoneOffset] the offset the rules indicate
      #   is observed prior to the first rules generated transition.
      # @return [TimezoneTransition] the last defined transition (either the
      #   original instance or a replacement).
      # @raise [InvalidZoneinfoFile] if the offset of {last_defined} and
      #   {first_rule_offset} do not match.
      def validate_and_fix_last_defined_transition_offset(file, last_defined, first_rule_offset)
        offset_of_last_defined = last_defined.offset

        if offset_of_last_defined == first_rule_offset
          last_defined
        else
          if offset_matches_rule?(offset_of_last_defined, first_rule_offset)
            # The same overall offset, but differing in the base or std
            # offset (which are derived). Correct by using the rule.
            TimezoneTransition.new(first_rule_offset, last_defined.previous_offset, last_defined.timestamp_value)
          else
            raise InvalidZoneinfoFile, "The first offset indicated by the POSIX-style TZ string did not match the final defined offset in file '#{file.path}'."
          end
        end
      end

      # Apply the rules from the TZ string when there were defined
      # transitions. Checks for a matching offset with the last transition.
      # Redefines the last transition if required and if the rules don't
      # specific a constant offset, generates transitions until 100 years into
      # the future (at the time of loading zoneinfo_reader.rb).
      #
      # @param file [IO] the file being processed.
      # @param transitions [Array<TimezoneTransition>] the defined transitions.
      # @param offsets [Array<TimezoneOffset>] the offsets used by the defined
      #   transitions.
      # @param rules [Object] a {TimezoneOffset} specifying a constant offset or
      #   {AnnualRules} instance specfying transitions.
      # @raise [InvalidZoneinfoFile] if the first offset does not match the
      #   rules.
      # @raise [InvalidZoneinfoFile] if the previous offset of the first
      #   generated transition does not match the offset of the last defined
      #   transition.
      def apply_rules_with_transitions(file, transitions, offsets, rules)
        last_defined = transitions[-1]

        if rules.kind_of?(TimezoneOffset)
          transitions[-1] = validate_and_fix_last_defined_transition_offset(file, last_defined, rules)
        else
          last_year = last_defined.local_end_at.to_time.year

          if last_year <= GENERATE_UP_TO
            rules = replace_with_existing_offsets(offsets, rules)

            generated = rules.transitions(last_year).find_all do |t|
              t.timestamp_value > last_defined.timestamp_value && !offset_matches_rule?(last_defined.offset, t.offset)
            end

            generated += (last_year + 1).upto(GENERATE_UP_TO).flat_map {|y| rules.transitions(y) }

            unless generated.empty?
              transitions[-1] = validate_and_fix_last_defined_transition_offset(file, last_defined, generated[0].previous_offset)
              transitions.concat(generated)
            end
          end
        end
      end

      # Parses a zoneinfo file and returns either a {TimezoneOffset} that is
      # constantly observed or an `Array` of {TimezoneTransition}s.
      #
      # @param file [IO] the file to be read.
      # @return [Object] either a {TimezoneOffset} or an `Array` of
      #   {TimezoneTransition}s.
      # @raise [InvalidZoneinfoFile] if the file is not a valid zoneinfo file.
      def parse(file)
        magic, version, ttisutccnt, ttisstdcnt, leapcnt, timecnt, typecnt, charcnt =
          check_read(file, 44).unpack('a4 a x15 NNNNNN')

        if magic != 'TZif'
          raise InvalidZoneinfoFile, "The file '#{file.path}' does not start with the expected header."
        end

        if version == '2' || version == '3'
          # Skip the first 32-bit section and read the header of the second 64-bit section
          file.seek(timecnt * 5 + typecnt * 6 + charcnt + leapcnt * 8 + ttisstdcnt + ttisutccnt, IO::SEEK_CUR)

          prev_version = version

          magic, version, ttisutccnt, ttisstdcnt, leapcnt, timecnt, typecnt, charcnt =
            check_read(file, 44).unpack('a4 a x15 NNNNNN')

          unless magic == 'TZif' && (version == prev_version)
            raise InvalidZoneinfoFile, "The file '#{file.path}' contains an invalid 64-bit section header."
          end

          using_64bit = true
        elsif version != '3' && version != '2' && version != "\0"
          raise InvalidZoneinfoFile, "The file '#{file.path}' contains a version of the zoneinfo format that is not currently supported."
        else
          using_64bit = false
        end

        unless leapcnt == 0
          raise InvalidZoneinfoFile, "The file '#{file.path}' contains leap second data. TZInfo requires zoneinfo files that omit leap seconds."
        end

        transitions = if using_64bit
          timecnt.times.map do |i|
            high, low = check_read(file, 8).unpack('NN'.freeze)
            transition_time = make_signed_int64(high, low)
            {at: transition_time}
          end
        else
          timecnt.times.map do |i|
            transition_time = make_signed_int32(check_read(file, 4).unpack('N'.freeze)[0])
            {at: transition_time}
          end
        end

        check_read(file, timecnt).unpack('C*'.freeze).each_with_index do |localtime_type, i|
          raise InvalidZoneinfoFile, "Invalid offset referenced by transition in file '#{file.path}'." if localtime_type >= typecnt
          transitions[i][:offset] = localtime_type
        end

        offsets = typecnt.times.map do |i|
          gmtoff, isdst, abbrind = check_read(file, 6).unpack('NCC'.freeze)
          gmtoff = make_signed_int32(gmtoff)
          isdst = isdst == 1
          {observed_utc_offset: gmtoff, is_dst: isdst, abbr_index: abbrind}
        end

        abbrev = check_read(file, charcnt)

        if using_64bit
          # Skip to the POSIX-style TZ string.
          file.seek(ttisstdcnt + ttisutccnt, IO::SEEK_CUR) # + leapcnt * 8, but leapcnt is checked above and guaranteed to be 0.
          tz_string_start = check_read(file, 1)
          raise InvalidZoneinfoFile, "Expected newline starting POSIX-style TZ string in file '#{file.path}'." unless tz_string_start == "\n"
          tz_string = file.readline("\n").force_encoding(Encoding::UTF_8)
          raise InvalidZoneinfoFile, "Expected newline ending POSIX-style TZ string in file '#{file.path}'." unless tz_string.chomp!("\n")

          begin
            rules = @posix_tz_parser.parse(tz_string)
          rescue InvalidPosixTimeZone => e
            raise InvalidZoneinfoFile, "Failed to parse POSIX-style TZ string in file '#{file.path}': #{e}"
          end
        else
          rules = nil
        end

        # Derive the offsets from standard time (std_offset).
        first_offset_index = derive_offsets(transitions, offsets)

        offsets = offsets.map do |o|
          observed_utc_offset = o[:observed_utc_offset]
          base_utc_offset = o[:base_utc_offset]

          if base_utc_offset
            # DST offset with base_utc_offset derived by derive_offsets.
            std_offset = observed_utc_offset - base_utc_offset
          elsif o[:is_dst]
            # DST offset unreferenced by a transition (offset in use before the
            # first transition). No derived base UTC offset, so assume 1 hour
            # DST.
            base_utc_offset = observed_utc_offset - 3600
            std_offset = 3600
          else
            # Non-DST offset.
            base_utc_offset = observed_utc_offset
            std_offset = 0
          end

          abbrev_start = o[:abbr_index]
          raise InvalidZoneinfoFile, "Abbreviation index is out of range in file '#{file.path}'." unless abbrev_start < abbrev.length

          abbrev_end = abbrev.index("\0", abbrev_start)
          raise InvalidZoneinfoFile, "Missing abbreviation null terminator in file '#{file.path}'." unless abbrev_end

          abbr = @string_deduper.dedupe(RubyCoreSupport.untaint(abbrev[abbrev_start...abbrev_end].force_encoding(Encoding::UTF_8)))

          TimezoneOffset.new(base_utc_offset, std_offset, abbr)
        end

        first_offset = offsets[first_offset_index]


        if transitions.empty?
          if rules
            apply_rules_without_transitions(file, first_offset, rules)
          else
            first_offset
          end
        else
          previous_offset = first_offset
          previous_at = nil

          transitions = transitions.map do |t|
            offset = offsets[t[:offset]]
            at = t[:at]
            raise InvalidZoneinfoFile, "Transition at #{at} is not later than the previous transition at #{previous_at} in file '#{file.path}'." if previous_at && previous_at >= at
            tt = TimezoneTransition.new(offset, previous_offset, at)
            previous_offset = offset
            previous_at = at
            tt
          end

          apply_rules_with_transitions(file, transitions, offsets, rules) if rules
          transitions
        end
      end
    end
    private_constant :ZoneinfoReader
  end
end
