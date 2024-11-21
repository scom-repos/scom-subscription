import { FormatUtils, moment } from "@ijstech/components";
import { BigNumber } from "@ijstech/eth-wallet";

function getDurationInDays(duration: number, unit: 'days' | 'months' | 'years', startDate: any) {
    if (unit === 'days') {
        return duration;
    } else {
        const dateFormat = 'YYYY-MM-DD';
        const start = startDate ? moment(startDate.format(dateFormat), dateFormat) : moment();
        const end = moment(start).add(duration, unit);
        const diff = end.diff(start, 'days');
        return diff;
    }
}

function formatNumber(value: number | string | BigNumber, decimalFigures?: number) {
    if (typeof value === 'object') {
        value = value.toFixed();
    }
    const minValue = '0.0000001';
    return FormatUtils.formatNumber(value, { decimalFigures: decimalFigures !== undefined ? decimalFigures : 4, minValue, hasTrailingZero: false });
};

export {
    getDurationInDays,
    formatNumber
}