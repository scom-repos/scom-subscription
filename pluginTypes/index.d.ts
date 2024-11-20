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
/// <amd-module name="@scom/scom-subscription/model.ts" />
declare module "@scom/scom-subscription/model.ts" {
    import { ContractType, IExtendedNetwork, INetworkConfig, IProductInfo, ISubscription, IWalletPlugin } from "@scom/scom-subscription/interface.ts";
    import { ISubscriptionDiscountRule, PaymentMethod, SocialDataManager } from "@scom/scom-social-sdk";
    import { BigNumber, ERC20ApprovalModel, IERC20ApprovalEventOptions, IRpcWallet, ISendTxEventsOptions } from "@ijstech/eth-wallet";
    import { ITokenObject } from "@scom/scom-token-list";
    export interface ITonUtils {
        constructPayload(msg: string): string;
    }
    export class TonUtils implements ITonUtils {
        private toncore;
        constructor(moduleDir: string);
        loadLib(moduleDir: string): Promise<unknown>;
        constructPayload(msg: string): any;
    }
    class EventEmitter {
        private events;
        on(event: string, listener: Function): void;
        off(event: string, listener: Function): void;
        emit(event: string, data?: any): void;
    }
    export class TonModel extends EventEmitter {
        private _data;
        private _productInfo;
        private _discountApplied;
        private _approvalModel;
        private _dataManager;
        private _tonUtils;
        private _productMarketplaceAddress;
        get productMarketplaceAddress(): string;
        get durationUnits(): {
            label: string;
            value: string;
        }[];
        get paymentMethod(): PaymentMethod;
        get currency(): string;
        get chainId(): number;
        get token(): ITokenObject;
        get wallets(): any[];
        get networks(): any[];
        get showHeader(): boolean;
        set showHeader(value: boolean);
        get recipient(): string;
        get recipients(): string[];
        get referrer(): string;
        get approvalModel(): ERC20ApprovalModel;
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
        constructor(moduleDir: string);
        initWallet(): Promise<void>;
        updateDappContainerData(): void;
        isClientWalletConnected(): boolean;
        isRpcWalletConnected(): boolean;
        switchNetwork(chainId: number): Promise<void>;
        getNetworkInfo(chainId: number): any;
        getContractAddress(type: ContractType): string;
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
        getProductId(nftAddress: string, nftId?: number): Promise<number>;
        fetchProductInfo(productId: number): Promise<any>;
        getDiscount(promotionAddress: string, productId: number, productPrice: BigNumber, discountRuleId: number): Promise<{
            price: BigNumber;
            id: number;
        }>;
        getSubscriptionAction(recipient: string): Promise<any>;
        subscribe(startTime: number, duration: number, recipient: string, callback?: any, confirmationCallback?: any): Promise<any>;
        renewSubscription(startTime: number, duration: number, recipient: string, callback?: any, confirmationCallback?: any): Promise<any>;
        getPaymentTransactionData(startTime: number, endTime: number, days: number): {
            validUntil: number;
            messages: {
                address: string;
                amount: string;
                payload: string;
            }[];
        };
        getBasePriceLabel(): string;
        setApprovalModelAction(options: IERC20ApprovalEventOptions): Promise<any>;
        setData(value: ISubscription): Promise<void>;
        getData(): ISubscription;
    }
    export class EVMModel extends EventEmitter {
        private _data;
        private _productInfo;
        private rpcWalletEvents;
        private rpcWalletId;
        private infuraId;
        private defaultNetworks;
        private defaultWallets;
        private contractInfoByChain;
        private networkMap;
        private _discountApplied;
        private _approvalModel;
        private _dataManager;
        private _productMarketplaceAddress;
        get productMarketplaceAddress(): string;
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
        get recipient(): string;
        get recipients(): string[];
        get referrer(): string;
        get approvalModel(): ERC20ApprovalModel;
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
        constructor(moduleDir: string);
        initWallet(): Promise<void>;
        private removeRpcWalletEvents;
        private initRpcWallet;
        resetRpcWallet(): Promise<void>;
        updateDappContainerData(): void;
        private getDappContainerData;
        getRpcWallet(): IRpcWallet;
        isClientWalletConnected(): boolean;
        isRpcWalletConnected(): boolean;
        switchNetwork(chainId: number): Promise<void>;
        getNetworkInfo(chainId: number): IExtendedNetwork;
        getContractAddress(type: ContractType): any;
        viewExplorerByAddress(chainId: number, address: string): void;
        registerSendTxEvents(sendTxEventHandlers: ISendTxEventsOptions): void;
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
        subscribe(startTime: number, duration: number, recipient: string, callback?: any, confirmationCallback?: any): Promise<any>;
        renewSubscription(startTime: number, duration: number, recipient: string, callback?: any, confirmationCallback?: any): Promise<any>;
        getPaymentTransactionData(startTime: number, endTime: number, days: number): void;
        getBasePriceLabel(): string;
        setApprovalModelAction(options: IERC20ApprovalEventOptions): Promise<import("@ijstech/eth-wallet").IERC20ApprovalAction>;
        setData(value: ISubscription): Promise<void>;
        getData(): ISubscription;
    }
    export interface IModel extends EventEmitter {
        isRenewal: boolean;
        renewalDate: number;
        showHeader: boolean;
        setData(value: ISubscription): void;
        getData(): ISubscription;
        isRpcWalletConnected(): boolean;
        isClientWalletConnected(): boolean;
        updateDappContainerData(): void;
        wallets: IWalletPlugin[];
        networks: INetworkConfig[];
        setApprovalModelAction(options: IERC20ApprovalEventOptions): Promise<any>;
        chainId: number;
        token: ITokenObject;
        referrer: string;
        getContractAddress(type: ContractType): string;
        productMarketplaceAddress: string;
        approvalModel: ERC20ApprovalModel;
        initWallet(): void;
        switchNetwork(chainId: number): Promise<void>;
        productId: number;
        currency: string;
        fetchProductInfo(productId: number): Promise<IProductInfo>;
        getSubscriptionAction(recipient: string): Promise<any>;
        getProductId(nftAddress: string, nftId?: number): Promise<number>;
        recipients: string[];
        productInfo: IProductInfo;
        paymentMethod: PaymentMethod;
        discountRuleId: number;
        discountApplied: ISubscriptionDiscountRule;
        durationUnits: {
            label: string;
            value: string;
        }[];
        getNetworkInfo(chainId: number): IExtendedNetwork;
        formatNumber(value: number | string | BigNumber, decimalFigures?: number): string;
        getDurationInDays(duration: number, unit: 'days' | 'months' | 'years', startDate: any): number;
        getDiscountAndTotalAmount(days: number): {
            discountType: 'Percentage' | 'FixedAmount';
            discountValue: number;
            discountAmount: BigNumber;
            totalAmount: BigNumber;
        };
        viewExplorerByAddress(chainId: number, address: string): void;
        getPaymentTransactionData(startTime: number, endTime: number, days: number): any;
        updateDiscount(duration: number, startDate: any, days: number): void;
        getBasePriceLabel(): string;
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
        private mdWallet;
        private approvalModelAction;
        private isApproving;
        private tokenAmountIn;
        private tonWallet;
        onSubscribed?: () => void;
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
        private onChainChanged;
        private onWalletConnected;
        private refreshDappContainer;
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
        private connectWallet;
        private onApprove;
        private updateSubmitButton;
        private doSubmitAction;
        private onSubmit;
        init(): void;
        render(): any;
    }
}
