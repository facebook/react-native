# Run the website server

The first time, get all the dependencies loaded via

```
npm install
```

Then, run the server via

```
npm start
open http://localhost:8080/react-native/index.html
```

Anytime you change the contents, just refresh the page and it's going to be updated.

# Publish the website

First setup your environment by having two folders, one `react-native` and one `react-native-gh-pages`. The publish script expects those exact names.

```
cd ../../
git clone git@github.com:facebook/react-native.git react-native-gh-pages
cd react-native-gh-pages
git checkout origin/gh-pages
git checkout -b gh-pages
git push --set-upstream origin gh-pages
cd ../react-native/website
```

Then, after you've done changes, just run the command and it'll automatically build the static version of the site and publish it to gh-pages.

```
./publish.sh
```
