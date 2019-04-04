# Blend v2



# Build instructions
    # Ubuntu
    yarn package-ubuntu -i BUILDER_IP -p BUILDER_SSH_PORT

    # Windows
    yarn package-windows

    # Mac
    yarn package-osx

# Deploy private packages
    Step 1) Replace url with git@github.com
            git config --global url."git@github.com:".insteadOf "https://github.com/"

    Step 2) Add github ssh-key
            ssh-keygen -t ed25519 -f ~/.ssh/github
            chmod 0600 ~/.ssh/github

    Step 3) Add ssh key to github and configure it on .ssh/config
              Host github.com
                    User git
                    Hostname github.com
                    PreferredAuthentications publickey
                    IdentityFile ~/.ssh/github
