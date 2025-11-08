// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TaskStaking
 * @dev Manages staking for educational tasks
 * Teachers stake tokens when creating tasks, students stake when attempting them
 */
contract TaskStaking is Ownable, ReentrancyGuard {
    IERC20 public eduToken;

    struct Task {
        bytes32 taskId;
        address teacher;
        uint256 teacherStake;
        uint256 requiredStudentStake;
        uint256 rewardAmount;
        uint256 yieldRate; // Basis points (e.g., 500 = 5%)
        bool isActive;
        uint256 createdAt;
        uint256 totalAttempts;
        uint256 successfulCompletions;
    }

    struct StudentStake {
        uint256 amount;
        uint256 stakedAt;
        bool isActive;
        bool isCompleted;
        bool hasReceivedReward;
    }

    // Task ID => Task
    mapping(bytes32 => Task) public tasks;

    // Task ID => Student Address => Stake
    mapping(bytes32 => mapping(address => StudentStake)) public studentStakes;

    // Teacher Address => Total Staked
    mapping(address => uint256) public teacherTotalStaked;

    // Teacher Address => Reputation Score (based on participation)
    mapping(address => uint256) public teacherReputation;

    // Student Address => Total Staked
    mapping(address => uint256) public studentTotalStaked;

    // Events
    event TaskCreated(bytes32 indexed taskId, address indexed teacher, uint256 stakeAmount);
    event StudentStaked(bytes32 indexed taskId, address indexed student, uint256 amount);
    event TaskCompleted(bytes32 indexed taskId, address indexed student, uint256 reward);
    event TaskFailed(bytes32 indexed taskId, address indexed student, uint256 penalty);
    event TeacherRewardClaimed(bytes32 indexed taskId, address indexed teacher, uint256 reward);
    event TaskCancelled(bytes32 indexed taskId, address indexed teacher);

    constructor(address _eduToken, address initialOwner) Ownable(initialOwner) {
        eduToken = IERC20(_eduToken);
    }

    /**
     * @dev Teacher creates a task and stakes tokens
     */
    function createTask(
        bytes32 _taskId,
        uint256 _teacherStake,
        uint256 _requiredStudentStake,
        uint256 _rewardAmount,
        uint256 _yieldRate
    ) external nonReentrant {
        require(_teacherStake > 0, "Teacher stake must be positive");
        require(_requiredStudentStake > 0, "Student stake must be positive");
        require(_rewardAmount > 0, "Reward must be positive");
        require(tasks[_taskId].teacher == address(0), "Task already exists");

        // Transfer tokens from teacher
        require(
            eduToken.transferFrom(msg.sender, address(this), _teacherStake),
            "Transfer failed"
        );

        tasks[_taskId] = Task({
            taskId: _taskId,
            teacher: msg.sender,
            teacherStake: _teacherStake,
            requiredStudentStake: _requiredStudentStake,
            rewardAmount: _rewardAmount,
            yieldRate: _yieldRate,
            isActive: true,
            createdAt: block.timestamp,
            totalAttempts: 0,
            successfulCompletions: 0
        });

        teacherTotalStaked[msg.sender] += _teacherStake;
        teacherReputation[msg.sender] += 1; // Increase reputation for creating task

        emit TaskCreated(_taskId, msg.sender, _teacherStake);
    }

    /**
     * @dev Student stakes tokens to attempt a task
     */
    function stakeForTask(bytes32 _taskId) external nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.isActive, "Task is not active");
        require(task.teacher != address(0), "Task does not exist");
        require(studentStakes[_taskId][msg.sender].amount == 0, "Already staked");

        uint256 stakeAmount = task.requiredStudentStake;

        // Transfer tokens from student
        require(
            eduToken.transferFrom(msg.sender, address(this), stakeAmount),
            "Transfer failed"
        );

        studentStakes[_taskId][msg.sender] = StudentStake({
            amount: stakeAmount,
            stakedAt: block.timestamp,
            isActive: true,
            isCompleted: false,
            hasReceivedReward: false
        });

        studentTotalStaked[msg.sender] += stakeAmount;
        task.totalAttempts += 1;

        emit StudentStaked(_taskId, msg.sender, stakeAmount);
    }

    /**
     * @dev Mark task as completed by student (called by backend after verification)
     * Students receive their stake back + reward
     */
    function completeTask(bytes32 _taskId, address _student) external onlyOwner nonReentrant {
        Task storage task = tasks[_taskId];
        StudentStake storage stake = studentStakes[_taskId][_student];

        require(stake.isActive, "No active stake");
        require(!stake.isCompleted, "Already completed");

        stake.isCompleted = true;
        stake.hasReceivedReward = true;
        stake.isActive = false;

        uint256 totalReturn = stake.amount + task.rewardAmount;

        // Transfer tokens back to student with reward
        require(eduToken.transfer(_student, totalReturn), "Transfer failed");

        studentTotalStaked[_student] -= stake.amount;
        task.successfulCompletions += 1;

        emit TaskCompleted(_taskId, _student, task.rewardAmount);
    }

    /**
     * @dev Mark task as failed by student (called by backend after verification)
     * Students lose their staked tokens
     */
    function failTask(bytes32 _taskId, address _student) external onlyOwner nonReentrant {
        StudentStake storage stake = studentStakes[_taskId][_student];

        require(stake.isActive, "No active stake");
        require(!stake.isCompleted, "Already processed");

        uint256 penalty = stake.amount;
        stake.isActive = false;
        studentTotalStaked[_student] -= stake.amount;

        // Penalty tokens go to the task pool (could be distributed to teacher or burned)
        // For now, they stay in the contract

        emit TaskFailed(_taskId, _student, penalty);
    }

    /**
     * @dev Teacher claims yield on their staked tokens for a successful task
     */
    function claimTeacherReward(bytes32 _taskId) external nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.teacher == msg.sender, "Not task owner");
        require(task.isActive, "Task not active");

        // Calculate yield based on success rate and time staked
        uint256 timeStaked = block.timestamp - task.createdAt;
        uint256 successRate = task.totalAttempts > 0
            ? (task.successfulCompletions * 100) / task.totalAttempts
            : 0;

        // Higher yield for better success rates
        uint256 yieldMultiplier = successRate > 70 ? 150 : successRate > 40 ? 100 : 50;
        uint256 reward = (task.teacherStake * task.yieldRate * yieldMultiplier * timeStaked)
            / (10000 * 365 days * 100);

        // Transfer reward to teacher
        require(eduToken.transfer(msg.sender, reward), "Transfer failed");

        teacherReputation[msg.sender] += successRate; // Increase reputation based on success rate

        emit TeacherRewardClaimed(_taskId, msg.sender, reward);
    }

    /**
     * @dev Teacher can cancel task and retrieve stake if no students have attempted it
     */
    function cancelTask(bytes32 _taskId) external nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.teacher == msg.sender, "Not task owner");
        require(task.isActive, "Task not active");
        require(task.totalAttempts == 0, "Cannot cancel task with attempts");

        task.isActive = false;
        teacherTotalStaked[msg.sender] -= task.teacherStake;

        // Refund teacher stake
        require(eduToken.transfer(msg.sender, task.teacherStake), "Transfer failed");

        emit TaskCancelled(_taskId, msg.sender);
    }

    /**
     * @dev Get task details
     */
    function getTask(bytes32 _taskId) external view returns (Task memory) {
        return tasks[_taskId];
    }

    /**
     * @dev Get student stake details
     */
    function getStudentStake(bytes32 _taskId, address _student) external view returns (StudentStake memory) {
        return studentStakes[_taskId][_student];
    }

    /**
     * @dev Calculate recommended stake for a teacher based on their reputation
     */
    function getRecommendedTeacherStake(address _teacher) external view returns (uint256) {
        uint256 reputation = teacherReputation[_teacher];
        // Higher reputation = can stake less for same rewards
        if (reputation > 100) return 50 ether;
        if (reputation > 50) return 75 ether;
        if (reputation > 20) return 100 ether;
        return 150 ether;
    }

    /**
     * @dev Emergency withdraw (only owner, for emergency situations)
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(owner(), _amount);
    }
}
