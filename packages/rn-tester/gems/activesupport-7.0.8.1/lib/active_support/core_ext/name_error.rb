# frozen_string_literal: true

class NameError
  # Extract the name of the missing constant from the exception message.
  #
  #   begin
  #     HelloWorld
  #   rescue NameError => e
  #     e.missing_name
  #   end
  #   # => "HelloWorld"
  def missing_name
    # Since ruby v2.3.0 `did_you_mean` gem is loaded by default.
    # It extends NameError#message with spell corrections which are SLOW.
    # We should use original_message message instead.
    message = respond_to?(:original_message) ? original_message : self.message
    return unless message.start_with?("uninitialized constant ")

    receiver = begin
      self.receiver
    rescue ArgumentError
      nil
    end

    if receiver == Object
      name.to_s
    elsif receiver
      "#{real_mod_name(receiver)}::#{self.name}"
    else
      if match = message.match(/((::)?([A-Z]\w*)(::[A-Z]\w*)*)$/)
        match[1]
      end
    end
  end

  # Was this exception raised because the given name was missing?
  #
  #   begin
  #     HelloWorld
  #   rescue NameError => e
  #     e.missing_name?("HelloWorld")
  #   end
  #   # => true
  def missing_name?(name)
    if name.is_a? Symbol
      self.name == name
    else
      missing_name == name.to_s
    end
  end

  private
    UNBOUND_METHOD_MODULE_NAME = Module.instance_method(:name)
    private_constant :UNBOUND_METHOD_MODULE_NAME

    def real_mod_name(mod)
      UNBOUND_METHOD_MODULE_NAME.bind_call(mod)
    end
end
