import { BigNumber, Contract,  providers,utils  } from 'ethers';
import * as BEP20 from './contract/BEP20/bep20.js';
import * as PancakeFactory from './contract/pancake-v2/factory.js';
import hpAbi from './contract/honeypotChecker.js'
import Web3 from 'web3';
import { addresses,getTopHolders,checkforHoneyPot,isTokenNotVerified,getContractSrc,isQuoteToken, getContractCreator } from './lib/helper.js'; 
 import { BscScan } from "@jpmonette/bscscan";
import axios from 'axios';
import logger from './lib/logger.js';
import HoneypotCheckerCaller from './lib/HoneypotCheckerCaller.js';

const provider = new providers.WebSocketProvider("wss://bsc-mainnet.nodereal.io/ws/v1/ea49d5c625d34b069be219d151e4f1e8")
 const web3 = new Web3(addresses.RPC); 
 const strJsonRpcProvider = 'https://bsc-dataseed1.binance.org';

 const bscProvider = new providers.JsonRpcProvider(strJsonRpcProvider);
 
const contractAdd='0x15e061934ed41ed0508ec4ab035883ee1a220b71';

const holders = await getContractCreator(contractAdd);

let tokenContract = new Contract(contractAdd, BEP20.TokenABI, bscProvider);

console.log(holders.data.result[0].contractCreator);

const bal = await tokenContract.balanceOf(holders.data.result[0].contractCreator);
console.log(bal);


const isContract =async(tokenAddress)=>{
    const res = await web3.eth.getCode(tokenAddress)
    return res.length > 5
}

console.log(await isContract(contractAdd));
console.log(await isContract("0x61Dd481A114A2E761c554B641742C973867899D3"));
 

const veri = await getContractSrc(contractAdd);


console.log(veri.data.result[0].ABI)



process.exit(0)