USE `finance_db`;

DROP TRIGGER IF EXISTS `trg_transactions_ad`;
DROP TRIGGER IF EXISTS `trg_transactions_ai`;
DROP TRIGGER IF EXISTS `trg_transactions_au`;

DELIMITER $$

CREATE TRIGGER `trg_transactions_ad` AFTER DELETE ON `transactions` FOR EACH ROW
BEGIN
  UPDATE `accounts`
  SET `balance` = `balance` - CASE
    WHEN OLD.`transaction_type` IN ('Income', 'Transfer In') THEN OLD.`amount`
    WHEN OLD.`transaction_type` IN ('Expense', 'Transfer Out') THEN -OLD.`amount`
    ELSE 0
  END
  WHERE `account_id` = OLD.`account_id`;
END$$

CREATE TRIGGER `trg_transactions_ai` AFTER INSERT ON `transactions` FOR EACH ROW
BEGIN
  UPDATE `accounts`
  SET `balance` = `balance` + CASE
    WHEN NEW.`transaction_type` IN ('Income', 'Transfer In') THEN NEW.`amount`
    WHEN NEW.`transaction_type` IN ('Expense', 'Transfer Out') THEN -NEW.`amount`
    ELSE 0
  END
  WHERE `account_id` = NEW.`account_id`;
END$$

CREATE TRIGGER `trg_transactions_au` AFTER UPDATE ON `transactions` FOR EACH ROW
BEGIN
  UPDATE `accounts`
  SET `balance` = `balance` - CASE
    WHEN OLD.`transaction_type` IN ('Income', 'Transfer In') THEN OLD.`amount`
    WHEN OLD.`transaction_type` IN ('Expense', 'Transfer Out') THEN -OLD.`amount`
    ELSE 0
  END
  WHERE `account_id` = OLD.`account_id`;

  UPDATE `accounts`
  SET `balance` = `balance` + CASE
    WHEN NEW.`transaction_type` IN ('Income', 'Transfer In') THEN NEW.`amount`
    WHEN NEW.`transaction_type` IN ('Expense', 'Transfer Out') THEN -NEW.`amount`
    ELSE 0
  END
  WHERE `account_id` = NEW.`account_id`;
END$$

DELIMITER ;
