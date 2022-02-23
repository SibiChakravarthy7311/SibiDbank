import React, {Component} from "react";
import bank from '../dbank.png'
import './Navbar.css';

class Navbar extends Component {
    // Main app template to render
    render() {
        return (
            <nav className='navbar navbar-dark fixed-top shadow p-0' style={{backgroundColor: 'black', height: '50px'}}>
                <a className='navbar-brand col-sm-3 col-md-2 mr-0' 
                style={{color:'white'}}>
                    <img src={bank} width='50' height='30' className="d-inline-block align-top" alt="Decentralized Bank"/>&nbsp;&nbsp;
                    <span>Catena Decentralized Bank</span>
                </a>
                <ul>
                    <li className="text-nowrap d-none nav-item d-sm-none d-sm-block" style={{marginTop: '3%'}}>
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