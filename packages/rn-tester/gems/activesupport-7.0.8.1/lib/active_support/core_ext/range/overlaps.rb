# frozen_string_literal: true

class Range
  # Compare two ranges and see if they overlap each other
  #  (1..5).overlaps?(4..6) # => true
  #  (1..5).overlaps?(7..9) # => false
  def overlaps?(other)
    other.begin == self.begin || cover?(other.begin) || other.cover?(self.begin)
  end
end
