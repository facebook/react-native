cd ../../
git clone git@github.com:facebook/react-native.git react-native-gh-pages
cd react-native-gh-pages
git checkout origin/gh-pages
git checkout -b gh-pages
git push --set-upstream origin gh-pages
cd ../react-native/website
