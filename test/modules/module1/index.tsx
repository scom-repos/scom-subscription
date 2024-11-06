import { application, Container, customModule, Module } from '@ijstech/components';
import ScomSubscription from '@scom/scom-subscription';
import { INetwork } from '@ijstech/eth-wallet';

@customModule
export default class Module1 extends Module {
  private subscription: ScomSubscription;

  constructor(parent?: Container, options?: any) {
    super(parent, options);
  }


  async init() {
    super.init();
    const builder = this.subscription.getConfigurators().find((conf: any) => conf.target === 'Builders');
    builder.setData({
      "name": "Ton Policy",
      "tokenAmount": "0.001",
      "currency": "TON",
      "durationInDays": 1,
      "discountRules": [],
      "affiliates": [],
      "recipient": "UQCy7Fo9RLV7l5bSb_vlR7X7s0GJHJsdWb4Lgly_7qgYtbfc",
      "communityId": "EcoInnovatorsHub",
      "creatorId": "npub1lxfc972evue6nrhfam5djmp8c2afhnl5dky8c4kwveltg0tz3mzsj4wlcx"
    });
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