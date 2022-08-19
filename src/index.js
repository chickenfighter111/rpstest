import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { MoralisProvider } from "react-moralis";
import WalletProviderApp from './walletProvider';
import { BrowserRouter as Router } from "react-router-dom";

import 'bootstrap/dist/css/bootstrap.min.css';

const root = ReactDOM.createRoot(document.getElementById("root"));

const app_id = "q68VhoY1OrgY8surAySXfmqvxaCEDuxcUdDO7zia" //process.env.REACT_APP_APP_ID;
const app_url = "https://ro9hwec6hamv.usemoralis.com:2053/server" //process.env.REACT_APP_APP_URL;
root.render(
  <React.StrictMode>
    <MoralisProvider
      initializeOnMount={true}
      appId="q68VhoY1OrgY8surAySXfmqvxaCEDuxcUdDO7zia"
      serverUrl="https://ro9hwec6hamv.usemoralis.com:2053/server"
    >
      <div className="App">
        <Router>
          <WalletProviderApp />
        </Router>
      </div>
    </MoralisProvider>
  </React.StrictMode>
);
