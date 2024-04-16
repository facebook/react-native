# frozen_string_literal: true

class Array
  # Removes and returns the elements for which the block returns a true value.
  # If no block is given, an Enumerator is returned instead.
  #
  #   numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  #   odd_numbers = numbers.extract! { |number| number.odd? } # => [1, 3, 5, 7, 9]
  #   numbers # => [0, 2, 4, 6, 8]
  def extract!
    return to_enum(:extract!) { size } unless block_given?

    extracted_elements = []

    reject! do |element|
      extracted_elements << element if yield(element)
    end

    extracted_elements
  end
end
