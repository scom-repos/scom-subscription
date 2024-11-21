import ScomWalletModal from "@scom/scom-wallet-modal";
import {
    application,
    Component
} from "@ijstech/components";
import { ContractInfoByChainType, ContractType, IExtendedNetwork, INetworkConfig, IWalletPlugin } from "./interface";
import { Constants, IEventBusRegistry, INetwork, Wallet } from "@ijstech/eth-wallet";
import getNetworkList from "@scom/scom-network-list";
import configData from './data.json';

class EventEmitter {
    private events: { [key: string]: Function[] } = {};

    on(event: string, listener: Function) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    off(event: string, listener: Function) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }

    emit(event: string, data?: any) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(data));
    }
}

export class EVMWallet extends EventEmitter {
    private mdEVMWallet: ScomWalletModal;
    private _wallets: IWalletPlugin[];
    private _networks: INetworkConfig[];
    private rpcWalletEvents: IEventBusRegistry[] = [];
    private rpcWalletId: string = '';
    private defaultChainId: number;
    private _chainId: number;
    private infuraId: string = '';
    private defaultNetworks: INetworkConfig[];
    private defaultWallets: IWalletPlugin[] = [
        {
            "name": "metamask"
        },
        {
            "name": "walletconnect"
        }
    ];
    private contractInfoByChain: ContractInfoByChainType = {};
    private networkMap: { [key: number]: IExtendedNetwork };
    
    get wallets() {
        return this._wallets ?? this.defaultWallets;
    }

    set wallets(value: IWalletPlugin[]) {
        this._wallets = value;
    }

    get networks() {
        const nets = this._networks ?? this.defaultNetworks;
        if (this._chainId && !nets.some(v => v.chainId === this._chainId)) {
            nets.push({ chainId: this._chainId });
        }
        return nets;
    }

    set networks(value: INetworkConfig[]) {
        this._networks = value;
    }

    constructor() {
        super();
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
    }

    setData(data: {wallets: IWalletPlugin[], networks: INetworkConfig[], chainId: number, defaultChainId: number}) {
        const { wallets, networks, chainId, defaultChainId } = data;
        this.wallets = wallets;
        this.networks = networks;
        this._chainId = chainId;
        this.defaultChainId = defaultChainId || 0;
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
        this.initRpcWallet(this._chainId || this.defaultChainId);
        const rpcWallet = this.getRpcWallet();
        const chainChangedEvent = rpcWallet.registerWalletEvent(this, Constants.RpcWalletEvent.ChainChanged, async (chainId: number) => {
            this.emit("chainChanged");
        });
        const connectedEvent = rpcWallet.registerWalletEvent(this, Constants.RpcWalletEvent.Connected, async (connected: boolean) => {
            this.emit("walletConnected");
        });
        this.rpcWalletEvents.push(chainChangedEvent, connectedEvent);
        const dappContainerData = this.getDappContainerData();
        this.emit("walletUpdated", dappContainerData);
    }

    private getDappContainerData = () => {
        const rpcWallet = this.getRpcWallet();
        const chainId = this._chainId || rpcWallet?.chainId;
        const containerData = {
            defaultChainId: this._chainId || this.defaultChainId,
            wallets: this.wallets,
            networks: chainId ? [{ chainId: chainId }] : this.networks,
            rpcWalletId: rpcWallet.instanceId,
            showHeader: true
        }
        return containerData;
    }

    updateDappContainerData() {
        const dappContainerData = this.getDappContainerData();
        this.emit("walletUpdated", dappContainerData);
    }

    getRpcWallet() {
        return this.rpcWalletId ? Wallet.getRpcWalletInstance(this.rpcWalletId) : null;
    }

    async connectWallet(modalContainer: Component) {
        if (!this.mdEVMWallet) {
            await application.loadPackage('@scom/scom-wallet-modal', '*');
            this.mdEVMWallet = new ScomWalletModal();
            modalContainer.append(this.mdEVMWallet);
        }
        await this.mdEVMWallet.setData({
            networks: this.networks,
            wallets: this.wallets
        })
        this.mdEVMWallet.showModal();
    }

    isWalletConnected() {
        const wallet = Wallet.getClientInstance();
        return wallet.isConnected;
    }

    isNetworkConnected() {
        const wallet = this.getRpcWallet();
        return wallet?.isConnected;
    }

    getContractAddress(type: ContractType) {
        const rpcWallet = this.getRpcWallet();
        const contracts = this.contractInfoByChain[rpcWallet.chainId] || {};
        return contracts[type]?.address;
    }

    async switchNetwork(chainId: number) {
        const wallet = Wallet.getClientInstance();
        await wallet.switchNetwork(chainId);
    }

    getNetworkInfo(chainId: number) {
        return this.networkMap[chainId];
    }

    viewExplorerByAddress(chainId: number, address: string) {
        let network = this.getNetworkInfo(chainId);
        if (network && network.explorerAddressUrl) {
            let url = `${network.explorerAddressUrl}${address}`;
            window.open(url);
        }
    }
}
