import React, { Component } from "react";
import Identicon from "identicon.js";
import Web3 from "web3";
import "./LoanNFTsMain.css";
import ether from "./ether.png";


class AuctionNFTsMain extends Component {

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
        //   console.log(image.author, this.props.account, image.author == this.props.account);
          return (
            <div>
                { image.inAuction ?
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
                    :
                    <div></div>
                }
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
                {
                  nftData 
                }
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default AuctionNFTsMain;
