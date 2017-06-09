const fs = require('fs');
const path = require('path');

const manifest = fs.readFileSync(path.join(__dirname, './files/AndroidManifest.xml'));
const mainJavaClass = fs.readFileSync(path.join(__dirname, './files/Main.java'));

exports.valid = {
  src: {
    'AndroidManifest.xml': manifest,
    main: {
      com: {
        some: {
          example: {
            'Main.java': mainJavaClass,
            'ReactPackage.java': fs.readFileSync(path.join(__dirname, './files/ReactPackage.java')),
          },
        },
      },
    },
  },
};

exports.userConfigManifest = {
  src: {
    main: {
      'AndroidManifest.xml': manifest,
      com: {
        some: {
          example: {
            'Main.java': mainJavaClass,
            'ReactPackage.java': fs.readFileSync(path.join(__dirname, './files/ReactPackage.java')),
          },
        },
      },
    },
    debug: {
      'AndroidManifest.xml': fs.readFileSync(path.join(__dirname, './files/AndroidManifest-debug.xml')),
    },
  },
};

exports.corrupted = {
  src: {
    'AndroidManifest.xml': manifest,
    main: {
      com: {
        some: {
          example: {},
        },
      },
    },
  },
};

exports.noPackage = {
  src: {
    'AndroidManifest.xml': manifest,
    main: {
      com: {
        some: {
          example: {
            'Main.java': mainJavaClass,
          },
        },
      },
    },
  },
};
