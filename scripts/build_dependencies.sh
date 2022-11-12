#!/bin/bash

rm -rf dependencies
mkdir -p dependencies/nodejs
cp package.json package-lock.json dependencies/nodejs
cd dependencies/nodejs
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install --production --arch=x64 --platform=linux
rm package.json package-lock.json