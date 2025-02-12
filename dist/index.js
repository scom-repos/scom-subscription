var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define("@scom/scom-subscription/index.css.ts", ["require", "exports", "@ijstech/components"], function (require, exports, components_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.linkStyle = exports.inputStyle = void 0;
    exports.inputStyle = components_1.Styles.style({
        $nest: {
            '> input': {
                textAlign: 'right'
            }
        }
    });
    exports.linkStyle = components_1.Styles.style({
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'block',
        cursor: 'pointer',
        $nest: {
            '*': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
            },
        }
    });
});
define("@scom/scom-subscription/interface.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ;
});
define("@scom/scom-subscription/commonUtils.ts", ["require", "exports", "@ijstech/components"], function (require, exports, components_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatNumber = exports.getDurationInDays = void 0;
    function getDurationInDays(duration, unit, startDate) {
        if (unit === 'days') {
            return duration;
        }
        else {
            const dateFormat = 'YYYY-MM-DD';
            const start = startDate ? (0, components_2.moment)(startDate.format(dateFormat), dateFormat) : (0, components_2.moment)();
            const end = (0, components_2.moment)(start).add(duration, unit);
            const diff = end.diff(start, 'days');
            return diff;
        }
    }
    exports.getDurationInDays = getDurationInDays;
    function formatNumber(value, decimalFigures) {
        if (typeof value === 'object') {
            value = value.toFixed();
        }
        const minValue = '0.0000001';
        return components_2.FormatUtils.formatNumber(value, { decimalFigures: decimalFigures !== undefined ? decimalFigures : 4, minValue, hasTrailingZero: false });
    }
    exports.formatNumber = formatNumber;
    ;
});
define("@scom/scom-subscription/data.json.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ///<amd-module name='@scom/scom-subscription/data.json.ts'/> 
    exports.default = {
        "infuraId": "adc596bf88b648e2a8902bc9093930c5",
        "contractInfo": {
            97: {
                "Commission": {
                    "address": "0xcdc39C8bC8F9fDAF31D79f461B47477606770c62"
                }
            },
            43113: {
                "Commission": {
                    "address": "0x2Ed01CB805e7f52c92cfE9eC02E7Dc899cA53BCa"
                }
            }
        }
    };
});
define("@scom/scom-subscription/evmWallet.ts", ["require", "exports", "@scom/scom-wallet-modal", "@ijstech/components", "@ijstech/eth-wallet", "@scom/scom-network-list", "@scom/scom-subscription/data.json.ts"], function (require, exports, scom_wallet_modal_1, components_3, eth_wallet_1, scom_network_list_1, data_json_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EVMWallet = void 0;
    class EventEmitter {
        constructor() {
            this.events = {};
        }
        on(event, listener) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(listener);
        }
        off(event, listener) {
            if (!this.events[event])
                return;
            this.events[event] = this.events[event].filter(l => l !== listener);
        }
        emit(event, data) {
            if (!this.events[event])
                return;
            this.events[event].forEach(listener => listener(data));
        }
    }
    class EVMWallet extends EventEmitter {
        get wallets() {
            return this._wallets ?? this.defaultWallets;
        }
        set wallets(value) {
            this._wallets = value;
        }
        get networks() {
            const nets = this._networks ?? this.defaultNetworks;
            if (this._chainId && !nets.some(v => v.chainId === this._chainId)) {
                nets.push({ chainId: this._chainId });
            }
            return nets;
        }
        set networks(value) {
            this._networks = value;
        }
        constructor() {
            super();
            this.rpcWalletEvents = [];
            this.rpcWalletId = '';
            this.infuraId = '';
            this.defaultWallets = [
                {
                    "name": "metamask"
                },
                {
                    "name": "walletconnect"
                }
            ];
            this.contractInfoByChain = {};
            this.removeRpcWalletEvents = () => {
                const rpcWallet = this.getRpcWallet();
                for (let event of this.rpcWalletEvents) {
                    rpcWallet.unregisterWalletEvent(event);
                }
                this.rpcWalletEvents = [];
            };
            this.getDappContainerData = () => {
                const rpcWallet = this.getRpcWallet();
                const chainId = this._chainId || rpcWallet?.chainId;
                const containerData = {
                    defaultChainId: this._chainId || this.defaultChainId,
                    wallets: this.wallets,
                    networks: chainId ? [{ chainId: chainId }] : this.networks,
                    rpcWalletId: rpcWallet.instanceId,
                    showHeader: true
                };
                return containerData;
            };
            const defaultNetworkList = (0, scom_network_list_1.default)();
            this.networkMap = defaultNetworkList.reduce((acc, cur) => {
                const explorerUrl = cur.blockExplorerUrls && cur.blockExplorerUrls.length ? cur.blockExplorerUrls[0] : "";
                acc[cur.chainId] = {
                    ...cur,
                    explorerTxUrl: explorerUrl ? `${explorerUrl}${explorerUrl.endsWith("/") ? "" : "/"}tx/` : "",
                    explorerAddressUrl: explorerUrl ? `${explorerUrl}${explorerUrl.endsWith("/") ? "" : "/"}address/` : ""
                };
                return acc;
            }, {});
            if (data_json_1.default.infuraId) {
                this.infuraId = data_json_1.default.infuraId;
            }
            if (data_json_1.default.contractInfo) {
                this.contractInfoByChain = data_json_1.default.contractInfo;
            }
            this.defaultNetworks = this.contractInfoByChain ? Object.keys(this.contractInfoByChain).map(chainId => ({ chainId: Number(chainId) })) : [];
        }
        setData(data) {
            const { wallets, networks, chainId, defaultChainId } = data;
            this.wallets = wallets;
            this.networks = networks;
            this._chainId = chainId;
            this.defaultChainId = defaultChainId || 0;
        }
        async initWallet() {
            try {
                await eth_wallet_1.Wallet.getClientInstance().init();
                await this.resetRpcWallet();
                const rpcWallet = this.getRpcWallet();
                await rpcWallet.init();
            }
            catch (err) {
                console.log(err);
            }
        }
        initRpcWallet(defaultChainId) {
            if (this.rpcWalletId) {
                return this.rpcWalletId;
            }
            const clientWallet = eth_wallet_1.Wallet.getClientInstance();
            const networkList = Object.values(components_3.application.store?.networkMap || this.networkMap || []);
            const instanceId = clientWallet.initRpcWallet({
                networks: networkList,
                defaultChainId,
                infuraId: components_3.application.store?.infuraId,
                multicalls: components_3.application.store?.multicalls
            });
            this.rpcWalletId = instanceId;
            if (clientWallet.address) {
                const rpcWallet = eth_wallet_1.Wallet.getRpcWalletInstance(instanceId);
                rpcWallet.address = clientWallet.address;
            }
            return instanceId;
        }
        async resetRpcWallet() {
            this.removeRpcWalletEvents();
            this.initRpcWallet(this._chainId || this.defaultChainId);
            const rpcWallet = this.getRpcWallet();
            const chainChangedEvent = rpcWallet.registerWalletEvent(this, eth_wallet_1.Constants.RpcWalletEvent.ChainChanged, async (chainId) => {
                this.emit("chainChanged");
            });
            const connectedEvent = rpcWallet.registerWalletEvent(this, eth_wallet_1.Constants.RpcWalletEvent.Connected, async (connected) => {
                this.emit("walletConnected");
            });
            this.rpcWalletEvents.push(chainChangedEvent, connectedEvent);
            const dappContainerData = this.getDappContainerData();
            this.emit("walletUpdated", dappContainerData);
        }
        updateDappContainerData() {
            const dappContainerData = this.getDappContainerData();
            this.emit("walletUpdated", dappContainerData);
        }
        getRpcWallet() {
            return this.rpcWalletId ? eth_wallet_1.Wallet.getRpcWalletInstance(this.rpcWalletId) : null;
        }
        async connectWallet(modalContainer) {
            if (!this.mdEVMWallet) {
                await components_3.application.loadPackage('@scom/scom-wallet-modal', '*');
                this.mdEVMWallet = new scom_wallet_modal_1.default();
                modalContainer.append(this.mdEVMWallet);
            }
            await this.mdEVMWallet.setData({
                networks: this.networks,
                wallets: this.wallets
            });
            this.mdEVMWallet.showModal();
        }
        isWalletConnected() {
            const wallet = eth_wallet_1.Wallet.getClientInstance();
            return wallet.isConnected;
        }
        isNetworkConnected() {
            const wallet = this.getRpcWallet();
            return wallet?.isConnected;
        }
        getContractAddress(type) {
            const rpcWallet = this.getRpcWallet();
            const contracts = this.contractInfoByChain[rpcWallet.chainId] || {};
            return contracts[type]?.address;
        }
        async switchNetwork() {
            const rpcWallet = this.getRpcWallet();
            const wallet = eth_wallet_1.Wallet.getClientInstance();
            await wallet.switchNetwork(rpcWallet.chainId);
        }
        getNetworkInfo(chainId) {
            return this.networkMap[chainId];
        }
        viewExplorerByAddress(address) {
            const rpcWallet = this.getRpcWallet();
            let network = this.getNetworkInfo(rpcWallet.chainId);
            if (network && network.explorerAddressUrl) {
                let url = `${network.explorerAddressUrl}${address}`;
                window.open(url);
            }
        }
    }
    exports.EVMWallet = EVMWallet;
});
define("@scom/scom-subscription/tonWallet.ts", ["require", "exports", "@ijstech/components", "@ijstech/eth-wallet"], function (require, exports, components_4, eth_wallet_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TonWallet = void 0;
    const JETTON_TRANSFER_OP = 0xf8a7ea5; // 32-bit
    class TonWallet {
        constructor(moduleDir, onTonWalletStatusChanged) {
            this._isWalletConnected = false;
            this.networkType = 'testnet';
            this.loadLib(moduleDir);
            this._onTonWalletStatusChanged = onTonWalletStatusChanged;
            this.initWallet();
        }
        get isWalletConnected() {
            return this._isWalletConnected;
        }
        async loadLib(moduleDir) {
            let self = this;
            return new Promise((resolve, reject) => {
                components_4.RequireJS.config({
                    baseUrl: `${moduleDir}/lib`,
                    paths: {
                        'ton-core': 'ton-core',
                    }
                });
                components_4.RequireJS.require(['ton-core'], function (TonCore) {
                    self.toncore = TonCore;
                    resolve(self.toncore);
                });
            });
        }
        initWallet() {
            try {
                let UI = window['TON_CONNECT_UI'];
                if (!this.tonConnectUI) {
                    this.tonConnectUI = new UI.TonConnectUI({
                        manifestUrl: 'https://ton.noto.fan/tonconnect/manifest.json',
                        buttonRootId: 'pnlHeader'
                    });
                }
                this.tonConnectUI.connectionRestored.then(async (restored) => {
                    this._isWalletConnected = this.tonConnectUI.connected;
                    if (this._onTonWalletStatusChanged)
                        this._onTonWalletStatusChanged(this._isWalletConnected);
                });
                this.tonConnectUI.onStatusChange((walletAndwalletInfo) => {
                    this._isWalletConnected = !!walletAndwalletInfo;
                    if (this._onTonWalletStatusChanged)
                        this._onTonWalletStatusChanged(this._isWalletConnected);
                });
            }
            catch (err) {
                // alert(err)
                console.log(err);
            }
        }
        getWalletAddress() {
            const rawAddress = this.tonConnectUI.account?.address;
            const nonBounceableAddress = this.toncore.Address.parse(rawAddress).toString({ bounceable: false });
            return nonBounceableAddress;
        }
        getTonCenterAPIEndpoint() {
            switch (this.networkType) {
                case 'mainnet':
                    return 'https://toncenter.com/api';
                case 'testnet':
                    return 'https://testnet.toncenter.com/api';
                default:
                    throw new Error('Unsupported network type');
            }
        }
        async connectWallet() {
            try {
                await this.tonConnectUI.openModal();
            }
            catch (err) {
                alert(err);
            }
        }
        async sendTransaction(txData) {
            return await this.tonConnectUI.sendTransaction(txData);
        }
        constructPayload(msg) {
            const body = this.toncore.beginCell()
                .storeUint(0, 32)
                .storeStringTail(msg)
                .endCell();
            const payload = body.toBoc().toString("base64");
            return payload;
        }
        constructPayloadForTokenTransfer(to, amount, msg) {
            const recipientAddress = this.toncore.Address.parse(to);
            const forwardPayload = this.toncore.beginCell()
                .storeUint(0, 32) // 0 opcode means we have a comment
                .storeStringTail(msg)
                .endCell();
            const bodyCell = this.toncore.beginCell()
                .storeUint(JETTON_TRANSFER_OP, 32) // function ID
                .storeUint(0, 64) // query_id (can be 0 or a custom value)
                .storeCoins(amount) // amount in nano-jettons
                .storeAddress(recipientAddress) // destination
                .storeAddress(null) // response_destination (set to NULL if you don't need callback)
                .storeMaybeRef(null) // custom_payload (None)
                .storeCoins(this.toncore.toNano('0.02')) // forward_ton_amount (some TON to forward, e.g. 0.02)
                .storeMaybeRef(forwardPayload)
                .endCell();
            return bodyCell.toBoc().toString('base64');
        }
        getTransactionMessageHash(boc) {
            const cell = this.toncore.Cell.fromBase64(boc);
            const hashBytes = cell.hash();
            const messageHash = hashBytes.toString('base64');
            return messageHash;
        }
        buildOwnerSlice(userAddress) {
            const owner = this.toncore.Address.parse(userAddress);
            const cell = this.toncore.beginCell()
                .storeAddress(owner)
                .endCell();
            return cell.toBoc().toString('base64');
        }
        async getJettonWalletAddress(jettonMasterAddress, userAddress) {
            const base64Cell = this.buildOwnerSlice(userAddress);
            const apiEndpoint = this.getTonCenterAPIEndpoint();
            const url = `${apiEndpoint}/v3/runGetMethod`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: jettonMasterAddress,
                    method: 'get_wallet_address',
                    stack: [
                        {
                            type: 'slice',
                            value: base64Cell,
                        },
                    ],
                })
            });
            const data = await response.json();
            const cell = this.toncore.Cell.fromBase64(data.stack[0].value);
            const slice = cell.beginParse();
            const address = slice.loadAddress();
            return address.toString({
                bounceable: true,
                testOnly: this.networkType === 'testnet'
            });
        }
        async transferToken(to, token, amount, msg, callback, confirmationCallback) {
            let result;
            let messageHash;
            try {
                if (!token.address) {
                    const payload = this.constructPayload(msg);
                    const transaction = {
                        validUntil: Math.floor(Date.now() / 1000) + 60,
                        messages: [
                            {
                                address: to,
                                amount: eth_wallet_2.Utils.toDecimals(amount, 9).toFixed(),
                                payload: payload
                            }
                        ]
                    };
                    result = await this.sendTransaction(transaction);
                }
                else {
                    const senderJettonAddress = await this.getJettonWalletAddress(token.address, this.getWalletAddress());
                    const jettonAmount = eth_wallet_2.Utils.toDecimals(amount, token.decimals).toFixed();
                    const payload = this.constructPayloadForTokenTransfer(to, jettonAmount, msg);
                    const transaction = {
                        validUntil: Math.floor(Date.now() / 1000) + 60,
                        messages: [
                            {
                                address: senderJettonAddress,
                                amount: eth_wallet_2.Utils.toDecimals('0.05', 9),
                                payload: payload
                            }
                        ]
                    };
                    result = await this.sendTransaction(transaction);
                }
                if (result) {
                    messageHash = this.getTransactionMessageHash(result.boc);
                    if (callback) {
                        callback(null, messageHash);
                    }
                }
            }
            catch (error) {
                callback(error);
            }
            return messageHash;
        }
    }
    exports.TonWallet = TonWallet;
});
define("@scom/scom-subscription/model.ts", ["require", "exports", "@ijstech/components", "@scom/scom-network-list", "@scom/scom-social-sdk", "@ijstech/eth-wallet", "@scom/scom-product-contract", "@scom/scom-token-list", "@scom/scom-subscription/commonUtils.ts"], function (require, exports, components_5, scom_network_list_2, scom_social_sdk_1, eth_wallet_3, scom_product_contract_1, scom_token_list_1, commonUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EVMModel = exports.TonModel = void 0;
    class TonModel {
        get productMarketplaceAddress() {
            return this._productMarketplaceAddress;
        }
        get paymentMethod() {
            if (this._data.paymentMethod) {
                return this._data.paymentMethod;
            }
            else {
                return this._data.currency === 'TON' ? scom_social_sdk_1.PaymentMethod.TON : scom_social_sdk_1.PaymentMethod.Telegram;
            }
        }
        get currency() {
            return this._token?.symbol || this._data.currency;
        }
        get token() {
            const tokenList = scom_token_list_1.tokenStore.getTokenListByNetworkCode('TON-TESTNET');
            if (this._data.currency === 'TON') {
                return tokenList.find(token => token.symbol === 'TON');
            }
            else {
                return tokenList.find(token => token.address === this._data.currency);
            }
        }
        get recipient() {
            return this._data.recipient ?? '';
        }
        get recipients() {
            return this._data.recipients || [];
        }
        get referrer() {
            return this._data.referrer;
        }
        get productId() {
            return this._data.productId;
        }
        set productId(value) {
            this._data.productId = value;
        }
        get isRenewal() {
            return this._data.isRenewal;
        }
        set isRenewal(value) {
            this._data.isRenewal = value;
        }
        get renewalDate() {
            return this._data.renewalDate;
        }
        set renewalDate(value) {
            this._data.renewalDate = value;
        }
        get discountApplied() {
            return this._discountApplied;
        }
        set discountApplied(value) {
            this._discountApplied = value;
        }
        get discountRuleId() {
            return this._data.discountRuleId;
        }
        set discountRuleId(value) {
            this._data.discountRuleId = value;
        }
        get productInfo() {
            return this._productInfo;
        }
        set productInfo(info) {
            this._productInfo = info;
        }
        get dataManager() {
            return this._dataManager || components_5.application.store?.mainDataManager;
        }
        set dataManager(manager) {
            this._dataManager = manager;
        }
        constructor(module, tonWallet) {
            this._data = {};
            this.updateDiscount = (duration, startDate, days) => {
                this.discountApplied = undefined;
                if (!this._data.discountRules?.length || !duration || !startDate)
                    return;
                const paymentMethod = this.paymentMethod;
                const price = new eth_wallet_3.BigNumber(this._data.tokenAmount);
                const durationInDays = this._data.durationInDays;
                const startTime = startDate.unix();
                let discountAmount;
                for (let rule of this._data.discountRules) {
                    if (rule.discountApplication === 0 && this.isRenewal)
                        continue;
                    if (rule.discountApplication === 1 && !this.isRenewal)
                        continue;
                    if ((rule.startTime > 0 && startTime < rule.startTime) || (rule.endTime > 0 && startTime > rule.endTime) || rule.minDuration > days)
                        continue;
                    let basePrice = price;
                    if (rule.discountPercentage > 0) {
                        basePrice = price.times(1 - rule.discountPercentage / 100);
                    }
                    else if (rule.fixedPrice > 0) {
                        basePrice = new eth_wallet_3.BigNumber(rule.fixedPrice);
                    }
                    let tmpDiscountAmount = price.minus(basePrice).div(durationInDays).times(days);
                    if (!this.discountApplied || tmpDiscountAmount.gt(discountAmount)) {
                        this.discountApplied = rule;
                        discountAmount = tmpDiscountAmount;
                    }
                }
            };
            this._module = module;
            this.tonWallet = tonWallet;
        }
        getDiscountAndTotalAmount(days) {
            let discountType;
            let discountValue;
            let discountAmount;
            let totalAmount;
            const price = new eth_wallet_3.BigNumber(this._data?.tokenAmount || 0);
            let basePrice = price;
            if (this.discountApplied) {
                if (this.discountApplied.discountPercentage > 0) {
                    discountValue = this.discountApplied.discountPercentage;
                    discountType = 'Percentage';
                    basePrice = price.times(1 - this.discountApplied.discountPercentage / 100);
                }
                else if (this.discountApplied.fixedPrice > 0) {
                    discountValue = this.discountApplied.fixedPrice;
                    discountType = 'FixedAmount';
                    basePrice = new eth_wallet_3.BigNumber(this.discountApplied.fixedPrice);
                }
                if (discountType) {
                    discountAmount = price.minus(basePrice).div(this._data.durationInDays).times(days);
                }
            }
            const pricePerDay = basePrice.div(this._data?.durationInDays || 1);
            totalAmount = pricePerDay.times(days);
            return { discountType, discountValue, discountAmount, totalAmount };
        }
        async getProductId(nftAddress, nftId) {
            return 0;
        }
        async fetchProductInfo(productId) {
            return null;
        }
        async getSubscriptionAction(recipient) {
            if (this.isRenewal) {
                return this.renewSubscription.bind(this);
            }
            else {
                return this.subscribe.bind(this);
            }
        }
        getPaymentTransactionComment(startTime, endTime, days) {
            const creatorPubkey = scom_social_sdk_1.Nip19.decode(this._data.creatorId).data;
            return `${creatorPubkey}:${this._data.communityId}:${this.dataManager.selfPubkey}:${startTime}:${endTime}`;
        }
        async subscribe(options) {
            const { startTime, endTime, days, callback, confirmationCallback } = options;
            // const txData = this.getPaymentTransactionData(startTime, endTime, days);
            // return await this.tonWallet.sendTransaction(txData);
            const comment = this.getPaymentTransactionComment(startTime, endTime, days);
            return await this.tonWallet.transferToken(this.recipient, this.token, this._data.tokenAmount, comment, callback, confirmationCallback);
        }
        async renewSubscription(options) {
            const { startTime, endTime, days, callback, confirmationCallback } = options;
            // const txData = this.getPaymentTransactionData(startTime, endTime, days);
            // return await this.tonWallet.sendTransaction(txData);
            const comment = this.getPaymentTransactionComment(startTime, endTime, days);
            return await this.tonWallet.transferToken(this.recipient, this.token, this._data.tokenAmount, comment, callback, confirmationCallback);
        }
        getPaymentTransactionData(startTime, endTime, days) {
            const { totalAmount } = this.getDiscountAndTotalAmount(days);
            let subscriptionFee = totalAmount;
            let subscriptionFeeToAddress = this._data.recipient;
            const creatorPubkey = scom_social_sdk_1.Nip19.decode(this._data.creatorId).data;
            const comment = `${creatorPubkey}:${this._data.communityId}:${this.dataManager.selfPubkey}:${startTime}:${endTime}`;
            const payload = this.tonWallet.constructPayload(comment);
            //https://ton-connect.github.io/sdk/modules/_tonconnect_ui.html#send-transaction
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 60,
                messages: [
                    {
                        address: subscriptionFeeToAddress,
                        amount: subscriptionFee.times(1e9).toFixed(),
                        payload: payload
                    }
                ]
            };
            return transaction;
        }
        getBasePriceLabel() {
            const { durationInDays, tokenAmount } = this.getData();
            const symbol = this.token?.symbol || "";
            const formattedAmount = tokenAmount ? (0, commonUtils_1.formatNumber)(tokenAmount, 6) : "";
            return durationInDays > 1 ?
                this._module.i18n.get('$base_price_ton_duration_in_days', { amount: formattedAmount, currency: symbol, days: `${durationInDays}` }) :
                this._module.i18n.get('$base_price_ton_per_day', { amount: formattedAmount, currency: symbol });
        }
        async setData(value) {
            this._data = value;
            const { currency, networkCode } = value;
            this._token = networkCode ?
                scom_token_list_1.tokenStore.getTokenListByNetworkCode(networkCode).find(token => token.symbol === currency || token.address === currency) : null;
        }
        getData() {
            return this._data;
        }
    }
    exports.TonModel = TonModel;
    class EVMModel {
        get productMarketplaceAddress() {
            return this._productMarketplaceAddress;
        }
        get paymentMethod() {
            return scom_social_sdk_1.PaymentMethod.EVM;
        }
        get currency() {
            return this.token?.symbol;
        }
        get token() {
            return this.productInfo?.token;
        }
        get recipient() {
            return this._data.recipient ?? '';
        }
        get recipients() {
            return this._data.recipients || [];
        }
        get referrer() {
            return this._data.referrer;
        }
        get productId() {
            return this._data.productId;
        }
        set productId(value) {
            this._data.productId = value;
        }
        get isRenewal() {
            return this._data.isRenewal;
        }
        set isRenewal(value) {
            this._data.isRenewal = value;
        }
        get renewalDate() {
            return this._data.renewalDate;
        }
        set renewalDate(value) {
            this._data.renewalDate = value;
        }
        get discountApplied() {
            return this._discountApplied;
        }
        set discountApplied(value) {
            this._discountApplied = value;
        }
        get discountRuleId() {
            return this._data.discountRuleId;
        }
        set discountRuleId(value) {
            this._data.discountRuleId = value;
        }
        get productInfo() {
            return this._productInfo;
        }
        set productInfo(info) {
            this._productInfo = info;
        }
        get dataManager() {
            return this._dataManager || components_5.application.store?.mainDataManager;
        }
        set dataManager(manager) {
            this._dataManager = manager;
        }
        constructor(module, evmWallet) {
            this._data = {};
            this.updateDiscount = (duration, startDate, days) => {
                this.discountApplied = undefined;
                if (!this._data.discountRules?.length || !duration || !startDate)
                    return;
                const paymentMethod = this.paymentMethod;
                const price = eth_wallet_3.Utils.fromDecimals(this.productInfo.price, this.productInfo.token.decimals);
                const durationInDays = this.productInfo.priceDuration.div(86400);
                const startTime = startDate.unix();
                let discountAmount;
                for (let rule of this._data.discountRules) {
                    if (rule.discountApplication === 0 && this.isRenewal)
                        continue;
                    if (rule.discountApplication === 1 && !this.isRenewal)
                        continue;
                    if ((rule.startTime > 0 && startTime < rule.startTime) || (rule.endTime > 0 && startTime > rule.endTime) || rule.minDuration > days)
                        continue;
                    let basePrice = price;
                    if (rule.discountPercentage > 0) {
                        basePrice = price.times(1 - rule.discountPercentage / 100);
                    }
                    else if (rule.fixedPrice > 0) {
                        basePrice = new eth_wallet_3.BigNumber(rule.fixedPrice);
                    }
                    let tmpDiscountAmount = price.minus(basePrice).div(durationInDays).times(days);
                    if (!this.discountApplied || tmpDiscountAmount.gt(discountAmount)) {
                        this.discountApplied = rule;
                        discountAmount = tmpDiscountAmount;
                    }
                }
            };
            this._module = module;
            this._evmWallet = evmWallet;
        }
        registerSendTxEvents(sendTxEventHandlers) {
            const wallet = eth_wallet_3.Wallet.getClientInstance();
            wallet.registerSendTxEvents({
                transactionHash: (error, receipt) => {
                    if (sendTxEventHandlers.transactionHash) {
                        sendTxEventHandlers.transactionHash(error, receipt);
                    }
                },
                confirmation: (receipt) => {
                    if (sendTxEventHandlers.confirmation) {
                        sendTxEventHandlers.confirmation(receipt);
                    }
                },
            });
        }
        getDiscountAndTotalAmount(days) {
            let discountType;
            let discountValue;
            let discountAmount;
            let totalAmount;
            const price = this.productInfo.price;
            let basePrice = price;
            if (this.discountApplied) {
                if (this.discountApplied.discountPercentage > 0) {
                    discountValue = this.discountApplied.discountPercentage;
                    discountType = 'Percentage';
                    basePrice = price.times(1 - this.discountApplied.discountPercentage / 100);
                }
                else if (this.discountApplied.fixedPrice > 0) {
                    discountValue = this.discountApplied.fixedPrice;
                    discountType = 'FixedAmount';
                    basePrice = new eth_wallet_3.BigNumber(this.discountApplied.fixedPrice);
                }
                if (discountType) {
                    const discountAmountRaw = price.minus(basePrice).div(this.productInfo.priceDuration.div(86400)).times(days);
                    discountAmount = eth_wallet_3.Utils.fromDecimals(discountAmountRaw, this.productInfo.token.decimals);
                }
            }
            const pricePerDay = basePrice.div(this.productInfo.priceDuration.div(86400));
            const amountRaw = pricePerDay.times(days);
            totalAmount = eth_wallet_3.Utils.fromDecimals(amountRaw, this.productInfo.token.decimals);
            return { discountType, discountValue, discountAmount, totalAmount };
        }
        async getTokenInfo(address, chainId) {
            let token;
            const wallet = eth_wallet_3.Wallet.getClientInstance();
            wallet.chainId = chainId;
            const isValidAddress = wallet.isAddress(address);
            if (isValidAddress) {
                const tokenAddress = wallet.toChecksumAddress(address);
                const tokenInfo = await wallet.tokenInfo(tokenAddress);
                if (tokenInfo?.symbol) {
                    token = {
                        chainId,
                        address: tokenAddress,
                        name: tokenInfo.name,
                        decimals: tokenInfo.decimals,
                        symbol: tokenInfo.symbol
                    };
                }
            }
            return token;
        }
        async getProductId(nftAddress, nftId) {
            let productId;
            try {
                const wallet = this._evmWallet.getRpcWallet();
                if (nftId != null) {
                    const oneTimePurchaseNFT = new scom_product_contract_1.Contracts.OneTimePurchaseNFT(wallet, nftAddress);
                    productId = (await oneTimePurchaseNFT.productIdByTokenId(nftId)).toNumber();
                }
                else {
                    const subscriptionNFT = new scom_product_contract_1.Contracts.SubscriptionNFT(wallet, nftAddress);
                    productId = (await subscriptionNFT.productId()).toNumber();
                }
            }
            catch {
                console.log("product id not found");
            }
            return productId;
        }
        async fetchProductInfo(productId) {
            try {
                const wallet = this._evmWallet.getRpcWallet();
                const subscriptionNFT = new scom_product_contract_1.Contracts.SubscriptionNFT(wallet, this._data.tokenAddress);
                this._productMarketplaceAddress = await subscriptionNFT.minter();
                if (!this._productMarketplaceAddress)
                    return null;
                const productMarketplace = new scom_product_contract_1.Contracts.ProductMarketplace(wallet, this._productMarketplaceAddress);
                const product = await productMarketplace.products(productId);
                const chainId = wallet.chainId;
                if (product.token && product.token === eth_wallet_3.Utils.nullAddress) {
                    let net = (0, scom_network_list_2.default)().find(net => net.chainId === chainId);
                    return {
                        ...product,
                        token: {
                            chainId: wallet.chainId,
                            address: product.token,
                            decimals: net.nativeCurrency.decimals,
                            symbol: net.nativeCurrency.symbol,
                            name: net.nativeCurrency.symbol,
                        }
                    };
                }
                const _tokenList = scom_token_list_1.tokenStore.getTokenList(chainId);
                let token = _tokenList.find(token => product.token && token.address && token.address.toLowerCase() === product.token.toLowerCase());
                if (!token && product.token) {
                    token = await this.getTokenInfo(product.token, chainId);
                }
                return {
                    ...product,
                    token
                };
            }
            catch {
                return null;
            }
        }
        async getDiscount(promotionAddress, productId, productPrice, discountRuleId) {
            let basePrice = productPrice;
            const wallet = eth_wallet_3.Wallet.getClientInstance();
            const promotion = new scom_product_contract_1.Contracts.Promotion(wallet, promotionAddress);
            const index = await promotion.discountRuleIdToIndex({ param1: productId, param2: discountRuleId });
            const rule = await promotion.discountRules({ param1: productId, param2: index });
            if (rule.discountPercentage.gt(0)) {
                const discount = productPrice.times(rule.discountPercentage).div(100);
                if (productPrice.gt(discount))
                    basePrice = productPrice.minus(discount);
            }
            else if (rule.fixedPrice.gt(0)) {
                basePrice = rule.fixedPrice;
            }
            else {
                discountRuleId = 0;
            }
            return {
                price: basePrice,
                id: discountRuleId
            };
        }
        async getSubscriptionAction(recipient) {
            const wallet = eth_wallet_3.Wallet.getClientInstance();
            const subscriptionNFT = new scom_product_contract_1.Contracts.SubscriptionNFT(wallet, this.productInfo.nft);
            let nftBalance = await subscriptionNFT.balanceOf(recipient);
            if (nftBalance.eq(0)) {
                return this.subscribe.bind(this);
            }
            else {
                return this.renewSubscription.bind(this);
            }
        }
        async subscribe(options) {
            const { startTime, duration, recipient, callback, confirmationCallback } = options;
            let commissionAddress = this._evmWallet.getContractAddress('Commission');
            const wallet = eth_wallet_3.Wallet.getClientInstance();
            const commission = new scom_product_contract_1.Contracts.Commission(wallet, commissionAddress);
            const productMarketplace = new scom_product_contract_1.Contracts.ProductMarketplace(wallet, this._productMarketplaceAddress);
            let basePrice = this.productInfo.price;
            let discountRuleId = this.discountApplied?.id ?? 0;
            if (discountRuleId !== 0) {
                const promotionAddress = await productMarketplace.promotion();
                const discount = await this.getDiscount(promotionAddress, this.productId, this.productInfo.price, discountRuleId);
                basePrice = discount.price;
                if (discount.id === 0)
                    discountRuleId = 0;
            }
            const amount = this.productInfo.priceDuration.eq(duration) ? basePrice : basePrice.times(duration).div(this.productInfo.priceDuration);
            let tokenInAmount;
            if (this.referrer) {
                let campaign = await commission.getCampaign({ campaignId: this.productId, returnArrays: true });
                const affiliates = (campaign?.affiliates || []).map(a => a.toLowerCase());
                if (affiliates.includes(this.referrer.toLowerCase())) {
                    const commissionRate = eth_wallet_3.Utils.fromDecimals(campaign.commissionRate, 6);
                    tokenInAmount = new eth_wallet_3.BigNumber(amount).dividedBy(new eth_wallet_3.BigNumber(1).minus(commissionRate)).decimalPlaces(0, eth_wallet_3.BigNumber.ROUND_DOWN);
                }
            }
            let receipt;
            try {
                this.registerSendTxEvents({
                    transactionHash: callback,
                    confirmation: confirmationCallback
                });
                if (this.productInfo.token.address === eth_wallet_3.Utils.nullAddress) {
                    if (!tokenInAmount || tokenInAmount.isZero()) {
                        receipt = await productMarketplace.subscribe({
                            to: recipient || wallet.address,
                            productId: this.productId,
                            startTime: startTime,
                            duration: duration,
                            discountRuleId: discountRuleId
                        }, amount);
                    }
                    else {
                        const txData = await productMarketplace.subscribe.txData({
                            to: recipient || wallet.address,
                            productId: this.productId,
                            startTime: startTime,
                            duration: duration,
                            discountRuleId: discountRuleId
                        }, amount);
                        receipt = await commission.proxyCall({
                            affiliate: this.referrer,
                            campaignId: this.productId,
                            amount: tokenInAmount,
                            data: txData
                        }, tokenInAmount);
                    }
                }
                else {
                    if (!tokenInAmount || tokenInAmount.isZero()) {
                        receipt = await productMarketplace.subscribe({
                            to: recipient || wallet.address,
                            productId: this.productId,
                            startTime: startTime,
                            duration: duration,
                            discountRuleId: discountRuleId
                        });
                    }
                    else {
                        const txData = await productMarketplace.subscribe.txData({
                            to: recipient || wallet.address,
                            productId: this.productId,
                            startTime: startTime,
                            duration: duration,
                            discountRuleId: discountRuleId
                        });
                        receipt = await commission.proxyCall({
                            affiliate: this.referrer,
                            campaignId: this.productId,
                            amount: tokenInAmount,
                            data: txData
                        });
                    }
                }
            }
            catch (err) {
                console.error(err);
                throw err;
            }
            return receipt;
        }
        async renewSubscription(options) {
            const { startTime, duration, recipient, callback, confirmationCallback } = options;
            const wallet = eth_wallet_3.Wallet.getClientInstance();
            const productMarketplace = new scom_product_contract_1.Contracts.ProductMarketplace(wallet, this._productMarketplaceAddress);
            const subscriptionNFT = new scom_product_contract_1.Contracts.SubscriptionNFT(wallet, this.productInfo.nft);
            let nftId = await subscriptionNFT.tokenOfOwnerByIndex({
                owner: recipient,
                index: 0
            });
            let basePrice = this.productInfo.price;
            let discountRuleId = this.discountApplied?.id ?? 0;
            if (discountRuleId !== 0) {
                const promotionAddress = await productMarketplace.promotion();
                const discount = await this.getDiscount(promotionAddress, this.productId, this.productInfo.price, discountRuleId);
                basePrice = discount.price;
                if (discount.id === 0)
                    discountRuleId = 0;
            }
            const amount = this.productInfo.priceDuration.eq(duration) ? basePrice : basePrice.times(duration).div(this.productInfo.priceDuration);
            let receipt;
            try {
                this.registerSendTxEvents({
                    transactionHash: callback,
                    confirmation: confirmationCallback
                });
                if (this.productInfo.token.address === eth_wallet_3.Utils.nullAddress) {
                    receipt = await productMarketplace.renewSubscription({
                        productId: this.productId,
                        nftId: nftId,
                        duration: duration,
                        discountRuleId: discountRuleId
                    }, amount);
                }
                else {
                    receipt = await productMarketplace.renewSubscription({
                        productId: this.productId,
                        nftId: nftId,
                        duration: duration,
                        discountRuleId: discountRuleId
                    });
                }
            }
            catch (err) {
                console.error(err);
                throw err;
            }
            return receipt;
        }
        getPaymentTransactionData(startTime, endTime, days) {
            throw new Error("Method not implemented.");
        }
        getBasePriceLabel() {
            const { token, price, priceDuration } = this.productInfo;
            const productPrice = eth_wallet_3.Utils.fromDecimals(price, token.decimals).toFixed();
            const days = Math.ceil((priceDuration?.toNumber() || 0) / 86400);
            const formattedAmount = productPrice ? (0, commonUtils_1.formatNumber)(productPrice, 6) : "";
            const symbol = token?.symbol || "";
            return days > 1 ?
                this._module.i18n.get('$base_price_evm_duration_in_days', { amount: formattedAmount, symbol: symbol, days: `${days}` }) :
                this._module.i18n.get('$base_price_evm_per_day', { amount: formattedAmount, symbol: symbol });
        }
        async setData(value) {
            this._data = value;
        }
        getData() {
            return this._data;
        }
    }
    exports.EVMModel = EVMModel;
});
define("@scom/scom-subscription/translations.json.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ///<amd-module name='@scom/scom-subscription/translations.json.ts'/> 
    exports.default = {
        "en": {
            "day(s)": "Day(s)",
            "month(s)": "Month(s)",
            "year(s)": "Year(s)",
            "approve": "Approve",
            "approving": "Approving",
            "approving_token": "Approving {{token}}",
            "sold_out": "SOLD OUT",
            "hurry_only_remaining_nfts_left": "🔥Hurry! Only [ {{remaining}} NFTs Left ]🔥",
            "connect_wallet": "Connect Wallet",
            "switch_network": "Switch Network",
            "subscribe": "Subscribe",
            "renew_subscription": "Renew Subscription",
            "discount": "Discount",
            "discount_percentage": "Discount ({{percentage}}%)",
            "now": "Now",
            "hide_information": "Hide Information",
            "more_information": "More Information",
            "start_date_required": "Start Date Required",
            "duration_required": "Duration Required",
            "invalid_duration": "Invalid Duration",
            "confirming": "Confirming",
            "wallet_address_to_receive_nft": "Wallet Address to Receive NFT",
            "start_date": "Start Date",
            "custom": "Custom",
            "duration": "Duration",
            "end_date": "End Date",
            "base_price": "Base Price",
            "you_will_pay": "You will pay",
            "remaining": "Remaining",
            "marketplace_contract_address": "Marketplace Contract Address",
            "nft_contract_address": "NFT Contract Address",
            "token_used_for_payment": "Token used for payment",
            "base_price_ton_duration_in_days": "{{amount}} {{currency}} for {{days}} days",
            "base_price_ton_per_day": "{{amount}} {{currency}} per day",
            "base_price_evm_duration_in_days": "{{amount}} {{symbol}} for {{days}} days",
            "base_price_evm_per_day": "{{amount}} {{symbol}} per day",
        },
        "zh-hant": {
            "day(s)": "天",
            "month(s)": "月",
            "year(s)": "年",
            "approve": "批准",
            "approving": "正在批准",
            "approving_token": "正在批准 {{token}}",
            "sold_out": "售罄",
            "hurry_only_remaining_nfts_left": "🔥快點！只剩 [ {{remaining}} 個 NFTs ]🔥",
            "connect_wallet": "連接錢包",
            "switch_network": "切換網絡",
            "subscribe": "訂閱",
            "renew_subscription": "續訂",
            "discount": "折扣",
            "discount_percentage": "折扣 ({{percentage}}%)",
            "now": "現在",
            "hide_information": "隱藏資訊",
            "more_information": "更多資訊",
            "start_date_required": "必須選擇開始日期",
            "duration_required": "必須選擇持續時間",
            "invalid_duration": "無效的持續時間",
            "confirming": "確認中",
            "wallet_address_to_receive_nft": "接收 NFT 的錢包地址",
            "start_date": "開始日期",
            "custom": "自訂",
            "duration": "持續時間",
            "end_date": "結束日期",
            "base_price": "基本價格",
            "you_will_pay": "您將支付",
            "remaining": "剩餘",
            "marketplace_contract_address": "市場合約地址",
            "nft_contract_address": "NFT 合約地址",
            "token_used_for_payment": "用於支付的代幣",
            "base_price_ton_duration_in_days": "{{amount}} {{currency}} 為期 {{days}} 天",
            "base_price_ton_per_day": "{{amount}} {{currency}} 每天",
            "base_price_evm_duration_in_days": "{{amount}} {{symbol}} 為期 {{days}} 天",
            "base_price_evm_per_day": "{{amount}} {{symbol}} 每天"
        },
        "vi": {
            "day(s)": "Ngày",
            "month(s)": "Tháng",
            "year(s)": "Năm",
            "approve": "Phê duyệt",
            "approving": "Đang phê duyệt",
            "approving_token": "Đang phê duyệt {{token}}",
            "sold_out": "HẾT HÀNG",
            "hurry_only_remaining_nfts_left": "🔥Nhanh lên! Chỉ còn [ {{remaining}} NFTs ]🔥",
            "connect_wallet": "Kết nối ví",
            "switch_network": "Chuyển mạng",
            "subscribe": "Đăng ký",
            "renew_subscription": "Gia hạn đăng ký",
            "discount": "Giảm giá",
            "discount_percentage": "Giảm giá ({{percentage}}%)",
            "now": "Bây giờ",
            "hide_information": "Ẩn thông tin",
            "more_information": "Thông tin thêm",
            "start_date_required": "Cần có ngày bắt đầu",
            "duration_required": "Cần có thời gian",
            "invalid_duration": "Thời gian không hợp lệ",
            "confirming": "Đang xác nhận",
            "wallet_address_to_receive_nft": "Địa chỉ ví để nhận NFT",
            "start_date": "Ngày bắt đầu",
            "custom": "Tùy chỉnh",
            "duration": "Thời gian",
            "end_date": "Ngày kết thúc",
            "base_price": "Giá cơ bản",
            "you_will_pay": "Bạn sẽ thanh toán",
            "remaining": "Còn lại",
            "marketplace_contract_address": "Địa chỉ hợp đồng thị trường",
            "nft_contract_address": "Địa chỉ hợp đồng NFT",
            "token_used_for_payment": "Token sử dụng để thanh toán",
            "base_price_ton_duration_in_days": "{{amount}} {{currency}} cho {{days}} ngày",
            "base_price_ton_per_day": "{{amount}} {{currency}} mỗi ngày",
            "base_price_evm_duration_in_days": "{{amount}} {{symbol}} cho {{days}} ngày",
            "base_price_evm_per_day": "{{amount}} {{symbol}} mỗi ngày"
        }
    };
});
define("@scom/scom-subscription", ["require", "exports", "@ijstech/components", "@ijstech/eth-wallet", "@scom/scom-social-sdk", "@scom/scom-subscription/index.css.ts", "@scom/scom-subscription/model.ts", "@scom/scom-subscription/evmWallet.ts", "@scom/scom-subscription/tonWallet.ts", "@scom/scom-subscription/commonUtils.ts", "@scom/scom-subscription/translations.json.ts"], function (require, exports, components_6, eth_wallet_4, scom_social_sdk_2, index_css_1, model_1, evmWallet_1, tonWallet_1, commonUtils_2, translations_json_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Theme = components_6.Styles.Theme.ThemeVars;
    const path = components_6.application.currentModuleDir;
    let ScomSubscription = class ScomSubscription extends components_6.Module {
        constructor() {
            super(...arguments);
            this.isApproving = false;
            this.tokenAmountIn = '0';
            this.onEVMWalletConnected = async () => {
                if (this.evmWallet.isNetworkConnected())
                    await this.initApprovalAction();
                this.determineBtnSubmitCaption();
            };
            this.refreshDappContainer = (data) => {
                if (this.containerDapp?.setData)
                    this.containerDapp.setData(data);
            };
            this.showTxStatusModal = (status, content, exMessage) => {
                if (!this.txStatusModal)
                    return;
                let params = { status };
                if (status === 'success') {
                    params.txtHash = content;
                }
                else {
                    params.content = content;
                }
                if (exMessage) {
                    params.exMessage = exMessage;
                }
                this.txStatusModal.message = { ...params };
                this.txStatusModal.showModal();
            };
        }
        get durationUnits() {
            return [
                {
                    label: this.i18n.get('$day(s)'),
                    value: 'days'
                },
                {
                    label: this.i18n.get('$month(s)'),
                    value: 'months'
                },
                {
                    label: this.i18n.get('$year(s)'),
                    value: 'years'
                }
            ];
        }
        get duration() {
            return Number(this.edtDuration.value) || 0;
        }
        get durationUnit() {
            return (this.comboDurationUnit.selectedItem?.value || 'days');
        }
        get isRenewal() {
            return this.model.isRenewal;
        }
        set isRenewal(value) {
            this.model.isRenewal = value;
        }
        get renewalDate() {
            return this.model.renewalDate;
        }
        set renewalDate(value) {
            this.model.renewalDate = value;
            if (this.edtStartDate) {
                this.edtStartDate.value = value > 0 ? (0, components_6.moment)(value * 1000) : (0, components_6.moment)();
                this.handleDurationChanged();
            }
        }
        showLoading() {
            this.pnlLoading.visible = true;
            this.pnlBody.visible = false;
        }
        hideLoading() {
            this.pnlLoading.visible = false;
            this.pnlBody.visible = true;
        }
        async setData(data) {
            const moduleDir = this['currentModuleDir'] || path;
            if (data.paymentMethod === scom_social_sdk_2.PaymentMethod.EVM) {
                if (!this.evmWallet) {
                    this.evmWallet = new evmWallet_1.EVMWallet();
                    this.evmWallet.on("chainChanged", this.onEVMWalletConnected.bind(this));
                    this.evmWallet.on("walletConnected", this.onEVMWalletConnected.bind(this));
                    this.evmWallet.on("walletUpdated", (data) => {
                        this.refreshDappContainer(data);
                    });
                }
                this.evmWallet.setData({
                    wallets: data.wallets,
                    networks: data.networks,
                    chainId: data.chainId,
                    defaultChainId: data.defaultChainId
                });
                this.model = new model_1.EVMModel(this, this.evmWallet);
            }
            else {
                if (!this.tonWallet) {
                    this.tonWallet = new tonWallet_1.TonWallet(moduleDir, this.handleTonWalletStatusChanged.bind(this));
                }
                this.model = new model_1.TonModel(this, this.tonWallet);
            }
            this.handleDurationChanged = this.handleDurationChanged.bind(this);
            this.comboDurationUnit.items = this.durationUnits;
            this.comboDurationUnit.selectedItem = this.durationUnits[0];
            await this.model.setData(data);
            this.showLoading();
            this.edtStartDate.value = undefined;
            this.edtDuration.value = '';
            this.comboDurationUnit.selectedItem = this.durationUnits[0];
            await this.refreshDApp();
            this.hideLoading();
        }
        getData() {
            return this.model.getData();
        }
        getTag() {
            return this.tag;
        }
        setTag(value) {
            const newValue = value || {};
            if (!this.tag)
                this.tag = {};
            for (let prop in newValue) {
                if (newValue.hasOwnProperty(prop)) {
                    if (prop === 'light' || prop === 'dark')
                        this.updateTag(prop, newValue[prop]);
                    else
                        this.tag[prop] = newValue[prop];
                }
            }
            this.updateTheme();
        }
        updateTheme() {
            const themeVar = document.body.style.getPropertyValue('--theme') || 'light';
            this.updateStyle('--text-primary', this.tag[themeVar]?.fontColor);
            this.updateStyle('--text-secondary', this.tag[themeVar]?.secondaryColor);
            this.updateStyle('--background-main', this.tag[themeVar]?.backgroundColor);
            this.updateStyle('--colors-primary-main', this.tag[themeVar]?.primaryColor);
            this.updateStyle('--colors-primary-light', this.tag[themeVar]?.primaryLightColor);
            this.updateStyle('--colors-primary-dark', this.tag[themeVar]?.primaryDarkColor);
            this.updateStyle('--colors-secondary-light', this.tag[themeVar]?.secondaryLight);
            this.updateStyle('--colors-secondary-main', this.tag[themeVar]?.secondaryMain);
            this.updateStyle('--divider', this.tag[themeVar]?.borderColor);
            this.updateStyle('--action-selected', this.tag[themeVar]?.selected);
            this.updateStyle('--action-selected_background', this.tag[themeVar]?.selectedBackground);
            this.updateStyle('--action-hover_background', this.tag[themeVar]?.hoverBackground);
            this.updateStyle('--action-hover', this.tag[themeVar]?.hover);
        }
        updateStyle(name, value) {
            if (value) {
                this.style.setProperty(name, value);
            }
            else {
                this.style.removeProperty(name);
            }
        }
        updateTag(type, value) {
            this.tag[type] = this.tag[type] ?? {};
            for (let prop in value) {
                if (value.hasOwnProperty(prop))
                    this.tag[type][prop] = value[prop];
            }
        }
        async setApprovalModelAction(options) {
            const approvalOptions = {
                ...options,
                spenderAddress: ''
            };
            let wallet = this.evmWallet.getRpcWallet();
            this.approvalModel = new eth_wallet_4.ERC20ApprovalModel(wallet, approvalOptions);
            let approvalModelAction = this.approvalModel.getAction();
            return approvalModelAction;
        }
        async initApprovalAction() {
            if (!this.approvalModelAction) {
                this.approvalModelAction = await this.setApprovalModelAction({
                    sender: this,
                    payAction: async () => {
                        await this.doSubmitAction();
                    },
                    onToBeApproved: async (token) => {
                        this.btnApprove.visible = this.evmWallet.isWalletConnected() && this.evmWallet.isNetworkConnected();
                        this.btnSubmit.visible = !this.btnApprove.visible;
                        this.btnSubmit.enabled = false;
                        if (!this.isApproving) {
                            this.btnApprove.rightIcon.visible = false;
                            this.btnApprove.caption = this.i18n.get('$approve');
                        }
                        this.btnApprove.enabled = true;
                        this.isApproving = false;
                    },
                    onToBePaid: async (token) => {
                        this.btnApprove.visible = false;
                        this.btnSubmit.visible = true;
                        this.isApproving = false;
                        const duration = Number(this.edtDuration.value) || 0;
                        this.btnSubmit.enabled = new eth_wallet_4.BigNumber(this.tokenAmountIn).gt(0) && Number.isInteger(duration);
                        this.determineBtnSubmitCaption();
                    },
                    onApproving: async (token, receipt) => {
                        this.isApproving = true;
                        this.btnApprove.rightIcon.spin = true;
                        this.btnApprove.rightIcon.visible = true;
                        this.btnApprove.caption = this.i18n.get('$approving_token', { token: token?.symbol || '' });
                        this.btnSubmit.visible = false;
                        if (receipt) {
                            this.showTxStatusModal('success', receipt);
                        }
                    },
                    onApproved: async (token) => {
                        this.btnApprove.rightIcon.visible = false;
                        this.btnApprove.caption = this.i18n.get('$approve');
                        this.isApproving = false;
                        this.btnSubmit.visible = true;
                        this.btnSubmit.enabled = true;
                    },
                    onApprovingError: async (token, err) => {
                        this.showTxStatusModal('error', err);
                        this.btnApprove.caption = this.i18n.get('$approve');
                        this.btnApprove.rightIcon.visible = false;
                        this.isApproving = false;
                    },
                    onPaying: async (receipt) => {
                        if (receipt) {
                            this.showTxStatusModal('success', receipt);
                            this.btnSubmit.enabled = false;
                            this.btnSubmit.rightIcon.visible = true;
                        }
                    },
                    onPaid: async (receipt) => {
                        this.btnSubmit.rightIcon.visible = false;
                        if (this.txStatusModal)
                            this.txStatusModal.closeModal();
                    },
                    onPayingError: async (err) => {
                        this.showTxStatusModal('error', err);
                    }
                });
                this.updateContractAddress();
                if (this.model?.token?.address !== eth_wallet_4.Utils.nullAddress && this.tokenAmountIn && new eth_wallet_4.BigNumber(this.tokenAmountIn).gt(0)) {
                    this.approvalModelAction.checkAllowance(this.model.token, this.tokenAmountIn);
                }
            }
        }
        updateContractAddress() {
            if (this.approvalModelAction) {
                let contractAddress;
                if (this.model.referrer) {
                    contractAddress = this.evmWallet.getContractAddress('Commission');
                }
                else {
                    contractAddress = this.model.productMarketplaceAddress;
                }
                this.approvalModel.spenderAddress = contractAddress;
            }
        }
        async updateEVMUI() {
            try {
                await this.evmWallet.initWallet();
                const { chainId, tokenAddress } = this.model.getData();
                if (!this.model.productId) {
                    this.model.productId = await this.model.getProductId(tokenAddress);
                }
                this.model.productInfo = await this.model.fetchProductInfo(this.model.productId);
                if (this.evmWallet.isNetworkConnected())
                    await this.initApprovalAction();
                this.evmWallet.updateDappContainerData();
                this.comboRecipient.items = this.model.recipients.map(address => ({
                    label: address,
                    value: address
                }));
                if (this.comboRecipient.items.length)
                    this.comboRecipient.selectedItem = this.comboRecipient.items[0];
                if (this.model.productInfo) {
                    const { token } = this.model.productInfo;
                    this.detailWrapper.visible = true;
                    this.onToggleDetail();
                    this.btnDetail.visible = true;
                    this.lblMarketplaceContract.caption = components_6.FormatUtils.truncateWalletAddress(this.model.productMarketplaceAddress);
                    this.lblNFTContract.caption = components_6.FormatUtils.truncateWalletAddress(tokenAddress);
                    const isNativeToken = !token.address || token.address === eth_wallet_4.Utils.nullAddress || !token.address.startsWith('0x');
                    if (isNativeToken) {
                        const network = this.evmWallet.getNetworkInfo(chainId);
                        this.lblToken.caption = `${network?.chainName || ''} Native Token`;
                        this.lblToken.textDecoration = 'none';
                        this.lblToken.font = { size: '1rem', color: Theme.text.primary };
                        this.lblToken.style.textAlign = 'right';
                        this.lblToken.classList.remove(index_css_1.linkStyle);
                        this.lblToken.onClick = () => { };
                    }
                    else {
                        this.lblToken.caption = components_6.FormatUtils.truncateWalletAddress(token.address);
                        this.lblToken.textDecoration = 'underline';
                        this.lblToken.font = { size: '1rem', color: Theme.colors.primary.main };
                        this.lblToken.classList.add(index_css_1.linkStyle);
                        this.lblToken.onClick = () => this.onViewToken();
                    }
                    this.iconCopyToken.visible = !isNativeToken;
                    this.updateSpotsRemaining();
                }
            }
            catch (err) {
                console.log('error', err);
            }
        }
        updateSpotsRemaining() {
            if (this.model.productId >= 0) {
                const remaining = (0, commonUtils_2.formatNumber)(this.model.productInfo.quantity, 0);
                this.lblRemaining.caption = remaining;
                this.lblSpotsRemaining.caption = this.model.productInfo.quantity.gt(0) ? this.i18n.get('$hurry_only_remaining_nfts_left', { remaining: remaining }) : this.i18n.get('$sold_out');
                this.lblSpotsRemaining.font = { bold: true, size: '1rem', color: this.model.productInfo.quantity.gt(0) ? Theme.text.primary : Theme.colors.error.dark };
                this.pnlSpotsRemaining.visible = this.model.productInfo.quantity.lte(50);
            }
            else {
                this.lblRemaining.caption = '';
                this.lblSpotsRemaining.caption = '';
                this.pnlSpotsRemaining.visible = false;
            }
        }
        async refreshDApp() {
            try {
                const paymentMethod = this.model.paymentMethod;
                const isEVM = paymentMethod === scom_social_sdk_2.PaymentMethod.EVM;
                const isTelegram = paymentMethod === scom_social_sdk_2.PaymentMethod.Telegram;
                const { discountRuleId, discountRules, durationInDays } = this.model.getData();
                if (isEVM) {
                    await this.updateEVMUI();
                }
                else {
                    if (this.containerDapp?.setData)
                        await this.containerDapp.setData({
                            showHeader: false
                        });
                }
                this.pnlHeader.visible = paymentMethod === scom_social_sdk_2.PaymentMethod.TON;
                this.pnlRecipient.visible = isEVM;
                this.pnlDetail.visible = isEVM;
                this.determineBtnSubmitCaption();
                this.chkCustomStartDate.checked = false;
                this.edtStartDate.value = this.isRenewal && this.renewalDate ? (0, components_6.moment)(this.renewalDate * 1000) : (0, components_6.moment)();
                this.edtStartDate.enabled = false;
                this.pnlCustomStartDate.visible = !this.isRenewal;
                this.lblStartDate.caption = this.isRenewal ? this.edtStartDate.value.format('DD/MM/YYYY hh:mm A') : "Now";
                this.lblStartDate.visible = true;
                this.lblBasePrice.caption = this.model.getBasePriceLabel();
                this.btnSubmit.visible = !isTelegram;
                const rule = discountRuleId ? discountRules.find(rule => rule.id === discountRuleId) : null;
                const isExpired = rule && rule.endTime && rule.endTime < (0, components_6.moment)().unix();
                if (isExpired)
                    this.model.discountRuleId = undefined;
                if (rule && !isExpired) {
                    if (!this.isRenewal && rule.startTime && rule.startTime > this.edtStartDate.value.unix()) {
                        this.edtStartDate.value = (0, components_6.moment)(rule.startTime * 1000);
                    }
                    this.edtDuration.value = rule.minDuration || "1";
                    this.comboDurationUnit.selectedItem = this.durationUnits[0];
                    this.model.discountApplied = rule;
                    this._updateEndDate();
                    this._updateTotalAmount();
                }
                else {
                    this.edtDuration.value = durationInDays || "";
                    this.handleDurationChanged();
                }
            }
            catch (error) {
                console.log('error', error);
            }
        }
        handleTonWalletStatusChanged(isConnected) {
            if (isConnected) {
                this.btnSubmit.enabled = this.edtDuration.value && this.duration > 0 && Number.isInteger(this.duration);
            }
            else {
                this.btnSubmit.enabled = true;
            }
            this.determineBtnSubmitCaption();
        }
        determineBtnSubmitCaption() {
            const paymentMethod = this.model.paymentMethod;
            if (paymentMethod === scom_social_sdk_2.PaymentMethod.EVM) {
                if (!this.evmWallet.isWalletConnected()) {
                    this.btnSubmit.caption = this.i18n.get('$connect_wallet');
                    this.btnSubmit.enabled = true;
                }
                else if (!this.evmWallet.isNetworkConnected()) {
                    this.btnSubmit.caption = this.i18n.get('$switch_network');
                    this.btnSubmit.enabled = true;
                }
                else {
                    this.btnSubmit.caption = this.i18n.get(this.isRenewal ? '$renew_subscription' : '$subscribe');
                }
            }
            else {
                if (!this.tonWallet.isWalletConnected) {
                    this.btnSubmit.caption = this.i18n.get('$connect_wallet');
                }
                else {
                    this.btnSubmit.caption = this.i18n.get(this.isRenewal ? '$renew_subscription' : '$subscribe');
                }
            }
        }
        _updateEndDate() {
            if (!this.edtStartDate.value) {
                this.lblEndDate.caption = '-';
                return;
            }
            const dateFormat = 'YYYY-MM-DD hh:mm A';
            const startDate = (0, components_6.moment)(this.edtStartDate.value.format(dateFormat), dateFormat);
            this.lblEndDate.caption = startDate.add(this.duration, this.durationUnit).format('DD/MM/YYYY hh:mm A');
        }
        _updateDiscount() {
            const days = (0, commonUtils_2.getDurationInDays)(this.duration, this.durationUnit, this.edtStartDate.value);
            this.model.updateDiscount(this.duration, this.edtStartDate.value, days);
        }
        _updateTotalAmount() {
            const currency = this.model.currency;
            if (!this.duration)
                this.lblOrderTotal.caption = `0 ${currency || ''}`;
            const days = (0, commonUtils_2.getDurationInDays)(this.duration, this.durationUnit, this.edtStartDate.value);
            const { discountType, discountValue, discountAmount, totalAmount } = this.model.getDiscountAndTotalAmount(days);
            this.pnlDiscount.visible = discountType != null;
            if (this.pnlDiscount.visible) {
                this.lblDiscount.caption = discountType === 'Percentage' ? this.i18n.get('$discount_percentage', { percentage: `${discountValue}` }) : this.i18n.get('$discount');
                this.lblDiscountAmount.caption = `-${(0, commonUtils_2.formatNumber)(discountAmount, 6)} ${currency || ''}`;
            }
            this.tokenAmountIn = totalAmount.toFixed();
            this.lblOrderTotal.caption = `${(0, commonUtils_2.formatNumber)(totalAmount, 6)} ${currency || ''}`;
            if (this.approvalModelAction) {
                this.approvalModelAction.checkAllowance(this.model.token, this.tokenAmountIn);
            }
        }
        handleCustomCheckboxChange() {
            const isChecked = this.chkCustomStartDate.checked;
            this.edtStartDate.enabled = isChecked;
            const now = (0, components_6.moment)();
            if (isChecked) {
                if (this.edtStartDate.value.isBefore(now)) {
                    this.edtStartDate.value = now;
                }
                this.lblStartDate.caption = this.edtStartDate.value.format('DD/MM/YYYY hh:mm A');
                this.edtStartDate.minDate = now;
            }
            else {
                this.edtStartDate.value = now;
                this.lblStartDate.caption = this.i18n.get('$now');
                this._updateEndDate();
            }
        }
        handleStartDateChanged() {
            this.lblStartDate.caption = this.edtStartDate.value?.format('DD/MM/YYYY hh:mm A') || "";
            this._updateEndDate();
            this._updateDiscount();
        }
        handleDurationChanged() {
            this._updateEndDate();
            this._updateDiscount();
            this._updateTotalAmount();
        }
        handleDurationUnitChanged() {
            this._updateEndDate();
            this._updateDiscount();
            this._updateTotalAmount();
        }
        onToggleDetail() {
            const isExpanding = this.detailWrapper.visible;
            this.detailWrapper.visible = !isExpanding;
            this.btnDetail.caption = this.i18n.get(isExpanding ? '$more_information' : '$hide_information');
            this.btnDetail.rightIcon.name = isExpanding ? 'caret-down' : 'caret-up';
        }
        onViewMarketplaceContract() {
            this.evmWallet.viewExplorerByAddress(this.model.productMarketplaceAddress || "");
        }
        onViewNFTContract() {
            const { tokenAddress } = this.model.getData();
            this.evmWallet.viewExplorerByAddress(tokenAddress);
        }
        onViewToken() {
            const token = this.model.token;
            this.evmWallet.viewExplorerByAddress(token.address || token.symbol);
        }
        updateCopyIcon(icon) {
            if (icon.name === 'check')
                return;
            icon.name = 'check';
            icon.fill = Theme.colors.success.main;
            setTimeout(() => {
                icon.fill = Theme.colors.primary.contrastText;
                icon.name = 'copy';
            }, 1600);
        }
        onCopyMarketplaceContract(target) {
            components_6.application.copyToClipboard(this.model.productMarketplaceAddress || "");
            this.updateCopyIcon(target);
        }
        onCopyNFTContract(target) {
            const { tokenAddress } = this.model.getData();
            components_6.application.copyToClipboard(tokenAddress);
            this.updateCopyIcon(target);
        }
        onCopyToken(target) {
            const token = this.model.token;
            components_6.application.copyToClipboard(token.address || token.symbol);
            this.updateCopyIcon(target);
        }
        async onApprove() {
            this.showTxStatusModal('warning', this.i18n.get('$approving'));
            await this.approvalModelAction.doApproveAction(this.model.token, this.tokenAmountIn);
        }
        updateSubmitButton(submitting) {
            this.btnSubmit.rightIcon.spin = submitting;
            this.btnSubmit.rightIcon.visible = submitting;
        }
        async doSubmitAction() {
            const days = (0, commonUtils_2.getDurationInDays)(this.duration, this.durationUnit, this.edtStartDate.value);
            if (!this.isRenewal && !this.chkCustomStartDate.checked) {
                this.edtStartDate.value = (0, components_6.moment)();
            }
            const recipient = this.comboRecipient.selectedItem?.value;
            const paymentMethod = this.model.paymentMethod;
            try {
                if (!this.edtStartDate.value) {
                    throw new Error(this.i18n.get('$start_date_required'));
                }
                const _duration = Number(this.edtDuration.value) || 0;
                if (!_duration || _duration <= 0 || !Number.isInteger(_duration)) {
                    throw new Error(this.i18n.get(!this.edtDuration.value ? '$duration_required' : '$invalid_duration'));
                }
                this.updateSubmitButton(true);
                const startTime = this.edtStartDate.value.unix();
                const endTime = components_6.moment.unix(startTime).add(this.duration, this.durationUnit).unix();
                const duration = days * 86400;
                const callback = (error, receipt) => {
                    if (error) {
                        this.showTxStatusModal('error', error);
                    }
                    else if (paymentMethod === scom_social_sdk_2.PaymentMethod.TON) {
                        if (this.onSubscribed)
                            this.onSubscribed();
                    }
                };
                const confirmationCallback = async () => {
                    this.model.productInfo = await this.model.fetchProductInfo(this.model.productId);
                    this.updateSpotsRemaining();
                    if (this.txStatusModal)
                        this.txStatusModal.closeModal();
                    if (this.onSubscribed)
                        this.onSubscribed();
                };
                const action = await this.model.getSubscriptionAction(recipient);
                await action({
                    startTime,
                    endTime,
                    days,
                    duration,
                    recipient,
                    callback,
                    confirmationCallback
                });
            }
            catch (error) {
                this.showTxStatusModal('error', error);
            }
            this.updateSubmitButton(false);
        }
        async onSubmit() {
            const paymentMethod = this.model.paymentMethod;
            if (paymentMethod === scom_social_sdk_2.PaymentMethod.EVM) {
                if (!this.evmWallet.isWalletConnected()) {
                    this.evmWallet.connectWallet(this.pnlEVMWallet);
                    return;
                }
                if (!this.evmWallet.isNetworkConnected()) {
                    await this.evmWallet.switchNetwork();
                    return;
                }
                this.showTxStatusModal('warning', this.i18n.get('$confirming'));
                this.approvalModelAction.doPayAction();
            }
            else if (paymentMethod === scom_social_sdk_2.PaymentMethod.TON) {
                if (!this.tonWallet.isWalletConnected) {
                    this.tonWallet.connectWallet();
                    return;
                }
                await this.doSubmitAction();
            }
        }
        init() {
            this.i18n.init({ ...translations_json_1.default });
            super.init();
        }
        render() {
            return (this.$render("i-panel", null,
                this.$render("i-scom-dapp-container", { id: "containerDapp" },
                    this.$render("i-stack", { id: "pnlHeader", direction: "horizontal", alignItems: "center", justifyContent: "end", padding: { top: '0.5rem', bottom: '0.5rem', left: '1.75rem', right: '1.75rem' }, background: { color: Theme.background.modal } }),
                    this.$render("i-panel", { background: { color: Theme.background.main } },
                        this.$render("i-stack", { id: "pnlLoading", direction: "vertical", height: "100%", alignItems: "center", justifyContent: "center", padding: { top: "1rem", bottom: "1rem", left: "1rem", right: "1rem" }, visible: false },
                            this.$render("i-panel", { class: 'spinner' })),
                        this.$render("i-stack", { direction: "vertical", padding: { top: '1.5rem', bottom: '1.25rem', left: '1.25rem', right: '1.5rem' }, alignItems: "center" },
                            this.$render("i-stack", { direction: "vertical", width: "100%", maxWidth: 600, gap: '0.5rem' },
                                this.$render("i-stack", { id: "pnlBody", direction: "vertical", gap: "0.5rem" },
                                    this.$render("i-stack", { id: 'pnlRecipient', width: '100%', direction: "horizontal", alignItems: "center", justifyContent: "space-between", gap: 10, visible: false },
                                        this.$render("i-label", { caption: "$wallet_address_to_receive_nft", font: { bold: true, size: '1rem' } }),
                                        this.$render("i-combo-box", { id: "comboRecipient", height: 36, width: "100%", icon: { width: 14, height: 14, name: 'angle-down', fill: Theme.divider }, border: { width: 1, style: 'solid', color: Theme.divider, radius: 5 }, stack: { basis: '50%' } })),
                                    this.$render("i-stack", { direction: "horizontal", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10 },
                                        this.$render("i-label", { caption: "$start_date", font: { bold: true, size: '1rem' } }),
                                        this.$render("i-label", { id: "lblStartDate", font: { size: '1rem' } })),
                                    this.$render("i-stack", { id: "pnlCustomStartDate", direction: "horizontal", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10, visible: false },
                                        this.$render("i-checkbox", { id: "chkCustomStartDate", height: "auto", caption: "$custom", onChanged: this.handleCustomCheckboxChange }),
                                        this.$render("i-panel", { stack: { basis: '50%' } },
                                            this.$render("i-datepicker", { id: "edtStartDate", height: 36, width: "100%", type: "dateTime", dateTimeFormat: "DD/MM/YYYY hh:mm A", placeholder: "dd/mm/yyyy hh:mm A", background: { color: Theme.input.background }, font: { size: '1rem' }, border: { radius: "0.375rem" }, onChanged: this.handleStartDateChanged }))),
                                    this.$render("i-stack", { direction: "horizontal", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10 },
                                        this.$render("i-label", { caption: "$duration", font: { bold: true, size: '1rem' } }),
                                        this.$render("i-stack", { direction: "horizontal", alignItems: "center", stack: { basis: '50%' }, gap: "0.5rem" },
                                            this.$render("i-panel", { width: "50%" },
                                                this.$render("i-input", { id: "edtDuration", height: 36, width: "100%", class: index_css_1.inputStyle, inputType: 'number', font: { size: '1rem' }, border: { radius: 4, style: 'none' }, padding: { top: '0.25rem', bottom: '0.25rem', left: '0.5rem', right: '0.5rem' }, onChanged: this.handleDurationChanged })),
                                            this.$render("i-panel", { width: "50%" },
                                                this.$render("i-combo-box", { id: "comboDurationUnit", height: 36, width: "100%", icon: { width: 14, height: 14, name: 'angle-down', fill: Theme.divider }, border: { width: 1, style: 'solid', color: Theme.divider, radius: 5 }, onChanged: this.handleDurationUnitChanged })))),
                                    this.$render("i-stack", { direction: "horizontal", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10 },
                                        this.$render("i-label", { caption: "$end_date", font: { bold: true, size: '1rem' } }),
                                        this.$render("i-label", { id: "lblEndDate", font: { size: '1rem' } })),
                                    this.$render("i-stack", { direction: "horizontal", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10 },
                                        this.$render("i-label", { caption: "$base_price", font: { bold: true, size: '1rem' } }),
                                        this.$render("i-label", { id: 'lblBasePrice', font: { size: '1rem' } })),
                                    this.$render("i-stack", { id: "pnlDiscount", direction: "horizontal", width: "100%", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", lineHeight: 1.5, visible: false },
                                        this.$render("i-label", { id: "lblDiscount", caption: "$discount", font: { bold: true, size: '1rem' } }),
                                        this.$render("i-label", { id: "lblDiscountAmount", font: { size: '1rem' } })),
                                    this.$render("i-stack", { width: "100%", direction: "horizontal", justifyContent: "space-between", alignItems: 'center', gap: "0.5rem", lineHeight: 1.5 },
                                        this.$render("i-stack", { direction: "horizontal", alignItems: 'center', gap: "0.5rem" },
                                            this.$render("i-label", { caption: "$you_will_pay", font: { bold: true, size: '1rem' } })),
                                        this.$render("i-label", { id: 'lblOrderTotal', font: { size: '1rem' }, caption: "0" })),
                                    this.$render("i-stack", { id: "pnlDetail", direction: "vertical", gap: "0.5rem" },
                                        this.$render("i-stack", { id: "pnlSpotsRemaining", direction: "vertical", width: "100%", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", lineHeight: 1.5 },
                                            this.$render("i-label", { id: "lblSpotsRemaining", font: { bold: true, size: '1rem' } })),
                                        this.$render("i-button", { id: "btnDetail", caption: "$more_information", rightIcon: { width: 10, height: 16, margin: { left: 5 }, fill: Theme.text.primary, name: 'caret-down' }, background: { color: 'transparent' }, border: { width: 1, style: 'solid', color: Theme.text.primary, radius: 8 }, width: 280, maxWidth: "100%", height: 36, margin: { top: 4, bottom: 16, left: 'auto', right: 'auto' }, onClick: this.onToggleDetail, visible: false }),
                                        this.$render("i-stack", { id: "detailWrapper", direction: "vertical", gap: 10, visible: false },
                                            this.$render("i-stack", { width: "100%", direction: "horizontal", justifyContent: "space-between", gap: "0.5rem", lineHeight: 1.5 },
                                                this.$render("i-label", { caption: "$remaining", font: { bold: true, size: '1rem' } }),
                                                this.$render("i-label", { id: 'lblRemaining', font: { size: '1rem' } })),
                                            this.$render("i-hstack", { width: "100%", justifyContent: "space-between", gap: "0.5rem", lineHeight: 1.5 },
                                                this.$render("i-label", { caption: "$marketplace_contract_address", font: { bold: true, size: '1rem' } }),
                                                this.$render("i-hstack", { gap: "0.25rem", verticalAlignment: "center", maxWidth: "calc(100% - 75px)" },
                                                    this.$render("i-label", { id: "lblMarketplaceContract", font: { size: '1rem', color: Theme.colors.primary.main }, textDecoration: "underline", class: index_css_1.linkStyle, onClick: this.onViewMarketplaceContract }),
                                                    this.$render("i-icon", { fill: Theme.text.primary, name: "copy", width: 16, height: 16, onClick: this.onCopyMarketplaceContract, cursor: "pointer" }))),
                                            this.$render("i-hstack", { width: "100%", justifyContent: "space-between", gap: "0.5rem", lineHeight: 1.5 },
                                                this.$render("i-label", { caption: "$nft_contract_address", font: { bold: true, size: '1rem' } }),
                                                this.$render("i-hstack", { gap: "0.25rem", verticalAlignment: "center", maxWidth: "calc(100% - 75px)" },
                                                    this.$render("i-label", { id: "lblNFTContract", font: { size: '1rem', color: Theme.colors.primary.main }, textDecoration: "underline", class: index_css_1.linkStyle, onClick: this.onViewNFTContract }),
                                                    this.$render("i-icon", { fill: Theme.text.primary, name: "copy", width: 16, height: 16, onClick: this.onCopyNFTContract, cursor: "pointer" }))),
                                            this.$render("i-hstack", { width: "100%", justifyContent: "space-between", gap: "0.5rem", lineHeight: 1.5 },
                                                this.$render("i-label", { caption: "$token_used_for_payment", font: { bold: true, size: '1rem' } }),
                                                this.$render("i-hstack", { gap: "0.25rem", verticalAlignment: "center", maxWidth: "calc(100% - 75px)" },
                                                    this.$render("i-label", { id: "lblToken", font: { size: '1rem', color: Theme.colors.primary.main }, textDecoration: "underline", class: index_css_1.linkStyle, onClick: this.onViewToken }),
                                                    this.$render("i-icon", { id: "iconCopyToken", visible: false, fill: Theme.text.primary, name: "copy", width: 16, height: 16, onClick: this.onCopyToken, cursor: "pointer" }))))),
                                    this.$render("i-stack", { direction: "vertical", width: "100%", justifyContent: "center", alignItems: "center", margin: { top: '0.5rem' }, gap: 8 },
                                        this.$render("i-button", { id: "btnApprove", width: '100%', caption: "$approve", padding: { top: '1rem', bottom: '1rem', left: '1rem', right: '1rem' }, font: { size: '1rem', color: Theme.colors.primary.contrastText, bold: true }, rightIcon: { visible: false, fill: Theme.colors.primary.contrastText }, background: { color: Theme.background.gradient }, border: { radius: 12 }, visible: false, onClick: this.onApprove }),
                                        this.$render("i-button", { id: 'btnSubmit', width: '100%', caption: '$subscribe', padding: { top: '1rem', bottom: '1rem', left: '1rem', right: '1rem' }, font: { size: '1rem', color: Theme.colors.primary.contrastText, bold: true }, rightIcon: { visible: false, fill: Theme.colors.primary.contrastText }, background: { color: Theme.background.gradient }, border: { radius: 12 }, enabled: false, onClick: this.onSubmit }))))),
                        this.$render("i-panel", { id: "pnlEVMWallet" }),
                        this.$render("i-scom-tx-status-modal", { id: "txStatusModal" })))));
        }
    };
    ScomSubscription = __decorate([
        (0, components_6.customElements)('i-scom-subscription')
    ], ScomSubscription);
    exports.default = ScomSubscription;
});
