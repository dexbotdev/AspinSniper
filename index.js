import { config } from "dotenv";
import ethers,{ BigNumber,providers,Wallet  } from 'ethers'; 
import logger from "./src/lib/logger.js";
import Web3 from 'web3';
import { addresses } from './src/lib/helper.js'; 
config(); 
import main from "./src/service/sniper.js";
import { EventEmitter } from "emitter";
const eventEmitter = new EventEmitter();

const gasLimit=500000;
const gwei=5;
const privateKey=process.env.PRIVATE_KEY;
const slippage=process.env.MAX_SLIPPAGE_PCTG;
const bnbToBuy=process.env.MIN_BNB_TOBUY;
const minBNBLiquidty=process.env.BNB_LIQUIDITY_AMOUNT;
const gasPrice = ethers.utils.parseUnits(gwei.toString(), 'gwei') 
const provider = new providers.WebSocketProvider(process.env.WSS_RPC)
const web3 = new Web3(addresses.RPC); 
const recipientWallet = new Wallet(privateKey);

const signer = recipientWallet.connect(provider);


const router = new ethers.Contract(
    addresses.router,
    [
      'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
      'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
      'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
    ],
    signer
  );

async function start() {
    eventEmitter.on('newListener', (event, listener) => {
      logger.info(`Added ${event} listener.`);
  });
  
    eventEmitter.on('newtoken', async (newtoken) => {
        logger.info('Recieved a Clean Token       :'+newtoken.tokenName);

             logger.info('Condition Satisfied: BNB Liquidity       :'+ newtoken.bnbLiquidity);
            logger.info('Condition Satisfied: Min Required BNB Liquidity       :'+ minBNBLiquidty); 
            logger.info('Buying Token with BNB Amount       :'+bnbToBuy); 
            let amountOutMin = 0;
            //We buy x amount of the new token for our wbnb
            const amountIn = ethers.utils.parseUnits(bnbToBuy.toString(), 'ether');
            if (slippage > 0 ){
                const amounts = await router.getAmountsOut(amountIn, [addresses.WBNB, newtoken.tokenAddress]);
                //Our execution price will be a bit different, we need some flexbility
                const amnt  = Number(amounts[1].toString());
                amountOutMin = parseInt(amnt*(1- slippage/100));
            }
            logger.info( 
                `Buying Token
                =================
                tokenIn: ${(bnbToBuy).toString()}   (BNB)
                tokenOut: ${(amountOutMin / 1e-9).toString()} ${newtoken.tokenName}
              `);
              eventEmitter.removeAllListeners();

              try{
                const tx = await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                    amountIn,
                    amountOutMin,
                    [addresses.WBNB, newtoken.tokenAddress],
                    recipientWallet.address,
                    Date.now() + 1000 * 2, //2 secs
                    {
                    'gasLimit': gasLimit,
                    'gasPrice': gasPrice,
                        'nonce' : 2323
                });
                const receipt = await tx.wait(); 
                logger.info(`Transaction receipt : https://www.bscscan.com/tx/${receipt.logs[1].transactionHash}`);
                
              }catch(error){
                logger.error('Failed Purchase - '+ error.message);
              }
              
        

  });
  main(eventEmitter);
 }


 

start();




 