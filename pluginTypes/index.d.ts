/// <reference path="@ijstech/eth-wallet/index.d.ts" />
/// <reference path="@scom/scom-dapp-container/@ijstech/eth-wallet/index.d.ts" />
/// <amd-module name="@scom/scom-subscription/index.css.ts" />
declare module "@scom/scom-subscription/index.css.ts" {
    export const inputStyle: string;
    export const linkStyle: string;
}
/// <amd-module name="@scom/scom-subscription/interface.ts" />
declare module "@scom/scom-subscription/interface.ts" {
    import { BigNumber, IClientSideProvider, INetwork } from "@ijstech/eth-wallet";
    import { ISubscriptionDiscountRule, PaymentMethod, PaymentModel, TokenType } from "@scom/scom-social-sdk";
    import { ITokenObject } from "@scom/scom-token-list";
    export interface IExtendedNetwork extends INetwork {
        explorerTxUrl?: string;
        explorerAddressUrl?: string;
    }
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
    export type ContractInfoByChainType = {
        [key: number]: IContractInfo;
    };
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
}
/// <amd-module name="@scom/scom-subscription/data.json.ts" />
declare module "@scom/scom-subscription/data.json.ts" {
    const _default: {
        contractInfo: {
            97: {
                ProductMarketplace: {
                    address: string;
                };
                OneTimePurchaseNFT: {
                    address: string;
                };
                SubscriptionNFTFactory: {
                    address: string;
                };
                Promotion: {
                    address: string;
                };
                Commission: {
                    address: string;
                };
            };
            43113: {
                ProductMarketplace: {
                    address: string;
                };
                OneTimePurchaseNFT: {
                    address: string;
                };
                SubscriptionNFTFactory: {
                    address: string;
                };
                Promotion: {
                    address: string;
                };
                Commission: {
                    address: string;
                };
            };
        };
    };
    export default _default;
}
/// <amd-module name="@scom/scom-subscription/model.ts" />
declare module "@scom/scom-subscription/model.ts" {
    import { Module } from "@ijstech/components";
    import { ContractType, IExtendedNetwork, INetworkConfig, IProductInfo, ISubscription, IWalletPlugin } from "@scom/scom-subscription/interface.ts";
    import { ISubscriptionDiscountRule, PaymentMethod } from "@scom/scom-social-sdk";
    import { BigNumber } from "@ijstech/eth-wallet";
    import { ITokenObject } from "@scom/scom-token-list";
    export class Model {
        private _data;
        private _productInfo;
        private rpcWalletEvents;
        private rpcWalletId;
        private infuraId;
        private defaultNetworks;
        private contractInfoByChain;
        private networkMap;
        private _isRenewal;
        private _discountApplied;
        private module;
        private toncore;
        private tonConnectUI;
        private _isTonWalletConnected;
        onTonWalletStatusChanged: (isConnected: boolean) => void;
        onChainChanged: () => Promise<void>;
        onWalletConnected: () => Promise<void>;
        refreshDappContainer: () => void;
        updateUIBySetData: () => Promise<void>;
        get durationUnits(): {
            label: string;
            value: string;
        }[];
        get paymentMethod(): PaymentMethod;
        get currency(): string;
        get chainId(): number;
        get token(): ITokenObject;
        get wallets(): IWalletPlugin[];
        set wallets(value: IWalletPlugin[]);
        get networks(): INetworkConfig[];
        set networks(value: INetworkConfig[]);
        get showHeader(): boolean;
        set showHeader(value: boolean);
        get isTonWalletConnected(): boolean;
        get productId(): number;
        set productId(value: number);
        get isRenewal(): boolean;
        set isRenewal(value: boolean);
        get discountApplied(): ISubscriptionDiscountRule;
        set discountApplied(value: ISubscriptionDiscountRule);
        get discountRuleId(): number;
        set discountRuleId(value: number);
        get productInfo(): IProductInfo;
        set productInfo(info: IProductInfo);
        constructor(module: Module, moduleDir: string);
        loadLib(moduleDir: string): Promise<unknown>;
        initTonWallet(): void;
        connectTonWallet(): Promise<void>;
        initWallet(): Promise<void>;
        private removeRpcWalletEvents;
        private initRpcWallet;
        resetRpcWallet(): Promise<void>;
        getRpcWallet(): import("@ijstech/eth-wallet").IRpcWallet;
        getNetworkInfo(chainId: number): IExtendedNetwork;
        getContractAddress(type: ContractType): any;
        viewExplorerByAddress(chainId: number, address: string): void;
        formatNumber(value: number | string | BigNumber, decimalFigures?: number): string;
        getDurationInDays(duration: number, unit: 'days' | 'months' | 'years', startDate: any): number;
        updateDiscount: (duration: number, startDate: any, days: number) => void;
        getDiscountAndTotalAmount(days: number): {
            discountType: "Percentage" | "FixedAmount";
            discountValue: number;
            discountAmount: BigNumber;
            totalAmount: BigNumber;
        };
        getTokenInfo(address: string, chainId: number): Promise<ITokenObject>;
        getProductId(nftAddress: string, nftId?: number): Promise<number>;
        fetchProductInfo(productId: number): Promise<{
            token: {
                chainId: number;
                address: string;
                decimals: number;
                symbol: string;
                name: string;
            };
            productType: BigNumber;
            productId: BigNumber;
            uri: string;
            quantity: BigNumber;
            price: BigNumber;
            maxQuantity: BigNumber;
            maxPrice: BigNumber;
            status: BigNumber;
            nft: string;
            nftId: BigNumber;
            priceDuration: BigNumber;
        }>;
        getConfigurators(): {
            name: string;
            target: string;
            getActions: any;
            getData: any;
            setData: any;
            getTag: any;
            setTag: any;
        }[];
        setData(value: ISubscription): Promise<void>;
        getData(): ISubscription;
        getTag(): any;
        setTag(value: any): void;
        private updateTag;
        private updateStyle;
        private updateTheme;
        private getActions;
    }
}
/// <amd-module name="@scom/scom-subscription" />
declare module "@scom/scom-subscription" {
    import { ControlElement, Module } from '@ijstech/components';
    import { ISubscription } from "@scom/scom-subscription/interface.ts";
    interface ScomSubscriptionElement extends ControlElement {
        onSubscribed?: () => void;
    }
    global {
        namespace JSX {
            interface IntrinsicElements {
                ["i-scom-subscription"]: ScomSubscriptionElement;
            }
        }
    }
    export default class ScomSubscription extends Module {
        private containerDapp;
        private pnlHeader;
        private pnlLoading;
        private pnlBody;
        private pnlRecipient;
        private comboRecipient;
        private edtStartDate;
        private pnlCustomStartDate;
        private chkCustomStartDate;
        private lblStartDate;
        private edtDuration;
        private comboDurationUnit;
        private lblEndDate;
        private pnlBasePrice;
        private lblBasePrice;
        private pnlDiscount;
        private lblDiscount;
        private lblDiscountAmount;
        private lblOrderTotal;
        private iconOrderTotal;
        private pnlDetail;
        private lblSpotsRemaining;
        private btnDetail;
        private detailWrapper;
        private lblMarketplaceContract;
        private lblNFTContract;
        private lblToken;
        private iconCopyToken;
        private btnSubmit;
        private txStatusModal;
        private model;
        private discountApplied;
        private _renewalDate;
        private get duration();
        private get durationUnit();
        get isRenewal(): boolean;
        set isRenewal(value: boolean);
        get renewalDate(): number;
        set renewalDate(value: number);
        showLoading(): void;
        hideLoading(): void;
        getConfigurators(): {
            name: string;
            target: string;
            getActions: any;
            getData: any;
            setData: any;
            getTag: any;
            setTag: any;
        }[];
        setData(data: ISubscription): Promise<void>;
        getData(): ISubscription;
        getTag(): any;
        setTag(value: any): void;
        private onChainChanged;
        private onWalletConnected;
        private refreshDappContainer;
        private updateUIBySetData;
        private updateEVMUI;
        private updateSpotsRemaining;
        private updateBasePrice;
        private refreshDApp;
        private handleTonWalletStatusChanged;
        private determineBtnSubmitCaption;
        private _updateEndDate;
        private _updateDiscount;
        private _updateTotalAmount;
        private handleCustomCheckboxChange;
        private handleStartDateChanged;
        private handleDurationChanged;
        private handleDurationUnitChanged;
        private onToggleDetail;
        private onViewMarketplaceContract;
        private onViewNFTContract;
        private onViewToken;
        private updateCopyIcon;
        private onCopyMarketplaceContract;
        private onCopyNFTContract;
        private onCopyToken;
        private showTxStatusModal;
        private onSubmit;
        init(): void;
        render(): any;
    }
}
