-- File: init/init.sql

CREATE TABLE users (
    id int auto_increment,
    username varchar(255) not null,
    primary key (id)
);

CREATE TABLE users_symbols (
    id int auto_increment,
    user_id int not null,
    symbol varchar(3) not null,
    primary key (id)
);

