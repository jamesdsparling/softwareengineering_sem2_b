-- Clear tables to reset --
delete from profile;
delete from parking_space;
delete from ticket;

-- Test data set --
insert into profile values(0, 'ParkingAdmin@uea.ac.uk', 'Admin123', null, null);
insert into profile values(1, 'GaiusJuliusCaesar@rome.com', 'IdesOfMarch', 44, 'RO66 AFV');
insert into profile values(2, 'UlyssesSGrant@gettysburg.pa', 'potus18', 1885, null);
insert into profile values(3, 'RosaParks@montgomery.al', '1Dec1955', 2005, 'MG92 PWQ');
insert into profile values(4, 'Hypatia@alexandira.edu', 'Astrolabe', 415, null);

insert into parking_space values(0, 0.0, 0.0, true, 'Charging point');
insert into parking_space values(1, 1.0, 0.0, false, '');
insert into parking_space values(2, 1.0, 1.0, false, '');
insert into parking_space values(3, 2.0, 1.0, false, '');
insert into parking_space values(4, 2.0, 2.0, false, 'At entrance');

insert into ticket values(0, 1, 1, '2022-03-16 20:00:00', '2022-03-16 22:00:00', true, '2022-02-16 13:30:00');
insert into ticket values(1, 1, 1, '2022-03-16 15:00:00', '2022-03-16 16:00:00', false, '2022-02-16 13:35:00');
insert into ticket values(2, 2, 2, '2022-03-16 17:00:00', '2022-03-16 19:00:00', false, '2022-02-16 13:37:00');
insert into ticket values(3, 4, 3, '2022-03-16 09:30:00', '2022-03-16 17:30:00', false, '2022-02-16 13:40:00');
insert into ticket values(4, 4, 3, '2022-04-16 09:00:00', '2022-03-16 17:15:00', false, '2022-02-16 13:41:00');

insert into chat_log values(1, '2022-02-16 13:40:00', 'Can the parking space fit my chariot?', false);
insert into chat_log values(1, '2022-02-16 13:43:00', 'Yes, I am not sure about the horses though', true);
insert into chat_log values(1, '2022-02-16 13:45:00', 'Could I book another space for them?', false);
insert into chat_log values(1, '2022-02-16 13:46:00', 'Certainly!', true);
insert into chat_log values(2, '2022-02-16 13:55:00', 'Can I have my user e-mail changed?', false);
insert into chat_log values(3, '2022-02-16 13:59:00', 'Certainly, what would you like to change it to?', true);
insert into chat_log values(3, '2022-02-16 14:05:00', 'potus18@whitehouse.dc', false);

-- View tables --
select * from profile;
select * from parking_space;
select * from ticket;
select * from chat_log;