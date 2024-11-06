import {
    application,
    Button,
    Checkbox,
    ComboBox,
    ControlElement,
    customElements,
    Datepicker,
    FormatUtils,
    HStack,
    IComboItem,
    Icon,
    Input,
    Label,
    Module,
    moment,
    Panel,
    StackLayout,
    Styles,
} from '@ijstech/components';
import { BigNumber, IERC20ApprovalAction, Utils } from '@ijstech/eth-wallet';
import ScomDappContainer from '@scom/scom-dapp-container';
import { ISubscriptionDiscountRule, PaymentMethod } from '@scom/scom-social-sdk';
import { ITokenObject } from '@scom/scom-token-list';
import ScomTxStatusModal from '@scom/scom-tx-status-modal';
import { inputStyle, linkStyle } from './index.css';
import { ISubscription } from './interface';
import { Model } from './model';
import ScomWalletModal from '@scom/scom-wallet-modal';

const Theme = Styles.Theme.ThemeVars;
const path = application.currentModuleDir;

interface ScomSubscriptionElement extends ControlElement {
    onSubscribed?: () => void;
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            ["i-scom-subscription"]: ScomSubscriptionElement;
        }
    }
}

@customElements('i-scom-subscription')
export default class ScomSubscription extends Module {
    private containerDapp: ScomDappContainer;
    private pnlHeader: StackLayout;
    private pnlLoading: StackLayout;
    private pnlBody: StackLayout;
    private pnlRecipient: StackLayout;
    private comboRecipient: ComboBox;
    private edtStartDate: Datepicker;
    private pnlCustomStartDate: Panel;
    private chkCustomStartDate: Checkbox;
    private lblStartDate: Label;
    private edtDuration: Input;
    private comboDurationUnit: ComboBox;
    private lblEndDate: Label;
    private lblBasePrice: Label;
    private pnlDiscount: StackLayout;
    private lblDiscount: Label;
    private lblDiscountAmount: Label;
    private lblOrderTotal: Label;
    private pnlDetail: StackLayout;
    private lblSpotsRemaining: Label;
    private btnDetail: Button;
    private detailWrapper: HStack;
    private lblMarketplaceContract: Label;
    private lblNFTContract: Label;
    private lblToken: Label;
    private iconCopyToken: Icon;
    private btnApprove: Button;
    private btnSubmit: Button;
    private txStatusModal: ScomTxStatusModal;
    private model: Model;
    private _renewalDate: number;
    private mdWallet: ScomWalletModal;
    private approvalModelAction: IERC20ApprovalAction;
    private isApproving: boolean = false;
    private tokenAmountIn: string = '0';
    public onSubscribed?: () => void;

    private get duration() {
        return Number(this.edtDuration.value) || 0;
    }

    private get durationUnit() {
        return ((this.comboDurationUnit.selectedItem as IComboItem)?.value || 'days') as 'days' | 'months' | 'years';
    }

    get isRenewal() {
        return this.model.isRenewal;
    }
    set isRenewal(value: boolean) {
        this.model.isRenewal = value;
    }

    get renewalDate() {
        return this._renewalDate;
    }
    set renewalDate(value: number) {
        this._renewalDate = value;
        if (this.edtStartDate) {
            this.edtStartDate.value = value > 0 ? moment(value * 1000) : moment();
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

    getConfigurators() {
        return this.model.getConfigurators()
    }

    async setData(data: ISubscription) {
        await this.model.setData(data);
    }

    getData() {
        return this.model.getData();
    }

    getTag() {
        return this.tag;
    }

    setTag(value: any) {
        this.model.setTag(value);
    }

    private onChainChanged = async () => {
        await this.refreshDApp();
    }

    private onWalletConnected = async () => {
        await this.refreshDApp();
    }

    private refreshDappContainer = () => {
        const rpcWallet = this.model.getRpcWallet();
        const { chainId, defaultChainId } = this.model.getData();
        const _chainId = chainId || rpcWallet?.chainId;
        const containerData = {
            defaultChainId: chainId || defaultChainId,
            wallets: this.model.wallets,
            networks: _chainId ? [{ chainId: _chainId }] : this.model.networks,
            showHeader: this.model.showHeader,
            rpcWalletId: rpcWallet.instanceId
        }
        if (this.containerDapp?.setData) this.containerDapp.setData(containerData);
    }

    private async initApprovalAction() {
        if (!this.approvalModelAction) {
            this.approvalModelAction = await this.model.setApprovalModelAction({
                sender: this,
                payAction: async () => {
                    await this.doSubmitAction();
                },
                onToBeApproved: async (token: ITokenObject) => {
                    this.btnApprove.visible = this.model.isClientWalletConnected() && this.model.isRpcWalletConnected();
                    this.btnSubmit.visible = !this.btnApprove.visible;
                    this.btnSubmit.enabled = false;
                    if (!this.isApproving) {
                        this.btnApprove.rightIcon.visible = false;
                        this.btnApprove.caption = 'Approve';
                    }
                    this.btnApprove.enabled = true;
                    this.isApproving = false;
                },
                onToBePaid: async (token: ITokenObject) => {
                    this.btnApprove.visible = false;
                    this.btnSubmit.visible = true;
                    this.isApproving = false;
                    const duration = Number(this.edtDuration.value) || 0;
                    this.btnSubmit.enabled = new BigNumber(this.tokenAmountIn).gt(0) && Number.isInteger(duration);
                    this.determineBtnSubmitCaption();
                },
                onApproving: async (token: ITokenObject, receipt?: string) => {
                    this.isApproving = true;
                    this.btnApprove.rightIcon.spin = true;
                    this.btnApprove.rightIcon.visible = true;
                    this.btnApprove.caption = `Approving ${token?.symbol || ''}`;
                    this.btnSubmit.visible = false;
                    if (receipt) {
                        this.showTxStatusModal('success', receipt);
                    }
                },
                onApproved: async (token: ITokenObject) => {
                    this.btnApprove.rightIcon.visible = false;
                    this.btnApprove.caption = 'Approve';
                    this.isApproving = false;
                    this.btnSubmit.visible = true;
                    this.btnSubmit.enabled = true;
                },
                onApprovingError: async (token: ITokenObject, err: Error) => {
                    this.showTxStatusModal('error', err);
                    this.btnApprove.caption = 'Approve';
                    this.btnApprove.rightIcon.visible = false;
                    this.isApproving = false;
                },
                onPaying: async (receipt?: string) => {
                    if (receipt) {
                        this.showTxStatusModal('success', receipt);
                        this.btnSubmit.enabled = false;
                        this.btnSubmit.rightIcon.visible = true;
                    }
                },
                onPaid: async (receipt?: any) => {
                    this.btnSubmit.rightIcon.visible = false;
                    if (this.txStatusModal) this.txStatusModal.closeModal();
                },
                onPayingError: async (err: Error) => {
                    this.showTxStatusModal('error', err);
                }
            });
            this.updateContractAddress();
            if (this.model?.token?.address !== Utils.nullAddress && this.tokenAmountIn) {
                this.approvalModelAction.checkAllowance(this.model.token, this.tokenAmountIn);
            }
        }
    }

    private updateContractAddress() {
        if (this.approvalModelAction) {
            let contractAddress: string;
            if (this.model.referrer) {
                contractAddress = this.model.getContractAddress('Commission');
            }
            else {
                contractAddress = this.model.getContractAddress('ProductMarketplace');
            }
            this.model.approvalModel.spenderAddress = contractAddress;
        }
    }

    private async updateUIBySetData() {
        this.showLoading();
        this.edtStartDate.value = undefined;
        this.edtDuration.value = '';
        this.comboDurationUnit.selectedItem = this.model.durationUnits[0];
        await this.refreshDApp();
        this.hideLoading();
    }

    private async updateEVMUI() {
        try {
            await this.model.initWallet();
            if (this.model.isRpcWalletConnected()) await this.initApprovalAction();
            const { chainId, tokenAddress } = this.model.getData();
            if (!this.model.productId) {
                this.model.productId = await this.model.getProductId(tokenAddress);
            }
            this.model.productInfo = await this.model.fetchProductInfo(this.model.productId);
            this.refreshDappContainer();
            this.comboRecipient.items = this.model.recipients.map(address => ({
                label: address,
                value: address
            }));
            if (this.comboRecipient.items.length) this.comboRecipient.selectedItem = this.comboRecipient.items[0];
            if (this.model.productInfo) {
                const { token } = this.model.productInfo;
                this.detailWrapper.visible = true;
                this.onToggleDetail();
                this.btnDetail.visible = true;
                this.lblMarketplaceContract.caption = FormatUtils.truncateWalletAddress(this.model.getContractAddress('ProductMarketplace'));
                this.lblNFTContract.caption = FormatUtils.truncateWalletAddress(tokenAddress);
                const isNativeToken = !token.address || token.address === Utils.nullAddress || !token.address.startsWith('0x');
                if (isNativeToken) {
                    const network = this.model.getNetworkInfo(chainId);
                    this.lblToken.caption = `${network?.chainName || ''} Native Token`;
                    this.lblToken.textDecoration = 'none';
                    this.lblToken.font = { size: '1rem', color: Theme.text.primary };
                    this.lblToken.style.textAlign = 'right';
                    this.lblToken.classList.remove(linkStyle);
                    this.lblToken.onClick = () => { };
                } else {
                    this.lblToken.caption = FormatUtils.truncateWalletAddress(token.address);
                    this.lblToken.textDecoration = 'underline';
                    this.lblToken.font = { size: '1rem', color: Theme.colors.primary.main };
                    this.lblToken.classList.add(linkStyle);
                    this.lblToken.onClick = () => this.onViewToken();
                }
                this.iconCopyToken.visible = !isNativeToken;
                this.updateSpotsRemaining();
            }
        } catch (err) { }
    }

    private updateSpotsRemaining() {
        if (this.model.productId >= 0) {
            this.lblSpotsRemaining.caption = `&#128293; Hurry! Only [ ${this.model.formatNumber(this.model.productInfo.quantity, 0)} NFTs Left ] &#128293;`;
        } else {
            this.lblSpotsRemaining.caption = '';
        }
    }

    private updateBasePrice(isEVM: boolean) {
        if (isEVM) {
            const { token, price, priceDuration } = this.model.productInfo;
            const productPrice = Utils.fromDecimals(price, token.decimals).toFixed();
            const days = Math.ceil((priceDuration?.toNumber() || 0) / 86400);
            const duration = days > 1 ? ` for ${days} days` : ' per day';
            this.lblBasePrice.caption = `${productPrice ? this.model.formatNumber(productPrice) : ""} ${token?.symbol || ""}${duration}`;
        } else {
            const { durationInDays, currency, tokenAmount } = this.model.getData();
            const duration = durationInDays > 1 ? ` for ${durationInDays} days` : ' per day';
            this.lblBasePrice.caption = `${tokenAmount ? this.model.formatNumber(tokenAmount) : ""} ${currency}${duration}`;
        }
    }

    private async refreshDApp() {
        try {
            const paymentMethod = this.model.paymentMethod;
            const isEVM = paymentMethod === PaymentMethod.EVM;
            const isTelegram = paymentMethod === PaymentMethod.Telegram;
            const { discountRuleId, discountRules, durationInDays } = this.model.getData();
            if (isEVM) {
                await this.updateEVMUI();
            } else {
                this.model.initTonWallet();
                if (this.containerDapp?.setData) await this.containerDapp.setData({
                    showHeader: false
                });
            }
            this.pnlHeader.visible = paymentMethod === PaymentMethod.TON;
            this.pnlRecipient.visible = isEVM;
            this.pnlDetail.visible = isEVM;
            this.determineBtnSubmitCaption();
            this.chkCustomStartDate.checked = false;
            this.edtStartDate.value = this.isRenewal && this.renewalDate ? moment(this.renewalDate * 1000) : moment();
            this.edtStartDate.enabled = false;
            this.pnlCustomStartDate.visible = !this.isRenewal;
            this.lblStartDate.caption = this.isRenewal ? this.edtStartDate.value.format('DD/MM/YYYY hh:mm A') : "Now";
            this.lblStartDate.visible = true;
            this.updateBasePrice(isEVM);
            this.btnSubmit.visible = !isTelegram;
            const rule = discountRuleId ? discountRules.find(rule => rule.id === discountRuleId) : null;
            const isExpired = rule && rule.endTime && rule.endTime < moment().unix();
            if (isExpired) this.model.discountRuleId = undefined;
            if (rule && !isExpired) {
                if (!this.isRenewal && rule.startTime && rule.startTime > this.edtStartDate.value.unix()) {
                    this.edtStartDate.value = moment(rule.startTime * 1000);
                }
                this.edtDuration.value = rule.minDuration || "1";
                this.comboDurationUnit.selectedItem = this.model.durationUnits[0];
                this.model.discountApplied = rule;
                this._updateEndDate();
                this._updateTotalAmount();
            } else {
                this.edtDuration.value = durationInDays || "";
                this.handleDurationChanged();
            }
        } catch (error) { }
    }

    private handleTonWalletStatusChanged(isConnected: boolean) {
        if (isConnected) {
            this.btnSubmit.enabled = this.edtDuration.value && this.duration > 0 && Number.isInteger(this.duration);
        } else {
            this.btnSubmit.enabled = true;
        }
        this.determineBtnSubmitCaption();
    }

    private determineBtnSubmitCaption() {
        const paymentMethod = this.model.paymentMethod;
        if (paymentMethod === PaymentMethod.EVM) {
            if (!this.model.isClientWalletConnected()) {
              this.btnSubmit.caption = 'Connect Wallet';
              this.btnSubmit.enabled = true;
            }
            else if (!this.model.isRpcWalletConnected()) {
              this.btnSubmit.caption = 'Switch Network';
              this.btnSubmit.enabled = true;
            }
            else {
                this.btnSubmit.caption = this.isRenewal ? 'Renew Subscription' : 'Subscribe';
            }
        } else {
            if (!this.model.isTonWalletConnected) {
                this.btnSubmit.caption = 'Connect Wallet';
            }
            else {
                this.btnSubmit.caption = this.isRenewal ? 'Renew Subscription' : 'Subscribe';
            }
        }
    }

    private _updateEndDate() {
        if (!this.edtStartDate.value) {
            this.lblEndDate.caption = '-';
            return;
        }
        const dateFormat = 'YYYY-MM-DD hh:mm A';
        const startDate = moment(this.edtStartDate.value.format(dateFormat), dateFormat);
        this.lblEndDate.caption = startDate.add(this.duration, this.durationUnit).format('DD/MM/YYYY hh:mm A');
    }

    private _updateDiscount() {
        const days = this.model.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
        this.model.updateDiscount(this.duration, this.edtStartDate.value, days);
    }

    private _updateTotalAmount() {
        const currency = this.model.currency;
        if (!this.duration) this.lblOrderTotal.caption = `0 ${currency || ''}`;
        const days = this.model.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
        const { discountType, discountValue, discountAmount, totalAmount } = this.model.getDiscountAndTotalAmount(days);
        this.pnlDiscount.visible = discountType != null;
        if (this.pnlDiscount.visible) {
            this.lblDiscount.caption = discountType === 'Percentage' ? `Discount (${discountValue}%)` : 'Discount';
            this.lblDiscountAmount.caption = `-${this.model.formatNumber(discountAmount, 6)} ${currency || ''}`;
        }
        this.tokenAmountIn = totalAmount.toFixed();
        this.lblOrderTotal.caption = `${this.model.formatNumber(totalAmount, 6)} ${currency || ''}`;
        if (this.approvalModelAction) {
          this.approvalModelAction.checkAllowance(this.model.token, this.tokenAmountIn);
        }
    }

    private handleCustomCheckboxChange() {
        const isChecked = this.chkCustomStartDate.checked;
        this.edtStartDate.enabled = isChecked;
        const now = moment();
        if (isChecked) {
            if (this.edtStartDate.value.isBefore(now)) {
                this.edtStartDate.value = now;
            }
            this.lblStartDate.caption = this.edtStartDate.value.format('DD/MM/YYYY hh:mm A');
            this.edtStartDate.minDate = now;
        } else {
            this.edtStartDate.value = now;
            this.lblStartDate.caption = "Now";
            this._updateEndDate();
        }
    }

    private handleStartDateChanged() {
        this.lblStartDate.caption = this.edtStartDate.value.format('DD/MM/YYYY hh:mm A');
        this._updateEndDate();
        this._updateDiscount();
    }

    private handleDurationChanged() {
        this._updateEndDate();
        this._updateDiscount();
        this._updateTotalAmount();
        if (this.model.isTonWalletConnected) {
            this.btnSubmit.enabled = this.edtDuration.value && this.duration > 0 && Number.isInteger(this.duration);
        }
    }

    private handleDurationUnitChanged() {
        this._updateEndDate();
        this._updateDiscount();
        this._updateTotalAmount();
    }

    private onToggleDetail() {
        const isExpanding = this.detailWrapper.visible;
        this.detailWrapper.visible = !isExpanding;
        this.btnDetail.caption = `${isExpanding ? 'More' : 'Hide'} Information`;
        this.btnDetail.rightIcon.name = isExpanding ? 'caret-down' : 'caret-up';
    }

    private onViewMarketplaceContract() {
        this.model.viewExplorerByAddress(this.model.chainId, this.model.getContractAddress('ProductMarketplace') || "")
    }

    private onViewNFTContract() {
        const { tokenAddress } = this.model.getData();
        this.model.viewExplorerByAddress(this.model.chainId, tokenAddress);
    }

    private onViewToken() {
        const token = this.model.token;
        this.model.viewExplorerByAddress(this.model.chainId, token.address || token.symbol);
    }

    private updateCopyIcon(icon: Icon) {
        if (icon.name === 'check') return;
        icon.name = 'check';
        icon.fill = Theme.colors.success.main;
        setTimeout(() => {
            icon.fill = Theme.colors.primary.contrastText;
            icon.name = 'copy';
        }, 1600)
    }

    private onCopyMarketplaceContract(target: Icon) {
        application.copyToClipboard(this.model.getContractAddress('ProductMarketplace') || "");
        this.updateCopyIcon(target);
    }

    private onCopyNFTContract(target: Icon) {
        const { tokenAddress } = this.model.getData();
        application.copyToClipboard(tokenAddress);
        this.updateCopyIcon(target);
    }

    private onCopyToken(target: Icon) {
        const token = this.model.token;
        application.copyToClipboard(token.address || token.symbol);
        this.updateCopyIcon(target);
    }

    private showTxStatusModal = (status: 'warning' | 'success' | 'error', content?: string | Error, exMessage?: string) => {
        if (!this.txStatusModal) return;
        let params: any = { status };
        if (status === 'success') {
            params.txtHash = content;
        } else {
            params.content = content;
        }
        if (exMessage) {
            params.exMessage = exMessage;
        }
        this.txStatusModal.message = { ...params };
        this.txStatusModal.showModal();
    }

    private connectWallet = async () => {
        if (this.mdWallet) {
            await application.loadPackage('@scom/scom-wallet-modal', '*');
            this.mdWallet.networks = this.model.networks;
            this.mdWallet.wallets = this.model.wallets;
            this.mdWallet.showModal();
        }
    }

    private async onApprove() {
        this.showTxStatusModal('warning', `Approving`);
        await this.approvalModelAction.doApproveAction(this.model.token, this.tokenAmountIn);
    }

    private updateSubmitButton(submitting: boolean) {
        this.btnSubmit.rightIcon.spin = submitting;
        this.btnSubmit.rightIcon.visible = submitting;
    }

    private async doSubmitAction() {
        const days = this.model.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
        if (!this.isRenewal && !this.chkCustomStartDate.checked) {
            this.edtStartDate.value = moment();
        }
        const recipient = (this.comboRecipient.selectedItem as IComboItem)?.value;
        try {
            if (!this.edtStartDate.value) {
                throw new Error('Start Date Required');
            }
            const _duration = Number(this.edtDuration.value) || 0;
            if (!_duration || _duration <= 0 || !Number.isInteger(_duration)) {
                throw new Error(!this.edtDuration.value ? 'Duration Required' : 'Invalid Duration');
            }
            this.updateSubmitButton(true);
            const startTime = this.edtStartDate.value.unix();
            const duration = days * 86400;
            const callback = (error: Error, receipt?: string) => {
                if (error) {
                    this.showTxStatusModal('error', error);
                }
            };
            const confirmationCallback = async () => {
                this.model.productInfo = await this.model.fetchProductInfo(this.model.productId);
                this.updateSpotsRemaining();
                if (this.onSubscribed) this.onSubscribed();
            };
            if (this.isRenewal) {
                await this.model.renewSubscription(duration, recipient, callback, confirmationCallback);
            } else {
                await this.model.subscribe(startTime, duration, recipient, callback, confirmationCallback);
            }
        } catch (error) {
            this.showTxStatusModal('error', error);
        }
        this.updateSubmitButton(false);
    }

    private async onSubmit() {
        const paymentMethod = this.model.paymentMethod;
        if (paymentMethod === PaymentMethod.EVM) {
            if (!this.model.isClientWalletConnected()) {
                this.connectWallet();
                return;
            }
            if (!this.model.isRpcWalletConnected()) {
                await this.model.switchNetwork(this.model.chainId);
                return;
            }
            this.showTxStatusModal('warning', 'Confirming');
            this.approvalModelAction.doPayAction();
        } else if (paymentMethod === PaymentMethod.TON) {
            if (!this.model.isTonWalletConnected) {
                this.model.connectTonWallet();
                return;
            }
            try {
                this.updateSubmitButton(true);
                const startTime = this.edtStartDate.value.unix();
                const endTime = moment.unix(startTime).add(this.duration, this.durationUnit).unix();
                const days = this.model.getDurationInDays(this.duration, this.durationUnit, this.edtStartDate.value);
                await this.model.tonPayment(startTime, endTime, days);
                if (this.onSubscribed) this.onSubscribed();
            } catch (error) {
                this.showTxStatusModal('error', error);
            }
            this.updateSubmitButton(false);
        }
    }

    init() {
        const moduleDir = this['currentModuleDir'] || path;
        this.model = new Model(this, moduleDir);
        super.init();
        this.model.onTonWalletStatusChanged = this.handleTonWalletStatusChanged.bind(this);
        this.model.onChainChanged = this.onChainChanged.bind(this);
        this.model.onWalletConnected = this.onWalletConnected.bind(this);
        this.model.refreshDappContainer = this.refreshDappContainer.bind(this);
        this.model.updateUIBySetData = this.updateUIBySetData.bind(this);
        this.handleDurationChanged = this.handleDurationChanged.bind(this);
        const durationUnits = this.model.durationUnits;
        this.comboDurationUnit.items = durationUnits;
        this.comboDurationUnit.selectedItem = durationUnits[0];
    }

    render() {
        return (
            <i-panel>
                <i-scom-dapp-container id="containerDapp">
                    <i-stack
                        id="pnlHeader"
                        direction="horizontal"
                        alignItems="center"
                        justifyContent="end"
                        padding={{ top: '0.5rem', bottom: '0.5rem', left: '1.75rem', right: '1.75rem' }}
                        background={{ color: Theme.background.modal }}
                    >
                    </i-stack>
                    <i-panel background={{ color: Theme.background.main }}>
                        <i-stack
                            id="pnlLoading"
                            direction="vertical"
                            height="100%"
                            alignItems="center"
                            justifyContent="center"
                            padding={{ top: "1rem", bottom: "1rem", left: "1rem", right: "1rem" }}
                            visible={false}
                        >
                            <i-panel class={'spinner'}></i-panel>
                        </i-stack>
                        <i-stack direction="vertical" padding={{ top: '1.5rem', bottom: '1.25rem', left: '1.25rem', right: '1.5rem' }} alignItems="center">
                            <i-stack direction="vertical" width="100%" maxWidth={600} gap='0.5rem'>
                                <i-stack id="pnlBody" direction="vertical" gap="0.5rem">
                                    <i-stack id='pnlRecipient' width='100%' direction="horizontal" alignItems="center" justifyContent="space-between" gap={10} visible={false}>
                                        <i-label caption='Wallet Address to Receive NFT' stack={{ shrink: '0' }} font={{ bold: true, size: '1rem' }}></i-label>
                                        <i-combo-box
                                            id="comboRecipient"
                                            height={36}
                                            width="100%"
                                            icon={{ width: 14, height: 14, name: 'angle-down', fill: Theme.divider }}
                                            border={{ width: 1, style: 'solid', color: Theme.divider, radius: 5 }}
                                        ></i-combo-box>
                                    </i-stack>
                                    <i-stack direction="horizontal" width="100%" alignItems="center" justifyContent="space-between" gap={10}>
                                        <i-label caption="Start Date" font={{ bold: true, size: '1rem' }}></i-label>
                                        <i-label id="lblStartDate" font={{ size: '1rem' }} />
                                    </i-stack>
                                    <i-stack id="pnlCustomStartDate" direction="horizontal" width="100%" alignItems="center" justifyContent="space-between" gap={10} visible={false}>
                                        <i-checkbox id="chkCustomStartDate" height="auto" caption="Custom" onChanged={this.handleCustomCheckboxChange}></i-checkbox>
                                        <i-panel width="50%">
                                            <i-datepicker
                                                id="edtStartDate"
                                                height={36}
                                                width="100%"
                                                type="dateTime"
                                                dateTimeFormat="DD/MM/YYYY hh:mm A"
                                                placeholder="dd/mm/yyyy hh:mm A"
                                                background={{ color: Theme.input.background }}
                                                font={{ size: '1rem' }}
                                                border={{ radius: "0.375rem" }}
                                                onChanged={this.handleStartDateChanged}
                                            ></i-datepicker>
                                        </i-panel>
                                    </i-stack>
                                    <i-stack direction="horizontal" width="100%" alignItems="center" justifyContent="space-between" gap={10}>
                                        <i-label caption="Duration" font={{ bold: true, size: '1rem' }}></i-label>
                                        <i-stack direction="horizontal" width="50%" alignItems="center" gap="0.5rem">
                                            <i-panel width="50%">
                                                <i-input
                                                    id="edtDuration"
                                                    height={36}
                                                    width="100%"
                                                    class={inputStyle}
                                                    inputType='number'
                                                    font={{ size: '1rem' }}
                                                    border={{ radius: 4, style: 'none' }}
                                                    padding={{ top: '0.25rem', bottom: '0.25rem', left: '0.5rem', right: '0.5rem' }}
                                                    onChanged={this.handleDurationChanged}
                                                >
                                                </i-input>
                                            </i-panel>
                                            <i-panel width="50%">
                                                <i-combo-box
                                                    id="comboDurationUnit"
                                                    height={36}
                                                    width="100%"
                                                    icon={{ width: 14, height: 14, name: 'angle-down', fill: Theme.divider }}
                                                    border={{ width: 1, style: 'solid', color: Theme.divider, radius: 5 }}
                                                    onChanged={this.handleDurationUnitChanged}
                                                ></i-combo-box>
                                            </i-panel>
                                        </i-stack>
                                    </i-stack>
                                    <i-stack direction="horizontal" width="100%" alignItems="center" justifyContent="space-between" gap={10}>
                                        <i-label caption="End Date" font={{ bold: true, size: '1rem' }}></i-label>
                                        <i-label id="lblEndDate" font={{ size: '1rem' }} />
                                    </i-stack>
                                    <i-stack direction="horizontal" width="100%" alignItems="center" justifyContent="space-between" gap={10}>
                                        <i-label caption='Base Price' font={{ bold: true, size: '1rem' }}></i-label>
                                        <i-label id='lblBasePrice' font={{ size: '1rem' }}></i-label>
                                    </i-stack>
                                    <i-stack
                                        id="pnlDiscount"
                                        direction="horizontal"
                                        width="100%"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        gap="0.5rem"
                                        lineHeight={1.5}
                                        visible={false}
                                    >
                                        <i-label id="lblDiscount" caption="Discount" font={{ bold: true, size: '1rem' }}></i-label>
                                        <i-label id="lblDiscountAmount" font={{ size: '1rem' }}></i-label>
                                    </i-stack>
                                    <i-stack
                                        width="100%"
                                        direction="horizontal"
                                        justifyContent="space-between"
                                        alignItems='center'
                                        gap="0.5rem"
                                        lineHeight={1.5}
                                    >
                                        <i-stack direction="horizontal" alignItems='center' gap="0.5rem">
                                            <i-label caption='You will pay' font={{ bold: true, size: '1rem' }}></i-label>
                                        </i-stack>
                                        <i-label id='lblOrderTotal' font={{ size: '1rem' }} caption="0"></i-label>
                                    </i-stack>
                                    <i-stack id="pnlDetail" direction="vertical" gap="0.5rem">
                                        <i-stack direction="vertical" width="100%" alignItems="center" justifyContent="space-between" gap="0.5rem" lineHeight={1.5}>
                                            <i-label id="lblSpotsRemaining" font={{ bold: true, size: '1rem' }} />
                                        </i-stack>
                                        <i-button
                                            id="btnDetail"
                                            caption="More Information"
                                            rightIcon={{ width: 10, height: 16, margin: { left: 5 }, fill: Theme.text.primary, name: 'caret-down' }}
                                            background={{ color: 'transparent' }}
                                            border={{ width: 1, style: 'solid', color: Theme.text.primary, radius: 8 }}
                                            width={280}
                                            maxWidth="100%"
                                            height={36}
                                            margin={{ top: 4, bottom: 16, left: 'auto', right: 'auto' }}
                                            onClick={this.onToggleDetail}
                                            visible={false}
                                        />
                                        <i-hstack id="detailWrapper" horizontalAlignment="space-between" gap={10} visible={false} wrap="wrap">
                                            <i-hstack width="100%" justifyContent="space-between" gap="0.5rem" lineHeight={1.5}>
                                                <i-label caption="Marketplace Contract Address" font={{ bold: true, size: '1rem' }} />
                                                <i-hstack gap="0.25rem" verticalAlignment="center" maxWidth="calc(100% - 75px)">
                                                    <i-label id="lblMarketplaceContract" font={{ size: '1rem', color: Theme.colors.primary.main }} textDecoration="underline" class={linkStyle} onClick={this.onViewMarketplaceContract} />
                                                    <i-icon fill={Theme.text.primary} name="copy" width={16} height={16} onClick={this.onCopyMarketplaceContract} cursor="pointer" />
                                                </i-hstack>
                                            </i-hstack>
                                            <i-hstack width="100%" justifyContent="space-between" gap="0.5rem" lineHeight={1.5}>
                                                <i-label caption="NFT Contract Address" font={{ bold: true, size: '1rem' }} />
                                                <i-hstack gap="0.25rem" verticalAlignment="center" maxWidth="calc(100% - 75px)">
                                                    <i-label id="lblNFTContract" font={{ size: '1rem', color: Theme.colors.primary.main }} textDecoration="underline" class={linkStyle} onClick={this.onViewNFTContract} />
                                                    <i-icon fill={Theme.text.primary} name="copy" width={16} height={16} onClick={this.onCopyNFTContract} cursor="pointer" />
                                                </i-hstack>
                                            </i-hstack>
                                            <i-hstack width="100%" justifyContent="space-between" gap="0.5rem" lineHeight={1.5}>
                                                <i-label caption="Token used for payment" font={{ bold: true, size: '1rem' }} />
                                                <i-hstack gap="0.25rem" verticalAlignment="center" maxWidth="calc(100% - 75px)">
                                                    <i-label id="lblToken" font={{ size: '1rem', color: Theme.colors.primary.main }} textDecoration="underline" class={linkStyle} onClick={this.onViewToken} />
                                                    <i-icon id="iconCopyToken" visible={false} fill={Theme.text.primary} name="copy" width={16} height={16} onClick={this.onCopyToken} cursor="pointer" />
                                                </i-hstack>
                                            </i-hstack>
                                        </i-hstack>
                                    </i-stack>
                                    <i-stack direction="vertical" width="100%" justifyContent="center" alignItems="center" margin={{ top: '0.5rem' }} gap={8}>
                                        <i-button
                                            id="btnApprove"
                                            width='100%'
                                            caption="Approve"
                                            padding={{ top: '1rem', bottom: '1rem', left: '1rem', right: '1rem' }}
                                            font={{ size: '1rem', color: Theme.colors.primary.contrastText, bold: true }}
                                            rightIcon={{ visible: false, fill: Theme.colors.primary.contrastText }}
                                            background={{ color: Theme.background.gradient }}
                                            border={{ radius: 12 }}
                                            visible={false}
                                            onClick={this.onApprove}
                                        ></i-button>
                                        <i-button
                                            id='btnSubmit'
                                            width='100%'
                                            caption='Subscribe'
                                            padding={{ top: '1rem', bottom: '1rem', left: '1rem', right: '1rem' }}
                                            font={{ size: '1rem', color: Theme.colors.primary.contrastText, bold: true }}
                                            rightIcon={{ visible: false, fill: Theme.colors.primary.contrastText }}
                                            background={{ color: Theme.background.gradient }}
                                            border={{ radius: 12 }}
                                            enabled={false}
                                            onClick={this.onSubmit}
                                        ></i-button>
                                    </i-stack>
                                </i-stack>
                            </i-stack>
                        </i-stack>
                        <i-scom-wallet-modal id="mdWallet" wallets={[]} />
                        <i-scom-tx-status-modal id="txStatusModal" />
                    </i-panel>
                </i-scom-dapp-container>
            </i-panel>
        )
    }
}