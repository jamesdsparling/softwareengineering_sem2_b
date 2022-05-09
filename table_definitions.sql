-- Delete tables (to make changes) --
drop table profile;
drop table parking_spaces;
drop table tickets;
drop table messages;

-- Table definitions --
create table profiles (
	profile_id SERIAL primary key,
	email varchar(100) not null unique,
	pass varchar(50) not null default 0,
	balance int not null default 0,
	registration_plate varchar(16)
    cardnum varchar(16)
    );

create table parking_spaces (
	space_id varchar(16) primary key,
	is_charge bool not null,
	region text
);

create table tickets (
	ticket_id SERIAL primary key,
	profile_id int not null references profile(profile_id),
	space_id int not null references parking_space(space_id),
	start_time timestamp not null,
	end_time timestamp not null,
	is_accepted bool not null default false,
	requested_time timestamp not null
);

create table messages (
    message_id SERAIL primary key,
	profile_id references profile(profile_id),
	time_sent timestamp,
	chat_message varchar(300) not null,
	from_admin bool not null,
);
