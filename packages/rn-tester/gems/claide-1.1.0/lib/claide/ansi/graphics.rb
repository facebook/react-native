# encoding: utf-8

module CLAide
  class ANSI
    # Provides support for generating escape sequences relative to the graphic
    # mode.
    #
    module Graphics
      # @return [String] The escape sequence for a text attribute.
      #
      # @param  [Symbol] key
      #         The name of the text attribute.
      #
      def self.text_attribute(key)
        code = ANSI.code_for_key(key, TEXT_ATTRIBUTES)
        graphics_mode(code)
      end

      # @return [String] The escape sequence for a foreground color.
      #
      # @param  [Symbol] key
      #         The name of the color.
      #
      def self.foreground_color(key)
        code = ANSI.code_for_key(key, COLORS) + 30
        graphics_mode(code)
      end

      # @return [String] The escape sequence for a background color.
      #
      # @param  [Symbol] key
      #         The name of the color.
      #
      def self.background_color(key)
        code = ANSI.code_for_key(key, COLORS) + 40
        graphics_mode(code)
      end

      # @return [String] The escape sequence for a foreground color using the
      #         xterm-256 format.
      #
      # @param  [Fixnum] color
      #         The value of the color.
      #
      def self.foreground_color_256(color)
        code = [38, 5, color]
        graphics_mode(code)
      end

      # @return [String] The escape sequence for a background color using the
      #         xterm-256 format.
      #
      # @param  [Fixnum] color
      #         The value of the color.
      #
      def self.background_color_256(color)
        code = [48, 5, color]
        graphics_mode(code)
      end

      # @return [String] The escape sequence for a single or a list of codes.
      #
      # @param  [Fixnum, Array<Fixnum>] codes
      #         The code(s).
      #
      def self.graphics_mode(codes)
        codes = Array(codes)
        "\e[#{codes.join(';')}m"
      end
    end
  end
end
