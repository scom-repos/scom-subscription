import { application, FormatUtils, moment, RequireJS } from "@ijstech/components";
import getNetworkList from "@scom/scom-network-list";
import { IProductInfo, ISubscription } from "./interface";
import { ISubscriptionDiscountRule, Nip19, PaymentMethod, SocialDataManager } from "@scom/scom-social-sdk";
import { BigNumber, ISendTxEventsOptions, IWallet, Utils, Wallet } from "@ijstech/eth-wallet";
import { Contracts as ProductContracts } from '@scom/scom-product-contract';
import { ITokenObject, tokenStore } from "@scom/scom-token-list";
import { formatNumber } from "./commonUtils";
import { EVMWallet } from "./evmWallet";
import { TonWallet } from "./tonWallet";

export interface ISubscriptionActionOptions {
    startTime: number;
    endTime?: number;
    days?: number;
    duration?: number;
    recipient?: string; 
    callback?: any;
    confirmationCallback?: any;
}

export class TonModel {
    private _data: ISubscription = {};
    private _productInfo: IProductInfo;
    private _discountApplied: ISubscriptionDiscountRule;
    private _dataManager: SocialDataManager;
    private tonWallet: TonWallet;
    private _productMarketplaceAddress: string;

    get productMarketplaceAddress() {
        return this._productMarketplaceAddress;
    }

    get paymentMethod() {
        if (this._data.paymentMethod) {
            return this._data.paymentMethod;
        } 
        else {
            return this._data.currency === 'TON' ? PaymentMethod.TON : PaymentMethod.Telegram;
        }
    }

    get currency() {
        return this._data.currency;
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

    set productId(value: number) {
        this._data.productId = value;
    }

    get isRenewal() {
        return this._data.isRenewal;
    }

    set isRenewal(value: boolean) {
        this._data.isRenewal = value;
    }

    get renewalDate() {
        return this._data.renewalDate;
    }

    set renewalDate(value: number) {
        this._data.renewalDate = value;
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

    get dataManager() {
        return this._dataManager || application.store?.mainDataManager;
    }

    set dataManager(manager: SocialDataManager) {
        this._dataManager = manager;
    }

    constructor(tonWallet: TonWallet) {
        this.tonWallet = tonWallet;
    }

    updateDiscount = (duration: number, startDate: any, days: number) => {
        this.discountApplied = undefined;
        if (!this._data.discountRules?.length || !duration || !startDate) return;
        const paymentMethod = this.paymentMethod;
        const price = new BigNumber(this._data.tokenAmount);
        const durationInDays = this._data.durationInDays;
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
        const price = new BigNumber(this._data?.tokenAmount || 0);
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
                discountAmount = price.minus(basePrice).div(this._data.durationInDays).times(days);
            }
        }
        const pricePerDay = basePrice.div(this._data?.durationInDays || 1);
        totalAmount = pricePerDay.times(days);
        return { discountType, discountValue, discountAmount, totalAmount }
    }

    async getProductId(nftAddress: string, nftId?: number) {
        return 0;
    }

    async fetchProductInfo(productId: number) {
        return null;
    }

    async getSubscriptionAction(recipient: string) {
        if (this.isRenewal) {
            return this.renewSubscription.bind(this);
        }
        else {
            return this.subscribe.bind(this);
        }
    }

    async subscribe(options: ISubscriptionActionOptions) {
        const { startTime, endTime, days } = options;
        const txData = this.getPaymentTransactionData(startTime, endTime, days);
        return await this.tonWallet.sendTransaction(txData);
    }

    async renewSubscription(options: ISubscriptionActionOptions) {
        const { startTime, endTime, days } = options;
        const txData = this.getPaymentTransactionData(startTime, endTime, days);
        return await this.tonWallet.sendTransaction(txData);
    }

    getPaymentTransactionData(startTime: number, endTime: number, days: number) {
        const { totalAmount } = this.getDiscountAndTotalAmount(days);
        let subscriptionFee = totalAmount;
        let subscriptionFeeToAddress = this._data.recipient;

        const creatorPubkey = Nip19.decode(this._data.creatorId).data as string;
        const comment = `${creatorPubkey}:${this._data.communityId}:${this.dataManager.selfPubkey}:${startTime}:${endTime}`;
        const payload = this.tonWallet.constructPayload(comment);
        //https://ton-connect.github.io/sdk/modules/_tonconnect_ui.html#send-transaction
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 60, // 60 sec
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
        const { durationInDays, currency, tokenAmount } = this.getData();
        const duration = durationInDays > 1 ? ` for ${durationInDays} days` : ' per day';
        return `${tokenAmount ? formatNumber(tokenAmount, 6) : ""} ${currency}${duration}`;
    }

    async setData(value: ISubscription) {
        this._data = value;
    }

    getData() {
        return this._data;
    }
}

export class EVMModel {
    private _data: ISubscription = {};
    private _productInfo: IProductInfo;
    private _discountApplied: ISubscriptionDiscountRule;
    private _dataManager: SocialDataManager;
    private _productMarketplaceAddress: string;
    private _evmWallet: EVMWallet;

    get productMarketplaceAddress() {
        return this._productMarketplaceAddress;
    }

    get paymentMethod() {
        return PaymentMethod.EVM;
    }

    get currency() {
        return this.productInfo.token?.symbol;
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

    set productId(value: number) {
        this._data.productId = value;
    }

    get isRenewal() {
        return this._data.isRenewal;
    }

    set isRenewal(value: boolean) {
        this._data.isRenewal = value;
    }

    get renewalDate() {
        return this._data.renewalDate;
    }

    set renewalDate(value: number) {
        this._data.renewalDate = value;
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

    get dataManager() {
        return this._dataManager || application.store?.mainDataManager;
    }

    set dataManager(manager: SocialDataManager) {
        this._dataManager = manager;
    }

    constructor(evmWallet: EVMWallet) {
        this._evmWallet = evmWallet;
    }

    registerSendTxEvents(sendTxEventHandlers: ISendTxEventsOptions) {
        const wallet = Wallet.getClientInstance();
        wallet.registerSendTxEvents({
            transactionHash: (error: Error, receipt?: string) => {
                if (sendTxEventHandlers.transactionHash) {
                    sendTxEventHandlers.transactionHash(error, receipt);
                }
            },
            confirmation: (receipt: any) => {
                if (sendTxEventHandlers.confirmation) {
                    sendTxEventHandlers.confirmation(receipt);
                }
            },
        })
    }

    updateDiscount = (duration: number, startDate: any, days: number) => {
        this.discountApplied = undefined;
        if (!this._data.discountRules?.length || !duration || !startDate) return;
        const paymentMethod = this.paymentMethod;
        const price = Utils.fromDecimals(this.productInfo.price, this.productInfo.token.decimals);
        const durationInDays = this.productInfo.priceDuration.div(86400);
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
        const price = this.productInfo.price;
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
                const discountAmountRaw = price.minus(basePrice).div(this.productInfo.priceDuration.div(86400)).times(days);
                discountAmount = Utils.fromDecimals(discountAmountRaw, this.productInfo.token.decimals);
            }
        }
        const pricePerDay = basePrice.div(this.productInfo.priceDuration.div(86400));
        const amountRaw = pricePerDay.times(days);
        totalAmount = Utils.fromDecimals(amountRaw, this.productInfo.token.decimals);
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
            const wallet = this._evmWallet.getRpcWallet();
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
        try {
            const wallet = this._evmWallet.getRpcWallet();
            const subscriptionNFT = new ProductContracts.SubscriptionNFT(wallet, this._data.tokenAddress);
            this._productMarketplaceAddress = await subscriptionNFT.minter();
            if (!this._productMarketplaceAddress) return null;
            const productMarketplace = new ProductContracts.ProductMarketplace(wallet, this._productMarketplaceAddress);
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
            return {
                ...product,
                token
            };
        } catch {
            return null;
        }
    }

    async getDiscount(promotionAddress: string, productId: number, productPrice: BigNumber, discountRuleId: number) {
        let basePrice: BigNumber = productPrice;
        const wallet = Wallet.getClientInstance();
        const promotion = new ProductContracts.Promotion(wallet, promotionAddress);
        const index = await promotion.discountRuleIdToIndex({ param1: productId, param2: discountRuleId });
        const rule = await promotion.discountRules({ param1: productId, param2: index });
        if (rule.discountPercentage.gt(0)) {
            const discount = productPrice.times(rule.discountPercentage).div(100);
            if (productPrice.gt(discount))
                basePrice = productPrice.minus(discount);
        } else if (rule.fixedPrice.gt(0)) {
            basePrice = rule.fixedPrice;
        } else {
            discountRuleId = 0;
        }
        return {
            price: basePrice,
            id: discountRuleId
        }
    }

    async getSubscriptionAction(recipient: string) {
        const wallet = Wallet.getClientInstance();
        const subscriptionNFT = new ProductContracts.SubscriptionNFT(wallet, this.productInfo.nft);
        let nftBalance = await subscriptionNFT.balanceOf(recipient);
        if (nftBalance.eq(0)) {
            return this.subscribe.bind(this);
        }
        else {
            return this.renewSubscription.bind(this);
        }
    }

    async subscribe(options: ISubscriptionActionOptions) {
        const { startTime, duration, recipient, callback, confirmationCallback } = options;
        let commissionAddress = this._evmWallet.getContractAddress('Commission');
        const wallet = Wallet.getClientInstance();
        const commission = new ProductContracts.Commission(wallet, commissionAddress);
        const productMarketplace = new ProductContracts.ProductMarketplace(wallet, this._productMarketplaceAddress);
        let basePrice: BigNumber = this.productInfo.price;
        let discountRuleId = this.discountApplied?.id ?? 0;
        if (discountRuleId !== 0) {
            const promotionAddress = await productMarketplace.promotion();
            const discount = await this.getDiscount(promotionAddress, this.productId, this.productInfo.price, discountRuleId);
            basePrice = discount.price;
            if (discount.id === 0) discountRuleId = 0;
        }
        const amount = this.productInfo.priceDuration.eq(duration) ? basePrice : basePrice.times(duration).div(this.productInfo.priceDuration);
        let tokenInAmount: BigNumber;
        if (this.referrer) {
            let campaign = await commission.getCampaign({ campaignId: this.productId, returnArrays: true });
            const affiliates = (campaign?.affiliates || []).map(a => a.toLowerCase());
            if (affiliates.includes(this.referrer.toLowerCase())) {
                const commissionRate = Utils.fromDecimals(campaign.commissionRate, 6);
                tokenInAmount = new BigNumber(amount).dividedBy(new BigNumber(1).minus(commissionRate)).decimalPlaces(0, BigNumber.ROUND_DOWN);
            }
        }
        let receipt;
        try {
            this.registerSendTxEvents({
                transactionHash: callback,
                confirmation: confirmationCallback
            });
            if (this.productInfo.token.address === Utils.nullAddress) {
                if (!tokenInAmount || tokenInAmount.isZero()) {
                    receipt = await productMarketplace.subscribe({
                        to: recipient || wallet.address,
                        productId: this.productId,
                        startTime: startTime,
                        duration: duration,
                        discountRuleId: discountRuleId
                    }, amount)
                } else {
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
            } else {
                if (!tokenInAmount || tokenInAmount.isZero()) {
                    receipt = await productMarketplace.subscribe({
                        to: recipient || wallet.address,
                        productId: this.productId,
                        startTime: startTime,
                        duration: duration,
                        discountRuleId: discountRuleId
                    })
                } else {
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
        } catch (err) {
            console.error(err);
            throw err;
        }
        return receipt;
    }

    async renewSubscription(options: ISubscriptionActionOptions) {
        const { startTime, duration, recipient, callback, confirmationCallback } = options;
        const wallet = Wallet.getClientInstance();
        const productMarketplace = new ProductContracts.ProductMarketplace(wallet, this._productMarketplaceAddress);
        const subscriptionNFT = new ProductContracts.SubscriptionNFT(wallet, this.productInfo.nft);
        let nftId = await subscriptionNFT.tokenOfOwnerByIndex({
            owner: recipient,
            index: 0
        });
        let basePrice: BigNumber = this.productInfo.price;
        let discountRuleId = this.discountApplied?.id ?? 0;
        if (discountRuleId !== 0) {
            const promotionAddress = await productMarketplace.promotion();
            const discount = await this.getDiscount(promotionAddress, this.productId, this.productInfo.price, discountRuleId);
            basePrice = discount.price;
            if (discount.id === 0) discountRuleId = 0;
        }
        const amount = this.productInfo.priceDuration.eq(duration) ? basePrice : basePrice.times(duration).div(this.productInfo.priceDuration);
        let receipt;
        try {
            this.registerSendTxEvents({
                transactionHash: callback,
                confirmation: confirmationCallback
            });
            if (this.productInfo.token.address === Utils.nullAddress) {
                receipt = await productMarketplace.renewSubscription({
                    productId: this.productId,
                    nftId: nftId,
                    duration: duration,
                    discountRuleId: discountRuleId
                }, amount);
            } else {
                receipt = await productMarketplace.renewSubscription({
                    productId: this.productId,
                    nftId: nftId,
                    duration: duration,
                    discountRuleId: discountRuleId
                });
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
        return receipt;
    }

    getPaymentTransactionData(startTime: number, endTime: number, days: number) {
        throw new Error("Method not implemented.");
    }

    getBasePriceLabel() {
        const { token, price, priceDuration } = this.productInfo;
        const productPrice = Utils.fromDecimals(price, token.decimals).toFixed();
        const days = Math.ceil((priceDuration?.toNumber() || 0) / 86400);
        const duration = days > 1 ? ` for ${days} days` : ' per day';
        return `${productPrice ? formatNumber(productPrice, 6) : ""} ${token?.symbol || ""}${duration}`;
    }

    async setData(value: ISubscription) {
        this._data = value;
    }

    getData() {
        return this._data;
    }
}

export interface IModel {
    isRenewal: boolean;
    renewalDate: number;
    setData(value: ISubscription): void;
    getData(): ISubscription;
    token: ITokenObject;
    referrer: string;
    productMarketplaceAddress: string;
    productId: number;
    currency: string;
    fetchProductInfo(productId: number): Promise<IProductInfo>;
    getSubscriptionAction(recipient: string): Promise<(options: ISubscriptionActionOptions) => Promise<void>>;
    getProductId(nftAddress: string, nftId?: number): Promise<number>;
    recipients: string[];
    productInfo: IProductInfo;
    paymentMethod: PaymentMethod;
    discountRuleId: number;
    discountApplied: ISubscriptionDiscountRule;
    getDiscountAndTotalAmount(days: number): { discountType: 'Percentage' | 'FixedAmount', discountValue: number, discountAmount: BigNumber, totalAmount: BigNumber };
    getPaymentTransactionData(startTime: number, endTime: number, days: number): any;
    updateDiscount(duration: number, startDate: any, days: number): void;
    getBasePriceLabel(): string;
}