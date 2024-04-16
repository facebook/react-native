# frozen_string_literal: true

module Kernel
  module_function

  # Sets $VERBOSE to +nil+ for the duration of the block and back to its original
  # value afterwards.
  #
  #   silence_warnings do
  #     value = noisy_call # no warning voiced
  #   end
  #
  #   noisy_call # warning voiced
  def silence_warnings(&block)
    with_warnings(nil, &block)
  end

  # Sets $VERBOSE to +true+ for the duration of the block and back to its
  # original value afterwards.
  def enable_warnings(&block)
    with_warnings(true, &block)
  end

  # Sets $VERBOSE for the duration of the block and back to its original
  # value afterwards.
  def with_warnings(flag)
    old_verbose, $VERBOSE = $VERBOSE, flag
    yield
  ensure
    $VERBOSE = old_verbose
  end

  # Blocks and ignores any exception passed as argument if raised within the block.
  #
  #   suppress(ZeroDivisionError) do
  #     1/0
  #     puts 'This code is NOT reached'
  #   end
  #
  #   puts 'This code gets executed and nothing related to ZeroDivisionError was seen'
  def suppress(*exception_classes)
    yield
  rescue *exception_classes
  end
end
