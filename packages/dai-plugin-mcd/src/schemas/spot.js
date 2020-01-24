import { toHex, fromRay } from '../utils';
import { createCurrency, createCurrencyRatio } from '@makerdao/currency';
import { MDAI, USD } from '../..';

import {
  PRICE_FEED_ADDRESS,
  LIQUIDATION_RATIO,
  RATIO_DAI_USD
} from './constants';

// The liquidation ratio value is the ratio between the minimum dollar amount of a unit of
// collateral in terms of a single dollar unit amount of debt in which the system does not
// deem a vault of that collateral type (ilk) underwater
//
// In plain english, it is the ratio of the dollar amount of ETH in terms of
// the dollar amount of dai
export const spotIlks = {
  generate: collateralTypeName => ({
    id: `MCD_SPOT.ilks(${collateralTypeName})`,
    contractName: 'MCD_SPOT',
    call: ['ilks(bytes32)(address,uint256)', toHex(collateralTypeName)],
    transforms: {
      [LIQUIDATION_RATIO]: liqRatio =>
        createCurrencyRatio(
          createCurrency(`(${collateralTypeName.split('-')[0]}/USD)`),
          createCurrency(`(${MDAI.symbol}/USD)`)
        )(fromRay(liqRatio))
    }
  }),
  returns: [[PRICE_FEED_ADDRESS], [LIQUIDATION_RATIO]]
};

export const spotPar = {
  generate: () => ({
    id: 'MCD_SPOT.par()',
    contractName: 'MCD_SPOT',
    call: ['par()(uint256)']
  }),
  returns: [[RATIO_DAI_USD, v => createCurrencyRatio(MDAI, USD)(fromRay(v))]]
};

// export const liquidationRatio = {
//   // The liquidation ratio value is the ratio between the minimum dollar amount of a unit of
//   // collateral in terms of a single dollar unit amount of debt in which the system does not
//   // deem a vault of that collateral type (ilk) underwater
//   //
//   // In plain english, it is the ratio of the dollar amount of ETH in terms of
//   // the dollar amount of dai
//   generate: collateralTypeName => ({
//     dependencies: () => [[RAW_LIQUIDATION_RATIO, collateralTypeName]],
//     computed: liqRatio =>
//       createCurrencyRatio(
//         createCurrency(`(${collateralTypeName.split('-')[0]}/USD)`),
//         createCurrency(`(${MDAI.symbol}/USD)`)
//       )(liqRatio)
//   })
// };

export default {
  spotIlks,
  spotPar
};
