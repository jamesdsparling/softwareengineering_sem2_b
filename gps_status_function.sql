--From a user ID, time, and X & Y coords, determin a users status, return by an int--
/*
	0 = No live ticket
	1 = Live ticket & the user is in the correct space
	2 = User has a ticket and is in the wrong space
	3 = User is still in their space after their ticket has expired (up to an hour)
*/

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

--Test the function--
select gps_status(cast(3 as int), cast(current_timestamp as timestamp), cast(1.0 as float), cast(1.0 as float));