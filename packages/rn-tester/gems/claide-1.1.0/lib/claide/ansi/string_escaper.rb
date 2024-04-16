module CLAide
  class ANSI
    # Provides support to wrap strings in ANSI sequences according to the
    # `ANSI.disabled` setting.
    #
    class StringEscaper < String
      # @param  [String] string The string to wrap.
      #
      def initialize(string)
        super
      end

      # @return [StringEscaper] Wraps a string in the given ANSI sequences,
      #         taking care of handling existing sequences for the same
      #         family of attributes (i.e. attributes terminated by the
      #         same sequence).
      #
      def wrap_in_ansi_sequence(open, close)
        if ANSI.disabled
          self
        else
          gsub!(close, open)
          insert(0, open).insert(-1, close)
        end
      end

      # @return [StringEscaper]
      #
      # @param  [Array<Symbol>] keys
      #         One or more keys corresponding to ANSI codes to apply to the
      #         string.
      #
      def apply(*keys)
        keys.flatten.each do |key|
          send(key)
        end
        self
      end

      ANSI::COLORS.each_key do |key|
        # Defines a method returns a copy of the receiver wrapped in an ANSI
        # sequence for each foreground color (e.g. #blue).
        #
        # The methods handle nesting of ANSI sequences.
        #
        define_method key do
          open = Graphics.foreground_color(key)
          close = ANSI::DEFAULT_FOREGROUND_COLOR
          wrap_in_ansi_sequence(open, close)
        end

        # Defines a method returns a copy of the receiver wrapped in an ANSI
        # sequence for each background color (e.g. #on_blue).
        #
        # The methods handle nesting of ANSI sequences.
        #
        define_method "on_#{key}" do
          open = Graphics.background_color(key)
          close = ANSI::DEFAULT_BACKGROUND_COLOR
          wrap_in_ansi_sequence(open, close)
        end
      end

      ANSI::TEXT_ATTRIBUTES.each_key do |key|
        # Defines a method returns a copy of the receiver wrapped in an ANSI
        # sequence for each text attribute (e.g. #bold).
        #
        # The methods handle nesting of ANSI sequences.
        #
        define_method key do
          open = Graphics.text_attribute(key)
          close_code = TEXT_DISABLE_ATTRIBUTES[key]
          close = Graphics.graphics_mode(close_code)
          wrap_in_ansi_sequence(open, close)
        end
      end
    end
  end
end
