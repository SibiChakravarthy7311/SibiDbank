import { Tabs, Tab } from "react-bootstrap";
import dBank from "../../abis/dBank.json";
import React, { Component } from "react";
import Token from "../../abis/Token.json";
import ether from "./ether.png";
import Web3 from "web3";
import "./BankApp.css";
import sibiToken from "./SibiToken.png";

class BankApp extends Component {
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
        var collateral = await dbank.methods.collateralEther(account).call();
        collateral = await this.toEther(collateral);

        this.setState({
          bankBalance: bankBalance,
          tokenBalance: tokenBalance,
          collateral: collateral,
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

  async setBankBalance() {
    const dbank = this.state.dbank;
    const account = this.state.account;
    var bankBalance = await dbank.methods.etherBalanceOf(account).call();
    bankBalance = await this.toEther(bankBalance);
    this.setState({ bankBalance: bankBalance });
  }

  async setTokenBalance() {
    const token = this.state.token;
    const account = this.state.account;
    var tokenBalance = await token.methods.balanceOf(account).call();
    tokenBalance = await this.toEther(tokenBalance);
    this.setState({ tokenBalance: tokenBalance });
  }

  async setCollateral() {
    const dbank = this.state.dbank;
    const account = this.state.account;
    var collateral = await dbank.methods.collateralEther(account).call();
    collateral = await this.toEther(collateral);
    this.setState({ collateral: collateral });
  }


  async bid(id, bidAmount) {
    this.setState({ loading: true });
    this.state.dbank.methods
      .bidForImage(id)
      .send({ from: this.state.account, value: bidAmount.toString() })
      .on("transactionHash", (hash) => {
        this.setState({ loading: false });
      });
  }

  async deposit(amount) {
    if (this.state.dbank !== "undefined") {
      var account = this.state.account;
      try {
        await this.state.dbank.methods
          .deposit()
          .send({ value: amount.toString(), from: account });
        this.setBankBalance();
        this.setTokenBalance();
      } catch (e) {
        console.log("Error, deposit: ", e);
      }
    }
  }

  async withdraw(amount) {
    if (this.state.dbank !== "undefined") {
      try {
        await this.state.dbank.methods
          .withdraw(amount.toString())
          .send({ from: this.state.account });
        this.setBankBalance();
        this.setTokenBalance();
      } catch (e) {
        console.log("Error, withdraw: ", e);
      }
    }
  }

  async transfer(amount, receiver) {
    if (this.state.dbank !== "undefined") {
      var account = this.state.account;
      try {
        await this.state.dbank.methods
          .transfer(amount.toString(), receiver.toString())
          .send({ from: account });
        this.setBankBalance();
        this.setTokenBalance();
      } catch (e) {
        console.log("Error, deposit: ", e);
      }
    }
  }

  async borrow(amount) {
    if (this.state.dbank !== "undefined") {
      try {
        await this.state.dbank.methods
          .borrow()
          .send({ value: amount.toString(), from: this.state.account });
        this.setTokenBalance();
        this.setCollateral();
      } catch (e) {
        console.log("Error, borrow: ", e);
      }
    }
  }

  async swap(amount) {
    if (this.state.dbank !== "undefined") {
      try {
        await this.state.dbank.methods
          .swap()
          .send({ value: amount.toString(), from: this.state.account });
        this.setTokenBalance();
        // this.setCollateral();
      } catch (e) {
        console.log("Error, borrow: ", e);
      }
    }
  }

  async payOff(e) {
    e.preventDefault();
    if (this.state.dbank !== "undefined") {
      try {
        const collateralEther = await this.state.dbank.methods
          .collateralEther(this.state.account)
          .call({ from: this.state.account });
        const tokenBorrowed = collateralEther * 5;
        await this.state.token.methods
          .approve(this.state.dBankAddress, tokenBorrowed.toString())
          .send({ from: this.state.account });
        await this.state.dbank.methods
          .payOff()
          .send({ from: this.state.account });
        this.setTokenBalance();
        this.setCollateral();
      } catch (e) {
        console.log("Error, pay off: ", e);
      }
    }
  }

  // startTimer() {
  //   if (this.timer === 0 && this.state.seconds > 0) {
  //     this.timer = setInterval(this.countDown, 1000);
  //   }
  // }

  // async countDown() {
  //   let seconds = this.state.seconds - 1;
  //   this.setState({
  //     time: this.secondsToTime(seconds),
  //     seconds: seconds,
  //   });

  //   if (seconds == 0) {
  //     this.setState({ seconds: 2 });
  //     var dbank = this.state.dbank;
  //     var token = this.state.token;
  //     var account = this.state.account;
  //     // console.log(account);
  //     if (dbank !== "undefined") {
  //       try {
  //         // await dbank.methods.mintToken().send({from: account});
  //       } catch (e) {
  //         console.log("Error, minting: ", e);
  //       }
  //     }
  //   }
  // }

  // secondsToTime(secs) {
  //   let hours, seconds, minutes;
  //   hours = Math.floor(secs / (60 * 60));
  //   let divisorForMinutes = secs % (60 * 60);
  //   minutes = Math.floor(divisorForMinutes / 60);
  //   let divisorForSeconds = divisorForMinutes % 60;
  //   seconds = Math.ceil(divisorForSeconds);

  //   let obj = {
  //     h: hours,
  //     m: minutes,
  //     s: seconds,
  //   };

  //   return obj;
  // }

  // async componentDidMount() {
  //   let timeLeftVar = this.secondsToTime(this.state.seconds);
  //   this.setState({ time: timeLeftVar });
  // }

  // creditInterest() {
  //   this.startTimer();
  // }

  constructor(props) {
    super(props);
    this.state = {
      web3: "undefined",
      account: "",
      token: null,
      dbank: null,
      balance: 0,
      // time: {},
      // seconds: 2,
      bankBalance: 0,
      tokenBalance: 0,
      tokenDebt: 0,
      collateral: 0,
      images: [],
      source: null,
      grade: 0,
      showNFTs: true,
      dBankAddress: null,
    };

    this.timer = 0;
    // this.startTimer = this.startTimer.bind(this);
    // this.countDown = this.countDown.bind(this);
    // this.uploadImage = this.uploadImage.bind(this);
    // this.tipImageOwner = this.tipImageOwner.bind(this);
    // this.captureFile = this.captureFile.bind(this);
    // this.postForAuction = this.postForAuction.bind(this);
    // this.bid = this.bid.bind(this);
  }

  render() {
    // this.creditInterest();
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
                <div className="etherValue">&nbsp;{this.state.bankBalance}</div>
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
                  defaultActiveKey="deposit"
                  id="uncontrolled-tab-example"
                >
                  <Tab tabClassName="tabT" eventKey="deposit" title="Deposit">
                    <div className="tab">
                      <br></br>
                      Enter ether amount to deposit
                      <br></br>
                      (min. amount is 0.01 ETH)
                      <br></br>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          let amount = this.depositAmount.value;
                          amount = amount * 10 ** 18; //convert to wei
                          this.deposit(amount);
                        }}
                      >
                        <div className="form-group mr-sm-2">
                          <br></br>
                          <div className="amountInput">
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
                            <input
                              id="depositAmount"
                              step="0.01"
                              type="number"
                              ref={(input) => {
                                this.depositAmount = input;
                              }}
                              className="form-control form-control-md"
                              placeholder="amount..."
                              required
                            />
                          </div>
                        </div>
                        <button type="submit" className="btn btn-primary">
                          DEPOSIT
                        </button>
                      </form>
                    </div>
                  </Tab>

                  <Tab tabClassName="tabT" eventKey="withdraw" title="Withdraw">
                    <div className="tab">
                      <br></br>
                      Enter the amount to withdraw
                      <br></br>
                      (min. amount is 0.01 ETH)
                      <br></br>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          let amount = this.withdrawAmount.value;
                          amount = amount * 10 ** 18; //convert to wei
                          this.withdraw(amount);
                        }}
                      >
                        <div className="form-group mr-sm-2">
                          <br></br>
                          <div className="amountInput">
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
                            <input
                              id="withdrawAmount"
                              step="0.01"
                              type="number"
                              ref={(input) => {
                                this.withdrawAmount = input;
                              }}
                              className="form-control form-control-md"
                              placeholder="amount..."
                              required
                            />
                          </div>
                        </div>
                        <button type="submit" className="btn btn-primary">
                          WITHDRAW
                        </button>
                      </form>
                    </div>
                  </Tab>

                  <Tab tabClassName="tabT" eventKey="transfer" title="Transfer">
                    <div className="tab">
                      <br></br>
                      Enter the account number and amount to transfer...
                      <br></br>
                      (min. amount is 0.01 ETH)
                      <br></br>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();

                          let amount = this.transferAmount.value;
                          amount = amount * 10 ** 18; //convert to wei
                          let account = this.accountNumber.value;
                          this.transfer(amount, account);
                        }}
                      >
                        <div className="form-group mr-sm-2">
                          <br></br>
                          <input
                            id="accountNumber"
                            step="0.01"
                            type="text"
                            ref={(input) => {
                              this.accountNumber = input;
                            }}
                            className="form-control form-control-md"
                            placeholder="Account Number..."
                            required
                          />
                          <div className="amountInput">
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
                            <input
                              id="transferAmount"
                              step="0.01"
                              type="number"
                              ref={(input) => {
                                this.transferAmount = input;
                              }}
                              className="form-control form-control-md"
                              placeholder="Amount..."
                              required
                            />
                          </div>
                        </div>
                        <button type="submit" className="btn btn-primary">
                          TRANSFER
                        </button>
                      </form>
                    </div>
                  </Tab>

                  <Tab tabClassName="tabT" eventKey="borrow" title="Borrow">
                    <div className="tab">
                      <br></br>
                      Do you want to borrow tokens?
                      <br></br>
                      (You'll get 5 times of collateral, in Tokens)
                      <br></br>
                      Type collateral amount (in ETH)
                      <br></br>
                      <br></br>
                      <div className="Account">
                        <div className="ether">
                          <div className="etherBox">
                            <div className="etherTag">Collateral</div>
                            <div className="etherValue">
                              &nbsp;{this.state.collateral}
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
                            <div className="tokenTag">Token Debt</div>
                            <div className="tokenValue">
                              &nbsp;{this.state.collateral * 5}
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
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          let amount = this.borrowAmount.value;
                          amount = amount * 10 ** 18; //convert to wei
                          this.borrow(amount);
                        }}
                      >
                        <div className="form-group mr-sm-2">
                          <div className="amountInput">
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
                            <input
                              id="borrowAmount"
                              step="0.01"
                              type="number"
                              ref={(input) => {
                                this.borrowAmount = input;
                              }}
                              className="form-control form-control-md"
                              placeholder="Collateral Ether..."
                              required
                            />
                          </div>
                        </div>
                        <button type="submit" className="btn btn-primary">
                          BORROW
                        </button>
                      </form>
                    </div>
                  </Tab>

                  <Tab tabClassName="tabT" eventKey="payOff" title="Payoff">
                    <div className="tab">
                      <br></br>
                      Kindly confirm the loan Payoff
                      <br></br>
                      (You'll receive your collateral - collateral fee(1%))
                      <br></br>
                      <br></br>
                      <div className="Account">
                        <div className="ether">
                          <div className="etherBox">
                            <div className="etherTag">Collateral</div>
                            <div className="etherValue">
                              &nbsp;{this.state.collateral}
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
                            <div className="tokenTag">Token Debt</div>
                            <div className="tokenValue">
                              &nbsp;{this.state.collateral * 5}
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
                      <button
                        type="submit"
                        className="btn btn-primary"
                        onClick={(e) => this.payOff(e)}
                      >
                        PAYOFF
                      </button>
                    </div>
                  </Tab>

                  <Tab tabClassName="tabT" eventKey="swap" title="Swap">
                    <div className="tab">
                      <br></br>
                      Do you want to buy tokens?
                      <br></br>
                      (You'll get 10 times the ether exchanged in tokens)
                      <br></br>
                      Type exchange amount (in ETH)
                      <br></br>
                      <br></br>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          let amount = this.swapAmount.value;
                          amount = amount * 10 ** 18; //convert to wei
                          this.swap(amount);
                        }}
                      >
                        <div className="form-group mr-sm-2">
                          <div className="amountInput">
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
                            <input
                              id="swapAmount"
                              step="0.01"
                              type="number"
                              ref={(input) => {
                                this.swapAmount = input;
                              }}
                              className="form-control form-control-md"
                              placeholder="Exchange Ether..."
                              required
                            />
                          </div>
                        </div>
                        <button type="submit" className="btn btn-primary">
                          SWAP
                        </button>
                      </form>
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

export default BankApp;
