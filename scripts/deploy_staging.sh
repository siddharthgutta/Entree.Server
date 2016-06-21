# We don't source .bashrc when using a non-interactive shell so we have to fix the PATH
PATH=$PATH:/home/ubuntu/.nvm/versions/node/v4.4.5/bin

cd /srv/

# Check if the folder/branch folder already exists
if cd $1; then
    # Pull if folder exists
    cd Entree.Server
    git pull
else
    # If folder doesn't exist, create a new folder and clone into it
    mkdir $1 && cd $1
    git clone git@github.com:siddharthgutta/Entree.Server.git
    cd Entree.Server
fi

# Function to get a free port
get_unused_port() {
  # Iterates through ports 3000 to 4000
  for port in $(seq 3000 4000);
  do
    echo -ne "\035" | telnet 127.0.0.1 $port > /dev/null 2>&1;
    [ $? -eq 1 ] && echo "$port" && break;
  done
}

# Setting environment variables
export NODE_ENV="staging"
export NODE_PORT="$(get_unused_port)"
export APP_BRANCH="$1"

echo "Branch Pushed: $APP_BRANCH"
echo "Free Port Chosen: $NODE_PORT"
git checkout $APP_BRANCH
npm install
grunt compile
pm2 restart index.compiled.js --name "$APP_BRANCH-$NODE_PORT" -f
