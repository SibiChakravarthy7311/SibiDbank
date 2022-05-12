import React, { Component } from 'react';
import dBank from "../../abis/dBank.json";
import CertificatesMain from './CertificatesMain';
import Web3 from 'web3';
import './CourseTab.css';


class CertificateTab extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    // Network ID
    const networkId = await web3.eth.net.getId()
    const networkData = dBank.networks[networkId]
    if(networkData) {
      const dbank = new web3.eth.Contract(dBank.abi, networkData.address)
      this.setState({ dbank })
      const certificateCount = await dbank.methods.userCertificateCount(this.state.account).call()
      this.setState({ certificateCount })
      // Load courses
      for (var i = 1; i <= certificateCount; i++) {
        const certificate = await dbank.methods.userCertificates(this.state.account, i).call()
        this.setState({
          certificates: [...this.state.certificates, certificate]
        })
      }
      this.setState({ loading: false})
    } else {
      window.alert('Courses contract not deployed to detected network.')
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      dbank: null,
      certificates: [],
      loading: true
    }

  }

  render() {
    return (
      <div>
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <CertificatesMain
              certificates={this.state.certificates}
              account={this.state.account}
            />
        }
      </div>
    );
  }
}

export default CertificateTab;