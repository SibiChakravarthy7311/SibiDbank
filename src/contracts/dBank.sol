// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./Token.sol";

contract dBank {

  Token private token;

  mapping(address => uint) public depositStart;
  mapping(address => uint) public etherBalanceOf;
  mapping(address => uint) public collateralEther;

  mapping(address => bool) public isDeposited;
  mapping(address => bool) public isBorrowed;

  event Deposit(address indexed user, uint etherAmount, uint timeStart);
  event Withdraw(address indexed user, uint etherAmount, uint depositTime, uint interest);
  event Transfer(address indexed user, uint amount, address receiver);
  event Borrow(address indexed user, uint collateralEtherAmount, uint borrowedTokenAmount);
  event PayOff(address indexed user, uint fee);

  uint public imageCount;
  
  struct Image{
    uint id;
    string hash;
    string description;
    uint tipAmount;
    address payable author;
  }

  event ImageCreated(
    uint id,
    string hash,
    string description,
    uint tipAmount,
    address payable author
  );

  event ImageTipped(
    uint id,
    string hash,
    string description,
    uint tipAmount,
    address payable author
  );

  // Store Images
  mapping(uint => Image) public images;

  constructor(Token _token) public {
    token = _token;
  }

  function deposit() payable public {
    // require(isDeposited[msg.sender] == false, 'Error, deposit already active');
    require(msg.value>=1e16, 'Error, deposit must be >= 0.01 ETH');

    if(etherBalanceOf[msg.sender] > 0){
      uint depositTime = block.timestamp - depositStart[msg.sender];
      uint interestPerSecond = 316680170 * (etherBalanceOf[msg.sender] / 1e16);
      uint interest = interestPerSecond * depositTime;
      depositStart[msg.sender] = 0;
      token.mint(msg.sender, interest); //interest to user
    }

    etherBalanceOf[msg.sender] = etherBalanceOf[msg.sender] + msg.value;
    depositStart[msg.sender] = depositStart[msg.sender] + block.timestamp;

    isDeposited[msg.sender] = true; //activate deposit status
    emit Deposit(msg.sender, msg.value, block.timestamp);
  }

  function withdraw(uint amount) public {
    // require(isDeposited[msg.sender]==true, 'Error, no previous deposit');
    require(etherBalanceOf[msg.sender] >= amount, 'Account balance is 0');
    uint userBalance = etherBalanceOf[msg.sender]; //for event

    //check user's hodl time
    uint depositTime = block.timestamp - depositStart[msg.sender];
    uint interestPerSecond = 31668017 * (etherBalanceOf[msg.sender] / 1e16);
    uint interest = interestPerSecond * depositTime;

    msg.sender.transfer(amount); //eth back to user
    token.mint(msg.sender, interest); //interest to user

    depositStart[msg.sender] = block.timestamp;
    etherBalanceOf[msg.sender] = etherBalanceOf[msg.sender] - amount;

    emit Withdraw(msg.sender, amount, depositTime, interest);
  }

  function transfer(uint amount, address receiver) public{
    require(etherBalanceOf[msg.sender] >= amount, "Error, insufficient funds");
    require(receiver != address(0x0), "Invalid receiver address");

    uint depositTime = block.timestamp - depositStart[msg.sender];
    uint interestPerSecond = 316680170 * (etherBalanceOf[msg.sender] / 1e16);
    uint interest = interestPerSecond * depositTime;
    token.mint(msg.sender, interest);
    depositStart[msg.sender] = 0;

    if(etherBalanceOf[receiver] > 0){
      depositTime = block.timestamp - depositStart[receiver];
      interestPerSecond = 316680170 * (etherBalanceOf[receiver] / 1e16);
      interest = interestPerSecond * depositTime;
      depositStart[receiver] = 0;
      token.mint(receiver, interest); //interest to user
    }

    etherBalanceOf[msg.sender] -= amount;
    etherBalanceOf[receiver] += amount;
    depositStart[msg.sender] = depositStart[msg.sender] + block.timestamp;
    depositStart[receiver] = depositStart[receiver] + block.timestamp;

    emit Transfer(msg.sender, amount, receiver);
  }

  function borrow() payable public {
    require(msg.value>=1e16, 'Error, collateral must be >= 0.01 ETH');

    collateralEther[msg.sender] = collateralEther[msg.sender] + msg.value;
    uint tokensToMint = msg.value / 2;
    token.mint(msg.sender, tokensToMint);

    emit Borrow(msg.sender, collateralEther[msg.sender], tokensToMint);
  }

  function payOff() public {
    require(collateralEther[msg.sender] > 0, "Error, no active loans");
    require(token.transferFrom(msg.sender, address(this), collateralEther[msg.sender]/2), "Error, can't receive tokens"); //must approve dBank 1st

    uint fee = collateralEther[msg.sender]/10; //calc 10% fee

    msg.sender.transfer(collateralEther[msg.sender]-fee);
    collateralEther[msg.sender] = 0;

    emit PayOff(msg.sender, fee);
  }

  function uploadImage(string memory _imageHash, string memory _description, uint value) public{
    require(bytes(_imageHash).length > 0, "Image cannot be empty");
    require(bytes(_description).length > 0, "Description is required");

    require(msg.sender != address(0x0), "Invalid sender");

    imageCount++;
    images[imageCount] = Image(imageCount, _imageHash, _description, 0, msg.sender);
    token.mint(msg.sender, value);
    emit ImageCreated(imageCount, _imageHash, _description, 0, msg.sender);
    
  }
  
  // Tip Images
  function tipImageOwner(uint _id) public payable{
    require(_id > 0 && _id <= imageCount);

    Image memory _image = images[_id];
    address payable _author = _image.author;
    _author.transfer(msg.value);
    _image.tipAmount = _image.tipAmount + msg.value;
    images[_id] = _image;

    emit ImageTipped(_id, _image.hash, _image.description, _image.tipAmount, _author);
  }
}
