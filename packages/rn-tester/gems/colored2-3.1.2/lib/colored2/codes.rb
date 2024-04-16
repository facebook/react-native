module Colored2

  COLORS  = {
    black:     30,
    red:       31,
    green:     32,
    yellow:    33,
    blue:      34,
    magenta:   35,
    cyan:      36,
    white:     37
  }

  EFFECTS = {
    no_color:   0,
    bold:       1,
    dark:       2,
    italic:     3,
    underlined: 4,
    reversed:   7,
    plain:      21, # non-bold
    normal:     22
  }

  class Code
    attr_accessor :name, :escape
    def initialize(name)
      @name = name
      return if name.nil?
      @escape = codes[name.to_sym]
      raise ArgumentError.new("No color or effect named #{name} exists for #{self.class}.") if @escape.nil?
    end

    def value(shift = nil)
      escape_code = escape
      escape_code += shift if shift && escape_code
      name && escape ? "\e[#{escape_code}m" : ''
    end

    def to_s
      value
    end
  end

  class Effect < Code
    def codes
      EFFECTS
    end
  end

  class TextColor < Code
    def codes
      COLORS
    end
  end

  class BackgroundColor < TextColor
    def value
      super 10
    end
  end

end
