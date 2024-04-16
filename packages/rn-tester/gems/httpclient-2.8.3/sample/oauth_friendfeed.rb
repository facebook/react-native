require 'oauthclient'

# Get your own consumer token from http://friendfeed.com/api/applications
consumer_key = 'EDIT HERE'
consumer_secret = 'EDIT HERE'

request_token_url = 'https://friendfeed.com/account/oauth/request_token'
oob_authorize_url = 'https://friendfeed.com/account/oauth/authorize'
access_token_url = 'https://friendfeed.com/account/oauth/access_token'

STDOUT.sync = true

# create OAuth client.
client = OAuthClient.new
client.oauth_config.consumer_key = consumer_key
client.oauth_config.consumer_secret = consumer_secret
client.oauth_config.signature_method = 'HMAC-SHA1'
client.oauth_config.http_method = :get # FriendFeed does not allow :post
client.debug_dev = STDERR if $DEBUG

# Get request token.
res = client.get_request_token(request_token_url)
p res.status
p res.oauth_params
p res.content
p client.oauth_config
token = res.oauth_params['oauth_token']
secret = res.oauth_params['oauth_token_secret']
raise if token.nil? or secret.nil?

# You need to confirm authorization out of band.
puts
puts "Go here and do confirm: #{oob_authorize_url}?oauth_token=#{token}"
puts "Hit [enter] to go"
gets

# Get access token.
# FYI: You may need to re-construct OAuthClient instance here.
#      In normal web app flow, getting access token and getting request token
#      must be done in different HTTP requests.
#  client = OAuthClient.new
#  client.oauth_config.consumer_key = consumer_key
#  client.oauth_config.consumer_secret = consumer_secret
#  client.oauth_config.signature_method = 'HMAC-SHA1'
#  client.oauth_config.http_method = :get # Twitter does not allow :post
res = client.get_access_token(access_token_url, token, secret)
p res.status
p res.oauth_params
p res.content
p client.oauth_config
username = res.oauth_params['username']

puts
puts "Access token usage example"
puts "Hit [enter] to go"
gets

# Access to a protected resource. (user profile)
puts client.get("http://friendfeed-api.com/v2/feedinfo/#{username}?format=json")
