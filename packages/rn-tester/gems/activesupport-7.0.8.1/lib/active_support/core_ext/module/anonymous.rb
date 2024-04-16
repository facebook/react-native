# frozen_string_literal: true

class Module
  # A module may or may not have a name.
  #
  #   module M; end
  #   M.name # => "M"
  #
  #   m = Module.new
  #   m.name # => nil
  #
  # +anonymous?+ method returns true if module does not have a name, false otherwise:
  #
  #   Module.new.anonymous? # => true
  #
  #   module M; end
  #   M.anonymous?          # => false
  #
  # A module gets a name when it is first assigned to a constant. Either
  # via the +module+ or +class+ keyword or by an explicit assignment:
  #
  #   m = Module.new # creates an anonymous module
  #   m.anonymous?   # => true
  #   M = m          # m gets a name here as a side-effect
  #   m.name         # => "M"
  #   m.anonymous?   # => false
  def anonymous?
    name.nil?
  end
end
