import abiDecoder from 'abi-decoder'
import { PancakeRouterABI } from '../abis/index.js'
import logger from './logger.js'

const decoder = (input) => {
  if (input === undefined) {
    return
  }

  try {
    abiDecoder.addABI(PancakeRouterABI)
  
    const result = abiDecoder.decodeMethod(input);
  
    return result
  }
  catch (err) {
    logger.error(err)
    return
  }
}

export default decoder