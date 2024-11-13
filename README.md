# @scom/scom-subscription

## Overview

The `i-scom-subscription` widget is a subscription management tool designed to integrate seamlessly with blockchain-based applications. It provides functionalities for managing product subscriptions, handling discounts, and interacting with various blockchain networks and wallets.

## Features

- **Subscription Management**: Easily manage product subscriptions, including creating, renewing, and fetching subscription details.
- **Discount Handling**: Apply discount rules to subscriptions based on predefined criteria.
- **Blockchain Integration**: Interact with blockchain networks and smart contracts to fetch product information and manage payments.
- **Wallet Support**: Supports multiple wallet providers, including MetaMask and WalletConnect.
- **Token Management**: Fetch and manage token information and balances.

## Installation

### Step 1: Install Packages

To install the necessary packages, run the following command:

## Step 1: Install packages
```sh
docker-compose up install
```
## Step 2: Build and bundle library
```sh
docker-compose up build
```

## Step 3: Run test
```sh
docker-compose up -d test
```
Access the dev server via http://localhost:8080/

## Usage
To use the Scom Editor Widget in your project, import it and include it in your component as follows:
```tsx
render() {
    return (
        <i-panel>           
            <i-scom-subscription id="subscription"></i-scom-subscription>
        </i-panel>
    )
}
```