import { BigNumber, Contract,  providers,utils  } from 'ethers';
import * as BEP20 from '../contract/BEP20/bep20.js';
import * as PancakeFactory from '../contract/pancake-v2/factory.js';
import hpAbi from '../contract/honeypotChecker.js'
 import decoder from '../lib/decoder.js';
import getWeb3 from '../lib/web3.js';
import { addresses,checkBNBPaired,checkforHoneyPot,isTokenNotVerified,getContractSrc,isQuoteToken } from '../lib/helper.js'; 
 
import logger from '../lib/logger.js';
import HoneypotCheckerCaller from '../lib/HoneypotCheckerCaller.js';
import textArt from 'anbani-textart';


const methodName =  'addLiquidityETH';

const provider = new providers.WebSocketProvider("wss://bsc-mainnet.nodereal.io/ws/v1/ea49d5c625d34b069be219d151e4f1e8")
 const web3 = getWeb3();  
const contractPancakeFactory = new Contract(
    PancakeFactory.address,
    PancakeFactory.ABI,
    provider
); 
const honeypotCheckerCaller = new HoneypotCheckerCaller(
    web3,
    addresses.HONEYPOT_CHECKER_ADDRESS
  )
const honeypotCheckerContract = new web3.eth.Contract(
    hpAbi,
    addresses.HONEYPOT_CHECKER_ADDRESS
  );

const main=(eventEmitter)=>{

    const t= textArt.generate('Anbani Block Regular', 'MoonSniper')
    console.log(t); 
    logger.docs(" ----- DEVELOPED BY DEXBOTSDEV                             ")
try{

    web3.eth.subscribe('pendingTransactions')
    .on('connected', async () => {
      logger.info(': Listening to Pending Transactions') 
    })
    .on('data', async (txHash) => {
      const tx  = await web3.eth.getTransaction(txHash)
      
      if (tx?.to?.toLowerCase() === addresses.router) {

      logger.info(': Listening to tx') 
      const gasPrice = Number(tx?.gasPrice)
      const txInputDecoded = decoder(tx?.input)
      if (txInputDecoded?.name === methodName) {
        const [token0Addr, token1Addr] = txInputDecoded.params
        const currentLiquidity = 0
        let targetToken = token0Addr;
        let bnbToken = token1Addr;

        const isQToken = isQuoteToken(targetToken);
        if(isQToken){
            targetToken = token1Addr;
            bnbToken = token0Addr;
            }
        
        let bnbContract = new Contract(bnbToken, BEP20.TokenABI, provider);
        let tokenContract = new Contract(targetToken, BEP20.TokenABI, provider);

        let tokenName = await tokenContract.name();
        let tokenSymbol = await tokenContract.symbol();
        let tokenDecimals = await tokenContract.decimals();
        let bnbDecimals = await bnbContract.decimals();

        let src = await getContractSrc(targetToken);
        let ishp = true;
        let tokenNotVerified = true;
        if(src === null || src.data.result[0].ABI === 'Contract source code not verified' )
        {
            logger.info('Source Unverified stay Away from    '+tokenSymbol);  
         } else {
            ishp = checkforHoneyPot(src.data.result); 
            tokenNotVerified=false;
         }

        logger.info('Finding Liquidity   '+tokenSymbol);  

        const bnbLiquidity = await bnbContract.balanceOf(pairAddr);
        const tokenLiquidity = await tokenContract.balanceOf(pairAddr);

        logger.info('Finding Total Supply  '+tokenSymbol);  
        const totalSupply = await tokenContract.totalSupply();

        const liqShare = tokenLiquidity.mul(BigNumber.from("100")).div(totalSupply);

        let result='OK';
        let status=true;
        if(Number(utils.formatUnits(bnbLiquidity,bnbDecimals))>0){
            logger.info('BNB Liquidity available  ');  
            logger.info('Checking For HONEYPOT  ');  
            try{
                result = await honeypotCheckerContract.methods
                .check(addresses.router, [
                  addresses.WBNB,
                  targetToken,
                ])
                .call({
                  value: web3.utils.toWei("0.1"),
                  gasLimit: 50000000,
                  gasPrice: web3.utils.toWei("5", "gwei"),
                }); 
                
             } catch(error){
                logger.error('ERROR Checking For HONEYPOT {} '+error);  

                result=error.message;
                status=false;
             }

             if(status){
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

                  logger.docs('Token Name       :',tokenName);
                  logger.docs('Token Symbol     :',tokenSymbol);
                  logger.docs('Token Buy Gas    :',buyGas);
                  logger.docs('Token Sell Gas   :',sellGas);
                  logger.docs('Token BNB LIQ    :',Number(utils.formatUnits(bnbLiquidity,bnbDecimals)));
                  logger.docs('Token Buy Tax    :',buyTax);
                  logger.docs('Token Sell Tax   :',sellTax); 
                  logger.warning('Token Liq Share  :'+Number(liqShare).toFixed(2)+'  %'); 
                  
                  const cleanToken = {
                    tokenAddress: targetToken,
                    tokenName: tokenName,
                    tokenSymbol:tokenSymbol,
                    buyTax: buyTax,
                    sellTax: sellTax,
                    totalSupply: Number(utils.formatUnits(totalSupply,tokenDecimals)),
                    buyGas: buyGas,
                    sellGas: sellGas,
                    bnbLiquidity: Number(utils.formatUnits(bnbLiquidity,bnbDecimals)),
                    lpTokenBalance: Number(utils.formatUnits(tokenLiquidity,tokenDecimals)),

                  } 
                  eventEmitter.emit('newtoken',cleanToken);

             } else {
                logger.error("Token is either Honeypot or there is no Liquidity Added");
             } 
        }  
         else {
            logger.info('No Liquidity   ',tokenSymbol);  
            logger.docs('Token Name         :',tokenName);
            logger.docs('Token Symbol       :',tokenSymbol);
            logger.docs('Token is Verified  :',!tokenNotVerified);  
            logger.docs('Token is HoneyPot  :',ishp);  
         }
      }

      }
    })
    .on('error', err => {
      return logger.error(""+err)
    })

}catch(error){
    logger.error(error); 
 }
}

export  default main;