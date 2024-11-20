import { FormatUtils } from "@ijstech/application";
import { BigNumber } from "@ijstech/eth-wallet";

function formatNumber(value: number | string | BigNumber, decimalFigures?: number) {
    if (typeof value === 'object') {
        value = value.toFixed();
    }
    const minValue = '0.0000001';
    return FormatUtils.formatNumber(value, { decimalFigures: decimalFigures !== undefined ? decimalFigures : 4, minValue, hasTrailingZero: false });
};

export {
    formatNumber
}