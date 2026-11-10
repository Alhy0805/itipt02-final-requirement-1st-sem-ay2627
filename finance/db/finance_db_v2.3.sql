-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 10, 2026 at 05:57 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `finance_db`
--

DELIMITER $$
--
-- Functions
--
CREATE DEFINER=`root`@`localhost` FUNCTION `txn_signed_amount` (`t_type` VARCHAR(20), `t_amount` DECIMAL(12,2)) RETURNS DECIMAL(12,2) DETERMINISTIC BEGIN
  RETURN CASE
    WHEN t_type IN ('Income', 'Transfer In')   THEN  t_amount
    WHEN t_type IN ('Expense', 'Transfer Out') THEN -t_amount
    ELSE 0
  END;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `account_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `account_name` varchar(100) NOT NULL,
  `balance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`account_id`, `user_id`, `account_name`, `balance`, `created_at`) VALUES
(1, 1, 'Alex GCash', -250.00, '2026-10-29 11:48:09'),
(2, 2, 'Jamie Cash Wallet', 1500.00, '2026-10-29 11:48:09'),
(3, 3, 'Admin Wallet', 20100.00, '2026-10-30 02:26:46');

-- --------------------------------------------------------

--
-- Table structure for table `account_account_types`
--

CREATE TABLE `account_account_types` (
  `account_id` int(11) NOT NULL,
  `account_type_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `account_account_types`
--

INSERT INTO `account_account_types` (`account_id`, `account_type_id`) VALUES
(1, 3),
(2, 1),
(3, 1),
(3, 2);

-- --------------------------------------------------------

--
-- Table structure for table `account_types`
--

CREATE TABLE `account_types` (
  `account_type_id` int(11) NOT NULL,
  `type_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `account_types`
--

INSERT INTO `account_types` (`account_type_id`, `type_name`) VALUES
(2, 'Bank'),
(5, 'bdo'),
(1, 'Cash'),
(3, 'E-Wallet');

-- --------------------------------------------------------

--
-- Table structure for table `bills`
--

CREATE TABLE `bills` (
  `bill_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `account_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `bill_name` varchar(150) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('Pending','Paid','Overdue','Cancelled') NOT NULL DEFAULT 'Pending',
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

--
-- Dumping data for table `bills`
--

INSERT INTO `bills` (`bill_id`, `user_id`, `account_id`, `category_id`, `bill_name`, `amount`, `due_date`, `status`, `paid_at`, `created_at`) VALUES
(1, 1, 1, 2, 'Monthly Groceries', 1200.00, '2026-10-30', 'Pending', NULL, '2026-10-29 11:48:11'),
(2, 2, 2, 2, 'Food Expenses', 800.00, '2026-10-31', 'Pending', NULL, '2026-10-29 11:48:11'),
(3, 3, NULL, NULL, 'Electricity Bill', 1800.00, '2026-11-05', 'Pending', NULL, '2026-10-30 03:29:55'),
(4, 3, NULL, NULL, 'Internet Bill', 1500.00, '2026-11-10', 'Pending', NULL, '2026-10-30 03:29:55'),
(5, 3, NULL, NULL, 'Water Bill', 450.00, '2026-10-25', 'Paid', NULL, '2026-10-30 03:29:55'),
(6, 3, NULL, NULL, 'Mobile Subscription', 599.00, '2026-11-15', 'Pending', NULL, '2026-10-30 03:29:55'),
(7, 3, NULL, NULL, 'Streaming Subscription', 299.00, '2026-11-20', 'Pending', NULL, '2026-10-30 03:29:55');

-- --------------------------------------------------------

--
-- Table structure for table `budgets`
--

CREATE TABLE `budgets` (
  `budget_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `budget_name` varchar(100) NOT NULL,
  `budget_amount` decimal(12,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

--
-- Dumping data for table `budgets`
--

INSERT INTO `budgets` (`budget_id`, `user_id`, `category_id`, `budget_name`, `budget_amount`, `start_date`, `end_date`, `created_at`) VALUES
(1, 1, 2, 'October Food Budget', 3000.00, '2026-10-01', '2026-10-31', '2026-10-29 11:48:09'),
(2, 2, 2, 'October Food Budget', 2000.00, '2026-10-01', '2026-10-31', '2026-10-29 11:48:09'),
(4, 3, 6, 'Transportation Budget', 2000.00, '2026-10-01', '2026-11-30', '2026-10-30 03:29:55'),
(5, 3, 7, 'Entertainment Budget', 1500.00, '2026-10-01', '2026-11-30', '2026-10-30 03:29:55'),
(6, 3, 10, 'Utilities Budget', 3000.00, '2026-10-01', '2026-11-30', '2026-10-30 03:29:55'),
(7, 3, 7, 'luho', 1000.00, '2026-11-08', '2026-11-09', '2026-11-07 16:57:21');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `category_name` varchar(100) NOT NULL,
  `category_type` enum('Income','Expense') NOT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `color` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `user_id`, `category_name`, `category_type`, `icon`, `color`, `created_at`) VALUES
(1, NULL, 'Salary', 'Income', 'wallet', '#16A34A', '2026-10-29 11:48:09'),
(2, NULL, 'Food', 'Expense', 'utensils', '#F59E0B', '2026-10-29 11:48:09'),
(6, 3, 'Transportation', 'Expense', 'car', '#3498DB', '2026-10-30 03:29:55'),
(7, 3, 'Entertainment', 'Expense', 'gamepad', '#9B59B6', '2026-10-30 03:29:55'),
(9, 3, 'Freelance', 'Income', 'laptop', '#F1C40F', '2026-10-30 03:29:55'),
(10, 3, 'Utilities', 'Expense', 'bolt', '#E67E22', '2026-10-30 03:29:55'),
(11, 3, 'Healthcare', 'Expense', 'heart', '#E84393', '2026-10-30 03:29:55'),
(12, 3, 'Groceries', 'Expense', 'shopping-cart', '#27AE60', '2026-11-08 13:30:12');

-- --------------------------------------------------------

--
-- Table structure for table `goal_contributions`
--

CREATE TABLE `goal_contributions` (
  `contribution_id` int(11) NOT NULL,
  `goal_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `contribution_date` date NOT NULL,
  `notes` text DEFAULT NULL
) ;

--
-- Dumping data for table `goal_contributions`
--

INSERT INTO `goal_contributions` (`contribution_id`, `goal_id`, `amount`, `contribution_date`, `notes`) VALUES
(1, 1, 2000.00, '2026-10-25', 'First laptop savings'),
(2, 2, 1000.00, '2026-10-26', 'Emergency fund deposit'),
(3, 3, 1000.00, '2026-10-20', 'Monthly savings contribution'),
(4, 4, 2000.00, '2026-10-22', 'Laptop savings'),
(5, 5, 500.00, '2026-10-25', 'Travel savings'),
(6, 6, 1500.00, '2026-10-28', 'Phone savings');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `notification_type` enum('Budget Alert','Savings Update','Bill Reminder','System') NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `created_at`) VALUES
(1, 1, 'Budget Reminder', 'You have used part of your October food budget.', 'Budget Alert', 0, '2026-10-29 11:48:09'),
(2, 2, 'Savings Update', 'Your emergency fund savings have been updated.', 'Savings Update', 0, '2026-10-29 11:48:09'),
(3, 3, 'Upcoming Bill', 'Your electricity bill is due soon.', 'Bill Reminder', 0, '2026-10-30 03:29:56'),
(4, 3, 'Budget Alert', 'You have used a portion of your food budget.', 'Budget Alert', 0, '2026-10-30 03:29:56'),
(5, 3, 'Savings Update', 'Keep saving towards your emergency fund!', 'Savings Update', 0, '2026-10-30 03:29:56'),
(6, 3, 'System Update', 'Your finance dashboard is ready.', 'System', 1, '2026-10-30 03:29:56');

-- --------------------------------------------------------

--
-- Table structure for table `recurring_transactions`
--

CREATE TABLE `recurring_transactions` (
  `recurring_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `transaction_type` enum('Income','Expense') NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `frequency` enum('Daily','Weekly','Monthly','Yearly') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `next_due_date` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

--
-- Dumping data for table `recurring_transactions`
--

INSERT INTO `recurring_transactions` (`recurring_id`, `user_id`, `account_id`, `category_id`, `transaction_type`, `description`, `amount`, `frequency`, `start_date`, `end_date`, `next_due_date`, `is_active`, `created_at`) VALUES
(1, 1, 1, 1, 'Income', 'Monthly Salary', 15000.00, 'Monthly', '2026-10-01', NULL, '2026-11-01', 1, '2026-10-29 11:48:09'),
(2, 2, 2, 2, 'Expense', 'Weekly Food Allowance', 500.00, 'Weekly', '2026-10-01', NULL, '2026-11-02', 1, '2026-10-29 11:48:09'),
(3, 3, 3, NULL, 'Income', 'Monthly Salary', 15000.00, 'Monthly', '2026-10-01', NULL, '2026-11-01', 1, '2026-10-30 03:30:15'),
(4, 3, 3, NULL, 'Expense', 'Monthly Grocery Allowance', 3000.00, 'Monthly', '2026-10-01', NULL, '2026-11-01', 1, '2026-10-30 03:30:15'),
(5, 3, 3, 10, 'Expense', 'Monthly Internet Payment', 1500.00, 'Monthly', '2026-10-01', NULL, '2026-11-01', 1, '2026-10-30 03:30:15');

-- --------------------------------------------------------

--
-- Table structure for table `savings_goals`
--

CREATE TABLE `savings_goals` (
  `goal_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `goal_name` varchar(100) NOT NULL,
  `target_amount` decimal(12,2) NOT NULL,
  `target_date` date DEFAULT NULL,
  `status` enum('Active','Completed','Cancelled') NOT NULL DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

--
-- Dumping data for table `savings_goals`
--

INSERT INTO `savings_goals` (`goal_id`, `user_id`, `goal_name`, `target_amount`, `target_date`, `status`, `created_at`) VALUES
(1, 1, 'New Laptop', 40000.00, '2027-06-30', 'Active', '2026-10-29 11:48:09'),
(2, 2, 'Emergency Fund', 20000.00, '2027-12-31', 'Active', '2026-10-29 11:48:09'),
(3, 3, 'Emergency Fund', 20000.00, '2027-03-30', 'Active', '2026-10-30 03:29:55'),
(4, 3, 'New Laptop', 45000.00, '2027-06-30', 'Active', '2026-10-30 03:29:55'),
(5, 3, 'Travel Fund', 15000.00, '2027-12-30', 'Active', '2026-10-30 03:29:55'),
(6, 3, 'New Phone', 25000.00, '2027-05-30', 'Active', '2026-10-30 03:29:55');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `transaction_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `transaction_type` enum('Income','Expense','Transfer In','Transfer Out') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `description` varchar(255) NOT NULL,
  `transaction_date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`transaction_id`, `user_id`, `account_id`, `category_id`, `transaction_type`, `amount`, `description`, `transaction_date`, `notes`, `created_at`) VALUES
(1, 1, 1, 2, 'Expense', 250.00, 'Lunch', '2026-10-28', 'Lunch at school', '2026-10-29 11:48:09'),
(2, 2, 2, 9, 'Income', 1500.00, 'Salary', '2026-10-28', 'Part-time earnings', '2026-10-29 11:48:09'),
(4, 3, 3, 9, 'Income', 5000.00, 'Freelance Project', '2026-10-10', 'Website development project', '2026-10-30 03:30:45'),
(6, 3, 3, 6, 'Expense', 150.00, 'Transportation', '2026-10-16', 'Daily transportation', '2026-10-30 03:30:45'),
(7, 3, 3, 7, 'Expense', 500.00, 'Movie Tickets', '2026-10-18', 'Weekend entertainment', '2026-10-30 03:30:45'),
(8, 3, 3, 10, 'Expense', 1800.00, 'Electricity Payment', '2026-10-20', 'Monthly electricity bill', '2026-10-30 03:30:45'),
(9, 3, 3, 11, 'Expense', 750.00, 'Medicine', '2026-10-22', 'Healthcare expenses', '2026-10-30 03:30:45'),
(10, 3, 3, 12, 'Expense', 1200.00, 'Grocery Shopping', '2026-10-25', 'Weekly groceries', '2026-10-30 03:30:45'),
(14, 3, 3, 1, 'Income', 20000.00, 'project manager', '2026-11-09', 'trysample', '2026-11-08 16:26:14'),
(16, 3, 3, 7, 'Expense', 500.00, 'nag bar with friends', '2026-11-10', NULL, '2026-11-10 02:13:38');

--
-- Triggers `transactions`
--
DELIMITER $$
CREATE TRIGGER `trg_transactions_ad` AFTER DELETE ON `transactions` FOR EACH ROW BEGIN
  UPDATE accounts
  SET balance = balance - txn_signed_amount(OLD.transaction_type, OLD.amount)
  WHERE account_id = OLD.account_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_transactions_ai` AFTER INSERT ON `transactions` FOR EACH ROW BEGIN
  UPDATE accounts
  SET balance = balance + txn_signed_amount(NEW.transaction_type, NEW.amount)
  WHERE account_id = NEW.account_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_transactions_au` AFTER UPDATE ON `transactions` FOR EACH ROW BEGIN
  
  UPDATE accounts
  SET balance = balance - txn_signed_amount(OLD.transaction_type, OLD.amount)
  WHERE account_id = OLD.account_id;
 
  UPDATE accounts
  SET balance = balance + txn_signed_amount(NEW.transaction_type, NEW.amount)
  WHERE account_id = NEW.account_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `currency` char(3) NOT NULL DEFAULT 'PHP',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `role` enum('admin','user') DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `email`, `password_hash`, `profile_image`, `currency`, `created_at`, `updated_at`, `role`) VALUES
(1, 'Alex Santos', 'alex@example.com', 'DEMO_HASH_ALEX', NULL, 'PHP', '2026-10-29 11:48:09', '2026-10-29 11:48:09', 'user'),
(2, 'Jamie Reyes', 'jamie@example.com', 'DEMO_HASH_JAMIE', NULL, 'PHP', '2026-10-29 11:48:09', '2026-10-29 11:48:09', 'user'),
(3, 'Admin', 'admin@gmail.com', '$pbkdf2_sha256$600000$f4b1ec58ab500dcae9774dc13bc7beb0$e323cca211973d6874df1ef66ea7c298f66fdd5a09d3e6fe3863a68d71dcafa8', NULL, 'PHP', '2026-10-30 02:26:38', '2026-11-10 03:28:36', 'admin'),
(5, 'marianne', 'marianne30@gmail.com', '$pbkdf2_sha256$600000$f3a2d21f5d8a21e7c990aa39864fa18a$403e9dc0c4f251cb88ed66cd1983ecf91734af96090f301cd6b35a8966f8bdda', NULL, 'PHP', '2026-11-10 02:59:51', '2026-11-10 02:59:51', 'user');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`account_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `account_account_types`
--
ALTER TABLE `account_account_types`
  ADD PRIMARY KEY (`account_id`,`account_type_id`),
  ADD KEY `idx_aat_type` (`account_type_id`);

--
-- Indexes for table `account_types`
--
ALTER TABLE `account_types`
  ADD PRIMARY KEY (`account_type_id`),
  ADD UNIQUE KEY `uq_account_types_name` (`type_name`);

--
-- Indexes for table `bills`
--
ALTER TABLE `bills`
  ADD PRIMARY KEY (`bill_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `account_id` (`account_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `budgets`
--
ALTER TABLE `budgets`
  ADD PRIMARY KEY (`budget_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `budgets_ibfk_2` (`category_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `goal_contributions`
--
ALTER TABLE `goal_contributions`
  ADD PRIMARY KEY (`contribution_id`),
  ADD KEY `goal_id` (`goal_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `recurring_transactions`
--
ALTER TABLE `recurring_transactions`
  ADD PRIMARY KEY (`recurring_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `account_id` (`account_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `savings_goals`
--
ALTER TABLE `savings_goals`
  ADD PRIMARY KEY (`goal_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `account_id` (`account_id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_transactions_date` (`user_id`,`transaction_date`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `account_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `account_types`
--
ALTER TABLE `account_types`
  MODIFY `account_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `bills`
--
ALTER TABLE `bills`
  MODIFY `bill_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `budgets`
--
ALTER TABLE `budgets`
  MODIFY `budget_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `goal_contributions`
--
ALTER TABLE `goal_contributions`
  MODIFY `contribution_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `recurring_transactions`
--
ALTER TABLE `recurring_transactions`
  MODIFY `recurring_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `savings_goals`
--
ALTER TABLE `savings_goals`
  MODIFY `goal_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `accounts`
--
ALTER TABLE `accounts`
  ADD CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `account_account_types`
--
ALTER TABLE `account_account_types`
  ADD CONSTRAINT `fk_aat_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_aat_type` FOREIGN KEY (`account_type_id`) REFERENCES `account_types` (`account_type_id`);

--
-- Constraints for table `bills`
--
ALTER TABLE `bills`
  ADD CONSTRAINT `bills_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bills_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `bills_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL;

--
-- Constraints for table `budgets`
--
ALTER TABLE `budgets`
  ADD CONSTRAINT `budgets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `budgets_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `goal_contributions`
--
ALTER TABLE `goal_contributions`
  ADD CONSTRAINT `goal_contributions_ibfk_1` FOREIGN KEY (`goal_id`) REFERENCES `savings_goals` (`goal_id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `recurring_transactions`
--
ALTER TABLE `recurring_transactions`
  ADD CONSTRAINT `recurring_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recurring_transactions_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`),
  ADD CONSTRAINT `recurring_transactions_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL;

--
-- Constraints for table `savings_goals`
--
ALTER TABLE `savings_goals`
  ADD CONSTRAINT `savings_goals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`),
  ADD CONSTRAINT `transactions_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
