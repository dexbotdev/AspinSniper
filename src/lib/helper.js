import { BscScan } from "@jpmonette/bscscan";
import axios from 'axios';
import logger from "./logger.js";

export const addresses = { RPC: "https://bsc-dataseed.binance.org/",
    WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    USDT:'0x55d398326f99059fF775485246999027B3197955',
    BUSD:"0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    router: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    factory: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
    HONEYPOT_CHECKER_ADDRESS: "0x267F431716B31DE13EE1474920C4aE8Fb2D2B5bb",

} 
export const getContractCreator = async(tokenAddress)=>{

    const contractdata= await axios
    .get(`https://api.bscscan.com/api?module=contract&action=getcontractcreation&contractaddresses=${tokenAddress}&apikey=H8S7Y2FBEFSP2I5D1ZSTRR5DM6BDH9Q8SG`)
    .then(res=>res)
    .catch(error=>null);
   
    return contractdata;
  }
  
  export const getTopHolders = async(tokenAddress)=>{
  
    const contractdata= await axios
    .get(`https://api.covalenthq.com/v1/56/tokens/${tokenAddress}/token_holders/?key=ckey_0b02a76db9bb4809a54aa41972b`)
    .then(res=>res)
    .catch(error=>null);
   
    return contractdata;
  }
  
  export const getContractSrc = async(tokenAddress)=>{
  
    
    const contractdata= await axios
    .get(`https://api.bscscan.com/api?module=contract&action=getsourcecode&address=${tokenAddress}&apikey=AUJ2RJAY9ZTQE4GMP22TR2ZVSS2ZFE5NC6`)
    .then(res=>res)
    .catch(error=>null);

    return contractdata;
  }
  
  export const isQuoteToken=(tokenAddress)=>{
  
    if(tokenAddress.toLowerCase() ===  addresses.BUSD.toLowerCase()) return true;
    else if(tokenAddress.toLowerCase() ===  addresses.WBNB.toLowerCase()) return true;
    else if(tokenAddress.toLowerCase() ===  addresses.USDT.toLowerCase()) return true; 
    else return false; 
  
  }
  
  export const checkBNBPaired = (token0,token1)=>{
    if(token0.toLowerCase() ===  addresses.WBNB.toLowerCase() ||token1.toLowerCase() ===  addresses.WBNB.toLowerCase()  ) return true; 
  }
  

  export const checkforHoneyPot =(abi)=>{

     
    var str = JSON.stringify(abi).toLowerCase();

    const isNotVerified = str.indexOf('contract source code not verified')>0;
    const isAccounting = str.indexOf('setaccountingaddress')>0;
    const isLibrary = str.indexOf('libraryaddress')>0 || str.indexOf('protection')>0;
    const isBlackList = str.indexOf('blacklist')>0 || str.indexOf('tradingenabled')>0||str.indexOf('enabletrading')>0;
 

    if(isAccounting ) return true;
    else if(isBlackList) return true;
    else if(isLibrary) return true;
    else if(isNotVerified) return true;
    

    return false;

  }

  export const isTokenNotVerified =(abi)=>{

     
    var str = JSON.stringify(abi).toLowerCase();

    const isNotVerified = str.indexOf('Contract source code not verified')>0; 
    if(isNotVerified) return true;
    

    return false;

  }


  export const displayBanner=()=>{

    logger.docs("")
  }
  