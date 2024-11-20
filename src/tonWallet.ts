import { RequireJS } from "@ijstech/components";

export class TonWallet {
    private toncore: any;
    private tonConnectUI: any;
    private _isWalletConnected: boolean = false;
    private _onTonWalletStatusChanged: (isConnected: boolean) => void;

    constructor(
        moduleDir: string, 
        onTonWalletStatusChanged: (isConnected: boolean) => void
    ) {
        this.loadLib(moduleDir);
        this._onTonWalletStatusChanged = onTonWalletStatusChanged;
        this.initWallet();
    }

    get isWalletConnected() {
        return this._isWalletConnected;
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

    initWallet() {
        try {
            let UI = window['TON_CONNECT_UI'];
            if (!this.tonConnectUI) {
                this.tonConnectUI = new UI.TonConnectUI({
                    manifestUrl: 'https://ton.noto.fan/tonconnect/manifest.json',
                    buttonRootId: 'pnlHeader'
                });
            }
            this.tonConnectUI.connectionRestored.then(async (restored: boolean) => {
                this._isWalletConnected = this.tonConnectUI.connected;
                if (this._onTonWalletStatusChanged) this._onTonWalletStatusChanged(this._isWalletConnected);
            });
            this.tonConnectUI.onStatusChange((walletAndwalletInfo) => {
                this._isWalletConnected = !!walletAndwalletInfo;
                if (this._onTonWalletStatusChanged) this._onTonWalletStatusChanged(this._isWalletConnected);
            });
        } catch (err) {
            // alert(err)
            console.log(err);
        }
    }

    async connectWallet() {
        try {
            await this.tonConnectUI.openModal();
        }
        catch (err) {
            alert(err)
        }
    }

    async sendTransaction(txData: any) {
        return await this.tonConnectUI.sendTransaction(txData);
    }
}
