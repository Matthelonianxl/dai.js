import { mcdMaker, setupCollateral } from '../helpers';
import { ETH, BAT, MDAI } from '../../src';
import { takeSnapshot, restoreSnapshot } from '@makerdao/test-helpers';
import { fromWei } from '../../src/utils';
import { ServiceRoles } from '../../src/constants';

import schemas, {
  ILK_PRICE,
  ILK_PRICES,
  VAULT_ILK_AND_URN,
  VAULT_BY_ID,
  SAVINGS_DAI
} from '../../src/schemas';

let maker, address, snapshotData;

const ETH_A_COLLATERAL_AMOUNT = ETH(1);
const ETH_A_DEBT_AMOUNT = MDAI(1);
const ETH_A_PRICE = 180;

const BAT_A_COLLATERAL_AMOUNT = BAT(1);
const BAT_A_DEBT_AMOUNT = MDAI(1);
const BAT_A_PRICE = 40;

beforeAll(async () => {
  snapshotData = await takeSnapshot(maker);
  maker = await mcdMaker({
    cdpTypes: [
      { currency: ETH, ilk: 'ETH-A' },
      { currency: BAT, ilk: 'BAT-A' }
    ],
    multicall: true
  });

  maker.service('multicall').createWatcher({ interval: 'block' });
  maker.service('multicall').registerSchemas(schemas);
  maker.service('multicall').start();

  address = maker.service('web3').currentAddress();
  await setupCollateral(maker, 'ETH-A', {
    price: ETH_A_PRICE
  });
  await setupCollateral(maker, 'BAT-A', { price: BAT_A_PRICE });

  const mgr = await maker.service(ServiceRoles.CDP_MANAGER);
  const sav = await maker.service(ServiceRoles.SAVINGS);
  const dai = maker.getToken(MDAI);
  const _proxyAddress = await maker.service('proxy').ensureProxy();
  await dai.approveUnlimited(_proxyAddress);

  await mgr.openLockAndDraw(
    'ETH-A',
    ETH_A_COLLATERAL_AMOUNT,
    ETH_A_DEBT_AMOUNT
  );
  await mgr.openLockAndDraw(
    'BAT-A',
    BAT_A_COLLATERAL_AMOUNT,
    BAT_A_DEBT_AMOUNT
  );

  await sav.join(MDAI(1));
});

afterAll(async () => {
  await restoreSnapshot(snapshotData, maker);
});

test(ILK_PRICE, async () => {
  const ethAPrice = await maker.latest(ILK_PRICE, 'ETH-A');
  expect(ethAPrice.toNumber()).toEqual(180);
  expect(ethAPrice.symbol).toEqual('USD/ETH');
});

test(ILK_PRICES, async () => {
  const [ethAPrice, ethBPrice, batAPrice] = await maker.latest(ILK_PRICES, [
    'ETH-A',
    'ETH-B',
    'BAT-A'
  ]);

  expect(ethAPrice.toNumber()).toEqual(180);
  expect(ethBPrice.toNumber()).toEqual(150);
  expect(batAPrice.toNumber()).toEqual(40);

  expect(ethAPrice.symbol).toEqual('USD/ETH');
  expect(ethBPrice.symbol).toEqual('USD/ETH');
  expect(batAPrice.symbol).toEqual('USD/BAT');
});

test(VAULT_ILK_AND_URN, async () => {
  const cdpId = 1;
  const expectedIlk = 'ETH-A';
  const expectedUrn = '0x6D43e8f5A6D2b5aD2b242A1D3CF957C71AfC48a1';
  const [ilk, urn] = await maker.latest(VAULT_ILK_AND_URN, cdpId);
  expect(ilk).toEqual(expectedIlk);
  expect(urn).toEqual(expectedUrn);
});

test(VAULT_BY_ID, async () => {
  const cdpId = 1;
  const expectedIlk = 'ETH-A';
  const expectedUrn = '0x6D43e8f5A6D2b5aD2b242A1D3CF957C71AfC48a1';
  const expectedInk = fromWei(1000000000000000000);
  const expectedArt = fromWei(995000000000000000);
  const { ilk, urn, encumberedCollateral, encumberedDebt } = await maker.latest(
    VAULT_BY_ID,
    cdpId
  );

  expect(ilk).toEqual(expectedIlk);
  expect(urn).toEqual(expectedUrn);
  expect(encumberedCollateral).toEqual(expectedInk);
  expect(encumberedDebt.toNumber()).toBeCloseTo(expectedArt.toNumber());
});

test(SAVINGS_DAI, async () => {
  const savingsDai = await maker.latest(SAVINGS_DAI, address);
  expect(savingsDai.symbol).toEqual('CHAI');
  expect(savingsDai.toNumber()).toBeCloseTo(0.99995);
});