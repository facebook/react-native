if RUBY_ENGINE == 'ruby'
  begin
    require RUBY_VERSION.split('.')[0, 2].join('.') + '/ffi_c'
  rescue Exception
    require 'ffi_c'
  end

  require 'ffi/ffi'

elsif RUBY_ENGINE == 'jruby' && (RUBY_ENGINE_VERSION.split('.').map(&:to_i) <=> [9, 2, 20]) >= 0
  JRuby::Util.load_ext("org.jruby.ext.ffi.FFIService")
  require 'ffi/ffi'

elsif RUBY_ENGINE == 'truffleruby' && (RUBY_ENGINE_VERSION.split('.').map(&:to_i) <=> [20, 1, 0]) >= 0
  require 'truffleruby/ffi_backend'
  require 'ffi/ffi'

else
  # Remove the ffi gem dir from the load path, then reload the internal ffi implementation
  $LOAD_PATH.delete(File.dirname(__FILE__))
  $LOAD_PATH.delete(File.join(File.dirname(__FILE__), 'ffi'))
  unless $LOADED_FEATURES.nil?
    $LOADED_FEATURES.delete(__FILE__)
    $LOADED_FEATURES.delete('ffi.rb')
  end
  require 'ffi.rb'
end
