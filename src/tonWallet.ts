import { RequireJS } from "@ijstech/components";
import { Utils } from "@ijstech/eth-wallet";
import { ITokenObject } from "@scom/scom-token-list";

const JETTON_TRANSFER_OP = 0xf8a7ea5; // 32-bit
type NetworkType = 'mainnet' | 'testnet';

export class TonWallet {
    private toncore: any;
    private tonConnectUI: any;
    private _isWalletConnected: boolean = false;
    private _onTonWalletStatusChanged: (isConnected: boolean) => void;
    private networkType: NetworkType = 'testnet';

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

    getWalletAddress() {
        const rawAddress = this.tonConnectUI.account?.address;
        const nonBounceableAddress = this.toncore.Address.parse(rawAddress).toString({ bounceable: false })
        return nonBounceableAddress;
    }

    private getTonCenterAPIEndpoint(): string {
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
            alert(err)
        }
    }

    async sendTransaction(txData: any) {
        return await this.tonConnectUI.sendTransaction(txData);
    }

    constructPayload(msg: string) {
        const body = this.toncore.beginCell()
            .storeUint(0, 32)
            .storeStringTail(msg)
            .endCell();
        const payload = body.toBoc().toString("base64");
        return payload;
    }

    constructPayloadForTokenTransfer(
        to: string,
        amount: string,
        msg: string
    ): string {
        const recipientAddress = this.toncore.Address.parse(to);

        const forwardPayload = this.toncore.beginCell()
            .storeUint(0, 32) // 0 opcode means we have a comment
            .storeStringTail(msg)
            .endCell();

        const bodyCell = this.toncore.beginCell()
            .storeUint(JETTON_TRANSFER_OP, 32)  // function ID
            .storeUint(0, 64)                  // query_id (can be 0 or a custom value)
            .storeCoins(amount)          // amount in nano-jettons
            .storeAddress(recipientAddress)    // destination
            .storeAddress(null)        // response_destination (set to NULL if you don't need callback)
            .storeMaybeRef(null)               // custom_payload (None)
            .storeCoins(this.toncore.toNano('0.02'))        // forward_ton_amount (some TON to forward, e.g. 0.02)
            .storeMaybeRef(forwardPayload)              
            .endCell();

        return bodyCell.toBoc().toString('base64');
    }

    getTransactionMessageHash(boc: string) {
        const cell = this.toncore.Cell.fromBase64(boc);
        const hashBytes = cell.hash();
        const messageHash = hashBytes.toString('base64');
        return messageHash;
    }

    buildOwnerSlice(userAddress: string): string {
        const owner = this.toncore.Address.parse(userAddress);
        const cell = this.toncore.beginCell()
            .storeAddress(owner)
            .endCell();
        return cell.toBoc().toString('base64');
    }

    async getJettonWalletAddress(jettonMasterAddress: string, userAddress: string) {
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
        }) as string;
    }

    async transferToken(
        to: string,
        token: ITokenObject,
        amount: string,
        msg: string,
        callback?: (error: Error, receipt?: string) => Promise<void>,
        confirmationCallback?: (receipt: any) => Promise<void>
    ) {
        let result: any;
        let messageHash: string;
        try {
            if (!token.address) {
                const payload = this.constructPayload(msg);
                const transaction = {
                    validUntil: Math.floor(Date.now() / 1000) + 60, // 60 sec
                    messages: [
                        {
                            address: to,
                            amount: Utils.toDecimals(amount, 9).toFixed(),
                            payload: payload
                        }
                    ]
                };
                result = await this.sendTransaction(transaction);
            }
            else {
                const senderJettonAddress = await this.getJettonWalletAddress(token.address, this.getWalletAddress());
                const jettonAmount = Utils.toDecimals(amount, token.decimals).toFixed();
                const payload = this.constructPayloadForTokenTransfer(to, jettonAmount, msg);
                const transaction = {
                    validUntil: Math.floor(Date.now() / 1000) + 60, // 60 sec
                    messages: [
                        {
                            address: senderJettonAddress,
                            amount: Utils.toDecimals('0.05', 9),
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
