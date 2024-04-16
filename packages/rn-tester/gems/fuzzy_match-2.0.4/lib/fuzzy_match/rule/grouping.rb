# require 'pry'
class FuzzyMatch
  class Rule
    # "Record linkage typically involves two main steps: grouping and scoring..."
    # http://en.wikipedia.org/wiki/Record_linkage
    #
    # Groupings effectively divide up the haystack into groups that match a pattern
    #
    # A grouping (formerly known as a blocking) comes into effect when a str matches.
    # Then the needle must also match the grouping's regexp.
    class Grouping < Rule
      class << self
        def make(regexps)
          case regexps
          when ::Regexp
            new regexps
          when ::Array
            chain = regexps.flatten.map { |regexp| new regexp }
            if chain.length == 1
              chain[0] # not really a chain after all
            else
              chain.each { |grouping| grouping.chain = chain }
              chain
            end
          else
            raise ArgumentError, "[fuzzy_match] Groupings should be specified as single regexps or an array of regexps (got #{regexps.inspect})"
          end
        end
      end

      attr_accessor :chain

      def inspect
        memo = []
        memo << "#{regexp.inspect}"
        if chain
          memo << "(#{chain.find_index(self)} of #{chain.length})"
        end
        memo.join ' '
      end

      def xmatch?(record)
        if primary?
          match?(record) and subs.none? { |sub| sub.match?(record) }
        else
          match?(record) and primary.match?(record)
        end
      end

      def xjoin?(needle, straw)
        if primary?
          join?(needle, straw) and subs.none? { |sub| sub.match?(straw) } # maybe xmatch here?
        else
          join?(needle, straw) and primary.match?(straw)
        end
      end

      protected

      def primary?
        chain ? (primary == self) : true
        # not chain or primary == self
      end

      def primary
        chain ? chain[0] : self
      end

      def subs
        chain ? chain[1..-1] : []
      end

      def match?(record)
        !!(regexp.match(record.whole))
      end

      def join?(needle, straw)
        if straw_match_data = regexp.match(straw.whole)
          if needle_match_data = regexp.match(needle.whole)
            straw_match_data.captures.join.downcase == needle_match_data.captures.join.downcase
          else
            false
          end
        else
          nil
        end
      end
    end
  end
end
