import React, { useMemo } from "react";
import {ConnectionProvider, WalletProvider} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {WalletModalProvider} from "@solana/wallet-adapter-react-ui";

import Main from './main'


// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

//WORKS!!!
const Dashboard = () => {
  const network = WalletAdapterNetwork.Devnet;
  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const customRPC = 'https://devnet.genesysgo.net/';

  const wallets = useMemo(() => [new PhantomWalletAdapter()], [network]);

  return (
    <ConnectionProvider endpoint={customRPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Main/>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
export default Dashboard;
