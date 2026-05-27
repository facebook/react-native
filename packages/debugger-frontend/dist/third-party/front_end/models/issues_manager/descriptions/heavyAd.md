# An ad on your site has exceeded resource limits

Chrome identifies heavy ads on your site that use too many resources without a user gesture. Heavy ads have an impact on performance and harm the user’s browsing experience. They increase battery drain, consume mobile data, and make your site slow. To improve the user experience, Chrome warns about or removes heavy ads.

An ad is considered heavy if the user has not interacted with it (for example, has not tapped or clicked it) and it meets any of the following criteria:
* Uses the main thread for more than 60 seconds in total (CPU total limit)
* Uses the main thread for more than 15 seconds in any 30 second window (CPU peak limit)
* Uses more than 4 megabytes of network bandwidth (Network limit)

Stop this from happening by only showing ads that stay within resource limits.
