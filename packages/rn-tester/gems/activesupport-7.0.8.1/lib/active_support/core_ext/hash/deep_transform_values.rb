# frozen_string_literal: true

class Hash
  # Returns a new hash with all values converted by the block operation.
  # This includes the values from the root hash and from all
  # nested hashes and arrays.
  #
  #   hash = { person: { name: 'Rob', age: '28' } }
  #
  #   hash.deep_transform_values{ |value| value.to_s.upcase }
  #   # => {person: {name: "ROB", age: "28"}}
  def deep_transform_values(&block)
    _deep_transform_values_in_object(self, &block)
  end

  # Destructively converts all values by using the block operation.
  # This includes the values from the root hash and from all
  # nested hashes and arrays.
  def deep_transform_values!(&block)
    _deep_transform_values_in_object!(self, &block)
  end

  private
    # Support methods for deep transforming nested hashes and arrays.
    def _deep_transform_values_in_object(object, &block)
      case object
      when Hash
        object.transform_values { |value| _deep_transform_values_in_object(value, &block) }
      when Array
        object.map { |e| _deep_transform_values_in_object(e, &block) }
      else
        yield(object)
      end
    end

    def _deep_transform_values_in_object!(object, &block)
      case object
      when Hash
        object.transform_values! { |value| _deep_transform_values_in_object!(value, &block) }
      when Array
        object.map! { |e| _deep_transform_values_in_object!(e, &block) }
      else
        yield(object)
      end
    end
end
