import Head from 'next/head'
import  { useEffect, useRef, useState } from "react"
import Web3Modal from "web3modal"
import { providers, Contract, utils } from "ethers"
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.css'

// const inter = Inter({ subsets: ['latin'] })

export default function Home() {

  const [isOwner, setIsOwner] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [numTokensMinted, setNumTokensMinted] = useState("");
  const[loading, setLoading] = useState(false);
  const web3ModalRef = useRef();
  const gasLimit = 100000;

  const getNumMintedTokens = async () => {
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const numTokenIds = await nftContract.tokenIds();
      setNumTokensMinted(numTokenIds.toString());

    } catch (e) {
      console.error(e);
    }
  };


  const presaleMint = async () => {
    setLoading(true);
    try{
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await nftContract.presaleMint({
        value: utils.parseEther("0.001"),
      });

      await tx.wait();

      window.alert("You successfully minted a CryptoDev!!!");

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const publicMint = async () => {
    setLoading(true);
    try{
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract( CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await nftContract.mint({
        value: utils.parseEther("0.001"),
      });

      await tx.wait();

      window.alert("You successfully minted a CryptoDev!!");

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI,signer);

      const owner = await nftContract.owner();
      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }

    } catch (e) {
      console.error(e)
    }
  };   

  const startPresale = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer, gasLimit);

      const tx = await nftContract.startPresale();
      await tx.wait();

      setPresaleStarted(true);

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract( CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const presaleEndTime = await nftContract.presaleEnded();
      const currentTimeInSeconds = Date.now() / 1000;

      const hasPresaleEnded = presaleEndTime.lt(Math.floor(currentTimeInSeconds));
      setPresaleEnded(hasPresaleEnded);

    } catch (e) {
      console.error(e)
    }
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract( CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const isPresaleStarted = await nftContract.presaleStarted();

      setPresaleStarted(isPresaleStarted);

      return isPresaleStarted;

    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const connectWallet = async() => {
    await getProviderOrSigner();
    setWalletConnected(true);
  };

  const getProviderOrSigner = async ( needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
     
    const {chainId} = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Please switch to the Goerli network");
      throw new Error("Incorrect network");
    }

    if(needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  const onPageLoad = async () => {
    await  connectWallet();
    await getOwner();

    const presaleStarted= await checkIfPresaleStarted();

    if (presaleStarted) {
      await checkIfPresaleEnded();
    }

    await getNumMintedTokens();

    setInterval(async () => {
      await getNumMintedTokens();
        }, 5 * 1000);

    setInterval(async() => {
      const presaleStarted = await checkIfPresaleStarted();
      if (presaleStarted) {
        await checkIfPresaleEnded();
      }
    }, 5*1000);
  };

  useEffect(() => {
    if(!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      onPageLoad();
    }

  }, []);

  const renderBody = ()=> {
    if(!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    if(loading) {
      return <span className={styles.description}>Loading...</span>;
    }

    if(isOwner && !presaleStarted) {
      return (
        <button onClick={startPresale} className={styles.button}>
          Start Presale
        </button>
      );

    }

    if(!presaleStarted) {
      return (
        <div>
          <span className={styles.description}>
            Presale has not started yet. Please return later
          </span>
        </div>
      );
    }

    if(presaleStarted && !presaleEnded) {
      return (
        <div>
          <span className={styles.description}>
            Presale has started!. If your address is whitelisted, you can mint a CryptoDev!
          </span>

          <button className={styles.button} onClick={presaleMint}>
          Presale Mint 
          </button>
          </div>
      );

    }

    if(presaleEnded) {
      return (
        <div>
          <span className={styles.description}>
            Presale has ended. You can mint a CryptoDev in public sale, if any remains.
          </span>

          <button className={styles.button} onClick={publicMint}>Public Mint</button>
        </div>
      );
    }
  }

  
  return (
    <div>
      <Head>
        <title>Crypto Guys NFT</title>
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to CryptoDevs NFT
          </h1>
          <div className={styles.description}>
            CryptoDevs NFT is a collection for developers in web3
            </div>
            <div className={styles.description}>
              {numTokensMinted}/20 have been minted already!
            </div>

            {renderBody()}
        </div>

        <img className={styles.image} src="/cryptodevs/0.svg" />
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by CryptoGuys
      </footer>
    </div>
  );  
}
