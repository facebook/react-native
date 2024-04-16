class FuzzyMatch
  class Rule
    # Identities take effect when needle and haystack both match a regexp
    # Then the captured part of the regexp has to match exactly
    class Identity < Rule
      attr_reader :proc

      def initialize(regexp_or_proc)
        case regexp_or_proc
        when Regexp
          @regexp = regexp_or_proc
        when Proc
          @proc = regexp_or_proc
        else
          raise ArgumentError, "[FuzzyMatch] Identity must be set with either Regexp objects or Procs, but got #{regexp_or_proc.inspect} (#{regexp_or_proc.class.name})"
        end
      end

      def ==(other)
        other.class == self.class and (regexp ? regexp == other.regexp : proc == other.proc)
      end

      # Two strings are "identical" if they both match this identity and the captures are equal.
      #
      # Only returns true/false if both strings match the regexp.
      # Otherwise returns nil.
      def identical?(record1, record2)
        if regexp
          if (str1_match_data = regexp.match(record1.whole)) and (str2_match_data = regexp.match(record2.whole))
            str1_match_data.captures.join.downcase == str2_match_data.captures.join.downcase
          else
            nil
          end
        else
          proc.call record1.original, record2.original
        end
      end
    end
  end
end
