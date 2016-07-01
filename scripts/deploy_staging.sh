# We don't source .bashrc when using a non-interactive shell so we have to fix the PATH
PATH=$PATH:/home/ubuntu/.nvm/versions/node/v5.5.0/bin

# Remove Caches
rm -rf /tmp/npm-*

cd /home/ubuntu/.pm2/repos

# Check if the folder/branch folder already exists
if cd $1"Entree.Server"; then
    # Pull if folder exists
    git pull
    git reset --hard origin/$1
else
    # If folder doesn't exist, create a new folder and clone into it
    git clone git@github.com:siddharthgutta/Entree.Server.git $1"Entree.Server"
    cd $1"Entree.Server"
fi

# Create Shared node_modules
mkdir -p ../node_modules

# remove node_modules
# https://www.gnu.org/software/bash/manual/bash.html#Interactive-Shell-Behavior
# Search for '-d file'
# Checks if the node_modules is linked and whether or not the folder exists and is a directory
if [[ -L "./node_modules" && -d "./node_modules" ]]
then
    unlink ./node_modules || true
else
    rm -rf ./node_modules || true
fi

# Create symbolic link
ln -s ../node_modules ./node_modules

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

if [[ "$1" == "staging" ]]; then
    export NODE_PORT=443
elif [[ "$1" == "facebook" ]]; then
    export NODE_PORT=2999
else
    export NODE_PORT="$(get_unused_port)"
fi

export APP_BRANCH="$1"

# Sets up the SSL keys
export HTTPS_SSL_KEY="./keys/staging.entreebot.com.key"
export HTTPS_SSL_CERTIFICATE="./keys/staging.entreebot.com.crt"
export HTTPS_SSL_CA="./keys/staging.entreebot.com.chain.crt"

echo "Branch Pushed: $APP_BRANCH"
echo "Free Port Chosen: $NODE_PORT"
git checkout $APP_BRANCH
npm install
grunt compile

# Get a list of appnames from pm2
appname=$(pm2 jlist | jq '.[] .name')

# Iterate through the apps in pm2
for nameWithQuotes in $appname
do
    # Delete any deployed servers with the same branch name
    name=$(echo "$nameWithQuotes" | tr -d '"')
    if [[ $name =~ ^$APP_BRANCH-[0-9]{2,4}$ ]]; then
        pm2 delete $name
    fi
done

# Deploy the branch on the unused port
pm2 start index.compiled.js --name "$APP_BRANCH-$NODE_PORT"
