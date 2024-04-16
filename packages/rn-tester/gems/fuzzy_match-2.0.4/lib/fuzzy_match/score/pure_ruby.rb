class FuzzyMatch
  class Score
    class PureRuby < Score

      SPACE = ' '

      # http://stackoverflow.com/questions/653157/a-better-similarity-ranking-algorithm-for-variable-length-strings
      def dices_coefficient_similar
        @dices_coefficient_similar ||= begin
          if str1 == str2
            1.0
          elsif str1.length == 1 and str2.length == 1
            0.0
          else
            pairs1 = (0..str1.length-2).map do |i|
              str1[i,2]
            end.reject do |pair|
              pair.include? SPACE
            end
            pairs2 = (0..str2.length-2).map do |i|
              str2[i,2]
            end.reject do |pair|
              pair.include? SPACE
            end
            union = pairs1.size + pairs2.size
            intersection = 0
            pairs1.each do |p1|
              0.upto(pairs2.size-1) do |i|
                if p1 == pairs2[i]
                  intersection += 1
                  pairs2.slice!(i)
                  break
                end
              end
            end
            (2.0 * intersection) / union
          end
        end
      end

      # extracted/adapted from the text gem version 1.0.2
      # normalization added for utf-8 strings
      # lib/text/levenshtein.rb
      def levenshtein_similar
        @levenshtein_similar ||= begin
          if utf8?
            unpack_rule = 'U*'
          else
            unpack_rule = 'C*'
          end
          s = str1.unpack(unpack_rule)
          t = str2.unpack(unpack_rule)
          n = s.length
          m = t.length
        
          if n == 0 or m == 0
            0.0
          else
            d = (0..m).to_a
            x = nil
            (0...n).each do |i|
              e = i+1
              (0...m).each do |j|
                cost = (s[i] == t[j]) ? 0 : 1
                x = [
                  d[j+1] + 1, # insertion
                  e + 1,      # deletion
                  d[j] + cost # substitution
                ].min
                d[j] = e
                e = x
              end
              d[m] = x
            end
            # normalization logic from https://github.com/flori/amatch/blob/master/ext/amatch_ext.c#L301
            # if (b_len > a_len) {
            #     result = rb_float_new(1.0 - ((double) v[p][b_len]) / b_len);
            # } else {
            #     result = rb_float_new(1.0 - ((double) v[p][b_len]) / a_len);
            # }
            1.0 - x.to_f / [n, m].max
          end
        end
      end

      private
    
      def utf8?
        return @utf8_query if defined?(@utf8_query)
        @utf8_query = (defined?(::Encoding) ? str1.encoding.to_s : $KCODE).downcase.start_with?('u')
      end
    end
  end
end
