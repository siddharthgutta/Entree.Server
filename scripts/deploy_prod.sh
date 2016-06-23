# We don't source .bashrc when using a non-interactive shell so we have to fix the PATH
PATH=$PATH:/home/ubuntu/.nvm/versions/node/v5.5.0/bin

cd /home/ubuntu/.pm2/repos/master/Entree.Server

# Setting environment variables
export NODE_ENV="production"

git checkout master
git pull
npm install
grunt compile
pm2 delete "master"
pm2 start index.compiled.js --name "master"
