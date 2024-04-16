class FuzzyMatch
  class Score
    # be sure to `require 'amatch'` before you use this class
    class Amatch < Score

      def dices_coefficient_similar
        @dices_coefficient_similar ||= if str1 == str2
          1.0
        elsif str1.length == 1 and str2.length == 1
          0.0
        else
          str1.pair_distance_similar str2
        end
      end

      def levenshtein_similar
        @levenshtein_similar ||= str1.levenshtein_similar str2
      end
    end
  end
end
