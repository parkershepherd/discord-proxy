# Discord proxy

Listens for new chat messages from a specific channel, and performs discord actions using your user when they come in. Handy if you want to trigger a bot that is only configured for your own account. Not my fault if this voids anyone's warranties

# Setup

1. Install a recent version of node (i.e. using homebrew on Mac)
2. Clone this repo to a folder on your computer
3. Install dependencies with `npm install`
4. Set up your config `cp .env.example .env` (then add your username/password/channel URL/and ignored usernames list)

# Usage

```sh
node index.mjs
```