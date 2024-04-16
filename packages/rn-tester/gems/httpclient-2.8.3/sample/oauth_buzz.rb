require 'oauthclient'
require 'zlib'
require 'stringio'

# Get your own consumer token from http://code.google.com/apis/accounts/docs/RegistrationForWebAppsAuto.html
consumer_key = nil
consumer_secret = nil

callback = 'http://localhost/' # should point somewhere else...
scope = 'https://www.googleapis.com/auth/buzz'
request_token_url = 'https://www.google.com/accounts/OAuthGetRequestToken'
access_token_url = 'https://www.google.com/accounts/OAuthGetAccessToken'

STDOUT.sync = true

# create OAuth client.
client = OAuthClient.new
client.oauth_config.consumer_key = consumer_key
client.oauth_config.consumer_secret = consumer_secret
client.oauth_config.signature_method = 'HMAC-SHA1'
client.oauth_config.http_method = :get # Twitter does not allow :post
client.debug_dev = STDERR if $DEBUG

# Get request token.
res = client.get_request_token(request_token_url, callback, :scope => scope)
p res.status
p res.oauth_params
p res.content
p client.oauth_config
token = res.oauth_params['oauth_token']
secret = res.oauth_params['oauth_token_secret']
raise if token.nil? or secret.nil?

# You need to confirm authorization out of band.
puts
puts "Go here and do confirm: https://www.google.com/buzz/api/auth/OAuthAuthorizeToken?oauth_token=#{token}&domain=#{consumer_key}&scope=#{scope}"
puts "Type oauth_verifier (if given) and hit [enter] to go"
require 'cgi'
verifier = CGI.unescape(gets.chomp)
verifier = nil if verifier.empty?

# Get access token.
res = client.get_access_token(access_token_url, token, secret, verifier)
p res.status
p res.oauth_params
p res.content
p client.oauth_config
id = res.oauth_params['user_id']

puts
puts "Access token usage example"
puts "Hit [enter] to go"
gets

# Access to a protected resource.
# @consumption requires Buzz API
puts client.get_content("https://www.googleapis.com/buzz/v1/activities/@me/@consumption", :alt => :json, :prettyprint => true)
