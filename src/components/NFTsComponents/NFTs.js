import { Tabs, Tab } from "react-bootstrap";
import dBank from "../../abis/dBank.json";
import React, { Component } from "react";
import Token from "../../abis/Token.json";
import ether from "./ether.png";
import Web3 from "web3";
// import "./BankApp.css";
import MyNFTsMain from "./MyNFTsMains";
import LoanNFTsMain from "./LoanNFTsMain";
import AuctionNFTsMain from "./AuctionNFTsMain";
import * as ml5 from "ml5";
import sibiToken from "./SibiToken.png";

//Declare IPFS
const ipfsClient = require("ipfs-http-client");
const ipfs = ipfsClient({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
});

class NFTs extends Component {
  async UNSAFE_componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch);
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

      // load image data
      try {
        const dbank = this.state.dbank;
        const imageCount = await dbank.methods.imageCount().call();
        this.setState({ imagesCount: imageCount });
        for (var i = 1; i <= imageCount; i++) {
          const image = await dbank.methods.images(i).call();
          this.setState({
            images: [...this.state.images, image],
          });
        }
      } catch (e) {
        console.log("Error", e);
        // window.alert("Error loading Image data");
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

  async gradeImage() {
    const classifier = ml5.imageClassifier("MobileNet", modelLoaded);

    function modelLoaded() {
      console.log("Model Loaded!");
    }
    console.log("Classifier prediction to be done...")

    const image = document.getElementById("image");
    var grade;
    await classifier.predict(image, 5, function (err, results) {
      if (results) {
        grade = results[0].probability;
        grade = parseInt(4 * grade);
      } else if (err) {
        console.log("Error : " + err);
      }
    });
    this.setState({ grade: grade });
    console.log(this.state.grade);
  }

  captureFile = (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    const objectURL = URL.createObjectURL(file);
    this.setState({ source: objectURL });
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) });
      console.log("buffer", this.state.buffer);
    };

    this.gradeImage();
  };

  uploadImage = (description) => {
    console.log("Submitting file to ipfs...");

    //adding file to the IPFS
    ipfs.add(this.state.buffer, (error, result) => {
      var grade = this.state.grade * 10 ** 18;
      console.log("Ipfs result", result);
      if (error) {
        console.error(error);
        return;
      }

      this.setState({ loading: true });
      this.state.dbank.methods
        .uploadImage(result[0].hash, description, grade.toString())
        .send({ from: this.state.account })
        .on("transactionHash", (hash) => {
          this.setState({ loading: false, grade: 0 });
          this.setTokenBalance();
        });
    });
  };

  tipImageOwner(id, tipAmount) {
    this.setState({ loading: true });
    this.state.dbank.methods
      .tipImageOwner(id)
      .send({ from: this.state.account, value: tipAmount })
      .on("transactionHash", (hash) => {
        this.setState({ loading: false });
      });
  }

  postForAuction(id){
    this.setState({loading: true});
    this.state.dbank.methods
      .startAuction(id)
      .send({ from: this.state.account})
      .on("transactionHash", (hash) => {
        this.setState({ loading: false });
      });
  }

  async availLoan(id){
    this.setState({loading: true});
    this.state.dbank.methods
      .availLoan(id)
      .send({ from: this.state.account})
      .on("transactionHash", (hash) => {
        this.setState({ loading: false });
      });
    console.log("Image with ID:" + id + " submitted to avail loan.");
  }

  async payOffLoan(id){
      console.log("Image with ID:" + id + " submitted for loan payoff");
      try {
        const image = await this.state.dbank.methods.images(id).call();
        const tokenBorrowed = image.value * 5;
        await this.state.token.methods
          .approve(this.state.dBankAddress, tokenBorrowed.toString())
          .send({ from: this.state.account });
        await this.state.dbank.methods
          .payOffLoan(id)
          .send({ from: this.state.account });
        this.setTokenBalance();
      } catch (e) {
        console.log("Error, pay off: ", e);
      }
  }

  async bid(id, bidAmount){
    this.setState({ loading: true });
    this.state.dbank.methods
      .bidForImage(id)
      .send({ from: this.state.account, value: bidAmount.toString() })
      .on("transactionHash", (hash) => {
        this.setState({ loading: false });
      });
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
      images: [],
      source: null,
      grade: 0,
      showNFTs: true,
      dBankAddress: null,
    };

    this.timer = 0;
    this.uploadImage = this.uploadImage.bind(this);
    this.tipImageOwner = this.tipImageOwner.bind(this);
    this.captureFile = this.captureFile.bind(this);
    this.postForAuction = this.postForAuction.bind(this);
    this.bid = this.bid.bind(this);
    this.availLoan = this.availLoan.bind(this);
    this.payOffLoan = this.payOffLoan.bind(this);
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
                      <h1>CD₿</h1>
                    </div>
                    <div className="bankName">
                      <h6>&nbsp;Catena Decentralized ₿ank&nbsp;</h6>
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
              <div className="row">
                <main role="main" className="col-lg-12 d-flex text-center">
                  <div className="content mr-auto ml-auto">
                    <Tabs
                      tabClassName="tabs"
                      defaultActiveKey="mynfts"
                      id="uncontrolled-tab-example"
                    >

                      <Tab tabClassName="tabT" eventKey="mynfts" title="My NFTs">
                        <div className="tab">
                          <br></br>
                          Deposit an NFT,
                          <br></br>
                          You'll get Tokens equivalent to the calculated NFT value
                          <br></br>
                          Auction you post will be active for one day
                          <br></br>
                          You'll get 50% of the NFT value as tokens if loan in availed
                          <img src={this.state.source} id="image" alt="" />
                          {this.state.loading ? (
                            <div id="loader" className="text-center mt-5">
                              <p>Loading...</p>
                            </div>
                          ) : (
                            <MyNFTsMain
                              account={this.state.account}
                              grade={this.state.grade}
                              images={this.state.images}
                              inAuction={this.state.inAuction}
                              captureFile={this.captureFile}
                              uploadImage={this.uploadImage}
                              tipImageOwner={this.tipImageOwner}
                              postForAuction={this.postForAuction}
                              bid={this.bid}
                              availLoan={this.availLoan}
                            />
                          )}
                        </div>
                      </Tab>

                      <Tab tabClassName="tabT" eventKey="loannfts" title="Loan">
                        <div className="tab">
                          {this.state.loading ? (
                            <div id="loader" className="text-center mt-5">
                              <p>Loading...</p>
                            </div>
                          ) : (
                            <LoanNFTsMain
                              account={this.state.account}
                              grade={this.state.grade}
                              images={this.state.images}
                              inAuction={this.state.inAuction}
                              captureFile={this.captureFile}
                              uploadImage={this.uploadImage}
                              tipImageOwner={this.tipImageOwner}
                              postForAuction={this.postForAuction}
                              bid={this.bid}
                              payOffLoan={this.payOffLoan}
                            />
                          )}
                        </div>
                      </Tab>

                      <Tab tabClassName="tabT" eventKey="auction" title="Auction">
                        <div className="tab">
                          {this.state.loading ? (
                            <div id="loader" className="text-center mt-5">
                              <p>Loading...</p>
                            </div>
                          ) : (
                            <AuctionNFTsMain
                              account={this.state.account}
                              grade={this.state.grade}
                              images={this.state.images}
                              inAuction={this.state.inAuction}
                              captureFile={this.captureFile}
                              uploadImage={this.uploadImage}
                              tipImageOwner={this.tipImageOwner}
                              postForAuction={this.postForAuction}
                              bid={this.bid}
                            />
                          )}
                        </div>
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

export default NFTs;
