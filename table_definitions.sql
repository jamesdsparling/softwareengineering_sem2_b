-- Delete tables (to make changes) --
drop table if exists profiles cascade;
drop table if exists parking_spaces cascade;
drop table if exists tickets cascade;
drop table if exists messages cascade;

-- Table definitions --
create table profiles (
	profile_id SERIAL primary key,
	email varchar(100) not null unique,
	pass varchar(50) not null,
	balance int default 0 CHECK (balance >= 0),
	registration_plate varchar(16),
    card_num varchar(16),
	card_name varchar(32),
	card_cvv varchar(3),
    password_key varchar(16),
	new_pass varchar(50)
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

create or replace function gps_status(user_id int, date_time timestamp, gps_x float, gps_y float) returns int as $$
begin
	drop table if exists temp_table;
	drop table if exists current_temp_table;
	drop table if exists joined_temp_table;

	create temp table temp_table as select * from tickets where profile_id = user_id and is_accepted = true;
	alter table temp_table ADD over_time timestamp;
	update temp_table set over_time = requested_time + stay_hours * interval '1' hour + interval '1' hour;
	
	create temp table current_temp_table as select * from temp_table where current_timestamp > requested_time and current_timestamp < over_time;
	
	create temp table joined_temp_table as 
	select current_temp_table.over_time, parking_spaces.gps_x, parking_spaces.gps_y 
	from current_temp_table join parking_spaces 
	on current_temp_table.space_id=parking_spaces.space_id;
	
	if pg_relation_size('joined_temp_table') = 0 then
		return 0;
	end if;
	
	if gps_x > (select joined_temp_table.gps_x from joined_temp_table limit 1) + 1 or 
	gps_x < (select joined_temp_table.gps_x from joined_temp_table limit 1) - 1 or
	gps_y > (select joined_temp_table.gps_Y from joined_temp_table limit 1) + 1 or
	gps_y < (select joined_temp_table.gps_y from joined_temp_table limit 1) - 1 then
		return 2;
	end if;
	
	if date_time > (select joined_temp_table.over_time from joined_temp_table limit 1) - interval '1' hour then
		return 3;
	end if;
	
	return 1;
end; $$
language plpgsql