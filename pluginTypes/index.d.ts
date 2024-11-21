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
    export type ContractType = 'Commission';
    interface IContractDetailInfo {
        address: string;
    }
    export interface IContractInfo {
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
        isRenewal?: boolean;
        renewalDate?: number;
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
/// <amd-module name="@scom/scom-subscription/commonUtils.ts" />
declare module "@scom/scom-subscription/commonUtils.ts" {
    import { BigNumber } from "@ijstech/eth-wallet";
    function getDurationInDays(duration: number, unit: 'days' | 'months' | 'years', startDate: any): number;
    function formatNumber(value: number | string | BigNumber, decimalFigures?: number): string;
    export { getDurationInDays, formatNumber };
}
/// <amd-module name="@scom/scom-subscription/data.json.ts" />
declare module "@scom/scom-subscription/data.json.ts" {
    const _default: {
        infuraId: string;
        contractInfo: {
            97: {
                Commission: {
                    address: string;
                };
            };
            43113: {
                Commission: {
                    address: string;
                };
            };
        };
    };
    export default _default;
}
/// <amd-module name="@scom/scom-subscription/evmWallet.ts" />
declare module "@scom/scom-subscription/evmWallet.ts" {
    import { Component } from "@ijstech/components";
    import { ContractType, IExtendedNetwork, INetworkConfig, IWalletPlugin } from "@scom/scom-subscription/interface.ts";
    class EventEmitter {
        private events;
        on(event: string, listener: Function): void;
        off(event: string, listener: Function): void;
        emit(event: string, data?: any): void;
    }
    export class EVMWallet extends EventEmitter {
        private mdEVMWallet;
        private _wallets;
        private _networks;
        private rpcWalletEvents;
        private rpcWalletId;
        private defaultChainId;
        private _chainId;
        private infuraId;
        private defaultNetworks;
        private defaultWallets;
        private contractInfoByChain;
        private networkMap;
        get wallets(): IWalletPlugin[];
        set wallets(value: IWalletPlugin[]);
        get networks(): INetworkConfig[];
        set networks(value: INetworkConfig[]);
        constructor();
        setData(data: {
            wallets: IWalletPlugin[];
            networks: INetworkConfig[];
            chainId: number;
            defaultChainId: number;
        }): void;
        initWallet(): Promise<void>;
        private removeRpcWalletEvents;
        private initRpcWallet;
        resetRpcWallet(): Promise<void>;
        private getDappContainerData;
        updateDappContainerData(): void;
        getRpcWallet(): import("@ijstech/eth-wallet").IRpcWallet;
        connectWallet(modalContainer: Component): Promise<void>;
        isWalletConnected(): boolean;
        isNetworkConnected(): boolean;
        getContractAddress(type: ContractType): any;
        switchNetwork(chainId: number): Promise<void>;
        getNetworkInfo(chainId: number): IExtendedNetwork;
        viewExplorerByAddress(chainId: number, address: string): void;
    }
}
/// <amd-module name="@scom/scom-subscription/tonWallet.ts" />
declare module "@scom/scom-subscription/tonWallet.ts" {
    export class TonWallet {
        private toncore;
        private tonConnectUI;
        private _isWalletConnected;
        private _onTonWalletStatusChanged;
        constructor(moduleDir: string, onTonWalletStatusChanged: (isConnected: boolean) => void);
        get isWalletConnected(): boolean;
        loadLib(moduleDir: string): Promise<unknown>;
        initWallet(): void;
        connectWallet(): Promise<void>;
        sendTransaction(txData: any): Promise<any>;
        constructPayload(msg: string): any;
    }
}
/// <amd-module name="@scom/scom-subscription/model.ts" />
declare module "@scom/scom-subscription/model.ts" {
    import { IProductInfo, ISubscription } from "@scom/scom-subscription/interface.ts";
    import { ISubscriptionDiscountRule, PaymentMethod, SocialDataManager } from "@scom/scom-social-sdk";
    import { BigNumber, ISendTxEventsOptions } from "@ijstech/eth-wallet";
    import { ITokenObject } from "@scom/scom-token-list";
    import { EVMWallet } from "@scom/scom-subscription/evmWallet.ts";
    import { TonWallet } from "@scom/scom-subscription/tonWallet.ts";
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
        private _data;
        private _productInfo;
        private _discountApplied;
        private _dataManager;
        private tonWallet;
        private _productMarketplaceAddress;
        get productMarketplaceAddress(): string;
        get paymentMethod(): PaymentMethod;
        get currency(): string;
        get token(): ITokenObject;
        get recipient(): string;
        get recipients(): string[];
        get referrer(): string;
        get productId(): number;
        set productId(value: number);
        get isRenewal(): boolean;
        set isRenewal(value: boolean);
        get renewalDate(): number;
        set renewalDate(value: number);
        get discountApplied(): ISubscriptionDiscountRule;
        set discountApplied(value: ISubscriptionDiscountRule);
        get discountRuleId(): number;
        set discountRuleId(value: number);
        get productInfo(): IProductInfo;
        set productInfo(info: IProductInfo);
        get dataManager(): SocialDataManager;
        set dataManager(manager: SocialDataManager);
        constructor(tonWallet: TonWallet);
        updateDiscount: (duration: number, startDate: any, days: number) => void;
        getDiscountAndTotalAmount(days: number): {
            discountType: "Percentage" | "FixedAmount";
            discountValue: number;
            discountAmount: BigNumber;
            totalAmount: BigNumber;
        };
        getProductId(nftAddress: string, nftId?: number): Promise<number>;
        fetchProductInfo(productId: number): Promise<any>;
        getSubscriptionAction(recipient: string): Promise<any>;
        subscribe(options: ISubscriptionActionOptions): Promise<any>;
        renewSubscription(options: ISubscriptionActionOptions): Promise<any>;
        getPaymentTransactionData(startTime: number, endTime: number, days: number): {
            validUntil: number;
            messages: {
                address: string;
                amount: string;
                payload: any;
            }[];
        };
        getBasePriceLabel(): string;
        setData(value: ISubscription): Promise<void>;
        getData(): ISubscription;
    }
    export class EVMModel {
        private _data;
        private _productInfo;
        private _discountApplied;
        private _dataManager;
        private _productMarketplaceAddress;
        private _evmWallet;
        get productMarketplaceAddress(): string;
        get paymentMethod(): PaymentMethod;
        get currency(): string;
        get token(): ITokenObject;
        get recipient(): string;
        get recipients(): string[];
        get referrer(): string;
        get productId(): number;
        set productId(value: number);
        get isRenewal(): boolean;
        set isRenewal(value: boolean);
        get renewalDate(): number;
        set renewalDate(value: number);
        get discountApplied(): ISubscriptionDiscountRule;
        set discountApplied(value: ISubscriptionDiscountRule);
        get discountRuleId(): number;
        set discountRuleId(value: number);
        get productInfo(): IProductInfo;
        set productInfo(info: IProductInfo);
        get dataManager(): SocialDataManager;
        set dataManager(manager: SocialDataManager);
        constructor(evmWallet: EVMWallet);
        registerSendTxEvents(sendTxEventHandlers: ISendTxEventsOptions): void;
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
            token: ITokenObject;
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
        getDiscount(promotionAddress: string, productId: number, productPrice: BigNumber, discountRuleId: number): Promise<{
            price: BigNumber;
            id: number;
        }>;
        getSubscriptionAction(recipient: string): Promise<any>;
        subscribe(options: ISubscriptionActionOptions): Promise<any>;
        renewSubscription(options: ISubscriptionActionOptions): Promise<any>;
        getPaymentTransactionData(startTime: number, endTime: number, days: number): void;
        getBasePriceLabel(): string;
        setData(value: ISubscription): Promise<void>;
        getData(): ISubscription;
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
        getDiscountAndTotalAmount(days: number): {
            discountType: 'Percentage' | 'FixedAmount';
            discountValue: number;
            discountAmount: BigNumber;
            totalAmount: BigNumber;
        };
        getPaymentTransactionData(startTime: number, endTime: number, days: number): any;
        updateDiscount(duration: number, startDate: any, days: number): void;
        getBasePriceLabel(): string;
    }
}
/// <amd-module name="@scom/scom-subscription" />
declare module "@scom/scom-subscription" {
    import { ControlElement, Module } from '@ijstech/components';
    import { IERC20ApprovalAction, IERC20ApprovalEventOptions } from '@ijstech/eth-wallet';
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
        private lblBasePrice;
        private pnlDiscount;
        private lblDiscount;
        private lblDiscountAmount;
        private lblOrderTotal;
        private pnlDetail;
        private pnlSpotsRemaining;
        private lblSpotsRemaining;
        private btnDetail;
        private detailWrapper;
        private lblRemaining;
        private lblMarketplaceContract;
        private lblNFTContract;
        private lblToken;
        private iconCopyToken;
        private btnApprove;
        private btnSubmit;
        private txStatusModal;
        private model;
        private pnlEVMWallet;
        private mdEVMWallet;
        private approvalModel;
        private approvalModelAction;
        private isApproving;
        private tokenAmountIn;
        private evmWallet;
        private tonWallet;
        onSubscribed?: () => void;
        get durationUnits(): {
            label: string;
            value: string;
        }[];
        private get duration();
        private get durationUnit();
        get isRenewal(): boolean;
        set isRenewal(value: boolean);
        get renewalDate(): number;
        set renewalDate(value: number);
        showLoading(): void;
        hideLoading(): void;
        setData(data: ISubscription): Promise<void>;
        getData(): ISubscription;
        getTag(): any;
        setTag(value: any): void;
        private updateTheme;
        private updateStyle;
        private updateTag;
        private onEVMWalletConnected;
        private refreshDappContainer;
        setApprovalModelAction(options: IERC20ApprovalEventOptions): Promise<IERC20ApprovalAction>;
        private initApprovalAction;
        private updateContractAddress;
        private updateEVMUI;
        private updateSpotsRemaining;
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
        private onApprove;
        private updateSubmitButton;
        private doSubmitAction;
        private onSubmit;
        init(): void;
        render(): any;
    }
}
