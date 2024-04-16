# frozen_string_literal: true

class Regexp
  # Returns +true+ if the regexp has the multiline flag set.
  #
  #   (/./).multiline?  # => false
  #   (/./m).multiline? # => true
  #
  #   Regexp.new(".").multiline?                    # => false
  #   Regexp.new(".", Regexp::MULTILINE).multiline? # => true
  def multiline?
    options & MULTILINE == MULTILINE
  end
end
