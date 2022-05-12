import { Tabs, Tab } from "react-bootstrap";
import React, { Component } from "react";
import "./Courses.css";
import CourseTab from "./CourseTab";
import CertificateTab from "./CertificatesTab";
import ether from "./ether.png";
import sibiToken from "./SibiToken.png";
import dBank from "../../abis/dBank.json";
import Token from "../../abis/Token.json";
import Web3 from "web3";

class Courses extends Component {
  async UNSAFE_componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch);
    await this.setTokenBalance();
  }

  async loadBlockchainData(dispatch) {
    if (typeof window.ethereum !== "undefined") {
      const web3 = new Web3(window.ethereum);
      const netId = await web3.eth.net.getId();
      const accounts = await web3.eth.getAccounts();

      //load balance
      if (typeof accounts[0] !== "undefined") {
        const balance = await web3.eth.getBalance(accounts[0]);
        this.setState({ account: accounts[0], balance: balance, web3: web3 });
      } else {
        window.alert("Please login with MetaMask");
      }

      //load contracts
      try {
        const token = new web3.eth.Contract(
          Token.abi,
          Token.networks[netId].address
        );
        const dbank = new web3.eth.Contract(
          dBank.abi,
          dBank.networks[netId].address
        );
        const dBankAddress = dBank.networks[netId].address;
        this.setState({
          token: token,
          dbank: dbank,
          dBankAddress: dBankAddress,
        });
      } catch (e) {
        console.log("Error", e);
        window.alert("Contracts not deployed to the current network");
      }

      // load bank balance data
      try {
        const dbank = this.state.dbank;
        const token = this.state.token;
        const account = this.state.account;
        var bankBalance = await dbank.methods.etherBalanceOf(account).call();
        bankBalance = await this.toEther(bankBalance);
        var tokenBalance = await token.methods.balanceOf(account).call();
        tokenBalance = await this.toEther(tokenBalance);

        this.setState({
          bankBalance: bankBalance,
          tokenBalance: tokenBalance,
        });
      } catch (e) {
        console.log("Error", e);
        // window.alert("Error loading contract data");
      }
      this.setState({ loading: false });
    } else {
      window.alert("Please install MetaMask");
    }
  }

  async toEther(amountInWei) {
    const web3 = new Web3(window.ethereum);
    return web3.utils.fromWei(amountInWei);
  }

  async setTokenBalance() {
    const token = this.state.token;
    const account = this.state.account;
    var tokenBalance = await token.methods.balanceOf(account).call();
    tokenBalance = await this.toEther(tokenBalance);
    this.setState({ tokenBalance: tokenBalance });
  }

  constructor(props) {
    super(props);
    this.state = {
      web3: "undefined",
      account: "",
      token: null,
      dbank: null,
      balance: 0,
      bankBalance: 0,
      tokenBalance: 0,
      source: null,
      showNFTs: true,
      dBankAddress: null,
    };

    this.setTokenBalance = this.setTokenBalance.bind(this);
  }


  render() {
    return (
      <div className="container-fluid mt-5 text-center bankContainer">
        <div className="mainContainer">
          <br></br>
          <div className="bankNameContainer">
            <div className="bankNameContainerBox">
              <div className="referenceDiv"></div>
              <div className="bankBrandContainer">
                <div className="bankBrand">
                  <h1>CEdx</h1>
                </div>
                <div className="bankName">
                  <h6>&nbsp;Catenax Education&nbsp;</h6>
                </div>
              </div>
            </div>
          </div>
          <br></br>
          <br></br>
          <div className="Account">
                <div className="ether">
                  <div className="etherBox">
                    <div className="etherTag">Balance</div>
                    <div className="etherValue">
                      &nbsp;{this.state.bankBalance}
                    </div>
                    <div className="etherSymbol">
                      &nbsp;
                      <img
                        src={ether}
                        width="25"
                        height="25"
                        className="d-inline-block"
                        alt="Decentralized Bank"
                      />
                      &nbsp;
                    </div>
                  </div>
                </div>
                <div className="token">
                  <div className="tokenBox">
                    <div className="tokenTag">Tokens</div>
                    <div className="tokenValue">
                      &nbsp;{this.state.tokenBalance}
                    </div>
                    <div className="tokenSymbol">
                      &nbsp;
                      <img
                        src={sibiToken}
                        width="25"
                        height="25"
                        className="d-inline-block"
                        alt="Decentralized Bank"
                      />
                      &nbsp;
                    </div>
                  </div>
                </div>
              </div>
              <br></br>
              <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <Tabs
                  tabClassName="tabs"
                  defaultActiveKey="courses"
                  id="uncontrolled-tab-example"
                >
                  <Tab tabClassName="tabT" eventKey="courses" title="Courses">
                    <CourseTab 
                      setTokenBalance = {this.setTokenBalance}
                    />
                  </Tab>
                  <Tab
                    tabClassName="tabT"
                    eventKey="certificates"
                    title="Certificates"
                  >
                    <CertificateTab />
                  </Tab>
                </Tabs>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default Courses;
