-- Delete tables (to make changes) --
drop table profile;
drop table parking_space;
drop table ticket;

-- Table definitions --
create table profile (
	profile_id varchar(16) primary key,
	email varchar(100) not null,
	pass varchar(50) not null,
	balance int,
	car varchar(16)
    cardnum varchar(16)
    
);

create table parking_space (
	space_id varchar(16) primary key,
	is_charge bool not null,
	region text
);

create table ticket (
	ticket_id int primary key,
	customer_id int not null references profile(profile_id),
	space_id int not null references parking_space(space_id),
	start_time timestamp not null,
	end_time timestamp not null,
	is_accepted bool not null,
	requested_time timestamp not null
);