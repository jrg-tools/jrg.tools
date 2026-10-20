ALTER TABLE `projects` ADD `steps` text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
UPDATE `projects` SET `steps` = '["soldered","firmware","printed"]' WHERE `kind` = 'hardware';
