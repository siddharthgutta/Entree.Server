# We don't source .bashrc when using a non-interactive shell so we have to fix the PATH
PATH=$PATH:/home/ubuntu/.nvm/versions/node/v5.5.0/bin

cd /home/ubuntu/.pm2/repos/master/Entree.Server

# Setting environment variables
export NODE_ENV="production"
export NODE_PORT=443
export APP_BRANCH="master"
export APP_TYPE="entree"

git checkout master
git pull
npm install
grunt compile

# Build Front-End
gulp build

pm2 restart index.compiled.js --name "master"
