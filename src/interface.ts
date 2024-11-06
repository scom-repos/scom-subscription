import { BigNumber, IClientSideProvider, INetwork } from "@ijstech/eth-wallet";
import { ISubscriptionDiscountRule, PaymentMethod, PaymentModel, TokenType } from "@scom/scom-social-sdk";
import { ITokenObject } from "@scom/scom-token-list";

export interface IExtendedNetwork extends INetwork {
    explorerTxUrl?: string;
    explorerAddressUrl?: string;
};

export type ContractType = 'ProductMarketplace' | 'OneTimePurchaseNFT' | 'SubscriptionNFTFactory' | 'Promotion' | 'Commission';

interface IContractDetailInfo {
    address: string;
}

export interface IContractInfo {
    ProductMarketplace: IContractDetailInfo;
    OneTimePurchaseNFT: IContractDetailInfo;
    SubscriptionNFTFactory: IContractDetailInfo;
    Promotion: IContractDetailInfo;
    Commission: IContractDetailInfo;
}

export type ContractInfoByChainType = { [key: number]: IContractInfo };

export interface IProductInfo {
    productType: BigNumber;
    productId: BigNumber;
    uri: string;
    quantity: BigNumber;
    price: BigNumber;
    maxQuantity: BigNumber;
    maxPrice: BigNumber;
    token: ITokenObject;
    status: BigNumber;
    nft: string;
    nftId: BigNumber;
    priceDuration: BigNumber;
}

export interface ISubscription {
    productId?: number;
    creatorId?: string;
    communityId?: string;
    name?: string;
    paymentModel?: PaymentModel;
    paymentMethod?: PaymentMethod;
    chainId?: number;
    tokenAddress?: string;
    tokenType?: TokenType;
    tokenId?: number;
    tokenAmount?: string;
    currency?: string;
    durationInDays?: number;
    discountRules?: ISubscriptionDiscountRule[];
    commissionRate?: number;
    affiliates?: string[];
    recipient?: string;
    recipients?: string[];
    discountRuleId?: number;
    referrer?: string;
    defaultChainId?: number;
    wallets?: IWalletPlugin[];
    networks?: any[];
    showHeader?: boolean;
}

export interface IWalletPlugin {
    name: string;
    packageName?: string;
    provider?: IClientSideProvider;
}

export interface INetworkConfig {
    chainName?: string;
    chainId: number;
}