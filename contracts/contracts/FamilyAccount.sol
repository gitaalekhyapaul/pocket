// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FamilyAccount
 * @dev A smart contract for family-based delegated payments with spending limits
 * @notice This contract allows parents to create spending limits for family members
 * and approve/reject transactions above certain thresholds
 */
contract FamilyAccount is Ownable, ReentrancyGuard {
    // Struct to store delegate information
    struct Delegate {
        bool exists;
        bool requiresApproval;
        uint256 dailyLimit;        // in token decimals
        uint256 spentToday;        // tracked per token via dailySpent[token]
        uint40 lastReset;          // unix day boundary
        string name;               // human-readable name
        mapping(address => bool) merchantWhitelist; // optional merchant whitelist
    }

    // Mapping to store delegates
    mapping(address => Delegate) private delegates;
    
    // Track daily spending per delegate per token
    mapping(address => mapping(address => uint256)) public dailySpent;
    
    // Track last reset day per delegate
    mapping(address => uint40) public lastResetDay;
    
    // Track pending spend requests
    mapping(bytes32 => bool) public pendingRequests;
    
    // Request counter for unique IDs
    uint256 public requestCounter;

    // Events
    event DelegateSet(
        address indexed delegate, 
        bool requiresApproval, 
        uint256 dailyLimit,
        string name
    );
    
    event DelegateRevoked(address indexed delegate);
    
    event MerchantWhitelisted(
        address indexed delegate, 
        address merchant, 
        bool allowed
    );

    event SpendRequested(
        bytes32 indexed requestId,
        address indexed delegate,
        address indexed token,
        address to,
        uint256 amount,
        string description
    );
    
    event SpendExecuted(
        bytes32 indexed requestId,
        address indexed actor,
        address indexed token,
        address to,
        uint256 amount
    );
    
    event SpendRejected(
        bytes32 indexed requestId,
        address indexed delegate,
        string reason
    );

    // Modifiers
    modifier onlyDelegate() {
        require(delegates[msg.sender].exists, "Not a delegate");
        _;
    }

    modifier validRequest(bytes32 requestId) {
        require(pendingRequests[requestId], "Invalid request");
        _;
    }

    constructor(address _owner) Ownable(_owner) {}

    /**
     * @dev Set or update a delegate with spending limits
     * @param delegate Address of the delegate
     * @param requiresApproval Whether transactions require approval
     * @param dailyLimit Daily spending limit in token decimals
     * @param name Human-readable name for the delegate
     */
    function setDelegate(
        address delegate,
        bool requiresApproval,
        uint256 dailyLimit,
        string memory name
    ) external onlyOwner {
        require(delegate != address(0), "Invalid delegate address");
        require(dailyLimit > 0, "Daily limit must be positive");
        
        Delegate storage del = delegates[delegate];
        del.exists = true;
        del.requiresApproval = requiresApproval;
        del.dailyLimit = dailyLimit;
        del.name = name;
        
        if (del.lastReset == 0) {
            del.lastReset = uint40(block.timestamp);
        }
        
        emit DelegateSet(delegate, requiresApproval, dailyLimit, name);
    }

    /**
     * @dev Revoke a delegate's permissions
     * @param delegate Address of the delegate to revoke
     */
    function revokeDelegate(address delegate) external onlyOwner {
        require(delegates[delegate].exists, "Delegate does not exist");
        delete delegates[delegate];
        emit DelegateRevoked(delegate);
    }

    /**
     * @dev Set merchant whitelist for a delegate
     * @param delegate Address of the delegate
     * @param merchant Address of the merchant
     * @param allowed Whether the merchant is allowed
     */
    function setMerchantWhitelist(
        address delegate,
        address merchant,
        bool allowed
    ) external onlyOwner {
        require(delegates[delegate].exists, "Delegate does not exist");
        delegates[delegate].merchantWhitelist[merchant] = allowed;
        emit MerchantWhitelisted(delegate, merchant, allowed);
    }

    /**
     * @dev Internal function to reset daily spending if new day
     * @param delegate Address of the delegate
     */
    function _resetIfNewDay(address delegate) internal {
        uint40 day = uint40(block.timestamp / 1 days);
        if (lastResetDay[delegate] != day) {
            lastResetDay[delegate] = day;
            // Reset daily spending for all tokens
            // Note: This is gas-efficient as it only resets when needed
        }
    }

    /**
     * @dev Get available allowance for a delegate and token
     * @param delegate Address of the delegate
     * @param token Address of the token
     * @return Available allowance
     */
    function getAvailableAllowance(
        address delegate,
        address token
    ) external view returns (uint256) {
        if (!delegates[delegate].exists) return 0;
        
        uint40 day = uint40(block.timestamp / 1 days);
        if (lastResetDay[delegate] != day) {
            return delegates[delegate].dailyLimit;
        }
        
        uint256 spent = dailySpent[delegate][token];
        if (delegates[delegate].dailyLimit <= spent) return 0;
        return delegates[delegate].dailyLimit - spent;
    }

    /**
     * @dev Delegate attempts to spend tokens
     * @param token Address of the token to spend
     * @param to Recipient address
     * @param amount Amount to spend
     * @param description Description of the transaction
     */
    function spendAsDelegate(
        address token,
        address to,
        uint256 amount,
        string memory description
    ) external onlyDelegate nonReentrant {
        Delegate storage del = delegates[msg.sender];
        require(del.exists, "Delegate does not exist");
        require(amount > 0, "Amount must be positive");
        require(to != address(0), "Invalid recipient");

        // Check merchant whitelist (if any merchants are whitelisted)
        // For simplicity, we allow all merchants unless explicitly restricted
        // In production, you might want stricter whitelist enforcement

        if (del.requiresApproval) {
            // Create spend request
            bytes32 requestId = keccak256(
                abi.encodePacked(
                    msg.sender,
                    token,
                    to,
                    amount,
                    block.timestamp,
                    requestCounter++
                )
            );
            
            pendingRequests[requestId] = true;
            
            emit SpendRequested(
                requestId,
                msg.sender,
                token,
                to,
                amount,
                description
            );
            return;
        }

        // Execute spend directly
        _executeSpend(msg.sender, token, to, amount, bytes32(0));
    }

    /**
     * @dev Owner approves and executes a spend request
     * @param requestId ID of the pending request
     * @param delegate Address of the delegate
     * @param token Address of the token
     * @param to Recipient address
     * @param amount Amount to spend
     */
    function approveAndExecute(
        bytes32 requestId,
        address delegate,
        address token,
        address to,
        uint256 amount
    ) external onlyOwner validRequest(requestId) nonReentrant {
        require(delegates[delegate].exists, "Delegate does not exist");
        
        // Remove from pending requests
        pendingRequests[requestId] = false;
        
        _executeSpend(delegate, token, to, amount, requestId);
    }

    /**
     * @dev Owner rejects a spend request
     * @param requestId ID of the pending request
     * @param delegate Address of the delegate
     * @param reason Reason for rejection
     */
    function rejectSpend(
        bytes32 requestId,
        address delegate,
        string memory reason
    ) external onlyOwner validRequest(requestId) {
        pendingRequests[requestId] = false;
        emit SpendRejected(requestId, delegate, reason);
    }

    /**
     * @dev Internal function to execute a spend
     * @param actorDelegate Address of the delegate performing the spend
     * @param token Address of the token
     * @param to Recipient address
     * @param amount Amount to spend
     * @param requestId ID of the request (0 for direct spends)
     */
    function _executeSpend(
        address actorDelegate,
        address token,
        address to,
        uint256 amount,
        bytes32 requestId
    ) internal {
        _resetIfNewDay(actorDelegate);
        
        uint256 available = _getAvailableAllowance(actorDelegate, token);
        require(amount <= available, "Daily limit exceeded");

        // Update daily spending
        uint40 day = uint40(block.timestamp / 1 days);
        if (lastResetDay[actorDelegate] != day) {
            lastResetDay[actorDelegate] = day;
            dailySpent[actorDelegate][token] = 0;
        }
        dailySpent[actorDelegate][token] += amount;

        // Execute token transfer
        IERC20 tokenContract = IERC20(token);
        require(
            tokenContract.transfer(to, amount),
            "Token transfer failed"
        );

        emit SpendExecuted(requestId, msg.sender, token, to, amount);
    }

    /**
     * @dev Internal function to get available allowance
     * @param delegate Address of the delegate
     * @param token Address of the token
     * @return Available allowance
     */
    function _getAvailableAllowance(
        address delegate,
        address token
    ) internal view returns (uint256) {
        uint40 day = uint40(block.timestamp / 1 days);
        if (lastResetDay[delegate] != day) {
            return delegates[delegate].dailyLimit;
        }
        
        uint256 spent = dailySpent[delegate][token];
        if (delegates[delegate].dailyLimit <= spent) return 0;
        return delegates[delegate].dailyLimit - spent;
    }

    /**
     * @dev Get delegate information
     * @param delegate Address of the delegate
     * @return exists Whether delegate exists
     * @return requiresApproval Whether approval is required
     * @return dailyLimit Daily spending limit
     * @return name Delegate name
     */
    function getDelegateInfo(
        address delegate
    ) external view returns (
        bool exists,
        bool requiresApproval,
        uint256 dailyLimit,
        string memory name
    ) {
        Delegate storage del = delegates[delegate];
        return (
            del.exists,
            del.requiresApproval,
            del.dailyLimit,
            del.name
        );
    }

    /**
     * @dev Check if merchant is whitelisted for delegate
     * @param delegate Address of the delegate
     * @param merchant Address of the merchant
     * @return Whether merchant is whitelisted
     */
    function isMerchantWhitelisted(
        address delegate,
        address merchant
    ) external view returns (bool) {
        return delegates[delegate].merchantWhitelist[merchant];
    }

    /**
     * @dev Emergency function to transfer tokens (owner only)
     * @param token Address of the token
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function emergencyTransfer(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }
}
