import React, { Component } from 'react';
import "./CertificatesMain.css";

class CertificatesMain extends Component {
  render() {
    console.log(this.props.certificates);
    return (
      <div className="container-fluid mt-5">
        <div className='certificateCanvas hidden'>
          <canvas ref="canvas" width={2000} height={1414} crossOrigin='anonymous'/>
          <img ref="image" src={"https://i.imgur.com/QTdtDfs.png"} alt="Certificate Template" className="hidden" crossOrigin='anonymous'/>
        </div>
        <div className="row">
          <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '500px' }}>
            <div className="content mr-auto ml-auto">
              <p>&nbsp;</p>
              { this.props.certificates.map((certificate, key) => {
                return(
                  <div className="card mb-4" key={key} >
                    <div className="card-header">
                      <p>{certificate.courseName}</p>
                    </div>
                    <ul id="certificateList" className="list-group list-group-flush">
                      <li className="list-group-item">
                        <p className="text-center"><img src={`https://ipfs.infura.io/ipfs/${certificate.hash}`} alt="Certificate" style={{ maxWidth: '420px'}}/></p>
                      </li>
                      <li className="list-group-item">
                        <p className="text-center">{certificate.hash}</p>
                      </li>
                    </ul>
                  </div>
                )
              })}
            </div>
          </main>
        </div>
      </div>
    );
  }
}

export default CertificatesMain;
