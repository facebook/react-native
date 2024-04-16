# frozen_string_literal: true

class String
  # Returns the string, first removing all whitespace on both ends of
  # the string, and then changing remaining consecutive whitespace
  # groups into one space each.
  #
  # Note that it handles both ASCII and Unicode whitespace.
  #
  #   %{ Multi-line
  #      string }.squish                   # => "Multi-line string"
  #   " foo   bar    \n   \t   boo".squish # => "foo bar boo"
  def squish
    dup.squish!
  end

  # Performs a destructive squish. See String#squish.
  #   str = " foo   bar    \n   \t   boo"
  #   str.squish!                         # => "foo bar boo"
  #   str                                 # => "foo bar boo"
  def squish!
    gsub!(/[[:space:]]+/, " ")
    strip!
    self
  end

  # Returns a new string with all occurrences of the patterns removed.
  #   str = "foo bar test"
  #   str.remove(" test")                 # => "foo bar"
  #   str.remove(" test", /bar/)          # => "foo "
  #   str                                 # => "foo bar test"
  def remove(*patterns)
    dup.remove!(*patterns)
  end

  # Alters the string by removing all occurrences of the patterns.
  #   str = "foo bar test"
  #   str.remove!(" test", /bar/)         # => "foo "
  #   str                                 # => "foo "
  def remove!(*patterns)
    patterns.each do |pattern|
      gsub! pattern, ""
    end

    self
  end

  # Truncates a given +text+ after a given <tt>length</tt> if +text+ is longer than <tt>length</tt>:
  #
  #   'Once upon a time in a world far far away'.truncate(27)
  #   # => "Once upon a time in a wo..."
  #
  # Pass a string or regexp <tt>:separator</tt> to truncate +text+ at a natural break:
  #
  #   'Once upon a time in a world far far away'.truncate(27, separator: ' ')
  #   # => "Once upon a time in a..."
  #
  #   'Once upon a time in a world far far away'.truncate(27, separator: /\s/)
  #   # => "Once upon a time in a..."
  #
  # The last characters will be replaced with the <tt>:omission</tt> string (defaults to "...")
  # for a total length not exceeding <tt>length</tt>:
  #
  #   'And they found that many people were sleeping better.'.truncate(25, omission: '... (continued)')
  #   # => "And they f... (continued)"
  def truncate(truncate_at, options = {})
    return dup unless length > truncate_at

    omission = options[:omission] || "..."
    length_with_room_for_omission = truncate_at - omission.length
    stop = \
      if options[:separator]
        rindex(options[:separator], length_with_room_for_omission) || length_with_room_for_omission
      else
        length_with_room_for_omission
      end

    +"#{self[0, stop]}#{omission}"
  end

  # Truncates +text+ to at most <tt>bytesize</tt> bytes in length without
  # breaking string encoding by splitting multibyte characters or breaking
  # grapheme clusters ("perceptual characters") by truncating at combining
  # characters.
  #
  #   >> "🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪".size
  #   => 20
  #   >> "🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪".bytesize
  #   => 80
  #   >> "🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪🔪".truncate_bytes(20)
  #   => "🔪🔪🔪🔪…"
  #
  # The truncated text ends with the <tt>:omission</tt> string, defaulting
  # to "…", for a total length not exceeding <tt>bytesize</tt>.
  def truncate_bytes(truncate_at, omission: "…")
    omission ||= ""

    case
    when bytesize <= truncate_at
      dup
    when omission.bytesize > truncate_at
      raise ArgumentError, "Omission #{omission.inspect} is #{omission.bytesize}, larger than the truncation length of #{truncate_at} bytes"
    when omission.bytesize == truncate_at
      omission.dup
    else
      self.class.new.tap do |cut|
        cut_at = truncate_at - omission.bytesize

        each_grapheme_cluster do |grapheme|
          if cut.bytesize + grapheme.bytesize <= cut_at
            cut << grapheme
          else
            break
          end
        end

        cut << omission
      end
    end
  end

  # Truncates a given +text+ after a given number of words (<tt>words_count</tt>):
  #
  #   'Once upon a time in a world far far away'.truncate_words(4)
  #   # => "Once upon a time..."
  #
  # Pass a string or regexp <tt>:separator</tt> to specify a different separator of words:
  #
  #   'Once<br>upon<br>a<br>time<br>in<br>a<br>world'.truncate_words(5, separator: '<br>')
  #   # => "Once<br>upon<br>a<br>time<br>in..."
  #
  # The last characters will be replaced with the <tt>:omission</tt> string (defaults to "..."):
  #
  #   'And they found that many people were sleeping better.'.truncate_words(5, omission: '... (continued)')
  #   # => "And they found that many... (continued)"
  def truncate_words(words_count, options = {})
    sep = options[:separator] || /\s+/
    sep = Regexp.escape(sep.to_s) unless Regexp === sep
    if self =~ /\A((?>.+?#{sep}){#{words_count - 1}}.+?)#{sep}.*/m
      $1 + (options[:omission] || "...")
    else
      dup
    end
  end
end
