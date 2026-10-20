CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tagline` text NOT NULL,
	`kind` text NOT NULL,
	`year` integer NOT NULL,
	`summary` text NOT NULL,
	`features` text NOT NULL,
	`stack` text NOT NULL,
	`ai` text,
	`art` text,
	`image` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
