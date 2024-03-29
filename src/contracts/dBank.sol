// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./Token.sol";

contract dBank {
    Token private token;

    mapping(address => uint256) public depositStart;
    mapping(address => uint256) public etherBalanceOf;
    mapping(address => uint256) public collateralEther;

    mapping(address => bool) public isDeposited;
    mapping(address => bool) public isBorrowed;

    event Deposit(address indexed user, uint256 etherAmount, uint256 timeStart);
    event Withdraw(
        address indexed user,
        uint256 etherAmount,
        uint256 depositTime,
        uint256 interest
    );
    event Transfer(address indexed user, uint256 amount, address receiver);
    event Borrow(
        address indexed user,
        uint256 collateralEtherAmount,
        uint256 borrowedTokenAmount
    );
    event PayOff(address indexed user, uint256 fee);

    uint256 public imageCount;

    struct Image {
        uint256 id;
        string hash;
        string description;
        uint256 tipAmount;
        address payable author;
        uint256 value;
        address payable lastBidder;
        uint256 endTime;
        bool inAuction;
        bool loanTaken;
    }

    event ImageCreated(
        uint256 id,
        string hash,
        string description,
        uint256 tipAmount,
        address payable author
    );

    event ImageTipped(
        uint256 id,
        string hash,
        string description,
        uint256 tipAmount,
        address payable author
    );

    // Store Images
    mapping(uint256 => Image) public images;
    mapping(string => bool) public isImageDeposited;

    uint public courseCount = 0;
    mapping(uint => Course) public courses;
    uint public certificateCount = 0;
    mapping(uint => Certificate) public certificates;
    mapping(address => uint) public userCertificateCount;
    mapping(address => mapping(uint => bool)) public courseCompleted;
    mapping(address => mapping(uint => Certificate)) public userCertificates;
    mapping(string => bool) public coursePresent;

    struct Certificate{
        uint id;
        string hash;
        string courseName;
    }

    struct Course {
        uint id;
        string name;
        string link;
    }

    function addCourse(string memory courseName, string memory courseLink) public {
        require(bytes(courseName).length > 0);
        require(msg.sender!=address(0));
        require(coursePresent[courseName] == false);
        coursePresent[courseName] == true;

        courseCount ++;

        courses[courseCount] = Course(courseCount, courseName, courseLink);
    }

    function completeCourse(uint256 id, string memory hash, string memory coursename) public{
        require(
            token.transferFrom(
                msg.sender,
                address(this),
                3e18
            ),
            "Error, can't receive tokens"
        );
        courseCompleted[msg.sender][id] = true;
        certificateCount ++;
        certificates[certificateCount] = Certificate(certificateCount, hash, coursename);
        userCertificateCount[msg.sender] ++;
        userCertificates[msg.sender][userCertificateCount[msg.sender]] = certificates[certificateCount];
    }

    constructor(Token _token) public {
        token = _token;
    }

    function deposit() public payable {
        // require(isDeposited[msg.sender] == false, 'Error, deposit already active');
        require(msg.value >= 1e16, "Error, deposit must be >= 0.01 ETH");

        if (etherBalanceOf[msg.sender] > 0) {
            uint256 depositTime = block.timestamp - depositStart[msg.sender];
            uint256 interestPerSecond = 316680170 *
                (etherBalanceOf[msg.sender] / 1e16);
            uint256 interest = interestPerSecond * depositTime;
            depositStart[msg.sender] = 0;
            token.mint(msg.sender, interest); //interest to user
        }

        etherBalanceOf[msg.sender] = etherBalanceOf[msg.sender] + msg.value;
        depositStart[msg.sender] = depositStart[msg.sender] + block.timestamp;

        isDeposited[msg.sender] = true; //activate deposit status
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }

    function withdraw(uint256 amount) public {
        // require(isDeposited[msg.sender]==true, 'Error, no previous deposit');
        require(etherBalanceOf[msg.sender] >= amount, "Account balance is 0");
        uint256 userBalance = etherBalanceOf[msg.sender]; //for event

        //check user's hodl time
        uint256 depositTime = block.timestamp - depositStart[msg.sender];
        uint256 interestPerSecond = 31668017 *
            (etherBalanceOf[msg.sender] / 1e16);
        uint256 interest = interestPerSecond * depositTime;

        msg.sender.transfer(amount); //eth back to user
        token.mint(msg.sender, interest); //interest to user

        depositStart[msg.sender] = block.timestamp;
        etherBalanceOf[msg.sender] = etherBalanceOf[msg.sender] - amount;

        if (etherBalanceOf[msg.sender] == 0) {
            depositStart[msg.sender] = block.timestamp;
        }

        emit Withdraw(msg.sender, amount, depositTime, interest);
    }

    function transfer(uint256 amount, address receiver) public {
        require(
            etherBalanceOf[msg.sender] >= amount,
            "Error, insufficient funds"
        );
        require(receiver != address(0x0), "Invalid receiver address");

        uint256 depositTime = block.timestamp - depositStart[msg.sender];
        uint256 interestPerSecond = 316680170 *
            (etherBalanceOf[msg.sender] / 1e16);
        uint256 interest = interestPerSecond * depositTime;
        token.mint(msg.sender, interest);
        depositStart[msg.sender] = 0;

        if (etherBalanceOf[receiver] > 0) {
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

        if (etherBalanceOf[msg.sender] == 0) {
            depositStart[msg.sender] = block.timestamp;
        }

        emit Transfer(msg.sender, amount, receiver);
    }

    function borrow() public payable {
        require(msg.value >= 1e16, "Error, collateral must be >= 0.01 ETH");

        collateralEther[msg.sender] = collateralEther[msg.sender] + msg.value;
        uint256 tokensToMint = msg.value * 5;
        token.mint(msg.sender, tokensToMint);

        emit Borrow(msg.sender, collateralEther[msg.sender], tokensToMint);
    }

    function swap() public payable {
        // require(msg.value>=1e17, 'Error, Ether to swap must be >= 0.1 ETH');

        // collateralEther[msg.sender] = collateralEther[msg.sender] + msg.value;
        uint256 tokensToMint = msg.value * 10;
        token.mint(msg.sender, tokensToMint);

        // emit Borrow(msg.sender, collateralEther[msg.sender], tokensToMint);
    }

    function payOff() public {
        require(collateralEther[msg.sender] > 0, "Error, no active loans");
        require(
            token.transferFrom(
                msg.sender,
                address(this),
                collateralEther[msg.sender] * 5
            ),
            "Error, can't receive tokens"
        ); //must approve dBank 1st

        uint256 fee = collateralEther[msg.sender] / 100; //calc 1% fee

        msg.sender.transfer(collateralEther[msg.sender] - fee);
        collateralEther[msg.sender] = 0;

        emit PayOff(msg.sender, fee);
    }

    function startAuction(uint256 _id) public {
        require(_id > 0 && _id <= imageCount);
        Image memory _image = images[_id];
        require(_image.inAuction == false, "Image already in auction");
        require(_image.author == msg.sender);
        _image.inAuction = true;
        _image.endTime = block.timestamp + 1 * 60;
        images[_id] = _image;
    }

    function availLoan(uint id) public payable {
        require(id > 0 && id <= imageCount);
        Image memory _image = images[id];
        _image.loanTaken = true;
        uint tokensToMint = _image.value * 5;
        images[id] = _image;
        token.mint(msg.sender, tokensToMint);
    }

    function payOffLoan(uint id) public {
        require(id > 0 && id <= imageCount);
        Image memory _image = images[id];
        require(
            token.transferFrom(
                msg.sender,
                address(this),
                _image.value * 5
            ),
            "Error, can't receive tokens"
        ); //must approve dBank 1st
        _image.loanTaken = false;
        images[id] = _image;
    }

    function bidForImage(uint256 _id) public payable {
        Image memory _image = images[_id];
        if (_image.endTime < block.timestamp) {
            if (_image.lastBidder != address(0x0)) {
                _image.author.transfer(_image.value);
                _image.author = _image.lastBidder;
            }
            _image.lastBidder = address(0x0);
            _image.inAuction = false;
            images[_id] = _image;
            msg.sender.transfer(msg.value);
            return;
        }
        if (msg.value <= _image.value) {
            msg.sender.transfer(msg.value);
            return;
        }
        if (_image.lastBidder != address(0x0)) {
            _image.lastBidder.transfer(_image.value);
        }
        _image.lastBidder = msg.sender;
        _image.value = msg.value;
        images[_id] = _image;
    }

    function uploadImage(
        string memory _imageHash,
        string memory _description,
        uint256 value
    ) public {
        require(isImageDeposited[_imageHash] == false);
        require(bytes(_imageHash).length > 0, "Image cannot be empty");
        require(bytes(_description).length > 0, "Description is required");

        require(msg.sender != address(0x0), "Invalid sender");
        isImageDeposited[_imageHash] = true;

        imageCount++;
        images[imageCount] = Image(
            imageCount,
            _imageHash,
            _description,
            0,
            msg.sender,
            value,
            address(0x0),
            block.timestamp,
            false,
            false
        );
        token.mint(msg.sender, value);
        emit ImageCreated(imageCount, _imageHash, _description, 0, msg.sender);
    }

    // Tip Images
    function tipImageOwner(uint256 _id) public payable {
        require(_id > 0 && _id <= imageCount);

        Image memory _image = images[_id];
        address payable _author = _image.author;
        _author.transfer(msg.value);
        _image.tipAmount = _image.tipAmount + msg.value;
        images[_id] = _image;

        emit ImageTipped(
            _id,
            _image.hash,
            _image.description,
            _image.tipAmount,
            _author
        );
    }
}
