import { application, Container, customModule, Module } from '@ijstech/components';
import { getMulticallInfoList } from '@scom/scom-multicall';
import ScomSubscription from '@scom/scom-subscription';
import { INetwork } from '@ijstech/eth-wallet';

@customModule
export default class Module1 extends Module {
  private subscription: ScomSubscription;
  private tonData = {
    "name": "Ton Policy",
    "tokenAmount": "0.001",
    "currency": "TON",
    "durationInDays": 1,
    "discountRules": [],
    "affiliates": [],
    "recipient": "UQCy7Fo9RLV7l5bSb_vlR7X7s0GJHJsdWb4Lgly_7qgYtbfc",
    "communityId": "EcoInnovatorsHub",
    "creatorId": "npub1lxfc972evue6nrhfam5djmp8c2afhnl5dky8c4kwveltg0tz3mzsj4wlcx"
  };
  private evmData = {
    "name": "Pay By BNB",
    "paymentModel": "Subscription",
    "chainId": 97,
    "tokenAddress": "0xA0Afb051902675707Adc709aCFac2AD15562D9f9",
    "tokenType": "ERC721",
    "tokenAmount": 0.01,
    "currency": "0x0000000000000000000000000000000000000000",
    "durationInDays": 1,
    "discountRules": [],
    "commissionRate": "5",
    "affiliates": [
      "0xb15E094957c31D6b0d08714015fF85Bec7842635"
    ],
    "paymentMethod": "EVM",
    "wallets": [
      { name: 'metamask' }
    ]
  };

  constructor(parent?: Container, options?: any) {
    super(parent, options);
    const multicalls = getMulticallInfoList();
    application.store = {
      infuraId: options.infuraId,
      multicalls
    }
  }


  async init() {
    super.init();
    const builder = this.subscription.getConfigurators().find((conf: any) => conf.target === 'Builders');
    builder.setData(this.evmData);
  }

  render() {
    return (
      <i-stack
        direction="vertical"
        margin={{ top: '1rem', left: '1rem', right: '1rem' }}
        gap="1rem"
      >
        <i-scom-subscription id="subscription"></i-scom-subscription>
      </i-stack>
    )
  }
}