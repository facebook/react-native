if RUBY_ENGINE == "jruby"
  require 'nkf.jar'
  JRuby::Util.load_ext('org.jruby.ext.nkf.NKFLibrary')
else
  require 'nkf.so'
end
