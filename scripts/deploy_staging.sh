#!/usr/bin/env sh

cd /srv/Entree.Server
git pull git@github.com:siddharthgutta/Entree.Server.git
git checkout staging
npm install
grunt compile
pm2 restart index.compiled.js --name "staging"