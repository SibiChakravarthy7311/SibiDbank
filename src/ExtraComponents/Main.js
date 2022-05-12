import React, { Component } from "react";
import Identicon from "identicon.js";
import Web3 from "web3";
import "./Main.css";
import ether from "../ether.png";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';


class Main extends Component {

  changeNFTVisibility() {
    var visibility = this.state.displayNFTs;
    if(visibility){
      this.setState({ displayNFTs: !visibility, NFTButtonText: "Show NFTs"});
    }
    else{
      this.setState({ displayNFTs: !visibility, NFTButtonText: "Hide NFTs"});
    }
  }

  constructor(props) {
    super(props);
    this.state = {
      displayNFTs: true,
      NFTButtonText: "Hide NFTs"
    };
  }

  render() {
    const web3 = new Web3(window.ethereum);
    const nftData = (
      <div>
        <p>&nbsp;</p>
        {this.props.images.map((image, key) => {
          return (
            <div className="card mb-4 NFT" key={key}>
              <div className="card-header">
                <img
                  className="mr-2"
                  width="30"
                  height="30"
                  alt="Image_unavailable"
                  src={`data:image/png;base64,${new Identicon(
                    image.author,
                    30
                  ).toString()}`}
                />
                {/* <small className="text-muted">{image.author}</small> */}
                <small className="text-muted">{image.hash}</small>
                <br></br>
                {image.inAuction ? (
                    <div className="inAuction">
                      <p>IN AUCTION</p>
                    </div>
                  ) : 
                  <small className="float-right mt-1 text-muted">
                  </small>
                  }

              </div>
              <ul id="imageList" className="list-group list-group-flush">
                <li className="list-group-item">
                  <p className="text-center">
                    <img
                      src={ `https://ipfs.infura.io/ipfs/${image.hash}` }
                      alt={image.description}
                      style={{ maxWidth: "420px" }}
                    />
                  </p>
                  <p>{image.description}</p>
                </li>
                <div key={key} className="imageStatus">
                  <div className="auctionPost">
                    <small className="float-left mt-1 text-muted imageValue">
                      NFT VALUE:{" "}
                      {web3.utils.fromWei(image.value.toString(), "Ether")}{" "}
                      ETH
                    </small>
                  </div>

                  {image.author === this.props.account ? 
                    <div>
                      {image.inAuction ? 
                        <div className="auctionPost">
                          <small className="float-right mt-1 text-muted">
                            POSTED FOR AUCTION
                          </small>
                        </div>
                        :
                        <div className="auctionPost">
                          <button
                            className="btn btn-primary btn-sm float-right pt-0"
                            name={image.id}
                            onClick={(event) => {
                              // let imageValue = image.value;
                              console.log(event.target.name);
                              this.props.postForAuction(event.target.name);
                            }}
                          >
                            POST FOR AUCTION
                          </button>
                        </div>
                      }
                    </div>
                    :
                    <div>
                      {image.inAuction ? 
                        <div>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              let amount = this.bidAmount.value;
                              amount = amount * 10 ** 18; //convert to wei.
                              this.props.bid(image.id, amount);
                            }}
                          >
                            <div className="bidInput">
                              <div className="amountInputBid">
                                <div className="etherSymbolBid">
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
                                  id="bidAmount"
                                  step="0.01"
                                  type="number"
                                  ref={(input) => {
                                    this.bidAmount = input;
                                  }}
                                  className="form-control form-control-md"
                                  placeholder="Place your bid..."
                                  required
                                />
                              </div>
                              <button type="submit" className="btn btn-primary bid">
                                BID
                              </button>
                            </div>
                          </form>
                        </div>
                        :
                        <div></div>
                      }
                    </div>
                  }
                  
                </div>
              </ul>
            </div>
          );
        })}
      </div>
    );
    return (
      <div className="fundraiser">
        <div className="container-fluid mt-5">
          <div className="row">
            <main
              role="main"
              className="col-lg-12 ml-auto mr-auto"
              style={{ maxWidth: "500px" }}
            >
              <div className="content mr-auto ml-auto">
                <p>&nbsp;</p>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const description = this.imageDescription.value;
                    this.props.uploadImage(description);
                  }}
                >
                  <input
                    id="fileInput"
                    type="file"
                    accept=".jpg, .jpeg, .png, .bmp, .gif"
                    onChange={this.props.captureFile}
                  />
                  <br></br>
                  <br></br>
                  <div className="ether">
                    <div className="etherBox">
                      <div className="etherTag">
                        Estimated Ether Worth
                      </div>
                      <div className="etherValue">
                        &nbsp;{this.props.grade}
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
                  <div className="form-group mr-sm-2">
                    <br></br>
                    <input
                      id="imageDescription"
                      type="text"
                      ref={(input) => {
                        this.imageDescription = input;
                      }}
                      className="form-control"
                      placeholder="Image description..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                  >
                    Upload
                  </button>
                </form>

                <br></br>
                <br></br>

                <div className="NFTViewSwitcher"
                  onClick={(event) => {
                    this.changeNFTVisibility();
                  }}
                >
                  <div className="NFTViewSwitcherButton">
                  {this.state.NFTButtonText}&nbsp;&nbsp;
                    <div className="NFTViewSwitchIcon">
                      {
                        this.state.displayNFTs ?
                        <KeyboardArrowUpIcon />
                        :
                        <KeyboardArrowDownIcon />
                      }
                    </div>
                  </div>
                </div>

                {
                  this.state.displayNFTs ?
                  nftData 
                  :
                  <div></div>
                }
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default Main;
