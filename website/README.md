# Install prerequisites

Before running the website, make sure you've run the following:

```sh
git clone https://github.com/facebook/react-native.git
cd react-native
npm install
```

# Run the website server

The first time, get all the website dependencies loaded via

```sh
cd website
npm install
```

Then, run the server via

```sh
npm start
open http://localhost:8079/react-native/index.html
```

Anytime you change the contents, just refresh the page and it's going to be updated.

# Publish the website

The website at https://facebook.github.io/react-native is automatically deployed by our continuous integration infrastructure, specifically CircleCI. This is configured in `circle.yml` in the root of the repository.
