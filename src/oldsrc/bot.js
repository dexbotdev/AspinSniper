import { Contract, Wallet, providers, BigNumber } from 'ethers';
import * as BEP20 from '../contract/BEP20/bep20.js';
import * as PancakeFactory from '../contract/pancake-v2/factory.js';
import hpAbi from '../contract/honeypotChecker.js'
import Web3 from 'web3';
import HoneypotCheckerCaller from '../lib/HoneypotCheckerCaller.js';
import { BscScan } from "@jpmonette/bscscan";
import axios from 'axios';

const addresses = { RPC: "https://bsc-dataseed.binance.org/",
    WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    USDT:'0x55d398326f99059fF775485246999027B3197955',
    BUSD:"0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    router: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    factory: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
    HONEYPOT_CHECKER_ADDRESS: "0x267F431716B31DE13EE1474920C4aE8Fb2D2B5bb",

}
const client = new BscScan({ apikey: "AUJ2RJAY9ZTQE4GMP22TR2ZVSS2ZFE5NC6" });

const getContractCreator = async(tokenAddress)=>{

  const contractdata= await axios
  .get(`https://api.bscscan.com/api?module=contract&action=getcontractcreation&address=${tokenAddress}&apikey=H8S7Y2FBEFSP2I5D1ZSTRR5DM6BDH9Q8SG`)
  .then(res=>res.json())
  .catch(error=>null);
 
  return contractdata;
}

const getTopHolders = async(tokenAddress)=>{

  const contractdata= await axios
  .get(`https://api.covalenthq.com/v1/56/tokens/${tokenAddress}/token_holders/?key=ckey_0b02a76db9bb4809a54aa41972b`)
  .then(res=>res.json())
  .catch(error=>null);
 
  return contractdata;
}

const getContractSrc = async(tokenAddress)=>{

  const contractdata= await axios
  .get(`https://api.bscscan.com/api?module=contract&action=getsourcecode&address=${tokenAddress}&apikey=H8S7Y2FBEFSP2I5D1ZSTRR5DM6BDH9Q8SG`)
  .then(res=>res.json())
  .catch(error=>null);

  return contractdata;
}

const isQuoteToken=(tokenAddress)=>{

  if(tokenAddress.toLowerCase() ===  addresses.BUSD.toLowerCase()) return true;
  if(tokenAddress.toLowerCase() ===  addresses.WBNB.toLowerCase()) return true;
  if(tokenAddress.toLowerCase() ===  addresses.USDT.toLowerCase()) return true;
  if(tokenAddress.toLowerCase() ===  addresses.BUSD.toLowerCase()) return true;

}

const checkBNBPaired = (token0,token1)=>{
  if(token0.toLowerCase() ===  addresses.WBNB.toLowerCase() ||token1.toLowerCase() ===  addresses.WBNB.toLowerCase()  ) return true; 
}

const provider = new providers.WebSocketProvider("wss://bsc.getblock.io/05ec0cd9-c16b-4a77-a140-47a3f0dafd84/mainnet/")
const wallet = Wallet.createRandom(provider);
const account = wallet.connect(provider);
const web3 = new Web3(addresses.RPC);
const honeypotCheckerCaller = new HoneypotCheckerCaller(
    web3,
    addresses.HONEYPOT_CHECKER_ADDRESS
  )
const contractPancakeFactory = new Contract(
    PancakeFactory.address,
    PancakeFactory.ABI,
    provider
);

const honeypotCheckerContract = new web3.eth.Contract(
    hpAbi,
    addresses.HONEYPOT_CHECKER_ADDRESS
  );

const main=()=>{

  try{

    contractPancakeFactory.on('PairCreated', async (token0Addr, token1Addr, pairAddr) => {

    let token0Contract = new Contract(token0Addr, BEP20.TokenABI, provider);
    let token1Contract = new Contract(token1Addr, BEP20.TokenABI, provider);
    let token0Name, token1Name,tokenName,tokenSymbol;
    let totalSupply = 0;
    let liquidity = 0;
    let targetToken =token0Addr;
    if(isQuoteToken(token0Addr)) {
      targetToken= token1Addr;
      totalSupply = await token1Contract.totalSupply();
      liquidity = await token1Contract.balanceOf(pairAddr);
  } else {
      totalSupply = await token0Contract.totalSupply();
      liquidity = await token0Contract.balanceOf(pairAddr);
  }
  

  const ispairedWithWBNB  = await checkBNBPaired(token0Addr,token1Addr);

   const abi = await getContractSrc(targetToken); 
    console.log(abi);
    
    try {
      token0Name = await token0Contract.symbol();
      tokenName = await token0Contract.name();
      tokenSymbol = await token0Contract.symbol();
      token1Name = await token1Contract.symbol();
      console.log(`${new Date().toISOString()} | Token Pair created | ${token0Name}:${token1Name} PairAddress : @ ${pairAddr}`);
    }catch(e) {
      console.error(e);
    }
    let result='OK';
    let status=true;
  
    if(liquidity.gt(BigNumber.from("0")))
   try{
      result = await honeypotCheckerContract.methods
      .check(addresses.router, [
        addresses.WBNB,
        targetToken,
      ])
      .call({
        value: web3.utils.toWei("0.001"),
        gasLimit: 50000000,
        gasPrice: web3.utils.toWei("5", "gwei"),
      }); 
      
   } catch(error){
       
      result=error.message;
      status=false;
   }
  
     console.log(result);
  
    if(status){
  
      let liq1 = await token0Contract.balanceOf(pairAddr);
      let liq2 = await token1Contract.balanceOf(pairAddr);
      const {
          buyGas,
          sellGas,
          estimatedBuy,
          exactBuy,
          estimatedSell,
          exactSell
        }=result;
        const [buyTax, sellTax] = [
          honeypotCheckerCaller.calculateTaxFee(estimatedBuy, exactBuy),
          honeypotCheckerCaller.calculateTaxFee(estimatedSell, exactSell),
        ];
  
        console.log(`
    ===============================================
                  name: ${tokenName}
                symbol: ${tokenSymbol}
      used gas for buy: ${buyGas}
              for sell: ${sellGas}
           buy tax fee: ${buyTax} %
          sell tax fee: ${sellTax} %
          Total Supply : ${totalSupply.toString()},
          Total liquidity: ${liquidity.toString()}, 
          ${token0Name} in pool: ${liq1.toString()},
          ${token1Name}  in pool: ${liq2.toString()}
    ===============================================
      `);
  
    }
  
  });
  }catch(error){
    main()
  }
}
 
console.log('Pancake Factory Subscribed!');
main();

