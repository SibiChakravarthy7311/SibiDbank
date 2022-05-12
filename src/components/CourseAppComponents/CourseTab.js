import dBank from "../../abis/dBank.json";
import Token from "../../abis/Token.json";
import React, { Component } from 'react';
import CoursesMain from './CoursesMain'
import Web3 from 'web3';
import "./CourseTab.css";

//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

class CourseTab extends Component {

  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
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
      const dBankAddress = dBank.networks[networkId].address;
      const token = new web3.eth.Contract(
        Token.abi,
        Token.networks[networkId].address
      );
      this.setState({ dbank })
      this.setState({ dBankAddress })
      this.setState({ token })
      const coursesCount = await dbank.methods.courseCount().call()
      this.setState({ coursesCount })
      // Load courses
      for (var i = 1; i <= coursesCount; i++) {
        const course = await dbank.methods.courses(i).call()
        const courseCompletion = await dbank.methods.courseCompleted(this.state.account, course.id).call();
        var courseCompleted = this.state.courseCompleted;
        var videoDisplay = this.state.videoDisplay;
        courseCompleted[course.id] = courseCompletion;
        videoDisplay[course.id] = false;
        this.setState({
          courses: [...this.state.courses, course],
          courseCompleted: courseCompleted,
          videoDisplay: videoDisplay
        })
      }
      this.setState({ loading: false})
    } else {
      window.alert('Courses contract not deployed to detected network.')
    }
  }

  addCourse = (courseName, courseLink) => {
    console.log("Submitting file to ipfs...")

    //adding file to the IPFS
      this.setState({ loading: true })
      this.state.dbank.methods.addCourse(courseName, courseLink).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
  }

  async completeCourse(id, coursename, blob){
    console.log("Completing Course " + id + ' : ' + coursename);
    console.log(blob);
    const objectURL = URL.createObjectURL(blob);
    this.setState({ source: objectURL });
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(blob);
    console.log(reader)

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) });
      console.log("buffer", this.state.buffer);
      this.getCertificate(id, coursename);
    };
  }

  async getCertificate(id, coursename){
    console.log("Submitting file to ipfs...");

    //adding file to the IPFS
    ipfs.add(this.state.buffer, (error, result) => {
      console.log("Ipfs result", result);
      if (error) {
        console.error(error);
        return;
      }

      this.setState({ loading: true });
      try{
        this.state.token.methods
            .approve(this.state.dBankAddress, (3 * 10 ** 18).toString())
            .send({ from: this.state.account });
        this.state.dbank.methods
          .completeCourse(id, result[0].hash, coursename)
          .send({ from: this.state.account })
          .on("transactionHash", (hash) => {
            this.setState({ loading: false });
          });
        this.props.setTokenBalance();
      } catch (e) {
        console.log("Error, pay off: ", e);
      }
    });

    
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      dbank: null,
      courses: [],
      videoDisplay: {},
      courseCompleted: {},
      loading: true
    }

    this.addCourse = this.addCourse.bind(this)
    this.completeCourse = this.completeCourse.bind(this)
    this.getCertificate = this.getCertificate.bind(this)
  }

  render() {
    return (
      // <ErrorBoundary>
        <div>
          { this.state.loading
            ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
            : <CoursesMain
                courses={this.state.courses}
                captureFile={this.captureFile}
                addCourse={this.addCourse}
                completeCourse={this.completeCourse}
                account={this.state.account}
                getCertificate={this.getCertificate}
                courseCompleted={this.state.courseCompleted}
                videoDisplay={this.state.videoDisplay}
              />
          }
        </div>
      // </ErrorBoundary>
    );
  }
}

export default CourseTab;