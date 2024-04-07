#!/bin/bash

SOURCE_DIR=../../../node_modules
DEST_DIR=../node_modules

# List of package directories to copy
PACKAGES=("appium" "appium-uiautomator2-driver" "appium-xcuitest-driver" "@wdio")

# Copy each package directory
for PACKAGE in "${PACKAGES[@]}"; do
    echo "Copying $PACKAGE..."
    cp -R "$SOURCE_DIR/$PACKAGE" "$DEST_DIR"
done

echo "Copying completed."
