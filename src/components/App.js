import React, { Component } from "react";
import "./App.css";
import Web3 from "web3";
import Navbar from "./Navbar.js";
import BankApp from "./BankAppComponents/BankApp";
import Courses from "./CourseAppComponents/Courses";
import NFTs from "./NFTsComponents/NFTs";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ParticleSettings from "./ParticleSettings";


class App extends Component {
  async UNSAFE_componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch);
  }

  async loadBlockchainData(dispatch) {
    if (typeof window.ethereum !== "undefined") {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();

      //load balance
      if (typeof accounts[0] !== "undefined") {
        const balance = await web3.eth.getBalance(accounts[0]);
        this.setState({ account: accounts[0], balance: balance, web3: web3 });
      } else {
        window.alert("Please login with MetaMask");
      }
    } else {
      window.alert("Please install MetaMask");
    }
  }

  constructor(props) {
    super(props);
    this.state = {
      web3: "undefined",
      account: "",
      balance: 0,
    };
  }

  render() {
    return (
      <div className="container">
        <div className="backWall" style={{ position: "absolute" }}>
          <ParticleSettings />
        </div>
        <div className="text-monospace">
          <BrowserRouter>
            <Navbar account={this.state.account} />
            <Routes>
              <Route exact path='/' element={<BankApp/>} />
              <Route exact path='/courses' element={<Courses/>} />
              <Route exact path='/nfts' element={<NFTs/>} />
            </Routes>
          </BrowserRouter>
        </div>
      </div>
    );
  }
}

export default App;
