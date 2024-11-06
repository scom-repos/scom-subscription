import { application, FormatUtils, Module, moment, RequireJS } from "@ijstech/components";
import getNetworkList from "@scom/scom-network-list";
import { ContractInfoByChainType, ContractType, IExtendedNetwork, INetworkConfig, IProductInfo, ISubscription, IWalletPlugin } from "./interface";
import configData from './data.json';
import { ISubscriptionDiscountRule, PaymentMethod } from "@scom/scom-social-sdk";
import { BigNumber, Constants, IEventBusRegistry, INetwork, Utils, Wallet } from "@ijstech/eth-wallet";
import { Contracts as ProductContracts } from '@scom/scom-product-contract';
import { ITokenObject, tokenStore } from "@scom/scom-token-list";

export class Model {
    private _data: ISubscription = {};
    private _productInfo: IProductInfo;
    private rpcWalletEvents: IEventBusRegistry[] = [];
    private rpcWalletId: string = '';
    private infuraId: string = '';
    private defaultNetworks: INetworkConfig[];
    private contractInfoByChain: ContractInfoByChainType = {};
    private networkMap: { [key: number]: IExtendedNetwork };
    private _isRenewal: boolean;
    private _discountApplied: ISubscriptionDiscountRule;
    private module: Module;
    private toncore: any;
    private tonConnectUI: any;
    private _isTonWalletConnected: boolean = false;
    public onTonWalletStatusChanged: (isConnected: boolean) => void;
    public onChainChanged: () => Promise<void>;
    public onWalletConnected: () => Promise<void>;
    public refreshDappContainer: () => void;
    public updateUIBySetData: () => Promise<void>;

    get durationUnits() {
        return [
            {
                label: 'Day(s)',
                value: 'days'
            },
            {
                label: 'Month(s)',
                value: 'months'
            },
            {
                label: 'Year(s)',
                value: 'years'
            }
        ];
    }

    get paymentMethod() {
        if (this._data.paymentMethod) {
            return this._data.paymentMethod;
        } else if (this._data.chainId) {
            return PaymentMethod.EVM;
        } else {
            return this._data.currency === 'TON' ? PaymentMethod.TON : PaymentMethod.Telegram;
        }
    }

    get currency() {
        if (this.paymentMethod === PaymentMethod.EVM) {
            return this.productInfo.token?.symbol;
        } else {
            return this._data.currency;
        }
    }

    get chainId() {
        const rpcWallet = this.getRpcWallet();
        return rpcWallet?.chainId;
    }

    get token() {
        return this.productInfo?.token;
    }

    get wallets() {
        return this._data.wallets ?? [];
    }

    set wallets(value: IWalletPlugin[]) {
        this._data.wallets = value;
    }

    get networks() {
        const nets = this._data.networks ?? this.defaultNetworks;
        if (this._data.chainId && !nets.some(v => v.chainId === this._data.chainId)) {
            nets.push({ chainId: this._data.chainId });
        }
        return nets;
    }

    set networks(value: INetworkConfig[]) {
        this._data.networks = value;
    }

    get showHeader() {
        return this._data.showHeader ?? true;
    }

    set showHeader(value: boolean) {
        this._data.showHeader = value;
    }

    get isTonWalletConnected() {
        return this._isTonWalletConnected;
    }

    get recipient() {
      return this._data.recipient ?? '';
    }
  
    get recipients() {
      return this._data.recipients || [];
    }

    get productId() {
        return this._data.productId;
    }

    set productId(value: number) {
        this._data.productId = value;
    }

    get isRenewal() {
        return this._isRenewal;
    }

    set isRenewal(value: boolean) {
        this._isRenewal = value;
    }

    get discountApplied() {
        return this._discountApplied;
    }

    set discountApplied(value: ISubscriptionDiscountRule) {
        this._discountApplied = value;
    }

    get discountRuleId() {
        return this._data.discountRuleId;
    }

    set discountRuleId(value: number) {
        this._data.discountRuleId = value;
    }

    get productInfo() {
        return this._productInfo;
    }

    set productInfo(info: IProductInfo) {
        this._productInfo = info;
    }

    constructor(module: Module, moduleDir: string) {
        this.module = module;
        const defaultNetworkList = getNetworkList();
        this.networkMap = defaultNetworkList.reduce((acc, cur) => {
            const explorerUrl = cur.blockExplorerUrls && cur.blockExplorerUrls.length ? cur.blockExplorerUrls[0] : "";
            acc[cur.chainId] = {
                ...cur,
                explorerTxUrl: explorerUrl ? `${explorerUrl}${explorerUrl.endsWith("/") ? "" : "/"}tx/` : "",
                explorerAddressUrl: explorerUrl ? `${explorerUrl}${explorerUrl.endsWith("/") ? "" : "/"}address/` : ""
            };
            return acc;
        }, {});
        if (configData.infuraId) {
            this.infuraId = configData.infuraId;
        }
        if (configData.contractInfo) {
            this.contractInfoByChain = configData.contractInfo;
        }
        this.defaultNetworks = this.contractInfoByChain ? Object.keys(this.contractInfoByChain).map(chainId => ({ chainId: Number(chainId) })) : [];
        this.loadLib(moduleDir);
    }

    async loadLib(moduleDir: string) {
        let self = this;
        return new Promise((resolve, reject) => {
            RequireJS.config({
                baseUrl: `${moduleDir}/lib`,
                paths: {
                    'ton-core': 'ton-core',
                }
            })
            RequireJS.require(['ton-core'], function (TonCore: any) {
                self.toncore = TonCore;
                resolve(self.toncore);
            });
        })
    }

    initTonWallet() {
        try {
            let UI = window['TON_CONNECT_UI'];
            this.tonConnectUI = new UI.TonConnectUI({
                manifestUrl: 'https://ton.noto.fan/tonconnect/manifest.json',
                buttonRootId: 'pnlHeader'
            });
            this.tonConnectUI.connectionRestored.then(async (restored: boolean) => {
                this._isTonWalletConnected = this.tonConnectUI.connected;
                if (this.onTonWalletStatusChanged) this.onTonWalletStatusChanged(this._isTonWalletConnected);
            });
            this.tonConnectUI.onStatusChange((walletAndwalletInfo) => {
                this._isTonWalletConnected = !!walletAndwalletInfo;
                if (this.onTonWalletStatusChanged) this.onTonWalletStatusChanged(this._isTonWalletConnected);
            });
        } catch (err) {
            alert(err)
        }
    }

    async connectTonWallet() {
        try {
            await this.tonConnectUI.openModal();
        }
        catch (err) {
            alert(err)
        }
    }

    async initWallet() {
        try {
            await Wallet.getClientInstance().init();
            await this.resetRpcWallet();
            const rpcWallet = this.getRpcWallet();
            await rpcWallet.init();
        } catch (err) {
            console.log(err);
        }
    }

    private removeRpcWalletEvents = () => {
        const rpcWallet = this.getRpcWallet();
        for (let event of this.rpcWalletEvents) {
            rpcWallet.unregisterWalletEvent(event);
        }
        this.rpcWalletEvents = [];
    }

    private initRpcWallet(defaultChainId: number) {
        if (this.rpcWalletId) {
            return this.rpcWalletId;
        }
        const clientWallet = Wallet.getClientInstance();
        const networkList: INetwork[] = Object.values(application.store?.networkMap || this.networkMap || []);
        const instanceId = clientWallet.initRpcWallet({
            networks: networkList,
            defaultChainId,
            infuraId: application.store?.infuraId,
            multicalls: application.store?.multicalls
        });
        this.rpcWalletId = instanceId;
        if (clientWallet.address) {
            const rpcWallet = Wallet.getRpcWalletInstance(instanceId);
            rpcWallet.address = clientWallet.address;
        }
        return instanceId;
    }

    async resetRpcWallet() {
        this.removeRpcWalletEvents();
        this.initRpcWallet(this._data.chainId || this._data.defaultChainId);
        const rpcWallet = this.getRpcWallet();
        const chainChangedEvent = rpcWallet.registerWalletEvent(this, Constants.RpcWalletEvent.ChainChanged, async (chainId: number) => {
            await this.onChainChanged();
        });
        const connectedEvent = rpcWallet.registerWalletEvent(this, Constants.RpcWalletEvent.Connected, async (connected: boolean) => {
            this.onWalletConnected();
        });
        this.rpcWalletEvents.push(chainChangedEvent, connectedEvent);
        this.refreshDappContainer();
    }

    getRpcWallet() {
        return this.rpcWalletId ? Wallet.getRpcWalletInstance(this.rpcWalletId) : null;
    }


    getNetworkInfo(chainId: number) {
        return this.networkMap[chainId];
    }

    getContractAddress(type: ContractType) {
        const contracts = this.contractInfoByChain[this.chainId] || {};
        return contracts[type]?.address;
    }

    viewExplorerByAddress(chainId: number, address: string) {
        let network = this.getNetworkInfo(chainId);
        if (network && network.explorerAddressUrl) {
            let url = `${network.explorerAddressUrl}${address}`;
            window.open(url);
        }
    }

    formatNumber(value: number | string | BigNumber, decimalFigures?: number) {
        if (typeof value === 'object') {
            value = value.toFixed();
        }
        const minValue = '0.0000001';
        return FormatUtils.formatNumber(value, { decimalFigures: decimalFigures !== undefined ? decimalFigures : 4, minValue, hasTrailingZero: false });
    };

    getDurationInDays(duration: number, unit: 'days' | 'months' | 'years', startDate: any) {
        if (unit === 'days') {
            return duration;
        } else {
            const dateFormat = 'YYYY-MM-DD';
            const start = startDate ? moment(startDate.format(dateFormat), dateFormat) : moment();
            const end = moment(start).add(duration, unit);
            const diff = end.diff(start, 'days');
            return diff;
        }
    }

    updateDiscount = (duration: number, startDate: any, days: number) => {
        this.discountApplied = undefined;
        if (!this._data.discountRules?.length || !duration || !startDate) return;
        const paymentMethod = this.paymentMethod;
        const price = paymentMethod === PaymentMethod.EVM ? Utils.fromDecimals(this.productInfo.price, this.productInfo.token.decimals) : new BigNumber(this._data.tokenAmount);
        const durationInDays = paymentMethod === PaymentMethod.EVM ? this.productInfo.priceDuration.div(86400) : this._data.durationInDays;
        const startTime = startDate.unix();
        let discountAmount: BigNumber;
        for (let rule of this._data.discountRules) {
            if (rule.discountApplication === 0 && this.isRenewal) continue;
            if (rule.discountApplication === 1 && !this.isRenewal) continue;
            if ((rule.startTime > 0 && startTime < rule.startTime) || (rule.endTime > 0 && startTime > rule.endTime) || rule.minDuration > days) continue;
            let basePrice: BigNumber = price;
            if (rule.discountPercentage > 0) {
                basePrice = price.times(1 - rule.discountPercentage / 100)
            } else if (rule.fixedPrice > 0) {
                basePrice = new BigNumber(rule.fixedPrice);
            }
            let tmpDiscountAmount = price.minus(basePrice).div(durationInDays).times(days);
            if (!this.discountApplied || tmpDiscountAmount.gt(discountAmount)) {
                this.discountApplied = rule;
                discountAmount = tmpDiscountAmount;
            }
        }
    }

    getDiscountAndTotalAmount(days: number) {
        let discountType: 'Percentage' | 'FixedAmount';
        let discountValue: number;
        let discountAmount: BigNumber;
        let totalAmount: BigNumber;
        const isEVM = this.paymentMethod === PaymentMethod.EVM;
        const price = isEVM ? this.productInfo.price : new BigNumber(this._data?.tokenAmount || 0);
        let basePrice: BigNumber = price;
        if (this.discountApplied) {
            if (this.discountApplied.discountPercentage > 0) {
                discountValue = this.discountApplied.discountPercentage;
                discountType = 'Percentage';
                basePrice = price.times(1 - this.discountApplied.discountPercentage / 100);
            } else if (this.discountApplied.fixedPrice > 0) {
                discountValue = this.discountApplied.fixedPrice;
                discountType = 'FixedAmount';
                basePrice = new BigNumber(this.discountApplied.fixedPrice);
            }
            if (discountType) {
                if (isEVM) {
                    const discountAmountRaw = price.minus(basePrice).div(this.productInfo.priceDuration.div(86400)).times(days);
                    discountAmount = Utils.fromDecimals(discountAmountRaw, this.productInfo.token.decimals);
                } else {
                    discountAmount = price.minus(basePrice).div(this._data.durationInDays).times(days);
                }
            }
        }
        if (isEVM) {
            const pricePerDay = basePrice.div(this.productInfo.priceDuration.div(86400));
            const amountRaw = pricePerDay.times(days);
            totalAmount = Utils.fromDecimals(amountRaw, this.productInfo.token.decimals);
        } else {
            const pricePerDay = basePrice.div(this._data?.durationInDays || 1);
            totalAmount = pricePerDay.times(days);
        }
        return { discountType, discountValue, discountAmount, totalAmount }
    }

    async getTokenInfo(address: string, chainId: number) {
        let token: ITokenObject;
        const wallet = Wallet.getClientInstance();
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
                }
            }
        }
        return token;
    }

    async getProductId(nftAddress: string, nftId?: number) {
        let productId: number;
        try {
            const wallet = this.getRpcWallet();
            if (nftId != null) {
                const oneTimePurchaseNFT = new ProductContracts.OneTimePurchaseNFT(wallet, nftAddress);
                productId = (await oneTimePurchaseNFT.productIdByTokenId(nftId)).toNumber();
            } else {
                const subscriptionNFT = new ProductContracts.SubscriptionNFT(wallet, nftAddress);
                productId = (await subscriptionNFT.productId()).toNumber();
            }
        } catch {
            console.log("product id not found");
        }
        return productId;
    }

    async fetchProductInfo(productId: number) {
        let productMarketplaceAddress = this.getContractAddress('ProductMarketplace');
        if (!productMarketplaceAddress) return null;
        try {
            const wallet = this.getRpcWallet();
            const productMarketplace = new ProductContracts.ProductMarketplace(wallet, productMarketplaceAddress);
            const product = await productMarketplace.products(productId);
            const chainId = wallet.chainId;
            if (product.token && product.token === Utils.nullAddress) {
                let net = getNetworkList().find(net => net.chainId === chainId);
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
            const _tokenList = tokenStore.getTokenList(chainId);
            let token: ITokenObject = _tokenList.find(token => product.token && token.address && token.address.toLowerCase() === product.token.toLowerCase());
            if (!token && product.token) {
                token = await this.getTokenInfo(product.token, chainId);
            }
            this.productInfo = {
                ...product,
                token
            };
        } catch {
            this.productInfo = null;
        }
    }

    getConfigurators() {
        return [
            {
                name: 'Builder Configurator',
                target: 'Builders',
                getActions: this.getActions.bind(this),
                getData: this.getData.bind(this),
                setData: this.setData.bind(this),
                getTag: this.getTag.bind(this),
                setTag: this.setTag.bind(this)
            }
        ]
    }

    async setData(value: ISubscription) {
        this._data = value;
        if (this.updateUIBySetData) this.updateUIBySetData();
    }

    getData() {
        return this._data;
    }

    getTag() {
        return this.module.tag;
    }

    setTag(value: any) {
        const newValue = value || {};
        if (!this.module.tag) this.module.tag = {};
        for (let prop in newValue) {
            if (newValue.hasOwnProperty(prop)) {
                if (prop === 'light' || prop === 'dark')
                    this.updateTag(prop, newValue[prop]);
                else
                    this.module.tag[prop] = newValue[prop];
            }
        }
        this.updateTheme();
    }

    private updateTag(type: 'light' | 'dark', value: any) {
        this.module.tag[type] = this.module.tag[type] ?? {};
        for (let prop in value) {
            if (value.hasOwnProperty(prop))
                this.module.tag[type][prop] = value[prop];
        }
    }

    private updateStyle(name: string, value: any) {
        if (value) {
            this.module.style.setProperty(name, value);
        } else {
            this.module.style.removeProperty(name);
        }
    }

    private updateTheme() {
        const themeVar = document.body.style.getPropertyValue('--theme') || 'light';
        this.updateStyle('--text-primary', this.module.tag[themeVar]?.fontColor);
        this.updateStyle('--text-secondary', this.module.tag[themeVar]?.secondaryColor);
        this.updateStyle('--background-main', this.module.tag[themeVar]?.backgroundColor);
        this.updateStyle('--colors-primary-main', this.module.tag[themeVar]?.primaryColor);
        this.updateStyle('--colors-primary-light', this.module.tag[themeVar]?.primaryLightColor);
        this.updateStyle('--colors-primary-dark', this.module.tag[themeVar]?.primaryDarkColor);
        this.updateStyle('--colors-secondary-light', this.module.tag[themeVar]?.secondaryLight);
        this.updateStyle('--colors-secondary-main', this.module.tag[themeVar]?.secondaryMain);
        this.updateStyle('--divider', this.module.tag[themeVar]?.borderColor);
        this.updateStyle('--action-selected', this.module.tag[themeVar]?.selected);
        this.updateStyle('--action-selected_background', this.module.tag[themeVar]?.selectedBackground);
        this.updateStyle('--action-hover_background', this.module.tag[themeVar]?.hoverBackground);
        this.updateStyle('--action-hover', this.module.tag[themeVar]?.hover);
    }

    private getActions() {
        const actions = [];
        return actions;
    }
}