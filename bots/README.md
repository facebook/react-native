GitHub bots, such as the Danger bot, as well as messages used by the Facebook GitHub bot are all configured in this directory/

## Danger

We use [Danger JS](http://danger.systems/js/) to perform rudimentary maintenance on the React Native repository. 

If you'd like to make changes to the Dangerfile, find an existing PR on the React Native repo and make note of the URL.		
		
Then, run from the React Native root directory:

```
cd .circleci
npm install
..
node .circleci/node_modules/.bin/danger pr https://github.com/facebook/react-native/pull/1		
```

And you will get the responses from parsing the Dangerfile.
