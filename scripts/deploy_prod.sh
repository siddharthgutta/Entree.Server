# We don't source .bashrc when using a non-interactive shell so we have to fix the PATH
PATH=$PATH:/home/ubuntu/.nvm/versions/node/v4.4.5/bin

cd /srv/Entree.Server
git pull
git checkout master
npm install
grunt compile
pm2 restart index.compiled.js --name "master"
