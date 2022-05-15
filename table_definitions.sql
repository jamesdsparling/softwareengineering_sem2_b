-- Delete tables (to make changes) --
drop table if exists profiles cascade;
drop table if exists parking_spaces cascade;
drop table if exists tickets cascade;
drop table if exists messages cascade;

-- Table definitions --
create table profiles (
	profile_id SERIAL primary key,
	email varchar(100) not null unique,
	pass varchar(50) not null default 0,
	balance int default 0 CHECK (balance >= 0),
	registration_plate varchar(16),
    card_num varchar(16),
	card_name varchar(32),
	card_cvv varchar(3)
);

create table parking_spaces (
	space_id int primary key,
	gps_x float not null,
	gps_y float not null,
	is_auto_accept bool not null,
	is_charge bool not null,
	region text,
    is_blocked bool not null default false
);

create table tickets (
	ticket_id SERIAL primary key,
	profile_id int not null references profiles(profile_id) ON DELETE CASCADE,
	space_id int not null references parking_spaces(space_id),
	requested_time timestamp not null,
    stay_hours int not null CHECK (stay_hours >= 0),
	is_accepted bool not null default false,
	end_time timestamp GENERATED ALWAYS AS (requested_time + interval '1h' * stay_hours) STORED,
	EXCLUDE USING gist (int4range(space_id, space_id, '[]') WITH =, tsrange(requested_time, end_time) WITH &&)
);

create table messages (
    message_id SERIAL primary key,
	profile_id int references profiles(profile_id) ON DELETE CASCADE,
	time_sent timestamp DEFAULT CURRENT_TIMESTAMP(0),
	chat_message varchar(300) not null,
	from_admin bool not null DEFAULT false
);
