## ----------------------------------------------------------------------
##
## Ruby client for algolia.com
## A quick library for playing with algolia.com's REST API for object storage.
## Thanks to Sylvain Utard for the initial version of the library
## ----------------------------------------------------------------------
require 'json'
if !defined?(RUBY_ENGINE) && defined?(RUBY_VERSION) && RUBY_VERSION == '1.8.7'
  # work-around a limitation from nahi/httpclient, using the undefined RUBY_ENGINE constant
  RUBY_ENGINE = 'ruby1.8'
  require 'httpclient'
  Object.send(:remove_const, :RUBY_ENGINE)
else
  require 'httpclient'
end
require 'date'
require 'cgi'
require 'pathname'

cwd = Pathname(__FILE__).dirname
$:.unshift(cwd.to_s) unless $:.include?(cwd.to_s) || $:.include?(cwd.expand_path.to_s)

require 'algolia/index'
require 'algolia/analytics'
require 'algolia/insights'
require 'algolia/account_client'
