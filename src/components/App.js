import { Tabs, Tab } from 'react-bootstrap'
import dBank from '../abis/dBank.json'
import React, { Component } from 'react';
import Token from '../abis/Token.json'
import dbank from '../dbank.png';
import Web3 from 'web3';
import './App.css';
import Main from './Main';
import * as ml5 from "ml5";

//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

class App extends Component {

  async componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch);
  }

  async loadBlockchainData(dispatch) {
    if(typeof window.ethereum!=='undefined'){
      const web3 = new Web3(window.ethereum);
      const netId = await web3.eth.net.getId();
      const accounts = await web3.eth.getAccounts();

      //load balance
      if(typeof accounts[0] !=='undefined'){
        const balance = await web3.eth.getBalance(accounts[0]);
        this.setState({account: accounts[0], balance: balance, web3: web3});
      } else {
        window.alert('Please login with MetaMask');
      }

      //load contracts
      try {
        const token = new web3.eth.Contract(Token.abi, Token.networks[netId].address);
        const dbank = new web3.eth.Contract(dBank.abi, dBank.networks[netId].address);
        const dBankAddress = dBank.networks[netId].address;
        this.setState({token: token, dbank: dbank, dBankAddress: dBankAddress});
      } catch (e) {
        console.log('Error', e);
        window.alert('Contracts not deployed to the current network');
      }

      // load bank balance data
      try{
        const dbank = this.state.dbank;
        const token = this.state.token;
        const account = this.state.account;
        var bankBalance = await dbank.methods.etherBalanceOf(account).call();
        bankBalance = await this.toEther(bankBalance);
        var tokenBalance = await token.methods.balanceOf(account).call();
        tokenBalance = await this.toEther(tokenBalance);
        var collateral = await dbank.methods.collateralEther(account).call();
        collateral = await this.toEther(collateral);

        this.setState({bankBalance: bankBalance, tokenBalance: tokenBalance, collateral: collateral});
      }
      catch(e) {
        console.log("Error", e);
        window.alert("Error loading contract data");
      }

      // load image data
      try{
        const dbank = this.state.dbank;
        const imageCount = await dbank.methods.imageCount().call();
        this.setState({ imagesCount: imageCount });
        for(var i=1; i <= imageCount; i++){
          const image = await dbank.methods.images(i).call();
          this.setState({
            images: [...this.state.images, image]
          });
        }
      }
      catch(e) {
        console.log("Error", e);
        window.alert("Error loading Image data");
      }

      this.setState({ loading: false });

    } else {
      window.alert('Please install MetaMask');
    }
  }

  async toEther(amountInWei){
    const web3 = new Web3(window.ethereum);
    return web3.utils.fromWei(amountInWei);
  }

  async setBankBalance(){
    const dbank = this.state.dbank;
    const account = this.state.account;
    var bankBalance = await dbank.methods.etherBalanceOf(account).call();
    bankBalance = await this.toEther(bankBalance);
    this.setState({bankBalance: bankBalance});
  }

  async setTokenBalance(){
    const token = this.state.token;
    const account = this.state.account;
    var tokenBalance = await token.methods.balanceOf(account).call();
    tokenBalance = await this.toEther(tokenBalance);
    this.setState({tokenBalance: tokenBalance});
  }

  async setCollateral(){
    const web3 = new Web3(window.ethereum);
    const dbank = this.state.dbank;
    const account = this.state.account;
    var collateral = await dbank.methods.collateralEther(account).call();
    collateral = await this.toEther(collateral);
    this.setState({collateral: collateral});
  }

  async gradeImage(){
    const classifier = ml5.imageClassifier('MobileNet', modelLoaded);

    function modelLoaded() {
      console.log('Model Loaded!');
    }

    const image = document.getElementById('image');
    var grade;
    await classifier.predict(image, 5, function(err, results) {
      if(results){
        grade = results[0].probability;
        grade = parseInt(40 * grade);
      }
      else if(err){
        console.log("Error : " + err);
      }
    });
    this.setState({grade: grade});
    console.log(this.state.grade);
  }

  captureFile = event => {
    event.preventDefault()
    const file = event.target.files[0];
    const objectURL = URL.createObjectURL(file);
    this.setState({source: objectURL});
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    };

    this.gradeImage();
  }

  uploadImage = description => {
    console.log("Submitting file to ipfs...")

    //adding file to the IPFS
    ipfs.add(this.state.buffer, (error, result) => {
      var grade = this.state.grade * 10 ** 18;
      console.log('Ipfs result', result);
      if(error) {
        console.error(error);
        return
      }

      this.setState({ loading: true })
      this.state.dbank.methods.uploadImage(result[0].hash, description, grade.toString()).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({ loading: false , grade: 0});
        this.setTokenBalance();
      });
    })
  }

  tipImageOwner(id, tipAmount) {
    this.setState({ loading: true })
    this.state.dbank.methods.tipImageOwner(id).send({ from: this.state.account, value: tipAmount }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
    })
  }

  changeNFTVisibility(){
    var visibility = this.state.displayNFTs;
    this.setState({displayNFTs: !visibility});
  }

  async deposit(amount) {
    if(this.state.dbank!=='undefined'){
      var account = this.state.account;
      var dbank = this.state.dbank;
      try{
        await this.state.dbank.methods.deposit().send({value: amount.toString(), from: account});
        this.setBankBalance();
        this.setTokenBalance();
      } catch (e) {
        console.log('Error, deposit: ', e)
      }
    }
  }

  async withdraw(amount) {
    if(this.state.dbank!=='undefined'){
      try{
        await this.state.dbank.methods.withdraw(amount.toString()).send({from: this.state.account});
        this.setBankBalance();
        this.setTokenBalance();
      } catch(e) {
        console.log('Error, withdraw: ', e);
      }
    }
  }

  async transfer(amount, receiver) {
    if(this.state.dbank!=='undefined'){
      var account = this.state.account;
      try{
        await this.state.dbank.methods.transfer(amount.toString(), receiver.toString()).send({from: account});
        this.setBankBalance();
        this.setTokenBalance();
      } catch (e) {
        console.log('Error, deposit: ', e);
      }
    }
  }

  async borrow(amount) {
    if(this.state.dbank!=='undefined'){
      try{
        await this.state.dbank.methods.borrow().send({value: amount.toString(), from: this.state.account});
        this.setTokenBalance();
        this.setCollateral();
      } catch (e) {
        console.log('Error, borrow: ', e);
      }
    }
  }

  async payOff(e) {
    e.preventDefault()
    if(this.state.dbank!=='undefined'){
      try{
        const collateralEther = await this.state.dbank.methods.collateralEther(this.state.account).call({from: this.state.account});
        const tokenBorrowed = collateralEther/2;
        await this.state.token.methods.approve(this.state.dBankAddress, tokenBorrowed.toString()).send({from: this.state.account});
        await this.state.dbank.methods.payOff().send({from: this.state.account});
        this.setTokenBalance();
        this.setCollateral();
      } catch(e) {
        console.log('Error, pay off: ', e);
      }
    }
  }

  startTimer() {
    if (this.timer == 0 && this.state.seconds > 0) {
      this.timer = setInterval(this.countDown, 1000);
    }
  }

  async countDown() {
    let seconds = this.state.seconds - 1;
    this.setState({
      time: this.secondsToTime(seconds),
      seconds: seconds,
    });

    if (seconds == 0) {
      this.setState({ seconds: 2 });
      var dbank = this.state.dbank;
      var token = this.state.token;
      var account = this.state.account;
      // console.log(account);
      if(dbank!=='undefined'){
        try{
            // await dbank.methods.mintToken().send({from: account});
          } catch(e) {
            console.log('Error, minting: ', e);
          }
          
      }
    }
  }

  secondsToTime(secs) {
    let hours, seconds, minutes;
    hours = Math.floor(secs / (60 * 60));
    let divisorForMinutes = secs % (60 * 60);
    minutes = Math.floor(divisorForMinutes / 60);
    let divisorForSeconds = divisorForMinutes % 60;
    seconds = Math.ceil(divisorForSeconds);

    let obj = {
      h: hours,
      m: minutes,
      s: seconds,
    };

    return obj;
  }

  async componentDidMount() {
    let timeLeftVar = this.secondsToTime(this.state.seconds);
    this.setState({ time: timeLeftVar });
  }

  creditInterest() {
    this.startTimer();
  }

  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      token: null,
      dbank: null,
      balance: 0,
      time: {},
      seconds: 2,
      bankBalance: 0,
      tokenBalance: 0,
      tokenDebt: 0,
      collateral: 0,
      displayNFTs: true,
      images: [],
      source: null,
      grade: 0,
      showNFTs: true,
      dBankAddress: null
    };

    this.timer = 0;
    this.startTimer = this.startTimer.bind(this);
    this.countDown = this.countDown.bind(this);
    this.uploadImage = this.uploadImage.bind(this);
    this.tipImageOwner = this.tipImageOwner.bind(this);
    this.captureFile = this.captureFile.bind(this);
    this.changeNFTVisibility = this.changeNFTVisibility.bind(this);
  }

  render() {
    this.creditInterest();
    return (
      <div className='text-monospace'>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="https://github.com/SibiChakravarthy7311"
            target="_blank"
            rel="noopener noreferrer"
          >
        <img src={dbank} className="App-logo" alt="logo" height="32"/>
          <b>Sibi's Decentralized ₿ank</b>
        </a>
        </nav>
        <div className="container-fluid mt-5 text-center">
        <br></br>
          <h1>Welcome to d₿ank</h1>
          <h2>{this.state.account}</h2>
          <div className="Account">
            <div className="balance">
              Balance:<p>{this.state.bankBalance}</p>
            </div>
            <div className="interest">
              Interest:<p>{this.state.tokenBalance}</p>
            </div>
          </div>
          <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
              <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example">
                <Tab eventKey="deposit" title="Deposit">
                  <div>
                  <br></br>
                    How much do you want to deposit?
                    <br></br>
                    (min. amount is 0.01 ETH)
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      let amount = this.depositAmount.value
                      amount = amount * 10**18 //convert to wei
                      this.deposit(amount)
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='depositAmount'
                          step="0.01"
                          type='number'
                          ref={(input) => { this.depositAmount = input }}
                          className="form-control form-control-md"
                          placeholder='amount...'
                          required />
                      </div>
                      <button type='submit' className='btn btn-primary'>DEPOSIT</button>
                    </form>

                  </div>
                </Tab>

                <Tab eventKey="withdraw" title="Withdraw">
                  <div>
                  <br></br>
                    Enter the amount to withdraw
                    <br></br>
                    (min. amount is 0.01 ETH)
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      let amount = this.withdrawAmount.value
                      amount = amount * 10**18 //convert to wei
                      this.withdraw(amount)
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='withdrawAmount'
                          step="0.01"
                          type='number'
                          ref={(input) => { this.withdrawAmount = input }}
                          className="form-control form-control-md"
                          placeholder='amount...'
                          required />
                      </div>
                      <button type='submit' className='btn btn-primary'>WITHDRAW</button>
                    </form>

                  </div>
                </Tab>

                <Tab eventKey="transfer" title="Transfer">
                  <div>
                  <br></br>
                    Enter the account number and amount to transfer...
                    <br></br>
                    (min. amount is 0.01 ETH)
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault()

                      let amount = this.transferAmount.value;
                      amount = amount * 10**18 //convert to wei
                      let account = this.accountNumber.value;
                      this.transfer(amount, account)
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                            id='accountNumber'
                            step="0.01"
                            type='text'
                            ref={(input) => { this.accountNumber = input }}
                            className="form-control form-control-md"
                            placeholder='Account Number...'
                            required />
                        <input
                          id='transferAmount'
                          step="0.01"
                          type='number'
                          ref={(input) => { this.transferAmount = input }}
                          className="form-control form-control-md"
                          placeholder='Amount...'
                          required />
                      </div>
                      <button type='submit' className='btn btn-primary'>TRANSFER</button>
                    </form>

                  </div>
                </Tab>

                <Tab eventKey="borrow" title="Borrow">
                  <div>

                  <br></br>
                    Do you want to borrow tokens?
                    <br></br>
                    (You'll get 50% of collateral, in Tokens)
                    <br></br>
                    Type collateral amount (in ETH)
                    <br></br>
                    <br></br>
                    <div className="debtDetails">
                      <div className="collateral">
                        Collateral:<p>{this.state.collateral}</p>
                      </div>
                      <div className="tokenDebt">
                        Token Debt:<p>{this.state.collateral / 2}</p>
                      </div>
                    </div>
                    <form onSubmit={(e) => {

                      e.preventDefault()
                      let amount = this.borrowAmount.value
                      amount = amount * 10 **18 //convert to wei
                      this.borrow(amount)
                    }}>
                      <div className='form-group mr-sm-2'>
                        <input
                          id='borrowAmount'
                          step="0.01"
                          type='number'
                          ref={(input) => { this.borrowAmount = input }}
                          className="form-control form-control-md"
                          placeholder='Collateral Ether...'
                          required />
                      </div>
                      <button type='submit' className='btn btn-primary'>BORROW</button>
                    </form>
                  </div>
                </Tab>

                <Tab eventKey="payOff" title="Payoff">
                  <div>

                  <br></br>
                    Do you want to payoff the loan?
                    <br></br>
                    (You'll receive your collateral - collateral fee(10%))
                    <br></br>
                    <br></br>
                    <div className="debtDetails">
                      <div className="collateral">
                        Collateral:<p>{this.state.collateral}</p>
                      </div>
                      <div className="tokenDebt">
                        Token Debt:<p>{this.state.collateral / 2}</p>
                      </div>
                    </div>
                    <button type='submit' className='btn btn-primary' onClick={(e) => this.payOff(e)}>PAYOFF</button>
                  </div>
                </Tab>

                <Tab eventKey="fundraiser" title="Fundraiser">
                  <div>

                    <br></br>
                    Deposit an NFT for fundraising
                    <br></br>
                    (You'll get 50% of calculated NFT value in Tokens,
                    <br></br>
                    and your NFT will be posted for fundraising)

                    <img src={this.state.source} id="image" alt=""/>
                    { this.state.loading
                      ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
                      :
                      <Main
                          account={this.state.account}
                          grade={this.state.grade}
                          images={this.state.images}
                          captureFile={this.captureFile}
                          uploadImage={this.uploadImage}
                          tipImageOwner={this.tipImageOwner}
                          displayNFTs={this.state.displayNFTs}
                          changeNFTVisibility={this.changeNFTVisibility}
                        /> 
                    }
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

export default App;
