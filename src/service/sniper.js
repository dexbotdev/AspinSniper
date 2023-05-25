import { BigNumber, Contract,  providers,utils  } from 'ethers';
import * as BEP20 from '../contract/BEP20/bep20.js'; 
import * as PancakePair from '../contract/pancake-v2/PancakePair.js';
import { config } from "dotenv";
config(); 
  
import Web3 from 'web3';
import { addresses,checkBNBPaired,checkforHoneyPot,isTokenNotVerified,getContractSrc,isQuoteToken } from '../lib/helper.js'; 
 
import logger from '../lib/logger.js';

const provider = new providers.WebSocketProvider("wss://bsc-mainnet.nodereal.io/ws/v1/ea49d5c625d34b069be219d151e4f1e8")
 const web3 = new Web3(addresses.RPC);  
const contractPancakePair = new Contract(
  PancakePair.address,
  PancakePair.ABI,
    provider
);  
const tokenAddress = process.env.TOKENADDRESS;
const bnb = process.env.WBNB;

const main=(eventEmitter)=>{
    logger.docs("  __                 ")
    logger.docs(" (_  ._  o ._   _  ._")
    logger.docs(" __) | | | |_) (/_ | ")
    logger.docs("           |         ")
    logger.docs(" ----- DEVELOPED BY DEXBOTSDEV                     ")
try{
  contractPancakePair.on('error', console.error);

  contractPancakePair.on('Swap', async (sender, amount0In, amount1In, amount0Out, amount1Out, toAddress) => {
        
        logger.info('First Swap on the new Token happened at '+ new Date().toString());
 
            
            let bnbContract = new Contract(bnb, BEP20.TokenABI, provider);
            let tokenContract = new Contract(tokenAddress, BEP20.TokenABI, provider);

            let tokenName = await tokenContract.name();
            let tokenSymbol = await tokenContract.symbol();
            let tokenDecimals = await tokenContract.decimals();
            let bnbDecimals = await bnbContract.decimals();
 

            logger.info('Finding Liquidity   '+tokenSymbol);  

            const bnbLiquidity = await bnbContract.balanceOf(PancakePair.address);
            const tokenLiquidity = await tokenContract.balanceOf(PancakePair.address);

            logger.info('Finding Total Supply  '+tokenSymbol);  
            const totalSupply = await tokenContract.totalSupply();

            const liqShare = tokenLiquidity.mul(BigNumber.from("100")).div(totalSupply);

            let result='OK';
             if(Number(utils.formatUnits(bnbLiquidity,bnbDecimals))>0){
                logger.info('BNB Liquidity available  '+utils.formatUnits(bnbLiquidity,bnbDecimals));  
                 
 

                      logger.docs('Token Name       :',tokenName);
                      logger.docs('Token Symbol     :',tokenSymbol); 
                      logger.docs('Token BNB LIQ    :',Number(utils.formatUnits(bnbLiquidity,bnbDecimals))); 
                      logger.warning('Token Liq Share  :'+Number(liqShare).toFixed(2)+'  %'); 
                      
                      const cleanToken = { 
                        tokenName: tokenName,
                        tokenSymbol:tokenSymbol, 
                        totalSupply: Number(utils.formatUnits(totalSupply,tokenDecimals)), 
                        bnbLiquidity: Number(utils.formatUnits(bnbLiquidity,bnbDecimals)),
                        lpTokenBalance: Number(utils.formatUnits(tokenLiquidity,tokenDecimals)),

                      } 
                      eventEmitter.emit('newtoken',cleanToken);

                 } else {
                    logger.error("Token has no Liquidity Added");
                 }  
         
 
    });

}catch(error){
    logger.error(error); 
 }
}

export  default main;