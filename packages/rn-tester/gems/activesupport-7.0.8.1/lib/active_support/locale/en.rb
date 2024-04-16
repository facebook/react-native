# frozen_string_literal: true

{
  en: {
    number: {
      nth: {
        ordinals: lambda do |_key, options|
          number = options[:number]
          case number
          when 1; "st"
          when 2; "nd"
          when 3; "rd"
          when 4, 5, 6, 7, 8, 9, 10, 11, 12, 13; "th"
          else
            num_modulo = number.to_i.abs % 100
            num_modulo %= 10 if num_modulo > 13
            case num_modulo
            when 1; "st"
            when 2; "nd"
            when 3; "rd"
            else    "th"
            end
          end
        end,

        ordinalized: lambda do |_key, options|
          number = options[:number]
          "#{number}#{ActiveSupport::Inflector.ordinal(number)}"
        end
      }
    }
  }
}
