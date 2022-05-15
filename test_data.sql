-- Clear tables to reset --
delete from profiles;
delete from parking_spaces;
delete from tickets;
delete from messages;

-- Test data set --
insert into profiles(email, pass, balance, registration_plate) values('ParkingAdmin@uea.ac.uk', 'Admin123', null, null);
insert into profiles(email, pass, balance, registration_plate) values('GaiusJuliusCaesar@rome.com', 'IdesOfMarch', 44, 'RO66 AFV');
insert into profiles(email, pass, balance, registration_plate) values('UlyssesSGrant@gettysburg.pa', 'potus18', 1885, null);
insert into profiles(email, pass, balance, registration_plate) values('RosaParks@montgomery.al', '1Dec1955', 2005, 'MG92 PWQ');
insert into profiles(email, pass, balance, registration_plate) values('Hypatia@alexandira.edu', 'Astrolabe', 415, null);

insert into parking_spaces values(0, 0.0, 0.0, false, true, 'Charging point');
insert into parking_spaces values(1, 1.0, 0.0, false, false, '');
insert into parking_spaces values(2, 1.0, 1.0, false, false, '');
insert into parking_spaces values(3, 2.0, 1.0, false, false, '');
insert into parking_spaces values(4, 2.0, 2.0, false, false, 'At entrance');

insert into tickets(profile_id, space_id, requested_time, stay_hours, is_accepted) values(1, 2, '2022-05-16 13:00:00', 3, true);
insert into tickets(profile_id, space_id, requested_time, stay_hours, is_accepted) values(1, 4, '2022-05-16 14:00:00', 24, false);
insert into tickets(profile_id, space_id, requested_time, stay_hours, is_accepted) values(2, 2, '2022-05-16 17:00:00', 1, false);
insert into tickets(profile_id, space_id, requested_time, stay_hours, is_accepted) values(4, 3, '2022-05-16 09:30:00', 8, false);
insert into tickets(profile_id, space_id, requested_time, stay_hours, is_accepted) values(4, 3, '2022-05-17 09:30:00', 8, false);

insert into messages(profile_id, time_sent, chat_message, from_admin) values(2, '2022-05-16 13:40:00', 'Can the parking space fit my chariot?', false);
insert into messages(profile_id, time_sent, chat_message, from_admin) values(2, '2022-05-16 13:43:00', 'Yes, I am not sure about the horses though', true);
insert into messages(profile_id, time_sent, chat_message, from_admin) values(2, '2022-05-16 13:45:00', 'Could I book another space for them?', false);
insert into messages(profile_id, time_sent, chat_message, from_admin) values(2, '2022-05-16 13:46:00', 'Certainly!', true);
insert into messages(profile_id, time_sent, chat_message, from_admin) values(4, '2022-05-16 13:55:00', 'Can I have my user e-mail changed?', false);
insert into messages(profile_id, time_sent, chat_message, from_admin) values(4, '2022-05-16 13:59:00', 'Certainly, what would you like to change it to?', true);
insert into messages(profile_id, time_sent, chat_message, from_admin) values(4, '2022-05-16 14:05:00', 'potus18@whitehouse.dc', false);

-- View tables --
select * from profiles;
select * from parking_spaces;
select * from tickets;
select * from messages;
