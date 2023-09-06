#!/bin/bash
MACHINE=$1
if [ "$MACHINE" == "" ]; then printf "You need to specify the ip address of a blade to download its vapi package: \e[1;34m'./install.sh <ip-address>'\e[0m\n" && exit; fi

sudo apt-get update && sudo apt-get install -y ca-certificates curl gnupg
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt-get update && sudo apt-get install nodejs -y
npm i -g n && n latest && printf "Updated npm\n"
npm i -g typescript ts-node && printf "Installed typescript globally\n"
npm i http://"$MACHINE"/vapi.tar.gz http://"$MACHINE"/vscript.tar.gz http://"$MACHINE"/vutil.tar.gz && npm i && printf "Installed local dependencies\n"
