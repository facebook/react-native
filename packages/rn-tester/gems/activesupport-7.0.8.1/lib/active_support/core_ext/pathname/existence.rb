# frozen_string_literal: true

class Pathname
  # Returns the receiver if the named file exists otherwise returns +nil+.
  # <tt>pathname.existence</tt> is equivalent to
  #
  #    pathname.exist? ? pathname : nil
  #
  # For example, something like
  #
  #   content = pathname.read if pathname.exist?
  #
  # becomes
  #
  #   content = pathname.existence&.read
  #
  # @return [Pathname]
  def existence
    self if exist?
  end
end
