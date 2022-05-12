import React, {Component} from "react";
import bank from './Images/dbank.png'
import './Navbar.css';
import {Link} from 'react-router-dom';

class Navbar extends Component {
    // Main app template to render
    render() {
        return (
            <nav className='navbar navbar-dark fixed-top shadow p-0' style={{backgroundColor: 'black', height: '50px'}}>
                <a className='navbar-brand col-sm-3 col-md-2 mr-0' style={{color:'white'}}>
                    <img src={bank} width='50' height='30' className="d-inline-block align-top" alt="Decentralized Bank"/>&nbsp;&nbsp;
                    <span>Catena Decentralized Bank</span>
                </a>
                <ul>
                    <li className="text-nowrap d-none nav-item d-sm-none d-sm-block" style={{marginTop: '2%'}}>
                        <Link to="/" style={{ textDecoration: 'none' }}><p>Home</p></Link>
                    </li>
                    &nbsp;&nbsp;&nbsp;
                    <li className="text-nowrap d-none nav-item d-sm-none d-sm-block" style={{marginTop: '2%'}}>
                        <Link to="/courses" style={{ textDecoration: 'none' }}><p>Courses</p></Link>
                    </li>
                    &nbsp;&nbsp;&nbsp;
                    <li className="text-nowrap d-none nav-item d-sm-none d-sm-block" style={{marginTop: '2%'}}>
                        <Link to="/nfts" style={{ textDecoration: 'none' }}><p>NFTs</p></Link>
                    </li>
                    &nbsp;&nbsp;&nbsp;
                    <li className="text-nowrap d-none nav-item d-sm-none d-sm-block" style={{marginTop: '2%'}}>
                        <small style={{color: 'white'}}>
                            ACCOUNT NUMBER: {this.props.account} &nbsp;&nbsp;
                        </small>
                    </li>
                </ul>
            </nav>
        )
    }
}

export default Navbar;